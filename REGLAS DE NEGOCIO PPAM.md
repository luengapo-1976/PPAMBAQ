# Reglas de negocio — PPAM BAQ

Este documento describe, en lenguaje claro y no técnico, las reglas de negocio que gobiernan cada funcionalidad disponible en la aplicación PPAM BAQ. Está organizado en dos bloques — funcionalidades del administrador y funcionalidades del publicador (usuario general) — y dentro de cada bloque las funcionalidades siguen el mismo orden en que aparecen en el menú de la aplicación.

---

## Bloque 1 · Funcionalidades para el administrador

### Dashboard

- Es un panel de solo consulta: no permite crear, editar ni eliminar información: toda la información que muestra proviene de las solicitudes/publicadores ya registrados en "Gestión de solicitudes".
- Muestra seis indicadores (KPI) principales: total de solicitudes, solicitudes pendientes, solicitudes aprobadas ("Cumple requisitos"), solicitudes pendientes de completar su entrenamiento, solicitudes nuevas del mes en curso, y cantidad de congregaciones con al menos una solicitud registrada.
- Incluye gráficas de distribución de las solicitudes por estado, por sexo y por estado civil, un ranking de las 8 congregaciones con más solicitudes, y una tendencia mensual (últimos 12 meses) de nuevas solicitudes frente a aprobaciones.
- Incluye una tabla resumen por circuito y un listado de actividad reciente (últimos registros creados o modificados), mostrando si cada uno fue "Registrado" o "Modificado" y cuándo.
- Todos los indicadores, gráficas y tablas se pueden filtrar simultáneamente por departamento, municipio, circuito, congregación y rango de fechas de solicitud; los filtros se combinan entre sí (deben cumplirse todos los que estén activos) y se aplican a la vez sobre todo el panel.
- El indicador "Congregaciones activas" cuenta congregaciones distintas con al menos una solicitud dentro del filtro aplicado, no el total de congregaciones registradas en el catálogo.

### Solicitudes y turnos

#### Gestión de solicitudes

**Datos obligatorios al registrar una nueva solicitud**
- Primer apellido: obligatorio, máximo 20 caracteres.
- Segundo apellido: opcional, máximo 20 caracteres.
- Primer nombre: obligatorio, máximo 20 caracteres.
- Segundo nombre: opcional, máximo 20 caracteres.
- Dirección: obligatoria, máximo 100 caracteres.
- Departamento: obligatorio; habilita la lista de municipios correspondiente.
- Municipio: obligatorio y depende del departamento elegido; si se cambia el departamento y el municipio ya no corresponde, se limpia automáticamente.
- Correo electrónico: obligatorio, debe tener formato de correo válido, máximo 100 caracteres.
- Móvil: obligatorio, solo dígitos, máximo 10.
- Congregación: obligatoria (de catálogo); el circuito se muestra automáticamente según la congregación elegida, no se digita.
- Fecha de nacimiento: obligatoria.
- Sexo: obligatorio (Femenino/Masculino).
- Fecha de bautismo: obligatoria.
- Estado civil: obligatorio (Casado, Soltero, Divorciado, Separado, Viudo).
- Nombre del cónyuge y apellido de casada: solo se piden y son obligatorios cuando el sexo es Femenino y el estado civil es "Casado" o "Separado"; en cualquier otro caso no se muestran ni se exigen (máx. 100 y 20 caracteres respectivamente).
- Privilegio mínimo: obligatorio (Ninguno, Anciano, Siervo ministerial).
- Privilegio de servicio: obligatorio (Publicador, Precursor regular, Precursor especial, Misionero que sirve en el campo, Miembro de la familia Betel).
- ¿Participó antes?: obligatorio (Sí/No).
- Fecha de solicitud: obligatoria.
- Estado y "Entrenamiento requerido" inician automáticamente en "REGISTRADO" y "Primer entrenamiento", y no pueden editarse al crear una solicitud nueva.
- "Existe en BD anterior" inicia en "No" y tampoco se puede editar al crear: solo se marca en bloque desde la grilla (ver más abajo).

**Modo edición de una solicitud existente**
- Todos los campos pasan a ser opcionales (se puede guardar sin diligenciar campos vacíos); se mantienen los formatos y longitudes máximas.
- A diferencia del alta, aquí sí se pueden editar el Estado, el Entrenamiento requerido y "Existe en BD anterior".
- Si se cambia manualmente "Entrenamiento requerido" a "Entrenamiento completado", el sistema pasa automáticamente el Estado a "CUMPLE REQUISITOS", completa la fecha de "cumple requisitos" con la fecha del día, y si no existía fecha de aprobación también la completa.
- La fecha de aprobación solo aparece cuando el Estado es "CUMPLE REQUISITOS"; se autocompleta con la fecha del día la primera vez que se llega a ese estado si estaba vacía.
- Al abrir para editar un publicador, se muestran también en modo consulta (sin poder actuar sobre ellos desde aquí) los turnos que ese publicador ya tiene asignados.

**Flujo de estado de una solicitud**
- Estados posibles: REGISTRADO → NOTIFICADO PRIMER ENTRENAMIENTO → NOTIFICADO SEGUNDO ENTRENAMIENTO → CUMPLE REQUISITOS.
- Enviar la notificación de "Primer entrenamiento" cambia el estado a NOTIFICADO PRIMER ENTRENAMIENTO y registra la fecha de envío.
- Confirmar la asistencia al primer entrenamiento hace pasar el "entrenamiento requerido" a "Segundo entrenamiento".
- Enviar la notificación de "Segundo entrenamiento" cambia el estado a NOTIFICADO SEGUNDO ENTRENAMIENTO.
- Confirmar la asistencia al segundo entrenamiento marca "entrenamiento requerido" como "Entrenamiento completado", el estado pasa a CUMPLE REQUISITOS, se completa la fecha de "cumple requisitos" y, si aún no existía, también la fecha de aprobación.
- "Quitar lugar de entrenamiento" revierte fecha y lugar asignados y regresa el estado: si se quita el del primer entrenamiento, el estado vuelve a REGISTRADO; si se quita el del segundo, vuelve a NOTIFICADO PRIMER ENTRENAMIENTO.
- Desmarcar ("revertir") una asistencia ya confirmada regresa el entrenamiento requerido (y, en el caso del segundo entrenamiento, también el estado) a su valor anterior.

