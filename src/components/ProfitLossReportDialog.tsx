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
      // Profile calculation using item dimensions
      const profileArea = (item.height * item.width) / 10000; // Convert to m²
      const profileCost = profileArea * (item.profile.pricePerSquareMeter || 0) * item.quantity;
      
      // Glass calculation using glass dimensions if available, otherwise fall back to item dimensions
      const glassHeight = item.glass.height || item.height;
      const glassWidth = item.glass.width || item.width;
      const glassQuantity = item.glass.quantity || item.quantity;
      const glassArea = (glassHeight * glassWidth) / 10000; // Convert to m²
      const glassCost = glassArea * (item.glass.pricePerSquareMeter || 0) * glassQuantity;
      
      return total + profileCost + glassCost;
    }, 0);
  };

  const calculateItemCosts = (item: ProjectItem) => {
    // Profile calculation using item dimensions
    const profileArea = (item.height * item.width) / 10000; // Convert to m²
    const profileCost = profileArea * (item.profile.pricePerSquareMeter || 0) * item.quantity;
    
    // Glass calculation using glass dimensions if available, otherwise fall back to item dimensions
    const glassHeight = item.glass.height || item.height;
    const glassWidth = item.glass.width || item.width;
    const glassQuantity = item.glass.quantity || item.quantity;
    const glassArea = (glassHeight * glassWidth) / 10000; // Convert to m²
    const glassCost = glassArea * (item.glass.pricePerSquareMeter || 0) * glassQuantity;
    
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
    if (!reportRef.current || !selectedProject) {
      console.error('Missing report element or selected project');
      return;
    }

    setIsGeneratingPDF(true);
    console.log('Starting PDF generation...');
    
    try {
      // Wait a bit for any pending renders
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('Creating clean DOM structure for PDF...');
      
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
              border-bottom: 2px solid #e5e7eb;
              padding-bottom: 16px;
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
            .table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 24px;
            }
            .table th,
            .table td {
              padding: 8px 12px;
              text-align: left;
              border-bottom: 1px solid #e5e7eb;
              font-size: 12px;
            }
            .table th {
              background-color: #f9fafb;
              font-weight: 600;
              color: #374151;
            }
            .summary {
              display: flex;
              justify-content: space-between;
              background-color: #f9fafb;
              padding: 16px;
              border-radius: 8px;
              margin-bottom: 24px;
            }
            .summary-item {
              text-align: center;
            }
            .summary-label {
              font-size: 12px;
              color: #4b5563;
              margin-bottom: 4px;
            }
            .summary-value {
              font-size: 18px;
              font-weight: bold;
              color: #111827;
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
            <div class="title">Profit/Loss Report - Project #${selectedProject.projectId.slice(-6)}</div>
            <div class="subtitle">
              Address: ${selectedProject.projectAddress}<br>
              Status: ${selectedProject.quoteStatuses[userData?.id || ''] || 'UNKNOWN'} | 
              Generated: ${new Date().toLocaleDateString()} | 
              Factor: ${userData?.factor?.toFixed(2) || '1.00'}x
            </div>
          </div>
          
          <div id="content"></div>
        </body>
        </html>
      `);
      iframeDoc.close();
      
      // Generate the report content
      const report = calculateProfitReport(selectedProject);
      const contentDiv = iframeDoc.getElementById('content')!;
      
      // Items table
      let tableHTML = `
        <table class="table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Details</th>
              <th style="text-align: right;">Base Cost</th>
              <th style="text-align: right;">With Factor</th>
              <th style="text-align: right;">Profit</th>
            </tr>
          </thead>
          <tbody>
      `;
      
      report.itemBreakdown.forEach((item) => {
        tableHTML += `
          <tr>
            <td>#${item.itemNumber}</td>
            <td>
              ${item.profile.profileNumber} (${item.width}×${item.height}cm)<br>
              ${item.glass.type} (${(item.glass.width || item.width)}×${(item.glass.height || item.height)}cm) | Qty: ${item.glass.quantity || item.quantity}
              ${item.glass.location ? '<br>Glass Location: ' + item.glass.location : ''}
            </td>
            <td style="text-align: right;">${formatCurrency(item.total)}</td>
            <td style="text-align: right;">${formatCurrency(item.totalWithFactor)}</td>
            <td style="text-align: right;">${formatCurrency(item.profit)}</td>
          </tr>
        `;
      });
      
      tableHTML += `
          </tbody>
        </table>
        
        <div class="summary">
          <div class="summary-item">
            <div class="summary-label">Total Base Cost</div>
            <div class="summary-value">${formatCurrency(report.totalCost)}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">With Factor ${report.factorValue.toFixed(2)}</div>
            <div class="summary-value" style="color: #2563eb;">${formatCurrency(report.totalWithFactor)}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Total Profit</div>
            <div class="summary-value" style="color: #16a34a;">${formatCurrency(report.profit)}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Profit Margin</div>
            <div class="summary-value" style="color: #16a34a;">${report.profitMargin.toFixed(1)}%</div>
          </div>
        </div>
        
        <div class="breakdown">
          <h4>Detailed Calculation Breakdown</h4>
      `;
      
      report.itemBreakdown.forEach((item, index) => {
        const profileArea = (item.height * item.width) / 10000;
        const glassHeight = item.glass.height || item.height;
        const glassWidth = item.glass.width || item.width;
        const glassQuantity = item.glass.quantity || item.quantity;
        const glassArea = (glassHeight * glassWidth) / 10000;
        
        tableHTML += `
          <div class="item-calc">
            <strong>Item #${item.itemNumber} Calculations:</strong><br>
            • Profile Area: ${item.width}cm × ${item.height}cm ÷ 10,000 = ${profileArea.toFixed(4)} m²<br>
            • Profile Cost: ${profileArea.toFixed(4)} m² × $${item.profile.pricePerSquareMeter} × ${item.quantity} qty = ${formatCurrency(item.profileCost)}<br>
            • Glass Area: ${glassWidth}cm × ${glassHeight}cm ÷ 10,000 = ${glassArea.toFixed(4)} m²<br>
            • Glass Cost: ${glassArea.toFixed(4)} m² × $${item.glass.pricePerSquareMeter} × ${glassQuantity} qty = ${formatCurrency(item.glassCost)}<br>
            • Item Total: ${formatCurrency(item.profileCost)} + ${formatCurrency(item.glassCost)} = ${formatCurrency(item.total)}<br>
            • With Factor: ${formatCurrency(item.total)} × ${report.factorValue.toFixed(2)} = ${formatCurrency(item.totalWithFactor)}<br>
            • Item Profit: ${formatCurrency(item.totalWithFactor)} - ${formatCurrency(item.total)} = ${formatCurrency(item.profit)}
          </div>
        `;
      });
      
      tableHTML += `
          <div class="totals">
            <strong>Project Totals:</strong><br>
            • Total Base Cost: Sum of all item totals = ${formatCurrency(report.totalCost)}<br>
            • Factory Factor: ${report.factorValue.toFixed(2)}x (${report.factorPercentage.toFixed(1)}% markup)<br>
            • Total with Factor: ${formatCurrency(report.totalCost)} × ${report.factorValue.toFixed(2)} = ${formatCurrency(report.totalWithFactor)}<br>
            • Total Profit: ${formatCurrency(report.totalWithFactor)} - ${formatCurrency(report.totalCost)} = ${formatCurrency(report.profit)}<br>
            • Profit Margin: (${formatCurrency(report.profit)} ÷ ${formatCurrency(report.totalWithFactor)}) × 100 = ${report.profitMargin.toFixed(1)}%
          </div>
        </div>
      `;
      
      contentDiv.innerHTML = tableHTML;
      
      console.log('Capturing clean iframe content...');
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
      const filename = `profit-loss-report-${projectId}-${new Date().toISOString().slice(0,10)}.pdf`;
      
      console.log('Saving PDF as:', filename);
      pdf.save(filename);
      
      console.log('PDF generation completed successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
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
                              {item.glass.type} ({(item.glass.width || item.width)}×{(item.glass.height || item.height)}cm) | Qty: {item.glass.quantity || item.quantity}
                              {item.glass.location && <><br/>Glass Location: {item.glass.location}</>}
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

                  {/* Detailed Calculation Breakdown */}
                  <div className="border-t mt-4 pt-3">
                    <h4 className="font-semibold mb-3 text-sm">Detailed Calculation Breakdown</h4>
                    <div className="bg-gray-50 p-3 rounded text-xs space-y-2">
                      {report.itemBreakdown.map((item, index) => {
                        const profileArea = (item.height * item.width) / 10000;
                        const glassHeight = item.glass.height || item.height;
                        const glassWidth = item.glass.width || item.width;
                        const glassQuantity = item.glass.quantity || item.quantity;
                        const glassArea = (glassHeight * glassWidth) / 10000;
                        
                        return (
                          <div key={index} className="border-b pb-2 mb-2 last:border-b-0">
                            <p className="font-medium">Item #{item.itemNumber} Calculations:</p>
                            <p>• Profile Area: {item.width}cm × {item.height}cm ÷ 10,000 = {profileArea.toFixed(4)} m²</p>
                            <p>• Profile Cost: {profileArea.toFixed(4)} m² × ${item.profile.pricePerSquareMeter} × {item.quantity} qty = {formatCurrency(item.profileCost)}</p>
                            <p>• Glass Area: {glassWidth}cm × {glassHeight}cm ÷ 10,000 = {glassArea.toFixed(4)} m²</p>
                            <p>• Glass Cost: {glassArea.toFixed(4)} m² × ${item.glass.pricePerSquareMeter} × {glassQuantity} qty = {formatCurrency(item.glassCost)}</p>
                            <p>• Item Total: {formatCurrency(item.profileCost)} + {formatCurrency(item.glassCost)} = {formatCurrency(item.total)}</p>
                            <p>• With Factor: {formatCurrency(item.total)} × {report.factorValue.toFixed(2)} = {formatCurrency(item.totalWithFactor)}</p>
                            <p>• Item Profit: {formatCurrency(item.totalWithFactor)} - {formatCurrency(item.total)} = {formatCurrency(item.profit)}</p>
                          </div>
                        );
                      })}
                      
                      <div className="mt-3 pt-2 border-t border-gray-300">
                        <p className="font-semibold">Project Totals:</p>
                        <p>• Total Base Cost: Sum of all item totals = {formatCurrency(report.totalCost)}</p>
                        <p>• Factory Factor: {report.factorValue.toFixed(2)}x ({report.factorPercentage.toFixed(1)}% markup)</p>
                        <p>• Total with Factor: {formatCurrency(report.totalCost)} × {report.factorValue.toFixed(2)} = {formatCurrency(report.totalWithFactor)}</p>
                        <p>• Total Profit: {formatCurrency(report.totalWithFactor)} - {formatCurrency(report.totalCost)} = {formatCurrency(report.profit)}</p>
                        <p>• Profit Margin: ({formatCurrency(report.profit)} ÷ {formatCurrency(report.totalWithFactor)}) × 100 = {report.profitMargin.toFixed(1)}%</p>
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