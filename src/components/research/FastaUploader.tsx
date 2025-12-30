import { useState, useCallback } from "react";
import { Upload, FileText, X, Dna, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export interface ParsedSequence {
  id: string;
  description: string;
  sequence: string;
  type: "dna" | "rna" | "protein";
}

interface FastaUploaderProps {
  onSequencesLoaded: (sequences: ParsedSequence[]) => void;
}

const detectSequenceType = (sequence: string): "dna" | "rna" | "protein" => {
  const upper = sequence.toUpperCase();
  const dnaChars = new Set(["A", "T", "G", "C", "N"]);
  const rnaChars = new Set(["A", "U", "G", "C", "N"]);
  
  let dnaCount = 0;
  let rnaCount = 0;
  let proteinCount = 0;
  
  for (const char of upper) {
    if (dnaChars.has(char)) dnaCount++;
    if (rnaChars.has(char)) rnaCount++;
    if (!/[ATGCUN]/.test(char)) proteinCount++;
  }
  
  if (proteinCount > sequence.length * 0.1) return "protein";
  if (upper.includes("U") && !upper.includes("T")) return "rna";
  return "dna";
};

const parseFasta = (content: string): ParsedSequence[] => {
  const sequences: ParsedSequence[] = [];
  const lines = content.split("\n");
  
  let currentId = "";
  let currentDescription = "";
  let currentSequence = "";
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith(">")) {
      // Save previous sequence
      if (currentId && currentSequence) {
        sequences.push({
          id: currentId,
          description: currentDescription,
          sequence: currentSequence,
          type: detectSequenceType(currentSequence),
        });
      }
      // Parse new header
      const header = trimmed.substring(1);
      const spaceIndex = header.indexOf(" ");
      if (spaceIndex > 0) {
        currentId = header.substring(0, spaceIndex);
        currentDescription = header.substring(spaceIndex + 1);
      } else {
        currentId = header;
        currentDescription = "";
      }
      currentSequence = "";
    } else if (trimmed && !trimmed.startsWith(";")) {
      // Append sequence data (ignore comment lines starting with ;)
      currentSequence += trimmed.replace(/\s/g, "");
    }
  }
  
  // Don't forget the last sequence
  if (currentId && currentSequence) {
    sequences.push({
      id: currentId,
      description: currentDescription,
      sequence: currentSequence,
      type: detectSequenceType(currentSequence),
    });
  }
  
  return sequences;
};

const FastaUploader = ({ onSequencesLoaded }: FastaUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [sequences, setSequences] = useState<ParsedSequence[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback((file: File) => {
    setError(null);
    
    if (!file.name.match(/\.(fasta|fa|fna|faa|ffn|frn|txt)$/i)) {
      setError("Please upload a valid FASTA file (.fasta, .fa, .fna, .faa, .ffn, .frn, or .txt)");
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      try {
        const parsed = parseFasta(content);
        if (parsed.length === 0) {
          setError("No valid sequences found in file. Make sure it's in FASTA format.");
          return;
        }
        setSequences(parsed);
        setFileName(file.name);
        onSequencesLoaded(parsed);
        toast({
          title: "File loaded successfully",
          description: `Found ${parsed.length} sequence${parsed.length > 1 ? "s" : ""}`
        });
      } catch (err) {
        setError("Failed to parse FASTA file. Please check the format.");
      }
    };
    reader.onerror = () => {
      setError("Failed to read file");
    };
    reader.readAsText(file);
  }, [onSequencesLoaded]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const clearFile = () => {
    setFileName(null);
    setSequences([]);
    setError(null);
    onSequencesLoaded([]);
  };

  return (
    <div className="card-scientific">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Upload className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">FASTA File Upload</h3>
          <p className="text-xs text-muted-foreground">Upload DNA, RNA, or protein sequences</p>
        </div>
      </div>

      {!fileName ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          }`}
        >
          <Dna className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-foreground mb-2">Drag and drop your FASTA file here</p>
          <p className="text-sm text-muted-foreground mb-4">or</p>
          <label className="btn-primary cursor-pointer">
            <input
              type="file"
              accept=".fasta,.fa,.fna,.faa,.ffn,.frn,.txt"
              onChange={handleChange}
              className="hidden"
            />
            Browse Files
          </label>
          <p className="text-xs text-muted-foreground mt-4">
            Supported: .fasta, .fa, .fna, .faa, .ffn, .frn, .txt
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-primary" />
              <div>
                <p className="font-medium text-foreground">{fileName}</p>
                <p className="text-xs text-muted-foreground">
                  {sequences.length} sequence{sequences.length > 1 ? "s" : ""} loaded
                </p>
              </div>
            </div>
            <button
              onClick={clearFile}
              className="p-2 hover:bg-destructive/10 rounded-md transition-colors text-destructive"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Sequence List */}
          <div className="space-y-2 max-h-[300px] overflow-auto scrollbar-thin">
            {sequences.map((seq, idx) => (
              <div
                key={idx}
                className="p-3 bg-secondary/30 rounded-lg border border-border hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-sm text-foreground">{seq.id}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    seq.type === "dna" ? "bg-blue-500/20 text-blue-400" :
                    seq.type === "rna" ? "bg-purple-500/20 text-purple-400" :
                    "bg-green-500/20 text-green-400"
                  }`}>
                    {seq.type.toUpperCase()}
                  </span>
                </div>
                {seq.description && (
                  <p className="text-xs text-muted-foreground mb-1 truncate">{seq.description}</p>
                )}
                <p className="text-xs text-muted-foreground font-mono">
                  {seq.sequence.length} {seq.type === "protein" ? "amino acids" : "bp"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-destructive/10 border border-destructive/30 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
    </div>
  );
};

export default FastaUploader;
