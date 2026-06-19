import { useEffect, useMemo, useRef, useState } from 'react';
import './page-builder.css';
import { prebuiltTemplates, validateAgainstNorms } from '../backend/page-builder/template-rules';
import { blockTemplates, blockTypeLabels, defaultPageSettings, defaultStyle, starters, UBB_BRANDING, moduleTemplates } from '../backend/page-builder/constants';
import { createBlock, getAvailableBlockTypes, createModulePage } from '../backend/page-builder/helpers';
import { blockToHtml, renderBlock } from '../backend/page-builder/renderers';
import {
  loadInitialBlocks,
  loadPageSettings,
  saveBlocks,
  savePageSettings,
  exportCurrentProject,
  importCurrentProject,
  clearCurrentProject,
} from '../backend/page-builder/storage';

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

  const ensureCanvasHeight = (requiredBottom) => {
    setPageSettings((current) => {
      const needed = Math.max(current.canvasHeight, Math.ceil(requiredBottom + 120));
      return needed === current.canvasHeight ? current : { ...current, canvasHeight: needed };
    });
  };

  useEffect(() => {
    if (!selectedId && blocks.length > 0) {
      setSelectedId(blocks[0].id);
    }
  }, [blocks, selectedId]);

  useEffect(() => {
    setBlocks(loadInitialBlocks());
    setPageSettings(loadPageSettings());
    setIsHydrated(true);
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

  return (
    <main className={`pb-shell ${pageSettings.darkMode ? 'is-dark' : ''}`}>
      <header className="pb-topbar">
        <div className="pb-topbar-title">
          <h1>FACE Page Builder</h1>
          <p>Generador de sitios modulares - UBB</p>
          <small>
            {blocks.length} bloques | {Math.round(pageSettings.canvasWidth)}x
            {Math.round(pageSettings.canvasHeight)} | Módulo: {pageSettings.module}
          </small>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select
            value={pageSettings.module}
            onChange={(e) => setPageSettings({ ...pageSettings, module: e.target.value })}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid ' + UBB_BRANDING.colors.primary,
              backgroundColor: UBB_BRANDING.colors.white,
              cursor: 'pointer',
            }}
          >
            <option value="default">Estándar</option>
            <option value="academic">Portal Académico</option>
            <option value="congress">Congreso/Evento</option>
            <option value="diffusion">Difusión Institucional</option>
          </select>
          <button
            type="button"
            className="pb-export"
            onClick={() => exportHtmlDocument(blocks, pageSettings)}
          >
            Exportar HTML
          </button>
        </div>
      </header>

      {normWarnings.length > 0 && (
        <section style={{
          background: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '12px',
          color: '#856404',
        }}>
          <strong>Validaciones:</strong>
          <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
            {normWarnings.map((warning, idx) => (
              <li key={idx} style={{ fontSize: '12px', margin: '4px 0' }}>
                {warning.type === 'error' ? '❌' : '⚠️'} {warning.message}
              </li>
            ))}
          </ul>
        </section>
      )}

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

      <section className="pb-workspace" style={{ background: pageSettings.pageBackground }}>
        <aside className="pb-panel">
          <h3>Bloques ({pageSettings.module})</h3>
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
        </aside>

        <section
          className="pb-canvas"
          ref={canvasRef}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => onDropAt(event, null)}
          style={{
            maxWidth: `${pageSettings.canvasWidth}px`,
            height: `${pageSettings.canvasHeight}px`,
            background: pageSettings.darkMode ? '#10141c' : '#ffffff',
          }}
        >
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
              className={selectedId === block.id ? 'pb-selected' : ''}
              onClick={() => setSelectedId(block.id)}
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
              }}
            >
              {renderBlock(block)}
              <button
                type="button"
                aria-label="Redimensionar bloque"
                className="pb-resize-handle"
                onMouseDown={(event) => startResize(event, block.id)}
              />
            </article>
          ))}

          {selectedBlock && selectedToolbarStyle ? (
            <div className="pb-block-toolbar" style={selectedToolbarStyle}>
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
              </div>

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
            </div>
          ) : null}
          {editingBlockId && selectedBlock && editingBlockId === selectedBlock.id && selectedInlineEditorStyle ? (
            <div className="pb-inline-editor" style={selectedInlineEditorStyle}>
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

        <aside className="pb-panel">
          <div className="pb-window-tabs">
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
              Normativa
            </button>
          </div>

          {activeWindow === 'rules' ? (
            <>
              <h3>Normativa</h3>
              {normWarnings.length === 0 ? (
                <p className="pb-ok">Sin advertencias.</p>
              ) : (
                <ul className="pb-warnings">
                  {normWarnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              )}
            </>
          ) : null}

          {activeWindow === 'page' ? (
            <>
              <h3>Página</h3>
              <div className="pb-form">
                <label>
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
                  <label>
                    Espaciado
                    <input
                      type="range"
                      min="8"
                      max="72"
                      value={selectedBlock.style?.padding ?? 28}
                      onChange={(event) => updateSelectedStyle('padding', Number(event.target.value))}
                    />
                  </label>
                  <label>
                    Tamaño titulo
                    <input
                      type="range"
                      min="18"
                      max="72"
                      value={selectedBlock.style?.titleSize ?? 34}
                      onChange={(event) => updateSelectedStyle('titleSize', Number(event.target.value))}
                    />
                  </label>
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
                </div>
              ) : (
                <p>Selecciona un bloque para editarlo.</p>
              )}
            </>
          ) : null}
        </aside>
      </section>
    </main>
  );
}
