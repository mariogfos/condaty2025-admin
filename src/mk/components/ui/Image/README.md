# Componentes de Imagen

## Estructura de Herencia

Este directorio contiene una jerarquía de componentes de imagen donde:

```
Image (componente base)
  ├── Avatar (extiende Image)
  └── [Otros componentes de imagen pueden extender de Image]
```

## Image (Componente Base)

El componente `Image` es el componente padre que proporciona funcionalidad común para todos los componentes de imagen:

### Características:
- ✅ Manejo de carga de imágenes con fallback
- ✅ Funcionalidad expandible (modal)
- ✅ Eventos onClick personalizados
- ✅ Soporte para accesibilidad (keyboard navigation)
- ✅ Estilos personalizables
- ✅ Responsive

### Props:
```typescript
type ImageBaseProps = {
  src?: string;                    // URL de la imagen
  alt?: string;                    // Texto alternativo
  w?: number;                      // Ancho (por defecto: 48)
  h?: number;                      // Alto (por defecto: 48)
  className?: string;              // Clases CSS adicionales
  onClick?: (e: any) => void;      // Manejador de click
  style?: CSSProperties;           // Estilos inline
  square?: boolean;                // Si es cuadrada o redonda
  onError?: () => void;            // Callback cuando falla la carga
  expandable?: boolean;            // Habilitar modal expandible
  expandableZIndex?: number;       // z-index del modal
  expandableIcon?: boolean;        // Mostrar icono de expandir
  children?: ReactNode;            // Contenido adicional
  borderRadius?: string;           // Border radius personalizado
  objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
  allowRenderWithoutSrc?: boolean; // Permite renderizar sin src (útil para Avatar con iniciales)
};
```

### Uso:
```tsx
import { Image } from '@/mk/components/ui/Image';

<Image 
  src="/path/to/image.jpg"
  alt="Descripción"
  w={100}
  h={100}
  expandable={true}
  square={false}
/>
```

## Avatar (Extiende de Image)

El componente `Avatar` extiende `Image` y añade funcionalidad específica para avatares de usuario:

### Características Adicionales:
- ✅ **Mostrar iniciales cuando no hay imagen** (funcionalidad exclusiva de Avatar)
- ✅ Pin indicator (punto de estado)
- ✅ Integración con nombres de usuario
- ✅ Fallback automático a iniciales extraídas del nombre
- ✅ Expandible solo cuando hay imagen válida

### Props adicionales:
```typescript
type AvatarProps = Omit<ImageBaseProps, 'alt' | 'borderRadius'> & {
  name?: string;              // Nombre del usuario (para iniciales y alt)
  hasImage?: string | number; // Indica si tiene imagen
  pin?: boolean;              // Mostrar pin/indicador de estado
  styleText?: CSSProperties;  // Estilos para las iniciales
};
```

### Uso:
```tsx
import { Avatar } from '@/mk/components/ui/Avatar';

<Avatar 
  src="/path/to/avatar.jpg"
  name="Juan Pérez"
  w={48}
  h={48}
  pin={true}
  expandable={true}
/>

// Sin imagen, muestra iniciales "JP" extraídas del nombre
<Avatar 
  name="Juan Pérez"
  w={48}
  h={48}
  hasImage={0}
/>

// Sin src, muestra iniciales automáticamente
<Avatar 
  name="María González López"
  w={64}
  h={64}
  styleText={{ backgroundColor: 'var(--cAccent)', color: 'white' }}
/>
```

## Crear nuevos componentes extendiendo Image

Para crear un nuevo componente que extienda de `Image`:

```tsx
import { Image, ImageBaseProps } from '../Image';

type MiComponenteProps = ImageBaseProps & {
  // Props adicionales específicas
  miPropAdicional?: string;
};

export const MiComponente = ({
  miPropAdicional,
  ...imageProps
}: MiComponenteProps) => {
  return (
    <Image {...imageProps}>
      {/* Contenido adicional */}
    </Image>
  );
};
```

## Integración con ImageModal

Todos los componentes que extienden de `Image` automáticamente tienen acceso a la funcionalidad del modal expandible a través del `ImageModalContext`. Solo necesitas:

1. Asegurar que tu app esté envuelta en `ImageModalProvider`
2. Pasar la prop `expandable={true}` al componente

El modal se renderiza globalmente y maneja el z-index automáticamente.
