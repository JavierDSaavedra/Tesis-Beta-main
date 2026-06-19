# Guía de Implementación - Generador de Sitios FACE

## Visión General

Este proyecto implementa un **Generador de Sitios Modulares** para la Facultad de Ciencias Empresariales (FACE) de la Universidad del Bío-Bío, basado en:

- **Frontend:** Astro + React para componentes interactivos
- **Constructor:** Page Builder visual (no-code)
- **Rendimiento:** Generación estática (Static Site Generation)
- **Seguridad:** Sin base de datos en frontend
- **Estándares:** Branding institucional UBB

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────┐
│          Capa de Usuario (No-Code)                      │
│  Page Builder UI (React) - Interfaz visual              │
└────────────────┬────────────────────────────────────────┘
                 │
        ┌────────▼────────┐
        │  Módulos FACE   │
        │  ┌────────────┐ │
        │  │ Académico  │ │
        │  ├────────────┤ │
        │  │ Congreso   │ │
        │  ├────────────┤ │
        │  │ Difusión   │ │
        │  └────────────┘ │
        └────────┬────────┘
                 │
    ┌────────────▼──────────────┐
    │  Validación Institucional │
    │  - Colores UBB            │
    │  - Tipografía             │
    │  - Dimensiones            │
    │  - Metadatos requeridos   │
    └────────────┬──────────────┘
                 │
        ┌────────▼────────┐
        │ Almacenamiento  │
        │ localStorage/   │
        │ Versioning      │
        └────────┬────────┘
                 │
    ┌────────────▼──────────────┐
    │  Generación HTML Estático │
    │  (Astro SSG)              │
    │  - Sin JavaScript backend │
    │  - Seguro                 │
    │  - Rápido                 │
    └────────────┬──────────────┘
                 │
         ┌───────▼────────┐
         │  Servidores    │
         │  UBB           │
         │  (ubiobio.cl)  │
         └────────────────┘
```

## Módulos FACE

### 1. Portal Académico (Magister/Doctorado)

**Propósito:** Sitios para programas de postgrado

**Bloques Incluidos:**
- `program_header` - Encabezado y datos del programa
- `curriculum` - Malla curricular
- `text` - Descripción del programa
- `contact_info` - Información de contacto
- `image` - Fotografías
- `button` - Botones de acción
- `hero` - Sección destacada

**Ejemplo de Uso:**
```javascript
import { createModulePage } from './features/page-builder/helpers';
import { saveModuleProject } from './features/page-builder/storage';

// Crear página académica
const magisterPage = createModulePage('academic');

// Personalizar
magisterPage.blocks[0].title = 'Magister en Administración';
magisterPage.blocks[0].metadata.level = 'master';

// Guardar
saveModuleProject(
  'academic',
  'mag-admin-2024',
  magisterPage.blocks,
  magisterPage.settings
);
```

### 2. Congreso/Evento

**Propósito:** Sitios para congresos, seminarios y eventos con registro histórico

**Bloques Incluidos:**
- `congress_event` - Información del evento
- `archive_list` - Congresos/eventos anteriores
- `hero` - Sección destacada
- `text` - Información adicional
- `image` - Imágenes del evento
- `button` - Botones (inscripción, programa)

**Ejemplo:**
```javascript
const congressPage = createModulePage('congress');

// Agregar información del congreso
const eventBlock = congressPage.blocks[0];
eventBlock.metadata.date = '15-17 Octubre 2024';
eventBlock.metadata.location = 'Campus Concepción';
eventBlock.metadata.registrationUrl = '/registro';

saveModuleProject('congress', 'congreso-2024', 
  congressPage.blocks, congressPage.settings);
```

### 3. Difusión Institucional

**Propósito:** Noticias, comunicados y difusión departamental

**Bloques Incluidos:**
- `hero` - Encabezado principal
- `news_item` - Artículos y noticias
- `text` - Texto adicional
- `image` - Imágenes destacadas
- `button` - Botones de acción
- `archive_list` - Noticias anteriores

**Ejemplo:**
```javascript
const newsPage = createModulePage('diffusion');

// Agregar noticia
const newsBlock = {
  type: 'news_item',
  title: 'Nueva iniciativa de investigación',
  metadata: {
    date: new Date().toISOString(),
    category: 'research',
    author: 'FACE',
    image: 'https://...'
  }
};

newsPage.blocks.push(newsBlock);
saveModuleProject('diffusion', 'noticias-2024', 
  newsPage.blocks, newsPage.settings);
