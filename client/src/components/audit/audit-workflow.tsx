import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Pause, Play, Shield, FileText, Settings } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

type AuditStep = {
  id: number;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "completed" | "failed";
};

// Map status to icon
function getStepIcon(status: string) {
  switch (status) {
    case "completed": return <Check className="text-green-600" />;
    case "in_progress": return <Play className="text-blue-600 animate-pulse" />;
    case "failed": return <Pause className="text-red-600" />;
    default: return <Settings className="text-gray-400" />;
  }
}

export default function AuditWorkflow({ auditId }: { auditId: number }) {
  // Fetch a specific audit workflow from backend
  const { data: audit, isLoading } = useQuery({
    queryKey: ["/api/audits", auditId],
    queryFn: async () => {
      const res = await fetch(`/api/audits/${auditId}`);
      if (!res.ok) throw new Error("Failed to fetch audit");
      return res.json();
    },
    refetchInterval: 5000, // auto-refresh every 5s for live updates
  });

  if (isLoading) return <p>Loading workflow...</p>;

  // Convert backend audit status to steps
  const steps: AuditStep[] = [
    {
      id: 1,
      title: "Contract Upload",
      description: "Upload smart contract source code",
      status: audit?.status === "uploaded" || audit?.status === "in_progress" || audit?.status === "completed"
        ? "completed"
        : "pending",
    },
    {
      id: 2,
      title: "Compilation",
      description: "Compile contract with Solidity compiler",
      status: audit?.status === "compiled" || audit?.status === "in_progress" || audit?.status === "completed"
        ? "completed"
        : "pending",
    },
    {
      id: 3,
      title: "Static Analysis",
      description: "Run Slither/Mythril vulnerability checks",
      status: audit?.status === "in_progress" ? "in_progress"
        : audit?.status === "completed" ? "completed"
        : "pending",
    },
    {
      id: 4,
      title: "Report Generation",
      description: "Generate final audit report",
      status: audit?.status === "completed" ? "completed" : "pending",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Workflow</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {steps.map((step) => (
          <div key={step.id} className="flex items-center justify-between p-2 border rounded-lg">
            <div className="flex items-center space-x-3">
              {getStepIcon(step.status)}
              <div>
                <p className="font-medium">{step.title}</p>
                <p className="text-sm text-gray-500">{step.description}</p>
              </div>
            </div>
            <Badge variant={
              step.status === "completed" ? "default" :
              step.status === "in_progress" ? "secondary" :
              step.status === "failed" ? "destructive" : "outline"
            }>
              {step.status}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

