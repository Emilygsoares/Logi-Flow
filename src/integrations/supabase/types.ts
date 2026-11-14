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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      companies: {
        Row: {
          created_at: string
          id: string
          name: string
          order_seq: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          order_seq?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          order_seq?: number
        }
        Relationships: []
      }
      occurrences: {
        Row: {
          company_id: string
          created_at: string
          description: string
          id: string
          order_id: string | null
          resolution: string
          resolved_at: string | null
          status: Database["public"]["Enums"]["occurrence_status"]
          type: Database["public"]["Enums"]["occurrence_type"]
          updated_at: string
        }
        Insert: {
          company_id?: string
          created_at?: string
          description?: string
          id?: string
          order_id?: string | null
          resolution?: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["occurrence_status"]
          type?: Database["public"]["Enums"]["occurrence_type"]
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string
          id?: string
          order_id?: string | null
          resolution?: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["occurrence_status"]
          type?: Database["public"]["Enums"]["occurrence_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "occurrences_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occurrences_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_events: {
        Row: {
          company_id: string
          created_at: string
          id: string
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          order_id?: string
          status?: Database["public"]["Enums"]["order_status"]
        }
        Relationships: [
          {
            foreignKeyName: "order_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          checked: boolean
          company_id: string
          created_at: string
          id: string
          order_id: string
          product_name: string
          quantity: number
          sku: string
        }
        Insert: {
          checked?: boolean
          company_id?: string
          created_at?: string
          id?: string
          order_id: string
          product_name: string
          quantity?: number
          sku?: string
        }
        Update: {
          checked?: boolean
          company_id?: string
          created_at?: string
          id?: string
          order_id?: string
          product_name?: string
          quantity?: number
          sku?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address: string
          carrier: string
          city: string
          code: string
          company_id: string
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string
          delivered_at: string | null
          delivery_deadline: string | null
          id: string
          notes: string
          pickup_id: string | null
          sales_channel: string
          shipped_at: string | null
          shipping_cost: number
          state: string
          status: Database["public"]["Enums"]["order_status"]
          total_value: number
          tracking_code: string
          updated_at: string
          zip_code: string
        }
        Insert: {
          address?: string
          carrier?: string
          city?: string
          code?: string
          company_id?: string
          created_at?: string
          customer_email?: string
          customer_name: string
          customer_phone?: string
          delivered_at?: string | null
          delivery_deadline?: string | null
          id?: string
          notes?: string
          pickup_id?: string | null
          sales_channel?: string
          shipped_at?: string | null
          shipping_cost?: number
          state?: string
          status?: Database["public"]["Enums"]["order_status"]
          total_value?: number
          tracking_code?: string
          updated_at?: string
          zip_code?: string
        }
        Update: {
          address?: string
          carrier?: string
          city?: string
          code?: string
          company_id?: string
          created_at?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string
          delivered_at?: string | null
          delivery_deadline?: string | null
          id?: string
          notes?: string
          pickup_id?: string | null
          sales_channel?: string
          shipped_at?: string | null
          shipping_cost?: number
          state?: string
          status?: Database["public"]["Enums"]["order_status"]
          total_value?: number
          tracking_code?: string
          updated_at?: string
          zip_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_pickup_id_fkey"
            columns: ["pickup_id"]
            isOneToOne: false
            referencedRelation: "pickups"
            referencedColumns: ["id"]
          },
        ]
      }
      pickups: {
        Row: {
          address: string
          carrier: string
          company_id: string
          contact: string
          created_at: string
          id: string
          notes: string
          scheduled_date: string
          status: Database["public"]["Enums"]["pickup_status"]
          time_window: string
          updated_at: string
        }
        Insert: {
          address?: string
          carrier: string
          company_id?: string
          contact?: string
          created_at?: string
          id?: string
          notes?: string
          scheduled_date: string
          status?: Database["public"]["Enums"]["pickup_status"]
          time_window?: string
          updated_at?: string
        }
        Update: {
          address?: string
          carrier?: string
          company_id?: string
          contact?: string
          created_at?: string
          id?: string
          notes?: string
          scheduled_date?: string
          status?: Database["public"]["Enums"]["pickup_status"]
          time_window?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pickups_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company_id: string
          created_at: string
          full_name: string
          id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          full_name?: string
          id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          full_name?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_company_id: { Args: never; Returns: string }
    }
    Enums: {
      occurrence_status: "aberta" | "em_analise" | "resolvida"
      occurrence_type:
        | "atraso"
        | "avaria"
        | "extravio"
        | "endereco_incorreto"
        | "destinatario_ausente"
        | "divergencia"
        | "outro"
      order_status:
        | "pendente"
        | "em_conferencia"
        | "conferido"
        | "coleta_agendada"
        | "em_transito"
        | "entregue"
        | "cancelado"
      pickup_status: "agendada" | "realizada" | "cancelada"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      occurrence_status: ["aberta", "em_analise", "resolvida"],
      occurrence_type: [
        "atraso",
        "avaria",
        "extravio",
        "endereco_incorreto",
        "destinatario_ausente",
        "divergencia",
        "outro",
      ],
      order_status: [
        "pendente",
        "em_conferencia",
        "conferido",
        "coleta_agendada",
        "em_transito",
        "entregue",
        "cancelado",
      ],
      pickup_status: ["agendada", "realizada", "cancelada"],
    },
  },
} as const
