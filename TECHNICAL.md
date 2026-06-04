# TECHNICAL.md

## Title & Metadata

| Property             | Value        |
| -------------------- | ------------ |
| System Name          | Kopickup POS |
| Last Updated         | 2026-06-01   |
| Status               | Demo Stage   |
| Version              | v1.0         |
| Architecture Version | MVP-GAS-001  |

---

# 1. App Details

## Project Summary

| Property                | Value                                       |
| ----------------------- | ------------------------------------------- |
| Project Name            | Kopickup                                    |
| Project Type            | POS & Operational Dashboard                 |
| Target Users            | Owner, Cashier                              |
| Architecture            | Google Apps Script + Google Sheets Database |
| Authentication Strategy | Google Session + Role Validation            |
| Deadline                | Demo MVP 1 Week                             |
| Deployment              | Google Workspace                            |

## Repository Structure

| Repository        | Purpose                             | Technology         |
| ----------------- | ----------------------------------- | ------------------ |
| kopickup-app      | Frontend + Backend Mono Application | Google Apps Script |
| kopickup-database | Google Sheets Data Store            | Google Sheets      |
| kopickup-assets   | Receipt Templates, Reports, Config  | Google Drive       |

---

# 2. System Description

## Component Architecture

### Application Components

1. Authentication Layer
2. Role Access Layer
3. POS Transaction Module
4. Shift Management Module
5. Inventory Module
6. Reporting Module
7. Audit Log Module

### Rendering Strategy

| Area           | Strategy                 | Reason                      |
| -------------- | ------------------------ | --------------------------- |
| Login          | Server Side HTML Service | Fast initialization         |
| POS Dashboard  | CSR                      | Dynamic transaction updates |
| Reports        | CSR + Server Fetch       | Internal usage only         |
| Admin Settings | CSR                      | Simplify implementation     |

---

## High-Level Architecture

```text
Google User
        ↓
Google Apps Script Web App
        ↓
Role Middleware
        ↓
Business Service Layer
        ↓
Google Sheets Database
        ↓
Google Drive Assets
```

---

## Role System

| Role    | Code    | Access               |
| ------- | ------- | -------------------- |
| Owner   | OWNER   | Full Business Access |
| Cashier | CASHIER | POS Access           |

---

## Data Sensitivity Classification

| Level           | Data                    | Access      |
| --------------- | ----------------------- | ----------- |
| Public          | Menu Catalog            | All Users   |
| Internal Low    | Product Data            | Staff       |
| Internal Medium | Transactions            | Owner       |
| Internal High   | Financial Reports       | Owner       |
| Critical        | Credentials, Audit Logs | Owner       |

---

# 3. Tech Stack

## Backend Stack

| Component  | Technology          |
| ---------- | ------------------- |
| Runtime    | Google Apps Script  |
| API Layer  | doGet / doPost      |
| Validation | Custom Validator    |
| Auth       | Google Session      |
| Logging    | Apps Script Logger  |
| Audit      | Sheet Audit Table   |
| Scheduler  | Time Trigger        |
| Reporting  | Apps Script Service |

---

## Database Stack

| Storage           | Purpose              |
| ----------------- | -------------------- |
| Google Sheets     | Primary Database     |
| Google Drive      | File Storage         |
| Script Properties | System Configuration |
| CacheService      | Session Cache        |

---

## Frontend Stack

| Component        | Library           |
| ---------------- | ----------------- |
| UI               | HTML Service      |
| Styling          | Tailwind CDN      |
| State Management | Vanilla JS Store  |
| API Client       | Fetch Wrapper     |
| Form Validation  | Custom Validation |
| Table Component  | Custom Table      |
| Chart            | Chart.js          |

---

## Infrastructure

| Area        | Tool                   |
| ----------- | ---------------------- |
| Hosting     | Google Apps Script     |
| Database    | Google Sheets          |
| Assets      | Google Drive           |
| Monitoring  | Apps Script Logs       |
| Backup      | Scheduled Sheet Export |
| Environment | Script Properties      |

