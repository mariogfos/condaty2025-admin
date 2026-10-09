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
  it("muestra solo residentes, incluso si había un filtro de visitas guardado", () => {
    localStorage.setItem("administration/vehiclesParams", JSON.stringify({ filterBy: "kind:visitor" }));
    const { container } = render(<Vehicles />);
    expect(localStorage.getItem("administration/vehiclesParams")).toBeNull();
    expect(crud.config.paramsInitial.filterBy).toBe("kind:resident");
    expect(crud.config.fields.kind).toBeUndefined();
    expect(crud.config.fields.access_count).toBeUndefined();
    expect(crud.config.getFilter("vehicle_type", "car", { filterBy: { kind: "visitor" } })).toEqual({
      filterBy: { kind: "resident", vehicle_type: "car" },
    });
    expect(screen.getByText("Aún no hay vehículos de residentes registrados.")).toBeInTheDocument();
    expect(container.querySelector(".lucide-car")).not.toBeNull();
    expect(crud.config.fields.images.list.onRender({ item: { images: [] } })).toBe("Sin fotos");
    expect(crud.config.fields.images.list.onRender({ item: { images: ["a", "b", "c", "d"] } })).toBe("4 Fotos");

    fireEvent.click(screen.getByRole("button", { name: "Editar vehículo ABC123" }));
    fireEvent.click(screen.getByRole("button", { name: "Eliminar vehículo ABC123" }));
    expect(crud.edit).toHaveBeenCalledWith(expect.objectContaining({ id: 7 }));
    expect(crud.remove).toHaveBeenCalledWith(expect.objectContaining({ id: 7 }));
    expect(crud.config.fields.vehicle_type.filter.options()).toEqual([
      { id: "ALL", name: "Todos" },
      { id: "car", name: "Automóvil" },
      { id: "motorcycle", name: "Motocicleta" },
      { id: "truck", name: "Camioneta / camión" },
      { id: "other", name: "Otro" },
    ]);
  });
});
