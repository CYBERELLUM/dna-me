import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import GenomicsLibrary from "./pages/GenomicsLibrary";
import LabNotebook from "./pages/LabNotebook";
import DataVault from "./pages/DataVault";
import Sequences from "./pages/Sequences";
import Visualizations3D from "./pages/Visualizations3D";
import NutrigenomicsForecasting from "./pages/NutrigenomicsForecasting";
import VertexValidation from "./pages/VertexValidation";
import Blogs from "./pages/Blogs";
import About from "./pages/About";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Auth from "./pages/Auth";
import Security from "./pages/Security";
import Middleware from "./pages/Middleware";
import Developers from "./pages/Developers";
import Collaborate from "./pages/Collaborate";
import APISettings from "./pages/APISettings";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/dashboard" element={<Index />} />
            <Route path="/security" element={<Security />} />
            <Route path="/api-settings" element={<APISettings />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/library" element={<GenomicsLibrary />} />
            <Route path="/notebook" element={<LabNotebook />} />
            <Route path="/sequences" element={<Sequences />} />
            <Route path="/visualizations" element={<Visualizations3D />} />
            <Route path="/nutrigenomics" element={<NutrigenomicsForecasting />} />
            <Route path="/data-vault" element={<DataVault />} />
            <Route path="/collaborate" element={<Collaborate />} />
            {/* legacy redirect */}
            <Route path="/federated-network" element={<Navigate to="/collaborate" replace />} />
            <Route path="/vertex-validation" element={<VertexValidation />} />
            <Route path="/middleware" element={<Middleware />} />
            <Route path="/developers" element={<Developers />} />
            <Route path="/blogs" element={<Blogs />} />
            <Route path="/about" element={<About />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
