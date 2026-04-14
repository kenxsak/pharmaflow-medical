export interface Branch {
  branchId: number;
  branchName: string;
  branchAddress: string;
  branchContact: string;
  branchFax?: string; // Optional property with type string
  branchEmail: string;
  branchDescription: string;
  branchImage: string | null;
  branchImageData?: string | null;
  branchStatus: boolean;
  branchLocation: string;
  branchCreatedOn: string;
  branchCreatedBy: string;
  branchLatitude?: number;
  branchLongitude?: number;
}
