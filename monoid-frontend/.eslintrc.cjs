module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
  },
  extends: [
    'plugin:react/recommended',
    'airbnb',
    'plugin:react/jsx-runtime',
    'prettier',
  ],
  ignorePatterns: ['src/graphql/types.ts'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
  },
  plugins: ['import', '@typescript-eslint', 'react-hooks'],
  rules: {
    'array-bracket-spacing': [
      'error',
      'always',
      {
        objectsInArrays: false,
        arraysInArrays: false,
      },
    ],
    'import/extensions': [
      // https://stackoverflow.com/questions/59265981/typescript-eslint-missing-file-extension-ts-import-extensions
      'error',
      'ignorePackages',
      {
        js: 'never',
        jsx: 'never',
        ts: 'never',
        tsx: 'never',
      },
    ],
    'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
    'import/prefer-default-export': 'off',
    'jsx-a11y/no-autofocus': 'off',
    'no-nested-ternary': 'off',
    'no-plusplus': 'off',
    'no-shadow': 'off',
    'no-unused-vars': 'off',
    'object-curly-spacing': [
      'error',
      'always',
      {
        arraysInObjects: false,
        objectsInObjects: false,
      },
    ],
    'react/jsx-filename-extension': [
      'error',
      {
        extensions: ['.jsx', '.tsx'],
      },
    ],
    'react/function-component-definition': [
      'error',
      {
        namedComponents: 'arrow-function',
        unnamedComponents: 'arrow-function',
      },
    ],
    'react/jsx-props-no-spreading': 'off',
    'react/prop-types': 'off',
    'react/require-default-props': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'error',
    'space-in-parens': [
      'error',
      'always',
      {
        exceptions: ['empty', '{}', '()', '[]'],
      },
    ],
    '@typescript-eslint/no-unused-vars': ['error'],
  },
  settings: {
    'import/extensions': [
      '.tsx',
      '.ts',
      '.js',
      '.jsx',
      '.css',
      '.graphql',
      '.svg',
    ],
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
    'import/resolver': {
      typescript: {},
    },
    react: {
      version: 'detect',
    },
  },
};
