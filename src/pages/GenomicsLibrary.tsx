import { Navigation } from "@/components/layout/Navigation";
import { DNAMatrix } from "@/components/layout/DNAMatrix";
import { ParallaxSection } from "@/components/layout/ParallaxSection";
import { 
  ExternalLink, Calendar, Users, BookOpen, Search, Dna, 
  FileText, Database, Loader2, AlertCircle, RefreshCw, Heart,
  FlaskConical, Sparkles, Leaf, Clock, Zap
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  searchPubMed, searchGenes, searchSequences, 
  searchEpigenetics, searchLongevityGenes, searchNutrigenomics, searchCellularAging,
  LONGEVITY_GENE_CLUSTERS, NUTRIGENOMIC_COMPOUNDS,
  type PubMedArticle, type GeneInfo, type SequenceInfo 
} from "@/lib/api/ncbi";
import { useSavedItems } from "@/hooks/useSavedItems";
import { useAuth } from "@/hooks/useAuth";

const GenomicsLibrary = () => {
  const [searchTerm, setSearchTerm] = useState("longevity");
  const [activeTab, setActiveTab] = useState("epigenetics");
  const [searchQuery, setSearchQuery] = useState("longevity");
  const { user } = useAuth();
  const { isItemSaved, toggleSave } = useSavedItems();

  const handleSearch = () => {
    if (searchTerm.trim()) {
      setSearchQuery(searchTerm.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Epigenetics research query
  const { data: epigeneticsArticles = [], isLoading: epigeneticsLoading, error: epigeneticsError, refetch: refetchEpigenetics } = useQuery({
    queryKey: ['epigenetics', searchQuery],
    queryFn: () => searchEpigenetics(searchQuery, 12),
    staleTime: 5 * 60 * 1000,
    enabled: activeTab === 'epigenetics',
  });

  // Longevity genes query
  const { data: longevityGenes = [], isLoading: longevityLoading, error: longevityError, refetch: refetchLongevity } = useQuery({
    queryKey: ['longevity-genes', searchQuery],
    queryFn: () => searchLongevityGenes(searchQuery, 12),
    staleTime: 5 * 60 * 1000,
    enabled: activeTab === 'longevity',
  });

  // Nutrigenomics query
  const { data: nutrigenomicsArticles = [], isLoading: nutrigenomicsLoading, error: nutrigenomicsError, refetch: refetchNutrigenomics } = useQuery({
    queryKey: ['nutrigenomics', searchQuery],
    queryFn: () => searchNutrigenomics(searchQuery, 12),
    staleTime: 5 * 60 * 1000,
    enabled: activeTab === 'nutrigenomics',
  });

  // Cellular aging query
  const { data: cellularAgingArticles = [], isLoading: cellularLoading, error: cellularError, refetch: refetchCellular } = useQuery({
    queryKey: ['cellular-aging', searchQuery],
    queryFn: () => searchCellularAging(searchQuery, 12),
    staleTime: 5 * 60 * 1000,
    enabled: activeTab === 'cellular',
  });

  // PubMed articles query
  const { data: articles = [], isLoading: articlesLoading, error: articlesError, refetch: refetchArticles } = useQuery({
    queryKey: ['pubmed', searchQuery],
    queryFn: () => searchPubMed(searchQuery, 12),
    staleTime: 5 * 60 * 1000,
    enabled: activeTab === 'publications',
  });

  // Genes query
  const { data: genes = [], isLoading: genesLoading, error: genesError, refetch: refetchGenes } = useQuery({
    queryKey: ['genes', searchQuery],
    queryFn: () => searchGenes(searchQuery, 12),
    staleTime: 5 * 60 * 1000,
    enabled: activeTab === 'genes',
  });

  // Sequences query
  const { data: sequences = [], isLoading: sequencesLoading, error: sequencesError, refetch: refetchSequences } = useQuery({
    queryKey: ['sequences', searchQuery],
    queryFn: () => searchSequences(searchQuery, 12),
    staleTime: 5 * 60 * 1000,
    enabled: activeTab === 'sequences',
  });

  const isLoading = (activeTab === 'publications' && articlesLoading) ||
                    (activeTab === 'genes' && genesLoading) ||
                    (activeTab === 'sequences' && sequencesLoading) ||
                    (activeTab === 'epigenetics' && epigeneticsLoading) ||
                    (activeTab === 'longevity' && longevityLoading) ||
                    (activeTab === 'nutrigenomics' && nutrigenomicsLoading) ||
                    (activeTab === 'cellular' && cellularLoading);

  const hasError = (activeTab === 'publications' && articlesError) ||
                   (activeTab === 'genes' && genesError) ||
                   (activeTab === 'sequences' && sequencesError) ||
                   (activeTab === 'epigenetics' && epigeneticsError) ||
                   (activeTab === 'longevity' && longevityError) ||
                   (activeTab === 'nutrigenomics' && nutrigenomicsError) ||
                   (activeTab === 'cellular' && cellularError);

  const handleRefetch = () => {
    if (activeTab === 'publications') refetchArticles();
    else if (activeTab === 'genes') refetchGenes();
    else if (activeTab === 'sequences') refetchSequences();
    else if (activeTab === 'epigenetics') refetchEpigenetics();
    else if (activeTab === 'longevity') refetchLongevity();
    else if (activeTab === 'nutrigenomics') refetchNutrigenomics();
    else if (activeTab === 'cellular') refetchCellular();
  };

  return (
    <div className="min-h-screen bg-background relative">
      <DNAMatrix />
      <Navigation />
      
      <ParallaxSection className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-mono text-primary">LONGEVITY BIOTECH RESEARCH</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Genomics <span className="text-gradient-longevity">Library</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Explore cutting-edge research in epigenetics, DNA methylation, cellular aging, 
              and nutrigenomics. Powered by NCBI databases for real-time scientific insights.
              {user && " Save items to your personal library."}
            </p>
          </div>

          {/* Longevity Gene Clusters Quick Access */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-accent" />
              QUICK ACCESS: LONGEVITY GENE CLUSTERS
            </h3>
            <div className="flex flex-wrap gap-2">
              {LONGEVITY_GENE_CLUSTERS.slice(0, 5).map((cluster) => (
                <button
                  key={cluster.cluster}
                  onClick={() => {
                    setSearchTerm(cluster.genes[0]);
                    setSearchQuery(cluster.genes[0]);
                    setActiveTab('longevity');
                  }}
                  className="px-3 py-1.5 bg-secondary/50 border border-border hover:border-primary/50 rounded-full text-sm text-foreground transition-all hover:bg-primary/10"
                >
                  {cluster.cluster}
                </button>
              ))}
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search longevity genes, epigenetics, nutrients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-12 h-12 bg-secondary/50 border-border focus:border-primary"
              />
            </div>
            <Button 
              onClick={handleSearch} 
              className="h-12 px-8"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Search className="w-4 h-4 mr-2" />
              )}
              Search
            </Button>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="flex flex-wrap justify-center gap-1 mb-8 bg-transparent h-auto p-0">
              <TabsTrigger value="epigenetics" className="flex items-center gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                <FlaskConical className="w-4 h-4" />
                <span className="hidden sm:inline">Epigenetics</span>
              </TabsTrigger>
              <TabsTrigger value="longevity" className="flex items-center gap-2 data-[state=active]:bg-accent/20 data-[state=active]:text-accent">
                <Clock className="w-4 h-4" />
                <span className="hidden sm:inline">Longevity Genes</span>
              </TabsTrigger>
              <TabsTrigger value="nutrigenomics" className="flex items-center gap-2 data-[state=active]:bg-science/20 data-[state=active]:text-science">
                <Leaf className="w-4 h-4" />
                <span className="hidden sm:inline">Nutrigenomics</span>
              </TabsTrigger>
              <TabsTrigger value="cellular" className="flex items-center gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">Cellular Aging</span>
              </TabsTrigger>
              <TabsTrigger value="publications" className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                <span className="hidden sm:inline">Publications</span>
              </TabsTrigger>
              <TabsTrigger value="genes" className="flex items-center gap-2">
                <Dna className="w-4 h-4" />
                <span className="hidden sm:inline">Genes</span>
              </TabsTrigger>
              <TabsTrigger value="sequences" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Sequences</span>
              </TabsTrigger>
            </TabsList>

            {/* Loading State */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                <p className="text-muted-foreground font-mono">Querying research databases...</p>
              </div>
            )}

            {/* Error State */}
            {hasError && !isLoading && (
              <div className="flex flex-col items-center justify-center py-20">
                <AlertCircle className="w-12 h-12 text-destructive mb-4" />
                <p className="text-muted-foreground mb-4">Failed to fetch data</p>
                <Button variant="outline" onClick={handleRefetch}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </div>
            )}

            {/* Epigenetics Tab */}
            <TabsContent value="epigenetics">
              {!isLoading && !hasError && (
                <>
                  <div className="text-sm text-muted-foreground mb-4 font-mono flex items-center gap-2">
                    <span className="epigenetic-badge">EPIGENETICS</span>
                    Found {epigeneticsArticles.length} studies for "{searchQuery}"
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {epigeneticsArticles.map((article: PubMedArticle, index: number) => (
                      <ArticleCard 
                        key={article.id} 
                        article={article} 
                        index={index}
                        isSaved={isItemSaved("publication", article.pmid)}
                        onToggleSave={() => toggleSave("publication", article.pmid, article)}
                        showSaveButton={!!user}
                        badgeType="epigenetic"
                      />
                    ))}
                  </div>
                  {epigeneticsArticles.length === 0 && (
                    <EmptyState message="No epigenetics studies found. Try searching for methylation, histone, or chromatin." />
                  )}
                </>
              )}
            </TabsContent>

            {/* Longevity Genes Tab */}
            <TabsContent value="longevity">
              {!isLoading && !hasError && (
                <>
                  {/* Gene Clusters Reference */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-accent" />
                      Longevity Gene Clusters
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {LONGEVITY_GENE_CLUSTERS.map((cluster) => (
                        <div key={cluster.cluster} className="card-longevity">
                          <h4 className="font-semibold text-foreground mb-2">{cluster.cluster}</h4>
                          <p className="text-xs text-muted-foreground mb-3">{cluster.description}</p>
                          <div className="flex flex-wrap gap-1">
                            {cluster.genes.map((gene) => (
                              <button
                                key={gene}
                                onClick={() => {
                                  setSearchTerm(gene);
                                  setSearchQuery(gene);
                                }}
                                className="longevity-badge hover:opacity-80 transition-opacity cursor-pointer"
                              >
                                {gene}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground mb-4 font-mono flex items-center gap-2">
                    <span className="longevity-badge">LONGEVITY</span>
                    Found {longevityGenes.length} genes for "{searchQuery}"
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {longevityGenes.map((gene: GeneInfo, index: number) => (
                      <GeneCard 
                        key={gene.id} 
                        gene={gene} 
                        index={index}
                        isSaved={isItemSaved("gene", gene.id)}
                        onToggleSave={() => toggleSave("gene", gene.id, gene)}
                        showSaveButton={!!user}
                        badgeType="longevity"
                      />
                    ))}
                  </div>
                  {longevityGenes.length === 0 && (
                    <EmptyState message="No longevity genes found. Try SIRT1, FOXO3, or TERT." />
                  )}
                </>
              )}
            </TabsContent>

            {/* Nutrigenomics Tab */}
            <TabsContent value="nutrigenomics">
              {!isLoading && !hasError && (
                <>
                  {/* Key Nutrigenomic Compounds */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Leaf className="w-5 h-5 text-science" />
                      Key Nutrigenomic Compounds
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {NUTRIGENOMIC_COMPOUNDS.map((compound) => (
                        <div key={compound.name} className="card-scientific glow-border-science">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-foreground">{compound.name}</h4>
                            <span className="nutrigenomics-badge">{compound.target}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{compound.effect}</p>
                          <p className="text-xs text-science">Sources: {compound.sources}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground mb-4 font-mono flex items-center gap-2">
                    <span className="nutrigenomics-badge">NUTRIGENOMICS</span>
                    Found {nutrigenomicsArticles.length} studies for "{searchQuery}"
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {nutrigenomicsArticles.map((article: PubMedArticle, index: number) => (
                      <ArticleCard 
                        key={article.id} 
                        article={article} 
                        index={index}
                        isSaved={isItemSaved("publication", article.pmid)}
                        onToggleSave={() => toggleSave("publication", article.pmid, article)}
                        showSaveButton={!!user}
                        badgeType="nutrigenomics"
                      />
                    ))}
                  </div>
                  {nutrigenomicsArticles.length === 0 && (
                    <EmptyState message="No nutrigenomics studies found. Try resveratrol, NAD+, or sulforaphane." />
                  )}
                </>
              )}
            </TabsContent>

            {/* Cellular Aging Tab */}
            <TabsContent value="cellular">
              {!isLoading && !hasError && (
                <>
                  <div className="text-sm text-muted-foreground mb-4 font-mono flex items-center gap-2">
                    <span className="epigenetic-badge">CELLULAR AGING</span>
                    Found {cellularAgingArticles.length} studies for "{searchQuery}"
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {cellularAgingArticles.map((article: PubMedArticle, index: number) => (
                      <ArticleCard 
                        key={article.id} 
                        article={article} 
                        index={index}
                        isSaved={isItemSaved("publication", article.pmid)}
                        onToggleSave={() => toggleSave("publication", article.pmid, article)}
                        showSaveButton={!!user}
                        badgeType="epigenetic"
                      />
                    ))}
                  </div>
                  {cellularAgingArticles.length === 0 && (
                    <EmptyState message="No cellular aging studies found. Try senescence, telomere, or autophagy." />
                  )}
                </>
              )}
            </TabsContent>

            {/* Publications Tab */}
            <TabsContent value="publications">
              {!isLoading && !hasError && (
                <>
                  <div className="text-sm text-muted-foreground mb-4 font-mono">
                    Found {articles.length} publications for "{searchQuery}"
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {articles.map((article: PubMedArticle, index: number) => (
                      <ArticleCard 
                        key={article.id} 
                        article={article} 
                        index={index}
                        isSaved={isItemSaved("publication", article.pmid)}
                        onToggleSave={() => toggleSave("publication", article.pmid, article)}
                        showSaveButton={!!user}
                      />
                    ))}
                  </div>
                  {articles.length === 0 && (
                    <EmptyState message="No publications found. Try a different search term." />
                  )}
                </>
              )}
            </TabsContent>

            {/* Genes Tab */}
            <TabsContent value="genes">
              {!isLoading && !hasError && (
                <>
                  <div className="text-sm text-muted-foreground mb-4 font-mono">
                    Found {genes.length} genes for "{searchQuery}"
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {genes.map((gene: GeneInfo, index: number) => (
                      <GeneCard 
                        key={gene.id} 
                        gene={gene} 
                        index={index}
                        isSaved={isItemSaved("gene", gene.id)}
                        onToggleSave={() => toggleSave("gene", gene.id, gene)}
                        showSaveButton={!!user}
                      />
                    ))}
                  </div>
                  {genes.length === 0 && (
                    <EmptyState message="No genes found. Try searching for a gene name or symbol." />
                  )}
                </>
              )}
            </TabsContent>

            {/* Sequences Tab */}
            <TabsContent value="sequences">
              {!isLoading && !hasError && (
                <>
                  <div className="text-sm text-muted-foreground mb-4 font-mono">
                    Found {sequences.length} sequences for "{searchQuery}"
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {sequences.map((sequence: SequenceInfo, index: number) => (
                      <SequenceCard 
                        key={sequence.id} 
                        sequence={sequence} 
                        index={index}
                        isSaved={isItemSaved("sequence", sequence.id)}
                        onToggleSave={() => toggleSave("sequence", sequence.id, sequence)}
                        showSaveButton={!!user}
                      />
                    ))}
                  </div>
                  {sequences.length === 0 && (
                    <EmptyState message="No sequences found. Try a different search term." />
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>

          {/* Attribution */}
          <div className="mt-12 text-center">
            <p className="text-xs text-muted-foreground font-mono">
              Research data sourced from NCBI (National Center for Biotechnology Information) via E-utilities API
            </p>
            <p className="text-xs text-muted-foreground font-mono mt-1">
              Optimized for Longevity Biotech & Precision Nutrition Research
            </p>
          </div>
        </div>
      </ParallaxSection>
    </div>
  );
};

// Save Button Component
const SaveButton = ({ isSaved, onToggle }: { isSaved: boolean; onToggle: () => void }) => (
  <button
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      onToggle();
    }}
    className={`p-2 rounded-md transition-all ${
      isSaved 
        ? "text-primary bg-primary/10 hover:bg-primary/20" 
        : "text-muted-foreground hover:text-primary hover:bg-primary/10"
    }`}
    title={isSaved ? "Remove from library" : "Save to library"}
  >
    <Heart className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} />
  </button>
);

// Article Card Component
const ArticleCard = ({ 
  article, 
  index, 
  isSaved, 
  onToggleSave,
  showSaveButton,
  badgeType
}: { 
  article: PubMedArticle; 
  index: number;
  isSaved: boolean;
  onToggleSave: () => void;
  showSaveButton: boolean;
  badgeType?: 'epigenetic' | 'longevity' | 'nutrigenomics';
}) => {
  const badgeClass = badgeType === 'epigenetic' ? 'epigenetic-badge' 
    : badgeType === 'longevity' ? 'longevity-badge' 
    : badgeType === 'nutrigenomics' ? 'nutrigenomics-badge'
    : 'px-3 py-1 bg-primary/10 text-primary text-xs font-mono rounded';

  return (
    <article
      className="card-scientific group animate-fade-in"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start justify-between mb-3">
        <span className={badgeClass}>
          PMID: {article.pmid}
        </span>
        <div className="flex items-center gap-2">
          {showSaveButton && <SaveButton isSaved={isSaved} onToggle={onToggleSave} />}
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <Calendar className="w-3 h-3" />
            {article.year}
          </div>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
        {article.title}
      </h3>

      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
        <Users className="w-4 h-4 flex-shrink-0" />
        <span className="truncate">{article.authors}</span>
      </div>

      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
        {article.abstract}
      </p>

      <div className="flex items-center justify-between pt-4 border-t border-border">
        <span className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">
          {article.journal}
        </span>
        <a
          href={`https://pubmed.ncbi.nlm.nih.gov/${article.pmid}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-primary hover:text-primary/80 text-sm font-medium transition-colors"
        >
          View on PubMed
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </article>
  );
};

// Gene Card Component
const GeneCard = ({ 
  gene, 
  index,
  isSaved,
  onToggleSave,
  showSaveButton,
  badgeType
}: { 
  gene: GeneInfo; 
  index: number;
  isSaved: boolean;
  onToggleSave: () => void;
  showSaveButton: boolean;
  badgeType?: 'longevity';
}) => (
  <article
    className={`group animate-fade-in ${badgeType === 'longevity' ? 'card-longevity' : 'card-scientific'}`}
    style={{ animationDelay: `${index * 50}ms` }}
  >
    <div className="flex items-start justify-between mb-3">
      <span className={badgeType === 'longevity' ? 'longevity-badge font-bold' : 'px-3 py-1 bg-accent/20 text-accent text-xs font-mono rounded font-bold'}>
        {gene.symbol}
      </span>
      <div className="flex items-center gap-2">
        {showSaveButton && <SaveButton isSaved={isSaved} onToggle={onToggleSave} />}
        <span className="text-xs text-muted-foreground font-mono">
          Chr {gene.chromosome}
        </span>
      </div>
    </div>

    <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
      {gene.name}
    </h3>

    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
      <Dna className="w-4 h-4" />
      <span>{gene.organism}</span>
    </div>

    <p className="text-sm text-muted-foreground mb-4 line-clamp-4">
      {gene.summary}
    </p>

    <div className="flex items-center justify-between pt-4 border-t border-border">
      <span className="text-xs text-muted-foreground font-mono">
        Location: {gene.location}
      </span>
      <a
        href={`https://www.ncbi.nlm.nih.gov/gene/${gene.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 text-primary hover:text-primary/80 text-sm font-medium transition-colors"
      >
        View on NCBI
        <ExternalLink className="w-4 h-4" />
      </a>
    </div>
  </article>
);

// Sequence Card Component
const SequenceCard = ({ 
  sequence, 
  index,
  isSaved,
  onToggleSave,
  showSaveButton
}: { 
  sequence: SequenceInfo; 
  index: number;
  isSaved: boolean;
  onToggleSave: () => void;
  showSaveButton: boolean;
}) => (
  <article
    className="card-scientific group animate-fade-in"
    style={{ animationDelay: `${index * 50}ms` }}
  >
    <div className="flex items-start justify-between mb-3">
      <span className="px-3 py-1 bg-secondary text-foreground text-xs font-mono rounded">
        {sequence.accession}
      </span>
      <div className="flex items-center gap-2">
        {showSaveButton && <SaveButton isSaved={isSaved} onToggle={onToggleSave} />}
        <span className="text-xs text-muted-foreground font-mono">
          {sequence.type}
        </span>
      </div>
    </div>

    <h3 className="text-base font-semibold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
      {sequence.title}
    </h3>

    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
      <Database className="w-4 h-4" />
      <span>{sequence.organism}</span>
    </div>

    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
      <span className="font-mono">
        Length: {sequence.length.toLocaleString()} bp
      </span>
    </div>

    <div className="flex items-center justify-between pt-4 border-t border-border">
      <span className="text-xs text-muted-foreground font-mono">
        ID: {sequence.id}
      </span>
      <a
        href={`https://www.ncbi.nlm.nih.gov/nuccore/${sequence.accession}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 text-primary hover:text-primary/80 text-sm font-medium transition-colors"
      >
        View Sequence
        <ExternalLink className="w-4 h-4" />
      </a>
    </div>
  </article>
);

// Empty State Component
const EmptyState = ({ message }: { message: string }) => (
  <div className="text-center py-12">
    <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
    <p className="text-muted-foreground">{message}</p>
  </div>
);

export default GenomicsLibrary;