export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      backup_history: {
        Row: {
          backup_date: string
          backup_filename: string
          backup_period_end: string
          backup_period_start: string
          backup_size_mb: number
          created_at: string | null
          error_message: string | null
          execution_time_seconds: number | null
          files_downloaded: number
          google_drive_file_id: string | null
          id: string
          invoice_count: number
          status: string
        }
        Insert: {
          backup_date?: string
          backup_filename: string
          backup_period_end: string
          backup_period_start: string
          backup_size_mb?: number
          created_at?: string | null
          error_message?: string | null
          execution_time_seconds?: number | null
          files_downloaded?: number
          google_drive_file_id?: string | null
          id?: string
          invoice_count?: number
          status?: string
        }
        Update: {
          backup_date?: string
          backup_filename?: string
          backup_period_end?: string
          backup_period_start?: string
          backup_size_mb?: number
          created_at?: string | null
          error_message?: string | null
          execution_time_seconds?: number | null
          files_downloaded?: number
          google_drive_file_id?: string | null
          id?: string
          invoice_count?: number
          status?: string
        }
        Relationships: []
      }
      backup_schedule: {
        Row: {
          created_at: string | null
          day_of_week: number
          enabled: boolean
          frequency: string
          hour: number
          id: number
          next_backup: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          day_of_week?: number
          enabled?: boolean
          frequency?: string
          hour?: number
          id?: number
          next_backup: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          enabled?: boolean
          frequency?: string
          hour?: number
          id?: number
          next_backup?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number | null
          bank_account: string | null
          category: string | null
          created_at: string | null
          extracted_text: string | null
          file_name: string
          file_url: string | null
          id: string
          invoice_date: string | null
          invoice_number: string | null
          invoice_type: string | null
          munkaszam: string | null
          organization: string
          partner: string | null
          payment_deadline: string | null
          payment_method: string | null
          processed_at: string | null
          status: string
          subject: string | null
          updated_at: string | null
          uploaded_at: string | null
        }
        Insert: {
          amount?: number | null
          bank_account?: string | null
          category?: string | null
          created_at?: string | null
          extracted_text?: string | null
          file_name: string
          file_url?: string | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_type?: string | null
          munkaszam?: string | null
          organization: string
          partner?: string | null
          payment_deadline?: string | null
          payment_method?: string | null
          processed_at?: string | null
          status?: string
          subject?: string | null
          updated_at?: string | null
          uploaded_at?: string | null
        }
        Update: {
          amount?: number | null
          bank_account?: string | null
          category?: string | null
          created_at?: string | null
          extracted_text?: string | null
          file_name?: string
          file_url?: string | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_type?: string | null
          munkaszam?: string | null
          organization?: string
          partner?: string | null
          payment_deadline?: string | null
          payment_method?: string | null
          processed_at?: string | null
          status?: string
          subject?: string | null
          updated_at?: string | null
          uploaded_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_backup_schedule_table: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      log_backup_execution: {
        Args: {
          p_backup_filename: string
          p_invoice_count: number
          p_files_downloaded: number
          p_backup_size_mb: number
          p_google_drive_file_id: string
          p_status: string
          p_error_message?: string
          p_backup_period_start?: string
          p_backup_period_end?: string
          p_execution_time_seconds?: number
        }
        Returns: string
      }
      update_next_backup_date: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      invoice_category:
        | "Bérleti díjak"
        | "Közüzemi díjak"
        | "Szolgáltatások"
        | "Étkeztetés költségei"
        | "Személyi jellegű kifizetések"
        | "Anyagköltség"
        | "Tárgyi eszközök"
        | "Felújítás, beruházások"
        | "Egyéb"
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
      invoice_category: [
        "Bérleti díjak",
        "Közüzemi díjak",
        "Szolgáltatások",
        "Étkeztetés költségei",
        "Személyi jellegű kifizetések",
        "Anyagköltség",
        "Tárgyi eszközök",
        "Felújítás, beruházások",
        "Egyéb",
      ],
    },
  },
} as const
