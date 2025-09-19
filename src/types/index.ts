export interface Account {
  id: string;
  username: string;
  email: string;
  phone: string;
  status: 'active' | 'violation' | 'inactive';
  payment_data: 'belum diatur' | 'utamakan' | 'dimasukkan' | 'disetujui' | 'sah';
  account_code: string;
  category_id: string;
  user_id: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface SalesData {
  id: string;
  account_id: string;
  date: string;
  clicks: number;
  orders: number;
  gross_commission: number;
  products_sold: number;
  total_purchases: number;
  new_buyers: number;
  created_at: string;
}

export interface DashboardMetrics {
  totalCommission: number;
  totalRevenue: number;
  totalOrders: number;
  totalClicks: number;
  commissionPercentage: number;
  conversionRate: number;
}
export interface IncentiveTier {
  id: string;
  revenue_threshold: number;
  incentive_rate: number;
  created_at: string;
}

export interface IncentiveRule {
  id: string;
  name: string;
  description: string;
  min_commission_threshold: number;
  commission_rate_min: number;
  commission_rate_max: number;
  base_revenue_threshold: number;
  tiers: IncentiveTier[];
  is_active: boolean;
  created_at: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'superadmin';
  managed_accounts: string[]; // Array of account IDs
  created_at: string;
  access_token?: string;
  refresh_token?: string;
}

export interface IncentiveCalculation {
  user_id: string;
  user_name: string;
  total_revenue: number;
  total_commission: number;
  commission_rate: number;
  applicable_rule: IncentiveRule | null;
  current_tier: IncentiveTier | null;
  next_tier: IncentiveTier | null;
  incentive_amount: number;
  progress_percentage: number;
  remaining_to_next_tier: number;
  managed_accounts_count: number;
}