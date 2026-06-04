# Kopickup POS & Operational Dashboard

**Purpose**: Kopickup is a Point of Sale (POS) and operational dashboard for a coffee pickup truck business built on Google Apps Script and Google Sheets.

## Toolchain & Stack

- **Backend/Frontend**: Google Apps Script (HTML Service)
- **Database**: Google Sheets
- **Styling**: Tailwind CSS (via CDN)
- **Deployment**: `@google/clasp`

## Canonical Commands

- **Push to Apps Script**: `clasp push`
- **Deploy**: Managed via Google Apps Script Editor (Deploy > New Deployment)

## Key Documentation

- [README.md](README.md) - Project overview and getting started guide.
- [PRD.md](PRD.md) - Product Requirements, Personas, and User Flows.
- [DESIGN.md](DESIGN.md) - Brand Identity, Visual Style, and UI/UX Design System.
- [TECHNICAL.md](TECHNICAL.md) - System Architecture, Database Schema, and API Endpoints.

## Important Rules & Warnings

- **Role Validation**: Enforced on both client and server sides (Owner vs Cashier).
- **Data Minimization**: Avoid saving PII or unnecessary customer data.
- **Audit Logs**: All critical actions (logins, refunds, price/stock changes) must be logged immutably in the `audit_logs` sheet.
- **Secrets**: Do not hardcode sheet IDs or secrets in the codebase; use Apps Script Properties.
