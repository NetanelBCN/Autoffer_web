import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Calculator, BarChart3, Check, Star, Zap } from "lucide-react";

const SubscriptionAds = () => {
  const [animateBasic, setAnimateBasic] = useState(false);
  const [animatePro, setAnimatePro] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimateBasic(prev => !prev);
      setTimeout(() => {
        setAnimatePro(prev => !prev);
      }, 1000);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 mb-8">
      <h2 className="text-2xl font-bold text-gray-900 text-center">
        Choose Your R.N.D.Y Plan
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Basic Plan */}
        <Card className={`relative overflow-hidden transition-all duration-500 hover:shadow-xl ${
          animateBasic ? 'transform scale-105 shadow-lg' : ''
        }`}>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <FileText className="h-6 w-6 text-blue-600" />
              <CardTitle className="text-xl">Basic Plan</CardTitle>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              $60<span className="text-sm font-normal text-gray-500">/month</span>
            </div>
            <CardDescription>Perfect for small aluminum contractors</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">Manual Price Offer Creation</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">Basic Templates Library</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">Email Support</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">Up to 50 Projects/Month</span>
              </div>
            </div>
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              Start Basic Plan
            </Button>
            <p className="text-xs text-center text-gray-500">Cancel anytime</p>
          </CardContent>
        </Card>

        {/* Pro Plan */}
        <Card className={`relative overflow-hidden transition-all duration-500 hover:shadow-xl ${
          animatePro ? 'transform scale-105 shadow-lg' : ''
        } border-2 border-yellow-400`}>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-orange-500"></div>
          <div className="absolute top-4 right-4">
            <div className="bg-yellow-400 text-black px-2 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
              <Star className="h-3 w-3" />
              <span>POPULAR</span>
            </div>
          </div>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Zap className="h-6 w-6 text-yellow-600" />
              <CardTitle className="text-xl">Pro Plan</CardTitle>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              $650<span className="text-sm font-normal text-gray-500">/year</span>
            </div>
            <div className="text-sm text-green-600 font-medium">Save $170 annually!</div>
            <CardDescription>Complete solution for aluminum professionals</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Everything in Basic Plan</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calculator className="h-4 w-4 text-purple-600" />
                <span className="text-sm">BOQ Price Generation</span>
              </div>
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4 text-purple-600" />
                <span className="text-sm">Advanced Reports Creation</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">AI-Powered Analysis</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">Priority Support</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">Unlimited Projects</span>
              </div>
            </div>
            <Button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white">
              Start Pro Plan
            </Button>
            <p className="text-xs text-center text-gray-500">14-day free trial included</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SubscriptionAds;