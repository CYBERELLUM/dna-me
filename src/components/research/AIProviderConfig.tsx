import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Key, Server, Link2, Shield, Eye, EyeOff, Loader2, Download, Upload } from "lucide-react";
import { api } from "@/integrations/api/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useRef } from "react";

interface ProviderField {
  id: string;
  label: string;
  placeholder: string;
  type: "text" | "password";
}

interface Provider {
  id: string;
  name: string;
  description: string;
  status: "connected" | "disconnected" | "pending";
  fields: ProviderField[];
}

const providers: Provider[] = [
  {
    id: "multiaigateway",
    name: "Primary AI Gateway",
    description: "Core research synthesis engine",
    status: "connected",
    fields: [{ id: "api_key", label: "API Key", placeholder: "key_...", type: "password" }],
  },
  {
    id: "openai",
    name: "Secondary Provider",
    description: "Additional AI capacity",
    status: "disconnected",
    fields: [{ id: "api_key", label: "API Key", placeholder: "sk-...", type: "password" }],
  },
  {
    id: "gemini",
    name: "Tertiary Provider",
    description: "Multimodal analysis",
    status: "disconnected",
    fields: [{ id: "api_key", label: "API Key", placeholder: "key_...", type: "password" }],
  },
  {
    id: "axiom-oracle",
    name: "AXIOM Oracle",
    description: "Governed multi-model intelligence",
    status: "disconnected",
    fields: [
      { id: "project_id", label: "Project ID", placeholder: "my-project-123", type: "text" },
      { id: "region", label: "Region", placeholder: "us-central1", type: "text" },
      { id: "api_key", label: "API Key", placeholder: "key_...", type: "password" },
    ],
  },
  {
    id: "deepagent",
    name: "Autonomous Agent",
    description: "Autonomous research agent",
    status: "disconnected",
    fields: [{ id: "api_key", label: "API Key", placeholder: "key_...", type: "password" }],
  },
  {
    id: "abacus",
    name: "Scientific Compute",
    description: "Scientific computation",
    status: "disconnected",
    fields: [{ id: "api_key", label: "API Key", placeholder: "key_...", type: "password" }],
  },
  {
    id: "custom1",
    name: "Custom AI Provider 1",
    description: "User-defined AI endpoint",
    status: "disconnected",
    fields: [
      { id: "endpoint", label: "API Endpoint", placeholder: "https://api.custom.ai/v1", type: "text" },
      { id: "api_key", label: "API Key", placeholder: "Your API key", type: "password" },
    ],
  },
  {
    id: "custom2",
    name: "Custom AI Provider 2",
    description: "User-defined AI endpoint",
    status: "disconnected",
    fields: [
      { id: "endpoint", label: "API Endpoint", placeholder: "https://api.custom.ai/v1", type: "text" },
      { id: "api_key", label: "API Key", placeholder: "Your API key", type: "password" },
    ],
  },
  {
    id: "custom3",
    name: "Custom AI Provider 3",
    description: "User-defined AI endpoint",
    status: "disconnected",
    fields: [
      { id: "endpoint", label: "API Endpoint", placeholder: "https://api.custom.ai/v1", type: "text" },
      { id: "api_key", label: "API Key", placeholder: "Your API key", type: "password" },
    ],
  },
];

