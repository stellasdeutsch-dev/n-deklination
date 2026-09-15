(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- reveal on scroll ---------- */
  const revealIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      el.classList.add('in');
      if (el.hasAttribute('data-lines')) {
        $$('p', el).forEach((p, i) => { p.style.transitionDelay = (i * 0.22) + 's'; });
      }
      revealIO.unobserve(el);
    });
  }, { threshold: 0.01, rootMargin: '0px 0px -12% 0px' });
  $$('[data-reveal],[data-lines],[data-path]').forEach(el => revealIO.observe(el));

  /* ---------- counters ---------- */
  const countIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target, end = +el.dataset.count, t0 = performance.now(), dur = 1400;
      const tick = t => {
        const k = Math.min(1, (t - t0) / dur), v = Math.round(end * (1 - Math.pow(1 - k, 3)));
        el.textContent = v;
        if (k < 1) requestAnimationFrame(tick);
      };
      reduced ? (el.textContent = end) : requestAnimationFrame(tick);
      countIO.unobserve(el);
    });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach(el => countIO.observe(el));

  /* ---------- helper: run while visible ---------- */
  function whenVisible(el, onShow, onHide) {
    new IntersectionObserver(([e]) => (e.isIntersecting ? onShow() : onHide && onHide()), { threshold: 0.25 }).observe(el);
  }

  /* ---------- hero noun cycler ---------- */
  const heroForms = [
    { c: 'Nominativ', q: 'кто? что?', a: 'der', e: '', s: 'Der Student wohnt nebenan.' },
    { c: 'Genitiv', q: 'чей?', a: 'des', e: 'en', s: 'Das Zimmer des Studenten.' },
    { c: 'Dativ', q: 'кому?', a: 'dem', e: 'en', s: 'Ich helfe dem Studenten.' },
    { c: 'Akkusativ', q: 'кого? что?', a: 'den', e: 'en', s: 'Ich kenne den Studenten.' },
    { c: 'Plural', q: 'много', a: 'die', e: 'en', s: 'Die Studenten feiern.' }
  ];
  const hn = $('#heroNoun');
  if (hn) {
    const dots = $$('.nc-dots i', hn);
    const show = i => {
      const f = heroForms[i];
      hn.classList.add('swap');
      setTimeout(() => {
        $('.nc-case', hn).textContent = f.c;
        $('.nc-q', hn).textContent = f.q;
        $('.nc-art', hn).textContent = f.a;
        $('.nc-sent', hn).textContent = f.s;
        const end = $('.nc-end', hn);
        end.textContent = f.e;
        end.classList.remove('pop'); void end.offsetWidth; if (f.e) end.classList.add('pop');
        dots.forEach((d, k) => d.classList.toggle('on', k <= i));
        hn.classList.remove('swap');
      }, 260);
    };
    const orbit = $('#heroOrbit'), sats = $$('.sat', orbit), ring = $('.orbit-ring', orbit);
    const burst = () => {
      const end = $('.nc-end', hn); if (!end.textContent || reduced) return;
      const vr = orbit.getBoundingClientRect(), er = end.getBoundingClientRect();
      const x0 = er.left - vr.left + er.width / 2, y0 = er.top - vr.top + er.height / 2;
      for (let k = 0; k < 7; k++) {
        const sp = document.createElement('span'); sp.className = 'spark';
        sp.textContent = k % 2 ? '-en' : '•'; orbit.appendChild(sp);
        const a = (Math.PI * 2 * k) / 7 + Math.random() * .5, d = 50 + Math.random() * 40;
        sp.animate([
          { transform: `translate(${x0}px,${y0}px) scale(.4)`, opacity: 1 },
          { transform: `translate(${x0 + Math.cos(a) * d}px,${y0 + Math.sin(a) * d}px) scale(1)`, opacity: 0 }
        ], { duration: 800 + Math.random() * 300, easing: 'cubic-bezier(.2,.8,.3,1)' }).onfinish = () => sp.remove();
      }
    };
    let ang = Math.PI / 2, last = 0, raf = null, active = -1;
    const N = sats.length, step = (Math.PI * 2) / N, period = N * 2600;
    const frame = t => {
      if (last) ang += ((t - last) / period) * Math.PI * 2;
      last = t;
      const w = orbit.clientWidth, h = orbit.clientHeight;
      const cTop = hn.offsetTop, cH = hn.offsetHeight;
      const rx = w > 500 ? Math.min(w * 0.36, 215) : w * 0.49, ry = cH / 2 + (w > 500 ? 14 : 22);
      const cx = hn.offsetLeft + hn.offsetWidth / 2, cy = cTop + cH / 2;
      ring.style.setProperty('--ow', rx * 2 + 'px'); ring.style.setProperty('--oh', ry * 2 + 'px');
      ring.style.setProperty('--oy', (cy / h) * 100 + '%');
      let best = 0, bestD = 9;
      sats.forEach((s, i) => {
        const th = ang - i * step;
        const x = cx + Math.cos(th) * rx, y = cy + Math.sin(th) * ry;
        const depth = Math.sin(th); // 1 = front (bottom), -1 = back
        const sc = 0.72 + (depth + 1) * 0.2;
        s.style.transform = `translate(${x}px,${y}px) scale(${sc})`;
        s.style.zIndex = depth > 0 ? 6 : 1;
        s.style.opacity = 0.55 + (depth + 1) * 0.225;
        let d = Math.abs(((th - Math.PI / 2) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI);
        if (d < bestD) { bestD = d; best = i; }
      });
      if (best !== active) {
        active = best; sats.forEach((s, i) => s.classList.toggle('on', i === best));
        show(best); setTimeout(burst, 520);
      }
      raf = requestAnimationFrame(frame);
    };
    const start = () => { if (!raf && !reduced) { last = 0; raf = requestAnimationFrame(frame); } };
    const stop = () => { cancelAnimationFrame(raf); raf = null; };
    if (reduced) { sats.forEach((s, i) => { s.style.display = 'none'; }); }
    whenVisible(hn, start, stop);
  }

  /* ---------- groups toggles ---------- */
  $$('.g-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const more = btn.nextElementSibling;
      const open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      more.classList.toggle('open', !open);
      $$('.chips li', more).forEach((li, i) => { li.style.transitionDelay = open ? '0s' : (0.1 + i * 0.05) + 's'; });
      const label = btn.firstChild;
      if (label && label.nodeType === 3) {
        label.textContent = open ? label.textContent.replace('Скрыть', 'Показать') : label.textContent.replace('Показать', 'Скрыть');
      }
    });
  });

  /* ---------- stepper ---------- */
  const steps = [
    { c: 'Nominativ', w: ['der', ''], s: ['der', ''], de: 'Der Student <span class="muted-de">(Der Schüler)</span> wohnt nebenan.', ru: 'Студент (ученик) живёт по соседству.', n: 'Nominativ. Оба стоят. Оба в форме. Пока всё спокойно.' },
    { c: 'Genitiv', w: ['des', 'en'], s: ['des', 's'], de: 'Das ist das Zimmer des Student<em>en</em> (des Schülers).', ru: 'Это комната студента (ученика).', n: 'Genitiv. Сильный берёт ‑s. Слабый берёт ‑en. Думаешь, ну ладно, у обоих что-то добавилось.' },
    { c: 'Dativ', w: ['dem', 'en'], s: ['dem', ''], de: 'Ich helfe dem Student<em>en</em> (dem Schüler).', ru: 'Я помогаю студенту (ученику).', n: 'Dativ. Сильный говорит, мне ничего не надо. Слабый говорит, мне ‑en.' },
    { c: 'Akkusativ', w: ['den', 'en'], s: ['den', ''], de: 'Ich kenne den Student<em>en</em> (den Schüler).', ru: 'Я знаю этого студента (ученика).', n: 'Akkusativ. Сильный опять ничего. Слабый опять ‑en. Слабый последователен. Это единственное, в чём он сильный.' },
    { c: 'Plural', w: ['die', 'en'], s: ['die', ''], de: 'Die Student<em>en</em> (Die Schüler) feiern.', ru: 'Студенты (ученики) празднуют.', n: 'Множественное. У слабого снова ‑en, и так во всех четырёх падежах. Сильный живёт своей жизнью: die Schüler.' }
  ];
  const stepper = $('#stepper');
  if (stepper) {
    let si = 0, playing = !reduced, stTimer = null, visible = false;
    const weak = $('#stWeak'), strong = $('#stStrong');
    const bar = $$('.st-bar button', stepper);
    const playBtn = $('#stPlay');
    const setCol = (col, [art, end], animate) => {
      const a = $('.st-art', col), e = $('.st-end', col);
      if (a.textContent !== art && animate) { a.classList.remove('flip'); void a.offsetWidth; a.classList.add('flip'); setTimeout(() => (a.textContent = art), 220); }
      else a.textContent = art;
      if (e.textContent !== end) {
        e.textContent = end;
        e.classList.remove('pop'); void e.offsetWidth; if (end && animate) e.classList.add('pop');
      }
    };
    const render = (i, animate = true) => {
      si = i; const st = steps[i];
      $('#stCase').textContent = st.c;
      $('#stNum').textContent = i + 1;
      setCol(weak, st.w, animate); setCol(strong, st.s, animate);
      weak.classList.toggle('deflated', i > 0);
      if (i > 0 && animate) { const w = $('.st-word', weak); w.style.animation = 'none'; void w.offsetWidth; w.style.animation = ''; }
      const swap = [$('.st-sent', stepper), $('#stNote')];
      swap.forEach(x => x.classList.add('fade-swap'));
      setTimeout(() => {
        $('#stDe').innerHTML = st.de.replace('<span class="muted-de">', '').replace('</span>', '');
        $('#stRu').textContent = st.ru;
        $('#stNote').textContent = st.n;
        swap.forEach(x => x.classList.remove('fade-swap'));
      }, 220);
      bar.forEach((b, k) => { b.classList.toggle('on', k === i); b.classList.toggle('done', k < i); });
    };
    const schedule = () => {
      clearTimeout(stTimer);
      if (playing && visible) stTimer = setTimeout(() => { render((si + 1) % steps.length); schedule(); }, 3400);
    };
    const setPlaying = p => {
      playing = p;
      $('use', playBtn).setAttribute('href', p ? '#i-pause' : '#i-play');
      playBtn.setAttribute('aria-label', p ? 'Пауза' : 'Играть');
      schedule();
    };
    $('#stNext').addEventListener('click', () => { render((si + 1) % steps.length); setPlaying(false); });
    $('#stPrev').addEventListener('click', () => { render((si - 1 + steps.length) % steps.length); setPlaying(false); });
    playBtn.addEventListener('click', () => setPlaying(!playing));
    bar.forEach(b => b.addEventListener('click', () => { render(+b.dataset.i); setPlaying(false); }));
    render(0, false);
    whenVisible(stepper, () => { visible = true; schedule(); }, () => { visible = false; clearTimeout(stTimer); });
  }

  /* ---------- machine ---------- */
  const words = {
    Junge: { tr: 'мальчика', type: 'e' }, Mensch: { tr: 'человека', type: 'c' }, Herr: { tr: 'господина', type: 'list' },
    Nachbar: { tr: 'соседа', type: 'list' }, 'Löwe': { tr: 'льва', type: 'e' }, Polizist: { tr: 'полицейского', type: 'c' },
    'Bär': { tr: 'медведя', type: 'c' }, Kunde: { tr: 'клиента', type: 'e' }
  };
  const caseInfo = {
    nom: { art: 'der', de: w => `Das ist der ${w}.`, ru: 'Это {x}.' },
    gen: { art: 'des', de: w => `Das Handy des ${w}.`, ru: 'Телефон {g}.' },
    dat: { art: 'dem', de: w => `Ich spreche mit dem ${w}.`, ru: 'Я говорю с {d}.' },
    akk: { art: 'den', de: w => `Ich kenne den ${w}.`, ru: 'Я знаю {g}.' }
  };
  const ruNom = { Junge: 'мальчик', Mensch: 'человек', Herr: 'господин', Nachbar: 'сосед', 'Löwe': 'лев', Polizist: 'полицейский', 'Bär': 'медведь', Kunde: 'клиент' };
  const ruDat = { Junge: 'мальчиком', Mensch: 'человеком', Herr: 'господином', Nachbar: 'соседом', 'Löwe': 'львом', Polizist: 'полицейским', 'Bär': 'медведем', Kunde: 'клиентом' };
  const mc = $('.mc');
  if (mc) {
    let word = 'Junge', cas = 'akk', running = false;
    const nodes = $$('.node', mc), flow = $('#mcFlow'), res = $('#mcResult'), run = $('#mcRun');
    let demo = !reduced, demoTimer = null, mcVisible = false, demoIdx = 0;
    const demoBadge = $('#mcDemo');
    const stopDemo = () => {
      if (!demo) return;
      demo = false; clearTimeout(demoTimer);
      demoBadge.classList.add('off'); $('span', demoBadge).textContent = 'твой ход: выбирай слово и падеж';
    };
    const pick = (group, attr, cb) => $$('button', group).forEach(b => b.addEventListener('click', e => {
      if (e.isTrusted) stopDemo();
      $$('button', group).forEach(x => x.classList.toggle('on', x === b)); cb(b.dataset[attr]);
      b.classList.remove('demo-pick'); void b.offsetWidth; if (!e.isTrusted) b.classList.add('demo-pick');
      if (!running && e.isTrusted) machine();
    }));
    const demoSeq = [['Herr', 'dat'], ['Löwe', 'gen'], ['Polizist', 'akk'], ['Nachbar', 'gen'], ['Mensch', 'dat'], ['Kunde', 'nom'], ['Bär', 'akk'], ['Junge', 'dat']];
    const scheduleDemo = () => {
      clearTimeout(demoTimer);
      if (!demo || !mcVisible) return;
      demoTimer = setTimeout(async () => {
        if (!demo || running || !mcVisible) return scheduleDemo();
        const [w, c] = demoSeq[demoIdx++ % demoSeq.length];
        $(`#mcWords button[data-w="${w}"]`).click();
        await sleep(350);
        $(`#mcCases button[data-c="${c}"]`).click();
        await sleep(350);
        if (demo) await machine();
        scheduleDemo();
      }, 3200);
    };
    pick($('#mcWords'), 'w', v => (word = v));
    pick($('#mcCases'), 'c', v => (cas = v));

    const reset = () => {
      nodes.forEach(n => { n.classList.remove('active', 'passed', 'hit', 'flow'); const a = $('.ans', n); a.className = 'ans'; a.textContent = ''; });
    };
    const answer = (n, yes, text) => { const a = $('.ans', n); a.textContent = text || (yes ? 'да' : 'нет'); a.className = 'ans show ' + (yes ? 'yes' : 'no'); };

    async function machine() {
      running = true; run.disabled = true;
      reset(); flow.classList.add('running'); res.classList.add('hide');
      const info = words[word], ci = caseInfo[cas];
      const T = reduced ? 60 : 650;
      let end = '', why = '', hitIdx = 0;

      const visit = async (i, yes, label) => {
        nodes[i].classList.add('active'); await sleep(T);
        answer(nodes[i], yes, label); await sleep(T * 0.6);
        nodes[i].classList.remove('active');
        nodes[i].classList.add(yes ? 'hit' : 'passed');
        if (!yes && i < nodes.length - 1) { nodes[i].classList.add('flow'); await sleep(T * 0.5); }
      };

      if (cas === 'nom') { await visit(0, true); why = 'Nominativ — слабое в форме, ничего не добавляем.'; hitIdx = 0; }
      else {
        await visit(0, false);
        if (info.type === 'e') { await visit(1, true, '+n'); end = 'n'; why = 'Слово на -e — просто +n.'; hitIdx = 1; }
        else {
          await visit(1, false);
          if (info.type === 'list') { await visit(2, true, '+n'); end = 'n'; why = word === 'Herr' ? 'Herr в единственном берёт только -n. Во множественном — Herren.' : 'Nachbar из короткого списка: только -n.'; hitIdx = 2; }
          else { await visit(2, false); await visit(3, true, '+en'); end = 'en'; why = 'Кончается на согласную — +en.'; hitIdx = 3; }
        }
      }
      const full = word + end;
      $('.mc-art', res).textContent = ci.art;
      $('.mc-stem', res).textContent = word;
      $('.mc-end', res).textContent = end;
      const ru = ci.ru.replace('{x}', ruNom[word]).replace('{g}', info.tr).replace('{d}', ruDat[word]);
      $('.mc-sent', res).innerHTML = `${ci.de(full)} <small>— ${ru}</small>`;
      $('.mc-why', res).textContent = why;
      res.classList.remove('hide'); res.classList.remove('pop'); void res.offsetWidth; res.classList.add('pop');
      flow.classList.remove('running');
      nodes.forEach((n, k) => { if (k > hitIdx) n.classList.add('passed'); });
      running = false; run.disabled = false;
    }
    run.addEventListener('click', e => { if (e.isTrusted) stopDemo(); if (!running) machine(); });
    let ran = false;
    whenVisible(mc, async () => {
      mcVisible = true;
      if (!ran) { ran = true; await sleep(500); await machine(); }
      scheduleDemo();
    }, () => { mcVisible = false; clearTimeout(demoTimer); });
  }

  /* ---------- stage players ---------- */
  $$('[data-stages]').forEach(box => {
    const stages = $$(':scope > .stage', box);
    const dotsBox = $(':scope > .stage-dots', box);
    const interval = +box.dataset.interval || 3500;
    let i = 0, t = null;
    const dots = stages.map((_, k) => {
      const b = document.createElement('button');
      b.setAttribute('aria-label', 'Шаг ' + (k + 1));
      b.addEventListener('click', () => { go(k); restart(); });
      dotsBox && dotsBox.appendChild(b);
      return b;
    });
    const go = k => {
      i = k;
      stages.forEach((s, n) => s.classList.toggle('is-active', n === k));
      dots.forEach((d, n) => d.classList.toggle('on', n === k));
      const mode = stages[k].dataset.mode;
      if (mode !== undefined) box.dataset.mode = mode;
      const acc = stages[k].hasAttribute('data-accent') ? stages[k] : null;
      if (acc) accent(acc);
    };
    const restart = () => { clearInterval(t); t = null; if (!reduced) t = setInterval(() => go((i + 1) % stages.length), interval); };
    go(0);
    whenVisible(box, () => { go(i); restart(); }, () => { clearInterval(t); t = null; });
  });

  function accent(stage) {
    const word = $('.acc-word', stage), mark = $('.acc', stage);
    if (!word || !mark) return;
    const a1 = $('.a1', word), a2 = $('.a2', word);
    const pos = el => el.offsetLeft + el.offsetWidth / 2 - 2;
    mark.style.transition = 'none';
    word.style.setProperty('--ax', pos(a1) + 'px');
    void mark.offsetWidth;
    mark.style.transition = '';
    setTimeout(() => word.style.setProperty('--ax', pos(a2) + 'px'), 700);
  }

  /* ---------- trainer ---------- */
  const trWords = [
    ['der', 'Kunde', 'клиент', 'weak', 'На -e и живой. Классика слабого: den Kunden.'],
    ['der', 'Lehrer', 'учитель', 'strong', 'Учитель держится во всех падежах: den Lehrer. -er на конце, никакого -en.'],
    ['der', 'Name', 'имя', 'mixed', 'des Namens: и -n, и -s. Не определился.'],
    ['der', 'Löwe', 'лев', 'weak', 'Животное на -e. Лев слабый. Не говори ему.'],
    ['der', 'Politiker', 'политик', 'strong', 'Профессия, но на -er. Прикидывается: des Politikers.'],
    ['der', 'Planet', 'планета', 'weak', 'Иностранная неживая штука. den Planeten.'],
    ['der', 'Gedanke', 'мысль', 'mixed', 'des Gedankens. Мысль тоже не определилась.'],
    ['der', 'Nachbar', 'сосед', 'weak', 'Из списка. dem Nachbarn — только -n.'],
    ['der', 'Tisch', 'стол', 'strong', 'Обычный стол. Ему всё равно: des Tisches, den Tisch.'],
    ['der', 'Fotograf', 'фотограф', 'weak', 'Суффикс -graf. den Fotografen.'],
    ['das', 'Herz', 'сердце', 'mixed', 'Средний род, а всё равно в этой компании. des Herzens, dem Herzen.'],
    ['der', 'Autor', 'автор', 'strong', 'В единственном — сильный: des Autors. Во множественном берёт -en: die Autoren.']
  ];
  const typeRu = { weak: 'слабое', strong: 'сильное', mixed: 'смешанное' };
  const trBox = $('#trainerBox');
  if (trBox) {
    let ti = 0, score = 0;
    const btns = $$('#trBtns button'), fb = $('#trFb'), next = $('#trNext'), wordEl = $('#trWord');
    const renderTr = () => {
      const [art, noun, tr] = trWords[ti];
      $('.tr-art', wordEl).textContent = art;
      $('.tr-noun', wordEl).textContent = noun;
      $('.tr-tr', wordEl).textContent = tr;
      wordEl.classList.remove('enter'); void wordEl.offsetWidth; wordEl.classList.add('enter');
      $('#trCount').textContent = `${ti + 1} / ${trWords.length}`;
      $('#trBar').style.width = (ti / trWords.length * 100) + '%';
      btns.forEach(b => { b.disabled = false; b.className = ''; });
      fb.innerHTML = ''; next.hidden = true;
    };
    btns.forEach(b => b.addEventListener('click', () => {
      const [, , , right, why] = trWords[ti];
      const ok = b.dataset.a === right;
      if (ok) score++;
      $('#trScore').textContent = score;
      btns.forEach(x => { x.disabled = true; if (x.dataset.a === right) x.classList.add('ok'); });
      if (!ok) { b.classList.add('bad'); wordEl.classList.remove('shake'); void wordEl.offsetWidth; wordEl.classList.add('shake'); }
      fb.innerHTML = `<div class="fb ${ok ? 'ok' : 'bad'}"><b>${ok ? 'Да.' : 'Нет. Это ' + typeRu[right] + '.'}</b>${why}</div>`;
      next.hidden = false;
      next.textContent = ti === trWords.length - 1 ? 'Результат' : 'Дальше';
      $('#trBar').style.width = ((ti + 1) / trWords.length * 100) + '%';
    }));
    let finished = false;
    next.addEventListener('click', () => {
      if (finished) {
        finished = false; ti = 0; score = 0; $('#trScore').textContent = 0;
        wordEl.innerHTML = '<span class="tr-art"></span> <span class="tr-noun"></span><small class="tr-tr"></small>';
        $('#trBtns').hidden = false; renderTr(); return;
      }
      if (ti < trWords.length - 1) { ti++; renderTr(); return; }
      const msg = score >= 11 ? 'Полки ровные. Слабые узнаются в лицо.' : score >= 8 ? 'Хорошо. Пара слов ещё прикидывается. Пройди ещё раз — они запомнятся.' : 'Ничего. Немцы тоже путаются. Некоторые профессионально. Пройди ещё раз.';
      wordEl.innerHTML = `<span class="tr-noun">${score} / ${trWords.length}</span><small class="tr-tr">${msg}</small>`;
      $('#trBtns').hidden = true; fb.innerHTML = '';
      next.textContent = 'Ещё раз';
      finished = true;
    });
    renderTr();
  }

  /* ---------- quiz ---------- */
  const quiz = [
    { q: 'Ich warte auf den ___.', hint: '(der Kunde — клиент)', opts: ['Kunde', 'Kunden', 'Kundes'], a: 1, why: 'auf + Akkusativ. Слово на -e — просто +n.' },
    { q: 'Das ist die Tasche des ___.', hint: '(der Student — студент)', opts: ['Students', 'Student', 'Studenten'], a: 2, why: 'Genitiv. Слабое не берёт -s. Слабое берёт -en.' },
    { q: 'Wir danken dem ___.', hint: '(der Herr — господин)', opts: ['Herren', 'Herrn', 'Herr'], a: 1, why: 'danken + Dativ. Herr в единственном экономит: только -n. Herren — это множественное.' },
    { q: 'Ich kann mich an seinen ___ nicht erinnern.', hint: '(der Name — имя)', opts: ['Namen', 'Namens', 'Name'], a: 0, why: 'an + Akkusativ. Смешанное в Akkusativ ведёт себя как слабое: -n. -ns только в Genitiv.' },
    { q: 'Das ist das neue Buch des ___.', hint: '(der Autor — автор)', opts: ['Autoren', 'Autors', 'Autor'], a: 1, why: 'Слова на -or в единственном склоняются как сильные: des Autors. Autoren — это множественное.' },
    { q: 'Er hat es schweren ___ gesagt.', hint: '(das Herz — сердце)', opts: ['Herzen', 'Herz', 'Herzens'], a: 2, why: 'schweren Herzens — Genitiv. Сердце смешанное: -ens.' }
  ];
  const qzBody = $('#qzBody');
  if (qzBody) {
    let qi = 0, qs = 0;
    const renderQ = () => {
      const it = quiz[qi];
      $('#qzCount').textContent = `Вопрос ${qi + 1} / ${quiz.length}`;
      $('#qzBar').style.width = (qi / quiz.length * 100) + '%';
      qzBody.innerHTML = `
        <div class="tr-word enter" style="padding:6px 0 0">
          <div class="qz-q">${it.q.replace('___', '<span class="gap">&nbsp;</span>')}</div>
          <div class="qz-hint">${it.hint}</div>
        </div>
        <div class="qz-opts">${it.opts.map((o, k) => `<button data-k="${k}">${o}</button>`).join('')}</div>
        <div class="tr-fb"></div>`;
      $$('.qz-opts button', qzBody).forEach(b => b.addEventListener('click', () => answerQ(+b.dataset.k)));
    };
    const answerQ = k => {
      const it = quiz[qi], ok = k === it.a;
      if (ok) qs++;
      $('#qzScore').textContent = qs;
      $$('.qz-opts button', qzBody).forEach((b, n) => { b.disabled = true; if (n === it.a) b.classList.add('ok'); if (n === k && !ok) b.classList.add('bad'); });
      const gap = $('.gap', qzBody);
      gap.textContent = it.opts[it.a]; gap.classList.add(ok ? 'ok' : 'bad');
      const fb = $('.tr-fb', qzBody);
      fb.innerHTML = `<div class="fb ${ok ? 'ok' : 'bad'}"><b>${ok ? 'Верно.' : 'Не то.'}</b>${it.why}</div>
        <button class="btn-red tr-next">${qi === quiz.length - 1 ? 'Результат' : 'Дальше'}</button>`;
      $('#qzBar').style.width = ((qi + 1) / quiz.length * 100) + '%';
      $('.tr-next', fb).addEventListener('click', () => { qi < quiz.length - 1 ? (qi++, renderQ()) : final(); });
    };
    const final = () => {
      const msg = qs === quiz.length
        ? 'Всё. Слабые больше не страшные. Страшное — склонение прилагательных. Но это другая тема. Она, кстати, есть на платформе.'
        : qs >= 4
          ? 'Почти. Один-два хитреца ещё прикидываются. Herr и Autor обычно. Они всегда.'
          : 'Ничего. Это была одна страница. Одна страница не делает немецкий. Система делает.';
      qzBody.innerHTML = `<div class="qz-final tr-word enter">
        <div class="big">${qs} / ${quiz.length}</div>
        <p>${msg}</p>
        <div class="row">
          <a class="btn-red" href="#platform">Хочу так всю грамматику</a>
          <button class="link-btn" id="qzAgain">Пройти ещё раз</button>
        </div></div>`;
      $('#qzAgain').addEventListener('click', () => { qi = 0; qs = 0; $('#qzScore').textContent = 0; renderQ(); });
    };
    renderQ();
  }

  /* ---------- loop helper: pausable, visibility-aware ---------- */
  function makeLoop(el, opts = {}) {
    const st = { visible: false, paused: false, speed: 1, alive: true };
    const waiters = new Set();
    const ready = () => st.visible && !st.paused;
    const wake = () => { if (ready()) { waiters.forEach(w => w()); waiters.clear(); } };
    st.gate = () => ready() ? Promise.resolve() : new Promise(r => waiters.add(r));
    st.wait = ms => new Promise(res => {
      let left = ms / st.speed, lastT = performance.now();
      const tick = () => {
        const now = performance.now();
        if (ready()) left -= (now - lastT);
        lastT = now;
        left <= 0 ? res() : setTimeout(tick, Math.min(Math.max(left, 4), 60));
      };
      setTimeout(tick, Math.min(left, 60));
    });
    st.anim = (node, frames, o) => {
      const a = node.animate(frames, Object.assign({ fill: 'forwards' }, o, { duration: (o.duration || 400) / st.speed }));
      if (!ready()) a.pause();
      (st.anims || (st.anims = new Set())).add(a);
      a.finished.catch(() => {}).then(() => st.anims.delete(a));
      return a.finished.catch(() => {});
    };
    const syncAnims = () => st.anims && st.anims.forEach(a => (ready() ? a.play() : a.pause()));
    st.setPaused = p => { st.paused = p; syncAnims(); el.classList.toggle('is-paused', p); wake(); };
    new IntersectionObserver(([e]) => { st.visible = e.isIntersecting; syncAnims(); el.classList.toggle('is-off', !e.isIntersecting); wake(); }, { threshold: opts.threshold || 0.2 }).observe(el);
    return st;
  }

  /* ---------- chain sentences ---------- */
  const chains = [
    [['В', 'немецком', 'есть', { w: 'существительные.', t: 1 }], [{ w: 'У существительных', h: 1 }, 'есть', { w: 'падежи.', t: 1 }], [{ w: 'В падежах', h: 1 }, 'существительные', { w: 'меняются.', t: 1 }], [{ w: 'Меняются', h: 1 }, 'не', 'все.']],
    [['Слабые', 'держатся', 'один', { w: 'падеж.', t: 1 }], [{ w: 'Этот падеж', h: 1 }, '—', { w: 'Nominativ.', t: 1 }], [{ w: 'В Nominativ', h: 1 }, 'они', { w: 'в форме.', t: 1 }], [{ w: 'В форме', h: 1 }, 'недолго.']],
    [['Дальше', 'везде', { w: '-en.', t: 1, red: 1 }], [{ w: '-en', h: 1, red: 1 }, 'прилипает', 'к', { w: 'студенту.', t: 1 }], [{ w: 'Студент', h: 1 }, 'не', { w: 'сопротивляется.', t: 1 }], [{ w: 'Сопротивляется', h: 1 }, 'только', 'Herr.', 'Ему', 'хватает', '-n.']]
  ];
  const chainBox = $('#chainBox');
  if (chainBox && !reduced) {
    const L = makeLoop(chainBox);
    const linesEl = $('#chainLines'), svg = $('#chainSvg'), body = $('.chain-body', chainBox), cdots = $$('#chainDots i');
    const NS = 'http://www.w3.org/2000/svg';
    (async () => {
      let ci = 0;
      for (;;) {
        await L.gate();
        const chain = chains[ci % chains.length];
        cdots.forEach((d, k) => d.classList.toggle('on', k === ci % chains.length));
        body.classList.remove('fade');
        $$('path', svg).forEach(x => x.remove());
        linesEl.innerHTML = '';
        const rows = chain.map(line => {
          const row = document.createElement('div'); row.className = 'cl';
          const toks = line.map(tk => {
            const o = typeof tk === 'string' ? { w: tk } : tk;
            const sp = document.createElement('span');
            sp.className = 'cw' + (o.t || o.h ? ' link' : '') + (o.t ? ' tail' : '') + (o.h ? ' head' : '') + (o.red ? ' red' : '');
            sp.textContent = o.w; row.appendChild(sp); return sp;
          });
          linesEl.appendChild(row); return toks;
        });
        for (let r = 0; r < rows.length; r++) {
          for (const sp of rows[r]) { await L.wait(110); sp.classList.add('in'); }
          await L.wait(260);
          const tail = $('.tail', rows[r][0].parentNode);
          if (tail && rows[r + 1]) {
            tail.classList.add('glow');
            const head = rows[r + 1].find(x => x.classList.contains('head'));
            const br = body.getBoundingClientRect(), a = tail.getBoundingClientRect(), b = head.getBoundingClientRect();
            const x1 = a.left - br.left + a.width / 2, y1 = a.bottom - br.top + 2;
            const x2 = b.left - br.left + Math.min(b.width / 2, 40), y2 = b.top - br.top - 3;
            const path = document.createElementNS(NS, 'path');
            path.setAttribute('d', `M${x1},${y1} C${x1},${y1 + 26} ${x2},${y2 - 26} ${x2},${y2}`);
            path.setAttribute('marker-end', 'url(#chArrow)');
            svg.appendChild(path);
            const len = path.getTotalLength();
            path.style.strokeDasharray = len; path.style.strokeDashoffset = len;
            await L.anim(path, [{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: 650, easing: 'ease-in-out' });
            head.classList.add('in', 'glow');
            await L.wait(380);
            tail.classList.remove('glow');
            setTimeout(() => head.classList.remove('glow'), 900);
          }
        }
        await L.wait(2600);
        body.classList.add('fade');
        await L.wait(600);
        ci++;
      }
    })();
  }

  /* ---------- conveyor ---------- */
  const cvWords = [
    { a: 'der', s: 'Junge', e: 'n', t: 'weak', why: 'на -e + живой' },
    { a: 'der', s: 'Tisch', e: 'es', t: 'strong', why: 'примет нет, обычный' },
    { a: 'der', s: 'Name', e: 'ns', t: 'mixed', why: 'список «-ns»' },
    { a: 'der', s: 'Polizist', e: 'en', t: 'weak', why: 'суффикс -ist' },
    { a: 'der', s: 'Lehrer', e: 's', t: 'strong', why: 'на -er, ловушка' },
    { a: 'der', s: 'Bär', e: 'en', t: 'weak', why: 'животное' },
    { a: 'das', s: 'Herz', e: 'ens', t: 'mixed', why: 'особый случай' },
    { a: 'der', s: 'Planet', e: 'en', t: 'weak', why: 'иностранное -et' },
    { a: 'der', s: 'Autor', e: 's', t: 'strong', why: '-or: в ед. ч. сильный' },
    { a: 'der', s: 'Herr', e: 'n', t: 'weak', why: 'список: только -n' },
    { a: 'der', s: 'Gedanke', e: 'ns', t: 'mixed', why: 'список «-ns»' },
    { a: 'der', s: 'Kunde', e: 'n', t: 'weak', why: 'на -e + живой' },
    { a: 'der', s: 'Tag', e: 'es', t: 'strong', why: 'примет нет, обычный' }
  ];
  const cvBox = $('#conveyorBox');
  if (cvBox) {
    const L = makeLoop(cvBox);
    const tile = $('#cvTile'), stage = $('#cvStage'), belt = $('.cv-belt', cvBox), press = $('.cv-stamp', cvBox);
    const l1 = $('#cvL1'), l2 = $('#cvL2'), l3 = $('#cvL3');
    const typeRu2 = { weak: 'СЛАБОЕ', strong: 'СИЛЬНОЕ', mixed: 'СМЕШАННОЕ' };
    const playB = $('#cvPlay'), speedB = $('#cvSpeed');
    playB.addEventListener('click', () => {
      L.setPaused(!L.paused);
      $('use', playB).setAttribute('href', L.paused ? '#i-play' : '#i-pause');
      belt.style.animationPlayState = L.paused ? 'paused' : '';
    });
    speedB.addEventListener('click', () => { L.speed = L.speed === 1 ? 2 : 1; speedB.textContent = '×' + L.speed; });
    const typeLine = async (el, html) => {
      const tmp = document.createElement('div'); tmp.innerHTML = html; const text = tmp.textContent;
      for (let k = 1; k <= text.length; k++) { el.textContent = text.slice(0, k) + '_'; await L.wait(22); }
      el.innerHTML = html;
    };
    const rel = (el) => { const b = cvBox.getBoundingClientRect(), r = el.getBoundingClientRect(); return { x: r.left - b.left, y: r.top - b.top, w: r.width, h: r.height }; };
    (async () => {
      let i = 0;
      for (;;) {
        await L.gate();
        const w = cvWords[i++ % cvWords.length];
        const art = $('.cv-art', tile), stem = $('.cv-stem', tile), end = $('.cv-end', tile);
        art.textContent = w.a; stem.textContent = w.s; end.textContent = ''; end.className = 'cv-end ' + w.t;
        l1.textContent = ''; l2.textContent = ''; l3.textContent = '';
        const st = rel(stage), boxW = cvBox.clientWidth, tw = tile.offsetWidth, th = tile.offsetHeight;
        const beltY = st.y + stage.clientHeight - 26 - th + 2;
        const cx = boxW / 2 - tw / 2;
        belt.classList.add('moving');
        await L.anim(tile, [{ transform: `translate(${-tw - 20}px,${beltY}px)`, opacity: 1 }, { transform: `translate(${cx}px,${beltY}px)`, opacity: 1 }], { duration: 1000, easing: 'cubic-bezier(.2,.7,.3,1)' });
        belt.classList.remove('moving');
        await typeLine(l1, `&gt; ${w.a} ${w.s}`);
        cvBox.classList.add('scanning');
        await typeLine(l2, `примета: ${w.why}`);
        await L.wait(500);
        cvBox.classList.remove('scanning');
        await typeLine(l3, `тип: <span class="t-${w.t}">${typeRu2[w.t]}</span>`);
        // stamp
        const pr = rel(press), dy = beltY - (pr.y + pr.h) + 6;
        await L.anim(press, [{ transform: 'translateY(0)' }, { transform: `translateY(${dy}px)` }], { duration: 260, easing: 'cubic-bezier(.6,0,1,.6)' });
        art.textContent = 'des'; end.textContent = w.e;
        const cx2 = cvBox.clientWidth / 2 - tile.offsetWidth / 2;
        L.anim(tile, [{ transform: `translate(${cx2}px,${beltY}px) scale(1.15,.82)` }, { transform: `translate(${cx2}px,${beltY}px) scale(1)` }], { duration: 420, easing: 'cubic-bezier(.3,1.8,.5,1)' });
        await L.anim(press, [{ transform: `translateY(${dy}px)` }, { transform: 'translateY(0)' }], { duration: 380, easing: 'ease-out' });
        l3.innerHTML = `тип: <span class="t-${w.t}">${typeRu2[w.t]}</span> → des ${w.s}${w.e}`;
        await L.wait(700);
        // exit + drop into bin
        const bin = $(`.bin[data-bin="${w.t}"]`, cvBox), mouth = rel($('.bin-mouth', bin));
        const exitX = Math.min(cvBox.clientWidth - tile.offsetWidth - 6, cx2 + 90);
        belt.classList.add('moving');
        await L.anim(tile, [{ transform: `translate(${cx2}px,${beltY}px)` }, { transform: `translate(${exitX}px,${beltY}px)` }], { duration: 420, easing: 'ease-in' });
        belt.classList.remove('moving');
        const tx = mouth.x + mouth.w / 2 - tile.offsetWidth / 2, ty = mouth.y - th / 2;
        const mx = (exitX + tx) / 2, my = Math.min(beltY, ty) - 50;
        await L.anim(tile, [
          { transform: `translate(${exitX}px,${beltY}px) rotate(0) scale(1)`, opacity: 1 },
          { transform: `translate(${mx}px,${my}px) rotate(${tx < exitX ? -140 : 140}deg) scale(.8)`, opacity: 1, offset: .5 },
          { transform: `translate(${tx}px,${ty + 20}px) rotate(${tx < exitX ? -300 : 300}deg) scale(.3)`, opacity: 0 }
        ], { duration: 900, easing: 'cubic-bezier(.4,0,.6,1)' });
        const n = $('.bin-n', bin); n.textContent = +n.textContent + 1;
        n.classList.remove('bump'); void n.offsetWidth; n.classList.add('bump');
        bin.classList.remove('hit'); void bin.offsetWidth; bin.classList.add('hit');
        const stack = $('.bin-stack', bin), chip = document.createElement('span');
        chip.textContent = `des ${w.s}${w.e}`; stack.prepend(chip);
        while (stack.children.length > 3) stack.lastChild.remove();
        await L.wait(350);
      }
    })();
  }

  /* ---------- pains spotlight ---------- */
  const painGrid = $('.pain-grid');
  if (painGrid && !reduced) {
    const cards = $$('.g-card', painGrid); let pi = 0;
    const L = makeLoop(painGrid);
    (async () => { for (;;) { await L.gate(); cards.forEach((c, k) => c.classList.toggle('spot', k === pi % cards.length)); pi++; await L.wait(1700); } })();
  }

  /* ---------- habit tracker ---------- */
  const habitBox = $('#habitBox');
  if (habitBox) {
    const rowsN = ['Чтение', 'Слушание', 'Разговор', 'Письмо', 'Слова'], days = 14;
    const grid = $('#hbGrid'), cells = [];
    rowsN.forEach((r, ri) => {
      const lab = document.createElement('span'); lab.className = 'rl'; lab.textContent = r; grid.appendChild(lab);
      cells[ri] = [];
      for (let d = 0; d < days; d++) { const c = document.createElement('i'); c.className = 'hb-c'; c.style.setProperty('--k', ri * days + d); grid.appendChild(c); cells[ri].push(c); }
    });
    const line = $('.hb-line', habitBox), area = $('.hb-area', habitBox), dot = $('.hb-dot', habitBox);
    const L = makeLoop(habitBox);
    const msgs = ['поехали', 'втягиваешься', 'уже привычка', 'не ломай цепочку', 'половина пути', 'так держать'];
    (async () => {
      for (;;) {
        await L.gate();
        let streak = 0; const pts = [];
        cells.flat().forEach(c => (c.className = 'hb-c'));
        $('#hbStreak').textContent = 0;
        for (let d = 0; d < days; d++) {
          $('#hbDay').textContent = `день ${d + 1} из ${days}`;
          let total = 0, filled = 0;
          const skipDay = d === 6 + Math.floor(Math.random() * 3) && Math.random() < .5;
          for (let r = 0; r < rowsN.length; r++) {
            const c = cells[r][d]; c.classList.add('today');
            await L.wait(70);
            const p = skipDay ? .15 : .55 + d * .03;
            if (Math.random() < p) {
              const lvl = 1 + Math.floor(Math.random() * 3); c.classList.add('l' + lvl, 'pop'); total += lvl * 8; filled++;
            }
            c.classList.remove('today');
          }
          streak = filled >= 2 ? streak + 1 : 0;
          const sEl = $('#hbStreak'); sEl.textContent = streak;
          const sw = sEl.parentElement; sw.classList.remove('bump'); void sw.offsetWidth; sw.classList.add('bump');
          $('#hbMin').textContent = total;
          pts.push(total);
          const W = 280, H = 70, max = 120;
          const P = pts.map((v, k) => [k * (W / (days - 1)), H - 4 - (Math.min(v, max) / max) * (H - 10)]);
          line.setAttribute('points', P.map(q => q.join(',')).join(' '));
          area.setAttribute('d', `M0,${H} L${P.map(q => q.join(',')).join(' L')} L${P[P.length - 1][0]},${H} Z`);
          dot.setAttribute('cx', P[P.length - 1][0]); dot.setAttribute('cy', P[P.length - 1][1]);
          $('#hbMsg').textContent = filled < 2 ? 'пропуск. бывает. завтра снова' : msgs[Math.min(msgs.length - 1, Math.floor(d / 2.4))];
          await L.wait(420);
        }
        $('#hbMsg').textContent = 'две недели. почти без пропусков';
        await L.wait(2600);
        grid.classList.add('wipe');
        cells.flat().forEach(c => (c.className = 'hb-c'));
        line.setAttribute('points', ''); area.setAttribute('d', ''); dot.setAttribute('cx', -10);
        await L.wait(900);
        grid.classList.remove('wipe');
      }
    })();
  }

  /* ---------- flashcards ---------- */
  const flashBox = $('#flashBox');
  if (flashBox) {
    const deck = [
      ['der', 'Nachbar', '[ˈnaxbaːɐ̯]', 'сосед', 'des Nachbar<em>n</em>', 'ok'],
      ['der', 'Kollege', '[kɔˈleːɡə]', 'коллега', 'des Kollege<em>n</em>', 'again'],
      ['der', 'Mensch', '[mɛnʃ]', 'человек', 'des Mensch<em>en</em>', 'ok'],
      ['der', 'Name', '[ˈnaːmə]', 'имя', 'des Name<em>ns</em>', 'again'],
      ['der', 'Held', '[hɛlt]', 'герой', 'des Held<em>en</em>', 'ok'],
      ['der', 'Architekt', '[aʁçiˈtɛkt]', 'архитектор', 'des Architekt<em>en</em>', 'ok'],
      ['der', 'Löwe', '[ˈløːvə]', 'лев', 'des Löwe<em>n</em>', 'again'],
      ['der', 'Kunde', '[ˈkʊndə]', 'клиент', 'des Kunde<em>n</em>', 'ok']
    ];
    const stageEl = $('#fcStage'); const L = makeLoop(flashBox);
    const queue = deck.map((c, k) => ({ c, again: 0, k }));
    let userChoice = null, userUntil = 0;
    const mk = item => {
      const [a, w, ipa, tr, gen] = item.c;
      const el = document.createElement('div'); el.className = 'fcard';
      el.innerHTML = `<div class="fs front">${item.again ? '<span class="flag">повтор</span>' : ''}<span class="fa">${a}</span><span class="fw">${w}</span><span class="fi">${ipa}</span></div>
        <div class="fs back"><span class="ft">${tr}</span><span class="fg">${gen}</span><span class="fi" style="color:rgba(255,255,255,.75)">слабое · -(e)n</span></div>`;
      return el;
    };
    const bump = el => { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); };
    $$('.fc-b', flashBox).forEach(b => b.addEventListener('click', () => { userChoice = b.dataset.a; userUntil = performance.now() + 8000; }));
    (async () => {
      for (;;) {
        await L.gate();
        const item = queue.shift();
        const cur = mk(item); const nxt = queue[0] ? mk(queue[0]) : null; const nxt2 = queue[1] ? mk(queue[1]) : null;
        $$('.fcard', stageEl).forEach(x => x.remove());
        if (nxt2) { nxt2.classList.add('under2'); stageEl.appendChild(nxt2); }
        if (nxt) { nxt.classList.add('under'); stageEl.appendChild(nxt); }
        cur.classList.add('under'); stageEl.appendChild(cur);
        requestAnimationFrame(() => requestAnimationFrame(() => cur.classList.remove('under')));
        cur.addEventListener('click', () => cur.classList.toggle('flip'));
        await L.wait(1300);
        cur.classList.add('flip');
        // wait for user or auto
        const t0 = performance.now(); userChoice = null;
        while (!userChoice && performance.now() - t0 < (performance.now() < userUntil ? 6000 : 1500)) await L.wait(100);
        const choice = userChoice || item.c[5];
        const btn = $(`.fc-b[data-a="${choice}"]`, flashBox); btn.classList.remove('fc-hit'); void btn.offsetWidth; btn.classList.add('fc-hit');
        const dir = choice === 'ok' ? 1 : -1;
        await L.anim(cur, [
          { transform: 'rotateY(180deg) translateX(0) rotate(0)', opacity: 1 },
          { transform: `rotateY(180deg) translateX(${-dir * 170}px) translateY(40px) rotate(${-dir * 18}deg) scale(.45)`, opacity: 0 }
        ], { duration: 600, easing: 'cubic-bezier(.5,0,.7,.4)' });
        const cnt = $(choice === 'ok' ? '#fcOk' : '#fcAgain'); cnt.textContent = +cnt.textContent + 1; bump(cnt);
        if (choice === 'again') queue.splice(Math.min(2, queue.length), 0, { c: [...item.c.slice(0, 5), 'ok'], again: 1, k: item.k });
        else queue.push({ c: item.c, again: 0, k: item.k });
        if (queue.every(q => !q.again) && +$('#fcOk').textContent > 40) { $('#fcOk').textContent = 0; $('#fcAgain').textContent = 0; }
        await L.wait(250);
      }
    })();
  }

  /* ---------- path traveling highlight ---------- */
  const pathGrid = $('[data-path]');
  if (pathGrid && !reduced) {
    const nodes = $$('.p-node', pathGrid); const L = makeLoop(pathGrid);
    (async () => {
      await L.wait(1400);
      for (let k = 0; ; k++) {
        await L.gate();
        const idx = k % (nodes.length + 1);
        nodes.forEach((n, j) => { n.classList.toggle('active', j === idx); n.classList.toggle('done', j < idx); });
        await L.wait(idx === nodes.length ? 1200 : 1050);
      }
    })();
  }

  /* ---------- coverflow ---------- */
  const cf = $('#coverflow');
  if (cf) {
    const items = $$('.cf-item', cf), n = items.length, cap = $('#cfCap'), dotsEl = $('#cfDots'), bar = $('#cfBar');
    let cur = 0, timer = null, visible = false, hover = false;
    const DUR = 3200;
    const dots = items.map((_, k) => { const b = document.createElement('button'); b.setAttribute('aria-label', 'Экран ' + (k + 1)); b.addEventListener('click', () => go(k, true)); dotsEl.appendChild(b); return b; });
    const layout = () => {
      const wide = cf.clientWidth > 700, gap = wide ? 250 : 120, gap2 = wide ? 110 : 60;
      items.forEach((it, k) => {
        let d = k - cur; if (d > n / 2) d -= n; if (d < -n / 2) d += n;
        const ad = Math.abs(d), sg = Math.sign(d);
        const x = ad === 0 ? 0 : sg * (gap + (ad - 1) * gap2);
        const rot = ad === 0 ? 0 : -sg * 42;
        const z = ad === 0 ? 60 : -140 - (ad - 1) * 90;
        it.style.transform = `translateX(${x}px) translateZ(${z}px) rotateY(${rot}deg)`;
        it.style.zIndex = 100 - ad;
        it.style.opacity = ad > 3 ? 0 : 1 - ad * 0.12;
        it.style.filter = ad ? `brightness(${1 - ad * 0.08})` : 'none';
        it.style.pointerEvents = ad > 3 ? 'none' : 'auto';
        it.classList.toggle('cur', ad === 0);
      });
      dots.forEach((d, k) => d.classList.toggle('on', k === cur));
      cap.textContent = $('figcaption', items[cur]).textContent;
    };
    const restartBar = () => { bar.classList.remove('run'); void bar.offsetWidth; if (visible && !hover && !reduced) bar.classList.add('run'); };
    const schedule = () => { clearTimeout(timer); restartBar(); if (visible && !hover && !reduced) timer = setTimeout(() => go(cur + 1), DUR); };
    const go = (k, user) => { cur = (k + n) % n; layout(); schedule(); };
    cf.style.setProperty('--cfdur', DUR + 'ms');
    items.forEach((it, k) => it.addEventListener('click', () => { if (k !== cur) go(k, true); }));
    $('#cfPrev').addEventListener('click', () => go(cur - 1, true));
    $('#cfNext').addEventListener('click', () => go(cur + 1, true));
    const stageEl = $('#cfStage');
    stageEl.addEventListener('mouseenter', () => { hover = true; schedule(); });
    stageEl.addEventListener('mouseleave', () => { hover = false; schedule(); });
    let sx = null;
    stageEl.addEventListener('pointerdown', e => { sx = e.clientX; });
    stageEl.addEventListener('pointerup', e => { if (sx === null) return; const dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 40) go(cur + (dx < 0 ? 1 : -1), true); });
    window.addEventListener('resize', layout);
    layout();
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; schedule(); }, { threshold: 0.3 }).observe(cf);
  }

  /* ---------- gallery auto-scroll ---------- */
  const gal = $('.gal-track');
  if (gal && !reduced) {
    let gVisible = false, userAt = 0;
    const markUser = () => (userAt = performance.now());
    ['pointerdown', 'wheel', 'touchstart'].forEach(ev => gal.addEventListener(ev, markUser, { passive: true }));
    new IntersectionObserver(([e]) => (gVisible = e.isIntersecting), { threshold: 0.3 }).observe(gal);
    setInterval(() => {
      if (!gVisible || performance.now() - userAt < 7000) return;
      const item = gal.children[0]; if (!item) return;
      const stepW = item.getBoundingClientRect().width + 14;
      const atEnd = gal.scrollLeft + gal.clientWidth >= gal.scrollWidth - 8;
      gal.scrollTo({ left: atEnd ? 0 : gal.scrollLeft + stepW, behavior: 'smooth' });
    }, 4200);
  }

  /* ---------- forever phone screens ---------- */
  const scr = $('#fvScreens');
  if (scr && !reduced) {
    const imgs = $$('img', scr).slice(0, 3); $$('img', scr)[3] && $$('img', scr)[3].remove();
    const tap = $('.tap', scr.parentElement); const L = makeLoop(scr.parentElement);
    imgs[0].classList.add('cur');
    (async () => {
      for (let k = 1; ; k++) {
        await L.wait(3200); await L.gate();
        tap.classList.remove('go'); void tap.offsetWidth; tap.classList.add('go');
        await L.wait(500);
        imgs.forEach((im, j) => { im.classList.remove('cur', 'prev'); if (j === k % 3) im.classList.add('cur'); if (j === (k + 2) % 3) im.classList.add('prev'); });
      }
    })();
  }

  /* ---------- reviews marquee + lightbox ---------- */
  const mq = $('#revMarquee');
  if (mq) {
    $$('.mq-track', mq).forEach(tr => {
      const kids = [...tr.children];
      kids.forEach(k => { const c = k.cloneNode(true); c.setAttribute('aria-hidden', 'true'); tr.appendChild(c); });
      const setDur = () => tr.style.setProperty('--mqdur', Math.round(tr.scrollWidth / 2 / 38) + 's');
      $$('img', tr).forEach(im => im.addEventListener('load', setDur, { once: true }));
      setDur();
    });
    if (reduced) mq.classList.add('paused');
    const lb = $('#lightbox'), lbImg = $('img', lb);
    mq.addEventListener('click', e => {
      const fig = e.target.closest('.rv'); if (!fig) return;
      const im = $('img', fig);
      if (!im) { mq.classList.toggle('paused'); return; }
      lbImg.src = im.src; lbImg.alt = im.alt; lb.hidden = false; mq.classList.add('paused');
    });
    const closeLb = () => { lb.hidden = true; mq.classList.remove('paused'); };
    lb.addEventListener('click', e => { if (e.target !== lbImg) closeLb(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !lb.hidden) closeLb(); });
  }

  /* ---------- lazy videos ---------- */
  const vIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      const v = e.target;
      if (e.isIntersecting) {
        if (!v.src && v.dataset.src) { v.src = v.dataset.src; }
        if (!reduced) v.play().catch(() => {});
      } else if (!v.paused) v.pause();
    });
  }, { threshold: 0.35 });
  $$('.lazy-video').forEach(v => vIO.observe(v));

  /* ---------- sticky CTA ---------- */
  const sticky = $('#stickyCta');
  if (sticky) {
    const hero = $('.hero');
    const hideZones = ['#pricing', '#contact', '#platform'].map(s => $(s)).filter(Boolean);
    let pastHero = false; const inZone = new Set();
    const update = () => sticky.classList.toggle('show', pastHero && inZone.size === 0);
    new IntersectionObserver(([e]) => { pastHero = !e.isIntersecting && e.boundingClientRect.top < 0; update(); }).observe(hero);
    const zIO = new IntersectionObserver(entries => {
      entries.forEach(e => (e.isIntersecting ? inZone.add(e.target) : inZone.delete(e.target)));
      update();
    }, { threshold: 0.05 });
    hideZones.forEach(z => zIO.observe(z));
  }
})();
