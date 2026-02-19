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
      profiles: {
        Row: {
          id: string
          email: string
          display_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      baby_profiles: {
        Row: {
          id: string
          user_id: string
          name: string
          birthday: string
          gender: 'male' | 'female' | 'other' | null
          avatar_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          birthday: string
          gender?: 'male' | 'female' | 'other' | null
          avatar_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          birthday?: string
          gender?: 'male' | 'female' | 'other' | null
          avatar_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      ingredient_states: {
        Row: {
          id: string
          baby_id: string
          ingredient_id: string
          status: 'not_tried' | 'tried' | 'loved' | 'disliked'
          allergy: boolean
          preference: number
          note: string | null
          first_tried_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          baby_id: string
          ingredient_id: string
          status?: 'not_tried' | 'tried' | 'loved' | 'disliked'
          allergy?: boolean
          preference?: number
          note?: string | null
          first_tried_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          baby_id?: string
          ingredient_id?: string
          status?: 'not_tried' | 'tried' | 'loved' | 'disliked'
          allergy?: boolean
          preference?: number
          note?: string | null
          first_tried_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      recipe_ratings: {
        Row: {
          id: string
          baby_id: string
          recipe_id: string
          rating: 'like' | 'normal' | 'dislike'
          note: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          baby_id: string
          recipe_id: string
          rating: 'like' | 'normal' | 'dislike'
          note?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          baby_id?: string
          recipe_id?: string
          rating?: 'like' | 'normal' | 'dislike'
          note?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      favorite_recipes: {
        Row: {
          id: string
          baby_id: string
          recipe_id: string
          created_at: string
        }
        Insert: {
          id?: string
          baby_id: string
          recipe_id: string
          created_at?: string
        }
        Update: {
          id?: string
          baby_id?: string
          recipe_id?: string
          created_at?: string
        }
      }
      pantry_items: {
        Row: {
          id: string
          baby_id: string
          ingredient_id: string
          quantity: number
          unit: string
          expiry_date: string | null
          location: string | null
          note: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          baby_id: string
          ingredient_id: string
          quantity?: number
          unit?: string
          expiry_date?: string | null
          location?: string | null
          note?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          baby_id?: string
          ingredient_id?: string
          quantity?: number
          unit?: string
          expiry_date?: string | null
          location?: string | null
          note?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      meal_plans: {
        Row: {
          id: string
          baby_id: string
          date: string
          meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
          recipe_id: string | null
          custom_meal: string | null
          note: string | null
          completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          baby_id: string
          date: string
          meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
          recipe_id?: string | null
          custom_meal?: string | null
          note?: string | null
          completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          baby_id?: string
          date?: string
          meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack'
          recipe_id?: string | null
          custom_meal?: string | null
          note?: string | null
          completed?: boolean
          created_at?: string
          updated_at?: string
        }
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
  }
}
