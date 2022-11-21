export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

export interface Database {
  public: {
    Tables: {
      rls_notes: {
        Row: {
          id: number;
          publish_date: string | null;
          user_id: string;
          title: string;
          body: string;
        };
        Insert: {
          id?: number;
          publish_date?: string | null;
          user_id: string;
          title: string;
          body: string;
        };
        Update: {
          id?: number;
          publish_date?: string | null;
          user_id?: string;
          title: string;
          body: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