**Detección de duplicados al registrar o editar**
- Al escribir o salir de los campos de nombre, apellido, móvil o correo, el sistema busca automáticamente posibles coincidencias con registros ya existentes, comparando: similitud del nombre completo (tolera diferencias menores de escritura y orden invertido de nombres/apellidos), coincidencia exacta de móvil y coincidencia exacta de correo (sin distinguir mayúsculas).
- Si se detecta una coincidencia, se muestra un aviso con los candidatos encontrados. El usuario puede descartarlo (si el móvil/correo estaban mal escritos, esos campos se limpian) o confirmar que es la misma persona, en cuyo caso se cargan los datos del registro existente y, al guardar, se actualiza esa solicitud en vez de crear una nueva.
- Un mismo aviso de duplicado ya descartado no se repite mientras el formulario permanezca abierto.

**Importación desde el formulario S-73 (PDF)**
- Permite cargar un PDF del formulario S-73-S para precargar automáticamente los datos del solicitante (nombre, dirección, contacto, fechas, sexo, estado civil, cónyuge, privilegio, etc.), evitando la digitación manual.
- Solo se aceptan archivos PDF; si no corresponde a un S-73 con campos rellenables, se informa el error sin mostrar detalles técnicos.
- Tras importar, se ejecuta automáticamente la detección de duplicados sobre los datos cargados.

**Usuario de acceso del participante**
- Se genera automáticamente al crear la solicitud, a partir del primer nombre y primer apellido; no se digita ni se edita manualmente.
- Si ese usuario ya existe, se intenta agregando la inicial del segundo apellido; si aún así existe (o no hay segundo apellido), se agrega un sufijo numérico hasta encontrar uno disponible.

**"Existe en BD anterior"**
- Indica si el publicador ya existía en una base de datos histórica previa al sistema.
- Todo registro nuevo se crea en "No" y bloqueado; no se puede marcar manualmente al dar de alta.
- Solo se marca en "Sí" en bloque, desde la grilla, típicamente ofrecido automáticamente después de exportar a Excel los registros seleccionados (como confirmación de que ya se volcaron a la base anterior).
- La grilla puede filtrarse por este campo (Todos / Sí / No).

**Notificaciones de entrenamiento ("Enviar mensaje")**
- Envía, a los registros seleccionados, un mensaje de WhatsApp basado en una plantilla configurada en "Mensajes", con marcadores que se reemplazan automáticamente (nombre, congregación, fecha y lugar de capacitación, etc.); los de nombre/apellido anteponen "Hermano"/"Hermana" según el sexo.
- Solo se genera el enlace de envío para los destinatarios que tienen móvil registrado; si ninguno de los seleccionados tiene móvil, no se puede enviar nada.
- Es obligatorio indicar a qué está relacionado el mensaje, de lo cual depende si cambia el estado de la solicitud:
  - "Primer entrenamiento": el estado pasa a NOTIFICADO PRIMER ENTRENAMIENTO y se registra la fecha de envío.
  - "Segundo entrenamiento": el estado pasa a NOTIFICADO SEGUNDO ENTRENAMIENTO y se registra la fecha de envío.
  - "Otro": se envía el mensaje pero no se modifica el estado ni ninguna fecha de la solicitud.

**Asignar lugar de entrenamiento**
- Sobre los registros seleccionados en bloque, se asigna el tipo de entrenamiento (primero o segundo), una fecha y un punto/lugar; los tres datos son obligatorios para poder guardar.
- No cambia por sí sola el estado de la solicitud; solo registra dónde y cuándo se hará el entrenamiento.

**Quitar lugar de entrenamiento**
- Acción en bloque que revierte la fecha y el lugar asignados de ambos entrenamientos y regresa el estado correspondiente (ver flujo de estado arriba).
- Requiere confirmación explícita antes de ejecutarse.

**Exportación general y lista de chequeo de entrenamiento**
- El listado visible en la grilla (ya filtrado/ordenado) puede exportarse a Excel o a CSV; si no hay registros con el filtro actual, se informa que no hay nada para exportar.
- La lista de chequeo de entrenamiento se genera filtrando por tipo de entrenamiento (primero o segundo) y agrupando por fecha y lugar asignados; solo incluye publicadores que ya tienen fecha y lugar asignados para ese entrenamiento.
- El Excel resultante muestra, por cada fecha/lugar, el nombre y dirección del punto, su encargado y móvil de contacto, y el listado de publicadores (número, nombre completo, móvil, congregación, circuito) en orden alfabético, con una columna en blanco para marcar asistencia a mano; existe también una versión equivalente en PDF.

**Retiro / baja de un publicador**
- El propio participante solicita su baja (desde "Mis datos", ver Bloque 2) e indica obligatoriamente una justificación (hasta 1000 caracteres); no puede solicitarla sin ese texto.
- Al solicitarla, el registro se traslada a un listado separado de bajas pendientes con estado "PENDIENTE VALIDACIÓN" y el acceso del participante se bloquea de inmediato, aunque la baja todavía no haya sido aprobada.
- Los turnos que el publicador tuviera asignados NO se liberan al solicitar la baja: siguen asignados hasta que un administrador la aprueba formalmente.
- La aprobación la realiza un administrador desde "Casos por validar", indicando obligatoriamente una observación de aprobación (hasta 1000 caracteres).
- Al aprobar la baja se liberan automáticamente todos los turnos del publicador y su registro pasa a estado "INACTIVO".
- Una baja ya aprobada no puede volver a aprobarse: si se reintenta, se informa que la solicitud ya fue procesada.
- No existe opción de "rechazar" una solicitud de baja: solo puede aprobarse o quedar pendiente.

**Auditoría**
- Todo registro nuevo guarda quién lo creó y la fecha de registro; toda modificación guarda quién y cuándo, incluidas las acciones en bloque (asignar/quitar lugar, notificar, marcar BD anterior, confirmar/revertir asistencia).
- Cuando el propio participante actualiza sus datos, se guarda además, por separado, quién y cuándo hizo esa actualización específica.
- La aprobación de una baja guarda quién la aprobó, la observación y la fecha de validación.

#### Casos por validar

**Qué es un "caso por validar"**
- Es una solicitud que no pudo resolverse automáticamente y necesita revisión manual de un administrador. Existen dos tipos:
  - **Turnos**: solicitudes de turno con conflicto de sexo (el otro cupo del mismo punto/día/horario ya está ocupado por alguien de sexo contrario) para las cuales el publicador dio una justificación para insistir en tomarlo de todas formas.
  - **Retiros**: solicitudes de baja de un publicador, a la espera de aprobación.

