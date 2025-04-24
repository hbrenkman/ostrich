export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      reference_tables: {
        Row: {
          id: string
          name: string
          category: string
          description: string | null
          entries: Json
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          category: string
          description?: string | null
          entries?: Json
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          category?: string
          description?: string | null
          entries?: Json
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      state_cost_index: {
        Row: {
          id: string
          state: string
          metro_area: string
          cost_index: number
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          state: string
          metro_area: string
          cost_index: number
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          state?: string
          metro_area?: string
          cost_index?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
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