export const AIProviderConfig = () => {
  const { user } = useAuth();
  const [expandedSection, setExpandedSection] = useState<string | null>("providers");
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved configurations on mount
  useEffect(() => {
    const loadConfigurations = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await api
          .from("api_configurations")
          .select("provider, api_key_vault_id")
          .eq("user_id", user.id);

        if (error) throw error;

        const values: Record<string, string> = {};
        data?.forEach((config) => {
          if (config.api_key_vault_id) {
            // Never fetch the plaintext key back to the browser — show a masked placeholder.
            values[`${config.provider}-api_key`] = "••••••••••••••••";
          }
        });
        setFormValues(values);
      } catch (error) {
        console.error("Error loading configurations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadConfigurations();
  }, [user]);

  const togglePassword = (fieldId: string) => {
    setShowPasswords((prev) => ({ ...prev, [fieldId]: !prev[fieldId] }));
  };

  const handleInputChange = (providerId: string, fieldId: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [`${providerId}-${fieldId}`]: value }));
  };

  const handleSave = async () => {
    if (!user) {
      toast.error("Please sign in to save configurations");
      return;
    }

    setIsSaving(true);
    try {
      const MASK = "••••••••••••••••";
      const toSave = providers.filter((provider) => {
        const apiKeyField = provider.fields.find((f) => f.id === "api_key");
        const val = formValues[`${provider.id}-api_key`];
        // Skip if empty or unchanged mask (user didn't edit)
        return apiKeyField && val && val !== MASK;
      });

      for (const provider of toSave) {
        const { error } = await api.rpc("upsert_api_key", {
          _provider: provider.id,
          _api_key: formValues[`${provider.id}-api_key`],
          _model: null,
          _is_enabled: true,
        });
        if (error) throw error;
      }

      toast.success("Configuration saved securely (encrypted in Vault)");
    } catch (error) {
      console.error("Error saving configuration:", error);
      toast.error("Failed to save configuration");
    } finally {
      setIsSaving(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const exportData = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      configurations: formValues,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cyberellum-api-config-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Configuration exported successfully");
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importData = JSON.parse(content);

        if (!importData.configurations || typeof importData.configurations !== "object") {
          throw new Error("Invalid configuration file format");
        }

        setFormValues(importData.configurations);
        toast.success("Configuration imported successfully. Click 'Save Configuration' to persist changes.");
      } catch (error) {
        console.error("Error importing configuration:", error);
        toast.error("Failed to import configuration. Invalid file format.");
      }
    };
    reader.readAsText(file);
    
    // Reset the input so the same file can be imported again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      {/* AI Providers */}
      <div className="card-scientific">
        <button
          onClick={() => setExpandedSection(expandedSection === "providers" ? null : "providers")}
          className="flex items-center justify-between w-full"
        >
          <div className="flex items-center gap-3">
            <Key className="w-5 h-5 text-primary" />
            <div className="text-left">
              <h3 className="font-semibold text-foreground">AI Provider API Keys</h3>
              <p className="text-xs text-muted-foreground">Configure multi-AI routing</p>
            </div>
          </div>
          {expandedSection === "providers" ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </button>

        {expandedSection === "providers" && (
          <div className="mt-6 space-y-4">
            {providers.map((provider) => {
              // Determine connection status based on whether an API key is configured
              const hasApiKey = !!formValues[`${provider.id}-api_key`];
              const isGateway = provider.id === "multiaigateway";
              const status = isGateway || hasApiKey ? "connected" : "disconnected";
              
              return (
              <div key={provider.id} className="p-4 bg-secondary/50 rounded-lg border border-border">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-foreground">{provider.name}</h4>
                    <p className="text-xs text-muted-foreground">{provider.description}</p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded font-mono ${
                      status === "connected"
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {status}
                  </span>
                </div>
                <div className="space-y-3">
                  {provider.fields.map((field) => (
                    <div key={field.id}>
                      <label className="block text-xs text-muted-foreground mb-1 font-mono">
                        {field.label}
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords[`${provider.id}-${field.id}`] ? "text" : field.type}
                          placeholder={field.placeholder}
                          value={formValues[`${provider.id}-${field.id}`] || ""}
                          onChange={(e) => handleInputChange(provider.id, field.id, e.target.value)}
                          className="w-full input-scientific pr-10"
                        />
                        {field.type === "password" && (
                          <button
                            type="button"
                            onClick={() => togglePassword(`${provider.id}-${field.id}`)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPasswords[`${provider.id}-${field.id}`] ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SSH & VPN */}
      <div className="card-scientific">
        <button
          onClick={() => setExpandedSection(expandedSection === "ssh" ? null : "ssh")}
          className="flex items-center justify-between w-full"
        >
          <div className="flex items-center gap-3">
            <Server className="w-5 h-5 text-accent" />
            <div className="text-left">
              <h3 className="font-semibold text-foreground">SSH & VPN Access</h3>
              <p className="text-xs text-muted-foreground">Secure remote connections</p>
            </div>
          </div>
          {expandedSection === "ssh" ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </button>

        {expandedSection === "ssh" && (
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1 font-mono">SSH Host</label>
                <input type="text" placeholder="research.lab.edu" className="w-full input-scientific" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1 font-mono">Port</label>
                <input type="text" placeholder="22" className="w-full input-scientific" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1 font-mono">Username</label>
                <input type="text" placeholder="researcher" className="w-full input-scientific" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1 font-mono">Password / Key</label>
                <input type="password" placeholder="••••••••" className="w-full input-scientific" />
              </div>
            </div>
            <div className="pt-4 border-t border-border">
              <label className="block text-xs text-muted-foreground mb-1 font-mono">VPN Configuration</label>
              <input type="text" placeholder="VPN endpoint or config path" className="w-full input-scientific" />
            </div>
          </div>
        )}
      </div>

      {/* Webhooks & Databases */}
      <div className="card-scientific">
        <button
          onClick={() => setExpandedSection(expandedSection === "webhooks" ? null : "webhooks")}
          className="flex items-center justify-between w-full"
        >
          <div className="flex items-center gap-3">
            <Link2 className="w-5 h-5 text-primary" />
            <div className="text-left">
              <h3 className="font-semibold text-foreground">Webhooks & External Databases</h3>
              <p className="text-xs text-muted-foreground">Connect external data sources</p>
            </div>
          </div>
          {expandedSection === "webhooks" ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </button>

        {expandedSection === "webhooks" && (
          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1 font-mono">Webhook URL</label>
              <input type="text" placeholder="https://your-webhook.endpoint/receive" className="w-full input-scientific" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1 font-mono">Webhook Secret</label>
              <input type="password" placeholder="whsec_..." className="w-full input-scientific" />
            </div>
            <div className="pt-4 border-t border-border">
              <label className="block text-xs text-muted-foreground mb-1 font-mono">External Database Connection String</label>
              <input type="password" placeholder="postgresql://user:pass@host:5432/dbname" className="w-full input-scientific" />
            </div>
          </div>
        )}
      </div>

      {/* Import/Export & Save Buttons */}
      <div className="flex flex-wrap justify-between gap-3">
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImport}
            accept=".json"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-secondary flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Import
          </button>
          <button
            onClick={handleExport}
            disabled={Object.keys(formValues).length === 0}
            className="btn-secondary flex items-center gap-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving || !user}
          className="btn-primary flex items-center gap-2 disabled:opacity-50"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Shield className="w-4 h-4" />
          )}
          {isSaving ? "Saving..." : "Save Configuration"}
        </button>
      </div>
    </div>
  );
};
