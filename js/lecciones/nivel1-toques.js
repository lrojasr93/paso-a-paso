/* Nivel 1 — Primeros toques */
(function () {
  'use strict';
  const { h, sim } = PP;
  const info = PP.p.info;

  // Paso: tocar un círculo en una posición
  function tocarCirculo(texto, pos, tamano) {
    return {
      texto,
      ayuda: 'Apoye la yema del dedo encima del círculo verde y levántelo. Un toque suave, nada más.',
      render(ctx) {
        const c = h('button', { class: 'circulo', 'aria-label': 'Círculo verde',
          style: { left: pos[0] + '%', top: pos[1] + '%', width: tamano + 'px', height: tamano + 'px' },
          onclick: () => { c.classList.add('reventar'); ctx.listo(); } });
        ctx.etapa.append(h('div', { class: 'cancha' }, c));
        ctx.objetivo(c);
        ctx.fuera('Casi. Toque justo encima del círculo verde.');
      },
    };
  }

  const tocar = {
    id: 'toques-tocar', icono: '👆', titulo: 'Tocar la pantalla',
    pasos: [
      info('Para usar el celular, se toca la pantalla con la yema del dedo.', {
        emoji: '👆', detalle: 'Un toque suave, como si tocara una burbuja de jabón. No hace falta apretar fuerte.',
        voz: 'Para usar el celular, se toca la pantalla con la yema del dedo. Un toque suave, como si tocara una burbuja de jabón. No hace falta apretar fuerte. Cuando esté listo, toque el botón verde que dice Entendido.',
      }),
      tocarCirculo('Toque el círculo verde.', [50, 50], 140),
      tocarCirculo('El círculo se movió. Tóquelo otra vez.', [25, 22], 110),
      tocarCirculo('Ahora está más chico. Tóquelo con calma.', [72, 72], 80),
      {
        texto: 'Toque las tres burbujas, una por una.',
        render(ctx) {
          let quedan = 3;
          const posiciones = [[22, 30], [70, 40], [42, 75]];
          const cancha = h('div', { class: 'cancha' });
          const burbujas = posiciones.map(([x, y]) => {
            const b = h('button', { class: 'circulo burbuja-jabon', 'aria-label': 'Burbuja', style: { left: x + '%', top: y + '%' },
              onclick: () => {
                if (b.classList.contains('reventar')) return;
                b.classList.add('reventar'); PP.vibrar(20); quedan--;
                if (quedan === 0) ctx.listo();
                else { const otra = burbujas.find((o) => !o.classList.contains('reventar')); ctx.objetivo(otra); ctx.pista('¡Bien! Quedan ' + quedan, 'Quedan ' + quedan); }
              } });
            return b;
          });
          cancha.append(...burbujas);
          ctx.etapa.append(cancha);
          ctx.objetivo(burbujas[0]);
        },
      },
    ],
  };

  const deslizar = {
    id: 'toques-deslizar', icono: '👉', titulo: 'Deslizar el dedo',
    pasos: [
      info('Deslizar es apoyar el dedo y arrastrarlo, sin levantarlo.', {
        emoji: '👉', detalle: 'Es como cuando pasa la página de un libro o de una revista.',
      }),
      {
        texto: 'Deslice la foto hacia la izquierda para ver la siguiente.',
        ayuda: 'Apoye el dedo sobre la foto y, sin levantarlo, arrástrelo hacia la izquierda, hacia el lado del corazón. Después suelte.',
        render(ctx) {
          const fotos = [['🌻', 'Un girasol'], ['🐕', 'Un perrito'], ['🎂', 'Una torta']];
          let n = 0;
          const marco = h('div', { class: 'carrusel' });
          const contador = h('p', { class: 'carrusel-num' });
          function mostrar() {
            const [emoji, nombre] = fotos[n];
            const tarjeta = h('div', { class: 'foto-tarjeta', role: 'img', 'aria-label': nombre }, h('span', {}, emoji), h('small', {}, nombre));
            marco.replaceChildren(tarjeta);
            contador.textContent = 'Foto ' + (n + 1) + ' de ' + fotos.length;
            if (n === fotos.length - 1) return ctx.listo();
            if (n === 1) ctx.pista('¡Eso! Una vez más', 'Eso es. Una vez más.');
            sim.deslizar(tarjeta, 'izquierda', () => { n++; mostrar(); },
              (tipo) => ctx.casi(tipo === 'toque'
                ? 'Casi. No basta con tocar: deje el dedo apoyado y arrástrelo hacia la izquierda.'
                : 'Casi. Arrastre un poquito más largo hacia la izquierda.'));
            ctx.objetivo(tarjeta, 'izquierda');
          }
          ctx.etapa.append(marco, contador);
          mostrar();
        },
      },
      {
        texto: 'Deslice la lista hacia arriba hasta encontrar la estrella ⭐, y tóquela.',
        voz: 'Ahora, deslice la lista hacia arriba, empujándola con el dedo, hasta encontrar la estrella. Cuando la vea, tóquela.',
        ayuda: 'Ponga el dedo en la lista y arrástrelo hacia arriba, como empujando la hoja. La lista se va a mover y van a aparecer cosas nuevas abajo.',
        render(ctx) {
          const cosas = ['🍎 Manzanas', '🍞 Pan', '🧀 Queso', '🥚 Huevos', '🥛 Leche', '🍅 Tomates', '🥑 Paltas', '🧅 Cebollas', '🍋 Limones', '☕ Café', '🍚 Arroz', '🥔 Papas'];
          const estrella = h('button', { class: 'item-lista item-estrella', onclick: () => ctx.listo() }, '⭐ ¡Aquí está la estrella!');
          const lista = h('div', { class: 'lista-scroll', tabindex: 0 },
            h('p', { class: 'lista-titulo' }, '🛒 Lista del almacén'),
            cosas.map((c) => h('div', { class: 'item-lista' }, c)),
            estrella);
          ctx.etapa.append(lista);
          ctx.objetivo(lista, 'arriba');
          lista.addEventListener('scroll', () => {
            const r = estrella.getBoundingClientRect(), rl = lista.getBoundingClientRect();
            if (r.top < rl.bottom - 20) ctx.objetivo(estrella, 'tocar', 4000);
          }, { passive: true });
          ctx.fuera('Siga deslizando hacia arriba. La estrella está al final de la lista.', '.lista-scroll');
        },
      },
    ],
  };

  const mantener = {
    id: 'toques-mantener', icono: '✋', titulo: 'Mantener presionado',
    pasos: [
      info('A veces hay que dejar el dedo apoyado un ratito, sin moverlo.', {
        emoji: '✋', detalle: 'Esto se llama “mantener presionado”. Se usa, por ejemplo, para grabar un audio en WhatsApp.',
      }),
      {
        texto: 'Deje el dedo apoyado sobre el botón hasta que se llene el círculo.',
        ayuda: 'Ponga el dedo sobre el botón y déjelo ahí, quietito, mientras cuenta hasta tres: uno, dos, tres. Recién ahí lo suelta.',
        render(ctx) {
          const b = h('button', { class: 'boton-mantener', 'aria-label': 'Botón para mantener presionado' }, h('span', {}, '✋'));
          const contador = h('p', { class: 'contador-mantener' }, ' ');
          sim.mantener(b, 1800, {
            alEmpezar: () => { contador.textContent = 'Muy bien, mantenga… 1… 2… 3…'; },
            alLograr: () => { contador.textContent = '¡Listo!'; ctx.listo(); },
            alSoltarAntes: () => { contador.textContent = ' '; ctx.casi('Casi. Deje el dedo un poquito más, hasta que se llene todo el círculo.'); },
          });
          ctx.etapa.append(h('div', { class: 'centrado' }, b, contador));
          ctx.objetivo(b, 'mantener');
        },
      },
      {
        texto: 'Ahora hágalo una vez más, para practicar.',
        render(ctx) {
          const b = h('button', { class: 'boton-mantener azul', 'aria-label': 'Botón para mantener presionado' }, h('span', {}, '🎤'));
          sim.mantener(b, 1800, {
            alLograr: () => ctx.listo(),
            alSoltarAntes: () => ctx.casi('Casi. Mantenga el dedo apoyado hasta que se llene el círculo.'),
          });
          ctx.etapa.append(h('div', { class: 'centrado' }, b, h('p', { class: 'contador-mantener' }, 'Así se graba un audio 🎤')));
          ctx.objetivo(b, 'mantener');
        },
      },
    ],
  };

  const agrandar = {
    id: 'toques-agrandar', icono: '🔍', titulo: 'Agrandar lo que se ve chico',
    pasos: [
      info('Si algo se ve muy chico, lo puede agrandar.', {
        emoji: '🔍', detalle: 'Sirve para leer letra chica o ver mejor una foto.',
      }),
      {
        texto: 'Toque dos veces rápido sobre la receta para agrandarla.',
        voz: 'Toque dos veces seguidas, rápido, sobre la receta para agrandarla. También puede poner dos dedos sobre ella y separarlos.',
        ayuda: 'Toque la receta dos veces seguidas, rápido, como cuando toca una puerta: toc, toc. O ponga dos dedos juntos encima y sepárelos.',
        render(ctx) {
          const receta = h('div', { class: 'receta' },
            h('strong', {}, 'Sopaipillas'),
            h('span', {}, '2 tazas de harina, 1 taza de zapallo cocido, 1 cucharadita de polvo de hornear, sal, 3 cucharadas de manteca derretida. Mezclar, amasar, cortar en círculos y freír.'));
          sim.agrandar(receta, () => ctx.tras(700, () => ctx.listo()));
          ctx.etapa.append(h('div', { class: 'centrado' }, receta));
          ctx.objetivo(receta, 'doble');
        },
      },
      info('¡Ahora sí se puede leer!', {
        emoji: '👓', detalle: 'Para achicar, se hace lo contrario: dos toques otra vez, o juntar los dedos. Y si siempre quiere letra más grande, alguien de su familia la puede agrandar en Ajustes.',
      }),
    ],
  };

  const volver = {
    id: 'toques-volver', icono: '↩️', titulo: 'Volver atrás',
    pasos: [
      info('Si se pierde o se equivoca, siempre puede volver atrás.', {
        emoji: '↩️', detalle: 'Es como retroceder un paso. Volver nunca borra nada.',
      }),
      {
        texto: 'Está leyendo una noticia. Toque la flecha ← de arriba para volver.',
        ayuda: 'Mire arriba, a la izquierda de la pantalla del celular dibujado. Hay una flecha que apunta hacia la izquierda. Tóquela.',
        render(ctx) {
          const flecha = h('button', { class: 'barra-volver', 'aria-label': 'Volver' }, '←');
          const pagina = h('div', { class: 'app-pagina' },
            h('div', { class: 'app-pagina-cabeza' }, flecha, h('span', {}, 'Noticias')),
            h('div', { class: 'app-pagina-cuerpo' },
              h('div', { class: 'noticia-emoji', 'aria-hidden': 'true' }, '☀️'),
              h('h3', {}, 'El tiempo en Santiago'),
              h('p', {}, 'Mañana: soleado, máxima de 24 grados y mínima de 9. Ideal para salir a caminar.')));
          flecha.addEventListener('click', () => {
            pagina.replaceWith(h('div', { class: 'app-pagina' },
              h('div', { class: 'app-pagina-cabeza' }, h('span', {}, '🏠 Inicio')),
              h('div', { class: 'app-pagina-cuerpo' }, h('p', {}, 'Volvió a la página anterior. ¡Así de fácil!'))));
            ctx.listo();
          });
          ctx.etapa.append(sim.telefono(pagina));
          ctx.objetivo(flecha);
          ctx.fuera('Casi. La flecha está arriba, a la izquierda.');
        },
      },
      info('En cada celular, el botón para volver puede estar en otro lugar.', {
        emoji: '📱',
        extra: () => h('ul', { class: 'lista-consejos' },
          h('li', {}, h('strong', {}, 'Android: '), 'abajo de la pantalla hay un botón ◁, o se desliza desde el borde izquierdo o derecho hacia el centro.'),
          h('li', {}, h('strong', {}, 'iPhone: '), 'se desliza el dedo desde el borde izquierdo hacia la derecha.'),
          h('li', {}, 'Y casi todas las aplicaciones tienen la flecha ← arriba.')),
        voz: 'En cada celular, el botón para volver puede estar en otro lugar. En Android, abajo de la pantalla hay un botón con forma de triángulo, o se desliza desde el borde hacia el centro. En iPhone, se desliza el dedo desde el borde izquierdo hacia la derecha. Y casi todas las aplicaciones tienen una flecha arriba.',
      }),
    ],
  };

  PP.nivel({
    n: 1, id: 'toques', icono: '👆', titulo: 'Primeros toques',
    descripcion: 'Tocar, deslizar, mantener el dedo y agrandar lo que se ve chico.',
    compartir: 'Ya sé tocar, deslizar y agrandar la letra.',
    lecciones: [tocar, deslizar, mantener, agrandar, volver],
  });
})();
