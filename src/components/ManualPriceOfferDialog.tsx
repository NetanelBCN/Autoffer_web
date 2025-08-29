import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Calculator, FileText, Search, Loader2 } from "lucide-react";
import { UserModel, websocketService } from "@/services/websocketService";

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
               1. The backend route 'profiles.getByDimensions' doesn't exist yet
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
          <div className="flex justify-between">
            <Button variant="outline" onClick={onClose}>
              Cancel
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
      </DialogContent>
    </Dialog>
  );
};

export default ManualPriceOfferDialog;