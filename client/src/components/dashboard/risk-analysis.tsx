import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Upload, FileText, TrendingUp, ChevronRight } from "lucide-react";

export default function RiskAnalysis() {
  const { data: riskDistribution, isLoading } = useQuery({
    queryKey: ["/api/dashboard/risk-distribution"],
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Risk Distribution</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const riskData = [
    {
      label: "Critical",
      count: (riskDistribution as any)?.critical || 0,
      color: "bg-destructive",
      percentage: (riskDistribution as any)?.critical ? 
        Math.round(((riskDistribution as any).critical / ((riskDistribution as any).critical + (riskDistribution as any).high + (riskDistribution as any).medium + (riskDistribution as any).low)) * 100) : 0,
    },
    {
      label: "High",
      count: (riskDistribution as any)?.high || 0,
      color: "bg-amber-500",
      percentage: (riskDistribution as any)?.high ? 
        Math.round(((riskDistribution as any).high / ((riskDistribution as any).critical + (riskDistribution as any).high + (riskDistribution as any).medium + (riskDistribution as any).low)) * 100) : 0,
    },
    {
      label: "Medium",
      count: (riskDistribution as any)?.medium || 0,
      color: "bg-amber-300",
      percentage: (riskDistribution as any)?.medium ? 
        Math.round(((riskDistribution as any).medium / ((riskDistribution as any).critical + (riskDistribution as any).high + (riskDistribution as any).medium + (riskDistribution as any).low)) * 100) : 0,
    },
    {
      label: "Low",
      count: (riskDistribution as any)?.low || 0,
      color: "bg-emerald-500",
      percentage: (riskDistribution as any)?.low ? 
        Math.round(((riskDistribution as any).low / ((riskDistribution as any).critical + (riskDistribution as any).high + (riskDistribution as any).medium + (riskDistribution as any).low)) * 100) : 0,
    },
  ];

  const quickActions = [
    {
      label: "Start New Audit",
      icon: Plus,
      color: "text-primary",
      action: "startNewAudit",
    },
    {
      label: "Upload Contract",
      icon: Upload,
      color: "text-secondary",
      action: "uploadContract",
    },
    {
      label: "Generate Report",
      icon: FileText,
      color: "text-emerald-600",
      action: "generateReport",
    },
    {
      label: "View Analytics",
      icon: TrendingUp,
      color: "text-amber-600",
      action: "viewAnalytics",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Risk Distribution */}
      <Card data-testid="risk-distribution-card">
        <CardHeader>
          <CardTitle>Risk Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {riskData.map((risk) => (
              <div key={risk.label}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 ${risk.color} rounded-full`}></div>
                    <span className="text-sm text-foreground">{risk.label}</span>
                  </div>
                  <span 
                    className="text-sm font-medium text-foreground"
                    data-testid={`risk-count-${risk.label.toLowerCase()}`}
                  >
                    {risk.count}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 mt-2">
                  <div 
                    className={`${risk.color} h-2 rounded-full`} 
                    style={{ width: `${risk.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Quick Actions */}
      <Card data-testid="quick-actions-card">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              
              return (
                <Button
                  key={action.label}
                  variant="outline"
                  className="w-full justify-between p-3 h-auto"
                  data-testid={`button-${action.action}`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-5 h-5 ${action.color}`} />
                    <span className="text-sm font-medium text-foreground">
                      {action.label}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
