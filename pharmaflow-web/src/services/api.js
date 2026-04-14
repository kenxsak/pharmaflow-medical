const BASE = '/api';

function getHeaders() {
  const token = localStorage.getItem('pf_token');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

async function request(url, opts = {}) {
  const res = await fetch(`${BASE}${url}`, { ...opts, headers: { ...getHeaders(), ...opts.headers } });
  if (res.status === 401) { localStorage.removeItem('pf_token'); window.location.href = '/login'; return; }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const auth = {
  login: (username, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  me: () => request('/auth/me'),
  users: (storeId) => request(`/auth/users?storeId=${storeId || ''}`),
  roles: () => request('/auth/roles'),
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
};

export const medicines = {
  search: (q, storeId) => request(`/medicines/search?q=${encodeURIComponent(q)}&storeId=${storeId || ''}`),
  get: (id) => request(`/medicines/${id}`),
  substitutes: (id) => request(`/medicines/${id}/substitutes`),
  create: (data) => request('/medicines', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/medicines/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

export const billing = {
  calculate: (items, customerState) => request('/billing/calculate', { method: 'POST', body: JSON.stringify({ items, customerState }) }),
  createInvoice: (data) => request('/billing/invoice', { method: 'POST', body: JSON.stringify(data) }),
  getInvoice: (id) => request(`/billing/invoice/${id}`),
  listInvoices: (storeId, from, to) => request(`/billing/invoices?storeId=${storeId || ''}&from=${from || ''}&to=${to || ''}`),
  createReturn: (data) => request('/billing/return', { method: 'POST', body: JSON.stringify(data) }),
  creditNotes: (storeId) => request(`/billing/credit-notes?storeId=${storeId || ''}`),
  cancelInvoice: (id, reason) => request(`/billing/cancel/${id}`, { method: 'POST', body: JSON.stringify({ reason }) }),
};

export const inventory = {
  stock: (storeId, medicineId) => request(`/inventory/stock?storeId=${storeId || ''}&medicineId=${medicineId || ''}`),
  expiryAlerts: (storeId) => request(`/inventory/expiry-alerts?storeId=${storeId || ''}`),
  shortage: (storeId) => request(`/inventory/shortage?storeId=${storeId || ''}`),
  transfer: (data) => request('/inventory/transfer', { method: 'POST', body: JSON.stringify(data) }),
  receiveTransfer: (id) => request(`/inventory/transfer/${id}/receive`, { method: 'PUT' }),
  transfers: (storeId) => request(`/inventory/transfers?storeId=${storeId || ''}`),
  addBatch: (data) => request('/inventory/batch', { method: 'POST', body: JSON.stringify(data) }),
};

export const compliance = {
  scheduleRegister: (storeId, from, to, schedule) => request(`/compliance/schedule-register?storeId=${storeId || ''}&from=${from || ''}&to=${to || ''}&schedule=${schedule || ''}`),
  drugInspectorReport: (storeId, month, year) => request(`/compliance/drug-inspector-report?storeId=${storeId || ''}&month=${month}&year=${year}`),
  narcoticRegister: (storeId) => request(`/compliance/narcotic-register?storeId=${storeId || ''}`),
  patientHistory: (customerId) => request(`/compliance/patient-history/${customerId}`),
  pharmacistLog: (storeId, from, to) => request(`/compliance/pharmacist-log?storeId=${storeId || ''}&from=${from || ''}&to=${to || ''}`),
};

export const customers = {
  search: (q) => request(`/customers/search?q=${encodeURIComponent(q)}`),
  get: (id) => request(`/customers/${id}`),
  create: (data) => request('/customers', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  payment: (id, amount) => request(`/customers/${id}/payment`, { method: 'POST', body: JSON.stringify({ amount }) }),
  redeemPoints: (id, points) => request(`/customers/${id}/redeem-points`, { method: 'POST', body: JSON.stringify({ points }) }),
  outstanding: (storeId) => request(`/customers/credit/outstanding?storeId=${storeId || ''}`),
};

export const reports = {
  gstr1: (storeId, month, year) => request(`/reports/gstr1?storeId=${storeId || ''}&month=${month}&year=${year}`),
  gstr3b: (storeId, month, year) => request(`/reports/gstr3b?storeId=${storeId || ''}&month=${month}&year=${year}`),
  dailySales: (storeId, date) => request(`/reports/daily-sales?storeId=${storeId || ''}&date=${date || ''}`),
  topSelling: (storeId, days) => request(`/reports/top-selling?storeId=${storeId || ''}&days=${days || 30}`),
  slowMoving: (storeId) => request(`/reports/slow-moving?storeId=${storeId || ''}`),
  profitByMfr: (storeId, days) => request(`/reports/profit-by-manufacturer?storeId=${storeId || ''}&days=${days || 30}`),
  profitByCat: (storeId, days) => request(`/reports/profit-by-category?storeId=${storeId || ''}&days=${days || 30}`),
  expiryLoss: (storeId) => request(`/reports/expiry-loss?storeId=${storeId || ''}`),
  storeComparison: (days) => request(`/reports/store-comparison?days=${days || 30}`),
  exportData: (storeId, from, to) => request(`/reports/export?storeId=${storeId || ''}&from=${from || ''}&to=${to || ''}`),
};

export const stores = {
  list: () => request('/stores'),
  get: (id) => request(`/stores/${id}`),
  create: (data) => request('/stores', { method: 'POST', body: JSON.stringify(data) }),
  dashboard: (id) => request(`/stores/${id}/dashboard`),
  auditLog: (id) => request(`/stores/${id}/audit-log`),
};

export const purchase = {
  createOrder: (data) => request('/purchase/order', { method: 'POST', body: JSON.stringify(data) }),
  receiveOrder: (id) => request(`/purchase/order/${id}/receive`, { method: 'PUT' }),
  orders: (storeId) => request(`/purchase/orders?storeId=${storeId || ''}`),
  suppliers: () => request('/purchase/suppliers'),
  createSupplier: (data) => request('/purchase/suppliers', { method: 'POST', body: JSON.stringify(data) }),
  schemes: () => request('/purchase/schemes'),
  createScheme: (data) => request('/purchase/schemes', { method: 'POST', body: JSON.stringify(data) }),
  importCsv: (file, storeId, supplierId) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('storeId', storeId);
    formData.append('supplierId', supplierId);
    const token = localStorage.getItem('pf_token');
    return fetch(`${BASE}/purchase/import-csv`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData }).then(r => r.json());
  },
};

export const delivery = {
  create: (data) => request('/delivery', { method: 'POST', body: JSON.stringify(data) }),
  list: (storeId, status) => request(`/delivery?storeId=${storeId || ''}&status=${status || ''}`),
  assign: (id, deliveryBoyId) => request(`/delivery/${id}/assign`, { method: 'PUT', body: JSON.stringify({ deliveryBoyId }) }),
  updateStatus: (id, status, amountCollected) => request(`/delivery/${id}/status`, { method: 'PUT', body: JSON.stringify({ status, amountCollected }) }),
};
