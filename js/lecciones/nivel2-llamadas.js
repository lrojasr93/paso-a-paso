/* Nivel 2 — Llamadas */
(function () {
  'use strict';
  const { h, sim } = PP;
  const info = PP.p.info;

  // Reloj de la llamada en curso
  function cronometro(el, ctx) {
    let s = 0;
    const tic = () => { el.textContent = '0' + Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); s++; ctx.tras(1000, tic); };
    tic();
  }

  const contestar = {
    id: 'llamadas-contestar', icono: '📲', titulo: 'Contestar una llamada',
    pasos: [
      info('Cuando alguien le llama, el celular suena y aparece su nombre en la pantalla.', {
        emoji: '📲', detalle: 'Vamos a practicar con una llamada de mentira. Nadie va a escuchar nada.',
      }),
      {
        texto: '¡Le está llamando Carolina! Toque el botón verde para contestar.',
        ayuda: 'Abajo hay dos botones redondos. El rojo es para no contestar. El verde es para contestar. Toque el verde.',
        render(ctx) {
          const verde = sim.botonLlamada('verde', 'Contestar', () => ctx.listo());
          const rojo = sim.botonLlamada('rojo', 'Rechazar', () =>
            ctx.casi('Ese botón rojo es para no contestar. Para contestar, toque el botón verde.'));
          verde.querySelector('button').classList.add('latido');
          const pant = sim.llamada({ nombre: 'Carolina (hija)', avatar: '👩', estadoTxt: 'Llamada entrante…', botones: [rojo, verde] });
          ctx.etapa.append(sim.telefono(pant, { oscuro: true }));
          ctx.etapa.querySelector('.movil').classList.add('sonando');
          PP.vibrar([300, 200, 300]);
          ctx.objetivo(verde.querySelector('button'));
        },
      },
      {
        texto: 'Ya está conversando con Carolina. Cuando terminen, toque el botón rojo para cortar.',
        ayuda: 'Para terminar la llamada, toque el botón rojo de abajo. Eso es cortar.',
        render(ctx) {
          const t = h('span', {}, '00:00');
          const subtitulo = h('p', { class: 'subtitulo-llamada' });
          const rojo = sim.botonLlamada('rojo', 'Cortar', () => ctx.listo());
          const pant = sim.llamada({ nombre: 'Carolina (hija)', avatar: '👩', estadoTxt: t, botones: [rojo] });
          pant.querySelector('.llamada-info').append(subtitulo);
          ctx.etapa.append(sim.telefono(pant, { oscuro: true }));
          cronometro(t, ctx);
          ctx.tras(3500, () => { subtitulo.textContent = 'Carolina: «¡Hola! ¿Cómo está? Le llamaba para saludarle. Un abrazo.»'; });
          ctx.objetivo(rojo.querySelector('button'), 'tocar', 12000);
        },
      },
      info('En algunos celulares hay que deslizar el botón en vez de tocarlo.', {
        emoji: '☝️', detalle: 'Si al tocar el botón verde no pasa nada, apoye el dedo y deslícelo hacia arriba o hacia el lado. ¡Ya sabe deslizar!',
      }),
    ],
  };

  const marcar = {
    id: 'llamadas-marcar', icono: '☎️', titulo: 'Llamar a un número',
    pasos: [
      info('Para llamar, se abre la aplicación Teléfono y se marca el número.', {
        emoji: '☎️', detalle: 'En Chile, los celulares tienen 9 números y empiezan con 9.',
      }),
      {
        texto: 'Marque el número de la farmacia: 9 1234 5678',
        voz: 'Vamos a llamar a la farmacia. El número está en el papelito amarillo: nueve, uno dos tres cuatro, cinco seis siete ocho. Toque los números uno por uno. Empiece por el nueve, que está iluminado.',
        ayuda: 'Toque el número que está iluminado. Después se ilumina el siguiente. No hay apuro.',
        clase: 'etapa-arriba',
        render(ctx) {
          const papel = h('div', { class: 'papelito' }, '💊 Farmacia: ', h('strong', {}, '9 1234 5678'));
          const marc = sim.marcarGuiado(ctx, '912345678', () => ctx.listo());
          ctx.etapa.append(papel, sim.telefono(marc));
        },
      },
      {
        texto: 'Ya marcó el número. Ahora toque el botón verde para llamar.',
        clase: 'etapa-arriba',
        render(ctx) {
          const verde = sim.botonLlamada('verde', 'Llamar', () => ctx.listo());
          const app = h('div', { class: 'marcador-app' },
            h('div', { class: 'marcador-numero' }, '9 1234 5678'),
            h('div', { class: 'marcador-llamar' }, verde));
          ctx.etapa.append(sim.telefono(app));
          ctx.objetivo(verde.querySelector('button'));
          ctx.fuera('Casi. El botón verde para llamar está abajo.');
        },
      },
      {
        texto: 'Está llamando a la farmacia. Para terminar, toque el botón rojo.',
        render(ctx) {
          const estadoTxt = h('span', {}, 'Llamando…');
          const subtitulo = h('p', { class: 'subtitulo-llamada' });
          const rojo = sim.botonLlamada('rojo', 'Cortar', () => ctx.listo());
          const pant = sim.llamada({ nombre: '9 1234 5678', avatar: '💊', estadoTxt, botones: [rojo] });
          pant.querySelector('.llamada-info').append(subtitulo);
          ctx.etapa.append(sim.telefono(pant, { oscuro: true }));
          ctx.tras(2500, () => { cronometro(estadoTxt, ctx); subtitulo.textContent = 'Farmacia: «Farmacia, buenas tardes. Sí, tenemos su remedio.»'; });
          ctx.objetivo(rojo.querySelector('button'), 'tocar', 10000);
        },
      },
    ],
  };

  const contacto = {
    id: 'llamadas-contacto', icono: '📇', titulo: 'Guardar un contacto',
    pasos: [
      info('Guardar un contacto es anotar un número con un nombre.', {
        emoji: '📇', detalle: 'Así no tiene que recordar los números: busca el nombre y listo.',
      }),
      {
        texto: 'Toque el botón + para agregar un contacto nuevo.',
        ayuda: 'Abajo, a la derecha, hay un botón redondo con una cruz o signo más. Tóquelo.',
        render(ctx) {
          const mas = h('button', { class: 'boton-flotante', 'aria-label': 'Agregar contacto', onclick: () => ctx.listo() }, '+');
          const app = h('div', { class: 'contactos' },
            h('div', { class: 'app-pagina-cabeza' }, h('span', {}, 'Contactos')),
            ['👩 Carolina (hija)', '🧔 Pedro (vecino)', '🩺 Consultorio'].map((c) => h('div', { class: 'contacto' }, c)),
            mas);
          ctx.etapa.append(sim.telefono(app));
          ctx.objetivo(mas);
          ctx.fuera('Casi. El botón + está abajo, a la derecha.');
        },
      },
      {
        texto: 'Escriba el nombre ANA. Toque las letras una por una.',
        voz: 'Ahora vamos a escribir el nombre: Ana. Toque las letras una por una. La que tiene que tocar está iluminada en amarillo. Empiece por la A.',
        ayuda: 'Busque en el teclado la letra que está iluminada en amarillo y tóquela. Después se ilumina la siguiente.',
        clase: 'etapa-arriba',
        render(ctx) {
          const nombre = h('div', { class: 'campo-form escribiendo-aqui' });
          const form = h('div', { class: 'formulario' },
            h('div', { class: 'app-pagina-cabeza' }, h('span', {}, 'Contacto nuevo')),
            h('label', {}, 'Nombre'), nombre,
            h('label', {}, 'Número'), h('div', { class: 'campo-form' }, '9 8765 4321'));
          const tec = sim.escribirGuiado(ctx, nombre, 'ana', () => ctx.listo());
          ctx.etapa.append(sim.telefono(h('div', { class: 'con-teclado' }, form, tec)));
        },
      },
      {
        texto: 'El número ya está escrito. Toque “Guardar”.',
        render(ctx) {
          const guardarBtn = h('button', { class: 'boton-texto' }, 'Guardar');
          const app = h('div', { class: 'formulario' },
            h('div', { class: 'app-pagina-cabeza' }, h('span', {}, 'Contacto nuevo'), guardarBtn),
            h('label', {}, 'Nombre'), h('div', { class: 'campo-form' }, 'Ana'),
            h('label', {}, 'Número'), h('div', { class: 'campo-form' }, '9 8765 4321'));
          guardarBtn.addEventListener('click', () => {
            app.replaceWith(h('div', { class: 'contactos' },
              h('div', { class: 'app-pagina-cabeza' }, h('span', {}, 'Contactos')),
              h('div', { class: 'contacto nuevo' }, '🙂 Ana'),
              ['👩 Carolina (hija)', '🧔 Pedro (vecino)', '🩺 Consultorio'].map((c) => h('div', { class: 'contacto' }, c))));
            ctx.listo();
          });
          ctx.etapa.append(sim.telefono(app));
          ctx.objetivo(guardarBtn);
          ctx.fuera('Casi. “Guardar” está arriba, a la derecha.');
        },
      },
    ],
  };

  PP.nivel({
    n: 2, id: 'llamadas', icono: '📞', titulo: 'Llamadas',
    descripcion: 'Contestar, llamar a un número y guardar contactos.',
    compartir: 'Ya sé contestar, llamar y guardar contactos.',
    lecciones: [contestar, marcar, contacto],
  });
})();
