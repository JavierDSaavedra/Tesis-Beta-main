import React, { useState, useEffect } from 'react';
import { defaultStyle, UBB_BRANDING } from './constants';
import { DRIVE_API_KEY, extractDriveFolderId, fetchDriveFolderImages } from './drive';

export function blockToHtml(block) {
  const style = block.style || defaultStyle;
  const containerStyle = `position:absolute;left:${style.x}px;top:${style.y}px;width:${style.width}px;height:${style.height}px;padding:${style.padding}px;background:${style.background};color:${style.color};text-align:${style.align};border-radius:${style.radius}px;overflow:hidden;box-sizing:border-box;font-family:${style.fontFamily || UBB_BRANDING.typography.fontFamily}`;

  if (block.type === 'navbar') {
    return `<section style="position:absolute;left:${style.x}px;top:${style.y}px;width:${style.width}px;height:${style.height}px;padding:0 20px;background:${style.background};color:${style.color};border-radius:${style.radius}px;box-sizing:border-box;display:flex;align-items:center;justify-content:space-between;font-family:${style.fontFamily || UBB_BRANDING.typography.fontFamily}"><div style="display:flex;align-items:center;gap:10px"><div style="width:40px;height:40px;background:#ffffff;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#0057b8;font-weight:bold;font-size:18px">U</div><span style="font-size:${style.titleSize}px;font-weight:bold">${block.title}</span></div><div style="display:flex;gap:15px;font-size:${style.textSize}px;font-weight:500"><span>Sedes</span><span>Portal</span><span>Contacto</span></div></section>`;
  }

  if (block.type === 'news_grid') {
    const metadata = block.metadata || {};
    const items = metadata.items || [];
    const itemsHtml = items.map((item) => `
      <div style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 4px rgba(0,0,0,0.05);display:flex;flex-direction:column;color:#22252a;box-sizing:border-box">
        <img src="${item.image}" alt="${item.title}" style="width:100%;height:120px;object-fit:cover"/>
        <div style="padding:10px;display:flex;flex-direction:column;gap:6px;flex:1;justify-content:space-between">
          <h4 style="margin:0;font-size:12px;font-weight:700;line-height:1.3">${item.title}</h4>
          <span style="font-size:10px;color:#0057b8;font-weight:bold">Leer más →</span>
        </div>
      </div>
    `).join('');
    return `<section style="${containerStyle};display:flex;flex-direction:column;gap:16px"><div><h2 style="margin:0;font-size:${style.titleSize}px;font-weight:700">${block.title}</h2><p style="margin:4px 0 0;font-size:${style.textSize}px;opacity:0.8">${block.subtitle}</p></div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;flex:1">${itemsHtml}</div></section>`;
  }

  if (block.type === 'footer') {
    return `<section style="${containerStyle};display:flex;flex-direction:column;justify-content:center;gap:10px"><div style="display:flex;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:10px"><strong style="font-size:${style.titleSize}px">${block.title}</strong><span style="font-size:12px;opacity:0.7">Acreditada • Pública</span></div><p style="margin:0;font-size:${style.textSize}px;opacity:0.8">${block.subtitle}</p></section>`;
  }

  if (block.type === 'rich_article') {
    const metadata = block.metadata || {};
    const paragraphs = metadata.paragraphs || [];
    const paragraphsHtml = paragraphs.map((para) => `<p style="margin:0">${para}</p>`).join('');
    return `<section style="${containerStyle};overflow-y:auto;display:flex;flex-direction:column;gap:16px"><div><span style="font-size:11px;text-transform:uppercase;color:#0057b8;font-weight:bold;letter-spacing:0.8px">Noticias UBB</span><h1 style="margin:6px 0 0;font-size:${style.titleSize}px;font-weight:700;line-height:1.25">${block.title}</h1><p style="margin:8px 0 0;font-size:12px;opacity:0.7;font-style:italic">${block.subtitle}</p></div><hr style="border:0;border-top:1px solid #e2e8f0;margin:0"/><div style="display:flex;flex-direction:column;gap:12px;font-size:${style.textSize}px;line-height:1.6;text-align:justify">${paragraphsHtml}</div></section>`;
  }

  if (block.type === 'image') {
    return `<section style="${containerStyle}"><img src="${block.title}" alt="${block.subtitle}" style="width:100%;height:calc(100% - 26px);object-fit:cover;border-radius:${style.radius}px"/><p style="margin:8px 0 0;font-size:${style.textSize}px">${block.subtitle}</p></section>`;
  }

  if (block.type === 'button') {
    return `<section style="position:absolute;left:${style.x}px;top:${style.y}px;width:${style.width}px;height:${style.height}px;display:flex;align-items:center;justify-content:${style.align === 'left' ? 'flex-start' : style.align === 'right' ? 'flex-end' : 'center'};box-sizing:border-box"><a href="${block.subtitle || '#'}" style="display:inline-block;padding:${style.padding ?? 12}px ${(style.padding ?? 12) * 1.6}px;background:${style.background};color:${style.color};border-radius:${style.radius}px;text-decoration:none;font-size:${style.titleSize}px;font-weight:600;white-space:nowrap">${block.title}</a></section>`;
  }

  if (block.type === 'program_header') {
    const metadata = block.metadata || {};
    return `<section style="${containerStyle}"><h1 style="margin:0;font-size:${style.titleSize}px;font-weight:700">${block.title}</h1><p style="margin:8px 0 0;font-size:${style.textSize}px;font-weight:500">${block.subtitle}</p><p style="margin:6px 0 0;font-size:12px;opacity:0.8">${metadata.level} • ${metadata.duration} • ${metadata.coordinator}</p></section>`;
  }

  if (block.type === 'congress_event') {
    const metadata = block.metadata || {};
    return `<section style="${containerStyle}"><h2 style="margin:0;font-size:${style.titleSize}px;font-weight:700">${block.title}</h2><p style="margin:10px 0;font-size:${style.textSize}px">${block.subtitle}</p><p style="margin:8px 0 0;font-size:12px"><strong>Fecha:</strong> ${metadata.date}</p><p style="margin:4px 0 0;font-size:12px"><strong>Ubicación:</strong> ${metadata.location}</p></section>`;
  }

  if (block.type === 'news_item') {
    const metadata = block.metadata || {};
    const dateStr = metadata.date ? new Date(metadata.date).toLocaleDateString('es-ES') : '';
    return `<section style="${containerStyle}"><img src="${metadata.image}" alt="${block.title}" style="width:100%;height:calc(100% - 60px);object-fit:cover;border-radius:${style.radius}px"/><h3 style="margin:8px 0 0;font-size:${style.titleSize}px;font-weight:600">${block.title}</h3><p style="margin:4px 0 0;font-size:11px;color:#666">${dateStr} • ${metadata.category || 'General'}</p></section>`;
  }

  if (block.type === 'contact_info') {
    const metadata = block.metadata || {};
    return `<section style="${containerStyle}"><h2 style="margin:0;font-size:${style.titleSize}px">${block.title}</h2><p style="margin:8px 0;font-size:${style.textSize}px">${metadata.phone || ''}</p><p style="margin:4px 0;font-size:${style.textSize}px">${metadata.email || ''}</p><p style="margin:4px 0;font-size:12px;opacity:0.9">${metadata.address || ''}</p></section>`;
  }

  if (block.type === 'archive_list') {
    const metadata = block.metadata || {};
    const items = metadata.items || [];
    const itemsHtml = items.map((item) => `
      <div style="border-top:3px solid ${UBB_BRANDING.colors.secondary};padding:10px 0;margin-top:12px">
        <p style="margin:0;font-size:13px;font-weight:700;line-height:1.35">${item.title}</p>
        ${item.date ? `<span style="font-size:11px;opacity:0.7">Publicado el ${item.date}</span>` : ''}
      </div>
    `).join('');
    return `<section style="${containerStyle};overflow-y:auto"><h2 style="margin:0;font-size:${style.titleSize}px;text-transform:uppercase;letter-spacing:0.5px">${block.title}</h2>${block.subtitle ? `<p style="margin:8px 0 0;font-size:${style.textSize}px;opacity:0.8">${block.subtitle}</p>` : ''}<div>${itemsHtml}</div></section>`;
  }

  if (block.type === 'curriculum') {
    return `<section style="${containerStyle}"><h2 style="margin:0;font-size:${style.titleSize}px">${block.title}</h2><p style="margin:8px 0 0;font-size:${style.textSize}px">${block.subtitle}</p></section>`;
  }

  if (block.type === 'drive_carousel') {
    const metadata = block.metadata || {};
    const folderId = extractDriveFolderId(metadata.driveFolderId || '');
    const filenames = metadata.images || [];
    const containerId = `pb-carousel-${block.id || Math.random().toString(36).slice(2)}`;

    return `<section id="${containerId}" style="${containerStyle}">
      <div class="pb-carousel-viewport" style="position:relative;width:100%;height:100%;background:#0f172a">
        <img class="pb-carousel-img" style="width:100%;height:100%;object-fit:cover;display:block" alt="${block.title || ''}" />
        <div class="pb-carousel-empty" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#cbd5e1;font-size:13px;text-align:center;padding:16px;box-sizing:border-box">Cargando galería...</div>
        <button class="pb-carousel-prev" type="button" aria-label="Anterior" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);width:36px;height:36px;border:none;border-radius:50%;background:rgba(15,23,42,0.55);color:#fff;font-size:16px;cursor:pointer">&#8249;</button>
        <button class="pb-carousel-next" type="button" aria-label="Siguiente" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);width:36px;height:36px;border:none;border-radius:50%;background:rgba(15,23,42,0.55);color:#fff;font-size:16px;cursor:pointer">&#8250;</button>
        <div class="pb-carousel-dots" style="position:absolute;bottom:10px;left:0;right:0;display:flex;justify-content:center;gap:6px"></div>
        ${block.title ? `<div style="position:absolute;top:0;left:0;right:0;padding:10px 14px;background:linear-gradient(180deg,rgba(15,23,42,0.65),transparent);color:#fff;font-size:${style.titleSize}px;font-weight:700">${block.title}</div>` : ''}
      </div>
    </section>
    <script>(function(){
      var root = document.getElementById(${JSON.stringify(containerId)});
      if (!root) return;
      var apiKey = ${JSON.stringify(DRIVE_API_KEY)};
      var folderId = ${JSON.stringify(folderId)};
      var names = ${JSON.stringify(filenames)};
      var img = root.querySelector('.pb-carousel-img');
      var empty = root.querySelector('.pb-carousel-empty');
      var dots = root.querySelector('.pb-carousel-dots');
      var urls = [];
      var index = 0;
      var timer = null;

      function renderDots() {
        dots.innerHTML = '';
        urls.forEach(function (_, i) {
          var dot = document.createElement('span');
          dot.style.cssText = 'width:7px;height:7px;border-radius:50%;background:' + (i === index ? '#ffffff' : 'rgba(255,255,255,0.45)') + ';cursor:pointer;display:inline-block';
          dot.addEventListener('click', function () { index = i; show(); });
          dots.appendChild(dot);
        });
      }

      function show() {
        if (!urls.length) return;
        img.src = urls[index];
        renderDots();
      }

      function next() { index = (index + 1) % urls.length; show(); }
      function prev() { index = (index - 1 + urls.length) % urls.length; show(); }

      root.querySelector('.pb-carousel-next').addEventListener('click', next);
      root.querySelector('.pb-carousel-prev').addEventListener('click', prev);

      if (!apiKey || !folderId || !names.length) {
        empty.textContent = 'Configura la carpeta de Drive y los nombres de imagen en el editor.';
        return;
      }

      var query = encodeURIComponent("'" + folderId + "' in parents and trashed = false");
      fetch('https://www.googleapis.com/drive/v3/files?q=' + query + '&key=' + apiKey + '&fields=files(id,name)&pageSize=1000')
        .then(function (res) { return res.json(); })
        .then(function (data) {
          var files = (data && data.files) || [];
          urls = names.map(function (name) {
            var match = files.find(function (f) { return f.name === name; });
            return match ? ('https://drive.google.com/thumbnail?id=' + match.id + '&sz=w1600') : null;
          }).filter(Boolean);
          if (!urls.length) {
            empty.textContent = 'No se encontraron imágenes con esos nombres en la carpeta de Drive.';
            return;
          }
          empty.style.display = 'none';
          show();
          if (urls.length > 1) {
            timer = setInterval(next, 4000);
          }
        })
        .catch(function () {
          empty.textContent = 'No se pudo conectar con Google Drive.';
        });
    })();</script>`;
  }

  // Default rendering for text and hero blocks
  return `<section style="${containerStyle}"><h2 style="margin:0;font-size:${style.titleSize}px;font-weight:700">${block.title}</h2><p style="margin:10px 0 0;font-size:${style.textSize}px">${block.subtitle}</p></section>`;
}

