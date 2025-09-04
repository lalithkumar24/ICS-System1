import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  AlertTriangle, 
  Shield, 
  TrendingUp, 
  TrendingDown, 
  Eye,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3
} from "lucide-react";

export default function RiskAssessment() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  const { data: riskDistribution, isLoading: riskLoading } = useQuery({
    queryKey: ["/api/dashboard/risk-distribution"],
  });

  const { data: audits, isLoading: auditsLoading } = useQuery({
    queryKey: ["/api/audits"],
  });

  const { data: contracts, isLoading: contractsLoading } = useQuery({
    queryKey: ["/api/contracts"],
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

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case "critical":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "high":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getRiskScore = (audit: any) => {
    if (!audit.risk_score) return 0;
    return Number(audit.risk_score);
  };

  const getOverallRiskLevel = () => {
    if (!(audits as any[])?.length) return "unknown";
    const avgRisk = (audits as any[]).reduce((sum: number, audit: any) => sum + getRiskScore(audit), 0) / (audits as any[]).length;
    if (avgRisk >= 8) return "critical";
    if (avgRisk >= 6) return "high";
    if (avgRisk >= 4) return "medium";
    return "low";
  };

  const totalFindings = riskDistribution ? 
    (riskDistribution as any).critical + (riskDistribution as any).high + (riskDistribution as any).medium + (riskDistribution as any).low : 0;

  const riskTrends = [
    {
      period: "This Month",
      critical: (riskDistribution as any)?.critical || 0,
      high: (riskDistribution as any)?.high || 0,
      change: -12,
      trend: "down"
    },
    {
      period: "Last Month", 
      critical: ((riskDistribution as any)?.critical || 0) + 3,
      high: ((riskDistribution as any)?.high || 0) + 8,
      change: 0,
      trend: "neutral"
    }
  ];

  return (
    <div className="flex h-screen bg-muted/30" data-testid="risk-assessment-page">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header title="Risk Assessment" />
        <div className="flex-1 overflow-auto p-6">
          {/* Risk Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="border-l-4 border-l-destructive">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Overall Risk Level</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge className={getSeverityColor(getOverallRiskLevel())}>
                        {getOverallRiskLevel().charAt(0).toUpperCase() + getOverallRiskLevel().slice(1)}
                      </Badge>
                    </div>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-destructive" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Findings</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="metric-total-findings">
                      {totalFindings}
                    </p>
                  </div>
                  <FileText className="w-8 h-8 text-primary" />
                </div>
                <div className="mt-2 flex items-center text-sm">
                  <TrendingDown className="w-4 h-4 text-emerald-600 mr-1" />
                  <span className="text-emerald-600 font-medium">-12%</span>
                  <span className="text-muted-foreground ml-1">from last month</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Critical Issues</p>
                    <p className="text-2xl font-bold text-destructive" data-testid="metric-critical-issues">
                      {riskDistribution?.critical || 0}
                    </p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-destructive" />
                </div>
                <div className="mt-2 flex items-center text-sm">
                  <TrendingDown className="w-4 h-4 text-emerald-600 mr-1" />
                  <span className="text-emerald-600 font-medium">-25%</span>
                  <span className="text-muted-foreground ml-1">from last month</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Resolution Rate</p>
                    <p className="text-2xl font-bold text-emerald-600" data-testid="metric-resolution-rate">
                      87%
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
                </div>
                <div className="mt-2 flex items-center text-sm">
                  <TrendingUp className="w-4 h-4 text-emerald-600 mr-1" />
                  <span className="text-emerald-600 font-medium">+5%</span>
                  <span className="text-muted-foreground ml-1">from last month</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Risk Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Risk Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {riskLoading ? (
                  <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-2">
                          <Skeleton className="h-4 w-16" />
                          <Skeleton className="h-4 w-8" />
                        </div>
                        <Skeleton className="h-2 w-full" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-destructive rounded-full"></div>
                          <span className="text-sm font-medium text-foreground">Critical</span>
                        </div>
                        <span className="text-sm font-medium text-foreground">
                          {riskDistribution?.critical || 0}
                        </span>
                      </div>
                      <Progress 
                        value={totalFindings > 0 ? (riskDistribution?.critical || 0) / totalFindings * 100 : 0} 
                        className="h-2"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                          <span className="text-sm font-medium text-foreground">High</span>
                        </div>
                        <span className="text-sm font-medium text-foreground">
                          {riskDistribution?.high || 0}
                        </span>
                      </div>
                      <Progress 
                        value={totalFindings > 0 ? (riskDistribution?.high || 0) / totalFindings * 100 : 0} 
                        className="h-2"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                          <span className="text-sm font-medium text-foreground">Medium</span>
                        </div>
                        <span className="text-sm font-medium text-foreground">
                          {riskDistribution?.medium || 0}
                        </span>
                      </div>
                      <Progress 
                        value={totalFindings > 0 ? (riskDistribution?.medium || 0) / totalFindings * 100 : 0} 
                        className="h-2"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                          <span className="text-sm font-medium text-foreground">Low</span>
                        </div>
                        <span className="text-sm font-medium text-foreground">
                          {riskDistribution?.low || 0}
                        </span>
                      </div>
                      <Progress 
                        value={totalFindings > 0 ? (riskDistribution?.low || 0) / totalFindings * 100 : 0} 
                        className="h-2"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Risk Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Risk Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {riskTrends.map((trend, index) => (
                    <div key={index} className="p-4 rounded-lg border border-border">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-foreground">{trend.period}</h4>
                        <div className="flex items-center space-x-2">
                          {trend.trend === "down" ? (
                            <TrendingDown className="w-4 h-4 text-emerald-600" />
                          ) : trend.trend === "up" ? (
                            <TrendingUp className="w-4 h-4 text-destructive" />
                          ) : (
                            <BarChart3 className="w-4 h-4 text-muted-foreground" />
                          )}
                          <span className={`text-sm font-medium ${
                            trend.trend === "down" ? "text-emerald-600" :
                            trend.trend === "up" ? "text-destructive" : "text-muted-foreground"
                          }`}>
                            {trend.change > 0 ? "+" : ""}{trend.change}%
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Critical</p>
                          <p className="text-lg font-bold text-destructive">{trend.critical}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">High</p>
                          <p className="text-lg font-bold text-amber-600">{trend.high}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Risk Assessments */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Risk Assessments</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {auditsLoading ? (
                <div className="p-6">
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4 p-4">
                        <Skeleton className="w-10 h-10 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-48" />
                        </div>
                        <Skeleton className="h-6 w-16" />
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
                          Assessment
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Risk Score
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Issues Found
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
                      {!audits || audits.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                            <div className="flex flex-col items-center space-y-3">
                              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                                <Shield className="w-8 h-8 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="text-lg font-medium">No risk assessments found</p>
                                <p className="text-sm">Start an audit to see risk assessments here</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        audits.slice(0, 10).map((audit) => (
                          <tr 
                            key={audit.id} 
                            className="hover:bg-muted/30 transition-colors"
                            data-testid={`risk-assessment-row-${audit.id}`}
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                  <Shield className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-foreground">
                                    Audit #{audit.id}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {audit.audit_type} Assessment
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
                                <span className="text-2xl font-bold text-foreground">
                                  {getRiskScore(audit).toFixed(1)}
                                </span>
                                <Badge className={getSeverityColor(
                                  getRiskScore(audit) >= 8 ? "critical" :
                                  getRiskScore(audit) >= 6 ? "high" :
                                  getRiskScore(audit) >= 4 ? "medium" : "low"
                                )}>
                                  {getRiskScore(audit) >= 8 ? "Critical" :
                                   getRiskScore(audit) >= 6 ? "High" :
                                   getRiskScore(audit) >= 4 ? "Medium" : "Low"}
                                </Badge>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <div className="w-2 h-2 bg-destructive rounded-full"></div>
                                  <span className="text-xs text-muted-foreground">
                                    {audit.critical_issues || 0} Critical
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                                  <span className="text-xs text-muted-foreground">
                                    {audit.high_issues || 0} High
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <Badge className={
                                audit.status === "completed" ? "bg-emerald-100 text-emerald-800" :
                                audit.status === "in_progress" ? "bg-blue-100 text-blue-800" :
                                "bg-amber-100 text-amber-800"
                              }>
                                {audit.status?.replace("_", " ") || "Unknown"}
                              </Badge>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                <span>
                                  {audit.created_at ? 
                                    new Date(audit.created_at).toLocaleDateString() : 
                                    "Unknown"
                                  }
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                data-testid={`button-view-assessment-${audit.id}`}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
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
