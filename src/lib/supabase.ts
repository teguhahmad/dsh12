import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
        }
      }
      accounts: {
        Row: {
          id: string
          username: string
          email: string
          phone: string
          status: 'active' | 'violation' | 'inactive'
          payment_data: 'belum diatur' | 'utamakan' | 'dimasukkan' | 'disetujui' | 'sah'
          account_code: string
          category_id: string
          user_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          username: string
          email: string
          phone: string
          status?: 'active' | 'violation' | 'inactive'
          payment_data?: 'belum diatur' | 'utamakan' | 'dimasukkan' | 'disetujui' | 'sah'
          account_code: string
          category_id: string
          user_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          email?: string
          phone?: string
          status?: 'active' | 'violation' | 'inactive'
          payment_data?: 'belum diatur' | 'utamakan' | 'dimasukkan' | 'disetujui' | 'sah'
          account_code?: string
          category_id?: string
          user_id?: string | null
          created_at?: string
        }
      }
      sales_data: {
        Row: {
          id: string
          account_id: string
          date: string
          clicks: number
          orders: number
          gross_commission: number
          products_sold: number
          total_purchases: number
          new_buyers: number
          created_at: string
        }
        Insert: {
          id?: string
          account_id: string
          date: string
          clicks?: number
          orders?: number
          gross_commission?: number
          products_sold?: number
          total_purchases?: number
          new_buyers?: number
          created_at?: string
        }
        Update: {
          id?: string
          account_id?: string
          date?: string
          clicks?: number
          orders?: number
          gross_commission?: number
          products_sold?: number
          total_purchases?: number
          new_buyers?: number
          created_at?: string
        }
      }
      users: {
        Row: {
          id: string
          name: string
          email: string
          role: 'user' | 'superadmin'
          managed_accounts: string[]
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          role?: 'user' | 'superadmin'
          managed_accounts?: string[]
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          role?: 'user' | 'superadmin'
          managed_accounts?: string[]
          created_at?: string
        }
      }
      incentive_rules: {
        Row: {
          id: string
          name: string
          description: string
          min_commission_threshold: number
          commission_rate_min: number
          commission_rate_max: number
          base_revenue_threshold: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          min_commission_threshold: number
          commission_rate_min: number
          commission_rate_max: number
          base_revenue_threshold: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          min_commission_threshold?: number
          commission_rate_min?: number
          commission_rate_max?: number
          base_revenue_threshold?: number
          is_active?: boolean
          created_at?: string
        }
      }
      incentive_tiers: {
        Row: {
          id: string
          rule_id: string
          revenue_threshold: number
          incentive_rate: number
          created_at: string
        }
        Insert: {
          id?: string
          rule_id: string
          revenue_threshold: number
          incentive_rate: number
          created_at?: string
        }
        Update: {
          id?: string
          rule_id?: string
          revenue_threshold?: number
          incentive_rate?: number
          created_at?: string
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
      account_status: 'active' | 'violation' | 'inactive'
      payment_status: 'belum diatur' | 'utamakan' | 'dimasukkan' | 'disetujui' | 'sah'
      user_role: 'user' | 'superadmin'
    }
  }
}