// ============================================================
// STORAGE OFFLINE (IndexedDB) — informes e items de normativa
// ============================================================
const DB_NAME = 'hys_inspecciones';
const DB_VERSION = 2;
let dbPromise = null;

function abrirDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('informes')) {
        db.createObjectStore('informes', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('normativa')) {
        db.createObjectStore('normativa', { keyPath: 'clave' });
      }
      if (!db.objectStoreNames.contains('borradores')) {
        db.createObjectStore('borradores', { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function guardarInforme(informe) {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('informes', 'readwrite');
    tx.objectStore('informes').put(informe);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function listarInformes() {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('informes', 'readonly');
    const req = tx.objectStore('informes').getAll();
    req.onsuccess = () => resolve(req.result.sort((a, b) => b.creadoEn - a.creadoEn));
    req.onerror = () => reject(req.error);
  });
}

async function borrarInforme(id) {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('informes', 'readwrite');
    tx.objectStore('informes').delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function guardarNormativa(clave, valor) {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('normativa', 'readwrite');
    tx.objectStore('normativa').put({ clave, ...valor });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function leerNormativaCompleta() {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('normativa', 'readonly');
    const req = tx.objectStore('normativa').getAll();
    req.onsuccess = () => {
      const mapa = {};
      req.result.forEach(r => { mapa[r.clave] = r; });
      resolve(mapa);
    };
    req.onerror = () => reject(req.error);
  });
}

// ============================================================
// ESTADO EN MEMORIA DEL BORRADOR ACTUAL
// ============================================================
let borrador = null;

function nuevoBorrador() {
  return {
    id: 'insp_' + Date.now(),
    creadoEn: Date.now(),
    generales: {},
    itemsEstado: {},        // clave: `${seccionId}||${item}` -> estado
    itemsDetalle: {},       // clave: `${seccionId}||${item}` -> texto (situación cuando no es CONFORME)
    itemsFotos: {},         // clave: `${seccionId}||${item}` -> array de fotos (dataURL comprimido)
    observacionesSeccion: {}, // clave: seccionId -> texto
    correspondeSeccion: {},   // clave: seccionId -> 'SI' | 'NO APLICA' (para secciones condicionales)
    hallazgos: [],           // array de objetos hallazgo
    resultadoGeneral: '',
    resumenGeneral: '',
    aspectosPositivos: '',
    accionesRecomendadas: '',
    conclusion: ''
  };
}

function claveItem(seccionId, item) { return seccionId + '||' + item; }

// ============================================================
// RENDER DEL FORMULARIO
// ============================================================
function render() {
  const app = document.getElementById('app');
  app.innerHTML = '';
  app.appendChild(renderDatosGenerales());
  ESTRUCTURA.forEach(bloque => app.appendChild(renderSeccion(bloque)));
  app.appendChild(renderHallazgos());
  app.appendChild(renderConclusion());
  app.appendChild(renderAcciones());
  guardarBorradorLocal();
}

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

function renderDatosGenerales() {
  const card = el('section', 'card');
  card.appendChild(el('h2', 'card-title', 'Datos generales'));
  CAMPOS_GENERALES.forEach(campo => {
    const wrap = el('label', 'field');
    wrap.appendChild(el('span', 'field-label', campo.label + (campo.requerido ? ' *' : '')));
    const input = document.createElement('input');
    input.type = campo.tipo;
    input.value = borrador.generales[campo.id] || '';
    input.addEventListener('input', () => {
      borrador.generales[campo.id] = input.value;
      guardarBorradorLocal();
    });
    wrap.appendChild(input);
    card.appendChild(wrap);
  });

  const resWrap = el('label', 'field');
  resWrap.appendChild(el('span', 'field-label', 'Resultado general de la inspección'));
  const resSelect = document.createElement('select');
  ['', 'FAVORABLE', 'FAVORABLE CON OBSERVACIONES', 'NO FAVORABLE'].forEach(v => {
    const opt = document.createElement('option');
    opt.value = v; opt.textContent = v || '(sin definir)';
    if (borrador.resultadoGeneral === v) opt.selected = true;
    resSelect.appendChild(opt);
  });
  resSelect.addEventListener('change', () => { borrador.resultadoGeneral = resSelect.value; guardarBorradorLocal(); });
  resWrap.appendChild(resSelect);
  card.appendChild(resWrap);

  card.appendChild(renderTextarea('Resumen general de la inspección', borrador.resumenGeneral, v => { borrador.resumenGeneral = v; }));
  return card;
}

function renderTextarea(label, valor, onChange) {
  const wrap = el('label', 'field');
  wrap.appendChild(el('span', 'field-label', label));
  const ta = document.createElement('textarea');
  ta.rows = 3;
  ta.value = valor || '';
  ta.addEventListener('input', () => { onChange(ta.value); guardarBorradorLocal(); });
  wrap.appendChild(ta);
  return wrap;
}

function renderSeccion(bloque) {
  const card = el('section', 'card');
  card.appendChild(el('h2', 'card-title', bloque.seccion));

  if (bloque.condicional) {
    const wrap = el('label', 'field');
    wrap.appendChild(el('span', 'field-label', bloque.preguntaCorresponde));
    const sel = document.createElement('select');
    ['SI', 'NO APLICA'].forEach(v => {
      const opt = document.createElement('option');
      opt.value = v; opt.textContent = v === 'SI' ? 'Sí, corresponde' : 'No aplica en esta visita';
      if ((borrador.correspondeSeccion[bloque.id] || 'SI') === v) opt.selected = true;
      sel.appendChild(opt);
    });
    sel.addEventListener('change', () => {
      borrador.correspondeSeccion[bloque.id] = sel.value;
      guardarBorradorLocal();
      render();
    });
    wrap.appendChild(sel);
    card.appendChild(wrap);
    if ((borrador.correspondeSeccion[bloque.id] || 'SI') === 'NO APLICA') {
      card.appendChild(el('p', 'muted', 'Esta sección no se incluirá en el informe.'));
      return card;
    }
  }

  bloque.items.forEach(item => {
    const clave = claveItem(bloque.id, item);
    const row = el('div', 'item-row');
    row.appendChild(el('span', 'item-label', item));
    const selWrap = el('div', 'item-estados');
    ESTADOS.forEach(estado => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'estado-btn estado-' + estado.split(' ')[0].replace('/', '');
      btn.textContent = estadoCorto(estado);
      if (borrador.itemsEstado[clave] === estado) btn.classList.add('activo');
      btn.addEventListener('click', () => {
        borrador.itemsEstado[clave] = estado;
        guardarBorradorLocal();
        render();
      });
      selWrap.appendChild(btn);
    });
    row.appendChild(selWrap);

    // Fotos disponibles para CUALQUIER ítem (conforme o no), para dejar registro visual del relevamiento
    if (!borrador.itemsFotos[clave]) borrador.itemsFotos[clave] = [];
    const fotosBox = el('div', 'fotos-item-box');
    fotosBox.appendChild(el('span', 'field-label foto-label', 'Fotos del ítem (opcional)'));
    fotosBox.appendChild(renderCapturaFotos(borrador.itemsFotos[clave], () => { guardarBorradorLocal(); render(); }));
    row.appendChild(fotosBox);

    const estadoActual = borrador.itemsEstado[clave];
    if (estadoActual && estadoActual !== 'CONFORME') {
      const textos = DETALLE_TEXTOS[estadoActual] || { label: 'Situación encontrada', placeholder: 'Describí la situación encontrada...' };
      const detalleWrap = el('div', 'field detalle-field');
      detalleWrap.appendChild(el('span', 'field-label', textos.label));
      const ta = document.createElement('textarea');
      ta.rows = 2;
      ta.placeholder = textos.placeholder;
      ta.value = borrador.itemsDetalle[clave] || '';
      ta.addEventListener('input', () => {
        borrador.itemsDetalle[clave] = ta.value;
        guardarBorradorLocal();
      });
      detalleWrap.appendChild(ta);
      row.appendChild(detalleWrap);
    }

    card.appendChild(row);
  });

  card.appendChild(renderTextarea('Observaciones de la sección', borrador.observacionesSeccion[bloque.id],
    v => { borrador.observacionesSeccion[bloque.id] = v; }));

  return card;
}

function estadoCorto(estado) {
  return { 'CONFORME': 'OK', 'NO CONFORME': 'NC', 'OBSERVACIÓN / MEJORA': 'OBS', 'NO APLICA': 'N/A', 'NO SE PUDO VERIFICAR': 'S/V' }[estado] || estado;
}

const DETALLE_TEXTOS = {
  'NO CONFORME': { label: 'Motivo de la no conformidad', placeholder: 'Describí qué se encontró y por qué no cumple...' },
  'OBSERVACIÓN / MEJORA': { label: 'Detalle de la observación / mejora sugerida', placeholder: 'Describí la observación y la mejora sugerida...' },
  'NO APLICA': { label: 'Motivo por el cual no aplica', placeholder: 'Explicá por qué este punto no aplica en este establecimiento...' },
  'NO SE PUDO VERIFICAR': { label: 'Motivo por el cual no se pudo verificar', placeholder: 'Explicá qué impidió verificar este punto...' }
};

// ============================================================
// FOTOS: compresión + widget de cámara reutilizable
// ============================================================
function comprimirImagenDesdeArchivo(file, maxAncho, calidad) {
  maxAncho = maxAncho || 1000;
  calidad = calidad || 0.6;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let w = img.naturalWidth, h = img.naturalHeight;
        if (w > maxAncho) { h = Math.round(h * (maxAncho / w)); w = maxAncho; }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', calidad));
      };
      img.onerror = () => reject(new Error('No se pudo leer la imagen'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

// fotos: array de dataURL (se muta in-place). onCambio: callback tras agregar/borrar.
function renderCapturaFotos(fotos, onCambio) {
  const wrap = el('div', 'fotos-wrap');

  if (fotos.length > 0) {
    const grid = el('div', 'fotos-grid');
    fotos.forEach((dataUrl, idx) => {
      const thumb = el('div', 'foto-thumb');
      const img = document.createElement('img');
      img.src = dataUrl;
      thumb.appendChild(img);
      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'foto-del';
      delBtn.textContent = '✕';
      delBtn.addEventListener('click', () => {
        fotos.splice(idx, 1);
        onCambio();
      });
      thumb.appendChild(delBtn);
      grid.appendChild(thumb);
    });
    wrap.appendChild(grid);
  }

  const btnLabel = document.createElement('label');
  btnLabel.className = 'btn-foto';
  btnLabel.textContent = '📷 Sacar foto';
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.setAttribute('capture', 'environment');
  input.style.display = 'none';
  input.addEventListener('change', async () => {
    if (!input.files || !input.files.length) return;
    btnLabel.textContent = 'Procesando...';
    try {
      const dataUrl = await comprimirImagenDesdeArchivo(input.files[0]);
      fotos.push(dataUrl);
      onCambio();
    } catch (err) {
      alert('No se pudo procesar la foto. Probá de nuevo.');
      btnLabel.textContent = '📷 Sacar foto';
    }
  });
  btnLabel.appendChild(input);
  wrap.appendChild(btnLabel);

  return wrap;
}

function renderHallazgos() {
  const card = el('section', 'card');
  card.appendChild(el('h2', 'card-title', 'Registro individual de hallazgos'));
  card.appendChild(el('p', 'muted', `Hasta ${CANTIDAD_HALLAZGOS} hallazgos. Se incluyen en el informe los que tengan al menos "Tipo de hallazgo" cargado.`));

  borrador.hallazgos.forEach((h, idx) => {
    const box = el('div', 'hallazgo-box');
    box.appendChild(el('h3', 'hallazgo-title', 'Hallazgo N.º ' + String(idx + 1).padStart(2, '0')));
    const campos = [
      ['tipo', 'Tipo de hallazgo'],
      ['sector', 'Sector / ubicación'],
      ['punto', 'Punto evaluado'],
      ['descripcion', 'Descripción objetiva del hallazgo'],
      ['riesgo', 'Riesgo asociado'],
      ['prioridad', 'Prioridad de corrección'],
      ['accion', 'Acción correctiva / preventiva propuesta'],
      ['fotos', 'Notas sobre las fotografías (opcional)'],
      ['adicionales', 'Observaciones adicionales']
    ];
    campos.forEach(([key, label]) => {
      const wrap = el('label', 'field');
      wrap.appendChild(el('span', 'field-label', label));
      const input = document.createElement(key === 'descripcion' || key === 'accion' ? 'textarea' : 'input');
      if (input.tagName === 'TEXTAREA') input.rows = 2;
      input.value = h[key] || '';
      input.addEventListener('input', () => { h[key] = input.value; guardarBorradorLocal(); });
      wrap.appendChild(input);
      box.appendChild(wrap);
    });

    if (!h.fotosImg) h.fotosImg = [];
    box.appendChild(el('span', 'field-label foto-label', 'Fotos del hallazgo'));
    box.appendChild(renderCapturaFotos(h.fotosImg, () => { guardarBorradorLocal(); render(); }));

    const delBtn = el('button', 'btn-secundario', 'Eliminar hallazgo');
    delBtn.type = 'button';
    delBtn.addEventListener('click', () => {
      borrador.hallazgos.splice(idx, 1);
      guardarBorradorLocal();
      render();
    });
    box.appendChild(delBtn);
    card.appendChild(box);
  });

  if (borrador.hallazgos.length < CANTIDAD_HALLAZGOS) {
    const addBtn = el('button', 'btn-secundario', '+ Agregar hallazgo');
    addBtn.type = 'button';
    addBtn.addEventListener('click', () => {
      borrador.hallazgos.push({});
      guardarBorradorLocal();
      render();
    });
    card.appendChild(addBtn);
  }
  return card;
}

function renderConclusion() {
  const card = el('section', 'card');
  card.appendChild(el('h2', 'card-title', 'Conclusión profesional'));
  card.appendChild(renderTextarea('Aspectos positivos observados', borrador.aspectosPositivos, v => { borrador.aspectosPositivos = v; }));
  card.appendChild(renderTextarea('Principales acciones correctivas recomendadas', borrador.accionesRecomendadas, v => { borrador.accionesRecomendadas = v; }));
  card.appendChild(renderTextarea('Conclusión', borrador.conclusion, v => { borrador.conclusion = v; }));
  return card;
}

function renderAcciones() {
  const card = el('section', 'card acciones');
  const genBtn = el('button', 'btn-primario', 'Generar informe PDF');
  genBtn.type = 'button';
  genBtn.addEventListener('click', generarInformePDF);
  card.appendChild(genBtn);

  const nuevoBtn = el('button', 'btn-secundario', 'Nuevo informe (limpiar formulario)');
  nuevoBtn.type = 'button';
  nuevoBtn.addEventListener('click', () => {
    if (confirm('¿Descartar el borrador actual y empezar uno nuevo?')) {
      borrador = nuevoBorrador();
      render();
    }
  });
  card.appendChild(nuevoBtn);
  return card;
}

// ============================================================
// PERSISTENCIA DEL BORRADOR (IndexedDB, autosave instantáneo — soporta fotos)
// ============================================================
const BORRADOR_ID = 'actual';
async function guardarBorradorLocal() {
  try {
    const db = await abrirDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction('borradores', 'readwrite');
      tx.objectStore('borradores').put({ id: BORRADOR_ID, datos: borrador });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.error('No se pudo guardar el borrador', e);
  }
}
async function cargarBorradorLocal() {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('borradores', 'readonly');
    const req = tx.objectStore('borradores').get(BORRADOR_ID);
    req.onsuccess = () => {
      const datos = req.result ? req.result.datos : null;
      if (datos) {
        datos.itemsDetalle = datos.itemsDetalle || {};
        datos.itemsFotos = datos.itemsFotos || {};
      }
      resolve(datos);
    };
    req.onerror = () => reject(req.error);
  });
}

// ============================================================
// GENERACIÓN DEL PDF (misma estructura que el informe original)
// ============================================================
function tituloAObservacion(nombreSeccion) {
  return nombreSeccion.replace(/^\d+[A-Z]?\.\s*/, '').toLowerCase();
}

function formatearFecha(valor) {
  if (!valor) return '-';
  const d = new Date(valor + 'T00:00:00');
  if (isNaN(d.getTime())) return valor;
  return d.toLocaleDateString('es-AR');
}

async function generarInformePDF() {
  if (!borrador.generales.razonSocial || !borrador.generales.fechaInspeccion) {
    alert('Completá al menos "Nombre / Razón social" y "Fecha de inspección" antes de generar el informe.');
    return;
  }

  const normativaMapa = await leerNormativaCompleta();
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const marginX = 40;
  let y = 50;
  const pageH = doc.internal.pageSize.getHeight();
  const pageW = doc.internal.pageSize.getWidth();

  function checkPageBreak(extra) {
    if (y + extra > pageH - 50) { doc.addPage(); y = 50; }
  }
  function heading1(text) {
    checkPageBreak(30);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(14);
    doc.text(text, marginX, y); y += 22;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
  }
  function heading2(text) {
    checkPageBreak(24);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
    doc.text(text, marginX, y); y += 18;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
  }
  function parrafo(text, opts) {
    opts = opts || {};
    if (!text) return;
    doc.setFont('helvetica', opts.bold ? 'bold' : (opts.italic ? 'italic' : 'normal'));
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(String(text), pageW - marginX * 2);
    checkPageBreak(lines.length * 13 + 6);
    doc.text(lines, marginX, y);
    y += lines.length * 13 + 6;
    doc.setFont('helvetica', 'normal');
  }
  function campo(label, valor) {
    if (!valor) return;
    parrafo(label + ': ' + valor);
  }
  function tabla(head, body_) {
    doc.autoTable({
      startY: y, head: [head], body: body_,
      margin: { left: marginX, right: marginX },
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [40, 60, 90] },
      didDrawPage: () => {}
    });
    y = doc.lastAutoTable.finalY + 16;
  }
  function cargarImagen(dataUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('imagen inválida'));
      img.src = dataUrl;
    });
  }
  async function insertarFotos(fotos, anchoMax) {
    if (!fotos || fotos.length === 0) return;
    anchoMax = anchoMax || 200;
    for (const dataUrl of fotos) {
      try {
        const img = await cargarImagen(dataUrl);
        const escala = Math.min(anchoMax / img.naturalWidth, 1);
        const w = img.naturalWidth * escala;
        const h = img.naturalHeight * escala;
        checkPageBreak(h + 12);
        doc.addImage(dataUrl, 'JPEG', marginX, y, w, h);
        y += h + 12;
      } catch (e) {
        // foto corrupta o no soportada: se omite sin interrumpir el informe
      }
    }
  }

  const g = borrador.generales;
  const establecimiento = g.razonSocial || 'Establecimiento sin nombre';

  // Portada
  doc.setFont('helvetica', 'bold'); doc.setFontSize(20);
  doc.text('INFORME TÉCNICO DE INSPECCIÓN', marginX, y); y += 26;
  doc.setFontSize(13); doc.setFont('helvetica', 'normal');
  doc.text('HIGIENE Y SEGURIDAD EN EL TRABAJO', marginX, y); y += 20;
  doc.setFontSize(10);
  doc.text('Establecimiento gastronómico', marginX, y); y += 14;
  doc.setLineWidth(0.5); doc.line(marginX, y, pageW - marginX, y); y += 18;

  tabla(['Campo', 'Valor'], [
    ['Nombre / Razón social', g.razonSocial || '-'],
    ['Nombre comercial', g.nombreComercial || '-'],
    ['CUIT', g.cuit || '-'],
    ['Domicilio', g.domicilio || '-'],
    ['Localidad', g.localidad || '-'],
    ['Fecha de inspección', formatearFecha(g.fechaInspeccion)],
    ['Profesional actuante', g.profesionalActuante || '-'],
    ['Responsable presente durante la visita', g.responsablePresente || '-'],
    ['Cantidad aproximada de trabajadores', g.cantidadTrabajadores || '-'],
    ['Actividad principal', g.actividadPrincipal || '-']
  ]);

  // Resumen ejecutivo
  doc.addPage(); y = 50;
  heading1('1. RESUMEN EJECUTIVO');
  parrafo('Resultado general de la inspección: ' + (borrador.resultadoGeneral || '-'), { bold: true });
  parrafo(borrador.resumenGeneral || '');

  heading2('Estado general por sección');
  const filasResumen = [];
  ESTRUCTURA.forEach(bloque => {
    if (bloque.condicional && (borrador.correspondeSeccion[bloque.id] || 'SI') === 'NO APLICA') return;
    const conteo = { 'CONFORME': 0, 'NO CONFORME': 0, 'OBSERVACIÓN / MEJORA': 0, 'NO APLICA': 0, 'NO SE PUDO VERIFICAR': 0 };
    bloque.items.forEach(item => {
      const estado = borrador.itemsEstado[claveItem(bloque.id, item)];
      if (estado in conteo) conteo[estado]++;
    });
    filasResumen.push([bloque.seccion, conteo['CONFORME'], conteo['NO CONFORME'], conteo['OBSERVACIÓN / MEJORA'], conteo['NO APLICA'], conteo['NO SE PUDO VERIFICAR']]);
  });
  tabla(['Sección', 'Conforme', 'No conforme', 'Observación', 'No aplica', 'No verificado'], filasResumen);

  // Desarrollo por sección
  doc.addPage(); y = 50;
  heading1('2. DESARROLLO DEL RELEVAMIENTO');
  const itemsParaAnexo = [];
  for (const bloque of ESTRUCTURA) {
    if (bloque.condicional && (borrador.correspondeSeccion[bloque.id] || 'SI') === 'NO APLICA') continue;
    heading2(bloque.seccion);
    const filas = bloque.items.map(item => {
      const clave = claveItem(bloque.id, item);
      const estado = borrador.itemsEstado[clave] || '-';
      const detalle = estado !== 'CONFORME' ? (borrador.itemsDetalle[clave] || '') : '';
      if (ESTADOS_QUE_GENERAN_CITA.includes(estado)) {
        itemsParaAnexo.push({ seccion: bloque.seccion, item, estado, detalle });
      }
      return [item, estado, detalle];
    });
    tabla(['Ítem', 'Estado', 'Situación encontrada'], filas);
    const obs = borrador.observacionesSeccion[bloque.id];
    if (obs) parrafo('Observaciones: ' + obs, { italic: true });

    // Fotos registradas por ítem en esta sección
    for (const item of bloque.items) {
      const clave = claveItem(bloque.id, item);
      const fotosItem = borrador.itemsFotos[clave];
      if (fotosItem && fotosItem.length) {
        parrafo(item + ' — fotografías:', { bold: true });
        await insertarFotos(fotosItem);
      }
    }
  }

  // Hallazgos individuales
  doc.addPage(); y = 50;
  heading1('3. REGISTRO INDIVIDUAL DE HALLAZGOS');
  const hallazgosConTipo = borrador.hallazgos.filter(h => h.tipo);
  if (hallazgosConTipo.length === 0) {
    parrafo('No se registraron hallazgos individuales adicionales durante esta visita.');
  } else {
    for (let i = 0; i < hallazgosConTipo.length; i++) {
      const h = hallazgosConTipo[i];
      heading2('Hallazgo N.º ' + String(i + 1).padStart(2, '0') + ' - ' + h.tipo);
      campo('Sector / ubicación', h.sector);
      campo('Punto evaluado', h.punto);
      campo('Descripción objetiva', h.descripcion);
      campo('Riesgo asociado', h.riesgo);
      campo('Prioridad de corrección', h.prioridad);
      campo('Acción correctiva / preventiva propuesta', h.accion);
      campo('Notas sobre las fotografías', h.fotos);
      campo('Observaciones adicionales', h.adicionales);
      if (h.fotosImg && h.fotosImg.length) {
        parrafo('Fotografías adjuntas:', { bold: true });
        await insertarFotos(h.fotosImg);
      }
    }
  }

  // Conclusión y firma
  doc.addPage(); y = 50;
  heading1('4. CONCLUSIÓN PROFESIONAL');
  campo('Aspectos positivos observados', borrador.aspectosPositivos);
  campo('Principales acciones correctivas recomendadas', borrador.accionesRecomendadas);
  parrafo(borrador.conclusion || '');
  y += 10;
  parrafo('Profesional actuante: ' + (g.profesionalActuante || '-'));
  parrafo('Responsable presente durante la visita: ' + (g.responsablePresente || '-'));
  parrafo('Fecha de inspección: ' + formatearFecha(g.fechaInspeccion));

  // Anexo normativo
  doc.addPage(); y = 50;
  heading1('ANEXO I - MARCO NORMATIVO APLICABLE A LAS OBSERVACIONES');
  parrafo('El presente anexo detalla, únicamente para los puntos relevados como NO CONFORME, OBSERVACIÓN / MEJORA o NO SE PUDO VERIFICAR, la normativa de Higiene y Seguridad aplicable.', { italic: true });
  if (itemsParaAnexo.length === 0) {
    parrafo('No se registraron observaciones que requieran cita normativa en esta visita.');
  } else {
    const filasAnexo = itemsParaAnexo.map(r => {
      const bloque = ESTRUCTURA.find(b => b.seccion === r.seccion);
      const clave = r.seccion + '||' + r.item;
      const info = normativaMapa[clave] || { norma: bloque.normaDefault, articulo: '(pendiente de completar por el profesional)' };
      return [r.item, r.estado, r.detalle || '-', info.norma, info.articulo];
    });
    tabla(['Ítem', 'Estado', 'Situación encontrada', 'Marco normativo', 'Artículo / capítulo específico'], filasAnexo);
  }

  const nombreArchivo = 'Informe HyS - ' + establecimiento + ' - ' + formatearFecha(g.fechaInspeccion) + '.pdf';
  const blob = doc.output('blob');

  await guardarInforme({
    id: borrador.id,
    creadoEn: Date.now(),
    establecimiento,
    fecha: g.fechaInspeccion,
    nombreArchivo,
    blob
  });

  doc.save(nombreArchivo);
  await renderHistorial();
  alert('Informe generado y guardado en el historial del dispositivo.');
}

