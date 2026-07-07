# ⚡ Quick Start - FACE Page Builder

## 5 Minutos para Comenzar

### 1. Iniciar el Servidor

```bash
npm run dev
```

Tu navegador abrirá `http://localhost:3000` con el Page Builder

### 2. Seleccionar Módulo

En la barra superior, elige:
- **Estándar** - Para empezar desde cero
- **Portal Académico** - Magister/Doctorado
- **Congreso/Evento** - Eventos académicos
- **Difusión Institucional** - Noticias/Comunicados

### 3. Agregar Bloques

1. Ve al panel izquierdo "Bloques"
2. Arrastra un bloque al lienzo (área central)
3. Haz clic en el bloque para seleccionarlo
4. Edita en la barra superior

### 4. Personalizar

**Edición rápida:**
- **Título:** Nombre del bloque
- **Subtítulo:** Contenido/descripción
- **Color de fondo:** Elige colores UBB
- **Color de texto:** Automáticamente legible
- **Alineación:** Izquierda/Centro/Derecha

**Estilos avanzados:**
- Tamaño de título
- Tamaño de texto
- Padding (espaciado interior)
- Border radius (esquinas redondeadas)
- Dimensiones (ancho/alto)

### 5. Guardar

**Automático:** Se guarda cada segundo
**Manual:** Ctrl+S (si es necesario)
**Versión:** Exporta el proyecto completo

### 6. Exportar

Botón "Exportar HTML" → Descarga archivo .html listo para publicar

---

## Ejemplos Rápidos

### Crear Sitio de Magister en 2 Minutos

```javascript
// En código (o UI)
1. Módulo: Portal Académico
2. Agregar bloques:
   - program_header
   - curriculum
   - text (descripción)
   - contact_info
3. Llenar datos
4. Exportar
```

### Crear Noticia en 1 Minuto

```javascript
// En código (o UI)
1. Módulo: Difusión
2. Agregar bloques:
   - hero (título)
   - news_item (noticia)
   - button (más info)
3. Completar información
4. Publicar
```

---

## Comandos Útiles

### Development
```bash
npm run dev      # Iniciar dev server
npm run build    # Build para producción
npm run preview  # Ver build localmente
```

### Validar
```bash
npm run astro    # Ejecutar comandos astro directos
```

---

## Estructura de Bloques por Módulo

### 📚 Módulo Académico
```
├─ program_header (encabezado)
├─ text (descripción)
├─ curriculum (malla)
├─ contact_info (contacto)
├─ image (fotos)
└─ button (acciones)
```

### 🎤 Módulo Congreso
```
├─ congress_event (info evento)
├─ archive_list (eventos pasados)
├─ text (detalles)
├─ image (galería)
└─ button (inscripción)
```

### 📰 Módulo Difusión
```
├─ hero (encabezado)
├─ news_item (noticia 1)
├─ news_item (noticia 2)
├─ news_item (noticia 3)
└─ archive_list (historial)
```

---

## Parámetros por Tipo de Bloque

### program_header
```javascript
title: "Nombre del Programa"
subtitle: "Descripción breve"
metadata: {
  level: "master" | "phd",
  duration: "4 semestres",
  coordinator: "Dr. Nombre",
  email: "email@ubiobio.cl"
}
```

### congress_event
```javascript
title: "Nombre Congreso"
metadata: {
  date: "15-17 Octubre 2024",
  location: "Campus Concepción",
  registrationUrl: "https://...",
  speakers: ["Dr. A", "Dra. B"]
}
```

### news_item
```javascript
title: "Título Noticia"
subtitle: "Bajada"
metadata: {
  date: "2024-04-27",
  category: "research|event|achievement",
  author: "Departamento",
  image: "https://..."
}
```

### contact_info
```javascript
title: "Contacto"
metadata: {
  phone: "+56-41-3113688",
  email: "correo@ubiobio.cl",
  address: "Concepción/Chillán",
  office: "Edificio",
  hours: "Lunes-viernes 09:00-17:00"
}
```

---

## Validaciones Automáticas

El sistema valida:

✅ **Colores:** Solo paleta UBB  
✅ **Tamaño texto:** 12px-60px  
✅ **Dimensiones:** 200x100px mínimo  
✅ **Títulos:** Máx 100 caracteres  
✅ **Metadatos:** Campos requeridos completos  
✅ **Bloque mínimos/máximos:** Por módulo  

---

## Guardar & Compartir

### Opción 1: LocalStorage (Automático)
- Se guarda cada cambio
- Disponible en tu navegador
- Persiste entre sesiones

### Opción 2: Exportar JSON
```javascript
// En código
import { exportAllProjects } from './features/page-builder/storage';
const backup = exportAllProjects();
// Guardar backup.json
```

### Opción 3: Importar JSON
```javascript
// En código
import { importAllProjects } from './features/page-builder/storage';
importAllProjects(backup);
```

---

## Colores UBB Disponibles

- 🔵 Azul: #0057b8
- 🔷 Azul oscuro: #003f7f
- 💙 Azul suave: #e8f0ff
- 🟠 Naranja: #f39200
- ⚫ Gris oscuro: #22252a
- ⚪ Gris claro: #e7e9ed
- ⬜ Blanco: #ffffff

*(Los colores se aplican automáticamente al elegir estilos)*

---

## Resolver Problemas

### "No puedo cambiar estos colores"
✅ Correcto - Colores UBB son inmutables
📌 Usa siempre la paleta oficial

### "El bloque no aparece"
✅ Verifica que tiene título
✅ Verifica dimensiones mínimas (200x100)
✅ Scroll en el lienzo

### "Validaciones dicen que falta algo"
✅ Lee el mensaje de error
✅ Completa metadatos requeridos
✅ Agrega bloques obligatorios

### "Quiero guardar en la nube"
✅ Exporta como JSON
✅ Guarda en tu sistema
✅ Importa cuando necesites

---

## API Rápida

```javascript
// Crear bloque
import { createBlock } from './features/page-builder/helpers';
const newBlock = createBlock('news_item');

// Guardar proyecto
import { saveModuleProject } from './features/page-builder/storage';
saveModuleProject('academic', 'mi-sitio', blocks, settings);

// Validar
import { validateAgainstNorms } from './data/template-rules';
const warnings = validateAgainstNorms(blocks, 'academic');

// Guardar versión
import { saveVersion } from './features/page-builder/storage';
saveVersion('academic', 'mi-sitio', blocks, settings, 'v1');
```

---

## Próximos Pasos

1. ✅ **Crea tu primer sitio**
2. ✅ **Guarda un proyecto**
3. ✅ **Exporta a HTML**
4. ✅ **Comparte el archivo**
5. ✅ **Lee GUIA_IMPLEMENTACION.md** para más

---

**¡Listo! Ya estás usando FACE Page Builder.** 🎉

*Para ayuda, revisa:*
- 📖 GUIA_IMPLEMENTACION.md - Guía completa
- 📚 src/features/page-builder/README.md - Documentación técnica
- 💬 Email: desarrollo@ubiobio.cl
