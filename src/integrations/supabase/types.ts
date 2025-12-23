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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      affiliates: {
        Row: {
          affiliate_id: string
          affiliate_name: string
          created_at: string | null
          created_by: string
          id: string
          is_active: boolean | null
          notes: string | null
          platform: string
        }
        Insert: {
          affiliate_id?: string
          affiliate_name: string
          created_at?: string | null
          created_by?: string
          id?: string
          is_active?: boolean | null
          notes?: string | null
          platform: string
        }
        Update: {
          affiliate_id?: string
          affiliate_name?: string
          created_at?: string | null
          created_by?: string
          id?: string
          is_active?: boolean | null
          notes?: string | null
          platform?: string
        }
        Relationships: []
      }
      crm_field_mappings: {
        Row: {
          created_at: string | null
          crm_field_api_name: string | null
          crm_object: string
          crm_object_api_name: string | null
          default_value: string | null
          facebook_leads_field: string
          id: string
          is_active: boolean | null
          is_required: boolean | null
          notes: string | null
          transformation: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          crm_field_api_name?: string | null
          crm_object: string
          crm_object_api_name?: string | null
          default_value?: string | null
          facebook_leads_field: string
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          notes?: string | null
          transformation?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          crm_field_api_name?: string | null
          crm_object?: string
          crm_object_api_name?: string | null
          default_value?: string | null
          facebook_leads_field?: string
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          notes?: string | null
          transformation?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      facebook_leads: {
        Row: {
          affiliate_id: string | null
          affiliate_name: string | null
          child_disability_allowance: number | null
          child_placement_committee: number | null
          created_at: string
          created_at_israel: string | null
          created_by: string | null
          did_military_reserves: number | null
          did_tax_return: number | null
          family_status: number | null
          fireberry_account_id: string | null
          fireberry_opportunity_id: string | null
          fireberry_sync_error: string | null
          fireberry_synced_at: string | null
          had_work_breaks: number | null
          id: string
          invested_capital_market: number | null
          landing_page_url: string | null
          language: string | null
          lives_preferred_settlement: number | null
          main_email: string | null
          main_first_name: string
          main_gender: string
          main_last_name: string
          main_pension6y: number | null
          main_phone: string
          main_salary: number | null
          marketing_consent: boolean | null
          sold_real_estate: number | null
          spouse_pension6y: number | null
          spouse_salary: number | null
          traffic_source: string | null
          updated_at: string
          user_affiliate_code: string | null
          utm_json: Json | null
          was_self_employed: number | null
          withdrew_pension: number | null
        }
        Insert: {
          affiliate_id?: string | null
          affiliate_name?: string | null
          child_disability_allowance?: number | null
          child_placement_committee?: number | null
          created_at?: string
          created_at_israel?: string | null
          created_by?: string | null
          did_military_reserves?: number | null
          did_tax_return?: number | null
          family_status?: number | null
          fireberry_account_id?: string | null
          fireberry_opportunity_id?: string | null
          fireberry_sync_error?: string | null
          fireberry_synced_at?: string | null
          had_work_breaks?: number | null
          id?: string
          invested_capital_market?: number | null
          landing_page_url?: string | null
          language?: string | null
          lives_preferred_settlement?: number | null
          main_email?: string | null
          main_first_name: string
          main_gender: string
          main_last_name: string
          main_pension6y?: number | null
          main_phone: string
          main_salary?: number | null
          marketing_consent?: boolean | null
          sold_real_estate?: number | null
          spouse_pension6y?: number | null
          spouse_salary?: number | null
          traffic_source?: string | null
          updated_at?: string
          user_affiliate_code?: string | null
          utm_json?: Json | null
          was_self_employed?: number | null
          withdrew_pension?: number | null
        }
        Update: {
          affiliate_id?: string | null
          affiliate_name?: string | null
          child_disability_allowance?: number | null
          child_placement_committee?: number | null
          created_at?: string
          created_at_israel?: string | null
          created_by?: string | null
          did_military_reserves?: number | null
          did_tax_return?: number | null
          family_status?: number | null
          fireberry_account_id?: string | null
          fireberry_opportunity_id?: string | null
          fireberry_sync_error?: string | null
          fireberry_synced_at?: string | null
          had_work_breaks?: number | null
          id?: string
          invested_capital_market?: number | null
          landing_page_url?: string | null
          language?: string | null
          lives_preferred_settlement?: number | null
          main_email?: string | null
          main_first_name?: string
          main_gender?: string
          main_last_name?: string
          main_pension6y?: number | null
          main_phone?: string
          main_salary?: number | null
          marketing_consent?: boolean | null
          sold_real_estate?: number | null
          spouse_pension6y?: number | null
          spouse_salary?: number | null
          traffic_source?: string | null
          updated_at?: string
          user_affiliate_code?: string | null
          utm_json?: Json | null
          was_self_employed?: number | null
          withdrew_pension?: number | null
        }
        Relationships: []
      }
      landing_intake_submissions: {
        Row: {
          created_at: string
          created_at_israel: string | null
          family_status: number | null
          id: string
          landing_page_url: string | null
          language: string | null
          main_email: string | null
          main_first_name: string
          main_gender: string
          main_id_number: string
          main_last_name: string
          main_pension6y: number | null
          main_phone: string
          source_page: string | null
          spouse_email: string | null
          spouse_first_name: string | null
          spouse_gender: string | null
          spouse_id_number: string | null
          spouse_last_name: string | null
          spouse_pension6y: number | null
          spouse_phone: string | null
          updated_at: string
          utm_json: Json | null
        }
        Insert: {
          created_at?: string
          created_at_israel?: string | null
          family_status?: number | null
          id?: string
          landing_page_url?: string | null
          language?: string | null
          main_email?: string | null
          main_first_name: string
          main_gender: string
          main_id_number: string
          main_last_name: string
          main_pension6y?: number | null
          main_phone: string
          source_page?: string | null
          spouse_email?: string | null
          spouse_first_name?: string | null
          spouse_gender?: string | null
          spouse_id_number?: string | null
          spouse_last_name?: string | null
          spouse_pension6y?: number | null
          spouse_phone?: string | null
          updated_at?: string
          utm_json?: Json | null
        }
        Update: {
          created_at?: string
          created_at_israel?: string | null
          family_status?: number | null
          id?: string
          landing_page_url?: string | null
          language?: string | null
          main_email?: string | null
          main_first_name?: string
          main_gender?: string
          main_id_number?: string
          main_last_name?: string
          main_pension6y?: number | null
          main_phone?: string
          source_page?: string | null
          spouse_email?: string | null
          spouse_first_name?: string | null
          spouse_gender?: string | null
          spouse_id_number?: string | null
          spouse_last_name?: string | null
          spouse_pension6y?: number | null
          spouse_phone?: string | null
          updated_at?: string
          utm_json?: Json | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          first_name: string
          id: string
          last_name: string
          phone: string
          phone_verified: boolean | null
          profile_complete: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          first_name?: string
          id: string
          last_name?: string
          phone?: string
          phone_verified?: boolean | null
          profile_complete?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          first_name?: string
          id?: string
          last_name?: string
          phone?: string
          phone_verified?: boolean | null
          profile_complete?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "affiliate"
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
      app_role: ["admin", "user", "affiliate"],
    },
  },
} as const
