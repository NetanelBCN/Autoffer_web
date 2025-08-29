import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, Calculator, DollarSign, TrendingUp, Loader2, Download } from "lucide-react";
import { UserModel, websocketService } from "@/services/websocketService";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Real project data structure from server
interface ProjectItem {
  itemNumber: string;
  profile: {
    profileNumber: string;
    description: string;
    pricePerSquareMeter: number;
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
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

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
        // Show all projects that the factory has responded to (not just accepted)
        const respondedProjects = response.filter(project => 
          project.quoteStatuses[userData.id] && project.quoteStatuses[userData.id] !== 'PENDING'
        );
        setProjects(respondedProjects);
      } else {
        console.error('Invalid response format:', response);
        setProjects([]);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
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
      const profileArea = (item.height * item.width) / 10000; // Convert cm² to m²
      const glassArea = (item.height * item.width) / 10000; // Convert cm² to m²
      
      const profileCost = profileArea * (item.profile.pricePerSquareMeter || 0) * item.quantity;
      const glassCost = glassArea * (item.glass.pricePerSquareMeter || 0) * item.quantity;
      
      return total + profileCost + glassCost;
    }, 0);
  };

  const calculateItemCosts = (item: ProjectItem) => {
    const profileArea = (item.height * item.width) / 10000; // Convert cm² to m²
    const glassArea = (item.height * item.width) / 10000; // Convert cm² to m²
    
    const profileCost = profileArea * (item.profile.pricePerSquareMeter || 0) * item.quantity;
    const glassCost = glassArea * (item.glass.pricePerSquareMeter || 0) * item.quantity;
    
    return { profileCost, glassCost, total: profileCost + glassCost };
  };

  const calculateProfitReport = (project: Project) => {
    const factorValue = userData?.factor || 1.0; // Factor is already the multiplier (e.g., 1.25), not percentage
    const totalCost = calculateProjectValue(project.items);
    const totalWithFactor = totalCost * factorValue;
    const profit = totalWithFactor - totalCost;
    const profitMargin = totalCost > 0 ? ((profit / totalWithFactor) * 100) : 0;

    // Calculate detailed breakdown per item
    const itemBreakdown = project.items.map(item => {
      const itemCosts = calculateItemCosts(item);
      const itemWithFactor = itemCosts.total * factorValue;
      const itemProfit = itemWithFactor - itemCosts.total;
      
      return {
        ...item,
        ...itemCosts,
        totalWithFactor: itemWithFactor,
        profit: itemProfit
      };
    });

    return {
      totalCost,
      factorValue,
      factorPercentage: ((factorValue - 1) * 100), // Convert factor to percentage for display
      totalWithFactor,
      profit,
      profitMargin,
      itemBreakdown
    };
  };

  const formatCurrency = (amount: number) => {
    // Handle NaN and undefined values
    if (isNaN(amount) || amount === undefined || amount === null) {
      return '$0.00';
    }
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const downloadPDF = async () => {
    if (!reportRef.current || !selectedProject) return;

    setIsGeneratingPDF(true);
    try {
      // Create a style element to override CSS with compatible colors
      const styleElement = document.createElement('style');
      styleElement.textContent = `
        .pdf-export {
          background-color: #ffffff !important;
        }
        .pdf-export .bg-gray-50 {
          background-color: #f9fafb !important;
        }
        .pdf-export .bg-green-50 {
          background-color: #ecfdf5 !important;
        }
        .pdf-export .bg-green-100 {
          background-color: #dcfce7 !important;
        }
        .pdf-export .bg-red-100 {
          background-color: #fee2e2 !important;
        }
        .pdf-export .bg-yellow-100 {
          background-color: #fef3c7 !important;
        }
        .pdf-export .bg-blue-600 {
          background-color: #2563eb !important;
        }
        .pdf-export .text-gray-400 {
          color: #9ca3af !important;
        }
        .pdf-export .text-gray-500 {
          color: #6b7280 !important;
        }
        .pdf-export .text-gray-600 {
          color: #4b5563 !important;
        }
        .pdf-export .text-gray-700 {
          color: #374151 !important;
        }
        .pdf-export .text-gray-900 {
          color: #111827 !important;
        }
        .pdf-export .text-blue-600 {
          color: #2563eb !important;
        }
        .pdf-export .text-blue-900 {
          color: #1e3a8a !important;
        }
        .pdf-export .text-green-600 {
          color: #16a34a !important;
        }
        .pdf-export .text-green-700 {
          color: #15803d !important;
        }
        .pdf-export .text-green-800 {
          color: #166534 !important;
        }
        .pdf-export .text-red-800 {
          color: #991b1b !important;
        }
        .pdf-export .text-yellow-800 {
          color: #92400e !important;
        }
        .pdf-export .text-white {
          color: #ffffff !important;
        }
        .pdf-export .border-gray-200 {
          border-color: #e5e7eb !important;
        }
        .pdf-export .border-green-200 {
          border-color: #bbf7d0 !important;
        }
        .pdf-export .border-red-200 {
          border-color: #fecaca !important;
        }
        .pdf-export .border-yellow-200 {
          border-color: #fde68a !important;
        }
        .pdf-export .shadow-md,
        .pdf-export .shadow-2xl {
          box-shadow: none !important;
        }
      `;
      document.head.appendChild(styleElement);

      // Clone the element and add PDF export class
      const clone = reportRef.current.cloneNode(true) as HTMLElement;
      clone.classList.add('pdf-export');
      
      // Temporarily add clone to document for rendering
      clone.style.position = 'absolute';
      clone.style.left = '-9999px';
      clone.style.top = '0';
      document.body.appendChild(clone);

      const canvas = await html2canvas(clone, {
        height: clone.scrollHeight,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        scale: 2
      });
      
      // Clean up
      document.body.removeChild(clone);
      document.head.removeChild(styleElement);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // First page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const projectId = selectedProject.projectId.slice(-6);
      pdf.save(`profit-loss-report-${projectId}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
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
              <p className="text-gray-600 text-sm">Choose from all your projects to generate the profit/loss report:</p>
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
                          <Badge 
                            variant="outline" 
                            className={
                              project.quoteStatuses[userData?.id || ''] === 'ACCEPTED' 
                                ? 'bg-green-100 text-green-800 border-green-200'
                                : project.quoteStatuses[userData?.id || ''] === 'REJECTED'
                                ? 'bg-red-100 text-red-800 border-red-200'
                                : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                            }
                          >
                            {project.quoteStatuses[userData?.id || ''] || 'UNKNOWN'}
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
              <div className="flex items-center space-x-2">
                <Button 
                  onClick={downloadPDF} 
                  disabled={isGeneratingPDF}
                  className="mb-4 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isGeneratingPDF ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </>
                  )}
                </Button>
                <Badge variant="outline" className="mb-4">
                  Factory Factor: {userData?.factor?.toFixed(2) || '1.00'}x
                </Badge>
              </div>
            </div>

            <div ref={reportRef} className="bg-white p-4 text-sm">
              {/* Header */}
              <div className="border-b pb-2 mb-3">
                <h3 className="text-lg font-bold text-gray-900">Profit/Loss Report - Project #{selectedProject.projectId.slice(-6)}</h3>
                <p className="text-gray-600 text-xs">Address: {selectedProject.projectAddress}</p>
                <p className="text-gray-600 text-xs">
                  Status: <span className={`${
                    selectedProject.quoteStatuses[userData?.id || ''] === 'ACCEPTED' 
                      ? 'text-green-800 font-medium'
                      : selectedProject.quoteStatuses[userData?.id || ''] === 'REJECTED'
                      ? 'text-red-800 font-medium'
                      : 'text-yellow-800 font-medium'
                  }`}>
                    {selectedProject.quoteStatuses[userData?.id || ''] || 'UNKNOWN'}
                  </span> | Generated: {new Date().toLocaleDateString()} | Factor: {userData?.factor?.toFixed(2) || '1.00'}x
                </p>
              </div>

            {(() => {
              const report = calculateProfitReport(selectedProject);
              return (
                <>
                  {/* Items Table */}
                  <div className="mb-3">
                    <h4 className="font-semibold mb-2">Project Items</h4>
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-1">Item</th>
                          <th className="text-left py-1">Details</th>
                          <th className="text-right py-1">Base Cost</th>
                          <th className="text-right py-1">With Factor</th>
                          <th className="text-right py-1">Profit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.itemBreakdown.map((item, index) => (
                          <tr key={index} className="border-b">
                            <td className="py-1">#{item.itemNumber}</td>
                            <td className="py-1">
                              {item.profile.profileNumber} ({item.width}×{item.height}cm)<br/>
                              {item.glass.type} {item.glass.thickness}mm | Qty: {item.quantity}
                            </td>
                            <td className="text-right py-1">{formatCurrency(item.total)}</td>
                            <td className="text-right py-1 font-medium">{formatCurrency(item.totalWithFactor)}</td>
                            <td className="text-right py-1 text-green-600">{formatCurrency(item.profit)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary */}
                  <div className="border-t pt-2">
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <p className="text-xs text-gray-600">Total Base Cost</p>
                        <p className="font-bold">{formatCurrency(report.totalCost)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">With Factor {report.factorValue.toFixed(2)}</p>
                        <p className="font-bold text-blue-600">{formatCurrency(report.totalWithFactor)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Total Profit</p>
                        <p className="font-bold text-green-600">{formatCurrency(report.profit)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Profit Margin</p>
                        <p className="font-bold text-green-600">{report.profitMargin.toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>
                </>
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