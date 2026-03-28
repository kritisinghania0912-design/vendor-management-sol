const BASE = '/api';

async function get(path) {
  const res = await fetch(BASE + path);
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}

async function post(path, body) {
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
  return res.json();
}

async function patch(path, body) {
  const res = await fetch(BASE + path, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PATCH ${path} failed: ${res.status}`);
  return res.json();
}

// vp = vendorParam e.g. '?vendorId=V001' or ''
export function makeApi(vp = '') {
  return {
    getDashboard: () => get(`/dashboard${vp}`),
    getVendors: () => get(`/vendors${vp}`),
    getVendor: (id) => get(`/vendors/${id}`),
    getFinance: () => get(`/finance${vp}`),
    getIssues: () => get(`/issues${vp}`),
    createIssue: (body) => post('/issues', body),
    updateIssue: (id, body) => patch(`/issues/${id}`, body),
    // Transport
    getCars: () => get(`/transport/cars${vp}`),
    createCar: (body) => post('/transport/cars', body),
    getDrivers: () => get(`/transport/drivers${vp}`),
    createDriver: (body) => post('/transport/drivers', body),
    getTrips: () => get(`/transport/trips${vp}`),
    createTrip: (body) => post('/transport/trips', body),
    // Food
    getFoodDetails: () => get(`/food/details${vp}`),
    getFoodStaff: () => get(`/food/staff${vp}`),
    createFoodStaff: (body) => post('/food/staff', body),
    getFoodCatalog: () => get(`/food/catalog${vp}`),
    createFoodItem: (body) => post('/food/catalog', body),
    getFoodServices: () => get(`/food/services${vp}`),
    createFoodService: (body) => post('/food/services', body),
    // IT
    getITAssets: () => get(`/it/assets${vp}`),
    createITAsset: (body) => post('/it/assets', body),
    getITSoftware: () => get(`/it/software${vp}`),
    createITSoftware: (body) => post('/it/software', body),
    getITHardware: () => get(`/it/hardware${vp}`),
    createITHardware: (body) => post('/it/hardware', body),
  };
}

// Default unscoped api (for backward compat)
export const api = makeApi('');
