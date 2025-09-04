import { Link, useLocation } from "wouter";
import { Shield, BarChart3, Search, File, AlertTriangle, FileText, Download, Settings, Users, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  const navigation = [
    {
      category: "AUDIT TOOLS",
      items: [
        { name: "Dashboard", href: "/", icon: BarChart3 },
        { name: "Transaction Audit", href: "/transactions", icon: Search },
        { name: "Smart Contracts", href: "/contracts", icon: File },
        { name: "Risk Assessment", href: "/risk-assessment", icon: AlertTriangle },
      ]
    },
    {
      category: "REPORTS",
      items: [
        { name: "Analytics", href: "/analytics", icon: BarChart3 },
        { name: "Audit Reports", href: "/reports", icon: FileText },
        { name: "Export Data", href: "/export", icon: Download },
      ]
    },
    {
      category: "SYSTEM",
      items: [
        { name: "Settings", href: "/settings", icon: Settings },
        { name: "User Management", href: "/users", icon: Users },
      ]
    }
  ];

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col" data-testid="sidebar-main">
      {/* Logo and Brand */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground" data-testid="text-brand-name">ICS Audit</h1>
            <p className="text-xs text-muted-foreground">Blockchain Security</p>
          </div>
        </div>
      </div>
      
      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((section) => (
          <div key={section.category} className="mb-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              {section.category}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.href;
                
                return (
                  <Link key={item.name} href={item.href}>
                    <a 
                      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive 
                          ? "bg-accent text-accent-foreground" 
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                      }`}
                      data-testid={`nav-link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <Icon className="w-4 h-4 mr-3" />
                      {item.name}
                    </a>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      
      {/* User Profile */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src={(user as any)?.profileImageUrl || ""} />
            <AvatarFallback className="bg-secondary text-secondary-foreground">
              {(user as any)?.firstName?.[0] || (user as any)?.email?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate" data-testid="text-user-name">
              {(user as any)?.firstName && (user as any)?.lastName 
                ? `${(user as any).firstName} ${(user as any).lastName}`
                : (user as any)?.email || "User"
              }
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {(user as any)?.role || "Auditor"}
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => window.location.href = '/api/logout'}
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
