import { Navigation } from "@/components/layout/Navigation";
import { ParallaxSection } from "@/components/layout/ParallaxSection";
import { DNAMatrix } from "@/components/layout/DNAMatrix";
import Footer from "@/components/layout/Footer";
import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import { Users, Target, Lightbulb, Shield, Globe, Dna } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DNAMatrix />
      <Navigation />

      <ParallaxSection className="pt-24 pb-16 flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <PageBreadcrumb currentPage="About" />
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full mb-6">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-sm font-mono text-primary">ABOUT US</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Cyberellum <span className="text-gradient-primary">Technologies</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Pioneering the future of genomics research and longevity science.
            </p>
          </div>

          <div className="space-y-12">
            {/* Mission */}
            <div className="card-longevity">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Our Mission</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                At Cyberellum Technologies & Laboratory, we are dedicated to accelerating scientific discovery 
                through cutting-edge AI and advanced genomics research. Our mission is to democratize access 
                to powerful research tools, enabling scientists worldwide to unlock the secrets of human health 
                and longevity.
              </p>
            </div>

            {/* Vision */}
            <div className="card-scientific">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                  <Lightbulb className="w-6 h-6 text-accent" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Our Vision</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                We envision a future where personalized medicine is the norm, where genetic insights guide 
                preventive healthcare, and where the boundaries of human healthspan are continually extended. 
                Through collaborative partner networks and AI-powered analysis, we're building the infrastructure 
                for this future today.
              </p>
            </div>

            {/* Values */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card-scientific text-center">
                <Shield className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-2">Security First</h3>
                <p className="text-sm text-muted-foreground">
                  Protecting sensitive genomic data with enterprise-grade security and privacy protocols.
                </p>
              </div>
              <div className="card-scientific text-center">
                <Globe className="w-8 h-8 text-science mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-2">Global Collaboration</h3>
                <p className="text-sm text-muted-foreground">
                  Connecting researchers across borders through a collaborative partner network.
                </p>
              </div>
              <div className="card-scientific text-center">
                <Dna className="w-8 h-8 text-accent mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-2">Scientific Rigor</h3>
                <p className="text-sm text-muted-foreground">
                  Committed to accuracy, reproducibility, and evidence-based research.
                </p>
              </div>
            </div>

            {/* Contact */}
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Interested in collaborating or learning more about our research?
              </p>
              <a 
                href="mailto:research@cyberellum.com" 
                className="btn-primary inline-flex items-center gap-2"
              >
                Contact Our Team
              </a>
            </div>
          </div>
        </div>
      </ParallaxSection>

      <Footer />
    </div>
  );
};

export default About;
