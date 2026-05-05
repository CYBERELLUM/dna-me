import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export interface ResearchFilters {
  dateFrom?: Date;
  dateTo?: Date;
  recency?: "any" | "day" | "week" | "month" | "year";
  journals: string[];
  studyType?: string;
  species?: string;
  technique?: string;
}

export const EMPTY_FILTERS: ResearchFilters = {
  recency: "any",
  journals: [],
};

const JOURNAL_OPTIONS = [
  { id: "nature.com", label: "Nature" },
  { id: "cell.com", label: "Cell" },
  { id: "nejm.org", label: "NEJM" },
  { id: "thelancet.com", label: "The Lancet" },
  { id: "science.org", label: "Science / AAAS" },
  { id: "genome.cshlp.org", label: "Genome Research" },
  { id: "academic.oup.com", label: "Oxford Academic (Bioinformatics, NAR)" },
  { id: "pubmed.ncbi.nlm.nih.gov", label: "PubMed / NCBI" },
  { id: "biorxiv.org", label: "bioRxiv" },
  { id: "medrxiv.org", label: "medRxiv" },
  { id: "clinicaltrials.gov", label: "ClinicalTrials.gov" },
];

const STUDY_TYPES = [
  "Any", "Randomized Controlled Trial", "Cohort Study", "Case-Control",
  "Meta-Analysis / Systematic Review", "GWAS", "Functional / Mechanistic",
  "Preclinical (in vitro / in vivo)", "Case Report", "Review",
];

const SPECIES = [
  "Any", "Human (Homo sapiens)", "Mouse (Mus musculus)", "Rat",
  "Zebrafish", "Drosophila", "C. elegans", "Yeast (S. cerevisiae)",
  "E. coli", "Plant", "Non-human primate",
];

const TECHNIQUES = [
  "Any", "Whole-genome sequencing (WGS)", "Whole-exome sequencing (WES)",
  "RNA-seq / scRNA-seq", "ChIP-seq / ATAC-seq", "CRISPR-Cas9",
  "Base / Prime editing", "Methylation array / WGBS",
  "Proteomics (MS)", "Metabolomics", "Long-read (PacBio / Nanopore)",
  "Spatial transcriptomics", "Multi-omics integration",
];

export const countActiveFilters = (f: ResearchFilters): number => {
  let n = 0;
  if (f.dateFrom) n++;
  if (f.dateTo) n++;
  if (f.recency && f.recency !== "any") n++;
  if (f.journals.length) n++;
  if (f.studyType && f.studyType !== "Any") n++;
  if (f.species && f.species !== "Any") n++;
  if (f.technique && f.technique !== "Any") n++;
  return n;
};

interface Props {
  value: ResearchFilters;
  onChange: (f: ResearchFilters) => void;
  disabled?: boolean;
}

export const SearchFilters = ({ value, onChange, disabled }: Props) => {
  const [open, setOpen] = useState(false);
  const active = countActiveFilters(value);

  const toggleJournal = (id: string) => {
    const next = value.journals.includes(id)
      ? value.journals.filter((j) => j !== id)
      : [...value.journals, id];
    onChange({ ...value, journals: next });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          className="gap-2 h-8"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span>Filters</span>
          {active > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
              {active}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[420px] max-h-[80vh] overflow-y-auto" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">Advanced Search Filters</h4>
            {active > 0 && (
              <Button
                type="button" variant="ghost" size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => onChange(EMPTY_FILTERS)}
              >
                <X className="h-3 w-3 mr-1" /> Reset
              </Button>
            )}
          </div>

          {/* Recency */}
          <div className="space-y-1.5">
            <Label className="text-xs">Recency preset</Label>
            <Select
              value={value.recency || "any"}
              onValueChange={(v) => onChange({ ...value, recency: v as any })}
            >
              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any time</SelectItem>
                <SelectItem value="day">Past 24 hours</SelectItem>
                <SelectItem value="week">Past week</SelectItem>
                <SelectItem value="month">Past month</SelectItem>
                <SelectItem value="year">Past year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs">From</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn(
                    "h-8 w-full justify-start text-left font-normal",
                    !value.dateFrom && "text-muted-foreground",
                  )}>
                    <CalendarIcon className="h-3.5 w-3.5 mr-2" />
                    {value.dateFrom ? format(value.dateFrom, "PP") : "Any"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={value.dateFrom}
                    onSelect={(d) => onChange({ ...value, dateFrom: d })}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">To</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn(
                    "h-8 w-full justify-start text-left font-normal",
                    !value.dateTo && "text-muted-foreground",
                  )}>
                    <CalendarIcon className="h-3.5 w-3.5 mr-2" />
                    {value.dateTo ? format(value.dateTo, "PP") : "Any"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={value.dateTo}
                    onSelect={(d) => onChange({ ...value, dateTo: d })}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Journals */}
          <div className="space-y-1.5">
            <Label className="text-xs">Journals / Venues</Label>
            <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto border rounded-md p-2">
              {JOURNAL_OPTIONS.map((j) => (
                <label key={j.id} className="flex items-start gap-2 text-xs cursor-pointer">
                  <Checkbox
                    checked={value.journals.includes(j.id)}
                    onCheckedChange={() => toggleJournal(j.id)}
                    className="mt-0.5"
                  />
                  <span>{j.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Study type */}
          <div className="space-y-1.5">
            <Label className="text-xs">Study type</Label>
            <Select
              value={value.studyType || "Any"}
              onValueChange={(v) => onChange({ ...value, studyType: v })}
            >
              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STUDY_TYPES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Species */}
          <div className="space-y-1.5">
            <Label className="text-xs">Species / Model organism</Label>
            <Select
              value={value.species || "Any"}
              onValueChange={(v) => onChange({ ...value, species: v })}
            >
              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SPECIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Technique */}
          <div className="space-y-1.5">
            <Label className="text-xs">Technique / Assay</Label>
            <Select
              value={value.technique || "Any"}
              onValueChange={(v) => onChange({ ...value, technique: v })}
            >
              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TECHNIQUES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Button
            type="button" size="sm" className="w-full"
            onClick={() => setOpen(false)}
          >
            Apply filters
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
