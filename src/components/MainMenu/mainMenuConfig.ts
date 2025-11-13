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
  { type: "item", href: "/", label: "Inicio", icon: IconHome },
  {
    type: "dropdown",
    label: "Finanzas",
    icon: IconPayments,
    key: "Finanzas",
    items: [
      { href: "/balance", label: "Flujo de efectivo" },
      { href: "/payments", label: "Ingresos", badgeKey: "paymentsBage" },
      { href: "/outlays", label: "Egresos" },
      { href: "/expenses", label: "Expensas" },
      { href: "/defaulters", label: "Morosos" },
      { href: "/debts_manager", label: "Deudas" },
      { href: "/bank-accounts", label: "Cuentas Bancarias" },
    ],
  },
  {
    type: "dropdown",
    label: "Administración",
    icon: IconMonitorLine,
    key: "Administración",
    items: [
      { href: "/units", label: "Unidades" },
      { href: "/areas", label: "Áreas sociales" },
      { href: "/activities", label: "Accesos" },
      { href: "/documents", label: "Documentos" },
      { href: "/configs", label: "Configuración" },
    ],
  },
  {
    type: "dropdown",
    label: "Usuarios",
    icon: IconGroup,
    key: "Usuarios",
    items: [
      { href: "/owners", label: "Residentes" },
      { href: "/users", label: "Personal Administrativo" },
      { href: "/roles", label: "Roles y permisos", perm: "roles" },
    ],
  },
  {
    type: "dropdown",
    label: "Comunicación",
    icon: IconComunicationDialog,
    key: "Comunicación",
    items: [
      { href: "/contents", label: "Publicaciones" },
      { href: "/reels", label: "Muro publicaciones", badgeKey: "reelsBage" },
    ],
  },
  {
    type: "item",
    href: "/reservas",
    label: "Reservas",
    icon: IconCalendar,
    badgeKey: "reservasBage",
  },
  {
    type: "dropdown",
    label: "Vigilancia y seguridad",
    icon: IconSecurity,
    key: "Vigilancia y seguridad",
    items: [
      { href: "/guards", label: "Guardias" },
      { href: "/alerts", label: "Alertas", badgeKey: "alertsBage" },
      { href: "/binnacle", label: "Bitácora" },
    ],
  },
];
