import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, Download, Pause, Play, MoreHorizontal } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Audits() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  const { data: audits, isLoading: auditsLoading } = useQuery({
    queryKey: ["/api/audits"],
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading || !isAuthenticated) {
    return null;
  }

  const getRiskLevelColor = (riskScore: string | null) => {
    if (!riskScore) return "bg-muted text-muted-foreground";
    const score = Number(riskScore);
    if (score >= 8) return "bg-destructive/10 text-destructive";
    if (score >= 5) return "bg-amber-100 text-amber-800";
    return "bg-emerald-100 text-emerald-800";
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-emerald-100 text-emerald-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-amber-100 text-amber-800";
      case "failed":
        return "bg-destructive/10 text-destructive";
      case "paused":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="flex h-screen bg-muted/30" data-testid="audits-page">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header title="Audit Management" />
        <div className="flex-1 overflow-auto p-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>All Audits</CardTitle>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">Filter</Button>
                  <Button variant="outline" size="sm">Sort</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {auditsLoading ? (
                <div className="p-6">
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                        <Skeleton className="w-12 h-12 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-48" />
                        </div>
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-8 w-8" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Audit Details
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Risk Level
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Progress
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {!audits || (audits as any[]).length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                            <div className="flex flex-col items-center space-y-3">
                              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                                <Eye className="w-8 h-8 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="text-lg font-medium">No audits found</p>
                                <p className="text-sm">Start your first audit to see results here</p>
                              </div>
                              <Button>Create New Audit</Button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        (audits as any[]).map((audit: any) => (
                          <tr 
                            key={audit.id} 
                            className="hover:bg-muted/30 transition-colors"
                            data-testid={`audit-row-${audit.id}`}
                          >
                            <td className="px-6 py-4">
                              <div>
                                <p className="text-sm font-medium text-foreground">
                                  Audit #{audit.id}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {audit.audit_type} • Contract #{audit.contract_id}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Priority: {audit.priority}
                                </p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <Badge className={getRiskLevelColor(audit.risk_score)}>
                                {audit.risk_score ? 
                                  (Number(audit.risk_score) >= 8 ? "High" : 
                                   Number(audit.risk_score) >= 5 ? "Medium" : "Low") : "Unknown"
                                }
                              </Badge>
                            </td>
                            <td className="px-6 py-4">
                              <Badge className={getStatusColor(audit.status || "")}>
                                {audit.status?.replace("_", " ") || "Unknown"}
                              </Badge>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
                                <div className="w-16 bg-muted rounded-full h-2">
                                  <div 
                                    className="bg-primary h-2 rounded-full" 
                                    style={{ width: `${audit.progress || 0}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {audit.progress || 0}%
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">
                              {audit.created_at 
                                ? formatDistanceToNow(new Date(audit.created_at), { addSuffix: true })
                                : "Unknown"
                              }
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  data-testid={`button-view-${audit.id}`}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                {audit.status === "completed" ? (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    data-testid={`button-download-${audit.id}`}
                                  >
                                    <Download className="w-4 h-4" />
                                  </Button>
                                ) : audit.status === "paused" ? (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    data-testid={`button-resume-${audit.id}`}
                                  >
                                    <Play className="w-4 h-4" />
                                  </Button>
                                ) : (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    data-testid={`button-pause-${audit.id}`}
                                  >
                                    <Pause className="w-4 h-4" />
                                  </Button>
                                )}
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  data-testid={`button-more-${audit.id}`}
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