---

## Demo/Staging Stack Summary

| Feature        | Production Ideal  | Demo Version      |
| -------------- | ----------------- | ----------------- |
| Database       | PostgreSQL        | Google Sheets     |
| Authentication | JWT + RBAC        | Google Session    |
| Audit Log      | Dedicated Service | Audit Sheet       |
| Queue          | Redis Queue       | Direct Process    |
| Notification   | WhatsApp API      | Not Included      |
| Inventory Sync | Event Driven      | Direct Update     |
| Analytics      | Data Warehouse    | Aggregation Sheet |

---

# 4. Database Design

## Entity Relationship Summary

```text
Users
  1 → N Transactions

Users
  1 → N Shifts

Products
  1 → N Transaction Items

Transactions
  1 → N Transaction Items

Transactions
  1 → N Audit Logs

Shifts
  1 → N Transactions
```

---

## users

| Column     | Type     | Notes                       |
| ---------- | -------- | --------------------------- |
| id         | UUID     | PK                          |
| name       | String   | Required                    |
| email      | String   | Unique                      |
| role       | Enum     | OWNER/CASHIER               |
| status     | Enum     | ACTIVE/INACTIVE             |
| created_at | DateTime | Required                    |

---

## products

| Column     | Type     | Notes           |
| ---------- | -------- | --------------- |
| id         | UUID     | PK              |
| name       | String   | Required        |
| category   | String   | Indexed         |
| price      | Number   | >=0             |
| stock      | Number   | >=0             |
| status     | Enum     | ACTIVE/INACTIVE |
| created_at | DateTime | Required        |

---

## shifts

| Column     | Type     | Notes       |
| ---------- | -------- | ----------- |
| id         | UUID     | PK          |
| user_id    | FK       | users.id    |
| open_cash  | Number   | Required    |
| close_cash | Number   | Nullable    |
| status     | Enum     | OPEN/CLOSED |
| opened_at  | DateTime | Required    |
| closed_at  | DateTime | Nullable    |

---

## transactions

| Column         | Type     | Notes            |
| -------------- | -------- | ---------------- |
| id             | UUID     | PK               |
| transaction_no | String   | Unique           |
| shift_id       | FK       | shifts.id        |
| cashier_id     | FK       | users.id         |
| subtotal       | Number   | Required         |
| total          | Number   | Required         |
| payment_method | Enum     | CASH/NON_CASH    |
| status         | Enum     | PAID/VOID/REFUND |
| created_at     | DateTime | Required         |

---

## transaction_items

| Column         | Type   | Notes           |
| -------------- | ------ | --------------- |
| id             | UUID   | PK              |
| transaction_id | FK     | transactions.id |
| product_id     | FK     | products.id     |
| qty            | Number | >0              |
| price          | Number | Snapshot Price  |
| subtotal       | Number | Required        |

---

## audit_logs

| Column      | Type     | Notes    |
| ----------- | -------- | -------- |
| id          | UUID     | PK       |
| user_id     | FK       | users.id |
| action      | String   | Required |
| entity_type | String   | Required |
| entity_id   | String   | Required |
| before_data | JSON     | Nullable |
| after_data  | JSON     | Nullable |
| created_at  | DateTime | Required |

---

# 5. Feature Flows

## Authentication & Role Access

```text
Open App
    ↓
Login Google Account
    ↓
Get User Profile
    ↓
Validate Role
    ↓
Role Authorized?
    ↓
YES → Dashboard
NO → Access Denied
```

---

## POS Core Business Flow

```text
Open Shift
    ↓
Select Product
    ↓
Add To Cart
    ↓
Calculate Total
    ↓
Select Payment
    ↓
Save Transaction
    ↓
Reduce Stock
    ↓
Generate Receipt
    ↓
Audit Log
```

---

## Sensitive Data Flow

```text
User Request
    ↓
Role Validation
    ↓
Permission Check
    ↓
Data Access
    ↓
Audit Record
    ↓
Response
```

---

## Dashboard Aggregation

