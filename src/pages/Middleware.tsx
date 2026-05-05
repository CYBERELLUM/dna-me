import { Navigation } from "@/components/layout/Navigation";
import { ParallaxSection } from "@/components/layout/ParallaxSection";
import { DNAMatrix } from "@/components/layout/DNAMatrix";
import Footer from "@/components/layout/Footer";
import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import { Link } from "react-router-dom";
import {
  Network,
  Workflow,
  ShieldCheck,
  Cpu,
  Leaf,
  HeartPulse,
  Microscope,
  Satellite,
  ArrowRight,
} from "lucide-react";

const nodeTypes = [
  { icon: HeartPulse, label: "Human Clinics & EHRs", desc: "Clinical records, longitudinal patient data, care protocols." },
  { icon: Microscope, label: "Research Labs", desc: "Genomics pipelines, sequencing outputs, study results." },
  { icon: Cpu, label: "AI / LLM Nodes", desc: "Model endpoints contributing reasoning, synthesis, validation." },
  { icon: Satellite, label: "IoT & Biosensors", desc: "Wearables, environmental sensors, continuous biomarkers." },
  { icon: Leaf, label: "Agri & Veterinary Genomics", desc: "Crop, soil, livestock, and ecosystem genomic systems." },
  { icon: ShieldCheck, label: "Governance Nodes", desc: "Audit, doctrine, and verification authorities." },
];

const Middleware = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DNAMatrix />
      <Navigation />

      <ParallaxSection className="pt-24 pb-16 flex-1">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <PageBreadcrumb currentPage="Interoperability" />

          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full mb-6">
              <Network className="w-4 h-4 text-primary" />
              <span className="text-sm font-mono text-primary">COLLABORATIVE MIDDLEWARE</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              An <span className="text-gradient-primary">Interoperability Fabric</span> for Healing Systems
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              More than a research platform — a collaborative middleware layer that conjoins clinical,
              research, AI, sensor, and ecological systems through a single governed protocol.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <div className="card-scientific text-center">
              <Workflow className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-2">API Concentrator</h3>
              <p className="text-sm text-muted-foreground">
                One contract for ingestion, validation, and routing across heterogeneous endpoints.
              </p>
            </div>
            <div className="card-scientific text-center">
              <ShieldCheck className="w-8 h-8 text-accent mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-2">Governed Exchange</h3>
              <p className="text-sm text-muted-foreground">
                Every signal, doctrine, and insight passes audit, fabrication checks, and verification.
              </p>
            </div>
            <div className="card-scientific text-center">
              <Network className="w-8 h-8 text-science mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-2">Sovereign by Design</h3>
              <p className="text-sm text-muted-foreground">
                Partner nodes retain their data; the fabric coordinates trust, not custody.
              </p>
            </div>
          </div>

          <section className="mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6 text-center">
              Built for More Than Humans
            </h2>
            <p className="text-muted-foreground text-center max-w-3xl mx-auto mb-10">
              Healing is multi-system. Our middleware lets any compliant node — biological, digital,
              or ecological — participate in a shared protocol of evidence and care.
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {nodeTypes.map(({ icon: Icon, label, desc }) => (
                <div key={label} className="glass-panel p-5 rounded-xl border border-border">
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-foreground">{label}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="card-longevity text-center">
            <h2 className="text-2xl font-bold text-foreground mb-3">Integrate Your System</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Start a guided onboarding with our PhD intake AI. Upload your collaboration
              documents and we'll draft your integration contract together.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/collaborate" className="btn-primary inline-flex items-center gap-2">
                Start Partner Onboarding
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/developers" className="inline-flex items-center gap-2 px-6 py-3 rounded-md border border-border text-foreground hover:bg-secondary transition-colors">
                View Developer Surface
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </section>
        </div>
      </ParallaxSection>

      <Footer />
    </div>
  );
};

export default Middleware;
