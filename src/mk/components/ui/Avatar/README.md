# Avatar Component

El componente `Avatar` es una especialización del componente `Image` diseñado específicamente para mostrar avatares de usuario.

## 🎯 Características Principales

- ✅ **Muestra foto de perfil** cuando está disponible
- ✅ **Genera iniciales automáticamente** cuando no hay foto
- ✅ **Pin indicator** para mostrar estado o notificaciones
- ✅ **Expandible** (solo cuando hay foto)
- ✅ **Estilos personalizables** para las iniciales
- ✅ **Circular o cuadrado**
- ✅ **Accesible** y responsive

## 📦 Herencia

`Avatar` extiende del componente base [`Image`](../Image/README.md), heredando toda su funcionalidad:

```
Image (base)
  └── Avatar (especializado)
```

Ver [ARCHITECTURE.md](../Image/ARCHITECTURE.md) para más detalles sobre la arquitectura.

## 🔧 Instalación / Importación

```tsx
import { Avatar } from '@/mk/components/ui/Avatar/Avatar';
```

## 📖 Props

```typescript
type AvatarProps = {
  // Heredadas de Image (omitiendo alt y borderRadius)
  src?: string;              // URL de la imagen
  w?: number;                // Ancho (default: 48)
  h?: number;                // Alto (default: 48)
  className?: string;        // Clases CSS adicionales
  onClick?: (e: any) => void; // Manejador de click
  style?: CSSProperties;     // Estilos inline
  square?: boolean;          // Forma cuadrada (default: false/circular)
  onError?: () => void;      // Callback cuando falla la carga
  expandable?: boolean;      // Modal expandible (default: false)
  expandableZIndex?: number; // z-index del modal
  expandableIcon?: boolean;  // Mostrar icono expandir (default: true)
  children?: ReactNode;      // Contenido adicional
  objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
  
  // Props específicas de Avatar
  name?: string;             // Nombre del usuario (para iniciales y alt)
  hasImage?: string | number; // Indica si tiene imagen (0 = no, 1 = sí)
  pin?: boolean;             // Mostrar indicador pin (default: false)
  styleText?: CSSProperties; // Estilos para las iniciales
};
```

## 🚀 Uso Básico

### Avatar con imagen (detección automática)

```tsx
// ✅ RECOMENDADO: Solo pasar src y name
<Avatar 
  src="/images/user-photo.jpg"
  name="Juan Pérez"
  w={48}
  h={48}
/>
// Si la imagen existe → Muestra la imagen
// Si la imagen NO existe o falla → Muestra "JP" automáticamente
```

### Avatar sin imagen (muestra iniciales)

```tsx
<Avatar 
  name="Juan Pérez"
  w={48}
  h={48}
/>
// Resultado: Muestra "JP"
```

### Avatar con control explícito (opcional)

```tsx
// Si ya sabes que NO tiene imagen, puedes forzar iniciales
<Avatar 
  name="Juan Pérez"
  hasImage={0}
  w={48}
  h={48}
/>
// Resultado: Muestra "JP" sin intentar cargar imagen
```

### Avatar con estilos personalizados

```tsx
<Avatar 
  name="María González"
  hasImage={0}
  w={64}
  h={64}
  styleText={{
    backgroundColor: '#4CAF50',
    color: 'white',
    fontWeight: 'bold'
  }}
/>
```

### Avatar expandible con pin

```tsx
<Avatar 
  src="/images/user-photo.jpg"
  name="Carlos López"
  hasImage={1}
  w={80}
  h={80}
  expandable={true}
  pin={true}
/>
```

### Avatar cuadrado

```tsx
<Avatar 
  name="Empresa ABC"
  hasImage={0}
  w={64}
  h={64}
  square={true}
/>
```

## 🎨 Ejemplos Completos

Ver [AvatarQuickExample.tsx](./AvatarQuickExample.tsx) para ejemplos rápidos y prácticos.

## 📊 Comportamiento (Detección Automática)

Avatar es **inteligente** y detecta automáticamente cuándo mostrar imagen o iniciales:

