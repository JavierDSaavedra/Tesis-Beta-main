import { defaultPageSettings, SETTINGS_KEY, starters, STORAGE_KEY } from './constants';
import { sanitizeBlock } from './helpers';

// Minimal, essential storage utilities to keep the editor lightweight and intuitive.

export const STRAPI_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.PUBLIC_STRAPI_API_URL) || 'http://localhost:1337';
export const STRAPI_API_URL = `${STRAPI_BASE_URL}/api/pages`;
export const STRAPI_TEMPLATES_URL = `${STRAPI_BASE_URL}/api/templates`;

export function loadInitialBlocks() {
  if (typeof window === 'undefined') return starters;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return starters;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return starters;
    const sanitized = parsed.map(sanitizeBlock).filter(Boolean);
    return sanitized.length ? sanitized : starters;
  } catch {
    return starters;
  }
}

export function loadPageSettings() {
  if (typeof window === 'undefined') return defaultPageSettings;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultPageSettings;
    const parsed = JSON.parse(raw) || {};
    return { ...defaultPageSettings, ...parsed };
  } catch {
    return defaultPageSettings;
  }
}

export function saveBlocks(blocks) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(blocks));
  } catch {
    // silent
  }
}

export function savePageSettings(settings) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // silent
  }
}

// Lightweight export/import of the current project (blocks + settings)
export function exportCurrentProject() {
  return {
    blocks: loadInitialBlocks(),
    pageSettings: loadPageSettings(),
    exportedAt: new Date().toISOString(),
  };
}

export function importCurrentProject(payload) {
  if (typeof window === 'undefined') return false;
  try {
    if (payload?.blocks) saveBlocks(payload.blocks);
    if (payload?.pageSettings) savePageSettings(payload.pageSettings);
    return true;
  } catch {
    return false;
  }
}

export function clearCurrentProject() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(SETTINGS_KEY);
}

// --- Strapi API integrations ---

export async function fetchPagesFromStrapi() {
  try {
    const res = await fetch(`${STRAPI_API_URL}?populate=*`);
    if (!res.ok) throw new Error('Error al obtener páginas de Strapi');
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.error(err);
    return [];
  }
}

export async function fetchTemplatesFromStrapi() {
  try {
    const res = await fetch(STRAPI_TEMPLATES_URL);
    if (!res.ok) throw new Error('Error al obtener plantillas de Strapi');
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.error(err);
    return [];
  }
}

export async function fetchPageBySlugFromStrapi(slug) {
  try {
    const res = await fetch(`${STRAPI_API_URL}?filters[slug][$eq]=${slug}&populate=*`);
    if (!res.ok) throw new Error('Error al obtener la página por slug');
    const json = await res.json();
    return json.data?.[0] || null;
  } catch (err) {
    console.error(err);
    return null;
  }
}

export async function savePageToStrapi(pageData) {
  const isEdit = !!pageData.documentId;
  const url = isEdit ? `${STRAPI_API_URL}/${pageData.documentId}` : STRAPI_API_URL;
  const method = isEdit ? 'PUT' : 'POST';

  // Strapi v5 expects data wrapped in a "data" object
  const body = JSON.stringify({
    data: {
      title: pageData.title,
      slug: pageData.slug,
      module: pageData.module || 'default',
      blocks: pageData.blocks,
      pageSettings: pageData.pageSettings,
      template: pageData.template || null
    }
  });

  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Error al guardar en Strapi: ${errText}`);
  }

  const json = await res.json();
  return json.data;
}

export async function deletePageFromStrapi(documentId) {
  if (!documentId) return false;
  const res = await fetch(`${STRAPI_API_URL}/${documentId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error('Error al eliminar la página de Strapi');
  }
  return true;
}

export async function saveTemplateToStrapi(templateData) {
  const body = JSON.stringify({
    data: {
      title: templateData.title,
      description: templateData.description || '',
      blocks: templateData.blocks,
      pageSettings: templateData.pageSettings
    }
  });

  const res = await fetch(STRAPI_TEMPLATES_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Error al guardar la plantilla: ${errText}`);
  }

  const json = await res.json();
  return json.data;
}

export async function fetchTemplateByIdFromStrapi(documentId) {
  try {
    const res = await fetch(`${STRAPI_TEMPLATES_URL}/${documentId}`);
    if (!res.ok) throw new Error('Error al obtener plantilla de Strapi');
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.error(err);
    return null;
  }
}

export async function updateTemplateInStrapi(documentId, templateData) {
  const body = JSON.stringify({
    data: {
      title: templateData.title,
      description: templateData.description || '',
      blocks: templateData.blocks,
      pageSettings: templateData.pageSettings
    }
  });

  const res = await fetch(`${STRAPI_TEMPLATES_URL}/${documentId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Error al actualizar la plantilla: ${errText}`);
  }

  const json = await res.json();
  return json.data;
}
