// M1 (HALLAZGO-NEW-101, cross-project): flat config puro sin rushstack
// patch. La config anterior (`import nextConfig from "eslint-config-next"`)
//
// 1. Bumped el setup: `eslint-config-next@15.1.7` exporta un objeto
//    eslintrc-style (`extends`, `plugins`, etc.) que NO es compatible
//    con flat config sin el `@rushstack/eslint-patch` que ese paquete
//    incluye como dependencia. El patch crashea con `ESLint 9.39.4`
//    ("Failed to patch ESLint because the calling module was not
//    recognized"). Resultado: `next lint` y `npx eslint` ambos rotos.
//
// 2. Fix: reescribimos el flat config importando directamente los
//    plugins que el proyecto necesita (Next, TypeScript, hooks) sin
//    pasar por el wrapper de Next. Cero rushstack, cero patch, todo
//    flat config nativo.
//
// 3. Patrón reusable: si tenés un `eslint.config.mjs` que importa
//    `eslint-config-next` y rompe en ESLint 9, este es el workaround.
//    NO requiere bumpear dependencias.

import nextPlugin from "@next/eslint-plugin-next";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      ".next-build/**",
      "out/**",
      "playwright-report/**",
      "test-results/**",
      "nogit/**",
      "**/*.tsbuildinfo",
      "**/dist/**",
    ],
  },
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    plugins: {
      "@next/next": nextPlugin,
      "@typescript-eslint": tsPlugin,
      "react-hooks": reactHooks,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      ...reactHooks.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];
