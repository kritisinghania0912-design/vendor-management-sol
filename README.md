# Vendor Management System (VMS)

A full-stack web application for managing vendors across Transport, Food, and IT categories. Supports role-based access for admins and individual vendors.

## Tech Stack

- **Frontend**: React 18 + Vite (port 3000)
- **Backend**: Node.js + Express (port 5000)
- **Data**: CSV files (no database required)

## Prerequisites

- Node.js 18+
- npm

## Running Locally

**1. Start the backend**

```bash
cd backend
npm install
node index.js
```

The API will be available at `http://localhost:5000`.

**2. Start the frontend**

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

> Both servers must be running simultaneously. The frontend proxies `/api` requests to the backend automatically.

## Demo Accounts

| Role | Email | Password | Vendor |
|------|-------|----------|--------|
| Admin | admin@vendorsecure.com | Admin@123 | — |
| Vendor | ops@swiftcabs.com | Swift@123 | SwiftCabs (Transport) |
| Vendor | ops@cityride.com | City@123 | CityRide (Transport) |
| Vendor | ops@greenleaf.com | Green@123 | GreenLeaf Catering (Food) |
| Vendor | helpdesk@techcore.com | Tech@123 | TechCore Systems (IT) |

## Features

- **Dashboard** — KPI cards, recent issues, invoice summary, vendor breakdown
- **Issues** — Compliance ticket tracking with risk levels and status filters
- **Pulse** — Live operational data (trip logs, food service records, software/hardware usage)
- **Registry** — Static asset and personnel records (vehicles, drivers, food staff, IT assets)

## Role-Based Access

- **Admin** sees all vendors' data and can raise issues
- **Vendor** sees only their own data, filtered automatically by vendor ID

## Project Structure

```
VMS2/
├── backend/
│   ├── index.js          # Express API server
│   └── data/             # CSV data files (14 files)
└── frontend/
    ├── src/
    │   ├── api/          # API client factory
    │   ├── components/   # Shared UI components
    │   ├── context/      # Auth context
    │   ├── pages/        # Page components
    │   └── utils/        # Badge renderers
    └── vite.config.js
```
