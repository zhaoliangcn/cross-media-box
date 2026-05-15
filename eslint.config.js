import globals from "globals";
import pluginJs from "@eslint/js";
import pluginTs from "@typescript-eslint/eslint-plugin";
import parserTs from "@typescript-eslint/parser";

export default [
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser
      },
      parser: parserTs,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module"
      }
    }
  },
  pluginJs.configs.recommended,
  {
    plugins: {
      "@typescript-eslint": pluginTs
    },
    rules: {
      ...pluginTs.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "warn"
    }
  }
];
