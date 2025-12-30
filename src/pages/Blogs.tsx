import { useState } from "react";
import { Navigation } from "@/components/layout/Navigation";
import { ParallaxSection } from "@/components/layout/ParallaxSection";
import { DNAMatrix } from "@/components/layout/DNAMatrix";
import Footer from "@/components/layout/Footer";
import { 
  Newspaper, 
  Calendar, 
  User, 
  Clock, 
  Tag, 
  Search,
  ExternalLink,
  BookOpen,
  Beaker,
  Dna,
  Heart
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  readTime: string;
  category: "research" | "longevity" | "technology" | "clinical";
  tags: string[];
  featured?: boolean;
}

const blogPosts: BlogPost[] = [
  {
    id: "1",
    title: "Understanding Epigenetic Clocks: How DNA Methylation Reveals Biological Age",
    excerpt: "Epigenetic clocks have revolutionized our understanding of biological aging. Learn how methylation patterns at specific CpG sites can predict health outcomes and measure the effectiveness of longevity interventions.",
    author: "Dr. Sarah Chen",
    date: "2024-01-15",
    readTime: "8 min",
    category: "research",
    tags: ["epigenetics", "aging", "methylation"],
    featured: true
  },
  {
    id: "2",
    title: "CRISPR-Cas9: From Laboratory Tool to Clinical Reality",
    excerpt: "The journey of CRISPR from a bacterial immune system to the most powerful gene editing tool. Explore current clinical trials and the future of genetic medicine.",
    author: "Dr. James Liu",
    date: "2024-01-12",
    readTime: "12 min",
    category: "technology",
    tags: ["CRISPR", "gene editing", "clinical trials"],
    featured: true
  },
  {
    id: "3",
    title: "Nutrigenomics: How Your Genes Influence Dietary Response",
    excerpt: "Why the same diet works differently for different people. Discover how genetic variants in MTHFR, APOE, and other genes affect nutrient metabolism.",
    author: "Dr. Maria Santos",
    date: "2024-01-10",
    readTime: "6 min",
    category: "longevity",
    tags: ["nutrigenomics", "diet", "personalized medicine"]
  },
  {
    id: "4",
    title: "Senolytics: Targeting Senescent Cells for Longevity",
    excerpt: "The science behind senolytic drugs like Dasatinib and Quercetin. How clearing zombie cells could extend healthspan.",
    author: "Dr. Robert Kim",
    date: "2024-01-08",
    readTime: "10 min",
    category: "longevity",
    tags: ["senolytics", "senescence", "aging"]
  },
  {
    id: "5",
    title: "Multi-Omics Integration in Cancer Research",
    excerpt: "Combining genomics, transcriptomics, proteomics, and metabolomics for comprehensive cancer biomarker discovery and treatment personalization.",
    author: "Dr. Emily Watson",
    date: "2024-01-05",
    readTime: "15 min",
    category: "clinical",
    tags: ["multi-omics", "cancer", "biomarkers"]
  },
  {
    id: "6",
    title: "The Role of NAD+ in Cellular Energy and Aging",
    excerpt: "Nicotinamide adenine dinucleotide (NAD+) declines with age. Learn about NAD+ precursors like NMN and NR, and their potential for healthspan extension.",
    author: "Dr. Michael Park",
    date: "2024-01-03",
    readTime: "7 min",
    category: "longevity",
    tags: ["NAD+", "mitochondria", "supplements"]
  }
];

const Blogs = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredPosts = filteredPosts.filter(p => p.featured);
  const regularPosts = filteredPosts.filter(p => !p.featured);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "research": return <Beaker className="w-4 h-4" />;
      case "longevity": return <Heart className="w-4 h-4" />;
      case "technology": return <Dna className="w-4 h-4" />;
      case "clinical": return <BookOpen className="w-4 h-4" />;
      default: return <Newspaper className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "research": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "longevity": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "technology": return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "clinical": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      default: return "bg-secondary text-muted-foreground";
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
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/30 rounded-full mb-6">
              <Newspaper className="w-4 h-4 text-accent" />
              <span className="text-sm font-mono text-accent">RESEARCH INSIGHTS</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Blogs & <span className="text-gradient-primary">News</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Stay updated with the latest in genomics research, longevity science, and biotechnology breakthroughs.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search articles, topics, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={selectedCategory === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory("all")}
              >
                All
              </Button>
              <Button
                variant={selectedCategory === "research" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory("research")}
                className="gap-1"
              >
                <Beaker className="w-3 h-3" /> Research
              </Button>
              <Button
                variant={selectedCategory === "longevity" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory("longevity")}
                className="gap-1"
              >
                <Heart className="w-3 h-3" /> Longevity
              </Button>
              <Button
                variant={selectedCategory === "technology" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory("technology")}
                className="gap-1"
              >
                <Dna className="w-3 h-3" /> Technology
              </Button>
              <Button
                variant={selectedCategory === "clinical" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory("clinical")}
                className="gap-1"
              >
                <BookOpen className="w-3 h-3" /> Clinical
              </Button>
            </div>
          </div>

          {/* Featured Posts */}
          {featuredPosts.length > 0 && (
            <div className="mb-12">
              <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
                <span className="text-primary">★</span> Featured Articles
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {featuredPosts.map((post) => (
                  <article 
                    key={post.id}
                    className="card-longevity hover:border-primary/50 transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline" className={getCategoryColor(post.category)}>
                        {getCategoryIcon(post.category)}
                        <span className="ml-1 capitalize">{post.category}</span>
                      </Badge>
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-0">Featured</Badge>
                    </div>
                    <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors mb-3 line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" /> {post.author}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {post.date}
                        </span>
                      </div>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {post.readTime}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-4">
                      {post.tags.map((tag) => (
                        <span key={tag} className="text-xs px-2 py-1 bg-secondary rounded-full text-muted-foreground">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          {/* Regular Posts */}
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-primary" /> Latest Articles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularPosts.map((post) => (
                <article 
                  key={post.id}
                  className="card-scientific hover:border-primary/50 transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline" className={getCategoryColor(post.category)}>
                      {getCategoryIcon(post.category)}
                      <span className="ml-1 capitalize">{post.category}</span>
                    </Badge>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors mb-2 line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {post.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {post.readTime}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {filteredPosts.length === 0 && (
            <div className="text-center py-16">
              <Newspaper className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No articles found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filter criteria.</p>
            </div>
          )}
        </div>
      </ParallaxSection>

      <Footer />
    </div>
  );
};

export default Blogs;
