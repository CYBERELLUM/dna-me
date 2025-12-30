import { Navigation } from "@/components/layout/Navigation";
import { ParallaxSection } from "@/components/layout/ParallaxSection";
import { useState, useEffect, useRef } from "react";
import { 
  Plus, 
  FileText, 
  Calendar, 
  Save, 
  Trash2, 
  FlaskConical,
  Beaker,
  Microscope,
  Dna,
  Loader2
} from "lucide-react";
import { useLabNotes, LabNote } from "@/hooks/useLabNotes";
import { useAuth } from "@/hooks/useAuth";

const templates = [
  { id: "experiment", name: "Experiment Protocol", icon: FlaskConical },
  { id: "observation", name: "Lab Observation", icon: Microscope },
  { id: "analysis", name: "Data Analysis", icon: Beaker },
  { id: "hypothesis", name: "Hypothesis Notes", icon: Dna },
  { id: "blank", name: "Blank Note", icon: FileText },
];

const getTemplateContent = (templateId: string): string => {
  const date = new Date().toISOString().split('T')[0];
  const time = new Date().toLocaleTimeString();
  
  const templateContent: Record<string, string> = {
    experiment: `# Experiment Protocol

## Experiment ID: [EXP-${date}-###]
## Principal Investigator: 
## Date: ${date}

---

### Objective
[State the primary objective of this experiment]

### Hypothesis
[State your hypothesis]

### Materials Required
- 
- 
- 

### Procedure
1. 
2. 
3. 

### Safety Considerations
- 

### Expected Results


### Observations


### Conclusion


### Next Steps


---
*Signature: _________________________ Date: _________*`,

    observation: `# Lab Observation Log

## Date: ${date}
## Time: ${time}
## Observer: 

---

### Sample/Subject ID


### Environmental Conditions
- Temperature: 
- Humidity: 
- Other: 

### Observations


### Anomalies Noted


### Photographs/Diagrams
[Reference any attached media]

### Immediate Actions Taken


---
*Verified by: _________________________ Date: _________*`,

    analysis: `# Data Analysis Report

## Analysis ID: [ANA-${date}-###]
## Dataset Reference: 
## Analyst: 
## Date: ${date}

---

### Data Source


### Analysis Methodology


### Statistical Methods Used
- 
- 

### Key Findings


### Data Visualization References


### Interpretation


### Limitations


### Recommendations


---
*Review Status: Pending / Approved*`,

    hypothesis: `# Research Hypothesis

## Date: ${date}
## Researcher: 

---

### Background Context


### Research Question


### Null Hypothesis (H₀)


### Alternative Hypothesis (H₁)


### Variables
- Independent: 
- Dependent: 
- Controlled: 

### Predicted Outcome


### Testing Approach


### Significance Level (α)


### References


---`,

    blank: `# New Note

## Date: ${date}

---

`,
  };

  return templateContent[templateId] || templateContent.blank;
};

