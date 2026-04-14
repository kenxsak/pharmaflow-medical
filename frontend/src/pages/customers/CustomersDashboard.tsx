import React, { useEffect, useMemo, useState } from 'react';
import PharmaFlowShell from '../../components/pharmaflow/PharmaFlowShell';
import {
  CustomerAPI,
  CustomerCreateRequest,
  CustomerLookupResponse,
  PatientHistoryResponse,
} from '../../services/api';
import { usePharmaFlowContext } from '../../utils/pharmaflowContext';
import LegacyModal from '../../shared/legacy/LegacyModal';

const currency = (value: number) =>
  value.toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  });

const customerSteps = [
  {
    title: 'Find the customer',
    summary: 'Search by phone or name to open credit, loyalty, and linked patient activity.',
    tone: 'border-sky-200 bg-sky-50 text-sky-900',
  },
  {
    title: 'Review credit and loyalty',
    summary: 'Show available credit, blocked status, and points without leaving the billing ecosystem.',
    tone: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  },
  {
    title: 'Open patient history',
    summary: 'Surface doctor name, prescription references, and recent medicine history for repeat customers.',
    tone: 'border-violet-200 bg-violet-50 text-violet-900',
  },
];

const emptyCustomerDraft: CustomerCreateRequest = {
  name: '',
  phone: '',
  email: '',
  address: '',
  doctorName: '',
  creditLimit: 0,
  blocked: false,
};

interface CustomersDashboardProps {
  embedded?: boolean;
}

