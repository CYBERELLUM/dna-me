import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, FlaskConical, BookOpen, Database, Search, Dna, Box, Leaf } from "lucide-react";
import { UserMenu } from "@/components/auth/UserMenu";
import cyberellumLogo from "@/assets/cyberellum-logo.png";

const navItems = [
  { path: "/", label: "Research", icon: Search },
  { path: "/library", label: "Library", icon: BookOpen },
  { path: "/nutrigenomics", label: "Nutrigenomics", icon: Leaf },
  { path: "/visualizations", label: "3D Lab", icon: Box },
  { path: "/sequences", label: "Sequences", icon: Dna },
  { path: "/notebook", label: "Notebook", icon: FlaskConical },
  { path: "/data-vault", label: "Vault", icon: Database },
];

export const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo with Radar Pulse */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative flex items-center justify-center">
              {/* Radar pulse rings */}
              <div className="radar-ring" />
              <div className="radar-ring radar-ring-delay-1" />
              <div className="radar-ring radar-ring-delay-2" />
              
              {/* Glowing logo */}
              <img 
                src={cyberellumLogo} 
                alt="Cyberellum Technologies Logo" 
                className="w-12 h-12 object-contain logo-glow relative z-10"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Cyberellum Technologies & Laboratory</span>
              <span className="font-semibold text-foreground tracking-tight glow-text">Research Assistant</span>
            </div>
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
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-muted-foreground hover:text-foreground"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden glass-panel border-t border-border/50">
          <div className="px-4 py-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-all ${
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
            <div className="pt-4 border-t border-border">
              <UserMenu />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
