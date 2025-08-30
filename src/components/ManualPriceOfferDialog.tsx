import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Calculator, FileText, Search, Loader2, Download } from "lucide-react";
import { UserModel, websocketService } from "@/services/websocketService";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Types based on existing project structure
interface ProfileOption {
  profileNumber: string;
  description: string;
  pricePerSquareMeter: number;
  usageType: string;
  minHeight: number;
  maxHeight: number;
  minWidth: number;
  maxWidth: number;
  isExpensive: boolean;
  recommendedGlassType: string;
}

interface GlassOption {
  type: string;
  thickness: number;
  pricePerSquareMeter: number;
  isRecommended?: boolean;
}

interface ManualItem {
  id: string;
  profile: ProfileOption | null;
  glass: GlassOption | null;
  height: number;
  width: number;
  quantity: number;
  location: string;
}

interface ManualPriceOfferDialogProps {
  open: boolean;
  onClose: () => void;
  userData: UserModel | null;
}

const ManualPriceOfferDialog = ({ open, onClose, userData }: ManualPriceOfferDialogProps) => {
  const [items, setItems] = useState<ManualItem[]>([]);
  const [currentItem, setCurrentItem] = useState<Partial<ManualItem>>({
    height: 0,
    width: 0,
    quantity: 1,
    location: ""
  });
  const [availableProfiles, setAvailableProfiles] = useState<ProfileOption[]>([]);
  const [availableGlass, setAvailableGlass] = useState<GlassOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchingProfiles, setSearchingProfiles] = useState(false);
  const [clientAddress, setClientAddress] = useState("");
  const [offerTitle, setOfferTitle] = useState("");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Generate unique ID for items
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Real data will be fetched from the database

  const mockGlassOptions: GlassOption[] = [
    { type: "Clear", thickness: 6, pricePerSquareMeter: 80, isRecommended: true },
    { type: "Clear", thickness: 8, pricePerSquareMeter: 100 },
    { type: "Tinted", thickness: 6, pricePerSquareMeter: 90 },
    { type: "Tinted", thickness: 8, pricePerSquareMeter: 110 },
    { type: "Low-E", thickness: 6, pricePerSquareMeter: 120, isRecommended: true },
    { type: "Laminated", thickness: 8, pricePerSquareMeter: 150 },
  ];

  useEffect(() => {
    if (open) {
      // Load available glass options
      setAvailableGlass(mockGlassOptions);
      resetForm();
    }
  }, [open]);

  const resetForm = () => {
    setItems([]);
    setCurrentItem({
      height: 0,
      width: 0,
      quantity: 1,
      location: ""
    });
    setAvailableProfiles([]);
    setClientAddress("");
    setOfferTitle("");
  };

  const searchProfiles = async () => {
    if (!currentItem.height || !currentItem.width) return;
    
    setSearchingProfiles(true);
    try {
      console.log('🔧 Searching for aluminum profiles with dimensions:', {
        height: currentItem.height,
        width: currentItem.width
      });
      
      // Call the real API to get aluminum profiles from database
      const profiles = await websocketService.getAluminumProfiles(currentItem.height, currentItem.width);
      
      console.log('🔧 API Response - profiles array:', profiles);
      console.log('🔧 API Response - profiles length:', profiles ? profiles.length : 'null/undefined');
      console.log('🔧 API Response - profiles type:', typeof profiles);
      
      if (profiles && profiles.length > 0) {
        console.log('🔧 Found', profiles.length, 'suitable profiles:', profiles);
        setAvailableProfiles(profiles);
      } else {
        console.log('🔧 No suitable profiles found - Server returned:', profiles);
        setAvailableProfiles([]);
        alert(`No aluminum profiles returned from server. 
               Server response: ${profiles ? `empty array (length: ${profiles.length})` : 'null/undefined'}
               
               This means either:
               1. The backend route 'profiles.matchBySize' doesn't exist yet
               2. The route exists but returns no data
               3. There's a server error
               
               Check the browser console for more details.`);
      }
      
    } catch (error) {
      console.error('🔧 Error searching profiles:', error);
      setAvailableProfiles([]);
      alert('Error searching for profiles. The server may not have the aluminum profiles endpoint ready yet. Please contact the development team.');
    } finally {
      setSearchingProfiles(false);
    }
  };

  const addItem = () => {
    if (!currentItem.profile || !currentItem.glass || !currentItem.height || !currentItem.width) {
      alert('Please fill in all required fields');
      return;
    }

    const newItem: ManualItem = {
      id: generateId(),
      profile: currentItem.profile,
      glass: currentItem.glass,
      height: currentItem.height,
      width: currentItem.width,
      quantity: currentItem.quantity || 1,
      location: currentItem.location || ""
    };

    setItems([...items, newItem]);
    setCurrentItem({
      height: 0,
      width: 0,
      quantity: 1,
      location: ""
    });
    setAvailableProfiles([]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const calculateItemCost = (item: ManualItem) => {
    const area = (item.height * item.width) / 10000; // Convert cm² to m²
    const profileCost = area * item.profile!.pricePerSquareMeter * item.quantity;
    const glassCost = area * item.glass!.pricePerSquareMeter * item.quantity;
    return profileCost + glassCost;
  };

  const calculateTotalCost = () => {
    return items.reduce((total, item) => total + calculateItemCost(item), 0);
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleGenerateOffer = async () => {
    if (items.length === 0) {
      alert('Please add at least one item to generate an offer');
      return;
    }

    if (!clientAddress.trim() || !offerTitle.trim()) {
      alert('Please fill in the offer title and client address');
      return;
    }

    setLoading(true);
    try {
      // Here you would send the data to the server
      console.log('Generating offer:', {
        title: offerTitle,
        clientAddress,
        items,
        totalCost: calculateTotalCost(),
        createdBy: userData?.id
      });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      alert('Price offer generated successfully!');
      onClose();
    } catch (error) {
      console.error('Error generating offer:', error);
      alert('Failed to generate offer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadOfferPDF = async () => {
    if (items.length === 0) {
      alert('Please add at least one item before generating PDF');
      return;
    }

    if (!clientAddress.trim() || !offerTitle.trim()) {
      alert('Please fill in the offer title and client address before generating PDF');
      return;
    }

    setIsGeneratingPDF(true);
    console.log('Starting manual offer PDF generation...');
    
    try {
      // Wait a bit for any pending renders
      await new Promise(resolve => setTimeout(resolve, 100));
      
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
              font-size: 28px;
              font-weight: bold;
              color: #111827;
              margin-bottom: 8px;
            }
            .subtitle {
              color: #4b5563;
              font-size: 16px;
              margin-bottom: 12px;
            }
            .info-section {
              background-color: #f9fafb;
              padding: 16px;
              border-radius: 8px;
              margin-bottom: 24px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
            }
            .info-label {
              font-weight: 600;
              color: #374151;
            }
            .info-value {
              color: #111827;
            }
            .table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 24px;
            }
            .table th,
            .table td {
              padding: 12px;
              text-align: left;
              border-bottom: 1px solid #e5e7eb;
              font-size: 12px;
            }
            .table th {
              background-color: #f9fafb;
              font-weight: 600;
              color: #374151;
            }
            .table .item-details {
              font-size: 11px;
              color: #4b5563;
              line-height: 1.4;
            }
            .total-section {
              background-color: #ecfdf5;
              border: 1px solid #bbf7d0;
              padding: 20px;
              border-radius: 8px;
              text-align: center;
            }
            .total-label {
              font-size: 16px;
              color: #15803d;
              margin-bottom: 8px;
            }
            .total-value {
              font-size: 32px;
              font-weight: bold;
              color: #166534;
            }
            .footer {
              margin-top: 32px;
              padding-top: 16px;
              border-top: 1px solid #e5e7eb;
              text-align: center;
              color: #6b7280;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">Price Offer</div>
            <div class="subtitle">${offerTitle}</div>
            <div style="color: #6b7280; font-size: 14px;">
              Generated on: ${new Date().toLocaleDateString()}
            </div>
          </div>
          
          <div class="info-section">
            <div class="info-row">
              <span class="info-label">Client Address:</span>
              <span class="info-value">${clientAddress}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Created By:</span>
              <span class="info-value">${userData?.firstName} ${userData?.lastName} (${userData?.email})</span>
            </div>
            <div class="info-row">
              <span class="info-label">Total Items:</span>
              <span class="info-value">${items.length}</span>
            </div>
          </div>
          
          <div id="content"></div>
        </body>
        </html>
      `);
      iframeDoc.close();
      
      const contentDiv = iframeDoc.getElementById('content')!;
      
      // Items table
      let tableHTML = `
        <table class="table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Profile</th>
              <th>Glass</th>
              <th>Dimensions</th>
              <th>Qty</th>
              <th style="text-align: right;">Cost</th>
            </tr>
          </thead>
          <tbody>
      `;
      
      items.forEach((item, index) => {
        const itemCost = calculateItemCost(item);
        const area = (item.height * item.width) / 10000;
        
        tableHTML += `
          <tr>
            <td>${index + 1}</td>
            <td>
              <strong>${item.profile!.profileNumber}</strong><br>
              <span class="item-details">${item.profile!.usageType}<br>${formatCurrency(item.profile!.pricePerSquareMeter)}/m²</span>
            </td>
            <td>
              <strong>${item.glass!.type}</strong><br>
              <span class="item-details">${formatCurrency(item.glass!.pricePerSquareMeter)}/m²</span>
            </td>
            <td>
              <strong>${item.width}×${item.height}cm</strong><br>
              <span class="item-details">Area: ${area.toFixed(2)} m²<br>${item.location || 'No location'}</span>
            </td>
            <td style="text-align: center;">${item.quantity}</td>
            <td style="text-align: right; font-weight: 600;">${formatCurrency(itemCost)}</td>
          </tr>
        `;
      });
      
      const totalCost = calculateTotalCost();
      
      tableHTML += `
          </tbody>
        </table>
        
        <div class="total-section">
          <div class="total-label">Total Project Cost</div>
          <div class="total-value">${formatCurrency(totalCost)}</div>
        </div>
        
        <div class="footer">
          <div>This offer is valid for 30 days from the date of generation.</div>
          <div style="margin-top: 8px;">Generated with AutoOffer Web System</div>
        </div>
      `;
      
      contentDiv.innerHTML = tableHTML;
      
      console.log('Capturing manual offer PDF content...');
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
      
      const cleanTitle = offerTitle.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
      const filename = `manual-offer-${cleanTitle}-${new Date().toISOString().slice(0,10)}.pdf`;
      
      console.log('Saving manual offer PDF as:', filename);
      pdf.save(filename);
      
      console.log('Manual offer PDF generation completed successfully');
    } catch (error) {
      console.error('Error generating manual offer PDF:', error);
      alert(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-gray-900">
            <FileText className="h-5 w-5 text-blue-600" />
            <span>Manual Price Offer Creation</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Offer Details */}
          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900">Offer Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="offerTitle" className="text-gray-700 mb-2 block">Offer Title</Label>
                  <Input
                    id="offerTitle"
                    placeholder="Enter offer title"
                    value={offerTitle}
                    onChange={(e) => setOfferTitle(e.target.value)}
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>
                <div>
                  <Label htmlFor="clientAddress" className="text-gray-700 mb-2 block">Client Address</Label>
                  <Input
                    id="clientAddress"
                    placeholder="Enter client address"
                    value={clientAddress}
                    onChange={(e) => setClientAddress(e.target.value)}
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Add New Item */}
          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900">Add New Item</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Dimensions */}
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="height" className="text-gray-700 mb-2 block">Height (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    placeholder="Height"
                    value={currentItem.height || ''}
                    onChange={(e) => setCurrentItem({...currentItem, height: Number(e.target.value)})}
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>
                <div>
                  <Label htmlFor="width" className="text-gray-700 mb-2 block">Width (cm)</Label>
                  <Input
                    id="width"
                    type="number"
                    placeholder="Width"
                    value={currentItem.width || ''}
                    onChange={(e) => setCurrentItem({...currentItem, width: Number(e.target.value)})}
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>
                <div>
                  <Label htmlFor="quantity" className="text-gray-700 mb-2 block">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    placeholder="1"
                    min="1"
                    value={currentItem.quantity || ''}
                    onChange={(e) => setCurrentItem({...currentItem, quantity: Number(e.target.value)})}
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={searchProfiles} 
                    disabled={!currentItem.height || !currentItem.width || searchingProfiles}
                    className="w-full"
                  >
                    {searchingProfiles ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        Find Profiles
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="location" className="text-gray-700 mb-2 block">Location (Optional)</Label>
                <Input
                  id="location"
                  placeholder="e.g., Living room, Kitchen"
                  value={currentItem.location || ''}
                  onChange={(e) => setCurrentItem({...currentItem, location: e.target.value})}
                  className="bg-white border-gray-300 text-gray-900"
                />
              </div>

              {/* Profile Selection */}
              {availableProfiles.length > 0 && (
                <div>
                  <Label className="text-gray-700 mb-2 block">Select Profile</Label>
                  <Select onValueChange={(value) => {
                    const profile = availableProfiles.find(p => p.profileNumber === value);
                    setCurrentItem({...currentItem, profile});
                  }}>
                    <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                      <SelectValue placeholder="Choose a profile" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg">
                      {availableProfiles.map((profile) => (
                        <SelectItem 
                          key={profile.profileNumber} 
                          value={profile.profileNumber}
                          className="text-gray-900 hover:bg-gray-100"
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{profile.profileNumber} - {profile.usageType}</span>
                            <span className="text-sm text-gray-600">{profile.description} ({formatCurrency(profile.pricePerSquareMeter)}/m²)</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Glass Selection */}
              <div>
                <Label className="text-gray-700 mb-2 block">Select Glass Type</Label>
                <Select onValueChange={(value) => {
                  const glass = availableGlass.find(g => `${g.type}-${g.thickness}` === value);
                  setCurrentItem({...currentItem, glass});
                }}>
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                    <SelectValue placeholder="Choose glass type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg">
                    {availableGlass.map((glass) => (
                      <SelectItem 
                        key={`${glass.type}-${glass.thickness}`} 
                        value={`${glass.type}-${glass.thickness}`}
                        className="text-gray-900 hover:bg-gray-100"
                      >
                        <div className="flex items-center justify-between w-full">
                          <span>{glass.type} {glass.thickness}mm ({formatCurrency(glass.pricePerSquareMeter)}/m²)</span>
                          {glass.isRecommended && <Badge variant="secondary" className="ml-2">Recommended</Badge>}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={addItem} 
                disabled={!currentItem.profile || !currentItem.glass}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item to Offer
              </Button>
            </CardContent>
          </Card>

          {/* Items List */}
          {items.length > 0 && (
            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between text-gray-900">
                  <span>Offer Items ({items.length})</span>
                  <div className="flex items-center space-x-2">
                    <Calculator className="h-4 w-4 text-green-600" />
                    <span className="text-lg font-bold text-green-600">
                      Total: {formatCurrency(calculateTotalCost())}
                    </span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <Badge variant="outline">Item {index + 1}</Badge>
                            {item.location && <Badge variant="secondary">{item.location}</Badge>}
                          </div>
                          <p className="text-sm text-gray-600">
                            <strong className="text-gray-800">Profile:</strong> {item.profile!.profileNumber} - {item.profile!.usageType}
                          </p>
                          <p className="text-xs text-gray-500">
                            {item.profile!.description}
                          </p>
                          <p className="text-sm text-gray-600">
                            <strong className="text-gray-800">Glass:</strong> {item.glass!.type} {item.glass!.thickness}mm
                          </p>
                          <p className="text-sm text-gray-600">
                            <strong className="text-gray-800">Dimensions:</strong> {item.width} × {item.height}cm | <strong className="text-gray-800">Quantity:</strong> {item.quantity}
                          </p>
                        </div>
                        <div className="text-right flex items-center space-x-2">
                          <div>
                            <p className="font-semibold text-gray-900">{formatCurrency(calculateItemCost(item))}</p>
                            <p className="text-xs text-gray-500">Total Cost</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeItem(item.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            
            <div className="flex space-x-3">
              <Button 
                onClick={downloadOfferPDF} 
                disabled={items.length === 0 || isGeneratingPDF || !clientAddress.trim() || !offerTitle.trim()}
                variant="outline"
                className="border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                {isGeneratingPDF ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Save as PDF
                  </>
                )}
              </Button>
              
              <Button 
                onClick={handleGenerateOffer} 
                disabled={items.length === 0 || loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating Offer...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Price Offer
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManualPriceOfferDialog;