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
    let hi = 0, timer = null;
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
    const start = () => { if (!timer && !reduced) timer = setInterval(() => { hi = (hi + 1) % heroForms.length; show(hi); }, 2300); };
    const stop = () => { clearInterval(timer); timer = null; };
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
    const pick = (group, attr, cb) => $$('button', group).forEach(b => b.addEventListener('click', () => {
      $$('button', group).forEach(x => x.classList.toggle('on', x === b)); cb(b.dataset[attr]);
      if (!running) machine();
    }));
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
    run.addEventListener('click', () => { if (!running) machine(); });
    let ran = false;
    whenVisible(mc, () => { if (!ran) { ran = true; setTimeout(machine, 500); } });
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
