# Generar el APK para instalar en el celular (sin Android Studio)

Este proyecto incluye un workflow de GitHub Actions (`.github/workflows/build-apk.yml`)
que compila el `.apk` automáticamente en los servidores de GitHub — gratis, sin instalar
nada en tu PC.

## Paso a paso

### 1) Crear cuenta de GitHub (si no tenés)
https://github.com/signup — es gratis.

### 2) Crear un repositorio nuevo
En https://github.com/new — nombre por ejemplo `informe-hys`. Puede ser privado.
NO tildes "Add a README" (para que quede vacío).

### 3) Subir este proyecto al repositorio
Descomprimí este zip en una carpeta, abrí una terminal ahí adentro, y corré
(reemplazando `TU-USUARIO` por tu usuario de GitHub):

```
cd hys-android
git init
git add .
git commit -m "Primera versión"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/informe-hys.git
git push -u origin main
```

Te va a pedir usuario y contraseña de GitHub (o un token — GitHub te guía si hace falta,
las contraseñas normales ya no las acepta para git, pedí un "Personal Access Token"
desde Settings > Developer settings > Personal access tokens, y usalo como contraseña).

### 4) Ver la compilación
Andá a tu repo en GitHub > pestaña "Actions". Vas a ver que arrancó solo un proceso
llamado "Build Android APK" apenas hiciste el push. Tarda entre 3 y 6 minutos.

### 5) Descargar el APK
Cuando termine (tilde verde ✅), entrá a esa ejecución y al final de la página vas a
ver "Artifacts" con un archivo `informe-hys-apk`. Descargalo — es un `.zip` que adentro
tiene el `app-debug.apk`.

### 6) Pasarlo al celular e instalar
- Mandátelo por WhatsApp/Drive/mail, o conectá el celular por USB y copialo.
- Abrí el archivo `.apk` desde el celular.
- Android te va a pedir permiso para "instalar apps desconocidas" la primera vez —
  se lo das (Ajustes > Seguridad, o te aparece el botón directo al tocar el archivo).
- Se instala como cualquier app, con ícono en el menú de aplicaciones.

## Importante sobre este APK
- Es una build de **debug**: sirve perfecto para instalar y usar en tu celular, pero
  **no sirve para subir a Play Store** (Play Store exige una build "release" firmada
  con tu propia clave — eso está explicado en `README-android.md`, es un paso extra
  cuando quieras publicarla ahí).
- Cada vez que le haga cambios al código y quieras una versión nueva del APK, hacés
  `git add . && git commit -m "cambios" && git push` y GitHub te compila una nueva
  automáticamente — no hace falta repetir toda la instalación de git.
