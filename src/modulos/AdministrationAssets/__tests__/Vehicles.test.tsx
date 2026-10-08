import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Vehicles from "../Vehicles";

const crud = vi.hoisted(() => ({
  config: null as any,
  listProps: null as any,
  edit: vi.fn(),
  remove: vi.fn(),
}));

vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({ userCan: () => true }),
}));

vi.mock("@/mk/hooks/useCrud/useCrud", () => ({
  default: (config: any) => {
    crud.config = config;
    return {
      userCan: () => true,
      setStore: vi.fn(),
      onSearch: vi.fn(),
      searchs: {},
      params: { filterBy: config.paramsInitial.filterBy },
      onEdit: crud.edit,
      onDel: crud.remove,
      List: (props: any) => {
        crud.listProps = props;
        return <div>
          {props.onRenderEmpty()}
          {props.onButtonActions?.({ id: 7, plate: "ABC123", kind: "resident" })}
        </div>;
      },
    };
  },
}));
vi.mock("@/modulos/shared/useCrudUtils", () => ({ default: () => ({}) }));

describe("Padrón de vehículos", () => {
  it("entra filtrado por residentes y ofrece acciones cuadradas por fila", () => {
    const { container } = render(<Vehicles />);
    expect(crud.config.paramsInitial.filterBy).toBe("kind:resident");
    expect(screen.getByText("Aún no hay vehículos de residentes registrados.")).toBeInTheDocument();
    expect(container.querySelector(".lucide-car")).not.toBeNull();
    expect(crud.config.fields.images.list.onRender({ item: { images: [] } })).toBe("Sin fotos");
    expect(crud.config.fields.images.list.onRender({ item: { images: ["a", "b", "c", "d"] } })).toBe("4 Fotos");

    fireEvent.click(screen.getByRole("button", { name: "Editar vehículo ABC123" }));
    fireEvent.click(screen.getByRole("button", { name: "Eliminar vehículo ABC123" }));
    expect(crud.edit).toHaveBeenCalledWith(expect.objectContaining({ id: 7 }));
    expect(crud.remove).toHaveBeenCalledWith(expect.objectContaining({ id: 7 }));
    expect(crud.config.fields.kind.filter.options()).toEqual([
      { id: "resident", name: "Residente" }, { id: "visitor", name: "Visita" },
    ]);
    const visitorActions = crud.listProps.onButtonActions({ id: "visitor:VIS123", kind: "visitor", plate: "VIS123" });
    const { container: visitorContainer } = render(visitorActions);
    expect(visitorContainer.querySelector("button")).toBeNull();
  });
});
