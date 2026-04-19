export interface StatusCount {
  status: string;
  count: number;
}

export interface TypeCount {
  type: string;
  count: number;
}

export interface WeeklyIncome {
  week: string;
  label: string;
  usd: number;
  ars: number;
}

export interface CityAvgPrice {
  city: string;
  avg: number;
  count: number;
}

export interface RecentProperty {
  id: string;
  title: string;
  property_type: string;
  status: string;
  price_amount: number;
  price_currency: string;
  city: string | null;
  created_at: string;
}

export interface DashboardMetrics {
  total: number;
  byStatus: StatusCount[];
  byType: TypeCount[];
  weeklyIncome: WeeklyIncome[];
  avgPriceByCityUsd: CityAvgPrice[];
  avgPriceByCityArs: CityAvgPrice[];
  recentProperties: RecentProperty[];
}