// ============================================================
// HISTORIAL DE INFORMES GUARDADOS LOCALMENTE
// ============================================================
async function renderHistorial() {
  const cont = document.getElementById('historial');
  if (!cont) return;
  cont.innerHTML = '';
  const informes = await listarInformes();
  if (informes.length === 0) {
    cont.appendChild(el('p', 'muted', 'Todavía no generaste ningún informe en este dispositivo.'));
    return;
  }
  informes.forEach(inf => {
    const row = el('div', 'historial-row');
    const info = el('div', 'historial-info');
    info.appendChild(el('strong', null, inf.establecimiento));
    info.appendChild(el('span', 'muted', ' — ' + formatearFecha(inf.fecha) + ' — ' + new Date(inf.creadoEn).toLocaleString('es-AR')));
    row.appendChild(info);

    const btns = el('div', 'historial-btns');
    const dlBtn = el('button', 'btn-secundario', 'Descargar PDF');
    dlBtn.type = 'button';
    dlBtn.addEventListener('click', () => {
      const url = URL.createObjectURL(inf.blob);
      const a = document.createElement('a');
      a.href = url; a.download = inf.nombreArchivo; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    });
    btns.appendChild(dlBtn);

    const delBtn = el('button', 'btn-secundario', 'Borrar');
    delBtn.type = 'button';
    delBtn.addEventListener('click', async () => {
      if (confirm('¿Borrar este informe del dispositivo? Esta acción no se puede deshacer.')) {
        await borrarInforme(inf.id);
        await renderHistorial();
      }
    });
    btns.appendChild(delBtn);
    row.appendChild(btns);
    cont.appendChild(row);
  });
}

