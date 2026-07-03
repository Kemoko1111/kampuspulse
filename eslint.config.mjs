import { dirname } from "path";
import { fileURLToPath } from "url";
import { defineConfig, globalIgnores } from "eslint/config";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// eslint-config-next still ships legacy eslintrc-style `extends` exports
// (no native flat-config array), so bridge it through FlatCompat.
const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = defineConfig([
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
