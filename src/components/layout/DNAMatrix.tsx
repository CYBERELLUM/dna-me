import { useEffect, useState } from "react";

const DNA_CHARS = ["A", "T", "G", "C", "═", "╔", "╗", "║", "╚", "╝", "◊", "●", "○", "∞", "Ω"];

// Triple helix structure pattern
const TRIPLE_HELIX = [
  "  ╭──●──╮  ",
  " ╱  A  T  ╲ ",
  "●───G───C──●",
  " ╲  T  A  ╱ ",
  "  ╰──●──╯  ",
  "  ╱     ╲  ",
  " ●   G   ● ",
  "╱  C   T  ╲",
  "●────●────●",
  "╲  A   G  ╱",
  " ●   C   ● ",
  "  ╲     ╱  ",
  "  ╭──●──╮  ",
  " ╱  T  G  ╲ ",
  "●───A───C──●",
  " ╲  G  T  ╱ ",
  "  ╰──●──╯  ",
];

interface MatrixColumn {
  id: number;
  left: number;
  duration: number;
  delay: number;
  chars: string[];
}

interface HelixStrand {
  id: number;
  left: number;
  duration: number;
  startTime: number;
}

export const DNAMatrix = () => {
  const [columns, setColumns] = useState<MatrixColumn[]>([]);
  const [helixStrands, setHelixStrands] = useState<HelixStrand[]>([]);

  const generateColumn = (id: number): MatrixColumn => {
    const charCount = Math.floor(Math.random() * 15) + 8;
    const chars = Array.from({ length: charCount }, () => 
      DNA_CHARS[Math.floor(Math.random() * DNA_CHARS.length)]
    );
    
    return {
      id,
      left: Math.random() * 100,
      duration: Math.random() * 8 + 6,
      delay: Math.random() * 5,
      chars,
    };
  };

  useEffect(() => {
    const initialColumns = Array.from({ length: 20 }, (_, i) => generateColumn(i));
    setColumns(initialColumns);
  }, []);

  // Spawn large helix strands randomly every 3-5 seconds
  useEffect(() => {
    let helixId = 0;
    
    const spawnHelix = () => {
      const newHelix: HelixStrand = {
        id: helixId++,
        left: Math.random() * 80 + 5, // 5-85% to keep within bounds
        duration: Math.random() * 4 + 8, // 8-12 seconds to fall
        startTime: Date.now(),
      };
      
      setHelixStrands(prev => [...prev, newHelix]);
      
      // Remove helix after animation completes
      setTimeout(() => {
        setHelixStrands(prev => prev.filter(h => h.id !== newHelix.id));
      }, (newHelix.duration + 1) * 1000);
      
      // Schedule next helix spawn (3-5 seconds)
      const nextSpawn = Math.random() * 2000 + 3000;
      setTimeout(spawnHelix, nextSpawn);
    };

    // Initial spawn after 1 second
    const initialTimeout = setTimeout(spawnHelix, 1000);
    
    return () => clearTimeout(initialTimeout);
  }, []);

  return (
    <div className="dna-matrix-container">
      {/* Regular matrix rain */}
      {columns.map((column) => (
        <div
          key={column.id}
          className="dna-matrix-column"
          style={{
            left: `${column.left}%`,
            animationDuration: `${column.duration}s`,
            animationDelay: `${column.delay}s`,
          }}
        >
          {column.chars.map((char, i) => (
            <div 
              key={i} 
              style={{ 
                opacity: 1 - (i * 0.05),
              }}
            >
              {char}
            </div>
          ))}
        </div>
      ))}

      {/* Large triple helix strands */}
      {helixStrands.map((helix) => (
        <div
          key={helix.id}
          className="triple-helix-strand"
          style={{
            left: `${helix.left}%`,
            animationDuration: `${helix.duration}s`,
          }}
        >
          {TRIPLE_HELIX.map((line, i) => (
            <div key={i} className="helix-line">
              {line}
            </div>
          ))}
          {TRIPLE_HELIX.map((line, i) => (
            <div key={`repeat-${i}`} className="helix-line">
              {line}
            </div>
          ))}
          {TRIPLE_HELIX.map((line, i) => (
            <div key={`repeat2-${i}`} className="helix-line">
              {line}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
