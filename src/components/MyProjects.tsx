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
      console.log('🔍 Requesting approved projects for factory:', userData.id);
      console.log('🔍 Current user data:', userData);

      const response = await websocketService.getProjectsForUser(userData.id, 'FACTORY');
      console.log('✅ Received approved projects:', response);
      console.log('✅ Number of projects received:', response?.length || 0);

      if (Array.isArray(response)) {
        console.log('✅ Projects before processing:', response);
        response.forEach((project, index) => {
          console.log(`📋 Project ${index + 1}:`, {
            id: project.projectId,
            address: project.projectAddress,
            factoryIds: project.factoryIds,
            quoteStatuses: project.quoteStatuses,
            currentUserStatus: project.quoteStatuses?.[userData.id]
          });
        });
        setProjects(response);
      } else {
        console.error('Invalid response format:', response);
        setError('Invalid response format from server');
      }
    } catch (err) {
      console.error('❌ Failed to load projects:', err);
      setError('Failed to load projects. Please try again.');
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

  const groupProjectsByStatus = (projects: Project[]) => {
    const grouped = projects.reduce((acc, project) => {
      const status = getProjectStatus(project);
      if (!acc[status]) {
        acc[status] = [];
      }
      acc[status].push(project);
      return acc;
    }, {} as Record<string, Project[]>);

    // Define status order and labels
    const statusOrder: Record<string, { label: string; description: string; color: string }> = {
      'PENDING': { 
        label: 'Pending Projects', 
        description: 'New projects received from clients that need your response',
        color: 'bg-blue-50 border-blue-200'
      },
      'RECEIVED': { 
        label: 'Quote Sent', 
        description: 'Projects where you have sent a quote and awaiting client decision',
        color: 'bg-yellow-50 border-yellow-200'
      },
      'ACCEPTED': { 
        label: 'Active Projects', 
        description: 'Projects accepted by client and currently in progress',
        color: 'bg-green-50 border-green-200'
      },
      'REJECTED': { 
        label: 'Declined Projects', 
        description: 'Projects where your quote was not accepted',
        color: 'bg-red-50 border-red-200'
      }
    };

    return Object.keys(statusOrder)
      .filter(status => grouped[status] && grouped[status].length > 0)
      .map(status => ({
        status,
        ...statusOrder[status],
        projects: grouped[status]
      }));
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">My Projects</h1>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <FileText className="h-4 w-4 text-blue-600" />
          <span>Showing all projects you've responded to</span>
        </div>
      </div>

      {projects.length === 0 ? (
        <Card className="py-12">
          <CardContent className="text-center">
            <Building className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Projects Found</h3>
            <p className="text-gray-600 mb-4">
              You don't have any projects yet. Projects will appear here once you respond to client requests.
            </p>
            <Button onClick={loadProjects} variant="outline">
              Refresh
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {groupProjectsByStatus(projects).map((statusGroup, groupIndex) => (
            <div key={statusGroup.status}>
              {/* Status Section Header */}
              <div className={`rounded-lg p-4 mb-6 ${statusGroup.color}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center">
                      <span className="mr-2 text-2xl">{getStatusBadgeProps(statusGroup.status).icon}</span>
                      {statusGroup.label}
                      <Badge variant="secondary" className="ml-3">
                        {statusGroup.projects.length}
                      </Badge>
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">{statusGroup.description}</p>
                  </div>
                </div>
              </div>

              {/* Projects Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {statusGroup.projects.map((project) => {
                  const statusBadge = getStatusBadgeProps(getProjectStatus(project));
                  return (
                    <Card key={project.projectId} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg mb-2 flex items-center">
                              <FileText className="h-5 w-5 text-blue-600 mr-2" />
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
                            {statusGroup.status === 'PENDING' ? 'Pending' :
                             statusGroup.status === 'RECEIVED' ? 'Quote Sent' :
                             statusGroup.status === 'ACCEPTED' ? 'Active' :
                             statusGroup.status === 'REJECTED' ? 'Declined' : statusGroup.status}
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
                              <div key={index} className="text-sm bg-gray-50 p-2 rounded">
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
                                className="flex items-center"
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

              {/* Section Divider */}
              {groupIndex < groupProjectsByStatus(projects).length - 1 && (
                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">•••</span>
                  </div>
                </div>
              )}
            </div>
          ))}
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