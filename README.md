# Kopickup POS & Operational Dashboard ☕🛻

Kopickup is a simple, fast, and easy-to-use Point of Sale (POS) and operational dashboard designed specifically for a coffee pickup truck business. Built for micro, small, and medium enterprises (MSMEs), it helps owners and cashiers manage daily sales, track inventory, and monitor business performance efficiently.

## 📖 Documentation

For detailed project specifications, please refer to the following files:

- [**PRD.md**](PRD.md) - Product Requirements Document (Features, Personas, User Flows).
- [**DESIGN.md**](DESIGN.md) - Brand Identity, Visual Style, and UI/UX Design System.
- [**TECHNICAL.md**](TECHNICAL.md) - System Architecture, Database Schema, and API Endpoints.

## ✨ Key Features

- 🔐 **Role-Based Access Control**: Dedicated access levels for Owners (Full Access) and Cashiers/Baristas (POS and Shift only).
- 🛒 **Fast POS & Cart System**: Quickly add items, calculate totals, and process cash/non-cash payments.
- 📦 **Inventory Management**: Automatic stock deduction upon successful transactions and manual adjustment logging.
- ⏰ **Shift Management**: Track opening and closing cash balances to identify discrepancies easily.
- 📊 **Management Dashboard**: Real-time insights into daily sales, top-selling products, and peak hours.
- 📝 **Comprehensive Audit Logs**: Keep track of critical actions like logins, refunds, price changes, and stock adjustments.

## 🛠️ Tech Stack

Kopickup is built entirely within the Google Workspace ecosystem for quick deployment, reliability, and zero hosting costs during the MVP phase.

- **Backend & API Layer**: Google Apps Script
- **Frontend / UI**: Google Apps Script HTML Service, Vanilla JavaScript, Tailwind CSS (CDN)
- **Database**: Google Sheets
- **Storage**: uploadthing.com

## 🏗️ Architecture Summary

```text
User ➔ Google Apps Script Web App ➔ Role Middleware ➔ Business Logic ➔ Google Sheets DB
```

The application utilizes Server-Side HTML rendering for initial loads (like login) and Client-Side Rendering (CSR) for dynamic interfaces like the POS dashboard to ensure fast and responsive interactions.

## 🎨 Brand & Design Identity

- **Design Direction**: Ethnic Rustic Coffee Truck (Warm, Artisan, Local Culture)
- **Primary Colors**: Coffee Brown (`#4B2E24`), Dark Espresso (`#231815`), Cream Latte (`#F2E8D8`)
- **Typography**: Cormorant Garamond (Brand & Headings) paired with Poppins (UI & Body text)
- **Vibe**: Community-focused, creative, and authentic.

## 🚀 Getting Started

To deploy this project to your own Google Workspace environment:

1. **Clone this repository** to your local machine.
2. **Install clasp** (Command Line Apps Script Projects) globally:
   ```bash
   npm install -g @google/clasp
   clasp login
   ```
3. **Create a new Google Apps Script project**:
   ```bash
   clasp create --type webapp --title "Kopickup POS"
   ```
4. **Push the code to Apps Script**:
   ```bash
   clasp push
   ```
5. **Set up the Google Sheets Database**:
   - Create a new Google Sheet.
   - Create the necessary tabs: `users`, `products`, `shifts`, `transactions`, `transaction_items`, and `audit_logs` (Refer to `TECHNICAL.md` for schemas).
   - Copy the Google Sheet ID and set it as a Script Property in your Apps Script project.
6. **Deploy as Web App**:
   - Open the Apps Script Editor online.
   - Click **Deploy** > **New Deployment**.
   - Select **Web App**, set the required access permissions, and deploy.

## 🛡️ Security & Privacy

- Enforced role validation on both the client (UI) and server (Apps Script).
- Immutable audit logs for all sensitive and business-critical actions.
- No public indexing of internal dashboards.
