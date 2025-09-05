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
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: Database["public"]["Enums"]["app_role"]
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      virtual_cards: {
        Row: {
          id: string
          card_name: string
          card_type: Database["public"]["Enums"]["card_type"]
          description: string | null
          image_url: string | null
          subscription_plan: Database["public"]["Enums"]["subscription_plan"] | null
          pricing_type: Database["public"]["Enums"]["pricing_type"]
          one_time_fee: number | null
          monthly_fee: number | null
          annual_fee: number | null
          features: Json | null
          is_active: boolean | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          card_name: string
          card_type: Database["public"]["Enums"]["card_type"]
          description?: string | null
          image_url?: string | null
          subscription_plan?: Database["public"]["Enums"]["subscription_plan"] | null
          pricing_type?: Database["public"]["Enums"]["pricing_type"]
          one_time_fee?: number | null
          monthly_fee?: number | null
          annual_fee?: number | null
          features?: Json | null
          is_active?: boolean | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          card_name?: string
          card_type?: Database["public"]["Enums"]["card_type"]
          description?: string | null
          image_url?: string | null
          subscription_plan?: Database["public"]["Enums"]["subscription_plan"] | null
          pricing_type?: Database["public"]["Enums"]["pricing_type"]
          one_time_fee?: number | null
          monthly_fee?: number | null
          annual_fee?: number | null
          features?: Json | null
          is_active?: boolean | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      merchants: {
        Row: {
          id: string
          user_id: string
          business_name: string
          business_type: string | null
          contact_email: string | null
          phone: string | null
          address: string | null
          city: string | null
          country: string | null
          subscription_plan: Database["public"]["Enums"]["subscription_plan"] | null
          status: Database["public"]["Enums"]["merchant_status"]
          subscription_start_date: string | null
          subscription_end_date: string | null
          monthly_fee: number | null
          annual_fee: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          business_name: string
          business_type?: string | null
          contact_email?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          country?: string | null
          subscription_plan?: Database["public"]["Enums"]["subscription_plan"] | null
          status?: Database["public"]["Enums"]["merchant_status"]
          subscription_start_date?: string | null
          subscription_end_date?: string | null
          monthly_fee?: number | null
          annual_fee?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          business_name?: string
          business_type?: string | null
          contact_email?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          country?: string | null
          subscription_plan?: Database["public"]["Enums"]["subscription_plan"] | null
          status?: Database["public"]["Enums"]["merchant_status"]
          subscription_start_date?: string | null
          subscription_end_date?: string | null
          monthly_fee?: number | null
          annual_fee?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      merchant_subscriptions: {
        Row: {
          id: string
          merchant_id: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          status: string | null
          start_date: string
          end_date: string | null
          amount: number | null
          stripe_subscription_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          merchant_id: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          status?: string | null
          start_date?: string
          end_date?: string | null
          amount?: number | null
          stripe_subscription_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          merchant_id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          status?: string | null
          start_date?: string
          end_date?: string | null
          amount?: number | null
          stripe_subscription_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
      merchant_cards: {
        Row: {
          id: string
          merchant_id: string
          card_id: string
          assigned_at: string
          is_active: boolean | null
        }
        Insert: {
          id?: string
          merchant_id: string
          card_id: string
          assigned_at?: string
          is_active?: boolean | null
        }
        Update: {
          id?: string
          merchant_id?: string
          card_id?: string
          assigned_at?: string
          is_active?: boolean | null
        }
        Relationships: []
      }
      loyalty_transactions: {
        Row: {
          created_at: string
          id: string
          loyalty_number: string
          merchant_id: string
          points_earned: number
          transaction_amount: number
          transaction_date: string
          transaction_reference: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          loyalty_number: string
          merchant_id: string
          points_earned?: number
          transaction_amount: number
          transaction_date?: string
          transaction_reference?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          loyalty_number?: string
          merchant_id?: string
          points_earned?: number
          transaction_amount?: number
          transaction_date?: string
          transaction_reference?: string | null
          user_id?: string
        }
        Relationships: []
      }
      merchant_subscription_plans: {
        Row: {
          created_at: string
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          name: string
          price_monthly: number
          trial_days: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          price_monthly: number
          trial_days?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          price_monthly?: number
          trial_days?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      referral_campaigns: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string
          id: string
          is_active: boolean | null
          name: string
          reward_points: number
          start_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date: string
          id?: string
          is_active?: boolean | null
          name: string
          reward_points?: number
          start_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string
          id?: string
          is_active?: boolean | null
          name?: string
          reward_points?: number
          start_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_loyalty_cards: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean | null
          loyalty_number: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          is_active?: boolean | null
          loyalty_number: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          loyalty_number?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_points: {
        Row: {
          available_points: number | null
          id: string
          lifetime_points: number | null
          total_points: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          available_points?: number | null
          id?: string
          lifetime_points?: number | null
          total_points?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          available_points?: number | null
          id?: string
          lifetime_points?: number | null
          total_points?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_referrals: {
        Row: {
          campaign_id: string | null
          completed_at: string | null
          created_at: string
          id: string
          merchant_id: string | null
          referral_code: string
          referred_email: string | null
          referred_user_id: string | null
          referrer_id: string
          reward_points: number | null
          rewarded_at: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          campaign_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          merchant_id?: string | null
          referral_code: string
          referred_email?: string | null
          referred_user_id?: string | null
          referrer_id: string
          reward_points?: number | null
          rewarded_at?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          campaign_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          merchant_id?: string | null
          referral_code?: string
          referred_email?: string | null
          referred_user_id?: string | null
          referrer_id?: string
          reward_points?: number | null
          rewarded_at?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_referrals_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "referral_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      user_wallets: {
        Row: {
          created_at: string
          encrypted_seed_phrase: string
          id: string
          is_active: boolean | null
          solana_address: string
          updated_at: string
          user_id: string
          wallet_type: string | null
        }
        Insert: {
          created_at?: string
          encrypted_seed_phrase: string
          id?: string
          is_active?: boolean | null
          solana_address: string
          updated_at?: string
          user_id: string
          wallet_type?: string | null
        }
        Update: {
          created_at?: string
          encrypted_seed_phrase?: string
          id?: string
          is_active?: boolean | null
          solana_address?: string
          updated_at?: string
          user_id?: string
          wallet_type?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_admin_access: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      generate_loyalty_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_referral_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_profile: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          email: string
          full_name: string
          id: string
          role: string
          updated_at: string
        }[]
      }
      has_role: {
        Args:
          | { _role: Database["public"]["Enums"]["app_role"]; _user_id: string }
          | { _role: Database["public"]["Enums"]["app_role"]; _user_id: string }
        Returns: boolean
      }
      is_admin: {
        Args: { user_id?: string }
        Returns: boolean
      }
      log_admin_action: {
        Args: {
          action_type: string
          details?: Json
          record_id?: string
          table_name: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "merchant" | "customer"
      card_type: "rewards" | "loyalty" | "membership" | "gift"
      merchant_status: "active" | "suspended" | "pending" | "cancelled"
      pricing_type: "free" | "one_time" | "subscription"
      subscription_plan: "basic" | "premium" | "enterprise"
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
      app_role: ["admin", "merchant", "customer"],
      card_type: ["rewards", "loyalty", "membership", "gift"],
      merchant_status: ["active", "suspended", "pending", "cancelled"],
      pricing_type: ["free", "one_time", "subscription"],
      subscription_plan: ["basic", "premium", "enterprise"],
    },
  },
} as const