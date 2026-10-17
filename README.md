# Paso a Paso

Aplicación web gratuita para que personas mayores en Chile aprendan a usar el celular con calma: les habla en voz alta, les muestra dónde tocar y les deja practicar en un celular simulado, donde no se puede romper nada.

- **App:** https://lrojasr93.github.io/paso-a-paso/
- **Para familiares:** https://lrojasr93.github.io/paso-a-paso/familia.html

## Contenido

| Nivel | Lecciones |
|---|---|
| 1. Primeros toques | Tocar, deslizar, mantener presionado, agrandar, volver atrás |
| 2. Llamadas | Contestar, marcar un número, guardar un contacto |
| 3. WhatsApp | Abrir un chat, escribir, mandar y escuchar audios, ver fotos |
| 4. Estafas | 4 reglas de oro y 7 casos comunes en Chile |

**Plan Familia (sin servidor):** el adulto mayor envía su avance por WhatsApp como un enlace (`familia.html#avance=…`) y su familia puede mandarle lecciones específicas (`index.html#/pedido/<lección>/<nombre>`). No se guardan datos en ningún servidor; el avance vive en el teléfono.

## Estructura

- `index.html`, `js/core.js`: navegación, voz, progreso y reproductor de lecciones
- `js/sim.js`: gestos y simuladores (teléfono, teclado, marcador, chat)
- `js/lecciones/`: una carpeta de contenidos por nivel. Para agregar una lección nueva, añádela al nivel y asígnale un código nuevo en `CODIGOS` (`js/core.js`), sin cambiar los existentes.
- `familia.html`: página para hijos y familiares
- `sw.js`, `manifest.webmanifest`: instalación en la pantalla de inicio y uso sin internet. Cambia la versión de `CACHE` en `sw.js` cada vez que publiques cambios.

## Probar en el computador

```bash
node servidor.js
```

Y abre http://localhost:5173
