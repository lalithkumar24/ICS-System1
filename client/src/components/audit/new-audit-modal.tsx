import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { CloudUpload, X } from "lucide-react";

const auditFormSchema = z.object({
  contract_id: z.number().optional(),
  contractName: z.string().optional(),
  sourceCode: z.string().optional(),
  audit_type: z.string().min(1, "Audit type is required"),
  priority: z.string().min(1, "Priority is required"),
  notes: z.string().optional(),
  configuration: z.object({
    reentrancy_check: z.boolean().default(true),
    access_control: z.boolean().default(true),
    gas_optimization: z.boolean().default(true),
    oracle_manipulation: z.boolean().default(false),
  }),
});

type AuditFormData = z.infer<typeof auditFormSchema>;

interface NewAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewAuditModal({ isOpen, onClose }: NewAuditModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<AuditFormData>({
    resolver: zodResolver(auditFormSchema),
    defaultValues: {
      audit_type: "comprehensive",
      priority: "standard",
      notes: "",
      configuration: {
        reentrancy_check: true,
        access_control: true,
        gas_optimization: true,
        oracle_manipulation: false,
      },
    },
  });

  // === Mutations ===
  const createAuditMutation = useMutation({
    mutationFn: async (data: AuditFormData) => {
      const response = await apiRequest("POST", "/api/contracts", data);
      console.log("Create Audit Response:", response);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "✅ Audit started",
        description: "Contract analysis is running...",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      handleClose();
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => (window.location.href = "/api/login"), 500);
        return;
      }
      toast({
        title: "❌ Audit failed",
        description: "Could not create audit",
        variant: "destructive",
      });
    },
  });

  const uploadContractMutation = useMutation({
    mutationFn: async (file: File) => {
      const response = await apiRequest("POST", "/api/contracts", {
        name: file.name,
        source_code: await file.text(),
        network: "ethereum",
        contract_type: "other",
        verified: false,
      });
      return response.json();
    },
    onSuccess: (contract) => {
      form.setValue("contract_id", contract.id);
      toast({
        title: "✅ Contract uploaded",
        description: "Contract is now linked to this audit",
      });
    },
    onError: () => {
      toast({
        title: "❌ Upload failed",
        description: "Could not upload contract",
        variant: "destructive",
      });
    },
  });

  // === Handlers ===
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      uploadContractMutation.mutate(file);
    }
  };

  const onSubmit = (data: AuditFormData) => {
    createAuditMutation.mutate(data);
  };

  const handleClose = () => {
    onClose();
    form.reset();
    setSelectedFile(null);
  };

  // === Render ===
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>New Smart Contract Audit</DialogTitle>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Contract Upload or Source Code */}
            <div>
              <FormLabel>Smart Contract</FormLabel>
              <div className="mt-2">
                {selectedFile ? (
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                    <div className="flex items-center space-x-3">
                      <CloudUpload className="w-5 h-5 text-primary" />
                      <span className="text-sm">{selectedFile.name}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedFile(null);
                        form.setValue("contract_id", undefined);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="block">
                    <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50">
                      <CloudUpload className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                      <p className="text-sm">Drop a file or click to upload</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept=".sol,.vy,.zip"
                      onChange={handleFileSelect}
                    />
                  </label>
                )}
              </div>

              {/* OR paste source code */}
              {!selectedFile && (
                <div className="mt-4 space-y-2">
                  <FormField
                    control={form.control}
                    name="contractName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contract Name</FormLabel>
                        <FormControl>
                          <Input placeholder="MyToken" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sourceCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Source Code</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Paste Solidity contract here..."
                            rows={8}
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

            {/* Audit Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="audit_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Audit Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select audit type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="comprehensive">Comprehensive Audit</SelectItem>
                        <SelectItem value="security">Security Review</SelectItem>
                        <SelectItem value="gas">Gas Optimization</SelectItem>
                        <SelectItem value="custom">Custom Analysis</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="high">High Priority</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            {/* Analysis Options */}
            <div>
              <FormLabel>Analysis Options</FormLabel>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {(
                  [
                    ["configuration.reentrancy_check", "Reentrancy Detection"],
                    ["configuration.access_control", "Access Control Analysis"],
                    ["configuration.gas_optimization", "Gas Optimization"],
                    ["configuration.oracle_manipulation", "Oracle Manipulation"],
                  ] as const
                ).map(([name, label]) => (
                  <FormField
                    key={name}
                    control={form.control}
                    name={name as any}
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel className="text-sm">{label}</FormLabel>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Any specific concerns..." {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={createAuditMutation.isPending}>
                {createAuditMutation.isPending ? "Creating..." : "Start Audit"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

