import React, { useState, useEffect } from 'react';
const PagePreviewPanel = (props) => {
    if (props.model !== 'api::page.page' && props.model !== 'api::template.template')
        return null;
    const { documentId, model } = props;
    const [slug, setSlug] = useState('');
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        if (!documentId || model !== 'api::page.page')
            return;
        const fetchPage = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/pages/${documentId}`);
                if (res.ok) {
                    const json = await res.json();
                    if (json && json.data) {
                        setSlug(json.data.slug);
                    }
                }
            }
            catch (err) {
                console.error('Error fetching page details:', err);
            }
            finally {
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
            content: (React.createElement("div", { style: {
                    padding: '16px',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                } },
                React.createElement("div", { style: { fontSize: '13px', color: '#475569' } },
                    React.createElement("strong", null, "Estado:"),
                    " ",
                    documentId ? 'Plantilla guardada' : 'Plantilla nueva (guarda primero)'),
                documentId ? (React.createElement("a", { href: templateEditorUrl, target: "_blank", rel: "noopener noreferrer", style: {
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
                    } }, "\uD83C\uDFA8 Dise\u00F1ar / Editar Plantilla")) : (React.createElement("p", { style: { margin: 0, fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' } }, "Guarda este registro de plantilla primero para poder editarla visualmente en el lienzo."))))
        };
    }
    const editorUrl = `${frontendBase}/?page=${documentId}`;
    const previewUrl = slug ? `${frontendBase}/${slug}` : `${frontendBase}/inicio`;
    return {
        title: 'Previsualización y Editor',
        content: (React.createElement("div", { style: {
                padding: '16px',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                fontFamily: 'system-ui, -apple-system, sans-serif'
            } }, loading ? (React.createElement("p", { style: { margin: 0, fontSize: '13px', color: '#64748b' } }, "Cargando datos...")) : (React.createElement(React.Fragment, null,
            React.createElement("div", { style: { fontSize: '13px', color: '#475569' } },
                React.createElement("strong", null, "Estado:"),
                " ",
                documentId ? 'Página guardada' : 'Página nueva (guarda primero)'),
            documentId ? (React.createElement(React.Fragment, null,
                React.createElement("a", { href: previewUrl, target: "_blank", rel: "noopener noreferrer", style: {
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
                    } }, "\uD83D\uDC41\uFE0F Ver Previsualizaci\u00F3n"),
                React.createElement("a", { href: editorUrl, target: "_blank", rel: "noopener noreferrer", style: {
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
                    } }, "\u270F\uFE0F Abrir en Editor Visual"),
                React.createElement("div", { style: { marginTop: '8px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' } },
                    React.createElement("span", { style: { fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '6px' } }, "Vista previa r\u00E1pida:"),
                    React.createElement("div", { style: {
                            width: '100%',
                            height: '180px',
                            border: '1px solid #cbd5e1',
                            borderRadius: '4px',
                            overflow: 'hidden',
                            background: '#fff'
                        } },
                        React.createElement("iframe", { src: previewUrl, title: "Quick Preview", style: {
                                width: '600px',
                                height: '720px',
                                border: 'none',
                                transform: 'scale(0.25)',
                                transformOrigin: 'top left',
                                pointerEvents: 'none'
                            } }))))) : (React.createElement("p", { style: { margin: 0, fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' } }, "Guarda este documento primero para poder previsualizarlo y editarlo visualmente."))))))
    };
};
const config = {
    locales: [],
};
const bootstrap = (app) => {
    const contentManager = app.getPlugin('content-manager');
    if (contentManager && contentManager.apis && contentManager.apis.addEditViewSidePanel) {
        contentManager.apis.addEditViewSidePanel([PagePreviewPanel]);
    }
};
export default {
    config,
    bootstrap,
};
