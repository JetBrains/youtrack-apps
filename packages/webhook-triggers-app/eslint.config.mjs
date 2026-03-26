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
    files: ["src/workflows/**/*.js"],

    languageOptions: {
      globals: {
        ...globals.node,
      },
    },

    // TODO:- concern - do we keep these rules "on" ?
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unused-vars": ["error", { "caughtErrors": "none" }],
      "no-undef": "off",
      "no-console": "off",
      "no-magic-numbers": "off",
      "func-names": "off",
      "vars-on-top": "off",
      "complexity": "off"
    }
  },
  {
    // CommonJS test stubs — treat as scripts so `module`/`exports`/`require` are in scope
    files: ["**/*.cjs"],
    languageOptions: {
      globals: { ...globals.node },
      sourceType: "script",
    },
    rules: {
      "strict": "off",
      "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    }
  },
  {
    // Vitest test files — relax rules that are noisy in test code
    files: ["src/workflows/__tests__/**/*.{js,ts}"],
    rules: {
      "no-magic-numbers": "off",
      "no-script-url": "off",
    }
  },
);
