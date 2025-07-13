## Propósito de "Planner"

Cada función de este planificador fue diseñada con una intención específica para resolver problemas comunes de la gestión de tareas y ofrecer una experiencia de usuario superior a la de otras herramientas.

### 1. Vista Semanal Dinámica

* **El Porqué:** Las semanas no empiezan en lunes, empiezan **hoy**. Los planificadores estáticos que siempre muestran de lunes a domingo nos obligan a buscar el día actual, perdiendo tiempo y foco. Esta característica busca anclarte inmediatamente en el presente.
* **El Diseño:** En lugar de un bucle estático, la aplicación calcula el día actual y reordena dinámicamente el array de días para que "hoy" siempre sea el primer día en la vista. Los días siguientes se muestran en orden consecutivo. "Hoy" y "Mañana" reciben un borde de color distintivo (`current-day`, `next-day`) para una rápida identificación visual.
* **La Diferencia:** A diferencia de calendarios digitales (como Google Calendar) que muestran una cuadrícula infinita, o apps de tareas (como Todoist) que se centran en listas, este planificador ofrece una **vista de horizonte limitado y relevante**. Te centra en el "aquí y ahora" y en el futuro inmediato, reduciendo la sensación de agobio que producen las vistas mensuales o las listas interminables de tareas.

### 2. Contador de Tiempo y Código de Colores

* **El Porqué:** La gestión del tiempo no es solo sobre qué haces, sino sobre la energía y el ritmo que aplicas. Esta característica busca ser una guía ambiental sobre cómo deberías sentirte respecto al tiempo que te queda en el día.
* **El Diseño:** Un temporizador en el día actual cuenta regresivamente hasta la medianoche. Lo crucial es el cambio de color del texto, que no solo indica urgencia, sino que guía tu estado mental:
    * **Verde (`16-8 horas restantes`): Trabaja sin preocupación.** Hay tiempo de sobra. Es la fase de productividad sostenida.
    * **Naranja (`8-4 horas restantes`): Prioriza, tienes poco tiempo.** El día avanza. Es momento de enfocarse en lo esencial y empezar a cerrar temas.
    * **Rojo (`<4 horas o >16 horas restantes`): Descansa o haz tareas ligeras.** Este color tiene un doble propósito inteligente. Al final del día (<4h), es una señal para desacelerar y no empezar tareas grandes. Al principio del día (>16h), actúa como un recordatorio de que no debes quemarte; la jornada es larga, así que empieza con calma.
* **La Diferencia:** Ninguna aplicación de tareas estándar integra un sistema de "pacing" (marcación de ritmo) como este. Mientras otras herramientas miden fechas de entrega, este planificador gestiona tu **energía y percepción del tiempo diario**, actuando más como un coach de productividad que como un simple capataz.

### 3. Priorización (Secciones "Prioritarias" y "Todo lo demás")

* **El Porqué:** El Principio de Pareto (80/20) sugiere que no todas las tareas tienen el mismo impacto. Sin una distinción visual clara, es fácil caer en la trampa de hacer muchas tareas de bajo impacto. Esta estructura te obliga a tomar una decisión consciente sobre lo que realmente importa.
* **El Diseño:** Cada día contiene dos áreas de tareas separadas y claramente etiquetadas: `priority-tasks` y `other-tasks`. Las tareas prioritarias incluso tienen un borde de color diferente para destacarlas más. La funcionalidad de arrastrar y soltar permite elevar o degradar una tarea de forma fluida, convirtiendo la priorización en una acción física y deliberada.
* **La Diferencia:** Muchas apps de tareas usan etiquetas o listas separadas para la prioridad, lo cual es menos inmediato. La diferenciación espacial **dentro del mismo día** es más poderosa. Te enfrentas a tus prioridades cada vez que miras el día, fomentando una disciplina constante.

### 4. Sección de "Tareas Sin Asignar"

* **El Porqué:** Las ideas y tareas no siempre llegan con una fecha límite clara. Necesitamos un "buzón de entrada" o un espacio de "brain dumping" para capturar estas ideas sin la presión de tener que organizarlas inmediatamente.
* **El Diseño:** Se creó un contenedor visualmente idéntico a un día, pero dedicado a tareas sin fecha. Funciona como cualquier otro día: puedes añadir tareas y arrastrarlas desde aquí a un día específico cuando estés listo para comprometerte con ellas.
* **La Diferencia:** Esto es más flexible que una simple lista de "Bandeja de entrada". Al tratarlo como un par de los otros días, se siente como un espacio de preparación activo en lugar de un cementerio de ideas olvidadas. Es un purgatorio de tareas, esperando a ser asignadas al cielo de la productividad.

### 5. Gestión de Datos (Persistencia, Importación y Exportación)

* **El Porqué:** La confianza es fundamental. Los usuarios invierten tiempo y energía en planificar sus vidas; perder esa información es inaceptable. Además, los usuarios deben sentir que son dueños de sus datos, no que están atrapados en una plataforma.
* **El Diseño:**
    * **Persistencia:** Cada acción (crear, editar, mover, completar una tarea) dispara una función `saveToLocalStorage()`. Esto asegura que el estado actual del tablero siempre esté guardado en el navegador del usuario, sobreviviendo a recargas de página y cierres.
    * **Autonomía:** Los botones de "Exportar Datos" e "Importar Datos" permiten al usuario descargar el estado completo de su planificador en un archivo JSON y restaurarlo más tarde o en otro dispositivo.
* **La Diferencia:** Muchas herramientas online guardan los datos en la nube, lo que puede generar preocupaciones de privacidad o dependencia de la conexión a internet. Este enfoque 100% local es más rápido, privado y le da al usuario control total. La función de importación/exportación es una declaración de principios: **tus datos te pertenecen** y eres libre de llevarlos contigo.