```

## Flujo de Trabajo

### 1. Crear un Nuevo Sitio

**Opción A: Desde UI (Recomendado)**
1. Abrir Page Builder
2. Seleccionar módulo deseado en dropdown
3. Hacer clic en "Nuevo Proyecto"
4. Seleccionar plantilla o comenzar en blanco
5. Personalizar bloques

**Opción B: Programáticamente**
```javascript
import { createModulePage } from './features/page-builder/helpers';

const page = createModulePage('academic');
// Personalizar...
```

### 2. Diseñar la Página

1. Arrastra bloques al lienzo desde el panel izquierdo
2. Haz clic en un bloque para seleccionarlo
3. Edita propiedades en la barra de edición
4. Asegúrate de que los colores sean de la paleta UBB
5. Verifica las validaciones en el panel superior

### 3. Agregar Contenido

Cada bloque debe contener:

**Título:** Nombre/encabezado (máx. 100 caracteres)
**Subtítulo:** Descripción o contenido principal (máx. 500 caracteres)  
**Estilos:** Colores, dimensiones, alineación (siempre de paleta aprobada)
**Metadatos:** Información específica del tipo de bloque

### 4. Validar

El sistema valida automáticamente:
- ✅ Cantidad de bloques (por módulo)
- ✅ Tipos de bloques requeridos
- ✅ Colores dentro de paleta
- ✅ Dimensiones permitidas
- ✅ Metadatos requeridos

Ver warnings en el panel superior.

### 5. Guardar

**Guardado Automático:**
- Cada cambio se guarda en localStorage
- Se mantiene historial de versiones

**Guardado Manual:**
```javascript
import { saveModuleProject, saveVersion } from 
  './features/page-builder/storage';

// Guardar como proyecto
saveModuleProject('academic', 'proyecto-final', blocks, settings);

// Guardar versión con nota
saveVersion('academic', 'proyecto-final', blocks, settings,
  'Versión final aprobada por RR.PP.');
```

### 6. Exportar

**Como HTML Estático:**
1. Haz clic en "Exportar HTML"
2. Se descarga archivo .html
3. Listo para publicar

**Para Integración con Astro:**
```javascript
// En página o componente Astro
import { loadModuleProject } from '../../features/page-builder/storage';

export const prerender = true;

const Academic Profile = async () => {
  const site = loadModuleProject('academic', 'magister-2024');
  return site;
};
```

## Validación Institucional

### Sistema de Validación

El Page Builder valida automáticamente:

#### 1. Por Módulo

```javascript
academic: {
  minBlocks: 4,
  maxBlocks: 10,
  requiredTypes: ['program_header', 'text', 'contact_info'],
}

congress: {
  minBlocks: 2,
  maxBlocks: 8,
  requiredTypes: ['congress_event'],
}

diffusion: {
  minBlocks: 2,
  maxBlocks: 12,
  requiredTypes: ['hero', 'news_item'],
}
```

#### 2. Por Bloque

Cada bloque valida:
- Título requerido (máx. 100 caracteres)
- Color debe estar en paleta aprobada
- Dimensiones dentro de límites
- Padding en rango permitido
- Metadatos completod (según tipo)

#### 3. De Contenido

- Email válido en contact_info
- URL válida en buttons
- Fechas en formato correcto
- Imágenes accesibles

### Ejecutar Validación Programática

```javascript
import { validateAgainstNorms, validateBlock } from 
  './data/template-rules';

// Validar página completa
const warnings = validateAgainstNorms(blocks, 'academic');

if (warnings.length > 0) {
  warnings.forEach(w => {
    if (w.type === 'error') {
      console.error('❌', w.message);
    } else {
      console.warn('⚠️', w.message);
    }
  });
}

// Validar un solo bloque
const blockWarning = validateBlock(block, 'academic');
```

## Gestión de Proyectos

### Almacenamiento Local

Los proyectos se guardan en localStorage con estructura:

```javascript
{
  'face-blocks-v1': [...],           // Proyecto actual
  'face-settings-v1': {...},          // Configuración actual
  'face-modules-v1': {                // Proyectos por módulo
    academic: {
      'magister-2024': {...},
      'doctorado-2024': {...}
    },
    congress: {...},
    diffusion: {...}
  },
  'face-drafts-v1': {...},            // Borradores
  'face-module-versions-v1:...': [...] // Historial de versiones
}
```

### Operaciones de Proyecto

```javascript
import {
  saveModuleProject,
  loadModuleProject,
  listModuleProjects,
  deleteModuleProject,
  saveDraft,
  loadAllDrafts,
  saveVersion,
  loadVersionHistory,
  restoreVersion,
  exportAllProjects,
  importAllProjects
} from './features/page-builder/storage';

