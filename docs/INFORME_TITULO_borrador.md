# Sistema automatizado de generación y gestión de sitios web institucionales bajo estándares de seguridad y diseño para la FACE-UBB

> Nota: este borrador rellena con datos reales extraídos del repositorio (`package.json`, `src/features/page-builder/*`, `strapi-backend/*`) todo lo que es verificable en el código. Los campos que solo tú puedes completar (nombre del profesor guía, fechas reales, capturas de pantalla, horas de esfuerzo, dedicatoria, conclusiones personales) quedan marcados con `[ ]`.

Proyecto de título para optar al título de Ingeniero de Ejecución en Computación e Informática

**Alumno:** Javier Dante Saavedra Gaete
**Profesor(a) guía:** [ Nombre del profesor(a) guía ]
[ Mes ] 2026 — Concepción, Chile

---

## Dedicatoria y/o Agradecimientos
[ Tu dedicatoria y agradecimientos ]

## Resumen

El presente informe describe el desarrollo de un sistema automatizado de generación y gestión de sitios web institucionales para la Facultad de Ciencias Empresariales (FACE) de la Universidad del Bío-Bío. La plataforma unifica y asegura la presencia web de la facultad mediante la generación de sitios estáticos (Astro), eliminando las vulnerabilidades asociadas al uso de gestores de contenido dinámicos desactualizados, automatizando el cumplimiento de los estándares gráficos institucionales mediante un motor de validación de reglas de diseño (paleta de colores, tipografías, tamaños y metadatos obligatorios por tipo de bloque), y centralizando la administración de contenido en un backend headless (Strapi) con persistencia en MySQL. El sistema incluye un editor visual de bloques (page builder) con quince tipos de bloques institucionales (encabezados de programa, mallas curriculares, eventos de congreso, noticias, galerías desde Google Drive, entre otros) y siete plantillas prediseñadas fieles a la identidad visual de ubiobio.cl.

---

## Introducción

La introducción del presente informe tiene como objetivo presentar y contextualizar el proyecto de titulación correspondiente a la carrera de Ingeniería de Ejecución en Computación e Informática, titulado «Sistema automatizado de generación y gestión de sitios web institucionales bajo estándares de seguridad y diseño para la FACE-UBB».

La Facultad de Ciencias Empresariales de la Universidad del Bío-Bío gestiona actualmente su presencia web de forma manual y descentralizada, lo que ha derivado en un modelo fragmentado con brechas de seguridad, pérdida de identidad visual y castigo en el posicionamiento orgánico. Este proyecto propone una plataforma generadora de sitios estáticos que aborda de manera integral estas problemáticas, separando completamente el contenido (gestionado en un backend headless) de la publicación final (archivos estáticos servidos sin base de datos expuesta al público).

A lo largo del informe se describen el estudio del problema, los objetivos, la factibilidad, los requerimientos de software, el análisis funcional, el diseño de la solución y los aspectos de gestión del proyecto, así como la metodología ágil con enfoque en prototipado evolutivo utilizada durante el desarrollo.

---

## Estudio del Problema

### Contexto del problema

La Facultad de Ciencias Empresariales (FACE) de la Universidad del Bío-Bío es una unidad académica distribuida en las sedes de Concepción y Chillán. Su infraestructura digital depende de la administración central de hosts institucionales bajo el dominio `ubiobio.cl`, gestionados físicamente en diversos servidores de la universidad.

Actualmente, el proceso de despliegue web se inicia con una solicitud manual a servicios computacionales. Una vez asignado el host, cada unidad (departamentos, programas de postgrado, grupos de investigación) levanta su propio sitio utilizando mayoritariamente WordPress de forma autónoma. Los actores clave del proceso son el Administrador de Host, encargado de la estabilidad de las máquinas físicas y del cumplimiento de los hostings institucionales; la Encargada de Relaciones Públicas, responsable de definir la línea gráfica institucional; y las secretarías y académicos, encargados de la actualización de contenidos y noticias en sus respectivos sitios.

### Definiciones, siglas y abreviaciones del negocio

- **FACE:** Facultad de Ciencias Empresariales de la Universidad del Bío-Bío.
- **UBB:** Universidad del Bío-Bío.
- **RR.PP.:** Unidad de Relaciones Públicas de la facultad, responsable de la identidad visual institucional.
- **Host / Hosting:** Servicio de alojamiento donde reside físicamente un sitio web dentro de la infraestructura de la universidad.
- **Subdominio:** Sitio web dependiente del dominio principal `ubiobio.cl` (por ejemplo, un programa académico o congreso).
- **CMS:** Sistema de gestión de contenidos (Content Management System), como WordPress.
- **CMS headless:** Sistema de gestión de contenidos que expone el contenido únicamente vía API (en este proyecto, Strapi), sin renderizar páginas públicas directamente.
- **Generación estática:** Técnica que pre-renderiza los sitios web como archivos estáticos (HTML/CSS/JS), eliminando la dependencia de una base de datos en el frontend público.
- **SEO:** Optimización para motores de búsqueda (Search Engine Optimization).
- **Stack:** Conjunto de tecnologías y herramientas utilizadas para el desarrollo del software.
- **Bloque (block):** Unidad mínima de contenido editable dentro del editor visual (hero, texto, imagen, noticia, etc.), con posición, estilo y metadatos propios.
- **Plantilla maestra / prediseñada:** Conjunto predefinido de bloques y configuración de página, validado y reutilizable, que garantiza coherencia visual institucional.
- **Motor de plantillas:** En este proyecto, el editor visual de bloques (`PageBuilder`) junto al motor de validación de normas institucionales (`template-rules.js`).
- **Frontend:** Apartado visual del proyecto que se carga en el navegador del usuario (Astro + React).
- **Backend:** Apartado funcional del proyecto encargado del almacenamiento y gestión de contenido (Strapi + MySQL).

