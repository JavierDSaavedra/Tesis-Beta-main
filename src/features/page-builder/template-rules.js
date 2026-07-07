import { UBB_BRANDING } from './constants';

// Re-export for convenience
export { UBB_BRANDING };

// Institutional design and security standards
export const INSTITUTIONAL_STANDARDS = {
  // Approved color palette from RR.PP.
  approvedColors: [
    UBB_BRANDING.colors.primary,
    UBB_BRANDING.colors.primaryDark,
    UBB_BRANDING.colors.primarySoft,
    UBB_BRANDING.colors.secondary,
    UBB_BRANDING.colors.neutral,
    UBB_BRANDING.colors.light,
    UBB_BRANDING.colors.white,
    UBB_BRANDING.colors.accent,
  ],
  // Approved fonts
  approvedFonts: [
    "'Space Grotesk', sans-serif",
    "'Segoe UI', sans-serif",
    'Arial, sans-serif',
    "'Helvetica Neue', sans-serif",
  ],
  // Typography constraints
  minTitleSize: 18,
  maxTitleSize: 60,
  minBodySize: 12,
  maxBodySize: 24,
  // Content constraints
  maxTitleLength: 100,
  maxSubtitleLength: 500,
  // Design system
  borderRadiusRange: { min: 0, max: 20 },
  paddingRange: { min: 8, max: 48 },
  minBlockDimensions: { width: 200, height: 100 },
  maxBlockDimensions: { width: 1200, height: 800 },
};

export const templateNorms = {
  academic: {
    minBlocks: 4,
    maxBlocks: 10,
    requiredTypes: ['program_header', 'text', 'contact_info'],
    maxTitleLength: INSTITUTIONAL_STANDARDS.maxTitleLength,
    approvedColors: INSTITUTIONAL_STANDARDS.approvedColors,
  },
  congress: {
    minBlocks: 2,
    maxBlocks: 8,
    requiredTypes: ['congress_event'],
    maxTitleLength: INSTITUTIONAL_STANDARDS.maxTitleLength,
    approvedColors: INSTITUTIONAL_STANDARDS.approvedColors,
  },
  diffusion: {
    minBlocks: 2,
    maxBlocks: 12,
    requiredTypes: ['hero', 'news_item'],
    maxTitleLength: INSTITUTIONAL_STANDARDS.maxTitleLength,
    approvedColors: INSTITUTIONAL_STANDARDS.approvedColors,
  },
  default: {
    minBlocks: 2,
    maxBlocks: 12,
    requiredTypes: ['hero'],
    maxTitleLength: 65,
    approvedColors: INSTITUTIONAL_STANDARDS.approvedColors,
  },
};

export const SECURITY_GUIDELINES = {
  // SSL/TLS required
  requireSSL: true,
  // No dynamic database connections in frontend
  staticGenerationOnly: true,
  // Content Security Policy
  cspStrict: true,
  // No external scripts without approval
  approvedExternalDomains: [
    'cdn.jsdelivr.net',
    'fonts.googleapis.com',
    'fonts.gstatic.com',
  ],
};

