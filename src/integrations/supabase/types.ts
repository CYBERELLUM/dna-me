export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      api_configurations: {
        Row: {
          api_key_encrypted: string | null
          created_at: string
          id: string
          is_enabled: boolean | null
          provider: string
          updated_at: string
          user_id: string
        }
        Insert: {
          api_key_encrypted?: string | null
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          provider: string
          updated_at?: string
          user_id: string
        }
        Update: {
          api_key_encrypted?: string | null
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          provider?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      blocked_ips: {
        Row: {
          blocked_until: string | null
          created_at: string
          id: string
          ip_address: string
          permanent: boolean
          reason: string
        }
        Insert: {
          blocked_until?: string | null
          created_at?: string
          id?: string
          ip_address: string
          permanent?: boolean
          reason: string
        }
        Update: {
          blocked_until?: string | null
          created_at?: string
          id?: string
          ip_address?: string
          permanent?: boolean
          reason?: string
        }
        Relationships: []
      }
      chat_history: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          sources: string[] | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          sources?: string[] | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          sources?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      federation_audit_log: {
        Row: {
          action: string
          confidence_score: number | null
          created_at: string | null
          error_message: string | null
          fabrication_detected: boolean | null
          fabrication_patterns: Json | null
          id: string
          metadata: Json | null
          payload_hash: string | null
          payload_preview: string | null
          priority_violations: Json | null
          processing_time_ms: number | null
          recommendation: string | null
          response_status: number | null
          source_node: string
          validation_passed: boolean | null
        }
        Insert: {
          action: string
          confidence_score?: number | null
          created_at?: string | null
          error_message?: string | null
          fabrication_detected?: boolean | null
          fabrication_patterns?: Json | null
          id?: string
          metadata?: Json | null
          payload_hash?: string | null
          payload_preview?: string | null
          priority_violations?: Json | null
          processing_time_ms?: number | null
          recommendation?: string | null
          response_status?: number | null
          source_node: string
          validation_passed?: boolean | null
        }
        Update: {
          action?: string
          confidence_score?: number | null
          created_at?: string | null
          error_message?: string | null
          fabrication_detected?: boolean | null
          fabrication_patterns?: Json | null
          id?: string
          metadata?: Json | null
          payload_hash?: string | null
          payload_preview?: string | null
          priority_violations?: Json | null
          processing_time_ms?: number | null
          recommendation?: string | null
          response_status?: number | null
          source_node?: string
          validation_passed?: boolean | null
        }
        Relationships: []
      }
      federation_doctrines: {
        Row: {
          content: Json
          doctrine_type: string | null
          id: string
          metadata: Json | null
          processed_at: string | null
          received_at: string | null
          source_node: string
          status: string | null
          title: string | null
          version: string | null
        }
        Insert: {
          content: Json
          doctrine_type?: string | null
          id?: string
          metadata?: Json | null
          processed_at?: string | null
          received_at?: string | null
          source_node: string
          status?: string | null
          title?: string | null
          version?: string | null
        }
        Update: {
          content?: Json
          doctrine_type?: string | null
          id?: string
          metadata?: Json | null
          processed_at?: string | null
          received_at?: string | null
          source_node?: string
          status?: string | null
          title?: string | null
          version?: string | null
        }
        Relationships: []
      }
      federation_nodes: {
        Row: {
          capabilities: Json | null
          created_at: string | null
          endpoint_url: string | null
          federation_version: string | null
          id: string
          interconnect_allowed: boolean | null
          ipc_enabled: boolean | null
          ipc_failure_count: number | null
          last_heartbeat: string | null
          last_ipc_success: string | null
          link_direction: string | null
          max_data_classification: string | null
          metadata: Json | null
          node_id: string
          node_name: string
          node_type: string | null
          parent_node_id: string | null
          project_id: string | null
          public_key: string | null
          status: string | null
          tier: number | null
          updated_at: string | null
        }
        Insert: {
          capabilities?: Json | null
          created_at?: string | null
          endpoint_url?: string | null
          federation_version?: string | null
          id?: string
          interconnect_allowed?: boolean | null
          ipc_enabled?: boolean | null
          ipc_failure_count?: number | null
          last_heartbeat?: string | null
          last_ipc_success?: string | null
          link_direction?: string | null
          max_data_classification?: string | null
          metadata?: Json | null
          node_id: string
          node_name: string
          node_type?: string | null
          parent_node_id?: string | null
          project_id?: string | null
          public_key?: string | null
          status?: string | null
          tier?: number | null
          updated_at?: string | null
        }
        Update: {
          capabilities?: Json | null
          created_at?: string | null
          endpoint_url?: string | null
          federation_version?: string | null
          id?: string
          interconnect_allowed?: boolean | null
          ipc_enabled?: boolean | null
          ipc_failure_count?: number | null
          last_heartbeat?: string | null
          last_ipc_success?: string | null
          link_direction?: string | null
          max_data_classification?: string | null
          metadata?: Json | null
          node_id?: string
          node_name?: string
          node_type?: string | null
          parent_node_id?: string | null
          project_id?: string | null
          public_key?: string | null
          status?: string | null
          tier?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      federation_sync_history: {
        Row: {
          completed_at: string | null
          details: Json | null
          error_message: string | null
          id: string
          node_id: string
          operation: string
          records_failed: number | null
          records_synced: number | null
          started_at: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          details?: Json | null
          error_message?: string | null
          id?: string
          node_id: string
          operation: string
          records_failed?: number | null
          records_synced?: number | null
          started_at?: string
          status?: string
        }
        Update: {
          completed_at?: string | null
          details?: Json | null
          error_message?: string | null
          id?: string
          node_id?: string
          operation?: string
          records_failed?: number | null
          records_synced?: number | null
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      governance_hydration_log: {
        Row: {
          completed_at: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          node_id: string
          phase: number | null
          phase_name: string | null
          quality_score: number | null
          started_at: string | null
          status: string | null
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          node_id: string
          phase?: number | null
          phase_name?: string | null
          quality_score?: number | null
          started_at?: string | null
          status?: string | null
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          node_id?: string
          phase?: number | null
          phase_name?: string | null
          quality_score?: number | null
          started_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      grls_memory: {
        Row: {
          created_at: string | null
          domain: string | null
          id: string
          is_active: boolean | null
          memory_key: string
          memory_type: string | null
          memory_value: Json | null
          signal_strength: number | null
          summary: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          domain?: string | null
          id?: string
          is_active?: boolean | null
          memory_key: string
          memory_type?: string | null
          memory_value?: Json | null
          signal_strength?: number | null
          summary?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          domain?: string | null
          id?: string
          is_active?: boolean | null
          memory_key?: string
          memory_type?: string | null
          memory_value?: Json | null
          signal_strength?: number | null
          summary?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      lab_notes: {
        Row: {
          content: string | null
          created_at: string
          id: string
          template: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          template?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          template?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      login_attempts: {
        Row: {
          created_at: string
          email: string
          failure_reason: string | null
          id: string
          ip_address: string
          success: boolean
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          email: string
          failure_reason?: string | null
          id?: string
          ip_address: string
          success?: boolean
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          failure_reason?: string | null
          id?: string
          ip_address?: string
          success?: boolean
          user_agent?: string | null
        }
        Relationships: []
      }
      partner_documents: {
        Row: {
          created_at: string
          filename: string
          id: string
          mime_type: string | null
          parsed_at: string | null
          partner_id: string
          size_bytes: number | null
          storage_path: string
          summary: string | null
        }
        Insert: {
          created_at?: string
          filename: string
          id?: string
          mime_type?: string | null
          parsed_at?: string | null
          partner_id: string
          size_bytes?: number | null
          storage_path: string
          summary?: string | null
        }
        Update: {
          created_at?: string
          filename?: string
          id?: string
          mime_type?: string | null
          parsed_at?: string | null
          partner_id?: string
          size_bytes?: number | null
          storage_path?: string
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_documents_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          api_key_hash: string | null
          api_key_prefix: string | null
          capabilities: Json | null
          contact_email: string | null
          contract_payload: Json | null
          created_at: string
          created_by: string | null
          id: string
          intake_summary: string | null
          organization_name: string
          partner_type: string | null
          status: string
          updated_at: string
        }
        Insert: {
          api_key_hash?: string | null
          api_key_prefix?: string | null
          capabilities?: Json | null
          contact_email?: string | null
          contract_payload?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          intake_summary?: string | null
          organization_name: string
          partner_type?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          api_key_hash?: string | null
          api_key_prefix?: string | null
          capabilities?: Json | null
          contact_email?: string | null
          contract_payload?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          intake_summary?: string | null
          organization_name?: string
          partner_type?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          institution: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          institution?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          institution?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      saved_items: {
        Row: {
          created_at: string
          id: string
          item_data: Json
          item_id: string
          item_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_data: Json
          item_id: string
          item_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_data?: Json
          item_id?: string
          item_type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          granted_at: string | null
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vip_emails: {
        Row: {
          created_at: string | null
          email: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string | null
          email: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string | null
          email?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_login_rate_limit: {
        Args: {
          p_email: string
          p_ip_address: string
          p_max_attempts?: number
          p_window_minutes?: number
        }
        Returns: {
          attempts_remaining: number
          block_reason: string
          cooldown_seconds: number
          is_blocked: boolean
        }[]
      }
      detect_suspicious_login: {
        Args: { p_email: string; p_ip_address: string; p_user_agent: string }
        Returns: {
          is_suspicious: boolean
          risk_score: number
          suspicion_reason: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      log_login_attempt: {
        Args: {
          p_email: string
          p_failure_reason?: string
          p_ip_address: string
          p_success: boolean
          p_user_agent: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "pro_plus"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user", "pro_plus"],
    },
  },
} as const
