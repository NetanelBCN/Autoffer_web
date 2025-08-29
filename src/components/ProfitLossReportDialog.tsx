import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, Calculator, DollarSign, TrendingUp, Loader2 } from "lucide-react";
import { UserModel, websocketService } from "@/services/websocketService";

// Real project data structure from server
interface ProjectItem {
  itemNumber: string;
  profile: {
    profileNumber: string;
    description: string;
    pricePerMeter: number;
  };
  glass: {
    type: string;
    thickness: number;
    pricePerSquareMeter: number;
  };
  height: number;
  width: number;
  quantity: number;
  location: string;
}

interface Project {
  projectId: string;
  clientId: string;
  projectAddress: string;
  items: ProjectItem[];
  factoryIds: string[];
  quoteStatuses: Record<string, string>;
  quotes: Record<string, any>;
  boqPdf?: number[];
  createdAt: string;
}

interface ProfitLossReportDialogProps {
  open: boolean;
  onClose: () => void;
  userData: UserModel | null;
}

const ProfitLossReportDialog = ({ open, onClose, userData }: ProfitLossReportDialogProps) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    if (open && userData?.id) {
      loadAcceptedProjects();
    } else {
      setSelectedProject(null);
      setShowReport(false);
    }
  }, [open, userData?.id]);

  const loadAcceptedProjects = async () => {
    if (!userData?.id) return;

    setLoading(true);
    try {
      const response = await websocketService.getProjectsForUser(userData.id, 'FACTORY');
      
      if (Array.isArray(response)) {
        // Filter only projects where current factory has ACCEPTED status
        const acceptedProjects = response.filter(project => 
          project.quoteStatuses[userData.id] === 'ACCEPTED'
        );
        setProjects(acceptedProjects);
      } else {
        console.error('Invalid response format:', response);
        setProjects([]);
      }
    } catch (error) {
      console.error('Failed to load accepted projects:', error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
    setShowReport(true);
  };

  const calculateProjectValue = (items: ProjectItem[]) => {
    return items.reduce((total, item) => {
      const profileCost = (item.height + item.width) * 2 * item.profile.pricePerMeter * item.quantity;
      const glassCost = (item.height * item.width) * item.glass.pricePerSquareMeter * item.quantity;
      return total + profileCost + glassCost;
    }, 0);
  };

  const calculateProfitReport = (project: Project) => {
    const factorPercentage = userData?.factor || 0;
    const factorValue = factorPercentage / 100;
    const totalCost = calculateProjectValue(project.items);
    const totalWithFactor = totalCost * (1 + factorValue);
    const profit = totalWithFactor - totalCost;
    const profitMargin = ((profit / totalWithFactor) * 100);

    return {
      totalCost,
      factorPercentage,
      totalWithFactor,
      profit,
      profitMargin
    };
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-white border border-gray-200 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-purple-600" />
            <span>Profit/Loss Report</span>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading projects...</span>
          </div>
        ) : !showReport ? (
          <>
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Select a Project</h3>
              <p className="text-gray-600 text-sm">Choose a project to generate the profit/loss report:</p>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {projects.map((project) => (
                <Card key={project.projectId} className="hover:shadow-md transition-shadow cursor-pointer" 
                      onClick={() => handleProjectSelect(project)}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">Project #{project.projectId.slice(-6)}</h4>
                        <p className="text-sm text-gray-600 mt-1">Address: {project.projectAddress}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            ACCEPTED
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {project.items.length} items
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900">
                          {formatCurrency(calculateProjectValue(project.items))}
                        </p>
                        <p className="text-sm text-gray-500">Total Value</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        ) : selectedProject && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => setShowReport(false)} className="mb-4">
                ← Back to Projects
              </Button>
              <Badge variant="outline" className="mb-4">
                Factory Factor: {userData?.factor?.toFixed(1) || '0.0'}%
              </Badge>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Project #{selectedProject.projectId.slice(-6)}</h3>
              <p className="text-gray-600">Address: {selectedProject.projectAddress}</p>
              <p className="text-gray-600">Status: <Badge variant="outline" className="bg-green-100 text-green-800">ACCEPTED</Badge></p>
            </div>

            {/* Detailed Items Breakdown */}
            <div>
              <h4 className="text-lg font-semibold mb-3 flex items-center">
                <Calculator className="h-4 w-4 mr-2" />
                Project Items Breakdown
              </h4>
              <div className="space-y-2">
                {selectedProject.items.map((item, index) => {
                  const profileCost = (item.height + item.width) * 2 * item.profile.pricePerMeter * item.quantity;
                  const glassCost = (item.height * item.width) * item.glass.pricePerSquareMeter * item.quantity;
                  const itemTotal = profileCost + glassCost;
                  
                  return (
                    <Card key={index}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-sm">Item #{item.itemNumber}</p>
                            <p className="text-xs text-gray-600">
                              Profile: {item.profile.profileNumber} ({item.width}×{item.height}cm)
                            </p>
                            <p className="text-xs text-gray-600">
                              Glass: {item.glass.type} {item.glass.thickness}mm | Qty: {item.quantity} | {item.location}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{formatCurrency(itemTotal)}</p>
                            <p className="text-xs text-gray-500">
                              Profile: {formatCurrency(profileCost)}
                            </p>
                            <p className="text-xs text-gray-500">
                              Glass: {formatCurrency(glassCost)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Profit Calculations */}
            <div>
              <h4 className="text-lg font-semibold mb-3 flex items-center">
                <TrendingUp className="h-4 w-4 mr-2" />
                Profit Analysis
              </h4>
              
              {(() => {
                const report = calculateProfitReport(selectedProject);
                return (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="p-4 text-center">
                          <DollarSign className="h-6 w-6 text-gray-600 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">Total Cost</p>
                          <p className="text-xl font-bold text-gray-900">{formatCurrency(report.totalCost)}</p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-4 text-center">
                          <Calculator className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">With Factory Factor ({report.factorPercentage}%)</p>
                          <p className="text-xl font-bold text-blue-900">{formatCurrency(report.totalWithFactor)}</p>
                        </CardContent>
                      </Card>
                    </div>

                    <Card className="border-green-200 bg-green-50">
                      <CardContent className="p-4">
                        <div className="text-center">
                          <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                          <p className="text-sm text-green-700 mb-1">Total Factory Profit</p>
                          <p className="text-3xl font-bold text-green-800">{formatCurrency(report.profit)}</p>
                          <p className="text-sm text-green-600 mt-1">
                            Profit Margin: {report.profitMargin.toFixed(1)}%
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="text-xs text-gray-500 mt-4">
                      <p><strong>Calculation:</strong></p>
                      <p>• Base Cost: {formatCurrency(report.totalCost)}</p>
                      <p>• Factory Factor: {report.factorPercentage}%</p>
                      <p>• Total with Factor: {formatCurrency(report.totalCost)} × (1 + {report.factorPercentage}%) = {formatCurrency(report.totalWithFactor)}</p>
                      <p>• Profit: {formatCurrency(report.totalWithFactor)} - {formatCurrency(report.totalCost)} = {formatCurrency(report.profit)}</p>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProfitLossReportDialog;