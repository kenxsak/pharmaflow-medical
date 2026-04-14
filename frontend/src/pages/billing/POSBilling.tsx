import React, { useEffect, useMemo, useRef, useState } from 'react';
import PharmaFlowShell from '../../components/pharmaflow/PharmaFlowShell';
import {
  BillingAPI,
  BillingItem,
  CustomerAPI,
  CustomerLookupResponse,
  GstCalculationResponse,
  MedicineAPI,
  MedicineSearchResult,
  SubstituteResult,
} from '../../services/api';

interface CartItem extends BillingItem {
  medicineLabel: string;
  batchNumber: string;
  scheduleType?: string;
  packSize?: number;
}

const demoQuickAdds = [
  { label: 'Crocin 500', query: '8901234500001' },
  { label: 'Dolo 650', query: '8901234500002' },
  { label: 'Mox 500', query: '8901234500003' },
  { label: 'Alprax 0.25', query: '8901234500010' },
];

const demoCustomers = [
  { label: 'Ramesh', phone: '9876000001' },
  { label: 'Lakshmi', phone: '9876000002' },
  { label: 'Mohammed', phone: '9876000003' },
];

const counterHighlights = [
  {
    title: 'Barcode search',
    summary: 'Type or scan a barcode and press Enter to add the first stocked match instantly.',
  },
  {
    title: 'Loose tablet sales',
    summary: 'Switch unit to Tablet and the bill uses pack size to price loose strips correctly.',
  },
  {
    title: 'Schedule compliance',
    summary: 'Schedule H, H1, and X drugs automatically ask for patient, doctor, and prescription details.',
  },
];

interface POSBillingProps {
  embedded?: boolean;
}

