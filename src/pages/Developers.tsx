import { Navigation } from "@/components/layout/Navigation";
import { ParallaxSection } from "@/components/layout/ParallaxSection";
import { DNAMatrix } from "@/components/layout/DNAMatrix";
import Footer from "@/components/layout/Footer";
import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import { Code2, Inbox, Download, ShieldCheck, GitBranch } from "lucide-react";

const endpoints = [
  {
    icon: Inbox,
    name: "federation-receiver",
    purpose: "Inbound channel for doctrines, directives, and signals from partner nodes.",
    method: "POST",
  },
  {
    icon: Download,
    name: "federated-pull",
    purpose: "Retrieve curated datasets, doctrines, and synchronized state from the fabric.",
    method: "POST",
  },
  {
    icon: GitBranch,
    name: "federated-query",
    purpose: "Read-only query surface against allow-listed federated tables, capped and audited.",
    method: "POST",
  },
  {
    icon: ShieldCheck,
    name: "vertex-verify",
    purpose: "Authenticity and fabrication audit for participating nodes and submitted payloads.",
    method: "POST",
  },
];

const Developers = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DNAMatrix />
      <Navigation />

      <ParallaxSection className="pt-24 pb-16 flex-1">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <PageBreadcrumb currentPage="Developers" />

          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full mb-6">
              <Code2 className="w-4 h-4 text-primary" />
              <span className="text-sm font-mono text-primary">DEVELOPER SURFACE</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              The <span className="text-gradient-primary">Public Middleware Contract</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              A small set of governed endpoints lets any platform or healing protocol participate
              in the federation as a first-class node.
            </p>
          </div>

          <section className="space-y-4 mb-16">
            {endpoints.map(({ icon: Icon, name, purpose, method }) => (
              <div key={name} className="glass-panel p-6 rounded-xl border border-border">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <code className="font-mono text-foreground">{name}</code>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-secondary text-muted-foreground border border-border">
                        {method}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{purpose}</p>
                  </div>
                </div>
              </div>
            ))}
          </section>

          <section className="card-scientific">
            <h2 className="text-2xl font-bold text-foreground mb-3">Governance Guarantees</h2>
            <ul className="space-y-2 text-muted-foreground text-sm list-disc pl-5">
              <li>Every inbound payload is audit-logged with source, validation status, and processing time.</li>
              <li>Fabrication detection runs on submitted doctrines and signals before they propagate.</li>
              <li>Authenticity of nodes is continuously re-verified through the vertex audit channel.</li>
              <li>Reads are constrained to an allow-list of federated tables and capped result sizes.</li>
              <li>Sovereign nodes retain custody of raw data; the fabric coordinates trust and routing.</li>
            </ul>
          </section>
        </div>
      </ParallaxSection>

      <Footer />
    </div>
  );
};

export default Developers;