| Situación | Qué muestra | ¿Expandible? | Detección |
|-----------|-------------|--------------|-----------|
| `src` válido + imagen carga bien | 🖼️ Imagen | ✅ Sí | Automática |
| `src` válido + imagen falla al cargar | 🔤 Iniciales | ❌ No | Automática (onError) |
| `src` válido + `hasImage=0` | 🔤 Iniciales | ❌ No | Explícita |
| Sin `src` | 🔤 Iniciales | ❌ No | Automática |
| `src="undefined"` | 🔤 Iniciales | ❌ No | Automática |

### 🎯 Detección Inteligente

Avatar muestra iniciales cuando:
1. ✅ No hay `src` válido
2. ✅ `hasImage` es explícitamente `0`
3. ✅ **La imagen falla al cargar** (404, error de red, etc.) ← **NUEVO**

**Ya no necesitas verificar manualmente si la imagen existe**, Avatar lo hace por ti.

## 💡 Funcionalidad Exclusiva de Avatar

A diferencia del componente base `Image`, `Avatar` tiene características específicas para usuarios:

### 1. **Iniciales Automáticas**
Extrae las iniciales del nombre del usuario:
- "Juan Pérez" → "JP"
- "María González López" → "MGL"
- "X" → "X"

```tsx
<Avatar name="Juan Pérez" hasImage={0} />
// Muestra: JP
```

### 2. **Pin Indicator**
Círculo de estado/notificación:

```tsx
<Avatar 
  src="/photo.jpg"
  name="Usuario Activo"
  hasImage={1}
  pin={true}
/>
```

### 3. **Expandible Solo con Imagen**
El modal expandible solo funciona cuando hay una imagen válida. Las iniciales no se expanden.

```tsx
// ✅ Se expande (tiene imagen)
<Avatar src="/photo.jpg" hasImage={1} expandable={true} />

// ❌ No se expande (solo iniciales)
<Avatar name="Juan" hasImage={0} expandable={true} />
```

## 🎨 Personalización de Iniciales

Puedes personalizar completamente el estilo de las iniciales:

```tsx
<Avatar 
  name="Ana María"
  hasImage={0}
  w={80}
  h={80}
  styleText={{
    backgroundColor: '#FF5722',
    color: 'white',
    fontSize: '28px',
    fontWeight: 'bold',
    letterSpacing: '2px'
  }}
/>
```

## 🔗 Integración con Backend

### ✅ Forma Recomendada (Detección Automática)

```tsx
// Avatar detecta automáticamente si la imagen existe
const UserAvatar = ({ user }) => (
  <Avatar
    src={user.avatar_url}  // Solo pasar la URL
    name={user.full_name}   // Y el nombre
    w={48}
    h={48}
    expandable={true}
    onClick={() => navigateToProfile(user.id)}
  />
);

// Avatar maneja automáticamente:
// ✅ Si avatar_url es válida y la imagen carga → Muestra foto
// ✅ Si avatar_url es null/undefined → Muestra iniciales
// ✅ Si avatar_url existe pero la imagen falla (404) → Muestra iniciales
```

### 📊 Con Control Explícito (Opcional)

```tsx
// Si tu backend ya te dice si tiene imagen, puedes optimizar
const UserAvatar = ({ user }) => (
  <Avatar
    src={user.has_image ? user.avatar_url : undefined}
    name={user.full_name}
    hasImage={user.has_image}  // Evita intentar cargar si sabes que no hay
    w={48}
    h={48}
    expandable={true}
  />
);

// Ventaja: No hace petición HTTP innecesaria si has_image = 0
```

## 🐛 Solución de Problemas

### Las iniciales no se muestran
- ✅ Asegúrate de pasar la prop `name`
- ✅ Verifica que `hasImage` sea `0` o que no haya `src` válido

### La imagen no se muestra
- ✅ Verifica que `src` sea una URL válida
- ✅ Asegúrate de que `hasImage` no sea `0`
- ✅ Revisa la consola para errores de carga

