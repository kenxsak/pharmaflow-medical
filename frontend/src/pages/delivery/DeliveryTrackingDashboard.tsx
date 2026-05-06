import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LocateFixed,
  MapPin,
  Navigation,
  Phone,
  RefreshCw,
  Route,
  Truck,
  UserRound,
} from 'lucide-react';
import PharmaFlowShell from '../../components/pharmaflow/PharmaFlowShell';
import {
  BillingAPI,
  CustomerAPI,
  DeliveryAPI,
  DeliveryDriverResponse,
  DeliveryOrderRequest,
  DeliveryOrderResponse,
  DeliverySummaryResponse,
  CustomerLookupResponse,
  InvoiceHistoryItem,
} from '../../services/api';
import { usePharmaFlowContext } from '../../utils/pharmaflowContext';

type DeliveryDraft = {
  invoiceId: string;
  customerId: string;
  deliveryBoyId: string;
  deliveryAddress: string;
  deliveryPhone: string;
  amountToCollect: string;
  paymentMode: string;
  notes: string;
};

type LocationDraft = {
  deliveryId: string;
  latitude: string;
  longitude: string;
  locationLabel: string;
};

const emptyDeliveryDraft: DeliveryDraft = {
  invoiceId: '',
  customerId: '',
  deliveryBoyId: '',
  deliveryAddress: '',
  deliveryPhone: '',
  amountToCollect: '',
  paymentMode: 'CASH',
  notes: '',
};

