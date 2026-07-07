import React, { useState, useEffect } from 'react';

const PagePreviewPanel = (props: any) => {
  if (props.model !== 'api::page.page' && props.model !== 'api::template.template') return null;

  const { documentId, model } = props;
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [referenceFileUrl, setReferenceFileUrl] = useState('');

  useEffect(() => {
    if (!documentId || model !== 'api::template.template') return;

    const fetchTemplateFile = async () => {
      try {
        const res = await fetch(`/api/templates/${documentId}?populate=referenceFile`);
        if (res.ok) {
          const json: any = await res.json();
          const file = json?.data?.referenceFile;
          if (file && file.url) {
            setReferenceFileUrl(file.url);
          }
        }
      } catch (err) {
        console.error('Error fetching template reference file:', err);
      }
    };
    fetchTemplateFile();
  }, [documentId, model]);

  useEffect(() => {
    if (!documentId || model !== 'api::page.page') return;

    const fetchPage = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/pages/${documentId}`);
        if (res.ok) {
          const json: any = await res.json();
          if (json && json.data) {
            setSlug(json.data.slug);
          }
        }
      } catch (err) {
        console.error('Error fetching page details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, [documentId, model]);

  const frontendBase = 'http://127.0.0.1:4321';

  if (model === 'api::template.template') {
    const templateEditorUrl = `${frontendBase}/?templateEdit=${documentId}`;
    return {
      title: 'Diseñador de Plantilla',
      content: (
        <div style={{
          padding: '16px',
          background: '#f8fafc',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{ fontSize: '13px', color: '#475569' }}>
            <strong>Estado:</strong> {documentId ? 'Plantilla guardada' : 'Plantilla nueva (guarda primero)'}
          </div>
          
          {documentId ? (
            <a
              href={templateEditorUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block',
                padding: '10px',
                textAlign: 'center',
                background: '#10b981',
                color: '#ffffff',
                textDecoration: 'none',
                fontWeight: 'bold',
                borderRadius: '6px',
                fontSize: '13px',
                boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)',
                transition: 'all 0.2s',
                cursor: 'pointer'
              }}
            >
              🎨 Diseñar / Editar Plantilla
            </a>
          ) : (
            <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>
              Guarda este registro de plantilla primero para poder editarla visualmente en el lienzo.
            </p>
          )}

          {referenceFileUrl && (
            <a
              href={referenceFileUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block',
                padding: '10px',
                textAlign: 'center',
                background: '#475569',
                color: '#ffffff',
                textDecoration: 'none',
                fontWeight: 'bold',
                borderRadius: '6px',
                fontSize: '13px',
                boxShadow: '0 2px 4px rgba(71, 85, 105, 0.2)',
                transition: 'all 0.2s',
                cursor: 'pointer'
              }}
            >
              📄 Ver HTML de referencia
            </a>
          )}
        </div>
      )
    };
  }

  const editorUrl = `${frontendBase}/?page=${documentId}`;
  const previewUrl = slug ? `${frontendBase}/${slug}` : `${frontendBase}/inicio`;

  return {
    title: 'Previsualización y Editor',
    content: (
      <div style={{
        padding: '16px',
        background: '#f8fafc',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        {loading ? (
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Cargando datos...</p>
        ) : (
          <>
            <div style={{ fontSize: '13px', color: '#475569' }}>
              <strong>Estado:</strong> {documentId ? 'Página guardada' : 'Página nueva (guarda primero)'}
            </div>
            
            {documentId ? (
              <>
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'block',
                    padding: '10px',
                    textAlign: 'center',
                    background: '#0057b8',
                    color: '#ffffff',
                    textDecoration: 'none',
                    fontWeight: 'bold',
                    borderRadius: '6px',
                    fontSize: '13px',
                    boxShadow: '0 2px 4px rgba(0, 87, 184, 0.2)',
                    transition: 'all 0.2s'
                  }}
                >
                  👁️ Ver Previsualización
                </a>
                
                <a
                  href={editorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'block',
                    padding: '10px',
                    textAlign: 'center',
                    background: '#f39200',
                    color: '#ffffff',
                    textDecoration: 'none',
                    fontWeight: 'bold',
                    borderRadius: '6px',
                    fontSize: '13px',
                    boxShadow: '0 2px 4px rgba(243, 146, 0, 0.2)',
                    transition: 'all 0.2s'
                  }}
                >
                  ✏️ Abrir en Editor Visual
                </a>
                
                <div style={{ marginTop: '8px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '6px' }}>Vista previa rápida:</span>
                  <div style={{
                    width: '100%',
                    height: '180px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    background: '#fff'
                  }}>
                    <iframe
                      src={previewUrl}
                      title="Quick Preview"
                      style={{
                        width: '600px',
                        height: '720px',
                        border: 'none',
                        transform: 'scale(0.25)',
                        transformOrigin: 'top left',
                        pointerEvents: 'none'
                      }}
                    />
                  </div>
                </div>
              </>
            ) : (
              <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>
                Guarda este documento primero para poder previsualizarlo y editarlo visualmente.
              </p>
            )}
          </>
        )}
      </div>
    )
  };
};

const config = {
  locales: [],
};

const bootstrap = (app: any) => {
  const contentManager = app.getPlugin('content-manager');
  if (contentManager && contentManager.apis && contentManager.apis.addEditViewSidePanel) {
    contentManager.apis.addEditViewSidePanel([PagePreviewPanel]);
  }
};

export default {
  config,
  bootstrap,
};
