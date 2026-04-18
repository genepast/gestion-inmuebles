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
  amount: number;
}

export interface DashboardMetrics {
  total: number;
  byStatus: StatusCount[];
  byType: TypeCount[];
  weeklyIncome: WeeklyIncome[];
}
