import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { compliance } from '../services/api';

export default function Compliance() {
  const { user } = useAuth();
  const [tab, setTab] = useState('register');
  const [data, setData] = useState([]);
  const [report, setReport] = useState(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [schedule, setSchedule] = useState('');
  const storeId = user?.storeId;

  useEffect(() => {
    if (tab === 'register') compliance.scheduleRegister(storeId, '', '', schedule).then(setData).catch(() => {});
    if (tab === 'narcotic') compliance.narcoticRegister(storeId).then(setData).catch(() => {});
    if (tab === 'audit') compliance.pharmacistLog(storeId).then(setData).catch(() => {});
  }, [tab, storeId, schedule]);

  const loadDrugInspectorReport = () => {
    compliance.drugInspectorReport(storeId, month, year).then(setReport).catch(() => {});
  };

  const tabs = [
    { id: 'register', label: 'Schedule H/H1/X Register' },
    { id: 'inspector', label: 'Drug Inspector Report' },
    { id: 'narcotic', label: 'Narcotic Register' },
    { id: 'audit', label: 'Pharmacist Audit Trail' },
  ];

  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === t.id ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'register' && (
        <div>
          <div className="flex gap-2 mb-4">
            {['', 'H', 'H1', 'X'].map(s => (
              <button key={s} onClick={() => setSchedule(s)}
                className={`px-3 py-1.5 rounded text-xs font-medium ${schedule === s ? 'bg-red-600 text-white' : 'bg-white text-gray-600'}`}>
                {s || 'All'}
              </button>
            ))}
          </div>
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr><th className="p-2 text-left">Date</th><th className="p-2 text-left">Invoice</th><th className="p-2 text-left">Medicine</th>
                  <th className="p-2">Schedule</th><th className="p-2 text-left">Patient</th><th className="p-2 text-left">Doctor</th>
                  <th className="p-2 text-right">Qty</th><th className="p-2 text-left">Pharmacist</th><th className="p-2">Rx</th></tr>
              </thead>
              <tbody>{data.map((r, i) => (
                <tr key={i} className="border-t hover:bg-gray-50">
                  <td className="p-2">{new Date(r.sale_date).toLocaleDateString('en-IN')}</td>
                  <td className="p-2 text-indigo-600">{r.invoice_no}</td>
                  <td className="p-2"><div className="font-medium">{r.brand_name}</div><div className="text-xs text-gray-400">{r.generic_name} {r.strength}</div></td>
                  <td className="p-2 text-center"><span className={`px-2 py-0.5 rounded text-xs font-bold ${r.schedule_type === 'X' ? 'bg-red-100 text-red-600' : r.schedule_type === 'H1' ? 'bg-orange-100 text-orange-600' : 'bg-yellow-100 text-yellow-600'}`}>{r.schedule_type}</span></td>
                  <td className="p-2"><div>{r.patient_name}</div><div className="text-xs text-gray-400">Age: {r.patient_age || '-'}</div></td>
                  <td className="p-2"><div>{r.doctor_name}</div><div className="text-xs text-gray-400">{r.doctor_reg_no || ''}</div></td>
                  <td className="p-2 text-right">{r.quantity_sold}</td>
                  <td className="p-2 text-xs">{r.pharmacist_name}<br/><span className="text-gray-400">{r.pharmacist_reg_no}</span></td>
                  <td className="p-2 text-center">{r.prescription_url ? <a href={r.prescription_url} target="_blank" className="text-indigo-600 underline">View</a> : '-'}</td>
                </tr>
              ))}</tbody>
            </table>
            {!data.length && <div className="p-8 text-center text-gray-400">No records found</div>}
          </div>
        </div>
      )}

      {tab === 'inspector' && (
        <div>
          <div className="bg-white rounded-lg shadow p-4 mb-4 flex items-end gap-4">
            <div><label className="text-xs text-gray-500 block">Month</label>
              <select value={month} onChange={e => setMonth(+e.target.value)} className="border rounded p-2">
                {Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1}>{new Date(2000, i).toLocaleString('en', { month: 'long' })}</option>)}
              </select></div>
            <div><label className="text-xs text-gray-500 block">Year</label>
              <select value={year} onChange={e => setYear(+e.target.value)} className="border rounded p-2">
                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
              </select></div>
            <button onClick={loadDrugInspectorReport} className="bg-indigo-600 text-white px-4 py-2 rounded font-medium">Generate Report</button>
          </div>
          {report && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold">DRUG INSPECTOR REPORT</h2>
                <p className="text-gray-500">{report.store?.store_name} | DL: {report.store?.drug_license_no} | GSTIN: {report.store?.gstin}</p>
                <p className="text-sm text-gray-400">Period: {report.period?.from} to {report.period?.to}</p>
              </div>
              {report.summary?.map((s, i) => (
                <div key={i} className="mb-2 text-sm"><span className="font-bold">Schedule {s.schedule_type}:</span> {s.total_entries} entries, Total Qty: {s.total_qty}</div>
              ))}
              <table className="w-full text-xs mt-4">
                <thead className="bg-gray-100"><tr><th className="p-2 text-left">Date</th><th className="p-2">Invoice</th><th className="p-2 text-left">Medicine</th><th className="p-2">Sch</th><th className="p-2 text-left">Patient</th><th className="p-2 text-left">Doctor</th><th className="p-2">Qty</th><th className="p-2">Pharmacist</th></tr></thead>
                <tbody>{report.entries?.map((r, i) => (
                  <tr key={i} className="border-t"><td className="p-2">{new Date(r.sale_date).toLocaleDateString('en-IN')}</td>
                    <td className="p-2">{r.invoice_no}</td><td className="p-2">{r.brand_name} {r.strength}</td>
                    <td className="p-2 text-center font-bold">{r.schedule_type}</td><td className="p-2">{r.patient_name} ({r.patient_age || '-'})</td>
                    <td className="p-2">{r.doctor_name} {r.doctor_reg_no ? `(${r.doctor_reg_no})` : ''}</td>
                    <td className="p-2 text-center">{r.quantity_sold}</td><td className="p-2">{r.pharmacist_name}</td></tr>
                ))}</tbody>
              </table>
              <div className="mt-4 text-right text-xs text-gray-400">Generated: {new Date(report.generatedAt).toLocaleString('en-IN')} by {report.generatedBy}</div>
              <button onClick={() => window.print()} className="mt-4 bg-gray-800 text-white px-4 py-2 rounded text-sm no-print">Print Report</button>
            </div>
          )}
        </div>
      )}

      {tab === 'narcotic' && (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <h3 className="p-4 font-bold text-red-700 border-b">Narcotic Drug Sales Register</h3>
          <table className="w-full text-sm">
            <thead className="bg-red-50"><tr><th className="p-2 text-left">Date</th><th className="p-2">Invoice</th><th className="p-2 text-left">Medicine</th><th className="p-2 text-left">Patient</th><th className="p-2 text-left">Doctor</th><th className="p-2 text-right">Qty</th><th className="p-2">Batch</th></tr></thead>
            <tbody>{data.map((r, i) => (
              <tr key={i} className="border-t"><td className="p-2">{new Date(r.sale_date).toLocaleDateString('en-IN')}</td>
                <td className="p-2">{r.invoice_no}</td><td className="p-2 font-medium">{r.brand_name} {r.strength}</td>
                <td className="p-2">{r.patient_name}</td><td className="p-2">{r.doctor_name}</td>
                <td className="p-2 text-right">{r.quantity_sold}</td><td className="p-2">{r.batch_number}</td></tr>
            ))}</tbody>
          </table>
          {!data.length && <div className="p-8 text-center text-gray-400">No narcotic sales recorded</div>}
        </div>
      )}

      {tab === 'audit' && (
        <div className="bg-white rounded-lg shadow">
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr><th className="p-2 text-left">Time</th><th className="p-2 text-left">User</th><th className="p-2">Role</th><th className="p-2 text-left">Action</th><th className="p-2">Entity</th></tr></thead>
            <tbody>{data.map((r, i) => (
              <tr key={i} className="border-t"><td className="p-2 text-xs">{new Date(r.created_at).toLocaleString('en-IN')}</td>
                <td className="p-2"><div className="font-medium">{r.full_name}</div><div className="text-xs text-gray-400">{r.pharmacist_reg_no || ''}</div></td>
                <td className="p-2 text-center"><span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{r.role_name}</span></td>
                <td className="p-2">{r.action}</td><td className="p-2 text-center text-xs">{r.entity_type}</td></tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