export const VALIDATION_RULES = {
  // Title validation
  hasValidTitle: (block) => {
    if (!block.title) return { valid: false, message: 'El título es requerido' };
    if (block.title.length > INSTITUTIONAL_STANDARDS.maxTitleLength) {
      return { valid: false, message: `El título excede ${INSTITUTIONAL_STANDARDS.maxTitleLength} caracteres` };
    }
    return { valid: true };
  },

  // Color validation against institutional standards
  hasApprovedColor: (color) => {
    const approved = INSTITUTIONAL_STANDARDS.approvedColors;
    const isApproved = approved.includes(color.toLowerCase());
    return {
      valid: isApproved,
      message: isApproved ? '' : 'Color no aprobado por RR.PP.',
    };
  },

  // Typography validation
  hasValidFontSize: (size, type = 'body') => {
    const min = type === 'title' ? INSTITUTIONAL_STANDARDS.minTitleSize : INSTITUTIONAL_STANDARDS.minBodySize;
    const max = type === 'title' ? INSTITUTIONAL_STANDARDS.maxTitleSize : INSTITUTIONAL_STANDARDS.maxBodySize;
    const valid = size >= min && size <= max;
    return {
      valid,
      message: valid ? '' : `El tamaño debe estar entre ${min}px y ${max}px`,
    };
  },

  // Block dimensions validation
  hasValidDimensions: (width, height) => {
    const { minBlockDimensions, maxBlockDimensions } = INSTITUTIONAL_STANDARDS;
    const valid = width >= minBlockDimensions.width &&
                  width <= maxBlockDimensions.width &&
                  height >= minBlockDimensions.height &&
                  height <= maxBlockDimensions.height;
    return {
      valid,
      message: valid ? '' : 'Las dimensiones del bloque están fuera de los rangos permitidos',
    };
  },

  // Responsive spacing
  hasValidPadding: (padding) => {
    const { min, max } = INSTITUTIONAL_STANDARDS.paddingRange;
    const valid = padding >= min && padding <= max;
    return {
      valid,
      message: valid ? '' : `El padding debe estar entre ${min}px y ${max}px`,
    };
  },

  // Content completeness for specific block types
  hasRequiredMetadata: (block) => {
    const requirements = {
      program_header: ['level', 'duration', 'coordinator', 'email'],
      congress_event: ['date', 'location'],
      contact_info: ['phone', 'email'],
      news_item: ['date', 'category', 'author'],
      archive_list: ['sortBy'],
    };

    if (!requirements[block.type]) return { valid: true };

    const metadata = block.metadata || {};
    const missing = requirements[block.type].filter(field => !metadata[field]);

    return {
      valid: missing.length === 0,
      message: missing.length > 0 ? `Faltan campos requeridos: ${missing.join(', ')}` : '',
    };
  },
};

