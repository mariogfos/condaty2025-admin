/**
 * EJEMPLO RÁPIDO - Avatar con y sin imagen
 */

import { Avatar } from '@/mk/components/ui/Avatar/Avatar';

// ✅ CON IMAGEN - Muestra la foto
export const AvatarConImagen = () => (
  <Avatar 
    src="/assets/images/admin.png"
    name="Juan Pérez"
    hasImage={1}
    w={48}
    h={48}
    expandable={true}
  />
);

// ✅ SIN IMAGEN - Muestra iniciales "JP"
export const AvatarSinImagen = () => (
  <Avatar 
    name="Juan Pérez"
    hasImage={0}
    w={48}
    h={48}
  />
);

// ✅ SOLO NOMBRE - Muestra iniciales "MG"
export const AvatarSoloNombre = () => (
  <Avatar 
    name="María González"
    w={48}
    h={48}
  />
);

// ✅ CON ESTILOS PERSONALIZADOS - Iniciales con colores
export const AvatarPersonalizado = () => (
  <Avatar 
    name="Carlos López"
    w={64}
    h={64}
    hasImage={0}
    styleText={{
      backgroundColor: '#4CAF50',
      color: 'white',
      fontWeight: 'bold'
    }}
  />
);

// ✅ LISTA DE USUARIOS - Mix de con y sin imagen
export const ListaUsuarios = ({ users }: { users: any[] }) => (
  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
    {users.map((user) => (
      <Avatar
        key={user.id}
        src={user.avatar_url}
        name={user.name}
        hasImage={user.has_image}
        w={48}
        h={48}
        expandable={true}
        onClick={() => console.log('Usuario:', user.name)}
      />
    ))}
  </div>
);

// Ejemplo de datos
const ejemploUsuarios = [
  { id: 1, name: 'Juan Pérez', avatar_url: '/images/user1.jpg', has_image: 1 },
  { id: 2, name: 'María López', has_image: 0 }, // Sin imagen, muestra iniciales ML
  { id: 3, name: 'Carlos González', avatar_url: '/images/user3.jpg', has_image: 1 },
  { id: 4, name: 'Ana Martínez', has_image: 0 }, // Sin imagen, muestra iniciales AM
];

export const EjemploCompleto = () => (
  <ListaUsuarios users={ejemploUsuarios} />
);
