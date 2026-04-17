import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PharmaFlowShell from '../../components/pharmaflow/PharmaFlowShell';
import {
  InventoryAPI,
  InventoryMovementResponse,
  MedicineAPI,
  MedicineSearchResult,
  PurchaseAPI,
  ReportsAPI,
  ShortageItemResponse,
  StockBatchResponse,
  SupplierSummary,
} from '../../services/api';
import { usePharmaFlowContext } from '../../utils/pharmaflowContext';
import LegacyModal from '../../shared/legacy/LegacyModal';
import { formatDateInput, formatLocalDateTime } from '../../utils/dateTime';
import {
  formatPrimaryQuantity,
  formatSecondaryQuantity,
  getMedicineUnitProfile,
} from '../../utils/medicineUnits';

const quickSearches = ['8901234500001', 'Dolo 650', 'Mox 500', 'Alprax 0.25'];

const expiryBadgeClasses: Record<string, string> = {
  EXPIRED: 'bg-rose-100 text-rose-700',
  EXPIRY_30: 'bg-amber-100 text-amber-800',
  EXPIRY_60: 'bg-sky-100 text-sky-700',
  EXPIRY_90: 'bg-indigo-100 text-indigo-700',
  OK: 'bg-emerald-100 text-emerald-700',
};

const inventoryStateClasses: Record<string, string> = {
  SELLABLE: 'bg-emerald-100 text-emerald-700',
  QUARANTINED: 'bg-amber-100 text-amber-800',
  DAMAGED: 'bg-rose-100 text-rose-700',
  RTV_PENDING: 'bg-violet-100 text-violet-700',
  DUMPED: 'bg-slate-200 text-slate-700',
  EXPIRED: 'bg-rose-100 text-rose-700',
};

interface OpeningStockDraft {
  supplierId: string;
  newSupplierName: string;
  newSupplierContact: string;
  invoiceNumber: string;
  batchNumber: string;
  manufactureDate: string;
  expiryDate: string;
  quantity: number;
  quantityLoose: number;
  freeQty: number;
  freeQtyLoose: number;
  purchaseRate: number;
  mrp: number;
  gstRate: number;
}

type BatchActionMode = 'ADJUST_ADD' | 'ADJUST_REMOVE' | 'QUARANTINE' | 'RELEASE';

const createOpeningStockDraft = (
  medicine: MedicineSearchResult | null,
  supplierId = '',
  supplierName = ''
): OpeningStockDraft => {
  const today = new Date();
  const expiryDate = new Date(today);
  expiryDate.setFullYear(expiryDate.getFullYear() + 1);
  const mrp = Number(medicine?.mrp || 0);
  const purchaseRate = Number((mrp > 0 ? mrp * 0.65 : 0).toFixed(2));

  return {
    supplierId,
    newSupplierName: supplierName || 'Opening Stock Supplier',
    newSupplierContact: 'Demo inward supplier',
    invoiceNumber: `OPEN-${Date.now()}`,
    batchNumber: `BATCH-${Date.now().toString().slice(-6)}`,
    manufactureDate: '',
    expiryDate: formatDateInput(expiryDate),
    quantity: 10,
    quantityLoose: 0,
    freeQty: 0,
    freeQtyLoose: 0,
    purchaseRate,
    mrp,
    gstRate: Number(medicine?.gstRate || 0),
  };
};

interface InventoryDashboardProps {
  embedded?: boolean;
}