### Problemática actual

Se identifica un modelo de gestión fragmentado y reactivo que ha derivado en un caos de subdominios. Los puntos críticos detectados son los siguientes:

- **Vulnerabilidad crítica de seguridad:** el uso de WordPress desactualizado ha expuesto brechas de seguridad que permitieron la caída de servidores institucionales.
- **Obsolescencia y castigo de indexadores:** la existencia de sitios abandonados y contenido genérico provoca que Google penalice el posicionamiento de la universidad.
- **Falta de identidad visual:** no existe un estándar gráfico unificado; cada sitio opera con plantillas independientes, diluyendo la imagen editorial de la facultad.
- **Dificultad de mantenimiento:** las secretarías pueden subir contenido, pero carecen de la capacidad técnica para mejorar aspectos visuales o asegurar la continuidad operativa de los sistemas.

### Diagrama de la situación actual (proceso)
▸ Inserta aquí un diagrama de actividades (UML) que represente el proceso actual: solicitud manual del host, asignación, levantamiento autónomo del sitio en WordPress, actualización de contenidos, etc.

⬒ **INSERTAR IMAGEN:** Diagrama de actividades del proceso actual de despliegue web en la FACE
*Ilustración 1: Diagrama de actividades del proceso actual.*
[ Descripción de las actividades del diagrama ]

### Propuesta de solución

Se propone el desarrollo de un Generador de Sitios Modulares basado en un stack de Node.js (Astro + React en el frontend, Strapi + MySQL en el backend), diseñado para operar de forma desacoplada y segura. La solución se fundamenta en los siguientes pilares técnicos:

- **Arquitectura de generación estática:** a diferencia de un CMS dinámico, Astro pre-renderiza los sitios en tiempo de build, eliminando la base de datos del lado público y reduciendo la superficie de ataque ante inyecciones o vulnerabilidades de ejecución. El contenido se administra en un backend headless (Strapi) separado, cuyo acceso público a la API se restringe explícitamente por rol y por endpoint.
- **Motor de plantillas y validación institucional:** implementación de un editor visual de bloques (`PageBuilder.jsx`) con 15 tipos de bloques predefinidos y un motor de reglas (`template-rules.js`) que valida automáticamente cada bloque contra la paleta de colores, tipografías, tamaños y campos obligatorios aprobados por RR.PP., antes de permitir su publicación.
- **Mantenibilidad evolutiva:** el software se diseña bajo un enfoque de código abierto interno, permitiendo que su evolución y soporte técnico sean integrados en el currículum de prácticas profesionales de la carrera.
- **Gestión de activos académicos:** módulos específicos (`archive_list`, `congress_event`, `curriculum`) para la preservación de información histórica (mallas curriculares, congresos, registros) que aseguran la trazabilidad del contenido académico sin comprometer la seguridad del servidor.

**Módulos implementados (verificados en el repositorio):**

1. **Editor visual de páginas (`PageBuilder.jsx`)** — Interfaz de lienzo (canvas) donde el usuario arrastra, posiciona y edita bloques de contenido, con panel de propiedades, previsualización en vivo y guardado hacia el backend Strapi (`/api/pages`, `/api/templates`).
2. **Catálogo de bloques institucionales (`constants.js`)** — 15 tipos de bloque: `hero`, `text`, `image`, `button`, `program_header`, `curriculum`, `congress_event`, `news_item`, `contact_info`, `archive_list`, `navbar`, `news_grid`, `footer`, `rich_article`, `drive_carousel`.
3. **Plantillas prediseñadas (`prebuiltTemplates` y `moduleTemplates`)** — 7 plantillas fieles a la identidad visual de ubiobio.cl (landing institucional, evento simple, portal institucional, artículo de noticia, portada de noticias, galería de prensa multimedia, artículo destacado con cita), más 3 plantillas por módulo (académico, congreso, difusión).
4. **Motor de validación de estándares institucionales (`template-rules.js`)** — Define `INSTITUTIONAL_STANDARDS` (paleta de colores aprobada, fuentes aprobadas, rangos de tamaño de fuente, dimensiones y padding) y `templateNorms` por módulo (mínimo/máximo de bloques y tipos de bloque obligatorios), con funciones `validateBlock()` y `validateAgainstNorms()` que retornan advertencias y errores accionables.
5. **Guías de seguridad (`SECURITY_GUIDELINES`)** — Declaran explícitamente `requireSSL`, `staticGenerationOnly` (sin conexión dinámica a base de datos desde el frontend), `cspStrict` y una lista blanca de dominios externos permitidos (`approvedExternalDomains`).
6. **Backend de contenidos (Strapi, `strapi-backend/src/api`)** — Content types `Page` (`title`, `slug` único, `module` enum `default|academic|congress|diffusion`, `blocks` JSON, `pageSettings` JSON, relación a `Template`) y `Template` (`title`, `description`, `blocks` JSON, `pageSettings` JSON, `referenceFile` multimedia).
7. **Panel de administración con vista previa (`src/admin/app.js`)** — Extensión del panel de Strapi que agrega un panel lateral de previsualización/edición visual directa para los registros de `Page` y `Template`, enlazando al editor visual del frontend.
8. **Integración con Google Drive (`drive.js` + bloque `drive_carousel`)** — Permite construir carruseles de imágenes institucionales a partir de una carpeta compartida de Google Drive, sin necesidad de subir archivos manualmente al servidor.

