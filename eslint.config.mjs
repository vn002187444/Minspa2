import reactHooksPlugin from 'eslint-plugin-react-hooks';
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

const eslintConfig = [
  ...nextCoreWebVitals,
  {
    plugins: { 'react-hooks': reactHooksPlugin },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/immutability': 'warn',
      'react/no-unescaped-entities': 'off',
    },
  },
];

export default eslintConfig;
