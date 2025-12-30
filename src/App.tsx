import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import GenomicsLibrary from "./pages/GenomicsLibrary";
import LabNotebook from "./pages/LabNotebook";
import DataVault from "./pages/DataVault";
import Sequences from "./pages/Sequences";
import Auth from "./pages/Auth";
import Security from "./pages/Security";
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
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/security" element={<Security />} />
            <Route path="/library" element={<GenomicsLibrary />} />
            <Route path="/notebook" element={<LabNotebook />} />
            <Route path="/sequences" element={<Sequences />} />
            <Route path="/data-vault" element={<DataVault />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
