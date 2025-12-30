import { Navigation } from "@/components/layout/Navigation";
import { ParallaxSection } from "@/components/layout/ParallaxSection";
import { DNAMatrix } from "@/components/layout/DNAMatrix";
import { useState, Suspense } from "react";
import { Leaf, FlaskConical, Clock, Sparkles, TrendingUp, Loader2, Dna } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Slider } from "@/components/ui/slider";
import NutrigenomicsChat from "@/components/research/NutrigenomicsChat";
import CellularAging3D from "@/components/visualizations/CellularAging3D";
import { NUTRIGENOMIC_COMPOUNDS, LONGEVITY_GENE_CLUSTERS } from "@/lib/api/ncbi";

interface CellularAgingData {
  senescenceLevel: number;
  mitochondrialHealth: number;
  telomereLength: number;
  autophagyActivity: number;
  inflammationLevel: number;
  projectionYears: number;
}

const NutrigenomicsForecasting = () => {
  const { user, loading: authLoading } = useAuth();
  const [cellularData, setCellularData] = useState<CellularAgingData>({
    senescenceLevel: 0.3,
    mitochondrialHealth: 0.7,
    telomereLength: 0.6,
    autophagyActivity: 0.5,
    inflammationLevel: 0.2,
    projectionYears: 10
  });
  const [selectedCompound, setSelectedCompound] = useState<string | null>(null);

  const handleVisualizationUpdate = (data: any) => {
    // Update cellular visualization based on AI response
    if (data.type === "methylation" && data.data.levels) {
      const avgLevel = data.data.levels.reduce((a: number, b: number) => a + b, 0) / data.data.levels.length;
      setCellularData(prev => ({
        ...prev,
        senescenceLevel: avgLevel,
        projectionYears: data.data.projection_years || prev.projectionYears
      }));
    }
  };

  const applyCompoundEffect = (compound: typeof NUTRIGENOMIC_COMPOUNDS[0]) => {
    setSelectedCompound(compound.name);
    
    // Simulate compound effects on cellular aging
    const effects: Partial<CellularAgingData> = {};
    
    switch (compound.target) {
      case "SIRT1":
        effects.mitochondrialHealth = Math.min(1, cellularData.mitochondrialHealth + 0.15);
        effects.senescenceLevel = Math.max(0, cellularData.senescenceLevel - 0.1);
        break;
      case "NAMPT/SIRT":
        effects.mitochondrialHealth = Math.min(1, cellularData.mitochondrialHealth + 0.2);
        effects.autophagyActivity = Math.min(1, cellularData.autophagyActivity + 0.1);
        break;
      case "NRF2":
        effects.inflammationLevel = Math.max(0, cellularData.inflammationLevel - 0.15);
        break;
      case "NF-κB":
        effects.inflammationLevel = Math.max(0, cellularData.inflammationLevel - 0.2);
        break;
      case "Senescent cells":
        effects.senescenceLevel = Math.max(0, cellularData.senescenceLevel - 0.2);
        break;
      case "Autophagy":
        effects.autophagyActivity = Math.min(1, cellularData.autophagyActivity + 0.25);
        break;
      case "Inflammation":
        effects.telomereLength = Math.min(1, cellularData.telomereLength + 0.05);
        effects.inflammationLevel = Math.max(0, cellularData.inflammationLevel - 0.1);
        break;
      case "VDR gene":
        effects.mitochondrialHealth = Math.min(1, cellularData.mitochondrialHealth + 0.1);
        break;
    }
    
    setCellularData(prev => ({ ...prev, ...effects }));
  };

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
        <DNAMatrix />
        <Navigation />
        <ParallaxSection className="pt-24 pb-16">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <Leaf className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-foreground mb-4">Nutrigenomics Forecasting</h1>
            <p className="text-muted-foreground">Please sign in to access nutrigenomics tools.</p>
          </div>
        </ParallaxSection>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DNAMatrix />
      <Navigation />

      <ParallaxSection className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-science/10 border border-science/30 rounded-full mb-6">
              <Leaf className="w-4 h-4 text-science" />
              <span className="text-sm font-mono text-science">DNA-GUIDED NUTRITION LAB</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Nutrigenomics <span className="text-gradient-longevity">Forecasting</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Explore gene-nutrient interactions, predict epigenetic changes, and visualize 
              cellular aging effects. AI-powered analysis for precision nutrition research.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AI Chat Interface */}
            <div className="card-longevity h-[600px] flex flex-col">
              <div className="flex items-center gap-2 p-4 border-b border-border">
                <FlaskConical className="w-5 h-5 text-science" />
                <h3 className="font-semibold text-foreground">AI Nutrigenomics Interpreter</h3>
                <span className="nutrigenomics-badge ml-auto">LIVE</span>
              </div>
              <div className="flex-1 overflow-hidden">
                <NutrigenomicsChat onVisualizationUpdate={handleVisualizationUpdate} />
              </div>
            </div>

            {/* Visualization Panel */}
            <div className="space-y-6">
              {/* Cellular Aging 3D */}
              <div className="card-longevity">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-accent" />
                  <h3 className="font-semibold text-foreground">Cellular Aging Visualization</h3>
                  <span className="longevity-badge ml-auto">3D</span>
                </div>
                <Suspense fallback={
                  <div className="h-[400px] flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                }>
                  <CellularAging3D data={cellularData} autoRotate={true} />
                </Suspense>
              </div>

              {/* Biomarker Controls */}
              <div className="card-scientific">
                <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Adjust Biomarkers
                </h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Senescence Level</span>
                      <span className="text-foreground font-mono">{Math.round(cellularData.senescenceLevel * 100)}%</span>
                    </div>
                    <Slider
                      value={[cellularData.senescenceLevel * 100]}
                      onValueChange={([v]) => setCellularData(prev => ({ ...prev, senescenceLevel: v / 100 }))}
                      max={100}
                      step={1}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Mitochondrial Health</span>
                      <span className="text-foreground font-mono">{Math.round(cellularData.mitochondrialHealth * 100)}%</span>
                    </div>
                    <Slider
                      value={[cellularData.mitochondrialHealth * 100]}
                      onValueChange={([v]) => setCellularData(prev => ({ ...prev, mitochondrialHealth: v / 100 }))}
                      max={100}
                      step={1}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Telomere Length</span>
                      <span className="text-foreground font-mono">{Math.round(cellularData.telomereLength * 100)}%</span>
                    </div>
                    <Slider
                      value={[cellularData.telomereLength * 100]}
                      onValueChange={([v]) => setCellularData(prev => ({ ...prev, telomereLength: v / 100 }))}
                      max={100}
                      step={1}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Inflammation</span>
                      <span className="text-foreground font-mono">{Math.round(cellularData.inflammationLevel * 100)}%</span>
                    </div>
                    <Slider
                      value={[cellularData.inflammationLevel * 100]}
                      onValueChange={([v]) => setCellularData(prev => ({ ...prev, inflammationLevel: v / 100 }))}
                      max={100}
                      step={1}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Nutrient Intervention Panel */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Leaf className="w-5 h-5 text-science" />
              Simulate Nutrient Interventions
              <span className="text-xs text-muted-foreground font-normal ml-2">
                Click to apply effects to cellular visualization
              </span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {NUTRIGENOMIC_COMPOUNDS.map((compound) => (
                <button
                  key={compound.name}
                  onClick={() => applyCompoundEffect(compound)}
                  className={`card-scientific text-left transition-all hover:border-science/50 ${
                    selectedCompound === compound.name ? "border-science/50 bg-science/5" : ""
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-foreground">{compound.name}</h4>
                    <span className="nutrigenomics-badge">{compound.target}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{compound.effect}</p>
                  <p className="text-xs text-science">Sources: {compound.sources}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Gene Clusters Reference */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Dna className="w-5 h-5 text-accent" />
              Longevity Gene Pathways
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {LONGEVITY_GENE_CLUSTERS.slice(0, 4).map((cluster) => (
                <div key={cluster.cluster} className="card-longevity">
                  <h4 className="font-semibold text-foreground mb-2">{cluster.cluster}</h4>
                  <p className="text-xs text-muted-foreground mb-3">{cluster.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {cluster.genes.map((gene) => (
                      <span key={gene} className="longevity-badge">
                        {gene}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ParallaxSection>
    </div>
  );
};

export default NutrigenomicsForecasting;