import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * El contador de comentarios del detalle, visto desde `Contents.tsx`.
 *
 * `Contents` guarda una copia de la publicación abierta para que el detalle
 * muestre el comentario recién escrito sin cerrarse. Esa copia tenía dos
 * defectos medidos al traer el rediseño de producción:
 *
 * 1. 🔴 Cerrar el hilo SUMABA un comentario: el cierre llamaba a
 *    `handleCommentAdded`, que agregaba un `{}` a la copia.
 * 2. 🔴 La copia no se soltaba nunca: el próximo detalle que se abría mostraba
 *    la publicación ANTERIOR, porque `RenderView` prefiere la copia al dato.
 *
 * Producción los resolvió borrando la copia (y con ella el contador vivo); acá
 * se conserva y se corrige.
 */

let capturedMod: any;
let viewItem: Record<string, any>;
const reLoad = vi.fn();

vi.mock("@/mk/hooks/useCrud/useCrud", () => ({
  default: ({ mod }: any) => {
    capturedMod = mod;
    return {
      userCan: () => true,
      List: () =>
        capturedMod.renderView({
          open: true,
          onClose: vi.fn(),
          item: viewItem,
          extraData: {},
          onDel: vi.fn(),
        }),
      setStore: vi.fn(),
      onSearch: vi.fn(),
      searchs: {},
      onEdit: vi.fn(),
      onDel: vi.fn(),
      extraData: {},
      reLoad,
      data: null,
      onFilter: vi.fn(),
      openList: false,
    };
  },
}));

vi.mock("@/modulos/shared/useCrudUtils", () => ({
  default: () => ({
    onLongPress: vi.fn(),
    selItem: null,
    searchState: 0,
    setSearchState: vi.fn(),
  }),
}));

vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({ user: {}, showToast: vi.fn(), setStore: vi.fn(), store: {} }),
}));

// El detalle se reduce a lo que se mide: qué publicación muestra y cuántos
// comentarios cuenta, con la misma precedencia que el real.
vi.mock("@/modulos/Contents/RenderView/RenderView", () => ({
  default: (props: any) => {
    const shown = props.selectedContentData || props.item?.data;
    const count = Number(shown?.comments_count ?? shown?.comments?.length ?? 0);
    return (
      <div>
        <span data-testid="detail">
          {shown?.id}:{count}
        </span>
        <button onClick={() => props.onOpenComments(shown.id, shown)}>
          abrir hilo
        </button>
      </div>
    );
  },
}));

vi.mock("@/components/CommentsModal/CommentsModal", () => ({
  default: (props: any) =>
    props.isOpen ? (
      <div>
        <button onClick={props.onCommentAdded}>comentar</button>
        <button onClick={props.onClose}>cerrar hilo</button>
      </div>
    ) : null,
}));

vi.mock("@/components/DateRangeFilterModal/DateRangeFilterModal", () => ({
  default: () => null,
}));

import Contents from "@/modulos/Contents/Contents";

const publication = (id: number, comments: number) => ({
  data: { id, comments: Array.from({ length: comments }, (_, i) => ({ id: i })) },
});

describe("el contador de comentarios del detalle", () => {
  beforeEach(() => {
    reLoad.mockReset();
    viewItem = publication(14, 2);
  });

  it("cerrar el hilo sin comentar no suma nada", () => {
    render(<Contents />);

    fireEvent.click(screen.getByText("abrir hilo"));
    fireEvent.click(screen.getByText("cerrar hilo"));
    fireEvent.click(screen.getByText("abrir hilo"));
    fireEvent.click(screen.getByText("cerrar hilo"));

    expect(screen.getByTestId("detail")).toHaveTextContent("14:2");
  });

  it("un comentario nuevo suma uno en el detalle abierto y recarga la lista", () => {
    render(<Contents />);

    fireEvent.click(screen.getByText("abrir hilo"));
    fireEvent.click(screen.getByText("comentar"));
    fireEvent.click(screen.getByText("cerrar hilo"));

    expect(screen.getByTestId("detail")).toHaveTextContent("14:3");
    expect(reLoad).toHaveBeenCalledOnce();
  });

  it("el próximo detalle muestra SU publicación, no la anterior", () => {
    const { rerender } = render(<Contents />);

    fireEvent.click(screen.getByText("abrir hilo"));
    fireEvent.click(screen.getByText("comentar"));
    fireEvent.click(screen.getByText("cerrar hilo"));

    act(() => {
      viewItem = publication(20, 0);
    });
    rerender(<Contents />);

    expect(screen.getByTestId("detail")).toHaveTextContent("20:0");
  });
});