export function validateBlock(block, module = 'default') {
  const errors = [];

  // Title validation
  const titleValidation = VALIDATION_RULES.hasValidTitle(block);
  if (!titleValidation.valid) errors.push(titleValidation.message);

  // Style validation
  if (block.style) {
    const colorValidation = VALIDATION_RULES.hasApprovedColor(block.style.background);
    if (!colorValidation.valid) errors.push(`Fondo: ${colorValidation.message}`);

    const fontValidation = VALIDATION_RULES.hasValidFontSize(block.style.titleSize, 'title');
    if (!fontValidation.valid) errors.push(`Tamaño título: ${fontValidation.message}`);

    const dimensionsValidation = VALIDATION_RULES.hasValidDimensions(
      block.style.width,
      block.style.height,
    );
    if (!dimensionsValidation.valid) errors.push(dimensionsValidation.message);

    const paddingValidation = VALIDATION_RULES.hasValidPadding(block.style.padding);
    if (!paddingValidation.valid) errors.push(paddingValidation.message);
  }

  // Metadata validation
  const metadataValidation = VALIDATION_RULES.hasRequiredMetadata(block);
  if (!metadataValidation.valid) errors.push(metadataValidation.message);

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateAgainstNorms(blocks, module = 'default') {
  const norms = templateNorms[module] || templateNorms.default;
  const warnings = [];

  // Block count validation
  if (blocks.length < norms.minBlocks) {
    warnings.push({
      type: 'warning',
      message: `Se recomienda un mínimo de ${norms.minBlocks} bloques`,
    });
  }

  if (blocks.length > norms.maxBlocks) {
    warnings.push({
      type: 'error',
      message: `El máximo de bloques es ${norms.maxBlocks}`,
    });
  }

  // Required types validation
  const blockTypes = blocks.map(b => b.type);
  const missingRequired = norms.requiredTypes.filter(type => !blockTypes.includes(type));
  if (missingRequired.length > 0) {
    warnings.push({
      type: 'warning',
      message: `Faltan bloques requeridos: ${missingRequired.join(', ')}`,
    });
  }

  // Individual block validation
  blocks.forEach((block, index) => {
    const blockValidation = validateBlock(block, module);
    blockValidation.errors.forEach(error => {
      warnings.push({
        type: 'error',
        blockIndex: index,
        blockId: block.id,
        message: `Bloque "${block.title}": ${error}`,
      });
    });
  });

  return warnings;
}

export const prebuiltTemplates = [
  {
    id: 'landing-ubb',
    name: 'Landing UBB',
    description: 'Inicio institucional simple',
    pageSettings: {
      pageBackground: '#eef1f5',
      canvasWidth: 980,
      canvasHeight: 980,
      darkMode: false,
    },
    blocks: [
      {
        type: 'hero',
        title: 'Facultad de Ciencias UBB',
        subtitle: 'Información oficial y canales de contacto',
        style: {
          background: UBB_BRANDING.colors.primarySoft,
          color: UBB_BRANDING.colors.primaryDark,
          align: 'center',
          padding: 24,
          radius: 14,
          x: 40,
          y: 34,
          width: 900,
          height: 230,
          titleSize: 46,
          textSize: 20,
        },
      },
      {
        type: 'text',
        title: 'Quienes somos',
        subtitle: 'Formación de excelencia en pregrado y postgrado.',
        style: {
          background: UBB_BRANDING.colors.white,
          color: UBB_BRANDING.colors.neutral,
          align: 'left',
          padding: 18,
          radius: 10,
          x: 40,
          y: 290,
          width: 560,
          height: 220,
          titleSize: 32,
          textSize: 18,
        },
      },
      {
        type: 'button',
        title: 'Ver carreras',
        subtitle: '#',
        style: {
          background: UBB_BRANDING.colors.primary,
          color: UBB_BRANDING.colors.white,
          align: 'center',
          padding: 14,
          radius: 999,
          x: 640,
          y: 330,
          width: 280,
          height: 90,
          titleSize: 20,
          textSize: 14,
        },
      },
    ],
  },
  {
    id: 'evento-simple',
    name: 'Evento Simple',
    description: 'Plantilla para anunciar actividades',
    pageSettings: {
      pageBackground: '#f6f7f9',
      canvasWidth: 920,
      canvasHeight: 1100,
      darkMode: false,
    },
    blocks: [
      {
        type: 'hero',
        title: 'Jornada de Innovación',
        subtitle: '20 de mayo - Aula Magna',
        style: {
          background: UBB_BRANDING.colors.white,
          color: UBB_BRANDING.colors.primary,
          align: 'center',
          padding: 24,
          radius: 12,
          x: 30,
          y: 30,
          width: 860,
          height: 200,
          titleSize: 42,
          textSize: 18,
        },
      },
      {
        type: 'image',
        title: 'https://picsum.photos/1000/380',
        subtitle: 'Conoce expositores y actividades',
        style: {
          background: UBB_BRANDING.colors.white,
          color: UBB_BRANDING.colors.neutral,
          align: 'center',
          padding: 14,
          radius: 12,
          x: 30,
          y: 260,
          width: 860,
          height: 420,
          titleSize: 20,
          textSize: 15,
        },
      },
      {
        type: 'text',
        title: 'Inscripción abierta',
        subtitle: 'Completa el formulario para reservar tu cupo.',
        style: {
          background: UBB_BRANDING.colors.white,
          color: UBB_BRANDING.colors.neutral,
          align: 'left',
          padding: 18,
          radius: 10,
          x: 30,
          y: 710,
          width: 860,
          height: 220,
          titleSize: 32,
          textSize: 17,
        },
      },
    ],
  },
  {
    id: 'portal-ubb',
    name: 'Portal Institucional UBB',
    description: 'Recreación de la portada principal de ubiobio.cl',
    pageSettings: {
      pageBackground: '#f1f5f9',
      canvasWidth: 980,
      canvasHeight: 1200,
      darkMode: false,
    },
    blocks: [
      {
        type: 'navbar',
        title: 'Universidad del Bío-Bío',
        subtitle: 'http://www.ubiobio.cl',
        style: {
          background: UBB_BRANDING.colors.primary,
          color: UBB_BRANDING.colors.white,
          align: 'left',
          padding: 12,
          radius: 0,
          x: 40,
          y: 20,
          width: 900,
          height: 80,
          titleSize: 22,
          textSize: 14,
        },
      },
      {
        type: 'hero',
        title: 'Admisión 2026 UBB',
        subtitle: 'Construye tu futuro con nosotros. Conoce nuestras carreras y becas.',
        style: {
          background: UBB_BRANDING.colors.primarySoft,
          color: UBB_BRANDING.colors.primaryDark,
          align: 'center',
          padding: 24,
          radius: 12,
          x: 40,
          y: 120,
          width: 900,
          height: 230,
          titleSize: 44,
          textSize: 18,
        },
      },
      {
        type: 'news_grid',
        title: 'Noticias UBB',
        subtitle: 'Actualidad Universitaria',
        metadata: {
          items: [
            {
              title: 'Académico UBB se integra a grupo de evaluación Fondecyt de ANID',
              image: 'https://picsum.photos/400/250?random=1',
              url: '#'
            },
            {
              title: 'Facultad de Ciencias Empresariales (FACE) inicia proceso de acreditación',
              image: 'https://picsum.photos/400/250?random=2',
              url: '#'
            },
            {
              title: 'Estudiantes UBB ganan primer lugar en torneo nacional de innovación',
              image: 'https://picsum.photos/400/250?random=3',
              url: '#'
            }
          ]
        },
        style: {
          background: UBB_BRANDING.colors.light,
          color: UBB_BRANDING.colors.neutral,
          align: 'left',
          padding: 20,
          radius: 12,
          x: 40,
          y: 370,
          width: 900,
          height: 380,
          titleSize: 24,
          textSize: 14,
        },
      },
      {
        type: 'footer',
        title: 'Universidad del Bío-Bío',
        subtitle: 'Todos los derechos reservados © 2026. Sedes Concepción y Chillán. Chile.',
        style: {
          background: UBB_BRANDING.colors.neutral,
          color: UBB_BRANDING.colors.white,
          align: 'left',
          padding: 24,
          radius: 0,
          x: 40,
          y: 770,
          width: 900,
          height: 160,
          titleSize: 18,
          textSize: 12,
        },
      },
    ],
  },
  {
    id: 'noticia-articulo',
    name: 'Artículo de Noticias UBB',
    description: 'Estructura fiel a una página de noticia individual de noticias.ubiobio.cl: título, autor, foto, cuerpo y barra de "Últimas Noticias"',
    pageSettings: {
      pageBackground: UBB_BRANDING.colors.neutral,
      canvasWidth: 1000,
      canvasHeight: 1220,
      darkMode: true,
    },
    blocks: [
      {
        type: 'navbar',
        title: 'Noticias UBB',
        subtitle: 'https://noticias.ubiobio.cl',
        style: {
          background: UBB_BRANDING.colors.neutral,
          color: UBB_BRANDING.colors.primarySoft,
          align: 'left',
          padding: 12,
          radius: 0,
          x: 40,
          y: 20,
          width: 920,
          height: 80,
          titleSize: 22,
          textSize: 14,
        },
      },
      {
        type: 'text',
        title: '',
        subtitle: 'Portada  /  Mesa Regional PACE Biobío se reúne con Seremi de Educación para fortalecer trabajo conjunto',
        style: {
          background: UBB_BRANDING.colors.neutral,
          color: UBB_BRANDING.colors.white,
          align: 'left',
          padding: 8,
          radius: 0,
          x: 40,
          y: 118,
          width: 920,
          height: 34,
          titleSize: 12,
          textSize: 13,
        },
      },
      {
        type: 'text',
        title: 'Mesa Regional PACE Biobío se reúne con Seremi de Educación para fortalecer trabajo conjunto',
        subtitle: 'Por Fernando Alarcón Medina • Publicado el 06 de julio del 2026',
        style: {
          background: UBB_BRANDING.colors.neutral,
          color: UBB_BRANDING.colors.primarySoft,
          align: 'left',
          padding: 8,
          radius: 0,
          x: 40,
          y: 160,
          width: 620,
          height: 130,
          titleSize: 30,
          textSize: 15,
        },
      },
      {
        type: 'image',
        title: 'https://picsum.photos/620/340?random=41',
        subtitle: 'Autoridades UBB junto a la Seremi de Educación durante la reunión de trabajo',
        style: {
          background: UBB_BRANDING.colors.neutral,
          color: UBB_BRANDING.colors.white,
          align: 'left',
          padding: 0,
          radius: 8,
          x: 40,
          y: 300,
          width: 620,
          height: 340,
          titleSize: 18,
          textSize: 13,
        },
      },
      {
        type: 'rich_article',
        title: '',
        subtitle: '',
        metadata: {
          paragraphs: [
            'La Mesa Regional PACE Biobío se reunió con la Seremi de Educación para fortalecer el trabajo conjunto en torno al Programa de Acompañamiento y Acceso Efectivo a la Educación Superior (PACE), que apoya a estudiantes de establecimientos educacionales vulnerables de la región.',
            'En el encuentro participaron representantes de las instituciones de educación superior que integran la mesa regional, quienes coordinaron las líneas de trabajo para el presente año académico y revisaron los avances del programa en los distintos establecimientos adscritos.',
            'Las autoridades destacaron la importancia de mantener espacios de coordinación permanente entre el Ministerio de Educación y las universidades de la región para asegurar la continuidad y efectividad del programa.',
          ],
        },
        style: {
          background: UBB_BRANDING.colors.neutral,
          color: UBB_BRANDING.colors.white,
          align: 'left',
          padding: 8,
          radius: 0,
          x: 40,
          y: 660,
          width: 620,
          height: 340,
          titleSize: 26,
          textSize: 16,
        },
      },
      {
        type: 'archive_list',
        title: 'Últimas Noticias',
        subtitle: '',
        metadata: {
          items: [
            {
              title: 'Mesa Regional PACE Biobío se reúne con Seremi de Educación para fortalecer trabajo conjunto',
              date: '06 de julio del 2026',
            },
            {
              title: 'Proyecto Fondecyt UBB culmina con avances en modelos estadísticos para la investigación del cáncer',
              date: '06 de julio del 2026',
            },
            {
              title: 'Dr. Luis Linzmayer expone en congreso internacional sobre los desafíos de la formación docente en Educación Física',
              date: '06 de julio del 2026',
            },
            {
              title: 'Académico UBB incorpora tecnología de frontera tras pasantía en Noruega para estudiar la comunicación entre la placenta y el cerebro',
              date: '06 de julio del 2026',
            },
          ],
        },
        style: {
          background: UBB_BRANDING.colors.primaryDark,
          color: UBB_BRANDING.colors.white,
          align: 'left',
          padding: 20,
          radius: 8,
          x: 700,
          y: 160,
          width: 260,
          height: 840,
          titleSize: 18,
          textSize: 14,
        },
      },
      {
        type: 'footer',
        title: 'Universidad del Bío-Bío',
        subtitle: 'Departamento de Comunicaciones • Campus Concepción y Chillán',
        style: {
          background: UBB_BRANDING.colors.neutral,
          color: UBB_BRANDING.colors.white,
          align: 'left',
          padding: 24,
          radius: 0,
          x: 40,
          y: 1030,
          width: 920,
          height: 150,
          titleSize: 18,
          textSize: 12,
        },
      },
    ],
  },
  {
    id: 'noticias-portada',
    name: 'Portada de Noticias UBB',
    description: 'Estructura fiel a la portada de noticias.ubiobio.cl: navbar oscuro, breadcrumb y mosaicos de noticias editables',
    pageSettings: {
      pageBackground: UBB_BRANDING.colors.neutral,
      canvasWidth: 1000,
      canvasHeight: 1200,
      darkMode: true,
    },
    blocks: [
      {
        type: 'navbar',
        title: 'Noticias UBB',
        subtitle: 'https://noticias.ubiobio.cl',
        style: {
          background: UBB_BRANDING.colors.neutral,
          color: UBB_BRANDING.colors.primarySoft,
          align: 'left',
          padding: 12,
          radius: 0,
          x: 40,
          y: 20,
          width: 920,
          height: 80,
          titleSize: 22,
          textSize: 14,
        },
      },
      {
        type: 'text',
        title: '',
        subtitle: 'Portada  /  Acontecer Universitario',
        style: {
          background: UBB_BRANDING.colors.neutral,
          color: UBB_BRANDING.colors.white,
          align: 'left',
          padding: 8,
          radius: 0,
          x: 40,
          y: 118,
          width: 920,
          height: 34,
          titleSize: 12,
          textSize: 13,
        },
      },
      {
        type: 'text',
        title: 'Acontecer Universitario',
        subtitle: 'Las últimas noticias de la Universidad del Bío-Bío',
        style: {
          background: UBB_BRANDING.colors.neutral,
          color: UBB_BRANDING.colors.primarySoft,
          align: 'left',
          padding: 8,
          radius: 0,
          x: 40,
          y: 160,
          width: 920,
          height: 80,
          titleSize: 30,
          textSize: 15,
        },
      },
      {
        type: 'news_grid',
        title: 'Últimas Noticias',
        subtitle: 'Actualidad Universitaria',
        metadata: {
          items: [
            {
              title: 'Mesa Regional PACE Biobío se reúne con Seremi de Educación para fortalecer trabajo conjunto',
              image: 'https://picsum.photos/400/250?random=11',
              url: '#'
            },
            {
              title: 'Proyecto Fondecyt UBB culmina con avances en modelos estadísticos para la investigación del cáncer',
              image: 'https://picsum.photos/400/250?random=12',
              url: '#'
            },
            {
              title: 'Dr. Luis Linzmayer expone en congreso internacional sobre los desafíos de la formación docente en Educación Física',
              image: 'https://picsum.photos/400/250?random=13',
              url: '#'
            }
          ]
        },
        style: {
          background: UBB_BRANDING.colors.primaryDark,
          color: UBB_BRANDING.colors.white,
          align: 'left',
          padding: 20,
          radius: 8,
          x: 40,
          y: 270,
          width: 920,
          height: 340,
          titleSize: 22,
          textSize: 14,
        },
      },
      {
        type: 'news_grid',
        title: 'Más Noticias',
        subtitle: '',
        metadata: {
          items: [
            {
              title: 'Académico UBB incorpora tecnología de frontera tras pasantía en Noruega para estudiar la comunicación entre la placenta y el cerebro',
              image: 'https://picsum.photos/400/250?random=14',
              url: '#'
            },
            {
              title: 'FACE inicia proceso de acreditación con visita de pares evaluadores',
              image: 'https://picsum.photos/400/250?random=15',
              url: '#'
            },
            {
              title: 'Estudiantes UBB ganan primer lugar en torneo nacional de innovación',
              image: 'https://picsum.photos/400/250?random=16',
              url: '#'
            }
          ]
        },
        style: {
          background: UBB_BRANDING.colors.primaryDark,
          color: UBB_BRANDING.colors.white,
          align: 'left',
          padding: 20,
          radius: 8,
          x: 40,
          y: 630,
          width: 920,
          height: 340,
          titleSize: 22,
          textSize: 14,
        },
      },
      {
        type: 'footer',
        title: 'Universidad del Bío-Bío',
        subtitle: 'Todos los derechos reservados © 2026. Sedes Concepción y Chillán. Chile.',
        style: {
          background: UBB_BRANDING.colors.neutral,
          color: UBB_BRANDING.colors.white,
          align: 'left',
          padding: 24,
          radius: 0,
          x: 40,
          y: 990,
          width: 920,
          height: 160,
          titleSize: 18,
          textSize: 12,
        },
      },
    ],
  },
  {
    id: 'galeria-prensa',
    name: 'Galería de Prensa Multimedia',
    description: 'Estructura fiel de cobertura fotográfica de una actividad institucional, con navbar oscuro y breadcrumb',
    pageSettings: {
      pageBackground: UBB_BRANDING.colors.neutral,
      canvasWidth: 1000,
      canvasHeight: 1300,
      darkMode: true,
    },
    blocks: [
      {
        type: 'navbar',
        title: 'Noticias UBB',
        subtitle: 'https://noticias.ubiobio.cl',
        style: {
          background: UBB_BRANDING.colors.neutral,
          color: UBB_BRANDING.colors.primarySoft,
          align: 'left',
          padding: 12,
          radius: 0,
          x: 40,
          y: 20,
          width: 920,
          height: 80,
          titleSize: 22,
          textSize: 14,
        },
      },
      {
        type: 'text',
        title: '',
        subtitle: 'Portada  /  Mesa Regional PACE Biobío se reúne con Seremi de Educación',
        style: {
          background: UBB_BRANDING.colors.neutral,
          color: UBB_BRANDING.colors.white,
          align: 'left',
          padding: 8,
          radius: 0,
          x: 40,
          y: 118,
          width: 920,
          height: 34,
          titleSize: 12,
          textSize: 13,
        },
      },
      {
        type: 'text',
        title: 'Mesa Regional PACE Biobío se reúne con Seremi de Educación',
        subtitle: 'Galería de la actividad realizada en dependencias regionales • 06 de julio del 2026',
        style: {
          background: UBB_BRANDING.colors.neutral,
          color: UBB_BRANDING.colors.primarySoft,
          align: 'left',
          padding: 8,
          radius: 0,
          x: 40,
          y: 160,
          width: 920,
          height: 100,
          titleSize: 28,
          textSize: 15,
        },
      },
      {
        type: 'image',
        title: 'https://picsum.photos/450/320?random=21',
        subtitle: 'Autoridades y equipo PACE Biobío durante la reunión',
        style: {
          background: UBB_BRANDING.colors.neutral,
          color: UBB_BRANDING.colors.white,
          align: 'center',
          padding: 0,
          radius: 8,
          x: 40,
          y: 280,
          width: 440,
          height: 320,
          titleSize: 18,
          textSize: 13,
        },
      },
      {
        type: 'image',
        title: 'https://picsum.photos/450/320?random=22',
        subtitle: 'Firma de acuerdo de trabajo conjunto',
        style: {
          background: UBB_BRANDING.colors.neutral,
          color: UBB_BRANDING.colors.white,
          align: 'center',
          padding: 0,
          radius: 8,
          x: 500,
          y: 280,
          width: 440,
          height: 320,
          titleSize: 18,
          textSize: 13,
        },
      },
      {
        type: 'image',
        title: 'https://picsum.photos/290/230?random=23',
        subtitle: 'Delegación regional',
        style: {
          background: UBB_BRANDING.colors.neutral,
          color: UBB_BRANDING.colors.white,
          align: 'center',
          padding: 0,
          radius: 8,
          x: 40,
          y: 630,
          width: 290,
          height: 260,
          titleSize: 15,
          textSize: 12,
        },
      },
      {
        type: 'image',
        title: 'https://picsum.photos/290/230?random=24',
        subtitle: 'Recorrido por dependencias',
        style: {
          background: UBB_BRANDING.colors.neutral,
          color: UBB_BRANDING.colors.white,
          align: 'center',
          padding: 0,
          radius: 8,
          x: 355,
          y: 630,
          width: 290,
          height: 260,
          titleSize: 15,
          textSize: 12,
        },
      },
      {
        type: 'image',
        title: 'https://picsum.photos/290/230?random=25',
        subtitle: 'Cierre de la actividad',
        style: {
          background: UBB_BRANDING.colors.neutral,
          color: UBB_BRANDING.colors.white,
          align: 'center',
          padding: 0,
          radius: 8,
          x: 670,
          y: 630,
          width: 290,
          height: 260,
          titleSize: 15,
          textSize: 12,
        },
      },
      {
        type: 'rich_article',
        title: '',
        subtitle: '',
        metadata: {
          paragraphs: [
            'La instancia reunió a representantes regionales y autoridades ministeriales para fortalecer el trabajo conjunto en torno al programa PACE, que apoya a estudiantes de establecimientos educacionales vulnerables de la región.',
          ],
        },
        style: {
          background: UBB_BRANDING.colors.neutral,
          color: UBB_BRANDING.colors.white,
          align: 'left',
          padding: 8,
          radius: 0,
          x: 40,
          y: 950,
          width: 920,
          height: 150,
          titleSize: 20,
          textSize: 15,
        },
      },
      {
        type: 'footer',
        title: 'Universidad del Bío-Bío',
        subtitle: 'Todos los derechos reservados © 2026. Sedes Concepción y Chillán. Chile.',
        style: {
          background: UBB_BRANDING.colors.neutral,
          color: UBB_BRANDING.colors.white,
          align: 'left',
          padding: 24,
          radius: 0,
          x: 40,
          y: 1110,
          width: 920,
          height: 160,
          titleSize: 18,
          textSize: 12,
        },
      },
    ],
  },
  {
    id: 'articulo-destacado',
    name: 'Artículo con Imagen Destacada y Cita',
    description: 'Variante de artículo con navbar oscuro, breadcrumb, cita textual destacada y barra de "Últimas Noticias"',
    pageSettings: {
      pageBackground: UBB_BRANDING.colors.neutral,
      canvasWidth: 1000,
      canvasHeight: 1220,
      darkMode: true,
    },
    blocks: [
      {
        type: 'navbar',
        title: 'Noticias UBB',
        subtitle: 'https://noticias.ubiobio.cl',
        style: {
          background: UBB_BRANDING.colors.neutral,
          color: UBB_BRANDING.colors.primarySoft,
          align: 'left',
          padding: 12,
          radius: 0,
          x: 40,
          y: 20,
          width: 920,
          height: 80,
          titleSize: 22,
          textSize: 14,
        },
      },
      {
        type: 'text',
        title: '',
        subtitle: 'Portada  /  UBB firma convenio de colaboración con institución regional',
        style: {
          background: UBB_BRANDING.colors.neutral,
          color: UBB_BRANDING.colors.white,
          align: 'left',
          padding: 8,
          radius: 0,
          x: 40,
          y: 118,
          width: 920,
          height: 34,
          titleSize: 12,
          textSize: 13,
        },
      },
      {
        type: 'text',
        title: 'UBB firma convenio de colaboración con institución regional',
        subtitle: 'Por Comunicaciones FACE • Publicado el 06 de julio del 2026',
        style: {
          background: UBB_BRANDING.colors.neutral,
          color: UBB_BRANDING.colors.primarySoft,
          align: 'left',
          padding: 8,
          radius: 0,
          x: 40,
          y: 160,
          width: 620,
          height: 130,
          titleSize: 28,
          textSize: 15,
        },
      },
      {
        type: 'image',
        title: 'https://picsum.photos/620/320?random=31',
        subtitle: 'Autoridades UBB durante la firma del convenio de colaboración',
        style: {
          background: UBB_BRANDING.colors.neutral,
          color: UBB_BRANDING.colors.white,
          align: 'left',
          padding: 0,
          radius: 8,
          x: 40,
          y: 300,
          width: 620,
          height: 320,
          titleSize: 18,
          textSize: 13,
        },
      },
      {
        type: 'rich_article',
        title: '',
        subtitle: '',
        metadata: {
          paragraphs: [
            'La Universidad del Bío-Bío formalizó un nuevo convenio de colaboración orientado a fortalecer el trabajo conjunto en materia de formación y vinculación con el medio.',
            'La actividad contó con la participación de autoridades regionales y representantes de la Facultad de Ciencias Empresariales, quienes destacaron la relevancia de este tipo de acuerdos para la región.',
          ],
        },
        style: {
          background: UBB_BRANDING.colors.neutral,
          color: UBB_BRANDING.colors.white,
          align: 'left',
          padding: 8,
          radius: 0,
          x: 40,
          y: 650,
          width: 620,
          height: 210,
          titleSize: 20,
          textSize: 16,
        },
      },
      {
        type: 'text',
        title: '"Este convenio consolida el compromiso de la universidad con el desarrollo regional y la formación de excelencia."',
        subtitle: 'Decano, Facultad de Ciencias Empresariales',
        style: {
          background: UBB_BRANDING.colors.primaryDark,
          color: UBB_BRANDING.colors.white,
          align: 'center',
          padding: 24,
          radius: 12,
          x: 40,
          y: 880,
          width: 620,
          height: 150,
          titleSize: 20,
          textSize: 14,
        },
      },
      {
        type: 'archive_list',
        title: 'Últimas Noticias',
        subtitle: '',
        metadata: {
          items: [
            {
              title: 'Mesa Regional PACE Biobío se reúne con Seremi de Educación para fortalecer trabajo conjunto',
              date: '06 de julio del 2026',
            },
            {
              title: 'Proyecto Fondecyt UBB culmina con avances en modelos estadísticos para la investigación del cáncer',
              date: '06 de julio del 2026',
            },
            {
              title: 'Dr. Luis Linzmayer expone en congreso internacional sobre los desafíos de la formación docente en Educación Física',
              date: '06 de julio del 2026',
            },
          ],
        },
        style: {
          background: UBB_BRANDING.colors.primaryDark,
          color: UBB_BRANDING.colors.white,
          align: 'left',
          padding: 20,
          radius: 8,
          x: 700,
          y: 160,
          width: 260,
          height: 870,
          titleSize: 18,
          textSize: 14,
        },
      },
      {
        type: 'footer',
        title: 'Universidad del Bío-Bío',
        subtitle: 'Departamento de Comunicaciones • Campus Concepción y Chillán',
        style: {
          background: UBB_BRANDING.colors.neutral,
          color: UBB_BRANDING.colors.white,
          align: 'left',
          padding: 24,
          radius: 0,
          x: 40,
          y: 1050,
          width: 920,
          height: 150,
          titleSize: 18,
          textSize: 12,
        },
      },
    ],
  },
];
