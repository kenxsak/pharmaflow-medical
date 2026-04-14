import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PharmaFlowShell from '../../components/pharmaflow/PharmaFlowShell';
import {
  PharmaRoleOption,
  PharmaUserRecord,
  PharmaUserRequest,
  StoreSummary,
  StoreAPI,
  UserAPI,
} from '../../services/api';
import {
  getPharmaFlowPersona,
  getPharmaFlowRoleLabel,
  usePharmaFlowContext,
} from '../../utils/pharmaflowContext';
import LegacyModal from '../../shared/legacy/LegacyModal';

interface UserDraft extends PharmaUserRequest {
  userId?: string;
}

interface TenantOption {
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
}

const createDraft = (
  contextTenantId = '',
  contextStoreId = '',
  role = 'PHARMACIST'
): UserDraft => ({
  username: '',
  password: '',
  fullName: '',
  phone: '',
  email: '',
  role,
  storeId: contextStoreId || '',
  tenantId: contextTenantId || '',
  active: true,
  platformOwner: false,
  pharmacistRegNo: '',
});

const UsersAccessDashboard: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
  const context = usePharmaFlowContext();
  const persona = getPharmaFlowPersona(context);
  const canManageUsers = persona === 'saas-admin' || persona === 'company-admin';
  const [users, setUsers] = useState<PharmaUserRecord[]>([]);
  const [roles, setRoles] = useState<PharmaRoleOption[]>([]);
  const [stores, setStores] = useState<StoreSummary[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [draft, setDraft] = useState<UserDraft>(() =>
    createDraft(context.tenantId, context.storeId, context.platformOwner ? 'STORE_MANAGER' : 'PHARMACIST')
  );

  const tenantOptions = useMemo<TenantOption[]>(() => {
    const tenantMap = new Map<string, TenantOption>();
    stores.forEach((store) => {
      if (store.tenantId && !tenantMap.has(store.tenantId)) {
        tenantMap.set(store.tenantId, {
          tenantId: store.tenantId,
          tenantSlug: store.tenantSlug || '',
          tenantName: store.tenantName || store.tenantSlug || 'Tenant',
        });
      }
    });
    return Array.from(tenantMap.values()).sort((left, right) =>
      left.tenantName.localeCompare(right.tenantName)
    );
  }, [stores]);

  const activeTenantId = context.platformOwner
    ? draft.tenantId || tenantOptions[0]?.tenantId || ''
    : context.tenantId;

  const visibleStores = useMemo(() => {
    if (!stores.length) {
      return [];
    }
    if (!activeTenantId) {
      return stores;
    }
    return stores.filter((store) => store.tenantId === activeTenantId);
  }, [activeTenantId, stores]);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) {
      return users;
    }

    return users.filter((user) => {
      const haystack = [
        user.fullName,
        user.username,
        user.email,
        user.phone,
        user.roleLabel,
        user.storeCode,
        user.storeName,
        user.tenantName,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [searchTerm, users]);

  const selectedUser = useMemo(
    () => users.find((user) => user.userId === selectedUserId),
    [selectedUserId, users]
  );

  const loadState = async () => {
    if (!canManageUsers) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const [userRows, roleRows, storeRows] = await Promise.all([
        UserAPI.list(),
        UserAPI.listRoles(),
        StoreAPI.list(),
      ]);
      setUsers(userRows);
      setRoles(roleRows);
      setStores(storeRows);

      if (!selectedUserId && userRows.length > 0) {
        setSelectedUserId(userRows[0].userId);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load users and permissions.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadState();
  }, []);

  useEffect(() => {
    if (!selectedUser) {
      return;
    }

    setDraft({
      userId: selectedUser.userId,
      username: selectedUser.username,
      password: '',
      fullName: selectedUser.fullName,
      phone: selectedUser.phone || '',
      email: selectedUser.email || '',
      role: selectedUser.role,
      storeId: selectedUser.storeId || '',
      tenantId: selectedUser.tenantId || context.tenantId || '',
      active: selectedUser.active ?? true,
      platformOwner: selectedUser.platformOwner ?? false,
      pharmacistRegNo: selectedUser.pharmacistRegNo || '',
    });
  }, [context.tenantId, selectedUser]);

  useEffect(() => {
    if (draft.storeId || visibleStores.length !== 1) {
      return;
    }

    setDraft((current) => ({
      ...current,
      storeId: visibleStores[0].storeId,
      tenantId: current.tenantId || visibleStores[0].tenantId || '',
    }));
  }, [draft.storeId, visibleStores]);

  const startNewUser = () => {
    setSelectedUserId('');
    setDraft(
      createDraft(
        context.platformOwner ? tenantOptions[0]?.tenantId || '' : context.tenantId,
        context.storeId,
        context.platformOwner ? 'STORE_MANAGER' : 'PHARMACIST'
      )
    );
    setError(null);
    setIsEditorOpen(true);
  };

  const openExistingUser = (userId: string) => {
    setSelectedUserId(userId);
    setError(null);
    setIsEditorOpen(true);
  };

  const handleDraftChange = <K extends keyof UserDraft>(key: K, value: UserDraft[K]) => {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleTenantChange = (tenantId: string) => {
    setDraft((current) => ({
      ...current,
      tenantId,
      storeId: '',
    }));
  };

  const handleStoreChange = (storeId: string) => {
    const selectedStore = stores.find((store) => store.storeId === storeId);
    setDraft((current) => ({
      ...current,
      storeId,
      tenantId: selectedStore?.tenantId || current.tenantId,
    }));
  };

  const handleSave = async () => {
    if (!draft.username.trim() || !draft.fullName.trim()) {
      setError('Username and full name are required.');
      return;
    }

    setIsSaving(true);
    setError(null);
    setMessage(null);

    try {
      const payload: PharmaUserRequest = {
        username: draft.username.trim(),
        password: draft.password?.trim() || undefined,
        fullName: draft.fullName.trim(),
        phone: draft.phone?.trim() || undefined,
        email: draft.email?.trim() || undefined,
        role: draft.role,
        storeId: draft.storeId || undefined,
        tenantId: draft.tenantId || undefined,
        active: draft.active,
        platformOwner: draft.platformOwner,
        pharmacistRegNo: draft.pharmacistRegNo?.trim() || undefined,
      };

      const saved = draft.userId
        ? await UserAPI.update(draft.userId, payload)
        : await UserAPI.create(payload);

      await loadState();
      setSelectedUserId(saved.userId);
      setIsEditorOpen(false);
      setMessage(
        `${saved.fullName} is now configured as ${
          saved.roleLabel || getPharmaFlowRoleLabel(saved.role, Boolean(saved.platformOwner))
        }.`
      );
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save the user.');
    } finally {
      setIsSaving(false);
    }
  };

  const companyAdminCount = users.filter((user) =>
    ['SUPER_ADMIN', 'STORE_MANAGER'].includes(user.role)
  ).length;
  const storeUserCount = users.filter((user) =>
    ['PHARMACIST', 'SALES_ASSISTANT', 'WAREHOUSE_MGR', 'DELIVERY_BOY'].includes(user.role)
  ).length;

  if (!canManageUsers) {
    return (
      <PharmaFlowShell
        embedded={embedded}
        title="Users and Permissions"
        description="Company admins create store users, assign stores, and define what each person can do."
      >
        <section className="rounded-[2rem] border border-amber-200 bg-amber-50 px-5 py-5 text-sm text-amber-950 shadow-sm">
          <div className="text-lg font-semibold">This area is for SaaS admin and company admin logins.</div>
          <p className="mt-2 max-w-3xl leading-6">
            Your current account is signed in as{' '}
            <span className="font-semibold">
              {getPharmaFlowRoleLabel(context.role, context.platformOwner)}
            </span>
            . Store operator accounts use Billing, Customers, Stock, Compliance, Purchases, and
            Reports for daily work.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              to="/pharmaflow/help"
              className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
            >
              Open help center
            </Link>
            <Link
              to="/pharmaflow/billing"
              className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700"
            >
              Open billing
            </Link>
          </div>
        </section>
      </PharmaFlowShell>
    );
  }

  return (
    <PharmaFlowShell
      embedded={embedded}
      title="Users and Permissions"
      description="Create company admins and store operators, assign them to stores, and manage role-based access from one legacy-style control screen."
      actions={
        <button
          type="button"
          onClick={startNewUser}
          className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700"
        >
          New user
        </button>
      }
    >
      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-[2rem] border border-slate-200/70 bg-white p-5 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-slate-500">Total users</div>
          <div className="mt-2 text-3xl font-semibold text-slate-950">{users.length}</div>
          <div className="mt-1 text-sm text-slate-500">People currently configured in this workspace</div>
        </div>
        <div className="rounded-[2rem] border border-slate-200/70 bg-white p-5 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-slate-500">Company admins</div>
          <div className="mt-2 text-3xl font-semibold text-slate-950">{companyAdminCount}</div>
          <div className="mt-1 text-sm text-slate-500">Users who can manage branches and permissions</div>
        </div>
        <div className="rounded-[2rem] border border-slate-200/70 bg-white p-5 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-slate-500">Store operators</div>
          <div className="mt-2 text-3xl font-semibold text-slate-950">{storeUserCount}</div>
          <div className="mt-1 text-sm text-slate-500">Daily counter, stock, and compliance users</div>
        </div>
        <div className="rounded-[2rem] border border-slate-200/70 bg-white p-5 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-slate-500">Visible stores</div>
          <div className="mt-2 text-3xl font-semibold text-slate-950">{visibleStores.length}</div>
          <div className="mt-1 text-sm text-slate-500">Store choices available to this account</div>
        </div>
      </section>

      {message && (
        <section className="rounded-[2rem] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-900 shadow-sm">
          {message}
        </section>
      )}

      {error && (
        <section className="rounded-[2rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-900 shadow-sm">
          {error}
        </section>
      )}

      {isLoading && (
        <section className="rounded-[2rem] border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600 shadow-sm">
          Loading users, roles, and store assignments...
        </section>
      )}

      <section className="grid gap-4 xl:grid-cols-[0.92fr,1.08fr]">
        <div className="rounded-[2rem] border border-slate-200/70 bg-white/95 p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.22em] text-sky-700">User Roster</div>
              <h2 className="mt-3 text-xl font-semibold text-slate-950">Company and store accounts</h2>
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by user, role, store, or company"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm md:max-w-sm"
            />
          </div>

          <div className="mt-5 space-y-3">
            {filteredUsers.map((user) => {
              const isSelected = selectedUserId === user.userId;
              return (
                <button
                  key={user.userId}
                  type="button"
                  onClick={() => openExistingUser(user.userId)}
                  className={`w-full rounded-[1.75rem] border px-4 py-4 text-left transition ${
                    isSelected
                      ? 'border-sky-200 bg-sky-50 shadow-sm'
                      : 'border-slate-200 bg-slate-50 hover:border-sky-200 hover:bg-white'
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="text-lg font-semibold text-slate-950">{user.fullName}</div>
                      <div className="mt-1 text-sm text-slate-500">{user.username}</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
                        {user.roleLabel || getPharmaFlowRoleLabel(user.role, Boolean(user.platformOwner))}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          user.active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {user.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                    <div>{user.tenantName || user.tenantSlug || 'No company'}</div>
                    <div>{user.storeName || user.storeCode || 'No store assigned'}</div>
                    <div>{user.phone || user.email || 'No contact info'}</div>
                    <div>{user.lastLogin ? `Last login: ${new Date(user.lastLogin).toLocaleString()}` : 'No login yet'}</div>
                  </div>
                </button>
              );
            })}

            {!filteredUsers.length && !isLoading && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-600">
                No users matched this search.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <section className="rounded-[2rem] border border-slate-200/70 bg-white/95 p-6 shadow-sm">
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="text-xs font-medium uppercase tracking-[0.22em] text-sky-700">Access Workflow</div>
                <h2 className="mt-3 text-xl font-semibold text-slate-950">How account setup works</h2>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
                <div className="font-semibold text-slate-950">1. Select the right company</div>
                <div className="mt-1 leading-6">
                  SaaS admins choose the tenant first. Company admins stay inside their own company automatically.
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
                <div className="font-semibold text-slate-950">2. Create the person and assign a role</div>
                <div className="mt-1 leading-6">
                  Use clear roles such as company admin, pharmacist, sales assistant, or warehouse manager.
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
                <div className="font-semibold text-slate-950">3. Attach the person to the right store</div>
                <div className="mt-1 leading-6">
                  Daily users should always point to a branch so billing, stock, and compliance open in the correct place.
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={startNewUser}
                className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Create a user
              </button>
              <Link
                to="/pharmaflow/help"
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700"
              >
                Open help and FAQ
              </Link>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200/70 bg-white/95 p-6 shadow-sm">
            <div className="text-xs font-medium uppercase tracking-[0.22em] text-sky-700">Role Rules</div>
            <h2 className="mt-3 text-xl font-semibold text-slate-950">What each role can do</h2>
            <div className="mt-5 grid gap-3">
              {roles.map((role) => (
                <div key={role.role} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="text-base font-semibold text-slate-950">{role.label}</div>
                      <div className="mt-1 text-sm text-slate-500">{role.description}</div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {role.canEditPrice && (
                        <span className="rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-800">
                          Price edit
                        </span>
                      )}
                      {role.canEditBills && (
                        <span className="rounded-full bg-sky-100 px-3 py-1 font-medium text-sky-800">
                          Bill edit
                        </span>
                      )}
                      {role.canSellScheduleH && (
                        <span className="rounded-full bg-violet-100 px-3 py-1 font-medium text-violet-800">
                          Schedule H
                        </span>
                      )}
                      {role.canManageInventory && (
                        <span className="rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-800">
                          Inventory
                        </span>
                      )}
                      {role.canViewReports && (
                        <span className="rounded-full bg-slate-200 px-3 py-1 font-medium text-slate-700">
                          Reports
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>

      <LegacyModal
        open={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        title={draft.userId ? 'Update account' : 'Create account'}
        description="Keep user setup calm and consistent: company, role, store, and permissions all in one guided screen."
        footer={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-slate-500">
              {draft.userId
                ? 'Update the role, store, or contact details and save.'
                : 'Create a role-based account for company or store operations.'}
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : draft.userId ? 'Save changes' : 'Create account'}
              </button>
            </div>
          </div>
        }
      >
        <div className="grid gap-4 xl:grid-cols-[1.1fr,0.9fr]">
          <div className="grid gap-3 md:grid-cols-2">
            {context.platformOwner && (
              <label className="space-y-1 text-sm md:col-span-2">
                <span className="font-medium text-slate-700">Company</span>
                <select
                  value={draft.tenantId || ''}
                  onChange={(event) => handleTenantChange(event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                >
                  <option value="">Select a company</option>
                  {tenantOptions.map((tenant) => (
                    <option key={tenant.tenantId} value={tenant.tenantId}>
                      {tenant.tenantName} ({tenant.tenantSlug})
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Full name</span>
              <input
                value={draft.fullName}
                onChange={(event) => handleDraftChange('fullName', event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Username</span>
              <input
                value={draft.username}
                onChange={(event) => handleDraftChange('username', event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">
                {draft.userId ? 'New password (optional)' : 'Password'}
              </span>
              <input
                type="password"
                value={draft.password || ''}
                onChange={(event) => handleDraftChange('password', event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Role</span>
              <select
                value={draft.role}
                onChange={(event) => handleDraftChange('role', event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              >
                {roles.map((role) => (
                  <option key={role.role} value={role.role}>
                    {role.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Phone</span>
              <input
                value={draft.phone || ''}
                onChange={(event) => handleDraftChange('phone', event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Email</span>
              <input
                value={draft.email || ''}
                onChange={(event) => handleDraftChange('email', event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Assigned store</span>
              <select
                value={draft.storeId || ''}
                onChange={(event) => handleStoreChange(event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              >
                <option value="">Select a store</option>
                {visibleStores.map((store) => (
                  <option key={store.storeId} value={store.storeId}>
                    {store.storeName} ({store.storeCode})
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Pharmacist registration</span>
              <input
                value={draft.pharmacistRegNo || ''}
                onChange={(event) => handleDraftChange('pharmacistRegNo', event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>

            <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={draft.active ?? true}
                onChange={(event) => handleDraftChange('active', event.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              Account is active
            </label>

            {context.platformOwner && (
              <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={Boolean(draft.platformOwner)}
                  onChange={(event) => handleDraftChange('platformOwner', event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                Platform owner access
              </label>
            )}
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-4">
              <div className="text-sm font-semibold text-sky-950">Account summary</div>
              <div className="mt-3 space-y-2 text-sm text-sky-900">
                <div>Role: <span className="font-semibold">{roles.find((role) => role.role === draft.role)?.label || draft.role}</span></div>
                <div>
                  Store:{' '}
                  <span className="font-semibold">
                    {visibleStores.find((store) => store.storeId === draft.storeId)?.storeName || 'Not assigned yet'}
                  </span>
                </div>
                <div>
                  Company:{' '}
                  <span className="font-semibold">
                    {tenantOptions.find((tenant) => tenant.tenantId === (draft.tenantId || activeTenantId))?.tenantName ||
                      context.tenantSlug ||
                      'Not selected'}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <div className="text-sm font-semibold text-slate-950">Before you save</div>
              <div className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                <div>Use store-linked roles for daily branch staff.</div>
                <div>Give company admin only to users who manage people, stores, and reports.</div>
                <div>Leave platform owner for the SaaS control team only.</div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
              <div className="text-sm font-semibold text-slate-950">Current capability preview</div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {roles
                  .find((role) => role.role === draft.role)
                  ?.canEditPrice && (
                  <span className="rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-800">
                    Price edit
                  </span>
                )}
                {roles
                  .find((role) => role.role === draft.role)
                  ?.canEditBills && (
                  <span className="rounded-full bg-sky-100 px-3 py-1 font-medium text-sky-800">
                    Bill edit
                  </span>
                )}
                {roles
                  .find((role) => role.role === draft.role)
                  ?.canSellScheduleH && (
                  <span className="rounded-full bg-violet-100 px-3 py-1 font-medium text-violet-800">
                    Schedule H
                  </span>
                )}
                {roles
                  .find((role) => role.role === draft.role)
                  ?.canManageInventory && (
                  <span className="rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-800">
                    Inventory
                  </span>
                )}
                {roles
                  .find((role) => role.role === draft.role)
                  ?.canViewReports && (
                  <span className="rounded-full bg-slate-200 px-3 py-1 font-medium text-slate-700">
                    Reports
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </LegacyModal>
    </PharmaFlowShell>
  );
};

export default UsersAccessDashboard;
