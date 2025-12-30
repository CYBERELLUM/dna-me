import { Navigation } from "@/components/layout/Navigation";
import { ParallaxSection } from "@/components/layout/ParallaxSection";
import Footer from "@/components/layout/Footer";
import { useState, Suspense } from "react";
import { Dna, Box, Layers, Loader2, Scissors, Clock, Sparkles, FlaskConical } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

// Lazy load heavy 3D components
import DNAHelix3D from "@/components/visualizations/DNAHelix3D";
import ProteinViewer3D from "@/components/visualizations/ProteinViewer3D";
import ChromosomeBrowser3D from "@/components/visualizations/ChromosomeBrowser3D";
import CRISPREditor3D from "@/components/visualizations/CRISPREditor3D";
import EpigeneticProjection3D from "@/components/visualizations/EpigeneticProjection3D";

const tabs = [
  { id: "crispr", label: "CRISPR Editor", icon: Scissors, badge: "NEW" },
  { id: "epigenetic", label: "Epigenetic Projection", icon: Clock, badge: "NEW" },
  { id: "dna", label: "DNA Helix", icon: Dna },
  { id: "protein", label: "Protein Structure", icon: Box },
  { id: "chromosome", label: "Chromosome Browser", icon: Layers },
];

const Loader = () => (
  <div className="w-full h-[500px] bg-secondary/30 rounded-lg flex items-center justify-center">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

const Visualizations3D = () => {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"dna" | "protein" | "chromosome" | "crispr" | "epigenetic">("crispr");
  const [dnaSequence, setDnaSequence] = useState("ATGCGATCGATCGATCGATCGATCGATCGA");
  const [proteinSequence, setProteinSequence] = useState("MKTAYIAKQRQISFVKSHFSRQLEERLGLIEVQAPILSRVGDGTQDNLSGAEKAVQVKVKALPDAQFEVVHSLAKWKRQQIA");
  const [autoRotate, setAutoRotate] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  
  // CRISPR controls
  const [crisprSequence, setCrisprSequence] = useState("ATGCGATCGATCGATCGATCGATCGATCGATCGATCGA");
  const [targetSite, setTargetSite] = useState(10);
  const [editMode, setEditMode] = useState<"cut" | "insert" | "replace">("cut");
  const [isEditing, setIsEditing] = useState(false);

  // Epigenetic controls
  const [projectionYears, setProjectionYears] = useState(10);
  const [showProjection, setShowProjection] = useState(true);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <ParallaxSection className="pt-24 pb-16">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <Box className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-foreground mb-4">3D Visualizations</h1>
            <p className="text-muted-foreground">Please sign in to access 3D visualization tools.</p>
          </div>
        </ParallaxSection>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />

      <ParallaxSection className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full mb-6">
              <FlaskConical className="w-4 h-4 text-primary" />
              <span className="text-sm font-mono text-primary">LONGEVITY BIOTECH LAB</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              3D <span className="text-gradient-longevity">Visualizations</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Explore CRISPR gene editing, epigenetic age projections, DNA structures, 
              and protein folds. Run experimental simulations based on your research data.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                    activeTab === tab.id
                      ? "bg-primary/10 border-primary/30 text-primary"
                      : "bg-secondary/50 border-border text-muted-foreground hover:text-foreground hover:border-primary/20"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  {tab.badge && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-primary text-primary-foreground rounded">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Controls */}
          <div className="card-scientific mb-8">
            <div className="flex flex-wrap gap-6 items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRotate}
                  onChange={(e) => setAutoRotate(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-sm text-foreground">Auto-rotate</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showLabels}
                  onChange={(e) => setShowLabels(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-sm text-foreground">Show labels</span>
              </label>

              {/* CRISPR Controls */}
              {activeTab === "crispr" && (
                <>
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs text-muted-foreground mb-1 font-mono">Target DNA Sequence</label>
                    <input
                      type="text"
                      value={crisprSequence}
                      onChange={(e) => setCrisprSequence(e.target.value.toUpperCase().replace(/[^ATGC]/g, ""))}
                      className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-md text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder="Enter target DNA sequence"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Edit Mode:</span>
                    {(["cut", "insert", "replace"] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setEditMode(mode)}
                        className={`px-3 py-1 text-xs rounded-md transition-all ${
                          editMode === mode 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-secondary text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {mode.charAt(0).toUpperCase() + mode.slice(1)}
                      </button>
                    ))}
                  </div>

                  <Button 
                    onClick={() => setIsEditing(!isEditing)}
                    variant={isEditing ? "destructive" : "default"}
                    size="sm"
                  >
                    <Scissors className="w-4 h-4 mr-2" />
                    {isEditing ? "Stop Editing" : "Start Edit"}
                  </Button>
                </>
              )}

              {/* Epigenetic Controls */}
              {activeTab === "epigenetic" && (
                <>
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs text-muted-foreground mb-2 font-mono">
                      Projection: {projectionYears} years
                    </label>
                    <Slider
                      value={[projectionYears]}
                      onValueChange={(value) => setProjectionYears(value[0])}
                      min={1}
                      max={30}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showProjection}
                      onChange={(e) => setShowProjection(e.target.checked)}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-foreground">Show Projection Timeline</span>
                  </label>
                </>
              )}

              {activeTab === "dna" && (
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs text-muted-foreground mb-1 font-mono">DNA Sequence</label>
                  <input
                    type="text"
                    value={dnaSequence}
                    onChange={(e) => setDnaSequence(e.target.value.toUpperCase().replace(/[^ATGC]/g, ""))}
                    className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-md text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="Enter DNA sequence (A, T, G, C)"
                  />
                </div>
              )}

              {activeTab === "protein" && (
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs text-muted-foreground mb-1 font-mono">Protein Sequence</label>
                  <input
                    type="text"
                    value={proteinSequence}
                    onChange={(e) => setProteinSequence(e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))}
                    className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-md text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="Enter amino acid sequence"
                  />
                </div>
              )}
            </div>
          </div>

          {/* 3D Viewer */}
          <div className="card-scientific">
            <Suspense fallback={<Loader />}>
              {activeTab === "crispr" && (
                <div>
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Scissors className="w-5 h-5 text-primary" />
                    CRISPR-Cas9 Gene Editing Simulation
                    <span className="epigenetic-badge">EXPERIMENTAL</span>
                  </h3>
                  <CRISPREditor3D 
                    sequence={crisprSequence} 
                    targetSite={targetSite}
                    autoRotate={autoRotate} 
                    editMode={editMode}
                    isEditing={isEditing}
                  />
                  <div className="mt-4 p-4 bg-secondary/30 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">
                      <strong className="text-foreground">Cas9 Protein:</strong> The molecular scissors that cuts DNA at specific locations guided by gRNA.
                    </p>
                    <p className="text-sm text-muted-foreground mb-2">
                      <strong className="text-foreground">Guide RNA (gRNA):</strong> Orange helix structure that directs Cas9 to the target sequence.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong className="text-foreground">Target Site:</strong> Purple highlighted region shows the 20bp guide sequence where editing occurs.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === "epigenetic" && (
                <div>
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-accent" />
                    Epigenetic Age Projection
                    <span className="longevity-badge">LONGEVITY</span>
                  </h3>
                  <EpigeneticProjection3D 
                    projectionYears={projectionYears}
                    showProjection={showProjection}
                    autoRotate={autoRotate}
                  />
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-secondary/30 rounded-lg">
                      <h4 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        Unmethylated Sites
                      </h4>
                      <p className="text-xs text-muted-foreground">Lower methylation = younger biological age</p>
                    </div>
                    <div className="p-4 bg-secondary/30 rounded-lg">
                      <h4 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        Methylated Sites
                      </h4>
                      <p className="text-xs text-muted-foreground">Higher methylation = aging biomarker</p>
                    </div>
                    <div className="p-4 bg-secondary/30 rounded-lg">
                      <h4 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                        Projected Changes
                      </h4>
                      <p className="text-xs text-muted-foreground">Forecasted methylation based on current trends</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "dna" && (
                <div>
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Dna className="w-5 h-5 text-primary" />
                    DNA Double Helix
                  </h3>
                  <DNAHelix3D sequence={dnaSequence} autoRotate={autoRotate} showLabels={showLabels} />
                  <p className="mt-4 text-sm text-muted-foreground">
                    Showing {Math.min(dnaSequence.length, 30)} base pairs. Drag to rotate, scroll to zoom.
                  </p>
                </div>
              )}

              {activeTab === "protein" && (
                <div>
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Box className="w-5 h-5 text-primary" />
                    Protein Structure
                  </h3>
                  <ProteinViewer3D sequence={proteinSequence} autoRotate={autoRotate} />
                  <p className="mt-4 text-sm text-muted-foreground">
                    Showing {Math.min(proteinSequence.length, 100)} residues. Choose view mode and color scheme above.
                  </p>
                </div>
              )}

              {activeTab === "chromosome" && (
                <div>
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-primary" />
                    Human Chromosome Browser
                  </h3>
                  <ChromosomeBrowser3D autoRotate={autoRotate} showLabels={showLabels} />
                  <p className="mt-4 text-sm text-muted-foreground">
                    Showing all 24 human chromosomes (1-22, X, Y). Click to select and view details.
                  </p>
                </div>
              )}
            </Suspense>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-8">
            <div className="card-longevity text-center">
              <Scissors className="w-8 h-8 text-primary mx-auto mb-3" />
              <h4 className="font-medium text-foreground mb-2">CRISPR Editor</h4>
              <p className="text-xs text-muted-foreground">
                Simulate Cas9 gene editing with real-time visualization of cut, insert, and replace operations.
              </p>
            </div>
            <div className="card-longevity text-center">
              <Clock className="w-8 h-8 text-accent mx-auto mb-3" />
              <h4 className="font-medium text-foreground mb-2">Epigenetic Clock</h4>
              <p className="text-xs text-muted-foreground">
                Visualize biological vs chronological age and project future methylation changes.
              </p>
            </div>
            <div className="card-scientific text-center">
              <Dna className="w-8 h-8 text-primary mx-auto mb-3" />
              <h4 className="font-medium text-foreground mb-2">DNA Helix</h4>
              <p className="text-xs text-muted-foreground">
                Color-coded base pairs (A-T, G-C) in the iconic double helix structure.
              </p>
            </div>
            <div className="card-scientific text-center">
              <Box className="w-8 h-8 text-primary mx-auto mb-3" />
              <h4 className="font-medium text-foreground mb-2">Protein Viewer</h4>
              <p className="text-xs text-muted-foreground">
                Explore protein folding with ribbon, sphere, and backbone modes.
              </p>
            </div>
            <div className="card-scientific text-center">
              <Layers className="w-8 h-8 text-primary mx-auto mb-3" />
              <h4 className="font-medium text-foreground mb-2">Chromosomes</h4>
              <p className="text-xs text-muted-foreground">
                Browse all 24 human chromosomes with size-proportional visualization.
              </p>
            </div>
          </div>
        </div>
      </ParallaxSection>
      <Footer />
    </div>
  );
};

export default Visualizations3D;