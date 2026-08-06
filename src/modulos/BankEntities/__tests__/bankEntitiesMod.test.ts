import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { getBankEntitiesMod } from "../config/bankEntitiesMod";
import { BankEntityStatus } from "../../BankAccounts/Type/BankType";

/**
 * Módulo Entidades Bancarias (2026-08-05).
 *
 * ⚠️ Nació al revés que los demás: el REPORTE existía desde S59 y la pantalla
 * no. `bank-entities` no aparecía en ninguna parte del front salvo la etiqueta
 * del filtro del historial de descargas, así que el reporte no tenía botón que
 * lo disparara. Migrando Bancos a Fase 6 quedó a la vista.
 */
describe("BankEntities mod config", () => {
  it("apunta al endpoint v3 del catálogo", () => {
    expect(getBankEntitiesMod().modulo).toBe("v3/bank-entities");
  });

  /**
   * 🔴 `endpoint` y `supportedFormats` son UNA sola cosa, y es el interruptor
   * silencioso del motor nuevo: `useCrud` elige qué botón renderiza mirando
   * `supportedFormats`, y el botón viejo no recibe `endpoint`. Con uno solo, el
   * export se va por el motor viejo sin ninguna diferencia visible.
   */
  it("el export entra por el motor nuevo: endpoint y supportedFormats juntos", () => {
    const mod = getBankEntitiesMod();

    expect(mod.export).toBe(false);
    expect(mod.exportAsync?.type).toBe("bank-entities");
    expect(mod.exportAsync?.supportedFormats).toEqual(["pdf", "xlsx", "csv"]);
    expect(mod.exportAsync?.endpoint).toBe("/v3/bank-entities");
  });

  it("el endpoint no repite el prefijo /api", () => {
    // El baseURL de axios ya termina en `/api`: con el prefijo queda
    // `.../api/api/...` → 404.
    expect(getBankEntitiesMod().exportAsync?.endpoint).not.toMatch(/^\/api\//);
  });

  /**
   * 🔴 El permiso NO puede ser de administrador de condominio.
   *
   * `bank_entities` no tiene `client_id`: es un catálogo COMPARTIDO. Si esta
   * pantalla quedara con un permiso de condominio, cualquier admin editaría el
   * catálogo de TODOS los clientes — y el back no lo frena: su único chequeo es
   * `Auth::user()->type !== 'ADM'`.
   */
  it("la pantalla es de backoffice, no de condominio", () => {
    expect(getBankEntitiesMod().permiso).toBe("superadmins");
  });
});

describe("BankEntities: dónde vive la pantalla", () => {
  const RAIZ = process.cwd();

  it("está enganchada al menú de Backoffice y no al de Finanzas", () => {
    const menu = fs.readFileSync(
      path.join(RAIZ, "src/components/MainMenu/mainMenuConfig.ts"),
      "utf-8"
    );

    // El bloque de Backoffice va desde su key hasta el arranque del siguiente
    // dropdown. Se lee el archivo ENTERO y se corta por bloque: prettier parte
    // los objetos en varias líneas, así que buscar renglón por renglón no ve
    // dónde cae cada entrada.
    const desdeBackoffice = menu.slice(menu.indexOf('key: "Backoffice"'));
    const bloqueBackoffice = desdeBackoffice.slice(
      0,
      desdeBackoffice.indexOf('key: "Finanzas"')
    );

    expect(bloqueBackoffice).toContain('href: "/bank-entities"');
  });

  it("la página existe y monta el módulo", () => {
    const pagina = fs.readFileSync(
      path.join(RAIZ, "src/app/bank-entities/page.tsx"),
      "utf-8"
    );

    expect(pagina).toContain("BankEntities");
  });

  it("la etiqueta del menú está traducida en los tres idiomas", () => {
    const mensajes = fs.readFileSync(path.join(RAIZ, "src/i18n/messages.ts"), "utf-8");
    const apariciones = mensajes.match(/bankEntities:/g) ?? [];

    expect(apariciones).toHaveLength(3);
  });
});

describe("BankEntities: el estado va numérico", () => {
  /**
   * 🔴 Los chars legacy contra una columna `tinyint` no fallan: MariaDB
   * convierte el char a 0 y sigue. Un filtro con `'A'` devolvería las
   * INACTIVAS y el usuario vería una lista equivocada sin ningún error.
   *
   * Se lee el archivo ENTERO, no renglón por renglón — prettier parte las
   * definiciones y un escaneo por línea se come lo que viene a buscar.
   */
  it("ni el filtro ni el form mandan chars", () => {
    const fuente = fs.readFileSync(
      path.join(process.cwd(), "src/modulos/BankEntities/BankEntities.tsx"),
      "utf-8"
    );

    expect(fuente).not.toMatch(/id:\s*["']A["']/);
    expect(fuente).not.toMatch(/id:\s*["']X["']/);
    expect(fuente).not.toMatch(/id:\s*["']I["']/);
    expect(fuente).toContain("BankEntityStatus.ACTIVE");
    expect(fuente).toContain("BankEntityStatus.INACTIVE");
  });

  it("los valores del enum son los que espera la columna", () => {
    expect(BankEntityStatus.ACTIVE).toBe(1);
    expect(BankEntityStatus.INACTIVE).toBe(0);
  });
});
