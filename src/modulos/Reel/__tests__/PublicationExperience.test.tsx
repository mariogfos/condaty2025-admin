import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CommentsModal from "@/components/CommentsModal/CommentsModal";
import PublicationLikesModal from "@/components/PublicationLikesModal/PublicationLikesModal";
import DetailModal from "@/mk/components/ui/DetailModal/DetailModal";
import Preview from "@/modulos/Contents/AddContent/Preview";
import RenderView from "@/modulos/Contents/RenderView/RenderView";

const executeMock = vi.fn();

const readStyles = (path: string) =>
  readFileSync(resolve(process.cwd(), path), "utf8");

vi.mock("@/mk/hooks/useAxios", () => ({
  default: () => ({ execute: executeMock }),
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
  type: "I",
  destiny: "T",
  files: ["https://example.test/publication.webp"],
  images: [],
  likes: 2,
  comments_count: 1,
  created_at: "2026-09-14 12:00:00",
  updated_at: "2026-09-14 12:00:00",
  user: {
    id: "user-1",
    name: "Roberto",
    last_name: "Rueda",
    role1: [{ name: "Administrador" }],
  },
};

describe("experiencia de publicaciones", () => {
  beforeEach(() => {
    executeMock.mockReset();
    Object.defineProperty(Element.prototype, "scrollIntoView", {
      configurable: true,
      value: vi.fn(),
    });
  });

  it("distingue una noticia de un post en el detalle y abre sus apoyos", () => {
    const onOpenLikes = vi.fn();
    const { rerender } = render(
      <RenderView
        open
        onClose={vi.fn()}
        item={{ data: publication }}
        showActions={false}
        onOpenLikes={onOpenLikes}
      />,
    );

    expect(
      screen.getByRole("dialog", { name: "Detalle de noticia" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Aviso importante")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Ver las 2 personas que apoyaron esta publicación",
      }),
    );
    expect(onOpenLikes).toHaveBeenCalledWith(14, 2);

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

  it("muestra quién apoyó sin exponer información privada", async () => {
    executeMock.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          items: [
            {
              id: 8,
              liked_at: "2026-09-14 12:10:00",
              person: {
                id: "owner-1",
                name: "Ana",
                last_name: "Pérez",
                url_avatar: null,
              },
            },
          ],
          pagination: {
            current_page: 1,
            last_page: 1,
            per_page: 30,
            total: 1,
            has_more: false,
          },
        },
      },
      error: null,
    });

    render(
      <PublicationLikesModal
        isOpen
        onClose={vi.fn()}
        contentId={14}
        totalLikes={1}
      />,
    );

    expect((await screen.findAllByText("Ana Pérez")).length).toBeGreaterThan(0);
    expect(executeMock).toHaveBeenCalledWith(
      "/contents/14/likes",
      "GET",
      { page: 1, perPage: 30 },
      false,
      true,
    );
    expect(screen.queryByText(/correo|teléfono|ci/i)).not.toBeInTheDocument();
  });

  it("carga la conversación y actualiza el muro después de comentar", async () => {
    const onCommentAdded = vi.fn();
    const comments = [
      {
        id: 3,
        comment: "Gracias por la información.",
        created_at: "2026-09-14 12:15:00",
        user: null,
        person: {
          id: "owner-2",
          name: "Carla",
          last_name: "Flores",
        },
      },
    ];

    executeMock
      .mockResolvedValueOnce({
        data: { success: true, data: comments },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { success: true, data: { id: 4 } },
        error: null,
      })
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

    expect(
      await screen.findByText("Gracias por la información."),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Nuevo comentario"), {
      target: { value: "Queda claro." },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Publicar comentario" }),
    );

    await waitFor(() => expect(onCommentAdded).toHaveBeenCalledOnce());
    expect(await screen.findByText("Queda claro.")).toBeInTheDocument();
  });

  it("presenta una preview fiel para noticia y post", () => {
    const { rerender } = render(
      <Preview
        formState={{
          isType: "N",
          type: "I",
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
    expect(screen.getByText("apoyos").parentElement).toHaveTextContent(
      "0 apoyos",
    );

    rerender(
      <Preview
        formState={{
          isType: "P",
          type: "I",
          title: "No debe mostrarse",
          description: "Post cotidiano.",
          files: [],
        }}
        extraData={null}
        action="edit"
      />,
    );

    expect(screen.getByText("Post")).toBeInTheDocument();
    expect(screen.queryByText("No debe mostrarse")).not.toBeInTheDocument();
  });

  it("mantiene el muro centrado y las tarjetas con altura natural", () => {
    const reelStyles = readStyles("src/modulos/Reel/Reel.module.css");

    expect(reelStyles).toMatch(
      /\.reelContainer\s*\{[^}]*max-width:\s*860px;/s,
    );
    expect(reelStyles).toMatch(
      /\.contentCard\s*\{[^}]*height:\s*auto;[^}]*flex:\s*0 0 auto;/s,
    );
  });

  it("mantiene las noticias neutrales y sin líneas decorativas", () => {
    const styleSheets = [
      readStyles("src/modulos/Reel/Reel.module.css"),
      readStyles("src/modulos/Contents/AddContent/Preview.module.css"),
      readStyles("src/modulos/Contents/RenderView/RenderView.module.css"),
    ];

    styleSheets.forEach((styleSheet) => {
      const newsBadgeRule = styleSheet.match(/\.newsBadge\s*\{[^}]*\}/s)?.[0];

      expect(newsBadgeRule).toContain("color: var(--cWhite);");
      expect(newsBadgeRule).toContain("background: var(--cModalSurfaceRaised);");
      expect(newsBadgeRule).toContain("border-color: var(--cModalBorder);");
    });

    expect(styleSheets[0]).toMatch(
      /\.contentCard:hover\s*\{[^}]*border-color:\s*var\(--cModalBorder/s,
    );
    expect(styleSheets[0]).not.toContain(".newsCard::before");
    expect(styleSheets[1]).not.toContain(".newsCard::before");
    expect(styleSheets[2]).not.toContain(".publication::before");
  });

  it("trunca a una línea los títulos del modal compartido", () => {
    const longTitle =
      "Personas que apoyaron una publicación con un título muy extenso";

    render(
      <DetailModal open={false} onClose={vi.fn()} title={longTitle}>
        <span>Contenido</span>
      </DetailModal>,
    );

    expect(screen.getByText(longTitle)).toHaveAttribute("title", longTitle);

    const modalStyles = readStyles(
      "src/mk/components/ui/DetailModal/detailModal.module.css",
    );
    const titleRule = modalStyles.match(/\.title\s*\{[^}]*\}/s)?.[0];

    expect(titleRule).toContain("overflow: hidden;");
    expect(titleRule).toContain("text-overflow: ellipsis;");
    expect(titleRule).toContain("white-space: nowrap;");
    expect(modalStyles).toMatch(
      /\.header\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\) auto;/s,
    );
  });
});
