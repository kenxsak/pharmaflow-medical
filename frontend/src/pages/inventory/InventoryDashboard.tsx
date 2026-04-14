import React, { useEffect, useMemo, useState } from 'react';
import PharmaFlowShell from '../../components/pharmaflow/PharmaFlowShell';
import {
  MedicineAPI,
  MedicineSearchResult,
  ReportsAPI,
  ShortageItemResponse,
  StockBatchResponse,
} from '../../services/api';
import { usePharmaFlowContext } from '../../utils/pharmaflowContext';

const quickSearches = ['8901234500001', 'Dolo 650', 'Mox 500', 'Alprax 0.25'];

const expiryBadgeClasses: Record<string, string> = {
  EXPIRED: 'bg-rose-100 text-rose-700',
  EXPIRY_30: 'bg-amber-100 text-amber-800',
  EXPIRY_60: 'bg-sky-100 text-sky-700',
  EXPIRY_90: 'bg-indigo-100 text-indigo-700',
  OK: 'bg-emerald-100 text-emerald-700',
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!storeId) {
      setShortageRows([]);
      setStockRows([]);
      setSelectedMedicine(null);
      setError('Choose the active store in Company Setup before opening inventory.');
      return;
    }

    ReportsAPI.getShortageReport(storeId)
      .then(setShortageRows)
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load shortage report.');
      });
  }, [storeId]);

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
      const rows = await MedicineAPI.getStock(medicine.medicineId, storeId);
      setSelectedMedicine(medicine);
      setStockRows(rows);
      setSearchResults([]);
      setSearchQuery(medicine.brandName);
      setError(null);
    } catch (stockError) {
      setError(stockError instanceof Error ? stockError.message : 'Unable to load stock.');
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

  return (
    <PharmaFlowShell
      embedded={embedded}
      title="Stock and Batch Control"
      description="Check what is available right now, inspect batch-wise stock, and see what needs replenishment before the branch runs short."
    >
      <div className="space-y-5">
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
                <div className="mt-1 text-sm text-slate-500">Visible strips in current batch list</div>
              </div>
              <div className="rounded-3xl bg-white p-4 shadow-sm">
                <div className="text-xs uppercase tracking-wide text-slate-500">Shortage Strips</div>
                <div className="mt-2 text-3xl font-semibold text-slate-950">{shortageStrips}</div>
                <div className="mt-1 text-sm text-slate-500">Current on-hand strips in shortage medicines</div>
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            {error}
          </div>
        )}

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
              Check strip quantity, loose units, expiry date, and which batch should move first.
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
                      {medicine.currentBatch?.quantityStrips ?? 0} strips
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
                {stockRows.length} batches • {visibleStockStrips} strips
              </div>
            )}
          </div>

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

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-left">Batch</th>
                  <th className="px-3 py-2 text-left">Expiry</th>
                  <th className="px-3 py-2 text-right">Strips</th>
                  <th className="px-3 py-2 text-right">Loose</th>
                  <th className="px-3 py-2 text-right">MRP</th>
                  <th className="px-3 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {stockRows.map((row) => (
                  <tr key={row.batchId} className="border-t border-slate-100">
                    <td className="px-3 py-3 font-medium">{row.batchNumber}</td>
                    <td className="px-3 py-3">{row.expiryDate}</td>
                    <td className="px-3 py-3 text-right">{row.quantityStrips}</td>
                    <td className="px-3 py-3 text-right">{row.quantityLoose}</td>
                    <td className="px-3 py-3 text-right">₹{row.mrp.toFixed(2)}</td>
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
                    <td colSpan={6} className="px-3 py-10 text-center text-slate-400">
                      Search and select a medicine to open its batch-wise stock.
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
                  <th className="px-3 py-2 text-right">Strips</th>
                  <th className="px-3 py-2 text-right">Loose</th>
                </tr>
              </thead>
              <tbody>
                {shortageRows.map((row) => (
                  <tr key={row.medicineId} className="border-t border-slate-100">
                    <td className="px-3 py-3 font-medium">{row.brandName}</td>
                    <td className="px-3 py-3">{row.genericName || '—'}</td>
                    <td className="px-3 py-3 text-right">{row.reorderLevel}</td>
                    <td className="px-3 py-3 text-right">{row.quantityStrips}</td>
                    <td className="px-3 py-3 text-right">{row.quantityLoose}</td>
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
    </PharmaFlowShell>
  );
};

export default InventoryDashboard;