**Pestañas/categorías**
- Turnos pendientes: casos de turno a la espera de decisión.
- Turnos aprobados (histórico) y turnos rechazados (histórico).
- Retiros pendientes y retiros aprobados (histórico).
- No existe una categoría de "retiros rechazados": una baja solo se puede aprobar, no rechazar, desde esta pantalla.

**Qué se pide al decidir**
- Turnos: aprobar o rechazar exige escribir una justificación de respuesta (obligatoria, hasta 1000 caracteres) explicando el motivo de la decisión.
- Retiros: aprobar exige escribir una observación de aprobación (obligatoria, hasta 1000 caracteres).
- El botón para enviar la decisión permanece deshabilitado mientras no se haya escrito esa justificación/observación o mientras el envío esté en curso.

**Qué pasa con el turno según la decisión**
- Aprobar: el turno queda asignado en firme al publicador, y queda registro histórico de quién aprobó, cuándo y con qué justificación.
- Rechazar: el turno se libera por completo (vuelve a estar disponible para cualquier publicador), y la decisión queda guardada en el histórico de casos procesados.

**Regla de "solicitud ya procesada"**
- Una solicitud de turno pendiente o una solicitud de baja pendiente solo puede aprobarse o rechazarse una vez. Si dos administradores intentan procesar el mismo caso casi simultáneamente, solo el primero tiene éxito; el segundo intento se rechaza indicando que la solicitud ya fue procesada.

**Información mostrada al revisar un caso**
- Turno: punto, día y hora; móvil del solicitante; explicación en lenguaje de negocio de por qué no se aprobó automáticamente; quién ocupa actualmente el otro cupo del mismo horario (nombre y móvil, consultado en el momento de la revisión); justificación entregada por el solicitante; nombre del cónyuge (solo si quien solicita es mujer casada); fecha de la solicitud.
- Retiro: nombre del publicador, edad, años de bautizado, privilegio de servicio, móvil, congregación, justificación de la baja y fecha de solicitud; en el histórico de aprobados se agrega quién aprobó, la observación y la fecha de validación.

#### Confirmar asistencia

- Sirve para registrar si un publicador efectivamente asistió al primer o segundo entrenamiento al que fue convocado.
- Cómo se filtra: primero se elige una fecha de entrenamiento (solo aparecen fechas de hoy en adelante), luego el tipo de entrenamiento (primero o segundo) y luego el lugar/punto; solo entonces aparece el listado de publicadores citados.
- Marcar asistencia al primer entrenamiento pasa el "entrenamiento requerido" a "Segundo entrenamiento"; marcar la del segundo lo pasa a "Entrenamiento completado", el estado de la solicitud pasa a "CUMPLE REQUISITOS", y se completan las fechas correspondientes.
- Solo el mismo administrador que confirmó una asistencia puede desmarcarla; si otro administrador distinto lo intenta, la operación no tiene efecto y se informa que solo quien la confirmó puede desmarcarla.
- Al desmarcar, se revierte el "entrenamiento requerido" (y, en el caso del segundo entrenamiento, también el estado) a su valor anterior.
- Queda auditoría de quién confirmó o desmarcó y cuándo.

#### Asignar turno

**Regla de negocio general (aplica igual al participante y al administrador que asigna en su nombre)**
- Cada publicador puede tener como máximo 3 turnos activos a la vez. Si ya tiene 3, no puede tomar otro hasta liberar al menos uno.
- Antes de poder solicitar un turno, el publicador debe tener registrado su sexo en sus datos; si no lo tiene, se le exige completarlo primero.
- Si el turno elegido ya fue tomado por otro publicador (aunque en pantalla figurara disponible), la solicitud se rechaza indicando que debe elegir otro.
- Regla de compatibilidad de sexo: cada turno tiene un cupo "pareja" (el otro puesto del mismo punto, día y horario).
  - Si el cupo pareja está libre o ya ocupado por alguien del mismo sexo, el turno se asigna de inmediato en firme, y se informa el nombre y móvil del encargado del punto para contactarlo.
  - Si hay conflicto de sexo y no se da ninguna justificación, no se asigna nada: se advierte que, salvo que la otra persona sea familiar, cónyuge o prometido/a, no debería tomarse ese turno.
  - Si se continúa con una justificación (obligatoria en ese caso, máximo 500 caracteres), el turno queda asignado provisionalmente en estado "Pendiente" a la espera de revisión en "Casos por validar".
- Un turno ya asignado no puede volver a solicitarse por otra persona.

**Qué es distinto en la versión de administrador**
- El administrador primero elige el punto y luego el turno específico, viendo la disponibilidad de todos los turnos de ese punto.
- El administrador debe buscar y elegir primero al publicador (por nombre o móvil) en cuyo nombre se va a asignar el turno.
- Antes de confirmar, se muestra cuántos turnos tiene ya solicitados ese publicador frente al máximo permitido; si ya alcanzó el máximo, la opción de asignar queda deshabilitada.
- El resto del proceso (conflicto de sexo, justificación, mensajes de resultado) es idéntico al flujo de un participante que solicita su propio turno.

#### Retirar turno

**Regla de negocio general (aplica igual al participante y al administrador que retira en su nombre)**
- Solo puede devolverse un turno que esté efectivamente asignado al publicador indicado.
- Es obligatorio elegir un motivo de la lista predefinida: "Ocupado (mis circunstancias han cambiado)", "Salud", "Temporal", "Traslado", "Cambio de Punto" u "Otro".
- Si el motivo es "Otro", es obligatorio además escribir el motivo específico (máximo 200 caracteres).
- Las observaciones adicionales son opcionales (máximo 500 caracteres).
- Al devolver el turno, este queda liberado de inmediato y queda un registro histórico de la devolución.
- Si el turno ya no estaba asignado a ese publicador al momento de confirmar, la operación se rechaza.

**Qué es distinto en la versión de administrador**
- El administrador debe primero buscar y elegir al publicador (por nombre o móvil) para ver la lista de turnos que ese publicador tiene actualmente asignados.
- Solo después de elegir al publicador aparece el listado de sus turnos, sobre los que se puede iniciar la devolución de cualquiera.

#### Informe de turno

