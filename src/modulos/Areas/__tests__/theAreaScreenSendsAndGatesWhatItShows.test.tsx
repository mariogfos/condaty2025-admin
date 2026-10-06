/**
 * Full module review of Areas, 2026-10-05: what the screen shows has to be
 * what it sends, and a button that the API answers with a 403 is not shown.
 *
 * - The «Garantía (Bs)» input lived in step 2 of the form and its value was
 *   never in the payload: the guarantee could not be set from `dev`
 *   (production sends it, `87439942`).
 * - The summary step and the list did not say which areas are members-only
 *   (production does, `d4c68ca9`).
 * - «Poner en mantenimiento» and «Desactivar área» opened with the page's `R`,
 *   and both endpoints are `habilidad:areas,U`.
 */
import React from "react";
import fs from "fs";
import path from "path";
import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const can = vi.fn();
vi.mock("@/mk/hooks/useAxios", () => ({
  default: () => ({ execute: vi.fn().mockResolvedValue({ data: {} }) }),
}));
vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({ showToast: vi.fn(), userCan: can }),
}));

import { buildAreaPayload } from "../RenderForm/RenderForm";
import FourPart from "../RenderForm/Partes/FourPart";
import RenderView from "../RenderView/RenderView";
import { AreaMembership, AreaPricing, AreaStatus } from "../Type/AreaEnums";

/** Source without comments: a pin must not be satisfied by its own docblock (rule 173). */
const withoutComments = (relative: string): string =>
  fs
    .readFileSync(path.resolve(__dirname, relative), "utf-8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

afterEach(() => {
  cleanup();
  can.mockReset();
});

describe("the form payload", () => {
  it("sends the guarantee of a paid area, as a number", () => {
    const payload = buildAreaPayload({
      has_price: "S",
      price: 100,
      guarantee_amount: "150.5",
    });

    expect(payload.guarantee_amount).toBe(150.5);
    expect(payload.is_free).toBe(AreaPricing.PAID);
  });

  it("sends no guarantee for a free area, whatever the input kept", () => {
    const payload = buildAreaPayload({ has_price: "N", guarantee_amount: 80 });

    expect(payload.guarantee_amount).toBe(0);
    expect(payload.is_free).toBe(AreaPricing.FREE);
  });
});

describe("members-only areas are visible to the admin", () => {
  it("the summary step says the area requires membership", () => {
    render(
      <FourPart item={{ requires_membership: AreaMembership.REQUIRED }} />,
    );

    expect(screen.getByText("Requiere membresía")).toBeTruthy();
  });

  it("the list declares the membership column", () => {
    const src = withoutComments("../Areas.tsx");

    expect(src).toMatch(
      /requires_membership:\s*\{[\s\S]*?onRender[\s\S]*?Solo miembros/,
    );
  });
});

describe("buttons the API answers with a 403 are not shown", () => {
  const item = { id: "a1", status: AreaStatus.ACTIVE, title: "Quincho" };

  it("hides the status toggle without areas:U", () => {
    can.mockReturnValue(false);
    render(
      <RenderView open item={item} onClose={() => {}} reLoad={() => {}} />,
    );

    expect(
      screen.queryByRole("button", { name: /Desactivar área/i }),
    ).toBeNull();
    expect(can).toHaveBeenCalledWith("areas", "U");
  });

  it("shows it with areas:U", () => {
    can.mockReturnValue(true);
    render(
      <RenderView open item={item} onClose={() => {}} reLoad={() => {}} />,
    );

    expect(
      screen.getByRole("button", { name: /Desactivar área/i }),
    ).toBeTruthy();
  });

  it("the maintenance button asks for areas:U", () => {
    const src = withoutComments("../Areas.tsx");

    expect(src).toMatch(
      /const extraButtons = !canUser\("areas", "U"\)\s*\?\s*\[\]/,
    );
  });
});
