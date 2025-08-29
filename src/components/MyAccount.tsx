import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Building,
  Percent,
  Edit,
  Save,
  X
} from "lucide-react";
import { UserModel } from "@/services/websocketService";
import FactorEditDialog from "./FactorEditDialog";

interface MyAccountProps {
  userData: UserModel | null;
  onUserDataUpdated: (updatedUser: UserModel) => void;
}

const MyAccount = ({ userData, onUserDataUpdated }: MyAccountProps) => {
  const [factorDialogOpen, setFactorDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  if (!userData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Account Data</h3>
          <p className="text-gray-600">Please log in to view your account information.</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    try {
      const [datePart] = dateString.split(' ');
      const [day, month, year] = datePart.split('-');
      return `${day}/${month}/${year}`;
    } catch {
      return dateString;
    }
  };

  const getProfileTypeBadge = (profileType: string) => {
    const type = profileType.toUpperCase();
    switch (type) {
      case 'FACTORY':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Factory</Badge>;
      case 'CLIENT':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Client</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">{type}</Badge>;
    }
  };

  const getProfitPercentage = (factor: number) => {
    return ((factor - 1) * 100).toFixed(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">My Account</h1>
        <div className="flex items-center space-x-2">
          {getProfileTypeBadge(userData.profileType)}
          <Badge variant="secondary">
            ID: {userData.id.slice(-8)}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5 text-blue-600" />
              <span>Personal Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <User className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Full Name</p>
                  <p className="font-medium">{userData.firstName} {userData.lastName}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{userData.email}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Phone Number</p>
                  <p className="font-medium">{userData.phoneNumber || 'Not provided'}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <MapPin className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="font-medium">{userData.address || 'Not provided'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building className="h-5 w-5 text-green-600" />
              <span>Account Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Building className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Account Type</p>
                  <div className="flex items-center space-x-2">
                    {getProfileTypeBadge(userData.profileType)}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Member Since</p>
                  <p className="font-medium">{formatDate(userData.registeredAt)}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Active Chats</p>
                  <p className="font-medium">{userData.chats.length} conversations</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Factory-specific Settings */}
      {userData.profileType.toUpperCase() === 'FACTORY' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Percent className="h-5 w-5 text-orange-600" />
              <span>Factory Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">Profit Factor</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Multiplier applied to base costs for profit calculation
                  </p>
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-800">
                        {userData.factor?.toFixed(2) || '1.00'}
                      </p>
                      <p className="text-xs text-orange-600">Factor</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-800">
                        {getProfitPercentage(userData.factor || 1.0)}%
                      </p>
                      <p className="text-xs text-green-600">Profit Margin</p>
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={() => setFactorDialogOpen(true)}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Factor
                </Button>
              </div>

              <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2 text-gray-700">How the factor works:</h4>
                <div className="space-y-1">
                  <p>• Factor 1.00 = 0% profit (cost price only)</p>
                  <p>• Factor 1.25 = 25% profit margin</p>
                  <p>• Factor 1.50 = 50% profit margin</p>
                  <p>• Factor 1.99 = 99% profit margin (maximum)</p>
                </div>
                <p className="mt-3 text-blue-600 font-medium">
                  Final Quote Price = Base Material Cost × Your Factor
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile Photo Section (if available) */}
      {userData.photoBytes && userData.photoBytes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5 text-purple-600" />
              <span>Profile Photo</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-gray-400" />
              </div>
              <div>
                <p className="font-medium">Profile photo available</p>
                <p className="text-sm text-gray-600">Photo size: {userData.photoBytes.length} bytes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Factor Edit Dialog */}
      <FactorEditDialog 
        open={factorDialogOpen}
        onClose={() => setFactorDialogOpen(false)}
        userData={userData}
        onFactorUpdated={onUserDataUpdated}
      />
    </div>
  );
};

export default MyAccount;