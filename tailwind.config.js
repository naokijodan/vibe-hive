/** @type {import('tailwindcss').Config} */

function withOpacity(variableName) {
  return ({ opacityValue }) => {
    if (opacityValue !== undefined) {
      return `rgba(var(${variableName}), ${opacityValue})`;
    }
    return `rgb(var(${variableName}))`;
  };
}

export default {
  content: ['./src/renderer/**/*.{js,ts,jsx,tsx,html}'],
  theme: {
    extend: {
      colors: {
        // Vibe Hive カスタムカラー (CSS変数参照でテーマ切替対応)
        hive: {
          bg: withOpacity('--hive-bg'),
          surface: withOpacity('--hive-surface'),
          border: withOpacity('--hive-border'),
          text: withOpacity('--hive-text'),
          muted: withOpacity('--hive-muted'),
          accent: withOpacity('--hive-accent'),
          success: withOpacity('--hive-success'),
          warning: withOpacity('--hive-warning'),
          error: withOpacity('--hive-error'),
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'monospace'],
      },
    },
  },
  plugins: [],
};
