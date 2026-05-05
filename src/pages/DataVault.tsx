import { Navigation } from "@/components/layout/Navigation";
import { ParallaxSection } from "@/components/layout/ParallaxSection";
import Footer from "@/components/layout/Footer";
import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import { 
  Database, 
  Shield, 
  Lock, 
  Key, 
  Fingerprint, 
  Wallet, 
  Clock,
  Layers,
  Zap,
  Server
} from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Post-Quantum Cryptography (PQC)",
    description: "NIST-approved lattice-based cryptographic algorithms resistant to quantum computing attacks",
  },
  {
    icon: Zap,
    title: "QRNG Integration",
    description: "Quantum Random Number Generation for true randomness in cryptographic key generation",
  },
  {
    icon: Key,
    title: "Post-Quantum Key Distribution (PQKD)",
    description: "Secure key exchange protocols designed for the post-quantum era",
  },
  {
    icon: Lock,
    title: "Advanced Crypto Suite",
    description: "State-of-the-art encryption and decryption with hardware security module support",
  },
  {
    icon: Fingerprint,
    title: "Biometric & 4-Factor Authentication",
    description: "Multi-layered security with biometric verification and 4-factor authentication protocols",
  },
  {
    icon: Wallet,
    title: "MPC Wallet with SSI",
    description: "Multi-Party Computation wallet with Self-Sovereign Identity integration",
  },
  {
    icon: Layers,
    title: "Multi-Signature Custodial Vault",
    description: "Optional multi-sig vault lock for institutional-grade asset protection",
  },
  {
    icon: Server,
    title: "IPFS/DNFT Data Engine",
    description: "Tokenized data ingestion via InterPlanetary File System and Dynamic NFTs",
  },
];

const DataVault = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      
      <ParallaxSection className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <PageBreadcrumb currentPage="Data Vault" />
          
          {/* Header */}
          <div className="text-center mb-16 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/30 rounded-full mb-6">
              <Database className="w-4 h-4 text-accent" />
              <span className="text-sm font-mono text-accent">Secure Infrastructure</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Data <span className="text-gradient-accent">Vault</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-6">
              Connect to Cyberellum Technologies & Laboratory's next-generation 
              IPFS/DNFT tokenized data ingestion engine with quantum-resistant security.
            </p>
            
            {/* Coming Soon Badge */}
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-primary/5 border border-primary/20 rounded-xl">
              <Clock className="w-5 h-5 text-primary animate-pulse" />
              <div className="text-left">
                <p className="text-primary font-semibold">Coming Soon</p>
                <p className="text-xs text-muted-foreground font-mono">First Quarter 2026</p>
              </div>
            </div>
          </div>

          {/* Cyberellum Logo Placeholder */}
          <div className="flex justify-center mb-16">
            <div className="relative">
              <div className="w-48 h-48 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-primary/30 animate-float">
                <div className="text-center">
                  <Database className="w-16 h-16 text-primary mx-auto mb-2" />
                  <p className="font-bold text-foreground">Cyberellum</p>
                  <p className="text-xs text-muted-foreground font-mono">Technologies & Laboratory</p>
                </div>
              </div>
              <div className="absolute inset-0 rounded-full bg-primary/10 blur-3xl -z-10" />
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="card-scientific text-center group"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              );
            })}
          </div>

          {/* Technical Specifications */}
          <div className="card-scientific max-w-4xl mx-auto">
            <h3 className="text-xl font-semibold text-foreground mb-6 text-center">
              Technical Specifications
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="p-4 bg-secondary/50 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground font-mono mb-1">Encryption Standard</p>
                  <p className="text-foreground font-medium">CRYSTALS-Kyber / CRYSTALS-Dilithium</p>
                </div>
                <div className="p-4 bg-secondary/50 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground font-mono mb-1">Key Size</p>
                  <p className="text-foreground font-medium">256-bit AES / 2048-bit PQ Lattice</p>
                </div>
                <div className="p-4 bg-secondary/50 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground font-mono mb-1">Storage Protocol</p>
                  <p className="text-foreground font-medium">IPFS v0.15+ with Filecoin</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-secondary/50 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground font-mono mb-1">Token Standard</p>
                  <p className="text-foreground font-medium">ERC-721A / ERC-6551 Dynamic NFT</p>
                </div>
                <div className="p-4 bg-secondary/50 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground font-mono mb-1">Identity Protocol</p>
                  <p className="text-foreground font-medium">DID:Web / Verifiable Credentials</p>
                </div>
                <div className="p-4 bg-secondary/50 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground font-mono mb-1">Consensus</p>
                  <p className="text-foreground font-medium">Threshold Signature Scheme (TSS)</p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-8 pt-6 border-t border-border text-center">
              <p className="text-muted-foreground mb-4">
                Interested in early access to the Data Vault?
              </p>
              <button className="btn-secondary" disabled>
                <Lock className="w-4 h-4 mr-2" />
                Join Waitlist (Coming Q3 2026)
              </button>
            </div>
          </div>
        </div>
      </ParallaxSection>
      <Footer />
    </div>
  );
};

export default DataVault;
