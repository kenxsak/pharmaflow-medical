export interface BranchSalesDetails {
  date: string;
  orderCount: number;
  totalSales: number;
}

export interface BranchDailySalesResponse {
  branchId: number;
  branchName: string;
  dailySales: BranchSalesDetails[];
}
