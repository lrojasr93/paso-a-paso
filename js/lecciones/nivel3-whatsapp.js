/* Nivel 3 — WhatsApp (simulado) */
(function () {
  'use strict';
  const { h, sim } = PP;
  const info = PP.p.info;

  const CAROLINA = { nombre: 'Carolina (hija)', avatar: '👩' };
  const HISTORIAL = [
    { de: 'suya', texto: '¡Buenos días! ¿Cómo amaneció? ☀️', hora: '09:12' },
    { de: 'yo', texto: 'Bien, gracias', hora: '09:40' },
  ];

  const abrir = {
    id: 'wsp-abrir', icono: '💬', titulo: 'Abrir WhatsApp y un chat',
    pasos: [
      info('WhatsApp sirve para mandar mensajes, audios y fotos, y para hacer videollamadas.', {
        emoji: '💬', detalle: 'Es gratis si tiene internet o datos móviles. Vamos a practicar en un WhatsApp de mentira.',
      }),
      {
        texto: 'Busque el ícono verde de WhatsApp y tóquelo.',
        ayuda: 'Los cuadraditos de colores son las aplicaciones. Cada una tiene su nombre abajo. Busque la que dice WhatsApp: es verde, con un globito de conversación.',
        render(ctx) {
          const esc = sim.escritorio((app) => {
            if (app.id === 'whatsapp') ctx.listo();
            else ctx.casi('Esa es la aplicación ' + app.nombre + '. WhatsApp es la verde con un globito, que dice WhatsApp abajo.');
          });
          ctx.etapa.append(sim.telefono(esc));
          ctx.objetivo(esc.querySelector('[data-app="whatsapp"]'));
        },
      },
      {
        texto: 'Estas son sus conversaciones. Toque la de Carolina para abrirla.',
        ayuda: 'Cada fila es una conversación con una persona. Toque la fila que dice Carolina.',
        render(ctx) {
          const chats = [
            { id: 'carolina', icono: '👩', nombre: 'Carolina (hija)', ultimo: 'Bien, gracias', hora: '09:40' },
            { id: 'familia', icono: '👨‍👩‍👧', nombre: 'Familia ❤️', ultimo: 'Pedro: ¿Quién lleva el pan el domingo?', hora: '08:15' },
            { id: 'rosa', icono: '👵', nombre: 'Vecina Rosa', ultimo: 'Gracias por los limones 🍋', hora: 'Ayer' },
          ];
          const lista = h('div', { class: 'wsp-lista' },
            h('div', { class: 'wsp-cabeza' }, 'WhatsApp'),
            chats.map((c) => h('button', { class: 'wsp-fila', 'data-chat': c.id, onclick: () => {
              if (c.id === 'carolina') ctx.listo();
              else ctx.casi('Esa es la conversación de ' + c.nombre + '. Busque la de Carolina, la primera.');
            } },
              h('span', { class: 'chat-avatar', 'aria-hidden': 'true' }, c.icono),
              h('span', { class: 'wsp-fila-texto' }, h('strong', {}, c.nombre), h('small', {}, c.ultimo)),
              h('span', { class: 'wsp-fila-hora' }, c.hora))));
          ctx.etapa.append(sim.telefono(lista));
          ctx.objetivo(lista.querySelector('[data-chat="carolina"]'));
        },
      },
    ],
  };

  const escribir = {
    id: 'wsp-escribir', icono: '✍️', titulo: 'Escribir un mensaje',
    pasos: [
      {
        texto: 'Toque el espacio blanco de abajo, donde dice “Mensaje”, para empezar a escribir.',
        ayuda: 'Abajo de la conversación hay una franja blanca alargada que dice Mensaje. Tóquela y va a aparecer el teclado.',
        render(ctx) {
          const c = sim.chat({ ...CAROLINA, mensajes: HISTORIAL });
          c.campo.addEventListener('click', () => ctx.listo());
          ctx.etapa.append(sim.telefono(c.el));
          ctx.objetivo(c.campo);
          ctx.fuera('Casi. Toque la franja blanca de abajo que dice “Mensaje”.');
        },
      },
      {
        texto: 'Apareció el teclado. Escriba la palabra HOLA.',
        voz: 'Apareció el teclado. Vamos a escribir: Hola. La letra que tiene que tocar está iluminada en amarillo. Empiece por la hache.',
        ayuda: 'Toque la letra iluminada en amarillo. Después se ilumina la siguiente. Si se equivoca, no pasa nada.',
        clase: 'etapa-arriba',
        render(ctx) {
          const c = sim.chat({ ...CAROLINA, mensajes: HISTORIAL });
          c.campo.classList.add('activo');
          c.accion.textContent = '➤'; c.accion.setAttribute('aria-label', 'Enviar');
          c.zonaTeclado.append(sim.escribirGuiado(ctx, c.campo, 'hola', () => ctx.listo()));
          ctx.etapa.append(sim.telefono(c.el));
        },
      },
      {
        texto: 'Toque la flecha verde ➤ para enviar el mensaje.',
        ayuda: 'A la derecha de lo que escribió hay un círculo verde con una flecha. Tóquelo para enviar.',
        render(ctx) {
          const c = sim.chat({ ...CAROLINA, mensajes: HISTORIAL });
          c.campo.textContent = 'Hola'; c.campo.classList.remove('vacio'); c.campo.classList.add('activo');
          c.accion.textContent = '➤'; c.accion.setAttribute('aria-label', 'Enviar');
          let enviado = false;
          c.accion.addEventListener('click', () => {
            if (enviado) return; enviado = true;
            c.agregar({ de: 'yo', texto: 'Hola' });
            c.campo.textContent = 'Mensaje'; c.campo.classList.add('vacio');
            c.accion.textContent = '🎤';
            ctx.objetivo(null);
            ctx.pista('¡Enviado! Mire, Carolina está escribiendo…', 'Enviado. Mire, Carolina está escribiendo.');
            ctx.tras(1800, () => c.escribiendo(true));
            ctx.tras(4200, () => { c.escribiendo(false); c.agregar({ de: 'suya', texto: '¡Hola! 😊 Qué lindo que me escriba. ¡Le quiero mucho!' }); });
            ctx.tras(5400, () => ctx.listo());
          });
          ctx.etapa.append(sim.telefono(c.el));
          ctx.objetivo(c.accion);
          ctx.fuera('Casi. La flecha verde para enviar está abajo, a la derecha.');
        },
      },
      info('Las rayitas ✓✓ al lado de su mensaje le avisan qué pasó con él.', {
        emoji: '✓✓',
        extra: () => h('ul', { class: 'lista-consejos' },
          h('li', {}, h('strong', {}, '✓ una rayita gris: '), 'se envió.'),
          h('li', {}, h('strong', {}, '✓✓ dos rayitas grises: '), 'le llegó a la otra persona.'),
          h('li', {}, h('strong', { class: 'checks-azules' }, '✓✓ dos rayitas azules: '), 'ya lo leyó.')),
        voz: 'Las rayitas al lado de su mensaje le avisan qué pasó con él. Una rayita gris: se envió. Dos rayitas grises: le llegó a la otra persona. Dos rayitas azules: ya lo leyó.',
      }),
    ],
  };

  const audio = {
    id: 'wsp-audio', icono: '🎤', titulo: 'Mandar y escuchar un audio',
    pasos: [
      info('Si escribir le cuesta, puede mandar un audio.', {
        emoji: '🎤', detalle: 'Un audio es como dejar un recado hablado. Aquí no vamos a grabar su voz de verdad, es solo para practicar.',
      }),
      {
        texto: 'Mantenga presionado el micrófono 🎤 mientras habla. Cuando termine, suelte el dedo.',
        voz: 'Mantenga el dedo apoyado sobre el micrófono, el círculo verde de abajo, mientras dice: Hola Carolina, ¿cómo estás? Cuando termine de hablar, suelte el dedo y el audio se envía solo.',
        ayuda: 'Apoye el dedo en el círculo verde del micrófono y no lo levante. Hable. Cuando termine, levante el dedo.',
        render(ctx) {
          const c = sim.chat({ ...CAROLINA, mensajes: HISTORIAL });
          const grabando = h('div', { class: 'grabando', hidden: true }, h('span', { class: 'punto-rojo' }), ' Grabando… ', h('span', {}, '0:00'));
          c.el.querySelector('.chat-pie').prepend(grabando);
          let reloj = null, s = 0;
          sim.mantener(c.accion, 1500, {
            alEmpezar: () => {
              grabando.hidden = false; c.campo.hidden = true; s = 0;
              grabando.lastChild.textContent = '0:00';
              reloj = setInterval(() => { s++; grabando.lastChild.textContent = '0:0' + Math.min(s, 9); }, 1000);
            },
            alSoltar: () => { clearInterval(reloj); grabando.hidden = true; c.campo.hidden = false; },
            alLograr: () => {
              c.agregar({ de: 'yo', audio: '0:0' + Math.max(2, s) });
              ctx.listo();
            },
            alSoltarAntes: () => ctx.casi('El audio quedó muy cortito y no se envió. Mantenga el dedo apoyado mientras habla, y suéltelo al terminar.'),
          });
          ctx.etapa.append(sim.telefono(c.el));
          ctx.objetivo(c.accion, 'mantener');
        },
      },
      {
        texto: 'Carolina le respondió con un audio. Toque el triángulo ▶ para escucharlo.',
        ayuda: 'En el mensaje de Carolina hay un triángulo que apunta a la derecha. Tóquelo para escuchar.',
        render(ctx) {
          const c = sim.chat({ ...CAROLINA, mensajes: [...HISTORIAL, { de: 'yo', audio: '0:03' }] });
          const b = c.agregar({ de: 'suya', audio: '0:04' });
          const play = b.querySelector('.audio-play');
          const avance = b.querySelector('.audio-avance');
          const texto = '¡Hola! Qué alegría escuchar su voz. Le mando un abrazo grande.';
          let sonando = false;
          play.addEventListener('click', () => {
            if (sonando) return; sonando = true;
            play.textContent = '❚❚'; avance.classList.add('avanzando');
            ctx.objetivo(null);
            ctx.pista('🔊 «' + texto + '»');
            const fin = () => { if (!ctx.vivo) return; play.textContent = '▶'; ctx.listo(); };
            if (PP.estado.voz && 'speechSynthesis' in window) {
              ctx.decir(texto, () => ctx.tras(300, fin));
              ctx.tras(9000, fin); // por si la voz no avisa que terminó
            } else ctx.tras(3500, fin);
          });
          ctx.etapa.append(sim.telefono(c.el));
          ctx.objetivo(play);
          ctx.fuera('Casi. Toque el triángulo ▶ que está en el mensaje de Carolina.');
        },
      },
    ],
  };

  const foto = {
    id: 'wsp-foto', icono: '🖼️', titulo: 'Ver una foto',
    pasos: [
      {
        texto: 'Carolina le mandó una foto. Tóquela para verla en grande.',
        ayuda: 'En la conversación hay un cuadro con una foto. Tóquelo.',
        render(ctx) {
          const c = sim.chat({ ...CAROLINA, mensajes: [
            ...HISTORIAL,
            { de: 'suya', foto: { emoji: '👦🎂', titulo: 'Cumpleaños de Tomás' }, texto: '¡Mire al Tomás en su cumpleaños! 🎈' },
          ] });
          const mini = c.el.querySelector('.foto-mini');
          mini.addEventListener('click', () => ctx.listo(true));
          ctx.etapa.append(sim.telefono(c.el));
          ctx.objetivo(mini);
          ctx.fuera('Casi. Toque el cuadro de la foto, en el mensaje de Carolina.');
        },
      },
      {
        texto: '¡Qué linda foto! Para volver a la conversación, toque la flecha ← de arriba.',
        render(ctx) {
          const flecha = h('button', { class: 'barra-volver claro', 'aria-label': 'Volver', onclick: () => ctx.listo() }, '←');
          const visor = h('div', { class: 'visor-foto' },
            h('div', { class: 'visor-cabeza' }, flecha, h('span', {}, 'Carolina (hija)')),
            h('div', { class: 'visor-imagen', role: 'img', 'aria-label': 'Foto de Tomás en su cumpleaños' }, h('span', {}, '👦🎂'), h('small', {}, '🎈 Cumpleaños de Tomás 🎈')));
          ctx.etapa.append(sim.telefono(visor, { oscuro: true }));
          ctx.objetivo(flecha);
          ctx.fuera('Casi. La flecha para volver está arriba, a la izquierda.');
        },
      },
      info('Ahora sabe abrir WhatsApp, escribir, mandar audios y ver fotos.', {
        emoji: '🌟', detalle: '¡Eso es muchísimo! Con esto ya puede estar en contacto con su familia todos los días.',
      }),
    ],
  };

  PP.nivel({
    n: 3, id: 'whatsapp', icono: '💬', titulo: 'WhatsApp',
    descripcion: 'Escribir mensajes, mandar audios y ver fotos.',
    compartir: 'Ya sé mandarles mensajes y audios por WhatsApp 😊',
    lecciones: [abrir, escribir, audio, foto],
  });
})();