const CustomersDashboard: React.FC<CustomersDashboardProps> = ({ embedded = false }) => {
  const context = usePharmaFlowContext();
  const storeId = context.storeId;
  const [query, setQuery] = useState('');
  const [customers, setCustomers] = useState<CustomerLookupResponse[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerLookupResponse | null>(null);
  const [patientHistory, setPatientHistory] = useState<PatientHistoryResponse[]>([]);
  const [customerDraft, setCustomerDraft] = useState<CustomerCreateRequest>(emptyCustomerDraft);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create');

  const loadCustomers = async (nextQuery = query) => {
    if (!storeId) {
      setCustomers([]);
      return;
    }

    try {
      const items = await CustomerAPI.search(storeId, nextQuery || undefined, 50);
      setCustomers(items);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load customers.');
    }
  };

  useEffect(() => {
    if (!storeId) {
      setCustomers([]);
      setSelectedCustomer(null);
      setPatientHistory([]);
      setError('Choose an active store from Setup before opening customer operations.');
      return;
    }

    void loadCustomers('');
  }, [storeId]);

  const openCustomer = async (customer: CustomerLookupResponse) => {
    setLoadingHistory(true);
    setMessage(null);
    try {
      const [details, history] = await Promise.all([
        CustomerAPI.get(customer.customerId),
        CustomerAPI.getHistory(customer.customerId, 50),
      ]);
      setSelectedCustomer(details);
      setPatientHistory(history);
      setError(null);
    } catch (historyError) {
      setPatientHistory([]);
      setError(historyError instanceof Error ? historyError.message : 'Unable to load patient history.');
    } finally {
      setLoadingHistory(false);
    }
  };

  const openCreateEditor = () => {
    setEditorMode('create');
    setCustomerDraft(emptyCustomerDraft);
    setIsEditorOpen(true);
    setError(null);
    setMessage(null);
  };

  const openEditEditor = () => {
    if (!selectedCustomer) {
      return;
    }
    setEditorMode('edit');
    setCustomerDraft({
      name: selectedCustomer.name || '',
      phone: selectedCustomer.phone || '',
      email: selectedCustomer.email || '',
      address: selectedCustomer.address || '',
      doctorName: selectedCustomer.doctorName || '',
      creditLimit: Number(selectedCustomer.creditLimit || 0),
      blocked: Boolean(selectedCustomer.blocked),
    });
    setIsEditorOpen(true);
    setError(null);
    setMessage(null);
  };

  const handleSaveCustomer = async () => {
    try {
      const payload = {
        ...customerDraft,
        creditLimit: Number(customerDraft.creditLimit || 0),
        blocked: Boolean(customerDraft.blocked),
      };

      if (editorMode === 'create') {
        if (!storeId) {
          return;
        }
        const created = await CustomerAPI.create(storeId, payload);
        setCustomerDraft(emptyCustomerDraft);
        setIsEditorOpen(false);
        setMessage(`Customer ${created.name} created successfully.`);
        setError(null);
        await loadCustomers(query);
        await openCustomer(created);
        return;
      }

      if (!selectedCustomer) {
        return;
      }

      const updated = await CustomerAPI.update(selectedCustomer.customerId, payload);
      setCustomerDraft(emptyCustomerDraft);
      setIsEditorOpen(false);
      setSelectedCustomer(updated);
      setCustomers((prev) =>
        prev.map((customer) => (customer.customerId === updated.customerId ? updated : customer))
      );
      setMessage(`Customer ${updated.name} updated successfully.`);
      setError(null);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save customer.');
      setMessage(null);
    }
  };

  const handleAddLoyalty = async (points: number) => {
    if (!selectedCustomer) {
      return;
    }

    try {
      const updated = await CustomerAPI.addLoyalty(
        selectedCustomer.customerId,
        points,
        undefined,
        `Manual bonus added from customer dashboard (+${points})`
      );
      setSelectedCustomer(updated);
      setCustomers((prev) =>
        prev.map((customer) => (customer.customerId === updated.customerId ? updated : customer))
      );
      setMessage(`${points} loyalty points added to ${updated.name}.`);
      setError(null);
    } catch (loyaltyError) {
      setError(loyaltyError instanceof Error ? loyaltyError.message : 'Unable to add loyalty points.');
      setMessage(null);
    }
  };

  const totalAvailableCredit = useMemo(
    () => customers.reduce((sum, customer) => sum + Number(customer.availableCredit || 0), 0),
    [customers]
  );

  const blockedCustomers = useMemo(
    () => customers.filter((customer) => customer.blocked).length,
    [customers]
  );

  const totalLoyaltyPoints = useMemo(
    () => customers.reduce((sum, customer) => sum + Number(customer.loyaltyPoints || 0), 0),
    [customers]
  );

  return (
    <PharmaFlowShell
      embedded={embedded}
      title="Customers and Patient History"
      description="Search customer profiles, track credit and loyalty, and review linked patient history with prescription context."
    >
      <div className="space-y-5">
        <section className="rounded-[2rem] border border-cyan-200 bg-gradient-to-r from-cyan-50 via-white to-emerald-50 p-6 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[1.15fr,0.85fr]">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700">
                Customer Desk
              </div>
              <h2 className="mt-3 text-2xl font-semibold text-slate-950">
                Clean customer operations for repeat pharmacy business
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Open this after billing to show that the platform remembers the customer, monitors credit, tracks loyalty,
                and preserves patient-facing prescription history in one operator-friendly page.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-3xl bg-white p-4 shadow-sm">
                <div className="text-xs uppercase tracking-wide text-slate-500">Loaded Customers</div>
                <div className="mt-2 text-3xl font-semibold text-slate-950">{customers.length}</div>
                <div className="mt-1 text-sm text-slate-500">Visible for this store search</div>
              </div>
              <div className="rounded-3xl bg-white p-4 shadow-sm">
                <div className="text-xs uppercase tracking-wide text-slate-500">Available Credit</div>
                <div className="mt-2 text-3xl font-semibold text-slate-950">{currency(totalAvailableCredit)}</div>
                <div className="mt-1 text-sm text-slate-500">Combined available customer credit</div>
              </div>
              <div className="rounded-3xl bg-white p-4 shadow-sm">
                <div className="text-xs uppercase tracking-wide text-slate-500">Loyalty + Blocked</div>
                <div className="mt-2 text-3xl font-semibold text-slate-950">{totalLoyaltyPoints}</div>
                <div className="mt-1 text-sm text-slate-500">{blockedCustomers} blocked customer(s)</div>
              </div>
            </div>
          </div>
        </section>

        {(message || error) && (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${
              error
                ? 'border-rose-200 bg-rose-50 text-rose-900'
                : 'border-emerald-200 bg-emerald-50 text-emerald-900'
            }`}
          >
            {error || message}
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-3">
          {customerSteps.map((step, index) => (
            <div key={step.title} className={`rounded-3xl border p-5 ${step.tone}`}>
              <div className="text-sm font-semibold">Step {index + 1}</div>
              <div className="mt-2 text-lg font-semibold text-slate-950">{step.title}</div>
              <div className="mt-1 text-sm leading-6 text-slate-600">{step.summary}</div>
            </div>
          ))}
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.05fr,0.95fr]">
          <div className="rounded-[2rem] bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold">Customer Search</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Search by customer name or phone number inside the selected branch.
                </p>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search name or phone"
                  className="rounded-2xl border border-slate-300 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => void loadCustomers(query)}
                  className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium"
                >
                  Search
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Customer</th>
                    <th className="px-3 py-2 text-left">Phone</th>
                    <th className="px-3 py-2 text-right">Credit Limit</th>
                    <th className="px-3 py-2 text-right">Balance</th>
                    <th className="px-3 py-2 text-right">Points</th>
                    <th className="px-3 py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr
                      key={customer.customerId}
                      className={`border-t border-slate-100 ${
                        selectedCustomer?.customerId === customer.customerId ? 'bg-cyan-50' : ''
                      }`}
                    >
                      <td className="px-3 py-3">
                        <div className="font-medium text-slate-950">{customer.name}</div>
                        <div className="text-xs text-slate-500">
                          {customer.blocked ? 'Credit blocked' : customer.doctorName || 'No default doctor'}
                        </div>
                      </td>
                      <td className="px-3 py-3">{customer.phone || '—'}</td>
                      <td className="px-3 py-3 text-right">{currency(Number(customer.creditLimit || 0))}</td>
                      <td className="px-3 py-3 text-right">{currency(Number(customer.currentBalance || 0))}</td>
                      <td className="px-3 py-3 text-right">{customer.loyaltyPoints || 0}</td>
                      <td className="px-3 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => void openCustomer(customer)}
                          className="rounded-2xl border border-slate-300 px-3 py-2 text-xs font-medium"
                        >
                          Open
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!customers.length && (
                    <tr>
                      <td colSpan={6} className="px-3 py-10 text-center text-slate-400">
                        No customers found for this search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">Customer Registration</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Register walk-ins cleanly, then reopen them for credit, loyalty, and patient tracking.
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-2 text-sm text-slate-600">
                Store: {context.storeCode || 'Not selected'}
              </div>
            </div>

              <div className="grid gap-3">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm font-semibold text-slate-950">What this flow captures</div>
                <div className="mt-3 grid gap-2 text-sm text-slate-600">
                  <div>Customer identity and contact details</div>
                  <div>Credit limit for branch-level credit control</div>
                  <div>Default doctor and address for future patient history</div>
                </div>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <div className="text-sm font-semibold text-slate-950">Recommended next step</div>
                <div className="mt-2 text-sm leading-6 text-slate-600">
                  Create a new customer from the popup, reopen the profile, then show credit, loyalty,
                  and prescription-linked history on the same page.
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={openCreateEditor}
              className="mt-4 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white"
            >
              Add Customer
            </button>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[0.9fr,1.1fr]">
          <div className="rounded-[2rem] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">Selected Customer</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Credit, loyalty, and patient profile summary.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {selectedCustomer && (
                  <div
                    className={`rounded-full px-3 py-2 text-xs font-medium ${
                      selectedCustomer.blocked
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {selectedCustomer.blocked ? 'Credit blocked' : 'Credit active'}
                  </div>
                )}
                {selectedCustomer && (
                  <button
                    type="button"
                    onClick={openEditEditor}
                    className="rounded-2xl border border-slate-300 px-3 py-2 text-xs font-medium"
                  >
                    Edit customer
                  </button>
                )}
              </div>
            </div>

            {!selectedCustomer && (
              <div className="mt-6 rounded-3xl bg-slate-50 px-4 py-12 text-center text-sm text-slate-400">
                Pick a customer from the search table to open profile detail.
              </div>
            )}

            {selectedCustomer && (
              <div className="mt-4 space-y-4">
                <div className="rounded-3xl bg-slate-50 p-4">
                  <div className="text-lg font-semibold text-slate-950">{selectedCustomer.name}</div>
                  <div className="mt-1 text-sm text-slate-500">{selectedCustomer.phone || 'No phone recorded'}</div>
                  <div className="mt-1 text-sm text-slate-500">
                    {selectedCustomer.email || 'No email recorded'}
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-white p-3">
                      <div className="text-xs uppercase tracking-wide text-slate-400">Credit Limit</div>
                      <div className="mt-2 font-semibold text-slate-950">
                        {currency(Number(selectedCustomer.creditLimit || 0))}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-white p-3">
                      <div className="text-xs uppercase tracking-wide text-slate-400">Available Credit</div>
                      <div className="mt-2 font-semibold text-slate-950">
                        {currency(Number(selectedCustomer.availableCredit || 0))}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-white p-3">
                      <div className="text-xs uppercase tracking-wide text-slate-400">Current Balance</div>
                      <div className="mt-2 font-semibold text-slate-950">
                        {currency(Number(selectedCustomer.currentBalance || 0))}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-white p-3">
                      <div className="text-xs uppercase tracking-wide text-slate-400">Loyalty Points</div>
                      <div className="mt-2 font-semibold text-slate-950">
                        {selectedCustomer.loyaltyPoints || 0}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-white p-3">
                      <div className="text-xs uppercase tracking-wide text-slate-400">Default Doctor</div>
                      <div className="mt-2 font-semibold text-slate-950">
                        {selectedCustomer.doctorName || 'Not assigned'}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-white p-3 sm:col-span-2">
                      <div className="text-xs uppercase tracking-wide text-slate-400">Address</div>
                      <div className="mt-2 font-semibold text-slate-950">
                        {selectedCustomer.address || 'No address recorded'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 p-4">
                  <div className="text-sm font-semibold text-slate-950">Loyalty Actions</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[10, 25, 50].map((points) => (
                      <button
                        key={points}
                        type="button"
                        onClick={() => void handleAddLoyalty(points)}
                        className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800"
                      >
                        Add {points} points
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-[2rem] bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">Patient History</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Prescription-linked medicine history for the selected customer.
                </p>
              </div>
              <div className="rounded-2xl bg-violet-50 px-4 py-2 text-sm text-violet-900">
                {loadingHistory ? 'Loading...' : `${patientHistory.length} history item(s)`}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Date</th>
                    <th className="px-3 py-2 text-left">Medicine</th>
                    <th className="px-3 py-2 text-left">Doctor</th>
                    <th className="px-3 py-2 text-right">Qty</th>
                    <th className="px-3 py-2 text-left">Prescription</th>
                  </tr>
                </thead>
                <tbody>
                  {patientHistory.map((entry) => (
                    <tr key={entry.historyId} className="border-t border-slate-100">
                      <td className="px-3 py-3">
                        {new Date(entry.createdAt).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="px-3 py-3 font-medium">{entry.medicineName || 'Medicine not available'}</td>
                      <td className="px-3 py-3">
                        <div>{entry.doctorName || '—'}</div>
                        <div className="text-xs text-slate-500">{entry.doctorRegNo || ''}</div>
                      </td>
                      <td className="px-3 py-3 text-right">{entry.quantity || 0}</td>
                      <td className="px-3 py-3">
                        {entry.prescriptionUrl ? (
                          <a
                            href={entry.prescriptionUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-cyan-700 underline"
                          >
                            Open
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))}
                  {!loadingHistory && !patientHistory.length && (
                    <tr>
                      <td colSpan={5} className="px-3 py-10 text-center text-slate-400">
                        Select a customer to load patient history.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      <LegacyModal
        open={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        title={editorMode === 'create' ? 'Register customer' : 'Edit customer'}
        description={
          editorMode === 'create'
            ? 'Capture the customer once, then reuse the same profile for billing, loyalty, credit, and patient history.'
            : 'Update the customer profile without leaving the branch workspace.'
        }
        footer={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-slate-500">
              {editorMode === 'create'
                ? 'This customer will be created for the active branch and will be available for daily operations.'
                : 'Save profile changes and continue working with the same customer record immediately.'}
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
                onClick={() => void handleSaveCustomer()}
                className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
              >
                {editorMode === 'create' ? 'Create customer' : 'Save changes'}
              </button>
            </div>
          </div>
        }
      >
        <div className="grid gap-4 xl:grid-cols-[1.08fr,0.92fr]">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 text-sm md:col-span-2">
              <span className="font-medium text-slate-700">Customer name</span>
              <input
                type="text"
                value={customerDraft.name || ''}
                onChange={(event) => setCustomerDraft((prev) => ({ ...prev, name: event.target.value }))}
                className="w-full rounded-2xl border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Phone</span>
              <input
                type="text"
                value={customerDraft.phone || ''}
                onChange={(event) => setCustomerDraft((prev) => ({ ...prev, phone: event.target.value }))}
                className="w-full rounded-2xl border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Email</span>
              <input
                type="email"
                value={customerDraft.email || ''}
                onChange={(event) => setCustomerDraft((prev) => ({ ...prev, email: event.target.value }))}
                className="w-full rounded-2xl border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Default doctor</span>
              <input
                type="text"
                value={customerDraft.doctorName || ''}
                onChange={(event) => setCustomerDraft((prev) => ({ ...prev, doctorName: event.target.value }))}
                className="w-full rounded-2xl border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Credit limit</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={customerDraft.creditLimit || 0}
                onChange={(event) =>
                  setCustomerDraft((prev) => ({ ...prev, creditLimit: Number(event.target.value) }))
                }
                className="w-full rounded-2xl border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="space-y-1 text-sm md:col-span-2">
              <span className="font-medium text-slate-700">Address</span>
              <textarea
                value={customerDraft.address || ''}
                onChange={(event) => setCustomerDraft((prev) => ({ ...prev, address: event.target.value }))}
                rows={4}
                className="w-full rounded-2xl border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 md:col-span-2">
              <input
                type="checkbox"
                checked={Boolean(customerDraft.blocked)}
                onChange={(event) => setCustomerDraft((prev) => ({ ...prev, blocked: event.target.checked }))}
                className="h-4 w-4 rounded border-slate-300"
              />
              Block credit usage for this customer
            </label>
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-4">
              <div className="text-sm font-semibold text-sky-950">Profile preview</div>
              <div className="mt-3 space-y-2 text-sm text-sky-900">
                <div>Name: <span className="font-semibold">{customerDraft.name || 'Not entered yet'}</span></div>
                <div>Phone: <span className="font-semibold">{customerDraft.phone || 'Not entered yet'}</span></div>
                <div>Doctor: <span className="font-semibold">{customerDraft.doctorName || 'Not assigned'}</span></div>
                <div>Credit limit: <span className="font-semibold">{currency(Number(customerDraft.creditLimit || 0))}</span></div>
                <div>Credit status: <span className="font-semibold">{customerDraft.blocked ? 'Blocked' : 'Active'}</span></div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <div className="text-sm font-semibold text-slate-950">Why this matters</div>
              <div className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                <div>Billing staff can reopen the same customer instantly.</div>
                <div>Credit and loyalty become visible during the next sale.</div>
                <div>Patient history links back to this profile automatically.</div>
              </div>
            </div>
          </div>
        </div>
      </LegacyModal>
    </PharmaFlowShell>
  );
};

export default CustomersDashboard;
