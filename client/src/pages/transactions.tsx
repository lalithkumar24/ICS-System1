import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  Filter, 
  ExternalLink, 
  AlertTriangle, 
  Shield, 
  TrendingUp,
  Clock,
  Eye,
  RefreshCw
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Transactions() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRisk, setFilterRisk] = useState("all");
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  const { data: transactions, isLoading: transactionsLoading, refetch } = useQuery({
    queryKey: ["/api/transactions"],
    queryFn: async () => {
      const response = await fetch("/api/transactions?limit=100", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch transactions");
      return response.json();
    },
  });

  const { data: highRiskTransactions, isLoading: highRiskLoading } = useQuery({
    queryKey: ["/api/transactions/high-risk"],
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

  // Auto-refresh transactions every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000);
    setRefreshInterval(interval);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [refetch]);

  if (isLoading || !isAuthenticated) {
    return null;
  }

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel?.toLowerCase()) {
      case "critical":
        return "bg-destructive/10 text-destructive";
      case "high":
        return "bg-amber-100 text-amber-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-emerald-100 text-emerald-800";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getRiskIndicatorColor = (riskLevel: string) => {
    switch (riskLevel?.toLowerCase()) {
      case "critical":
        return "w-2 h-2 bg-destructive rounded-full";
      case "high":
        return "w-2 h-2 bg-amber-500 rounded-full";
      case "medium":
        return "w-2 h-2 bg-yellow-500 rounded-full";
      case "low":
        return "w-2 h-2 bg-emerald-500 rounded-full";
      default:
        return "w-2 h-2 bg-muted rounded-full";
    }
  };

  const filteredTransactions = (transactions as any[])?.filter((tx: any) => {
    const matchesSearch = tx.hash?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tx.from_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tx.to_address?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRisk = filterRisk === "all" || 
                       tx.risk_level?.toLowerCase() === filterRisk.toLowerCase();
    
    return matchesSearch && matchesRisk;
  }) || [];

  const riskCounts = {
    total: (transactions as any[])?.length || 0,
    critical: (transactions as any[])?.filter((tx: any) => tx.risk_level === "critical").length || 0,
    high: (transactions as any[])?.filter((tx: any) => tx.risk_level === "high").length || 0,
    medium: (transactions as any[])?.filter((tx: any) => tx.risk_level === "medium").length || 0,
    low: (transactions as any[])?.filter((tx: any) => tx.risk_level === "low").length || 0,
  };

  return (
    <div className="flex h-screen bg-muted/30" data-testid="transactions-page">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header title="Transaction Monitoring" />
        <div className="flex-1 overflow-auto p-6">
          {/* Risk Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Transactions</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="metric-total-transactions">
                      {riskCounts.total}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Critical Risk</p>
                    <p className="text-2xl font-bold text-destructive" data-testid="metric-critical-transactions">
                      {riskCounts.critical}
                    </p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-destructive" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div>
                  <p className="text-sm text-muted-foreground">High Risk</p>
                  <p className="text-2xl font-bold text-amber-600" data-testid="metric-high-transactions">
                    {riskCounts.high}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div>
                  <p className="text-sm text-muted-foreground">Safe Transactions</p>
                  <p className="text-2xl font-bold text-emerald-600" data-testid="metric-safe-transactions">
                    {riskCounts.low}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Actions */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by hash, address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-80"
                  data-testid="input-search-transactions"
                />
              </div>
              
              <Select value={filterRisk} onValueChange={setFilterRisk}>
                <SelectTrigger className="w-40" data-testid="select-risk-filter">
                  <SelectValue placeholder="Filter by risk" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risk Levels</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span>Live monitoring</span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refetch()}
                data-testid="button-refresh"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Transactions Table */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {transactionsLoading ? (
                <div className="p-6">
                  <div className="space-y-4">
                    {[...Array(10)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4 p-4">
                        <Skeleton className="w-2 h-2 rounded-full" />
                        <Skeleton className="w-20 h-4" />
                        <Skeleton className="w-32 h-4" />
                        <Skeleton className="w-24 h-4" />
                        <Skeleton className="w-16 h-6" />
                        <Skeleton className="w-20 h-4" />
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
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Transaction Hash
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          From/To
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Value
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Risk Level
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                            <div className="flex flex-col items-center space-y-3">
                              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                                <Search className="w-8 h-8 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="text-lg font-medium">No transactions found</p>
                                <p className="text-sm">Try adjusting your search or filter criteria</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredTransactions.map((tx: any) => (
                          <tr 
                            key={tx.id} 
                            className="hover:bg-muted/30 transition-colors"
                            data-testid={`transaction-row-${tx.id}`}
                          >
                            <td className="px-6 py-4">
                              <div className={getRiskIndicatorColor(tx.risk_level || "low")}></div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
                                <code className="text-sm font-mono text-foreground">
                                  {tx.hash?.slice(0, 10)}...{tx.hash?.slice(-6)}
                                </code>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  data-testid={`button-external-${tx.id}`}
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </Button>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-1">
                                <div className="text-xs">
                                  <span className="text-muted-foreground">From: </span>
                                  <code className="text-foreground">
                                    {tx.from_address?.slice(0, 6)}...{tx.from_address?.slice(-4)}
                                  </code>
                                </div>
                                <div className="text-xs">
                                  <span className="text-muted-foreground">To: </span>
                                  <code className="text-foreground">
                                    {tx.to_address?.slice(0, 6)}...{tx.to_address?.slice(-4)}
                                  </code>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm font-medium text-foreground">
                                {tx.value ? `${parseFloat(tx.value).toFixed(4)} ETH` : "Contract Call"}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <Badge className={getRiskColor(tx.risk_level || "low")}>
                                {tx.risk_level?.charAt(0).toUpperCase() + tx.risk_level?.slice(1) || "Safe"}
                              </Badge>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                <span>
                                  {tx.timestamp 
                                    ? formatDistanceToNow(new Date(tx.timestamp), { addSuffix: true })
                                    : "Unknown"
                                  }
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  data-testid={`button-analyze-${tx.id}`}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                {(tx.risk_level === "high" || tx.risk_level === "critical") && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    data-testid={`button-investigate-${tx.id}`}
                                  >
                                    <Shield className="w-4 h-4" />
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
              )}
              
              {filteredTransactions.length > 0 && (
                <div className="px-6 py-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Showing {filteredTransactions.length} of {(transactions as any[])?.length || 0} transactions
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
        </div>
      </main>
    </div>
  );
}
