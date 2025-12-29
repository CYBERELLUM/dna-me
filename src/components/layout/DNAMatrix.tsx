import { useEffect, useState, useMemo } from "react";

const DNA_CHARS = ["A", "T", "G", "C", "═", "╔", "╗", "║", "╚", "╝", "◊", "●", "○", "∞", "Ω"];

interface MatrixColumn {
  id: number;
  left: number;
  duration: number;
  delay: number;
  chars: string[];
}

export const DNAMatrix = () => {
  const [columns, setColumns] = useState<MatrixColumn[]>([]);

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

  return (
    <div className="dna-matrix-container">
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
                animationDelay: `${i * 0.1}s`
              }}
            >
              {char}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