### Soluciones similares disponibles

Se analizaron herramientas existentes en el mercado para la creación y gestión de sitios web, con el fin de verificar posibles soluciones que se acomoden a las necesidades de la FACE. Entre las soluciones destacadas se encuentran:

- **WordPress** y otros CMS libres de propósito general: alta flexibilidad, pero requieren mantenimiento constante de seguridad (plugins/núcleo) y no restringen que el usuario final rompa la línea editorial.
▸ Agrega aquí otros generadores de sitios estáticos o CMS que hayas evaluado (por ejemplo Next.js, Hugo, Jekyll, Gatsby, WordPress headless) indicando por qué no se ajustan del todo a la necesidad institucional.

A diferencia de estas herramientas genéricas, el presente proyecto prioriza la integridad de la imagen institucional (mediante el motor de validación de normas) y la seguridad del servidor (mediante generación estática y separación estricta frontend/backend), a costa de una menor flexibilidad de diseño libre — un trade-off deliberado dado el contexto institucional.

### Justificación del proyecto

El modelo actual de gestión manual y descentralizada de sitios web en la FACE presenta deficiencias críticas en seguridad y visibilidad institucional. Los principales beneficios de la resolución del problema son:

- **Minimizar riesgos de ciberseguridad:** la transición de CMS dinámicos (WordPress) a un generador de sitios estáticos elimina vulnerabilidades de ejecución en el servidor público, evitando caídas por ataques externos.
- **Optimización del posicionamiento orgánico (SEO):** la eliminación de contenido residual y la mejora en los tiempos de carga (sitios pre-renderizados) detendrán el castigo de los indexadores de Google, recuperando la relevancia de la facultad en los resultados de búsqueda.
- **Continuidad y visibilidad académica:** el sistema garantiza que la información de congresos y registros históricos permanezca accesible y profesional, sin importar el paso del tiempo.

---

## Proyecto

### Objetivo general del proyecto

Desarrollar una plataforma de generación de software que unifique y asegure la presencia web de la FACE, automatizando el cumplimiento de estándares gráficos y eliminando vulnerabilidades tecnológicas mediante un stack moderno y mantenible.

### Objetivos específicos del proyecto

1. Diagnosticar la situación actual y las vulnerabilidades de los subdominios de la FACE para identificar brechas de seguridad y niveles de obsolescencia tecnológica.
2. Establecer los estándares gráficos y requerimientos de hosting junto a RR.PP. e Informática para garantizar una identidad visual y técnica unificada.
3. Diseñar una arquitectura de software basada en generación estática (Node.js) que minimice la superficie de ataque y mejore la velocidad de respuesta.
4. Construir la plataforma generadora y sus módulos de plantillas para la automatización de sitios de programas académicos y difusión institucional.
5. Evaluar el desempeño y la sostenibilidad del sistema integral mediante un plan piloto real, midiendo la eficiencia del mantenimiento y la seguridad de la infraestructura.

### Metodología de desarrollo

Se ha seleccionado la metodología ágil con enfoque en prototipado evolutivo. Este enfoque es fundamental debido a la alta dependencia de la validación visual y editorial por parte de la unidad de Relaciones Públicas. El desarrollo incremental permite:

- **Validación técnica:** asegurar la compatibilidad con los servidores administrados en Chillán en etapas tempranas.
- **Validación de usabilidad:** refinar las interfaces de carga de contenido con el personal administrativo antes del despliegue final.
- **Reducción de incertidumbre:** mitigar riesgos de seguridad mediante ciclos cortos de pruebas de estrés en cada módulo desarrollado.

▸ Si dispones de un diagrama de la metodología (ciclos de prototipado evolutivo), insértalo aquí.

⬒ **INSERTAR IMAGEN:** Diagrama de la metodología (prototipado evolutivo)
*Ilustración 2: Modelo de desarrollo utilizado.*

### Técnicas y notaciones

- Diagramas de Casos de Uso (UML): se utilizan para detallar la funcionalidad del software a desarrollar.
- Diagrama de actividades (UML 2.0): se utiliza para detallar el flujo de eventos del proceso de generación y gestión de sitios.
▸ Añade cualquier otra notación que uses (diagrama de componentes, de despliegue, modelo entidad-relación, etc.).

### Estándares de documentación

