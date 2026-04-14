import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../App';
import { medicines as medApi, billing, customers as custApi } from '../services/api';

export default function POS() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [custQuery, setCustQuery] = useState('');
  const [custResults, setCustResults] = useState([]);
  const [payMode, setPayMode] = useState('CASH');
  const [alert, setAlert] = useState(null);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduleData, setScheduleData] = useState({ patientName: '', patientAge: '', patientAddress: '', doctorName: '', doctorRegNo: '' });
  const [lastInvoice, setLastInvoice] = useState(null);
  const searchRef = useRef();
  const storeId = user?.storeId;

  // Search medicines
  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const t = setTimeout(() => { medApi.search(query, storeId).then(setResults).catch(() => {}); }, 300);
    return () => clearTimeout(t);
  }, [query, storeId]);

  // Search customers
  useEffect(() => {
    if (custQuery.length < 2) { setCustResults([]); return; }
    const t = setTimeout(() => { custApi.search(custQuery).then(setCustResults).catch(() => {}); }, 300);
    return () => clearTimeout(t);
  }, [custQuery]);

  const addToCart = (med) => {
    if (!med.currentBatch) { setAlert({ type: 'error', msg: `${med.brand_name} - OUT OF STOCK` }); return; }
    if (['H', 'H1', 'X'].includes(med.schedule_type)) {
      setAlert({ type: 'warn', msg: `Schedule ${med.schedule_type} drug - ${med.schedule_type === 'H' ? 'Record patient details' : 'Prescription MANDATORY'}` });
      if (med.schedule_type !== 'H') setShowScheduleForm(true);
    }
    const existing = cart.findIndex(c => c.batchId === med.currentBatch.batchId);
    if (existing >= 0) {
      const updated = [...cart]; updated[existing].quantity += 1; setCart(updated);
    } else {
      setCart([...cart, {
        medicineId: med.medicine_id, batchId: med.currentBatch.batchId, batchNumber: med.currentBatch.batchNumber,
        brandName: med.brand_name, genericName: med.generic_name, strength: med.strength,
        quantity: 1, unitType: 'STRIP', mrp: +med.mrp, discountPct: 0, gstRate: +med.gst_rate,
        scheduleType: med.schedule_type, stock: med.currentBatch.quantityStrips, packSize: med.pack_size
      }]);
    }
    setQuery(''); setResults([]); searchRef.current?.focus();
  };

  const updateItem = (idx, field, value) => {
    const updated = [...cart]; updated[idx][field] = value; setCart(updated);
  };

  const removeItem = (idx) => setCart(cart.filter((_, i) => i !== idx));

  const lineTotal = (item) => +(item.mrp * item.quantity * (1 - item.discountPct / 100)).toFixed(2);
  const subtotal = cart.reduce((s, i) => s + lineTotal(i), 0);
  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);

  const handleBill = async () => {
    if (!cart.length) return;
    try {
      const data = {
        customerId: customer?.customer_id, paymentMode: payMode,
        scheduleData, customerState: 'Tamil Nadu',
        items: cart.map(c => ({
          medicineId: c.medicineId, batchId: c.batchId, batchNumber: c.batchNumber,
          quantity: c.quantity, unitType: c.unitType, mrp: c.mrp,
          discountPct: c.discountPct, gstRate: c.gstRate, scheduleData
        }))
      };
      const inv = await billing.createInvoice(data);
      setLastInvoice(inv);
      setCart([]); setCustomer(null); setCustQuery(''); setScheduleData({ patientName: '', patientAge: '', patientAddress: '', doctorName: '', doctorRegNo: '' });
      setAlert({ type: 'success', msg: `Invoice ${inv.invoiceNo || inv.invoice_no} created - Total: Rs.${inv.total_amount}` });
    } catch (err) { setAlert({ type: 'error', msg: err.message }); }
  };

  return (
    <div className="flex gap-4 h-[calc(100vh-7rem)]">
      {/* LEFT: Search + Cart */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Search */}
        <div className="bg-white rounded-lg p-3 shadow mb-3 relative">
          <input ref={searchRef} type="text" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search: Brand / Generic / Salt / Barcode..."
            className="w-full text-lg p-3 border-2 border-indigo-400 rounded-lg" autoFocus />
          {results.length > 0 && (
            <div className="absolute z-20 left-3 right-3 bg-white border rounded-lg shadow-xl mt-1 max-h-72 overflow-y-auto">
              {results.map(m => (
                <div key={m.medicine_id} onClick={() => addToCart(m)}
                  className="p-3 hover:bg-indigo-50 cursor-pointer border-b flex justify-between items-center">
                  <div>
                    <p className="font-bold">{m.brand_name} <span className="text-gray-400 text-xs">{m.strength} {m.medicine_form}</span></p>
                    <p className="text-xs text-gray-500">{m.generic_name} | {m.manufacturer_name || ''}</p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="font-bold text-green-600">Rs.{m.mrp}</p>
                    <p className="text-xs text-gray-500">Stock: {m.totalStock || 0}</p>
                    {m.schedule_type && m.schedule_type !== 'NONE' && (
                      <span className="text-xs bg-red-100 text-red-600 px-1.5 rounded">Sch {m.schedule_type}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alert */}
        {alert && (
          <div className={`p-3 rounded-lg mb-3 flex justify-between text-sm ${alert.type === 'error' ? 'bg-red-100 text-red-700' : alert.type === 'warn' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
            <span>{alert.msg}</span>
            <button onClick={() => setAlert(null)} className="font-bold ml-2">x</button>
          </div>
        )}

        {/* Cart Table */}
        <div className="bg-white rounded-lg shadow flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="p-2 text-left w-8">#</th>
                <th className="p-2 text-left">Medicine</th>
                <th className="p-2 text-center w-20">Qty</th>
                <th className="p-2 text-center w-24">Unit</th>
                <th className="p-2 text-right w-20">MRP</th>
                <th className="p-2 text-center w-16">Disc%</th>
                <th className="p-2 text-right w-24">Total</th>
                <th className="p-2 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item, i) => (
                <tr key={i} className="border-t hover:bg-gray-50">
                  <td className="p-2 text-gray-400">{i + 1}</td>
                  <td className="p-2">
                    <div className="font-medium">{item.brandName}</div>
                    <div className="text-xs text-gray-400">{item.genericName} {item.strength} | Batch: {item.batchNumber}</div>
                  </td>
                  <td className="p-2"><input type="number" value={item.quantity} min={0.5} step={item.unitType === 'TABLET' ? 1 : 0.5}
                    onChange={e => updateItem(i, 'quantity', +e.target.value)} className="w-16 text-center border rounded p-1" /></td>
                  <td className="p-2"><select value={item.unitType} onChange={e => updateItem(i, 'unitType', e.target.value)} className="border rounded p-1 text-xs w-full">
                    <option value="STRIP">Strip</option><option value="TABLET">Tablet</option><option value="ML">ML</option>
                  </select></td>
                  <td className="p-2 text-right">Rs.{item.mrp}</td>
                  <td className="p-2"><input type="number" value={item.discountPct} min={0} max={100}
                    onChange={e => updateItem(i, 'discountPct', +e.target.value)} className="w-14 text-center border rounded p-1" /></td>
                  <td className="p-2 text-right font-bold">Rs.{lineTotal(item).toFixed(2)}</td>
                  <td className="p-2"><button onClick={() => removeItem(i)} className="text-red-500 hover:text-red-700 font-bold">x</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!cart.length && <div className="text-center py-16 text-gray-400"><p className="text-4xl mb-2">💊</p><p>Search and add medicines to bill</p></div>}
        </div>
      </div>

      {/* RIGHT: Customer + Summary + Pay */}
      <div className="w-80 flex flex-col gap-3 shrink-0">
        {/* Customer lookup */}
        <div className="bg-white rounded-lg shadow p-3 relative">
          <input type="text" value={custQuery} onChange={e => { setCustQuery(e.target.value); setCustomer(null); }}
            placeholder="Customer phone / name" className="w-full border rounded-lg p-2 text-sm" />
          {custResults.length > 0 && !customer && (
            <div className="absolute z-10 left-3 right-3 bg-white border rounded shadow-lg mt-1 max-h-40 overflow-y-auto">
              {custResults.map(c => (
                <div key={c.customer_id} onClick={() => { setCustomer(c); setCustQuery(c.name); setCustResults([]); }}
                  className="p-2 hover:bg-indigo-50 cursor-pointer border-b text-sm">
                  <span className="font-medium">{c.name}</span> <span className="text-gray-400">{c.phone}</span>
                  {c.loyalty_points > 0 && <span className="text-amber-600 ml-1">({c.loyalty_points} pts)</span>}
                </div>
              ))}
            </div>
          )}
          {customer && (
            <div className="mt-2 text-xs space-y-1">
              <div className="flex justify-between"><span>Credit Limit:</span><span>Rs.{customer.credit_limit}</span></div>
              <div className="flex justify-between"><span>Balance Due:</span><span className="text-red-600">Rs.{customer.current_balance}</span></div>
              <div className="flex justify-between"><span>Loyalty Points:</span><span className="text-amber-600">{customer.loyalty_points}</span></div>
            </div>
          )}
        </div>

        {/* Schedule H Form */}
        {showScheduleForm && (
          <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 text-sm">
            <h4 className="font-bold text-yellow-800 mb-2">Schedule Drug Details</h4>
            <input placeholder="Patient Name *" value={scheduleData.patientName} onChange={e => setScheduleData({ ...scheduleData, patientName: e.target.value })}
              className="w-full border rounded p-1.5 mb-1.5 text-xs" />
            <div className="flex gap-1.5 mb-1.5">
              <input placeholder="Age" value={scheduleData.patientAge} onChange={e => setScheduleData({ ...scheduleData, patientAge: e.target.value })} className="w-16 border rounded p-1.5 text-xs" />
              <input placeholder="Address" value={scheduleData.patientAddress} onChange={e => setScheduleData({ ...scheduleData, patientAddress: e.target.value })} className="flex-1 border rounded p-1.5 text-xs" />
            </div>
            <input placeholder="Doctor Name *" value={scheduleData.doctorName} onChange={e => setScheduleData({ ...scheduleData, doctorName: e.target.value })}
              className="w-full border rounded p-1.5 mb-1.5 text-xs" />
            <input placeholder="Doctor Reg No" value={scheduleData.doctorRegNo} onChange={e => setScheduleData({ ...scheduleData, doctorRegNo: e.target.value })}
              className="w-full border rounded p-1.5 text-xs" />
            <button onClick={() => setShowScheduleForm(false)} className="text-xs text-indigo-600 mt-1">Close</button>
          </div>
        )}

        {/* Bill Summary */}
        <div className="bg-white rounded-lg shadow p-4 flex-1">
          <h3 className="font-bold text-lg border-b pb-2 mb-3">Bill Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Items</span><span>{totalItems}</span></div>
            <div className="flex justify-between"><span>Subtotal</span><span>Rs.{subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-gray-400"><span>CGST (incl.)</span><span>Rs.{(subtotal * 0.06).toFixed(2)}</span></div>
            <div className="flex justify-between text-gray-400"><span>SGST (incl.)</span><span>Rs.{(subtotal * 0.06).toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-xl border-t pt-2 mt-2">
              <span>TOTAL</span><span className="text-green-600">Rs.{Math.round(subtotal)}</span>
            </div>
          </div>
        </div>

        {/* Payment Mode */}
        <div className="flex gap-2">
          {['CASH', 'UPI', 'CARD', 'CREDIT'].map(m => (
            <button key={m} onClick={() => setPayMode(m)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${payMode === m ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {m}
            </button>
          ))}
        </div>

        {/* Pay Button */}
        <button onClick={handleBill} disabled={!cart.length}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-xl text-lg disabled:opacity-50 transition-colors">
          BILL - Rs.{Math.round(subtotal)}
        </button>
      </div>
    </div>
  );
}
