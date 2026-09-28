import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ContentDestiny,
  ContentType,
} from "@/modulos/Contents/contentEnums";

/**
 * El muro rediseñado, traído de producción (`547edd3f`) con las reglas de `dev`.
 *
 * Producción compara `type` contra `"I"`/`"V"`/`"D"`, rellena `destiny` con
 * `"T"`, muestra en el toast el `message` crudo de un rechazo y tenía su propio
 * modal de comentarios. Acá se pinea lo que `dev` conserva:
 *
 * - los enums numéricos de `contentEnums` (api#461);
 * - el hilo es `CommentsModal`, el mismo de Publicaciones (va por `/v3`);
 * - «quién dio like» (admin#893) se abre desde la tarjeta;
 * - el contador sube SÓLO cuando se agrega un comentario, no al cerrar;
 * - el texto de un rechazo pasa por `leerElErrorDelApi`.
 *
 * Los casos de CDT-47 (fallo de red ≠ muro vacío) viven en
 * `reelErrorDeRedNoEsVacio.test.tsx`.
 */

type HookState = { data: any; loaded: boolean; error: any };

let initialState: HookState;
const executeMock = vi.fn();
const showToast = vi.fn();

vi.mock("@/mk/hooks/useAxios", () => ({
  default: (url?: string | null) => {
    const base = {
      countAxios: 0,
      cancel: vi.fn(),
      isStale: false,
      waiting: 0,
      setWaiting: vi.fn(),
    };
    if (url === "/v3/contents") {
      return { ...base, ...initialState, reLoad: vi.fn(), execute: vi.fn() };
    }
    return {
      ...base,
      data: null,
      loaded: true,
      error: "",
      reLoad: vi.fn(),
      execute: executeMock,
    };
  },
}));

vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({ user: {}, showToast }),
}));

vi.mock("@/mk/components/ui/Avatar/Avatar", () => ({
  Avatar: () => null,
}));

vi.mock("next/image", () => ({
  default: ({ alt, src }: any) => <img alt={alt} src={src} />,
}));

// El detalle se reduce a lo que se mide: qué publicación muestra, cuántos
// comentarios cuenta y las puertas que el muro le cablea.
vi.mock("@/modulos/Contents/RenderView/RenderView", () => ({
  default: (props: any) => {
    const shown = props.selectedContentData || props.item?.data;
    return props.open ? (
      <div>
        <span data-testid="detail">
          {shown?.id}:{shown?.comments_count}
        </span>
        <button onClick={() => props.onOpenComments(shown.id, shown)}>
          hilo desde el detalle
        </button>
        <button onClick={() => props.onEdit(shown)}>editar</button>
        <button onClick={() => props.onClose()}>cerrar detalle</button>
      </div>
    ) : null;
  },
}));

vi.mock("@/components/CommentsModal/CommentsModal", () => ({
  default: (props: any) =>
    props.isOpen ? (
      <div>
        <span data-testid="thread">{props.contentId}</span>
        <button onClick={props.onCommentAdded}>comentar</button>
        <button onClick={props.onClose}>cerrar hilo</button>
      </div>
    ) : null,
}));

vi.mock("@/components/PublicationLikesModal/PublicationLikesModal", () => ({
  default: (props: any) =>
    props.isOpen ? (
      <span data-testid="likes">
        {props.contentId}:{props.totalLikes}
      </span>
    ) : null,
}));

vi.mock("@/modulos/Contents/AddContent/AddContent", () => ({
  default: ({ item }: any) => (
    <span data-testid="edit-destiny">{JSON.stringify(item.destiny)}</span>
  ),
}));

import Reel from "@/modulos/Reel/Reel";

const publication = (overrides: Record<string, any> = {}) => ({
  id: 14,
  title: "Aviso importante",
  description: "Información para todos los residentes.",
  type: ContentType.IMAGEN,
  destiny: ContentDestiny.TODOS,
  files: ["https://example.test/publication.webp"],
  images: [],
  likes: 2,
  liked: 0,
  comments_count: 1,
  created_at: "2026-09-14 12:00:00",
  user: { id: "user-1", name: "Roberto", last_name: "Rueda", role1: [] },
  ...overrides,
});

