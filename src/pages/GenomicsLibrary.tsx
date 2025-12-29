import { Navigation } from "@/components/layout/Navigation";
import { ParallaxSection } from "@/components/layout/ParallaxSection";
import { ExternalLink, Calendar, Users, BookOpen, Filter, Search } from "lucide-react";
import { useState } from "react";

interface Article {
  id: string;
  title: string;
  authors: string;
  journal: string;
  year: number;
  abstract: string;
  doi: string;
  link: string;
  category: string;
}

const articles: Article[] = [
  {
    id: "1",
    title: "CRISPR-Cas9 Gene Editing in Human Embryos: Ethical Considerations and Technical Advances",
    authors: "Zhang, H., Liu, W., Chen, Y., et al.",
    journal: "Nature Genetics",
    year: 2024,
    abstract: "This comprehensive review examines the latest developments in CRISPR-Cas9 gene editing technology applied to human embryos, discussing both the technical breakthroughs and the ethical framework necessary for responsible research.",
    doi: "10.1038/ng.2024.1234",
    link: "https://www.nature.com/articles/ng.2024.1234",
    category: "Gene Editing",
  },
  {
    id: "2",
    title: "Single-Cell RNA Sequencing Reveals Novel Cell States in Human Brain Development",
    authors: "Martinez, A., Patel, S., Williams, K., et al.",
    journal: "Cell",
    year: 2024,
    abstract: "Using advanced single-cell RNA sequencing techniques, we identified previously unknown cell states during human brain development, providing new insights into neurological disorders.",
    doi: "10.1016/j.cell.2024.02.015",
    link: "https://www.cell.com/cell/fulltext/S0092-8674(24)00215-3",
    category: "Transcriptomics",
  },
  {
    id: "3",
    title: "Machine Learning Approaches for Predicting Drug Response from Genomic Data",
    authors: "Johnson, R., Kim, S., Brown, T., et al.",
    journal: "Science Translational Medicine",
    year: 2023,
    abstract: "We present a novel machine learning framework that integrates multi-omics data to predict patient-specific drug responses, advancing precision medicine initiatives.",
    doi: "10.1126/scitranslmed.abc1234",
    link: "https://www.science.org/doi/10.1126/scitranslmed.abc1234",
    category: "Computational Biology",
  },
  {
    id: "4",
    title: "Long-Read Sequencing Technologies: A Comparative Analysis for Structural Variant Detection",
    authors: "Anderson, M., Garcia, L., Thompson, E., et al.",
    journal: "Genome Research",
    year: 2024,
    abstract: "This study provides a comprehensive comparison of Oxford Nanopore and PacBio long-read sequencing technologies for detecting structural variants in human genomes.",
    doi: "10.1101/gr.278956.123",
    link: "https://genome.cshlp.org/content/34/1/1",
    category: "Sequencing",
  },
  {
    id: "5",
    title: "Epigenetic Reprogramming in Cancer: Mechanisms and Therapeutic Opportunities",
    authors: "Wilson, J., Davis, K., Miller, R., et al.",
    journal: "Cancer Cell",
    year: 2023,
    abstract: "We review the current understanding of epigenetic alterations in cancer and discuss emerging therapeutic strategies targeting the cancer epigenome.",
    doi: "10.1016/j.ccell.2023.08.001",
    link: "https://www.cell.com/cancer-cell/fulltext/S1535-6108(23)00285-1",
    category: "Epigenetics",
  },
  {
    id: "6",
    title: "Advances in Whole Genome Sequencing for Rare Disease Diagnosis",
    authors: "Taylor, N., White, C., Jackson, P., et al.",
    journal: "The Lancet",
    year: 2024,
    abstract: "This review highlights recent advances in whole genome sequencing and its increasing utility in diagnosing rare genetic diseases, with a focus on clinical implementation.",
    doi: "10.1016/S0140-6736(24)00123-4",
    link: "https://www.thelancet.com/journals/lancet/article/PIIS0140-6736(24)00123-4",
    category: "Clinical Genomics",
  },
];

const categories = ["All", "Gene Editing", "Transcriptomics", "Computational Biology", "Sequencing", "Epigenetics", "Clinical Genomics"];

const GenomicsLibrary = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredArticles = articles.filter((article) => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.abstract.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.authors.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <ParallaxSection className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full mb-6">
              <BookOpen className="w-4 h-4 text-primary" />
              <span className="text-sm font-mono text-primary">Curated Research</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Genomics <span className="text-gradient-primary">Library</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Curated collection of peer-reviewed articles, citations, and scientific documents 
              from leading journals and research institutions.
            </p>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search articles, authors, keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full input-scientific pl-12"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-muted-foreground" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="input-scientific"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Articles Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredArticles.map((article, index) => (
              <article
                key={article.id}
                className="card-scientific group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-mono rounded">
                    {article.category}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                    <Calendar className="w-3 h-3" />
                    {article.year}
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {article.title}
                </h3>

                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <Users className="w-4 h-4" />
                  <span>{article.authors}</span>
                </div>

                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {article.abstract}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <span className="text-xs text-muted-foreground font-mono">
                    {article.journal} • DOI: {article.doi}
                  </span>
                  <a
                    href={article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:text-primary/80 text-sm font-medium transition-colors"
                  >
                    View Source
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </article>
            ))}
          </div>

          {filteredArticles.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No articles found matching your criteria.</p>
            </div>
          )}
        </div>
      </ParallaxSection>
    </div>
  );
};

export default GenomicsLibrary;
