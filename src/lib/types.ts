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
  personId: string | null;
  payeeName: string;
}

export interface PersonStatusChange {
  id: string;
  date: string;
  status: string;
}

export interface PersonDocument {
  id: string;
  name: string;
  url: string;
}

export interface PersonRole {
  id: string;
  name: string;
  notionId: string;
}

export interface Person {
  id: string;
  name: string;
  nickname: string;
  image: string;
  identification: string;
  weeklySchedule: string;
  hourlyRatePaid: number;
  hourlyRateAccrued: number;
  email: string;
  notionPersonPageId: string;
  telegramAccount: string;
  discord: string;
  linkedin: string;
  description: string;
  statusChanges: PersonStatusChange[];
  documents: PersonDocument[];
  roles: PersonRole[];
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

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  personId: string | null;
  isSuperAdmin: boolean;
  canViewTransactions: boolean;
  canViewRevenueShares: boolean;
  canViewPersonalData: boolean;
  canEditPeople: boolean;
}