const LabNotebook = () => {
  const { user, loading: authLoading } = useAuth();
  const { notes, isLoading, createNote, updateNote, deleteNote } = useLabNotes();
  const [selectedNote, setSelectedNote] = useState<LabNote | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [localTitle, setLocalTitle] = useState("");
  const [localContent, setLocalContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update local state when selected note changes
  useEffect(() => {
    if (selectedNote) {
      setLocalTitle(selectedNote.title);
      setLocalContent(selectedNote.content);
    }
  }, [selectedNote?.id]);

  // Auto-save with debounce
  const handleContentChange = (field: "title" | "content", value: string) => {
    if (field === "title") {
      setLocalTitle(value);
    } else {
      setLocalContent(value);
    }

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for auto-save
    saveTimeoutRef.current = setTimeout(async () => {
      if (selectedNote) {
        setIsSaving(true);
        await updateNote(selectedNote.id, {
          title: field === "title" ? value : localTitle,
          content: field === "content" ? value : localContent,
        });
        setIsSaving(false);
      }
    }, 1000);
  };

  const handleCreateNote = async (templateId: string) => {
    const templateName = templates.find(t => t.id === templateId)?.name || "Note";
    const title = `${templateName} - ${new Date().toLocaleDateString()}`;
    const content = getTemplateContent(templateId);
    
    const newNote = await createNote(title, content, templateId);
    if (newNote) {
      setSelectedNote(newNote);
    }
    setShowTemplates(false);
  };

  const handleDeleteNote = async () => {
    if (selectedNote) {
      await deleteNote(selectedNote.id);
      setSelectedNote(null);
    }
  };

  const handleManualSave = async () => {
    if (selectedNote) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      setIsSaving(true);
      await updateNote(selectedNote.id, {
        title: localTitle,
        content: localContent,
      });
      setIsSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <ParallaxSection className="pt-24 pb-16">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <FlaskConical className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-foreground mb-4">Lab Notebook</h1>
            <p className="text-muted-foreground">Please sign in to access your lab notebook.</p>
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
              <FlaskConical className="w-4 h-4 text-accent" />
              <span className="text-sm font-mono text-accent">Scientific Documentation</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Lab <span className="text-gradient-accent">Notebook</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Document your research with professional scientific templates. 
              All entries are automatically saved and timestamped.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Notes List */}
            <div className="lg:col-span-1">
              <div className="card-scientific">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground">Notes</h3>
                  <button
                    onClick={() => setShowTemplates(!showTemplates)}
                    className="btn-primary py-2 px-3 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {showTemplates && (
                  <div className="mb-4 p-4 bg-secondary/50 rounded-lg border border-border">
                    <p className="text-xs text-muted-foreground mb-3 font-mono">Select Template</p>
                    <div className="space-y-2">
                      {templates.map((template) => {
                        const Icon = template.icon;
                        return (
                          <button
                            key={template.id}
                            onClick={() => handleCreateNote(template.id)}
                            className="w-full flex items-center gap-3 p-3 rounded-md bg-card hover:bg-primary/10 hover:border-primary/30 border border-border transition-all text-left"
                          >
                            <Icon className="w-4 h-4 text-primary" />
                            <span className="text-sm text-foreground">{template.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="space-y-2 max-h-[500px] overflow-y-auto scrollbar-thin">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : notes.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No notes yet. Create your first note using a template.
                    </p>
                  ) : (
                    notes.map((note) => (
                      <button
                        key={note.id}
                        onClick={() => setSelectedNote(note)}
                        className={`w-full text-left p-4 rounded-lg border transition-all ${
                          selectedNote?.id === note.id
                            ? "bg-primary/10 border-primary/30"
                            : "bg-secondary/50 border-border hover:border-primary/20"
                        }`}
                      >
                        <h4 className="font-medium text-foreground text-sm truncate">{note.title}</h4>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>{note.updatedAt.toLocaleDateString()}</span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Note Editor */}
            <div className="lg:col-span-2">
              <div className="card-scientific h-[700px] flex flex-col">
                {selectedNote ? (
                  <>
                    <div className="flex items-center justify-between pb-4 border-b border-border">
                      <input
                        type="text"
                        value={localTitle}
                        onChange={(e) => handleContentChange("title", e.target.value)}
                        className="flex-1 bg-transparent text-xl font-semibold text-foreground focus:outline-none"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleManualSave}
                          disabled={isSaving}
                          className="btn-secondary py-2 px-3 text-sm flex items-center gap-2"
                        >
                          {isSaving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                          {isSaving ? "Saving..." : "Save"}
                        </button>
                        <button
                          onClick={handleDeleteNote}
                          className="p-2 text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 py-3 text-xs text-muted-foreground font-mono">
                      <span>Created: {selectedNote.createdAt.toLocaleString()}</span>
                      <span>Modified: {selectedNote.updatedAt.toLocaleString()}</span>
                      {isSaving && <span className="text-primary">Auto-saving...</span>}
                    </div>

                    <textarea
                      value={localContent}
                      onChange={(e) => handleContentChange("content", e.target.value)}
                      className="flex-1 w-full bg-secondary/30 rounded-lg p-4 font-mono text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 scrollbar-thin"
                      placeholder="Start writing..."
                    />
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <FileText className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                      <p className="text-muted-foreground">Select a note or create a new one</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </ParallaxSection>
    </div>
  );
};

export default LabNotebook;
