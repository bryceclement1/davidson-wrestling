export interface Database {
  public: {
    Tables: {
      wrestlers: {
        Row: {
          id: number;
          name: string;
          class_year: string | null;
          primary_weight_class: string | null;
          active: boolean;
          user_id: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["wrestlers"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["wrestlers"]["Row"]>;
      };
      matches: {
        Row: {
          id: number;
          wrestler_id: number;
          season_id: number | null;
          event_id: number | null;
          opponent_name: string;
          opponent_school: string | null;
          weight_class: string | null;
          match_type: "dual" | "tournament";
          event_name: string | null;
          date: string;
          result: "W" | "L" | "D" | "FF";
          outcome_type:
            | "decision"
            | "major_decision"
            | "tech_fall"
            | "fall"
            | "forfeit"
            | "injury";
          our_score: number;
          opponent_score: number;
          first_takedown_scorer: "us" | "opponent" | "none";
          our_riding_time_seconds: number;
          opponent_riding_time_seconds: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["matches"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["matches"]["Row"]>;
      };
      events: {
        Row: {
          id: number;
          name: string;
          event_type: "dual" | "tournament";
          date: string;
          opponent_school: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["events"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["events"]["Row"]>;
      };
      match_events: {
        Row: {
          id: number;
          match_id: number;
          action_type:
            | "takedown"
            | "takedown_attempt"
            | "escape"
            | "reversal"
            | "nearfall";
          period_order: number;
          period_type: "reg" | "ot" | "tb";
          period_number: number;
          scorer: "us" | "opponent" | "none";
          attacker: "us" | "opponent" | null;
          takedown_type:
            | "single"
            | "double"
            | "high_c"
            | "ankle_pick"
            | "throw"
            | "trip"
            | "other"
            | null;
          points: number | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["match_events"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["match_events"]["Row"]>;
      };
      seasons: {
        Row: {
          id: number;
          name: string;
          start_date: string;
          end_date: string;
        };
        Insert: Partial<Database["public"]["Tables"]["seasons"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["seasons"]["Row"]>;
      };
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          role: "admin" | "standard";
          wrestler_id: number | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["users"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["users"]["Row"]>;
      };
    };
  };
}
