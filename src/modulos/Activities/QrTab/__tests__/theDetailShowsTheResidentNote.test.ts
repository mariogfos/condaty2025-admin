import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";

/**
 * 🔴 The invitation detail read `item.note`, a key `GET /v3/invitations` never
 * sends. The resident's note travels as `obs`, so the "Nota" row never
 * rendered — 2.862 of 6.082 invitations in the production copy have one.
 *
 * Read WITHOUT comments (skill rule 173): the comment that explains the bug
 * names `note`, and must not satisfy or break the pin.
 */
const withoutComments = (file: string): string =>
  readFileSync(file, "utf-8")
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

describe("QrTab RenderView", () => {
  const source = withoutComments(join(__dirname, "..", "RenderView", "RenderView.tsx"));

  it("shows the note from obs, the key the API sends", () => {
    expect(source).toMatch(/item\?\.obs\s*&&/);
    expect(source).toMatch(/\{item\.obs\}/);
  });

  it("does not read the non-existent note key", () => {
    expect(source).not.toMatch(/item\??\.note\b/);
  });
});
