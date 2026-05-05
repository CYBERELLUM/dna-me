import { Link } from "react-router-dom";
import { DNAMatrix } from "@/components/layout/DNAMatrix";
import Footer from "@/components/layout/Footer";
import { Sparkles, Zap, Globe, Shield, ArrowRight, Dna, FlaskConical, Microscope, Brain } from "lucide-react";
import cyberellumLogo from "@/assets/cyberellum-logo.png";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background relative flex flex-col">
      <DNAMatrix />
      
      {/* Header */}
      <header className="relative z-10 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={cyberellumLogo} alt="Cyberellum" className="w-10 h-10 object-contain" />
            <span className="text-lg font-bold text-foreground">Cyberellum Genomics</span>
          </div>
          <Link
            to="/dashboard"
            className="btn-primary flex items-center gap-2 px-6 py-2"
          >
            Enter Platform
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 relative z-10">
        <section className="pt-20 pb-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-mono text-primary">AI-Powered Genomics Research</span>
            </div>
            
            <div className="mb-4">
              <span className="text-lg md:text-xl font-mono text-primary/80 uppercase tracking-[0.3em]">
                Cyberellum Technologies & Laboratory
              </span>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6">
              Precision Health <span className="text-gradient-primary">Innovation</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
              From ancient wisdom to scientific breakthroughs in genetics and cellular biology. 
              Our 25-year journey of longitudinal studies has yielded critical discoveries in DNA damage repair science.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link
                to="/dashboard"
                className="btn-primary flex items-center gap-2 px-8 py-3 text-lg"
              >
                Get Started
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            {/* Feature Badges */}
            <div className="flex flex-wrap justify-center gap-4">
              {[
                { icon: Zap, label: "Multi-AI Synthesis" },
                { icon: Globe, label: "Global Research Sources" },
                { icon: Shield, label: "Secure Data Vault" },
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
          </div>
        </section>

        {/* DNA Video Section */}
        <section className="relative w-full overflow-hidden">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-auto object-cover"
            style={{ maxHeight: "400px" }}
          >
            <source src="/videos/dna-animation.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background pointer-events-none" />
        </section>

        {/* Features Section */}
        <section className="py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-4">
              Research Platform Features
            </h2>
            <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-16">
              Comprehensive tools for genomics research, nutrigenomics forecasting, and scientific discovery.
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: Brain,
                  title: "Genomics Oracle & Collaboration Lab",
                  description: "Multi-AI synthesis with citations from global research sources"
                },
                {
                  icon: Dna,
                  title: "3D Visualizations",
                  description: "Interactive DNA helix, protein viewers, and chromosome browsers"
                },
                {
                  icon: FlaskConical,
                  title: "Nutrigenomics",
                  description: "Gene-nutrient interaction analysis and cellular aging simulations"
                },
                {
                  icon: Microscope,
                  title: "Sequence Analysis",
                  description: "Upload and analyze DNA, RNA, and protein sequences"
                },
              ].map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="glass-panel p-6 rounded-xl border border-border hover:border-primary/50 transition-colors"
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Middleware Positioning Section */}
        <section className="py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full mb-4">
                <Globe className="w-4 h-4 text-primary" />
                <span className="text-sm font-mono text-primary">COLLABORATIVE MIDDLEWARE</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                A Fabric for Healing Systems — Not Just Humans
              </h2>
              <p className="text-muted-foreground max-w-3xl mx-auto">
                Beyond a research tool, the platform acts as an API concentrator and governed
                gateway that conjoins clinical, research, AI, sensor, and ecological systems
                into one interoperable protocol.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-10">
              <div className="glass-panel p-6 rounded-xl border border-border">
                <h3 className="font-semibold text-foreground mb-2">API Concentrator</h3>
                <p className="text-sm text-muted-foreground">
                  One contract for ingestion, validation, and routing across heterogeneous endpoints
                  and partner platforms.
                </p>
              </div>
              <div className="glass-panel p-6 rounded-xl border border-border">
                <h3 className="font-semibold text-foreground mb-2">Governed Exchange</h3>
                <p className="text-sm text-muted-foreground">
                  Every signal, protocol, and insight passes audit, fabrication checks, and
                  authenticity verification before it propagates.
                </p>
              </div>
              <div className="glass-panel p-6 rounded-xl border border-border">
                <h3 className="font-semibold text-foreground mb-2">Sovereign by Design</h3>
                <p className="text-sm text-muted-foreground">
                  Partners retain custody of their data. The fabric coordinates trust and
                  routing — not ownership.
                </p>
              </div>
              <div className="glass-panel p-6 rounded-xl border border-border">
                <h3 className="font-semibold text-foreground mb-2">Built for Many Systems</h3>
                <p className="text-sm text-muted-foreground">
                  Human clinics, research labs, AI nodes, IoT biosensors, agricultural and
                  veterinary genomics — all first-class participants.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/collaborate" className="btn-primary inline-flex items-center gap-2 px-6 py-3">
                Start Partner Onboarding
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/middleware"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-md border border-border text-foreground hover:bg-secondary transition-colors"
              >
                Explore the Fabric
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/developers"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-md border border-border text-foreground hover:bg-secondary transition-colors"
              >
                Developer Surface
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 bg-secondary/30">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Ready to Begin Your Research?
            </h2>
            <p className="text-muted-foreground mb-8">
              Sign in to access the full suite of genomics research tools and AI-powered analysis.
            </p>
            <Link
              to="/dashboard"
              className="btn-primary inline-flex items-center gap-2 px-8 py-3 text-lg"
            >
              Access Platform
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Landing;
