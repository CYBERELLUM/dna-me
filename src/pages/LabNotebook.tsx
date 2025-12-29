import { Navigation } from "@/components/layout/Navigation";
import { ParallaxSection } from "@/components/layout/ParallaxSection";
import { useState } from "react";
import { 
  Plus, 
  FileText, 
  Calendar, 
  Tag, 
  Save, 
  Trash2, 
  FlaskConical,
  Beaker,
  Microscope,
  Dna
} from "lucide-react";

interface Note {
  id: string;
  title: string;
  content: string;
  template: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
}

const templates = [
  { id: "experiment", name: "Experiment Protocol", icon: FlaskConical },
  { id: "observation", name: "Lab Observation", icon: Microscope },
  { id: "analysis", name: "Data Analysis", icon: Beaker },
  { id: "hypothesis", name: "Hypothesis Notes", icon: Dna },
  { id: "blank", name: "Blank Note", icon: FileText },
];

const templateContent: Record<string, string> = {
  experiment: `# Experiment Protocol

## Experiment ID: [EXP-YYYY-MM-DD-###]
## Principal Investigator: 
## Date: ${new Date().toISOString().split('T')[0]}

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

## Date: ${new Date().toISOString().split('T')[0]}
## Time: ${new Date().toLocaleTimeString()}
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

## Analysis ID: [ANA-YYYY-MM-DD-###]
## Dataset Reference: 
## Analyst: 
## Date: ${new Date().toISOString().split('T')[0]}

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

## Date: ${new Date().toISOString().split('T')[0]}
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

## Date: ${new Date().toISOString().split('T')[0]}

---

`,
};

const LabNotebook = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  const createNote = (templateId: string) => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: `${templates.find(t => t.id === templateId)?.name} - ${new Date().toLocaleDateString()}`,
      content: templateContent[templateId],
      template: templateId,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [],
    };
    setNotes([newNote, ...notes]);
    setSelectedNote(newNote);
    setShowTemplates(false);
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    setNotes(notes.map(note => 
      note.id === id 
        ? { ...note, ...updates, updatedAt: new Date() } 
        : note
    ));
    if (selectedNote?.id === id) {
      setSelectedNote({ ...selectedNote, ...updates, updatedAt: new Date() });
    }
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter(note => note.id !== id));
    if (selectedNote?.id === id) {
      setSelectedNote(null);
    }
  };

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
              All entries are timestamped and organized for compliance.
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
                            onClick={() => createNote(template.id)}
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
                  {notes.length === 0 ? (
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
                        value={selectedNote.title}
                        onChange={(e) => updateNote(selectedNote.id, { title: e.target.value })}
                        className="flex-1 bg-transparent text-xl font-semibold text-foreground focus:outline-none"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {}}
                          className="btn-secondary py-2 px-3 text-sm flex items-center gap-2"
                        >
                          <Save className="w-4 h-4" />
                          Save
                        </button>
                        <button
                          onClick={() => deleteNote(selectedNote.id)}
                          className="p-2 text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 py-3 text-xs text-muted-foreground font-mono">
                      <span>Created: {selectedNote.createdAt.toLocaleString()}</span>
                      <span>Modified: {selectedNote.updatedAt.toLocaleString()}</span>
                    </div>

                    <textarea
                      value={selectedNote.content}
                      onChange={(e) => updateNote(selectedNote.id, { content: e.target.value })}
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
