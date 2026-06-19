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
    description: 'Recreación de una página de noticia individual de noticias.ubiobio.cl',
    pageSettings: {
      pageBackground: '#f8fafc',
      canvasWidth: 980,
      canvasHeight: 1100,
      darkMode: false,
    },
    blocks: [
      {
        type: 'navbar',
        title: 'Noticias UBB',
        subtitle: 'https://noticias.ubiobio.cl',
        style: {
          background: UBB_BRANDING.colors.primaryDark,
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
        type: 'rich_article',
        title: 'Académico UBB se integra al Grupo de Evaluación FONDECYT de Educación Superior de ANID',
        subtitle: 'Por Comunicaciones FACE • 15 de Junio, 2026',
        metadata: {
          paragraphs: [
            'El académico del Departamento de Ciencias de la Educación de la Facultad de Ciencias Empresariales (FACE) ha sido seleccionado para conformar el prestigioso Grupo de Evaluación FONDECYT de Educación Superior de la Agencia Nacional de Investigación y Desarrollo (ANID).',
            'Este nombramiento representa un importante hito tanto para la Facultad como para la Universidad del Bío-Bío, consolidando la presencia institucional en las mesas técnicas que guían el financiamiento científico nacional en materia de educación y desarrollo social.',
            'El decano de la facultad felicitó el nombramiento y destacó que esto refuerza la labor de investigación y vinculación con el medio que se viene realizando de manera sistemática en la universidad.'
          ]
        },
        style: {
          background: UBB_BRANDING.colors.white,
          color: UBB_BRANDING.colors.neutral,
          align: 'left',
          padding: 24,
          radius: 8,
          x: 40,
          y: 120,
          width: 900,
          height: 420,
          titleSize: 26,
          textSize: 16,
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
          y: 560,
          width: 900,
          height: 160,
          titleSize: 18,
          textSize: 12,
        },
      },
    ],
  },
];
