import type { Meta, StoryObj } from '@storybook/nextjs';
import Input from './Input';

// Configuración básica de la historia
const meta = {
  title: 'mk/Forms/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: {
        type: 'select',
        options: [
          'text',
          'email',
          'password',
          'number',
          'date',
          'datetime-local',
          'search',
          'currency',
          'file',
          'checkbox',
          'hidden'
        ],
      },
    },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    onChange: { action: 'changed' },
    onBlur: { action: 'blurred' },
    onFocus: { action: 'focused' },
  },
  args: {
    name: 'example',
    label: 'Campo de entrada',
    placeholder: '',
    type: 'text',
    required: true,
    disabled: false,
    readOnly: false,
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

// Historias básicas
export const Default: Story = {
  args: {
    value: 'Valor por defecto',
  },
};

export const WithPlaceholder: Story = {
  args: {
    value: '',
    placeholder: 'Ejemplo: nombre@dominio.com',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    value: 'Campo deshabilitado',
  },
};

export const NullValue: Story = {
  args: {
    value: '',
    label: 'Campo vacío',
    error: 'Este campo es requerido',
  },
};

// Tipos de entrada
export const Email: Story = {
  args: {
    value: 'usuario@ejemplo.com',
    type: 'email',
    placeholder: 'usuario@ejemplo.com',
    label: 'Correo electrónico',
  },
};

export const Number: Story = {
  args: {
    value: '42',
    type: 'number',
    placeholder: '0',
    label: 'Cantidad',
    min: 0,
    max: 100,
  },
};

// Caso especial: Moneda
export const Currency: Story = {
  args: {
    value: '1000.50',
    type: 'currency',
    label: 'Monto',
    placeholder: '0.00',
  },
};

// Estado de solo lectura
export const ReadOnly: Story = {
  args: {
    value: 'Este valor no se puede editar',
    readOnly: true,
    label: 'Campo de solo lectura',
  },
};
