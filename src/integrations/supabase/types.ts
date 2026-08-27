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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      addons: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          is_locked: boolean
          kind: string
          name: string
          price: number
          sort: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_locked?: boolean
          kind?: string
          name: string
          price: number
          sort?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_locked?: boolean
          kind?: string
          name?: string
          price?: number
          sort?: number
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_id: string | null
          body: string
          cover_url: string | null
          created_at: string
          excerpt: string
          id: string
          published: boolean
          read_minutes: number
          slug: string
          tag: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          body?: string
          cover_url?: string | null
          created_at?: string
          excerpt?: string
          id?: string
          published?: boolean
          read_minutes?: number
          slug: string
          tag?: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          body?: string
          cover_url?: string | null
          created_at?: string
          excerpt?: string
          id?: string
          published?: boolean
          read_minutes?: number
          slug?: string
          tag?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      datacenters: {
        Row: {
          coming_soon: boolean
          created_at: string
          description: string
          host_ip: string | null
          id: string
          is_active: boolean
          location: string
          name: string
          slug: string
          sort: number
          updated_at: string
        }
        Insert: {
          coming_soon?: boolean
          created_at?: string
          description?: string
          host_ip?: string | null
          id?: string
          is_active?: boolean
          location?: string
          name: string
          slug: string
          sort?: number
          updated_at?: string
        }
        Update: {
          coming_soon?: boolean
          created_at?: string
          description?: string
          host_ip?: string | null
          id?: string
          is_active?: boolean
          location?: string
          name?: string
          slug?: string
          sort?: number
          updated_at?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          created_by: string | null
          id: string
          note: string
          spent_at: string
          title: string
        }
        Insert: {
          amount: number
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string
          spent_at?: string
          title: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string
          spent_at?: string
          title?: string
        }
        Relationships: []
      }
      intl_requests: {
        Row: {
          admin_note: string
          created_at: string
          id: string
          kyc_note: string
          service_id: string
          status: Database["public"]["Enums"]["request_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_note?: string
          created_at?: string
          id?: string
          kyc_note?: string
          service_id: string
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_note?: string
          created_at?: string
          id?: string
          kyc_note?: string
          service_id?: string
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "intl_requests_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          level: string
          link: string | null
          read_at: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          level?: string
          link?: string | null
          read_at?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          level?: string
          link?: string | null
          read_at?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          addons: Json
          amount: number
          code: string
          created_at: string
          datacenter_id: string | null
          duration_months: number
          id: string
          kind: Database["public"]["Enums"]["order_kind"]
          os: string
          plan_id: string | null
          service_id: string | null
          service_name: string
          status: Database["public"]["Enums"]["order_status"]
          ticket_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          addons?: Json
          amount?: number
          code?: string
          created_at?: string
          datacenter_id?: string | null
          duration_months?: number
          id?: string
          kind?: Database["public"]["Enums"]["order_kind"]
          os?: string
          plan_id?: string | null
          service_id?: string | null
          service_name?: string
          status?: Database["public"]["Enums"]["order_status"]
          ticket_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          addons?: Json
          amount?: number
          code?: string
          created_at?: string
          datacenter_id?: string | null
          duration_months?: number
          id?: string
          kind?: Database["public"]["Enums"]["order_kind"]
          os?: string
          plan_id?: string | null
          service_id?: string | null
          service_name?: string
          status?: Database["public"]["Enums"]["order_status"]
          ticket_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_datacenter_id_fkey"
            columns: ["datacenter_id"]
            isOneToOne: false
            referencedRelation: "datacenters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          bandwidth_gb: number
          cpu: string
          created_at: string
          datacenter_id: string
          disk: string
          id: string
          is_active: boolean
          is_locked: boolean
          lock_note: string
          name: string
          price: number
          ram: string
          sort: number
          updated_at: string
        }
        Insert: {
          bandwidth_gb?: number
          cpu: string
          created_at?: string
          datacenter_id: string
          disk: string
          id?: string
          is_active?: boolean
          is_locked?: boolean
          lock_note?: string
          name: string
          price: number
          ram: string
          sort?: number
          updated_at?: string
        }
        Update: {
          bandwidth_gb?: number
          cpu?: string
          created_at?: string
          datacenter_id?: string
          disk?: string
          id?: string
          is_active?: boolean
          is_locked?: boolean
          lock_note?: string
          name?: string
          price?: number
          ram?: string
          sort?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plans_datacenter_id_fkey"
            columns: ["datacenter_id"]
            isOneToOne: false
            referencedRelation: "datacenters"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          birth_date: string | null
          city: string | null
          created_at: string
          credit: number
          email: string
          first_name: string
          id: string
          last_name: string
          national_id: string | null
          network_name: string | null
          phone: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          birth_date?: string | null
          city?: string | null
          created_at?: string
          credit?: number
          email: string
          first_name?: string
          id: string
          last_name?: string
          national_id?: string | null
          network_name?: string | null
          phone?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          birth_date?: string | null
          city?: string | null
          created_at?: string
          credit?: number
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          national_id?: string | null
          network_name?: string | null
          phone?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      services: {
        Row: {
          bandwidth_gb: number
          bandwidth_used_gb: number
          created_at: string
          datacenter_id: string | null
          expires_at: string | null
          id: string
          intl_enabled: boolean
          ip: string | null
          name: string
          notes: string
          os: string
          plan_id: string | null
          ssh_port: number
          ssh_username: string
          starts_at: string | null
          status: Database["public"]["Enums"]["service_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          bandwidth_gb?: number
          bandwidth_used_gb?: number
          created_at?: string
          datacenter_id?: string | null
          expires_at?: string | null
          id?: string
          intl_enabled?: boolean
          ip?: string | null
          name: string
          notes?: string
          os?: string
          plan_id?: string | null
          ssh_port?: number
          ssh_username?: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["service_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          bandwidth_gb?: number
          bandwidth_used_gb?: number
          created_at?: string
          datacenter_id?: string | null
          expires_at?: string | null
          id?: string
          intl_enabled?: boolean
          ip?: string | null
          name?: string
          notes?: string
          os?: string
          plan_id?: string | null
          ssh_port?: number
          ssh_username?: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["service_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_datacenter_id_fkey"
            columns: ["datacenter_id"]
            isOneToOne: false
            referencedRelation: "datacenters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      sponsors: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          link: string
          logo_url: string
          name: string
          sort: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          link?: string
          logo_url?: string
          name: string
          sort?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          link?: string
          logo_url?: string
          name?: string
          sort?: number
          updated_at?: string
        }
        Relationships: []
      }
      ticket_messages: {
        Row: {
          attachment_path: string | null
          body: string
          created_at: string
          id: string
          is_staff: boolean
          sender_id: string | null
          sender_name: string
          ticket_id: string
        }
        Insert: {
          attachment_path?: string | null
          body?: string
          created_at?: string
          id?: string
          is_staff?: boolean
          sender_id?: string | null
          sender_name?: string
          ticket_id: string
        }
        Update: {
          attachment_path?: string | null
          body?: string
          created_at?: string
          id?: string
          is_staff?: boolean
          sender_id?: string | null
          sender_name?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          code: string
          created_at: string
          department: Database["public"]["Enums"]["ticket_dept"]
          guest_email: string | null
          id: string
          order_id: string | null
          priority: Database["public"]["Enums"]["ticket_priority"]
          service_id: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          code?: string
          created_at?: string
          department?: Database["public"]["Enums"]["ticket_dept"]
          guest_email?: string | null
          id?: string
          order_id?: string | null
          priority?: Database["public"]["Enums"]["ticket_priority"]
          service_id?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          department?: Database["public"]["Enums"]["ticket_dept"]
          guest_email?: string | null
          id?: string
          order_id?: string | null
          priority?: Database["public"]["Enums"]["ticket_priority"]
          service_id?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vps_password_requests: {
        Row: {
          created_at: string
          id: string
          note: string
          service_id: string
          status: Database["public"]["Enums"]["request_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string
          service_id: string
          status?: Database["public"]["Enums"]["request_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string
          service_id?: string
          status?: Database["public"]["Enums"]["request_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vps_password_requests_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
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
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "support" | "user"
      order_kind: "new" | "renew" | "upgrade" | "intl"
      order_status: "pending" | "approved" | "rejected"
      request_status: "pending" | "approved" | "rejected" | "done"
      service_status:
        | "pending"
        | "active"
        | "suspended"
        | "expired"
        | "cancelled"
      ticket_dept: "password" | "technical" | "payment" | "abuse"
      ticket_priority: "low" | "normal" | "high"
      ticket_status: "open" | "answered" | "closed"
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
      app_role: ["admin", "support", "user"],
      order_kind: ["new", "renew", "upgrade", "intl"],
      order_status: ["pending", "approved", "rejected"],
      request_status: ["pending", "approved", "rejected", "done"],
      service_status: [
        "pending",
        "active",
        "suspended",
        "expired",
        "cancelled",
      ],
      ticket_dept: ["password", "technical", "payment", "abuse"],
      ticket_priority: ["low", "normal", "high"],
      ticket_status: ["open", "answered", "closed"],
    },
  },
} as const
