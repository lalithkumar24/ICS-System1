import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, CheckCircle, Info, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function TransactionMonitoring() {
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ["/api/transactions"],
    queryFn: async () => {
      const response = await fetch("/api/transactions?limit=10", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch transactions");
      return response.json();
    },
  });

  const { data: highRiskTransactions, isLoading: highRiskLoading } = useQuery({
    queryKey: ["/api/transactions/high-risk"],
  });

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel?.toLowerCase()) {
      case "critical":
        return "w-2 h-2 bg-destructive rounded-full";
      case "high":
        return "w-2 h-2 bg-amber-500 rounded-full";
      case "medium":
        return "w-2 h-2 bg-amber-300 rounded-full";
      case "low":
        return "w-2 h-2 bg-emerald-500 rounded-full";
      default:
        return "w-2 h-2 bg-muted rounded-full";
    }
  };

  const getRiskBadgeColor = (riskLevel: string) => {
    switch (riskLevel?.toLowerCase()) {
      case "critical":
        return "bg-destructive/10 text-destructive";
      case "high":
        return "bg-amber-100 text-amber-800";
      case "medium":
        return "bg-amber-100 text-amber-800";
      case "low":
        return "bg-emerald-100 text-emerald-800";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const mockAlerts = [
    {
      id: 1,
      type: "critical",
      title: "Critical Vulnerability Detected",
      description: "Potential reentrancy attack vector found in contract 0x8ad5...9b2c",
      time: "15 minutes ago",
      icon: AlertTriangle,
      color: "text-destructive",
      bgColor: "border-destructive bg-destructive/5",
    },
    {
      id: 2,
      type: "info",
      title: "Gas Optimization Opportunity",
      description: "Contract can be optimized to reduce gas costs by 23%",
      time: "1 hour ago",
      icon: Info,
      color: "text-amber-600",
      bgColor: "border-amber-500 bg-amber-50",
    },
    {
      id: 3,
      type: "success",
      title: "Audit Completed Successfully",
      description: "CompoundV3 audit finished with no critical issues found",
      time: "3 hours ago",
      icon: CheckCircle,
      color: "text-emerald-600",
      bgColor: "border-emerald-500 bg-emerald-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" data-testid="transaction-monitoring">
      {/* Transaction Monitoring */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Transaction Monitoring</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-muted-foreground">Live</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {transactionsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-3">
                  <Skeleton className="w-2 h-2 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {transactions?.slice(0, 3).map((tx) => (
                <div 
                  key={tx.id} 
                  className="flex items-center space-x-4 p-3 rounded-lg border border-border hover:bg-accent/30 transition-colors"
                  data-testid={`transaction-item-${tx.id}`}
                >
                  <div className={getRiskColor(tx.risk_level || "low")}></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground truncate">
                        {tx.hash?.slice(0, 10)}...{tx.hash?.slice(-4)}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {tx.timestamp 
                          ? formatDistanceToNow(new Date(tx.timestamp), { addSuffix: true })
                          : "Unknown"
                        }
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-muted-foreground">
                        {tx.value ? `Transfer: ${tx.value} ETH` : "Contract Interaction"}
                      </p>
                      <Badge className={getRiskBadgeColor(tx.risk_level || "low")}>
                        {tx.risk_level?.charAt(0).toUpperCase() + tx.risk_level?.slice(1) || "Safe"}
                      </Badge>
                    </div>
                  </div>
                </div>
              )) || (
                <div className="text-center py-8 text-muted-foreground">
                  No recent transactions to display
                </div>
              )}
            </div>
          )}
          
          <div className="mt-4 pt-4 border-t border-border">
            <Button 
              variant="ghost" 
              className="w-full text-primary hover:text-primary/80"
              data-testid="button-view-all-transactions"
            >
              View All Transactions
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Smart Contract Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Smart Contract Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockAlerts.map((alert) => {
              const Icon = alert.icon;
              
              return (
                <div 
                  key={alert.id} 
                  className={`p-4 rounded-lg border-l-4 ${alert.bgColor}`}
                  data-testid={`alert-item-${alert.id}`}
                >
                  <div className="flex items-start space-x-3">
                    <Icon className={`w-5 h-5 mt-0.5 ${alert.color}`} />
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-foreground">
                        {alert.title}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {alert.description}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">
                          {alert.time}
                        </span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-primary hover:text-primary/80"
                          data-testid={`button-investigate-${alert.id}`}
                        >
                          {alert.type === "success" ? "Download Report" : 
                           alert.type === "info" ? "View Details" : "Investigate"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
