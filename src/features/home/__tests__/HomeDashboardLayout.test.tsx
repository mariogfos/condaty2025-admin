import { render, screen, within } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import HomePage from "@/components/Index/Index";

const mocks = vi.hoisted(() => ({
  graphProps: vi.fn(),
}));

const labels: Record<string, string> = {
  administrators: "Administradores",
  administratorsTooltip: "Administradores registrados",
  balanceTooltip: "Diferencia entre ingresos y egresos",
  currentSummary: "Resumen actual",
  delinquency: "Cartera vencida",
  emptyFinancialChart: "Gráfica financiera sin datos",
  guards: "Guardias",
  guardsTooltip: "Guardias registrados",
  incomes: "Ingresos",
  negativeBalance: "Balance en contra",
  outlays: "Egresos",
  pageTitle: "Inicio",
  positiveBalance: "Balance a favor",
  registeredUsers: "Usuarios registrados",
  residents: "Residentes",
  residentsTooltip: "Residentes activos",
  summaryOfMonth: "Resumen del mes de septiembre",
  usersSummary: "Resumen de usuarios",
  usersSummarySubtitle: "Usuarios del condominio",
};

vi.mock("@/mk/hooks/useAxios", () => ({
  default: () => ({
    data: {
      data: {
        TotalEgresos: 250,
        TotalIngresos: 1000,
        adminsCount: 2,
        assembly: { id: 7, subject: "Asamblea ordinaria" },
        egresosHist: [{ amount: 250, mes: 9 }],
        guardsCount: 3,
        ingresosHist: [{ amount: 1000, mes: 9 }],
        morosos: 125,
        residentsCount: 15,
        saldoInicial: 50,
      },
    },
    reLoad: vi.fn(),
  }),
}));

vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({
    setStore: vi.fn(),
    store: { title: "Inicio" },
    userCan: () => true,
  }),
}));

vi.mock("@/i18n/useScopedI18n", () => ({
  useScopedI18n: () => ({
    localeTag: "es-BO",
    translate: (key: string) => labels[key] || key,
  }),
}));

vi.mock("@/mk/hooks/useScreenSize", () => ({
  useScreenSize: () => ({ isMobile: false }),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/Widgets/WidgetBase/WidgetBase", () => ({
  default: ({ children, className, subtitle, title }: any) => (
    <section className={className}>
      <h2>{title}</h2>
      <p>{subtitle}</p>
      {children}
    </section>
  ),
}));

vi.mock(
  "@/modulos/Assemblies/components/AssemblyDashboardCard/AssemblyDashboardCard",
  () => ({
    AssemblyDashboardCard: ({ assembly }: any) => (
      <section aria-label="Próxima asamblea">{assembly.subject}</section>
    ),
  }),
);

vi.mock(
  "@/components/Widgets/WidgetsDashboard/WidgetGraphResume/WidgetGraphResume",
  () => ({
    default: (props: any) => {
      mocks.graphProps(props);
      return <section aria-label="Resumen general" />;
    },
  }),
);

describe("inicio administrativo", () => {
  it("conserva solamente los cuatro paneles principales con datos reales", () => {
    render(<HomePage />);

    const grid = screen.getByTestId("home-dashboard-grid");
    expect(grid.children).toHaveLength(4);
    expect(within(grid).getByText("Resumen actual")).toBeInTheDocument();
    expect(within(grid).getByText("Resumen de usuarios")).toBeInTheDocument();
    expect(
      within(grid).getByRole("region", { name: "Próxima asamblea" }),
    ).toBeInTheDocument();
    expect(
      within(grid).getByRole("region", { name: "Resumen general" }),
    ).toBeInTheDocument();

    expect(screen.getByText("Bs. 750.00")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Ingresos/ })).toHaveAttribute(
      "href",
      "/payments",
    );

    expect(screen.queryByText("Revisiones de pago")).not.toBeInTheDocument();
    expect(screen.queryByText("Alertas")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Solicitudes de reservas"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Pre-registro")).not.toBeInTheDocument();
    expect(screen.queryByText("Comunidad")).not.toBeInTheDocument();

    expect(mocks.graphProps).toHaveBeenCalledWith(
      expect.objectContaining({
        egresos: [{ amount: 250, mes: 9 }],
        ingresos: [{ amount: 1000, mes: 9 }],
        periodo: "y",
        saldoInicial: 50,
        showEmptyData: false,
      }),
    );
  });

  it("define la proporción 2/3 y 1/3 invertida en la segunda fila", () => {
    const css = readFileSync(
      resolve(process.cwd(), "src/components/Index/index.module.css"),
      "utf8",
    );

    expect(css).toContain('"summary summary users"');
    expect(css).toContain('"assembly chart chart"');
  });
});
