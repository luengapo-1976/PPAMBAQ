# PPAM — Reglas de Arquitectura y Diseño

Estas reglas son de cumplimiento obligatorio para todo el desarrollo del proyecto PPAM. El sistema de diseño detallado (tokens de color, tipografía, espaciado, elevación, formas y especificación de componentes) vive en [DESIGN PPAM.md](DESIGN%20PPAM.md) — este archivo no lo duplica, lo referencia y lo complementa con los lineamientos de arquitectura técnica y UX/UI que rigen el producto.

## 1. Arquitectura general

Arquitectura moderna de tres capas:

- **Frontend — Angular**: arquitectura modular (feature modules / standalone components), componentes reutilizables, diseño responsive/adaptive, comunicación exclusivamente vía APIs REST (nunca acceso directo a Supabase desde el frontend salvo Supabase Auth/Storage cuando aplique por diseño explícito).
- **Backend — NestJS + TypeScript**: arquitectura por módulos con separación estricta de **controllers → services → repositories**. Autenticación basada en JWT, autorización por roles (guards), y validaciones de negocio en la capa de servicio (nunca en el controller).
- **Plataforma de datos — Supabase**:
  - PostgreSQL como base de datos principal.
  - Supabase Auth para autenticación de usuarios.
  - Storage para documentos/adjuntos cuando sean necesarios.
  - **Row Level Security (RLS)** habilitado y obligatorio en todas las tablas con datos de negocio, como refuerzo de la seguridad de acceso.

### Requisitos no funcionales

- Operación **24x7**, escalable, segura y mantenible.
- Configuración exclusivamente mediante **variables de entorno** (nunca credenciales o URLs hardcodeadas).
- Cambios de esquema de base de datos siempre a través de **migraciones** versionadas.
- **Auditoría** de operaciones críticas (quién, qué, cuándo).
- **Manejo centralizado de errores** en el backend (exception filters de Nest) — nunca exponer errores técnicos/stack traces al usuario final.
- **Logging** estructurado de eventos relevantes.
- Toda comunicación Angular ↔ NestJS ↔ Supabase debe ser siempre sobre **HTTPS**.
- Seguir buenas prácticas de desarrollo, seguridad (OWASP) y rendimiento en cada capa.

## 2. Perfiles de usuario

La aplicación sirve a tres perfiles con necesidades y navegación distintas:

- **Participante** — mobile first, procesos cortos, mínima carga cognitiva.
- **Coordinador PPAM**
- **BackOffice** — orientado a gestión, tablas, filtros y paneles administrativos.

La interfaz debe adaptarse según el perfil y el dispositivo, no solo reorganizar los mismos componentes.

## 3. Filosofía de diseño

- **Mobile First** para el perfil Participante; **Adaptive Design** (no solo responsive) para escritorio — desktop, tablet y celular deben tener layouts diferenciados, no una simple reorganización de componentes.
- Minimalismo, muy poca carga cognitiva, procesos cortos, interfaz limpia y rápida de usar.
- Consistencia visual en toda la aplicación.
- **Accesibilidad WCAG 2.2** (nivel AA) sin excepciones.
- Objetivo de usabilidad: un usuario nuevo debe poder aprender la aplicación prácticamente sin capacitación.

### Inspiración visual

Línea gráfica inspirada (no copiada) en JW.org: predominio del blanco, grandes espacios en blanco, navegación limpia, colores sobrios, tarjetas con imágenes, iconografía simple, botones discretos, sensación de tranquilidad.

Debe transmitir: simplicidad, confianza, organización, serenidad, modernidad.

Evitar siempre: colores estridentes, sombras exageradas, degradados fuertes, exceso de animaciones, interfaces sobrecargadas. **No debe parecer un ERP** — debe sentirse cercana, sencilla, elegante, amigable y visualmente silenciosa. La sensación objetivo es "todo está organizado".

## 4. Sistema de diseño (design tokens)

Fuente única de verdad: [DESIGN PPAM.md](DESIGN%20PPAM.md). Resumen de las reglas clave:

