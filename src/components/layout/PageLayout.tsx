import { ReactNode } from "react";
import Footer from "./Footer";
import { Navigation } from "./Navigation";

interface PageLayoutProps {
  children: ReactNode;
}

const PageLayout = ({ children }: PageLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <div className="flex-1">
        {children}
      </div>
      <Footer />
    </div>
  );
};

export default PageLayout;
