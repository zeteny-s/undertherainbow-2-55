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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      annual_progress: {
        Row: {
          academic_year: string
          created_at: string
          family_id: string
          house_leader_id: string
          id: string
          last_interaction_date: string | null
          total_hours: number | null
          total_interactions: number | null
          updated_at: string
        }
        Insert: {
          academic_year: string
          created_at?: string
          family_id: string
          house_leader_id: string
          id?: string
          last_interaction_date?: string | null
          total_hours?: number | null
          total_interactions?: number | null
          updated_at?: string
        }
        Update: {
          academic_year?: string
          created_at?: string
          family_id?: string
          house_leader_id?: string
          id?: string
          last_interaction_date?: string | null
          total_hours?: number | null
          total_interactions?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "annual_progress_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_records: {
        Row: {
          attendance_date: string
          class_id: string
          created_at: string
          id: string
          notes: string | null
          pedagogus_id: string
          present: boolean
          student_id: string
          updated_at: string
        }
        Insert: {
          attendance_date: string
          class_id: string
          created_at?: string
          id?: string
          notes?: string | null
          pedagogus_id: string
          present?: boolean
          student_id: string
          updated_at?: string
        }
        Update: {
          attendance_date?: string
          class_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          pedagogus_id?: string
          present?: boolean
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
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
      calendar_events: {
        Row: {
          all_day: boolean
          color: string | null
          created_at: string
          description: string | null
          end_time: string
          id: string
          location: string | null
          start_time: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          all_day?: boolean
          color?: string | null
          created_at?: string
          description?: string | null
          end_time: string
          id?: string
          location?: string | null
          start_time: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          all_day?: boolean
          color?: string | null
          created_at?: string
          description?: string | null
          end_time?: string
          id?: string
          location?: string | null
          start_time?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      calendar_events_google: {
        Row: {
          calendar_id: string
          created_at: string
          description: string | null
          end_time: string
          event_type: string | null
          id: string
          start_time: string
          teacher: string | null
          title: string
          updated_at: string
        }
        Insert: {
          calendar_id: string
          created_at?: string
          description?: string | null
          end_time: string
          event_type?: string | null
          id?: string
          start_time: string
          teacher?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          calendar_id?: string
          created_at?: string
          description?: string | null
          end_time?: string
          event_type?: string | null
          id?: string
          start_time?: string
          teacher?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_google_calendar_id_fkey"
            columns: ["calendar_id"]
            isOneToOne: false
            referencedRelation: "google_calendars"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_conversations: {
        Row: {
          created_at: string
          folder_id: string | null
          id: string
          last_message_at: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          folder_id?: string | null
          id?: string
          last_message_at?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          folder_id?: string | null
          id?: string
          last_message_at?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_chat_conversations_folder_id"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "chat_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_folders: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_chat_messages_conversation_id"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          created_at: string
          house: string
          id: string
          name: string
          pedagogus_id: string | null
          pedagogus_ids: string[] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          house: string
          id?: string
          name: string
          pedagogus_id?: string | null
          pedagogus_ids?: string[] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          house?: string
          id?: string
          name?: string
          pedagogus_id?: string | null
          pedagogus_ids?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      crm_activities: {
        Row: {
          activity_type: string
          completed_date: string | null
          created_at: string
          customer_id: string | null
          deal_id: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          lead_id: string | null
          outcome: string | null
          priority: string | null
          scheduled_date: string | null
          status: string | null
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_type: string
          completed_date?: string | null
          created_at?: string
          customer_id?: string | null
          deal_id?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          lead_id?: string | null
          outcome?: string | null
          priority?: string | null
          scheduled_date?: string | null
          status?: string | null
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_type?: string
          completed_date?: string | null
          created_at?: string
          customer_id?: string | null
          deal_id?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          lead_id?: string | null
          outcome?: string | null
          priority?: string | null
          scheduled_date?: string | null
          status?: string | null
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_activities_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "crm_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "crm_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_communications: {
        Row: {
          communication_date: string
          communication_type: string
          content: string | null
          created_at: string
          customer_id: string | null
          direction: string
          id: string
          lead_id: string | null
          metadata: Json | null
          subject: string | null
          user_id: string
        }
        Insert: {
          communication_date?: string
          communication_type: string
          content?: string | null
          created_at?: string
          customer_id?: string | null
          direction: string
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          subject?: string | null
          user_id: string
        }
        Update: {
          communication_date?: string
          communication_type?: string
          content?: string | null
          created_at?: string
          customer_id?: string | null
          direction?: string
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          subject?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_communications_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "crm_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_communications_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_customers: {
        Row: {
          address: string | null
          annual_revenue: number | null
          avatar_url: string | null
          company: string | null
          created_at: string
          email: string | null
          id: string
          industry: string | null
          last_contact_date: string | null
          lead_score: number | null
          lifecycle_stage: string | null
          linkedin_url: string | null
          name: string
          notes: string | null
          phone: string | null
          source: string | null
          status: string
          tags: string[] | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          address?: string | null
          annual_revenue?: number | null
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          industry?: string | null
          last_contact_date?: string | null
          lead_score?: number | null
          lifecycle_stage?: string | null
          linkedin_url?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          source?: string | null
          status?: string
          tags?: string[] | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          address?: string | null
          annual_revenue?: number | null
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          industry?: string | null
          last_contact_date?: string | null
          lead_score?: number | null
          lifecycle_stage?: string | null
          linkedin_url?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          source?: string | null
          status?: string
          tags?: string[] | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      crm_deals: {
        Row: {
          amount: number
          close_date: string | null
          created_at: string
          customer_id: string | null
          deal_owner_id: string | null
          description: string | null
          expected_close_date: string | null
          id: string
          last_activity_date: string | null
          lead_id: string | null
          probability: number | null
          stage: string | null
          status: string
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          close_date?: string | null
          created_at?: string
          customer_id?: string | null
          deal_owner_id?: string | null
          description?: string | null
          expected_close_date?: string | null
          id?: string
          last_activity_date?: string | null
          lead_id?: string | null
          probability?: number | null
          stage?: string | null
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          close_date?: string | null
          created_at?: string
          customer_id?: string | null
          deal_owner_id?: string | null
          description?: string | null
          expected_close_date?: string | null
          id?: string
          last_activity_date?: string | null
          lead_id?: string | null
          probability?: number | null
          stage?: string | null
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_deals_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "crm_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_leads: {
        Row: {
          assigned_to: string | null
          contact_attempts: number | null
          created_at: string
          customer_id: string | null
          description: string | null
          expected_close_date: string | null
          id: string
          last_contact_method: string | null
          lead_score: number | null
          next_follow_up_date: string | null
          probability: number | null
          source: string | null
          status: string
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
          value: number | null
        }
        Insert: {
          assigned_to?: string | null
          contact_attempts?: number | null
          created_at?: string
          customer_id?: string | null
          description?: string | null
          expected_close_date?: string | null
          id?: string
          last_contact_method?: string | null
          lead_score?: number | null
          next_follow_up_date?: string | null
          probability?: number | null
          source?: string | null
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
          value?: number | null
        }
        Update: {
          assigned_to?: string | null
          contact_attempts?: number | null
          created_at?: string
          customer_id?: string | null
          description?: string | null
          expected_close_date?: string | null
          id?: string
          last_contact_method?: string | null
          lead_score?: number | null
          next_follow_up_date?: string | null
          probability?: number | null
          source?: string | null
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_leads_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "crm_customers"
            referencedColumns: ["id"]
          },
        ]
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
      email_campaigns: {
        Row: {
          content: string | null
          created_at: string
          id: string
          recipient_count: number
          recipients: string[]
          sent_at: string
          sent_by: string | null
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          recipient_count?: number
          recipients?: string[]
          sent_at?: string
          sent_by?: string | null
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          recipient_count?: number
          recipients?: string[]
          sent_at?: string
          sent_by?: string | null
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      families: {
        Row: {
          child_age: number | null
          child_name: string | null
          created_at: string
          house_leader_id: string
          id: string
          name: string
          notes: string | null
          start_date: string | null
          updated_at: string
        }
        Insert: {
          child_age?: number | null
          child_name?: string | null
          created_at?: string
          house_leader_id: string
          id?: string
          name: string
          notes?: string | null
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          child_age?: number | null
          child_name?: string | null
          created_at?: string
          house_leader_id?: string
          id?: string
          name?: string
          notes?: string | null
          start_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      family_contacts: {
        Row: {
          additional_emails: string[] | null
          campus: string
          child_name: string
          created_at: string
          father_email: string | null
          group_name: string
          id: string
          mother_email: string | null
          notes: string | null
          updated_at: string
        }
        Insert: {
          additional_emails?: string[] | null
          campus: string
          child_name: string
          created_at?: string
          father_email?: string | null
          group_name: string
          id?: string
          mother_email?: string | null
          notes?: string | null
          updated_at?: string
        }
        Update: {
          additional_emails?: string[] | null
          campus?: string
          child_name?: string
          created_at?: string
          father_email?: string | null
          group_name?: string
          id?: string
          mother_email?: string | null
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      family_interactions: {
        Row: {
          category: string
          created_at: string
          duration_minutes: number
          family_id: string
          house_leader_id: string
          id: string
          interaction_date: string
          location: string | null
          next_steps: string | null
          notes: string | null
          referral_opportunity: boolean | null
          satisfaction_level: number | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          duration_minutes?: number
          family_id: string
          house_leader_id: string
          id?: string
          interaction_date?: string
          location?: string | null
          next_steps?: string | null
          notes?: string | null
          referral_opportunity?: boolean | null
          satisfaction_level?: number | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          duration_minutes?: number
          family_id?: string
          house_leader_id?: string
          id?: string
          interaction_date?: string
          location?: string | null
          next_steps?: string | null
          notes?: string | null
          referral_opportunity?: boolean | null
          satisfaction_level?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_interactions_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      form_option_capacity: {
        Row: {
          component_id: string
          created_at: string
          current_count: number
          display_text: string | null
          form_id: string
          id: string
          max_capacity: number
          option_value: string
          updated_at: string
        }
        Insert: {
          component_id: string
          created_at?: string
          current_count?: number
          display_text?: string | null
          form_id: string
          id?: string
          max_capacity: number
          option_value: string
          updated_at?: string
        }
        Update: {
          component_id?: string
          created_at?: string
          current_count?: number
          display_text?: string | null
          form_id?: string
          id?: string
          max_capacity?: number
          option_value?: string
          updated_at?: string
        }
        Relationships: []
      }
      form_submissions: {
        Row: {
          family_name: string | null
          form_id: string
          id: string
          ip_address: string | null
          submission_data: Json
          submitted_at: string
          waitlist_position: number | null
          waitlisted: boolean
        }
        Insert: {
          family_name?: string | null
          form_id: string
          id?: string
          ip_address?: string | null
          submission_data?: Json
          submitted_at?: string
          waitlist_position?: number | null
          waitlisted?: boolean
        }
        Update: {
          family_name?: string | null
          form_id?: string
          id?: string
          ip_address?: string | null
          submission_data?: Json
          submitted_at?: string
          waitlist_position?: number | null
          waitlisted?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "form_submissions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
        ]
      }
      forms: {
        Row: {
          campuses: string[]
          capacity: number | null
          created_at: string
          created_by: string
          description: string | null
          form_components: Json
          id: string
          status: Database["public"]["Enums"]["form_status"]
          title: string
          unlimited_capacity: boolean | null
          updated_at: string
        }
        Insert: {
          campuses?: string[]
          capacity?: number | null
          created_at?: string
          created_by: string
          description?: string | null
          form_components?: Json
          id?: string
          status?: Database["public"]["Enums"]["form_status"]
          title: string
          unlimited_capacity?: boolean | null
          updated_at?: string
        }
        Update: {
          campuses?: string[]
          capacity?: number | null
          created_at?: string
          created_by?: string
          description?: string | null
          form_components?: Json
          id?: string
          status?: Database["public"]["Enums"]["form_status"]
          title?: string
          unlimited_capacity?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      google_calendars: {
        Row: {
          campuses: string[]
          created_at: string
          created_by: string
          description: string | null
          google_calendar_id: string
          id: string
          share_link: string
          title: string
          updated_at: string
        }
        Insert: {
          campuses?: string[]
          created_at?: string
          created_by: string
          description?: string | null
          google_calendar_id: string
          id?: string
          share_link: string
          title: string
          updated_at?: string
        }
        Update: {
          campuses?: string[]
          created_at?: string
          created_by?: string
          description?: string | null
          google_calendar_id?: string
          id?: string
          share_link?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
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
      house_leaders: {
        Row: {
          created_at: string | null
          email: string
          id: string
          max_families: number | null
          name: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          max_families?: number | null
          name: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          max_families?: number | null
          name?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
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
      newsletter_forms: {
        Row: {
          created_at: string
          form_id: string
          id: string
          newsletter_id: string
        }
        Insert: {
          created_at?: string
          form_id: string
          id?: string
          newsletter_id: string
        }
        Update: {
          created_at?: string
          form_id?: string
          id?: string
          newsletter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_forms_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "newsletter_forms_newsletter_id_fkey"
            columns: ["newsletter_id"]
            isOneToOne: false
            referencedRelation: "newsletters"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_images: {
        Row: {
          created_at: string
          id: string
          image_name: string
          image_url: string
          newsletter_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_name: string
          image_url: string
          newsletter_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_name?: string
          image_url?: string
          newsletter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_images_newsletter_id_fkey"
            columns: ["newsletter_id"]
            isOneToOne: false
            referencedRelation: "newsletters"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletters: {
        Row: {
          campus: Database["public"]["Enums"]["campus_type"]
          components: Json | null
          content_guidelines: string | null
          created_at: string
          created_by: string
          description: string | null
          generated_html: string | null
          id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          campus: Database["public"]["Enums"]["campus_type"]
          components?: Json | null
          content_guidelines?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          generated_html?: string | null
          id?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          campus?: Database["public"]["Enums"]["campus_type"]
          components?: Json | null
          content_guidelines?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          generated_html?: string | null
          id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
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
      pm_boards: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          position: number
          project_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          position?: number
          project_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          position?: number
          project_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pm_boards_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "pm_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      pm_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          task_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          task_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          task_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pm_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "pm_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      pm_projects: {
        Row: {
          actual_hours: number | null
          attachments: Json | null
          budget: number | null
          client_id: string | null
          created_at: string
          created_by: string
          description: string | null
          end_date: string | null
          estimated_hours: number | null
          hourly_rate: number | null
          id: string
          name: string
          priority: string
          progress_percentage: number | null
          project_manager_id: string | null
          project_type: string | null
          spent_budget: number | null
          start_date: string | null
          status: string
          tags: string[] | null
          team_members: string[] | null
          total_budget: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_hours?: number | null
          attachments?: Json | null
          budget?: number | null
          client_id?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          end_date?: string | null
          estimated_hours?: number | null
          hourly_rate?: number | null
          id?: string
          name: string
          priority?: string
          progress_percentage?: number | null
          project_manager_id?: string | null
          project_type?: string | null
          spent_budget?: number | null
          start_date?: string | null
          status?: string
          tags?: string[] | null
          team_members?: string[] | null
          total_budget?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_hours?: number | null
          attachments?: Json | null
          budget?: number | null
          client_id?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string | null
          estimated_hours?: number | null
          hourly_rate?: number | null
          id?: string
          name?: string
          priority?: string
          progress_percentage?: number | null
          project_manager_id?: string | null
          project_type?: string | null
          spent_budget?: number | null
          start_date?: string | null
          status?: string
          tags?: string[] | null
          team_members?: string[] | null
          total_budget?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pm_projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "crm_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      pm_tasks: {
        Row: {
          actual_hours: number | null
          assigned_by: string
          assigned_to: string | null
          attachments_count: number | null
          board_id: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          id: string
          labels: string[] | null
          position: number
          priority: string
          project_id: string | null
          status: string
          story_points: number | null
          task_type: string | null
          title: string
          updated_at: string
          watchers: string[] | null
        }
        Insert: {
          actual_hours?: number | null
          assigned_by: string
          assigned_to?: string | null
          attachments_count?: number | null
          board_id?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          labels?: string[] | null
          position?: number
          priority?: string
          project_id?: string | null
          status?: string
          story_points?: number | null
          task_type?: string | null
          title: string
          updated_at?: string
          watchers?: string[] | null
        }
        Update: {
          actual_hours?: number | null
          assigned_by?: string
          assigned_to?: string | null
          attachments_count?: number | null
          board_id?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          labels?: string[] | null
          position?: number
          priority?: string
          project_id?: string | null
          status?: string
          story_points?: number | null
          task_type?: string | null
          title?: string
          updated_at?: string
          watchers?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "pm_tasks_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "pm_boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "pm_projects"
            referencedColumns: ["id"]
          },
        ]
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
      project_templates: {
        Row: {
          created_at: string
          created_by: string
          default_boards: Json | null
          default_tasks: Json | null
          description: string | null
          estimated_duration_days: number | null
          id: string
          is_public: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          default_boards?: Json | null
          default_tasks?: Json | null
          description?: string | null
          estimated_duration_days?: number | null
          id?: string
          is_public?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          default_boards?: Json | null
          default_tasks?: Json | null
          description?: string | null
          estimated_duration_days?: number | null
          id?: string
          is_public?: boolean | null
          name?: string
          updated_at?: string
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
      students: {
        Row: {
          class_id: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      task_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          task_id: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          task_id: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          task_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "pm_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_dependencies: {
        Row: {
          created_at: string
          dependency_type: string | null
          depends_on_task_id: string
          id: string
          task_id: string
        }
        Insert: {
          created_at?: string
          dependency_type?: string | null
          depends_on_task_id: string
          id?: string
          task_id: string
        }
        Update: {
          created_at?: string
          dependency_type?: string | null
          depends_on_task_id?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_dependencies_depends_on_task_id_fkey"
            columns: ["depends_on_task_id"]
            isOneToOne: false
            referencedRelation: "pm_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_dependencies_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "pm_tasks"
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
      team_performance: {
        Row: {
          created_at: string
          date: string
          deals_closed: number | null
          hours_logged: number | null
          id: string
          leads_converted: number | null
          projects_active: number | null
          tasks_assigned: number | null
          tasks_completed: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          deals_closed?: number | null
          hours_logged?: number | null
          id?: string
          leads_converted?: number | null
          projects_active?: number | null
          tasks_assigned?: number | null
          tasks_completed?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          deals_closed?: number | null
          hours_logged?: number | null
          id?: string
          leads_converted?: number | null
          projects_active?: number | null
          tasks_assigned?: number | null
          tasks_completed?: number | null
          user_id?: string
        }
        Relationships: []
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
      time_tracking: {
        Row: {
          billable: boolean | null
          created_at: string
          description: string | null
          duration_seconds: number | null
          end_time: string | null
          hourly_rate: number | null
          id: string
          is_running: boolean | null
          project_id: string | null
          start_time: string
          task_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          billable?: boolean | null
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          end_time?: string | null
          hourly_rate?: number | null
          id?: string
          is_running?: boolean | null
          project_id?: string | null
          start_time: string
          task_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          billable?: boolean | null
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          end_time?: string | null
          hourly_rate?: number | null
          id?: string
          is_running?: boolean | null
          project_id?: string | null
          start_time?: string
          task_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_tracking_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "pm_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_tracking_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "pm_tasks"
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
      get_form_submission_count: {
        Args: { form_id_param: string }
        Returns: number
      }
      is_current_user_admin_or_manager: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_current_user_in_team: {
        Args: { _team_id: string }
        Returns: boolean
      }
      is_current_user_manager: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_form_full: {
        Args: { form_id_param: string }
        Returns: boolean
      }
      log_backup_execution: {
        Args: {
          p_backup_filename: string
          p_backup_period_end?: string
          p_backup_period_start?: string
          p_backup_size_mb: number
          p_error_message?: string
          p_execution_time_seconds?: number
          p_files_downloaded: number
          p_google_drive_file_id: string
          p_invoice_count: number
          p_status: string
        }
        Returns: string
      }
      update_next_backup_date: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      campus_type: "Feketerigó" | "Torockó" | "Levél"
      document_permission: "viewer" | "editor"
      form_status: "active" | "inactive" | "draft"
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
      campus_type: ["Feketerigó", "Torockó", "Levél"],
      document_permission: ["viewer", "editor"],
      form_status: ["active", "inactive", "draft"],
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
