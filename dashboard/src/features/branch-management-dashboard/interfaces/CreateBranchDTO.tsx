export interface CreateBranchDTO {
  branchId: number;
  branchName: string;
  branchAddress: string;
  branchContact: string;
  branchFax?: string;
  branchEmail: string;
  branchDescription: string;
  branchStatus: boolean;
  branchLocation: string;
  branchCreatedOn: string; // This should ideally be a Date type if storing date/time
  branchCreatedBy: string;
  branchProfileImageUrl: string;
  branchLatitude?: number;
  branchLongitude?: number;
}
