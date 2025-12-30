import { Navigation } from "@/components/layout/Navigation";
import { ParallaxSection } from "@/components/layout/ParallaxSection";
import { useState } from "react";
import { Dna } from "lucide-react";
import FastaUploader, { ParsedSequence } from "@/components/research/FastaUploader";
import SequenceViewer from "@/components/research/SequenceViewer";
import { useAuth } from "@/hooks/useAuth";

const Sequences = () => {
  const { user, loading: authLoading } = useAuth();
  const [sequences, setSequences] = useState<ParsedSequence[]>([]);
  const [selectedSequence, setSelectedSequence] = useState<ParsedSequence | null>(null);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Dna className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <ParallaxSection className="pt-24 pb-16">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <Dna className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-foreground mb-4">Sequence Analysis</h1>
            <p className="text-muted-foreground">Please sign in to access sequence tools.</p>
          </div>
        </ParallaxSection>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <ParallaxSection className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/30 rounded-full mb-6">
              <Dna className="w-4 h-4 text-accent" />
              <span className="text-sm font-mono text-accent">Sequence Analysis</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Sequence <span className="text-gradient-accent">Viewer</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Upload and visualize DNA, RNA, or protein sequences with color-coded nucleotides
              and amino acids. Analyze GC content and sequence composition.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Uploader & Sequence List */}
            <div className="lg:col-span-1 space-y-6">
              <FastaUploader onSequencesLoaded={(seqs) => {
                setSequences(seqs);
                if (seqs.length > 0) setSelectedSequence(seqs[0]);
              }} />

              {sequences.length > 1 && (
                <div className="card-scientific">
                  <h3 className="font-semibold text-foreground mb-4">Loaded Sequences</h3>
                  <div className="space-y-2 max-h-[300px] overflow-auto scrollbar-thin">
                    {sequences.map((seq, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedSequence(seq)}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                          selectedSequence?.id === seq.id
                            ? "bg-primary/10 border-primary/30"
                            : "bg-secondary/50 border-border hover:border-primary/20"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-sm text-foreground truncate">{seq.id}</span>
                          <span className={`text-xs px-2 py-0.5 rounded shrink-0 ${
                            seq.type === "dna" ? "bg-blue-500/20 text-blue-400" :
                            seq.type === "rna" ? "bg-purple-500/20 text-purple-400" :
                            "bg-green-500/20 text-green-400"
                          }`}>
                            {seq.type.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {seq.sequence.length} {seq.type === "protein" ? "aa" : "bp"}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Demo Sequences */}
              <div className="card-scientific">
                <h3 className="font-semibold text-foreground mb-4">Try Demo Sequences</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedSequence({
                      id: "demo_dna",
                      description: "Sample DNA sequence",
                      sequence: "ATGCGATCGATCGATCGTAGCTAGCTAGCATGCGATCGATCGTAGCTAGCTGATCGATCGATCGTAGCTAGCTAGCATGCGATCGATCGTAGCTAGCTGATCGATCGATCGTAGCTAGCTAGCATGC",
                      type: "dna"
                    })}
                    className="w-full text-left p-3 rounded-lg bg-secondary/50 border border-border hover:border-primary/20 transition-all"
                  >
                    <span className="font-medium text-foreground">Sample DNA</span>
                    <p className="text-xs text-muted-foreground">128 bp demonstration sequence</p>
                  </button>
                  <button
                    onClick={() => setSelectedSequence({
                      id: "demo_protein",
                      description: "Sample protein sequence",
                      sequence: "MKTAYIAKQRQISFVKSHFSRQLEERLGLIEVQAPILSRVGDGTQDNLSGAEKAVQVKVKALPDAQFEVVHSLAKWKRQQIAALEALKEKAHPNIGDGSMAVNLNVPESGVPVGNDPVFPKPRIGSGSRSNGLWFLQRVPAGIPCAFLVGVSPAGFDIPCRRAVEIAGAVLGISLDSDPNIALDYPNVPTQEPQFPGQPDPEWPRQEPQFPGQPDPEWPRQEPQFPG",
                      type: "protein"
                    })}
                    className="w-full text-left p-3 rounded-lg bg-secondary/50 border border-border hover:border-primary/20 transition-all"
                  >
                    <span className="font-medium text-foreground">Sample Protein</span>
                    <p className="text-xs text-muted-foreground">225 amino acid demonstration</p>
                  </button>
                </div>
              </div>
            </div>

            {/* Sequence Viewer */}
            <div className="lg:col-span-2">
              {selectedSequence ? (
                <SequenceViewer
                  sequence={selectedSequence.sequence}
                  type={selectedSequence.type}
                  title={`${selectedSequence.id}${selectedSequence.description ? ` - ${selectedSequence.description}` : ""}`}
                />
              ) : (
                <div className="card-scientific h-[500px] flex items-center justify-center">
                  <div className="text-center">
                    <Dna className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground">Upload a FASTA file or try a demo sequence</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </ParallaxSection>
    </div>
  );
};

export default Sequences;
