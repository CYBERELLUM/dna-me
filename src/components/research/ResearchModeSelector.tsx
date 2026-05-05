import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Brain, FlaskConical, BookOpen, Dna, Sparkles } from "lucide-react";

export type ResearchMode =
  | "general"
  | "literature"
  | "methodology"
  | "dataAnalysis"
  | "crisprDesign";

interface ResearchModeSelectorProps {
  value: ResearchMode;
  onChange: (mode: ResearchMode) => void;
  disabled?: boolean;
}

const modes: {
  value: ResearchMode;
  label: string;
  description: string;
  icon: React.ElementType;
}[] = [
  {
    value: "general",
    label: "General Research",
    description: "Broad research synthesis",
    icon: Brain,
  },
  {
    value: "literature",
    label: "Literature Review",
    description: "Paper summaries & trends",
    icon: BookOpen,
  },
  {
    value: "methodology",
    label: "Methodology",
    description: "Protocols & best practices",
    icon: FlaskConical,
  },
  {
    value: "dataAnalysis",
    label: "Data Analysis",
    description: "Stats & interpretation",
    icon: Sparkles,
  },
  {
    value: "crisprDesign",
    label: "CRISPR Design",
    description: "Guide RNA & targeting",
    icon: Dna,
  },
];

export const ResearchModeSelector = ({
  value,
  onChange,
  disabled,
}: ResearchModeSelectorProps) => {
  const selectedMode = modes.find((m) => m.value === value) || modes[0];
  const Icon = selectedMode.icon;

  return (
    <Select
      value={value}
      onValueChange={(v) => onChange(v as ResearchMode)}
      disabled={disabled}
    >
      <SelectTrigger className="w-[180px] bg-secondary border-border text-foreground">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-primary" />
          <SelectValue placeholder="Mode" />
        </div>
      </SelectTrigger>
      <SelectContent className="bg-background border-border">
        {modes.map((mode) => {
          const ModeIcon = mode.icon;
          return (
            <SelectItem
              key={mode.value}
              value={mode.value}
              className="focus:bg-secondary"
            >
              <div className="flex items-center gap-2">
                <ModeIcon className="w-4 h-4 text-primary" />
                <div>
                  <span className="font-medium">{mode.label}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {mode.description}
                  </span>
                </div>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
};

export const getSystemPromptForMode = (mode: ResearchMode): string => {
  const base = `You are a highly specialized Genomics Oracle & Collaboration Lab assistant for genomics scientists, physicists, and experts in genomic engineering.`;

  const modePrompts: Record<ResearchMode, string> = {
    general: `${base}

Provide comprehensive research synthesis across genomics topics. Be precise, cite methodologies, and acknowledge limitations.`,

    literature: `${base}

Focus on literature review: summarize key papers, identify research trends, highlight consensus vs. controversy, and suggest seminal readings. Structure responses with paper references when possible.`,

    methodology: `${base}

Focus on experimental methodology: provide detailed protocols, equipment recommendations, controls to include, common pitfalls, and troubleshooting tips. Be step-by-step and practical.`,

    dataAnalysis: `${base}

Focus on data analysis and interpretation: explain statistical approaches, recommend software/pipelines, help interpret results, discuss significance thresholds, and suggest visualization strategies.`,

    crisprDesign: `${base}

Focus on CRISPR/Cas system design: guide RNA design principles, off-target analysis, delivery methods, editing efficiency optimization, and validation strategies. Reference recent improvements in base/prime editing when relevant.`,
  };

  return modePrompts[mode];
};
