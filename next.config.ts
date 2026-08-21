import type { NextConfig } from "next";

const isManagedBuild = Boolean(process.env.VERCEL || process.env.CI);
const distDir = isManagedBuild ? ".next" : process.env.NEXT_DIST_DIR || ".next";

// 🔴 Acá NO va `eslint: { ignoreDuringBuilds: true }`.
//
// Esa clave dejo de existir en `NextConfig` con Next 16, y `tsc --noEmit`
// —que es lo que corre el job `analyse`— la marca como error. Se fue con
// `next lint`, que Next 16 elimino: el build ya no corre ESLint por su
// cuenta, asi que no hay nada que ignorar. El lint se corre aparte, con
// `pnpm lint` (que ahora llama a `eslint` directo).
const nextConfig: NextConfig = {
  distDir,

  // 🔴 Next 16 escribe `AGENTS.md` y `CLAUDE.md` en la raiz del repo cada vez
  // que arranca `next dev`, y lo hace SIN preguntar. Acá se apaga.
  //
  // No es ruido nada mas: las instrucciones que leen los agentes en este
  // proyecto viven en `Makromania/CLAUDE.md`, y un `CLAUDE.md` en la raiz de
  // condaty-admin —regenerado por una herramienta en cada arranque— compite con
  // esas y gana por estar mas cerca. Lo que genera Next son 10 lineas sobre como
  // usar Next, que no es lo que hace falta saber para tocar este repo.
  //
  // Medido el 2026-08-21: los dos archivos aparecieron como `??` en `git status`
  // apenas arranco el dev server. Ninguno de los dos existia en `dev`.
  agentRules: false,
};

export default nextConfig;

// import type { NextConfig } from "next";

// const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

// const nextConfig: NextConfig = {
//   eslint: {
//     ignoreDuringBuilds: true,
//   },
//   async rewrites() {
//     if (!apiUrl || !/^https?:\/\//.test(apiUrl)) {
//       return [];
//     }

//     return [
//       {
//         source: "/api-proxy/:path*",
//         destination: `${apiUrl}/:path*`,
//       },
//     ];
//   },
// };

// export default nextConfig;