- Adaptación basada en IEEE Software Requirements Specifications Std 830-1998.
- Adaptación basada en IEEE Software Test Documentation Std 829-1998.
- Estilo IEEE para las referencias bibliográficas.

### Herramientas, framework y lenguajes usados en el desarrollo

*(versiones extraídas directamente de `package.json` y `strapi-backend/package.json` del repositorio)*

| Herramienta / dependencia | Rol en el proyecto | Versión |
|---|---|---|
| Node.js | Entorno de ejecución JavaScript, base del stack | `>=22.12.0` (frontend) / `>=20.0.0 <=24.x.x` (backend) |
| Astro | Framework de generación de sitios estáticos (frontend) | `^6.4.6` |
| React | Librería de componentes interactivos usada dentro de Astro (editor visual) | `^19.2.5` |
| @astrojs/react | Integración de React en Astro | `^5.0.7` |
| Strapi (`@strapi/strapi`) | CMS headless / backend de contenidos | `5.48.0` |
| MySQL (`mysql2`) | Motor de base de datos del backend | `^3.22.6` |
| better-sqlite3 | Driver de base de datos local (desarrollo) | `12.8.0` |
| @strapi/plugin-users-permissions | Control de acceso por rol en la API de Strapi | `5.48.0` |
| Apache HTTP Server | Servidor web / proxy inverso en producción | `2.4.67` (Debian) |
| PM2 | Gestor de procesos Node.js en producción | [ versión instalada ] |
| concurrently | Ejecución simultánea de frontend y backend en desarrollo | `^10.0.3` |
| Docker / Docker Compose | Empaquetado y despliegue containerizado (entorno alternativo) | [ ver `Dockerfile` / `docker-compose.yml` ] |
| Visual Studio Code | Editor de código utilizado para el desarrollo | [ versión ] |
| [ Herramienta de diseño de mockups — p. ej. Figma ] | Diseño de interfaces de alta fidelidad | [ ] |

---

## Factibilidad

### Factibilidad técnica

Se realizó un estudio de factibilidad técnica para verificar que las tecnologías seleccionadas son capaces de cumplir con el propósito previsto. El stack moderno basado en Node.js (Astro + Strapi) permite un sistema liviano, seguro y altamente desacoplado, cuya arquitectura de generación estática reduce la superficie de ataque y facilita la escalabilidad del proyecto a futuro. Se consideró además la compatibilidad con los servidores físicos administrados por la Dirección de Informática en las sedes de Concepción y Chillán, incluyendo entornos restringidos (contenedores sin Docker disponible), para lo cual se validó un procedimiento de despliegue alternativo vía Node.js + PM2 + Apache como proxy inverso. Por lo tanto, el proyecto es técnicamente factible.

### Factibilidad operativa

En relación con la factibilidad operativa, se estudió el aporte del sistema a la FACE y a sus usuarios para desarrollar sus tareas de forma más segura, eficiente y estandarizada. Las interfaces de carga de contenido (editor visual de bloques) serán amigables con el personal administrativo, permitiendo que las secretarías y académicos actualicen la información sin requerir conocimientos técnicos avanzados, mientras el motor de validación de normas garantiza automáticamente el cumplimiento de la identidad visual institucional. Gracias a esto, se concluye que el proyecto es operativamente factible.

### Factibilidad económica

La infraestructura de servidores institucionales ya se encuentra disponible dentro de la universidad, por lo que no se requieren costos adicionales de hosting externo. El desarrollo del proyecto, al ser realizado en el marco de la actividad de titulación, representa un ahorro significativo. Adicionalmente, el enfoque de código abierto interno permite que el mantenimiento futuro sea asumido por alumnos en práctica, sin costos de licencias. Por esto se considera que el proyecto es económicamente factible.

### Conclusión de la factibilidad

Gracias al análisis realizado en los puntos anteriores, se concluye que el proyecto es completamente viable para ser desarrollado, asegurando una mejora en la seguridad, la identidad visual y el posicionamiento de la presencia web de la FACE, junto con la mantenibilidad y escalabilidad del sistema a futuro.

---

## Requerimientos de Software

### Límites

- El sistema no reemplaza la administración física de los servidores institucionales, la cual sigue a cargo de la Dirección de Informática.
- El sistema genera sitios estáticos; no provee funcionalidades dinámicas dependientes de base de datos en el frontend público.
- La configuración de red y DNS de los hosts se realiza según los protocolos institucionales y no forma parte automatizada del sistema.
- El sistema no automatiza el reenvío de puertos ni la configuración de firewall/NAT a nivel de infraestructura; estos deben ser gestionados por la Dirección de Informática para cada host asignado.

### Restricciones técnicas

- El sistema debe ser compatible con la infraestructura de servidores administrada por la Dirección de Informática de la UBB en Concepción y Chillán.
- Los sitios generados deben cumplir obligatoriamente con el Manual de Normas Gráficas e Identidad Visual Institucional de la UBB (paleta de colores y tipografías codificadas en `INSTITUTIONAL_STANDARDS`).
- El backend debe operar con motor de base de datos MySQL en producción (compatibilidad validada) y soportar despliegue tanto en contenedores Docker como en servidores sin soporte de contenedores (Node.js nativo + PM2 + Apache).

### Objetivo general del software

