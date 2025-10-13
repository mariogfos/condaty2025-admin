/**
 * EJEMPLO DE USO - Componentes Image y Avatar
 * 
 * Este archivo muestra cómo usar los componentes de imagen con la nueva estructura de herencia
 */

import { Image, ImageBaseProps } from '@/mk/components/ui/Image';
import { Avatar } from '@/mk/components/ui/Avatar/Avatar';

// ============================================
// EJEMPLO 1: Componente Image Base
// ============================================
export const ImageExample = () => {
  return (
    <div>
      <h3>Imagen básica</h3>
      <Image 
        src="/assets/images/admin.png"
        alt="Admin Dashboard"
        w={100}
        h={100}
      />

      <h3>Imagen cuadrada expandible</h3>
      <Image 
        src="/assets/images/admin.png"
        alt="Admin Dashboard"
        w={200}
        h={200}
        square={true}
        expandable={true}
        expandableIcon={true}
      />

      <h3>Imagen con onClick personalizado</h3>
      <Image 
        src="/assets/images/logo-nuevo.png"
        alt="Logo"
        w={150}
        h={150}
        onClick={(e) => console.log('Image clicked!', e)}
      />
    </div>
  );
};

// ============================================
// EJEMPLO 2: Avatar con imagen
// ============================================
export const AvatarWithImageExample = () => {
  return (
    <div>
      <h3>Avatar con imagen</h3>
      <Avatar 
        src="/assets/images/admin.png"
        name="Juan Pérez"
        w={48}
        h={48}
        hasImage={1}
      />

      <h3>Avatar expandible con pin</h3>
      <Avatar 
        src="/assets/images/admin.png"
        name="María González"
        w={64}
        h={64}
        hasImage={1}
        expandable={true}
        pin={true}
      />
    </div>
  );
};

// ============================================
// EJEMPLO 3: Avatar sin imagen (iniciales)
// ============================================
export const AvatarWithInitialsExample = () => {
  return (
    <div>
      <h3>Avatar con iniciales</h3>
      <Avatar 
        name="Juan Pérez"
        w={48}
        h={48}
        hasImage={0}
      />

      <h3>Avatar grande con iniciales y estilos personalizados</h3>
      <Avatar 
        name="María González López"
        w={80}
        h={80}
        hasImage={0}
        styleText={{
          backgroundColor: 'var(--cAccent)',
          color: 'white',
        }}
      />
    </div>
  );
};

// ============================================
// EJEMPLO 4: Avatar con todas las opciones
// ============================================
export const AvatarFullFeaturedExample = () => {
  return (
    <div>
      <Avatar 
        src="/assets/images/admin.png"
        name="Carlos Rodríguez"
        w={100}
        h={100}
        hasImage={1}
        expandable={true}
        expandableZIndex={2000}
        pin={true}
        square={false}
        onClick={(e) => console.log('Avatar clicked', e)}
        style={{ border: '3px solid var(--cAccent)' }}
      />
    </div>
  );
};

// ============================================
// EJEMPLO 5: Crear un nuevo componente que extienda Image
// ============================================

type ProductImageProps = ImageBaseProps & {
  badge?: string;
  discount?: number;
};

export const ProductImage = ({
  badge,
  discount,
  ...imageProps
}: ProductImageProps) => {
  return (
    <Image 
      {...imageProps}
      square={true}
      expandable={true}
    >
      {/* Contenido adicional específico del producto */}
      {badge && (
        <div style={{
          position: 'absolute',
          top: 8,
          left: 8,
          backgroundColor: 'var(--cAccent)',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {badge}
        </div>
      )}
      
      {discount && discount > 0 && (
        <div style={{
          position: 'absolute',
          top: 8,
          right: 8,
          backgroundColor: 'red',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '14px',
          fontWeight: 'bold',
        }}>
          -{discount}%
        </div>
      )}
    </Image>
  );
};

// Uso del ProductImage
export const ProductImageExample = () => {
  return (
    <div>
      <h3>Imagen de Producto con Badge y Descuento</h3>
      <ProductImage 
        src="/assets/images/admin.png"
        alt="Producto en oferta"
        w={200}
        h={200}
        badge="NUEVO"
        discount={25}
      />
    </div>
  );
};
