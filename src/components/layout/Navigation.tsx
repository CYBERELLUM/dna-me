import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, BookOpen, Database, Search, Dna, Box, Leaf, Globe, Newspaper, Shield, FlaskConical } from "lucide-react";
import { UserMenu } from "@/components/auth/UserMenu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navItems = [
  { path: "/dashboard", label: "Research", icon: Search },
  { path: "/library", label: "Library", icon: BookOpen },
  { path: "/nutrigenomics", label: "Nutrigenomics", icon: Leaf },
  { path: "/visualizations", label: "3D Lab", icon: Box },
  { path: "/sequences", label: "Sequences", icon: Dna },
  { path: "/notebook", label: "Notebook", icon: FlaskConical },
  { path: "/data-vault", label: "Vault", icon: Database },
  { path: "/federated-network", label: "Network", icon: Globe },
];

export const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Home link */}
          <Link to="/dashboard" className="flex items-center gap-2 group">
            <Dna className="w-6 h-6 text-primary" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
              <div className="pulse-dot" />
              <span>Online</span>
            </div>
            <UserMenu />
          </div>

          {/* Mobile Menu Button */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <button className="md:hidden p-2 text-muted-foreground hover:text-foreground">
                <Menu className="w-6 h-6" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] bg-background border-border p-0">
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="p-4 border-b border-border">
                  <Link to="/dashboard" onClick={() => setIsOpen(false)} className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">CYBERELLUM</span>
                      <span className="font-semibold text-foreground text-sm glow-text">Technologies</span>
                    </div>
                  </Link>
                </div>

                {/* Navigation Links */}
                <div className="flex-1 overflow-y-auto p-4 space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                          isActive
                            ? "bg-primary/10 text-primary border border-primary/30"
                            : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        {item.label}
                      </Link>
                    );
                  })}
                  
                  {/* Divider */}
                  <div className="my-4 border-t border-border" />
                  
                  {/* Additional Links */}
                  <Link
                    to="/blogs"
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      location.pathname === "/blogs"
                        ? "bg-primary/10 text-primary border border-primary/30"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                  >
                    <Newspaper className="w-5 h-5" />
                    Blogs & News
                  </Link>
                  <Link
                    to="/security"
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      location.pathname === "/security"
                        ? "bg-primary/10 text-primary border border-primary/30"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                  >
                    <Shield className="w-5 h-5" />
                    Security
                  </Link>
                </div>

                {/* Footer with User Menu */}
                <div className="p-4 border-t border-border">
                  <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-4">
                    <div className="pulse-dot" />
                    <span>Online</span>
                  </div>
                  <UserMenu />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};
