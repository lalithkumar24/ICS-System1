import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import MetricsCards from "@/components/dashboard/metrics-cards";
import RecentAudits from "@/components/dashboard/recent-audits";
import RiskAnalysis from "@/components/dashboard/risk-analysis";
import TransactionMonitoring from "@/components/dashboard/transaction-monitoring";
import AuditWorkflow from "@/components/audit/audit-workflow";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to home if not authenticated
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

  return (
    <div className="flex h-screen bg-muted/30" data-testid="dashboard-main">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header title="Audit Dashboard" />
        <div className="flex-1 overflow-auto p-6">
          {/* Metrics Overview */}
          <MetricsCards />
          
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <RecentAudits />
            </div>
            <div>
              <RiskAnalysis />
            </div>
          </div>
          
          {/* Audit Workflow */}
          <AuditWorkflow />
          
          {/* Transaction Analysis */}
          <TransactionMonitoring />
        </div>
      </main>
    </div>
  );
}