const InventoryDashboard: React.FC<InventoryDashboardProps> = ({ embedded = false }) => {
  const context = usePharmaFlowContext();
  const storeId = context.storeId;
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MedicineSearchResult[]>([]);
  const [selectedMedicine, setSelectedMedicine] = useState<MedicineSearchResult | null>(null);
  const [stockRows, setStockRows] = useState<StockBatchResponse[]>([]);
  const [shortageRows, setShortageRows] = useState<ShortageItemResponse[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierSummary[]>([]);
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(false);
  const [movements, setMovements] = useState<InventoryMovementResponse[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [isBatchActionOpen, setIsBatchActionOpen] = useState(false);
  const [batchActionMode, setBatchActionMode] = useState<BatchActionMode>('ADJUST_ADD');
  const [batchActionQuantity, setBatchActionQuantity] = useState(1);
  const [batchActionUnitType, setBatchActionUnitType] = useState('STRIP');
  const [batchActionReason, setBatchActionReason] = useState('MANUAL_RECOUNT');
  const [batchActionNotes, setBatchActionNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isOpeningStockOpen, setIsOpeningStockOpen] = useState(false);
  const [openingStockDraft, setOpeningStockDraft] = useState<OpeningStockDraft>(() =>
    createOpeningStockDraft(null)
  );

  useEffect(() => {
    if (!storeId) {
      setShortageRows([]);
      setStockRows([]);
      setSelectedMedicine(null);
      setSuppliers([]);
      setIsLoadingSuppliers(false);
      setError('Choose the active store in Company Setup before opening inventory.');
      return;
    }

    ReportsAPI.getShortageReport(storeId)
      .then((shortage) => {
        setShortageRows(shortage);
        setError(null);
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load inventory context.');
      });
  }, [storeId]);

  const loadSuppliersIfNeeded = async (): Promise<SupplierSummary[]> => {
    if (!storeId) {
      return [];
    }
    if (suppliers.length > 0) {
      return suppliers;
    }

    setIsLoadingSuppliers(true);
    try {
      const supplierRows = await PurchaseAPI.listSuppliers();
      setSuppliers(supplierRows);
      return supplierRows;
    } finally {
      setIsLoadingSuppliers(false);
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
      setError(null);
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : 'Unable to search medicines.');
    }
  };

  const loadStock = async (medicine: MedicineSearchResult) => {
    if (!storeId) {
      return;
    }

    try {
      const [rows, movementRows] = await Promise.all([
        MedicineAPI.getStock(medicine.medicineId, storeId),
        InventoryAPI.getMovements(storeId, { medicineId: medicine.medicineId, limit: 25 }),
      ]);
      setSelectedMedicine(medicine);
      setStockRows(rows);
      setMovements(movementRows);
      setSelectedBatchId(rows[0]?.batchId || null);
      setSearchResults([]);
      setSearchQuery(medicine.brandName);
      setMessage(null);
      setError(null);
    } catch (stockError) {
      setError(stockError instanceof Error ? stockError.message : 'Unable to load stock.');
    }
  };

  const openBatchAction = (mode: BatchActionMode) => {
    if (!selectedBatch) {
      setError('Select a batch first before taking an inventory action.');
      return;
    }

    setBatchActionMode(mode);
    setBatchActionQuantity(1);
    setBatchActionUnitType('STRIP');
    setBatchActionReason(
      mode === 'QUARANTINE'
        ? 'QUALITY_HOLD'
        : mode === 'RELEASE'
        ? 'QUALITY_REVIEW_CLEARED'
        : 'MANUAL_RECOUNT'
    );
    setBatchActionNotes('');
    setIsBatchActionOpen(true);
    setError(null);
  };

  const refreshSelectedMedicine = async () => {
    if (!selectedMedicine || !storeId) {
      return;
    }
    await loadStock(selectedMedicine);
    const refreshedShortage = await ReportsAPI.getShortageReport(storeId);
    setShortageRows(refreshedShortage);
  };

  const handleBatchActionSubmit = async () => {
    if (!selectedBatch) {
      return;
    }

    try {
      if (batchActionMode === 'ADJUST_ADD' || batchActionMode === 'ADJUST_REMOVE') {
        await InventoryAPI.adjustStock({
          batchId: selectedBatch.batchId,
          quantity: Number(batchActionQuantity || 0),
          unitType: batchActionUnitType,
          adjustmentType: batchActionMode,
          reasonCode: batchActionReason,
          notes: batchActionNotes || undefined,
        });
      } else if (batchActionMode === 'QUARANTINE') {
        await InventoryAPI.quarantineBatch(selectedBatch.batchId, {
          reasonCode: batchActionReason,
          notes: batchActionNotes || undefined,
        });
      } else {
        await InventoryAPI.releaseBatch(selectedBatch.batchId, {
          reasonCode: batchActionReason,
          notes: batchActionNotes || undefined,
        });
      }

      setIsBatchActionOpen(false);
      setMessage(
        batchActionMode === 'QUARANTINE'
          ? `Batch ${selectedBatch.batchNumber} moved to quarantine.`
          : batchActionMode === 'RELEASE'
          ? `Batch ${selectedBatch.batchNumber} released back to sellable stock.`
          : `Batch ${selectedBatch.batchNumber} updated successfully.`
      );
      setError(null);
      await refreshSelectedMedicine();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to complete batch action.');
      setMessage(null);
    }
  };

  const openOpeningStockEditor = async () => {
    if (!selectedMedicine) {
      return;
    }

    try {
      const supplierRows = await loadSuppliersIfNeeded();
      setOpeningStockDraft(
        createOpeningStockDraft(
          selectedMedicine,
          supplierRows[0]?.supplierId || '',
          supplierRows.length === 0 ? 'Opening Stock Supplier' : ''
        )
      );
      setIsOpeningStockOpen(true);
      setError(null);
      setMessage(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load suppliers.');
      setMessage(null);
    }
  };

  const handleOpeningStockChange = <K extends keyof OpeningStockDraft>(
    key: K,
    value: OpeningStockDraft[K]
  ) => {
    setOpeningStockDraft((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleOpeningStockSubmit = async () => {
    if (!selectedMedicine || !storeId) {
      return;
    }

    if (!openingStockDraft.invoiceNumber.trim()) {
      setError('Enter an invoice number before inwarding opening stock.');
      setMessage(null);
      return;
    }

    if (!openingStockDraft.batchNumber.trim()) {
      setError('Enter a batch number before inwarding opening stock.');
      setMessage(null);
      return;
    }

    if (!openingStockDraft.expiryDate) {
      setError('Choose an expiry date before inwarding opening stock.');
      setMessage(null);
      return;
    }

    if (Number(openingStockDraft.quantity) <= 0) {
      if (Number(openingStockDraft.quantityLoose) <= 0) {
        setError('Opening stock must include at least one pack or loose unit.');
        setMessage(null);
        return;
      }
    }

    if (Number(openingStockDraft.quantity) < 0 || Number(openingStockDraft.quantityLoose) < 0) {
      setError('Opening stock quantities cannot be negative.');
      setMessage(null);
      return;
    }

    try {
      let supplierId = openingStockDraft.supplierId;

      if (!supplierId) {
        const createdSupplier = await PurchaseAPI.createSupplier({
          name: openingStockDraft.newSupplierName.trim() || 'Opening Stock Supplier',
          contact: openingStockDraft.newSupplierContact.trim() || undefined,
          phone: undefined,
          email: undefined,
          gstin: undefined,
          drugLicense: undefined,
          address: 'Created from inventory opening stock',
        });
        supplierId = createdSupplier.supplierId;
        setSuppliers((prev) => [...prev, createdSupplier]);
      }

      const response = await PurchaseAPI.importJson({
        supplierId,
        invoiceNumber: openingStockDraft.invoiceNumber.trim(),
        purchaseDate: formatLocalDateTime(),
        rows: [
          {
            medicineId: selectedMedicine.medicineId,
            batchNumber: openingStockDraft.batchNumber.trim(),
            manufactureDate: openingStockDraft.manufactureDate || undefined,
            expiryDate: openingStockDraft.expiryDate,
            quantity: Number(openingStockDraft.quantity),
            quantityLoose: Number(openingStockDraft.quantityLoose || 0),
            freeQty: Number(openingStockDraft.freeQty || 0),
            freeQtyLoose: Number(openingStockDraft.freeQtyLoose || 0),
            purchaseRate: Number(openingStockDraft.purchaseRate),
            mrp: Number(openingStockDraft.mrp),
            gstRate: Number(openingStockDraft.gstRate),
          },
        ],
      });

      const refreshedShortage = await ReportsAPI.getShortageReport(storeId);
      const refreshedMedicine =
        (await MedicineAPI.search(selectedMedicine.brandName)).find(
          (medicine) => medicine.medicineId === selectedMedicine.medicineId
        ) || selectedMedicine;

      setShortageRows(refreshedShortage);
      setIsOpeningStockOpen(false);
      setMessage(
        `Stock inward completed for ${selectedMedicine.brandName}. ${response.importedRows} row imported into batch ${openingStockDraft.batchNumber}.`
      );
      setError(null);
      await loadStock(refreshedMedicine);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to inward stock.');
      setMessage(null);
    }
  };

  const shortageStrips = useMemo(
    () => shortageRows.reduce((sum, row) => sum + (row.quantityStrips || 0), 0),
    [shortageRows]
  );

  const visibleStockStrips = useMemo(
    () => stockRows.reduce((sum, row) => sum + (row.quantityStrips || 0), 0),
    [stockRows]
  );

  const stockBuckets = useMemo(
    () =>
      stockRows.reduce<Record<string, number>>((acc, row) => {
        acc[row.expiryStatus] = (acc[row.expiryStatus] || 0) + 1;
        return acc;
      }, {}),
    [stockRows]
  );

  const selectedUnitProfile = useMemo(
    () => (selectedMedicine ? getMedicineUnitProfile(selectedMedicine) : null),
    [selectedMedicine]
  );

  const selectedBatch = useMemo(
    () => stockRows.find((row) => row.batchId === selectedBatchId) || null,
    [selectedBatchId, stockRows]
  );

  return (
    <PharmaFlowShell
      embedded={embedded}
      title="Stock and Batch Control"
      description="Check what is available right now, inspect batch-wise stock, and see what needs replenishment before the branch runs short."
    >
      <div className="space-y-5">
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

        <section className="rounded-[2rem] border border-sky-200 bg-gradient-to-r from-sky-50 via-white to-emerald-50 p-6 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[1.15fr,0.85fr]">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
                Inventory Desk
              </div>
              <h2 className="mt-3 text-2xl font-semibold text-slate-950">
                Beginner-friendly stock view for the branch team
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Search a medicine, open its live batches, and use the shortage table to decide what must be reordered.
                It keeps stock, FIFO batches, and reorder risk in one place without overloading the branch staff.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {quickSearches.map((query) => (
                  <button
                    key={query}
                    type="button"
                    onClick={() => void handleSearch(query)}
                    className="rounded-full border border-sky-200 bg-white px-3 py-2 text-sm font-medium text-sky-900"
                  >
                    {query}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-3xl bg-white p-4 shadow-sm">
                <div className="text-xs uppercase tracking-wide text-slate-500">Shortage Items</div>
                <div className="mt-2 text-3xl font-semibold text-slate-950">{shortageRows.length}</div>
                <div className="mt-1 text-sm text-slate-500">Below reorder level right now</div>
              </div>
              <div className="rounded-3xl bg-white p-4 shadow-sm">
                <div className="text-xs uppercase tracking-wide text-slate-500">Selected Stock</div>
                <div className="mt-2 text-3xl font-semibold text-slate-950">{visibleStockStrips}</div>
                <div className="mt-1 text-sm text-slate-500">
                  Visible {selectedUnitProfile?.primaryUnitLabel || 'packs'} in current batch list
                </div>
              </div>
              <div className="rounded-3xl bg-white p-4 shadow-sm">
                <div className="text-xs uppercase tracking-wide text-slate-500">Shortage Stock</div>
                <div className="mt-2 text-3xl font-semibold text-slate-950">{shortageStrips}</div>
                <div className="mt-1 text-sm text-slate-500">Current on-hand pack units in shortage medicines</div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
            <div className="text-sm font-semibold text-emerald-900">Step 1</div>
            <div className="mt-2 text-lg font-semibold text-slate-950">Find the medicine</div>
            <div className="mt-1 text-sm text-slate-600">
              Search by brand, generic, salt, or barcode just like the billing counter.
            </div>
          </div>
          <div className="rounded-3xl border border-sky-200 bg-sky-50 p-5">
            <div className="text-sm font-semibold text-sky-900">Step 2</div>
            <div className="mt-2 text-lg font-semibold text-slate-950">Inspect live batches</div>
            <div className="mt-1 text-sm text-slate-600">
              Check pack quantity, loose units, expiry date, and which batch should move first.
            </div>
          </div>
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
            <div className="text-sm font-semibold text-amber-900">Step 3</div>
            <div className="mt-2 text-lg font-semibold text-slate-950">Act on shortage</div>
            <div className="mt-1 text-sm text-slate-600">
              Use the shortage table to raise a purchase or branch indent before stock runs out.
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Medicine Search</h2>
              <p className="mt-1 text-sm text-slate-500">
                Search the active store inventory exactly the way the counter team searches medicines.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-2 text-sm text-slate-600">
              Active store: {context.storeCode || 'Not selected'}
            </div>
          </div>
          <div className="relative mt-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => handleSearch(event.target.value)}
              placeholder="Search by brand, generic, salt, or barcode"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3"
            />

            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-[58px] z-10 max-h-72 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl">
                {searchResults.map((medicine) => (
                  <button
                    key={medicine.medicineId}
                    type="button"
                    onClick={() => loadStock(medicine)}
                    className="flex w-full items-start justify-between border-b border-slate-100 px-4 py-3 text-left hover:bg-sky-50"
                  >
                    <div>
                      <div className="font-medium">{medicine.brandName}</div>
                      <div className="text-sm text-slate-500">
                        {medicine.genericName} • {medicine.strength} • {medicine.medicineForm}
                      </div>
                    </div>
                    <div className="text-sm text-slate-500">
                      {formatPrimaryQuantity(medicine.currentBatch?.quantityStrips ?? 0, medicine)}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Batch Stock View</h2>
              <p className="mt-1 text-sm text-slate-500">
                {selectedMedicine
                  ? `Viewing stock for ${selectedMedicine.brandName}`
                  : 'Select a medicine above to inspect batch-wise stock.'}
              </p>
            </div>
            {selectedMedicine && (
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                {stockRows.length} batches • {formatPrimaryQuantity(visibleStockStrips, selectedMedicine)}
              </div>
            )}
          </div>

          {selectedMedicine && (
            <div className="mb-4 grid gap-4 lg:grid-cols-[1.15fr,0.85fr]">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-400">Selected medicine</div>
                <div className="mt-2 text-lg font-semibold text-slate-950">{selectedMedicine.brandName}</div>
                <div className="mt-1 text-sm text-slate-500">
                  {selectedMedicine.genericName || 'Generic not available'} • {selectedMedicine.manufacturer || 'Manufacturer not available'}
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-white p-3">
                    <div className="text-xs uppercase tracking-wide text-slate-400">Pack profile</div>
                    <div className="mt-2 font-semibold text-slate-950">
                      {selectedUnitProfile?.packDisplayLabel || selectedMedicine.packSize || 1}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white p-3">
                    <div className="text-xs uppercase tracking-wide text-slate-400">MRP</div>
                    <div className="mt-2 font-semibold text-slate-950">₹{selectedMedicine.mrp.toFixed(2)}</div>
                  </div>
                  <div className="rounded-2xl bg-white p-3">
                    <div className="text-xs uppercase tracking-wide text-slate-400">GST</div>
                    <div className="mt-2 font-semibold text-slate-950">{selectedMedicine.gstRate}%</div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="text-sm font-semibold text-emerald-900">Turn catalog medicine into billable stock</div>
                <div className="mt-2 text-sm leading-6 text-emerald-900">
                  If this medicine came from the uploaded master catalog but has no inward yet, add one batch here.
                  This works for strips, bottles, vials, tubes, and other pack types. Once stock is saved, the same medicine will show in billing for this store.
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={openOpeningStockEditor}
                    disabled={isLoadingSuppliers}
                    className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLoadingSuppliers ? 'Loading suppliers...' : 'Add opening stock'}
                  </button>
                  <Link
                    to="/lifepill/billing"
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700"
                  >
                    Open billing
                  </Link>
                </div>
              </div>
            </div>
          )}

          {selectedMedicine && (
            <div className="mb-4 flex flex-wrap gap-2">
              {Object.entries(stockBuckets).map(([status, count]) => (
                <div
                  key={status}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    expiryBadgeClasses[status] || 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {status.replace('_', ' ')} • {count}
                </div>
              ))}
            </div>
          )}

          {selectedBatch && (
            <div className="mb-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-400">Selected batch</div>
                  <div className="mt-2 text-lg font-semibold text-slate-950">
                    {selectedBatch.batchNumber}
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    {selectedBatch.expiryDate} • {selectedBatch.inventoryState || 'SELLABLE'} •{' '}
                    {selectedMedicine
                      ? `${formatPrimaryQuantity(selectedBatch.quantityStrips, selectedMedicine)} + ${formatSecondaryQuantity(
                          selectedBatch.quantityLoose,
                          selectedMedicine
                        )}`
                      : `${selectedBatch.quantityStrips} / ${selectedBatch.quantityLoose}`}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openBatchAction('ADJUST_ADD')}
                    className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800"
                  >
                    Add stock
                  </button>
                  <button
                    type="button"
                    onClick={() => openBatchAction('ADJUST_REMOVE')}
                    className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-800"
                  >
                    Remove stock
                  </button>
                  <button
                    type="button"
                    onClick={() => openBatchAction('QUARANTINE')}
                    className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800"
                  >
                    Quarantine
                  </button>
                  <button
                    type="button"
                    onClick={() => openBatchAction('RELEASE')}
                    className="rounded-2xl border border-sky-300 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-800"
                  >
                    Release
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-left">Batch</th>
                  <th className="px-3 py-2 text-left">Expiry</th>
                  <th className="px-3 py-2 text-right">{selectedUnitProfile ? selectedUnitProfile.primaryUnitLabel : 'Packs'}</th>
                  <th className="px-3 py-2 text-right">{selectedUnitProfile ? selectedUnitProfile.secondaryUnitLabel : 'Loose'}</th>
                  <th className="px-3 py-2 text-right">MRP</th>
                  <th className="px-3 py-2 text-left">State</th>
                  <th className="px-3 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {stockRows.map((row) => (
                  <tr
                    key={row.batchId}
                    className={`cursor-pointer border-t border-slate-100 hover:bg-sky-50 ${
                      selectedBatchId === row.batchId ? 'bg-sky-50' : ''
                    }`}
                    onClick={() => setSelectedBatchId(row.batchId)}
                  >
                    <td className="px-3 py-3 font-medium">{row.batchNumber}</td>
                    <td className="px-3 py-3">{row.expiryDate}</td>
                    <td className="px-3 py-3 text-right">{row.quantityStrips}</td>
                    <td className="px-3 py-3 text-right">{row.quantityLoose}</td>
                    <td className="px-3 py-3 text-right">₹{row.mrp.toFixed(2)}</td>
                    <td className="px-3 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          inventoryStateClasses[row.inventoryState || 'SELLABLE'] || 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {(row.inventoryState || 'SELLABLE').replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          expiryBadgeClasses[row.expiryStatus] || 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {row.expiryStatus.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
                {!stockRows.length && (
                  <tr>
                    <td colSpan={7} className="px-3 py-10 text-center text-slate-400">
                      {selectedMedicine
                        ? 'No active stock exists yet for this medicine in the selected store. Use Add opening stock above.'
                        : 'Search and select a medicine to open its batch-wise stock.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Batch Movement Ledger</h2>
              <p className="mt-1 text-sm text-slate-500">
                Every sale, return, adjustment, transfer, dump, and quarantine action is tracked here.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-2 text-sm text-slate-600">
              {movements.length} movement{movements.length === 1 ? '' : 's'}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-left">Time</th>
                  <th className="px-3 py-2 text-left">Batch</th>
                  <th className="px-3 py-2 text-left">Movement</th>
                  <th className="px-3 py-2 text-left">Reason</th>
                  <th className="px-3 py-2 text-right">Pack Δ</th>
                  <th className="px-3 py-2 text-right">Loose Δ</th>
                  <th className="px-3 py-2 text-left">State After</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((movement) => (
                  <tr key={movement.movementId} className="border-t border-slate-100">
                    <td className="px-3 py-3">
                      {new Date(movement.createdAt).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-medium text-slate-900">{movement.batchNumber || '—'}</div>
                      <div className="text-xs text-slate-500">{movement.brandName || '—'}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-medium text-slate-900">{movement.movementType.replace(/_/g, ' ')}</div>
                      <div className="text-xs text-slate-500">
                        {movement.actorName || 'System'} • {movement.referenceType || 'Manual'}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div>{movement.reasonCode?.replace(/_/g, ' ') || '—'}</div>
                      {movement.notes && <div className="text-xs text-slate-500">{movement.notes}</div>}
                    </td>
                    <td className="px-3 py-3 text-right">{movement.quantityStripsDelta ?? 0}</td>
                    <td className="px-3 py-3 text-right">{movement.quantityLooseDelta ?? 0}</td>
                    <td className="px-3 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          inventoryStateClasses[movement.inventoryStateAfter || 'SELLABLE'] || 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {(movement.inventoryStateAfter || 'SELLABLE').replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
                {!movements.length && (
                  <tr>
                    <td colSpan={7} className="px-3 py-10 text-center text-slate-400">
                      Select a medicine to inspect recent stock movements.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Shortage Report</h2>
          <p className="mt-1 text-sm text-slate-500">
            Medicines currently below reorder level for this store.
          </p>

          {shortageRows.length > 0 && (
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-900">
                <div className="font-semibold">Critical replenishment list</div>
                <div className="mt-1">These items should be reviewed first for purchasing.</div>
              </div>
              <div className="rounded-2xl bg-sky-50 p-4 text-sm text-sky-900">
                <div className="font-semibold">Branch action</div>
                <div className="mt-1">Raise inward or transfer requests from this list.</div>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900">
                <div className="font-semibold">Manager insight</div>
                <div className="mt-1">Use this view after counter work to confirm reorder-level automation.</div>
              </div>
            </div>
          )}

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-left">Medicine</th>
                  <th className="px-3 py-2 text-left">Generic</th>
                  <th className="px-3 py-2 text-right">Reorder Level</th>
                  <th className="px-3 py-2 text-right">Current pack stock</th>
                  <th className="px-3 py-2 text-right">Loose stock</th>
                </tr>
              </thead>
              <tbody>
                {shortageRows.map((row) => (
                  <tr key={row.medicineId} className="border-t border-slate-100">
                    <td className="px-3 py-3 font-medium">{row.brandName}</td>
                    <td className="px-3 py-3">{row.genericName || '—'}</td>
                    <td className="px-3 py-3 text-right">{row.reorderLevel}</td>
                    <td className="px-3 py-3 text-right">{formatPrimaryQuantity(row.quantityStrips, row)}</td>
                    <td className="px-3 py-3 text-right">{formatSecondaryQuantity(row.quantityLoose, row)}</td>
                  </tr>
                ))}
                {!shortageRows.length && (
                  <tr>
                    <td colSpan={5} className="px-3 py-10 text-center text-slate-400">
                      No shortage items found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <LegacyModal
        open={isOpeningStockOpen}
        onClose={() => setIsOpeningStockOpen(false)}
        title="Add opening stock"
        description="Create a real inward entry for the selected medicine so it immediately becomes available for billing in this store."
        footer={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-slate-500">
              This uses the purchase import service underneath, so the medicine enters stock the same way a real inward does.
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setIsOpeningStockOpen(false)}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleOpeningStockSubmit()}
                className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
              >
                Save stock inward
              </button>
            </div>
          </div>
        }
      >
        <div className="grid gap-4 xl:grid-cols-[1.08fr,0.92fr]">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 text-sm md:col-span-2">
              <span className="font-medium text-slate-700">Supplier</span>
              <select
                value={openingStockDraft.supplierId}
                onChange={(event) => handleOpeningStockChange('supplierId', event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              >
                <option value="">Create quick supplier below</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.supplierId} value={supplier.supplierId}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </label>

            {!openingStockDraft.supplierId && (
              <>
                <label className="space-y-1 text-sm">
                  <span className="font-medium text-slate-700">Quick supplier name</span>
                  <input
                    value={openingStockDraft.newSupplierName}
                    onChange={(event) => handleOpeningStockChange('newSupplierName', event.target.value)}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="font-medium text-slate-700">Supplier contact</span>
                  <input
                    value={openingStockDraft.newSupplierContact}
                    onChange={(event) => handleOpeningStockChange('newSupplierContact', event.target.value)}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  />
                </label>
              </>
            )}

            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Invoice number</span>
              <input
                value={openingStockDraft.invoiceNumber}
                onChange={(event) => handleOpeningStockChange('invoiceNumber', event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Batch number</span>
              <input
                value={openingStockDraft.batchNumber}
                onChange={(event) => handleOpeningStockChange('batchNumber', event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Manufacture date</span>
              <input
                type="date"
                value={openingStockDraft.manufactureDate}
                onChange={(event) => handleOpeningStockChange('manufactureDate', event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Expiry date</span>
              <input
                type="date"
                value={openingStockDraft.expiryDate}
                onChange={(event) => handleOpeningStockChange('expiryDate', event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">
                Quantity ({selectedUnitProfile?.primaryUnitLabel || 'packs'})
              </span>
              <input
                type="number"
                min={0}
                value={openingStockDraft.quantity}
                onChange={(event) => handleOpeningStockChange('quantity', Number(event.target.value))}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">
                Loose quantity ({selectedUnitProfile?.secondaryUnitLabel || 'units'})
              </span>
              <input
                type="number"
                min={0}
                value={openingStockDraft.quantityLoose}
                onChange={(event) => handleOpeningStockChange('quantityLoose', Number(event.target.value))}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">
                Free quantity ({selectedUnitProfile?.primaryUnitLabel || 'packs'})
              </span>
              <input
                type="number"
                min={0}
                value={openingStockDraft.freeQty}
                onChange={(event) => handleOpeningStockChange('freeQty', Number(event.target.value))}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">
                Free loose quantity ({selectedUnitProfile?.secondaryUnitLabel || 'units'})
              </span>
              <input
                type="number"
                min={0}
                value={openingStockDraft.freeQtyLoose}
                onChange={(event) => handleOpeningStockChange('freeQtyLoose', Number(event.target.value))}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Purchase rate</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={openingStockDraft.purchaseRate}
                onChange={(event) => handleOpeningStockChange('purchaseRate', Number(event.target.value))}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">MRP</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={openingStockDraft.mrp}
                onChange={(event) => handleOpeningStockChange('mrp', Number(event.target.value))}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>
            <label className="space-y-1 text-sm md:col-span-2">
              <span className="font-medium text-slate-700">GST rate</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={openingStockDraft.gstRate}
                onChange={(event) => handleOpeningStockChange('gstRate', Number(event.target.value))}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-4">
              <div className="text-sm font-semibold text-sky-950">Inward preview</div>
              <div className="mt-3 space-y-2 text-sm text-sky-900">
                <div>Medicine: <span className="font-semibold">{selectedMedicine?.brandName || 'No medicine selected'}</span></div>
                <div>Batch: <span className="font-semibold">{openingStockDraft.batchNumber || 'Not entered yet'}</span></div>
                <div>Supplier: <span className="font-semibold">{suppliers.find((supplier) => supplier.supplierId === openingStockDraft.supplierId)?.name || openingStockDraft.newSupplierName || 'Quick supplier will be created'}</span></div>
                <div>
                  Total inward:{' '}
                  <span className="font-semibold">
                    {formatPrimaryQuantity(
                      Number(openingStockDraft.quantity || 0) + Number(openingStockDraft.freeQty || 0),
                      selectedMedicine || {}
                    )}
                    {' + '}
                    {formatSecondaryQuantity(
                      Number(openingStockDraft.quantityLoose || 0) + Number(openingStockDraft.freeQtyLoose || 0),
                      selectedMedicine || {}
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <div className="text-sm font-semibold text-slate-950">What happens next</div>
              <div className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                <div>A purchase inward row is created for the selected store.</div>
                <div>The batch becomes visible in stock view immediately.</div>
                <div>The same medicine can then be searched and billed from the counter screen.</div>
              </div>
            </div>
          </div>
        </div>
      </LegacyModal>

      <LegacyModal
        open={isBatchActionOpen}
        onClose={() => setIsBatchActionOpen(false)}
        title={
          batchActionMode === 'QUARANTINE'
            ? 'Quarantine batch'
            : batchActionMode === 'RELEASE'
            ? 'Release batch'
            : batchActionMode === 'ADJUST_ADD'
            ? 'Add stock'
            : 'Remove stock'
        }
        description="Use this operator action when physical stock does not match the system or when a batch needs to be blocked from sale."
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsBatchActionOpen(false)}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleBatchActionSubmit()}
              className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
            >
              Save action
            </button>
          </>
        }
      >
        <div className="grid gap-4 xl:grid-cols-[1.05fr,0.95fr]">
          <div className="grid gap-3 md:grid-cols-2">
            {batchActionMode !== 'QUARANTINE' && batchActionMode !== 'RELEASE' && (
              <>
                <label className="space-y-1 text-sm">
                  <span className="font-medium text-slate-700">Quantity</span>
                  <input
                    type="number"
                    min={0.001}
                    step="0.001"
                    value={batchActionQuantity}
                    onChange={(event) => setBatchActionQuantity(Number(event.target.value))}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="font-medium text-slate-700">Unit</span>
                  <select
                    value={batchActionUnitType}
                    onChange={(event) => setBatchActionUnitType(event.target.value)}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  >
                    <option value="STRIP">{selectedUnitProfile?.primaryUnitLabel || 'Strip'}</option>
                    <option value="TABLET">{selectedUnitProfile?.secondaryUnitLabel || 'Unit'}</option>
                  </select>
                </label>
              </>
            )}

            <label className="space-y-1 text-sm md:col-span-2">
              <span className="font-medium text-slate-700">Reason code</span>
              <input
                type="text"
                value={batchActionReason}
                onChange={(event) => setBatchActionReason(event.target.value.toUpperCase().replace(/\s+/g, '_'))}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>

            <label className="space-y-1 text-sm md:col-span-2">
              <span className="font-medium text-slate-700">Notes</span>
              <textarea
                rows={4}
                value={batchActionNotes}
                onChange={(event) => setBatchActionNotes(event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              />
            </label>
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <div className="text-sm font-semibold text-slate-950">Action preview</div>
              <div className="mt-3 space-y-2 text-sm text-slate-600">
                <div>Batch: <span className="font-semibold text-slate-950">{selectedBatch?.batchNumber || '—'}</span></div>
                <div>Current state: <span className="font-semibold text-slate-950">{selectedBatch?.inventoryState || 'SELLABLE'}</span></div>
                <div>Action: <span className="font-semibold text-slate-950">{batchActionMode.replace(/_/g, ' ')}</span></div>
                {batchActionMode !== 'QUARANTINE' && batchActionMode !== 'RELEASE' && (
                  <div>
                    Quantity:{' '}
                    <span className="font-semibold text-slate-950">
                      {batchActionQuantity} {batchActionUnitType}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <div className="text-sm font-semibold text-slate-950">What gets recorded</div>
              <div className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                <div>The batch ledger stores the stock delta, resulting state, reason code, notes, and operator name.</div>
                <div>Quarantine keeps the batch visible but blocks it from sellable stock queries.</div>
                <div>Release is only allowed when the batch is non-expired and has remaining quantity.</div>
              </div>
            </div>
          </div>
        </div>
      </LegacyModal>
    </PharmaFlowShell>
  );
};

export default InventoryDashboard;
