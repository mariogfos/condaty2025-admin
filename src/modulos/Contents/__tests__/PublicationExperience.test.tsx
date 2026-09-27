import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CommentsModal from "@/components/CommentsModal/CommentsModal";
import Preview from "@/modulos/Contents/AddContent/Preview";
import RenderView from "@/modulos/Contents/RenderView/RenderView";
import { ContentDestiny, ContentType } from "@/modulos/Contents/contentEnums";

/**
 * El rediseño del detalle, del hilo y de la vista previa de una publicación,
 * traído de producción (`547edd3f`) sobre el código de `dev`.
 *
 * 🔴 Producción compara `type` contra `"I"`/`"V"`/`"D"` y `destiny` contra
 * `"T"`, y le pega a `/comments`. En `dev` las dos columnas son enums numéricos
 * (api#461) y la ruta legacy no existe: por eso cada caso de acá usa los
 * NÚMEROS y afirma la ruta `/v3`. Con las letras de producción, estos casos
 * caen al último `else` —«Contenido no disponible»— o al documento.
 *
 * Adaptado de `src/modulos/Reel/__tests__/PublicationExperience.test.tsx` de
 * producción; los casos del muro (`Reel`) quedan para cuando se traiga el muro.
 */

const executeMock = vi.fn();

vi.mock("@/mk/hooks/useAxios", () => ({
  default: () => ({ execute: executeMock }),
}));

vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({
    showToast: vi.fn(),
    user: { name: "Roberto", last_name: "Rueda", role: { name: "Administrador" } },
  }),
}));

vi.mock("@/mk/components/ui/DataModal/DataModal", () => ({
  default: ({ children, open, title }: any) =>
    open ? (
      <section role="dialog" aria-label={title}>
        <h1>{title}</h1>
        {children}
      </section>
    ) : null,
}));

vi.mock("@/mk/components/ui/Avatar/Avatar", () => ({
  Avatar: ({ name }: any) => <span data-testid="avatar">{name}</span>,
}));

vi.mock("@/mk/components/ui/Image/Image", () => ({
  Image: ({ alt, src }: any) => <img alt={alt} src={src} />,
}));

vi.mock("next/image", () => ({
  default: ({ alt, src }: any) => <img alt={alt} src={src} />,
}));

vi.mock("react-player", () => ({
  default: ({ url }: any) => <div data-testid="video-player">{url}</div>,
}));

const publication = {
  id: 14,
  title: "Aviso importante",
  description: "Información para todos los residentes.",
  type: ContentType.IMAGEN,
  destiny: ContentDestiny.TODOS,
  files: ["https://example.test/publication.webp"],
  images: [],
  likes: 2,
  comments: [{ id: 1 }],
  created_at: "2026-09-14 12:00:00",
  updated_at: "2026-09-14 12:00:00",
  user: {
    id: "user-1",
    name: "Roberto",
    last_name: "Rueda",
    role1: [{ name: "Administrador" }],
  },
};

const renderDetail = (data: Record<string, any>) =>
  render(
    <RenderView open onClose={vi.fn()} item={{ data }} showActions={false} />,
  );

describe("el detalle de una publicación", () => {
  beforeEach(() => {
    executeMock.mockReset();
  });

  it("distingue una noticia de un post por el título", () => {
    const { rerender } = renderDetail(publication);

    expect(
      screen.getByRole("dialog", { name: "Detalle de noticia" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Aviso importante")).toBeInTheDocument();

    rerender(
      <RenderView
        open
        onClose={vi.fn()}
        item={{ data: { ...publication, title: null } }}
        showActions={false}
      />,
    );
    expect(
      screen.getByRole("dialog", { name: "Detalle de post" }),
    ).toBeInTheDocument();
  });

  it("pinta la imagen con el tipo NUMÉRICO del API", () => {
    renderDetail(publication);

    expect(
      screen.getByAltText("Imagen 1 de la publicación"),
    ).toHaveAttribute("src", "https://example.test/publication.webp");
    expect(screen.queryByText("Contenido no disponible")).not.toBeInTheDocument();
  });

  it("pinta el documento y el video con sus números", () => {
    const { rerender } = renderDetail({
      ...publication,
      type: ContentType.DOCUMENTO,
      files: ["https://example.test/acta.pdf"],
    });

    expect(screen.getByRole("link", { name: /Abrir documento/ })).toHaveAttribute(
      "href",
      "https://example.test/acta.pdf",
    );

    rerender(
      <RenderView
        open
        onClose={vi.fn()}
        item={{
          data: {
            ...publication,
            type: String(ContentType.VIDEO),
            files: [],
            url: "https://example.test/video.mp4",
          },
        }}
        showActions={false}
      />,
    );
    expect(screen.getByTestId("video-player")).toHaveTextContent(
      "https://example.test/video.mp4",
    );
  });

  it("dice a quién va dirigida con el destino NUMÉRICO", () => {
    const { rerender } = renderDetail(publication);
    expect(screen.getByText("Toda la comunidad")).toBeInTheDocument();

    rerender(
      <RenderView
        open
        onClose={vi.fn()}
        item={{ data: { ...publication, destiny: ContentDestiny.GUARDIAS } }}
        showActions={false}
      />,
    );
    expect(screen.getByText("Guardias")).toBeInTheDocument();
  });

  it("abre «quién dio like» desde el propio detalle, por /v3", async () => {
    executeMock.mockResolvedValue({
      data: {
        success: true,
        data: {
          items: [],
          pagination: {
            current_page: 1,
            last_page: 1,
            per_page: 30,
            total: 0,
            has_more: false,
          },
        },
      },
      error: null,
    });
    renderDetail(publication);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Ver las 2 personas que apoyaron esta publicación",
      }),
    );

    await waitFor(() =>
      expect(executeMock).toHaveBeenCalledWith(
        "/v3/contents/14/likes",
        "GET",
        { page: 1, perPage: 30 },
        false,
        true,
      ),
    );
  });

  it("cuenta los comentarios del detalle y abre el hilo", () => {
    const onOpenComments = vi.fn();
    render(
      <RenderView
        open
        onClose={vi.fn()}
        item={{ data: publication }}
        showActions={false}
        onOpenComments={onOpenComments}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Ver los 1 comentarios de esta publicación",
      }),
    );
    expect(onOpenComments).toHaveBeenCalledWith(14, publication);
  });
});

