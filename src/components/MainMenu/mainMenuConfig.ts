import {
  IconHome,
  IconPayments,
  IconMonitorLine,
  IconGroup,
  IconComunicationDialog,
  IconCalendar,
  IconSecurity,
} from "../layout/icons/IconsBiblioteca";

export const menuConfig = [
  { type: "item", href: "/", label: "Inicio", perm: "home", icon: IconHome },
  {
    type: "dropdown",
    label: "Finanzas",
    icon: IconPayments,
    key: "Finanzas",
    items: [
      { href: "/balance", label: "Flujo de efectivo", perm: "balance" },
      {
        href: "/payments",
        label: "Ingresos",
        perm: "payments",
        badgeKey: "paymentsBage",
      },
      { href: "/outlays", label: "Egresos", perm: "outlays" },
      { href: "/expenses", label: "Expensas", perm: "expenses" },
      { href: "/defaulters", label: "Morosos", perm: "defaulters" },
      { href: "/debts_manager", label: "Deudas", perm: "debts_manager" },
      {
        href: "/bank-accounts",
        label: "Cuentas Bancarias",
        perm: "bank_accounts",
      },
      {
        href: "/partial-payments",
        label: "Pagos Parciales",
        perm: "bank_accounts",
      },
    ],
  },
  {
    type: "dropdown",
    label: "Administración",
    icon: IconMonitorLine,
    key: "Administración",
    items: [
      { href: "/units", perm: "units", label: "Unidades" },
      { href: "/areas", perm: "areas", label: "Áreas sociales" },
      { href: "/activities", perm: "accesses", label: "Accesos" },
      { href: "/documents", perm: "documents", label: "Documentos" },
      { href: "/configs", perm: "settings", label: "Configuración" },
    ],
  },
  {
    type: "dropdown",
    label: "Usuarios",
    icon: IconGroup,
    key: "Usuarios",
    items: [
      { href: "/owners", perm: "owners", label: "Residentes" },
      { href: "/users", perm: "users", label: "Personal Administrativo" },
      { href: "/roles", perm: "roles", label: "Roles y permisos" },
    ],
  },
  {
    type: "dropdown",
    label: "Comunicación",
    icon: IconComunicationDialog,
    key: "Comunicación",
    items: [
      { href: "/contents", perm: "contents", label: "Publicaciones" },
      {
        href: "/reels",
        perm: "contents",
        label: "Muro publicaciones",
        badgeKey: "reelsBage",
      },
    ],
  },
  {
    type: "item",
    href: "/reservas",
    label: "Reservas",
    perm: "reservations",
    icon: IconCalendar,
    badgeKey: "reservasBage",
  },
  {
    type: "dropdown",
    label: "Vigilancia y seguridad",
    icon: IconSecurity,
    key: "Vigilancia y seguridad",
    items: [
      { href: "/guards", perm: "guards", label: "Guardias" },
      {
        href: "/alerts",
        perm: "alerts",
        label: "Alertas",
        badgeKey: "alertsBage",
      },
      { href: "/binnacle", perm: "guardlogs", label: "Bitácora" },
    ],
  },
];
