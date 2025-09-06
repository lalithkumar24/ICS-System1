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
  File, 
  Upload, 
  Eye, 
  Edit, 
  Trash2, 
  Plus, 
  Search,
  Shield,
  CheckCircle,
  Clock,
  X
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const contractFormSchema = z.object({
  name: z.string().min(1, "Contract name is required"),
  address: z.string().optional(),
  source_code: z.string().optional(),
  compiler_version: z.string().optional(),
  network: z.string().min(1, "Network is required"),
  contract_type: z.string().min(1, "Contract type is required"),
  verified: z.boolean().default(false),
});

type ContractFormData = z.infer<typeof contractFormSchema>;

export default function Contracts() {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();

  const { data: contracts, isLoading: contractsLoading } = useQuery({
    queryKey: ["/api/contracts"],
  });

  const form = useForm<ContractFormData>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: {
      name: "",
      address: "",
      source_code: "",
      compiler_version: "",
      network: "ethereum",
      contract_type: "other",
      verified: false,
    },
  });

  const uploadContractMutation = useMutation({
    mutationFn: async (data: ContractFormData & { source_code: string }) => {
      const response = await apiRequest("POST", "/api/audits", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Contract uploaded successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/audits"] });
      setShowUploadModal(false);
      setSelectedFile(null);
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
        description: "Failed to upload contract",
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

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      try {
        const content = await file.text();
        form.setValue("source_code", content);
        if (!form.getValues("name")) {
          form.setValue("name", file.name.replace(/\.(sol|vy)$/, ""));
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to read file content",
          variant: "destructive",
        });
      }
    }
  };

  const onSubmit = async (data: ContractFormData) => {
    if (!data.source_code && selectedFile) {
      try {
        data.source_code = await selectedFile.text();
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to read file content",
          variant: "destructive",
        });
        return;
      }
    }
    uploadContractMutation.mutate(data as ContractFormData & { source_code: string });
  };

  const getContractTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case "defi":
        return "bg-blue-100 text-blue-800";
      case "nft":
        return "bg-purple-100 text-purple-800";
      case "governance":
        return "bg-green-100 text-green-800";
      case "token":
        return "bg-yellow-100 text-yellow-800";
      case "bridge":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getNetworkColor = (network: string) => {
    switch (network?.toLowerCase()) {
      case "ethereum":
        return "bg-blue-100 text-blue-800";
      case "polygon":
        return "bg-purple-100 text-purple-800";
      case "bsc":
        return "bg-yellow-100 text-yellow-800";
      case "arbitrum":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredContracts = (contracts as any[])?.filter((contract: any) =>
    contract.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contract.address?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="flex h-screen bg-muted/30" data-testid="contracts-page">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header title="Smart Contracts" />
        <div className="flex-1 overflow-auto p-6">
          {/* Actions Bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search contracts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-80"
                  data-testid="input-search-contracts"
                />
              </div>
            </div>
            <Button 
              onClick={() => setShowUploadModal(true)}
              data-testid="button-upload-contract"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Contract
            </Button>
          </div>

          {/* Contracts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contractsLoading ? (
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
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : filteredContracts.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <File className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {(contracts as any[])?.length === 0 ? "No contracts uploaded" : "No contracts found"}
                </h3>
                <p className="text-muted-foreground text-center mb-4">
                  {(contracts as any[])?.length === 0 
                    ? "Upload your first smart contract to start auditing"
                    : "Try adjusting your search terms"
                  }
                </p>
                {(contracts as any[])?.length === 0 && (
                  <Button onClick={() => setShowUploadModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Upload Contract
                  </Button>
                )}
              </div>
            ) : (
              filteredContracts.map((contract: any) => (
                <Card key={contract.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <File className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground truncate">
                          {contract.name}
                        </h3>
                        {contract.address && (
                          <p className="text-xs text-muted-foreground truncate">
                            {contract.address}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-1">
                        {contract.verified && (
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge className={getContractTypeColor(contract.contract_type || "")}>
                          {contract.contract_type}
                        </Badge>
                        <Badge className={getNetworkColor(contract.network)}>
                          {contract.network}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>
                          {contract.created_at 
                            ? formatDistanceToNow(new Date(contract.created_at), { addSuffix: true })
                            : "Unknown"
                          }
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 pt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          data-testid={`button-view-${contract.id}`}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          data-testid={`button-audit-${contract.id}`}
                        >
                          <Shield className="w-4 h-4 mr-1" />
                          Audit
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

      {/* Upload Contract Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="max-w-2xl" data-testid="upload-contract-modal">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Upload Smart Contract</DialogTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowUploadModal(false)}
                data-testid="button-close-upload-modal"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* File Upload */}
              <div>
                <FormLabel>Contract File</FormLabel>
                <div className="mt-2">
                  {selectedFile ? (
                    <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/50">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                          <File className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{selectedFile.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(selectedFile.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedFile(null);
                          form.setValue("source_code", "");
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="block">
                      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-sm font-medium text-foreground mb-1">
                          Drop your contract file here or click to browse
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Supports .sol, .vy files up to 10MB
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept=".sol,.vy"
                        onChange={handleFileSelect}
                        data-testid="input-file-upload"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Contract Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contract Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter contract name" 
                          {...field} 
                          data-testid="input-contract-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contract Address (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="0x..." 
                          {...field} 
                          data-testid="input-contract-address"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="network"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Network</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-network">
                            <SelectValue placeholder="Select network" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ethereum">Ethereum</SelectItem>
                          <SelectItem value="polygon">Polygon</SelectItem>
                          <SelectItem value="bsc">BSC</SelectItem>
                          <SelectItem value="arbitrum">Arbitrum</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contract_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contract Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-contract-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="defi">DeFi</SelectItem>
                          <SelectItem value="nft">NFT</SelectItem>
                          <SelectItem value="governance">Governance</SelectItem>
                          <SelectItem value="token">Token</SelectItem>
                          <SelectItem value="bridge">Bridge</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="compiler_version"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Compiler Version (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="0.8.19" 
                        {...field} 
                        data-testid="input-compiler-version"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Form Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowUploadModal(false)}
                  data-testid="button-cancel-upload"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={uploadContractMutation.isPending}
                  data-testid="button-upload-submit"
                >
                  {uploadContractMutation.isPending ? "Uploading..." : "Upload Contract"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
