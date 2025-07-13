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

Esta aplicación ayuda al usuario a transformar la gestión de sus tareas semanales en un proceso estructurado, consciente y adaptable. Lo logra al abordar problemas comunes de la planificación, como la carga mental, la falta de foco y la rigidez de otras herramientas.

A continuación se detalla cómo y por qué ayuda en cada aspecto:

### Reduce la Carga Mental y el Estrés

* **Cómo**: La aplicación ofrece una estructura visual clara para cada día de la semana, comenzando siempre por el día actual. Además, cuenta con una sección específica para "Tareas Sin Asignar".
* **Porqué**: Al externalizar las tareas en un sistema fiable, el usuario libera su mente de la necesidad de recordarlo todo. La vista anclada en el "hoy" elimina la fricción de tener que buscar el día correcto, mientras que el contenedor de "Sin Asignar" funciona como un buzón de entrada para capturar ideas al instante sin la presión de tener que agendarlas, reduciendo la ansiedad de olvidar algo importante.

### Aumenta el Foco y la Productividad

* **Cómo**: Cada día se divide en dos sub-espacios: "Prioritarias" y "Todo lo demás". El día actual muestra un contador de horas restantes que cambia de color.
* **Porqué**: Esta división obliga al usuario a realizar una priorización activa y consciente, dirigiendo su energía primero a las tareas de mayor impacto. El contador de tiempo actúa como un "coach" de ritmo:
    * **Verde**: Indica que hay tiempo suficiente para trabajar de manera sostenida.
    * **Naranja**: Es una señal para empezar a cerrar temas y enfocarse en lo crucial.
    * **Rojo**: Aconseja desacelerar para evitar el agotamiento al final del día o empezar con calma al inicio.
    Esto ayuda al usuario a gestionar su energía, no solo su tiempo.

### Fomenta la Flexibilidad y la Adaptación

* **Cómo**: La funcionalidad principal para mover tareas es arrastrar y soltar (drag-and-drop), implementada con SortableJS. Adicionalmente, cada tarea tiene una opción "Mover" en su menú.
* **Porqué**: Los planes rara vez son estáticos. La capacidad de reorganizar tareas de forma fluida y visual permite que el planificador se adapte a la realidad cambiante del usuario. Si un día se complica, las tareas pueden moverse a otro día, a la sección "Sin Asignar" o su prioridad puede cambiar sin esfuerzo, haciendo de la replanificación un proceso rápido en lugar de una tarea tediosa.

### Empodera al Usuario dándole Control y Autonomía

* **Cómo**: La aplicación guarda todos los datos en el `localStorage` del navegador del usuario. También incluye funciones para "Exportar Datos" e "Importar Datos" en formato JSON.
* **Porqué**: Esto le da al usuario la certeza de que su información es privada y está bajo su control, no en una nube de terceros. La persistencia automática significa que su trabajo nunca se pierde. La capacidad de exportar sus datos le otorga verdadera propiedad sobre su planificación, permitiéndole crear copias de seguridad o migrar su información libremente, eliminando la dependencia de la plataforma.

En conclusión, el Planificador Semanal Interactivo es más que una simple herramienta de organización; es un sistema de productividad diseñado para transformar la manera en que el usuario interactúa con su tiempo y sus responsabilidades.

Su verdadero valor no reside únicamente en la capacidad de listar tareas, sino en cómo su diseño guía activamente al usuario hacia una mayor conciencia y efectividad. Lo logra al:

* **Anclar al usuario en el presente**: La vista semanal siempre comienza en el día actual, eliminando distracciones y centrando la atención en lo que se puede hacer ahora.
* **Fomentar la priorización activa**: Al separar visualmente las tareas "Prioritarias" del "resto", obliga al usuario a tomar decisiones deliberadas sobre lo que realmente importa cada día.
* **Gestionar la energía, no solo las tareas**: El contador de tiempo con código de colores es una característica única que actúa como un coach, sugiriendo cuándo es momento de trabajar con intensidad, cuándo priorizar y cuándo es mejor descansar para evitar el agotamiento.
* **Ofrecer flexibilidad y control total**: Con la funcionalidad de arrastrar y soltar, menús contextuales y la gestión de tareas sin asignar, la aplicación se adapta al flujo de trabajo del usuario. La autonomía sobre los datos, garantizada por el almacenamiento local y las funciones de importación/exportación, genera confianza y empodera al usuario.

A diferencia de otras herramientas que pueden ser demasiado rígidas o excesivamente complejas, este planificador encuentra un equilibrio al ofrecer una estructura robusta pero flexible. No solo ayuda a organizar el trabajo, sino que enseña una forma más intencionada y sostenible de abordarlo. Es una herramienta que se adapta al usuario, no una que le obliga a adaptarse a ella.
