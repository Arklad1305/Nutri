export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface NutritionalMatrix {
  motor?: {
    calories?: number
    protein_g?: number
    carbs_g?: number
    fat_g?: number
    fiber_g?: number
    sugar_g?: number
    water_ml?: number
    electrolytes?: {
      sodium_mg?: number
      potassium_mg?: number
      chloride_mg?: number
    }
    aminos_muscle?: {
      leucine_mg?: number
      isoleucine_mg?: number
      valine_mg?: number
      lysine_mg?: number
      methionine_mg?: number
      threonine_mg?: number
    }
    structure_minerals?: {
      calcium_mg?: number
      phosphorus_mg?: number
      zinc_mg?: number
      magnesium_mg?: number
      iron_mg?: number
      copper_mg?: number
    }
  }
  cognitive?: {
    aminos_brain?: {
      tryptophan_mg?: number
      phenylalanine_mg?: number
      tyrosine_mg?: number
      histidine_mg?: number
    }
    neuro_others?: {
      taurine_mg?: number
      choline_mg?: number
      creatine_mg?: number
    }
    energy_vitamins?: {
      vit_b1_thiamin_mg?: number
      vit_b2_riboflavin_mg?: number
      vit_b3_niacin_mg?: number
      vit_b5_pantothenic_mg?: number
      vit_b6_mg?: number
      vit_b7_biotin_mcg?: number
      vit_b12_mcg?: number
      folate_mcg?: number
      vit_c_mg?: number
    }
    electrolytes?: {
      sodium_mg?: number
      potassium_mg?: number
    }
    trace_minerals?: {
      selenium_mcg?: number
      chromium_mcg?: number
    }
  }
  hormonal?: {
    thyroid_insulin?: {
      iodine_mcg?: number
      manganese_mg?: number
    }
    liposolubles?: {
      vit_a_mcg?: number
      vit_d3_iu?: number
      vit_e_iu?: number
      vit_k1_mcg?: number
      vit_k2_mcg?: number
    }
  }
  inflammation?: {
    omega?: {
      omega_3_total_mg?: number
      epa_dha_mg?: number
      omega_6_mg?: number
    }
    sat_fats?: {
      saturated_g?: number
      cholesterol_mg?: number
    }
    bioactives?: {
      polyphenols_total_mg?: number
      anthocyanins_mg?: number
    }
  }
  other?: {
    caffeine_mg?: number
    alcohol_g?: number
    probiotics_cfu?: number
  }
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          email: string | null
          age: number | null
          gender: string | null
          height_cm: number | null
          weight_kg: number | null
          activity_level: string | null
          goal: string | null
          preferred_diet: string[]
          target_calories: number | null
          target_protein_g: number | null
          target_carbs_g: number | null
          target_fat_g: number | null
          bmi: number | null
          adjusted_weight_kg: number | null
          nutrition_targets_json: any | null
          last_night_sleep_hours: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          email?: string | null
          age?: number | null
          gender?: string | null
          height_cm?: number | null
          weight_kg?: number | null
          activity_level?: string | null
          goal?: string | null
          preferred_diet?: string[]
          target_calories?: number | null
          target_protein_g?: number | null
          target_carbs_g?: number | null
          target_fat_g?: number | null
          bmi?: number | null
          adjusted_weight_kg?: number | null
          nutrition_targets_json?: any | null
          last_night_sleep_hours?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          email?: string | null
          age?: number | null
          gender?: string | null
          height_cm?: number | null
          weight_kg?: number | null
          activity_level?: string | null
          goal?: string | null
          preferred_diet?: string[]
          target_calories?: number | null
          target_protein_g?: number | null
          target_carbs_g?: number | null
          target_fat_g?: number | null
          bmi?: number | null
          adjusted_weight_kg?: number | null
          nutrition_targets_json?: any | null
          last_night_sleep_hours?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      daily_goals: {
        Row: {
          id: number
          user_id: string
          calories: number | null
          protein_g: number | null
          carbs_g: number | null
          fat_g: number | null
          fiber_g: number | null
          sugar_g: number | null
          water_ml: number | null
          vitamin_a_mcg: number | null
          vitamin_c_mg: number | null
          vitamin_d_mcg: number | null
          vitamin_e_mg: number | null
          vitamin_k_mcg: number | null
          vitamin_b6_mg: number | null
          vitamin_b12_mcg: number | null
          folate_mcg: number | null
          calcium_mg: number | null
          iron_mg: number | null
          magnesium_mg: number | null
          potassium_mg: number | null
          sodium_mg: number | null
          zinc_mg: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          calories?: number | null
          protein_g?: number | null
          carbs_g?: number | null
          fat_g?: number | null
          fiber_g?: number | null
          sugar_g?: number | null
          water_ml?: number | null
          vitamin_a_mcg?: number | null
          vitamin_c_mg?: number | null
          vitamin_d_mcg?: number | null
          vitamin_e_mg?: number | null
          vitamin_k_mcg?: number | null
          vitamin_b6_mg?: number | null
          vitamin_b12_mcg?: number | null
          folate_mcg?: number | null
          calcium_mg?: number | null
          iron_mg?: number | null
          magnesium_mg?: number | null
          potassium_mg?: number | null
          sodium_mg?: number | null
          zinc_mg?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          calories?: number | null
          protein_g?: number | null
          carbs_g?: number | null
          fat_g?: number | null
          fiber_g?: number | null
          sugar_g?: number | null
          water_ml?: number | null
          vitamin_a_mcg?: number | null
          vitamin_c_mg?: number | null
          vitamin_d_mcg?: number | null
          vitamin_e_mg?: number | null
          vitamin_k_mcg?: number | null
          vitamin_b6_mg?: number | null
          vitamin_b12_mcg?: number | null
          folate_mcg?: number | null
          calcium_mg?: number | null
          iron_mg?: number | null
          magnesium_mg?: number | null
          potassium_mg?: number | null
          sodium_mg?: number | null
          zinc_mg?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      food_logs: {
        Row: {
          id: number
          user_id: string
          food_name: string
          quantity_g: number | null
          reply_text: string | null
          calories: number | null
          protein_g: number | null
          carbs_g: number | null
          fat_g: number | null
          water_ml: number | null
          leucine_mg: number | null
          sodium_mg: number | null
          choline_mg: number | null
          zinc_mg: number | null
          magnesium_mg: number | null
          vit_d3_iu: number | null
          omega_3_total_g: number | null
          polyphenols_total_mg: number | null
          nutritional_matrix: NutritionalMatrix | null
          created_at: string
          logged_at: string
        }
        Insert: {
          id?: number
          user_id: string
          food_name: string
          quantity_g?: number | null
          reply_text?: string | null
          calories?: number | null
          protein_g?: number | null
          carbs_g?: number | null
          fat_g?: number | null
          water_ml?: number | null
          leucine_mg?: number | null
          sodium_mg?: number | null
          choline_mg?: number | null
          zinc_mg?: number | null
          magnesium_mg?: number | null
          vit_d3_iu?: number | null
          omega_3_total_g?: number | null
          polyphenols_total_mg?: number | null
          nutritional_matrix?: NutritionalMatrix | null
          logged_at?: string
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          food_name?: string
          quantity_g?: number | null
          reply_text?: string | null
          calories?: number | null
          protein_g?: number | null
          carbs_g?: number | null
          fat_g?: number | null
          water_ml?: number | null
          leucine_mg?: number | null
          sodium_mg?: number | null
          choline_mg?: number | null
          zinc_mg?: number | null
          magnesium_mg?: number | null
          vit_d3_iu?: number | null
          omega_3_total_g?: number | null
          polyphenols_total_mg?: number | null
          nutritional_matrix?: NutritionalMatrix | null
          logged_at?: string
          created_at?: string
        }
        Relationships: []
      }
      water_logs: {
        Row: {
          id: number
          user_id: string
          amount_ml: number
          logged_at: string
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          amount_ml: number
          logged_at?: string
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          amount_ml?: number
          logged_at?: string
          created_at?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          id: number
          user_id: string
          content: string
          sender: 'user' | 'assistant'
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          content: string
          sender: 'user' | 'assistant'
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          content?: string
          sender?: 'user' | 'assistant'
          metadata?: Json
          created_at?: string
        }
        Relationships: []
      }
      nutritional_standards: {
        Row: {
          id: number
          nutrient_key: string
          label: string
          unit: string
          min_survival_value: number
          min_optimal_value: number | null
          max_optimal_value: number | null
          category: string
          color_code: string | null
          description: string | null
          created_at: string
        }
        Insert: {
          id?: number
          nutrient_key: string
          label: string
          unit: string
          min_survival_value: number
          min_optimal_value?: number | null
          max_optimal_value?: number | null
          category: string
          color_code?: string | null
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          nutrient_key?: string
          label?: string
          unit?: string
          min_survival_value?: number
          min_optimal_value?: number | null
          max_optimal_value?: number | null
          category?: string
          color_code?: string | null
          description?: string | null
          created_at?: string
        }
        Relationships: []
      }
      meal_recommendations: {
        Row: {
          id: number
          user_id: string
          recipe_title: string
          recipe_description: string | null
          ingredients: string[]
          instructions: string[]
          target_nutrients: string[]
          nutritional_info: Json | null
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          recipe_title: string
          recipe_description?: string | null
          ingredients?: string[]
          instructions?: string[]
          target_nutrients?: string[]
          nutritional_info?: Json | null
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          recipe_title?: string
          recipe_description?: string | null
          ingredients?: string[]
          instructions?: string[]
          target_nutrients?: string[]
          nutritional_info?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      diet_categories: {
        Row: {
          id: number
          name: string
          description: string | null
          icon: string | null
          criteria: Json | null
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          description?: string | null
          icon?: string | null
          criteria?: Json | null
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          description?: string | null
          icon?: string | null
          criteria?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      daily_activity: {
        Row: {
          id: number
          user_id: string
          date: string
          is_training_day: boolean
          activity_type: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          date?: string
          is_training_day?: boolean
          activity_type?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          date?: string
          is_training_day?: boolean
          activity_type?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      activity_logs: {
        Row: {
          id: number
          user_id: string
          activity_type: string
          activity_name: string
          duration_minutes: number
          intensity_level: string
          calories_burned: number | null
          notes: string | null
          logged_at: string
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          activity_type: string
          activity_name: string
          duration_minutes?: number
          intensity_level?: string
          calories_burned?: number | null
          notes?: string | null
          logged_at?: string
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          activity_type?: string
          activity_name?: string
          duration_minutes?: number
          intensity_level?: string
          calories_burned?: number | null
          notes?: string | null
          logged_at?: string
          created_at?: string
        }
        Relationships: []
      }
      diet_types: {
        Row: {
          id: number
          name: string
          description: string
          image_url: string
          color: string
          benefits: string[]
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          description: string
          image_url: string
          color?: string
          benefits?: string[]
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          description?: string
          image_url?: string
          color?: string
          benefits?: string[]
          sort_order?: number
          created_at?: string
        }
        Relationships: []
      }
      pantry_items: {
        Row: {
          id: number
          user_id: string
          name: string
          quantity: number | null
          unit: string | null
          category: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          name: string
          quantity?: number | null
          unit?: string | null
          category?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          name?: string
          quantity?: number | null
          unit?: string | null
          category?: string | null
          created_at?: string
          updated_at?: string
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
