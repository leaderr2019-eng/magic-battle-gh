/* Magic Battle — картинки: загрузка спрайтов, нарисованные кодом заглушки, иконки. */
(function () {
  'use strict';
  const MB = window.MB, ART = {}, cache = {};
  MB.ART = ART;
  const OUT = '#3a2414';

  /* ---------- Загрузка готовых спрайтов ---------- */
  ART.load = function (onProgress) {
    const keys = Object.keys(window.MB_SPRITES), bgs = MB.CHAPTERS.map(c => c.bg).concat(['fon_coliseum', 'fon_menu', 'fon_lich']);
    const fxs = ART.FX_NAMES, fgs = ART.FG_FILES;
    // локальные правки размеров/якорей из редактора поз (pose-editor.html)
    let POSE_OVR = {}; try { POSE_OVR = JSON.parse(localStorage.getItem('magicbattle_pose_v1')) || {}; } catch (e) { POSE_OVR = {}; }
    let left = keys.length + bgs.length + fxs.length + fgs.length; const total = left;
    return new Promise(res => {
      const done = () => { left--; onProgress && onProgress(1 - left / total); if (left <= 0) res(); };
      keys.forEach(k => { const im = new Image(); im.onload = done; im.onerror = done; im.src = 'assets/sprites/' + k + '.webp'; const m = window.MB_SPRITES[k], o = POSE_OVR[k] || {}; cache[k] = { img: im, w: m.w, h: m.h, ax: o.ax != null ? o.ax : m.ax, ay: o.ay != null ? o.ay : m.ay, s: o.s != null ? o.s : m.s }; });
      bgs.forEach(k => { const im = new Image(); im.onload = done; im.onerror = done; im.src = 'assets/bg/' + k + '.jpg'; cache['bg:' + k] = im; });
      fxs.forEach(k => { const im = new Image(); im.onload = done; im.onerror = done; im.src = 'assets/fx/' + k + '.webp'; cache['fx:' + k] = im; });
      fgs.forEach(k => { const im = new Image(); im.onload = done; im.onerror = done; im.src = 'assets/bg/' + k + '.png'; cache['fg:' + k] = im; });
    });
  };
  ART.bg = k => cache['bg:' + k];
  // эффекты и снаряды из папки VFX
  ART.FX_NAMES = ['axe', 'hammer', 'orb', 'pick', 'flask', 'rock', 'freeze', 'poison', 'curse', 'hit', 'slam', 'crit', 'heal', 'shield', 'coins', 'wave', 'ice', 'snowball', 'dragon_breath', 'spore', 'orbg', 'warcry', 'stun', 'arrow', 'shuriken', 'web', 'cone', 'bomb', 'quill', 'quill_feather', 'wisp_orb', 'wisp_orb_plain',
    'sk_viking_1', 'sk_viking_2', 'sk_viking_3', 'sk_knight_1', 'sk_knight_2', 'sk_knight_3', 'sk_gnome_1', 'sk_gnome_2', 'sk_gnome_3', 'sk_witch_1', 'sk_witch_2', 'sk_witch_3',
    'sk_wizard_1', 'sk_wizard_2', 'sk_wizard_3', 'sk_archer_1', 'sk_archer_2', 'sk_archer_3', 'sk_boar_1', 'sk_boar_2', 'sk_boar_3', 'sk_ninja_1', 'sk_ninja_2', 'sk_ninja_3', 'axe_gold', 'lich_orb', 'lich_vortex'];
  ART.fx = k => { const im = cache['fx:' + k]; return im && im.complete && im.naturalWidth ? im : null; };
  // передний план локации (прозрачный оверлей, рисуется поверх бойцов)
  ART.FG_FILES = ['fon_polyana_fg_l', 'fon_polyana_fg_r', 'fon_shahta_fg_l', 'fon_shahta_fg_r', 'fon_mashroom_fg_l', 'fon_mashroom_fg_r', 'fon_cavetroll_fg_l', 'fon_cavetroll_fg_r', 'fon_crystaallsnow_fg_l', 'fon_crystaallsnow_fg_r', 'fon_lich_fg_b'];
  ART.fg = k => cache['fg:' + k];

  /* ---------- Заглушка героя (рисуется кодом по описанию look) ---------- */
  function heroPh(L, pose) {
    const W = 400, H = 420, c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d'); g.lineJoin = 'round'; g.lineCap = 'round';
    const P = { idle: { tilt: 0, sw: 0.55, eyes: 'o' }, throw: { tilt: 0.16, sw: 1.45, eyes: 'o', slash: 1 }, special: { tilt: -0.05, sw: 0.05, eyes: 'o', glow: 1 },
      hit: { tilt: -0.28, sw: 0.9, eyes: 'x' }, victory: { tilt: 0, sw: -0.1, eyes: '^' }, defeat: { tilt: -1.45, sw: 0.4, eyes: 'x', down: 1 } }[pose];
    g.save();
    if (P.down) g.translate(170, 372); else g.translate(170, 400);
    g.rotate(P.tilt);
    const st = (f, lw) => { g.fillStyle = f; g.fill(); g.lineWidth = lw || 6; g.strokeStyle = OUT; g.stroke(); };
    const rr = (x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
    if (L.tail) { g.beginPath(); g.ellipse(-62, -268, 34, 50, -0.5, 0, 7); st(L.hair); }
    rr(-52, -62, 44, 62, 12); st(L.boots); rr(8, -62, 44, 62, 12); st(L.boots);
    rr(-58, -178, 116, 128, 30); st(L.armor);
    rr(-22, -92, 44, 46, 8); st(L.scarf);
    g.beginPath(); g.arc(-58, -160, 26, 0, 7); st(L.armor); g.beginPath(); g.arc(58, -160, 26, 0, 7); st(L.armor);
    g.strokeStyle = L.trim; g.lineWidth = 5; g.beginPath(); g.arc(-58, -160, 17, 0, 7); g.stroke(); g.beginPath(); g.arc(58, -160, 17, 0, 7); g.stroke();
    rr(-50, -196, 100, 30, 14); st(L.scarf);
    // уши позади головы
    if (L.ears === 'pig') { [-1, 1].forEach(sd => { g.beginPath(); g.moveTo(sd * 40, -318); g.lineTo(sd * 74, -350); g.lineTo(sd * 70, -296); g.closePath(); st(L.skin); }); }
    if (L.ears === 'elf') { [-1, 1].forEach(sd => { g.beginPath(); g.moveTo(sd * 70, -270); g.lineTo(sd * 112, -300); g.lineTo(sd * 74, -244); g.closePath(); st(L.skin); }); }
    g.beginPath(); g.arc(0, -262, 78, 0, 7); st(L.skin);
    if (L.mask) { g.beginPath(); g.arc(0, -262, 80, Math.PI * 0.82, Math.PI * 2.18); g.closePath(); st(L.hair); rr(-70, -266, 140, 44, 18); st(L.skin, 5); g.beginPath(); g.arc(0, -262, 80, 0.2, Math.PI - 0.2); st(L.hair); }
    else if (L.ears !== 'pig') { g.beginPath(); g.arc(0, -276, 80, Math.PI * 0.95, Math.PI * 2.05); g.lineTo(70, -250); g.quadraticCurveTo(20, -292, -30, -262); g.quadraticCurveTo(-60, -250, -78, -246); g.closePath(); st(L.hair); }
    else { rr(-74, -330, 148, 40, 18); st(L.armor); g.strokeStyle = L.trim; g.lineWidth = 5; g.beginPath(); g.moveTo(-70, -300); g.lineTo(70, -300); g.stroke(); }
    g.strokeStyle = OUT; g.fillStyle = OUT; g.lineWidth = 6;
    const ey = L.mask ? -246 : -244;
    [[12, ey], [50, ey]].forEach(p => {
      if (P.eyes === 'o') { g.beginPath(); g.ellipse(p[0], p[1], 9, 13, 0, 0, 7); g.fill(); }
      else if (P.eyes === '^') { g.beginPath(); g.arc(p[0], p[1] + 4, 10, Math.PI, 0); g.stroke(); }
      else { g.beginPath(); g.moveTo(p[0] - 9, p[1] - 9); g.lineTo(p[0] + 9, p[1] + 9); g.moveTo(p[0] + 9, p[1] - 9); g.lineTo(p[0] - 9, p[1] + 9); g.stroke(); }
    });
    if (L.snout) { g.beginPath(); g.ellipse(36, -208, 30, 20, 0, 0, 7); st('#e88f95'); g.fillStyle = OUT; [26, 46].forEach(x => { g.beginPath(); g.ellipse(x, -208, 5, 8, 0, 0, 7); g.fill(); }); }
    else if (!L.mask) { g.beginPath(); if (P.eyes === 'x') g.arc(32, -204, 12, Math.PI, 0); else g.arc(32, -216, 14, 0.15, Math.PI - 0.15); g.stroke(); }
    // оружие
    g.save(); g.translate(62, -120); g.rotate(P.sw);
    if (P.glow) { g.shadowColor = L.trim; g.shadowBlur = 40; }
    if (L.weapon === 'bow') { g.rotate(-P.sw + 0.1); g.beginPath(); g.arc(-20, -40, 92, -1.25, 1.25); g.lineWidth = 12; g.strokeStyle = OUT; g.stroke(); g.lineWidth = 7; g.strokeStyle = '#a0612b'; g.stroke(); g.lineWidth = 2; g.strokeStyle = '#eee'; g.beginPath(); g.moveTo(9, -126); g.lineTo(9, 46); g.stroke(); }
    else if (L.weapon === 'mace') { rr(-7, -110, 14, 150, 5); st('#7a4a25'); g.beginPath(); g.arc(0, -126, 32, 0, 7); st('#aab4c0'); [0, 1.57, 3.14, 4.71].forEach(a => { g.beginPath(); g.moveTo(Math.cos(a) * 30, -126 + Math.sin(a) * 30); g.lineTo(Math.cos(a) * 50, -126 + Math.sin(a) * 50); g.lineWidth = 8; g.strokeStyle = OUT; g.stroke(); }); }
    else { g.beginPath(); g.moveTo(-8, 0); g.lineTo(-8, -90); g.lineTo(0, -108); g.lineTo(8, -90); g.lineTo(8, 0); g.closePath(); st('#d6dde5'); g.shadowBlur = 0; rr(-22, -6, 44, 12, 6); st(L.trim); rr(-6, 6, 12, 26, 5); st('#2b2b38'); }
    g.restore();
    g.beginPath(); g.arc(62, -116, 18, 0, 7); st(L.ears === 'pig' ? L.skin : '#7a4a25');
    g.restore();
    if (P.slash && L.weapon !== 'bow') { g.strokeStyle = L.weapon === 'dagger' ? 'rgba(190,140,255,.85)' : 'rgba(255,230,160,.85)'; g.lineWidth = 16; g.beginPath(); g.arc(210, 250, 150, -1.0, 0.75); g.stroke(); }
    return { img: c, w: W, h: H, ax: 170, ph: true };
  }

  /* ---------- Заглушка: монстр ---------- */
  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16), f = v => Math.max(0, Math.min(255, Math.round(v * k)));
    return 'rgb(' + f(n >> 16) + ',' + f((n >> 8) & 255) + ',' + f(n & 255) + ')';
  }
  function blob(ph, pose) {
    const W = 320, H = 320, c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d'); g.lineJoin = 'round'; g.lineCap = 'round';
    const st = (f, lw) => { g.fillStyle = f; g.fill(); g.lineWidth = lw || 6; g.strokeStyle = OUT; g.stroke(); };
    const tilt = pose === 'attack' ? -0.22 : pose === 'hit' ? 0.25 : 0, sq = pose === 'defeat' ? 0.55 : 1, lift = ph.fly && pose !== 'defeat' ? 46 : 0;
    g.save(); g.translate(160, 306 - lift); g.rotate(tilt); g.scale(1, sq);
    const col = ph.c, dk = shade(col, 0.7), lt = shade(col, 1.25);
    // позади тела
    if (ph.f === 'wings') { [[-1, 1], [1, 1]].forEach(s => { g.beginPath(); g.moveTo(s[0] * 70, -150); g.lineTo(s[0] * 150, -230); g.lineTo(s[0] * 142, -120); g.lineTo(s[0] * 118, -140); g.lineTo(s[0] * 104, -100); g.closePath(); st(dk); }); }
    if (ph.f === 'legs') { g.strokeStyle = OUT; g.lineWidth = 12; for (let i = 0; i < 4; i++) { [-1, 1].forEach(s => { g.beginPath(); g.moveTo(s * 70, -90 - i * 14); g.quadraticCurveTo(s * (130 + i * 6), -150 + i * 20, s * (140 - i * 8), -6); g.stroke(); }); } }
    if (ph.f === 'club' || ph.f === 'spear' || ph.f === 'staff') {
      g.save(); g.translate(-96, -110); g.rotate(pose === 'attack' ? -0.9 : -0.25);
      if (ph.f === 'club') { g.beginPath(); g.roundRect(-16, -150, 36, 170, 16); st('#8a5a2b'); }
      else { g.beginPath(); g.roundRect(-6, -170, 12, 210, 5); st('#8a5a2b');
        if (ph.f === 'spear') { g.beginPath(); g.moveTo(0, -206); g.lineTo(16, -168); g.lineTo(-16, -168); g.closePath(); st('#cfd6dd'); }
        else { g.beginPath(); g.arc(0, -184, 20, 0, 7); st('#9dff8a'); } }
      g.restore();
    }
    // тело
    g.beginPath(); g.ellipse(0, -110, 104, 110, 0, 0, 7); st(col, 7);
    g.beginPath(); g.ellipse(-6, -76, 66, 62, 0, 0, 7); g.fillStyle = lt; g.globalAlpha = 0.55; g.fill(); g.globalAlpha = 1;
    // ноги
    [-46, 46].forEach(x => { g.beginPath(); g.ellipse(x, -8, 30, 16, 0, 0, 7); st(dk); });
    // поверх тела
    if (ph.f === 'shell') { g.beginPath(); g.ellipse(18, -150, 92, 72, 0, Math.PI, 0); g.closePath(); st(dk); g.strokeStyle = OUT; g.lineWidth = 5; g.beginPath(); g.moveTo(18, -222); g.lineTo(18, -150); g.stroke(); [[-30, -170], [60, -180], [36, -200]].forEach(p => { g.beginPath(); g.arc(p[0], p[1], 9, 0, 7); st('#b9c4cf', 4); }); }
    if (ph.f === 'cap') { g.beginPath(); g.ellipse(0, -196, 122, 62, 0, Math.PI, 0); g.closePath(); st(dk); [[-60, -220], [10, -238], [64, -214]].forEach(p => { g.beginPath(); g.arc(p[0], p[1], 13, 0, 7); g.fillStyle = '#d8ffb0'; g.fill(); }); }
    if (ph.f === 'horns') { [-1, 1].forEach(s => { g.beginPath(); g.moveTo(s * 50, -200); g.quadraticCurveTo(s * 96, -250, s * 70, -280); g.quadraticCurveTo(s * 66, -236, s * 28, -214); g.closePath(); st('#9fb3c8'); }); }
    if (ph.f === 'crystal') { [[-60, -196, -0.4], [0, -220, 0], [58, -196, 0.4]].forEach(p => { g.save(); g.translate(p[0], p[1]); g.rotate(p[2]); g.beginPath(); g.moveTo(0, -62); g.lineTo(22, -10); g.lineTo(0, 16); g.lineTo(-22, -10); g.closePath(); st(lt); g.restore(); }); }
    if (ph.f === 'bomb') { g.beginPath(); g.arc(-98, -90, 30, 0, 7); st('#2b2b33'); g.strokeStyle = '#ffb347'; g.lineWidth = 6; g.beginPath(); g.moveTo(-104, -120); g.lineTo(-112, -140); g.stroke(); }
    // лицо (смотрит влево)
    g.fillStyle = '#fff'; g.strokeStyle = OUT; g.lineWidth = 5;
    [[-52, -128], [6, -128]].forEach(p => {
      if (pose === 'hit' || pose === 'defeat') { g.beginPath(); g.moveTo(p[0] - 13, p[1] - 13); g.lineTo(p[0] + 13, p[1] + 13); g.moveTo(p[0] + 13, p[1] - 13); g.lineTo(p[0] - 13, p[1] + 13); g.stroke(); }
      else { g.beginPath(); g.ellipse(p[0], p[1], 19, 23, 0, 0, 7); g.fillStyle = '#fff'; g.fill(); g.stroke(); g.beginPath(); g.arc(p[0] - 7, p[1] + 2, 8, 0, 7); g.fillStyle = OUT; g.fill(); }
    });
    g.lineWidth = 7; g.beginPath(); g.moveTo(-82, -166); g.lineTo(-34, -152); g.moveTo(36, -166); g.lineTo(-12, -152); g.stroke();
    g.beginPath(); if (pose === 'attack') { g.ellipse(-24, -72, 26, 20, 0, 0, 7); g.fillStyle = '#5a1e1e'; g.fill(); g.lineWidth = 5; g.stroke(); } else { g.arc(-24, -60, 22, Math.PI * 1.15, Math.PI * 1.85); g.lineWidth = 6; g.stroke(); }
    g.restore();
    return { img: c, w: W, h: H, ax: 160, ph: true };
  }

  /* ---------- Получить спрайт ---------- */
  // ART.heroArt[key] — активный облик героя (префикс спрайтов, например viking_leg); заполняется из сохранения
  ART.heroArt = {};
  // Поправка размера облика. Золотой Торвальд нарисован стройнее обычного: при той же высоте спрайта он выглядит мельче.
  // Ключ — префикс спрайтов облика (как в ART.heroArt), значение — множитель размера фигуры (1 = без поправки).
  ART.SKIN_SCALE = { viking_leg: 1.08 };
  ART.skinScale = key => ART.SKIN_SCALE[ART.heroArt[key]] || 1;
  // key — ключ героя/врага, pose — idle|throw|special|hit|defeat|victory|attack
  ART.sprite = function (key, pose, turn) {
    const hero = MB.HEROES[key], def = hero || MB.ENEMIES[key] || MB.BOSSES[key];
    if (!def) return cache[key + '_' + (pose || 'idle')] || cache[key + '_idle'] || null;
    if (def.art) {
      let p = pose;
      if (!hero) { if (p === 'attack' && def.attackArt) p = def.attackArt[(turn || 0) % def.attackArt.length]; if (p === 'victory' || p === 'special' || p === 'throw') p = 'idle'; }
      const art = (hero && ART.heroArt[key]) || def.art;
      return cache[art + '_' + p] || cache[art + '_idle'] || cache[def.art + '_' + p] || cache[def.art + '_idle'];
    }
    const ck = 'ph:' + key + ':' + pose;
    if (!cache[ck]) cache[ck] = hero ? heroPh(hero.look, pose) : blob(def.ph, pose === 'victory' ? 'idle' : pose);
    return cache[ck];
  };
  ART.isPlaceholder = key => { const d = MB.HEROES[key] || MB.ENEMIES[key] || MB.BOSSES[key]; return !d.art; };
  // целая картинка для меню (dataURL/URL)
  ART.url = function (key, pose) {
    const s = ART.sprite(key, pose || 'idle');
    if (!s || !s.img) return 'assets/sprites/' + key + '_' + (pose || 'idle') + '.webp';
    if (s.img.tagName === 'CANVAS') { if (!s.url) s.url = s.img.toDataURL(); return s.url; }
    return s.img.src;
  };
  // круглый портрет: стиль для блока .pt (обрезка спрайта через background)
  // ART.PT[key] = [sx, sy, zoom] — положение и масштаб рамки портрета (правится в редакторе «Портреты»)
  // зафиксированные вручную положения портретов (подобраны для видимости лиц) — значения по умолчанию, localStorage их может перекрывать
  ART.PT_DEF = {viking:[64.57, 0, 0.94], viking_leg:[104, 84, 0.94], knight:[13.39, 14.63, 0.94], gnome:[46.95, 0, 0.94], witch:[0, 0, 0.7807], wizard:[0, 0, 0.8306], archer:[23.87, 0, 0.6899], boar:[68.76, 0, 0.8306], ninja:[64.41, 1.2, 0.7339], goblin:[37.45, 0, 0.7339], wolf:[0, 5.46, 0.7807], penek:[21.16, 26.99, 0.6899], kobold:[47.67, 0, 0.8306], bat:[145.03, 1.11, 0.8306], beetle:[17.61, 29.4, 0.7807], frog:[45.99, 0, 0.8306], mosquito:[0, 66.82, 0.8836], sporeling:[29.22, 60.26, 0.7339], trollkid:[19.77, 0, 0.7807], spider:[128.79, 70.7, 0.8306], shaman:[35.55, 0, 0.7807], imp:[18.48, 0, 0.7807], yeti:[31.77, 0, 0.8306], guard:[259.58, 0, 0.8276], hedgehog:[64.6, 90.05, 0.8836], rat:[9.62, 0, 0.7807], wisp:[36.57, 96.89, 0.7807], bear:[0, 0, 0.7339], shard:[18.32, 0, 0.7339], golem:[83.86, 0, 0.8836], kirka:[66.85, 5.4, 0.8306], king:[28.28, 0, 0.7807], troll:[162.54, 0, 0.8836], dragon:[12.22, 0, 0.8306], minotaur:[27, 7, 1.3], andoor:[149, 14, 1.3]};
  ART.PT = {};
  try { ART.PT = JSON.parse(localStorage.getItem('magicbattle_pt_v1')) || {}; } catch (e) { ART.PT = {}; }
  ART.savePT = function () { try { localStorage.setItem('magicbattle_pt_v1', JSON.stringify(ART.PT)); } catch (e) { /* хранилище недоступно */ } };
  ART.ptState = function (key, D) {
    D = D || 58;
    const s = ART.sprite(key, 'idle'), akey = ART.heroArt[key] || key, e = ART.PT[akey] || ART.PT_DEF[akey] || ART.PT[key] || ART.PT_DEF[key];
    const zoom = e ? (e[2] || 1) : 1;
    const sz = Math.min(s.w, s.h) * 0.6 / zoom, k = D / sz, flip = !MB.HEROES[key];
    let sx = e ? e[0] : s.ax - sz / 2 + (flip ? -sz * 0.1 : sz * 0.1);
    let sy = e ? e[1] : 0;
    sx = Math.max(0, Math.min(s.w - sz, sx));
    sy = Math.max(0, Math.min(s.h - sz, sy));
    return { sx: sx, sy: sy, sz: sz, k: k, zoom: zoom, w: s.w, h: s.h };
  };
  ART.ptStyle = function (key, D) {
    D = D || 58;
    const st = ART.ptState(key, D), s = ART.sprite(key, 'idle');
    return 'background-image:url(' + ART.url(key) + ');background-size:' + (s.w * st.k).toFixed(1) + 'px ' + (s.h * st.k).toFixed(1) + 'px;background-position:' + (-st.sx * st.k).toFixed(1) + 'px ' + (-st.sy * st.k).toFixed(1) + 'px';
  };

  /* ---------- Иконки (SVG) ---------- */
  const S = (body, vb) => '<svg viewBox="' + (vb || '0 0 64 64') + '" xmlns="http://www.w3.org/2000/svg" stroke="#3a2414" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">' + body + '</svg>';
  // нарисованные иконки (assets/ui), вставляются внутрь svg — так работают все старые размеры из CSS
  const RAR_SUF = { '#9aa3ad': 'common', '#4caf50': 'uncommon', '#3d8bfd': 'rare', '#a855f7': 'epic', '#f5b301': 'legendary' };
  const CHEST_IMG = { wood: 'chest_wood', green: 'chest_green', blue: 'chest_silver', purple: 'chest_legend', gold: 'chest_gold' };
  const POT_IMG = { '#5db3f0': 'potion_s', '#a855f7': 'potion_m', '#f5b301': 'potion_l', [MB.ENERGY_ELIXIR.col]: 'potion_cap' };
  const MENU_IMG = { arena: 'menu_coliseum', trophy: 'menu_rating', clan: 'menu_clans', cart: 'menu_shop', spark: 'spark', ore: 'ore', gem: 'gem', energy: 'energy' };
  const imgIcon = f => '<svg viewBox="0 0 64 64" width="64" height="64" xmlns="http://www.w3.org/2000/svg"><image href="assets/ui/' + f + '.webp" x="0" y="0" width="64" height="64" preserveAspectRatio="xMidYMid meet"/></svg>';
  function iconFile(name, col) {
    if (MENU_IMG[name]) return MENU_IMG[name];
    if (/^(w_|s_)/.test(name)) return name;
    if (name === 'chest') { const k = Object.keys(MB.CHESTS).find(c => MB.CHESTS[c].col === col) || 'wood'; return CHEST_IMG[k]; }
    if (name === 'potion') return POT_IMG[col] || 'potion_s';
    if (/^(helmet|chestarmor|gloves|boots|amulet)$/.test(name)) return (name === 'chestarmor' ? 'armor' : name) + '_' + (RAR_SUF[col] || 'common');
    return null;
  }
  /* ---------- Иконки в стиле главного меню (SVG, глянцевые, с золотой обводкой) ---------- */
  const lg = (id, stops, x1, y1, x2, y2) => '<linearGradient id="' + id + '" x1="' + (x1 || 0) + '" y1="' + (y1 || 0) + '" x2="' + (x2 || 0) + '" y2="' + (y2 == null ? 1 : y2) + '">' +
    stops.map((c, i) => '<stop offset="' + (i / (stops.length - 1)).toFixed(2) + '" stop-color="' + c + '"/>').join('') + '</linearGradient>';
  const rg = (id, stops, cx, cy, r) => '<radialGradient id="' + id + '" cx="' + (cx || .5) + '" cy="' + (cy || .4) + '" r="' + (r || .7) + '">' +
    stops.map((c, i) => '<stop offset="' + (i / (stops.length - 1)).toFixed(2) + '" stop-color="' + c + '"/>').join('') + '</radialGradient>';
  const SV = (defs, body) => '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round"><defs>' + defs + '</defs>' + body + '</svg>';
  const sword = rot => '<g transform="rotate(' + rot + ' 32 34)"><path d="M32 2 L36.5 8 L36.5 36 L27.5 36 L27.5 8 Z" fill="url(#sw_b)" stroke="#2b3547" stroke-width="2"/><path d="M32 4 V36" stroke="#fff" stroke-opacity=".7" stroke-width="1.6"/>' +
    '<rect x="19" y="36" width="26" height="6" rx="3" fill="url(#sw_g)" stroke="#6b3d0a" stroke-width="2"/><rect x="29.5" y="42" width="5" height="12" rx="1.5" fill="#7a4a22" stroke="#3a2210" stroke-width="2"/>' +
    '<circle cx="32" cy="57" r="4" fill="url(#sw_g)" stroke="#6b3d0a" stroke-width="2"/></g>';
  ART.NEWICONS = {
    energy: SV(lg('e1', ['#fff08a', '#ffc12e', '#f07c12']), '<path d="M39 3 L13 36 H28.5 L23 61 L51 25 H35.5 Z" fill="url(#e1)" stroke="#a24f0a" stroke-width="3"/><path d="M38 9 L22 31 H31" fill="none" stroke="#fffbe0" stroke-opacity=".8" stroke-width="2.5"/>'),
    spark: SV(lg('s1', ['#fff0a8', '#ffc23c', '#d9801a']) + lg('s2', ['#ffe58a', '#e9a02a']), '<path d="M32 2 L40 13 L53 10 L50 23 L62 32 L50 41 L53 54 L40 51 L32 62 L24 51 L11 54 L14 41 L2 32 L14 23 L11 10 L24 13 Z" fill="url(#s1)" stroke="#8c4a0a" stroke-width="3"/><circle cx="32" cy="32" r="14" fill="url(#s2)" stroke="#b46d12" stroke-width="2.5"/><path d="M32 20 L36 28 L44 32 L36 36 L32 44 L28 36 L20 32 L28 28 Z" fill="#fff3c0" stroke="#d88f1c" stroke-width="1.5"/>'),
    ore: SV(lg('o1', ['#aab3c2', '#6d7585', '#424857']), '<path d="M7 40 L12 22 L27 10 L46 13 L57 28 L55 47 L38 57 L16 55 Z" fill="url(#o1)" stroke="#242733" stroke-width="3"/><path d="M12 22 L27 28 L46 13 M27 28 L22 46 L7 40 M27 28 L42 36 L57 28 M42 36 L38 57 M22 46 L38 57" fill="none" stroke="#2c303d" stroke-opacity=".55" stroke-width="1.6"/><path d="M14 24 L27 13" stroke="#fff" stroke-opacity=".55" stroke-width="2.5"/>'),
    gem: SV(lg('g1', ['#ff8fc0', '#e0245f', '#a30a3c']), '<path d="M15 8 H49 L60 23 L32 59 L4 23 Z" fill="url(#g1)" stroke="#5a0a25" stroke-width="3"/><path d="M4 23 H60 M22 8 L17 23 L32 59 L47 23 L42 8 M17 23 L32 8 L47 23" fill="none" stroke="#ffd0e4" stroke-opacity=".6" stroke-width="1.8"/><path d="M13 20 L21 11" stroke="#fff" stroke-opacity=".85" stroke-width="3"/>'),
    swords: SV(lg('sw_b', ['#f4f8ff', '#9db4d6', '#5f7396'], 0, 0, 1, 0) + lg('sw_g', ['#ffe28a', '#e7a82e', '#a8680f']), sword(-42) + sword(42)),
    helm: SV(lg('h1', ['#e6eefc', '#93a7c6', '#4f6285'], 0, 0, 1, 1) + lg('h2', ['#ffe38a', '#e3a22c', '#a2640f']), '<path d="M11 36 C11 15 21 5 32 5 C43 5 53 15 53 36 V47 L45 59 L37 53 V40 H27 V53 L19 59 L11 47 Z" fill="url(#h1)" stroke="#27324a" stroke-width="3"/><path d="M32 4 C25 14 26 32 32 43 C38 32 39 14 32 4 Z" fill="url(#h2)" stroke="#7a470c" stroke-width="2.5"/><path d="M13 36 C13 36 20 33 27 34 M51 36 C51 36 44 33 37 34" fill="none" stroke="#ffe28a" stroke-width="3"/><path d="M27 40 H37 V47 H27 Z" fill="#1d2030"/><path d="M16 22 C17 15 22 10 26 8" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="2.5"/>'),
    skull: SV(lg('k1', ['#fff4dc', '#d8c8a4', '#a8956c']) + rg('k2', ['#fff3a0', '#ff8a1a', '#b83a08'], .5, .5, .6), '<path d="M10 27 C10 13 20 5 32 5 C44 5 54 13 54 27 C54 34 51 38 47 41 V50 C47 54 44 57 40 57 H24 C20 57 17 54 17 50 V41 C13 38 10 34 10 27 Z" fill="url(#k1)" stroke="#4a3a22" stroke-width="3"/><ellipse cx="22" cy="29" rx="7" ry="8" fill="#2a1c12" stroke="#2a1c12" stroke-width="2"/><ellipse cx="42" cy="29" rx="7" ry="8" fill="#2a1c12"/><circle cx="22" cy="30" r="4.2" fill="url(#k2)"/><circle cx="42" cy="30" r="4.2" fill="url(#k2)"/><path d="M32 36 L28.5 43 H35.5 Z" fill="#3a2a1a"/><path d="M25 48 V56 M32 48 V57 M39 48 V56" stroke="#4a3a22" stroke-width="2"/>'),
    arena: SV(rg('a1', ['#e9b878', '#b07a3c', '#6b4220'], .4, .35, .75) + lg('a2', ['#fff0c0', '#d9a448', '#8a5a1c']), '<circle cx="32" cy="32" r="28" fill="url(#a1)" stroke="#3a2210" stroke-width="3"/><circle cx="32" cy="32" r="21" fill="none" stroke="url(#a2)" stroke-width="3.5"/><circle cx="32" cy="32" r="7" fill="url(#a2)" stroke="#6b3d0a" stroke-width="2"/><path d="M15 15 L49 49 M49 15 L15 49" stroke="#e6edf7" stroke-width="5" stroke-opacity=".95"/><path d="M15 15 L49 49 M49 15 L15 49" stroke="#5b6a85" stroke-width="1.6"/><path d="M32 3 L36 12 H28 Z M32 61 L36 52 H28 Z" fill="#ffe28a" stroke="#7a470c" stroke-width="1.5"/>'),
    cart: SV(lg('b1', ['#9a5f33', '#6b3d1c', '#43250f']) + lg('b2', ['#fff0a0', '#f2b42c', '#bb7a10']), '<path d="M22 20 C10 28 6 44 14 54 C20 60 44 60 50 54 C58 44 54 28 42 20 Z" fill="url(#b1)" stroke="#2c1608" stroke-width="3"/><path d="M22 20 L19 12 L45 12 L42 20" fill="#7d4a26" stroke="#2c1608" stroke-width="3"/><path d="M21 21 C28 25 36 25 43 21" fill="none" stroke="#e8c27a" stroke-width="3.5"/><circle cx="27" cy="9" r="6.5" fill="url(#b2)" stroke="#8a4f0a" stroke-width="2.2"/><circle cx="38" cy="8" r="6.5" fill="url(#b2)" stroke="#8a4f0a" stroke-width="2.2"/><circle cx="32.5" cy="13" r="6" fill="url(#b2)" stroke="#8a4f0a" stroke-width="2.2"/><path d="M26 36 C30 32 36 34 36 40 C36 46 30 48 28 44" fill="none" stroke="#d9a860" stroke-width="2.5"/>'),
    trophy: SV(lg('t1', ['#fff0a0', '#f5bb2e', '#b86f0e'], 0, 0, 1, 0), '<path d="M17 8 H47 V24 C47 35 40 41 32 41 C24 41 17 35 17 24 Z" fill="url(#t1)" stroke="#7a470c" stroke-width="3"/><path d="M17 12 H8 C8 25 14 30 22 31 M47 12 H56 C56 25 50 30 42 31" fill="none" stroke="#c98a1c" stroke-width="3.5"/><path d="M17 12 H8 C8 25 14 30 22 31 M47 12 H56 C56 25 50 30 42 31" fill="none" stroke="#7a470c" stroke-width="1.2"/><path d="M28 41 H36 V49 H28 Z" fill="url(#t1)" stroke="#7a470c" stroke-width="2.5"/><path d="M19 49 H45 V58 H19 Z" fill="url(#t1)" stroke="#7a470c" stroke-width="3"/><path d="M22 11 C22 22 24 29 29 34" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="3"/>'),
    clan: SV(lg('c1', ['#6f8fd6', '#3b5db3', '#24387a']) + lg('c2', ['#ffe38a', '#e3a22c', '#a2640f']) + rg('c3', ['#ffd45e', '#e0701a', '#a2360a'], .5, .4, .7), '<path d="M32 3 L56 12 V30 C56 46 45 56 32 61 C19 56 8 46 8 30 V12 Z" fill="url(#c1)" stroke="#1d2a5c" stroke-width="3"/><path d="M32 3 L56 12 V30 C56 46 45 56 32 61 C19 56 8 46 8 30 V12 Z" fill="none" stroke="url(#c2)" stroke-width="3" transform="translate(32 32) scale(.88) translate(-32 -32)"/><circle cx="32" cy="30" r="11" fill="url(#c3)" stroke="#7a2c08" stroke-width="2.5"/><path d="M27 26 L32 21 L37 26 M27 34 L32 39 L37 34" fill="none" stroke="#fff3c0" stroke-width="2"/>'),
    lock: SV(lg('l1', ['#c5cbd6', '#8c94a3', '#5d6574']), '<path d="M21 28 V20 C21 12 26 8 32 8 C38 8 43 12 43 20 V28" fill="none" stroke="#2d323d" stroke-width="9"/><path d="M21 28 V20 C21 12 26 8 32 8 C38 8 43 12 43 20 V28" fill="none" stroke="#aab2c0" stroke-width="4.5"/><rect x="12" y="26" width="40" height="32" rx="6" fill="url(#l1)" stroke="#2d323d" stroke-width="3"/><circle cx="32" cy="40" r="4.5" fill="#2d323d"/><path d="M32 42 V50" stroke="#2d323d" stroke-width="4"/>')
  };

  ART.icon = function (name, col) {
    col = col || '#c9a45c';
    if (ART.NEWICONS[name] && name !== 'energy' && name !== 'spark' && name !== 'ore' && name !== 'gem') return ART.NEWICONS[name];
    const f = iconFile(name, col); if (f) return imgIcon(f);
    switch (name) {
      case 'spark': return S('<path d="M32 4 L39 25 L60 32 L39 39 L32 60 L25 39 L4 32 L25 25 Z" fill="#ffb02e"/><path d="M32 18 L36 28 L46 32 L36 36 L32 46 L28 36 L18 32 L28 28 Z" fill="#fff3b0" stroke="none"/>');
      case 'ore': return S('<path d="M8 46 L16 24 L34 14 L52 26 L58 46 L44 56 L20 56 Z" fill="#7d8794"/><path d="M24 30 L30 18 L36 32 Z M40 40 L46 28 L52 42 Z M18 46 L24 38 L30 48 Z" fill="#4fe0c8"/>');
      case 'chest': return S('<path d="M8 28 Q8 12 32 12 Q56 12 56 28 L56 52 L8 52 Z" fill="' + (col === '#c9a45c' ? '#9b6330' : col) + '"/><path d="M8 28 L56 28" fill="none"/><rect x="26" y="24" width="12" height="14" rx="2" fill="#f2c14e"/><path d="M16 14 L16 52 M48 14 L48 52" stroke="#f2c14e" stroke-width="4"/>');
      case 'lock': return S('<rect x="14" y="28" width="36" height="28" rx="5" fill="#8a8f98"/><path d="M22 28 V20 a10 10 0 0 1 20 0 V28" fill="none" stroke-width="5"/>');
      case 'helmet': return S('<path d="M12 40 Q12 12 32 12 Q52 12 52 40 L52 46 L12 46 Z" fill="' + col + '"/><path d="M12 38 L52 38 M32 12 L32 46" fill="none"/><path d="M12 22 Q2 14 6 6 Q12 14 18 16 Z M52 22 Q62 14 58 6 Q52 14 46 16 Z" fill="#efe6d0"/>');
      case 'chestarmor': return S('<path d="M14 14 L26 10 Q32 16 38 10 L50 14 L54 30 L46 32 L46 56 L18 56 L18 32 L10 30 Z" fill="' + col + '"/><path d="M32 16 L32 56 M18 40 L46 40" fill="none"/>');
      case 'gloves': return S('<path d="M20 58 L20 34 L16 24 Q16 18 22 20 L24 26 L24 12 Q28 6 30 12 L30 8 Q34 4 36 10 L36 12 Q40 8 42 14 L42 18 Q46 16 46 22 L46 40 L42 58 Z" fill="' + col + '"/><path d="M20 48 L43 48" fill="none"/>');
      case 'boots': return S('<path d="M20 8 L38 8 L38 36 Q54 38 56 48 L56 56 L16 56 L20 40 Z" fill="' + col + '"/><path d="M16 56 L56 56 M20 16 L38 16" fill="none" stroke-width="4"/>');
      case 'amulet': return S('<path d="M14 8 Q32 34 50 8" fill="none" stroke-width="3"/><path d="M32 28 L46 42 L32 58 L18 42 Z" fill="' + col + '"/><path d="M32 34 L39 42 L32 50 L25 42 Z" fill="#fff" opacity=".55" stroke="none"/>');
      case 'w_viking': return S('<path d="M18 58 L40 14" stroke="#8a5a2b" stroke-width="6"/><path d="M34 8 Q54 6 56 26 Q46 22 40 28 Z" fill="' + col + '"/><path d="M46 58 L24 14" stroke="#8a5a2b" stroke-width="6"/><path d="M30 8 Q10 6 8 26 Q18 22 24 28 Z" fill="' + col + '"/>');
      case 'w_knight': return S('<path d="M44 6 L50 12 L24 44 L18 38 Z" fill="' + col + '"/><path d="M12 36 L28 52" stroke="#f2c14e" stroke-width="6"/><path d="M18 46 L8 56" stroke="#8a5a2b" stroke-width="6"/>');
      case 'w_gnome': return S('<path d="M30 60 L34 22" stroke="#8a5a2b" stroke-width="7"/><rect x="12" y="6" width="42" height="22" rx="4" fill="' + col + '"/>');
      case 'w_witch': return S('<path d="M50 8 L26 40" stroke="#8a5a2b" stroke-width="6"/><ellipse cx="20" cy="46" rx="14" ry="11" fill="' + col + '"/><ellipse cx="20" cy="44" rx="8" ry="5" fill="#7dff7a" stroke="none"/>');
      case 'w_archer': return S('<path d="M18 6 Q52 32 18 58" fill="none" stroke="#3a2414" stroke-width="9"/><path d="M18 6 Q52 32 18 58" fill="none" stroke="' + col + '" stroke-width="5"/><path d="M18 6 L18 58" stroke="#eee" stroke-width="2"/><path d="M10 32 L56 32" stroke="#8a5a2b" stroke-width="4"/><path d="M56 32 L46 26 L46 38 Z" fill="#ff7a2a"/>');
      case 'w_boar': return S('<path d="M18 58 L36 30" stroke="#8a5a2b" stroke-width="7"/><circle cx="40" cy="22" r="14" fill="' + col + '"/><path d="M40 4 V10 M58 22 H52 M40 40 V34 M22 22 H28" stroke-width="5"/>');
      case 'w_ninja': return S('<path d="M10 54 L40 14 L48 10 L46 18 L16 58 Z" fill="' + col + '"/><path d="M54 54 L24 14 L16 10 L18 18 L48 58 Z" fill="#d6dde5"/>');
      case 'gem': return S('<path d="M16 8 H48 L58 24 L32 58 L6 24 Z" fill="#5be3f0"/><path d="M6 24 H58 M24 8 L18 24 L32 58 L46 24 L40 8" fill="none" stroke-width="2.5"/>');
      case 'energy': return S('<path d="M38 4 L14 36 H30 L26 60 L50 26 H34 Z" fill="#ffd23a"/>');
      case 'potion': return S('<path d="M24 6 H40 V22 Q54 30 54 42 Q54 58 32 58 Q10 58 10 42 Q10 30 24 22 Z" fill="#ffffff" opacity=".9"/><path d="M12 40 Q32 34 52 40 Q52 56 32 56 Q12 56 12 40 Z" fill="' + col + '" stroke="none"/><path d="M38 4 L14 36 H30 L26 60 L50 26 H34 Z" fill="#ffd23a" transform="translate(18,22) scale(.45)"/><rect x="22" y="2" width="20" height="8" rx="2" fill="#9b6330"/>');
      case 'clan': return S('<path d="M32 4 L56 14 V30 C56 46 44 56 32 60 C20 56 8 46 8 30 V14 Z" fill="' + col + '"/><path d="M20 22 L32 40 L44 22" fill="none" stroke-width="5"/>');
      case 'trophy': return S('<path d="M18 8 H46 V22 Q46 38 32 40 Q18 38 18 22 Z" fill="#f5b301"/><path d="M18 14 H8 Q8 28 20 28 M46 14 H56 Q56 28 44 28" fill="none"/><path d="M28 40 H36 V48 H28 Z M20 48 H44 V56 H20 Z" fill="#f5b301"/>');
      case 'arena': return S('<path d="M6 30 Q32 18 58 30 V50 Q32 40 6 50 Z" fill="#c98a3c"/><path d="M14 30 V48 M24 26 V44 M34 25 V43 M44 26 V44 M52 29 V48" stroke-width="2.5"/><path d="M20 8 L44 32 M44 8 L20 32" stroke="#cfd6dd" stroke-width="5"/>');
      case 'cart': return S('<path d="M4 10 H14 L22 42 H52 L58 18 H18" fill="none" stroke-width="5"/><circle cx="26" cy="52" r="5" fill="' + col + '"/><circle cx="48" cy="52" r="5" fill="' + col + '"/><path d="M20 26 H54" stroke-width="3"/>');
      case 'w_wizard': return S('<path d="M22 60 L36 22" stroke="#8a5a2b" stroke-width="6"/><path d="M40 2 L44 12 L55 13 L47 20 L50 31 L40 25 L30 31 L33 20 L25 13 L36 12 Z" fill="' + col + '"/>');
    }
    const ST = {
      s_atk: '<path d="M46 6 L56 6 L56 16 L28 44 L18 34 Z" fill="#cfd6dd"/><path d="M12 34 L28 50" stroke="#f2c14e" stroke-width="6"/><path d="M18 46 L8 56" stroke="#8a5a2b" stroke-width="6"/>',
      s_hp: '<path d="M32 54 C10 38 6 26 12 18 C18 10 28 12 32 20 C36 12 46 10 52 18 C58 26 54 38 32 54 Z" fill="#ef4b4b"/>',
      s_def: '<path d="M32 6 L54 14 V30 C54 44 44 54 32 58 C20 54 10 44 10 30 V14 Z" fill="#c98a3c"/><path d="M32 6 V58 M10 28 H54" fill="none"/>',
      s_crit: '<polygon points="32.0,5.0 37.7,18.1 51.1,12.9 45.9,26.3 59.0,32.0 45.9,37.7 51.1,51.1 37.7,45.9 32.0,59.0 26.3,45.9 12.9,51.1 18.1,37.7 5.0,32.0 18.1,26.3 12.9,12.9 26.3,18.1" fill="#ffd23a"/><circle cx="32" cy="32" r="7" fill="#fff" stroke="none"/>',
      s_critdmg: '<polygon points="32.0,5.0 37.7,18.1 51.1,12.9 45.9,26.3 59.0,32.0 45.9,37.7 51.1,51.1 37.7,45.9 32.0,59.0 26.3,45.9 12.9,51.1 18.1,37.7 5.0,32.0 18.1,26.3 12.9,12.9 26.3,18.1" fill="#ff6a2a"/><path d="M32 20 V36 M32 42 V44" stroke-width="5"/>',
      s_dodge: '<path d="M8 20 H40 M14 32 H52 M8 44 H36" fill="none" stroke="#7fd6ff" stroke-width="6"/><path d="M40 12 L52 20 L40 28 M52 24 L60 32 L52 40" fill="none"/>',
      s_block: '<path d="M32 6 L54 14 V30 C54 44 44 54 32 58 C20 54 10 44 10 30 V14 Z" fill="#9aa3ad"/><path d="M22 22 L42 42 M42 22 L22 42" stroke="#fff" stroke-width="5"/>',
      s_extra: '<path d="M10 54 L46 12 L54 10 L52 18 L16 58 Z" fill="#cfd6dd"/><path d="M54 54 L18 12 L10 10 L12 18 L48 58 Z" fill="#e8edf2"/>',
      s_stun: '<circle cx="32" cy="36" r="16" fill="#ffe066"/><polygon points="32.0,4.0 39.1,22.3 58.6,23.3 43.4,35.7 48.5,54.7 32.0,44.0 15.5,54.7 20.6,35.7 5.4,23.3 24.9,22.3" fill="#fff" transform="translate(-14,-18) scale(.5)"/><polygon points="32.0,4.0 39.1,22.3 58.6,23.3 43.4,35.7 48.5,54.7 32.0,44.0 15.5,54.7 20.6,35.7 5.4,23.3 24.9,22.3" fill="#fff" transform="translate(18,-20) scale(.5)"/><path d="M24 34 L30 40 M30 34 L24 40 M36 34 L42 40 M42 34 L36 40" fill="none"/>',
      s_pierce: '<circle cx="26" cy="38" r="18" fill="#c98a3c"/><path d="M14 50 L52 12" stroke-width="5"/><path d="M40 10 L56 8 L54 24 Z" fill="#cfd6dd"/>',
      s_boss: '<path d="M10 48 L6 18 L22 32 L32 12 L42 32 L58 18 L54 48 Z" fill="#f5b301"/><circle cx="32" cy="40" r="4" fill="#ef4b4b"/>',
      s_ctrl: '<circle cx="32" cy="32" r="24" fill="#5db3f0"/><path d="M32 12 V52 M14 22 L50 42 M50 22 L14 42" stroke="#fff" stroke-width="4"/>',
      s_spec: '<path d="M32 4 L39 25 L60 32 L39 39 L32 60 L25 39 L4 32 L25 25 Z" fill="#b06cff"/><circle cx="32" cy="32" r="6" fill="#fff" stroke="none"/>',
      s_sup: '<path d="M24 8 H40 V24 H56 V40 H40 V56 H24 V40 H8 V24 H24 Z" fill="#5fd35f"/>',
      s_regen: '<path d="M32 6 C44 24 50 32 50 40 A18 18 0 0 1 14 40 C14 32 20 24 32 6 Z" fill="#5fd35f"/><path d="M24 40 a8 8 0 0 0 8 8" fill="none" stroke="#fff"/>',
      s_spd: '<path d="M38 4 L14 36 H30 L26 60 L50 26 H34 Z" fill="#ffd23a"/>',
      s_first: '<path d="M16 6 V60" stroke-width="5"/><path d="M16 8 L54 16 L16 30 Z" fill="#ef4b4b"/>',
      power: '<polygon points="32.0,4.0 39.1,22.3 58.6,23.3 43.4,35.7 48.5,54.7 32.0,44.0 15.5,54.7 20.6,35.7 5.4,23.3 24.9,22.3" fill="#ff9d3c"/><circle cx="32" cy="34" r="8" fill="#fff3b0" stroke="none"/>'
    };
    if (ST[name]) return S(ST[name]);
    return S('<circle cx="32" cy="32" r="22" fill="' + col + '"/>');
  };

  /* ---------- Герб клана (спрайты из assets/clans) ---------- */
  ART.clanEmblem = function (emb, size) {
    size = size || 64;
    const iconId = (typeof emb === 'string' ? emb : (emb && emb.icon)) || 'axes_red';
    const found = (MB.CLAN_ICONS && MB.CLAN_ICONS.find(x => x.id === iconId)) || (MB.CLAN_ICONS && MB.CLAN_ICONS[0]);
    const file = found ? found.file : 'clan_axes_red.webp';
    return '<img class="clan-emb-img" src="assets/clans/' + file + '" alt="" style="width:' + size + 'px;height:' + size + 'px;object-fit:contain;flex:none;filter:drop-shadow(0 3px 4px rgba(0,0,0,.45))">';
  };
  let embUid = 0;
  ART.clanEmblemLegacySvg = function (emb, size) {
    emb = emb || MB.defaultEmblem();
    size = size || 64;
    const uid = ++embUid;
    const col = MB.CLAN_EMBLEM.colors.find(c => c.id === emb.color) || MB.CLAN_EMBLEM.colors[0];
    const rim = MB.CLAN_EMBLEM.rims.find(r => r.id === emb.rim) || MB.CLAN_EMBLEM.rims[0];
    const shapes = {
      heater: 'M32 4 L56 12 V29 C56 46 45 56 32 61 C19 56 8 46 8 29 V12 Z',
      round: 'M32 4 A28 28 0 1 1 31.9 4 Z',
      kite: 'M32 3 L55 16 L46 44 L32 61 L18 44 L9 16 Z',
      tower: 'M12 6 H21 V11 H27 V6 H37 V11 H43 V6 H52 V32 C52 47 43 56 32 61 C21 56 12 47 12 32 Z',
      diamond: 'M32 3 L58 32 L32 61 L6 32 Z'
    };
    const pathD = shapes[emb.shape] || shapes.heater;
    const symStroke = '#2b1608';
    const symbols = {
      swords: '<g transform="translate(32 32) scale(0.68) translate(-32 -32)">' +
        '<path d="M16 48 L46 14 L50 18 L20 52 Z" fill="url(#er_' + uid + ')" stroke="' + symStroke + '" stroke-width="2.5"/>' +
        '<path d="M48 48 L18 14 L14 18 L44 52 Z" fill="url(#er_' + uid + ')" stroke="' + symStroke + '" stroke-width="2.5"/>' +
        '<path d="M13 41 L23 51 M51 41 L41 51" stroke="url(#er_' + uid + ')" stroke-width="4"/></g>',
      dragon: '<path d="M22 44 C18 36 22 24 30 20 L27 14 L34 17 L38 13 L39 20 C45 23 47 30 43 35 C40 38 35 37 35 33 C35 30 38 29 38 31 C33 30 30 34 32 39 C34 44 41 44 45 41 C43 48 34 51 27 48 Z" fill="url(#er_' + uid + ')" stroke="' + symStroke + '" stroke-width="2.2"/>',
      axe: '<g transform="translate(32 32) scale(0.75) translate(-32 -32)">' +
        '<path d="M32 10 V54" stroke="url(#er_' + uid + ')" stroke-width="5"/>' +
        '<path d="M32 15 Q50 10 52 27 Q42 23 32 27 Z M32 15 Q14 10 12 27 Q22 23 32 27 Z" fill="url(#er_' + uid + ')" stroke="' + symStroke + '" stroke-width="2.5"/></g>',
      crown: '<path d="M16 43 L14 23 L24 31 L32 19 L40 31 L50 23 L48 43 Z M16 46 H48" fill="url(#er_' + uid + ')" stroke="' + symStroke + '" stroke-width="2.3"/>',
      wolf: '<path d="M20 20 L24 13 L29 19 H35 L40 13 L44 20 L46 32 L32 48 L18 32 Z M26 28 L29 30 M38 28 L35 30" fill="url(#er_' + uid + ')" stroke="' + symStroke + '" stroke-width="2.3"/>',
      crystal: '<path d="M32 14 L44 26 L38 48 H26 L20 26 Z M32 14 V48 M20 26 H44" fill="url(#er_' + uid + ')" stroke="' + symStroke + '" stroke-width="2.2"/>',
      skull: '<path d="M21 29 C21 20 26 16 32 16 C38 16 43 20 43 29 C43 33 41 36 39 38 V44 H25 V38 C23 36 21 33 21 29 Z" fill="url(#er_' + uid + ')" stroke="' + symStroke + '" stroke-width="2.2"/><circle cx="27.5" cy="29" r="2.8" fill="' + symStroke + '"/><circle cx="36.5" cy="29" r="2.8" fill="' + symStroke + '"/>',
      star: '<polygon points="32,14 37,25 49,26 40,34 43,46 32,40 21,46 24,34 15,26 27,25" fill="url(#er_' + uid + ')" stroke="' + symStroke + '" stroke-width="2.2"/>',
      hammer: '<g transform="translate(32 32) scale(0.76) translate(-32 -32)"><path d="M32 24 V54" stroke="url(#er_' + uid + ')" stroke-width="5.5"/><rect x="16" y="12" width="32" height="14" rx="3" fill="url(#er_' + uid + ')" stroke="' + symStroke + '" stroke-width="2.5"/></g>',
      flame: '<path d="M32 14 C39 22 45 28 43 38 C41 45 36 48 32 48 C26 48 21 43 22 35 C22 30 25 27 26 24 C26 28 29 30 31 28 C29 23 30 18 32 14 Z" fill="url(#er_' + uid + ')" stroke="' + symStroke + '" stroke-width="2.2"/>'
    };
    const sym = symbols[emb.symbol] || symbols.swords;
    const defs = lg('eb_' + uid, [col.top, col.bot]) + lg('er_' + uid, [rim.c1, rim.c2], 0, 0, 1, 1);
    return '<svg class="clan-emb" viewBox="0 0 64 64" width="' + size + '" height="' + size + '" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round"><defs>' + defs + '</defs>' +
      '<path d="' + pathD + '" fill="url(#eb_' + uid + ')" stroke="' + rim.stroke + '" stroke-width="3.5"/>' +
      '<path d="' + pathD + '" fill="none" stroke="url(#er_' + uid + ')" stroke-width="3.2" transform="translate(32 32) scale(0.88) translate(-32 -32)"/>' +
      sym + '</svg>';
  };

  ART.itemIcon = function (it, heroKey) {
    // персональная картинка эксклюзивной вещи (например золотой набор викинга)
    if (it.skinIcon) return imgIcon((it.slot === 'chest' ? 'armor' : it.slot) + '_' + it.skinIcon);
    const col = MB.RARITY[it.r].color;
    const n = it.slot === 'weapon' ? 'w_' + (heroKey || 'viking') : it.slot === 'chest' ? 'chestarmor' : it.slot;
    return ART.icon(n, col);
  };
})();