describe("el hilo de comentarios", () => {
  beforeEach(() => {
    executeMock.mockReset();
    Object.defineProperty(Element.prototype, "scrollIntoView", {
      configurable: true,
      value: vi.fn(),
    });
  });

  it("carga por /v3 y avisa después de comentar", async () => {
    const onCommentAdded = vi.fn();
    const comments = [
      {
        id: 3,
        comment: "Gracias por la información.",
        created_at: "2026-09-14 12:15:00",
        user: null,
        person: { id: "owner-2", name: "Carla", last_name: "Flores" },
      },
    ];

    executeMock
      .mockResolvedValueOnce({ data: { success: true, data: comments }, error: null })
      .mockResolvedValueOnce({ data: { success: true, data: { id: 4 } }, error: null })
      .mockResolvedValueOnce({
        data: {
          success: true,
          data: [
            ...comments,
            {
              id: 4,
              comment: "Queda claro.",
              created_at: "2026-09-14 12:20:00",
              user: { id: "user-1", name: "Roberto" },
              person: null,
            },
          ],
        },
        error: null,
      });

    render(
      <CommentsModal
        isOpen
        onClose={vi.fn()}
        contentId={14}
        onCommentAdded={onCommentAdded}
      />,
    );

    expect(await screen.findByText("Gracias por la información.")).toBeInTheDocument();
    expect(executeMock).toHaveBeenNthCalledWith(
      1,
      "/v3/comments",
      "GET",
      { fullType: "L", id: 14, type: "C", perPage: -1, page: 1 },
      false,
      true,
    );

    fireEvent.change(screen.getByLabelText("Nuevo comentario"), {
      target: { value: "Queda claro." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Publicar comentario" }));

    await waitFor(() => expect(onCommentAdded).toHaveBeenCalledOnce());
    expect(executeMock).toHaveBeenNthCalledWith(
      2,
      "/v3/comments",
      "POST",
      { id: 14, comment: "Queda claro.", type: "C" },
      false,
      true,
    );
    expect(await screen.findByText("Queda claro.")).toBeInTheDocument();
  });

  it("no muestra el texto técnico de un rechazo, y deja reintentar", async () => {
    executeMock.mockResolvedValueOnce({
      data: {
        success: false,
        message: "SQLSTATE[42S22]: Column not found: 1054 Unknown column 'x'",
      },
      error: null,
    });

    render(<CommentsModal isOpen onClose={vi.fn()} contentId={14} />);

    expect(
      await screen.findByText("No se pudieron cargar los comentarios"),
    ).toBeInTheDocument();
    expect(screen.queryByText(/SQLSTATE/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeInTheDocument();
  });
});

describe("la vista previa del formulario", () => {
  it("presenta noticia y post, con el tipo NUMÉRICO", () => {
    const { rerender } = render(
      <Preview
        formState={{
          isType: "N",
          type: ContentType.IMAGEN,
          title: "Corte programado",
          description: "Mañana habrá mantenimiento.",
          files: ["https://example.test/preview.webp"],
        }}
        extraData={null}
        action="add"
      />,
    );

    expect(screen.getByText("Noticia")).toBeInTheDocument();
    expect(screen.getByText("Corte programado")).toBeInTheDocument();
    expect(screen.getByAltText("Vista previa de la publicación")).toHaveAttribute(
      "src",
      "https://example.test/preview.webp",
    );

    rerender(
      <Preview
        formState={{
          isType: "P",
          type: ContentType.VIDEO,
          title: "No debe mostrarse",
          description: "Post cotidiano.",
          url: "https://example.test/video.mp4",
        }}
        extraData={null}
        action="edit"
      />,
    );

    expect(screen.getByText("Post")).toBeInTheDocument();
    expect(screen.queryByText("No debe mostrarse")).not.toBeInTheDocument();
    expect(screen.getByText("Video enlazado")).toBeInTheDocument();
  });
});
