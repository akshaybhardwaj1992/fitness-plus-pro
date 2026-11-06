
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "exercises": {
                  Row: {
                    "created_at": string,"default_reps": string,"default_rest_sec": number,"default_sets": number,"difficulty": string,"equipment": string,"id": string,"instructions": string,"is_active": boolean,"name": string,"target_muscle": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"default_reps"?: string,"default_rest_sec"?: number,"default_sets"?: number,"difficulty": string,"equipment"?: string,"id"?: string,"instructions"?: string,"is_active"?: boolean,"name": string,"target_muscle": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"default_reps"?: string,"default_rest_sec"?: number,"default_sets"?: number,"difficulty"?: string,"equipment"?: string,"id"?: string,"instructions"?: string,"is_active"?: boolean,"name"?: string,"target_muscle"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"foods": {
                  Row: {
                    "allergens": (string)[],"carbs_g": number,"category": string,"created_at": string,"diet_type": string,"fat_g": number,"fibre_g": number,"id": string,"is_active": boolean,"kcal": number,"name": string,"price_inr": number | null,"protein_g": number,"roles": (string)[],"serving_desc": string,"serving_size_g": number,"source": string,"updated_at": string,"verified": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "allergens"?: (string)[],"carbs_g": number,"category": string,"created_at"?: string,"diet_type": string,"fat_g": number,"fibre_g"?: number,"id"?: string,"is_active"?: boolean,"kcal": number,"name": string,"price_inr"?: number | null,"protein_g": number,"roles"?: (string)[],"serving_desc"?: string,"serving_size_g": number,"source"?: string,"updated_at"?: string,"verified"?: boolean
                  }
                  Update: {
                    "allergens"?: (string)[],"carbs_g"?: number,"category"?: string,"created_at"?: string,"diet_type"?: string,"fat_g"?: number,"fibre_g"?: number,"id"?: string,"is_active"?: boolean,"kcal"?: number,"name"?: string,"price_inr"?: number | null,"protein_g"?: number,"roles"?: (string)[],"serving_desc"?: string,"serving_size_g"?: number,"source"?: string,"updated_at"?: string,"verified"?: boolean
                  }
                  Relationships: [
                    
                  ]
                },"members": {
                  Row: {
                    "activity_level": string,"age": number,"allergies": string,"cooking_style": string,"created_at": string,"created_by": string | null,"daily_budget_inr": number | null,"diet_type": string,"experience": string,"foods_to_avoid": string,"full_name": string,"goal": string,"height_cm": number,"id": string,"is_active": boolean,"medical_notes": string,"needs_professional_review": boolean,"phone": string | null,"sex": string,"updated_at": string,"weight_kg": number,"workouts_per_week": number
                  }
                  ComputedFields: never
                  Insert: {
                    "activity_level": string,"age": number,"allergies"?: string,"cooking_style"?: string,"created_at"?: string,"created_by"?: string | null,"daily_budget_inr"?: number | null,"diet_type": string,"experience"?: string,"foods_to_avoid"?: string,"full_name": string,"goal": string,"height_cm": number,"id"?: string,"is_active"?: boolean,"medical_notes"?: string,"needs_professional_review"?: boolean,"phone"?: string | null,"sex": string,"updated_at"?: string,"weight_kg": number,"workouts_per_week"?: number
                  }
                  Update: {
                    "activity_level"?: string,"age"?: number,"allergies"?: string,"cooking_style"?: string,"created_at"?: string,"created_by"?: string | null,"daily_budget_inr"?: number | null,"diet_type"?: string,"experience"?: string,"foods_to_avoid"?: string,"full_name"?: string,"goal"?: string,"height_cm"?: number,"id"?: string,"is_active"?: boolean,"medical_notes"?: string,"needs_professional_review"?: boolean,"phone"?: string | null,"sex"?: string,"updated_at"?: string,"weight_kg"?: number,"workouts_per_week"?: number
                  }
                  Relationships: [
                    
                  ]
                },"plans": {
                  Row: {
                    "content": NonNullable<Json>,"created_at": string,"created_by": string | null,"id": string,"member_id": string,"status": string,"title": string,"type": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "content"?: NonNullable<Json>,"created_at"?: string,"created_by"?: string | null,"id"?: string,"member_id": string,"status"?: string,"title"?: string,"type": string,"updated_at"?: string
                  }
                  Update: {
                    "content"?: NonNullable<Json>,"created_at"?: string,"created_by"?: string | null,"id"?: string,"member_id"?: string,"status"?: string,"title"?: string,"type"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "plans_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"email": string | null,"full_name": string | null,"id": string,"role": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"email"?: string | null,"full_name"?: string | null,"id": string,"role"?: string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"email"?: string | null,"full_name"?: string | null,"id"?: string,"role"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"weight_logs": {
                  Row: {
                    "created_at": string,"created_by": string | null,"id": string,"logged_on": string,"member_id": string,"note": string,"weight_kg": number
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"id"?: string,"logged_on"?: string,"member_id": string,"note"?: string,"weight_kg": number
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"id"?: string,"logged_on"?: string,"member_id"?: string,"note"?: string,"weight_kg"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "weight_logs_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "is_staff":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"publish_plan":
{ Args: { "p_plan_id": string }; Returns: undefined
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            
          }
        }
} as const