const statusOptions = ['ALL', 'PENDING', 'ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
const progressSteps = ['PENDING', 'ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'];

const formatCurrency = (value?: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value ?? 0);

const formatDateTime = (value?: string) => {
  if (!value) {
    return 'Not updated';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const humanizeStatus = (value?: string) =>
  (value || 'PENDING')
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const getStatusTone = (status?: string) => {
  switch ((status || '').toUpperCase()) {
    case 'DELIVERED':
      return 'bg-emerald-100 text-emerald-800';
    case 'OUT_FOR_DELIVERY':
      return 'bg-sky-100 text-sky-800';
    case 'PICKED_UP':
    case 'ASSIGNED':
      return 'bg-amber-100 text-amber-800';
    case 'CANCELLED':
      return 'bg-rose-100 text-rose-800';
    default:
      return 'bg-slate-100 text-slate-700';
  }
};

const getNextStatuses = (status?: string) => {
  switch ((status || 'PENDING').toUpperCase()) {
    case 'PENDING':
      return ['ASSIGNED'];
    case 'ASSIGNED':
      return ['PICKED_UP'];
    case 'PICKED_UP':
      return ['OUT_FOR_DELIVERY'];
    case 'OUT_FOR_DELIVERY':
      return ['DELIVERED'];
    default:
      return [];
  }
};

const buildMapUrl = (delivery: DeliveryOrderResponse) => {
  if (delivery.currentLatitude === undefined || delivery.currentLongitude === undefined) {
    return null;
  }
  return `https://www.google.com/maps?q=${delivery.currentLatitude},${delivery.currentLongitude}`;
};

const DeliveryTrackingDashboard: React.FC = () => {
  const context = usePharmaFlowContext();
  const [deliveries, setDeliveries] = useState<DeliveryOrderResponse[]>([]);
  const [drivers, setDrivers] = useState<DeliveryDriverResponse[]>([]);
  const [invoices, setInvoices] = useState<InvoiceHistoryItem[]>([]);
  const [customers, setCustomers] = useState<CustomerLookupResponse[]>([]);
  const [summary, setSummary] = useState<DeliverySummaryResponse | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [draft, setDraft] = useState<DeliveryDraft>(emptyDeliveryDraft);
  const [driverSelections, setDriverSelections] = useState<Record<string, string>>({});
  const [locationDraft, setLocationDraft] = useState<LocationDraft>({
    deliveryId: '',
    latitude: '',
    longitude: '',
    locationLabel: '',
  });
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const storeId = context.storeId;
  const selectedDelivery = deliveries.find((delivery) => delivery.deliveryId === locationDraft.deliveryId) || deliveries[0];

  const localSummary = useMemo(() => {
    if (summary) {
      return summary;
    }
    return deliveries.reduce(
      (acc, delivery) => {
        acc.total += 1;
        const status = delivery.status?.toUpperCase();
        if (status === 'PENDING') acc.pending += 1;
        if (status === 'ASSIGNED' || status === 'PICKED_UP') acc.assigned += 1;
        if (status === 'OUT_FOR_DELIVERY') acc.outForDelivery += 1;
        if (status === 'DELIVERED') acc.delivered += 1;
        return acc;
      },
      { total: 0, pending: 0, assigned: 0, outForDelivery: 0, delivered: 0 }
    );
  }, [deliveries, summary]);

  const loadDeliveryDesk = async () => {
    if (!storeId) {
      setDeliveries([]);
      setDrivers([]);
      setInvoices([]);
      setCustomers([]);
      setSummary(null);
      return;
    }

    try {
      setBusyKey('load');
      const [deliveryItems, driverItems, summaryResponse, invoiceItems, customerItems] = await Promise.all([
        DeliveryAPI.list(query, statusFilter, 60),
        DeliveryAPI.listDrivers(),
        DeliveryAPI.getSummary(),
        BillingAPI.listInvoices(undefined, undefined, undefined, 50),
        CustomerAPI.search(storeId, undefined, 50),
      ]);
      setDeliveries(deliveryItems);
      setDrivers(driverItems);
      setSummary(summaryResponse);
      setInvoices(invoiceItems);
      setCustomers(customerItems);
      setError(null);
      if (!locationDraft.deliveryId && deliveryItems.length > 0) {
        setLocationDraft((current) => ({ ...current, deliveryId: deliveryItems[0].deliveryId }));
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load delivery desk.');
    } finally {
      setBusyKey(null);
    }
  };

  useEffect(() => {
    void loadDeliveryDesk();
  }, [storeId, statusFilter]);

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find((item) => item.customerId === customerId);
    setDraft((current) => ({
      ...current,
      customerId,
      deliveryPhone: customer?.phone || current.deliveryPhone,
      deliveryAddress: customer?.address || current.deliveryAddress,
    }));
  };

  const handleInvoiceChange = (invoiceId: string) => {
    const invoice = invoices.find((item) => item.invoiceId === invoiceId);
    setDraft((current) => ({
      ...current,
      invoiceId,
      amountToCollect: invoice ? String(invoice.amountDue > 0 ? invoice.amountDue : invoice.totalAmount) : current.amountToCollect,
    }));
  };

  const handleCreateDelivery = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.deliveryAddress.trim()) {
      setError('Delivery address is required.');
      return;
    }

    const payload: DeliveryOrderRequest = {
      invoiceId: draft.invoiceId || undefined,
      customerId: draft.customerId || undefined,
      deliveryBoyId: draft.deliveryBoyId || undefined,
      deliveryAddress: draft.deliveryAddress.trim(),
      deliveryPhone: draft.deliveryPhone.trim() || undefined,
      amountToCollect: draft.amountToCollect ? Number(draft.amountToCollect) : undefined,
      paymentMode: draft.paymentMode || undefined,
      notes: draft.notes.trim() || undefined,
    };

    try {
      setBusyKey('create');
      const response = await DeliveryAPI.create(payload);
      setMessage(`Delivery ${response.deliveryId.slice(0, 8)} created for ${response.deliveryAddress}.`);
      setDraft(emptyDeliveryDraft);
      await loadDeliveryDesk();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Unable to create delivery.');
    } finally {
      setBusyKey(null);
    }
  };

  const handleStatusUpdate = async (delivery: DeliveryOrderResponse, status: string) => {
    const selectedDriverId = driverSelections[delivery.deliveryId] || delivery.deliveryBoyId || '';
    if (status === 'ASSIGNED' && !selectedDriverId) {
      setError('Choose a delivery driver before assigning this order.');
      return;
    }

    try {
      setBusyKey(`${delivery.deliveryId}-${status}`);
      const response = await DeliveryAPI.updateStatus(delivery.deliveryId, {
        status,
        deliveryBoyId: selectedDriverId || undefined,
        amountCollected: status === 'DELIVERED' ? delivery.amountToCollect : undefined,
      });
      setMessage(`Delivery ${response.deliveryId.slice(0, 8)} moved to ${humanizeStatus(response.status)}.`);
      await loadDeliveryDesk();
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : 'Unable to update delivery.');
    } finally {
      setBusyKey(null);
    }
  };

  const handleCancel = async (delivery: DeliveryOrderResponse) => {
    if (!window.confirm(`Cancel delivery ${delivery.deliveryId.slice(0, 8)}?`)) {
      return;
    }
    await handleStatusUpdate(delivery, 'CANCELLED');
  };

  const handleUseBrowserLocation = () => {
    if (!navigator.geolocation) {
      setError('This browser does not expose location tracking.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationDraft((current) => ({
          ...current,
          latitude: position.coords.latitude.toFixed(7),
          longitude: position.coords.longitude.toFixed(7),
          locationLabel: current.locationLabel || 'Driver live location',
        }));
        setError(null);
      },
      () => setError('Location permission was denied or unavailable.')
    );
  };

  const handleLocationUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!locationDraft.deliveryId || !locationDraft.latitude || !locationDraft.longitude) {
      setError('Choose a delivery and enter latitude plus longitude.');
      return;
    }

    try {
      setBusyKey('location');
      const response = await DeliveryAPI.updateLocation(locationDraft.deliveryId, {
        latitude: Number(locationDraft.latitude),
        longitude: Number(locationDraft.longitude),
        locationLabel: locationDraft.locationLabel.trim() || undefined,
      });
      setMessage(`Location updated for ${response.deliveryBoyName || response.deliveryPhone || 'delivery order'}.`);
      await loadDeliveryDesk();
    } catch (locationError) {
      setError(locationError instanceof Error ? locationError.message : 'Unable to update delivery location.');
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <PharmaFlowShell
      title="Online & Delivery"
      description="Create online or phone medicine deliveries, assign branch riders, and track delivery movement from the active store."
      actions={
        <button
          type="button"
          onClick={() => loadDeliveryDesk()}
          className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      }
    >
      {!storeId && (
        <section className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          Choose an active branch before creating delivery orders.
        </section>
      )}

      {(error || message) && (
        <section className={`rounded-xl border px-5 py-4 text-sm ${error ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
          {error || message}
        </section>
      )}

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {[
          ['Total', localSummary.total],
          ['Pending', localSummary.pending],
          ['Assigned', localSummary.assigned],
          ['On road', localSummary.outForDelivery],
          ['Delivered', localSummary.delivered],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
            <div className="mt-2 text-2xl font-semibold text-slate-950">{value}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
        <form onSubmit={handleCreateDelivery} className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
              <Truck size={18} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-950">New delivery order</h2>
              <p className="text-sm text-slate-500">Attach a bill when available, then assign a rider.</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Recent bill</span>
              <select
                value={draft.invoiceId}
                onChange={(event) => handleInvoiceChange(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5"
              >
                <option value="">No linked bill</option>
                {invoices.map((invoice) => (
                  <option key={invoice.invoiceId} value={invoice.invoiceId}>
                    {invoice.invoiceNo} - {formatCurrency(invoice.totalAmount)}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Customer</span>
              <select
                value={draft.customerId}
                onChange={(event) => handleCustomerChange(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5"
              >
                <option value="">Walk-in or online customer</option>
                {customers.map((customer) => (
                  <option key={customer.customerId} value={customer.customerId}>
                    {customer.name} {customer.phone ? `- ${customer.phone}` : ''}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm md:col-span-2">
              <span className="mb-1 block font-medium text-slate-700">Delivery address</span>
              <input
                value={draft.deliveryAddress}
                onChange={(event) => setDraft((current) => ({ ...current, deliveryAddress: event.target.value }))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5"
                placeholder="Flat, street, area, city"
              />
            </label>

            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Phone</span>
              <input
                value={draft.deliveryPhone}
                onChange={(event) => setDraft((current) => ({ ...current, deliveryPhone: event.target.value }))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5"
                placeholder="Customer phone"
              />
            </label>

            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Driver</span>
              <select
                value={draft.deliveryBoyId}
                onChange={(event) => setDraft((current) => ({ ...current, deliveryBoyId: event.target.value }))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5"
              >
                <option value="">Assign later</option>
                {drivers.map((driver) => (
                  <option key={driver.userId} value={driver.userId}>
                    {driver.fullName}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Amount to collect</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={draft.amountToCollect}
                onChange={(event) => setDraft((current) => ({ ...current, amountToCollect: event.target.value }))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5"
              />
            </label>

            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Payment</span>
              <select
                value={draft.paymentMode}
                onChange={(event) => setDraft((current) => ({ ...current, paymentMode: event.target.value }))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5"
              >
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="CARD">Card</option>
                <option value="PAID_ONLINE">Paid online</option>
              </select>
            </label>

            <label className="text-sm md:col-span-2">
              <span className="mb-1 block font-medium text-slate-700">Notes</span>
              <input
                value={draft.notes}
                onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5"
                placeholder="Gate code, cold-chain note, prescription check"
              />
            </label>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={!storeId || busyKey === 'create'}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              <Truck size={16} />
              Create delivery
            </button>
            <Link
              to="/lifepill/billing"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700"
            >
              <Route size={16} />
              Open counter
            </Link>
            <Link
              to="/lifepill/users"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700"
            >
              <UserRound size={16} />
              Drivers
            </Link>
          </div>
        </form>

        <form onSubmit={handleLocationUpdate} className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-900 text-white">
              <LocateFixed size={18} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Driver location</h2>
              <p className="text-sm text-slate-500">Update the last known tracking point.</p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Delivery</span>
              <select
                value={locationDraft.deliveryId || selectedDelivery?.deliveryId || ''}
                onChange={(event) => setLocationDraft((current) => ({ ...current, deliveryId: event.target.value }))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5"
              >
                {deliveries.map((delivery) => (
                  <option key={delivery.deliveryId} value={delivery.deliveryId}>
                    {delivery.invoiceNo || delivery.deliveryId.slice(0, 8)} - {humanizeStatus(delivery.status)}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block font-medium text-slate-700">Latitude</span>
                <input
                  value={locationDraft.latitude}
                  onChange={(event) => setLocationDraft((current) => ({ ...current, latitude: event.target.value }))}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5"
                  placeholder="13.0826800"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium text-slate-700">Longitude</span>
                <input
                  value={locationDraft.longitude}
                  onChange={(event) => setLocationDraft((current) => ({ ...current, longitude: event.target.value }))}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5"
                  placeholder="80.2707200"
                />
              </label>
            </div>

            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Location label</span>
              <input
                value={locationDraft.locationLabel}
                onChange={(event) => setLocationDraft((current) => ({ ...current, locationLabel: event.target.value }))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5"
                placeholder="Near Anna Nagar depot"
              />
            </label>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleUseBrowserLocation}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
            >
              <Navigation size={16} />
              Use browser GPS
            </button>
            <button
              type="submit"
              disabled={!locationDraft.deliveryId || busyKey === 'location'}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-900 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              <MapPin size={16} />
              Update location
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Delivery queue</h2>
            <p className="mt-1 text-sm text-slate-500">Assign riders and move orders through pickup, road, and delivered states.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="min-w-[220px] rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
              placeholder="Search customer, bill, driver"
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {humanizeStatus(status)}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => loadDeliveryDesk()}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
            >
              Search
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4">
          {deliveries.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
              No delivery orders found for this branch.
            </div>
          ) : (
            deliveries.map((delivery) => {
              const nextStatuses = getNextStatuses(delivery.status);
              const mapUrl = buildMapUrl(delivery);
              const activeStepIndex = Math.max(0, progressSteps.indexOf(delivery.status));

              return (
                <article key={delivery.deliveryId} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusTone(delivery.status)}`}>
                          {humanizeStatus(delivery.status)}
                        </span>
                        <span className="text-xs font-medium text-slate-500">
                          {delivery.invoiceNo || delivery.deliveryId.slice(0, 8)}
                        </span>
                        <span className="text-xs text-slate-400">{formatDateTime(delivery.createdAt)}</span>
                      </div>

                      <div className="mt-3 grid gap-3 lg:grid-cols-3">
                        <div>
                          <div className="text-xs uppercase tracking-wide text-slate-400">Customer</div>
                          <div className="mt-1 font-semibold text-slate-900">{delivery.customerName || 'Online customer'}</div>
                          {delivery.deliveryPhone && (
                            <div className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500">
                              <Phone size={12} />
                              {delivery.deliveryPhone}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-wide text-slate-400">Address</div>
                          <div className="mt-1 text-sm text-slate-700">{delivery.deliveryAddress}</div>
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-wide text-slate-400">Driver</div>
                          <div className="mt-1 font-semibold text-slate-900">{delivery.deliveryBoyName || 'Unassigned'}</div>
                          <div className="mt-1 text-xs text-slate-500">{delivery.deliveryBoyPhone || 'No driver phone'}</div>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-2 md:grid-cols-5">
                        {progressSteps.map((step, index) => (
                          <div
                            key={step}
                            className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
                              delivery.status === 'CANCELLED'
                                ? 'border-rose-200 bg-rose-50 text-rose-700'
                                : index <= activeStepIndex
                                  ? 'border-slate-900 bg-slate-900 text-white'
                                  : 'border-slate-200 bg-white text-slate-500'
                            }`}
                          >
                            {humanizeStatus(step)}
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
                        <span>Collect {formatCurrency(delivery.amountToCollect)}</span>
                        <span>Collected {formatCurrency(delivery.amountCollected)}</span>
                        <span>Last location {formatDateTime(delivery.lastLocationAt)}</span>
                        {delivery.lastLocationLabel && <span>{delivery.lastLocationLabel}</span>}
                        {mapUrl && (
                          <a href={mapUrl} target="_blank" rel="noreferrer" className="font-semibold text-sky-700">
                            Open map
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="w-full space-y-3 xl:w-72">
                      <select
                        value={driverSelections[delivery.deliveryId] || delivery.deliveryBoyId || ''}
                        onChange={(event) =>
                          setDriverSelections((current) => ({
                            ...current,
                            [delivery.deliveryId]: event.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
                      >
                        <option value="">Choose driver</option>
                        {drivers.map((driver) => (
                          <option key={driver.userId} value={driver.userId}>
                            {driver.fullName}
                          </option>
                        ))}
                      </select>

                      <div className="flex flex-wrap gap-2">
                        {nextStatuses.map((status) => (
                          <button
                            key={status}
                            type="button"
                            disabled={busyKey === `${delivery.deliveryId}-${status}`}
                            onClick={() => handleStatusUpdate(delivery, status)}
                            className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white disabled:bg-slate-400"
                          >
                            {humanizeStatus(status)}
                          </button>
                        ))}
                        {!['DELIVERED', 'CANCELLED'].includes(delivery.status) && (
                          <button
                            type="button"
                            onClick={() => handleCancel(delivery)}
                            className="rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700"
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            setLocationDraft((current) => ({
                              ...current,
                              deliveryId: delivery.deliveryId,
                              latitude: delivery.currentLatitude !== undefined ? String(delivery.currentLatitude) : current.latitude,
                              longitude: delivery.currentLongitude !== undefined ? String(delivery.currentLongitude) : current.longitude,
                            }))
                          }
                          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
                        >
                          Track
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>
    </PharmaFlowShell>
  );
};

export default DeliveryTrackingDashboard;