**Regla de negocio general (aplica igual al participante y al administrador que reporta en su nombre)**
- Solo puede reportarse actividad sobre un turno efectivamente asignado al publicador indicado.
- La fecha de la actividad es obligatoria y no puede ser una fecha futura.
- La fecha reportada debe coincidir con el día de la semana programado para ese turno; si no coincide, se rechaza indicando cuál es el día correcto.
- Es obligatorio indicar si se cumplió el turno (Sí/No).
- Solo si se cumplió el turno se pregunta si se inició una conversación (Sí/No); y solo si además se inició una conversación se pregunta si se acordó un curso/estudio (Sí/No).
- Las observaciones son opcionales (máximo 500 caracteres).
- No se puede reportar dos veces la misma actividad para la misma fecha en el mismo horario: los dos cupos de un mismo punto/día/horario comparten la misma actividad.
- Existe también un histórico de actividad por turno, con todas las fechas ya reportadas (de cualquiera de los dos cupos) y quién las registró.

**Qué es distinto en la versión de administrador**
- El administrador debe primero buscar y elegir al publicador (por nombre o móvil) para ver la lista de turnos que ese publicador tiene asignados.
- Sobre cada turno del publicador elegido, el administrador puede tanto reportar una nueva actividad como consultar el histórico de actividades ya reportadas.

### Página de inicio

#### Banners

- Un banner es una imagen grande de tipo carrusel que se muestra en la parte superior de la pantalla de Inicio de los publicadores.
- Cargar la imagen es obligatorio: no se puede crear un banner sin haber subido antes una imagen.
- La imagen se ajusta automáticamente a un tamaño fijo de 1892 x 720 píxeles antes de guardarse: el sistema recorta el sobrante de la imagen original (sin deformarla ni estirarla), sin importar la proporción con la que se subió originalmente.
- El archivo de imagen no puede superar los 10 MB, y solo se permiten archivos de tipo imagen.
- Al crear un banner nuevo, este queda visible (activo) de forma predeterminada, salvo que se indique lo contrario.
- Un banner es "visible" para los publicadores únicamente cuando está marcado como activo. Los banners inactivos solo se ven en la pantalla de administración.
- El orden de aparición lo determina la posición asignada a cada uno; los publicadores los ven exactamente en ese orden. Al crear un banner nuevo, se agrega automáticamente al final de la lista de orden.
- Desde la administración se puede reordenar cada banner un puesto hacia arriba o hacia abajo.
- No existe límite máximo en la cantidad de banners; se muestran todos los que estén activos, en su orden.
- Al eliminar un banner se elimina también la imagen asociada del almacenamiento.
- La gestión de banners está disponible para cualquier usuario con rol de BackOffice o Coordinador PPAM, no es exclusiva de Administrador.
- Se registra automáticamente quién creó y quién modificó por última vez cada banner, y en qué fecha.

#### Noticias

- Una noticia se compone de: título, resumen, contenido, imagen de portada (opcional), estado (borrador o publicada), fecha de publicación, fecha máxima de publicación (opcional) y su posición de orden.
- El título es obligatorio (máx. 200 caracteres) y el resumen es obligatorio (máx. 300 caracteres) — es el texto corto que se muestra en la tarjeta de la noticia.
- El contenido (cuerpo, con formato de texto enriquecido: negrita, cursiva, subrayado, listas y enlaces) es obligatorio.
- La imagen de portada es opcional; si se carga, no puede superar los 10 MB y debe ser un archivo de imagen.
- Una noticia puede guardarse en estado "Borrador" (no visible) o "Publicada" (visible); al crearla, si no se indica estado, queda como Borrador.
- Una noticia es visible únicamente cuando su estado es "Publicada" y, si tiene fecha máxima de publicación definida, esa fecha no ha pasado todavía. Una noticia vencida deja de mostrarse automáticamente, aunque su estado siga marcado como Publicada.
- La fecha de publicación se registra automáticamente la primera vez que la noticia pasa a estado "Publicada"; si luego se despublica y se vuelve a publicar, esa fecha original no se modifica.
- Al crear una noticia se agrega automáticamente al final de la lista de orden; ese orden determina el orden en que aparecen. Se puede reordenar un puesto hacia arriba o hacia abajo.
- En la pantalla de Inicio del publicador se muestran como máximo 6 noticias (las más recientes según su orden), aunque existan más publicadas.
- Al seleccionar una noticia, el publicador accede a una vista de detalle con el contenido completo.
- Al eliminar una noticia se elimina también su imagen asociada, cuando corresponde.
- La gestión de noticias está disponible para cualquier usuario con rol de BackOffice o Coordinador PPAM, no es exclusiva de Administrador.
- Se registra automáticamente quién creó y quién modificó por última vez cada noticia, y en qué fecha.

#### Capacitación

- Un elemento de capacitación se compone de: tipo de contenido (imagen o video), título, resumen, imagen o enlace de video según el tipo, fecha máxima de publicación (opcional), si está activo o no, y su posición de orden.
- El tipo de contenido es obligatorio ("Imagen" o "Video"). El título (máx. 200) y el resumen (máx. 300) son obligatorios.
- Si el tipo es "Imagen", es obligatorio cargar una imagen; si es "Video", es obligatorio indicar el enlace del video.
- Los videos admitidos son enlaces de YouTube o de Vimeo, que se reconocen automáticamente para mostrarse embebidos; si el enlace no corresponde a ninguno de esos dos servicios, se ofrece un acceso "Ver video" en lugar de reproducirlo embebido.
- La imagen, cuando aplica, no puede superar los 10 MB y debe ser un archivo de imagen.
- Un elemento es visible únicamente cuando está marcado como activo y, si tiene fecha máxima de publicación, esa fecha no ha pasado todavía.
- Al crear un elemento nuevo, queda activo de forma predeterminada y se agrega al final de la lista de orden; se puede reordenar un puesto hacia arriba o hacia abajo.
- Al seleccionar un elemento, el publicador accede a una vista de detalle (imagen ampliada o reproductor de video embebido).
- Al eliminar un elemento de tipo imagen se elimina también la imagen asociada; los de tipo video no tienen archivo propio que borrar.
- La gestión de capacitación está disponible para cualquier usuario con rol de BackOffice o Coordinador PPAM, no es exclusiva de Administrador.
- Se registra automáticamente quién creó y quién modificó por última vez cada elemento, y en qué fecha.

### Datos maestros

#### Puntos

