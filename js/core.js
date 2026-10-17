/* Paso a Paso — núcleo: estado, voz, navegación y reproductor de lecciones */
(function () {
  'use strict';

  const PP = (window.PP = { niveles: [], p: {} });

  // ---------- Estado guardado en el teléfono ----------
  const CLAVE = 'pasoapaso.v1';
  function cargar() {
    try { return JSON.parse(localStorage.getItem(CLAVE)) || {}; } catch (e) { return {}; }
  }
  const estado = (PP.estado = Object.assign({ hechas: {}, voz: true, bienvenida: false }, cargar()));
  function guardar() {
    try { localStorage.setItem(CLAVE, JSON.stringify(estado)); } catch (e) { /* sin almacenamiento: seguimos igual */ }
  }
  PP.guardar = guardar;

  // ---------- Utilidades ----------
  function h(tag, attrs, ...hijos) {
    const el = document.createElement(tag);
    for (const k in attrs || {}) {
      const v = attrs[k];
      if (v === false || v == null) continue;
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    hijos.flat(Infinity).forEach((c) => {
      if (c == null || c === false) return;
      el.append(c.nodeType ? c : document.createTextNode(String(c)));
    });
    return el;
  }
  PP.h = h;
  PP.azar = (lista) => lista[Math.floor(Math.random() * lista.length)];

  // ---------- Voz ----------
  const hayVoz = 'speechSynthesis' in window;
  const voz = (PP.voz = {
    elegida: null,
    elegir() {
      if (!hayVoz) return;
      const vs = speechSynthesis.getVoices();
      const busca = (p) => vs.find((v) => v.lang.replace('_', '-').toLowerCase().startsWith(p));
      this.elegida = busca('es-cl') || busca('es-us') || busca('es-419') || busca('es-mx') || busca('es');
    },
    decir(texto, alTerminar) {
      if (!hayVoz || !estado.voz || !texto) { if (alTerminar) alTerminar(); return; }
      const limpio = String(texto)
        .replace(/[\u{1F000}-\u{1FAFF}\u{2190}-\u{21FF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu, '')
        .replace(/\s+/g, ' ').trim();
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(limpio);
      if (this.elegida) { u.voice = this.elegida; u.lang = this.elegida.lang; } else { u.lang = 'es-CL'; }
      u.rate = 0.9;
      if (alTerminar) { u.onend = alTerminar; u.onerror = alTerminar; }
      // Chrome a veces ignora un speak() inmediatamente después de cancel()
      setTimeout(() => speechSynthesis.speak(u), 60);
    },
    callar() { if (hayVoz) speechSynthesis.cancel(); },
  });
  if (hayVoz) { voz.elegir(); speechSynthesis.addEventListener('voiceschanged', () => voz.elegir()); }
  const vibrar = (ms) => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} };
  PP.vibrar = vibrar;

  // ---------- Niveles y lecciones ----------
  PP.nivel = function (def) { PP.niveles.push(def); PP.niveles.sort((a, b) => a.n - b.n); };
  PP.buscarLeccion = function (id) {
    for (const nv of PP.niveles) {
      const i = (nv.lecciones || []).findIndex((l) => l.id === id);
      if (i >= 0) return { nivel: nv, leccion: nv.lecciones[i], indice: i };
    }
    return null;
  };
  const nivelesActivos = () => PP.niveles.filter((n) => !n.pronto);
  const hechasDe = (nv) => (nv.lecciones || []).filter((l) => estado.hechas[l.id]).length;
  const nivelCompleto = (nv) => !nv.pronto && hechasDe(nv) === nv.lecciones.length;
  function siguienteLeccion() {
    for (const nv of nivelesActivos()) for (const l of nv.lecciones) if (!estado.hechas[l.id]) return { nivel: nv, leccion: l };
    return null;
  }

  // ---------- Plan Familia sin servidor: el avance viaja dentro de un enlace ----------
  // Códigos cortos y estables. No cambiar los existentes; las lecciones nuevas se agregan al final.
  const CODIGOS = (PP.CODIGOS = {
    'toques-tocar': 'a1', 'toques-deslizar': 'a2', 'toques-mantener': 'a3', 'toques-agrandar': 'a4', 'toques-volver': 'a5',
    'llamadas-contestar': 'b1', 'llamadas-marcar': 'b2', 'llamadas-contacto': 'b3',
    'wsp-abrir': 'c1', 'wsp-escribir': 'c2', 'wsp-audio': 'c3', 'wsp-foto': 'c4',
    'estafas-reglas': 'd1', 'estafas-casos': 'd2',
    'banco-entrar': 'e1', 'banco-saldo': 'e2', 'banco-transferir': 'e3', 'banco-seguro': 'e4',
  });

  // Patrocinador opcional, para demos: index.html?patrocinador=Nombre
  PP.patrocinador = (() => {
    try { return (new URLSearchParams(location.search).get('patrocinador') || '').trim().slice(0, 40) || null; } catch (e) { return null; }
  })();
  const notaPatrocinio = () => PP.patrocinador
    ? h('p', { class: 'patrocinio' }, '💛 Gratis gracias a ', h('strong', {}, PP.patrocinador))
    : null;
  PP.base = () => location.href.split('#')[0].split('?')[0].replace(/[^/]*$/, '');
  PP.enlaceAvance = function () {
    const cods = Object.keys(estado.hechas).filter((id) => estado.hechas[id] && CODIGOS[id]).map((id) => CODIGOS[id]).sort().join('');
    const dia = Math.floor(Date.now() / 864e5).toString(36);
    return PP.base() + 'familia.html#avance=' + (cods || '0') + '.' + dia;
  };
  PP.leerAvance = function (hash) {
    const m = /avance=([a-z0-9]*)\.([a-z0-9]+)/.exec(hash || '');
    if (!m) return null;
    const porCodigo = {};
    for (const id in CODIGOS) porCodigo[CODIGOS[id]] = id;
    const hechas = {};
    (m[1].match(/[a-z]\d+/g) || []).forEach((c) => { if (porCodigo[c]) hechas[porCodigo[c]] = true; });
    return { hechas, fecha: new Date(parseInt(m[2], 36) * 864e5) };
  };
  PP.enlacePedido = (id, de) => PP.base() + 'index.html#/pedido/' + id + (de ? '/' + encodeURIComponent(de) : '');

  // ---------- Navegación ----------
  const app = () => document.getElementById('app');
  function ir(destino) {
    const nuevo = '#/' + destino;
    if (location.hash === nuevo) ruta(); else location.hash = nuevo;
  }
  PP.ir = ir;
  function montar(...nodos) {
    detenerLeccion();
    const raiz = app();
    raiz.replaceChildren(...nodos);
    window.scrollTo(0, 0);
  }

  function ruta() {
    voz.callar();
    const [a, b, c] = location.hash.replace(/^#\/?/, '').split('/');
    if (a === 'pedido') return pantallaPedido(b, c);
    if (!estado.bienvenida) return pantallaBienvenida();
    if (a === 'nivel') return pantallaNivel(b);
    if (a === 'leccion') return jugar(b);
    return pantallaInicio();
  }

  // ---------- Pantallas ----------
  function botonVoz() {
    const b = h('button', {
      class: 'btn-voz', 'aria-pressed': String(estado.voz),
      onclick: () => {
        estado.voz = !estado.voz; guardar();
        b.replaceWith(botonVoz());
        if (estado.voz) voz.decir('Listo. Le voy a leer las instrucciones.'); else voz.callar();
      },
    }, estado.voz ? '🔊 Voz: Sí' : '🔇 Voz: No');
    return b;
  }

  function pantallaBienvenida() {
    const elegir = (conVoz) => {
      estado.voz = conVoz; estado.bienvenida = true; guardar();
      ir('');
      if (conVoz) setTimeout(() => voz.decir('¡Muy bien! Ya está listo para empezar. Toque el botón verde que dice Continuar.'), 250);
    };
    montar(h('section', { class: 'pantalla bienvenida' },
      h('div', { class: 'saludo-emoji', 'aria-hidden': 'true' }, '👋'),
      h('h1', {}, '¡Hola! Le damos la bienvenida a Paso a Paso'),
      h('p', { class: 'grande' }, 'Aquí va a aprender a usar su celular, con calma y a su ritmo.'),
      h('p', { class: 'tranquilo' }, '💛 Aquí no se puede romper nada. Puede equivocarse todas las veces que quiera.'),
      h('p', { class: 'pregunta' }, '¿Quiere que le lea las instrucciones en voz alta?'),
      h('div', { class: 'botones-col' },
        h('button', { class: 'btn btn-verde btn-grande', onclick: () => elegir(true) }, '🔊 Sí, léame en voz alta'),
        h('button', { class: 'btn btn-suave', onclick: () => elegir(false) }, 'No, prefiero leer')),
    ));
  }

  // Lección que un familiar le mandó por WhatsApp
  function pantallaPedido(id, de) {
    const enc = PP.buscarLeccion(id);
    if (!enc) return ir('');
    let quien = 'Su familia';
    try { if (de) quien = decodeURIComponent(de).slice(0, 40); } catch (e) {}
    const empezar = () => {
      if (!estado.bienvenida) { estado.bienvenida = true; estado.voz = true; guardar(); }
      ir('leccion/' + id);
    };
    montar(h('section', { class: 'pantalla bienvenida' },
      h('div', { class: 'saludo-emoji', 'aria-hidden': 'true' }, '💌'),
      h('h1', {}, quien + ' le invita a practicar'),
      h('div', { class: 'destacado' },
        h('p', { class: 'destacado-titulo' }, enc.leccion.icono + ' ' + enc.leccion.titulo),
        h('p', {}, 'Nivel ' + enc.nivel.n + ': ' + enc.nivel.titulo)),
      h('p', { class: 'tranquilo' }, '💛 Aquí no se puede romper nada. Vamos con calma, paso a paso.'),
      h('div', { class: 'botones-col' },
        h('button', { class: 'btn btn-verde btn-grande', onclick: empezar }, 'Empezar ▶'),
        h('button', { class: 'btn btn-suave', onclick: () => (estado.bienvenida ? ir('') : (location.hash = '#/')) }, 'Ahora no')),
    ));
    voz.decir(quien + ' le invita a practicar: ' + enc.leccion.titulo + '. Toque el botón verde para empezar.');
  }

  function pantallaInicio() {
    const sig = siguienteLeccion();
    const totalHechas = Object.keys(estado.hechas).length;
    const tarjetas = PP.niveles.map((nv) => {
      if (nv.pronto) {
        return h('div', { class: 'nivel nivel-pronto', 'aria-disabled': 'true' },
          h('span', { class: 'nivel-icono', 'aria-hidden': 'true' }, nv.icono),
          h('span', { class: 'nivel-texto' },
            h('span', { class: 'nivel-num' }, 'Nivel ' + nv.n),
            h('strong', {}, nv.titulo),
            h('span', { class: 'nivel-desc' }, 'Muy pronto')));
      }
      const hechas = hechasDe(nv), total = nv.lecciones.length;
      return h('button', { class: 'nivel' + (hechas === total ? ' nivel-listo' : ''), onclick: () => ir('nivel/' + nv.id) },
        h('span', { class: 'nivel-icono', 'aria-hidden': 'true' }, nv.icono),
        h('span', { class: 'nivel-texto' },
          h('span', { class: 'nivel-num' }, 'Nivel ' + nv.n),
          h('strong', {}, nv.titulo),
          h('span', { class: 'nivel-desc' }, nv.descripcion),
          h('span', { class: 'barra', role: 'img', 'aria-label': hechas + ' de ' + total + ' lecciones' },
            h('span', { style: { width: (100 * hechas) / total + '%' } }))),
        h('span', { class: 'nivel-estado' }, hechas === total ? '✅' : hechas + '/' + total));
    });

    const destacado = sig
      ? h('div', { class: 'destacado' },
          h('p', {}, totalHechas ? '¡Qué bueno verle de nuevo! Le sugerimos seguir con:' : 'Le sugerimos empezar por aquí:'),
          h('p', { class: 'destacado-titulo' }, sig.leccion.icono + ' ' + sig.leccion.titulo),
          h('button', { class: 'btn btn-verde btn-grande', id: 'continuar', onclick: () => ir('leccion/' + sig.leccion.id) },
            totalHechas ? 'Continuar ▶' : 'Comenzar ▶'))
      : h('div', { class: 'destacado' },
          h('p', { class: 'destacado-titulo' }, '🏆 ¡Terminó todas las lecciones disponibles!'),
          h('p', {}, 'Puede repetir las que quiera. Pronto habrá lecciones nuevas.'));

    montar(h('section', { class: 'pantalla inicio' },
      h('header', { class: 'cabecera' },
        h('div', { class: 'marca' }, h('img', { src: 'icons/icono.svg', alt: '', width: 40, height: 40 }), 'Paso a Paso'),
        botonVoz()),
      notaPatrocinio(),
      destacado,
      totalHechas ? h('div', { class: 'tarjeta-familia' },
        h('p', {}, h('strong', {}, '👨‍👩‍👧 Su familia'), ' puede ver todo lo que ha aprendido.'),
        h('a', { class: 'btn btn-whatsapp', target: '_blank', rel: 'noopener',
          href: enlaceWhatsApp('¡Hola! 😊 Mira todo lo que he aprendido en Paso a Paso: ' + PP.enlaceAvance()) }, '💬 Enviar mi avance')) : null,
      h('h2', {}, '¿Qué quiere aprender?'),
      h('div', { class: 'niveles' }, tarjetas),
      h('a', { class: 'link-familia', href: 'familia.html' }, '¿Es hijo, hija o familiar? Vea cómo acompañar →'),
    ));
  }

  function pantallaNivel(id) {
    const nv = PP.niveles.find((n) => n.id === id && !n.pronto);
    if (!nv) return ir('');
    montar(h('section', { class: 'pantalla' },
      h('button', { class: 'btn-atras', onclick: () => ir('') }, '← Volver al inicio'),
      h('div', { class: 'nivel-cabeza' },
        h('span', { class: 'nivel-icono grande', 'aria-hidden': 'true' }, nv.icono),
        h('div', {}, h('span', { class: 'nivel-num' }, 'Nivel ' + nv.n), h('h1', {}, nv.titulo))),
      h('p', { class: 'grande' }, nv.descripcion),
      notaPatrocinio(),
      h('ol', { class: 'lecciones' }, nv.lecciones.map((l) =>
        h('li', {}, h('button', { class: 'leccion' + (estado.hechas[l.id] ? ' hecha' : ''), onclick: () => ir('leccion/' + l.id) },
          h('span', { class: 'leccion-icono', 'aria-hidden': 'true' }, l.icono),
          h('span', { class: 'leccion-titulo' }, l.titulo),
          h('span', { class: 'leccion-estado' }, estado.hechas[l.id] ? '✅ Lista' : 'Empezar ▶'))))),
    ));
    voz.decir('Nivel ' + nv.n + ': ' + nv.titulo + '. Elija una lección.');
  }

  // ---------- Mano que indica dónde tocar ----------
  const mano = {
    el: null, visible: false,
    mostrar(destino, tipo) {
      this.el = this.el || document.getElementById('mano');
      if (!destino || !destino.isConnected) return;
      const r = destino.getBoundingClientRect();
      if (!r.width) return;
      if (r.bottom < 0 || r.top > innerHeight) destino.scrollIntoView({ block: 'center', behavior: 'smooth' });
      const r2 = destino.getBoundingClientRect();
      this.el.style.left = r2.left + r2.width / 2 - 22 + 'px';
      this.el.style.top = r2.top + r2.height / 2 - 6 + 'px';
      this.el.className = 'mano mano-' + (tipo || 'tocar');
      this.el.hidden = false; this.visible = true;
    },
    ocultar() { if (this.el) this.el.hidden = true; this.visible = false; },
  };
  addEventListener('resize', () => mano.ocultar());
  addEventListener('scroll', () => mano.ocultar(), { passive: true });

  // ---------- Reproductor de lecciones ----------
  let actual = null; // { temporizadores, turno }
  function detenerLeccion() {
    if (!actual) return;
    actual.temporizadores.forEach(clearTimeout);
    actual = null;
    mano.ocultar();
  }

  const ELOGIOS = ['¡Muy bien!', '¡Excelente!', '¡Perfecto!', '¡Así se hace!', '¡Lo hizo muy bien!', '¡Bravo!'];

  function jugar(id) {
    const encontrado = PP.buscarLeccion(id);
    if (!encontrado) return ir('');
    const { nivel, leccion } = encontrado;

    const instruccion = h('p', { class: 'instruccion', id: 'instruccion' });
    const pista = h('p', { class: 'pista', hidden: true });
    const etapa = h('div', { class: 'etapa' });
    const aviso = h('div', { class: 'aviso', role: 'status', hidden: true });
    const progresoTxt = h('span', { class: 'paso-num' });
    const progresoBarra = h('span', {});
    const raiz = h('section', { class: 'jugador' },
      h('div', { class: 'jugador-barra' },
        h('button', { class: 'btn-salir', onclick: () => ir('nivel/' + nivel.id) }, '✕ Salir'),
        h('div', { class: 'paso-progreso' }, progresoTxt, h('span', { class: 'barra' }, progresoBarra))),
      instruccion, pista, etapa, aviso,
      h('div', { class: 'jugador-ayuda' },
        h('button', { class: 'btn btn-suave', onclick: () => repetir() }, '🔊 Repetir'),
        h('button', { class: 'btn btn-suave', onclick: () => ayuda() }, '🙋 Ayuda')),
      h('p', { class: 'nota-calma' }, '💛 Aquí no se puede romper nada'));
    montar(raiz);

    const sesion = (actual = { temporizadores: [], turno: 0 });
    let i = 0, objetivo = null, tipoObjetivo = 'tocar', demoraMano = 8000, temporizadorMano = null, intentos = 0, textoVoz = '';

    const vivo = (turno) => actual === sesion && sesion.turno === turno;
    function tras(ms, fn) {
      const turno = sesion.turno;
      const t = setTimeout(() => { if (vivo(turno)) fn(); }, ms);
      sesion.temporizadores.push(t);
      return t;
    }
    function reiniciarMano() {
      clearTimeout(temporizadorMano);
      mano.ocultar();
      if (objetivo) temporizadorMano = tras(demoraMano, () => mano.mostrar(objetivo, tipoObjetivo));
    }
    etapa.addEventListener('pointerdown', () => { if (objetivo) reiniciarMano(); });

    function ocultarAviso() { aviso.hidden = true; aviso.replaceChildren(); }
    function repetir() { voz.decir(textoVoz); if (objetivo) mano.mostrar(objetivo, tipoObjetivo); }
    function ayuda() {
      const p = leccion.pasos[i];
      voz.decir(p.ayuda || 'Tranquilo, no hay apuro. ' + textoVoz);
      if (objetivo) mano.mostrar(objetivo, tipoObjetivo);
    }

    function paso() {
      sesion.turno++;
      const turno = sesion.turno;
      const p = leccion.pasos[i];
      objetivo = null; intentos = 0; demoraMano = p.demoraMano || 8000;
      clearTimeout(temporizadorMano); mano.ocultar(); ocultarAviso();
      instruccion.textContent = p.texto;
      pista.hidden = true;
      etapa.replaceChildren(); etapa.className = 'etapa ' + (p.clase || '');
      etapa.onclick = null;
      progresoTxt.textContent = 'Paso ' + (i + 1) + ' de ' + leccion.pasos.length;
      progresoBarra.style.width = (100 * i) / leccion.pasos.length + '%';
      textoVoz = p.voz || p.texto;
      voz.decir(textoVoz);

      const ctx = {
        etapa,
        get vivo() { return vivo(turno); },
        tras,
        decir: (t, fin) => voz.decir(t, fin),
        listo(silencioso) {
          if (!vivo(turno)) return;
          sesion.turno++; // evita que se llame dos veces
          clearTimeout(temporizadorMano); mano.ocultar(); ocultarAviso();
          if (silencioso) return avanzar();
          const elogio = PP.azar(ELOGIOS);
          vibrar(30);
          aviso.className = 'aviso aviso-bien'; aviso.hidden = false;
          aviso.replaceChildren(h('span', { 'aria-hidden': 'true' }, '⭐ '), elogio);
          voz.decir(elogio);
          const turnoBien = sesion.turno;
          const t = setTimeout(() => { if (vivo(turnoBien)) avanzar(); }, 1500);
          sesion.temporizadores.push(t);
        },
        objetivo(el, tipo, demora) {
          objetivo = el; tipoObjetivo = tipo || 'tocar';
          if (demora) demoraMano = demora;
          reiniciarMano();
        },
        casi(mensaje, mostrarEn) {
          if (!vivo(turno)) return;
          intentos++;
          aviso.className = 'aviso aviso-casi'; aviso.hidden = false;
          const hijos = [h('span', { 'aria-hidden': 'true' }, '💛 '), mensaje];
          if (intentos >= 3) {
            hijos.push(h('button', { class: 'btn-saltar', onclick: () => { voz.decir('No pasa nada. Seguimos.'); ctx.listo(true); } },
              '¿Seguimos al siguiente paso? →'));
          }
          aviso.replaceChildren(...hijos);
          voz.decir(mensaje);
          const destino = mostrarEn || objetivo;
          if (destino) mano.mostrar(destino, tipoObjetivo);
          vibrar(15);
        },
        instruccion(texto, hablado) {
          instruccion.textContent = texto;
          textoVoz = hablado || texto;
          voz.decir(textoVoz);
        },
        pista(texto, hablado) {
          pista.hidden = !texto; pista.textContent = texto || '';
          if (hablado) voz.decir(hablado);
        },
        // Toques dentro de la etapa que no caen en el objetivo
        fuera(mensaje, aceptar) {
          etapa.onclick = (e) => {
            if (!objetivo || objetivo.contains(e.target)) return;
            if (aceptar && e.target.closest(aceptar)) return;
            ctx.casi(mensaje);
          };
        },
        ocultarAviso,
      };
      p.render(ctx);
    }

    function avanzar() {
      i++;
      if (i < leccion.pasos.length) paso(); else terminar();
    }

    function terminar() {
      const eraCompleto = nivelCompleto(nivel);
      estado.hechas[leccion.id] = true; guardar();
      const completoAhora = !eraCompleto && nivelCompleto(nivel);
      const idx = nivel.lecciones.indexOf(leccion);
      const sig = nivel.lecciones[idx + 1] || (siguienteLeccion() || {}).leccion;
      celebrar(leccion, nivel, completoAhora, sig);
    }

    paso();
  }

  // ---------- Celebración ----------
  function confeti() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return null;
    const cont = h('div', { class: 'confeti', 'aria-hidden': 'true' });
    const piezas = ['🎉', '⭐', '💛', '🌼', '✨', '🎈'];
    for (let k = 0; k < 26; k++) {
      cont.append(h('span', { style: {
        left: Math.random() * 100 + '%',
        animationDelay: Math.random() * 1.2 + 's',
        animationDuration: 2.4 + Math.random() * 1.8 + 's',
        fontSize: 22 + Math.random() * 22 + 'px',
      } }, PP.azar(piezas)));
    }
    return cont;
  }

  function enlaceWhatsApp(texto) { return 'https://wa.me/?text=' + encodeURIComponent(texto); }
  PP.enlaceWhatsApp = enlaceWhatsApp;

  function celebrar(leccion, nivel, nivelTerminado, sig) {
    const titulo = nivelTerminado ? '¡Completó el Nivel ' + nivel.n + '!' : '¡Felicitaciones!';
    const detalle = nivelTerminado
      ? 'Terminó todo el nivel “' + nivel.titulo + '”. ' + nivel.compartir
      : 'Terminó la lección “' + leccion.titulo + '”.';
    const mensajeFamilia = '¡Hola! Terminé el nivel “' + nivel.titulo + '” en Paso a Paso 🎉 ' + nivel.compartir +
      ' Mira mi avance aquí: ' + PP.enlaceAvance();

    montar(h('section', { class: 'pantalla celebracion' },
      confeti(),
      h('div', { class: 'trofeo', 'aria-hidden': 'true' }, nivelTerminado ? '🏆' : '🎉'),
      h('h1', {}, titulo),
      h('p', { class: 'grande' }, detalle),
      h('p', { class: 'tranquilo' }, 'Cada paso cuenta. Lo está haciendo muy bien.'),
      h('div', { class: 'botones-col' },
        nivelTerminado
          ? h('a', { class: 'btn btn-whatsapp btn-grande', href: enlaceWhatsApp(mensajeFamilia), target: '_blank', rel: 'noopener' }, '💬 Contarle a mi familia')
          : null,
        sig ? h('button', { class: 'btn btn-verde btn-grande', onclick: () => ir('leccion/' + sig.id) }, 'Siguiente: ' + sig.titulo + ' ▶') : null,
        h('button', { class: 'btn btn-suave', onclick: () => ir('leccion/' + leccion.id) }, '↺ Repetir esta lección'),
        h('button', { class: 'btn btn-suave', onclick: () => ir('') }, '🏠 Volver al inicio')),
    ));
    voz.decir(titulo + ' ' + detalle + (nivelTerminado ? ' Si quiere, puede contarle a su familia tocando el botón verde.' : ''));
  }

  // ---------- Pasos reutilizables ----------
  PP.p.info = function (texto, o = {}) {
    return {
      texto, voz: o.voz, demoraMano: 15000,
      render(ctx) {
        const b = h('button', { class: 'btn btn-verde btn-grande', onclick: () => ctx.listo(true) }, o.boton || 'Entendido ▶');
        ctx.etapa.append(h('div', { class: 'info' },
          o.emoji ? h('div', { class: 'info-emoji', 'aria-hidden': 'true' }, o.emoji) : null,
          o.detalle ? h('p', { class: 'info-detalle' }, o.detalle) : null,
          o.extra ? o.extra() : null,
          b));
        ctx.objetivo(b);
      },
    };
  };

  // ---------- Inicio ----------
  PP.iniciar = function () {
    addEventListener('hashchange', ruta);
    ruta();
    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
      try { navigator.serviceWorker.register('sw.js').catch(() => {}); } catch (e) {}
    }
  };
})();