El software, a través de sus funcionalidades de generación automatizada y plantillas controladas, permite a la Facultad de Ciencias Empresariales reducir los riesgos de seguridad informática, eliminar la dispersión estética y aumentar la eficiencia en el despliegue de nuevos portales académicos.

### Objetivos específicos del software

1. Automatizar la generación de sitios estáticos a partir de plantillas maestras validadas, garantizando la coherencia visual institucional.
2. Facilitar la actualización de contenidos y noticias por parte del personal administrativo sin comprometer la seguridad ni la línea editorial.
3. Validar automáticamente cada bloque de contenido contra los estándares gráficos (colores, tipografías, dimensiones) definidos por RR.PP.
4. Preservar la información académica histórica (congresos, mallas curriculares, registros) de forma accesible y profesional.

### Requerimientos Funcionales del Software

#### Módulo de generación y edición de sitios

| ID | El sistema contará con |
|---|---|
| RF_01 | La plataforma contará con un editor visual de tipo lienzo (canvas) que permite agregar, posicionar, redimensionar y eliminar bloques de contenido sobre una página. |
| RF_02 | La plataforma permitirá seleccionar una plantilla prediseñada (landing, evento, portal, artículo, portada de noticias, galería de prensa, artículo destacado) o un módulo (académico, congreso, difusión) como punto de partida de una página. |
| RF_03 | La plataforma permitirá pre-renderizar el sitio como archivos estáticos (Astro build), eliminando dependencias de base de datos en el frontend público. |
| RF_04 | La plataforma permitirá guardar y recuperar páginas y plantillas mediante la API del backend (`/api/pages`, `/api/templates`). |

*Tabla 1: Requerimientos módulo de generación de sitios.*

#### Módulo de plantillas y bloques institucionales

| ID | El sistema contará con |
|---|---|
| RF_05 | La plataforma contará con un catálogo de 15 tipos de bloque reutilizables (hero, texto, imagen, botón, encabezado de programa, malla curricular, evento de congreso, noticia, información de contacto, lista de archivo histórico, barra de navegación, mosaico de noticias, pie de página, artículo enriquecido, carrusel de imágenes desde Google Drive). |
| RF_06 | La plataforma aplicará automáticamente la paleta de colores, tipografías y logos oficiales de la UBB definidos en el estándar institucional (`UBB_BRANDING`). |
| RF_07 | La plataforma restringirá la selección de colores de fondo/texto de cada bloque a la paleta aprobada por RR.PP., rechazando valores no autorizados. |

*Tabla 2: Requerimientos módulo de plantillas.*

#### Módulo de validación de estándares institucionales

| ID | El sistema contará con |
|---|---|
| RF_08 | La plataforma validará que cada bloque tenga un título no vacío y de longitud máxima permitida. |
| RF_09 | La plataforma validará que el tamaño de fuente (títulos y cuerpo) de cada bloque se encuentre dentro de los rangos mínimo y máximo institucionales. |
| RF_10 | La plataforma validará que las dimensiones (ancho/alto) y el padding de cada bloque estén dentro de los rangos permitidos. |
| RF_11 | La plataforma validará que cada tipo de bloque cuente con los metadatos obligatorios (por ejemplo: `program_header` requiere nivel, duración, coordinador y correo; `congress_event` requiere fecha y ubicación). |
| RF_12 | La plataforma validará, por cada módulo (académico, congreso, difusión), el número mínimo y máximo de bloques permitidos y los tipos de bloque obligatorios. |

*Tabla 3: Requerimientos módulo de validación de estándares.*

#### Módulo de contenidos y activos académicos

| ID | El sistema contará con |
|---|---|
| RF_13 | La plataforma contará con un content type «Page» que almacena título, slug único, módulo, bloques de contenido y configuración de página. |
| RF_14 | La plataforma contará con un content type «Template» que almacena título, descripción, bloques, configuración de página y un archivo de referencia multimedia. |
| RF_15 | La plataforma permitirá la gestión de imágenes y archivos multimedia asociados a páginas y plantillas mediante el gestor de medios del backend. |
| RF_16 | La plataforma permitirá construir carruseles de imágenes institucionales a partir de una carpeta de Google Drive. |

*Tabla 4: Requerimientos módulo de contenidos y activos.*

#### Módulo de seguridad / administración

| ID | El sistema contará con |
|---|---|
| RF_17 | La plataforma tendrá un inicio de sesión para administradores del backend (panel de administración de Strapi). |
| RF_18 | La plataforma contará con control de acceso por rol sobre los endpoints públicos de la API (lectura pública restringida solo a los content types habilitados explícitamente). |
| RF_19 | La plataforma solo permitirá conexiones al backend bajo HTTPS/SSL en el entorno de producción institucional. |
| RF_20 | La plataforma restringirá la carga de scripts externos a un listado de dominios explícitamente aprobados (`approvedExternalDomains`). |

*Tabla 5: Requerimientos módulo de seguridad.*

### Interfaces externas de entrada

