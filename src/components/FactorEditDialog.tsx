import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Percent, Loader2, AlertCircle } from "lucide-react";
import { UserModel, websocketService } from "@/services/websocketService";

interface FactorEditDialogProps {
  open: boolean;
  onClose: () => void;
  userData: UserModel | null;
  onFactorUpdated: (updatedUser: UserModel) => void;
}

const FactorEditDialog = ({ open, onClose, userData, onFactorUpdated }: FactorEditDialogProps) => {
  const [factor, setFactor] = useState(userData?.factor?.toString() || "1.0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFactorChange = (value: string) => {
    // Allow only numbers and decimal point
    const numericValue = value.replace(/[^0-9.]/g, '');
    setFactor(numericValue);
    setError(null);
  };

  const validateFactor = (factorValue: string): { isValid: boolean; error?: string } => {
    const numericFactor = parseFloat(factorValue);
    
    if (isNaN(numericFactor)) {
      return { isValid: false, error: "Please enter a valid number" };
    }
    
    if (numericFactor < 1.0) {
      return { isValid: false, error: "Factor must be at least 1.0" };
    }
    
    if (numericFactor >= 2.0) {
      return { isValid: false, error: "Factor must be less than 2.0" };
    }

    return { isValid: true };
  };

  const handleSave = async () => {
    if (!userData?.id) return;

    const validation = validateFactor(factor);
    if (!validation.isValid) {
      setError(validation.error || "Invalid factor value");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const numericFactor = parseFloat(factor);
      const updatedUser = await websocketService.updateUserFactor(userData.id, numericFactor);
      
      if (updatedUser) {
        onFactorUpdated(updatedUser);
        onClose();
      } else {
        setError("Failed to update factor. Please try again.");
      }
    } catch (err) {
      console.error('Failed to update factor:', err);
      setError("Failed to update factor. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const currentFactor = parseFloat(factor);
  const isValid = !isNaN(currentFactor) && currentFactor >= 1.0 && currentFactor < 2.0;
  const profitPercentage = isValid ? ((currentFactor - 1) * 100).toFixed(1) : "0.0";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Percent className="h-5 w-5 text-orange-600" />
            <span>Edit Factory Factor</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="factor" className="mb-2 block">Factory Factor (1.0 - 1.99)</Label>
              <Input
                id="factor"
                type="text"
                value={factor}
                onChange={(e) => handleFactorChange(e.target.value)}
                placeholder="e.g., 1.25"
                className={error ? "border-red-500" : ""}
              />
              <p className="text-sm text-gray-600 mt-1">
                This factor will be multiplied by your project costs to calculate profits
              </p>
            </div>

            {error && (
              <div className="flex items-center space-x-2 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            {isValid && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="text-center">
                    <Percent className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-blue-700 mb-1">Profit Margin</p>
                    <p className="text-2xl font-bold text-blue-800">{profitPercentage}%</p>
                    <p className="text-xs text-blue-600 mt-1">
                      Factor {currentFactor.toFixed(2)} = {profitPercentage}% profit margin
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={loading || !isValid}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                'Save Factor'
              )}
            </Button>
          </div>

          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
            <p className="font-medium mb-2">How the factor works:</p>
            <p>• Factor 1.0 = 0% profit (cost price)</p>
            <p>• Factor 1.25 = 25% profit margin</p>
            <p>• Factor 1.50 = 50% profit margin</p>
            <p>• Factor 1.99 = 99% profit margin</p>
            <p className="mt-2 text-blue-600">Final Price = Base Cost × Factor</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FactorEditDialog;