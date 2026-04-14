export interface Item {
  branchId: number;
  discounted: boolean;
  discountedPercentage: number;
  discountedPrice: number;
  expireDate: string;
  freeIssued: boolean;
  itemBarCode: string;
  itemCategoryName: string | null;
  itemDescription: string;
  itemId: number;
  itemImage: string;
  itemManufacture: string;
  itemName: string;
  itemQuantity: number;
  manufactureDate: string;
  measuringUnitType: string;
  purchaseDate: string;
  rackNumber: string;
  sellingPrice: number;
  specialCondition: boolean;
  stock: boolean;
  supplierPrice: number;
  supplyDate: string;
  warehouseName: string;
  warrantyPeriod: string;
}
//
//
//
//
