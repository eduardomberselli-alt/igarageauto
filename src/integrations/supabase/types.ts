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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_feed: {
        Row: {
          created_at: string
          id: string
          metadata: Json
          owner_id: string
          read_at: string | null
          tipo: string
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json
          owner_id: string
          read_at?: string | null
          tipo: string
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json
          owner_id?: string
          read_at?: string | null
          tipo?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_feed_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      aulas: {
        Row: {
          created_at: string
          descricao: string
          id: string
          ordem: number
          titulo: string
          youtube_id: string
        }
        Insert: {
          created_at?: string
          descricao?: string
          id?: string
          ordem?: number
          titulo: string
          youtube_id: string
        }
        Update: {
          created_at?: string
          descricao?: string
          id?: string
          ordem?: number
          titulo?: string
          youtube_id?: string
        }
        Relationships: []
      }
      capacitacao_progress: {
        Row: {
          aula_id: string
          completed_at: string
          id: string
          user_id: string
        }
        Insert: {
          aula_id: string
          completed_at?: string
          id?: string
          user_id: string
        }
        Update: {
          aula_id?: string
          completed_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "capacitacao_progress_aula_id_fkey"
            columns: ["aula_id"]
            isOneToOne: false
            referencedRelation: "aulas"
            referencedColumns: ["id"]
          },
        ]
      }
      certifications: {
        Row: {
          ano: number | null
          categoria: string
          created_at: string
          id: string
          instituicao: string
          nome: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          ano?: number | null
          categoria?: string
          created_at?: string
          id?: string
          instituicao?: string
          nome: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          ano?: number | null
          categoria?: string
          created_at?: string
          id?: string
          instituicao?: string
          nome?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          session_id: string | null
          user_id: string | null
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          session_id?: string | null
          user_id?: string | null
          vehicle_id: string
        }
        Update: {
          created_at?: string
          id?: string
          session_id?: string | null
          user_id?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      invites: {
        Row: {
          accepted_at: string | null
          code: string
          created_at: string
          expires_at: string | null
          id: string
          invitee_email: string | null
          invitee_user_id: string | null
          inviter_id: string
          note: string
          status: Database["public"]["Enums"]["invite_status"]
          store_name: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          code: string
          created_at?: string
          expires_at?: string | null
          id?: string
          invitee_email?: string | null
          invitee_user_id?: string | null
          inviter_id: string
          note?: string
          status?: Database["public"]["Enums"]["invite_status"]
          store_name?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          code?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          invitee_email?: string | null
          invitee_user_id?: string | null
          inviter_id?: string
          note?: string
          status?: Database["public"]["Enums"]["invite_status"]
          store_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          contacted: boolean
          contacted_at: string | null
          created_at: string
          email: string | null
          id: string
          message: string | null
          name: string
          owner_id: string
          phone: string
          property_id: string | null
          referrer: string | null
          user_agent: string | null
        }
        Insert: {
          contacted?: boolean
          contacted_at?: string | null
          created_at?: string
          email?: string | null
          id?: string
          message?: string | null
          name?: string
          owner_id: string
          phone?: string
          property_id?: string | null
          referrer?: string | null
          user_agent?: string | null
        }
        Update: {
          contacted?: boolean
          contacted_at?: string | null
          created_at?: string
          email?: string | null
          id?: string
          message?: string | null
          name?: string
          owner_id?: string
          phone?: string
          property_id?: string | null
          referrer?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_content: {
        Row: {
          audiencia: Database["public"]["Enums"]["learning_audience"]
          categoria: Database["public"]["Enums"]["learning_category"]
          created_at: string
          descricao: string
          id: string
          ordem: number
          titulo: string
          updated_at: string
          youtube_id: string
        }
        Insert: {
          audiencia?: Database["public"]["Enums"]["learning_audience"]
          categoria: Database["public"]["Enums"]["learning_category"]
          created_at?: string
          descricao?: string
          id?: string
          ordem?: number
          titulo: string
          updated_at?: string
          youtube_id: string
        }
        Update: {
          audiencia?: Database["public"]["Enums"]["learning_audience"]
          categoria?: Database["public"]["Enums"]["learning_category"]
          created_at?: string
          descricao?: string
          id?: string
          ordem?: number
          titulo?: string
          updated_at?: string
          youtube_id?: string
        }
        Relationships: []
      }
      network_relationships: {
        Row: {
          created_at: string
          id: string
          invite_id: string | null
          invited_id: string
          sponsor_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invite_id?: string | null
          invited_id: string
          sponsor_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invite_id?: string | null
          invited_id?: string
          sponsor_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          brand_accent_color: string
          brand_primary_color: string
          created_at: string
          especialidades: string[]
          facebook_url: string | null
          foto_url: string
          frase_chamada: string | null
          id: string
          instagram_url: string | null
          linkedin_url: string | null
          logo_loja_url: string | null
          maps_url: string | null
          nome: string
          slug: string | null
          status: string
          tiktok_url: string | null
          updated_at: string
          url_card_whatsapp: string | null
          url_marca_dagua: string | null
          user_id: string
          website_url: string | null
          whatsapp: string
          youtube_url: string | null
        }
        Insert: {
          address?: string | null
          brand_accent_color?: string
          brand_primary_color?: string
          created_at?: string
          especialidades?: string[]
          facebook_url?: string | null
          foto_url?: string
          frase_chamada?: string | null
          id?: string
          instagram_url?: string | null
          linkedin_url?: string | null
          logo_loja_url?: string | null
          maps_url?: string | null
          nome?: string
          slug?: string | null
          status?: string
          tiktok_url?: string | null
          updated_at?: string
          url_card_whatsapp?: string | null
          url_marca_dagua?: string | null
          user_id: string
          website_url?: string | null
          whatsapp?: string
          youtube_url?: string | null
        }
        Update: {
          address?: string | null
          brand_accent_color?: string
          brand_primary_color?: string
          created_at?: string
          especialidades?: string[]
          facebook_url?: string | null
          foto_url?: string
          frase_chamada?: string | null
          id?: string
          instagram_url?: string | null
          linkedin_url?: string | null
          logo_loja_url?: string | null
          maps_url?: string | null
          nome?: string
          slug?: string | null
          status?: string
          tiktok_url?: string | null
          updated_at?: string
          url_card_whatsapp?: string | null
          url_marca_dagua?: string | null
          user_id?: string
          website_url?: string | null
          whatsapp?: string
          youtube_url?: string | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          bairro: string
          card_signature: string | null
          city: string | null
          created_at: string
          descricao: string
          diferenciais: string[]
          endereco: string
          foto_url: string
          fotos_urls: string[]
          id: string
          km: number | null
          last_price: number | null
          latitude: number | null
          longitude: number | null
          neighborhood: string | null
          owner_id: string
          preco: number
          published_at: string
          quartos: number
          slug: string | null
          titulo: string
          updated_at: string
          url_card_whatsapp: string | null
          vendido: boolean
          view_count_today: number
          whatsapp_clicks_today: number
          year: number | null
        }
        Insert: {
          bairro?: string
          card_signature?: string | null
          city?: string | null
          created_at?: string
          descricao?: string
          diferenciais?: string[]
          endereco?: string
          foto_url?: string
          fotos_urls?: string[]
          id?: string
          km?: number | null
          last_price?: number | null
          latitude?: number | null
          longitude?: number | null
          neighborhood?: string | null
          owner_id: string
          preco?: number
          published_at?: string
          quartos?: number
          slug?: string | null
          titulo: string
          updated_at?: string
          url_card_whatsapp?: string | null
          vendido?: boolean
          view_count_today?: number
          whatsapp_clicks_today?: number
          year?: number | null
        }
        Update: {
          bairro?: string
          card_signature?: string | null
          city?: string | null
          created_at?: string
          descricao?: string
          diferenciais?: string[]
          endereco?: string
          foto_url?: string
          fotos_urls?: string[]
          id?: string
          km?: number | null
          last_price?: number | null
          latitude?: number | null
          longitude?: number | null
          neighborhood?: string | null
          owner_id?: string
          preco?: number
          published_at?: string
          quartos?: number
          slug?: string | null
          titulo?: string
          updated_at?: string
          url_card_whatsapp?: string | null
          vendido?: boolean
          view_count_today?: number
          whatsapp_clicks_today?: number
          year?: number | null
        }
        Relationships: []
      }
      share_tracking: {
        Row: {
          accessed_at: string | null
          created_at: string
          id: string
          ip_hash: string | null
          lojista_id: string
          original_url: string
          referrer: string | null
          tracking_code: string
          user_agent: string | null
          vehicle_id: string
        }
        Insert: {
          accessed_at?: string | null
          created_at?: string
          id?: string
          ip_hash?: string | null
          lojista_id: string
          original_url: string
          referrer?: string | null
          tracking_code: string
          user_agent?: string | null
          vehicle_id: string
        }
        Update: {
          accessed_at?: string | null
          created_at?: string
          id?: string
          ip_hash?: string | null
          lojista_id?: string
          original_url?: string
          referrer?: string | null
          tracking_code?: string
          user_agent?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "share_tracking_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "properties"
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
      videos: {
        Row: {
          created_at: string
          id: string
          property_id: string
          titulo: string
          youtube_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          property_id: string
          titulo: string
          youtube_id: string
        }
        Update: {
          created_at?: string
          id?: string
          property_id?: string
          titulo?: string
          youtube_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "videos_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invite: {
        Args: { _code: string; _new_user_id: string }
        Returns: string
      }
      get_invite_quota: { Args: { _user_id: string }; Returns: number }
      get_invites_remaining: { Args: { _user_id: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      slugify: { Args: { t: string }; Returns: string }
      transfer_corretor_to_admin: {
        Args: { _corretor_id: string; _new_owner_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "corretor"
      invite_status: "pending" | "accepted" | "revoked" | "expired"
      learning_audience: "publico" | "corretor"
      learning_category:
        | "engenharia_civil"
        | "juridico_contratos"
        | "documentacao"
        | "tecnica_vendas"
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
      app_role: ["admin", "corretor"],
      invite_status: ["pending", "accepted", "revoked", "expired"],
      learning_audience: ["publico", "corretor"],
      learning_category: [
        "engenharia_civil",
        "juridico_contratos",
        "documentacao",
        "tecnica_vendas",
      ],
    },
  },
} as const