const loadWall = (items: any[]) => {
  initialState = {
    data: { data: items, message: { total: items.length } },
    loaded: true,
    error: "",
  };
};

const likeResponds = (response: { data: any; error: any }) => {
  executeMock.mockImplementation(async (url: string) =>
    url === "/content-like" ? response : { data: null, error: null },
  );
};

beforeEach(() => {
  executeMock.mockReset();
  showToast.mockReset();
  loadWall([publication()]);
});

afterEach(() => {
  cleanup();
});

describe("el muro rediseñado", () => {
  it("distingue noticia de post y cuenta las publicaciones", () => {
    loadWall([publication(), publication({ id: 15, title: null })]);

    render(<Reel />);

    expect(screen.getByText("Noticia")).toBeInTheDocument();
    expect(screen.getByText("Post")).toBeInTheDocument();
    expect(screen.getByText("2 publicaciones")).toBeInTheDocument();
  });

  it("pinta la imagen con el tipo NUMÉRICO y abre el detalle", () => {
    render(<Reel />);

    fireEvent.click(
      screen.getByRole("button", { name: "Abrir detalle de la publicación" }),
    );

    expect(screen.getByTestId("detail")).toHaveTextContent("14:1");
  });

  it("con la carga fallida el encabezado NO dice «0 publicaciones»", () => {
    initialState = {
      data: null,
      loaded: true,
      error: { message: "Network Error", status: 0, data: {} },
    };

    render(<Reel />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.queryByText(/^\d+ publicaci/)).not.toBeInTheDocument();
  });

  it("abre «quién dio like» desde la tarjeta", () => {
    render(<Reel />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Ver las 2 personas que apoyaron esta publicación",
      }),
    );

    expect(screen.getByTestId("likes")).toHaveTextContent("14:2");
  });

  it("al editar, el destino por defecto es el NÚMERO de «Todos», no la letra", async () => {
    loadWall([publication({ destiny: null })]);
    executeMock.mockResolvedValue({ data: { success: true, data: {} }, error: null });

    render(<Reel />);

    fireEvent.click(
      screen.getByRole("button", { name: "Abrir detalle de la publicación" }),
    );
    fireEvent.click(screen.getByText("editar"));

    expect(await screen.findByTestId("edit-destiny")).toHaveTextContent(
      String(ContentDestiny.TODOS),
    );
  });
});

describe("los comentarios del muro", () => {
  it("se abren en el hilo compartido con la publicación de la tarjeta", () => {
    render(<Reel />);

    fireEvent.click(
      screen.getByRole("button", { name: "Comentar esta publicación" }),
    );

    expect(screen.getByTestId("thread")).toHaveTextContent("14");
  });

  it("cerrar el hilo sin comentar NO suma nada", () => {
    render(<Reel />);

    fireEvent.click(
      screen.getByRole("button", { name: "Comentar esta publicación" }),
    );
    fireEvent.click(screen.getByText("cerrar hilo"));
    fireEvent.click(
      screen.getByRole("button", { name: "Comentar esta publicación" }),
    );
    fireEvent.click(screen.getByText("cerrar hilo"));

    expect(
      screen.getByRole("button", {
        name: "Ver los 1 comentarios de esta publicación",
      }),
    ).toBeInTheDocument();
  });

  it("un comentario nuevo suma uno en la tarjeta y en el detalle abierto", () => {
    render(<Reel />);

    fireEvent.click(
      screen.getByRole("button", { name: "Abrir detalle de la publicación" }),
    );
    fireEvent.click(screen.getByText("hilo desde el detalle"));
    fireEvent.click(screen.getByText("comentar"));
    fireEvent.click(screen.getByText("cerrar hilo"));

    expect(screen.getByTestId("detail")).toHaveTextContent("14:2");
    expect(
      screen.getByRole("button", {
        name: "Ver los 2 comentarios de esta publicación",
      }),
    ).toBeInTheDocument();
  });

  it("el próximo detalle muestra SU publicación, no la anterior", () => {
    loadWall([publication(), publication({ id: 20, comments_count: 0 })]);

    render(<Reel />);

    const [first, second] = screen.getAllByRole("button", {
      name: "Abrir detalle de la publicación",
    });
    fireEvent.click(first);
    fireEvent.click(screen.getByText("hilo desde el detalle"));
    fireEvent.click(screen.getByText("comentar"));
    fireEvent.click(screen.getByText("cerrar hilo"));
    fireEvent.click(screen.getByText("cerrar detalle"));

    fireEvent.click(second);

    expect(screen.getByTestId("detail")).toHaveTextContent("20:0");
  });
});

