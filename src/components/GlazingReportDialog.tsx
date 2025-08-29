import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calculator, DollarSign, TrendingUp, Loader2, Eye, Download } from "lucide-react";
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

interface GlazingReportDialogProps {
  open: boolean;
  onClose: () => void;
  userData: UserModel | null;
}

const GlazingReportDialog = ({ open, onClose, userData }: GlazingReportDialogProps) => {
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

  // Filter only glass-related items
  const getGlassItems = (items: ProjectItem[]) => {
    return items.filter(item => 
      item.glass.type !== "N/A" && 
      item.glass.pricePerSquareMeter > 0 &&
      item.height > 0 && 
      item.width > 0
    );
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

  const calculateGlazingReport = (project: Project) => {
    const factorValue = userData?.factor || 1.0; // Factor is already the multiplier (e.g., 1.25), not percentage
    const factorPercentage = ((factorValue - 1) * 100); // Convert factor to percentage for display
    
    const glassItems = getGlassItems(project.items);
    
    // Calculate glass area and costs
    const glassAreaCalculations = glassItems.map(item => {
      const areaPerUnit = (item.height * item.width) / 10000; // Convert cm² to m²
      const totalArea = areaPerUnit * item.quantity;
      const glassCost = totalArea * item.glass.pricePerSquareMeter;
      const glassCostWithFactor = glassCost * factorValue;
      
      return {
        ...item,
        areaPerUnit,
        totalArea,
        glassCost,
        glassCostWithFactor,
        profit: glassCostWithFactor - glassCost
      };
    });

    const totalGlassCost = glassAreaCalculations.reduce((sum, item) => sum + item.glassCost, 0);
    const totalGlassCostWithFactor = glassAreaCalculations.reduce((sum, item) => sum + item.glassCostWithFactor, 0);
    const totalGlassProfit = totalGlassCostWithFactor - totalGlassCost;
    const totalGlassArea = glassAreaCalculations.reduce((sum, item) => sum + item.totalArea, 0);

    return {
      glassItems: glassAreaCalculations,
      totalGlassCost,
      totalGlassCostWithFactor,
      totalGlassProfit,
      totalGlassArea,
      factorPercentage,
      profitMargin: totalGlassCost > 0 ? (totalGlassProfit / totalGlassCostWithFactor) * 100 : 0
    };
  };

  const formatCurrency = (amount: number) => {
    // Handle NaN and undefined values
    if (isNaN(amount) || amount === undefined || amount === null) {
      return '$0.00';
    }
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatArea = (area: number) => {
    return `${area.toFixed(2)} m²`;
  };

  const downloadPDF = async () => {
    if (!reportRef.current || !selectedProject) return;

    setIsGeneratingPDF(true);
    try {
      // Clone the element and convert modern CSS colors to supported ones
      const clone = reportRef.current.cloneNode(true) as HTMLElement;
      
      // Replace modern CSS with compatible colors
      const replaceModernColors = (element: Element) => {
        const style = window.getComputedStyle(element);
        const newElement = element as HTMLElement;
        
        // Convert oklch and other modern colors to hex/rgb
        if (style.backgroundColor && style.backgroundColor.includes('oklch')) {
          newElement.style.backgroundColor = '#ffffff';
        }
        if (style.color && style.color.includes('oklch')) {
          newElement.style.color = '#000000';
        }
        if (style.borderColor && style.borderColor.includes('oklch')) {
          newElement.style.borderColor = '#e5e7eb';
        }
        
        // Process child elements
        Array.from(element.children).forEach(child => {
          replaceModernColors(child);
        });
      };
      
      replaceModernColors(clone);
      
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
        scale: 2,
        ignoreElements: (element) => {
          // Skip elements that might cause issues
          return element.classList?.contains('lucide') || false;
        }
      });
      
      // Remove clone
      document.body.removeChild(clone);

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
      pdf.save(`glazing-report-${projectId}.pdf`);
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
            <Eye className="h-5 w-5 text-blue-600" />
            <span>Glazing Report</span>
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
              <p className="text-gray-600 text-sm">Choose a project to generate the glazing report (glass-specific analysis):</p>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {projects.map((project) => {
                const glassItems = getGlassItems(project.items);
                return (
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
                              {glassItems.length} glass items
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
                );
              })}
              {projects.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Eye className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p>No accepted projects found</p>
                  <p className="text-sm mt-1">You need to have accepted projects to generate glazing reports</p>
                </div>
              )}
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

            <div ref={reportRef} className="bg-white p-6 rounded-lg">
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Glazing Report - Project #{selectedProject.projectId.slice(-6)}</h3>
                <p className="text-gray-600">Address: {selectedProject.projectAddress}</p>
                <p className="text-gray-600">Status: <Badge variant="outline" className="bg-green-100 text-green-800">ACCEPTED</Badge></p>
                <p className="text-gray-600 mt-2">
                  Generated on: {new Date().toLocaleDateString()} | Factory Factor: {userData?.factor?.toFixed(2) || '1.00'}x
                </p>
              </div>

            {(() => {
              const report = calculateGlazingReport(selectedProject);
              
              if (report.glassItems.length === 0) {
                return (
                  <div className="text-center py-8">
                    <Eye className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Glass Items Found</h3>
                    <p className="text-gray-600">This project doesn't contain any glass-related items to analyze.</p>
                  </div>
                );
              }

              return (
                <>
                  {/* Glass Items Breakdown */}
                  <div>
                    <h4 className="text-lg font-semibold mb-3 flex items-center">
                      <Eye className="h-4 w-4 mr-2" />
                      Glass Items Analysis
                    </h4>
                    <div className="space-y-2">
                      {report.glassItems.map((item, index) => (
                        <Card key={index}>
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-sm">Item #{item.itemNumber}</p>
                                <p className="text-xs text-gray-600">
                                  Glass: {item.glass.type} {item.glass.thickness}mm ({item.width}×{item.height}cm)
                                </p>
                                <p className="text-xs text-gray-600">
                                  Area: {formatArea(item.areaPerUnit)} × {item.quantity} units = {formatArea(item.totalArea)}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-blue-600">{formatCurrency(item.glassCostWithFactor)}</p>
                                <p className="text-xs text-gray-500">
                                  Base: {formatCurrency(item.glassCost)}
                                </p>
                                <p className="text-xs text-green-600">
                                  Profit: {formatCurrency(item.profit)}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Glazing Summary */}
                  <div>
                    <h4 className="text-lg font-semibold mb-3 flex items-center">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Glazing Analysis Summary
                    </h4>
                    
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <Card>
                          <CardContent className="p-4 text-center">
                            <Eye className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">Total Glass Area</p>
                            <p className="text-xl font-bold text-blue-900">{formatArea(report.totalGlassArea)}</p>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardContent className="p-4 text-center">
                            <DollarSign className="h-6 w-6 text-gray-600 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">Base Glass Cost</p>
                            <p className="text-xl font-bold text-gray-900">{formatCurrency(report.totalGlassCost)}</p>
                          </CardContent>
                        </Card>
                      </div>

                      <Card>
                        <CardContent className="p-4 text-center">
                          <Calculator className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">Glass Cost with Factor ({report.factorPercentage.toFixed(1)}%)</p>
                          <p className="text-xl font-bold text-blue-900">{formatCurrency(report.totalGlassCostWithFactor)}</p>
                        </CardContent>
                      </Card>

                      <Card className="border-green-200 bg-green-50">
                        <CardContent className="p-4">
                          <div className="text-center">
                            <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                            <p className="text-sm text-green-700 mb-1">Total Glass Profit</p>
                            <p className="text-3xl font-bold text-green-800">{formatCurrency(report.totalGlassProfit)}</p>
                            <p className="text-sm text-green-600 mt-1">
                              Profit Margin: {report.profitMargin.toFixed(1)}%
                            </p>
                          </div>
                        </CardContent>
                      </Card>

                      <div className="text-xs text-gray-500 mt-4">
                        <p><strong>Glazing Report Calculation:</strong></p>
                        <p>• Total Glass Area: {formatArea(report.totalGlassArea)}</p>
                        <p>• Base Glass Cost: {formatCurrency(report.totalGlassCost)}</p>
                        <p>• Factory Factor: {(report.factorPercentage / 100 + 1).toFixed(2)}x ({report.factorPercentage.toFixed(1)}%)</p>
                        <p>• Total with Factor: {formatCurrency(report.totalGlassCost)} × {(report.factorPercentage / 100 + 1).toFixed(2)} = {formatCurrency(report.totalGlassCostWithFactor)}</p>
                        <p>• Glass Profit: {formatCurrency(report.totalGlassCostWithFactor)} - {formatCurrency(report.totalGlassCost)} = {formatCurrency(report.totalGlassProfit)}</p>
                        <p className="mt-2 text-blue-600"><strong>Note:</strong> This report focuses only on glass-related items and calculations.</p>
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

export default GlazingReportDialog;