// Listar proyectos de un módulo
const academicProjects = listModuleProjects('academic');
console.log('Proyectos académicos:', academicProjects);

// Cargar un proyecto
const site = loadModuleProject('academic', 'magister-2024');

// Hacer un borrador
saveDraft('mi-borrador', blocks, settings);

// Guardar versión
saveVersion('academic', 'magister-2024', blocks, settings,
  'Actualización: reducción de créditos');

// Ver versiones
const versions = loadVersionHistory('academic', 'magister-2024');
console.log('Versiones disponibles:', versions.length);

// Restaurar versión anterior
const oldVersion = restoreVersion('academic', 'magister-2024', 2);

// Backup completo
const backup = exportAllProjects();
localStorage.setItem('backup-2024.json', JSON.stringify(backup));

// Restaurar desde backup
const restored = JSON.parse(localStorage.getItem('backup-2024.json'));
importAllProjects(restored);
```

##Branding Institucional

### Colores UBB

Paleta restrictiva aprobada por RR.PP.:

```javascript
UBB_BRANDING.colors = {
  primary: '#0057b8',         // Azul principal UBB
  primaryDark: '#003f7f',     // Azul oscuro
  primarySoft: '#e8f0ff',     // Azul suave (fondos)
  secondary: '#f39200',       // Naranja (acentos)
  neutral: '#22252a',         // Gris oscuro (texto)
  light: '#e7e9ed',           // Gris claro
  white: '#ffffff',           // Blanco
  accent: '#d4dde9',          // Acento gris
}
```

**Los usuarios NO pueden:**
- Usar colores personalizados
- Cambiar colores de branding
- Usar colores fuera de paleta

### Tipografía

**Font Family:** 'Space Grotesk', 'Segoe UI', sans-serif

**Tamaños Permitidos:**
- Títulos: 18px - 60px
- Cuerpo: 12px - 24px

**Los usuarios NO pueden:**
- Cambiar la familia de fuentes
- Usar tamaños fuera de rango

### Restricciones Visuales

```javascript
INSTITUTIONAL_STANDARDS = {
  borderRadiusRange: { min: 0, max: 20 },
  paddingRange: { min: 8, max: 48 },
  minBlockDimensions: { width: 200, height: 100 },
  maxBlockDimensions: { width: 1200, height: 800 },
  maxTitleLength: 100,
  maxSubtitleLength: 500,
}
```

## Seguridad

### Principios de Diseño

1. **Sin Base de Datos en Frontend**
   - Todo es generación estática
   - JavaScript mínimo
   - No hay ejecución de código dinámico

2. **Validación Completa**
   - Input validation en todos los campos
   - Whitelist de colores permitidos
   - Bloques pre-aprobados

3. **Sanitización**
   - Escaping de caracteres especiales
   - Validación de URLs
   - Validación de emails

4. **Dominios Externos Permitidos**
   ```javascript
   SECURITY_GUIDELINES.approvedExternalDomains = [
     'cdn.jsdelivr.net',      // CDN segura
     'fonts.googleapis.com',   // Google Fonts
     'fonts.gstatic.com',     // Google Fonts estáticos
   ]
   ```

### Verificación de Seguridad

Ejecutar antes de despliegue:

```javascript
import { SECURITY_GUIDELINES } from './data/template-rules';

// Verificar que no hay acceso a base de datos
console.assert(SECURITY_GUIDELINES.staticGenerationOnly,
  'El sitio debe ser estático');

// Verificar SSL requerido
console.assert(SECURITY_GUIDELINES.requireSSL,
  'SSL es obligatorio');

// Verificar CSP activo
console.assert(SECURITY_GUIDELINES.cspStrict,
  'CSP debe ser estricto');
```

## Despliegue

### 1. Build

```bash
npm run build
```

Genera `/dist/` con todos los sitios estáticos.

### 2. Exportar Proyectos

```javascript
import { exportAllProjects } from './features/page-builder/storage';

const backup = exportAllProjects();
const json = JSON.stringify(backup, null, 2);

