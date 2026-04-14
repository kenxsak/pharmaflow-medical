export interface IBranchSummary {
  branchId: number;
  branchName: string;
  branchAddress: string;
  branchContact: string;
  branchEmail: string;
  branchLocation: string;
  branchStatus: boolean;
  branchImageUrl: string | null;
  totalSales: number;
  orderCount: number;
  employeeCount: number;
  itemCount: number;
  lowStockItemCount: number;
}

export interface IAllBranchDetails {
  totalBranches: number;
  activeBranches: number;
  totalSalesAllBranches: number;
  totalOrdersAllBranches: number;
  totalEmployeesAllBranches: number;
  totalItemsAllBranches: number;
  branchSummaries: IBranchSummary[];
}
