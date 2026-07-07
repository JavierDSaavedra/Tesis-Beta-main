import { useEffect, useMemo, useRef, useState } from 'react';
import './page-builder.css';
import { prebuiltTemplates, validateAgainstNorms } from './template-rules';
import { blockTemplates, blockTypeLabels, defaultPageSettings, defaultStyle, starters, UBB_BRANDING, moduleTemplates } from './constants';
import { createBlock, getAvailableBlockTypes, createModulePage } from './helpers';
import { blockToHtml, renderBlock } from './renderers';
import {
  loadInitialBlocks,
  loadPageSettings,
  saveBlocks,
  savePageSettings,
  exportCurrentProject,
  importCurrentProject,
  clearCurrentProject,
  fetchPagesFromStrapi,
  fetchTemplatesFromStrapi,
  fetchTemplateByIdFromStrapi,
  savePageToStrapi,
  saveTemplateToStrapi,
  updateTemplateInStrapi,
  deletePageFromStrapi,
  STRAPI_BASE_URL,
} from './storage';

function exportHtmlDocument(blocks, pageSettings) {
  const body = blocks.map((block) => blockToHtml(block)).join('');
  const canvasColor = pageSettings.darkMode ? '#10141c' : '#ffffff';
  const pageText = pageSettings.darkMode ? '#e5e7eb' : '#111827';
  const html = `<!doctype html><html lang="es"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Mi pagina</title></head><body style="margin:0;background:${pageSettings.pageBackground};color:${pageText};font-family:Segoe UI,Arial,sans-serif"><main style="position:relative;width:${pageSettings.canvasWidth}px;height:${pageSettings.canvasHeight}px;margin:24px auto;background:${canvasColor};border-radius:12px;overflow:hidden">${body}</main></body></html>`;
  const file = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'mi-pagina.html';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function PageBuilder() {
  const [blocks, setBlocks] = useState(starters);
  const [pageSettings, setPageSettings] = useState(defaultPageSettings);
  const [selectedId, setSelectedId] = useState(null);
  const [normWarnings, setNormWarnings] = useState([]);
  const [interaction, setInteraction] = useState(null);
  const [activeWindow, setActiveWindow] = useState('block');
  const [guides, setGuides] = useState({ x: null, y: null, centerX: false, centerY: false });
  const canvasRef = useRef(null);
  const [editingBlockId, setEditingBlockId] = useState(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [leftActiveTab, setLeftActiveTab] = useState('blocks');

  // Strapi state
  const [strapiPages, setStrapiPages] = useState([]);
  const [strapiTemplates, setStrapiTemplates] = useState([]);
  const [selectedPageId, setSelectedPageId] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [pageTitle, setPageTitle] = useState('Nueva Página');
  const [pageSlug, setPageSlug] = useState('nueva-pagina');
  
  // Advanced UX States
  const [lastSavedState, setLastSavedState] = useState({
    blocks: starters,
    pageSettings: defaultPageSettings,
    title: 'Nueva Página',
    slug: 'nueva-pagina',
    template: ''
  });
  const [toasts, setToasts] = useState([]);
  const [isCmsModalOpen, setIsCmsModalOpen] = useState(false);
  const [cmsSearch, setCmsSearch] = useState('');
  const [cmsModuleFilter, setCmsModuleFilter] = useState('all');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingPages, setIsLoadingPages] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const hasTemplate = !!selectedTemplateId && !isEditingTemplate;

  const isDirty = useMemo(() => {
    if (!isHydrated) return false;
    return (
      JSON.stringify(blocks) !== JSON.stringify(lastSavedState.blocks) ||
      JSON.stringify(pageSettings) !== JSON.stringify(lastSavedState.pageSettings) ||
      pageTitle !== lastSavedState.title ||
      pageSlug !== lastSavedState.slug ||
      selectedTemplateId !== lastSavedState.template
    );
  }, [blocks, pageSettings, pageTitle, pageSlug, selectedTemplateId, lastSavedState, isHydrated]);

  const loadPages = async () => {
    setIsLoadingPages(true);
    try {
      const pages = await fetchPagesFromStrapi();
      setStrapiPages(pages);
      
      const templates = await fetchTemplatesFromStrapi();
      setStrapiTemplates(templates);

      // Auto-load page or template if query parameters exist
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const pageParam = params.get('page');
        const templateEditParam = params.get('templateEdit');

        if (templateEditParam) {
          const template = templates.find(t => t.documentId === templateEditParam || String(t.id) === String(templateEditParam));
          if (template) {
            const tempBlocks = template.blocks || [];
            const tempSet = template.pageSettings || defaultPageSettings;
            const title = template.title || '';

            setSelectedTemplateId(template.documentId || template.id);
            setIsEditingTemplate(true);
            setIsAdmin(true);
            setBlocks(tempBlocks);
            setPageSettings(tempSet);
            setPageTitle(title);
            setPageSlug('');
            setLastSavedState({
              blocks: tempBlocks,
              pageSettings: tempSet,
              title,
              slug: '',
              template: template.documentId || template.id
            });
            addToast(`Plantilla "${title}" cargada para edición visual`, 'info');
          }
        } else if (pageParam) {
          const page = pages.find(p => p.documentId === pageParam || String(p.id) === String(pageParam));
          if (page) {
            const pageBlocks = page.blocks || [];
            const pageSet = page.pageSettings || defaultPageSettings;
            const title = page.title || '';
            const slug = page.slug || '';
            const tId = page.template?.documentId || page.template?.id || '';

            setSelectedPageId(page.documentId || page.id);
            setSelectedTemplateId(tId);
            setIsEditingTemplate(false);
            setBlocks(pageBlocks);
            setPageSettings(pageSet);
            setPageTitle(title);
            setPageSlug(slug);
            setLastSavedState({
              blocks: pageBlocks,
              pageSettings: pageSet,
              title,
              slug,
              template: tId
            });
            addToast(`Página "${title}" cargada automáticamente`, 'info');
          }
        }
      }
    } catch (err) {
      console.error('No se pudieron cargar las páginas de Strapi:', err);
      addToast('No se pudieron cargar las páginas de Strapi', 'error');
    } finally {
      setIsLoadingPages(false);
    }
  };

  const selectPage = (page) => {
    if (isDirty) {
      if (!window.confirm('Tienes cambios sin guardar en el lienzo. ¿Seguro que deseas continuar y perder los cambios actuales?')) {
        return;
      }
    }
    
    if (!page) {
      // Nueva página
      setSelectedPageId('');
      setSelectedTemplateId('');
      setBlocks(starters);
      setPageSettings(defaultPageSettings);
      setPageTitle('Nueva Página');
      setPageSlug('nueva-pagina');
      setLastSavedState({
        blocks: starters,
        pageSettings: defaultPageSettings,
        title: 'Nueva Página',
        slug: 'nueva-pagina',
        template: ''
      });
      addToast('Nueva página creada en el editor', 'info');
    } else {
      const pageBlocks = page.blocks || [];
      const pageSet = page.pageSettings || defaultPageSettings;
      const title = page.title || '';
      const slug = page.slug || '';
      const tId = page.template?.documentId || page.template?.id || '';
      
      setSelectedPageId(page.documentId || page.id);
      setSelectedTemplateId(tId);
      setBlocks(pageBlocks);
      setPageSettings(pageSet);
      setPageTitle(title);
      setPageSlug(slug);
      setLastSavedState({
        blocks: pageBlocks,
        pageSettings: pageSet,
        title,
        slug,
        template: tId
      });
      addToast(`Página "${title}" cargada con éxito`, 'success');
    }
    setIsCmsModalOpen(false);
  };

  const handleSaveToStrapi = async () => {
    if (isEditingTemplate) {
      if (!pageTitle.trim()) {
        addToast('⚠️ Título requerido para la plantilla', 'warning');
        return;
      }
      setIsSaving(true);
      try {
        const saved = await updateTemplateInStrapi(selectedTemplateId, {
          title: pageTitle,
          blocks,
          pageSettings
        });
        addToast('✅ Plantilla actualizada con éxito', 'success');
        setLastSavedState({
          blocks: saved.blocks || blocks,
          pageSettings: saved.pageSettings || pageSettings,
          title: saved.title || pageTitle,
          slug: '',
          template: selectedTemplateId
        });
        await loadPages();
      } catch (err) {
        addToast(`❌ Error al actualizar plantilla: ${err.message}`, 'error');
      } finally {
        setIsSaving(false);
      }
      return;
    }

    if (!isAdmin && !selectedTemplateId) {
      addToast('⚠️ Debes seleccionar una plantilla para poder publicar una página', 'error');
      return;
    }

    if (!pageTitle.trim() || !pageSlug.trim()) {
      addToast('⚠️ Título y slug requeridos', 'warning');
      return;
    }
    setIsSaving(true);
    try {
      const pageData = {
        title: pageTitle,
        slug: pageSlug,
        module: pageSettings.module,
        blocks,
        pageSettings,
        template: selectedTemplateId || null,
      };
      if (selectedPageId) {
        pageData.documentId = selectedPageId;
      }
      const saved = await savePageToStrapi(pageData);
      
      const newPageId = saved.documentId || saved.id;
      setSelectedPageId(newPageId);
      
      const savedBlocks = saved.blocks || blocks;
      const savedSettings = saved.pageSettings || pageSettings;
      const savedTitle = saved.title || pageTitle;
      const savedSlug = saved.slug || pageSlug;
      const savedTemplateId = saved.template?.documentId || saved.template?.id || '';
      setSelectedTemplateId(savedTemplateId);
      
      setLastSavedState({
        blocks: savedBlocks,
        pageSettings: savedSettings,
        title: savedTitle,
        slug: savedSlug,
        template: savedTemplateId
      });
      
      addToast(selectedPageId ? '✅ Página actualizada con éxito' : '✅ Página publicada con éxito', 'success');
      await loadPages();
    } catch (err) {
      addToast(`❌ Error al guardar: ${err.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };


  const handleDeleteFromStrapi = async (pageIdToDelete = null) => {
    const id = pageIdToDelete || selectedPageId;
    if (!id) return;
    
    const targetPage = strapiPages.find(p => p.documentId === id || String(p.id) === String(id));
    const title = targetPage ? targetPage.title : 'esta página';
    
    if (!window.confirm(`¿Seguro que deseas eliminar la página "${title}" de Strapi? Esta acción no se puede deshacer.`)) {
      return;
    }
    
    try {
      await deletePageFromStrapi(id);
      addToast('🗑️ Página eliminada con éxito', 'success');
      
      if (id === selectedPageId) {
        setSelectedPageId('');
        setSelectedTemplateId('');
        setBlocks(starters);
        setPageSettings(defaultPageSettings);
        setPageTitle('Nueva Página');
        setPageSlug('nueva-pagina');
        setLastSavedState({
          blocks: starters,
          pageSettings: defaultPageSettings,
          title: 'Nueva Página',
          slug: 'nueva-pagina',
          template: ''
        });
      }
      await loadPages();
    } catch (err) {
      addToast(`❌ Error al eliminar: ${err.message}`, 'error');
    }
  };

  const ensureCanvasHeight = (requiredBottom) => {
    setPageSettings((current) => {
      const needed = Math.max(current.canvasHeight, Math.ceil(requiredBottom + 120));
      return needed === current.canvasHeight ? current : { ...current, canvasHeight: needed };
    });
  };

  // Keyboard shortcut Ctrl + S
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveToStrapi();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [blocks, pageSettings, pageTitle, pageSlug, selectedPageId, lastSavedState, isHydrated]);

  useEffect(() => {
    const initial = loadInitialBlocks();
    const settings = loadPageSettings();
    setBlocks(initial);
    setPageSettings(settings);
    setIsHydrated(true);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setIsAdmin(params.get('admin') === 'true');
    }
    setLastSavedState({
      blocks: initial,
      pageSettings: settings,
      title: 'Nueva Página',
      slug: 'nueva-pagina'
    });
    if (initial && initial.length > 0) {
      setSelectedId(initial[0].id);
    }
    loadPages();
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    saveBlocks(blocks);
  }, [blocks, isHydrated]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    savePageSettings(pageSettings);
  }, [pageSettings, isHydrated]);

  useEffect(() => {
    setNormWarnings(validateAgainstNorms(blocks));
  }, [blocks]);

  useEffect(() => {
    if (editingBlockId && editingBlockId !== selectedId) {
      setEditingBlockId(null);
    }
  }, [selectedId, editingBlockId]);

  useEffect(() => {
    const lowestPoint = blocks.reduce((max, block) => {
      const y = block.style?.y ?? 0;
      const h = block.style?.height ?? 0;
      return Math.max(max, y + h);
    }, 0);
    ensureCanvasHeight(lowestPoint);
  }, [blocks]);

  const selectedBlock = useMemo(
    () => blocks.find((block) => block.id === selectedId) ?? null,
    [blocks, selectedId],
  );

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const positionFloatingPanel = (block, boxWidth, boxHeight, offset = 16) => {
    const canvasWidth = pageSettings.canvasWidth;
    const canvasHeight = pageSettings.canvasHeight;
    const margin = 12;
    const x = block.style?.x ?? 0;
    const y = block.style?.y ?? 0;
    const width = block.style?.width ?? 280;
    const height = block.style?.height ?? 140;

    let left = x + width + offset;
    if (left + boxWidth > canvasWidth - margin) {
      left = x - boxWidth - offset;
    }
    left = clamp(left, margin, Math.max(margin, canvasWidth - boxWidth - margin));

    let top = y;
    if (top + boxHeight > canvasHeight - margin) {
      top = canvasHeight - boxHeight - margin;
    }
    if (top < margin) {
      top = margin;
    }

    return {
      left: `${left}px`,
      top: `${top}px`,
      width: `${boxWidth}px`,
      minHeight: `${Math.max(boxHeight, height)}px`,
    };
  };

  const selectedToolbarStyle = selectedBlock ? positionFloatingPanel(selectedBlock, 332, 232) : null;

  const selectedInlineEditorStyle = selectedBlock ? positionFloatingPanel(selectedBlock, 324, 286, 20) : null;

  const addBlock = (type, insertIndex = null) => {
    if (hasTemplate) {
      addToast('⚠️ No se pueden añadir bloques en páginas basadas en plantillas', 'warning');
      return;
    }
    const newBlock = createBlock(type);
    if (!newBlock) {
      return;
    }

    setBlocks((current) => {
      if (insertIndex === null || insertIndex < 0 || insertIndex > current.length) {
        return [...current, newBlock];
      }

      const next = [...current];
      next.splice(insertIndex, 0, newBlock);
      return next;
    });
    setSelectedId(newBlock.id);
  };

  const updateSelected = (field, value) => {
    if (!selectedId) {
      return;
    }

    setBlocks((current) =>
      current.map((block) => (block.id === selectedId ? { ...block, [field]: value } : block)),
    );
  };

  const updateSelectedStyle = (field, value) => {
    if (!selectedId) {
      return;
    }

    setBlocks((current) =>
      current.map((block) =>
        block.id === selectedId
          ? { ...block, style: { ...(block.style || defaultStyle), [field]: value } }
          : block,
      ),
    );
  };

  const updateSelectedMetadata = (field, value) => {
    if (!selectedId) {
      return;
    }

    setBlocks((current) =>
      current.map((block) =>
        block.id === selectedId
          ? { ...block, metadata: { ...(block.metadata || {}), [field]: value } }
          : block,
      ),
    );
  };

  const updateBlockStyleById = (id, patch) => {
    setBlocks((current) =>
      current.map((block) =>
        block.id === id
          ? { ...block, style: { ...(block.style || defaultStyle), ...patch } }
          : block,
      ),
    );
  };

  const removeSelected = () => {
    if (hasTemplate) return;
    if (!selectedId || blocks.length === 1) {
      return;
    }

    setBlocks((current) => {
      const next = current.filter((block) => block.id !== selectedId);
      setSelectedId(next[0]?.id ?? null);
      return next;
    });
  };

  const duplicateSelected = () => {
    if (hasTemplate) return;
    if (!selectedId) return;
    const original = blocks.find((b) => b.id === selectedId);
    if (!original) return;
    const copy = {
      ...original,
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      style: { ...(original.style || defaultStyle), x: (original.style?.x || 40) + 20, y: (original.style?.y || 40) + 20 },
    };
    setBlocks((current) => {
      const next = [...current, copy];
      setSelectedId(copy.id);
      return next;
    });
  };

  const duplicateBlockById = (id) => {
    if (hasTemplate) return;
    const original = blocks.find((b) => b.id === id);
    if (!original) return;
    const copy = {
      ...original,
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      style: { ...(original.style || defaultStyle), x: (original.style?.x || 40) + 20, y: (original.style?.y || 40) + 20 },
    };
    setBlocks((current) => [...current, copy]);
  };

  const moveLayer = (id, direction) => {
    if (hasTemplate) return;
    setBlocks((current) => {
      const idx = current.findIndex((b) => b.id === id);
      if (idx === -1) return current;
      const swapIdx = direction === 'up' ? Math.max(0, idx - 1) : Math.min(current.length - 1, idx + 1);
      if (swapIdx === idx) return current;
      const next = [...current];
      const tmp = next[swapIdx];
      next[swapIdx] = next[idx];
      next[idx] = tmp;
      return next;
    });
  };

  const toggleInlineEditor = (id) => {
    setEditingBlockId((prev) => (prev === id ? null : id));
    // ensure block is selected when editing
    setSelectedId(id);
  };

  const onPaletteDragStart = (event, type) => {
    event.dataTransfer.setData('text/plain', `add:${type}`);
    event.dataTransfer.effectAllowed = 'copy';
  };

  const startDrag = (event, id) => {
    if (hasTemplate) return;
    if (event.target.closest('.pb-resize-handle')) {
      return;
    }

    event.preventDefault();
    setSelectedId(id);
    const block = blocks.find((item) => item.id === id);
    if (!block) {
      return;
    }

    setInteraction({
      type: 'move',
      id,
      startMouseX: event.clientX,
      startMouseY: event.clientY,
      startX: block.style?.x ?? 0,
      startY: block.style?.y ?? 0,
      width: block.style?.width ?? 200,
      height: block.style?.height ?? 120,
    });
  };

  const startResize = (event, id) => {
    if (hasTemplate) return;
    event.preventDefault();
    event.stopPropagation();
    setSelectedId(id);
    const block = blocks.find((item) => item.id === id);
    if (!block) {
      return;
    }

    setInteraction({
      type: 'resize',
      id,
      startMouseX: event.clientX,
      startMouseY: event.clientY,
      startWidth: block.style?.width ?? 260,
      startHeight: block.style?.height ?? 120,
      startX: block.style?.x ?? 0,
      startY: block.style?.y ?? 0,
    });
  };

  const onDropAt = (event, targetId = null) => {
    event.preventDefault();
    if (hasTemplate) {
      addToast('⚠️ No se pueden añadir bloques en páginas basadas en plantillas', 'warning');
      return;
    }
    const payload = event.dataTransfer.getData('text/plain');
    if (!payload) {
      return;
    }

    if (payload.startsWith('add:')) {
      const type = payload.replace('add:', '');
      if (!blockTemplates[type]) {
        return;
      }

      if (!targetId && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = Math.max(8, event.clientX - rect.left - 140);
        const y = Math.max(8, event.clientY - rect.top - 40);
        const newBlock = createBlock(type);
        if (!newBlock) {
          return;
        }

        newBlock.style = {
          ...(newBlock.style || defaultStyle),
          x,
          y,
        };
        setBlocks((current) => [...current, newBlock]);
        setSelectedId(newBlock.id);
        ensureCanvasHeight(y + (newBlock.style?.height ?? 140));
        return;
      }

      if (targetId) {
        const targetIndex = blocks.findIndex((block) => block.id === targetId);
        addBlock(type, targetIndex >= 0 ? targetIndex : null);
      }
      return;
    }
  };

  useEffect(() => {
    if (!interaction) {
      return;
    }

    const onMouseMove = (event) => {
      const dx = event.clientX - interaction.startMouseX;
      const dy = event.clientY - interaction.startMouseY;
      const canvasWidth = pageSettings.canvasWidth;
      const canvasHeight = pageSettings.canvasHeight;

      if (interaction.type === 'move') {
        const snapThreshold = 8;
        const rawX = Math.max(0, Math.min(interaction.startX + dx, canvasWidth - interaction.width));
        const rawY = Math.max(0, interaction.startY + dy);

        let snappedX = rawX;
        let snappedY = rawY;
        let guideX = null;
        let guideY = null;
        let centeredX = false;
        let centeredY = false;

        const currentWidth = interaction.width;
        const currentHeight = interaction.height;
        const others = blocks.filter((block) => block.id !== interaction.id);

        const xCandidates = [];
        const yCandidates = [];

        // Canvas center guides
        xCandidates.push({
          dist: Math.abs(rawX + currentWidth / 2 - canvasWidth / 2),
          snapped: canvasWidth / 2 - currentWidth / 2,
          guide: canvasWidth / 2,
          center: true,
        });
        yCandidates.push({
          dist: Math.abs(rawY + currentHeight / 2 - canvasHeight / 2),
          snapped: canvasHeight / 2 - currentHeight / 2,
          guide: canvasHeight / 2,
          center: true,
        });

        others.forEach((block) => {
          const bx = block.style?.x ?? 0;
          const by = block.style?.y ?? 0;
          const bw = block.style?.width ?? 0;
          const bh = block.style?.height ?? 0;

          const xTargets = [bx, bx + bw / 2, bx + bw];
          const yTargets = [by, by + bh / 2, by + bh];

          xTargets.forEach((target, index) => {
            const proposal = index === 0 ? target : index === 1 ? target - currentWidth / 2 : target - currentWidth;
            const movingPoint =
              index === 0 ? rawX : index === 1 ? rawX + currentWidth / 2 : rawX + currentWidth;
            xCandidates.push({
              dist: Math.abs(movingPoint - target),
              snapped: Math.max(0, Math.min(proposal, canvasWidth - currentWidth)),
              guide: target,
              center: false,
            });
          });

          yTargets.forEach((target, index) => {
            const proposal =
              index === 0 ? target : index === 1 ? target - currentHeight / 2 : target - currentHeight;
            const movingPoint =
              index === 0 ? rawY : index === 1 ? rawY + currentHeight / 2 : rawY + currentHeight;
            yCandidates.push({
              dist: Math.abs(movingPoint - target),
              snapped: Math.max(0, proposal),
              guide: target,
              center: false,
            });
          });
        });

        const bestX = xCandidates.sort((a, b) => a.dist - b.dist)[0];
        const bestY = yCandidates.sort((a, b) => a.dist - b.dist)[0];

        if (bestX && bestX.dist <= snapThreshold) {
          snappedX = bestX.snapped;
          guideX = bestX.guide;
          centeredX = bestX.center;
        }

        if (bestY && bestY.dist <= snapThreshold) {
          snappedY = bestY.snapped;
          guideY = bestY.guide;
          centeredY = bestY.center;
        }

        updateBlockStyleById(interaction.id, { x: snappedX, y: snappedY });
        setGuides({ x: guideX, y: guideY, centerX: centeredX, centerY: centeredY });
        ensureCanvasHeight(snappedY + interaction.height);
      }

      if (interaction.type === 'resize') {
        const nextWidth = Math.max(120, Math.min(interaction.startWidth + dx, canvasWidth - interaction.startX));
        const nextHeight = Math.max(80, interaction.startHeight + dy);
        updateBlockStyleById(interaction.id, {
          width: nextWidth,
          height: nextHeight,
        });
        setGuides({ x: null, y: null, centerX: false, centerY: false });
        ensureCanvasHeight(interaction.startY + nextHeight);
      }
    };

    const onMouseUp = () => {
      setInteraction(null);
      setGuides({ x: null, y: null, centerX: false, centerY: false });
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [blocks, interaction, pageSettings.canvasHeight, pageSettings.canvasWidth]);

  const applyTemplate = (template) => {
    let nextY = 28;
    const preparedBlocks = template.blocks.map((block) => {
      const mergedStyle = { ...defaultStyle, ...(block.style || {}) };
      const normalized = {
        ...mergedStyle,
        x: Number.isFinite(mergedStyle.x) ? mergedStyle.x : 28,
        y: Number.isFinite(mergedStyle.y) ? mergedStyle.y : nextY,
        width: Number.isFinite(mergedStyle.width) ? mergedStyle.width : 420,
        height: Number.isFinite(mergedStyle.height) ? mergedStyle.height : 180,
      };

      nextY = normalized.y + normalized.height + 18;

      return {
        ...block,
        id: crypto.randomUUID(),
        style: normalized,
      };
    });

    setBlocks(preparedBlocks);
    setPageSettings({
      ...defaultPageSettings,
      ...(template.pageSettings || {}),
    });
    setSelectedId(preparedBlocks[0]?.id ?? null);
  };

  const filteredPages = useMemo(() => {
    return strapiPages.filter(page => {
      const title = (page.title || '').toLowerCase();
      const slug = (page.slug || '').toLowerCase();
      const search = cmsSearch.toLowerCase();
      
      const matchesSearch = title.includes(search) || slug.includes(search);
      const matchesModule = cmsModuleFilter === 'all' || (page.module || 'default') === cmsModuleFilter;
      
      return matchesSearch && matchesModule;
    });
  }, [strapiPages, cmsSearch, cmsModuleFilter]);

  return (
    <main className={`pb-shell ${pageSettings.darkMode ? 'is-dark' : ''}`}>
      <header className="pb-topbar">
        <div className="pb-topbar-title" style={{ marginRight: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800', fontFamily: 'var(--font-heading)', background: 'linear-gradient(135deg, var(--ubb-blue), var(--ubb-blue-light))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.5px' }}>
            MiniWix Builder
          </h1>
          <p style={{ margin: 0, fontSize: '11px', color: 'var(--ubb-gray-medium)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            {UBB_BRANDING.brandName}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {isEditingTemplate ? (
            <div className="pb-active-page-info" style={{ borderColor: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}>
              <span className="pb-page-icon">🎨</span>
              <div className="pb-page-meta">
                <span className="pb-page-meta-title" title={pageTitle} style={{ color: '#10b981' }}>{pageTitle}</span>
                <span className="pb-page-meta-slug" style={{ color: '#047857', fontWeight: 'bold' }}>[Editando Plantilla]</span>
              </div>
            </div>
          ) : selectedPageId ? (
            <div className="pb-active-page-info">
              <span className="pb-page-icon">📄</span>
              <div className="pb-page-meta">
                <span className="pb-page-meta-title" title={pageTitle}>{pageTitle}</span>
                <span className="pb-page-meta-slug" title={pageSlug}>/{pageSlug}</span>
              </div>
            </div>
          ) : (
            <div className="pb-active-page-info is-new">
              <span className="pb-page-icon">✨</span>
              <div className="pb-page-meta">
                <span className="pb-page-meta-title">Nueva Página</span>
                <span className="pb-page-meta-slug">Sin publicar</span>
              </div>
            </div>
          )}

          {isDirty && (
            <span className="pb-dirty-badge" title="Tienes cambios sin guardar en esta página">
              ● Modificado
            </span>
          )}

          <button
            type="button"
            className="pb-cms-manager-btn"
            onClick={() => { loadPages(); setIsCmsModalOpen(true); }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <span>📁</span> Gestor CMS
            {strapiPages.length > 0 && <span className="pb-cms-count-badge">{strapiPages.length}</span>}
          </button>

          <select
            value={pageSettings.module}
            onChange={(e) => setPageSettings({ ...pageSettings, module: e.target.value })}
            style={{ padding: '8px 12px', borderRadius: '6px' }}
          >
            <option value="default">Estándar</option>
            <option value="academic">Portal Académico</option>
            <option value="congress">Congreso/Evento</option>
            <option value="diffusion">Difusión Institucional</option>
          </select>

          <button
            type="button"
            className={`pb-export ${isSaving ? 'is-saving' : ''} ${isDirty ? 'is-dirty' : ''}`}
            onClick={handleSaveToStrapi}
            disabled={isSaving}
            style={{
              background: selectedPageId ? 'linear-gradient(135deg, var(--ubb-blue), var(--ubb-blue-light))' : 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: '#fff',
              fontWeight: 'bold',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              opacity: isSaving ? 0.7 : 1
            }}
          >
            {isSaving ? (
              <span className="pb-btn-spinner"></span>
            ) : (
              <span>💾</span>
            )}
            {(selectedPageId || isEditingTemplate) ? 'Actualizar' : 'Publicar'}
          </button>

          <a
            href={`${STRAPI_BASE_URL}/admin`}
            target="_blank"
            rel="noopener noreferrer"
            className="pb-export pb-cms-link"
            style={{
              background: 'linear-gradient(135deg, #4945ff, #7e7bff)',
              color: '#fff',
              fontWeight: 'bold',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(73, 69, 255, 0.25)'
            }}
          >
            CMS Strapi ⚙️
          </a>
          <button
            type="button"
            className="pb-export"
            style={{ background: '#64748b' }}
            onClick={() => exportHtmlDocument(blocks, pageSettings)}
          >
            Exportar HTML
          </button>
        </div>
      </header>

      <section className="pb-editbar">
        <div className="pb-editbar-title">Barra de Edicion</div>
        {selectedBlock ? (
          <div className="pb-editbar-grid">
            <input
              className="pb-editbar-input"
              type="text"
              value={selectedBlock.title}
              onChange={(event) => updateSelected('title', event.target.value)}
              placeholder="Titulo"
            />
            <input
              className="pb-editbar-input"
              type="text"
              value={selectedBlock.subtitle}
              onChange={(event) => updateSelected('subtitle', event.target.value)}
              placeholder="Texto o enlace"
            />
            <input
              className="pb-editbar-color"
              type="color"
              title="Fondo"
              value={selectedBlock.style?.background || '#ffffff'}
              onChange={(event) => updateSelectedStyle('background', event.target.value)}
            />
            <input
              className="pb-editbar-color"
              type="color"
              title="Texto"
              value={selectedBlock.style?.color || '#1f2937'}
              onChange={(event) => updateSelectedStyle('color', event.target.value)}
            />
            <select
              className="pb-editbar-select"
              value={selectedBlock.style?.align || 'left'}
              onChange={(event) => updateSelectedStyle('align', event.target.value)}
            >
              <option value="left">Izq</option>
              <option value="center">Centro</option>
              <option value="right">Der</option>
            </select>
            <button type="button" className="pb-delete" onClick={removeSelected}>
              Eliminar
            </button>
          </div>
        ) : (
          <p className="pb-editbar-empty">Selecciona un bloque para editar.</p>
        )}
      </section>

      <section 
        className="pb-workspace" 
        style={{ 
          background: pageSettings.pageBackground,
          gridTemplateColumns: `${leftPanelOpen ? '260px' : '50px'} 1fr ${rightPanelOpen ? '280px' : '50px'}`,
          transition: 'grid-template-columns 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {leftPanelOpen ? (
          <aside className="pb-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '2px solid var(--ubb-blue-soft)', paddingBottom: '10px' }}>
              <div className="pb-window-tabs" style={{ margin: 0, border: 'none', flex: 1, paddingRight: '8px' }}>
                <button
                  type="button"
                  className={leftActiveTab === 'blocks' ? 'is-active' : ''}
                  onClick={() => setLeftActiveTab('blocks')}
                >
                  Bloques
                </button>
                <button
                  type="button"
                  className={leftActiveTab === 'layers' ? 'is-active' : ''}
                  onClick={() => setLeftActiveTab('layers')}
                >
                  Capas
                </button>
                <button
                  type="button"
                  className={leftActiveTab === 'templates' ? 'is-active' : ''}
                  onClick={() => setLeftActiveTab('templates')}
                >
                  Plantillas
                </button>
              </div>
              <button 
                type="button"
                className="pb-collapse-btn" 
                onClick={() => setLeftPanelOpen(false)}
                title="Colapsar panel"
              >
                ◀
              </button>
            </div>

            {leftActiveTab === 'blocks' && (
              <>
                <h3>Bloques ({pageSettings.module})</h3>
                {hasTemplate ? (
                  <div className="pb-template-locked-notice" style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '6px', fontSize: '13px', fontWeight: '500', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    🔒 El diseño está bloqueado por la plantilla de la página. No se pueden agregar nuevos bloques.
                  </div>
                ) : (
                  <div className="pb-actions">
                    {getAvailableBlockTypes(pageSettings.module).map((blockType) => (
                      <div
                        key={blockType}
                        className="pb-block-chip"
                        draggable
                        onDragStart={(event) => onPaletteDragStart(event, blockType)}
                        title={`Arrastra ${blockType} al lienzo`}
                      >
                          {blockTypeLabels[blockType] || blockType}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {leftActiveTab === 'layers' && (
              <>
                <h3>Capas</h3>
                <div className="pb-layers">
                  {blocks.map((block, index) => (
                    <button
                      key={block.id}
                      type="button"
                      className={selectedId === block.id ? 'is-active' : ''}
                      onClick={() => setSelectedId(block.id)}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => onDropAt(event, block.id)}
                    >
                      <span className="pb-layer-index">{index + 1}</span>
                        <span>{blockTypeLabels[block.type] || block.type}</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {leftActiveTab === 'templates' && (
              <>
                <h3>Plantillas prehechas</h3>
                <div className="pb-templates">
                  {prebuiltTemplates.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      className="pb-template-btn"
                      onClick={() => applyTemplate(template)}
                    >
                      <strong>{template.name}</strong>
                      <span>{template.description}</span>
                    </button>
                  ))}
                </div>

                {strapiTemplates.length > 0 && (
                  <>
                    <h3 style={{ marginTop: '20px', borderTop: '1px solid var(--ubb-blue-soft)', paddingTop: '16px' }}>Plantillas CMS Strapi</h3>
                    <div className="pb-templates">
                      {strapiTemplates.map((template) => (
                        <button
                          key={template.documentId || template.id}
                          type="button"
                          className="pb-template-btn"
                          style={{ borderLeft: '4px solid #4945ff' }}
                          onClick={() => {
                            if (window.confirm(`¿Seguro que deseas aplicar la plantilla "${template.title}"? Reemplazará todos los bloques y el diseño quedará bloqueado.`)) {
                              setSelectedTemplateId(template.documentId || template.id);
                              setBlocks(template.blocks || []);
                              setPageSettings({
                                ...defaultPageSettings,
                                ...(template.pageSettings || {})
                              });
                              addToast(`Plantilla "${template.title}" aplicada`, 'success');
                            }
                          }}
                        >
                          <strong>{template.title}</strong>
                          <span>{template.description || 'Definida en Strapi por Administrador'}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </aside>
        ) : (
          <aside className="pb-panel is-collapsed" onClick={() => setLeftPanelOpen(true)} title="Expandir panel izquierdo">
            <button 
              type="button"
              className="pb-expand-btn"
              onClick={(e) => { e.stopPropagation(); setLeftPanelOpen(true); }}
            >
              ▶
            </button>
            <div className="pb-vertical-text">📁 Bloques y Plantillas</div>
          </aside>
        )}

        <section
          className="pb-canvas"
          ref={canvasRef}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => onDropAt(event, null)}
          onClick={() => {
            setSelectedId(null);
            setEditingBlockId(null);
          }}
          style={{
            maxWidth: `${pageSettings.canvasWidth}px`,
            height: `${pageSettings.canvasHeight}px`,
            background: pageSettings.darkMode ? '#10141c' : '#ffffff',
          }}
        >
          {hasTemplate && (
            <div className="pb-template-banner" style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              right: '12px',
              zIndex: 99,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 16px',
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              color: 'white',
              fontWeight: '600',
              fontSize: '13px',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(29, 78, 216, 0.25)'
            }}>
              <span>🔒 MODO PLANTILLA: El diseño estructural y la posición de los bloques están bloqueados. Solo puedes editar el contenido.</span>
            </div>
          )}

          <div className="pb-ruler pb-ruler-v" style={{ left: `${pageSettings.canvasWidth / 2}px` }} />
          <div className="pb-ruler pb-ruler-h" style={{ top: `${pageSettings.canvasHeight / 2}px` }} />

          {guides.x !== null ? (
            <div className="pb-guide-line pb-guide-v" style={{ left: `${guides.x}px` }} />
          ) : null}
          {guides.y !== null ? (
            <div className="pb-guide-line pb-guide-h" style={{ top: `${guides.y}px` }} />
          ) : null}

          {guides.centerX || guides.centerY ? (
            <div className="pb-guide-badge">
              {guides.centerX ? 'Centrado X ' : ''}
              {guides.centerY ? 'Centrado Y' : ''}
            </div>
          ) : null}

          {blocks.map((block) => (
            <article
              key={block.id}
              className={`${selectedId === block.id ? 'pb-selected' : ''} ${hasTemplate ? 'pb-locked-block' : ''}`}
              onClick={(event) => {
                event.stopPropagation();
                setSelectedId(block.id);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  setSelectedId(block.id);
                }
              }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => onDropAt(event, block.id)}
              onMouseDown={(event) => startDrag(event, block.id)}
              role="button"
              tabIndex={0}
              style={{
                position: 'absolute',
                left: `${block.style?.x ?? 0}px`,
                top: `${block.style?.y ?? 0}px`,
                width: `${block.style?.width ?? 280}px`,
                height: `${block.style?.height ?? 140}px`,
                cursor: hasTemplate ? 'pointer' : 'move'
              }}
            >
              {renderBlock(block)}
              {!hasTemplate && (
                <button
                  type="button"
                  aria-label="Redimensionar bloque"
                  className="pb-resize-handle"
                  onMouseDown={(event) => startResize(event, block.id)}
                />
              )}
            </article>
          ))}

          {selectedBlock && selectedToolbarStyle ? (
            <div className="pb-block-toolbar" style={selectedToolbarStyle} onClick={(event) => event.stopPropagation()}>
              <div className="pb-block-toolbar__header">
                <div>
                  <span className="pb-block-toolbar__eyebrow">Bloque activo</span>
                  <strong>{blockTypeLabels[selectedBlock.type] || selectedBlock.type}</strong>
                </div>
                <span className="pb-block-toolbar__meta">
                  {Math.round(selectedBlock.style?.width ?? 280)} × {Math.round(selectedBlock.style?.height ?? 140)}
                </span>
              </div>

              <div className="pb-block-toolbar__group pb-block-toolbar__group--primary">
                <button
                  type="button"
                  className="pb-block-toolbar__action pb-block-toolbar__action--primary"
                  title="Editar bloque"
                  onClick={() => toggleInlineEditor(selectedBlock.id)}
                  aria-label="Editar"
                >
                  <span className="pb-block-toolbar__icon">✏️</span>
                  <span>
                    <strong>Editar</strong>
                    <small>Abrir panel</small>
                  </span>
                </button>
                {!hasTemplate && (
                  <>
                    <button
                      type="button"
                      className="pb-block-toolbar__action"
                      title="Duplicar bloque"
                      onClick={() => duplicateBlockById(selectedBlock.id)}
                      aria-label="Duplicar"
                    >
                      <span className="pb-block-toolbar__icon">📄</span>
                      <span>
                        <strong>Duplicar</strong>
                        <small>Crear copia</small>
                      </span>
                    </button>
                    <button
                      type="button"
                      className="pb-block-toolbar__action pb-block-toolbar__action--danger"
                      title="Eliminar bloque"
                      onClick={() => removeSelected()}
                      aria-label="Eliminar"
                    >
                      <span className="pb-block-toolbar__icon">🗑️</span>
                      <span>
                        <strong>Eliminar</strong>
                        <small>Borrar bloque</small>
                      </span>
                    </button>
                  </>
                )}
              </div>

              {!hasTemplate && (
                <>
                  <div className="pb-block-toolbar__divider" />

                  <div className="pb-block-toolbar__group pb-block-toolbar__group--compact">
                    <button
                      type="button"
                      className="pb-block-toolbar__mini"
                      title="Subir capa"
                      onClick={() => moveLayer(selectedBlock.id, 'up')}
                      aria-label="Subir"
                    >
                      <span>⬆️</span>
                      <small>Subir</small>
                    </button>
                    <button
                      type="button"
                      className="pb-block-toolbar__mini"
                      title="Bajar capa"
                      onClick={() => moveLayer(selectedBlock.id, 'down')}
                      aria-label="Bajar"
                    >
                      <span>⬇️</span>
                      <small>Bajar</small>
                    </button>
                    <button
                      type="button"
                      className="pb-block-toolbar__mini"
                      title="Deseleccionar"
                      onClick={() => setSelectedId(null)}
                      aria-label="Deseleccionar"
                    >
                      <span>✕</span>
                      <small>Quitar</small>
                    </button>
                  </div>
                </>
              )}

              {hasTemplate && (
                <>
                  <div className="pb-block-toolbar__divider" />
                  <div className="pb-block-toolbar__group pb-block-toolbar__group--compact">
                    <button
                      type="button"
                      className="pb-block-toolbar__mini"
                      title="Deseleccionar"
                      onClick={() => setSelectedId(null)}
                      aria-label="Deseleccionar"
                      style={{ flex: 1 }}
                    >
                      <span>✕</span>
                      <small>Cerrar menú</small>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : null}
          {editingBlockId && selectedBlock && editingBlockId === selectedBlock.id && selectedInlineEditorStyle ? (
            <div className="pb-inline-editor" style={selectedInlineEditorStyle} onClick={(event) => event.stopPropagation()}>
              <div className="pb-inline-editor-header">Editar bloque</div>
              <label>
                Título
                <input value={selectedBlock.title || ''} onChange={(e) => updateSelected('title', e.target.value)} />
              </label>
              <label>
                Subtítulo
                <input value={selectedBlock.subtitle || ''} onChange={(e) => updateSelected('subtitle', e.target.value)} />
              </label>
              <label>
                Fondo
                <input type="color" value={selectedBlock.style?.background || '#ffffff'} onChange={(e) => updateSelectedStyle('background', e.target.value)} />
              </label>
              <label>
                Color texto
                <input type="color" value={selectedBlock.style?.color || '#111827'} onChange={(e) => updateSelectedStyle('color', e.target.value)} />
              </label>
              <label>
                Alineación
                <select value={selectedBlock.style?.align || 'left'} onChange={(e) => updateSelectedStyle('align', e.target.value)}>
                  <option value="left">Izquierda</option>
                  <option value="center">Centro</option>
                  <option value="right">Derecha</option>
                </select>
              </label>
              <div className="pb-inline-actions">
                <button className="pb-ok" onClick={() => setEditingBlockId(null)}>Cerrar</button>
              </div>
            </div>
          ) : null}
          <p className="pb-canvas-tip">Arrastra bloques desde la izquierda al lienzo.</p>
        </section>

        {rightPanelOpen ? (
          <aside className="pb-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '2px solid var(--ubb-blue-soft)', paddingBottom: '10px' }}>
              <div className="pb-window-tabs" style={{ margin: 0, border: 'none', flex: 1, paddingRight: '8px' }}>
                <button
                  type="button"
                  className={activeWindow === 'block' ? 'is-active' : ''}
                  onClick={() => setActiveWindow('block')}
                >
                  Bloque
                </button>
                <button
                  type="button"
                  className={activeWindow === 'page' ? 'is-active' : ''}
                  onClick={() => setActiveWindow('page')}
                >
                    Página
                </button>
                <button
                  type="button"
                  className={activeWindow === 'rules' ? 'is-active' : ''}
                  onClick={() => setActiveWindow('rules')}
                >
                  Normas
                </button>
              </div>
              <button 
                type="button"
                className="pb-collapse-btn" 
                onClick={() => setRightPanelOpen(false)}
                title="Colapsar panel"
              >
                ▶
              </button>
            </div>

            {activeWindow === 'rules' ? (
              <>
                <h3>Normativa</h3>
                {normWarnings.length === 0 ? (
                  <p className="pb-ok">Sin advertencias.</p>
                ) : (
                  <ul className="pb-warnings">
                    {normWarnings.map((warning, idx) => (
                      <li key={idx}>
                        {typeof warning === 'object' && warning !== null 
                          ? `${warning.type === 'error' ? '❌' : '⚠️'} ${warning.message}`
                          : warning}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : null}

            {activeWindow === 'page' ? (
              <>
                <h3>Ajustes de la Página</h3>
                <div className="pb-form">
                  <label>
                    Título de Página (Strapi)
                    <input
                      type="text"
                      style={{ padding: '6px', borderRadius: '4px', border: '1px solid var(--ubb-blue-soft)', width: '90%' }}
                      value={pageTitle}
                      onChange={(event) => {
                        setPageTitle(event.target.value);
                        // Auto-slugify if not editing an existing page with established slug
                        if (!selectedPageId) {
                          setPageSlug(event.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                        }
                      }}
                      placeholder="Ej. Mi Magister"
                    />
                  </label>
                  <label>
                    Slug de URL (Ruta)
                    <input
                      type="text"
                      style={{ padding: '6px', borderRadius: '4px', border: '1px solid var(--ubb-blue-soft)', width: '90%' }}
                      value={pageSlug}
                      onChange={(event) => setPageSlug(event.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, ''))}
                      placeholder="Ej. mi-magister"
                    />
                  </label>
                  <label style={{ display: 'block', marginTop: '10px' }}>
                    Fondo
                    <input
                      type="color"
                      value={pageSettings.pageBackground}
                      onChange={(event) =>
                        setPageSettings((current) => ({ ...current, pageBackground: event.target.value }))
                      }
                    />
                  </label>
                  <label>
                    Ancho del lienzo
                    <input
                      type="range"
                      min="760"
                      max="1200"
                      value={pageSettings.canvasWidth}
                      onChange={(event) =>
                        setPageSettings((current) => ({
                          ...current,
                          canvasWidth: Number(event.target.value),
                        }))
                      }
                    />
                  </label>
                  <label>
                    Alto del lienzo
                    <input
                      type="range"
                      min="520"
                      max="10000"
                      value={pageSettings.canvasHeight}
                      onChange={(event) =>
                        setPageSettings((current) => ({
                          ...current,
                          canvasHeight: Number(event.target.value),
                        }))
                      }
                    />
                  </label>
                  <label className="pb-inline-control">
                    <input
                      type="checkbox"
                      checked={pageSettings.darkMode}
                      onChange={(event) =>
                        setPageSettings((current) => ({ ...current, darkMode: event.target.checked }))
                      }
                    />
                    Modo oscuro
                  </label>
                </div>
              </>
            ) : null}

            {activeWindow === 'block' ? (
              <>
                <h3>Ajustes del Bloque</h3>
                {selectedBlock ? (
                  <div className="pb-form">
                    {selectedBlock.type === 'rich_article' ? (
                      <label>
                        Párrafos (uno por línea)
                        <textarea
                          rows={8}
                          style={{ width: '90%', fontFamily: 'inherit' }}
                          value={(selectedBlock.metadata?.paragraphs || []).join('\n')}
                          onChange={(event) =>
                            updateSelectedMetadata(
                              'paragraphs',
                              event.target.value.split('\n').filter((line) => line.trim().length > 0),
                            )
                          }
                        />
                      </label>
                    ) : null}
                    {selectedBlock.type === 'news_grid' ? (
                      <label>
                        Noticias del mosaico (una por línea: Título | Imagen URL | Enlace)
                        <textarea
                          rows={6}
                          style={{ width: '90%', fontFamily: 'inherit' }}
                          value={(selectedBlock.metadata?.items || [])
                            .map((item) => `${item.title || ''} | ${item.image || ''} | ${item.url || ''}`)
                            .join('\n')}
                          onChange={(event) =>
                            updateSelectedMetadata(
                              'items',
                              event.target.value
                                .split('\n')
                                .filter((line) => line.trim().length > 0)
                                .map((line) => {
                                  const [title, image, url] = line.split('|');
                                  return {
                                    title: (title || '').trim(),
                                    image: (image || '').trim(),
                                    url: (url || '#').trim() || '#',
                                  };
                                }),
                            )
                          }
                        />
                      </label>
                    ) : null}
                    {selectedBlock.type === 'archive_list' ? (
                      <label>
                        Noticias del listado (una por línea: Título | Fecha)
                        <textarea
                          rows={6}
                          style={{ width: '90%', fontFamily: 'inherit' }}
                          value={(selectedBlock.metadata?.items || [])
                            .map((item) => `${item.title || ''} | ${item.date || ''}`)
                            .join('\n')}
                          onChange={(event) =>
                            updateSelectedMetadata(
                              'items',
                              event.target.value
                                .split('\n')
                                .filter((line) => line.trim().length > 0)
                                .map((line) => {
                                  const [title, date] = line.split('|');
                                  return { title: (title || '').trim(), date: (date || '').trim() };
                                }),
                            )
                          }
                        />
                      </label>
                    ) : null}
                    <label>
                      {selectedBlock.type === 'button' ? 'Margen Interno (Padding)' : 'Espaciado / Padding'}
                      <input
                        type="range"
                        min="4"
                        max="72"
                        value={selectedBlock.style?.padding ?? 28}
                        onChange={(event) => updateSelectedStyle('padding', Number(event.target.value))}
                      />
                    </label>
                    <label>
                      {selectedBlock.type === 'button' ? 'Tamaño de la Letra' : 'Tamaño título'}
                      <input
                        type="range"
                        min="10"
                        max="72"
                        value={selectedBlock.style?.titleSize ?? 34}
                        onChange={(event) => updateSelectedStyle('titleSize', Number(event.target.value))}
                      />
                    </label>
                    {selectedBlock.type !== 'button' && (
                      <label>
                        Tamaño texto
                        <input
                          type="range"
                          min="12"
                          max="32"
                          value={selectedBlock.style?.textSize ?? 17}
                          onChange={(event) => updateSelectedStyle('textSize', Number(event.target.value))}
                        />
                      </label>
                    )}
                    <label>
                      Bordes redondeados
                      <input
                        type="range"
                        min="0"
                        max="40"
                        value={Math.min(selectedBlock.style?.radius ?? 10, 40)}
                        onChange={(event) => updateSelectedStyle('radius', Number(event.target.value))}
                      />
                    </label>
                    {hasTemplate ? (
                      <div className="pb-template-locked-fields" style={{ padding: '10px', background: 'rgba(245, 158, 11, 0.1)', color: '#d97706', borderRadius: '6px', fontSize: '12px', marginTop: '12px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                        ℹ️ La posición y dimensiones de los bloques están fijadas por la plantilla.
                      </div>
                    ) : (
                      <>
                        <label>
                          Posicion X
                          <input
                            type="range"
                            min="0"
                            max={Math.max(0, pageSettings.canvasWidth - (selectedBlock.style?.width ?? 120))}
                            value={selectedBlock.style?.x ?? 0}
                            onChange={(event) => updateSelectedStyle('x', Number(event.target.value))}
                          />
                        </label>
                        <label>
                          Posicion Y
                          <input
                            type="range"
                            min="0"
                            max={Math.max(0, pageSettings.canvasHeight - (selectedBlock.style?.height ?? 80))}
                            value={selectedBlock.style?.y ?? 0}
                            onChange={(event) => updateSelectedStyle('y', Number(event.target.value))}
                          />
                        </label>
                        <label>
                          Ancho bloque
                          <input
                            type="range"
                            min="120"
                            max={Math.max(120, pageSettings.canvasWidth - (selectedBlock.style?.x ?? 0))}
                            value={selectedBlock.style?.width ?? 320}
                            onChange={(event) => updateSelectedStyle('width', Number(event.target.value))}
                          />
                        </label>
                        <label>
                          Alto bloque
                          <input
                            type="range"
                            min="80"
                            max={Math.max(80, pageSettings.canvasHeight - (selectedBlock.style?.y ?? 0))}
                            value={selectedBlock.style?.height ?? 140}
                            onChange={(event) => updateSelectedStyle('height', Number(event.target.value))}
                          />
                        </label>
                      </>
                    )}
                  </div>
                ) : (
                  <p>Selecciona un bloque para editarlo.</p>
                )}
              </>
            ) : null}
          </aside>
        ) : (
          <aside className="pb-panel is-collapsed" onClick={() => setRightPanelOpen(true)} title="Expandir panel derecho">
            <button 
              type="button"
              className="pb-expand-btn"
              onClick={(e) => { e.stopPropagation(); setRightPanelOpen(true); }}
            >
              ◀
            </button>
            <div className="pb-vertical-text">⚙️ Ajustes y Normativa</div>
          </aside>
        )}
      </section>

      {/* Gestor de Páginas CMS Modal */}
      {isCmsModalOpen && (
        <div className="pb-modal-overlay" onClick={() => setIsCmsModalOpen(false)}>
          <div className="pb-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="pb-modal-header">
              <h2>Gestor de Páginas CMS Strapi</h2>
              <button className="pb-modal-close" onClick={() => setIsCmsModalOpen(false)}>✕</button>
            </div>
            
            <div className="pb-modal-toolbar">
              <div className="pb-modal-search-wrapper">
                <span className="pb-modal-search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Buscar por título o slug..."
                  value={cmsSearch}
                  onChange={(e) => setCmsSearch(e.target.value)}
                  className="pb-modal-search"
                />
              </div>
              
              <div className="pb-modal-filters">
                <select
                  value={cmsModuleFilter}
                  onChange={(e) => setCmsModuleFilter(e.target.value)}
                  className="pb-modal-filter"
                >
                  <option value="all">Todos los Módulos</option>
                  <option value="default">Estándar</option>
                  <option value="academic">Portal Académico</option>
                  <option value="congress">Congreso/Evento</option>
                  <option value="diffusion">Difusión Institucional</option>
                </select>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  {isAdmin && (
                    <button
                      type="button"
                      className="pb-modal-new-btn"
                      onClick={() => selectPage(null)}
                    >
                      ➕ Página en Blanco
                    </button>
                  )}
                  <select
                    className="pb-modal-filter"
                    style={{ background: 'var(--ubb-blue)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                    onChange={(e) => {
                      const rawValue = e.target.value;
                      if (!rawValue) {
                        return;
                      }
                      const [source, templateId] = rawValue.split(':');
                      const template = source === 'prebuilt'
                        ? prebuiltTemplates.find(t => t.id === templateId)
                        : strapiTemplates.find(t => t.documentId === templateId || String(t.id) === String(templateId));

                      if (template) {
                        if (isDirty) {
                          if (!window.confirm('Tienes cambios sin guardar en el lienzo. ¿Seguro que deseas continuar y perder los cambios actuales?')) {
                            e.target.value = '';
                            return;
                          }
                        }
                        const templateLabel = source === 'prebuilt' ? template.name : template.title;
                        const templateKey = source === 'prebuilt' ? template.id : (template.documentId || template.id);
                        setSelectedPageId('');
                        setSelectedTemplateId(templateKey);
                        setBlocks(template.blocks || []);
                        setPageSettings({
                          ...defaultPageSettings,
                          ...(template.pageSettings || {})
                        });
                        setPageTitle(`Nueva Página - ${templateLabel}`);
                        setPageSlug(`nueva-pagina-${(templateLabel || '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`);
                        setLastSavedState({
                          blocks: template.blocks || [],
                          pageSettings: template.pageSettings || defaultPageSettings,
                          title: `Nueva Página - ${templateLabel}`,
                          slug: `nueva-pagina-${(templateLabel || '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
                          template: templateKey
                        });
                        setIsCmsModalOpen(false);
                        addToast(`Página creada usando plantilla "${templateLabel}"`, 'success');
                      }
                      e.target.value = '';
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled>➕ Crear desde Plantilla...</option>
                    <optgroup label="Plantillas Prehechas" style={{ color: '#000', background: '#fff' }}>
                      {prebuiltTemplates.map(t => (
                        <option key={t.id} value={`prebuilt:${t.id}`} style={{ color: '#000', background: '#fff' }}>
                          {t.name}
                        </option>
                      ))}
                    </optgroup>
                    {strapiTemplates.length > 0 && (
                      <optgroup label="Plantillas CMS Strapi" style={{ color: '#000', background: '#fff' }}>
                        {strapiTemplates.map(t => (
                          <option key={t.documentId || t.id} value={`strapi:${t.documentId || t.id}`} style={{ color: '#000', background: '#fff' }}>
                            {t.title}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>
              </div>
            </div>
            
            <div className="pb-modal-body">
              {isLoadingPages ? (
                <div className="pb-modal-loading">
                  <div className="pb-spinner"></div>
                  <p>Cargando páginas desde Strapi...</p>
                </div>
              ) : filteredPages.length === 0 ? (
                <div className="pb-modal-empty">
                  <p>No se encontraron páginas en Strapi.</p>
                  {cmsSearch || cmsModuleFilter !== 'all' ? (
                    <button className="pb-modal-clear-btn" onClick={() => { setCmsSearch(''); setCmsModuleFilter('all'); }}>Limpiar filtros</button>
                  ) : (
                    <button className="pb-modal-clear-btn" onClick={() => selectPage(null)}>Crear la primera página</button>
                  )}
                </div>
              ) : (
                <div className="pb-pages-grid">
                  {filteredPages.map(page => {
                    const isCurrent = selectedPageId === (page.documentId || page.id);
                    return (
                      <div key={page.documentId || page.id} className={`pb-page-card ${isCurrent ? 'is-current' : ''}`}>
                        <div className="pb-page-card-header">
                          <span className={`pb-module-badge module-${page.module || 'default'}`}>
                            {page.module === 'academic' && 'Académico'}
                            {page.module === 'congress' && 'Congreso'}
                            {page.module === 'diffusion' && 'Difusión'}
                            {(!page.module || page.module === 'default') && 'Estándar'}
                          </span>
                          {isCurrent && <span className="pb-active-badge">Abierta</span>}
                        </div>
                        <h3>{page.title || 'Sin Título'}</h3>
                        <code className="pb-page-slug">/{page.slug || 'sin-slug'}</code>
                        <div className="pb-page-card-actions">
                          <button
                            type="button"
                            className="pb-card-btn pb-btn-load"
                            onClick={() => selectPage(page)}
                          >
                            Cargar
                          </button>
                          <button
                            type="button"
                            className="pb-card-btn pb-btn-delete"
                            onClick={() => handleDeleteFromStrapi(page.documentId || page.id)}
                            title="Eliminar de Strapi"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <div className="pb-toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`pb-toast toast-${toast.type}`}>
            <span className="pb-toast-icon">
              {toast.type === 'success' && '✅'}
              {toast.type === 'error' && '❌'}
              {toast.type === 'warning' && '⚠️'}
              {toast.type === 'info' && 'ℹ️'}
            </span>
            <span className="pb-toast-message">{toast.message}</span>
            <button className="pb-toast-close" onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}>✕</button>
          </div>
        ))}
      </div>
    </main>
  );
}
