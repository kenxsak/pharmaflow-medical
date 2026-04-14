export interface ChangeBranchManagerDTO {
  formerManagerId: number;
  branchId: number;
  newManagerId: number;
  currentManagerNewRole: string;
  newManagerRole: string;
}
