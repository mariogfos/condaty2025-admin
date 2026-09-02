/**
 * La clave con la que el token vive en `localStorage`.
 *
 * ────────────────────────────────────────────────────────────────────────
 * ⚠️ POR QUÉ ESTO ES UNA CONSTANTE Y NO LA EXPRESIÓN REPETIDA
 * ────────────────────────────────────────────────────────────────────────
 *
 * Era `(process.env.NEXT_PUBLIC_AUTH_IAM as string) + "token"`, escrita en
 * **catorce** lugares del repo: el login, el contexto de sesión, el
 * interceptor, y cinco pantallas que arman su propia descarga.
 *
 * Repetida así, la expresión tiene dos formas de romperse y ninguna avisa:
 *
 *  1. **La variable no está en el build.** El `as string` calla al compilador
 *     y la clave queda en `"undefinedtoken"`. Hoy no rompe porque las catorce
 *     dicen lo mismo — pero el día que una sola lleve un valor por defecto y
 *     las otras no, el que ESCRIBE el token y el que lo LEE usan claves
 *     distintas: el usuario entra y aparece deslogueado, sin un solo error.
 *  2. **Alguien cambia el sufijo en un lugar.** Mismo final.
 *
 * Producción llegó acá por el camino largo: `7aca7439` (#749) centralizó lo
 * mismo después de que la desalineación mordiera.
 *
 * ⚠️ El valor por defecto NO es cosmético: es lo que hace que un build sin la
 * variable siga teniendo una clave legible en vez de `"undefinedtoken"`.
 */
export const CLAVE_DEL_TOKEN = `${
  process.env.NEXT_PUBLIC_AUTH_IAM || "/v3/adm-iam"
}token`;
