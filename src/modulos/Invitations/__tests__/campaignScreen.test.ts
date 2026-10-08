import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { DEFAULT_CAMPAIGN_ID, isCampaignDeletable } from "../campaignRules";

// A source pin read WITHOUT comments (rule 173).
const withoutComments = (file: string): string =>
  fs
    .readFileSync(path.resolve(__dirname, file), "utf-8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

describe("Campañas — qué se puede borrar", () => {
  it("la campaña del sistema no se ofrece aunque nadie la use", () => {
    expect(isCampaignDeletable({ id: DEFAULT_CAMPAIGN_ID, clients_count: 0 })).toBe(false);
    expect(isCampaignDeletable({ id: String(DEFAULT_CAMPAIGN_ID), clients_count: 0 })).toBe(false);
  });

  it("una campaña en uso no se ofrece", () => {
    expect(isCampaignDeletable({ id: 2, clients_count: 3 })).toBe(false);
  });

  it("una campaña libre sí", () => {
    expect(isCampaignDeletable({ id: 2, clients_count: 0 })).toBe(true);
  });

  it("la pantalla usa la regla", () => {
    expect(withoutComments("../Invitations.tsx")).toMatch(
      /hideDel:\s*!isCampaignDeletable\(item\)/,
    );
  });
});

/**
 * 🔴 On a 4xx `execute` returns `{data: null, error}`. The form read
 * `data.message` and threw: the API's 422 never reached the superadmin.
 */
describe("Campañas — el rechazo del API llega al formulario", () => {
  const form = withoutComments("../RenderForm/RenderForm.tsx");

  it("toma el error de la respuesta", () => {
    expect(form).toMatch(/\{\s*data,\s*error\s*\}\s*=\s*await execute/);
    expect(form).toMatch(/error\?\.data\?\.message/);
  });

  it("la rama del error no lee data.message sin guarda", () => {
    expect(form).not.toMatch(/showToast\(\s*data\.message,\s*"error"/);
  });
});