- Un punto es un lugar físico (de predicación PPAM o de entrenamiento) donde se pueden asignar turnos a los publicadores.
- Cada punto tiene un código numérico único, asignado automáticamente por el sistema (el mayor código existente más uno); no se puede modificar una vez creado el punto.
- Campos: nombre (obligatorio, hasta 100 caracteres), tipo de punto ("Punto PPAM" o "Punto de entrenamiento"), dirección (obligatoria, hasta 100), departamento y municipio (obligatorios, el municipio depende del departamento elegido), encargado (obligatorio, hasta 100), móvil de contacto (obligatorio, solo dígitos, máximo 10) y estado (Activo/Inactivo).
- Al crear un punto nuevo, el estado queda fijado en "Activo"; solo puede cambiarse a "Inactivo" editando el punto después de creado.
- No existe opción para eliminar un punto; solo se puede crear, editar o cambiar su estado.
- Cada punto queda registrado con quién lo creó/modificó y en qué fecha.
- El listado de puntos puede filtrarse por tipo de punto.
- Cada punto tiene un calendario semanal (lunes a domingo) de horarios; cada franja horaria tiene exactamente dos "cupos", pensados para que ambos publicadores de una misma franja sean del mismo sexo. Si uno de los dos cupos ya lo ocupa un hermano, el cupo restante se muestra como "Disponible para un hermano" (y de forma equivalente para una hermana); si ninguno está ocupado, se muestra simplemente "Disponible".
- Un cupo "Ocupado" se distingue con un ícono según el sexo de quien lo ocupa; solo un Administrador o el propio encargado del punto pueden ver además el nombre completo, el móvil y la congregación de quien lo ocupa.
- Un espacio de la cuadrícula sin ningún cupo configurado se muestra como "No habilitado".
- El calendario se puede consultar como cuadrícula completa de los 7 días (escritorio/tablet) o como agenda de un día con selector (móvil), y descargarse en PDF con la misma información.
- Un publicador que figure como encargado de uno o más puntos puede consultar el calendario de ese/esos puntos sin pasar por "Datos maestros": el sistema lo identifica comparando el móvil de su propio perfil con el móvil registrado como encargado en el punto; si coinciden, se habilita el acceso (solo para puntos en estado Activo). Si es encargado de más de un punto, puede elegir entre ellos.

#### Circuitos

- Un circuito agrupa congregaciones y tiene asociado un superintendente de circuito ("viajante").
- Campos: código de circuito (obligatorio, hasta 10 caracteres, identificador único que no puede modificarse una vez creado), nombre del viajante (obligatorio, hasta 100), móvil (obligatorio, solo dígitos, máximo 10) y correo electrónico (obligatorio, formato válido, hasta 100).
- Cada congregación debe estar asociada a un circuito existente.
- No existe opción para eliminar un circuito, solo crearlo o editarlo.
- Se registra quién lo creó/modificó y en qué fecha.

#### Congregaciones

- Campos: código de congregación (número entero, obligatorio, identificador único que no puede modificarse una vez creada), nombre (obligatorio, hasta 100), departamento y municipio (obligatorios, el municipio depende del departamento elegido), circuito (obligatorio, de catálogo) y correo electrónico (obligatorio, formato válido, hasta 100).
- Al editar una congregación es obligatorio volver a indicar todos sus datos; no se permite dejar alguno vacío.
- No existe opción para eliminar una congregación, solo crearla o editarla.
- Se registra quién la creó/modificó y en qué fecha.

#### Municipios

- Campos: código de municipio (obligatorio, hasta 6 caracteres, identificador único que no puede modificarse una vez creado), nombre (obligatorio, hasta 100) y departamento al que pertenece (obligatorio).
- Todo municipio pertenece a un único departamento; ese dato es el que filtra los municipios disponibles al elegir uno en los formularios de puntos y congregaciones.
- A diferencia de puntos, circuitos, congregaciones y mensajes, en municipios no se registra quién lo creó/modificó ni las fechas de esas acciones.
- No existe opción para eliminar un municipio, solo crearlo o editarlo (el código no se puede cambiar).

#### Departamentos

- Campos: código de departamento (obligatorio, hasta 6 caracteres, identificador único que no puede modificarse una vez creado) y nombre (obligatorio, hasta 100).
- Es el nivel más alto de la jerarquía geográfica: municipios, congregaciones y puntos siempre están asociados a un departamento.
- No se registra quién creó/modificó un departamento ni las fechas de esas acciones.
- No existe opción para eliminar un departamento, solo crearlo o editarlo (al editar solo se puede cambiar el nombre, no el código).

#### Mensajes

- Administra plantillas reutilizables de texto que se usan para enviar notificaciones a publicadores por WhatsApp, principalmente desde "Gestión de solicitudes".
- Cada plantilla tiene: un tipo o categoría (texto libre, obligatorio, hasta 50 caracteres, para agrupar y filtrar plantillas), el texto del mensaje (obligatorio, hasta 2000 caracteres, con marcadores de negrita/cursiva al estilo WhatsApp) y, opcionalmente, un archivo adjunto (hasta 10 MB, cuyo enlace se agrega automáticamente al final del mensaje).
- El texto puede incluir marcadores que se reemplazan automáticamente por el dato real de cada publicador destinatario (nombre, congregación, fecha de bautismo, dirección, estado de la solicitud, fecha y lugar de capacitación con su encargado y móvil de contacto, entre otros), insertados desde un menú de autocompletar al escribir "/".
- Los marcadores de nombres/apellidos anteponen automáticamente "Hermano" o "Hermana" según el sexo registrado, y el nombre se ajusta a formato de título.
- Si un marcador no corresponde a ningún campo conocido, se deja tal como está en el mensaje final, sin generar error.
- Al enviar un mensaje, primero se elige el tipo de plantilla y luego una plantilla específica; el sistema genera, para cada destinatario, un enlace de WhatsApp ya personalizado. Los publicadores sin móvil registrado quedan excluidos automáticamente del envío.
- Cuando el envío está relacionado con una notificación de entrenamiento, debe indicarse a cuál entrenamiento corresponde, dato que queda asociado a la solicitud del publicador.
- No existe opción para eliminar una plantilla, solo crearla o editarla.
- Se registra quién la creó/modificó y en qué fecha.
- El listado de tipos disponibles al enviar un mensaje se arma dinámicamente a partir de los tipos que los administradores ya hayan usado al crear plantillas, no es una lista fija predefinida.

### Configuración

#### Usuarios