```text
Transaction Data
    ↓
Daily Aggregation
    ↓
Summary Sheet
    ↓
Dashboard Query
    ↓
Visualization
```

---

## Audit Log Flow

```text
User Action
    ↓
Capture Before Data
    ↓
Execute Process
    ↓
Capture After Data
    ↓
Store Audit Record
```

---

# 6. Requirements

## Functional Requirements

| #     | Requirement        | Priority  |
| ----- | ------------------ | --------- |
| FR-01 | Login              | Must      |
| FR-02 | Role Access        | Must      |
| FR-03 | Product Management | Must      |
| FR-04 | POS Transaction    | Must      |
| FR-05 | Payment Processing | Must      |
| FR-06 | Shift Management   | Must      |
| FR-07 | Dashboard Summary  | Must      |
| FR-08 | Audit Log          | Must      |
| FR-09 | Stock Adjustment   | Should    |
| FR-10 | Report Export      | Post-Demo |

---

## Non Functional Requirements

| #      | Requirement    | Detail                    |
| ------ | -------------- | ------------------------- |
| NFR-01 | Availability   | 99.5%                     |
| NFR-02 | Response Time  | <2 Seconds                |
| NFR-03 | Security       | RBAC                      |
| NFR-04 | Auditability   | 100% Critical Actions     |
| NFR-05 | Data Integrity | No Duplicate Transactions |
| NFR-06 | Backup         | Daily Export              |
| NFR-07 | Scalability    | 10 Users Concurrent       |
| NFR-08 | Session Expiry | 8 Hours                   |

---

## API Response Standard

### Success

```json
{
  "success": true,
  "message": "Transaction created",
  "data": {}
}
```

