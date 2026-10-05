import js from '@eslint/js';

const readonly = (...names) => Object.fromEntries(names.map(name => [name, 'readonly']));

export default [
  {
    ignores: [
      '**/node_modules/**', '**/.work/**', '**/.cache/**',
      '**/vendor/**', '**/plan/**', '**/art/manifests/**',
    ],
  },
  {
    files: [
      'games/pokemon-dungeon-reimagined/src/**/*.js',
      'tools/pokemon-dungeon/**/*.{js,mjs}',
    ],
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: readonly(
        'console', 'URL', 'URLSearchParams', 'AbortController', 'AbortSignal',
        'TextDecoder', 'TextEncoder', 'setTimeout', 'clearTimeout',
        'performance', 'fetch', 'structuredClone',
      ),
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'eqeqeq': ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error',
    },
  },
  {
    files: ['tools/pokemon-dungeon/scripts/**/*.mjs', 'tools/pokemon-dungeon/art/**/*.mjs'],
    languageOptions: { globals: readonly('process', 'Buffer') },
  },
  {
    files: [
      'games/pokemon-dungeon-reimagined/src/**/*.js',
      'tools/pokemon-dungeon/art-preview/**/*.js',
    ],
    languageOptions: {
      globals: readonly(
        'window', 'document', 'navigator', 'HTMLElement', 'HTMLCanvasElement',
        'HTMLButtonElement', 'HTMLSelectElement', 'HTMLInputElement',
        'ResizeObserver', 'requestAnimationFrame', 'cancelAnimationFrame',
        'matchMedia', 'devicePixelRatio', 'Image', 'Event', 'CustomEvent',
        'DOMException', 'FileReader', 'Blob', 'location', 'AudioContext',
      ),
    },
  },
];