// ============================================================
// NAVEGACIÓN ENTRE PANTALLAS (Nuevo informe / Historial / Normativa)
// ============================================================
function mostrarPantalla(nombre) {
  document.querySelectorAll('.pantalla').forEach(p => p.classList.remove('activa'));
  document.getElementById('pantalla-' + nombre).classList.add('activa');
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('activo'));
  document.getElementById('tab-' + nombre).classList.add('activo');
  if (nombre === 'historial') renderHistorial();
  if (nombre === 'normativa') renderNormativa();
}

async function renderNormativa() {
  const cont = document.getElementById('normativa-lista');
  cont.innerHTML = '';
  cont.appendChild(el('p', 'muted', 'Completá el artículo o capítulo específico de cada ítem según tu criterio profesional. Se guarda en este dispositivo y se usa en el Anexo I de todos los informes futuros.'));
  const mapa = await leerNormativaCompleta();

  ESTRUCTURA.forEach(bloque => {
    const card = el('section', 'card');
    card.appendChild(el('h2', 'card-title', bloque.seccion));
    bloque.items.forEach(item => {
      const clave = bloque.seccion + '||' + item;
      const existente = mapa[clave] || { norma: bloque.normaDefault, articulo: '' };
      const wrap = el('div', 'normativa-row');
      wrap.appendChild(el('div', 'normativa-item', item));

      const normaInput = document.createElement('input');
      normaInput.value = existente.norma;
      normaInput.placeholder = 'Marco normativo';
      const artInput = document.createElement('input');
      artInput.value = existente.articulo || '';
      artInput.placeholder = 'Artículo / capítulo específico';

      function guardar() {
        guardarNormativa(clave, { norma: normaInput.value, articulo: artInput.value });
      }
      normaInput.addEventListener('change', guardar);
      artInput.addEventListener('change', guardar);

      wrap.appendChild(normaInput);
      wrap.appendChild(artInput);
      card.appendChild(wrap);
    });
    cont.appendChild(card);
  });
}

// ============================================================
// INICIALIZACIÓN
// ============================================================
window.addEventListener('DOMContentLoaded', async () => {
  borrador = (await cargarBorradorLocal()) || nuevoBorrador();
  render();

  document.getElementById('tab-formulario').addEventListener('click', () => mostrarPantalla('formulario'));
  document.getElementById('tab-historial').addEventListener('click', () => mostrarPantalla('historial'));
  document.getElementById('tab-normativa').addEventListener('click', () => mostrarPantalla('normativa'));

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js').catch(() => {});
  }
});
