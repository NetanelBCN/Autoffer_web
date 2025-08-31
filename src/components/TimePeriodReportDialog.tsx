import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Calendar, DollarSign, TrendingUp, Loader2, Download, CalendarRange } from "lucide-react";
import { UserModel, websocketService } from "@/services/websocketService";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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

interface TimePeriodReportDialogProps {
  open: boolean;
  onClose: () => void;
  userData: UserModel | null;
}

interface DateRange {
  startDate: string;
  endDate: string;
}

interface ProjectSummary {
  project: Project;
  baseValue: number;
  valueWithFactor: number;
  profit: number;
  profitMargin: number;
  status: string;
}

const TimePeriodReportDialog = ({ open, onClose, userData }: TimePeriodReportDialogProps) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<ProjectSummary[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: '',
    endDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && userData?.id) {
      loadAllProjects();
      // Set default date range to current month
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setDateRange({
        startDate: firstDay.toISOString().split('T')[0],
        endDate: lastDay.toISOString().split('T')[0]
      });
    } else {
      setShowReport(false);
      setFilteredProjects([]);
    }
  }, [open, userData?.id]);

  const loadAllProjects = async () => {
    if (!userData?.id) return;

    setLoading(true);
    try {
      const userType = userData.profileType?.toUpperCase() === 'FACTORY' ? 'FACTORY' : 'CLIENT';
      const response = await websocketService.getProjectsForUser(userData.id, userType);
      
      if (Array.isArray(response)) {
        // For factories, show all projects they've responded to (not just accepted)
        // For clients, show all their projects
        const filteredProjects = userType === 'FACTORY' ? 
          response.filter(project => 
            project.quoteStatuses[userData.id] && project.quoteStatuses[userData.id] !== 'PENDING'
          ) : response;
        setProjects(filteredProjects);
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

  const parseProjectDate = (dateString: string): Date => {
    try {
      // Format: "dd-MM-yyyy HH:mm:ss"
      const [datePart] = dateString.split(' ');
      const [day, month, year] = datePart.split('-');
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    } catch {
      return new Date(dateString);
    }
  };

  const calculateProjectValue = (items: ProjectItem[]) => {
    return items.reduce((total, item) => {
      const profileArea = (item.height * item.width) / 10000;
      const profileCost = profileArea * (item.profile.pricePerSquareMeter || 0) * item.quantity;
      
      const glassHeight = item.glass.height || item.height;
      const glassWidth = item.glass.width || item.width;
      const glassQuantity = item.glass.quantity || item.quantity;
      const glassArea = (glassHeight * glassWidth) / 10000;
      const glassCost = glassArea * (item.glass.pricePerSquareMeter || 0) * glassQuantity;
      
      return total + profileCost + glassCost;
    }, 0);
  };

  const generateReport = () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      alert('Please select both start and end dates');
      return;
    }

    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);
    endDate.setHours(23, 59, 59, 999); // Include the entire end date

    const projectsInRange = projects.filter(project => {
      const projectDate = parseProjectDate(project.createdAt);
      return projectDate >= startDate && projectDate <= endDate;
    });

    const projectSummaries: ProjectSummary[] = projectsInRange.map(project => {
      const baseValue = calculateProjectValue(project.items);
      const factorValue = userData?.factor || 1.0;
      const valueWithFactor = baseValue * factorValue;
      const profit = valueWithFactor - baseValue;
      const profitMargin = baseValue > 0 ? ((profit / valueWithFactor) * 100) : 0;
      const status = project.quoteStatuses[userData?.id || ''] || 'UNKNOWN';

      return {
        project,
        baseValue,
        valueWithFactor,
        profit,
        profitMargin,
        status
      };
    });

    setFilteredProjects(projectSummaries);
    setShowReport(true);
  };

  const calculateTotals = () => {
    return filteredProjects.reduce((totals, summary) => ({
      totalBaseValue: totals.totalBaseValue + summary.baseValue,
      totalValueWithFactor: totals.totalValueWithFactor + summary.valueWithFactor,
      totalProfit: totals.totalProfit + summary.profit,
      acceptedProjects: totals.acceptedProjects + (summary.status === 'ACCEPTED' ? 1 : 0),
      rejectedProjects: totals.rejectedProjects + (summary.status === 'REJECTED' ? 1 : 0),
      pendingProjects: totals.pendingProjects + (summary.status === 'PENDING' ? 1 : 0)
    }), {
      totalBaseValue: 0,
      totalValueWithFactor: 0,
      totalProfit: 0,
      acceptedProjects: 0,
      rejectedProjects: 0,
      pendingProjects: 0
    });
  };

  const formatCurrency = (amount: number) => {
    if (isNaN(amount) || amount === undefined || amount === null) {
      return '$0.00';
    }
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    try {
      const [datePart] = dateString.split(' ');
      const [day, month, year] = datePart.split('-');
      return `${day}/${month}/${year}`;
    } catch {
      return dateString;
    }
  };

  const getStatusBadgeProps = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { variant: 'outline' as const, className: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'ACCEPTED':
        return { variant: 'outline' as const, className: 'bg-green-50 text-green-700 border-green-200' };
      case 'REJECTED':
        return { variant: 'destructive' as const, className: 'bg-red-50 text-red-700 border-red-200' };
      default:
        return { variant: 'outline' as const, className: 'bg-gray-50 text-gray-700 border-gray-200' };
    }
  };

  const downloadPDF = async () => {
    if (!reportRef.current || filteredProjects.length === 0) {
      console.error('Missing report element or no projects to export');
      return;
    }

    setIsGeneratingPDF(true);
    
    try {
      const totals = calculateTotals();
      
      // Create iframe for clean PDF generation
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.style.top = '0';
      iframe.style.width = '800px';
      iframe.style.height = '1000px';
      document.body.appendChild(iframe);
      
      const iframeDoc = iframe.contentDocument!;
      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; font-family: system-ui, -apple-system, sans-serif; }
            body { background: white !important; color: black !important; padding: 20px; line-height: 1.4; }
            .header { border-bottom: 2px solid #e5e7eb; padding-bottom: 16px; margin-bottom: 24px; }
            .title { font-size: 24px; font-weight: bold; color: #111827; margin-bottom: 8px; }
            .subtitle { color: #4b5563; font-size: 14px; }
            .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 24px; background-color: #f9fafb; padding: 16px; border-radius: 8px; }
            .summary-item { text-align: center; }
            .summary-label { font-size: 12px; color: #4b5563; margin-bottom: 4px; }
            .summary-value { font-size: 18px; font-weight: bold; color: #111827; }
            .table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
            .table th, .table td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #e5e7eb; font-size: 12px; }
            .table th { background-color: #f9fafb; font-weight: 600; color: #374151; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">Time Period Profit Report</div>
            <div class="subtitle">
              Period: ${new Date(dateRange.startDate).toLocaleDateString()} - ${new Date(dateRange.endDate).toLocaleDateString()}<br>
              Generated: ${new Date().toLocaleDateString()} | Factor: ${userData?.factor?.toFixed(2) || '1.00'}x | Total Projects: ${filteredProjects.length}
            </div>
          </div>
          
          <div class="summary-grid">
            <div class="summary-item">
              <div class="summary-label">Total Base Value</div>
              <div class="summary-value">${formatCurrency(totals.totalBaseValue)}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Total with Factor</div>
              <div class="summary-value" style="color: #2563eb;">${formatCurrency(totals.totalValueWithFactor)}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Total Profit</div>
              <div class="summary-value" style="color: #16a34a;">${formatCurrency(totals.totalProfit)}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Accepted</div>
              <div class="summary-value" style="color: #16a34a;">${totals.acceptedProjects}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Rejected</div>
              <div class="summary-value" style="color: #dc2626;">${totals.rejectedProjects}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Pending</div>
              <div class="summary-value" style="color: #2563eb;">${totals.pendingProjects}</div>
            </div>
          </div>
          
          <table class="table">
            <thead>
              <tr>
                <th>Project ID</th>
                <th>Address</th>
                <th>Date</th>
                <th>Status</th>
                <th>Items</th>
                <th style="text-align: right;">Base Value</th>
                <th style="text-align: right;">With Factor</th>
                <th style="text-align: right;">Profit</th>
                <th style="text-align: right;">Margin %</th>
              </tr>
            </thead>
            <tbody>
              ${filteredProjects.map(summary => `
                <tr>
                  <td>#${summary.project.projectId.slice(-6)}</td>
                  <td>${summary.project.projectAddress.substring(0, 30)}${summary.project.projectAddress.length > 30 ? '...' : ''}</td>
                  <td>${formatDate(summary.project.createdAt)}</td>
                  <td>${summary.status}</td>
                  <td>${summary.project.items.length}</td>
                  <td style="text-align: right;">${formatCurrency(summary.baseValue)}</td>
                  <td style="text-align: right;">${formatCurrency(summary.valueWithFactor)}</td>
                  <td style="text-align: right;">${formatCurrency(summary.profit)}</td>
                  <td style="text-align: right;">${summary.profitMargin.toFixed(1)}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `);
      iframeDoc.close();
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = await html2canvas(iframeDoc.body, {
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        scale: 1.5,
        logging: false
      });
      
      document.body.removeChild(iframe);
      
      const imgData = canvas.toDataURL('image/png', 0.95);
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let yPosition = 10;
      let remainingHeight = imgHeight;
      const maxHeightPerPage = pdfHeight - 20;
      const heightToAdd = Math.min(remainingHeight, maxHeightPerPage);
      
      pdf.addImage(imgData, 'PNG', 10, yPosition, imgWidth, heightToAdd, undefined, 'FAST');
      remainingHeight -= heightToAdd;
      
      let sourceY = heightToAdd;
      while (remainingHeight > 0) {
        pdf.addPage();
        const heightForThisPage = Math.min(remainingHeight, maxHeightPerPage);
        
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = canvas.width;
        tempCanvas.height = (heightForThisPage * canvas.width) / imgWidth;
        
        tempCtx?.drawImage(
          canvas,
          0, (sourceY * canvas.width) / imgWidth,
          canvas.width, tempCanvas.height,
          0, 0,
          tempCanvas.width, tempCanvas.height
        );
        
        const pageImgData = tempCanvas.toDataURL('image/png', 0.95);
        pdf.addImage(pageImgData, 'PNG', 10, 10, imgWidth, heightForThisPage, undefined, 'FAST');
        
        sourceY += heightForThisPage;
        remainingHeight -= heightForThisPage;
      }
      
      const filename = `time-period-report-${dateRange.startDate}-to-${dateRange.endDate}.pdf`;
      pdf.save(filename);
      
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
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto bg-white border border-gray-200 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CalendarRange className="h-5 w-5 text-blue-600" />
            <span>Time Period Profit Report</span>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading projects...</span>
          </div>
        ) : !showReport ? (
          <>
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Select Date Range</h3>
              <p className="text-gray-600 text-sm mb-4">Choose a date range to generate a profit report for all your projects in that period:</p>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>
              
              <Button onClick={generateReport} className="w-full" disabled={!dateRange.startDate || !dateRange.endDate}>
                <Calendar className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </div>
            
            <div className="text-center text-gray-500">
              <p>Total projects available: {projects.length}</p>
            </div>
          </>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => setShowReport(false)} className="mb-4">
                ← Back to Date Selection
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
              </div>
            </div>

            <div ref={reportRef} className="bg-white p-4 text-sm">
              {(() => {
                const totals = calculateTotals();
                const overallProfitMargin = totals.totalValueWithFactor > 0 ? 
                  ((totals.totalProfit / totals.totalValueWithFactor) * 100) : 0;
                
                return (
                  <>
                    {/* Header */}
                    <div className="border-b pb-3 mb-4">
                      <h3 className="text-xl font-bold text-gray-900">Time Period Profit Report</h3>
                      <p className="text-gray-600 text-sm">
                        Period: {new Date(dateRange.startDate).toLocaleDateString()} - {new Date(dateRange.endDate).toLocaleDateString()}
                      </p>
                      <p className="text-gray-600 text-sm">
                        Generated: {new Date().toLocaleDateString()} | 
                        Factor: {userData?.factor?.toFixed(2) || '1.00'}x | 
                        Total Projects: {filteredProjects.length}
                      </p>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                      <div className="bg-blue-50 p-3 rounded-lg text-center">
                        <p className="text-xs text-blue-600 mb-1">Total Base Value</p>
                        <p className="font-bold text-blue-900">{formatCurrency(totals.totalBaseValue)}</p>
                      </div>
                      <div className="bg-purple-50 p-3 rounded-lg text-center">
                        <p className="text-xs text-purple-600 mb-1">With Factor</p>
                        <p className="font-bold text-purple-900">{formatCurrency(totals.totalValueWithFactor)}</p>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg text-center">
                        <p className="text-xs text-green-600 mb-1">Total Profit</p>
                        <p className="font-bold text-green-900">{formatCurrency(totals.totalProfit)}</p>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg text-center">
                        <p className="text-xs text-green-600 mb-1">Accepted</p>
                        <p className="font-bold text-green-900">{totals.acceptedProjects}</p>
                      </div>
                      <div className="bg-red-50 p-3 rounded-lg text-center">
                        <p className="text-xs text-red-600 mb-1">Rejected</p>
                        <p className="font-bold text-red-900">{totals.rejectedProjects}</p>
                      </div>
                      <div className="bg-yellow-50 p-3 rounded-lg text-center">
                        <p className="text-xs text-yellow-600 mb-1">Pending</p>
                        <p className="font-bold text-yellow-900">{totals.pendingProjects}</p>
                      </div>
                    </div>

                    {/* Projects Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr className="border-b bg-gray-50">
                            <th className="text-left py-2 px-2">Project ID</th>
                            <th className="text-left py-2 px-2">Address</th>
                            <th className="text-left py-2 px-2">Date</th>
                            <th className="text-left py-2 px-2">Status</th>
                            <th className="text-center py-2 px-2">Items</th>
                            <th className="text-right py-2 px-2">Base Value</th>
                            <th className="text-right py-2 px-2">With Factor</th>
                            <th className="text-right py-2 px-2">Profit</th>
                            <th className="text-right py-2 px-2">Margin %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredProjects.map((summary, index) => {
                            const statusBadge = getStatusBadgeProps(summary.status);
                            return (
                              <tr key={index} className="border-b hover:bg-gray-50">
                                <td className="py-2 px-2 font-mono">#{summary.project.projectId.slice(-6)}</td>
                                <td className="py-2 px-2 max-w-xs truncate" title={summary.project.projectAddress}>
                                  {summary.project.projectAddress}
                                </td>
                                <td className="py-2 px-2">{formatDate(summary.project.createdAt)}</td>
                                <td className="py-2 px-2">
                                  <Badge variant={statusBadge.variant} className={`${statusBadge.className} text-xs px-1 py-0`}>
                                    {summary.status}
                                  </Badge>
                                </td>
                                <td className="text-center py-2 px-2">{summary.project.items.length}</td>
                                <td className="text-right py-2 px-2">{formatCurrency(summary.baseValue)}</td>
                                <td className="text-right py-2 px-2 font-medium text-blue-600">{formatCurrency(summary.valueWithFactor)}</td>
                                <td className="text-right py-2 px-2 font-medium text-green-600">{formatCurrency(summary.profit)}</td>
                                <td className="text-right py-2 px-2">{summary.profitMargin.toFixed(1)}%</td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 bg-gray-100 font-bold">
                            <td colSpan={5} className="py-2 px-2 text-right">Totals:</td>
                            <td className="text-right py-2 px-2">{formatCurrency(totals.totalBaseValue)}</td>
                            <td className="text-right py-2 px-2 text-blue-600">{formatCurrency(totals.totalValueWithFactor)}</td>
                            <td className="text-right py-2 px-2 text-green-600">{formatCurrency(totals.totalProfit)}</td>
                            <td className="text-right py-2 px-2">{overallProfitMargin.toFixed(1)}%</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {filteredProjects.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p>No projects found in the selected date range</p>
                      </div>
                    )}
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

export default TimePeriodReportDialog;