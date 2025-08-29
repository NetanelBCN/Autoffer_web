import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  MapPin, 
  Calendar, 
  Package,
  Download,
  Loader2,
  Building,
} from "lucide-react";
import { UserModel, websocketService } from "@/services/websocketService";

interface ProjectItem {
  itemNumber: string;
  profile: {
    profileNumber: string;
    description: string;
    pricePerMeter: number;
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

interface MyProjectsProps {
  userData: UserModel | null;
}

const MyProjects = ({ userData }: MyProjectsProps) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userData?.id) {
      loadProjects();
    }
  }, [userData?.id]);

  const loadProjects = async () => {
    if (!userData?.id) return;

    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Requesting projects for user:', userData.id, 'type:', userData.profileType);
      console.log('🔍 Current user data:', userData);

      // Determine user type based on profile
      const userType = userData.profileType?.toUpperCase() === 'FACTORY' ? 'FACTORY' : 'CLIENT';
      console.log('🔍 Using user type:', userType);

      const response = await websocketService.getProjectsForUser(userData.id, userType);
      console.log('✅ Received projects response:', response);
      console.log('✅ Response type:', typeof response);
      console.log('✅ Is array:', Array.isArray(response));
      console.log('✅ Number of projects received:', response?.length || 0);

      if (Array.isArray(response)) {
        console.log('✅ Projects array received:', response);
        setProjects(response);
        setError(null);
      } else if (response === null || response === undefined) {
        console.log('🔍 No projects returned from server');
        setProjects([]);
        setError(null);
      } else {
        console.error('❌ Invalid response format:', response);
        setError(`Invalid response format: ${typeof response}`);
      }
    } catch (err) {
      console.error('❌ Failed to load projects:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to load projects: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
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



  const getProjectStatus = (project: Project): string => {
    if (!userData?.id) return 'UNKNOWN';
    const status = project.quoteStatuses[userData.id];
    return status || 'UNKNOWN';
  };

  // Filter to show only ACCEPTED projects
  const getAcceptedProjects = (projects: Project[]) => {
    return projects.filter(project => {
      const status = getProjectStatus(project);
      return status === 'ACCEPTED';
    });
  };

  const getStatusBadgeProps = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { 
          variant: 'outline' as const, 
          className: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: '📨'
        };
      case 'RECEIVED':
        return { 
          variant: 'secondary' as const, 
          className: 'bg-yellow-50 text-yellow-700 border-yellow-200',
          icon: '⏳'
        };
      case 'ACCEPTED':
        return { 
          variant: 'outline' as const, 
          className: 'bg-green-50 text-green-700 border-green-200',
          icon: '✅'
        };
      case 'REJECTED':
        return { 
          variant: 'destructive' as const, 
          className: 'bg-red-50 text-red-700 border-red-200',
          icon: '❌'
        };
      default:
        return { 
          variant: 'outline' as const, 
          className: 'bg-gray-50 text-gray-700 border-gray-200',
          icon: '❓'
        };
    }
  };

  const downloadBoqPdf = async (project: Project) => {
    if (!project.boqPdf || project.boqPdf.length === 0) {
      console.error('No BOQ PDF available for project:', project.projectId);
      return;
    }

    try {
      const uint8Array = new Uint8Array(project.boqPdf);
      const blob = new Blob([uint8Array], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `BOQ_Project_${project.projectId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      console.log('📄 Downloaded BOQ PDF for project:', project.projectId);
    } catch (error) {
      console.error('Failed to download BOQ PDF:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin mr-3" />
        <span className="text-lg">Loading your approved projects...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <Button onClick={loadProjects} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  const acceptedProjects = getAcceptedProjects(projects);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">My Accepted Projects</h1>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <FileText className="h-4 w-4 text-green-600" />
          <span>Showing only projects accepted by factories</span>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            {acceptedProjects.length} Active
          </Badge>
        </div>
      </div>

      {acceptedProjects.length === 0 && !loading && !error ? (
        <Card className="py-12">
          <CardContent className="text-center">
            <Building className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Accepted Projects</h3>
            <p className="text-gray-600 mb-4">
              You don't have any accepted projects yet. Projects will appear here once factories accept your project requests.
            </p>
            <Button onClick={loadProjects} variant="outline">
              Refresh
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {acceptedProjects.map((project) => {
            const statusBadge = getStatusBadgeProps('ACCEPTED');
            return (
              <Card key={project.projectId} className="hover:shadow-lg transition-shadow border-green-200">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2 flex items-center">
                        <FileText className="h-5 w-5 text-green-600 mr-2" />
                        <span className="truncate">Project #{project.projectId.slice(-6)}</span>
                      </CardTitle>
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="h-4 w-4 mr-2" />
                          <span className="truncate">{project.projectAddress}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>Created: {formatDate(project.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant={statusBadge.variant} className={statusBadge.className}>
                      <span className="mr-1">{statusBadge.icon}</span>
                      Active
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <Separator />
                  
                  {/* Project Items Summary */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      <Package className="h-4 w-4 mr-2" />
                      Project Items ({project.items.length})
                    </h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {project.items.slice(0, 3).map((item, index) => (
                        <div key={index} className="text-sm bg-green-50 p-2 rounded border-green-200">
                          <div className="font-medium">{item.profile.profileNumber}</div>
                          <div className="text-gray-600">
                            {item.width}×{item.height}cm, Qty: {item.quantity} | {item.location}
                          </div>
                        </div>
                      ))}
                      {project.items.length > 3 && (
                        <div className="text-sm text-gray-500 text-center py-1">
                          +{project.items.length - 3} more items...
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Actions */}
                  <div className="flex justify-end">
                    <div className="flex space-x-2">
                      {project.boqPdf && project.boqPdf.length > 0 && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => downloadBoqPdf(project)}
                          className="flex items-center border-green-200 hover:bg-green-50"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          BOQ
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      
      {projects.length > 0 && (
        <div className="flex justify-center pt-4">
          <Button onClick={loadProjects} variant="outline">
            <Loader2 className="h-4 w-4 mr-2" />
            Refresh Projects
          </Button>
        </div>
      )}
    </div>
  );
};

export default MyProjects;