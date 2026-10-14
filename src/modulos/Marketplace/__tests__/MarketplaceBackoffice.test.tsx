import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MarketplaceBackoffice from "../MarketplaceBackoffice";

const mocks = vi.hoisted(() => ({
  execute: vi.fn(),
  setStore: vi.fn(),
  user: { fosrole_id: "fos-1" } as { fosrole_id: string | null },
}));

vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({ user: mocks.user, setStore: mocks.setStore }),
}));
vi.mock("@/mk/hooks/useAxios", () => ({
  default: () => ({ execute: mocks.execute }),
}));
vi.mock("@/components/auth/NotAccess/NotAccess", () => ({
  default: () => <div>Sin acceso</div>,
}));
vi.mock("@/mk/components/ui/TabsButton/TabsButtons", () => ({
  default: ({ tabs, sel, setSel }: any) => (
    <div>
      {tabs.map((tab: any) => (
        <button type="button" key={tab.value} aria-pressed={sel === tab.value}
          onClick={() => setSel(tab.value)}>{tab.text}</button>
      ))}
    </div>
  ),
}));
vi.mock("@/mk/components/forms/Button/Button", () => ({
  default: ({ children, onClick, disabled }: any) => (
    <button type="button" onClick={onClick} disabled={disabled}>{children}</button>
  ),
}));
vi.mock("@/mk/components/forms/DataSearch/DataSearch", () => ({
  default: ({ name, value, placeholder, setSearch }: any) => (
    <input aria-label={name} value={value} placeholder={placeholder}
      onChange={(event) => setSearch(event.target.value)} />
  ),
}));
vi.mock("@/mk/components/forms/Input/Input", () => ({
  default: ({ name, label, value, onChange }: any) => (
    <label>{label}<input aria-label={name} value={value} onChange={onChange} /></label>
  ),
}));
vi.mock("@/mk/components/forms/Select/Select", () => ({
  default: ({ name, label, value, options, onChange }: any) => (
    <label>{label}
      <select aria-label={name} value={value} onChange={onChange}>
        {options.map((option: any) => (
          <option key={option.id} value={option.id}>{option.name}</option>
        ))}
      </select>
    </label>
  ),
}));
vi.mock("@/mk/components/ui/DataModal/DataModal", () => ({
  default: ({ open, title, children, buttonText, buttonExtra, onSave, onClose }: any) =>
    open ? (
      <div role="dialog" aria-label={title}>
        {children}
        {buttonText ? <button type="button" onClick={onSave}>{buttonText}</button> : null}
        {buttonExtra}
        <button type="button" onClick={onClose}>Cerrar modal</button>
      </div>
    ) : null,
}));
vi.mock("@/mk/components/ui/Table/Table", () => ({
  default: ({ id, data, header, onRowClick }: any) => (
    <table data-testid={id}>
      <tbody>
        {data.map((item: any) => (
          <tr key={item.id || item.owner_id} onClick={() => onRowClick?.(item)}>
            {header.map((column: any) => (
              <td key={column.key}>
                {column.onRender
                  ? column.onRender({ item, value: item[column.key] })
                  : String(item[column.key] ?? "")}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
}));
vi.mock("@/mk/components/ui/Pagination/Pagination", () => ({
  default: ({ currentPage, totalPages, onPageChange }: any) => (
    <div>
      <span>Página {currentPage} de {totalPages}</span>
      <button type="button" onClick={() => onPageChange(currentPage + 1)}>Página siguiente</button>
    </div>
  ),
}));
vi.mock("@/components/NoData/EmptyData", () => ({
  default: ({ message, line2 }: any) => <div>{message} {line2}</div>,
}));

const listing = {
  id: "listing-1",
  title: "Bicicleta de paseo",
  status: "pending",
  client_id: "client-1",
  price: 200,
  currency: "BOB",
  category: { id: 1, name: "Deportes" },
  owner: { id: "owner-1", name: "Ana Rojas" },
  visibility: "same_condominium",
  is_featured: false,
};

describe("Marketplace de Backoffice", () => {
  beforeEach(() => {
    mocks.execute.mockReset();
    mocks.setStore.mockReset();
    mocks.user.fosrole_id = "fos-1";
    mocks.execute.mockImplementation(async (url: string, method: string, payload: any) => {
      if (url.endsWith("/listings") && method === "GET") {
        return {
          data: {
            success: true,
            data: {
              items: [listing],
              pagination: {
                current_page: payload.page,
                last_page: 2,
                total: 26,
              },
            },
          },
        };
      }
      if (url.endsWith("/categories") && method === "GET") {
        return { data: { success: true, data: [
          { id: 1, name: "Deportes", slug: "deportes", is_active: true },
          { id: 2, name: "Hogar", slug: "hogar", is_active: false },
        ] } };
      }
      if (url.endsWith("/clients")) {
        return { data: { success: true, data: [{ id: "client-1", name: "Bosques" }] } };
      }
      if (url.endsWith("/blocked-owners")) {
        return { data: { success: true, data: [
          { owner_id: "owner-2", name: "Luis", last_name: "Pérez", reason: "Spam" },
        ] } };
      }
      if (url.endsWith("/listings/listing-1")) {
        return { data: { success: true, data: listing } };
      }
      if (url.endsWith("/approve")) {
        return { data: { success: true, data: listing, message: "Aprobada" } };
      }
      return { data: { success: true, data: {}, message: "Guardado" } };
    });
  });

  it("muestra una sola sección a la vez y sus controles correspondientes", async () => {
    render(<MarketplaceBackoffice />);
    expect(await screen.findByTestId("marketplace-listings")).toBeInTheDocument();
    expect(screen.queryByTestId("marketplace-categories")).not.toBeInTheDocument();
    expect(screen.getByLabelText("client_id")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Buscar publicación o residente")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Categorías" }));
    expect(await screen.findByTestId("marketplace-categories")).toBeInTheDocument();
    expect(screen.queryByTestId("marketplace-listings")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Nueva categoría" })).toBeInTheDocument();
    expect(screen.getByLabelText("category_status")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("category_status"), { target: { value: "active" } });
    expect(screen.getByText("Deportes")).toBeInTheDocument();
    expect(screen.queryByText("Hogar")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Residentes" }));
    expect(await screen.findByTestId("marketplace-blocked-owners")).toBeInTheDocument();
    expect(screen.getByText("Luis Pérez")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Nueva categoría" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("client_id")).not.toBeInTheDocument();
  });

  it("pagina publicaciones sin volver a pedir categorías ni residentes", async () => {
    render(<MarketplaceBackoffice />);
    expect(await screen.findByText("Página 1 de 2")).toBeInTheDocument();
    await waitFor(() => expect(mocks.execute).toHaveBeenCalledWith(
      "/backoffice/marketplace/blocked-owners", "GET", {}, false, true,
    ));
    mocks.execute.mockClear();

    fireEvent.click(screen.getByRole("button", { name: "Página siguiente" }));
    await waitFor(() => expect(mocks.execute).toHaveBeenCalledWith(
      "/backoffice/marketplace/listings", "GET",
      expect.objectContaining({ page: 2, per_page: 25 }), false, true,
    ));
    expect(mocks.execute.mock.calls.some(([url]) => url.endsWith("/categories"))).toBe(false);
    expect(mocks.execute.mock.calls.some(([url]) => url.endsWith("/blocked-owners"))).toBe(false);
  });

  it("crea y edita categorías desde el modal reutilizado", async () => {
    render(<MarketplaceBackoffice />);
    fireEvent.click(screen.getByRole("button", { name: "Categorías" }));
    expect(await screen.findByTestId("marketplace-categories")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Nueva categoría" }));
    fireEvent.change(screen.getByLabelText("marketplace-category"), {
      target: { value: "Juguetes" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Crear categoría" }));
    await waitFor(() => expect(mocks.execute).toHaveBeenCalledWith(
      "/backoffice/marketplace/categories", "POST", { name: "Juguetes" },
    ));

    fireEvent.click(screen.getByRole("button", { name: "Editar categoría Deportes" }));
    fireEvent.change(screen.getByLabelText("marketplace-category"), {
      target: { value: "Deportes y juegos" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() => expect(mocks.execute).toHaveBeenCalledWith(
      "/backoffice/marketplace/categories/1", "PUT",
      { name: "Deportes y juegos", is_active: true },
    ));
  });

  it("conserva las acciones de moderación y bloqueo desde el detalle", async () => {
    render(<MarketplaceBackoffice />);
    expect(await screen.findByTestId("marketplace-listings")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Ver publicación Bicicleta de paseo" }));
    expect(await screen.findByRole("dialog", { name: "Detalle de publicación" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Aprobar" }));
    await waitFor(() => expect(mocks.execute).toHaveBeenCalledWith(
      "/backoffice/marketplace/listings/listing-1/approve", "POST", {},
    ));
    fireEvent.click(screen.getByRole("button", { name: "Bloquear residente" }));
    await waitFor(() => expect(mocks.execute).toHaveBeenCalledWith(
      "/backoffice/marketplace/owners/owner-1/block", "POST", { reason: null },
    ));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Detalle de publicación" })).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Residentes" })).toHaveAttribute("aria-pressed", "true");
  });

  it("no muestra el backoffice a un administrador sin rol FOS", () => {
    mocks.user.fosrole_id = null;
    render(<MarketplaceBackoffice />);
    expect(screen.getByText("Sin acceso")).toBeInTheDocument();
    expect(screen.queryByText("Marketplace")).not.toBeInTheDocument();
    expect(mocks.execute).not.toHaveBeenCalled();
  });
});
