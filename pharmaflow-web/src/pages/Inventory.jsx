import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { inventory } from '../services/api';

export default function Inventory() {
  const { user } = useAuth();
  const [tab, setTab] = useState('expiry');
  const [expiry, setExpiry] = useState(null);
  const [shortage, setShortage] = useState([]);
  const [stock, setStock] = useState([]);
  const storeId = user?.storeId;

  useEffect(() => {
    if (tab === 'expiry') inventory.expiryAlerts(storeId).then(setExpiry).catch(() => {});
    if (tab === 'shortage') inventory.shortage(storeId).then(setShortage).catch(() => {});
    if (tab === 'stock') inventory.stock(storeId).then(setStock).catch(() => {});
  }, [tab, storeId]);

  const tabs = [
    { id: 'expiry', label: 'Expiry Alerts' },
    { id: 'shortage', label: 'Shortage Report' },
    { id: 'stock', label: 'All Stock' },
  ];

  const ExpirySection = ({ title, items, color }) => (
    items?.length > 0 && (
      <div className={`bg-${color}-50 border border-${color}-200 rounded-lg p-4 mb-4`}>
        <h3 className={`text-${color}-800 font-bold mb-3`}>{title} ({items.length})</h3>
        <table className="w-full text-sm">
          <thead><tr className={`text-${color}-600`}><th className="text-left p-1">Medicine</th><th className="text-left p-1">Batch</th><th className="p-1">Expiry</th><th className="text-right p-1">Qty</th><th className="text-right p-1">Value</th></tr></thead>
          <tbody>{items.map((r, i) => (
            <tr key={i} className="border-t"><td className="p-1 font-medium">{r.brand_name}</td><td className="p-1">{r.batch_number}</td>
              <td className="p-1">{new Date(r.expiry_date).toLocaleDateString('en-IN')}</td>
              <td className="p-1 text-right">{r.quantity_strips}</td>
              <td className="p-1 text-right">Rs.{(r.quantity_strips * r.mrp).toFixed(0)}</td></tr>
          ))}</tbody>
        </table>
      </div>
    )
  );

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === t.id ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'expiry' && expiry && (
        <div>
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="bg-red-100 rounded-lg p-4 text-center"><div className="text-2xl font-bold text-red-600">{expiry.summary?.expired || 0}</div><div className="text-xs text-red-500">Expired</div></div>
            <div className="bg-orange-100 rounded-lg p-4 text-center"><div className="text-2xl font-bold text-orange-600">{expiry.summary?.expiring30 || 0}</div><div className="text-xs text-orange-500">30 Days</div></div>
            <div className="bg-yellow-100 rounded-lg p-4 text-center"><div className="text-2xl font-bold text-yellow-600">{expiry.summary?.expiring60 || 0}</div><div className="text-xs text-yellow-500">60 Days</div></div>
            <div className="bg-blue-100 rounded-lg p-4 text-center"><div className="text-2xl font-bold text-blue-600">{expiry.summary?.expiring90 || 0}</div><div className="text-xs text-blue-500">90 Days</div></div>
          </div>
          {expiry.totalExpiredValue > 0 && <p className="text-red-600 font-bold mb-4">Total Expired Stock Value: Rs.{expiry.totalExpiredValue.toFixed(0)}</p>}
          <ExpirySection title="EXPIRED - Remove Immediately" items={expiry.expired} color="red" />
          <ExpirySection title="Expiring in 30 Days" items={expiry.expiring30Days} color="orange" />
          <ExpirySection title="Expiring in 60 Days" items={expiry.expiring60Days} color="yellow" />
          <ExpirySection title="Expiring in 90 Days" items={expiry.expiring90Days} color="blue" />
        </div>
      )}

      {tab === 'shortage' && (
        <div className="bg-white rounded-lg shadow">
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr><th className="p-3 text-left">Medicine</th><th className="p-3 text-left">Manufacturer</th><th className="p-3 text-right">Current Stock</th><th className="p-3 text-right">Reorder Level</th><th className="p-3 text-right">Deficit</th></tr></thead>
            <tbody>{shortage.map((r, i) => (
              <tr key={i} className="border-t hover:bg-gray-50">
                <td className="p-3"><div className="font-medium">{r.brand_name}</div><div className="text-xs text-gray-400">{r.generic_name}</div></td>
                <td className="p-3 text-gray-500">{r.manufacturer_name}</td>
                <td className="p-3 text-right"><span className={+r.total_strips === 0 ? 'text-red-600 font-bold' : 'text-orange-600'}>{r.total_strips}</span></td>
                <td className="p-3 text-right">{r.reorder_level}</td>
                <td className="p-3 text-right text-red-600 font-bold">{r.reorder_level - r.total_strips}</td>
              </tr>
            ))}</tbody>
          </table>
          {!shortage.length && <div className="p-8 text-center text-gray-400">All items above reorder level</div>}
        </div>
      )}

      {tab === 'stock' && (
        <div className="bg-white rounded-lg shadow">
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr><th className="p-3 text-left">Medicine</th><th className="p-3">Batch</th><th className="p-3">Expiry</th><th className="p-3 text-right">Strips</th><th className="p-3 text-right">Loose</th><th className="p-3 text-right">MRP</th><th className="p-3">Status</th></tr></thead>
            <tbody>{stock.map((r, i) => (
              <tr key={i} className="border-t hover:bg-gray-50">
                <td className="p-3"><div className="font-medium">{r.brand_name}</div><div className="text-xs text-gray-400">{r.generic_name}</div></td>
                <td className="p-3 text-center">{r.batch_number}</td>
                <td className="p-3 text-center">{new Date(r.expiry_date).toLocaleDateString('en-IN')}</td>
                <td className="p-3 text-right">{r.quantity_strips}</td>
                <td className="p-3 text-right">{r.quantity_loose}</td>
                <td className="p-3 text-right">Rs.{r.mrp}</td>
                <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded ${r.expiry_status === 'EXPIRED' ? 'bg-red-100 text-red-600' : r.expiry_status.startsWith('EXPIRY') ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'}`}>{r.expiry_status}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
