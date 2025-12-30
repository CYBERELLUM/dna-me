import { Navigation } from "@/components/layout/Navigation";
import { DNAMatrix } from "@/components/layout/DNAMatrix";
import { ParallaxSection } from "@/components/layout/ParallaxSection";
import { 
  ExternalLink, Calendar, Users, BookOpen, Search, Dna, 
  FileText, Database, Loader2, AlertCircle, RefreshCw, Heart
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchPubMed, searchGenes, searchSequences, type PubMedArticle, type GeneInfo, type SequenceInfo } from "@/lib/api/ncbi";
import { useSavedItems } from "@/hooks/useSavedItems";
import { useAuth } from "@/hooks/useAuth";

const GenomicsLibrary = () => {
  const [searchTerm, setSearchTerm] = useState("CRISPR");
  const [activeTab, setActiveTab] = useState("publications");
  const [searchQuery, setSearchQuery] = useState("CRISPR");
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
                    (activeTab === 'sequences' && sequencesLoading);

  const hasError = (activeTab === 'publications' && articlesError) ||
                   (activeTab === 'genes' && genesError) ||
                   (activeTab === 'sequences' && sequencesError);

  const handleRefetch = () => {
    if (activeTab === 'publications') refetchArticles();
    else if (activeTab === 'genes') refetchGenes();
    else refetchSequences();
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
              <Database className="w-4 h-4 text-primary" />
              <span className="text-sm font-mono text-primary">NCBI Database Integration</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Genomics <span className="text-gradient-primary">Library</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Search NCBI databases for peer-reviewed publications, gene information, 
              and nucleotide sequences in real-time.
              {user && " Click the heart icon to save items to your library."}
            </p>
          </div>

          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search genes, sequences, publications..."
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
              Search NCBI
            </Button>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-lg mx-auto grid-cols-3 mb-8">
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
                <p className="text-muted-foreground font-mono">Querying NCBI databases...</p>
              </div>
            )}

            {/* Error State */}
            {hasError && !isLoading && (
              <div className="flex flex-col items-center justify-center py-20">
                <AlertCircle className="w-12 h-12 text-destructive mb-4" />
                <p className="text-muted-foreground mb-4">Failed to fetch data from NCBI</p>
                <Button variant="outline" onClick={handleRefetch}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </div>
            )}

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
              Data sourced from NCBI (National Center for Biotechnology Information) via E-utilities API
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
        ? "text-red-500 bg-red-500/10 hover:bg-red-500/20" 
        : "text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
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
  showSaveButton 
}: { 
  article: PubMedArticle; 
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
      <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-mono rounded">
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

// Gene Card Component
const GeneCard = ({ 
  gene, 
  index,
  isSaved,
  onToggleSave,
  showSaveButton
}: { 
  gene: GeneInfo; 
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
      <span className="px-3 py-1 bg-accent/20 text-accent text-xs font-mono rounded font-bold">
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
