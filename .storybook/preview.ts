import type { Preview } from '@storybook/nextjs';
import React from 'react';
import "../src/app/globals.css";
import "../src/styles/theme.css";

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