| Identificador | Nombre del ítem | Datos contenidos |
|---|---|---|
| IN_01 | Contenido de página/plantilla | título, slug, módulo, lista de bloques (tipo, título, subtítulo, estilo, metadatos), configuración de página (fondo, ancho/alto de lienzo, modo oscuro) |
| IN_02 | Configuración de bloque | tipo de bloque, posición (x, y), dimensiones (ancho, alto), color de fondo/texto, tamaño de fuente, padding, radio de borde, metadatos específicos del tipo |
| IN_03 | Login administrador | email, contraseña |
| IN_04 | Carpeta de Google Drive (carrusel) | ID de carpeta compartida, listado de imágenes |

*Tabla 6: Interfaces externas de entrada.*

### Interfaces externas de salida

| Identificador | Nombre del ítem | Datos contenidos | Medio |
|---|---|---|---|
| EX_01 | Sitio generado | HTML/CSS/JS estáticos del sitio | Navegador |
| EX_02 | Advertencias de validación | Lista de errores/advertencias por bloque (tipo, mensaje, bloque afectado) | Pantalla (editor) |
| EX_03 | Respuesta API de contenido | JSON de páginas/plantillas (`/api/pages`, `/api/templates`) | HTTP/API |

*Tabla 7: Interfaces externas de salida.*

---

## Análisis Funcional

### Actores

| Actor | Funciones en la empresa | Conocimientos técnicos | Nivel de privilegio |
|---|---|---|---|
| Administrador del sistema | Genera y despliega sitios, gestiona plantillas y usuarios del backend. | Medio/Alto | Administrador |
| Encargada de RR.PP. | Valida y define la línea gráfica institucional (paleta, tipografías, normas por módulo). | Bajo/Medio | Validador |
| Secretaría / Académico | Actualiza contenidos y noticias de su sitio mediante el editor visual. | Bajo | Editor de contenidos |
| Administrador de host | Asegura la estabilidad de los servidores físicos y el reenvío de puertos/DNS. | Alto | Externo (infraestructura) |

*Tabla 8: Tabla de actores.*

### Diagrama de casos de uso
▸ Inserta un diagrama de casos de uso por cada módulo del sistema.

⬒ **INSERTAR IMAGEN:** Diagrama de casos de uso — Módulo de generación de sitios
*Ilustración 3: Diagrama de casos de uso módulo de generación.*

⬒ **INSERTAR IMAGEN:** Diagrama de casos de uso — Módulo de contenidos
*Ilustración 4: Diagrama de casos de uso módulo de contenidos.*

### Especificación de los Casos de Uso

**CU_01: Generar/editar página**

| | |
|---|---|
| Precondiciones | El usuario administrador ha iniciado sesión en el backend. Existe al menos una plantilla o módulo disponible. |
| Actor | Software |
| 1) El usuario selecciona una plantilla o módulo de partida. | 2) El software carga los bloques y configuración de la plantilla seleccionada. |
| 3) El usuario agrega, edita o elimina bloques en el lienzo. | 4) El software valida cada bloque contra los estándares institucionales en tiempo real. |
| 5) El usuario guarda la página. | 6) El software persiste el contenido en el backend y lo deja disponible para el build estático. |
| Flujo alternativo | 4.1) Si un bloque no cumple los estándares (color no aprobado, metadatos faltantes, tamaño fuera de rango), el software muestra una advertencia y bloquea/permite el guardado según la severidad (warning vs error). |
| Postcondición | La página queda almacenada en el backend, lista para ser incluida en el próximo build estático del sitio. |

*Tabla 9: Caso de uso generar/editar página.*

▸ Duplica esta tabla para los demás casos de uso relevantes de tu sistema (ej.: CU_02 Iniciar sesión, CU_03 Validar bloque contra normas, CU_04 Publicar/build del sitio, CU_05 Gestionar plantilla, CU_06 Importar carrusel desde Drive).

### Modelo de datos

El sistema no utiliza una base de datos relacional compleja en el frontend: el contenido se estructura como documentos JSON gestionados por el backend headless (Strapi) sobre MySQL. Las dos entidades principales son:

- **Page** (`api::page.page`): representa una página publicable del sitio.
  - `title` (string, requerido)
  - `slug` (uid, generado desde `title`, requerido, único)
  - `module` (enum: `default | academic | congress | diffusion`)
  - `blocks` (JSON — arreglo de bloques con tipo, posición, estilo y metadatos)
  - `pageSettings` (JSON — configuración de lienzo: fondo, ancho, alto, modo oscuro)
  - `template` (relación many-to-one hacia `Template`)
- **Template** (`api::template.template`): representa una plantilla reutilizable.
  - `title` (string, requerido)
  - `description` (text)
  - `blocks` (JSON)
  - `pageSettings` (JSON)
  - `referenceFile` (media, archivo único de referencia)

⬒ **INSERTAR IMAGEN:** Diagrama del modelo de datos
*Ilustración 5: Modelo de datos.*

### Esquema de la base de datos

⬒ **INSERTAR IMAGEN:** Esquema de la entidad `Page` (`strapi-backend/src/api/page/content-types/page/schema.json`)
*Ilustración 6: Esquema entidad Page.*

⬒ **INSERTAR IMAGEN:** Esquema de la entidad `Template` (`strapi-backend/src/api/template/content-types/template/schema.json`)
*Ilustración 7: Esquema entidad Template.*

