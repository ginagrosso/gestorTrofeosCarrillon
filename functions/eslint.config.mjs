import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import globals from 'globals'

export default tseslint.config(
  { ignores: ['lib/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      'no-console': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    // Scripts puntuales de mantenimiento (no se deployan como Cloud Functions):
    // necesitan loguear progreso para uso manual desde la terminal.
    files: ['scripts/**'],
    rules: {
      'no-console': 'off',
    },
  },
)
