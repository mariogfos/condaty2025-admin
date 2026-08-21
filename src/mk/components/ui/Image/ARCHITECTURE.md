# Estructura de Componentes de Imagen

## 📊 Arquitectura de Herencia

```
┌─────────────────────────────────────────┐
│         ImageModalContext               │
│  (Context para modal expandible)        │
└───────────────┬─────────────────────────┘
                │
                │ useImageModal()
                │
┌───────────────▼─────────────────────────┐
│            Image (Base)                 │
│                                         │
│  Props:                                 │
│  • src, alt, w, h                       │
│  • expandable, expandableZIndex         │
│  • onClick, onError                     │
│  • square, borderRadius                 │
│  • style, className                     │
│  • objectFit                            │
│  • children                             │
│                                         │
│  Funcionalidad:                         │
│  ✓ Carga de imágenes                    │
│  ✓ Modal expandible                     │
│  ✓ Manejo de errores                    │
│  ✓ Accesibilidad (keyboard)             │
│  ✓ Eventos personalizados               │
└───────────────┬─────────────────────────┘
                │
                │ extends
                │
    ┌───────────┴───────────┐
    │                       │
┌───▼──────────┐  ┌────────▼──────────┐
│   Avatar     │  │ Otros componentes │
│              │  │ (ProductImage,    │
│ + name       │  │  ProfileImage,    │
│ + hasImage   │  │  etc.)            │
│ + pin        │  │                   │
│ + styleText  │  └───────────────────┘
│              │
│ ✓ Iniciales  │
│ ✓ Pin badge  │
└──────────────┘
```

## 🎯 Beneficios de esta Arquitectura

### 1. **Reutilización de Código**
- La funcionalidad común está en `Image`
- Los componentes hijos solo agregan lo específico
- No hay duplicación de lógica

### 2. **Mantenibilidad**
- Un solo lugar para actualizar la lógica de imágenes
- Fácil agregar nuevas características a todos los componentes
- Separación clara de responsabilidades

### 3. **Extensibilidad**
- Crear nuevos componentes es simple
- Heredan automáticamente todas las características de `Image`
- Pueden agregar funcionalidad adicional sin afectar otros componentes

### 4. **Consistencia**
- Todos los componentes de imagen se comportan de manera similar
- Misma API base en todos lados
- Experiencia de usuario uniforme

## 📁 Estructura de Archivos

```
src/mk/components/ui/
├── Image/
│   ├── Image.tsx              # Componente base
│   ├── image.module.css       # Estilos base
│   └── index.ts               # Exportaciones
│
├── Avatar/
│   ├── Avatar.tsx             # Extiende de Image
│   ├── avatar.module.css      # Estilos específicos
│   └── index.ts               # Exportaciones
│
├── README.md                  # Documentación completa
└── EXAMPLES.tsx               # Ejemplos de uso
```

## 🔄 Flujo de Datos

```
Usuario interactúa con Avatar
         │
         ├─► Avatar recibe props (name, hasImage, pin, etc.)
         │
         ├─► Avatar procesa lógica específica (iniciales, etc.)
         │
         └─► Avatar pasa props a Image
                  │
                  ├─► Image maneja carga de imagen
                  │
                  ├─► Image maneja eventos (onClick, expandable)
                  │
                  └─► Si expandable, Image usa ImageModalContext
                           │
                           └─► ImageModal se muestra globalmente
```

## 🚀 Cómo Extender

Para crear un nuevo componente basado en Image:

```typescript
// 1. Importar el tipo base
import { Image, ImageBaseProps } from '@/mk/components/ui/Image';

// 2. Definir props adicionales
type MiComponenteProps = ImageBaseProps & {
  miPropEspecifica: string;
};

// 3. Crear el componente
export const MiComponente = ({
  miPropEspecifica,
  ...imageProps
}: MiComponenteProps) => {
  return (
    <Image {...imageProps}>
      {/* Tu contenido adicional */}
    </Image>
  );
};
```

## ✅ Características Heredadas Automáticamente

Cuando extiendes de `Image`, obtienes gratis:

- ✅ Modal expandible con zoom
- ✅ Iconos de expansión
- ✅ Manejo de errores de carga
- ✅ Estados de carga
- ✅ Accesibilidad completa
- ✅ Eventos de teclado
- ✅ Eventos táctiles
- ✅ Responsive
- ✅ Estilos personalizables
- ✅ z-index configurable

## 🎨 Estilos

Los estilos también siguen la herencia:

```
image.module.css (base)
  │
  ├─► Define estilos comunes
  │   • .image
  │   • .imageButton
  │   • .imageContainer
  │
  └─► Los componentes hijos pueden:
      • Sobrescribir estilos
      • Agregar nuevos estilos
      • Mantener los estilos base
```

## 📝 Notas Importantes

1. **ImageModalContext**: Debe estar en el layout principal de la app
2. **Props Omitidas**: Avatar omite `alt` y `borderRadius` porque los calcula internamente
3. **Fallback**: Image retorna `null` si no hay `src` o es inválida
4. **TypeScript**: Todos los tipos están fuertemente tipados para mejor DX
