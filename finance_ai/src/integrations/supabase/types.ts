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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      documents: {
        Row: {
          created_at: string
          extracted_data: Json | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          extracted_data?: Json | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          extracted_data?: Json | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      financial_data: {
        Row: {
          business_income: number | null
          created_at: string
          deductions_80c: number | null
          deductions_80d: number | null
          deductions_80e: number | null
          deductions_80g: number | null
          deductions_hra: number | null
          deductions_lta: number | null
          deductions_nps: number | null
          financial_year: string
          gross_salary: number | null
          hra_received: number | null
          id: string
          interest_income: number | null
          lta_received: number | null
          other_deductions: number | null
          other_income: number | null
          raw_data: Json | null
          rental_income: number | null
          standard_deduction: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          business_income?: number | null
          created_at?: string
          deductions_80c?: number | null
          deductions_80d?: number | null
          deductions_80e?: number | null
          deductions_80g?: number | null
          deductions_hra?: number | null
          deductions_lta?: number | null
          deductions_nps?: number | null
          financial_year?: string
          gross_salary?: number | null
          hra_received?: number | null
          id?: string
          interest_income?: number | null
          lta_received?: number | null
          other_deductions?: number | null
          other_income?: number | null
          raw_data?: Json | null
          rental_income?: number | null
          standard_deduction?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          business_income?: number | null
          created_at?: string
          deductions_80c?: number | null
          deductions_80d?: number | null
          deductions_80e?: number | null
          deductions_80g?: number | null
          deductions_hra?: number | null
          deductions_lta?: number | null
          deductions_nps?: number | null
          financial_year?: string
          gross_salary?: number | null
          hra_received?: number | null
          id?: string
          interest_income?: number | null
          lta_received?: number | null
          other_deductions?: number | null
          other_income?: number | null
          raw_data?: Json | null
          rental_income?: number | null
          standard_deduction?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age_group: string | null
          created_at: string
          email: string | null
          employment_type: string | null
          full_name: string | null
          id: string
          income_sources: string[] | null
          onboarding_completed: boolean
          tax_regime: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          age_group?: string | null
          created_at?: string
          email?: string | null
          employment_type?: string | null
          full_name?: string | null
          id?: string
          income_sources?: string[] | null
          onboarding_completed?: boolean
          tax_regime?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          age_group?: string | null
          created_at?: string
          email?: string | null
          employment_type?: string | null
          full_name?: string | null
          id?: string
          income_sources?: string[] | null
          onboarding_completed?: boolean
          tax_regime?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tax_analyses: {
        Row: {
          analysis_summary: string | null
          created_at: string
          deduction_suggestions: Json | null
          financial_year: string
          id: string
          new_regime_tax: number | null
          old_regime_tax: number | null
          recommended_regime: string | null
          scheme_recommendations: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          analysis_summary?: string | null
          created_at?: string
          deduction_suggestions?: Json | null
          financial_year?: string
          id?: string
          new_regime_tax?: number | null
          old_regime_tax?: number | null
          recommended_regime?: string | null
          scheme_recommendations?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          analysis_summary?: string | null
          created_at?: string
          deduction_suggestions?: Json | null
          financial_year?: string
          id?: string
          new_regime_tax?: number | null
          old_regime_tax?: number | null
          recommended_regime?: string | null
          scheme_recommendations?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
