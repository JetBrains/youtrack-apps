---
 to: eslint.config.mjs
---
import { fixupConfigRules } from "@eslint/compat";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default tseslint.config(
  { files: ["**/*.{js,cjs,ts,tsx}"] },
  {
    ignores: [
      "**/dist",
      "eslint.config.mjs",
      // Generated files — rebuilt on every backend build, never hand-edited
      "src/api/api.d.ts",
      "src/api/api.zod.ts",
      "src/api/app.d.ts",
      "src/api/extended-*.d.ts",
    ],
  },
  ...fixupConfigRules(
    compat.extends(
      "@jetbrains",
      "@jetbrains/eslint-config/react",
      "@jetbrains/eslint-config/browser",
      "plugin:react-hooks/recommended",
    ),
  ),
  ...tseslint.configs.recommended,
  {
    plugins: {
      "react-refresh": reactRefresh,
    },

    languageOptions: {
      globals: {
        ...globals.browser,
      },

      parser: tseslint.parser,
    },

    rules: {
      "react-refresh/only-export-components": [
        "warn",
        {
          allowConstantExport: true,
        },
      ],
      // Relaxed rules for better developer experience
      "react/jsx-no-literals": "off",
      "@typescript-eslint/no-explicit-any": "warn", // Downgrade from error to warning
      "@typescript-eslint/no-unused-vars": ["warn", { 
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_" 
      }], // Allow unused vars prefixed with _
      "no-console": "off", // Allow console.log during development
      "@typescript-eslint/ban-ts-comment": ["error", {
        "ts-ignore": "allow-with-description",
        "ts-expect-error": "allow-with-description"
      }], // Allow @ts-ignore with description
      "@typescript-eslint/no-non-null-assertion": "warn", // Downgrade from error
      "import/no-unresolved": "off", // Vite handles this
      "import/extensions": "off", // Not needed with Vite
      "new-cap": "off", // API methods like .GET() .POST() are uppercase by convention
      "no-magic-numbers": "off", // Too strict for app code
    }
  },
  {
    files: ["vite-plugin-*.ts", "vite.config*.ts"],
    rules: {
      "complexity": "off",
    }
  },
  {
    files: ["src/*.js"],

    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
);
