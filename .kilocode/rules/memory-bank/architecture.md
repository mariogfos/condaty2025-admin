# System Architecture

## 🏗️ High-Level Overview
Condaty Admin follows a **Microkernel Architecture** pattern, where a core framework (`src/mk/`) provides the essential services (CRUD, Auth, UI) and business logic is implemented as pluggable modules (`src/modulos/`).

## 📂 Directory Structure
```
src/
├── app/                    # Next.js App Router (Pages & Layouts)
├── components/             # Project-specific UI components
├── contexts/               # Project-specific Context Providers
├── modulos/                # Business Logic Modules (The "Plugins")
│   ├── [Module]/           # e.g., Users, Payments
│   │   ├── [Module].tsx    # Entry point (useCrud config)
│   │   ├── RenderForm.tsx  # Create/Edit Form
│   │   ├── RenderView.tsx  # Detail View
│   │   └── constants/      # Module constants
└── mk/                     # THE MICROKERNEL (Core Framework)
    ├── components/         # Reusable UI (Table, Modal, Inputs)
    ├── contexts/           # Core Providers (AuthProvider, Axios)
    ├── hooks/              # Core Hooks (useCrud, useAxios)
    ├── utils/              # Shared Utilities (string, date, etc.)
    └── types/              # Core Type Definitions
```

## 🧩 The Microkernel (`src/mk/`)
The Microkernel is the foundation of the application. It abstracts away repetitive tasks.

### Key Components
1.  **`useCrud` Hook:** The central engine. It manages:
    -   **State:** Data, loading, errors, modal visibility.
    -   **API:** Fetching, creating, updating, deleting via `useAxios`.
    -   **UI Logic:** Pagination, sorting, filtering, searching.
    -   **Configuration:** Accepts `ModCrudType` and `FieldConfig` to dynamically generate UI.

2.  **`AuthProvider`:** Handles security.
    -   **JWT Management:** Storage and attachment to requests.
    -   **Session:** Login, logout, refresh token.
    -   **RBAC:** `userCan(permission)` checks against user roles.

3.  **UI Library:**
    -   **`DataModal`:** Standardized modal for Add/Edit/View actions.
    -   **`Table`:** Dynamic data table with sorting and actions.
    -   **`RenderItem`:** Renders cell content based on field type (text, badge, image).

## 🔌 Module Pattern
Every business module must adhere to this contract to function within the Microkernel.

### Structure
-   **Entry Point (`[Module].tsx`):**
    -   Defines `ModCrudType`: Endpoint, permissions, titles.
    -   Defines `FieldConfig`: How fields look in Form vs. List vs. View.
    -   Invokes `useCrud`.
    -   Renders the `List` component provided by `useCrud`.

-   **`RenderForm.tsx`:**
    -   Receives form props from `DataModal`.
    -   Uses `mk/components/forms` (Input, Select, etc.).
    -   Handles validation rules defined in `FieldConfig`.

-   **`RenderView.tsx`:**
    -   Displays detailed information of a selected item.

## 🔄 Data Flow
1.  **User Action:** User navigates to a module (e.g., `/users`).
2.  **Initialization:** `[Module].tsx` calls `useCrud`.
3.  **Data Fetching:** `useCrud` triggers `useAxios` -> `GET /api/users`.
4.  **Rendering:** `useCrud` returns `data` and `List` component.
5.  **Interaction:**
    -   **Click Add:** `useCrud` opens `DataModal` with `RenderForm`.
    -   **Submit Form:** `RenderForm` calls `onSave` -> `POST /api/users`.
    -   **Update UI:** `useCrud` optimistically updates list or re-fetches.

## 🔐 Security Architecture
-   **Authentication:** JWT (JSON Web Tokens).
-   **Storage:** `localStorage` (with expiration handling).
-   **Transport:** HTTPS required.
-   **Authorization:**
    -   **Frontend:** `userCan` checks for UI element visibility.
    -   **Backend:** Middleware verifies token and permissions per endpoint.

## 📡 Real-time Architecture
-   **InstantDB:** Used for chat, presence, and persistent notifications.
-   **Pusher:** Used for critical alerts and trigger-based updates.
-   **Integration:** Custom hooks (`useNotifInstandDB`) connect these services to the React lifecycle.