// Guardar en archivo
fs.writeFileSync('proyectos-face.json', json);
```

### 3. Publicar en Servidores UBB

```bash
# En servidor ubiobio.cl
scp -r dist/* usuario@servidor:/var/www/face/

# Configurar DNS
# face.ubiobio.cl -> 192.168.x.x (Concepción)
# face-chillan.ubiobio.cl -> 192.168.x.x (Chillán)
```

### 4. Verificar

```bash
# Verificar sitio está accesible
curl https://face.ubiobio.cl

# Verificar sin JavaScript
curl -H "User-Agent: curl" https://face.ubiobio.cl
# Debe retornar HTML estático funcional
```

## Ejemplos Prácticos

### Ejemplo 1: Crear Portal de Magister

```javascript
import { createModulePage } from './features/page-builder/helpers';
import { saveModuleProject } from './features/page-builder/storage';

// 1. Crear desde plantilla
const magister = createModulePage('academic');

// 2. Personalizar
magister.blocks[0].title = 'Magister en Administración de Empresas';
magister.blocks[0].metadata = {
  level: 'master',
  duration: '4 semestres',
  coordinator: 'Dr. Juan Pérez',
  email: 'magister@ubiobio.cl'
};

// 3. Agregar contenido
magister.blocks[2].subtitle = 
  'Forma líderes empresariales con visión global...';

// 4. Validar
import { validateAgainstNorms } from './data/template-rules';
const warnings = validateAgainstNorms(magister.blocks, 'academic');
console.log('Validaciones:', warnings);

// 5. Guardar
saveModuleProject('academic', 'mag-admin-2024', 
  magister.blocks, magister.settings);
```

### Ejemplo 2: Gestionar Congreso

```javascript
// Crear sitio de congreso
const congreso = createModulePage('congress');

// Actualizar información
congreso.blocks[0].title = 'II Congreso de Investigación FACE 2024';
congreso.blocks[0].metadata = {
  date: '15-17 octubre 2024',
  location: 'Campus Concepción',
  registrationUrl: 'https://registros.ubiobio.cl/congreso',
  speakers: ['Dr. A', 'Dra. B', 'Prof. C']
};

// Agregar noticias/llamadas
// ... agregar bloques de texto, imagen, etc

// Guardar
saveModuleProject('congress', 'congreso-2024', 
  congreso.blocks, congreso.settings);

// Crear versión para evaluación
import { saveVersion } from './features/page-builder/storage';
saveVersion('congress', 'congreso-2024', 
  congreso.blocks, congreso.settings,
  'Enviado para revisión de RR.PP.');
```

### Ejemplo 3: Gestionar Versiones

```javascript
import {
  saveVersion,
  loadVersionHistory,
  restoreVersion
} from './features/page-builder/storage';

// Guardar cambios como nueva versión
saveVersion('academic', 'magister-admin',  blocks, settings,
  'Agregada nueva asignatura: Business Analytics');

// Ver historial
const versions = loadVersionHistory('academic', 'magister-admin');
versions.forEach((v, i) => {
  console.log(`v${v.version} (${v.createdAt}): ${v.note}`);
});

// Volver a versión anterior (ej: v2)
const prevVersion = restoreVersion('academic', 'magister-admin', 2);
console.log('Restaurado:', prevVersion.note);

// Guardar eso como nueva versión
saveVersion('academic', 'magister-admin', 
  prevVersion.blocks, prevVersion.pageSettings,
  'Revertido a versión anterior');
```

## Troubleshooting

### Problema: Validaciones constantemente fallando

**Solución:**
1. Verificar que módulo seleccionado es el correcto
2. Revisar tipos de bloques requeridos
3. Asegurar que se tienen mínimo bloques requeridos
4. Validar que metadatos estén completos

```javascript
// Verificar qué falta
const warnings = validateAgainstNorms(blocks, 'academic');
warnings.forEach(w => console.log(w));
```

### Problema: Color está fuera de paleta

**Solución:**
1. Seleccionar color del picker (mostrará solo colores aprobados)
2. O usar colores UBB directamente:
   - Azul: #0057b8
   - Naranja: #f39200
   - Gris: #e7e9ed

### Problema: Proyecto no guarda

**Solución:**
1. Verificar que localStorage no está lleno
2. Verificar que navegador permite localStorage
3. Probar en navegador diferente

```javascript
// Limpiar localStorage si es necesario
import { clearAllData } from './features/page-builder/storage';
clearAllData();
```

### Problema: Bloque se ve mal en vista previa

**Solución:**
1. Verificar dimensiones mínimas (200x100px)
2. Verificar padding > 0
3. Asegurar que hay suficiente espacio en canvas
4. Recalcular altura del canvas

```javascript
import { calculateCanvasHeight } from
  './features/page-builder/helpers';
const newHeight = calculateCanvasHeight(blocks);
```

## Recursos Adicionales

- [README del Page Builder](./src/features/page-builder/README.md)
- [Documentación de Astro](https://astro.build)
- [Guía de Branding UBB](https://www.ubiobio.cl/branding)
- [Validación WCAG](https://www.w3.org/WAI/WCAG21/quickref/)

## Soporte

Para reportar problemas o sugerencias:
- Email: desarrollo@ubiobio.cl
- Documentación: [Tu repositorio]
- Issues: [GitHub Issues]
