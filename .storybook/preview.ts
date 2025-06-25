import type { Preview } from '@storybook/nextjs';
import "../src/app/globals.css";
import "../src/styles/theme.css";

// Asegurarse de que exista el portal-root para los modales
if (typeof document !== 'undefined') {
  if (!document.getElementById('portal-root')) {
    const portalRoot = document.createElement('div');
    portalRoot.id = 'portal-root';
    document.body.appendChild(portalRoot);
  }
}

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;