const POSBilling: React.FC<POSBillingProps> = ({ embedded = false }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MedicineSearchResult[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [gstSummary, setGstSummary] = useState<GstCalculationResponse | null>(null);
  const [scheduleAlert, setScheduleAlert] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [customerPhone, setCustomerPhone] = useState('');
  const [customer, setCustomer] = useState<CustomerLookupResponse | null>(null);
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'CARD' | 'UPI' | 'CREDIT'>('CASH');
  const [patientName, setPatientName] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [prescriptionUrl, setPrescriptionUrl] = useState('');
  const [substitutesByMedicineId, setSubstitutesByMedicineId] = useState<Record<string, SubstituteResult[]>>({});
  const searchRef = useRef<HTMLInputElement>(null);
  const userRole = localStorage.getItem('pharmaflow_role') || '';
  const canEditPrice = userRole === 'SUPER_ADMIN' || userRole === 'STORE_MANAGER';

  const getPackSize = (item: Pick<CartItem, 'packSize'>) => {
    if (!item.packSize || item.packSize <= 0) {
      return 1;
    }
    return item.packSize;
  };

  const getUnitPrice = (item: CartItem) => {
    if (item.unitType === 'TABLET') {
      return item.mrp / getPackSize(item);
    }
    return item.mrp;
  };

  const getLineTotal = (item: CartItem) => {
    const gross = getUnitPrice(item) * item.quantity;
    return gross * (1 - item.discountPercent / 100);
  };

  const hasControlledDrug = cartItems.some(
    (item) => item.scheduleType === 'H' || item.scheduleType === 'H1' || item.scheduleType === 'X'
  );
  const requiresPrescription = cartItems.some(
    (item) => item.scheduleType === 'H1' || item.scheduleType === 'X'
  );

  useEffect(() => {
    if (!cartItems.length) {
      setGstSummary(null);
      return;
    }

    BillingAPI.calculateGST(cartItems)
      .then((summary) => {
        setGstSummary(summary);
        setErrorMessage(null);
      })
      .catch((error) => {
        setGstSummary(null);
        setErrorMessage(error.message);
      });
  }, [cartItems]);

  const searchablePlaceholder = useMemo(
    () => 'Search by brand name, generic, salt, or barcode',
    []
  );

  const substituteSuggestions = useMemo(() => {
    const seen = new Set<string>();
    const suggestions: SubstituteResult[] = [];

    cartItems.forEach((item) => {
      (substitutesByMedicineId[item.medicineId] || []).forEach((substitute) => {
        if (substitute.medicineId && !seen.has(substitute.medicineId)) {
          seen.add(substitute.medicineId);
          suggestions.push(substitute);
        }
      });
    });

    return suggestions.slice(0, 6);
  }, [cartItems, substitutesByMedicineId]);

  const complianceError = useMemo(() => {
    if (!hasControlledDrug) {
      return null;
    }
    if (!patientName.trim()) {
      return 'Patient name is required for Schedule H / H1 / X billing.';
    }
    if (!doctorName.trim()) {
      return 'Doctor name is required for Schedule H / H1 / X billing.';
    }
    if (requiresPrescription && !prescriptionUrl.trim()) {
      return 'Prescription reference is required for Schedule H1 / X billing.';
    }
    return null;
  }, [doctorName, hasControlledDrug, patientName, prescriptionUrl, requiresPrescription]);

  const loadSubstitutes = async (medicineId: string) => {
    if (substitutesByMedicineId[medicineId]) {
      return;
    }

    try {
      const substitutes = await MedicineAPI.getSubstitutes(medicineId);
      setSubstitutesByMedicineId((prev) => ({
        ...prev,
        [medicineId]: substitutes,
      }));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load substitutes.');
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const results = await MedicineAPI.search(query.trim());
      setSearchResults(results);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to search medicines.');
    }
  };

  const handleSearchSubmit = async () => {
    if (searchResults.length > 0) {
      addToCart(searchResults[0]);
      return;
    }

    if (searchQuery.trim().length < 2) {
      return;
    }

    try {
      const results = await MedicineAPI.search(searchQuery.trim());
      if (!results.length) {
        setErrorMessage('No stocked medicine matched that barcode or search term in the selected store.');
        return;
      }

      addToCart(results[0]);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to search medicines.');
    }
  };

  const quickAddMedicine = async (query: string) => {
    try {
      const results = await MedicineAPI.search(query.trim());
      const bestMatch =
        results.find(
          (medicine) =>
            medicine.brandName.toLowerCase() === query.toLowerCase() ||
            medicine.currentBatch?.batchNumber?.toLowerCase() === query.toLowerCase()
        ) || results[0];

      if (!bestMatch) {
        setErrorMessage('No stocked medicine matched that starter shortcut in the selected store.');
        return;
      }

      addToCart(bestMatch);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to add the selected medicine.');
    }
  };

  const addToCart = (medicine: MedicineSearchResult) => {
    const currentBatch = medicine.currentBatch;
    if (!currentBatch) {
      setScheduleAlert('No active batch found for this medicine in the selected store.');
      return;
    }

    if (medicine.scheduleType === 'H1' || medicine.scheduleType === 'X') {
      setScheduleAlert(`Schedule ${medicine.scheduleType} drug selected. Prescription is mandatory.`);
    } else if (medicine.scheduleType === 'H') {
      setScheduleAlert('Schedule H drug selected. Patient and doctor details must be recorded.');
    } else {
      setScheduleAlert(null);
    }

    setCartItems((prev) => [
      ...prev,
      {
        medicineId: medicine.medicineId,
        batchId: currentBatch.batchId,
        quantity: 1,
        unitType: 'STRIP',
        mrp: medicine.mrp,
        discountPercent: 0,
        gstRate: medicine.gstRate,
        medicineLabel: `${medicine.brandName}${medicine.strength ? ` • ${medicine.strength}` : ''}`,
        batchNumber: currentBatch.batchNumber,
        scheduleType: medicine.scheduleType,
        packSize: medicine.packSize,
      },
    ]);

    void loadSubstitutes(medicine.medicineId);

    setSearchQuery('');
    setSearchResults([]);
    setErrorMessage(null);
    searchRef.current?.focus();
  };

  const updateItem = (index: number, partial: Partial<CartItem>) => {
    setCartItems((prev) =>
      prev.map((item, itemIndex) => (itemIndex === index ? { ...item, ...partial } : item))
    );
  };

  const totalAmount = gstSummary?.totalAmount ?? 0;

  const lookupCustomer = async (phoneOverride?: string) => {
    const phoneToLookup = (phoneOverride ?? customerPhone).trim();
    if (!phoneToLookup) {
      setCustomer(null);
      return;
    }

    const normalizedPhone = phoneToLookup.replace(/\D/g, '');
    if (normalizedPhone.length !== 10) {
      setCustomer(null);
      setErrorMessage('Enter a 10-digit mobile number to look up a customer.');
      return;
    }

    try {
      const result = await CustomerAPI.lookupByPhone(normalizedPhone);
      setCustomerPhone(normalizedPhone);
      setCustomer(result);
      if (!doctorName && result.doctorName) {
        setDoctorName(result.doctorName);
      }
      if (!patientName && result.name) {
        setPatientName(result.name);
      }
      setErrorMessage(null);
    } catch (error) {
      setCustomer(null);
      setErrorMessage(error instanceof Error ? error.message : 'Unable to look up customer.');
    }
  };

  const resetBillingForm = () => {
    setCartItems([]);
    setSearchResults([]);
    setSearchQuery('');
    setScheduleAlert(null);
    setErrorMessage(null);
    setPatientName('');
    setDoctorName('');
    setPrescriptionUrl('');
    setGstSummary(null);
  };

  const handleBill = async () => {
    if (complianceError) {
      setErrorMessage(complianceError);
      return;
    }

    try {
      const invoice = await BillingAPI.createInvoice({
        customerId: customer?.customerId,
        items: cartItems,
        paymentMode,
        patientName: hasControlledDrug ? patientName : undefined,
        doctorName: hasControlledDrug ? doctorName : undefined,
        prescriptionUrl: requiresPrescription ? prescriptionUrl : undefined,
      });

      window.alert(`Invoice ${invoice.invoiceNo} created successfully.`);
      resetBillingForm();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to create invoice.');
    }
  };

  const isBillDisabled =
    !cartItems.length || (paymentMode === 'CREDIT' && !customer) || complianceError !== null;

  return (
    <PharmaFlowShell
      embedded={embedded}
      title="POS Billing"
      description="Create GST-compliant pharmacy bills with substitute suggestions, controlled-drug checks, and credit-aware billing."
    >
      <div className="flex flex-col gap-6 xl:flex-row">
        <section className="flex-1">
          <div className="rounded-3xl border border-sky-200 bg-sky-50 p-4 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-sm font-semibold text-sky-900">Counter starter flow</div>
                <div className="mt-1 text-sm text-sky-800">
                  Start with a barcode or one of the stocked medicines below, then switch unit, add a customer,
                  or verify a controlled-drug workflow.
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {demoQuickAdds.map((demoItem) => (
                  <button
                    key={demoItem.query}
                    type="button"
                    onClick={() => void quickAddMedicine(demoItem.query)}
                    className="rounded-full border border-sky-200 bg-white px-3 py-2 text-sm font-medium text-sky-900"
                  >
                    {demoItem.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            {counterHighlights.map((highlight) => (
              <div key={highlight.title} className="rounded-3xl bg-white p-4 shadow-sm">
                <div className="text-sm font-semibold text-slate-900">{highlight.title}</div>
                <div className="mt-2 text-sm leading-6 text-slate-500">{highlight.summary}</div>
              </div>
            ))}
          </div>

          <div className="relative mt-4 rounded-3xl bg-white p-4 shadow-sm">
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={(event) => handleSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  void handleSearchSubmit();
                }
              }}
              placeholder={searchablePlaceholder}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none transition focus:border-sky-500"
            />

            {searchResults.length > 0 && (
              <div className="absolute left-4 right-4 top-[72px] z-10 max-h-72 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl">
                {searchResults.map((medicine) => (
                  <button
                    key={medicine.medicineId}
                    type="button"
                    onClick={() => addToCart(medicine)}
                    className="flex w-full items-start justify-between border-b border-slate-100 px-4 py-3 text-left transition hover:bg-sky-50"
                  >
                    <div>
                      <p className="font-semibold">{medicine.brandName}</p>
                      <p className="text-sm text-slate-500">
                        {medicine.genericName} • {medicine.strength} • {medicine.medicineForm}
                      </p>
                      <p className="text-xs text-slate-400">
                        {medicine.manufacturer} • {medicine.packSize || 1}/strip • Batch {medicine.currentBatch?.batchNumber || 'N/A'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-emerald-600">₹{medicine.mrp.toFixed(2)}</p>
                      <p className="text-xs text-slate-500">
                        {medicine.currentBatch?.quantityStrips ?? 0} strips
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {scheduleAlert && (
            <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {scheduleAlert}
            </div>
          )}

          {errorMessage && (
            <div className="mt-4 rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-900">
              {errorMessage}
            </div>
          )}

          <div className="mt-4 overflow-hidden rounded-3xl bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Medicine</th>
                    <th className="px-4 py-3 text-center">Qty</th>
                    <th className="px-4 py-3 text-center">Unit</th>
                    <th className="px-4 py-3 text-right">Pack MRP</th>
                    <th className="px-4 py-3 text-right">Disc%</th>
                    <th className="px-4 py-3 text-right">Line Total</th>
                    <th className="px-4 py-3 text-right">Remove</th>
                  </tr>
                </thead>
                <tbody>
                  {cartItems.map((item, index) => (
                    <tr key={`${item.batchId}-${index}`} className="border-t border-slate-100">
                      <td className="px-4 py-3 font-medium">
                        <div>{item.medicineLabel}</div>
                        <div className="text-xs text-slate-400">
                          Batch {item.batchNumber} • {getPackSize(item)}/strip
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="number"
                          min={0.5}
                          step={0.5}
                          value={item.quantity}
                          onChange={(event) =>
                            updateItem(index, { quantity: parseFloat(event.target.value) || 1 })
                          }
                          className="w-20 rounded-lg border border-slate-300 px-2 py-1 text-center"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <select
                          value={item.unitType}
                          onChange={(event) =>
                            updateItem(index, {
                              unitType: event.target.value as BillingItem['unitType'],
                            })
                          }
                          className="rounded-lg border border-slate-300 px-2 py-1"
                        >
                          <option value="STRIP">Strip</option>
                          <option value="TABLET">Tablet</option>
                          <option value="ML">ML</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={item.mrp}
                          disabled={!canEditPrice}
                          onChange={(event) =>
                            updateItem(index, { mrp: parseFloat(event.target.value) || 0 })
                          }
                          className="w-24 rounded-lg border border-slate-300 px-2 py-1 text-right disabled:bg-slate-100"
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={item.discountPercent}
                          onChange={(event) =>
                            updateItem(index, {
                              discountPercent: parseFloat(event.target.value) || 0,
                            })
                          }
                          className="w-20 rounded-lg border border-slate-300 px-2 py-1 text-right"
                        />
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        ₹{getLineTotal(item).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setCartItems((prev) => prev.filter((_, i) => i !== index))}
                          className="rounded-full px-3 py-1 text-rose-600 transition hover:bg-rose-50"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          {!cartItems.length && (
            <div className="px-6 py-20 text-center text-slate-400">
              Start a bill by searching for a medicine above.
            </div>
          )}
          </div>

          {substituteSuggestions.length > 0 && (
            <div className="mt-4 rounded-3xl bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Suggested Substitutes</h3>
                <span className="text-xs text-slate-500">Salt-based alternates for current cart</span>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {substituteSuggestions.map((substitute) => (
                  <div
                    key={substitute.medicineId}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <div className="font-medium">{substitute.brandName}</div>
                <div className="text-sm text-slate-500">{substitute.genericName}</div>
                <div className="mt-2 flex items-center justify-between text-sm">
                      <span className="text-emerald-700">₹{substitute.mrp.toFixed(2)}</span>
                      <span className="rounded-full bg-white px-2 py-1 text-xs text-slate-600">
                        {substitute.isGeneric ? 'Generic' : 'Branded'} •{' '}
                        {substitute.priceDiffPct ?? 0}% diff
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <aside className="w-full rounded-3xl bg-white p-5 shadow-sm lg:w-96">
          <h2 className="mb-4 text-xl font-semibold">Bill Summary</h2>
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={customerPhone}
                onChange={(event) => setCustomerPhone(event.target.value)}
                onBlur={() => void lookupCustomer()}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    void lookupCustomer();
                  }
                }}
                placeholder="Customer phone"
                className="flex-1 rounded-2xl border border-slate-300 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => void lookupCustomer()}
                className="rounded-2xl border border-slate-300 px-3 py-2 text-sm"
              >
                Lookup
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {demoCustomers.map((demoCustomer) => (
                <button
                  key={demoCustomer.phone}
                  type="button"
                  onClick={() => void lookupCustomer(demoCustomer.phone)}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700"
                >
                  {demoCustomer.label} • {demoCustomer.phone}
                </button>
              ))}
            </div>

            {customer && (
              <div className="rounded-2xl bg-sky-50 p-3 text-sm text-sky-900">
                <div className="font-medium">{customer.name}</div>
                <div>Available credit: ₹{customer.availableCredit.toFixed(2)}</div>
                <div>Loyalty points: {customer.loyaltyPoints}</div>
              </div>
            )}

            {hasControlledDrug && (
              <div className="space-y-2 rounded-2xl bg-amber-50 p-3 text-sm">
                <div className="text-xs font-medium uppercase tracking-wide text-amber-700">
                  Controlled Drug Compliance
                </div>
                <input
                  type="text"
                  value={patientName}
                  onChange={(event) => setPatientName(event.target.value)}
                  placeholder="Patient name"
                  className="w-full rounded-xl border border-amber-200 px-3 py-2"
                />
                <input
                  type="text"
                  value={doctorName}
                  onChange={(event) => setDoctorName(event.target.value)}
                  placeholder="Doctor name"
                  className="w-full rounded-xl border border-amber-200 px-3 py-2"
                />
                {requiresPrescription && (
                  <input
                    type="text"
                    value={prescriptionUrl}
                    onChange={(event) => setPrescriptionUrl(event.target.value)}
                    placeholder="Prescription file path or document reference"
                    className="w-full rounded-xl border border-amber-200 px-3 py-2"
                  />
                )}
              </div>
            )}
          </div>

          <div className="mt-4 space-y-3 rounded-2xl bg-slate-50 p-4 text-sm">
            <div className="flex items-center justify-between">
              <span>Items</span>
              <span>{cartItems.length}</span>
            </div>
            {cartItems.some((item) => item.unitType === 'TABLET') && (
              <div className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-800">
                Tablet sales are priced per loose tablet using the stored strip MRP and pack size.
              </div>
            )}
            <div className="flex items-center justify-between">
              <span>Subtotal</span>
              <span>₹{(gstSummary?.subtotal ?? 0).toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Discount</span>
              <span>₹{(gstSummary?.discountAmount ?? 0).toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>CGST</span>
              <span>₹{(gstSummary?.cgst ?? 0).toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>SGST</span>
              <span>₹{(gstSummary?.sgst ?? 0).toFixed(2)}</span>
            </div>
            {(gstSummary?.igst ?? 0) > 0 && (
              <div className="flex items-center justify-between">
                <span>IGST</span>
                <span>₹{(gstSummary?.igst ?? 0).toFixed(2)}</span>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-lg font-semibold">
              <span>Total</span>
              <span className="text-emerald-600">₹{totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {(['CASH', 'CARD', 'UPI', 'CREDIT'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setPaymentMode(mode)}
                className={`rounded-2xl px-3 py-3 text-sm font-medium transition ${
                  paymentMode === mode
                    ? 'bg-slate-900 text-white'
                    : 'border border-slate-300 bg-white text-slate-700'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {complianceError && (
            <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {complianceError}
            </div>
          )}

          <button
            type="button"
            onClick={handleBill}
            disabled={isBillDisabled}
            className="mt-4 w-full rounded-2xl bg-emerald-500 px-4 py-4 text-base font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Create {paymentMode} Bill
          </button>

          {!canEditPrice && (
            <p className="mt-3 text-xs text-slate-500">
              Price editing is restricted to store managers and super admins.
            </p>
          )}
        </aside>
      </div>
    </PharmaFlowShell>
  );
};

export default POSBilling;
