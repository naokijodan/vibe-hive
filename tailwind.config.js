/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/**/*.{js,ts,jsx,tsx,html}'],
  theme: {
    extend: {
      colors: {
        // Vibe Hive カスタムカラー (CSS変数参照でテーマ切替対応)
        hive: {
          bg: 'var(--hive-bg)',
          surface: 'var(--hive-surface)',
          border: 'var(--hive-border)',
          text: 'var(--hive-text)',
          muted: 'var(--hive-muted)',
          accent: 'var(--hive-accent)',
          success: 'var(--hive-success)',
          warning: 'var(--hive-warning)',
          error: 'var(--hive-error)',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'monospace'],
      },
    },
  },
  plugins: [],
};
