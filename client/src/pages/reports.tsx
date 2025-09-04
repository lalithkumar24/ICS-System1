import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  FileText, 
  Download, 
  Eye, 
  Plus, 
  Search,
  Filter,
  Share,
  Calendar,
  User,
  BarChart3,
  X
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const reportFormSchema = z.object({
  audit_id: z.number().min(1, "Audit is required"),
  title: z.string().min(1, "Report title is required"),
  summary: z.string().optional(),
  report_data: z.any().optional(),
});

type ReportFormData = z.infer<typeof reportFormSchema>;

export default function Reports() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();

  const { data: reports, isLoading: reportsLoading } = useQuery({
    queryKey: ["/api/reports"],
  });

  const { data: audits, isLoading: auditsLoading } = useQuery({
    queryKey: ["/api/audits"],
  });

  const form = useForm<ReportFormData>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      audit_id: 0,
      title: "",
      summary: "",
      report_data: {},
    },
  });

  const createReportMutation = useMutation({
    mutationFn: async (data: ReportFormData) => {
      const response = await apiRequest("POST", "/api/reports", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Report generated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      setShowCreateModal(false);
      form.reset();
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
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
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive",
      });
    },
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

  const onSubmit = (data: ReportFormData) => {
    const selectedAudit = audits?.find(audit => audit.id === data.audit_id);
    const reportData = {
      ...data,
      report_data: {
        audit_details: selectedAudit,
        generated_at: new Date().toISOString(),
        report_type: "comprehensive",
        sections: [
          "executive_summary",
          "technical_findings", 
          "risk_assessment",
          "recommendations"
        ]
      }
    };
    createReportMutation.mutate(reportData);
  };

  const filteredReports = reports?.filter(report =>
    report.title.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const completedAudits = audits?.filter(audit => audit.status === "completed") || [];

  return (
    <div className="flex h-screen bg-muted/30" data-testid="reports-page">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header title="Audit Reports" />
        <div className="flex-1 overflow-auto p-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Reports</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="metric-total-reports">
                      {reports?.length || 0}
                    </p>
                  </div>
                  <FileText className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">This Month</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="metric-monthly-reports">
                      {reports?.filter(report => {
                        const reportDate = new Date(report.created_at);
                        const now = new Date();
                        return reportDate.getMonth() === now.getMonth() && 
                               reportDate.getFullYear() === now.getFullYear();
                      }).length || 0}
                    </p>
                  </div>
                  <Calendar className="w-8 h-8 text-secondary" />
                </div>
                <div className="mt-2 flex items-center text-sm">
                  <span className="text-emerald-600 font-medium">+15%</span>
                  <span className="text-muted-foreground ml-1">from last month</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Downloads</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="metric-downloads">
                      {(reports?.length || 0) * 3}
                    </p>
                  </div>
                  <Download className="w-8 h-8 text-emerald-600" />
                </div>
                <div className="mt-2 flex items-center text-sm">
                  <span className="text-emerald-600 font-medium">+8%</span>
                  <span className="text-muted-foreground ml-1">from last month</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Generation Time</p>
                    <p className="text-2xl font-bold text-foreground">2.3m</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-amber-600" />
                </div>
                <div className="mt-2 flex items-center text-sm">
                  <span className="text-emerald-600 font-medium">-12%</span>
                  <span className="text-muted-foreground ml-1">improvement</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions Bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-80"
                  data-testid="input-search-reports"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>
            <Button 
              onClick={() => setShowCreateModal(true)}
              data-testid="button-generate-report"
            >
              <Plus className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
          </div>

          {/* Reports Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reportsLoading ? (
              [...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <Skeleton className="w-10 h-10 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : filteredReports.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {reports?.length === 0 ? "No reports generated" : "No reports found"}
                </h3>
                <p className="text-muted-foreground text-center mb-4">
                  {reports?.length === 0 
                    ? "Generate your first audit report to see it here"
                    : "Try adjusting your search terms"
                  }
                </p>
                {reports?.length === 0 && (
                  <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Generate Report
                  </Button>
                )}
              </div>
            ) : (
              filteredReports.map((report) => (
                <Card key={report.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground truncate">
                          {report.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Audit #{report.audit_id}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {report.summary && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {report.summary}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center space-x-2">
                          <User className="w-3 h-3" />
                          <span>Generated by you</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {report.created_at 
                              ? formatDistanceToNow(new Date(report.created_at), { addSuffix: true })
                              : "Unknown"
                            }
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 pt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          data-testid={`button-view-${report.id}`}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          data-testid={`button-download-${report.id}`}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          data-testid={`button-share-${report.id}`}
                        >
                          <Share className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Generate Report Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl" data-testid="generate-report-modal">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Generate Audit Report</DialogTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowCreateModal(false)}
                data-testid="button-close-generate-modal"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Audit Selection */}
              <FormField
                control={form.control}
                name="audit_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Audit</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(Number(value))} 
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-audit">
                          <SelectValue placeholder="Choose an audit to generate report for" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {completedAudits.map((audit) => (
                          <SelectItem key={audit.id} value={audit.id.toString()}>
                            Audit #{audit.id} - {audit.audit_type} 
                            {audit.risk_score && ` (Risk: ${audit.risk_score})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Report Details */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Report Title</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter report title" 
                        {...field} 
                        data-testid="input-report-title"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="summary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Executive Summary (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief summary of the audit findings and recommendations..."
                        {...field}
                        rows={4}
                        data-testid="textarea-summary"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Report Configuration */}
              <div>
                <FormLabel className="text-base font-medium">Report Sections</FormLabel>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked disabled className="rounded" />
                    <span className="text-sm text-foreground">Executive Summary</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked disabled className="rounded" />
                    <span className="text-sm text-foreground">Technical Findings</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked disabled className="rounded" />
                    <span className="text-sm text-foreground">Risk Assessment</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked disabled className="rounded" />
                    <span className="text-sm text-foreground">Recommendations</span>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowCreateModal(false)}
                  data-testid="button-cancel-generate"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createReportMutation.isPending || completedAudits.length === 0}
                  data-testid="button-generate-submit"
                >
                  {createReportMutation.isPending ? "Generating..." : "Generate Report"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
