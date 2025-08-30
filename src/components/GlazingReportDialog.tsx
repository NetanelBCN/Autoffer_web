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
    usageType: string;
    pricePerSquareMeter: number;
  };
  glass: {
    type: string;
    pricePerSquareMeter: number;
    height: number;
    width: number;
    quantity: number;
    location: string;
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
      // Profile calculation using item dimensions
      const profileArea = (item.height * item.width) / 10000; // Convert cm² to m²
      const profileCost = profileArea * (item.profile.pricePerSquareMeter || 0) * item.quantity;
      
      // Glass calculation using glass dimensions if available, otherwise fall back to item dimensions
      const glassHeight = item.glass.height || item.height;
      const glassWidth = item.glass.width || item.width;
      const glassQuantity = item.glass.quantity || item.quantity;
      const glassArea = (glassHeight * glassWidth) / 10000; // Convert cm² to m²
      const glassCost = glassArea * (item.glass.pricePerSquareMeter || 0) * glassQuantity;
      
      return total + profileCost + glassCost;
    }, 0);
  };

  const calculateGlazingReport = (project: Project) => {
    const factorValue = userData?.factor || 1.0; // Factor is already the multiplier (e.g., 1.25), not percentage
    const factorPercentage = ((factorValue - 1) * 100); // Convert factor to percentage for display
    
    const glassItems = getGlassItems(project.items);
    
    // Calculate glass area and costs
    const glassAreaCalculations = glassItems.map(item => {
      // Use glass dimensions if available, otherwise fall back to item dimensions
      const glassHeight = item.glass.height || item.height;
      const glassWidth = item.glass.width || item.width;
      const glassQuantity = item.glass.quantity || item.quantity;
      
      const areaPerUnit = (glassHeight * glassWidth) / 10000; // Convert cm² to m²
      const totalArea = areaPerUnit * glassQuantity;
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
    if (!reportRef.current || !selectedProject) {
      console.error('Missing report element or selected project');
      return;
    }

    setIsGeneratingPDF(true);
    console.log('Starting glazing PDF generation...');
    
    try {
      // Wait a bit for any pending renders
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('Creating clean DOM structure for glazing PDF...');
      
      // Create a completely isolated iframe for rendering
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.style.top = '0';
      iframe.style.width = '800px';
      iframe.style.height = '1000px';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);
      
      const iframeDoc = iframe.contentDocument!;
      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
              font-family: system-ui, -apple-system, sans-serif;
            }
            body {
              background: white !important;
              color: black !important;
              padding: 20px;
              line-height: 1.4;
            }
            .header {
              background-color: #eff6ff;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 24px;
            }
            .title {
              font-size: 24px;
              font-weight: bold;
              color: #111827;
              margin-bottom: 8px;
            }
            .subtitle {
              color: #4b5563;
              font-size: 14px;
            }
            .glass-item {
              background-color: white;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 12px;
              margin-bottom: 8px;
              display: flex;
              justify-content: space-between;
            }
            .item-details {
              flex: 1;
            }
            .item-title {
              font-weight: 600;
              font-size: 14px;
              margin-bottom: 4px;
            }
            .item-specs {
              font-size: 12px;
              color: #4b5563;
              line-height: 1.4;
            }
            .item-costs {
              text-align: right;
            }
            .cost-main {
              font-size: 16px;
              font-weight: bold;
              color: #2563eb;
            }
            .cost-sub {
              font-size: 12px;
              color: #4b5563;
            }
            .cost-profit {
              font-size: 12px;
              color: #16a34a;
            }
            .summary-cards {
              display: flex;
              justify-content: space-between;
              gap: 16px;
              margin-bottom: 24px;
            }
            .summary-card {
              background-color: white;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 16px;
              text-align: center;
              flex: 1;
            }
            .summary-card.profit {
              background-color: #ecfdf5;
              border-color: #bbf7d0;
            }
            .summary-icon {
              margin-bottom: 8px;
            }
            .summary-label {
              font-size: 12px;
              color: #4b5563;
              margin-bottom: 4px;
            }
            .summary-value {
              font-size: 20px;
              font-weight: bold;
              color: #111827;
            }
            .summary-value.blue {
              color: #2563eb;
            }
            .summary-value.green {
              color: #166534;
            }
            .breakdown {
              background-color: #f9fafb;
              padding: 16px;
              border-radius: 8px;
              font-size: 11px;
              line-height: 1.6;
            }
            .breakdown h4 {
              font-size: 14px;
              margin-bottom: 12px;
              color: #111827;
            }
            .item-calc {
              border-bottom: 1px solid #e5e7eb;
              padding-bottom: 8px;
              margin-bottom: 8px;
            }
            .item-calc:last-child {
              border-bottom: none;
            }
            .totals {
              margin-top: 16px;
              padding-top: 12px;
              border-top: 2px solid #e5e7eb;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">Glazing Report - Project #${selectedProject.projectId.slice(-6)}</div>
            <div class="subtitle">
              Address: ${selectedProject.projectAddress}<br>
              Status: ACCEPTED | Generated on: ${new Date().toLocaleDateString()} | Factory Factor: ${userData?.factor?.toFixed(2) || '1.00'}x
            </div>
          </div>
          
          <div id="content"></div>
        </body>
        </html>
      `);
      iframeDoc.close();
      
      // Generate the glazing report content
      const report = calculateGlazingReport(selectedProject);
      const contentDiv = iframeDoc.getElementById('content')!;
      
      if (report.glassItems.length === 0) {
        contentDiv.innerHTML = `
          <div style="text-align: center; padding: 40px; color: #4b5563;">
            <h3 style="font-size: 18px; margin-bottom: 8px;">No Glass Items Found</h3>
            <p>This project doesn't contain any glass-related items to analyze.</p>
          </div>
        `;
      } else {
        // Glass items
        let contentHTML = '<h4 style="margin-bottom: 16px;">Glass Items Analysis</h4>';
        
        report.glassItems.forEach((item) => {
          contentHTML += `
            <div class="glass-item">
              <div class="item-details">
                <div class="item-title">Item #${item.itemNumber}</div>
                <div class="item-specs">
                  Glass: ${item.glass.type} (${(item.glass.width || item.width)}×${(item.glass.height || item.height)}cm)<br>
                  Area: ${item.areaPerUnit.toFixed(2)} m² × ${(item.glass.quantity || item.quantity)} units = ${item.totalArea.toFixed(2)} m²
                  ${item.glass.location ? '<br>Location: ' + item.glass.location : ''}
                </div>
              </div>
              <div class="item-costs">
                <div class="cost-main">${formatCurrency(item.glassCostWithFactor)}</div>
                <div class="cost-sub">Base: ${formatCurrency(item.glassCost)}</div>
                <div class="cost-profit">Profit: ${formatCurrency(item.profit)}</div>
              </div>
            </div>
          `;
        });
        
        // Summary cards
        contentHTML += `
          <div class="summary-cards">
            <div class="summary-card">
              <div class="summary-label">Total Glass Area</div>
              <div class="summary-value blue">${report.totalGlassArea.toFixed(2)} m²</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Base Glass Cost</div>
              <div class="summary-value">${formatCurrency(report.totalGlassCost)}</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Glass Cost with Factor (${report.factorPercentage.toFixed(1)}%)</div>
              <div class="summary-value blue">${formatCurrency(report.totalGlassCostWithFactor)}</div>
            </div>
            <div class="summary-card profit">
              <div class="summary-label">Total Glass Profit</div>
              <div class="summary-value green">${formatCurrency(report.totalGlassProfit)}</div>
              <div style="font-size: 12px; color: #16a34a; margin-top: 4px;">
                Profit Margin: ${report.profitMargin.toFixed(1)}%
              </div>
            </div>
          </div>
        `;
        
        // Detailed breakdown
        contentHTML += `
          <div class="breakdown">
            <h4>Detailed Glass Calculation Breakdown</h4>
        `;
        
        report.glassItems.forEach((item) => {
          const glassHeight = item.glass.height || item.height;
          const glassWidth = item.glass.width || item.width;
          const glassQuantity = item.glass.quantity || item.quantity;
          const factorValue = (report.factorPercentage / 100 + 1);
          
          contentHTML += `
            <div class="item-calc">
              <strong>Item #${item.itemNumber} Glass Calculations:</strong><br>
              • Glass Type: ${item.glass.type}<br>
              • Glass Area per Unit: ${glassWidth}cm × ${glassHeight}cm ÷ 10,000 = ${item.areaPerUnit.toFixed(4)} m²<br>
              • Total Glass Area: ${item.areaPerUnit.toFixed(4)} m² × ${glassQuantity} qty = ${item.totalArea.toFixed(4)} m²<br>
              • Base Glass Cost: ${item.totalArea.toFixed(4)} m² × $${item.glass.pricePerSquareMeter}/m² = ${formatCurrency(item.glassCost)}<br>
              • With Factor: ${formatCurrency(item.glassCost)} × ${factorValue.toFixed(2)} = ${formatCurrency(item.glassCostWithFactor)}<br>
              • Glass Profit: ${formatCurrency(item.glassCostWithFactor)} - ${formatCurrency(item.glassCost)} = ${formatCurrency(item.profit)}
              ${item.glass.location ? '<br>• Location: ' + item.glass.location : ''}
            </div>
          `;
        });
        
        contentHTML += `
            <div class="totals">
              <strong>Glazing Project Totals:</strong><br>
              • Total Glass Area: ${formatArea(report.totalGlassArea)} (sum of all glass areas)<br>
              • Total Base Glass Cost: ${formatCurrency(report.totalGlassCost)} (sum of all glass costs)<br>
              • Factory Factor: ${(report.factorPercentage / 100 + 1).toFixed(2)}x (${report.factorPercentage.toFixed(1)}% markup)<br>
              • Total with Factor: ${formatCurrency(report.totalGlassCost)} × ${(report.factorPercentage / 100 + 1).toFixed(2)} = ${formatCurrency(report.totalGlassCostWithFactor)}<br>
              • Total Glass Profit: ${formatCurrency(report.totalGlassCostWithFactor)} - ${formatCurrency(report.totalGlassCost)} = ${formatCurrency(report.totalGlassProfit)}<br>
              • Profit Margin: (${formatCurrency(report.totalGlassProfit)} ÷ ${formatCurrency(report.totalGlassCostWithFactor)}) × 100 = ${report.profitMargin.toFixed(1)}%<br>
              <br><em style="color: #2563eb;">Note: This report focuses only on glass-related items and calculations.</em>
            </div>
          </div>
        `;
        
        contentDiv.innerHTML = contentHTML;
      }
      
      console.log('Capturing clean glazing iframe content...');
      const canvas = await html2canvas(iframeDoc.body, {
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        scale: 1.5,
        logging: false
      });
      
      // Clean up iframe
      document.body.removeChild(iframe);
      
      console.log('Canvas created successfully, size:', canvas.width, 'x', canvas.height);
      
      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error('Canvas has invalid dimensions');
      }
      
      const imgData = canvas.toDataURL('image/png', 0.95);
      console.log('Image data created, length:', imgData.length);
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth - 20; // 10mm margin on each side
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      console.log('PDF dimensions:', pdfWidth, 'x', pdfHeight);
      console.log('Image will be scaled to:', imgWidth, 'x', imgHeight);
      
      let yPosition = 10; // Start 10mm from top
      let remainingHeight = imgHeight;
      
      // First page
      const maxHeightPerPage = pdfHeight - 20; // 10mm margin top and bottom
      const heightToAdd = Math.min(remainingHeight, maxHeightPerPage);
      
      pdf.addImage(
        imgData, 
        'PNG', 
        10, // 10mm left margin
        yPosition, 
        imgWidth, 
        heightToAdd,
        undefined,
        'FAST'
      );
      
      remainingHeight -= heightToAdd;
      
      // Add additional pages if needed
      let sourceY = heightToAdd;
      while (remainingHeight > 0) {
        pdf.addPage();
        const heightForThisPage = Math.min(remainingHeight, maxHeightPerPage);
        
        // Create a cropped version of the image for this page
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = canvas.width;
        tempCanvas.height = (heightForThisPage * canvas.width) / imgWidth;
        
        tempCtx?.drawImage(
          canvas,
          0, (sourceY * canvas.width) / imgWidth, // source x, y
          canvas.width, tempCanvas.height, // source width, height
          0, 0, // dest x, y
          tempCanvas.width, tempCanvas.height // dest width, height
        );
        
        const pageImgData = tempCanvas.toDataURL('image/png', 0.95);
        pdf.addImage(pageImgData, 'PNG', 10, 10, imgWidth, heightForThisPage, undefined, 'FAST');
        
        sourceY += heightForThisPage;
        remainingHeight -= heightForThisPage;
      }
      
      const projectId = selectedProject.projectId.slice(-6);
      const filename = `glazing-report-${projectId}-${new Date().toISOString().slice(0,10)}.pdf`;
      
      console.log('Saving PDF as:', filename);
      pdf.save(filename);
      
      console.log('Glazing PDF generation completed successfully');
    } catch (error) {
      console.error('Error generating glazing PDF:', error);
      alert(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
                                  Glass: {item.glass.type} ({(item.glass.width || item.width)}×{(item.glass.height || item.height)}cm)
                                </p>
                                <p className="text-xs text-gray-600">
                                  Area: {formatArea(item.areaPerUnit)} × {(item.glass.quantity || item.quantity)} units = {formatArea(item.totalArea)}
                                </p>
                                {item.glass.location && (
                                  <p className="text-xs text-gray-500">
                                    Location: {item.glass.location}
                                  </p>
                                )}
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

                      {/* Detailed Calculation Breakdown */}
                      <div className="mt-4">
                        <h4 className="font-semibold mb-3 text-sm">Detailed Glass Calculation Breakdown</h4>
                        <div className="bg-gray-50 p-3 rounded text-xs space-y-2">
                          {report.glassItems.map((item, index) => {
                            const glassHeight = item.glass.height || item.height;
                            const glassWidth = item.glass.width || item.width;
                            const glassQuantity = item.glass.quantity || item.quantity;
                            const glassArea = (glassHeight * glassWidth) / 10000;
                            const factorValue = (report.factorPercentage / 100 + 1);
                            
                            return (
                              <div key={index} className="border-b pb-2 mb-2 last:border-b-0">
                                <p className="font-medium">Item #{item.itemNumber} Glass Calculations:</p>
                                <p>• Glass Type: {item.glass.type}</p>
                                <p>• Glass Area per Unit: {glassWidth}cm × {glassHeight}cm ÷ 10,000 = {item.areaPerUnit.toFixed(4)} m²</p>
                                <p>• Total Glass Area: {item.areaPerUnit.toFixed(4)} m² × {glassQuantity} qty = {item.totalArea.toFixed(4)} m²</p>
                                <p>• Base Glass Cost: {item.totalArea.toFixed(4)} m² × ${item.glass.pricePerSquareMeter}/m² = {formatCurrency(item.glassCost)}</p>
                                <p>• With Factor: {formatCurrency(item.glassCost)} × {factorValue.toFixed(2)} = {formatCurrency(item.glassCostWithFactor)}</p>
                                <p>• Glass Profit: {formatCurrency(item.glassCostWithFactor)} - {formatCurrency(item.glassCost)} = {formatCurrency(item.profit)}</p>
                                {item.glass.location && <p>• Location: {item.glass.location}</p>}
                              </div>
                            );
                          })}
                          
                          <div className="mt-3 pt-2 border-t border-gray-300">
                            <p className="font-semibold">Glazing Project Totals:</p>
                            <p>• Total Glass Area: {formatArea(report.totalGlassArea)} (sum of all glass areas)</p>
                            <p>• Total Base Glass Cost: {formatCurrency(report.totalGlassCost)} (sum of all glass costs)</p>
                            <p>• Factory Factor: {(report.factorPercentage / 100 + 1).toFixed(2)}x ({report.factorPercentage.toFixed(1)}% markup)</p>
                            <p>• Total with Factor: {formatCurrency(report.totalGlassCost)} × {(report.factorPercentage / 100 + 1).toFixed(2)} = {formatCurrency(report.totalGlassCostWithFactor)}</p>
                            <p>• Total Glass Profit: {formatCurrency(report.totalGlassCostWithFactor)} - {formatCurrency(report.totalGlassCost)} = {formatCurrency(report.totalGlassProfit)}</p>
                            <p>• Profit Margin: ({formatCurrency(report.totalGlassProfit)} ÷ {formatCurrency(report.totalGlassCostWithFactor)}) × 100 = {report.profitMargin.toFixed(1)}%</p>
                            <p className="mt-2 text-blue-600"><strong>Note:</strong> This report focuses only on glass-related items and calculations.</p>
                          </div>
                        </div>
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