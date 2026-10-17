/* Nivel 4 — Cuidarse de estafas */
(function () {
  'use strict';
  const { h } = PP;
  const info = PP.p.info;

  const reglas = {
    id: 'estafas-reglas', icono: '🛡️', titulo: 'Las 4 reglas de oro',
    pasos: [
      info('Hay personas que usan el celular para engañar. Con 4 reglas simples, usted se protege.', {
        emoji: '🛡️', detalle: 'No es para asustarse: es para estar tranquilo.',
      }),
      info('Regla 1: Su banco NUNCA le va a pedir claves.', {
        emoji: '🏦', detalle: 'Ni por teléfono, ni por mensaje, ni por WhatsApp. Si alguien le pide una clave o un código, es estafa. Corte.',
      }),
      info('Regla 2: Si le piden plata con urgencia, desconfíe.', {
        emoji: '⏰', detalle: 'Aunque digan que es un familiar. Corte, y llame usted al número de siempre de esa persona.',
      }),
      info('Regla 3: No toque los enlaces que llegan en mensajes raros.', {
        emoji: '🔗', detalle: 'Un enlace es una dirección de internet, en letras azules, como www.algo.com. Si el mensaje es de alguien que no conoce, no lo toque.',
      }),
      info('Regla 4: Preguntar no es molestar.', {
        emoji: '🤝', detalle: 'Si tiene dudas, antes de hacer nada, pregúntele a alguien de confianza. Siempre hay tiempo para preguntar.',
      }),
    ],
  };

  // Un caso para decidir: ¿confiable o estafa?
  function caso({ tipo, remitente, texto, esEstafa, explicacion, senales }) {
    return {
      texto: '¿Este mensaje es confiable o es una estafa?',
      voz: '¿Este mensaje es confiable, o es una estafa? Léalo con calma. Dice así: ' + texto.replace(/https?:\/\/\S+/g, 'un enlace de internet') + '. ¿Qué le parece?',
      clase: 'etapa-arriba',
      demoraMano: 20000,
      render(ctx) {
        const TIPOS = { llamada: ['📞', 'Llamada'], whatsapp: ['💬', 'WhatsApp'], app: ['🏦', 'Aviso dentro de la app del banco'], sms: ['✉️', 'Mensaje de texto (SMS)'] };
        const [icono, etiqueta] = TIPOS[tipo] || TIPOS.sms;
        const tarjeta = h('div', { class: 'caso caso-' + tipo },
          h('div', { class: 'caso-cabeza' }, h('span', { 'aria-hidden': 'true' }, icono), ' ', etiqueta, ' · ', h('strong', {}, remitente)),
          h('p', { class: 'caso-texto', html: texto.replace(/(https?:\/\/\S+)/g, '<span class="enlace-falso">$1</span>') }));
        const respuesta = h('div', { class: 'caso-respuesta', hidden: true });
        const btnOk = h('button', { class: 'btn btn-opcion' }, '✅ Es confiable');
        const btnMal = h('button', { class: 'btn btn-opcion' }, '🚩 Es estafa');
        const botones = h('div', { class: 'botones-fila' }, btnOk, btnMal);
        const responder = (dijoEstafa) => {
          const acerto = dijoEstafa === esEstafa;
          botones.remove();
          const seguir = h('button', { class: 'btn btn-verde btn-grande', onclick: () => ctx.listo(true) }, 'Siguiente ▶');
          respuesta.className = 'caso-respuesta ' + (esEstafa ? 'es-estafa' : 'es-confiable');
          respuesta.replaceChildren(
            h('p', { class: 'caso-veredicto' }, acerto ? '¡Bien visto! ' : 'Esta vez no, pero para eso practicamos. ',
              esEstafa ? '🚩 Es una estafa.' : '✅ Es confiable.'),
            h('p', {}, explicacion),
            senales ? h('ul', { class: 'lista-consejos' }, senales.map((s) => h('li', {}, s))) : null,
            seguir);
          respuesta.hidden = false;
          if (acerto) PP.vibrar(30);
          ctx.decir((acerto ? '¡Bien visto! ' : 'Esta vez no, pero para eso practicamos. ') +
            (esEstafa ? 'Es una estafa. ' : 'Es confiable. ') + explicacion);
          ctx.objetivo(seguir, 'tocar', 25000);
          respuesta.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        };
        tarjeta.addEventListener('click', (e) => {
          if (e.target.closest('.enlace-falso')) ctx.casi('¡Ojo! Eso es un enlace. Aquí no pasa nada, pero en su celular, no toque enlaces de mensajes raros.');
        });
        btnOk.addEventListener('click', () => responder(false));
        btnMal.addEventListener('click', () => responder(true));
        ctx.etapa.append(tarjeta, botones, respuesta);
        ctx.objetivo(botones);
      },
    };
  }

  PP.p.caso = caso; // también lo usa el nivel del banco

  const practicar = {
    id: 'estafas-casos', icono: '🕵️', titulo: '¿Es estafa? Practiquemos',
    pasos: [
      info('Le vamos a mostrar mensajes. Usted decide si son confiables o estafas.', {
        emoji: '🕵️', detalle: 'No hay respuestas malas: cada una le enseña algo.', boton: 'Empecemos ▶',
      }),
      caso({
        tipo: 'sms', remitente: '+56 9 4471 2093',
        texto: 'BANCO: Su cuenta fue BLOQUEADA por seguridad. Para desbloquearla ingrese HOY a http://banco-cl-seguro.com',
        esEstafa: true,
        explicacion: 'Los bancos no bloquean su cuenta por mensaje ni le mandan enlaces para “desbloquear”.',
        senales: ['Viene de un número desconocido.', 'Le apura: “HOY”.', 'Tiene un enlace raro para tocar.'],
      }),
      caso({
        tipo: 'whatsapp', remitente: '+56 9 3318 7720 (número nuevo)',
        texto: 'Hola, soy yo 😢 se me cayó el celular al agua y este es mi número nuevo. ¿Me puede transferir $180.000? Es urgente, después le explico.',
        esEstafa: true,
        explicacion: 'Es una estafa muy común. Antes de nada, llame al número de siempre de su familiar para preguntarle.',
        senales: ['“Número nuevo”.', 'Pide plata con urgencia.', 'No dice su nombre: “soy yo”.'],
      }),
      caso({
        tipo: 'whatsapp', remitente: 'Carolina (hija) — contacto guardado',
        texto: '¿Almorzamos el domingo? Yo llevo las empanadas 🥟',
        esEstafa: false,
        explicacion: 'Viene del número que usted ya tiene guardado, y no le pide plata, claves ni que toque enlaces.',
      }),
      caso({
        tipo: 'sms', remitente: 'Aviso de envío',
        texto: 'Su paquete está RETENIDO por dirección incompleta. Pague $1.990 para liberarlo en http://envios-cl-entrega.top',
        esEstafa: true,
        explicacion: 'Si no está esperando un paquete, ignórelo. Y si lo espera, pregunte directamente a la tienda donde compró.',
        senales: ['Le pide pagar por un enlace.', 'La dirección de internet es extraña.'],
      }),
      caso({
        tipo: 'llamada', remitente: 'Número desconocido',
        texto: '«Buenas tardes, le hablo del departamento de seguridad de su banco. Detectamos un fraude en su tarjeta. Para protegerla, necesito que me dicte el código que le acaba de llegar por mensaje.»',
        esEstafa: true,
        explicacion: 'Nadie del banco le va a pedir códigos ni claves. Corte, y si está preocupado, llame usted al número que sale detrás de su tarjeta.',
        senales: ['Le pide un código o clave.', 'Le asusta con un “fraude”.'],
      }),
      caso({
        tipo: 'sms', remitente: 'PREMIOS',
        texto: '¡FELICIDADES! Usted ganó un televisor en nuestro sorteo 🎁. Para recibirlo, pague el despacho en http://premio-chile.net',
        esEstafa: true,
        explicacion: 'Si no participó en ningún sorteo, no ganó nada. Nadie regala premios pidiendo que pague primero.',
      }),
      caso({
        tipo: 'sms', remitente: 'Consultorio',
        texto: 'Recordatorio: tiene hora con el médico general el jueves 15 a las 10:30. Si no puede asistir, llame al consultorio.',
        esEstafa: false,
        explicacion: 'Solo le recuerda una hora. No le pide plata, ni claves, ni que toque enlaces. Si tiene dudas, puede llamar al consultorio al número que usted ya conoce.',
      }),
      info('Recuerde: ante la duda, no haga nada y pregunte.', {
        emoji: '🛡️', detalle: 'Colgar o no responder nunca es de mala educación cuando algo le parece raro.',
      }),
    ],
  };

  PP.nivel({
    n: 4, id: 'estafas', icono: '🛡️', titulo: 'Cuidarse de estafas',
    descripcion: 'Aprenda a reconocer mensajes y llamadas falsas.',
    compartir: 'Ya sé reconocer mensajes y llamadas de estafa 🛡️',
    lecciones: [reglas, practicar],
  });
})();
