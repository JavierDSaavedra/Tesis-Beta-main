import { blockTemplates, defaultStyle, moduleTemplates } from './constants';

export function sanitizeBlock(rawBlock) {
  if (!rawBlock || typeof rawBlock !== 'object') {
    return null;
  }

  const type = rawBlock.type;
  if (!blockTemplates[type]) {
    return null;
  }

  return {
    id: rawBlock.id || crypto.randomUUID(),
    type,
    title: rawBlock.title ?? blockTemplates[type].title,
    subtitle: rawBlock.subtitle ?? blockTemplates[type].subtitle,
    metadata: rawBlock.metadata || blockTemplates[type].metadata || {},
    style: {
      ...defaultStyle,
      ...(blockTemplates[type].style || {}),
      ...(rawBlock.style || {}),
    },
  };
}

export function createBlock(type) {
  const template = blockTemplates[type];
  if (!template) {
    return null;
  }

  return {
    ...template,
    id: crypto.randomUUID(),
    style: { ...template.style },
    metadata: template.metadata ? { ...template.metadata } : {},
  };
}

export function reorderBlocks(list, sourceId, targetId) {
  if (!sourceId || !targetId || sourceId === targetId) {
    return list;
  }

  const from = list.findIndex((block) => block.id === sourceId);
  const to = list.findIndex((block) => block.id === targetId);
  if (from < 0 || to < 0) {
    return list;
  }

  const next = [...list];
  next.splice(from, 1);
  next.splice(to, 0, list[from]);
  return next;
}

// Module helpers
export function getModuleTemplate(moduleName) {
  return moduleTemplates[moduleName] || null;
}

export function createModulePage(moduleName, customBlocks = null) {
  const template = getModuleTemplate(moduleName);
  if (!template) return null;

  const blocks = (customBlocks || template.blocks).map((block) => ({
    ...block,
    id: block.id || crypto.randomUUID(),
  }));

  return {
    settings: template.pageSettings,
    blocks,
  };
}

export function duplicateBlock(block) {
  return {
    ...block,
    id: crypto.randomUUID(),
    style: { ...block.style },
    metadata: block.metadata ? { ...block.metadata } : {},
  };
}

export function updateBlockMetadata(block, metadata) {
  return {
    ...block,
    metadata: {
      ...block.metadata,
      ...metadata,
    },
  };
}

export function calculateCanvasHeight(blocks) {
  if (!blocks || blocks.length === 0) return 720;

  const lowestPoint = blocks.reduce((max, block) => {
    const y = block.style?.y ?? 0;
    const h = block.style?.height ?? 0;
    return Math.max(max, y + h);
  }, 0);

  return Math.ceil(lowestPoint + 120);
}

export function getAvailableBlockTypes(module = 'default') {
  const allTypes = Object.keys(blockTemplates);

  if (module === 'academic') {
    return allTypes.filter((type) =>
      ['hero', 'program_header', 'curriculum', 'text', 'contact_info', 'image', 'button'].includes(type),
    );
  }

  if (module === 'congress') {
    return allTypes.filter((type) =>
      ['hero', 'congress_event', 'archive_list', 'text', 'image', 'button'].includes(type),
    );
  }

  if (module === 'diffusion') {
    return allTypes.filter((type) =>
      ['hero', 'news_item', 'text', 'image', 'button', 'archive_list'].includes(type),
    );
  }

  return allTypes;
}

export function groupBlocksByType(blocks) {
  return blocks.reduce((acc, block) => {
    if (!acc[block.type]) {
      acc[block.type] = [];
    }
    acc[block.type].push(block);
    return acc;
  }, {});
}

export function searchBlocks(blocks, query) {
  const lowerQuery = query.toLowerCase();
  return blocks.filter((block) =>
    block.title?.toLowerCase().includes(lowerQuery) ||
    block.subtitle?.toLowerCase().includes(lowerQuery) ||
    block.type?.toLowerCase().includes(lowerQuery),
  );
}

export function exportBlocksAsJSON(blocks, pageSettings) {
  return JSON.stringify({ blocks, pageSettings }, null, 2);
}

export function importBlocksFromJSON(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    return {
      blocks: (data.blocks || []).map(sanitizeBlock).filter(Boolean),
      pageSettings: data.pageSettings || {},
    };
  } catch (error) {
    return null;
  }
}
