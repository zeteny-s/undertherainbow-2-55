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
      document_folders: {
        Row: {
          created_at: string
          id: string
          name: string
          parent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "document_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      document_shares: {
        Row: {
          created_at: string
          document_id: string
          email: string | null
          id: string
          permission: Database["public"]["Enums"]["document_permission"]
          shared_by: string
          shared_with: string | null
        }
        Insert: {
          created_at?: string
          document_id: string
          email?: string | null
          id?: string
          permission?: Database["public"]["Enums"]["document_permission"]
          shared_by: string
          shared_with?: string | null
        }
        Update: {
          created_at?: string
          document_id?: string
          email?: string | null
          id?: string
          permission?: Database["public"]["Enums"]["document_permission"]
          shared_by?: string
          shared_with?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_shares_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          description: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          folder_id: string | null
          id: string
          metadata: Json | null
          scanned_pdf: boolean
          storage_path: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          folder_id?: string | null
          id?: string
          metadata?: Json | null
          scanned_pdf?: boolean
          storage_path: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          folder_id?: string | null
          id?: string
          metadata?: Json | null
          scanned_pdf?: boolean
          storage_path?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "document_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      house_cash_expenses: {
        Row: {
          amount: number
          created_at: string
          description: string
          expense_date: string
          id: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          expense_date?: string
          id?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          expense_date?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      house_cash_settings: {
        Row: {
          created_at: string
          id: string
          initial_balance: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          initial_balance?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          initial_balance?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      house_cash_state: {
        Row: {
          balance: number
          created_at: string
          id: number
          updated_at: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: number
          updated_at?: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: number
          updated_at?: string
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
      message_participants: {
        Row: {
          created_at: string
          id: string
          message_id: string
          participant_id: string
          participant_type: string
          read_at: string | null
          team_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message_id: string
          participant_id: string
          participant_type?: string
          read_at?: string | null
          team_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message_id?: string
          participant_id?: string
          participant_type?: string
          read_at?: string | null
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_participants_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_participants_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_participants_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      message_threads: {
        Row: {
          created_at: string
          created_by: string
          id: string
          last_message_at: string
          team_id: string | null
          thread_type: string
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          last_message_at?: string
          team_id?: string | null
          thread_type?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          last_message_at?: string
          team_id?: string | null
          thread_type?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_threads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_threads_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          edited_at: string | null
          id: string
          is_edited: boolean
          message_type: string
          parent_message_id: string | null
          sender_id: string
          thread_id: string | null
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          edited_at?: string | null
          id?: string
          is_edited?: boolean
          message_type?: string
          parent_message_id?: string | null
          sender_id: string
          thread_id?: string | null
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          edited_at?: string | null
          id?: string
          is_edited?: boolean
          message_type?: string
          parent_message_id?: string | null
          sender_id?: string
          thread_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "message_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_records: {
        Row: {
          amount: number
          created_at: string
          employee_name: string
          extracted_text: string | null
          file_name: string | null
          file_url: string | null
          id: string
          is_cash: boolean
          is_rental: boolean
          organization: string
          project_code: string | null
          record_date: string
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          amount: number
          created_at?: string
          employee_name: string
          extracted_text?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          is_cash?: boolean
          is_rental?: boolean
          organization: string
          project_code?: string | null
          record_date: string
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          amount?: number
          created_at?: string
          employee_name?: string
          extracted_text?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          is_cash?: boolean
          is_rental?: boolean
          organization?: string
          project_code?: string | null
          record_date?: string
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: []
      }
      payroll_summaries: {
        Row: {
          bank_transfer_costs: number
          cash_costs: number
          cash_file_url: string | null
          created_at: string
          created_by: string
          id: string
          month: number
          non_rental_costs: number
          organization: string
          payroll_file_url: string | null
          record_count: number
          rental_costs: number
          tax_amount: number
          tax_file_url: string | null
          total_payroll: number
          updated_at: string
          year: number
        }
        Insert: {
          bank_transfer_costs?: number
          cash_costs?: number
          cash_file_url?: string | null
          created_at?: string
          created_by: string
          id?: string
          month: number
          non_rental_costs?: number
          organization: string
          payroll_file_url?: string | null
          record_count?: number
          rental_costs?: number
          tax_amount?: number
          tax_file_url?: string | null
          total_payroll?: number
          updated_at?: string
          year: number
        }
        Update: {
          bank_transfer_costs?: number
          cash_costs?: number
          cash_file_url?: string | null
          created_at?: string
          created_by?: string
          id?: string
          month?: number
          non_rental_costs?: number
          organization?: string
          payroll_file_url?: string | null
          record_count?: number
          rental_costs?: number
          tax_amount?: number
          tax_file_url?: string | null
          total_payroll?: number
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string | null
          profile_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          name?: string | null
          profile_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          profile_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          end_date: string | null
          id: string
          name: string
          priority: Database["public"]["Enums"]["task_priority"]
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          team_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          priority?: Database["public"]["Enums"]["task_priority"]
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          team_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_by: string
          assigned_to: string
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          priority: Database["public"]["Enums"]["task_priority"]
          project_id: string | null
          status: Database["public"]["Enums"]["task_status"]
          team_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assigned_by: string
          assigned_to: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          project_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          team_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assigned_by?: string
          assigned_to?: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          project_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          team_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          id: string
          joined_at: string
          role: Database["public"]["Enums"]["team_member_role"]
          team_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["team_member_role"]
          team_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["team_member_role"]
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          priority: Database["public"]["Enums"]["task_priority"]
          status: Database["public"]["Enums"]["task_status"]
          team_id: string
          title: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          team_id: string
          title: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          team_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_tasks_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      thread_participants: {
        Row: {
          id: string
          is_muted: boolean
          joined_at: string
          last_read_at: string | null
          thread_id: string
          user_id: string
        }
        Insert: {
          id?: string
          is_muted?: boolean
          joined_at?: string
          last_read_at?: string | null
          thread_id: string
          user_id: string
        }
        Update: {
          id?: string
          is_muted?: boolean
          joined_at?: string
          last_read_at?: string | null
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "thread_participants_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "message_threads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thread_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_document_by_id: {
        Args: { _doc_id: string }
        Returns: boolean
      }
      can_access_document_object: {
        Args: { _name: string }
        Returns: boolean
      }
      can_edit_document: {
        Args: { _doc_id: string }
        Returns: boolean
      }
      create_backup_schedule_table: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_current_user_profile_type: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_current_user_in_team: {
        Args: { _team_id: string }
        Returns: boolean
      }
      is_current_user_manager: {
        Args: Record<PropertyKey, never>
        Returns: boolean
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
      document_permission: "viewer" | "editor"
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
      project_status:
        | "planned"
        | "active"
        | "on_hold"
        | "completed"
        | "cancelled"
      task_priority: "low" | "medium" | "high" | "urgent"
      task_status: "pending" | "in_progress" | "completed" | "cancelled"
      team_member_role: "member" | "lead"
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
      document_permission: ["viewer", "editor"],
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
      project_status: [
        "planned",
        "active",
        "on_hold",
        "completed",
        "cancelled",
      ],
      task_priority: ["low", "medium", "high", "urgent"],
      task_status: ["pending", "in_progress", "completed", "cancelled"],
      team_member_role: ["member", "lead"],
    },
  },
} as const
