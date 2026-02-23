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
  startDate: string | null;
  endDate: string | null;
  status: string;
}

export interface Payee {
  id: string;
  name: string;
  personId: string | null;
  type: string;
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
  values: Record<string, number>; // person name -> per-month increment (USD)
  isProjected: boolean;
}