- Un "usuario" es una cuenta de acceso al panel administrativo (BackOffice), distinta de un participante/publicador; se identifica por un login único.
- Existen exactamente dos roles posibles: **Administrador** y **Coordinador**.
- Campos: login (obligatorio, máx. 20 caracteres, no editable una vez creado), rol (obligatorio), contraseña, correo electrónico (obligatorio, formato válido, máx. 100) y móvil (obligatorio, solo dígitos, máx. 10).
- Al crear un usuario, la contraseña es obligatoria (6 a 100 caracteres). Al editar, es opcional: si se deja en blanco se conserva la actual; si se diligencia, debe cumplir el mismo rango.
- Las contraseñas nunca se almacenan ni se muestran en texto plano; se guardan cifradas y no son recuperables, solo reemplazables.
- Solo el perfil Administrador puede ver y usar la opción "Usuarios" dentro de Configuración.

**Vinculación automática con un publicador (participante)**
- Un usuario tipo login/contraseña puede quedar automáticamente vinculado a un registro de publicador si el móvil del usuario coincide exactamente con el móvil de algún publicador. Esta vinculación se recalcula en cada inicio de sesión.
- Cuando existe esa vinculación, la persona puede alternar entre la vista de BackOffice (Dashboard) y la vista de Participante (Inicio) dentro de la misma sesión; si no hay publicador vinculado, solo tiene disponible la vista de BackOffice.

**Inicio de sesión (dos flujos posibles)**
- El sistema intenta primero autenticar contra la tabla de usuarios (login + contraseña). Si el login existe ahí, la contraseña debe coincidir; si no, se rechaza con un mensaje genérico de "usuario o contraseña incorrectos" (sin indicar cuál de los dos es el incorrecto).
- Si el login no corresponde a ninguna cuenta de usuario, el sistema intenta un segundo flujo: trata el login como el de un publicador (participante) y la "contraseña" ingresada como si fuera su número de móvil. Si ambos coinciden con un publicador registrado, el acceso se concede como sesión de participante.
- Si ninguno de los dos flujos tiene éxito, se rechaza con el mismo mensaje genérico, para no revelar cuál dato falló.

**Recuperación de contraseña ("olvidé mi contraseña")**
- Se solicita indicando el correo registrado. Por seguridad, siempre se responde con el mismo mensaje genérico, exista o no ese correo, para no revelar qué direcciones están registradas.
- Si el correo corresponde a un usuario, se genera una contraseña temporal aleatoria y se envía por correo junto con el login. La nueva contraseña solo se guarda si el envío fue exitoso; si falla, la contraseña original se conserva intacta.

**Cambio de contraseña (usuario ya autenticado)**
- Debe indicarse la contraseña actual (que debe coincidir con la registrada) y la nueva (6 a 100 caracteres, confirmada escribiéndola dos veces).

#### Parámetros

- Define reglas generales configurables sin necesidad de cambios en el sistema. Por ahora existe un único parámetro: la actualización obligatoria de datos.
- Se configura con un número de meses (entero positivo obligatorio) y un interruptor de activación; el interruptor solo puede encenderse si el número de meses es válido, y se apaga automáticamente si ese número se borra o queda inválido.
- Mientras el interruptor esté apagado, no se exige a ningún publicador actualizar sus datos, sin importar cuánto tiempo haya pasado.
- En cada inicio de sesión se evalúa si el publicador debe actualizar sus datos: si nunca ha confirmado/actualizado sus datos y el parámetro está activo, siempre se le exige; si sí tiene una fecha de última actualización, se le exige solo cuando ya transcurrió una cantidad de meses igual o mayor a la configurada.
- La verificación de actualización de datos se resuelve después de la aceptación del aviso legal: si al publicador le faltan ambas cosas, primero acepta el aviso legal y después se le pide actualizar sus datos.
- Si la actualización es obligatoria, el publicador ve primero una pantalla de aviso y luego el formulario "Mis datos", donde debe presionar "Guardar" aunque no tenga cambios.
- Mientras esté pendiente, el publicador no puede navegar a ninguna otra pantalla del área de participante: cualquier intento lo redirige de vuelta al formulario, y tampoco se le ofrece la opción de solicitar su baja.
- Al guardar exitosamente, la exigencia queda resuelta de inmediato y el publicador es llevado a Inicio, recuperando acceso normal a todo el menú.

#### Textos legales

- Administra el contenido del aviso de autorización para el tratamiento de datos personales que se presenta a cada publicador.
- Cada vez que se guarda contenido nuevo se crea una "versión" distinta; ninguna versión anterior se sobrescribe ni se pierde, quedando siempre un historial completo.
- En todo momento existe como máximo una versión "publicada" (activa/vigente); todas las demás son versiones anteriores o borradores sin efecto sobre los publicadores.
- Al guardar una versión nueva marcándola como publicada, todas las demás se despublican automáticamente. Si se guarda sin publicar, la versión vigente anterior permanece intacta.
- El interruptor de publicar/despublicar actúa sobre la versión ya guardada que está en pantalla: cambia su estado de inmediato, sin crear una versión nueva y sin modificar su contenido. Al publicar con este interruptor, cualquier otra versión publicada se despublica automáticamente.
- Despublicar la versión vigente hace que, temporalmente, no exista ninguna versión activa.
- Solo el perfil Administrador puede ver y usar esta opción.

**Qué ocurre cuando un publicador no ha aceptado la versión vigente**
- Si no existe ninguna versión publicada, no se exige nada a nadie.
- Si existe una versión publicada y el publicador nunca la ha aceptado (incluye haber aceptado una versión anterior distinta a la actual), al iniciar sesión es dirigido de inmediato a la pantalla de aviso, antes que a cualquier otra pantalla (incluida la de actualización obligatoria de datos).
- La única acción disponible es "Acepto"; mientras no se presione, no se puede acceder a ninguna otra sección.
- Al aceptar, se registra la aceptación asociada a esa persona y a esa versión concreta, con la fecha. Si se publica una versión distinta después, esa aceptación deja de ser válida y se vuelve a exigir.
- Este aviso solo aplica a publicadores (participantes); una cuenta de BackOffice sin publicador vinculado no está sujeta a esta exigencia.
- Esta exigencia existe porque la aplicación recopila información sensible por su naturaleza personal y religiosa (congregación, circuito, fecha de bautismo, privilegios de servicio, etc.), razón por la cual se exige un consentimiento explícito y trazable antes de usar el resto de la aplicación.

