import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AssemblyDashboardCard } from "../components/AssemblyDashboardCard/AssemblyDashboardCard";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock("@/i18n/useScopedI18n", () => ({
  useScopedI18n: () => ({
    translate: (key: string) =>
      ({
        assemblyDate: "Fecha y hora",
        nextAssembly: "Próxima asamblea",
        nextAssemblySubtitle: "Información y registro de asistencia",
        viewAssemblyDetail: "Ver detalle",
      })[key] || key,
  }),
}));

vi.mock("@/mk/utils/date", () => ({
  formatToDayFdMYH: () => "Lun, 21/09/2026 - 19:00",
}));

vi.mock("@/components/Widgets/WidgetBase/WidgetBase", () => ({
  default: ({ children, subtitle, title }: any) => (
    <section aria-label={title}>
      <h2>{title}</h2>
      <p>{subtitle}</p>
      {children}
    </section>
  ),
}));

describe("tarjeta de próxima asamblea", () => {
  it("no ocupa espacio cuando no existe una asamblea", () => {
    const { container } = render(<AssemblyDashboardCard />);

    expect(container).toBeEmptyDOMElement();
  });

  it("ordena la información y abre el detalle de la asamblea", () => {
    render(
      <AssemblyDashboardCard
        assembly={{
          id: "assembly-7",
          start_time: "2026-09-21T19:00:00-04:00",
          status: "S",
          subject: "Asamblea ordinaria de copropietarios",
        }}
      />,
    );

    expect(screen.getByText("Programada")).toBeInTheDocument();
    expect(
      screen.getByText("Asamblea ordinaria de copropietarios"),
    ).toBeInTheDocument();
    expect(screen.getByText("Fecha y hora")).toBeInTheDocument();
    expect(screen.getByText("Lun, 21/09/2026 - 19:00")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Ver detalle/ }));
    expect(mocks.push).toHaveBeenCalledWith("/assemblies/assembly-7");
  });
});
