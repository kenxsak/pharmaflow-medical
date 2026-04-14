import type { IEmployeeInterface } from '../interfaces/IEmployeeInterface';

export const isPharmaFlowBridgeUser = (user?: IEmployeeInterface | null) =>
  user?.authSource === 'pharmaflow-bridge';

export const shouldCallLegacyOnlyApis = (user?: IEmployeeInterface | null) =>
  Boolean(user) && !isPharmaFlowBridgeUser(user);

export const shouldCallLegacyLogout = (user?: IEmployeeInterface | null) =>
  shouldCallLegacyOnlyApis(user) && Boolean(user?.employerEmail);

export const supportsLegacyRealtime = (user?: IEmployeeInterface | null) =>
  shouldCallLegacyOnlyApis(user) && Boolean(user?.branchId);

export const normalizeManagerWorkspaceKey = (
  workspaceKey: string,
  user?: IEmployeeInterface | null
) => {
  if (!isPharmaFlowBridgeUser(user)) {
    return workspaceKey;
  }

  switch (workspaceKey) {
    case 'Cashiers':
      return 'Users';
    case 'Items':
      return 'Inventory';
    case 'Branches':
      return 'Purchases';
    case 'Orders':
      return 'Bills';
    case 'Summary':
    case 'Legacy Sales':
      return 'Reports';
    default:
      return workspaceKey;
  }
};