### Paginated

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "total_pages": 5
  }
}
```

### Error

```json
{
  "success": false,
  "message": "Validation Error",
  "errors": {
    "field": "Required"
  }
}
```

---

# 7. Task Breakdown

## Task 1

### Task Title

Project Foundation Setup

### Task Description

Menyiapkan struktur project GAS dan database sheet.

### Task Criteria

Semua environment tersedia.

### Task Acceptance

Developer dapat menjalankan sistem.

### Task To Do

- [ ] Create Apps Script Project
- [ ] Create Sheets Database
- [ ] Setup Script Properties
- [ ] Setup Folder Structure

### Task Flow to Test

Create Web App → Deploy → Open URL

### Task Makesures After Finished

- [ ] Environment Configured
- [ ] Secrets Hidden
- [ ] Naming Standard Applied

---

## Task 2

### Task Title

Authentication Module

### Task Description

Implementasi login dan validasi role.

### Task Criteria

User hanya dapat mengakses role sesuai izin.

### Task Acceptance

Unauthorized access ditolak.

### Task To Do

- [ ] Create Login Handler
- [ ] Create Session Layer
- [ ] Create Role Middleware
- [ ] Create Logout

### Task Flow to Test

Login → Access Dashboard → Logout

### Task Makesures After Finished

- [ ] Session Expiry Working
- [ ] Role Validation Working
- [ ] Audit Enabled

---

## Task 3

### Task Title

Product Management

### Task Description

CRUD produk dan kategori.

### Task Criteria

Produk dapat dibuat dan diubah.

### Task Acceptance

Data tersimpan pada sheet.

### Task To Do

- [ ] Create Product Sheet
- [ ] Create Product Service
- [ ] Create Product UI
- [ ] Create Validation

### Task Flow to Test

Create Product → Edit → Disable

### Task Makesures After Finished

- [ ] Validation Active
- [ ] Audit Recorded
- [ ] Duplicate Check Active

---

## Task 4

### Task Title

POS Transaction Engine

### Task Description

Implementasi transaksi penjualan.

### Task Criteria

Transaksi berhasil tersimpan.

### Task Acceptance

Stock berkurang otomatis.

### Task To Do

- [ ] Cart Logic
- [ ] Checkout Logic
- [ ] Payment Logic
- [ ] Receipt Logic

### Task Flow to Test

Add Product → Pay → Receipt

### Task Makesures After Finished

- [ ] Duplicate Prevention
- [ ] Transaction Atomic
- [ ] Audit Created

---

## Task 5

### Task Title

Shift Management

### Task Description

Buka dan tutup shift.

### Task Criteria

Kas awal dan akhir tercatat.

### Task Acceptance

Shift report terbentuk.

### Task To Do

- [ ] Open Shift
- [ ] Close Shift
- [ ] Cash Difference
- [ ] Shift Summary

### Task Flow to Test

Open → Transaction → Close

### Task Makesures After Finished

- [ ] Validation Active
- [ ] Audit Active
- [ ] Summary Accurate

---

## Task 6

### Task Title

Inventory Module

### Task Description

Pengurangan stok otomatis.

### Task Criteria

Stok sinkron dengan transaksi.

### Task Acceptance

Tidak terjadi stok minus.

### Task To Do

- [ ] Stock Update Service
- [ ] Adjustment Form
- [ ] Stock History

### Task Flow to Test

Transaction → Stock Reduced

### Task Makesures After Finished

- [ ] Validation Active
- [ ] Audit Active

---

## Task 7

### Task Title

Dashboard Analytics

### Task Description

Dashboard owner dan manager.

### Task Criteria

Data agregasi muncul.

### Task Acceptance

Summary sesuai transaksi.

### Task To Do

- [ ] Sales Summary
- [ ] Top Product
- [ ] Payment Summary
- [ ] Daily Trend

### Task Flow to Test

Create Transactions → Refresh Dashboard

### Task Makesures After Finished

- [ ] Query Optimized
- [ ] Calculation Valid

---

## Task 8

### Task Title

Audit Logging System

### Task Description

Mencatat seluruh perubahan data penting.

### Task Criteria

Semua perubahan terlacak.

### Task Acceptance

Audit record tersedia.

### Task To Do

- [ ] Audit Service
- [ ] Audit Sheet
- [ ] Audit Middleware

### Task Flow to Test

Update Product → Verify Audit

### Task Makesures After Finished

- [ ] Before/After Saved
- [ ] Immutable Record

---

# Appendix

## API Endpoint Reference

| Method | Endpoint       | Access   | Description        |
| ------ | -------------- | -------- | ------------------ |
| POST   | /auth/login    | All      | Login              |
| POST   | /auth/logout   | All      | Logout             |
| GET    | /products      | All      | List Products      |
| POST   | /products      | Owner    | Create Product     |
| PUT    | /products/{id} | Owner    | Update Product     |
| GET    | /transactions  | Owner    | Transaction List   |
| POST   | /transactions  | Cashier  | Create Transaction |
| POST   | /shift/open    | Cashier  | Open Shift         |
| POST   | /shift/close   | Cashier  | Close Shift        |
| GET    | /dashboard     | Owner    | Dashboard Summary  |
| GET    | /audit-logs    | Owner    | Audit Logs         |

---

## Git Branch Strategy

```text
main
 └── develop
      └── feature/*
      └── hotfix/*
```

| Branch     | Purpose       |
| ---------- | ------------- |
| main       | Production    |
| develop    | Integration   |
| feature/\* | New Feature   |
| hotfix/\*  | Emergency Fix |

---

## Naming Conventions

| Context      | Convention | Example           |
| ------------ | ---------- | ----------------- |
| Class        | PascalCase | ProductService    |
| Method       | camelCase  | createTransaction |
| DB Table     | snake_case | transaction_items |
| API Endpoint | kebab-case | /audit-logs       |
| Component    | PascalCase | ProductTable      |

---

## Future Readiness Checklist

- [ ] Migrasi Google Sheets ke PostgreSQL
- [ ] Implement JWT Authentication
- [ ] Implement Multi Outlet
- [ ] Integrasi QRIS
- [ ] Integrasi WhatsApp Notification
- [ ] Background Queue Processing
- [ ] Data Warehouse Analytics
- [ ] Mobile PWA Support
- [ ] Offline First Capability
- [ ] Automated Backup & Restore
