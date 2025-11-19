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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      events: {
        Row: {
          created_at: string | null
          date: string
          event_type: string
          id: number
          name: string
          opponent_school: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          event_type?: string
          id?: number
          name: string
          opponent_school?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          event_type?: string
          id?: number
          name?: string
          opponent_school?: string | null
        }
        Relationships: []
      }
      match_events: {
        Row: {
          action_type: string
          attacker: string | null
          created_at: string | null
          id: number
          match_id: number
          period_number: number
          period_order: number
          period_type: string
          points: number | null
          scorer: string
          takedown_type: string | null
        }
        Insert: {
          action_type: string
          attacker?: string | null
          created_at?: string | null
          id?: number
          match_id: number
          period_number: number
          period_order: number
          period_type: string
          points?: number | null
          scorer: string
          takedown_type?: string | null
        }
        Update: {
          action_type?: string
          attacker?: string | null
          created_at?: string | null
          id?: number
          match_id?: number
          period_number?: number
          period_order?: number
          period_type?: string
          points?: number | null
          scorer?: string
          takedown_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_events_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_events_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "v_team_match_summary"
            referencedColumns: ["match_id"]
          },
          {
            foreignKeyName: "match_events_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "v_wrestler_match_summary"
            referencedColumns: ["match_id"]
          },
          {
            foreignKeyName: "match_events_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "v_wrestler_period_summary"
            referencedColumns: ["match_id"]
          },
        ]
      }
      matches: {
        Row: {
          created_at: string | null
          date: string
          event_id: number | null
          event_name: string | null
          first_takedown_scorer: string | null
          id: number
          match_type: string | null
          opponent_name: string
          opponent_riding_time_seconds: number | null
          opponent_school: string | null
          opponent_score: number | null
          our_riding_time_seconds: number | null
          our_score: number | null
          outcome_type: string
          result: string | null
          season_id: number | null
          weight_class: string | null
          wrestler_id: number
        }
        Insert: {
          created_at?: string | null
          date: string
          event_id?: number | null
          event_name?: string | null
          first_takedown_scorer?: string | null
          id?: number
          match_type?: string | null
          opponent_name: string
          opponent_riding_time_seconds?: number | null
          opponent_school?: string | null
          opponent_score?: number | null
          our_riding_time_seconds?: number | null
          our_score?: number | null
          outcome_type?: string
          result?: string | null
          season_id?: number | null
          weight_class?: string | null
          wrestler_id: number
        }
        Update: {
          created_at?: string | null
          date?: string
          event_id?: number | null
          event_name?: string | null
          first_takedown_scorer?: string | null
          id?: number
          match_type?: string | null
          opponent_name?: string
          opponent_riding_time_seconds?: number | null
          opponent_school?: string | null
          opponent_score?: number | null
          our_riding_time_seconds?: number | null
          our_score?: number | null
          outcome_type?: string
          result?: string | null
          season_id?: number | null
          weight_class?: string | null
          wrestler_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "matches_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_wrestler_id_fkey"
            columns: ["wrestler_id"]
            isOneToOne: false
            referencedRelation: "wrestlers"
            referencedColumns: ["id"]
          },
        ]
      }
      seasons: {
        Row: {
          end_date: string | null
          id: number
          name: string
          start_date: string | null
        }
        Insert: {
          end_date?: string | null
          id?: number
          name: string
          start_date?: string | null
        }
        Update: {
          end_date?: string | null
          id?: number
          name?: string
          start_date?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string | null
          role: string
          wrestler_id: number | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          name?: string | null
          role?: string
          wrestler_id?: number | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string | null
          role?: string
          wrestler_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "users_wrestler_id_fkey"
            columns: ["wrestler_id"]
            isOneToOne: false
            referencedRelation: "wrestlers"
            referencedColumns: ["id"]
          },
        ]
      }
      wrestlers: {
        Row: {
          active: boolean | null
          class_year: string | null
          created_at: string | null
          id: number
          name: string
          primary_weight_class: string | null
          user_id: string | null
        }
        Insert: {
          active?: boolean | null
          class_year?: string | null
          created_at?: string | null
          id?: number
          name: string
          primary_weight_class?: string | null
          user_id?: string | null
        }
        Update: {
          active?: boolean | null
          class_year?: string | null
          created_at?: string | null
          id?: number
          name?: string
          primary_weight_class?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      v_team_match_summary: {
        Row: {
          date: string | null
          losses: number | null
          match_id: number | null
          season_id: number | null
          season_name: string | null
          takedowns_against: number | null
          takedowns_for: number | null
          team_points_against: number | null
          team_points_for: number | null
          wins: number | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      v_team_period_stats: {
        Row: {
          attempts_against: number | null
          attempts_for: number | null
          avg_point_differential: number | null
          period_number: number | null
          period_order: number | null
          period_type: string | null
          points_against: number | null
          points_for: number | null
          season_id: number | null
          takedowns_against: number | null
          takedowns_for: number | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      v_wrestler_match_summary: {
        Row: {
          attempts_against: number | null
          attempts_for: number | null
          date: string | null
          first_takedown_scorer: string | null
          match_id: number | null
          match_type: string | null
          opponent_name: string | null
          opponent_riding_time_seconds: number | null
          opponent_school: string | null
          opponent_score: number | null
          our_riding_time_seconds: number | null
          our_score: number | null
          period_points_against: number | null
          period_points_for: number | null
          result: string | null
          riding_time_advantage: boolean | null
          season_id: number | null
          season_name: string | null
          takedowns_against: number | null
          takedowns_for: number | null
          weight_class: string | null
          won_first_takedown: boolean | null
          wrestler_id: number | null
          wrestler_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_wrestler_id_fkey"
            columns: ["wrestler_id"]
            isOneToOne: false
            referencedRelation: "wrestlers"
            referencedColumns: ["id"]
          },
        ]
      }
      v_wrestler_period_summary: {
        Row: {
          attempts_against: number | null
          attempts_for: number | null
          date: string | null
          escapes_against: number | null
          escapes_for: number | null
          match_id: number | null
          nearfall_points_against: number | null
          nearfall_points_for: number | null
          period_number: number | null
          period_order: number | null
          period_type: string | null
          points_against: number | null
          points_for: number | null
          reversals_against: number | null
          reversals_for: number | null
          season_id: number | null
          takedowns_against: number | null
          takedowns_for: number | null
          wrestler_id: number | null
          wrestler_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_wrestler_id_fkey"
            columns: ["wrestler_id"]
            isOneToOne: false
            referencedRelation: "wrestlers"
            referencedColumns: ["id"]
          },
        ]
      }
      v_wrestler_season_stats: {
        Row: {
          avg_score_margin: number | null
          draws: number | null
          first_takedown_win_pct: number | null
          forfeits: number | null
          losses: number | null
          matches_wrestled: number | null
          riding_time_advantage_pct: number | null
          season_id: number | null
          season_name: string | null
          total_attempts_against: number | null
          total_attempts_for: number | null
          total_points_against: number | null
          total_points_for: number | null
          total_takedowns_against: number | null
          total_takedowns_for: number | null
          wins: number | null
          wrestler_id: number | null
          wrestler_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_wrestler_id_fkey"
            columns: ["wrestler_id"]
            isOneToOne: false
            referencedRelation: "wrestlers"
            referencedColumns: ["id"]
          },
        ]
      }
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
