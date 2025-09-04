import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { File, Eye, Download, Pause } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function RecentAudits() {
  const { data: audits, isLoading } = useQuery({
    queryKey: ["/api/audits"],
  });

  const getRiskLevelColor = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case "critical":
        return "bg-destructive/10 text-destructive";
      case "high":
        return "bg-destructive/10 text-destructive";
      case "medium":
        return "bg-amber-100 text-amber-800";
      case "low":
        return "bg-emerald-100 text-emerald-800";
      default:
        return "bg-muted text-muted-foreground";
    }
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
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (isLoading) {
    return (
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Recent Audits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4">
                <Skeleton className="w-8 h-8 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const recentAudits = audits?.slice(0, 5) || [];

  return (
    <Card className="lg:col-span-2" data-testid="recent-audits-card">
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <CardTitle>Recent Audits</CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="secondary" size="sm" data-testid="button-filter-all">
              All
            </Button>
            <Button variant="ghost" size="sm" data-testid="button-filter-high-risk">
              High Risk
            </Button>
            <Button variant="ghost" size="sm" data-testid="button-filter-pending">
              Pending
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Contract
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Risk Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
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
              {recentAudits.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    No audits found. Start your first audit to see results here.
                  </td>
                </tr>
              ) : (
                recentAudits.map((audit) => (
                  <tr 
                    key={audit.id} 
                    className="hover:bg-muted/30 transition-colors"
                    data-testid={`audit-row-${audit.id}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                          <File className="text-primary text-sm" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            Audit #{audit.id}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Contract ID: {audit.contract_id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge 
                        className={getRiskLevelColor(audit.risk_score ? 
                          (Number(audit.risk_score) >= 8 ? "high" : 
                           Number(audit.risk_score) >= 5 ? "medium" : "low") : "unknown"
                        )}
                      >
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
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {audit.created_at 
                        ? formatDistanceToNow(new Date(audit.created_at), { addSuffix: true })
                        : "Unknown"
                      }
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          data-testid={`button-view-audit-${audit.id}`}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {audit.status === "completed" ? (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            data-testid={`button-download-report-${audit.id}`}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            data-testid={`button-pause-audit-${audit.id}`}
                          >
                            <Pause className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {recentAudits.length > 0 && (
          <div className="px-6 py-4 border-t border-border">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing 1-{recentAudits.length} of {audits?.length || 0} audits
              </p>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" disabled>
                  Previous
                </Button>
                <Button variant="outline" size="sm">
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