#### Reglas generales de acceso y sesión

- El acceso a cualquier pantalla, tanto de participante como de BackOffice, requiere una sesión activa; si no la hay, se redirige a inicio de sesión y, tras autenticarse, se vuelve automáticamente a la pantalla que se intentaba visitar.
- Una persona con sesión activa no puede volver a ver la pantalla de inicio de sesión: si lo intenta, es redirigida a su pantalla principal.
- Antes de usar cualquier pantalla de participante se verifica la aceptación del aviso legal vigente, y luego si tiene pendiente una actualización obligatoria de datos.
- El acceso al área de BackOffice requiere, además de la sesión activa, que la cuenta tenga asignado un rol (Administrador o Coordinador); una sesión que solo corresponde a un participante es redirigida a Inicio del participante.
- Dentro del BackOffice, "Configuración" y sus subsecciones (incluidas Usuarios, Parámetros y Textos legales, y también "Datos maestros") solo se muestran a cuentas con rol Administrador; el rol Coordinador no ve esas opciones en el menú.
- El control de acceso por rol se resuelve enteramente en el frontend (ocultando/mostrando opciones de menú y pantallas). El backend no valida ni restringe por rol al recibir las peticiones: cualquier cuenta autenticada con un token válido puede invocar las mismas operaciones, independientemente de su rol — la separación entre Administrador y Coordinador es una conveniencia de navegación, no una barrera de seguridad del servidor.

### Salir

- Cierra la sesión activa (se elimina la sesión guardada en el dispositivo) y redirige a la pantalla de inicio de sesión. Disponible tanto en la vista de administrador como en la de participante.

---

## Bloque 2 · Funcionalidades para los publicadores (usuarios en general)

### Inicio de sesión

- Existen dos formas de iniciar sesión usando el mismo formulario:
  - Cuentas de BackOffice/Coordinador: usuario y contraseña propios.
  - Publicadores comunes: no tienen contraseña propia almacenada; su acceso es con su login registrado y, en el campo de "contraseña", su propio número de móvil registrado. El sistema primero intenta el login como cuenta de rol; solo si no lo encuentra, lo valida como publicador comparando el móvil.
- Cuando el login corresponde a una cuenta de rol cuyo móvil coincide con el de un publicador registrado, esa sesión queda vinculada simultáneamente a ambas identidades (rol administrativo y perfil de publicador), lo que habilita alternar entre panel administrativo y vista de participante.
- Tras iniciar sesión, siempre se muestra primero Inicio de participante, incluso para cuentas administrativas — salvo si la cuenta tiene rol administrativo pero ningún publicador vinculado, en cuyo caso se va directo al Dashboard.
- La vista activa (participante o administrativa) queda recordada para la próxima vez que se inicie sesión.
- Cuando una sesión tiene ambas identidades, aparece un control para alternar libremente entre Inicio y Dashboard en cualquier momento; si solo tiene una, ese control no se muestra.
- La recuperación de contraseña por correo solo aplica a cuentas de BackOffice/Coordinador; no aplica a publicadores comunes, cuyo acceso no depende de una contraseña propia sino de su número de móvil.

### Inicio

- El saludo ("Hola, [nombre]") muestra el primer nombre registrado del publicador; si no está disponible, usa su nombre completo y, en último caso, su usuario de acceso.
- El carrusel superior muestra los banners activos gestionados por el administrador; si no hay ninguno activo, se muestra una imagen institucional fija.
- "Últimas noticias" muestra hasta 6 noticias publicadas y vigentes, en el orden definido por el administrador; la sección se oculta si no hay ninguna.
- "Entrenamiento y recomendaciones" muestra las capacitaciones activas y vigentes (imagen o video), en el orden definido por el administrador; se oculta si no hay ninguna.
- Banners, noticias y capacitaciones son el mismo contenido que gestiona el administrador: el participante solo lo visualiza.
- El menú de accesos rápidos ofrece 4 opciones: Solicitar turno, Devolver turno, Reportar actividad del turno y Actualizar datos.
- El botón "Escríbenos" abre un formulario de contacto (hasta 1000 caracteres). Hoy es solo una simulación de interfaz: el mensaje no se guarda ni se envía a nadie; la aplicación muestra un mensaje de confirmación genérico como si se hubiera procesado. Esta funcionalidad todavía no está habilitada de forma real.
- El menú de cuenta ofrece "Cambiar contraseña" (solo tiene efecto real para cuentas con contraseña propia, es decir roles de BackOffice/Coordinador — un publicador común no tiene una contraseña propia que cambiar por esta vía) y "Cerrar sesión".
- El ícono de calendario en la parte superior solo aparece para publicadores registrados como "encargados" de al menos un punto: la condición es que el móvil del propio publicador coincida exactamente con el móvil registrado como encargado en un punto en estado "Activo". Un publicador puede ser encargado de más de un punto, en cuyo caso puede elegir cuál ver. Al hacer clic se abre el calendario de ese/esos puntos sin pasar por pantallas administrativas.

### Solicitar turno

- El publicador primero elige un punto entre los puntos activos.
- Al seleccionar un punto se muestra la lista de horarios disponibles por día, agrupados en parejas de cupos (normalmente uno pensado para un hermano y otro para una hermana).
- Se puede filtrar por día específico y/o ver solo los cupos con disponibilidad.
- Cada cupo muestra su estado: ocupado (con datos de quien lo ocupa, visibles solo para administrador o el encargado del punto), disponible en general, o disponible sugerido para hermano/hermana según quien ocupe el cupo pareja.
- Antes de solicitar cualquier turno, el publicador debe tener registrado su sexo; si no lo tiene, se le pide completarlo primero.
- Existe un límite máximo de 3 turnos activos (aprobados o pendientes) por publicador; al alcanzarlo, la opción de solicitar queda deshabilitada con un mensaje explicativo.
- Al hacer clic en "Solicitar" sobre un cupo, el sistema valida en tiempo real que siga libre; si otro publicador ya lo tomó, se informa y se invita a elegir otro horario.
- Si el cupo pareja está libre o lo ocupa alguien del mismo sexo, la solicitud se aprueba de forma automática e inmediata, sin justificación.
- Si el cupo pareja ya está ocupado por alguien de sexo distinto, se advierte que ese turno normalmente debe tomarlo alguien del mismo sexo, salvo relación familiar, de cónyuge o de prometido/a con esa persona.
- Para continuar en ese caso, es obligatorio escribir una justificación (hasta 500 caracteres); sin ella no se puede completar la solicitud, y con ella la solicitud queda "pendiente" a la espera de revisión manual de un administrador (Casos por validar), con respuesta posterior por WhatsApp.
- Al confirmarse una solicitud aprobada automáticamente, se muestra el nombre y número de contacto del encargado del punto.
- El publicador puede ver en todo momento cuántos turnos tiene asignados frente al máximo permitido, y el detalle de cada uno (incluyendo si sigue pendiente de aprobación).

