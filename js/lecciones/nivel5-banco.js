/* Nivel 5 — Mi banco en el celular (banco ficticio de práctica) */
(function () {
  'use strict';
  const { h, sim } = PP;
  const info = PP.p.info;

  const CLAVE = '2580';
  const pesos = (n) => '$ ' + Number(n || 0).toLocaleString('es-CL');
  const SALDO = 245380;
  const MOVIMIENTOS = [
    { fecha: '17 oct', detalle: 'Pensión', monto: 214000 },
    { fecha: '15 oct', detalle: 'Farmacia', monto: -12490 },
    { fecha: '12 oct', detalle: 'Supermercado', monto: -38760 },
    { fecha: '10 oct', detalle: 'Cuenta de la luz', monto: -21300 },
  ];

  // Pantalla de la app del banco
  function appBanco(titulo, ...cuerpo) {
    return h('div', { class: 'banco' },
      h('div', { class: 'banco-cabeza' }, h('span', {}, '🏦 Mi Banco'), titulo ? h('small', {}, titulo) : null),
      h('div', { class: 'banco-cuerpo' }, cuerpo));
  }
  function inicioBanco(alTocar) {
    const botones = ['Ver movimientos', 'Transferir', 'Pagar cuentas'].map((t) =>
      h('button', { class: 'banco-boton', 'data-accion': t, onclick: (e) => alTocar(t, e.currentTarget) }, t));
    const pant = appBanco('Hola 👋',
      h('div', { class: 'banco-saldo' }, h('small', {}, 'Cuenta Vista · Saldo disponible'), h('strong', {}, pesos(SALDO))),
      h('div', { class: 'banco-botones' }, botones));
    return { pant, boton: (t) => botones.find((b) => b.dataset.accion === t) };
  }
  // Paso: escribir la clave de práctica
  function pasoClave(texto, voz, alFinal) {
    return {
      texto, voz, clase: 'etapa-arriba',
      ayuda: 'Toque los números iluminados, uno por uno: dos, cinco, ocho, cero. En vez de números, aparecen puntitos: así nadie más ve su clave.',
      render(ctx) {
        const teclado = sim.digitosGuiado(ctx, CLAVE, {
          vacio: '_ _ _ _', formato: (d) => '● '.repeat(d.length).trim(), clase: 'clave',
          arriba: alFinal ? alFinal() : null,
        }, () => ctx.listo());
        ctx.etapa.append(sim.telefono(appBanco('Clave', teclado)));
      },
    };
  }

  const entrar = {
    id: 'banco-entrar', icono: '🔑', titulo: 'Entrar a la app del banco',
    pasos: [
      info('Con la app del banco puede ver su plata y pagar sin ir a la sucursal.', {
        emoji: '🏦', detalle: 'Vamos a practicar con un banco de mentira, “Mi Banco”. Aquí no se mueve plata de verdad.',
      }),
      {
        texto: 'Busque la aplicación “Mi Banco” y tóquela.',
        ayuda: 'Busque el cuadrado azul oscuro con un edificio de banco, que dice Mi Banco abajo.',
        render(ctx) {
          const esc = sim.escritorio((app) => {
            if (app.id === 'banco') ctx.listo();
            else ctx.casi('Esa es la aplicación ' + app.nombre + '. Mi Banco es la azul oscuro, con un edificio.');
          });
          ctx.etapa.append(sim.telefono(esc));
          ctx.objetivo(esc.querySelector('[data-app="banco"]'));
        },
      },
      pasoClave('Escriba la clave de práctica: 2 5 8 0',
        'Para entrar, el banco le pide su clave. Para practicar, usaremos la clave: dos, cinco, ocho, cero. Toque los números iluminados, uno por uno.',
        () => h('div', { class: 'banco-rut' }, h('small', {}, 'RUT'), h('span', {}, '12.345.678-5'))),
      info('¡Entró! Ahora, algo muy importante: su clave de verdad es secreta.', {
        emoji: '🤫',
        detalle: 'No se la diga a nadie: ni a quien llama diciendo que es del banco, ni por WhatsApp. El banco nunca se la va a pedir. Y no la anote junto al celular.',
      }),
    ],
  };

  const saldo = {
    id: 'banco-saldo', icono: '📊', titulo: 'Ver su saldo y sus gastos',
    pasos: [
      {
        texto: 'Este es su saldo: la plata que tiene en la cuenta. Toque “Ver movimientos” para ver en qué se gastó.',
        voz: 'Este es su saldo: la plata que tiene hoy en la cuenta, doscientos cuarenta y cinco mil pesos. Ahora toque el botón que dice Ver movimientos.',
        ayuda: 'Debajo del saldo hay tres botones. Toque el que dice Ver movimientos.',
        render(ctx) {
          const { pant, boton } = inicioBanco((t) => {
            if (t === 'Ver movimientos') ctx.listo();
            else ctx.casi('Ese botón es para ' + t.toLowerCase() + '. Busque el que dice “Ver movimientos”.');
          });
          ctx.etapa.append(sim.telefono(pant));
          ctx.objetivo(boton('Ver movimientos'));
        },
      },
      {
        texto: 'Mire la lista. ¿Cuánto gastó en la farmacia?',
        voz: 'Esta es la lista de lo que entró y salió de su cuenta. Mírela con calma. ¿Cuánto gastó en la farmacia? Toque la respuesta de abajo.',
        ayuda: 'Busque en la lista la fila que dice Farmacia. A la derecha está el monto. Después toque ese monto en los botones de abajo.',
        clase: 'etapa-arriba', demoraMano: 20000,
        render(ctx) {
          const lista = appBanco('Movimientos', MOVIMIENTOS.map((m) =>
            h('div', { class: 'banco-mov' },
              h('span', { class: 'banco-mov-fecha' }, m.fecha),
              h('span', { class: 'banco-mov-detalle' }, m.detalle),
              h('span', { class: 'banco-mov-monto ' + (m.monto > 0 ? 'entra' : 'sale') }, (m.monto > 0 ? '+ ' : '− ') + pesos(Math.abs(m.monto))))));
          const opciones = [12490, 38760, 214000].map((n) =>
            h('button', { class: 'btn btn-opcion', onclick: () => {
              if (n === 12490) return ctx.listo();
              const mov = MOVIMIENTOS.find((m) => Math.abs(m.monto) === n);
              ctx.casi('Ese es el monto de: ' + mov.detalle + '. Busque la fila que dice Farmacia.');
            } }, pesos(n)));
          const fila = h('div', { class: 'botones-fila' }, opciones);
          ctx.etapa.append(sim.telefono(lista), fila);
          ctx.objetivo(opciones[0]);
        },
      },
      info('Lo que tiene signo menos (−) es plata que salió. Lo que tiene signo más (+) es plata que entró, como la pensión.', {
        emoji: '🔎', detalle: 'Revise sus movimientos de vez en cuando. Si ve un gasto que usted no hizo, llame a su banco de inmediato.',
      }),
    ],
  };

  const transferir = {
    id: 'banco-transferir', icono: '💸', titulo: 'Transferir plata a un familiar',
    pasos: [
      info('Transferir es mandar plata de su cuenta a la de otra persona, sin usar efectivo.', {
        emoji: '💸', detalle: 'Lo más seguro es transferir solo a personas que ya tiene guardadas en la app, como sus hijos.',
      }),
      {
        texto: 'Toque “Transferir”.',
        render(ctx) {
          const { pant, boton } = inicioBanco((t) => {
            if (t === 'Transferir') ctx.listo();
            else ctx.casi('Ese botón es para ' + t.toLowerCase() + '. Busque el que dice “Transferir”.');
          });
          ctx.etapa.append(sim.telefono(pant));
          ctx.objetivo(boton('Transferir'));
        },
      },
      {
        texto: '¿A quién le quiere transferir? Toque a Carolina.',
        ayuda: 'Son las personas que ya guardó. Toque la fila que dice Carolina.',
        render(ctx) {
          const personas = [['👩', 'Carolina (hija)', 'carolina'], ['🧔', 'Pedro (vecino)', 'pedro']].map(([ic, nom, id]) =>
            h('button', { class: 'banco-destino', 'data-id': id, onclick: () => {
              if (id === 'carolina') ctx.listo();
              else ctx.casi('Ese es ' + nom + '. Busque a Carolina, la primera.');
            } }, h('span', { 'aria-hidden': 'true' }, ic), h('span', {}, h('strong', {}, nom), h('small', {}, 'Cuenta Vista'))));
          ctx.etapa.append(sim.telefono(appBanco('Transferir a…', personas)));
          ctx.objetivo(personas[0]);
        },
      },
      {
        texto: 'Escriba el monto: 10.000 pesos.',
        voz: 'Ahora escriba cuánta plata le quiere mandar: diez mil pesos. Es un uno y cuatro ceros. Toque los números iluminados.',
        ayuda: 'Diez mil se escribe con un uno y cuatro ceros. Toque el número iluminado, y después el que se ilumine.',
        clase: 'etapa-arriba',
        render(ctx) {
          const teclado = sim.digitosGuiado(ctx, '10000', {
            vacio: '$ 0', formato: pesos,
            arriba: h('div', { class: 'banco-rut' }, h('small', {}, 'Para'), h('span', {}, '👩 Carolina (hija)')),
          }, () => ctx.listo());
          ctx.etapa.append(sim.telefono(appBanco('Monto', teclado)));
        },
      },
      {
        texto: 'Antes de confirmar, revise el nombre y el monto. Si está todo bien, toque “Confirmar”.',
        ayuda: 'Mire que diga Carolina y diez mil pesos. Después toque el botón verde que dice Confirmar.',
        render(ctx) {
          const confirmar = h('button', { class: 'banco-confirmar', onclick: () => ctx.listo() }, 'Confirmar');
          ctx.etapa.append(sim.telefono(appBanco('Revise antes de confirmar',
            h('dl', { class: 'banco-resumen' },
              h('dt', {}, 'Para'), h('dd', {}, 'Carolina (hija)'),
              h('dt', {}, 'Monto'), h('dd', {}, h('strong', {}, pesos(10000))),
              h('dt', {}, 'Desde'), h('dd', {}, 'Cuenta Vista')),
            confirmar)));
          ctx.objetivo(confirmar);
          ctx.fuera('Casi. Revise los datos y después toque el botón verde “Confirmar”.');
        },
      },
      pasoClave('Para confirmar, el banco le pide su clave: 2 5 8 0',
        'Para confirmar, el banco le pide su clave otra vez. Escriba: dos, cinco, ocho, cero. Recuerde: la clave se escribe solo aquí, dentro de la app del banco. Nunca por teléfono.'),
      info('¡Transferencia lista! Carolina ya recibió 10.000 pesos.', {
        emoji: '✅',
        extra: () => h('div', { class: 'banco-comprobante' },
          h('strong', {}, 'Comprobante'),
          h('span', {}, 'Para: Carolina (hija)'),
          h('span', {}, 'Monto: ' + pesos(10000)),
          h('span', {}, 'N° de operación: 48213907')),
        voz: 'Transferencia lista. Carolina ya recibió diez mil pesos. El comprobante muestra a quién le mandó, cuánto, y un número de operación por si tiene que reclamar.',
      }),
    ],
  };

  const caso = PP.p.caso;
  const seguro = {
    id: 'banco-seguro', icono: '🛡️', titulo: 'Usar el banco con seguridad',
    pasos: [
      info('Cuando termine de usar la app del banco, toque “Salir”.', {
        emoji: '🚪', detalle: 'Así, si alguien toma su celular, no puede entrar a su cuenta.',
      }),
      info('Si pierde el celular o la tarjeta, llame de inmediato a su banco para bloquearlos.', {
        emoji: '📞', detalle: 'El número está detrás de su tarjeta. Anótelo en un papel y guárdelo en su casa, no junto al celular.',
      }),
      caso({
        tipo: 'llamada', remitente: 'Número desconocido',
        texto: '«Le hablo del banco. Para proteger su cuenta de un fraude, necesito que instale una aplicación que le voy a mandar por mensaje.»',
        esEstafa: true,
        explicacion: 'Nadie del banco le va a pedir que instale aplicaciones. Esa aplicación le daría a un desconocido el control de su celular. Corte.',
        senales: ['Le pide instalar algo.', 'Le asusta con un “fraude”.'],
      }),
      caso({
        tipo: 'app', remitente: 'Mi Banco',
        texto: 'Usted transfirió $10.000 a Carolina (hija). N° de operación 48213907.',
        esEstafa: false,
        explicacion: 'Es el aviso de una transferencia que usted hizo. Llega dentro de la app y no le pide nada.',
      }),
      info('¡Ya sabe usar el banco en el celular, y con cuidado!', {
        emoji: '🌟', detalle: 'Si alguna vez duda de algo, no haga nada y pregunte a alguien de confianza o llame a su banco.',
      }),
    ],
  };

  PP.nivel({
    n: 5, id: 'banco', icono: '🏦', titulo: 'Mi banco en el celular',
    descripcion: 'Entrar a la app, ver el saldo, transferir y cuidarse.',
    compartir: 'Ya sé ver mi saldo y transferir desde el celular 🏦',
    lecciones: [entrar, saldo, transferir, seguro],
  });
})();