- **Color**: azul institucional `#4A6DA7` como color principal/tint (`primary` `#30548d` para acciones), grises claros como secundario, verde suave para éxito, ámbar para advertencia, rojo moderado para error. El **blanco domina** toda la interfaz (`surface-container-lowest` `#ffffff`). Los colores semánticos se usan en baja saturación y con moderación — nunca como único medio para comunicar un estado.
- **Tipografía**: **Inter** como tipografía única. Jerarquía estricta (`display` 32px → `label` 12px, ver tokens completos en DESIGN PPAM.md). Nunca usar textos por debajo de 16px para contenido de lectura. En mobile, `h1-mobile` (24px) es el techo para titulares.
- **Espaciado**: grid de **8px**. Todos los márgenes, paddings y alturas de componente deben ser múltiplos de 8px. `xl` (32px) / `2xl` (48px) entre secciones mayores; `md` (16px) entre elementos relacionados de un mismo grupo.
- **Layout mobile first**:
  - Mobile (< 600px): márgenes 16px, grid 4 columnas.
  - Tablet (600–1024px): márgenes 24px, grid 8 columnas.
  - Desktop (> 1024px): márgenes 32px, grid 12 columnas.
- **Elevación**: sin sombras pesadas. Usar capas tonales y outlines de bajo contraste (niveles 0–3 definidos en DESIGN PPAM.md). Los botones son planos: el estado se comunica con cambios de color (hover/active), no con elevación física.
- **Formas**: botones/inputs `8px` de radio, cards `12px`, diálogos/modales `16px`.
- **Iconografía**: **Material Symbols Outline** siempre, y siempre acompañados de texto (nunca solo ícono).
- **Animaciones**: muy sutiles, duración **< 250ms**, nunca innecesarias.

### 4.1 Overrides de color por componente

Estas reglas son más específicas que el resumen general de arriba y tienen precedencia sobre él para los componentes indicados (el resto de DESIGN PPAM.md — tipografía, espaciado, formas, elevación — sigue aplicando sin cambios):

- **Menú lateral (sidebar)**: fondo `#252525` (oscuro, no blanco).
  - Opción **seleccionada**: fondo `#4A6DA7`, letra e íconos `#FFFFFF`.
  - **Hover** sobre una opción: fondo `#F1F1F1`, letra e íconos `#252525`.
  - Opción en reposo (no seleccionada, no hover): texto/íconos claros para mantener contraste sobre el fondo oscuro (tono `inverse-on-surface` de DESIGN PPAM.md).
- **Fondo general de la aplicación (body)**: `#F1F1F1`.
- **Fondo de formularios**: `#EDF1F7`.
- **Botones**: fondo `#4A6DA7`, letra e íconos `#FFFFFF` (nota: coincide con el valor de `primary-container`, no con `primary` `#30548d` — para botones usar siempre `#4A6DA7`).

## 5. Componentes (Design System reutilizable)

Construir como librería de componentes reutilizables de Angular (standalone components): Botones, Cards, Inputs, Select, Stepper, Calendarios, Badges, Alertas, Snackbars, Tablas, Diálogos, Timeline, Avatar, Chips. Ningún componente de UI se implementa "una sola vez" ad-hoc si ya existe (o debería existir) en el design system — reutilizar, no duplicar. Especificaciones visuales de cada componente en DESIGN PPAM.md §Components.

## 6. Navegación

- **Participante**: navegación extremadamente simple, **máximo 5 opciones principales** (ej. Inicio, Mis solicitudes, Agenda, Mi perfil, Ayuda). Nunca menús complejos ni anidados.
- **BackOffice**: menú lateral, dashboard, tablas, filtros, búsquedas, exportaciones, paneles administrativos.

## 7. Formularios

- Dividir formularios largos en pasos (stepper), mostrando siempre el paso actual.
- Validaciones inmediatas con mensajes claros y en lenguaje de negocio.
- **Nunca** mostrar errores técnicos ni stack traces al usuario.

## 8. Dashboard (BackOffice)

Debe incluir: indicadores, gráficas, solicitudes pendientes, personas aprobadas, entrenamientos, disponibilidad de puntos, actividad reciente.

## 9. Rendimiento

- Toda pantalla debe cargar en **menos de 2 segundos**.
- Nunca bloquear la interfaz durante cargas.
- Usar **Skeleton Loaders**, no spinners largos.

## 10. Accesibilidad (checklist obligatorio)

- Contraste mínimo AA (4.5:1 para texto).
- Tamaño mínimo de fuente: 16px.
- Áreas táctiles mínimas de **44px**.
- Nunca depender únicamente del color para comunicar un estado (agregar texto/ícono).
- Navegación completa por teclado.
- Compatible con lectores de pantalla (semántica HTML/ARIA correcta).

## 11. Escalabilidad de UI

Construir siempre mediante componentes reutilizables y modulares, de forma que incorporar nuevos módulos en el futuro no requiera rediseñar la aplicación existente.
