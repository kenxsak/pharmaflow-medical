type MedicineUnitLike = {
  medicineForm?: string | null;
  packSize?: number | null;
  packSizeLabel?: string | null;
};

export interface MedicineUnitProfile {
  primaryUnitSingular: string;
  primaryUnitLabel: string;
  secondaryUnitSingular: string;
  secondaryUnitLabel: string;
  supportsLooseUnits: boolean;
  defaultBillingUnit: 'PACK' | 'TABLET' | 'CAPSULE' | 'ML' | 'GM' | 'UNIT';
  packSize: number;
  packDisplayLabel: string;
}

const normalize = (value?: string | null) => (value || '').trim().toLowerCase();

const titleCase = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

const inferPrimaryUnit = (
  medicineForm?: string | null,
  packSizeLabel?: string | null
): { singular: string; plural: string } => {
  const form = normalize(medicineForm);
  const packLabel = normalize(packSizeLabel);

  if (packLabel.includes('bottle')) {
    return { singular: 'bottle', plural: 'bottles' };
  }
  if (packLabel.includes('tube')) {
    return { singular: 'tube', plural: 'tubes' };
  }
  if (packLabel.includes('vial')) {
    return { singular: 'vial', plural: 'vials' };
  }
  if (packLabel.includes('ampoule') || packLabel.includes('ampule')) {
    return { singular: 'ampoule', plural: 'ampoules' };
  }
  if (packLabel.includes('sachet')) {
    return { singular: 'sachet', plural: 'sachets' };
  }
  if (packLabel.includes('box')) {
    return { singular: 'box', plural: 'boxes' };
  }
  if (packLabel.includes('jar')) {
    return { singular: 'jar', plural: 'jars' };
  }
  if (packLabel.includes('strip')) {
    return { singular: 'strip', plural: 'strips' };
  }

  if (form === 'tablet' || form === 'capsule') {
    return { singular: 'strip', plural: 'strips' };
  }
  if (form === 'syrup' || form === 'suspension' || form === 'drops') {
    return { singular: 'bottle', plural: 'bottles' };
  }
  if (form === 'cream' || form === 'ointment' || form === 'gel') {
    return { singular: 'tube', plural: 'tubes' };
  }
  if (form === 'injection') {
    return { singular: 'vial', plural: 'vials' };
  }

  return { singular: 'pack', plural: 'packs' };
};

const inferSecondaryUnit = (
  medicineForm?: string | null,
  packSizeLabel?: string | null,
  packSize?: number | null
): { singular: string; plural: string; billingUnit: MedicineUnitProfile['defaultBillingUnit'] } => {
  const form = normalize(medicineForm);
  const packLabel = normalize(packSizeLabel);
  const normalizedPackSize = !packSize || packSize <= 0 ? 1 : packSize;

  if (form === 'tablet') {
    return { singular: 'tablet', plural: 'tablets', billingUnit: 'TABLET' };
  }
  if (form === 'capsule') {
    return { singular: 'capsule', plural: 'capsules', billingUnit: 'CAPSULE' };
  }
  if (form === 'syrup' || form === 'suspension' || form === 'drops' || packLabel.includes('ml')) {
    return { singular: 'ml', plural: 'ml', billingUnit: 'ML' };
  }
  if (form === 'cream' || form === 'ointment' || form === 'gel' || packLabel.includes('gm')) {
    return { singular: 'g', plural: 'g', billingUnit: 'GM' };
  }
  if (normalizedPackSize > 1) {
    return { singular: 'unit', plural: 'units', billingUnit: 'UNIT' };
  }
  return { singular: 'unit', plural: 'units', billingUnit: 'UNIT' };
};

export const getMedicineUnitProfile = (medicine: MedicineUnitLike): MedicineUnitProfile => {
  const packSize = !medicine.packSize || medicine.packSize <= 0 ? 1 : medicine.packSize;
  const primary = inferPrimaryUnit(medicine.medicineForm, medicine.packSizeLabel);
  const secondary = inferSecondaryUnit(medicine.medicineForm, medicine.packSizeLabel, packSize);

  return {
    primaryUnitSingular: primary.singular,
    primaryUnitLabel: primary.plural,
    secondaryUnitSingular: secondary.singular,
    secondaryUnitLabel: secondary.plural,
    supportsLooseUnits: packSize > 1,
    defaultBillingUnit: 'PACK',
    packSize,
    packDisplayLabel:
      medicine.packSizeLabel?.trim() || `${packSize} ${secondary.plural} per ${primary.singular}`,
  };
};

export const getLooseBillingUnit = (medicine: MedicineUnitLike): MedicineUnitProfile['defaultBillingUnit'] =>
  inferSecondaryUnit(medicine.medicineForm, medicine.packSizeLabel, medicine.packSize).billingUnit;

export const formatPrimaryQuantity = (value: number | undefined, medicine: MedicineUnitLike) => {
  const profile = getMedicineUnitProfile(medicine);
  const quantity = value ?? 0;
  const label = quantity === 1 ? profile.primaryUnitSingular : profile.primaryUnitLabel;
  return `${quantity} ${label}`;
};

export const formatSecondaryQuantity = (value: number | undefined, medicine: MedicineUnitLike) => {
  const profile = getMedicineUnitProfile(medicine);
  const quantity = value ?? 0;
  const label =
    profile.secondaryUnitSingular === profile.secondaryUnitLabel || quantity === 1
      ? profile.secondaryUnitSingular
      : profile.secondaryUnitLabel;
  return `${quantity} ${label}`;
};

export const getPackOptionLabel = (medicine: MedicineUnitLike) =>
  titleCase(getMedicineUnitProfile(medicine).primaryUnitSingular);

export const getLooseOptionLabel = (medicine: MedicineUnitLike) =>
  titleCase(getMedicineUnitProfile(medicine).secondaryUnitSingular);