### El modal no se abre
- ✅ Solo funciona con imágenes válidas (no con iniciales)
- ✅ Verifica que `expandable={true}`
- ✅ Asegura que `ImageModalProvider` esté en el layout

## � Implementación Técnica: Cómo Funciona

### Arquitectura de la Solución

`Avatar` extiende de `Image` pero agrega funcionalidad exclusiva para mostrar iniciales cuando no hay imagen. Aquí está cómo se implementó:

#### 1. **Image con `allowRenderWithoutSrc`**

El componente base `Image` tiene una prop especial que permite renderizar aunque no tenga imagen:

```typescript
// En Image.tsx
const hasValidSrc = src && src.indexOf("undefined") === -1;
if (!hasValidSrc && !allowRenderWithoutSrc && !children) {
  return null; // Solo retorna null si no puede renderizar nada
}
```

#### 2. **Avatar activa esta funcionalidad**

Avatar pasa `allowRenderWithoutSrc={true}` a Image y usa `children` para mostrar las iniciales:

```typescript
// En Avatar.tsx
const hasValidSrc = src && src.indexOf("undefined") === -1;
const shouldShowImage = hasValidSrc && hasImage != 0;

return (
  <Image
    src={shouldShowImage ? src : undefined}
    allowRenderWithoutSrc={true}  // ← Permite renderizar sin imagen
    {...otherProps}
  >
    {/* Iniciales cuando no hay imagen */}
    {!shouldShowImage && (
      <div className={styles.avatarInitials}>
        {initialsName(name)}
      </div>
    )}
    {/* Pin y otros children */}
  </Image>
);
```

#### 3. **Expandible solo con imagen válida**

```typescript
expandable={shouldShowImage ? expandable : false}
// Solo se puede expandir si hay una imagen real
```

### Lógica de Decisión (Mejorada con Detección Automática)

| Condición | Comportamiento |
|-----------|---------------|
| `src` válido + imagen carga OK | ✅ Muestra imagen + expandible |
| `src` válido + **imagen falla al cargar** | 🔤 Muestra iniciales automáticamente ⭐ |
| `src` válido + `hasImage=0` | 🔤 Muestra iniciales (no intenta cargar) |
| Sin `src` o `src="undefined"` | 🔤 Muestra iniciales |
| Sin `name` | Muestra div vacío (con children si hay) |

**⭐ Nuevo:** Avatar escucha el evento `onError` de la imagen y automáticamente cambia a mostrar iniciales si la carga falla.

### Archivos Involucrados

```
src/mk/components/ui/
├── Image/
│   ├── Image.tsx              # Base con allowRenderWithoutSrc
│   └── image.module.css
│
└── Avatar/
    ├── Avatar.tsx             # Usa Image + agrega iniciales
    └── avatar.module.css      # Estilos para .avatarInitials
```

## 📚 Documentación Adicional

- [AvatarQuickExample.tsx](./AvatarQuickExample.tsx) - Ejemplos rápidos de código
- [../Image/README.md](../Image/README.md) - Documentación del componente base
- [../Image/ARCHITECTURE.md](../Image/ARCHITECTURE.md) - Arquitectura general de componentes
- [../Image/EXAMPLES.tsx](../Image/EXAMPLES.tsx) - Cómo crear componentes basados en Image

## 🎯 Best Practices

1. **Siempre pasa `name`** para tener un fallback con iniciales
2. **Usa `hasImage`** para controlar explícitamente qué mostrar
3. **Personaliza los colores** de las iniciales según tu diseño
4. **Usa tamaños consistentes** en tu aplicación (48, 64, 80, etc.)
5. **Habilita `expandable`** solo cuando tiene sentido (perfiles, galerías)

## 🔄 Migración desde Avatar Antiguo

Si estás migrando desde una versión anterior:

```tsx
// ❌ Antes
<OldAvatar 
  photoUrl={user.photo}
  userName={user.name}
  size={48}
/>

// ✅ Ahora
<Avatar 
  src={user.photo}
  name={user.name}
  hasImage={user.has_image}
  w={48}
  h={48}
/>
```

## 📄 Licencia

Parte del proyecto Condaty Admin.