### Diseño de interfaz y navegación (Mockups)
▸ Inserta los mockups de alta fidelidad que diseñaste, con una breve descripción de cada uno.

⬒ **INSERTAR IMAGEN:** Mockup [ nombre de la vista ]
*Ilustración 8: Mockup [ nombre de la vista ].*

### Diseño de arquitectura

La arquitectura del proyecto se basa en la generación estática desacoplada, con tres capas claramente separadas:

1. **Backend de contenidos (Strapi + MySQL):** expone una API REST (`/api/pages`, `/api/templates`, `/admin`) protegida por rol, donde se almacena todo el contenido editable.
2. **Editor visual (Astro + React, `PageBuilder.jsx`):** consumido por administradores/editores para crear y validar contenido contra las normas institucionales antes de guardarlo en el backend.
3. **Sitio público estático (Astro build):** en tiempo de build, Astro consulta el backend y pre-renderiza cada página (`src/pages/[slug].astro`) como HTML/CSS/JS estático, servido por Apache sin exponer base de datos alguna al público.

En producción, Apache actúa como proxy inverso: sirve los archivos estáticos generados como `DocumentRoot` y reenvía únicamente las rutas `/api/`, `/admin/` y `/uploads/` hacia el proceso de Strapi (gestionado con PM2), manteniendo el backend inaccesible directamente desde fuera salvo por esas rutas explícitas.

⬒ **INSERTAR IMAGEN:** Diagrama de arquitectura del sistema
*Ilustración 9: Arquitectura del sistema.*

### Estructura del código

*(estructura real extraída del repositorio)*

| Directorio | Detalle |
|---|---|
| `src/pages/` | Rutas de Astro; `[slug].astro` renderiza cualquier página dinámica desde el backend, `index.astro` monta el editor visual. |
| `src/layouts/` | Layout base compartido (`Layout.astro`). |
| `src/features/page-builder/` | Núcleo del editor visual: `PageBuilder.jsx` (interfaz de edición), `renderers.jsx` (renderizado de cada tipo de bloque), `constants.js` (catálogo de bloques y plantillas), `template-rules.js` (motor de validación de normas institucionales), `storage.js` (persistencia local y llamadas a la API de Strapi), `drive.js` (integración con Google Drive), `helpers.js` (utilidades). |
| `strapi-backend/src/api/page/` | Content type, controlador, ruta y servicio de `Page`. |
| `strapi-backend/src/api/template/` | Content type, controlador, ruta y servicio de `Template`. |
| `strapi-backend/src/admin/` | Personalización del panel de administración (`app.js`): panel lateral de previsualización/edición para `Page` y `Template`. |
| `strapi-backend/config/` | Configuración de servidor, base de datos, middlewares y plugins de Strapi. |
| `public/` | Activos estáticos servidos directamente (favicon, etc.). |
| `Dockerfile` / `docker-compose.yml` | Empaquetado containerizado del frontend y backend. |
| `nginx.conf` | Configuración de servidor web alternativa (para despliegue vía Docker/Nginx). |

*Tabla 10: Estructura del código del proyecto.*

⬒ **INSERTAR IMAGEN:** Estructura de carpetas del proyecto (captura del repositorio)
*Ilustración 10: Estructura del código.*

---

## Plan de capacitación, implantación y puesta en marcha
▸ Describe cómo capacitarás al personal (secretarías, RR.PP., administradores), la estrategia de implantación y el periodo de puesta en marcha del plan piloto.

[ Descripción del plan de capacitación, implantación y puesta en marcha ]

| Actividad | Duración | Fecha inicio | Fecha término |
|---|---|---|---|
| Capacitación de usuarios | [ ] | [ ] | [ ] |
| Implantación del sistema | [ ] | [ ] | [ ] |
| Puesta en marcha (plan piloto) | [ ] | [ ] | [ ] |

*Tabla 11: Programación de puesta en marcha.*

### Estado del proyecto
▸ Indica en qué fase está el proyecto y qué actividades faltan por completar.

[ Estado actual y actividades pendientes — por ejemplo: núcleo del generador y motor de validación implementados; backend desplegado en servidor de transferencia FACE-UBB; pendiente habilitación de acceso externo al puerto asignado por parte de Informática; pendiente plan piloto con RR.PP. ]

---

## Conclusión del proyecto
▸ Redacta tus conclusiones al finalizar el desarrollo. Guía de puntos a cubrir:
- Conclusión respecto al objetivo general (unificar y asegurar la presencia web de la FACE).
- Conclusión respecto a cada objetivo específico (diagnóstico, estándares, arquitectura, construcción, evaluación piloto).
- Conclusión respecto a los resultados de seguridad, SEO e identidad visual obtenidos.
- Conclusión respecto al tiempo y esfuerzo dedicado, y al aprendizaje profesional.

[ Desarrolla aquí las conclusiones una vez terminado el proyecto ]

---

## Anexos de recopilación de información

La recopilación de información se realizó mediante reuniones y entrevistas con los actores clave del proceso: el Administrador de Host de la Dirección de Informática, la Encargada de Relaciones Públicas de la FACE, y las secretarías y coordinadores de programas académicos. A partir de estas instancias se levantaron los lineamientos gráficos, los parámetros de red y DNS, y las necesidades editoriales que fundamentan los requerimientos del sistema.

