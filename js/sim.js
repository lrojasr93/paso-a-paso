/* Paso a Paso — simuladores: gestos, teléfono, teclado, marcador y chat */
(function () {
  'use strict';
  const { h } = PP;
  const sim = (PP.sim = {});

  // ---------- Gestos ----------

  // Deslizar un elemento en una dirección ('izquierda' | 'derecha' | 'arriba' | 'abajo')
  sim.deslizar = function (el, dir, alLograr, alQuedarCorto) {
    const horizontal = dir === 'izquierda' || dir === 'derecha';
    const signo = dir === 'izquierda' || dir === 'arriba' ? -1 : 1;
    let inicio = null, id = null;
    el.style.touchAction = 'none';
    el.addEventListener('pointerdown', (e) => {
      inicio = { x: e.clientX, y: e.clientY }; id = e.pointerId;
      try { el.setPointerCapture(id); } catch (err) {}
      el.style.transition = 'none';
    });
    el.addEventListener('pointermove', (e) => {
      if (!inicio || e.pointerId !== id) return;
      const d = horizontal ? e.clientX - inicio.x : e.clientY - inicio.y;
      el.style.transform = horizontal ? `translateX(${d}px)` : `translateY(${d}px)`;
    });
    const soltar = (e) => {
      if (!inicio || e.pointerId !== id) return;
      const dx = e.clientX - inicio.x, dy = e.clientY - inicio.y;
      const d = (horizontal ? dx : dy) * signo;
      const otro = Math.abs(horizontal ? dy : dx);
      inicio = null;
      el.style.transition = 'transform .35s ease';
      if (d > 50 && d > otro * 0.6) {
        el.style.transform = horizontal ? `translateX(${signo * 120}%)` : `translateY(${signo * 120}%)`;
        setTimeout(alLograr, 300);
      } else {
        el.style.transform = '';
        if (alQuedarCorto) alQuedarCorto(Math.abs(dx) + Math.abs(dy) < 10 ? 'toque' : 'corto');
      }
    };
    el.addEventListener('pointerup', soltar);
    el.addEventListener('pointercancel', soltar);
  };

  // Mantener presionado: llena un anillo y avisa si se suelta antes
  sim.mantener = function (el, ms, { alLograr, alSoltarAntes, alEmpezar, alSoltar } = {}) {
    let t0 = 0, raf = 0, logrado = false;
    el.style.touchAction = 'none';
    el.addEventListener('contextmenu', (e) => e.preventDefault());
    const pintar = () => {
      const p = Math.min(1, (performance.now() - t0) / ms);
      el.style.setProperty('--carga', p);
      if (p >= 1 && !logrado) { logrado = true; PP.vibrar(40); el.classList.add('cargado'); }
      if (t0) raf = requestAnimationFrame(pintar);
    };
    el.addEventListener('pointerdown', (e) => {
      if (logrado) return;
      try { el.setPointerCapture(e.pointerId); } catch (err) {}
      t0 = performance.now(); el.classList.add('presionado');
      if (alEmpezar) alEmpezar();
      raf = requestAnimationFrame(pintar);
    });
    const fin = () => {
      if (!t0) return;
      const dur = performance.now() - t0;
      t0 = 0; cancelAnimationFrame(raf); el.classList.remove('presionado');
      if (alSoltar) alSoltar(dur);
      if (logrado) alLograr && alLograr(dur);
      else { el.style.setProperty('--carga', 0); alSoltarAntes && alSoltarAntes(dur); }
    };
    el.addEventListener('pointerup', fin);
    el.addEventListener('pointercancel', fin);
  };

  // Agrandar: separar dos dedos, tocar dos veces, o Ctrl + rueda en computador
  sim.agrandar = function (el, alLograr) {
    const punteros = new Map();
    let distInicial = 0, hecho = false, ultimoToque = 0;
    el.style.touchAction = 'none';
    const lograr = () => { if (hecho) return; hecho = true; el.classList.add('agrandado'); alLograr(); };
    const dist = () => { const [a, b] = [...punteros.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
    el.addEventListener('pointerdown', (e) => {
      punteros.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (punteros.size === 2) distInicial = dist();
      const ahora = performance.now();
      if (punteros.size === 1 && ahora - ultimoToque < 450) lograr();
      ultimoToque = ahora;
    });
    el.addEventListener('pointermove', (e) => {
      if (!punteros.has(e.pointerId)) return;
      punteros.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (punteros.size === 2 && distInicial) {
        const escala = Math.max(1, Math.min(2.2, dist() / distInicial));
        el.style.transform = `scale(${escala})`;
        if (escala > 1.35) lograr();
      }
    });
    const quitar = (e) => { punteros.delete(e.pointerId); if (punteros.size < 2) distInicial = 0; };
    el.addEventListener('pointerup', quitar);
    el.addEventListener('pointercancel', quitar);
    el.addEventListener('wheel', (e) => { if (e.ctrlKey) { e.preventDefault(); lograr(); } }, { passive: false });
  };

  // ---------- Marco de teléfono ----------
  sim.telefono = function (contenido, o = {}) {
    return h('div', { class: 'movil' + (o.oscuro ? ' movil-oscuro' : '') },
      h('div', { class: 'movil-estado', 'aria-hidden': 'true' }, h('span', {}, '10:30'), h('span', {}, '📶 🔋')),
      h('div', { class: 'movil-pantalla' }, contenido));
  };

  // ---------- Teclado ----------
  const FILAS = ['qwertyuiop', 'asdfghjklñ', 'zxcvbnm'];
  sim.teclado = function (alTocar) {
    const tecla = (k, etiqueta, clase) =>
      h('button', { class: 'tecla ' + (clase || ''), 'data-k': k, 'aria-label': etiqueta || k.toUpperCase(),
        onclick: (e) => { e.stopPropagation(); alTocar(k, e.currentTarget); } }, etiqueta || k.toUpperCase());
    return h('div', { class: 'teclado', role: 'group', 'aria-label': 'Teclado' },
      FILAS.map((f, n) => h('div', { class: 'fila' },
        [...f].map((k) => tecla(k)),
        n === 2 ? tecla('⌫', '⌫', 'tecla-borrar') : null)),
      h('div', { class: 'fila' }, tecla(' ', 'espacio', 'tecla-espacio')));
  };

  // Escribir una palabra guiada letra por letra
  sim.escribirGuiado = function (ctx, salida, palabra, alTerminar) {
    palabra = palabra.toLowerCase();
    let i = 0;
    const mostrar = () => {
      const t = palabra.slice(0, i);
      salida.textContent = t ? t[0].toUpperCase() + t.slice(1) : '';
      salida.classList.toggle('vacio', !t);
    };
    const indicar = () => {
      tec.querySelectorAll('.brilla').forEach((k) => k.classList.remove('brilla'));
      const letra = palabra[i];
      const k = tec.querySelector(`[data-k="${letra}"]`);
      k.classList.add('brilla');
      ctx.objetivo(k);
      const nombre = letra === ' ' ? 'el espacio' : 'la ' + letra.toUpperCase();
      ctx.pista(i === 0 ? 'Busque ' + nombre + ' (está iluminada)' : 'Ahora, ' + nombre, i === 0 ? null : 'Ahora, ' + nombre);
    };
    const tec = sim.teclado((k, boton) => {
      if (k === palabra[i]) {
        i++; mostrar(); boton.classList.add('pulsada'); setTimeout(() => boton.classList.remove('pulsada'), 200);
        if (i === palabra.length) {
          tec.querySelectorAll('.brilla').forEach((x) => x.classList.remove('brilla'));
          ctx.pista('');
          alTerminar();
        } else indicar();
      } else if (k === '⌫') {
        ctx.casi('Ese botón sirve para borrar. Por ahora no hay nada que borrar: busque la letra iluminada.');
      } else {
        const esperada = palabra[i] === ' ' ? 'el espacio' : 'la ' + palabra[i].toUpperCase();
        ctx.casi('Esa es la ' + (k === ' ' ? 'barra de espacio' : k.toUpperCase()) + '. Busque ' + esperada + ', que está iluminada.');
      }
    });
    mostrar(); indicar();
    return tec;
  };

  // ---------- Marcador del teléfono ----------
  const formatoNumero = (d) => [d.slice(0, 1), d.slice(1, 5), d.slice(5, 9)].filter(Boolean).join(' ');
  sim.formatoNumero = formatoNumero;

  sim.marcarGuiado = function (ctx, numero, alTerminar) {
    let i = 0;
    const pantalla = h('div', { class: 'marcador-numero vacio' }, 'Marque el número');
    const teclas = h('div', { class: 'marcador' },
      [['1', ''], ['2', 'ABC'], ['3', 'DEF'], ['4', 'GHI'], ['5', 'JKL'], ['6', 'MNO'], ['7', 'PQRS'], ['8', 'TUV'], ['9', 'WXYZ'], ['*', ''], ['0', '+'], ['#', '']]
        .map(([n, letras]) => h('button', { class: 'marca-tecla', 'data-k': n, onclick: (e) => tocar(n, e.currentTarget) },
          h('span', {}, n), h('small', {}, letras))));
    const indicar = () => {
      teclas.querySelectorAll('.brilla').forEach((k) => k.classList.remove('brilla'));
      const k = teclas.querySelector(`[data-k="${numero[i]}"]`);
      k.classList.add('brilla'); ctx.objetivo(k);
      ctx.pista(i ? 'Ahora, el ' + numero[i] : 'Empiece por el ' + numero[i] + ' (está iluminado)', i ? 'el ' + numero[i] : null);
    };
    function tocar(n, boton) {
      if (i >= numero.length) return;
      if (n === numero[i]) {
        i++; boton.classList.add('pulsada'); setTimeout(() => boton.classList.remove('pulsada'), 200);
        pantalla.textContent = formatoNumero(numero.slice(0, i)); pantalla.classList.remove('vacio');
        if (i === numero.length) { teclas.querySelectorAll('.brilla').forEach((k) => k.classList.remove('brilla')); ctx.pista(''); alTerminar(); }
        else indicar();
      } else {
        ctx.casi('Ese es el ' + n + '. Ahora va el ' + numero[i] + ', está iluminado.');
      }
    }
    indicar();
    return h('div', { class: 'marcador-app' }, pantalla, teclas);
  };

  // ---------- Pantalla de llamada ----------
  sim.llamada = function ({ nombre, avatar, estadoTxt, botones }) {
    return h('div', { class: 'llamada' },
      h('div', { class: 'llamada-info' },
        h('div', { class: 'llamada-avatar', 'aria-hidden': 'true' }, avatar),
        h('div', { class: 'llamada-nombre' }, nombre),
        h('div', { class: 'llamada-estado' }, estadoTxt)),
      h('div', { class: 'llamada-botones' }, botones));
  };
  sim.botonLlamada = (tipo, etiqueta, onclick) =>
    h('div', { class: 'llamada-btn-cont' },
      h('button', { class: 'btn-circ ' + (tipo === 'verde' ? 'circ-verde' : 'circ-rojo'), 'aria-label': etiqueta, onclick },
        h('span', { class: tipo === 'rojo' ? 'colgar' : '', 'aria-hidden': 'true' }, '📞')),
      h('span', {}, etiqueta));

  // ---------- Pantalla de inicio del teléfono ----------
  sim.APPS = [
    { id: 'telefono', nombre: 'Teléfono', icono: '📞', color: '#2E7D32' },
    { id: 'whatsapp', nombre: 'WhatsApp', icono: '💬', color: '#25D366' },
    { id: 'camara', nombre: 'Cámara', icono: '📷', color: '#455A64' },
    { id: 'fotos', nombre: 'Fotos', icono: '🖼️', color: '#F9A825' },
    { id: 'mensajes', nombre: 'Mensajes', icono: '✉️', color: '#1565C0' },
    { id: 'internet', nombre: 'Internet', icono: '🌐', color: '#0277BD' },
    { id: 'reloj', nombre: 'Reloj', icono: '⏰', color: '#6A1B9A' },
    { id: 'ajustes', nombre: 'Ajustes', icono: '⚙️', color: '#616161' },
  ];
  sim.escritorio = function (alTocarApp) {
    return h('div', { class: 'escritorio' },
      sim.APPS.map((a) => h('button', { class: 'app-icono', 'data-app': a.id, onclick: (e) => alTocarApp(a, e.currentTarget) },
        h('span', { class: 'app-cuadro', style: { background: a.color }, 'aria-hidden': 'true' }, a.icono),
        h('span', { class: 'app-nombre' }, a.nombre))));
  };

  // ---------- Chat estilo mensajería ----------
  sim.chat = function ({ nombre, avatar, mensajes = [] }) {
    const lista = h('div', { class: 'chat-lista' });
    const campo = h('div', { class: 'chat-campo vacio', role: 'textbox', 'aria-label': 'Mensaje' }, 'Mensaje');
    const accion = h('button', { class: 'chat-accion', 'aria-label': 'Micrófono' }, '🎤');
    const zonaTeclado = h('div', { class: 'chat-teclado' });
    const el = h('div', { class: 'chat' },
      h('div', { class: 'chat-cabeza' },
        h('span', { class: 'chat-volver', 'aria-hidden': 'true' }, '←'),
        h('span', { class: 'chat-avatar', 'aria-hidden': 'true' }, avatar),
        h('span', { class: 'chat-nombre' }, nombre, h('small', {}, 'en línea'))),
      lista,
      h('div', { class: 'chat-pie' }, campo, accion),
      zonaTeclado);

    // Baja hasta el último mensaje (también cuando el chat recién se muestra)
    function bajar() {
      lista.scrollTop = lista.scrollHeight;
      setTimeout(() => { lista.scrollTop = lista.scrollHeight; }, 30);
    }
    function burbuja(m) {
      const cls = 'burbuja ' + (m.de === 'yo' ? 'mia' : 'suya');
      const hora = h('span', { class: 'hora' }, m.hora || '10:30', m.de === 'yo' ? h('span', { class: 'checks' }, ' ✓✓') : null);
      if (m.foto) {
        return h('div', { class: cls + ' burbuja-foto' },
          h('button', { class: 'foto-mini', 'aria-label': 'Foto: ' + m.foto.titulo }, h('span', { 'aria-hidden': 'true' }, m.foto.emoji)),
          m.texto ? h('div', {}, m.texto) : null, hora);
      }
      if (m.audio) {
        return h('div', { class: cls + ' burbuja-audio' },
          h('button', { class: 'audio-play', 'aria-label': 'Escuchar audio' }, '▶'),
          h('span', { class: 'audio-onda', 'aria-hidden': 'true' }, h('span', { class: 'audio-avance' })),
          h('span', { class: 'audio-dur' }, m.audio), hora);
      }
      return h('div', { class: cls }, m.texto, hora);
    }
    function agregar(m) {
      const b = burbuja(m);
      lista.append(b);
      bajar();
      return b;
    }
    let escribiendoEl = null;
    function escribiendo(si) {
      if (si && !escribiendoEl) { escribiendoEl = h('div', { class: 'burbuja suya escribiendo' }, 'escribiendo…'); lista.append(escribiendoEl); bajar(); }
      if (!si && escribiendoEl) { escribiendoEl.remove(); escribiendoEl = null; }
    }
    mensajes.forEach(agregar);
    return { el, lista, campo, accion, zonaTeclado, agregar, escribiendo };
  };
})();
