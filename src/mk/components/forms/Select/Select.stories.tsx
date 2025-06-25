import type { Meta, StoryObj } from '@storybook/nextjs';
import Select from './Select';
import { useState } from 'react';

// Datos de ejemplo para las opciones
const options = [
  { id: 1, name: 'Opción 1' },
  { id: 2, name: 'Opción 2' },
  { id: 3, name: 'Opción 3' },
  { id: 4, name: 'Opción 4' },
  { id: 5, name: 'Opción 5' },
];

const meta = {
  title: 'mk/Forms/Select',
  component: Select,
  tags: ['autodocs'],
  args: {
    options,
    name: 'select-demo',
    label: 'Selecciona una opción',
    placeholder: '',
    filter : false,
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof Select>;

// Historia básica
const Template: Story = {
  render: function Render(args) {
    const [value, setValue] = useState('');
    return (
      <div style={{ maxWidth: '400px' }}>
        <Select 
          {...args} 
          value={value}
          onChange={(e) => setValue(e.target.value)}
          filter={false}
        />
        <div style={{ marginTop: '20px' }}>
          <p>Valor seleccionado: {value}</p>
        </div>
      </div>
    );
  },
};

export const Default = {
  ...Template,
  args: {
    ...Template.args,
    filter: false,
  },
};

// Select con búsqueda
export const ConBusqueda = {
  ...Template,
  args: {
    ...Template.args,
    filter: true,
    label: 'Buscar opción',
    placeholder: 'Escribe para buscar...',
  },
};

// Select múltiple
const MultipleTemplate: Story = {
  render: function Render(args) {
    const [value, setValue] = useState<number[]>([]);
    return (
      <div style={{ maxWidth: '400px' }}>
        <Select 
          {...args} 
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <div style={{ marginTop: '20px' }}>
          <p>Valores seleccionados: {JSON.stringify(value)}</p>
        </div>
      </div>
    );
  },
};

export const Multiple = {
  ...MultipleTemplate,
  args: {
    ...Template.args,
    multiSelect: true,
    filter: false,
    label: 'Selecciona múltiples opciones',
    placeholder: 'Selecciona una o más opciones...',
  },
};

// Select con estado de error
export const ConError = {
  ...Template,
  args: {
    ...Template.args,
    filter: false,
    error: 'Campo requerido',
  },
};

// Select deshabilitado
export const Deshabilitado = {
  ...Template,
  args: {
    ...Template.args,
    filter: false,
    disabled: true,
    value: 1,
  },
};

// Select personalizado con opciones complejas
const customOptions = [
  { id: 'user1', name: 'Usuario 1', email: 'usuario1@ejemplo.com' },
  { id: 'user2', name: 'Usuario 2', email: 'usuario2@ejemplo.com' },
  { id: 'user3', name: 'Usuario 3', email: 'usuario3@ejemplo.com' },
];

export const ConOpcionesPersonalizadas = {
  render: function Render() {
    const [value, setValue] = useState('');
    return (
      <div style={{ maxWidth: '400px' }}>
        <Select 
          options={customOptions}
          optionLabel="name"
          optionValue="id"
          name="usuario"
          label="Selecciona un usuario"
          placeholder="Selecciona un usuario..."
          filter={false}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <div style={{ marginTop: '20px' }}>
          <p>Usuario seleccionado: {value}</p>
          {value && (
            <div style={{ marginTop: '10px', padding: '10px', background: '#f5f5f5', borderRadius: '4px' }}>
              <p><strong>Email:</strong> {customOptions.find(u => u.id === value)?.email}</p>
            </div>
          )}
        </div>
      </div>
    );
  },
};