export function renderBlock(block) {
  const style = block.style || defaultStyle;
  const sectionStyle = {
    background: style.background,
    color: style.color,
    textAlign: style.align,
    padding: `${style.padding}px`,
    borderRadius: `${style.radius}px`,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    fontFamily: style.fontFamily || UBB_BRANDING.typography.fontFamily,
    boxSizing: 'border-box',
  };

  if (block.type === 'image') {
    return (
      <section className="pb-block" style={sectionStyle}>
        <img
          src={block.title}
          alt={block.subtitle || 'Imagen'}
          loading="lazy"
          style={{ borderRadius: `${style.radius}px`, width: '100%', height: 'calc(100% - 28px)', objectFit: 'cover' }}
        />
        <p style={{ fontSize: `${style.textSize}px`, margin: '8px 0 0 0' }}>{block.subtitle}</p>
      </section>
    );
  }

  if (block.type === 'button') {
    return (
      <section 
        className="pb-block pb-button-wrap" 
        style={{ 
          width: '100%', 
          height: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: style.align === 'left' ? 'flex-start' : style.align === 'right' ? 'flex-end' : 'center',
          boxSizing: 'border-box',
          overflow: 'visible'
        }}
      >
        <a
          className="pb-button"
          style={{
            background: style.background,
            color: style.color,
            borderRadius: `${style.radius}px`,
            fontSize: `${style.titleSize}px`,
            padding: `${style.padding ?? 12}px ${(style.padding ?? 12) * 1.6}px`,
            display: 'inline-block',
            textAlign: 'center',
            textDecoration: 'none',
            whiteSpace: 'nowrap'
          }}
          href={block.subtitle || '#'}
          onClick={(event) => event.preventDefault()}
        >
          {block.title}
        </a>
      </section>
    );
  }

  if (block.type === 'program_header') {
    const metadata = block.metadata || {};
    return (
      <section className="pb-block pb-program-header" style={sectionStyle}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: `${style.titleSize}px`, fontWeight: '700' }}>
          {block.title}
        </h1>
        <p style={{ margin: '0 0 6px 0', fontSize: `${style.textSize}px`, fontWeight: '500' }}>
          {block.subtitle}
        </p>
        <div style={{ fontSize: '12px', opacity: 0.8 }}>
          <span>{metadata.level} • </span>
          <span>{metadata.duration} • </span>
          <span>{metadata.coordinator}</span>
        </div>
      </section>
    );
  }

  if (block.type === 'congress_event') {
    const metadata = block.metadata || {};
    return (
      <section className="pb-block pb-congress-event" style={sectionStyle}>
        <h2 style={{ margin: '0 0 10px 0', fontSize: `${style.titleSize}px`, fontWeight: '700' }}>
          {block.title}
        </h2>
        <p style={{ margin: '0 0 10px 0', fontSize: `${style.textSize}px` }}>
          {block.subtitle}
        </p>
        <div style={{ fontSize: '12px' }}>
          <p style={{ margin: '4px 0' }}><strong>Fecha:</strong> {metadata.date}</p>
          <p style={{ margin: '0' }}><strong>Ubicación:</strong> {metadata.location}</p>
        </div>
      </section>
    );
  }

  if (block.type === 'news_item') {
    const metadata = block.metadata || {};
    const dateStr = metadata.date ? new Date(metadata.date).toLocaleDateString('es-ES') : '';
    return (
      <section className="pb-block pb-news-item" style={sectionStyle}>
        <img
          src={metadata.image || 'https://picsum.photos/300/200'}
          alt={block.title}
          loading="lazy"
          style={{ width: '100%', height: 'calc(100% - 60px)', objectFit: 'cover', borderRadius: `${style.radius}px` }}
        />
        <h3 style={{ margin: '8px 0 4px 0', fontSize: `${style.titleSize}px`, fontWeight: '600' }}>
          {block.title}
        </h3>
        <p style={{ margin: '0', fontSize: '11px', opacity: 0.7 }}>
          {dateStr} • {metadata.category || 'General'}
        </p>
      </section>
    );
  }

  if (block.type === 'contact_info') {
    const metadata = block.metadata || {};
    return (
      <section className="pb-block pb-contact-info" style={sectionStyle}>
        <h2 style={{ margin: '0 0 12px 0', fontSize: `${style.titleSize}px`, fontWeight: '700' }}>
          {block.title}
        </h2>
        <div style={{ fontSize: `${style.textSize}px` }}>
          {metadata.phone && <p style={{ margin: '0 0 4px 0' }}><strong>Teléfono:</strong> {metadata.phone}</p>}
          {metadata.email && <p style={{ margin: '0 0 4px 0' }}><strong>Email:</strong> {metadata.email}</p>}
          {metadata.address && <p style={{ margin: '0 0 4px 0' }}><strong>Ubicación:</strong> {metadata.address}</p>}
          {metadata.hours && <p style={{ margin: '0' }}><strong>Horario:</strong> {metadata.hours}</p>}
        </div>
      </section>
    );
  }

  if (block.type === 'archive_list') {
    const metadata = block.metadata || {};
    const items = metadata.items || [];
    return (
      <section className="pb-block pb-archive" style={{ ...sectionStyle, overflowY: 'auto' }}>
        <h2 style={{ margin: '0 0 8px 0', fontSize: `${style.titleSize}px`, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {block.title}
        </h2>
        {block.subtitle && <p style={{ margin: '0', fontSize: `${style.textSize}px`, opacity: 0.8 }}>{block.subtitle}</p>}
        {items.length > 0 && (
          <div>
            {items.map((item, i) => (
              <div key={i} style={{ borderTop: `3px solid ${UBB_BRANDING.colors.secondary}`, padding: '10px 0', marginTop: '12px' }}>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', lineHeight: 1.35 }}>{item.title}</p>
                {item.date && <span style={{ fontSize: '11px', opacity: 0.7 }}>Publicado el {item.date}</span>}
              </div>
            ))}
          </div>
        )}
      </section>
    );
  }

  if (block.type === 'curriculum') {
    const metadata = block.metadata || {};
    return (
      <section className="pb-block pb-curriculum" style={sectionStyle}>
        <h2 style={{ margin: '0 0 8px 0', fontSize: `${style.titleSize}px`, fontWeight: '700' }}>
          {block.title}
        </h2>
        <p style={{ margin: '0 0 12px 0', fontSize: `${style.textSize}px` }}>{block.subtitle}</p>
        <div style={{ fontSize: '12px' }}>
          <strong>Semestres:</strong> {metadata.semesters || 4}
          <br />
          <strong>Créditos totales:</strong> {metadata.totalCredits || 120}
        </div>
      </section>
    );
  }

  if (block.type === 'navbar') {
    return (
      <section className="pb-block" style={{ ...sectionStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '40px', height: '40px', background: '#ffffff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0057b8', fontWeight: 'bold', fontSize: '18px' }}>U</div>
          <span style={{ fontSize: `${style.titleSize}px`, fontWeight: 'bold' }}>{block.title}</span>
        </div>
        <div style={{ display: 'flex', gap: '15px', fontSize: `${style.textSize}px`, fontWeight: '500' }}>
          <span>Sedes</span>
          <span>Portal</span>
          <span>Contacto</span>
        </div>
      </section>
    );
  }

  if (block.type === 'news_grid') {
    const metadata = block.metadata || {};
    const items = metadata.items || [];
    return (
      <section className="pb-block" style={{ ...sectionStyle, display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: `${style.titleSize}px`, fontWeight: '700' }}>{block.title}</h2>
          <p style={{ margin: '4px 0 0', fontSize: `${style.textSize}px`, opacity: 0.8 }}>{block.subtitle}</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', flex: 1 }}>
          {items.map((item, index) => (
            <div key={index} style={{ background: '#ffffff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', color: '#22252a' }}>
              <img src={item.image} alt={item.title} style={{ width: '100%', height: '120px', objectFit: 'cover' }} />
              <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, justifyContent: 'space-between' }}>
                <h4 style={{ margin: 0, fontSize: '12px', fontWeight: '700', lineHeight: 1.3 }}>{item.title}</h4>
                <span style={{ fontSize: '10px', color: '#0057b8', fontWeight: 'bold' }}>Leer más →</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (block.type === 'footer') {
    return (
      <section className="pb-block" style={{ ...sectionStyle, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '10px', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
          <strong style={{ fontSize: `${style.titleSize}px` }}>{block.title}</strong>
          <span style={{ fontSize: '12px', opacity: 0.7 }}>Acreditada • Pública</span>
        </div>
        <p style={{ margin: 0, fontSize: `${style.textSize}px`, opacity: 0.8 }}>{block.subtitle}</p>
      </section>
    );
  }

  if (block.type === 'rich_article') {
    const metadata = block.metadata || {};
    const paragraphs = metadata.paragraphs || [];
    return (
      <section className="pb-block" style={{ ...sectionStyle, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#0057b8', fontWeight: 'bold', letterSpacing: '0.8px' }}>Noticias UBB</span>
          <h1 style={{ margin: '6px 0 0', fontSize: `${style.titleSize}px`, fontWeight: '700', lineHeight: 1.25 }}>{block.title}</h1>
          <p style={{ margin: '8px 0 0', fontSize: '12px', opacity: 0.7, fontStyle: 'italic' }}>{block.subtitle}</p>
        </div>
        <hr style={{ border: 0, borderTop: '1px solid var(--ubb-line)', margin: 0 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: `${style.textSize}px`, lineHeight: 1.6, textAlign: 'justify' }}>
          {paragraphs.map((para, idx) => (
            <p key={idx} style={{ margin: 0 }}>{para}</p>
          ))}
        </div>
      </section>
    );
  }

  if (block.type === 'drive_carousel') {
    return <DriveCarouselBlock key={block.id} block={block} style={style} sectionStyle={sectionStyle} />;
  }

  const headingClass = block.type === 'hero' ? 'pb-title-hero' : 'pb-title-default';

  return (
    <section className="pb-block" style={sectionStyle}>
      <h2 className={headingClass} style={{ margin: '0 0 10px 0', fontSize: `${style.titleSize}px`, fontWeight: '700' }}>
        {block.title}
      </h2>
      <p style={{ margin: '0', fontSize: `${style.textSize}px` }}>{block.subtitle}</p>
    </section>
  );
}

function DriveCarouselBlock({ block, style, sectionStyle }) {
  const metadata = block.metadata || {};
  const folderId = extractDriveFolderId(metadata.driveFolderId || '');
  const filenames = metadata.images || [];
  const [images, setImages] = useState([]);
  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    let cancelled = false;
    setIndex(0);

    if (!DRIVE_API_KEY || !folderId || filenames.length === 0) {
      setStatus('idle');
      setImages([]);
      return undefined;
    }

    setStatus('loading');
    fetchDriveFolderImages({ folderId, apiKey: DRIVE_API_KEY, filenames })
      .then((resolved) => {
        if (cancelled) return;
        setImages(resolved);
        setStatus(resolved.length ? 'ready' : 'empty');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folderId, JSON.stringify(filenames)]);

  useEffect(() => {
    if (status !== 'ready' || images.length < 2) return undefined;
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % images.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [status, images.length]);

  const goTo = (nextIndex) => setIndex((nextIndex + images.length) % images.length);

  return (
    <section className="pb-block" style={{ ...sectionStyle, padding: 0, position: 'relative', background: '#0f172a' }}>
      {status === 'ready' && images.length > 0 ? (
        <img
          src={images[index].url}
          alt={block.title || ''}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#cbd5e1',
            fontSize: '13px',
            textAlign: 'center',
            padding: '16px',
            boxSizing: 'border-box',
          }}
        >
          {status === 'idle' && 'Configura la carpeta de Drive y los nombres de imagen en el panel de Bloque.'}
          {status === 'loading' && 'Cargando galería...'}
          {status === 'empty' && 'No se encontraron imágenes con esos nombres en la carpeta de Drive.'}
          {status === 'error' && 'No se pudo conectar con Google Drive. Revisa la API Key y los permisos de la carpeta.'}
        </div>
      )}

      {block.title && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            padding: '10px 14px',
            background: 'linear-gradient(180deg, rgba(15,23,42,0.65), transparent)',
            color: '#fff',
            fontSize: `${style.titleSize}px`,
            fontWeight: 700,
          }}
        >
          {block.title}
        </div>
      )}

      {status === 'ready' && images.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Anterior"
            onClick={() => goTo(index - 1)}
            style={{
              position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
              width: 36, height: 36, borderRadius: '50%', border: 'none',
              background: 'rgba(15,23,42,0.55)', color: '#fff', fontSize: 16, cursor: 'pointer',
            }}
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Siguiente"
            onClick={() => goTo(index + 1)}
            style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              width: 36, height: 36, borderRadius: '50%', border: 'none',
              background: 'rgba(15,23,42,0.55)', color: '#fff', fontSize: 16, cursor: 'pointer',
            }}
          >
            ›
          </button>
          <div style={{ position: 'absolute', bottom: 10, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '6px' }}>
            {images.map((img, i) => (
              <span
                key={img.name}
                onClick={() => goTo(i)}
                style={{
                  width: 7, height: 7, borderRadius: '50%', cursor: 'pointer',
                  background: i === index ? '#ffffff' : 'rgba(255,255,255,0.45)',
                }}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
