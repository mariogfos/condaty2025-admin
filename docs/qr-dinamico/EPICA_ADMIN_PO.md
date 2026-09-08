# QR Dinámico en la Plataforma de Administración — Entrega

**Para el Product Owner. Estado: terminado y listo para que el equipo de pruebas lo revise.**

Las 13 historias de la épica (DES-20 a DES-32) están implementadas y entregadas. Este documento cuenta, en palabras simples, qué puede hacer ahora cada persona en la plataforma y qué decisiones se tomaron en el camino.

---

## 1. La idea en un párrafo

El residente paga sus deudas escaneando un código QR desde su celular. Cuando el banco confirma el pago, todo se registra solo: el ingreso, las deudas pagadas y los avisos. La plataforma de administración ahora **acompaña** ese proceso: permite configurarlo (solo el equipo de Condaty), ver en qué estado está cada pago, investigar cualquier QR del pasado y recibir el aviso en el momento en que el dinero entra. El administrador del condominio **no genera ni anula códigos QR** — eso es exclusivo de la app del residente — y su forma de trabajo de siempre no cambia en nada.

## 2. Qué puede hacer cada persona

**El equipo de Condaty (FOS):**
- Al editar una cuenta bancaria, activa o desactiva el QR dinámico de esa cuenta y carga los datos de conexión con el banco.
- Esos datos quedan guardados de forma protegida: una vez cargados, **nunca vuelven a mostrarse**. Solo se ve "hay credenciales: sí" y el usuario tapado con puntitos. Para cambiar un dato, se escribe uno nuevo.
- Cada cuenta es independiente, y activar el QR dinámico no afecta al QR de imagen que la cuenta ya tenía.

**El administrador del condominio:**
- En el detalle de una deuda ve si hay un pago por QR **en camino**: un aviso amarillo con el monto y hasta cuándo vale el código.
- Al abrir esa deuda, el sistema consulta al banco por su cuenta. Si el pago ya se hizo, la deuda se marca pagada ahí mismo y el ingreso aparece — sin que el administrador toque nada.
- En cada ingreso pagado por QR ve de dónde vino: el número de operación del banco, la hora exacta y qué deudas cubrió. Y si quiere investigar más, despliega la historia completa de ese QR.
- Tiene una pantalla de **números**: cuántos QR se generaron, cuánto dinero entró, cuántos siguen pendientes, vencieron o se reemplazaron — con filtros por fechas y por cuenta.
- Recibe un **aviso en el momento** en que un pago QR se confirma. Un mismo pago avisa una sola vez, aunque el banco insista.
- Todo lo que ve es **solo de su condominio**.

**Lo que nadie puede hacer desde la administración:**
- Generar un código QR, volver a generarlo o anularlo. Si alguna vez aparece un botón así, es un error.
- Ver una contraseña o clave del banco, en ninguna pantalla.

## 3. Decisiones que se tomaron (y por qué)

1. **Se reconstruyó la parte vieja en lugar de parcharla.** Había pantallas de QR a medio construir de una etapa anterior que hablaban otro idioma con el servidor: un QR "reemplazado" se habría mostrado como "anulado". Se alinearon los significados y se eliminó lo que contradecía las reglas nuevas.
2. **La configuración se hace al editar la cuenta, no al crearla.** Para configurar el QR la cuenta tiene que existir primero. El camino es: crear la cuenta → volver a abrirla → configurar.
3. **El aviso en tiempo real es sencillo**: dice que se confirmó un pago por QR, sin el monto. Ponerle el monto y la unidad es posible, pero requiere un ajuste chico del lado del servidor — queda anotado como mejora si se quiere.
4. **El aviso de "pago en camino" se ve al abrir la deuda**, no en la lista general de deudas. Mostrarlo en la lista también es posible con un agregado del lado del servidor — anotado como mejora futura.
5. De la revisión final de calidad salieron varios arreglos invisibles pero importantes: se garantizó que ningún dato sensible pueda quedar en los registros del navegador y que las pantallas nunca queden pidiendo información en un bucle.

## 4. Dónde estamos y qué sigue

| Paso | Estado |
|------|--------|
| Servicio del banco (backend) | ✅ Entregado y probado (épica anterior) |
| Plataforma de administración | ✅ Entregado — esta épica |
| Pruebas manuales del equipo de pruebas | ⏳ Siguiente paso (guía lista) |
| Pantallas de la app del residente | 🔜 Épica pendiente de cargar |

Cuando el equipo de pruebas dé el visto bueno, las 13 historias pasan a "Listo" y queda habilitado el camino a producción junto con la app del residente.
