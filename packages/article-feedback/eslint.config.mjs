import tseslint from 'typescript-eslint';
import reactRefresh from 'eslint-plugin-react-refresh';
import reactHooks from 'eslint-plugin-react-hooks';
import {FlatCompat} from '@eslint/eslintrc';
import js from '@eslint/js';
import globals from 'globals';

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
});

export default tseslint.config(
  {
    files: ['**/*.{js,ts,tsx}']
  },
  {
    ignores: ['dist']
  },
  ...compat.extends(
    '@jetbrains',
    '@jetbrains/eslint-config/react',
    '@jetbrains/eslint-config/browser'
  ),
  ...tseslint.configs.recommended,
  {
    plugins: {
      'react-refresh': reactRefresh,
      'react-hooks': reactHooks
    },

    languageOptions: {
      globals: {
        ...globals.worker,
        toJS: true
      },

      parser: tseslint.parser,
      ecmaVersion: 'latest',
      sourceType: 'module'
    },

    rules: {
      'react-refresh/only-export-components': [
        'warn',
        {allowConstantExport: true}
      ],
      'max-len': [
        'error',
        {
          code: 120,
          ignoreComments: true,
          ignoreTemplateLiterals: true,
          ignoreRegExpLiterals: true,
          ignorePattern: '"(?=([^"]|"){40,}")|\'(?=([^\']|\'){40,}\')'
        }
      ]
    }
  },
  {
    files: ['public/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node
      }
    }
  }
);
