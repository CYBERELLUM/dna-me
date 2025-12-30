import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Key, Server, Link2, Shield, Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

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
    id: "lovable",
    name: "Lovable AI",
    description: "Primary research synthesis engine",
    status: "connected",
    fields: [{ id: "api_key", label: "API Key", placeholder: "lv_...", type: "password" }],
  },
  {
    id: "openai",
    name: "OpenAI",
    description: "GPT-4 and embeddings",
    status: "disconnected",
    fields: [{ id: "api_key", label: "API Key", placeholder: "sk-...", type: "password" }],
  },
  {
    id: "gemini",
    name: "Google Gemini",
    description: "Multimodal analysis",
    status: "disconnected",
    fields: [{ id: "api_key", label: "API Key", placeholder: "AIza...", type: "password" }],
  },
  {
    id: "vertex",
    name: "Vertex AI",
    description: "Enterprise ML platform",
    status: "disconnected",
    fields: [
      { id: "project_id", label: "Project ID", placeholder: "my-project-123", type: "text" },
      { id: "api_key", label: "Service Account Key", placeholder: "JSON key...", type: "password" },
    ],
  },
  {
    id: "deepagent",
    name: "DeepAgent",
    description: "Autonomous research agent",
    status: "disconnected",
    fields: [{ id: "api_key", label: "API Key", placeholder: "da_...", type: "password" }],
  },
  {
    id: "abacus",
    name: "Abacus AI",
    description: "Scientific computation",
    status: "disconnected",
    fields: [{ id: "api_key", label: "API Key", placeholder: "ab_...", type: "password" }],
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
        const { data, error } = await supabase
          .from("api_configurations")
          .select("*")
          .eq("user_id", user.id);

        if (error) throw error;

        const values: Record<string, string> = {};
        data?.forEach((config) => {
          if (config.api_key_encrypted) {
            values[`${config.provider}-api_key`] = config.api_key_encrypted;
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
      // Get all providers with api_key fields that have values
      const configurationsToSave = providers
        .filter((provider) => {
          const apiKeyField = provider.fields.find((f) => f.id === "api_key");
          return apiKeyField && formValues[`${provider.id}-api_key`];
        })
        .map((provider) => ({
          user_id: user.id,
          provider: provider.id,
          api_key_encrypted: formValues[`${provider.id}-api_key`],
          is_enabled: true,
        }));

      // For each configuration, upsert (insert or update)
      for (const config of configurationsToSave) {
        const { error } = await supabase
          .from("api_configurations")
          .upsert(config, { onConflict: "user_id,provider" });

        if (error) throw error;
      }

      toast.success("Configuration saved successfully");
    } catch (error) {
      console.error("Error saving configuration:", error);
      toast.error("Failed to save configuration");
    } finally {
      setIsSaving(false);
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
            {providers.map((provider) => (
              <div key={provider.id} className="p-4 bg-secondary/50 rounded-lg border border-border">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-foreground">{provider.name}</h4>
                    <p className="text-xs text-muted-foreground">{provider.description}</p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded font-mono ${
                      provider.status === "connected"
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {provider.status}
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
            ))}
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

      {/* Save Button */}
      <div className="flex justify-end">
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