### Devolver turno

- Solo se pueden devolver turnos propios (asignados o pendientes de aprobación).
- Es obligatorio elegir un motivo entre: Ocupado, Salud, Temporal, Traslado, Cambio de Punto u Otro; si es "Otro", debe especificarse el detalle (hasta 200 caracteres).
- Puede agregarse una observación opcional (hasta 500 caracteres).
- No hay restricción de fecha: puede devolverse en cualquier momento mientras siga asignado, sin importar si el horario ya pasó.
- Al confirmar, el cupo se libera de inmediato y queda un registro histórico (motivo, observaciones, fecha).

### Reportar actividad del turno

- Solo se puede reportar actividad de turnos propios, y solo cuando la solicitud del turno ya esté aprobada (no mientras esté pendiente).
- Debe indicarse la fecha de la actividad, que no puede ser futura y debe coincidir con el día de la semana programado para ese turno; de lo contrario se rechaza indicando el día correcto.
- No puede registrarse dos veces la actividad de la misma fecha para el mismo horario: los dos cupos de un mismo punto/día/hora comparten la misma actividad; si el cupo pareja ya la reportó, se informa quién lo hizo y no se permite duplicar.
- El sistema valida la fecha (futura, día de semana, posible duplicado) apenas se elige, antes de completar el resto del formulario.
- Es obligatorio indicar si se cumplió el turno; solo si se cumplió se pregunta si se inició una conversación, y solo si además se inició una conversación se pregunta si se acordó un curso/estudio bíblico.
- La observación es opcional (hasta 500 caracteres).
- Puede consultarse el histórico de actividad ya reportada para ese turno, incluyendo los registros hechos por el cupo pareja.

### Actualizar datos (Mis datos)

- El publicador puede revisar y editar su propia información personal: nombres/apellidos, dirección, departamento/municipio, correo, móvil, congregación, fecha de nacimiento, sexo, fecha de bautismo, estado civil, privilegio ministerial, privilegio de servicio y si participó antes.
- El nombre del cónyuge y el apellido de casada solo se piden cuando el sexo es femenino y el estado civil es "Casado" o "Separado".
- El circuito se muestra automáticamente según la congregación elegida; la edad y los años de bautismo se calculan automáticamente y no son editables.
- El correo debe tener formato válido y el móvil solo números (máx. 10 dígitos); nombre/apellido/dirección se formatean automáticamente en formato de título.
- Ningún dato de flujo administrativo (estado de la solicitud, entrenamiento, fechas/lugares de capacitación, "existe en BD anterior") es visible ni editable desde aquí.
- Al guardar, se registra la fecha del día como la fecha de "última actualización de datos", independientemente de si algo cambió realmente; esa fecha es la que determina si más adelante se exigirá una nueva actualización obligatoria.
- Cuando la actualización es obligatoria (ver "Parámetros" en el Bloque 1), al iniciar sesión el publicador es dirigido primero a una pantalla explicativa y luego aquí; debe presionar "Guardar" (aunque no cambie nada) para poder continuar. Mientras esté pendiente, el resto del menú queda oculto (solo "Mis datos" permanece visible) y cualquier intento de ir a otra pantalla redirige de vuelta aquí. Al guardar, el bloqueo se libera de inmediato y se pasa a Inicio.
- Existe aquí una funcionalidad real de "Solicitar mi baja de la PPAM" (distinta de la opción "Solicitar la baja" del menú, que todavía no está implementada), disponible solo cuando no hay una actualización obligatoria pendiente:
  - Se advierte primero que la acción es irreversible y que los turnos asignados quedarán liberados.
  - Es obligatorio escribir una justificación (hasta 1000 caracteres) para poder continuar.
  - Al confirmar, la solicitud queda "Pendiente de validación" a la espera del equipo administrador; la liberación real de los turnos asignados solo ocurre cuando el administrador aprueba la baja (no de inmediato, pese a lo que sugiere el aviso).
  - Al enviarse, el acceso del publicador a la aplicación queda inhabilitado de inmediato.
  - Se muestra un mensaje de agradecimiento y la sesión se cierra automáticamente.

### Consultar turnos actuales y Solicitar la baja (próximamente)

- Estas dos opciones todavía no están implementadas: ambas muestran una pantalla genérica de "próximamente" y no están enlazadas desde ningún menú visible (solo accesibles escribiendo la dirección directamente).
- "Consultar turnos actuales" promete permitir, más adelante, consultar los próximos turnos programados desde ahí.
- "Solicitar la baja" promete permitir, más adelante, solicitar la baja del programa de servicio desde ahí — aunque, como se indicó arriba, hoy esa solicitud de baja sí puede hacerse de forma real desde "Actualizar datos" (Mis datos).

### Aceptación de tratamiento de datos personales

- Al iniciar sesión, antes de cualquier otra validación (incluida la de actualización obligatoria de datos), se verifica si el publicador ya aceptó la versión vigente del texto legal de tratamiento de datos personales.
- Si el administrador no ha publicado ningún texto legal activo, no se exige nada.
- Si el publicador nunca aceptó el texto vigente, o el administrador publicó una versión nueva desde la última vez que aceptó, al iniciar sesión es enviado de inmediato a la pantalla de autorización, donde se muestra el texto completo.
- La única acción disponible es "Acepto"; no existe forma de rechazar, omitir o navegar a otra parte desde ahí, y cualquier intento de hacerlo redirige de vuelta a este aviso.
- Al aceptar, se registra la fecha de aceptación y a qué versión corresponde.
- Después de aceptar, si además tiene pendiente una actualización obligatoria de datos, es enviado a esa pantalla; de lo contrario continúa a su vista habitual.
- Esta exigencia solo aplica a sesiones con un perfil de publicador vinculado; una cuenta de solo rol administrativo/coordinador nunca se ve afectada.
