import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { LogOut, LayoutDashboard, Upload, Brain, Landmark, FileText, User } from "lucide-react";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/documents", label: "Documents", icon: Upload },
  { path: "/tax-analysis", label: "Tax Analysis", icon: Brain },
  { path: "/schemes", label: "Schemes", icon: Landmark },
  { path: "/tax-summary", label: "Summary", icon: FileText },
  { path: "/profile", label: "Profile", icon: User },
];

const DashboardNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-display font-bold text-lg">T</div>
            <span className="font-display font-bold text-xl text-foreground hidden sm:inline">TaxSathi</span>
          </Link>
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path}>
                <Button variant={location.pathname === item.path ? "secondary" : "ghost"} size="sm" className="gap-1.5">
                  <item.icon className="h-4 w-4" />
                  <span className="hidden lg:inline">{item.label}</span>
                </Button>
              </Link>
            ))}
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={handleSignOut}>
          <LogOut className="h-4 w-4 mr-2" /> Sign Out
        </Button>
      </div>
      {/* Mobile nav */}
      <div className="md:hidden flex overflow-x-auto border-t border-border/50 px-2 py-1 gap-1">
        {navItems.map((item) => (
          <Link key={item.path} to={item.path}>
            <Button variant={location.pathname === item.path ? "secondary" : "ghost"} size="sm" className="gap-1 text-xs whitespace-nowrap">
              <item.icon className="h-3.5 w-3.5" /> {item.label}
            </Button>
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default DashboardNav;