describe("el apoyo del muro", () => {
  it("queda pintado cuando el API lo confirma", async () => {
    likeResponds({ data: { success: true, data: { ok: true } }, error: null });

    render(<Reel />);

    fireEvent.click(
      screen.getByRole("button", { name: "Apoyar esta publicación" }),
    );

    expect(
      await screen.findByRole("button", {
        name: "Quitar apoyo de esta publicación",
      }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(executeMock).toHaveBeenCalledWith("/content-like", "POST", {
      id: 14,
    });
    expect(showToast).not.toHaveBeenCalled();
  });

  it("un 200 rechazado se revierte y dice el motivo del API", async () => {
    likeResponds({
      data: { success: false, message: "Publicación no encontrada" },
      error: null,
    });

    render(<Reel />);

    fireEvent.click(
      screen.getByRole("button", { name: "Apoyar esta publicación" }),
    );

    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith(
        "Publicación no encontrada",
        "error",
      ),
    );
    expect(
      screen.getByRole("button", { name: "Apoyar esta publicación" }),
    ).toHaveAttribute("aria-pressed", "false");
    expect(
      screen.getByRole("button", {
        name: "Ver las 2 personas que apoyaron esta publicación",
      }),
    ).toBeInTheDocument();
  });

  it("un texto técnico NO llega al toast", async () => {
    likeResponds({
      data: {
        success: false,
        message: "SQLSTATE[23000]: Integrity constraint violation",
      },
      error: null,
    });

    render(<Reel />);

    fireEvent.click(
      screen.getByRole("button", { name: "Apoyar esta publicación" }),
    );

    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith(
        "No se pudo actualizar el apoyo",
        "error",
      ),
    );
  });

  it("un 5xx cae al genérico sin mirar el cuerpo", async () => {
    likeResponds({
      data: null,
      error: {
        message: "Request failed with status code 500",
        status: 500,
        data: { message: "detalle interno del servidor" },
      },
    });

    render(<Reel />);

    fireEvent.click(
      screen.getByRole("button", { name: "Apoyar esta publicación" }),
    );

    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith(
        "No se pudo actualizar el apoyo",
        "error",
      ),
    );
  });
});

describe("los estilos del muro (de producción)", () => {
  const reelStyles = readFileSync(
    resolve(process.cwd(), "src/modulos/Reel/Reel.module.css"),
    "utf8",
  );

  it("mantiene el muro centrado y las tarjetas con altura natural", () => {
    expect(reelStyles).toMatch(/\.reelContainer\s*\{[^}]*max-width:\s*860px;/);
    expect(reelStyles).toMatch(
      /\.contentCard\s*\{[^}]*height:\s*auto;[^}]*flex:\s*0 0 auto;/,
    );
  });

  it("mantiene las noticias neutrales y sin líneas decorativas", () => {
    const newsBadgeRule = reelStyles.match(/\.newsBadge\s*\{[^}]*\}/)?.[0];

    expect(newsBadgeRule).toContain("color: var(--cWhite);");
    expect(newsBadgeRule).toContain("background: var(--cModalSurfaceRaised);");
    expect(newsBadgeRule).toContain("border-color: var(--cModalBorder);");
    expect(reelStyles).toMatch(
      /\.contentCard:hover\s*\{[^}]*border-color:\s*var\(--cModalBorder/,
    );
    expect(reelStyles).not.toContain(".newsCard::before");
  });

  it("mantiene los avatares sin un marco cuadrado", () => {
    expect(reelStyles).not.toMatch(
      /\.userInfo > :first-child\s*\{[^}]*border:/,
    );
  });

  it("conserva los estados de error de CDT-47", () => {
    expect(reelStyles).toContain(".loadErrorState");
    expect(reelStyles).toContain(".loadMoreErrorRow");
    expect(reelStyles).toContain(".retryButton");
  });
});
