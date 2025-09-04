import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardList, AlertTriangle, File, TrendingUp } from "lucide-react";

export default function MetricsCards() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["/api/dashboard/metrics"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-16 mb-4" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const metricsData = [
    {
      title: "Total Audits",
      value: (metrics as any)?.totalAudits || 0,
      change: "+12.3%",
      changeType: "positive" as const,
      icon: ClipboardList,
      color: "primary",
    },
    {
      title: "High Risk Issues",
      value: (metrics as any)?.highRiskIssues || 0,
      change: "-8.7%",
      changeType: "negative" as const,
      icon: AlertTriangle,
      color: "destructive",
    },
    {
      title: "Contracts Analyzed",
      value: (metrics as any)?.contractsAnalyzed || 0,
      change: "+5.4%",
      changeType: "positive" as const,
      icon: File,
      color: "secondary",
    },
    {
      title: "Avg Risk Score",
      value: (metrics as any)?.avgRiskScore?.toFixed(1) || "0.0",
      change: "-2.1%",
      changeType: "positive" as const,
      icon: TrendingUp,
      color: "amber",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" data-testid="metrics-cards">
      {metricsData.map((metric, index) => {
        const Icon = metric.icon;
        
        return (
          <Card key={metric.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {metric.title}
                  </p>
                  <p 
                    className="text-2xl font-bold text-foreground" 
                    data-testid={`metric-value-${metric.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {metric.value}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  metric.color === "primary" ? "bg-primary/10" :
                  metric.color === "destructive" ? "bg-destructive/10" :
                  metric.color === "secondary" ? "bg-secondary/10" :
                  "bg-amber-500/10"
                }`}>
                  <Icon className={`text-lg ${
                    metric.color === "primary" ? "text-primary" :
                    metric.color === "destructive" ? "text-destructive" :
                    metric.color === "secondary" ? "text-secondary" :
                    "text-amber-600"
                  }`} />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className={`font-medium ${
                  metric.changeType === "positive" ? "text-emerald-600" : "text-destructive"
                }`}>
                  {metric.change}
                </span>
                <span className="text-muted-foreground ml-1">
                  {metric.title === "Avg Risk Score" ? "improvement" : "from last month"}
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
