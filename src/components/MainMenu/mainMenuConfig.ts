import {
  IconHome,
  IconPayments,
  IconMonitorLine,
  IconGroup,
  IconComunicationDialog,
  IconCalendar,
  IconSecurity,
  IconBackOffice,
  IconFinance,
  IconAdministracion,
  IconCommunication,
  IconSecurityV2,
} from "../layout/icons/IconsBiblioteca";

export type MenuConfigItem =
  | {
      type: "item";
      href: string;
      labelKey: string;
      perm: string;
      icon: any;
      badgeKey?: string;
    }
  | {
      type: "dropdown";
      labelKey: string;
      icon: any;
      key: string;
      items: Array<{
        href: string;
        perm: string;
        labelKey: string;
        badgeKey?: string;
      }>;
    };

export const menuConfig: MenuConfigItem[] = [
  { type: "item", href: "/", labelKey: "home", perm: "home", icon: IconHome },
  {
    type: "dropdown",
    labelKey: "backoffice",
    icon: IconBackOffice,
    key: "Backoffice",
    items: [
      { href: "/superadmins", perm: "superadmins", labelKey: "superadmins" },
      { href: "/condominios", perm: "condominios", labelKey: "condominiums" },
      { href: "/invitations", perm: "campanas", labelKey: "qrInvitations" },
      { href: "/uploads", perm: "cargamasiva", labelKey: "bulkUpload" },
      { href: "/app-versions", perm: "superadmins", labelKey: "appVersions" },
    ],
  },
  {
    type: "dropdown",
    labelKey: "finance",
    icon: IconFinance,
    key: "Finanzas",
    items: [
      { href: "/balance", labelKey: "cashFlow", perm: "balance" },
      {
        href: "/payments",
        labelKey: "incomes",
        perm: "payments",
        badgeKey: "paymentsBage",
      },
      { href: "/outlays", labelKey: "outlays", perm: "outlays" },
      { href: "/expenses", labelKey: "condominiumFees", perm: "expenses" },
      { href: "/defaulters", labelKey: "defaulters", perm: "defaulters" },
      { href: "/debts_manager", labelKey: "debts", perm: "debts_manager" },
      {
        href: "/bank-accounts",
        labelKey: "bankAccounts",
        perm: "bank_accounts",
      },
      {
        href: "/partial-payments",
        labelKey: "partialPayments",
        perm: "bank_accounts",
      },
    ],
  },
  {
    type: "dropdown",
    labelKey: "administration",
    icon: IconAdministracion,
    key: "Administración",
    items: [
      { href: "/units", perm: "units", labelKey: "units" },
      { href: "/areas", perm: "areas", labelKey: "commonAreas" },
      { href: "/documents", perm: "documents", labelKey: "documents" },
      { href: "/configs", perm: "settings", labelKey: "settings" },
    ],
  },
  {
    type: "dropdown",
    labelKey: "users",
    icon: IconGroup,
    key: "Usuarios",
    items: [
      { href: "/owners", perm: "owners", labelKey: "residents" },
      { href: "/users", perm: "users", labelKey: "administrativeStaff" },
      { href: "/roles", perm: "roles", labelKey: "rolesAndPermissions" },
    ],
  },
  {
    type: "dropdown",
    labelKey: "communication",
    icon: IconCommunication,
    key: "Comunicación",
    items: [
      { href: "/contents", perm: "contents", labelKey: "publications" },
      {
        href: "/reels",
        perm: "contents",
        labelKey: "publicationsWall",
        badgeKey: "reelsBage",
      },
      { href: "/surveys", perm: "surveys", label: "Encuestas" },
      { href: "/mis-encuestas", perm: "surveys", label: "Mis Encuestas" },
    ],
  },
  {
    type: "item",
    href: "/reservas",
    labelKey: "reservations",
    perm: "reservations",
    icon: IconCalendar,
    badgeKey: "reservasBage",
  },
  {
    type: "dropdown",
    labelKey: "securityAndAccess",
    icon: IconSecurityV2,
    key: "Vigilancia y seguridad",
    items: [
      { href: "/guards", perm: "guards", label: "Guardias" },
      {
        href: "/visit-reasons",
        perm: "visit_reasons",
        label: "Motivos de visitas",
      },
      { href: "/activities", perm: "accesses", label: "Accesos" },
      {
        href: "/alerts",
        perm: "alerts",
        labelKey: "alerts",
        badgeKey: "alertsBage",
      },
      { href: "/binnacle", perm: "guardlogs", labelKey: "logbook" },
    ],
  },
];
