import { Navigation } from "@/components/layout/Navigation";
import { ParallaxSection } from "@/components/layout/ParallaxSection";
import { DNAMatrix } from "@/components/layout/DNAMatrix";
import { ChatInterface } from "@/components/research/ChatInterface";
import { AIProviderConfig } from "@/components/research/AIProviderConfig";
import Footer from "@/components/layout/Footer";
import { Sparkles, Zap, Globe, Shield } from "lucide-react";
import cyberellumLogo from "@/assets/cyberellum-logo.png";

const Index = () => {
  return (
    <div className="min-h-screen bg-background relative flex flex-col">
      <DNAMatrix />
      <Navigation />
      
      <ParallaxSection className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Large Logo on the Left */}
          <div className="fixed left-4 lg:left-8 top-1/2 -translate-y-1/2 z-10 hidden lg:block">
            <div className="relative flex items-center justify-center">
              {/* Radar pulse rings */}
              <div className="absolute w-48 h-48 rounded-full border border-primary/30 animate-ping" style={{ animationDuration: '3s' }} />
              <div className="absolute w-40 h-40 rounded-full border border-primary/20 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
              <div className="absolute w-32 h-32 rounded-full border border-primary/10 animate-ping" style={{ animationDuration: '2s', animationDelay: '1s' }} />
              
              {/* Glow background */}
              <div className="absolute w-36 h-36 bg-primary/10 rounded-full blur-3xl animate-pulse" />
              
              {/* Logo */}
              <img 
                src={cyberellumLogo} 
                alt="Cyberellum Logo" 
                className="w-28 h-28 object-contain logo-glow relative z-10"
              />
            </div>
            <div className="text-center mt-4">
              <span className="text-xs font-mono text-primary/70 uppercase tracking-widest">Cyberellum</span>
            </div>
          </div>

          {/* Hero Section */}
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-mono text-primary">Multi-AI Research Platform</span>
            </div>
            <div className="mb-2">
              <span className="text-lg md:text-xl font-mono text-primary/80 uppercase tracking-[0.3em]">Cyberellum Technologies & Laboratory</span>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-4">
              Research <span className="text-gradient-primary">Assistant</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Your AI-powered concierge for genomics research. Query multiple AI providers simultaneously 
              for comprehensive research synthesis and analysis.
            </p>
          </div>

          {/* Feature Badges */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {[
              { icon: Zap, label: "Multi-AI Routing" },
              { icon: Globe, label: "Global Sources" },
              { icon: Shield, label: "Secure Access" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 px-4 py-2 bg-secondary border border-border rounded-lg"
              >
                <Icon className="w-4 h-4 text-primary" />
                <span className="text-sm text-foreground">{label}</span>
              </div>
            ))}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Chat Interface */}
            <div className="lg:col-span-1">
              <ChatInterface />
            </div>

            {/* Configuration Panel */}
            <div className="lg:col-span-1">
              <AIProviderConfig />
            </div>
          </div>
        </div>
      </ParallaxSection>
      <Footer />
    </div>
  );
};

export default Index;
