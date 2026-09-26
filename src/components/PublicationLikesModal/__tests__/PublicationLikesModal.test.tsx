import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PublicationLikesModal from "@/components/PublicationLikesModal/PublicationLikesModal";

/**
 * Traído de producción (`PublicationLikesModal`, condaty-admin #836-#839) sin
 * el rediseño del muro. En `dev` el endpoint vive en `v3`
 * (`GET /api/v3/contents/{id}/likes`, condaty-api#638).
 */

const executeMock = vi.fn();

vi.mock("@/mk/hooks/useAxios", () => ({
  default: () => ({ execute: executeMock }),
}));

vi.mock("@/mk/components/ui/DataModal/DataModal", () => ({
  default: ({ children, open, title }: any) =>
    open ? (
      <section role="dialog" aria-label={title}>
        {children}
      </section>
    ) : null,
}));

vi.mock("@/mk/components/ui/Avatar/Avatar", () => ({
  Avatar: () => <span data-testid="avatar" />,
}));

const page = (items: any[], currentPage: number, hasMore: boolean) => ({
  data: {
    success: true,
    data: {
      items,
      pagination: {
        current_page: currentPage,
        last_page: hasMore ? currentPage + 1 : currentPage,
        per_page: 30,
        total: 2,
        has_more: hasMore,
      },
    },
  },
  error: null,
});

const like = (id: number, name: string) => ({
  id,
  liked_at: "2026-09-14 12:00:00",
  person: { id: `owner-${id}`, name, last_name: "Pérez", url_avatar: null },
});

describe("PublicationLikesModal", () => {
  beforeEach(() => executeMock.mockReset());

  it("pide la ruta v3 y lista a quienes apoyaron", async () => {
    executeMock.mockResolvedValueOnce(page([like(1, "Ana")], 1, false));

    render(<PublicationLikesModal isOpen onClose={vi.fn()} contentId={14} totalLikes={1} />);

    expect(await screen.findByText("Ana Pérez")).toBeInTheDocument();
    expect(executeMock).toHaveBeenCalledWith(
      "/v3/contents/14/likes",
      "GET",
      { page: 1, perPage: 30 },
      false,
      true,
    );
  });

  it("«Ver más» pide la página siguiente y no repite personas", async () => {
    executeMock
      .mockResolvedValueOnce(page([like(1, "Ana")], 1, true))
      .mockResolvedValueOnce(page([like(1, "Ana"), like(2, "Beto")], 2, false));

    render(<PublicationLikesModal isOpen onClose={vi.fn()} contentId={14} />);

    fireEvent.click(await screen.findByText("Ver más personas"));

    expect(await screen.findByText("Beto Pérez")).toBeInTheDocument();
    expect(screen.getAllByText("Ana Pérez")).toHaveLength(1);
    expect(executeMock).toHaveBeenLastCalledWith(
      "/v3/contents/14/likes",
      "GET",
      { page: 2, perPage: 30 },
      false,
      true,
    );
  });

  it("un error del API se muestra y se puede reintentar", async () => {
    executeMock
      .mockResolvedValueOnce({ data: { success: false, message: "Publicación no encontrada" }, error: null })
      .mockResolvedValueOnce(page([like(1, "Ana")], 1, false));

    render(<PublicationLikesModal isOpen onClose={vi.fn()} contentId={14} />);

    expect(await screen.findByText("Publicación no encontrada")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Reintentar"));

    await waitFor(() => expect(screen.getByText("Ana Pérez")).toBeInTheDocument());
  });

  it("cerrado no pide nada", () => {
    render(<PublicationLikesModal isOpen={false} onClose={vi.fn()} contentId={14} />);

    expect(executeMock).not.toHaveBeenCalled();
  });
});
