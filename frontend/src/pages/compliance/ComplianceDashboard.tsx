import React, { useEffect, useMemo, useState } from 'react';
import PharmaFlowShell from '../../components/pharmaflow/PharmaFlowShell';
import { ComplianceAPI, ScheduleRegisterResponse } from '../../services/api';
import { usePharmaFlowContext } from '../../utils/pharmaflowContext';
import { downloadCsv } from '../../utils/exportCsv';

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

const complianceSteps = [
  {
    title: 'Choose month and schedule',
    summary: 'Pick the reporting window first so the register shows the exact compliance period.',
    tone: 'border-sky-200 bg-sky-50 text-sky-900',
  },
  {
    title: 'Review patient and doctor capture',
    summary: 'Show that the system preserves prescription medicine traceability for audits.',
    tone: 'border-amber-200 bg-amber-50 text-amber-900',
  },
  {
    title: 'Export inspector register',
    summary: 'Download the register or narcotic report directly from the filtered result.',
    tone: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  },
];

interface ComplianceDashboardProps {
  embedded?: boolean;
}

const ComplianceDashboard: React.FC<ComplianceDashboardProps> = ({ embedded = false }) => {
  const context = usePharmaFlowContext();
  const today = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [schedule, setSchedule] = useState('');
  const [patientFilter, setPatientFilter] = useState('');
  const [inspectorRows, setInspectorRows] = useState<ScheduleRegisterResponse[]>([]);
  const [narcoticRows, setNarcoticRows] = useState<ScheduleRegisterResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const storeId = context.storeId;

  useEffect(() => {
    if (!storeId) {
      setInspectorRows([]);
      setNarcoticRows([]);
      setError('Choose an active store from Setup to load compliance reports.');
      return;
    }

    setLoading(true);
    setError(null);

    Promise.all([
      ComplianceAPI.getDrugInspectorReport(storeId, month, year, schedule || undefined),
      ComplianceAPI.getNarcoticReport(storeId, month, year),
    ])
      .then(([scheduleEntries, narcoticEntries]) => {
        setInspectorRows(scheduleEntries);
        setNarcoticRows(narcoticEntries);
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load compliance data.');
      })
      .finally(() => setLoading(false));
  }, [month, schedule, storeId, year]);

  const filteredInspectorRows = useMemo(() => {
    const query = patientFilter.trim().toLowerCase();
    if (!query) {
      return inspectorRows;
    }

    return inspectorRows.filter((entry) => {
      const patient = entry.patientName?.toLowerCase() || '';
      const doctor = entry.doctorName?.toLowerCase() || '';
      const medicine = entry.medicineName?.toLowerCase() || '';
      return patient.includes(query) || doctor.includes(query) || medicine.includes(query);
    });
  }, [inspectorRows, patientFilter]);

  const prescriptionAttachedCount = filteredInspectorRows.filter(
    (entry) => entry.prescriptionUrl && entry.prescriptionUrl.trim()
  ).length;

  const exportInspectorReport = () => {
    downloadCsv(
      `drug-inspector-report-${year}-${String(month).padStart(2, '0')}.csv`,
      [
        'Sale Date',
        'Schedule',
        'Medicine',
        'Patient',
        'Doctor',
        'Doctor Reg No',
        'Quantity',
        'Batch',
        'Prescription',
      ],
      filteredInspectorRows.map((entry) => [
        entry.saleDate,
        entry.scheduleType,
        entry.medicineName,
        entry.patientName,
        entry.doctorName,
        entry.doctorRegNo,
        entry.quantitySold,
        entry.batchNumber,
        entry.prescriptionUrl,
      ])
    );
  };

  const exportNarcoticReport = () => {
    downloadCsv(
      `narcotic-report-${year}-${String(month).padStart(2, '0')}.csv`,
      ['Sale Date', 'Medicine', 'Patient', 'Doctor', 'Quantity', 'Batch', 'Prescription'],
      narcoticRows.map((entry) => [
        entry.saleDate,
        entry.medicineName,
        entry.patientName,
        entry.doctorName,
        entry.quantitySold,
        entry.batchNumber,
        entry.prescriptionUrl,
      ])
    );
  };

  return (
    <PharmaFlowShell
      embedded={embedded}
      title="Controlled Drug Compliance"
      description="Monitor Schedule H / H1 / X sales, prescriptions, and monthly narcotic movement."
    >
      <div className="space-y-5">
        <section className="rounded-[2rem] border border-amber-200 bg-gradient-to-r from-amber-50 via-white to-rose-50 p-6 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[1.15fr,0.85fr]">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">
                Compliance Desk
              </div>
              <h2 className="mt-3 text-2xl font-semibold text-slate-950">
                Show regulator-facing controls in one clean screen
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Use this page to prove that controlled medicines are not just billed, but also tracked with patient,
                doctor, prescription, and monthly reporting details. This is one of the strongest differentiators in
                the demo.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-3xl bg-white p-4 shadow-sm">
                <div className="text-xs uppercase tracking-wide text-slate-500">Register Entries</div>
                <div className="mt-2 text-3xl font-semibold text-slate-950">{filteredInspectorRows.length}</div>
                <div className="mt-1 text-sm text-slate-500">Visible for the chosen filter</div>
              </div>
              <div className="rounded-3xl bg-white p-4 shadow-sm">
                <div className="text-xs uppercase tracking-wide text-slate-500">Prescriptions Linked</div>
                <div className="mt-2 text-3xl font-semibold text-slate-950">{prescriptionAttachedCount}</div>
                <div className="mt-1 text-sm text-slate-500">Entries with a stored reference</div>
              </div>
              <div className="rounded-3xl bg-white p-4 shadow-sm">
                <div className="text-xs uppercase tracking-wide text-slate-500">Narcotic Movements</div>
                <div className="mt-2 text-3xl font-semibold text-slate-950">{narcoticRows.length}</div>
                <div className="mt-1 text-sm text-slate-500">Monthly narcotic-specific movements</div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {complianceSteps.map((step, index) => (
            <div key={step.title} className={`rounded-3xl border p-5 ${step.tone}`}>
              <div className="text-sm font-semibold">Step {index + 1}</div>
              <div className="mt-2 text-lg font-semibold text-slate-950">{step.title}</div>
              <div className="mt-1 text-sm leading-6 text-slate-600">{step.summary}</div>
            </div>
          ))}
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Compliance Filters</h2>
              <p className="text-sm text-slate-500">
                Narrow the register by month, year, tracked schedule, or patient-facing search.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-2 text-sm text-slate-600">
              Store: {context.storeCode || 'Not selected'}
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Month</span>
              <select
                value={month}
                onChange={(event) => setMonth(parseInt(event.target.value, 10))}
                className="w-full rounded-2xl border border-slate-300 px-3 py-2"
              >
                {Array.from({ length: 12 }, (_, index) => index + 1).map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Year</span>
              <input
                type="number"
                value={year}
                onChange={(event) => setYear(parseInt(event.target.value, 10) || today.getFullYear())}
                className="w-full rounded-2xl border border-slate-300 px-3 py-2"
              />
            </label>

            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Schedule</span>
              <select
                value={schedule}
                onChange={(event) => setSchedule(event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-3 py-2"
              >
                <option value="">All tracked schedules</option>
                <option value="H">Schedule H</option>
                <option value="H1">Schedule H1</option>
                <option value="X">Schedule X</option>
              </select>
            </label>

            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Search patient / doctor / medicine</span>
              <input
                type="text"
                value={patientFilter}
                onChange={(event) => setPatientFilter(event.target.value)}
                placeholder="Type to filter register"
                className="w-full rounded-2xl border border-slate-300 px-3 py-2"
              />
            </label>
          </div>
        </section>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            {error}
          </div>
        )}

        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Drug Inspector Register</h2>
              <p className="text-sm text-slate-500">
                Exportable monthly sale register for Schedule H / H1 / X medicines.
              </p>
            </div>
            <button
              type="button"
              onClick={exportInspectorReport}
              disabled={!filteredInspectorRows.length}
              className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
            >
              Export CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-left">Sale Date</th>
                  <th className="px-3 py-2 text-left">Schedule</th>
                  <th className="px-3 py-2 text-left">Medicine</th>
                  <th className="px-3 py-2 text-left">Patient</th>
                  <th className="px-3 py-2 text-left">Doctor</th>
                  <th className="px-3 py-2 text-left">Batch</th>
                  <th className="px-3 py-2 text-right">Qty</th>
                  <th className="px-3 py-2 text-left">Prescription</th>
                </tr>
              </thead>
              <tbody>
                {filteredInspectorRows.map((entry) => (
                  <tr key={entry.registerId} className="border-t border-slate-100">
                    <td className="px-3 py-3">{formatDateTime(entry.saleDate)}</td>
                    <td className="px-3 py-3">
                      <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
                        {entry.scheduleType}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-medium">{entry.medicineName}</td>
                    <td className="px-3 py-3">{entry.patientName}</td>
                    <td className="px-3 py-3">{entry.doctorName}</td>
                    <td className="px-3 py-3">{entry.batchNumber}</td>
                    <td className="px-3 py-3 text-right">{entry.quantitySold}</td>
                    <td className="px-3 py-3">
                      {entry.prescriptionUrl ? (
                        <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-700">
                          Attached
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-50 px-2 py-1 text-xs text-amber-700">
                          Missing
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {!loading && !filteredInspectorRows.length && (
                  <tr>
                    <td colSpan={8} className="px-3 py-10 text-center text-slate-400">
                      No compliance entries found for the selected period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Monthly Narcotic Report</h2>
              <p className="text-sm text-slate-500">
                Focused monthly register for medicines flagged as narcotics.
              </p>
            </div>
            <button
              type="button"
              onClick={exportNarcoticReport}
              disabled={!narcoticRows.length}
              className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
            >
              Export CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-left">Sale Date</th>
                  <th className="px-3 py-2 text-left">Medicine</th>
                  <th className="px-3 py-2 text-left">Patient</th>
                  <th className="px-3 py-2 text-left">Doctor</th>
                  <th className="px-3 py-2 text-left">Batch</th>
                  <th className="px-3 py-2 text-right">Qty</th>
                </tr>
              </thead>
              <tbody>
                {narcoticRows.map((entry) => (
                  <tr key={entry.registerId} className="border-t border-slate-100">
                    <td className="px-3 py-3">{formatDateTime(entry.saleDate)}</td>
                    <td className="px-3 py-3 font-medium">{entry.medicineName}</td>
                    <td className="px-3 py-3">{entry.patientName}</td>
                    <td className="px-3 py-3">{entry.doctorName}</td>
                    <td className="px-3 py-3">{entry.batchNumber}</td>
                    <td className="px-3 py-3 text-right">{entry.quantitySold}</td>
                  </tr>
                ))}
                {!loading && !narcoticRows.length && (
                  <tr>
                    <td colSpan={6} className="px-3 py-10 text-center text-slate-400">
                      No narcotic entries found for this month.
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

export default ComplianceDashboard;
