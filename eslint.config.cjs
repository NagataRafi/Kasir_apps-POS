module.exports = [
  {
    // Build output, coverage, data, dan skrip CLI .cjs tidak ikut lint.
    ignores: ['coverage/', 'dist/', '**/dist/', 'data/', 'scripts/'],
  },
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
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
