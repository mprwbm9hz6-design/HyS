# Informe HyS — App offline para inspecciones

## Qué es
Reemplaza al script de Google Apps Script por una app web instalable (PWA) que:
- Funciona **sin conexión** una vez cargada la primera vez (service worker cachea todo).
- Guarda cada inspección en el propio celular (IndexedDB), aunque cierres la app o te quedes sin batería.
- Genera el PDF del informe **en el dispositivo**, con la misma estructura del script original
  (portada, resumen ejecutivo, desarrollo por sección, hallazgos, conclusión, anexo normativo).
- Tiene una pestaña "Normativa" para cargar una sola vez el artículo/capítulo específico de cada ítem
  (equivalente a la hoja "Normativa" del Sheet original) — queda guardado en el dispositivo.
- Tiene una pestaña "Historial" para volver a descargar cualquier PDF generado antes.

## Cómo alojarlo (elegí una, todas son gratis)

### Opción más simple: Netlify Drop
1. Andá a https://app.netlify.com/drop
2. Arrastrá la carpeta `build/` completa (todo su contenido).
3. Te da una URL tipo `https://algo.netlify.app`. Ya está online.

### GitHub Pages
1. Creá un repo, subí el contenido de `build/` a la raíz.
2. Settings > Pages > Deploy from branch > main > / (root).
3. Te da una URL tipo `https://tuusuario.github.io/turepo`.

### Vercel
1. `npm i -g vercel` (o desde la web, arrastrando la carpeta).
2. `vercel` dentro de la carpeta `build/`.

**Importante:** debe servirse por HTTPS (todas las opciones de arriba lo hacen automático) — los
service workers no funcionan sobre HTTP simple, salvo `localhost`.

## Cómo instalarlo en el celular
1. Abrí la URL en Chrome (Android) o Safari (iPhone).
2. Dejá que cargue una vez con conexión (así el service worker descarga y cachea todo).
3. Android: menú (⋮) > "Instalar app" / "Agregar a pantalla de inicio".
   iPhone: botón compartir > "Agregar a pantalla de inicio".
4. A partir de ahí, se abre como app y funciona sin señal.

## Flujo de uso
1. Completá el formulario durante la inspección (se autoguarda en cada tecla, no se pierde nada
   si se corta la app o el celular se apaga).
2. Al terminar, tocá "Generar informe PDF": arma el PDF y lo guarda en el Historial del dispositivo.
3. Cuando tengas señal, compartí el PDF desde el Historial (o el que descargó el navegador) por
   WhatsApp, mail, o subilo a Drive manualmente.

## Diferencias vs. el script original
- No depende de Google Forms/Sheets/Docs/Drive: todo vive en el dispositivo hasta que vos lo compartís.
- Se corrigió el bug de "observaciones cruzadas entre secciones" que tenía el script (.gs): acá
  cada sección tiene su propio campo de observaciones, sin fallback a campos de otras secciones.
- No hay sincronización automática entre dispositivos. Si varios profesionales generan informes,
  cada uno queda guardado solo en el celular donde se generó, salvo que lo compartan manualmente.

## Si más adelante querés sincronización automática a Drive/Sheets
Se puede agregar sin tocar la lógica offline: cuando detecte conexión, sube los PDFs pendientes
a Drive vía su API (requiere un login de Google la primera vez). Avisame si eventualmente lo querés.
