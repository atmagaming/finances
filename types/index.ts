export type TransactionMethod = "Paid" | "Accrued" | "Invested";

export interface Transaction {
  id: string;
  note: string;
  amount: number;
  usdEquivalent: number;
  currency: string;
  method: TransactionMethod;
  category: string;
  logicalDate: string;
  factualDate: string | null;
  payeeId: string;
  payeeName: string;
}

export interface Person {
  id: string;
  name: string;
  status: string;
  sensitiveDataIds: string[];
  notionEmail: string;
}

export interface SensitiveData {
  id: string;
  name: string;
  personId: string;
  hourlyPaid: number;
  hourlyInvested: number;
  schedule: number[];
  hoursPerWeek: number;
  monthlyPaid: number;
  monthlyInvested: number;
  monthlyTotal: number;
  startDate: string | null;
  endDate: string | null;
  status: string;
}

export interface Payee {
  id: string;
  name: string;
  personId: string | null;
  type: string;
  accrued: number;
  invested: number;
}

export interface Vacation {
  id: string;
  personId: string;
  type: string;
  startDate: string;
  endDate: string | null;
}

export interface MonthlyExpense {
  month: string;
  paid: number;
  accrued: number;
  invested: number;
  investments: number;
}

export interface ProjectionMonth {
  month: string;
  paid: number;
  accrued: number;
  total: number;
}

export interface RevenueShare {
  month: string;
  shares: Record<string, number>;
  isProjected: boolean;
}

export interface InvestmentPoint {
  month: string;
  values: Record<string, number>;
  isProjected: boolean;
}

export interface ChartSeries {
  name: string;
  color: string;
  data: (number | null)[];
  projData: (number | null)[];
}
