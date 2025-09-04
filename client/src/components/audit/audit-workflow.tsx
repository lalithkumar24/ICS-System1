import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Settings, Shield, FileText, Play, Pause } from "lucide-react";

export default function AuditWorkflow() {
  const workflowSteps = [
    {
      id: 1,
      title: "Contract Upload",
      status: "completed",
      description: "Upload smart contract source code",
    },
    {
      id: 2,
      title: "Static Analysis",
      status: "completed",
      description: "Automated code analysis and vulnerability scanning",
    },
    {
      id: 3,
      title: "Risk Assessment",
      status: "in_progress",
      description: "Comprehensive security risk evaluation",
    },
    {
      id: 4,
      title: "Report Generation",
      status: "pending",
      description: "Generate detailed audit report",
    },
  ];

  const currentProgress = 65;

  const getStepIcon = (status: string, index: number) => {
    switch (status) {
      case "completed":
        return <Check className="w-4 h-4 text-white" />;
      case "in_progress":
        return <Settings className="w-4 h-4 text-primary-foreground animate-spin" />;
      default:
        return <span className="text-muted-foreground text-sm font-medium">{index + 1}</span>;
    }
  };

  const getStepStyle = (status: string) => {
    switch (status) {
      case "completed":
        return "w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center";
      case "in_progress":
        return "w-8 h-8 bg-primary rounded-full flex items-center justify-center";
      default:
        return "w-8 h-8 bg-muted rounded-full flex items-center justify-center";
    }
  };

  const getConnectorStyle = (status: string, nextStatus?: string) => {
    if (status === "completed") {
      return "w-12 h-0.5 bg-emerald-500";
    } else if (status === "in_progress") {
      return "w-12 h-0.5 bg-primary";
    }
    return "w-12 h-0.5 bg-border";
  };

  return (
    <Card className="mb-8" data-testid="audit-workflow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Active Audit Workflow</CardTitle>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Progress:</span>
            <div className="w-32 bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300" 
                style={{ width: `${currentProgress}%` }}
              ></div>
            </div>
            <span className="text-sm font-medium text-foreground" data-testid="progress-percentage">
              {currentProgress}%
            </span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Workflow Steps */}
        <div className="flex items-center justify-between mb-6 overflow-x-auto pb-4">
          <div className="flex items-center space-x-4 min-w-max">
            {workflowSteps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex items-center space-x-2">
                  <div className={getStepStyle(step.status)}>
                    {getStepIcon(step.status, index)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {step.status === "completed" ? "Completed" :
                       step.status === "in_progress" ? "In Progress" : "Pending"}
                    </p>
                  </div>
                </div>
                
                {index < workflowSteps.length - 1 && (
                  <div className={`mx-4 ${getConnectorStyle(step.status, workflowSteps[index + 1]?.status)}`}></div>
                )}
              </div>
            ))}
          </div>
          
          <div className="flex items-center space-x-2 ml-6">
            <Button variant="outline" data-testid="button-pause-audit">
              <Pause className="w-4 h-4 mr-2" />
              Pause Audit
            </Button>
            <Button data-testid="button-view-details">
              View Details
            </Button>
          </div>
        </div>
        
        {/* Current Step Details */}
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield className="text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-foreground mb-2">
                Risk Assessment - Contract: Sample Contract
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                Analyzing smart contract for potential vulnerabilities, reentrancy attacks, and access control issues.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Check className="text-emerald-500 w-4 h-4" />
                  <span className="text-xs text-foreground">Reentrancy Check</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="text-emerald-500 w-4 h-4" />
                  <span className="text-xs text-foreground">Access Control</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Settings className="text-primary w-4 h-4 animate-spin" />
                  <span className="text-xs text-foreground">Oracle Manipulation</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
