# Product Documentation

## 🎯 Project Goal
**Condaty Admin** is a comprehensive web-based platform designed to streamline and modernize the administration of condominiums. It aims to centralize all management tasks—from financial tracking to security and communication—into a single, intuitive interface.

## 🚀 Core Value Proposition
- **Centralization:** Integrates disparate management functions (finance, security, social) into one system.
- **Standardization:** Uses a custom "Microkernel" architecture to ensure consistent user experience and rapid development of new features.
- **Real-time:** Leverages InstantDB and Pusher for immediate updates on alerts, chats, and data synchronization.
- **Security:** Implements robust role-based access control (RBAC) to ensure users only access data relevant to their role (Admin, Guard, Resident).

## 📱 Key Features & Domains

### 💰 Financial Management
- **Income & Expenses:** Track payments (`Payments`) and operational costs (`Outlays`, `Expenses`).
- **Cash Flow:** Real-time balance tracking (`Balance`).
- **Debt Management:** Tools for managing debts (`DebtsManager`) and tracking defaulters (`Defaulters`).

### 🏢 Administration & Operations
- **Property Management:** Manage units (`Units`), social areas (`Areas`), and document repositories (`Documents`).
- **Configuration:** System-wide settings (`Config`) and surveys (`Surveys`).

### 👥 User Management
- **Profiles:** Manage owners (`Owners`), staff (`Users`), and residents (`HomeOwners`).
- **Access Control:** Granular permission system via `Roles`.

### 📅 Reservations
- **Booking System:** Manage reservations for common areas (`Reservas`, `CreateReserva`).

### 📢 Communication
- **Announcements:** Publish notices (`Contents`) and social updates (`Reel`).
- **Notifications:** Real-time alerts and push notifications (`Notifications`).

### 🔐 Security
- **Access Control:** Manage security personnel (`Guards`).
- **Emergency:** Real-time alert system (`Alerts`).
- **Logging:** Activity logs and binnacle (`Binnacle`).

## 🎨 User Experience (UX) Goals
- **Consistency:** All modules share a unified look and feel thanks to the Microkernel architecture.
- **Efficiency:** Optimized CRUD operations with advanced filtering, searching, and pagination.
- **Responsiveness:** Designed to work seamlessly across devices.
- **Clarity:** Clear feedback for actions (loading states, success/error messages) managed globally.