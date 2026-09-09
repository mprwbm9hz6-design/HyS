# Informe HyS — Proyecto Android (Capacitor)

Esta carpeta envuelve la misma web app (PWA) que ya tenés funcionando, empaquetada
como proyecto Android nativo con Capacitor. El código de la app (HTML/JS) es el
mismo — está en `www/`, que es una copia del build web.

## Lo que ya está hecho
- Proyecto Capacitor inicializado (`capacitor.config.ts`), app id `ar.com.informehys.app`.
- Proyecto nativo Android generado en `android/` (Gradle, manifest, etc.).
- La cámara ya funciona: el botón "📷 Sacar foto" usa un `<input type="file" capture="environment">`,
  que en un WebView de Android (como el que usa Capacitor) abre la app de cámara nativa del
  celular directamente — no hace falta ningún plugin adicional para esto.

## Lo que falta (necesita Android Studio en tu PC — esto no lo puedo hacer desde acá,
## porque mi entorno no tiene acceso a los servidores de Android/Google)

### 1) Instalar herramientas (una sola vez)
- Node.js (https://nodejs.org, versión LTS).
- Android Studio (https://developer.android.com/studio) — al instalarlo, dejá que
  descargue el Android SDK que te pide (Android Studio lo hace automático la primera vez
  que lo abrís).

### 2) Preparar el proyecto
```
cd hys-android
npm install
npx cap sync android
```

### 3) Abrir en Android Studio
```
npx cap open android
```
Esto abre Android Studio directamente en el proyecto. Dejá que sincronice Gradle
(la primera vez tarda unos minutos, descarga dependencias).

### 4) Probar en un celular o emulador
Con el celular conectado por USB (con "Depuración USB" activada) o un emulador
corriendo, apretá el botón ▶ (Run) en Android Studio. La app se instala y abre sola.
Probá el flujo completo: formulario, sacar una foto con el botón de cámara, generar
el PDF, revisar el Historial.

### 5) Generar el ícono y nombre reales de la app
- Ícono: clic derecho en `android/app/src/main/res` > New > Image Asset, y subí tu logo
  (se genera automático en todas las resoluciones).
- Nombre visible: `android/app/src/main/res/values/strings.xml`, cambiá `app_name`.

### 6) Generar el Android App Bundle (.aab) firmado, para subir a Play Store
En Android Studio: Build > Generate Signed Bundle / APK > Android App Bundle.
- La primera vez te pide crear un "keystore" (una clave de firma) — guardala con
  mucho cuidado, la vas a necesitar para cada actualización futura de la app.
- Elegí "release", y te genera el archivo `.aab`.

### 7) Publicar en Play Store
- Necesitás una cuenta de Google Play Developer (pago único de USD 25):
  https://play.google.com/console/signup
- Creá una app nueva, completá la ficha (descripción, capturas de pantalla, ícono,
  categoría, política de privacidad — obligatoria si la app pide permisos como cámara).
- Subís el `.aab` del paso anterior en la sección "Producción" (o primero en
  "Testing interno" para probar antes de publicar mundialmente).
- Google revisa la app (puede tardar de horas a pocos días) y después queda pública.

## Actualizar la app más adelante
Si le hago cambios al código web (`www/`), volvés a correr:
```
npx cap sync android
```
y repetís el paso 6-7 con un `versionCode` más alto (en
`android/app/build.gradle`) para subir la actualización a Play Store.

## Nota sobre permisos
Al usar la cámara desde el WebView, Android va a pedir el permiso de Cámara la
primera vez que el usuario toca "📷 Sacar foto" — es automático, no hace falta
configurar nada adicional en el manifest para este enfoque basado en `<input capture>`.
