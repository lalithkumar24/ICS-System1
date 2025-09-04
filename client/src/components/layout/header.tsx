import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Bell, Plus, Clock } from "lucide-react";
import NewAuditModal from "@/components/audit/new-audit-modal";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const [showNewAuditModal, setShowNewAuditModal] = useState(false);

  return (
    <>
      <header className="bg-card border-b border-border px-6 py-4" data-testid="header-main">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-foreground" data-testid="text-page-title">
              {title}
            </h2>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span data-testid="text-last-updated">Last updated: 2 minutes ago</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input 
                type="text" 
                placeholder="Search transactions, contracts..."
                className="pl-10 pr-4 py-2 w-80"
                data-testid="input-search"
              />
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="sm"
                className="relative"
                data-testid="button-notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full"></span>
              </Button>
              <Button 
                onClick={() => setShowNewAuditModal(true)}
                data-testid="button-new-audit"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Audit
              </Button>
            </div>
          </div>
        </div>
      </header>

      <NewAuditModal 
        isOpen={showNewAuditModal} 
        onClose={() => setShowNewAuditModal(false)} 
      />
    </>
  );
}
