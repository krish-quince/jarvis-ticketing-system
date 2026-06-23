# Jarvis SaaS Ticketing System

Welcome to the **Jarvis SaaS Ticketing System**! This is a multi-tenant (SaaS-level) helpdesk and ticketing platform designed to support multiple organizations (tenants), such as Quince Capital (`QC`) and Alpha TNG (`ATND`), with complete isolation of tickets, categories, subcategories, priorities, statuses, and departments.

This document serves as an exhaustive guide for developers, system administrators, and even non-technical stakeholders to understand, deploy, run, and modify the application.

---

## Table of Contents
1. [System Overview & Architecture](#1-system-overview--architecture)
2. [Multi-Tenancy (SaaS) Design & Isolation](#2-multi-tenancy-saas-design--isolation)
3. [Database Schema & Mappings](#3-database-schema--mappings)
4. [Project Directory Structures](#4-project-directory-structures)
5. [Backend Architecture & Logic Flow](#5-backend-architecture--logic-flow)
6. [Frontend Architecture & UI Flow](#6-frontend-architecture--ui-flow)
7. [Installation & Setup Guide](#7-installation--setup-guide)
8. [Default User Credentials](#8-default-user-credentials)
9. [Developer Guide: How to Make Changes](#9-developer-guide-how-to-make-changes)

---

## 1. System Overview & Architecture

The Jarvis SaaS Ticketing System is a full-stack web application consisting of:
*   **Database**: PostgreSQL database named `jarvis_helpdesk` that stores tenant metadata, users, departments, and tickets.
*   **Backend**: Node.js & Express API server that manages authentication (JWT-based), validates request inputs, handles business logic, and interacts with PostgreSQL.
*   **Frontend**: React client built with TypeScript, Vite, and Material-UI (MUI) for a rich, modern, responsive user experience.

```
┌────────────────────────────────────────────────────────┐
│                      Web Browser                       │
│           (React / TypeScript / Material-UI)           │
└───────────────────────────┬────────────────────────────┘
                            │ (REST APIs over HTTP + JWT)
                            ▼
┌────────────────────────────────────────────────────────┐
│                   Backend API Server                   │
│               (Node.js / Express / PG Pool)            │
└───────────────────────────┬────────────────────────────┘
                            │ (SQL Queries)
                            ▼
┌────────────────────────────────────────────────────────┐
│                  PostgreSQL Database                   │
│                   ("jarvis_helpdesk")                  │
└────────────────────────────────────────────────────────┘
```

---

## 2. Multi-Tenancy (SaaS) Design & Isolation

In this ticketing system, each company represents a separate tenant. Tenants are identified by their unique `company_code` (e.g., `QC` or `ATND`).

### Tenant Scopes & Rules:
1.  **Isolation of Ticket Configuration**:
    Each company can customize its helpdesk setup. Therefore, ticket categories, subcategories, priorities, and statuses are tied to a `company_code`. A user from `ATND` only sees `ATND`-specific options, and a user from `QC` only sees `QC`-specific options.
2.  **User Scoping**:
    Every user is assigned to one `company_code`. When a user logs in, their JWT token is signed with their company code.
3.  **Strict Filtering**:
    All backend queries fetching tickets, categories, subcategories, priorities, statuses, and departments are filtered by `req.user.companyCode` to prevent cross-tenant data leaks.
4.  **Security Checks**:
    When creating or updating a ticket, the backend validates that the category, subcategory, priority, and status IDs provided in the request body actually belong to the user's company.
5.  **Super Admin Bypass (Global Scope)**:
    Super Admins (role `4`, or role name `'Super Admin'`) are global administrators not restricted by individual tenant scopes. They can manage companies, view all users across all tenants, change any user's company affiliation, and access all tickets.

---

## 3. Database Schema & Mappings

The database contains 11 main tables. Below is a detailed mapping of the tables, their fields, and relationships.

### Database Tables:

#### 1. `companies`
Stores the corporate tenants registered on the SaaS platform.
*   `company_id` (bigint, PK, auto-increment): Unique company identifier.
*   `company_code` (varchar(50), Unique): Business shortcode (e.g., `QC`, `ATND`).
*   `company_name` (varchar(150)): The full company name.
*   `is_active` (boolean): Whether the company tenant is active.

#### 2. `roles`
Stores authorization roles.
*   `role_id` (bigint, PK, auto-increment): Role identifier.
*   `role_name` (varchar(50)): E.g., `Admin` (1), `Technician` (2), `Manager` (3), `Employee` (4).
*   `role_description` (text): Description of permissions.

#### 3. `departments`
Stores departments scoped by company.
*   `department_id` (bigint, PK, auto-increment): Unique department identifier.
*   `department_name` (varchar(100)): E.g., `Sales`, `IT`, `HR`, `Finance`.
*   `company_code` (varchar(50), FK -> `companies.company_code`): The company this department belongs to.
*   `is_active` (boolean): Active state.

#### 4. `users`
Stores user credentials, profiles, roles, and company affiliations.
*   `user_serial_no` (bigint, auto-increment): Internal serial number.
*   `user_code` (varchar(100), PK): Username/User ID used for login (e.g., `QC_ADMIN`, `SAL001`).
*   `role_id` (bigint, FK -> `roles.role_id`): Role permissions.
*   `company_code` (varchar(50), FK -> `companies.company_code`): Associated tenant.
*   `department_id` (bigint, Nullable, FK -> `departments.department_id`): Associated department.
*   `first_name` (varchar(100)): User's first name.
*   `last_name` (varchar(100)): User's last name.
*   `email` (varchar(150), Unique): Email address.
*   `password_hash` (varchar(255)): Bcrypt-hashed password.
*   `phone` (varchar(20)): Phone number.
*   `is_active` (boolean): Active status.

#### 5. `ticket_categories`
Categories for ticketing, isolated by company.
*   `category_id` (bigint, PK, auto-increment): Unique identifier.
*   `category_name` (varchar(100)): E.g., `Software`, `Hardware`, `HR Query`.
*   `company_code` (varchar(50), FK -> `companies.company_code`): The owning tenant.
*   `is_active` (boolean).

#### 6. `ticket_subcategories`
Subcategories nested inside categories, scoped by company.
*   `subcategory_id` (bigint, PK, auto-increment): Unique identifier.
*   `category_id` (bigint, FK -> `ticket_categories.category_id`): Parent category.
*   `subcategory_name` (varchar(100)): E.g., `Email Issue` (under Software).
*   `assigned_user_code` (varchar(100), Nullable, FK -> `users.user_code`): Default assignee for this subcategory.
*   `company_code` (varchar(50), FK -> `companies.company_code`): Owning tenant.
*   `is_active` (boolean).

#### 7. `ticket_priorities`
Custom ticket priority options, scoped by company.
*   `priority_id` (bigint, PK, auto-increment): Unique identifier.
*   `priority_name` (varchar(50)): E.g., `Low`, `Medium`, `High`, `Critical`.
*   `priority_value` (integer): Numerical weight (higher = more urgent).
*   `priority_color` (varchar(7)): Hex color code (e.g. `#E53935`).
*   `company_code` (varchar(50), FK -> `companies.company_code`): Owning tenant.
*   `is_active` (boolean).

#### 8. `ticket_statuses`
Custom progress statuses, scoped by company.
*   `status_id` (bigint, PK, auto-increment): Unique identifier.
*   `status_name` (varchar(50)): E.g., `New`, `Assigned`, `In Progress`, `Resolved`, `Closed`.
*   `status_color` (varchar(7)): Hex color code.
*   `display_order` (integer): Sort order in UI.
*   `is_default` (boolean): Whether this status is applied to newly created tickets.
*   `is_closed_status` (boolean): Identifies if tickets in this status are considered resolved/closed.
*   `company_code` (varchar(50), FK -> `companies.company_code`): Owning tenant.
*   `is_active` (boolean).

#### 9. `tickets`
The central helpdesk tickets table.
*   `ticket_id` (bigint, PK, auto-increment): Unique ticket ID.
*   `title` (varchar(200)): Short summary.
*   `description` (text): Ticket details.
*   `raised_by` (varchar(100), FK -> `users.user_code`): User who created the ticket.
*   `assigned_to` (varchar(100), Nullable, FK -> `users.user_code`): Assigned technician.
*   `company_code` (varchar(50), FK -> `companies.company_code`): Ticket tenant context.
*   `department_id` (bigint, Nullable, FK -> `departments.department_id`): Scoped department.
*   `category_id` (bigint, FK -> `ticket_categories.category_id`): Selected category.
*   `subcategory_id` (bigint, FK -> `ticket_subcategories.subcategory_id`): Selected subcategory.
*   `priority_id` (bigint, FK -> `ticket_priorities.priority_id`): Selected priority.
*   `status_id` (bigint, FK -> `ticket_statuses.status_id`): Current status.
*   `creation_timestamp` (timestamp): Created date/time.
*   `update_timestamp` (timestamp): Last modified date/time.

#### 10. `comments`
Stores discussions and notes on tickets.
*   `comment_id` (bigint, PK, auto-increment).
*   `ticket_id` (bigint, FK -> `tickets.ticket_id`).
*   `commented_by` (varchar(100), FK -> `users.user_code`).
*   `comment_text` (text).
*   `is_internal` (boolean): If true, comment is visible only to technicians and admins.
*   `creation_timestamp` (timestamp).

#### 11. `ticket_history`
Audit logs detailing every change made to a ticket.
*   `history_id` (bigint, PK, auto-increment).
*   `ticket_id` (bigint, FK -> `tickets.ticket_id`).
*   `changed_by` (varchar(100), FK -> `users.user_code`).
*   `field_name` (varchar(100)): Field modified (e.g. `status_id`, `assigned_to`).
*   `old_value` (text).
*   `new_value` (text).
*   `change_timestamp` (timestamp).

---

## 4. Project Directory Structures

### Backend Layout
```
backend/
├── src/
│   ├── config/
│   │   └── db.js                  # PostgreSQL client initialization (pg Pool)
│   ├── controllers/               # Express request controllers (auth, user, ticket, master)
│   ├── middleware/                # Route middlewares (JWT auth check, role check, payload validation)
│   ├── repositories/              # Low-level Database SQL queries (pool.query calls)
│   ├── routes/                    # API Route URL declarations
│   ├── services/                  # Business logic services (validations, formatting)
│   ├── utils/                     # Utility helpers
│   ├── validators/                # Joi validation rules
│   ├── app.js                     # Express app configuration
│   └── server.js                  # Entry point to listen on PORT
├── package.json
└── .env                           # Backend environment variables
```

### Frontend Layout
```
frontend/
├── src/
│   ├── assets/                    # Static assets like logo images
│   ├── components/                # Shared/reusable UI Components (e.g., LoginCard, PrivateRoute)
│   ├── pages/                     # Main page components (Tickets, User management, Admin master entities)
│   ├── services/                  # Axios services interfacing with Backend API endpoints
│   ├── App.tsx                    # React Router configuration & Theme/Context providers
│   ├── main.tsx                   # React DOM render entrypoint
│   └── index.css                  # Core CSS tokens & Global variables
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## 5. Backend Architecture & Logic Flow

The backend employs a strict Layered Architecture to cleanly separate concerns:

```
Route Request ──► Middleware (Auth/Role/Validate) ──► Controller ──► Service ──► Repository ──► PostgreSQL
```

1.  **Middleware Check**:
    Every protected endpoint runs `verifyToken` (extracts JWT token from headers, populates `req.user` with `userCode`, `roleId`, and `companyCode`). Administrative endpoints also run `requireAdmin` (validates `roleId === 1`).
2.  **Controller Layer**:
    Extracts HTTP params, query parameters, body elements, and user tenant data from `req.user`. It delegates core computations to the Service layer and returns standardized JSON.
3.  **Service Layer**:
    Applies business logic rules. For example, when creating a ticket, `ticket.service.js` uses validation helpers from the repository to verify that the category, subcategory, priority, and status identifiers provided match the user's `companyCode`.
4.  **Repository Layer**:
    Interacts with the database using SQL queries. Master repositories filter by `companyCode`.

### Core Backend Code Modifications Made:
*   **Categorization Scoping**: Rewrote queries in `master.repository.js` so that `getCategories`, `getPriorities`, `getStatuses`, `getSubCategories`, and `getDepartments` include `WHERE company_code = $1` filters.
*   **Ticket Checks**: Enhanced `ticket.repository.js` with helper methods (`getCategoryByIdAndCompany`, `getStatusByIdAndCompany`, etc.) to ensure that users cannot assign cross-tenant master objects to a ticket.
*   **Dashboard Bugfix**: Corrected `dashboard.controller.js` count query which previously checked for a non-existent status of `'Open'`. It now correctly counts `'New'` status.
*   **User Listing Bugfix**: In `user.controller.js` (`getAllUsersWithData`), changed the SQL department join from `INNER JOIN` to `LEFT JOIN` so users without an assigned department are not omitted from the users list.

---

## 6. Frontend Architecture & UI Flow

The frontend is a single-page React app that utilizes Material-UI (MUI).

### Key Pages:
*   **Login / Registration**: Located at `/` (uses `LoginPage.tsx`).
    *   *Login*: Auths username/password. Saves token and user object in local storage.
    *   *Registration*: Allows selecting company (`Quince Capital` or `Alpha TNG`) and dynamically filters the available departments based on that selection to prevent invalid registrations.
*   **Dashboard**: Located at `/dashboard`. Shows ticket statistics, statuses, priority distributions, and categories scoped to the logged-in user's tenant.
*   **Tickets List**: Located at `/tickets`. Displays active tickets with search filters for status, priority, and categories.
*   **Ticket Details**: Located at `/tickets/:id`. Shows historical logs of status adjustments, comments exchange, assignments, and technician management.
*   **Add User**: Located at `/admin/users/new` (accessible only by Admins). Supports selecting a company for the new user and dynamically filters departments for that company (resets department selection if the company is updated).
*   **Admin Master Data Manager**: Located at `/admin/master`. Allows creating, updating, and toggling active states of categories, subcategories, priorities, and statuses scoped to the admin's tenant.

---

## 7. Installation & Setup Guide

Follow these steps to set up and run the system locally from scratch.

### Prerequisites:
1.  **Node.js**: Version 16+ or 18+ installed.
2.  **PostgreSQL**: Version 14+ database server running locally.

### Step 1: Database Initialization
1.  Open your PostgreSQL administration tool (e.g., pgAdmin 4) or terminal.
2.  Create a blank database named `jarvis_helpdesk`.
3.  Restore/execute the base database dump:
    ```bash
    # Execute the SQL dump at the root directory
    psql -U <postgres_user> -d jarvis_helpdesk -f jarvis_helpdesk.sql
    ```
4.  Run the multitenant migrations and copy seed records for Alpha TNG (`ATND`):
    *   Open and copy the contents of the database migration script.
    *   You can locate this migration SQL inside: `C:\Users\krish\.gemini\antigravity\brain\1674af35-7e05-4965-9302-c1832a33dc3a\scratch\migration.sql` (or just run the commands to add `company_code` column to `ticket_categories`, `ticket_subcategories`, `ticket_priorities`, and `ticket_statuses` tables, default them to `'QC'`, and duplicate them for `'ATND'`).

### Step 2: Backend Configuration & Start
1.  Navigate into the `backend/` directory.
2.  Create a `.env` file inside the `backend` folder with the following keys:
    ```env
    PORT=5000
    DB_HOST=localhost
    DB_PORT=5432
    DB_NAME=jarvis_helpdesk
    DB_USER=krish
    DB_PASSWORD=abcd1234
    JWT_SECRET=quince_ticketing_system_key
    ```
    *(Adjust `DB_USER` and `DB_PASSWORD` to match your local PostgreSQL configuration)*.
3.  Install dependencies:
    ```bash
    npm install
    ```
4.  Launch the backend server:
    ```bash
    npm start
    ```
    The server should output: `Server is running on port 5000` and confirm a successful database pool connection.

### Step 3: Frontend Configuration & Start
1.  Navigate into the `frontend/` directory.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Launch the development server:
    ```bash
    npm run dev
    ```
    By default, Vite will start the dev server at `http://localhost:5173`. Open this URL in your web browser.

---

## 8. Default User Credentials

You can test the multi-tenant system by logging in with the following default accounts (all default passwords are set to `abcd1234`):

### Global Super Admin:
*   **Super Admin User**: `QC_super_admin_system_admin` / `abcd1234` (Global system administrator with access to create/manage companies, manage users across all tenants, and view all tickets)

### Quince Capital (`QC` Tenant):
*   **Admin User**: `QC_ADMIN` / `abcd1234` (Full access to QC administration, departments, and user creation)
*   **Technician User (Sales)**: `SAL001` / `abcd1234` (Can be assigned to Sales tickets)
*   **Employee User**: `SAL002` / `abcd1234` (Regular employee who can submit tickets)

### Alpha TNG (`ATND` Tenant):
*   **Admin User**: `AT_ADMIN` / `abcd1234` (Full access to ATND administration, departments, and user creation)
*   **Technician User (Sales)**: `AT_SAL001` / `abcd1234` (Can be assigned to ATND Sales tickets)
*   **Employee User**: `AT_FIN001` / `abcd1234` (Employee who can submit tickets in ATND tenant)

---

## 9. Developer Guide: How to Make Changes

### Adding a New Company / Tenant:
1.  Insert a record into the `companies` table:
    ```sql
    INSERT INTO companies (company_code, company_name) VALUES ('NEWCO', 'New Company Corp');
    ```
2.  Duplicate/seed default categories, subcategories, priorities, and statuses for this new company in the database so that users of this company have configurations to choose from (similar to the logic in `migration.sql`).
3.  Add the new company mapping to the `COMPANIES` list in `frontend/src/pages/LoginPage.tsx` so users can choose it during registration.

### Adding a New Department:
1.  Insert a record into the `departments` table specifying the `company_code` it belongs to:
    ```sql
    INSERT INTO departments (department_name, company_code) VALUES ('Quality Assurance', 'QC');
    ```
2.  Add it to the static registration dictionary in `LoginPage.tsx` if you want new users to register under this department. It will automatically flow to user lists and ticketholder lists when queried from the database.

### Modifying Schema Rules:
When introducing any new database column to ticket configuration entities (like categories, subcategories, priorities, etc.), remember to **always include a `company_code` column** and set up foreign key constraints pointing to `companies(company_code)`. This ensures that SaaS tenant scoping is enforced.
