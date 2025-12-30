import { useState } from "react";
import { Navigation } from "@/components/layout/Navigation";
import { ParallaxSection } from "@/components/layout/ParallaxSection";
import { DNAMatrix } from "@/components/layout/DNAMatrix";
import Footer from "@/components/layout/Footer";
import { 
  Globe, 
  Database, 
  Server, 
  Link2, 
  ExternalLink, 
  Newspaper, 
  BookOpen,
  Activity,
  Users,
  Shield,
  Zap
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Repository {
  name: string;
  url: string;
  description: string;
  type: "genomics" | "protein" | "clinical" | "literature";
  status: "online" | "syncing" | "offline";
  records?: string;
  region?: string;
}

interface NewsItem {
  title: string;
  source: string;
  date: string;
  url: string;
  category: "research" | "clinical" | "technology";
}

const repositories: Repository[] = [
  { name: "NCBI GenBank", url: "https://www.ncbi.nlm.nih.gov/genbank/", description: "NIH genetic sequence database", type: "genomics", status: "online", records: "240M+", region: "USA" },
  { name: "Ensembl", url: "https://www.ensembl.org/", description: "Genome browser for vertebrate genomes", type: "genomics", status: "online", records: "50K+", region: "EU" },
  { name: "UCSC Genome Browser", url: "https://genome.ucsc.edu/", description: "Reference genome sequences", type: "genomics", status: "online", records: "100+", region: "USA" },
  { name: "UniProt", url: "https://www.uniprot.org/", description: "Protein sequence and function database", type: "protein", status: "online", records: "250M+", region: "Global" },
  { name: "PDB", url: "https://www.rcsb.org/", description: "3D structural data of biological molecules", type: "protein", status: "online", records: "200K+", region: "USA" },
  { name: "AlphaFold DB", url: "https://alphafold.ebi.ac.uk/", description: "AI-predicted protein structures", type: "protein", status: "syncing", records: "200M+", region: "EU" },
  { name: "ClinVar", url: "https://www.ncbi.nlm.nih.gov/clinvar/", description: "Clinical variant interpretations", type: "clinical", status: "online", records: "2M+", region: "USA" },
  { name: "GWAS Catalog", url: "https://www.ebi.ac.uk/gwas/", description: "Genome-wide association studies", type: "clinical", status: "online", records: "500K+", region: "EU" },
  { name: "dbGaP", url: "https://www.ncbi.nlm.nih.gov/gap/", description: "Genotype-phenotype database", type: "clinical", status: "online", records: "1M+", region: "USA" },
  { name: "PubMed", url: "https://pubmed.ncbi.nlm.nih.gov/", description: "Biomedical literature database", type: "literature", status: "online", records: "35M+", region: "USA" },
  { name: "Europe PMC", url: "https://europepmc.org/", description: "Life sciences literature", type: "literature", status: "online", records: "43M+", region: "EU" },
  { name: "bioRxiv", url: "https://www.biorxiv.org/", description: "Biology preprint server", type: "literature", status: "syncing", records: "200K+", region: "USA" },
];

const newsItems: NewsItem[] = [
  { title: "CRISPR-Cas9 breakthrough enables precise single-base editing in human cells", source: "Nature", date: "2024-01-15", url: "#", category: "research" },
  { title: "FDA approves new gene therapy for inherited retinal disease", source: "FDA News", date: "2024-01-12", url: "#", category: "clinical" },
  { title: "AlphaFold 3 predicts protein interactions with unprecedented accuracy", source: "DeepMind", date: "2024-01-10", url: "#", category: "technology" },
  { title: "Epigenetic clocks show promise in measuring biological age interventions", source: "Cell", date: "2024-01-08", url: "#", category: "research" },
  { title: "New longevity gene variants discovered in centenarian study", source: "Science", date: "2024-01-05", url: "#", category: "research" },
  { title: "Multi-omics integration reveals new cancer biomarkers", source: "JAMA Oncology", date: "2024-01-03", url: "#", category: "clinical" },
];

const FederatedNetwork = () => {
  const [selectedType, setSelectedType] = useState<string>("all");

  const filteredRepos = selectedType === "all" 
    ? repositories 
    : repositories.filter(r => r.type === selectedType);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online": return "bg-green-500";
      case "syncing": return "bg-yellow-500 animate-pulse";
      case "offline": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "genomics": return <Database className="w-4 h-4" />;
      case "protein": return <Server className="w-4 h-4" />;
      case "clinical": return <Activity className="w-4 h-4" />;
      case "literature": return <BookOpen className="w-4 h-4" />;
      default: return <Globe className="w-4 h-4" />;
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "research": return <Badge variant="default" className="bg-primary/20 text-primary border-primary/30">Research</Badge>;
      case "clinical": return <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">Clinical</Badge>;
      case "technology": return <Badge variant="default" className="bg-purple-500/20 text-purple-400 border-purple-500/30">Technology</Badge>;
      default: return <Badge variant="secondary">General</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DNAMatrix />
      <Navigation />

      <ParallaxSection className="pt-24 pb-16 flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full mb-6">
              <Globe className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-sm font-mono text-primary">FEDERATED DATA NETWORK</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Global <span className="text-gradient-primary">Repository</span> Network
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Access genomics, proteomics, and clinical data from federated repositories worldwide.
              Real-time synchronization with major biological databases.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <div className="card-scientific text-center">
              <div className="text-3xl font-bold text-primary mb-1">{repositories.length}</div>
              <div className="text-sm text-muted-foreground">Connected Repos</div>
            </div>
            <div className="card-scientific text-center">
              <div className="text-3xl font-bold text-green-400 mb-1">
                {repositories.filter(r => r.status === "online").length}
              </div>
              <div className="text-sm text-muted-foreground">Online</div>
            </div>
            <div className="card-scientific text-center">
              <div className="text-3xl font-bold text-accent mb-1">500B+</div>
              <div className="text-sm text-muted-foreground">Total Records</div>
            </div>
            <div className="card-scientific text-center">
              <div className="text-3xl font-bold text-science mb-1">5</div>
              <div className="text-sm text-muted-foreground">Regions</div>
            </div>
          </div>

          <Tabs defaultValue="repositories" className="space-y-8">
            <TabsList className="grid grid-cols-3 max-w-md mx-auto">
              <TabsTrigger value="repositories" className="gap-2">
                <Database className="w-4 h-4" />
                Repositories
              </TabsTrigger>
              <TabsTrigger value="news" className="gap-2">
                <Newspaper className="w-4 h-4" />
                News
              </TabsTrigger>
              <TabsTrigger value="network" className="gap-2">
                <Link2 className="w-4 h-4" />
                Network
              </TabsTrigger>
            </TabsList>

            {/* Repositories Tab */}
            <TabsContent value="repositories">
              {/* Filter */}
              <div className="flex flex-wrap gap-2 mb-6">
                <Button
                  variant={selectedType === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType("all")}
                >
                  All
                </Button>
                <Button
                  variant={selectedType === "genomics" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType("genomics")}
                  className="gap-2"
                >
                  <Database className="w-3 h-3" /> Genomics
                </Button>
                <Button
                  variant={selectedType === "protein" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType("protein")}
                  className="gap-2"
                >
                  <Server className="w-3 h-3" /> Protein
                </Button>
                <Button
                  variant={selectedType === "clinical" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType("clinical")}
                  className="gap-2"
                >
                  <Activity className="w-3 h-3" /> Clinical
                </Button>
                <Button
                  variant={selectedType === "literature" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType("literature")}
                  className="gap-2"
                >
                  <BookOpen className="w-3 h-3" /> Literature
                </Button>
              </div>

              {/* Repository Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRepos.map((repo) => (
                  <a
                    key={repo.name}
                    href={repo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="card-scientific hover:border-primary/50 transition-all group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          {getTypeIcon(repo.type)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {repo.name}
                          </h3>
                          <span className="text-xs text-muted-foreground">{repo.region}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${getStatusColor(repo.status)}`} />
                        <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{repo.description}</p>
                    <div className="flex items-center justify-between text-xs">
                      <Badge variant="secondary" className="capitalize">{repo.type}</Badge>
                      {repo.records && <span className="text-muted-foreground">{repo.records} records</span>}
                    </div>
                  </a>
                ))}
              </div>
            </TabsContent>

            {/* News Tab */}
            <TabsContent value="news">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Newspaper className="w-5 h-5 text-primary" />
                  Latest in Genomics & Longevity Research
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {newsItems.map((item, index) => (
                    <a
                      key={index}
                      href={item.url}
                      className="card-scientific hover:border-primary/50 transition-all group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        {getCategoryBadge(item.category)}
                        <span className="text-xs text-muted-foreground">{item.date}</span>
                      </div>
                      <h4 className="font-medium text-foreground group-hover:text-primary transition-colors mb-2 line-clamp-2">
                        {item.title}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{item.source}</span>
                        <ExternalLink className="w-3 h-3" />
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Network Tab */}
            <TabsContent value="network">
              <div className="card-scientific p-8">
                <h3 className="text-lg font-semibold text-foreground mb-6 text-center">
                  Federated Network Topology
                </h3>
                
                {/* Network Visualization */}
                <div className="relative h-[400px] bg-secondary/20 rounded-xl border border-border overflow-hidden">
                  {/* Central Node */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
                    <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center animate-pulse">
                      <Globe className="w-8 h-8 text-primary" />
                    </div>
                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                      <span className="text-xs font-mono text-primary">CYBERELLUM HUB</span>
                    </div>
                  </div>

                  {/* Orbiting Nodes */}
                  {["NCBI", "Ensembl", "UniProt", "PDB", "PubMed", "ClinVar"].map((name, i) => {
                    const angle = (i * 60) * (Math.PI / 180);
                    const radius = 140;
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;
                    
                    return (
                      <div
                        key={name}
                        className="absolute top-1/2 left-1/2 z-10"
                        style={{ transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` }}
                      >
                        <div className="w-12 h-12 rounded-full bg-secondary border border-border flex items-center justify-center hover:border-primary transition-colors cursor-pointer">
                          <Database className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                          <span className="text-[10px] font-mono text-muted-foreground">{name}</span>
                        </div>
                        {/* Connection Line */}
                        <svg
                          className="absolute top-1/2 left-1/2 pointer-events-none"
                          style={{
                            width: Math.abs(x) + 10,
                            height: Math.abs(y) + 10,
                            transform: `translate(${x > 0 ? -x : 0}px, ${y > 0 ? -y : 0}px)`
                          }}
                        >
                          <line
                            x1={x > 0 ? x : 0}
                            y1={y > 0 ? y : 0}
                            x2={x > 0 ? 0 : Math.abs(x)}
                            y2={y > 0 ? 0 : Math.abs(y)}
                            stroke="hsl(var(--primary) / 0.3)"
                            strokeWidth="1"
                            strokeDasharray="4 2"
                          />
                        </svg>
                      </div>
                    );
                  })}

                  {/* Data Flow Particles */}
                  <div className="absolute inset-0 overflow-hidden">
                    {[...Array(6)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-1 h-1 bg-primary rounded-full animate-ping"
                        style={{
                          top: `${30 + Math.random() * 40}%`,
                          left: `${30 + Math.random() * 40}%`,
                          animationDelay: `${i * 0.5}s`,
                          animationDuration: "2s"
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Network Stats */}
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="text-center p-4 bg-secondary/30 rounded-lg">
                    <Users className="w-5 h-5 text-primary mx-auto mb-2" />
                    <div className="text-sm font-semibold text-foreground">12 Nodes</div>
                    <div className="text-xs text-muted-foreground">Connected</div>
                  </div>
                  <div className="text-center p-4 bg-secondary/30 rounded-lg">
                    <Zap className="w-5 h-5 text-yellow-400 mx-auto mb-2" />
                    <div className="text-sm font-semibold text-foreground">45ms</div>
                    <div className="text-xs text-muted-foreground">Avg Latency</div>
                  </div>
                  <div className="text-center p-4 bg-secondary/30 rounded-lg">
                    <Shield className="w-5 h-5 text-green-400 mx-auto mb-2" />
                    <div className="text-sm font-semibold text-foreground">256-bit</div>
                    <div className="text-xs text-muted-foreground">Encryption</div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </ParallaxSection>

      <Footer />
    </div>
  );
};

export default FederatedNetwork;
