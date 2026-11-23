export default [
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        console: 'readonly',
      },
    },
    rules: {
      'no-console': 'warn',
      'no-unused-vars': 'warn',
    },
  },
]