interface DailySalesSummary {
  date: string;
  orderCount: number;
  totalSales: number;
}

export interface BranchSalesData {
  branchId: number;
  branchName: string;
  dailySales: DailySalesSummary[];
}
