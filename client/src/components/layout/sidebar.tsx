import { Link, useLocation } from "wouter";
import { Briefcase, LayoutDashboard, FileText, Building, BarChart3, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Applications", href: "/applications", icon: FileText },
  { name: "Companies", href: "/companies", icon: Building },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="w-64 bg-card border-r border-border shadow-sm">
      <div className="p-6">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Briefcase className="text-primary-foreground h-4 w-4" />
          </div>
          <h1 className="text-xl font-bold text-foreground">JobTracker</h1>
        </div>
      </div>
      
      <nav className="px-4 pb-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-md transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                  data-testid={`nav-${item.name.toLowerCase()}`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