[ Detalla los instrumentos usados (entrevistas, auditorías de subdominios, escaneo de vulnerabilidades) y sus resultados ]

## Anexo: aspectos de gestión de proyectos

### Carta Gantt con línea base y desviaciones

Cronograma propuesto:

| Actividad | Fecha inicio | Fecha término | Duración (días) |
|---|---|---|---|
| Act 1 — Investigación de subdominios y diagnóstico de vulnerabilidades | 13-04-2026 | 24-04-2026 | 11 |
| Act 2 — Definición de lineamientos gráficos con RR.PP. | 27-04-2026 | 08-05-2026 | 12 |
| Act 3 — Evaluación técnica de capacidades de hosting | 11-05-2026 | 16-05-2026 | 5 |
| Act 4 — Definición de lineamientos gráficos con RR.PP. | 18-05-2026 | 29-05-2026 | 12 |
| Act 5 — Especificación de parámetros de red y DNS con Informática | 01-06-2026 | 05-06-2026 | 5 |
| Act 6 — Levantamiento de necesidades editoriales con usuarios | 08-06-2026 | 19-06-2026 | 12 |
| Act 7 — Modelamiento de la arquitectura de generación en Node.js | 22-06-2026 | 03-07-2026 | 11 |
| Act 8 — Diseño de prototipos UI/UX de alta fidelidad | 03-08-2026 | 14-08-2026 | 12 |
| Act 9 — Estructuración del esquema de datos modular | 17-08-2026 | 28-08-2026 | 12 |
| Act 10 — Construcción del núcleo del software generador | 31-08-2026 | 25-09-2026 | 25 |
| Act 11 — Desarrollo del motor de plantillas maestras integradas | 28-09-2026 | 16-10-2026 | 18 |
| Act 12 — Integración del módulo de noticias y archivos históricos | 19-10-2026 | 06-11-2026 | 18 |
| Act 13 — Despliegue de plan piloto en sitio institucional real | 09-11-2026 | 20-11-2026 | 11 |
| Act 14 — Ejecución de pruebas de estrés, seguridad y SEO | 23-11-2026 | 04-12-2026 | 11 |
| Act 15 — Elaboración de manuales y protocolos de mantenimiento | 07-12-2026 | 18-12-2026 | 11 |

*Tabla 12: Propuesta de programación del proyecto (línea base).*

▸ Cuando termines, agrega el cronograma REAL con las desviaciones respecto a esta línea base.

⬒ **INSERTAR IMAGEN:** Carta Gantt (Anexo A)
*Ilustración 11: Carta Gantt del proyecto.*

### Resumen de esfuerzo
▸ Registra las horas reales dedicadas a cada actividad/módulo al finalizar el proyecto.

| Actividades / fases | N° Horas |
|---|---|
| Diagnóstico e investigación | [ ] |
| Definición de estándares y requisitos | [ ] |
| Diseño de arquitectura y mockups | [ ] |
| Construcción del núcleo generador | [ ] |
| Motor de plantillas y validación de normas | [ ] |
| Módulo de noticias, archivos e integración con Google Drive | [ ] |
| Backend Strapi y despliegue en servidor institucional | [ ] |
| Pruebas, piloto y SEO | [ ] |
| Documentación e informe | [ ] |
| **TOTAL** | [ ] |

*Tabla 13: Resumen de esfuerzo.*

### Anexo: iteraciones en el desarrollo
▸ Registra la retroalimentación recibida en cada iteración/prototipo, especialmente la validación de RR.PP. y del personal administrativo.

| Funcionalidad | Fecha | Retroalimentación del usuario |
|---|---|---|
| [ Editor visual de bloques — primer prototipo ] | [ ] | [ comentario ] |
| [ Motor de validación de normas institucionales ] | [ ] | [ comentario ] |
| [ Plantillas prediseñadas (landing, noticias, congreso) ] | [ ] | [ comentario ] |

*Tabla 14: Iteraciones e incrementos del desarrollo.*

## Referencias

[1] Relaciones Públicas UBB, «Manual de Normas Gráficas e Identidad Visual Institucional», Concepción, Chile: Universidad del Bío-Bío, 2024.
[2] V. Ramírez, «Protocolos de administración de hostings institucionales y seguridad en redes universitarias», Chillán, Chile: Dirección de Informática UBB, 2025.
[3] Dirección de Informática UBB, «Solicitud de registro de dominios: procedimientos y tips», [En línea]. Disponible en: https://servicios.ubiobio.cl/index.php/tips?com_content&view=article&id=36&catid=10
[4] WordPress.com, «Plataforma de creación de sitios web y gestión de contenidos», [En línea]. Disponible en: https://wordpress.com/es/
[5] Astro, «Astro Documentation», [En línea]. Disponible en: https://docs.astro.build
[6] Strapi, «Strapi 5 Documentation», [En línea]. Disponible en: https://docs.strapi.io
[7] The Apache Software Foundation, «Apache HTTP Server Documentation», [En línea]. Disponible en: https://httpd.apache.org/docs/

▸ Agrega aquí las demás referencias en estilo IEEE que uses (React, Node.js, MySQL, artículos sobre generación estática y SEO, etc.).
