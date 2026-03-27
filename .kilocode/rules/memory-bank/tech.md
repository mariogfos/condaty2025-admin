# Technology Stack

## 💻 Frontend Core
-   **Framework:** Next.js 15.2.4 (App Router)
-   **UI Library:** React 19.1.0
-   **Language:** TypeScript 5.x (Strict Mode)
-   **Build Tool:** Turbopack (Dev), Webpack (Build)
-   **Styling:** CSS Modules + Global Variables (`theme.css`)

## 🔙 Backend & API
-   **API:** Laravel (PHP)
-   **Database:** MySQL
-   **Authentication:** JWT (JSON Web Tokens)
-   **HTTP Client:** Axios (wrapped in `useAxios`)

## 📡 Real-time Services
-   **InstantDB:**
    -   Used for: Chat, Presence, Persistent Notifications.
    -   Library: `@instantdb/react`, `@instantdb/admin`
-   **Pusher:**
    -   Used for: Critical Alerts, Trigger-based updates.
    -   Library: `pusher-js` (implied via context)

## 🛠️ Utilities & Libraries
-   **Date Handling:** `date-fns`
-   **Data Visualization:** `react-apexcharts`
-   **Excel Export:** `xlsx`
-   **PDF/Image Generation:** `html2canvas`
-   **UI Components:** `react-day-picker`, `react-easy-crop`, `emoji-picker-react`
-   **Animations:** `motion` (Framer Motion)

## ⚙️ Development Environment
-   **Linter:** ESLint (Next.js config)
-   **Package Manager:** npm or pnpm
-   **Version Control:** Git

## 📦 Key Dependencies
| Package | Version | Purpose |
| :--- | :--- | :--- |
| `next` | ^15.2.4 | Core Framework |
| `react` | ^19.1.0 | UI Library |
| `@instantdb/react` | ^0.21.22 | Real-time Database |
| `axios` | ^1.12.0 | API Requests |
| `date-fns` | ^4.1.0 | Date Formatting |
| `react-apexcharts` | ^1.7.0 | Charts |

## 📝 Configuration Files
-   `next.config.ts`: Next.js configuration.
-   `tsconfig.json`: TypeScript compiler options (Strict mode enabled).
-   `.env.development`: Environment variables for local development.
-   `MANUAL_TECNICO_DESARROLLO_QA.md`: Comprehensive developer guide.