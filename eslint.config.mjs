import nextPlugin from "@next/eslint-plugin-next";
import tsParser from "@typescript-eslint/parser";
import importPlugin from "eslint-plugin-import";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactPlugin from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

const rules = {
  ...reactPlugin.configs.recommended.rules,
  ...reactHooks.configs.recommended.rules,
  ...nextPlugin.configs.recommended.rules,
  "import/no-anonymous-default-export": "warn",
  "react/no-unknown-property": "off",
  "react/react-in-jsx-scope": "off",
  "react/prop-types": "off",
  "react/jsx-no-target-blank": "off",
  "jsx-a11y/alt-text": ["warn", { elements: ["img"], img: ["Image"] }],
  "jsx-a11y/aria-props": "warn",
  "jsx-a11y/aria-proptypes": "warn",
  "jsx-a11y/aria-unsupported-elements": "warn",
  "jsx-a11y/role-has-required-aria-props": "warn",
  "jsx-a11y/role-supports-aria-props": "warn",
};

export default [
  {
    files: ["**/*.{js,jsx,mjs,cjs,ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: {
      "@next/next": nextPlugin,
      import: importPlugin,
      "jsx-a11y": jsxA11y,
      react: reactPlugin,
      "react-hooks": reactHooks,
    },
    settings: { react: { version: "detect" } },
    rules,
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: { parser: tsParser },
  },
];
