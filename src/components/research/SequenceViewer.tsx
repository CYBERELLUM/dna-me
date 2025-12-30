import { useState, useMemo } from "react";
import { Dna, Copy, Check, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface SequenceViewerProps {
  sequence: string;
  type?: "dna" | "rna" | "protein";
  title?: string;
}

// Nucleotide colors (DNA/RNA)
const nucleotideColors: Record<string, string> = {
  A: "bg-green-500/80 text-white", // Adenine - Green
  T: "bg-red-500/80 text-white",   // Thymine - Red
  U: "bg-red-500/80 text-white",   // Uracil - Red
  G: "bg-amber-500/80 text-white", // Guanine - Yellow/Gold
  C: "bg-blue-500/80 text-white",  // Cytosine - Blue
};

// Amino acid colors (grouped by properties)
const aminoAcidColors: Record<string, string> = {
  // Hydrophobic (orange/brown)
  A: "bg-orange-400/80 text-white", V: "bg-orange-400/80 text-white",
  I: "bg-orange-500/80 text-white", L: "bg-orange-500/80 text-white",
  M: "bg-orange-600/80 text-white", F: "bg-orange-600/80 text-white",
  W: "bg-orange-700/80 text-white", P: "bg-amber-500/80 text-white",
  // Polar (green)
  S: "bg-green-400/80 text-white", T: "bg-green-500/80 text-white",
  N: "bg-green-600/80 text-white", Q: "bg-green-700/80 text-white",
  Y: "bg-teal-500/80 text-white", C: "bg-teal-600/80 text-white",
  // Positive charge (blue)
  K: "bg-blue-500/80 text-white", R: "bg-blue-600/80 text-white",
  H: "bg-blue-400/80 text-white",
  // Negative charge (red)
  D: "bg-red-500/80 text-white", E: "bg-red-600/80 text-white",
  // Special
  G: "bg-purple-500/80 text-white", // Glycine (smallest)
  "*": "bg-gray-700/80 text-white", // Stop codon
};

const SequenceViewer = ({ sequence, type = "dna", title }: SequenceViewerProps) => {
  const [fontSize, setFontSize] = useState(14);
  const [copied, setCopied] = useState(false);
  const [showNumbers, setShowNumbers] = useState(true);

  const cleanSequence = useMemo(() => {
    return sequence.replace(/[^A-Za-z*]/g, "").toUpperCase();
  }, [sequence]);

  const isProtein = type === "protein";
  const colors = isProtein ? aminoAcidColors : nucleotideColors;

  const sequenceStats = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const char of cleanSequence) {
      counts[char] = (counts[char] || 0) + 1;
    }
    return counts;
  }, [cleanSequence]);

  const gcContent = useMemo(() => {
    if (isProtein) return null;
    const gc = (sequenceStats["G"] || 0) + (sequenceStats["C"] || 0);
    return ((gc / cleanSequence.length) * 100).toFixed(1);
  }, [sequenceStats, cleanSequence.length, isProtein]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(cleanSequence);
    setCopied(true);
    toast({ title: "Sequence copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  const chunkSize = 60;
  const sequenceChunks = useMemo(() => {
    const chunks: { start: number; chars: string[] }[] = [];
    for (let i = 0; i < cleanSequence.length; i += chunkSize) {
      chunks.push({
        start: i + 1,
        chars: cleanSequence.slice(i, i + chunkSize).split(""),
      });
    }
    return chunks;
  }, [cleanSequence]);

  return (
    <div className="card-scientific">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Dna className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{title || "Sequence Viewer"}</h3>
            <p className="text-xs text-muted-foreground font-mono">
              {cleanSequence.length} {isProtein ? "amino acids" : "nucleotides"} • {type.toUpperCase()}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNumbers(!showNumbers)}
            className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
              showNumbers ? "bg-primary/10 border-primary/30 text-primary" : "bg-secondary border-border text-muted-foreground"
            }`}
          >
            Line #
          </button>
          <button
            onClick={() => setFontSize((s) => Math.max(10, s - 2))}
            className="p-2 hover:bg-secondary rounded-md transition-colors text-muted-foreground"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => setFontSize((s) => Math.min(20, s + 2))}
            className="p-2 hover:bg-secondary rounded-md transition-colors text-muted-foreground"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setFontSize(14)}
            className="p-2 hover:bg-secondary rounded-md transition-colors text-muted-foreground"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleCopy}
            className="btn-secondary py-2 px-3 text-sm flex items-center gap-2"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-4 py-4 border-b border-border">
        {gcContent && (
          <div className="px-3 py-1.5 bg-secondary/50 rounded-md">
            <span className="text-xs text-muted-foreground">GC Content: </span>
            <span className="text-sm font-mono text-foreground">{gcContent}%</span>
          </div>
        )}
        {Object.entries(sequenceStats)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([char, count]) => (
            <div key={char} className="flex items-center gap-2">
              <span className={`w-6 h-6 rounded text-xs font-mono flex items-center justify-center ${colors[char] || "bg-gray-500/80 text-white"}`}>
                {char}
              </span>
              <span className="text-sm text-muted-foreground">{count}</span>
            </div>
          ))}
      </div>

      {/* Sequence Display */}
      <div className="mt-4 max-h-[400px] overflow-auto scrollbar-thin bg-secondary/30 rounded-lg p-4">
        <div className="font-mono" style={{ fontSize: `${fontSize}px` }}>
          {sequenceChunks.map((chunk, idx) => (
            <div key={idx} className="flex items-start gap-4 mb-1">
              {showNumbers && (
                <span className="w-12 text-right text-muted-foreground text-xs shrink-0 pt-0.5">
                  {chunk.start}
                </span>
              )}
              <div className="flex flex-wrap gap-px">
                {chunk.chars.map((char, charIdx) => (
                  <span
                    key={charIdx}
                    className={`inline-flex items-center justify-center w-5 h-5 rounded-sm text-xs font-bold ${
                      colors[char] || "bg-gray-500/80 text-white"
                    }`}
                    title={`Position ${chunk.start + charIdx}: ${char}`}
                  >
                    {char}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground mb-2">Color Legend:</p>
        <div className="flex flex-wrap gap-2">
          {isProtein ? (
            <>
              <span className="text-xs px-2 py-1 rounded bg-orange-500/20 text-orange-400">Hydrophobic</span>
              <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400">Polar</span>
              <span className="text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-400">Positive Charge</span>
              <span className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-400">Negative Charge</span>
              <span className="text-xs px-2 py-1 rounded bg-purple-500/20 text-purple-400">Glycine</span>
            </>
          ) : (
            <>
              <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400">A - Adenine</span>
              <span className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-400">{type === "rna" ? "U - Uracil" : "T - Thymine"}</span>
              <span className="text-xs px-2 py-1 rounded bg-amber-500/20 text-amber-400">G - Guanine</span>
              <span className="text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-400">C - Cytosine</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SequenceViewer;
