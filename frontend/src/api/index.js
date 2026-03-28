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

export const api = {
  getDashboard: () => get('/dashboard'),
  getVendors: () => get('/vendors'),
  getVendor: (id) => get(`/vendors/${id}`),
  getFinance: () => get('/finance'),
  getIssues: () => get('/issues'),
  createIssue: (body) => post('/issues', body),
  updateIssue: (id, body) => patch(`/issues/${id}`, body),
  // Transport
  getCars: () => get('/transport/cars'),
  createCar: (body) => post('/transport/cars', body),
  getDrivers: () => get('/transport/drivers'),
  createDriver: (body) => post('/transport/drivers', body),
  getTrips: () => get('/transport/trips'),
  createTrip: (body) => post('/transport/trips', body),
  // Food
  getFoodDetails: () => get('/food/details'),
  getFoodStaff: () => get('/food/staff'),
  createFoodStaff: (body) => post('/food/staff', body),
  getFoodCatalog: () => get('/food/catalog'),
  createFoodItem: (body) => post('/food/catalog', body),
  getFoodServices: () => get('/food/services'),
  createFoodService: (body) => post('/food/services', body),
  // IT
  getITAssets: () => get('/it/assets'),
  createITAsset: (body) => post('/it/assets', body),
  getITSoftware: () => get('/it/software'),
  createITSoftware: (body) => post('/it/software', body),
  getITHardware: () => get('/it/hardware'),
  createITHardware: (body) => post('/it/hardware', body),
};
