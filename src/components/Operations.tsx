import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Calculator, BarChart3, Percent, ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const Operations = () => {
  const [openReports, setOpenReports] = useState(false);

  const reportTypes = [
    { name: "Profit/Loss Report", description: "Financial performance analysis" },
    { name: "Glazing Report", description: "Glass installation and materials report" },
    { name: "Time Period Report", description: "Activity summary for specific periods" }
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Operations</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* New Price Offer Manual Creation */}
        <Card className="hover:shadow-lg transition-shadow h-48 flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <span>New Price Offer Manual Creation</span>
            </CardTitle>
            <CardDescription>
              Create custom price offers manually with detailed specifications
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex items-end">
            <Button className="w-full bg-black text-white hover:bg-gray-800">
              Create Manual Offer
            </Button>
          </CardContent>
        </Card>

        {/* New Price Offer Generation by Bill of Quantities */}
        <Card className="hover:shadow-lg transition-shadow h-48 flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calculator className="h-5 w-5 text-green-600" />
              <span>Price Offer by Bill of Quantities</span>
            </CardTitle>
            <CardDescription>
              Generate automated price offers based on architectural bill of quantities
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex items-end">
            <Button className="w-full bg-black text-white hover:bg-gray-800">
              Generate from BOQ
            </Button>
          </CardContent>
        </Card>

        {/* Reports Creation */}
        <Card className="hover:shadow-lg transition-shadow min-h-48 flex flex-col">
          <CardHeader className="flex-shrink-0">
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              <span>Reports Creation</span>
            </CardTitle>
            <CardDescription>
              Generate various types of business and operational reports
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-end">
            <Collapsible open={openReports} onOpenChange={setOpenReports}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between border-black text-black hover:bg-black hover:text-white">
                  Select Report Type
                  <ChevronDown className={`h-4 w-4 transition-transform ${openReports ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 space-y-2">
                {reportTypes.map((report, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    className="w-full justify-start text-left h-auto p-3 hover:bg-black hover:text-white"
                    onClick={() => console.log(`Creating ${report.name}`)}
                  >
                    <div>
                      <div className="font-medium">{report.name}</div>
                      <div className="text-sm text-gray-500">{report.description}</div>
                    </div>
                  </Button>
                ))}
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>

        {/* Change General Factor Percentage */}
        <Card className="hover:shadow-lg transition-shadow h-48 flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Percent className="h-5 w-5 text-orange-600" />
              <span>Change General Factor Percentage</span>
            </CardTitle>
            <CardDescription>
              Adjust the general factor percentage for pricing calculations
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex items-end">
            <Button className="w-full bg-black text-white hover:bg-gray-800">
              Modify Factor %
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Operations;