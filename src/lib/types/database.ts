export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string | null;
          balance: number;
          last_session_at: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          name?: string | null;
          balance?: number;
          last_session_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string | null;
          balance?: number;
          last_session_at?: string | null;
          created_at?: string;
        };
      };
      character_types: {
        Row: {
          id: number;
          name: string;
          rarity: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          rarity: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          rarity?: string;
          description?: string | null;
          created_at?: string;
        };
      };
      character_instances: {
        Row: {
          id: number;
          user_id: string;
          character_type_id: number;
          level: number;
          exp: number;
          created_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          character_type_id: number;
          level?: number;
          exp?: number;
          created_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          character_type_id?: number;
          level?: number;
          exp?: number;
          created_at?: string;
        };
      };
      pomodoro_sessions: {
        Row: {
          id: number;
          user_id: string;
          character_instance_id: number | null;
          target_count: number;
          completed_count: number;
          focus_minutes: number;
          short_break_minutes: number;
          long_break_minutes: number;
          status: string;
          started_at: string;
          ended_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          character_instance_id?: number | null;
          target_count: number;
          completed_count?: number;
          focus_minutes: number;
          short_break_minutes: number;
          long_break_minutes: number;
          status?: string;
          started_at: string;
          ended_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          character_instance_id?: number | null;
          target_count?: number;
          completed_count?: number;
          focus_minutes?: number;
          short_break_minutes?: number;
          long_break_minutes?: number;
          status?: string;
          started_at?: string;
          ended_at?: string | null;
          created_at?: string;
        };
      };
      pomodoros: {
        Row: {
          id: number;
          session_id: number;
          user_id: string;
          status: string;
          started_at: string;
          completed_at: string | null;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          session_id: number;
          user_id: string;
          status?: string;
          started_at: string;
          completed_at?: string | null;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          session_id?: number;
          user_id?: string;
          status?: string;
          started_at?: string;
          completed_at?: string | null;
          note?: string | null;
          created_at?: string;
        };
      };
      activity_log: {
        Row: {
          id: number;
          user_id: string | null;
          event_category: string;
          event_type: string;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          user_id?: string | null;
          event_category: string;
          event_type: string;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string | null;
          event_category?: string;
          event_type?: string;
          metadata?: Json | null;
          created_at?: string;
        };
      };
      point_transaction: {
        Row: {
          id: number;
          user_id: string;
          tx_type: string;
          amount: number;
          running_balance: number;
          ref_id: number | null;
          ref_type: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          tx_type: string;
          amount: number;
          running_balance: number;
          ref_id?: number | null;
          ref_type?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          tx_type?: string;
          amount?: number;
          running_balance?: number;
          ref_id?: number | null;
          ref_type?: string | null;
          created_at?: string;
        };
      };
      app_config: {
        Row: {
          key: string;
          value: Json;
        };
        Insert: {
          key: string;
          value: Json;
        };
        Update: {
          key?: string;
          value?: Json;
        };
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
