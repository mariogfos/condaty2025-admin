// src/mk/components/forms/Button/Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/nextjs';
import Button from './Button';
import React from 'react';

// 1. Mock simple de AuthContext
const AuthContext = React.createContext({ waiting: 0 });
const useAuth = () => React.useContext(AuthContext);

// 2. Decorador para envolver solo estas historias
// eslint-disable-next-line react/display-name
const withMockAuth = (waitingValue: number = 0) => (Story: any) => (
  <AuthContext.Provider value={{ waiting: waitingValue }}>
    <Story />
  </AuthContext.Provider>
);

// Configuración de historias sin tipo estricto para evitar el error de displayName
const meta = {
  title: 'mk/Forms/Button',
  component: Button,
  tags: ['autodocs'],
  // 3. Decorador global para estas historias (espera waiting=0 por defecto)
  decorators: [withMockAuth(0)],
} as Meta<typeof Button>;
export default meta;

type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    children: 'Botón Primario',
    variant: 'primary',
  },
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/eqCLIXVd6JVrm7uoXwdZQW/Condaty-Saneamiento?node-id=11918-99867&t=RT9i2kln67IJBFA7-4', // <-- Pega aquí tu URL de Figma
    },
  },
};

export const Secondary: Story = {
  args: {
    children: 'Secundario',
    variant: 'secondary',
  },
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/eqCLIXVd6JVrm7uoXwdZQW/Condaty-Saneamiento?node-id=11918-99869&t=RT9i2kln67IJBFA7-4', // <-- Pega aquí tu URL de Figma
    },
  },
};

export const Disabled: Story = {
  args: {
    children: "Deshabilitado",
    variant: "primary",
    disabled: true,
  },
  parameters: {
    design: {
      type: "figma",
      url: "https://www.figma.com/design/eqCLIXVd6JVrm7uoXwdZQW/Condaty-Saneamiento?node-id=15386-137248&t=RT9i2kln67IJBFA7-4", // <-- Pega aquí tu URL de Figma
    },
  },
};

// 4. Historia especial para simular "esperando"
export const Waiting: Story = {
  args: {
    children: 'Esperando...',
    variant: 'primary',
  },
  decorators: [withMockAuth(1)], // waiting > 0, el botón se deshabilita
};