import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface PageBreadcrumbProps {
  items?: BreadcrumbItem[];
  currentPage?: string;
}

const routeLabels: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/library": "Genomics Library",
  "/notebook": "Lab Notebook",
  "/sequences": "Sequences",
  "/visualizations": "3D Visualizations",
  "/nutrigenomics": "Nutrigenomics",
  "/data-vault": "Data Vault",
  "/collaborate": "Collaborate",
  "/axiom-core-validation": "AXIOM Core Validation",
  "/blogs": "Blogs",
  "/about": "About",
  "/terms": "Terms",
  "/privacy": "Privacy",
  "/security": "Security",
  "/api-settings": "API Settings",
  "/settings": "Settings",
  "/auth": "Sign In",
};

const PageBreadcrumb = ({ items, currentPage }: PageBreadcrumbProps) => {
  const location = useLocation();
  const pathname = location.pathname;
  
  // Auto-generate breadcrumb if no items provided
  const breadcrumbItems: BreadcrumbItem[] = items || [];
  const finalPage = currentPage || routeLabels[pathname] || "Page";

  return (
    <Breadcrumb className="mb-6">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link 
              to="/dashboard" 
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Home className="w-4 h-4" />
              <span className="sr-only sm:not-sr-only">Dashboard</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        {breadcrumbItems.map((item, index) => (
          <BreadcrumbItem key={index}>
            <BreadcrumbSeparator>
              <ChevronRight className="w-4 h-4" />
            </BreadcrumbSeparator>
            {item.path ? (
              <BreadcrumbLink asChild>
                <Link 
                  to={item.path}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.label}
                </Link>
              </BreadcrumbLink>
            ) : (
              <BreadcrumbPage>{item.label}</BreadcrumbPage>
            )}
          </BreadcrumbItem>
        ))}
        
        <BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronRight className="w-4 h-4" />
          </BreadcrumbSeparator>
          <BreadcrumbPage className="text-foreground font-medium">
            {finalPage}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default PageBreadcrumb;
