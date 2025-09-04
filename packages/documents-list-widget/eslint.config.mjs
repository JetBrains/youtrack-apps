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
    ignores: ["**/dist", "eslint.config.mjs"],
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
      "react/jsx-no-literals": "off"
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
