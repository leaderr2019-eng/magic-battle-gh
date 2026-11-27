/* Magic Battle — экраны, бой на canvas, сохранение. */
(function () {
  'use strict';
  const MB = window.MB, ART = MB.ART, W = 1280, H = 720, SAVE_KEY = 'magicbattle_save_v1', UIFONT = "'Fira Sans', 'PT Sans', 'Trebuchet MS', sans-serif";
  const $ = s => document.querySelector(s);
  let save, cv, g, ui, modal, scene = { mode: 'load', bg: 'fon_polyana' }, BV = null, heroTab = 'viking', bagFilter = 'all', campCh = 1, scrapRar = 'all', scrapSel = {};

  /* ---------- Локализация RU / EN ---------- */
  const I18N = {
    lang: 'ru',
    dict: {
      ru: {
        settings: 'Настройки', done: 'Готово', close: 'Закрыть', cancel: 'Отмена', back: '← Назад',
        music: 'Музыка', sfx: 'Звуки', language: 'Язык', on: 'Вкл', off: 'Выкл',
        music_on: 'Музыка включена', music_off: 'Музыка выключена',
        sfx_on: 'Звуки включены', sfx_off: 'Звуки выключены',
        lang_ru: 'Русский', lang_en: 'English',
        save_browser: 'Сохранение — в этом браузере',
        campaign: 'Кампания', heroes: 'Герои', lair: 'Логово боссов', coliseum: 'Колизей',
        shop: 'Магазин', rating: 'Рейтинг', clans: 'Кланы', profile: 'Профиль',
        energy: 'Энергия', sparks: 'Искры', ore: 'Руда', clan_coin: 'Клановая монета', gems: 'Изумруды',
        daily_reward: 'Награда за вход',
        player_level: 'Уровень игрока', power: 'Сила', heroes_unlocked: 'Героев открыто',
        my_heroes: 'Мои герои', my_heroes_hint: '— нажмите на героя, и он станет вашим аватаром',
        no_clan: 'Не состоит в клане', clan: 'Клан', lvl_short: 'ур.',
        no_name: 'Без имени', make_avatar: 'Сделать аватаром',
        flee: 'Сдаться', victory: 'Победа', defeat: 'Поражение',
        team: 'Отряд', stats: 'Характеристики', bio: 'Биография', equip: 'Снаряжение',
        upgrade: 'Улучшить', rank_up: 'Повысить ранг', buy: 'Купить', claim: 'Забрать',
        fight: 'В бой!', prepare: 'Подготовка', chapter: 'Глава', stage: 'Уровень',
        boss: 'Босс', locked: 'Закрыто', free: 'Бесплатно',
        by_power: 'По силе', by_level: 'По уровню',
        welcome: 'Добро пожаловать', name_hint: 'Имя от 2 до 16 символов',
        save_name: 'Сохранить',
        toast_music_on: 'Музыка включена', toast_music_off: 'Музыка выключена',
        toast_sfx_on: 'Звуки включены', toast_sfx_off: 'Звуки выключены',
        toast_lang_ru: 'Язык: Русский', toast_lang_en: 'Language: English',
        need_prev: 'Сначала пройдите предыдущий уровень',
        after_clear: 'Доступно после прохождения уровня',
        energy_low: 'Недостаточно энергии',
        settings_title: 'Настройки'
      },
      en: {
        settings: 'Settings', done: 'Done', close: 'Close', cancel: 'Cancel', back: '← Back',
        music: 'Music', sfx: 'Sounds', language: 'Language', on: 'On', off: 'Off',
        music_on: 'Music on', music_off: 'Music off',
        sfx_on: 'Sounds on', sfx_off: 'Sounds off',
        lang_ru: 'Русский', lang_en: 'English',
        save_browser: 'Progress is saved in this browser',
        campaign: 'Campaign', heroes: 'Heroes', lair: 'Boss Lair', coliseum: 'Coliseum',
        shop: 'Shop', rating: 'Ranking', clans: 'Clans', profile: 'Profile',
        energy: 'Energy', sparks: 'Sparks', ore: 'Ore', clan_coin: 'Clan Coin', gems: 'Emeralds',
        daily_reward: 'Daily reward',
        player_level: 'Player level', power: 'Power', heroes_unlocked: 'Heroes unlocked',
        my_heroes: 'My heroes', my_heroes_hint: '— tap a hero to set as your avatar',
        no_clan: 'Not in a clan', clan: 'Clan', lvl_short: 'lv.',
        no_name: 'No name', make_avatar: 'Set as avatar',
        flee: 'Surrender', victory: 'Victory', defeat: 'Defeat',
        team: 'Team', stats: 'Stats', bio: 'Biography', equip: 'Equipment',
        upgrade: 'Upgrade', rank_up: 'Rank up', buy: 'Buy', claim: 'Claim',
        fight: 'Fight!', prepare: 'Prepare', chapter: 'Chapter', stage: 'Stage',
        boss: 'Boss', locked: 'Locked', free: 'Free',
        by_power: 'By power', by_level: 'By level',
        welcome: 'Welcome', name_hint: 'Name must be 2–16 characters',
        save_name: 'Save',
        toast_music_on: 'Music enabled', toast_music_off: 'Music disabled',
        toast_sfx_on: 'Sounds enabled', toast_sfx_off: 'Sounds disabled',
        toast_lang_ru: 'Язык: Русский', toast_lang_en: 'Language: English',
        need_prev: 'Clear the previous stage first',
        after_clear: 'Available after clearing the stage',
        energy_low: 'Not enough energy',
        settings_title: 'Settings'
      }
    },
    t(key) {
      const d = this.dict[this.lang] || this.dict.ru;
      return (d && d[key] != null) ? d[key] : ((this.dict.ru && this.dict.ru[key]) || key);
    },
    setLang(code) {
      this.lang = (code === 'en') ? 'en' : 'ru';
      try { document.documentElement.lang = this.lang; } catch (e) { /* */ }
    }
  };
  const t = (key) => I18N.t(key);

  function T(ru, en) { return I18N.lang === 'en' ? (en != null ? en : ru) : ru; }

  const HERO_I18N = {
    viking: {
      en: {
        name: 'Torvald', full: 'Torvald Redbeard', role: 'Warrior · AoE damage',
        bioTitle: 'Terror of the Northern Fjords',
        bio: [
          'Torvald comes from the Northern Fjords, where children learn to throw an axe before they learn to walk. Once he bet he could hurl his axe across the entire fjord. The axe flew past the horizon and is still missing — and ever since Torvald has been proving to every stranger that he throws farther than anyone.',
          'He has never trimmed his beard. By his own account it hides a spare axe, a chunk of smoked cheese, and a lucky coin. No one dares check.',
          'Torvald is loud, stubborn, and always charges first. He fears only one thing — tickling — but it is best not to remind him.'
        ],
        skills: [
          { name: 'Axe Throw', desc: 'Basic attack on one target.' },
          { name: 'Ground Slam', desc: 'Hits all enemies for 80% Attack.' },
          { name: 'War Cry', desc: 'Whole team deals 20% more damage for 2 turns.' }
        ]
      }
    },
    knight: {
      en: {
        name: 'Lyra', full: 'Lyra Shining Blade', role: 'Fast single-target damage',
        bioTitle: 'Young Guard of the Sun Outpost',
        bio: [
          'Lyra is the youngest daughter of a guard at the Sun Outpost. From the age of eight she trained on straw dummies and dreamed of a real sword. When her father gave her a blade of pure light, the dummies never stood a chance again.',
          'She is polite, disciplined, and slightly embarrassed by how much she enjoys a fair fight. In battle the light of her blade blinds foes before they even raise a shield.',
          'Lyra left the outpost to prove that courage is not measured in years — and to find a worthy company of heroes.'
        ],
        skills: [
          { name: 'Light Wave', desc: 'Basic attack on one target.' },
          { name: 'Radiant Strike', desc: '140% Attack, always crits.' },
          { name: 'Stance', desc: '+50% dodge until your next turn.' }
        ]
      }
    },
    gnome: {
      en: {
        name: 'Born', full: 'Born the Anvil', role: 'Tank · team defense',
        bioTitle: 'Master of the Deep Forge',
        bio: [
          'Born spent half his life in the mines and the other half at the anvil. His hammer can crack rock and still carefully straighten a bent horseshoe.',
          'He speaks little, eats a lot, and trusts only those who have stood with him under a collapsing ceiling. His iron guard has saved more than one squad.',
          'Born joined the heroes after a cave-in: he held the tunnel alone until everyone escaped, then calmly walked out last.'
        ],
        skills: [
          { name: 'Throwing Hammer', desc: 'Basic attack on one target.' },
          { name: 'Molten Hammer', desc: '220% Attack on one target.' },
          { name: 'Iron Guard', desc: 'Shields the team.' }
        ]
      }
    },
    witch: {
      en: {
        name: 'Burlya', full: 'Burlya', role: 'Support · heal & poison',
        bioTitle: 'Swamp Brewmistress',
        bio: [
          'Burlya cooked a soup of swamp lilies and climbed into the cauldron to taste it. She never climbed out: the cauldron became her home, her armor, and her way of travel.',
          'Her potions heal almost anything, though they taste like mud and an old boot. Her poisons are even better than her cures — Burlya calls that her greatest talent.',
          'The Mushroom King banished her from the swamp, deciding her brews were more dangerous than his spores. Now she dreams of going home and turning the king into stew.'
        ],
        skills: [
          { name: 'Flask', desc: 'Basic attack, 90% Attack.' },
          { name: 'Poison Brew', desc: 'Poisons all enemies for 3 turns.' },
          { name: 'Healing Draught', desc: 'Heals the whole team for 25% HP.' }
        ]
      }
    },
    wizard: {
      en: {
        name: 'Merlius', full: 'Merlius the Stargazer', role: 'Mage · crowd control',
        bioTitle: 'Star Keeper of Crystal Peak',
        bio: [
          'For three hundred years Merlius lived atop Crystal Peak and counted the stars. He almost finished when a Crystal Wyrmling settled on the peak and stars began falling from the sky. Merlius lost count and was deeply offended.',
          'His magic is powerful but absent-minded. Sometimes ice shackles become a snowfall, and a fireball becomes a cabbage pie. The pies, however, are excellent.',
          'Merlius wants to restore peace to the sky and finally finish counting the stars. He says only a few million remain.'
        ],
        skills: [
          { name: 'Magic Bolt', desc: 'Basic attack on one target.' },
          { name: 'Ice Shackles', desc: '120% Attack and freeze: target skips a turn.' },
          { name: 'Curse', desc: '60% Attack to all enemies; they take 25% more damage.' }
        ]
      }
    },
    archer: {
      en: {
        name: 'Yarra', full: 'Yarra Flamebloom', role: 'Archer · fire damage',
        bioTitle: 'Archer of the Burning Grove',
        bio: [
          'Yarra grew up in an elven grove where trees bloom with fire and leaves never burn. She learned to shoot before she could speak, and still answers questions with a bullseye shot.',
          'Her arrows ignite on their own the moment she gets angry. Even dragons prefer not to annoy her.',
          'She seeks her grandmother’s ancient bow, said to be hidden somewhere on Crystal Peak.'
        ],
        skills: [
          { name: 'Fire Arrow', desc: 'Basic attack on one target.' },
          { name: 'Arrow Rain', desc: '70% Attack to all enemies.' },
          { name: 'Ignite', desc: '110% Attack and burn for 3 turns.' }
        ]
      }
    },
    boar: {
      en: {
        name: 'Sir Grunt', full: 'Sir Grunt', role: 'Paladin · tank & heal',
        bioTitle: 'Knight of the Crystal Trough',
        bio: [
          'Sir Grunt is the only boar ever knighted. It happened after he single-handedly pulled the royal carriage from a swamp and barely got dirty. Almost.',
          'He wears armor polished to a shine and always speaks very politely — even to trolls. Especially to trolls, because after talking to him they are usually on the ground.',
          'Grunt believes the best medicine is a warm word and a sturdy shield. Friends agree: under his shield it is genuinely warm.'
        ],
        skills: [
          { name: 'Mace Smash', desc: 'Charges and hits one target.' },
          { name: 'Holy Light', desc: 'Heals the whole team for 18% HP.' },
          { name: 'Shield Oath', desc: 'Shield an ally for 30% of their HP.' }
        ]
      }
    },
    ninja: {
      en: {
        name: 'Kira', full: 'Kira the Shadow', role: 'Assassin · crits & dodge',
        bioTitle: 'Champion of the Coliseum',
        bio: [
          'No one knows where Kira came from. One day she simply appeared in the Coliseum, defeated every champion in a row, and vanished in a puff of smoke — forgetting her reward.',
          'They say she can walk a tightrope of spider silk and hide in her own shadow. Kira says little, but every word hits hard.',
          'She will join only those who prove their strength on all ten Coliseum arenas.'
        ],
        skills: [
          { name: 'Shuriken', desc: 'Basic attack on one target.' },
          { name: 'Shadow Strike', desc: 'Sneaks in: 180% Attack, always crits.' },
          { name: 'Smoke Screen', desc: '+50% dodge until your next turn.' }
        ]
      }
    }
  };

  const ENEMY_EN = {
    goblin: 'Forest Goblin', wolf: 'Grey Wolf', penek: 'Stump Cone-thrower', kobold: 'Kobold Bomber',
    bat: 'Bat', beetle: 'Stone Beetle', frog: 'Spear Frog', mosquito: 'Blood Mosquito',
    sporeling: 'Spore Mushroom', trollkid: 'Troll Cub', spider: 'Cave Spider', shaman: 'Goblin Shaman',
    imp: 'Ice Imp', yeti: 'Baby Yeti', guard: 'Crystal Guard', hedgehog: 'Spiky Hedgehog',
    rat: 'Ore Rat', bear: 'Cave Bear', wisp: 'Swamp Wisp', shard: 'Crystal Shard'
  };
  const BOSS_EN = {
    golem: { name: 'Meadow Golem', mech: 'Every 3 turns smashes the ground, hitting all heroes.' },
    kirka: { name: 'Foreman Kirka', mech: 'Throws dynamite at a group of heroes.' },
    king: { name: 'Mushroom King', mech: 'Every 3 turns heals itself and minions; attacks poison.' },
    troll: { name: 'Cave Troll', mech: 'Enrage: below 50% HP acts twice per round.' },
    dragon: { name: 'Crystal Wyrmling', mech: 'Every second turn breathes ice and freezes a hero; every 4 turns shields itself.' },
    minotaur: { name: 'Arena Minotaur', mech: 'Blind rage: below 50% HP acts twice; axe hits stun (15%).' },
    andoor: { name: 'Lich King Andoor', mech: 'Two attacks: blight orb hits one hero, soul vortex is the second. Attacks curse (30%); every 4 turns self-shields.' }
  };
  const CHAPTER_EN = {
    1: 'Magic Meadow', 2: 'Abandoned Mine', 3: 'Mushroom Swamp', 4: "Troll's Lair", 5: 'Crystal Peak'
  };
  const RARITY_EN = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
  const LAIR_EN = ['Normal', 'Hard', 'Nightmare'];
  const SLOT_EN = { weapon: 'Weapon', helmet: 'Helmet', chest: 'Armor', gloves: 'Gloves', boots: 'Boots', amulet: 'Amulet' };
  const STATUS_EN = { poison: 'Poison', freeze: 'Freeze', curse: 'Curse', warcry: 'War Cry', stance: 'Stance', stun: 'Stun', enrage: 'Enrage' };
  const CHEST_EN = { wood: 'Wooden Chest', green: 'Green Chest', blue: 'Blue Chest', purple: 'Purple Chest', gold: 'Golden Chest' };
  const POTION_EN = { s: 'Small Energy Flask', m: 'Medium Energy Flask', l: 'Large Energy Flask' };

  function heroLoc(key, field) {
    const pack = HERO_I18N[key];
    if (I18N.lang === 'en' && pack && pack.en && pack.en[field] != null) return pack.en[field];
    const h = MB.HEROES[key];
    if (!h) return key;
    return h[field] != null ? h[field] : key;
  }
  function heroBio(key) {
    const pack = HERO_I18N[key];
    if (I18N.lang === 'en' && pack && pack.en && Array.isArray(pack.en.bio)) return pack.en.bio;
    const h = MB.HEROES[key];
    return (h && Array.isArray(h.bio)) ? h.bio : [];
  }
  function skillLoc(heroKey, idx, field) {
    const pack = HERO_I18N[heroKey];
    if (I18N.lang === 'en' && pack && pack.en && pack.en.skills && pack.en.skills[idx] && pack.en.skills[idx][field] != null)
      return pack.en.skills[idx][field];
    const h = MB.HEROES[heroKey];
    return h && h.skills && h.skills[idx] ? (h.skills[idx][field] || '') : '';
  }
  function enemyLoc(key) {
    if (I18N.lang === 'en' && ENEMY_EN[key]) return ENEMY_EN[key];
    const e = MB.ENEMIES[key]; return e ? e.name : key;
  }
  function bossLoc(key, field) {
    field = field || 'name';
    if (I18N.lang === 'en' && BOSS_EN[key] && BOSS_EN[key][field]) return BOSS_EN[key][field];
    const b = MB.BOSSES[key];
    if (!b) return key;
    return field === 'mech' ? (b.mechText || '') : (b.name || key);
  }
  function chapterLoc(n) {
    if (I18N.lang === 'en' && CHAPTER_EN[n]) return CHAPTER_EN[n];
    const c = MB.CHAPTERS[n - 1]; return c ? c.name : '';
  }
  function rarityLoc(r) {
    if (I18N.lang === 'en' && RARITY_EN[r] != null) return RARITY_EN[r];
    return (MB.RARITY[r] && MB.RARITY[r].name) ? MB.RARITY[r].name : '';
  }
  function unitName(u) {
    if (!u) return '';
    if (u.side === 'hero' || (u.key && MB.HEROES[u.key])) return heroLoc(u.key, 'name');
    if (u.boss || (u.key && MB.BOSSES[u.key])) return bossLoc(u.key, 'name');
    return enemyLoc(u.key || u.type);
  }

  /* ---------- Передний план локации (редактируемые части) ---------- */
  const FG_DEF = {
    fon_polyana: { sw: 2741, sh: 1530, parts: { l: { img: 'fon_polyana_fg_l', bx: [0, 1018, 723, 1529] }, r: { img: 'fon_polyana_fg_r', bx: [2162, 978, 2740, 1529] } } },
    fon_shahta: { sw: 2752, sh: 1536, parts: { l: { img: 'fon_shahta_fg_l', bx: [0, 1023, 1094, 1535] }, r: { img: 'fon_shahta_fg_r', bx: [2210, 996, 2751, 1535] } } },
    fon_mashroom: { sw: 2752, sh: 1536, parts: { l: { img: 'fon_mashroom_fg_l', bx: [0, 1069, 874, 1535] }, r: { img: 'fon_mashroom_fg_r', bx: [1812, 1036, 2751, 1535] } } },
    fon_cavetroll: { sw: 2752, sh: 1536, parts: { l: { img: 'fon_cavetroll_fg_l', bx: [0, 597, 805, 1535] }, r: { img: 'fon_cavetroll_fg_r', bx: [1613, 996, 2751, 1535] } } },
    fon_crystaallsnow: { sw: 2752, sh: 1536, parts: { l: { img: 'fon_crystaallsnow_fg_l', bx: [0, 1204, 637, 1535] }, r: { img: 'fon_crystaallsnow_fg_r', bx: [2218, 1136, 2751, 1535] } } },
    fon_lich: { sw: 1280, sh: 720, parts: { b: { img: 'fon_lich_fg_b', bx: [0, 502, 1279, 719] } } }
  };
  const FG_LABEL = { fon_polyana: 'Поляна', fon_shahta: 'Шахта', fon_mashroom: 'Болото', fon_cavetroll: 'Логово', fon_crystaallsnow: 'Пик', fon_lich: 'Арена Лича' };
  // зафиксированные вручную позиции частей фона (редактор «Передний план») — умолчания, localStorage может перекрывать
  const FG_POS_DEF = {
    fon_polyana: { l: [-3.94, 0, 1], r: [4.92, 0.98, 1] },
    fon_shahta: { l: [0, 0, 1], r: [0, 0, 1] },
    fon_mashroom: { l: [-4.92, 0, 1], r: [0, 0, 1] },
    fon_cavetroll: { l: [-3.94, -0.98, 1], r: [3.94, -1.97, 1] },
    fon_crystaallsnow: { l: [-4.92, 0.98, 1], r: [3.94, 1.97, 1] },
    fon_lich: { b: [0, 0, 1] }
  };
  const FG_PART_LABEL = { l: 'Левая', r: 'Правая', b: 'Слой' };
  let FG = { sel: 'l', drag: null }, FG_POS = {};
  try { FG_POS = JSON.parse(localStorage.getItem('magicbattle_fg_v1')) || {}; } catch (e) { FG_POS = {}; }
  const fgSave = () => { try { localStorage.setItem('magicbattle_fg_v1', JSON.stringify(FG_POS)); } catch (e) { /* хранилище недоступно */ } };
  function fgParts(bg) { const def = FG_DEF[bg]; return def ? Object.keys(def.parts) : []; }
  function fgPos(bg) { const d = FG_POS[bg] || (FG_POS[bg] = {}); fgParts(bg).forEach(k => { if (!d[k]) d[k] = (FG_POS_DEF[bg] && FG_POS_DEF[bg][k]) ? FG_POS_DEF[bg][k].slice() : [0, 0, 1]; }); return d; }
  function fgRect(def, part) {
    const kx = (W + 20) / def.sw, ky = (H + 20) / def.sh;
    const x = -10 + part.bx[0] * kx, y = -10 + part.bx[1] * ky;
    const w = (part.bx[2] - part.bx[0] + 1) * kx, h = (part.bx[3] - part.bx[1] + 1) * ky;
    return { x: x, y: y, w: w, h: h, cx: x + w / 2, cy: y + h / 2 };
  }
  function drawFgParts(ctx, editor) {
    const def = FG_DEF[scene.bg]; if (!def) return; const d = fgPos(scene.bg);
    fgParts(scene.bg).forEach(k => {
      const part = def.parts[k], pos = d[k] || [0, 0, 1], r = fgRect(def, part), s = pos[2] || 1;
      const x = r.cx + (pos[0] || 0) - r.w * s / 2, y = r.cy + (pos[1] || 0) - r.h * s / 2, w = r.w * s, h = r.h * s;
      const im = ART.fg(part.img);
      if (im && im.complete && im.naturalWidth) ctx.drawImage(im, x, y, w, h);
      if (editor) {
        ctx.save(); ctx.setLineDash(FG.sel === k ? [] : [10, 7]); ctx.lineWidth = FG.sel === k ? 4 : 2;
        ctx.strokeStyle = FG.sel === k ? '#ffd45e' : 'rgba(255,255,255,.55)'; ctx.strokeRect(x, y, w, h);
        if (FG.sel === k) { ctx.fillStyle = '#ffd45e'; ctx.font = '800 22px ' + UIFONT; ctx.textAlign = 'left'; ctx.fillText(FG_PART_LABEL[k] || k, x + 10, y + 28); }
        ctx.restore();
      }
    });
  }
  let ptSel = 'viking';
  const now = () => new Date();

  /* ---------- Сохранение ---------- */
  function loadSave() {
    try {
      const s = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (s && s.v === 1) { const d = MB.newSave(); for (const k in d) if (s[k] === undefined) s[k] = d[k];
        MB.HERO_ORDER.forEach(k => { if (!s.heroes[k]) s.heroes[k] = d.heroes[k]; const h = s.heroes[k]; if (!h.tr) { h.tr = MB.newTree(); delete h.pts; } if (h.xp == null) h.xp = 0; });
        s.bag.forEach(i => { if (i.rank == null) i.rank = 0; i.up = Math.min(i.up || 0, MB.RARITY[i.r].maxUp); i.rank = Math.min(i.rank, MB.rankCap(i)); });
        if (MB.ensureClan) MB.ensureClan(s); return s; }
    } catch (e) { /* нет сохранения */ }
    return MB.newSave();
  }
  function cloudSaveGet() {
    try {
      const sdk = window.PikabuSDK;
      if (sdk && sdk.storage && typeof sdk.storage.get === 'function') {
        return sdk.storage.get('save');
      }
    } catch (e) { /* SDK недоступен */ }
    return null;
  }
  function cloudSaveSet(data) {
    try {
      const sdk = window.PikabuSDK;
      if (sdk && sdk.storage && typeof sdk.storage.set === 'function') {
        sdk.storage.set('save', data);
      }
    } catch (e) { /* SDK недоступен */ }
  }
  let persistTimer = 0;
  function persist() {
    if (persistTimer) return;
    persistTimer = setTimeout(() => {
      persistTimer = 0;
      try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* хранилище недоступно */ }
      save._ts = Date.now();
      cloudSaveSet(save);
    }, 120);
  }
  // активные облики героев -> префиксы спрайтов в ART (облик применяется только если он куплен)
  function syncSkins() { ART.heroArt = {}; if (save.skinUse) for (const k in save.skinUse) if (save.skins && save.skins[k] && save.skinUse[k]) ART.heroArt[k] = save.skinUse[k]; }

  /* ---------- Часы и анимации ---------- */
  const clock = { t: 0, speed: 1 }, tweens = [];
  function tween(o, p, to, ms) { return new Promise(r => tweens.push({ o: o, p: p, from: o[p], to: to, t0: clock.t, ms: ms, r: r })); }
  function sleep(ms) { return new Promise(r => tweens.push({ t0: clock.t, ms: ms, r: r })); }
  let lastTs = 0, frameAcc = 0;
  function frame(ts) {
    const dt = Math.min(50, ts - lastTs || 16); lastTs = ts; clock.t += dt * clock.speed;
    for (let i = tweens.length - 1; i >= 0; i--) {
      const w = tweens[i], k = Math.min(1, (clock.t - w.t0) / w.ms);
      if (w.o) w.o[w.p] = w.from + (w.to - w.from) * (1 - (1 - k) * (1 - k));
      if (k >= 1) { tweens.splice(i, 1); w.r(); }
    }
    // В меню хватает ~30 кадров: меньше нагрузки на телефон
    const cap = (scene && scene.mode === 'battle') ? 16 : 33;
    frameAcc += dt;
    if (frameAcc >= cap) { frameAcc = 0; draw(); }
    requestAnimationFrame(frame);
  }

  /* ---------- Фоновая музыка (меню / бой) с плавным затуханием ---------- */
  const MUSIC = (function () {
    let targetVol = 0.3;
    const FADE_MS = 850;
    const STEP_MS = 35;

    const tracks = {
      menu: new Audio('assets/audio/menu_theme.mp3'),
      battle: new Audio('assets/audio/battle_theme.mp3')
    };
    tracks.menu.loop = true;
    tracks.battle.loop = true;
    tracks.menu.preload = 'auto';
    tracks.battle.preload = 'none';
    tracks.menu.volume = 0;
    tracks.battle.volume = 0;

    const timers = { menu: null, battle: null };
    let wantTrack = null;
    let activeTrack = null;
    let muted = false;

    function clearFade(key) {
      if (timers[key]) {
        clearInterval(timers[key]);
        timers[key] = null;
      }
    }

    function fadeTo(key, toVol, pauseOnDone) {
      const audio = tracks[key];
      if (!audio) return;
      clearFade(key);
      const startVol = Math.max(0, Math.min(1, audio.volume || 0));
      const clampedTo = Math.max(0, Math.min(1, toVol));
      if (Math.abs(startVol - clampedTo) < 0.01) {
        audio.volume = clampedTo;
        if (pauseOnDone && clampedTo === 0) {
          try { audio.pause(); } catch (e) { /* */ }
        }
        return;
      }
      const steps = Math.max(1, Math.round(FADE_MS / STEP_MS));
      let curStep = 0;
      timers[key] = setInterval(() => {
        curStep++;
        const t = Math.min(1, curStep / steps);
        const eased = 1 - Math.pow(1 - t, 2);
        audio.volume = Math.max(0, Math.min(1, startVol + (clampedTo - startVol) * eased));
        if (t >= 1) {
          clearFade(key);
          audio.volume = clampedTo;
          if (pauseOnDone && clampedTo === 0) {
            try { audio.pause(); } catch (e) { /* */ }
          }
        }
      }, STEP_MS);
    }

    function playTrack(key) {
      if (muted || !key || targetVol <= 0) return;
      const next = tracks[key];
      if (!next) return;

      Object.keys(tracks).forEach(otherKey => {
        if (otherKey !== key) {
          fadeTo(otherKey, 0, true);
        }
      });

      activeTrack = next;
      if (next.paused) {
        next.volume = Math.min(next.volume || 0, 0.02);
      }
      clearFade(key);
      const p = next.play();
      if (p && typeof p.catch === 'function') {
        p.catch(() => { /* автозапуск заблокирован до первого взаимодействия пользователя */ });
      }
      fadeTo(key, targetVol, false);
    }

    function sync(mode) {
      const targetKey = (mode === 'battle') ? 'battle' : 'menu';
      wantTrack = targetKey;
      if (muted || targetVol <= 0) {
        stopAll(true);
        return;
      }
      if (activeTrack === tracks[targetKey] && !tracks[targetKey].paused) {
        fadeTo(targetKey, targetVol, false);
        return;
      }
      playTrack(targetKey);
    }

    function stopAll(fade) {
      Object.keys(tracks).forEach(k => {
        if (fade) {
          fadeTo(k, 0, true);
        } else {
          clearFade(k);
          tracks[k].volume = 0;
          try { tracks[k].pause(); } catch (e) { /* */ }
        }
      });
    }

    function setMuted(m) {
      muted = !!m;
      if (muted) {
        stopAll(true);
      } else if (wantTrack) {
        playTrack(wantTrack);
      }
    }

    function isMuted() {
      return muted || targetVol <= 0;
    }

    function setVolume(v) {
      targetVol = Math.max(0, Math.min(1, +v || 0));
      if (muted || targetVol <= 0) {
        stopAll(true);
      } else if (wantTrack) {
        if (activeTrack && !activeTrack.paused) {
          fadeTo(wantTrack === 'battle' ? 'battle' : 'menu', targetVol, false);
        } else {
          playTrack(wantTrack);
        }
      }
    }

    function getVolume() {
      return targetVol;
    }

    function resumeOnGesture() {
      if (!muted && targetVol > 0 && wantTrack) {
        playTrack(wantTrack);
      }
    }

    return { sync: sync, setMuted: setMuted, isMuted: isMuted, setVolume: setVolume, getVolume: getVolume, resumeOnGesture: resumeOnGesture };
  })();

  const SFX = (function () {
    const MAP = {
      ui_click: 'assets/audio/sfx/ui_sounds/ui_click.mp3',
      ui_back: 'assets/audio/sfx/ui_sounds/ui_back.mp3',
      ui_open: 'assets/audio/sfx/ui_sounds/ui_open.mp3',
      ui_tab: 'assets/audio/sfx/ui_sounds/ui_tab.mp3',
      ui_error: 'assets/audio/sfx/ui_sounds/ui_error.mp3',
      ui_toast: 'assets/audio/sfx/ui_sounds/ui_toast.mp3',
      coin_gain: 'assets/audio/sfx/ui_sounds/coin_gain.mp3',
      gem_gain: 'assets/audio/sfx/ui_sounds/gem_gain.mp3',
      ore_gain: 'assets/audio/sfx/ui_sounds/ore_gain.mp3',
      spark_gain: 'assets/audio/sfx/ui_sounds/spark_gain.mp3',
      purchase: 'assets/audio/sfx/ui_sounds/purchase.mp3',
      daily_reward: 'assets/audio/sfx/ui_sounds/daily_reward.mp3',

      equip_item: 'assets/audio/sfx/item_sounds/equip_item.mp3',
      item_upgrade: 'assets/audio/sfx/item_sounds/item_upgrade.mp3',
      rank_up: 'assets/audio/sfx/item_sounds/rank_up.mp3',
      level_up: 'assets/audio/sfx/item_sounds/level_up.mp3',
      hero_unlock: 'assets/audio/sfx/item_sounds/hero_unlock.mp3',
      chest_open_wood: 'assets/audio/sfx/item_sounds/chest_open_wood.mp3',
      chest_open_gold: 'assets/audio/sfx/item_sounds/chest_open_gold.mp3',
      potion_drink: 'assets/audio/sfx/item_sounds/potion_drink.mp3',
      energy_elixir: 'assets/audio/sfx/item_sounds/energy_elixir.mp3',

      hit_axe: 'assets/audio/sfx/heroes_sounds/hit_axe.mp3',
      hit_sword: 'assets/audio/sfx/heroes_sounds/hit_sword.mp3',
      hit_hammer: 'assets/audio/sfx/heroes_sounds/hit_hammer.mp3',
      throw_flask: 'assets/audio/sfx/heroes_sounds/throw_flask.mp3',
      cast_magic: 'assets/audio/sfx/heroes_sounds/cast_magic.mp3',
      cast_ice: 'assets/audio/sfx/heroes_sounds/cast_ice.mp3',
      shot_arrow: 'assets/audio/sfx/heroes_sounds/shot_arrow.mp3',
      hit_boar: 'assets/audio/sfx/heroes_sounds/hit_boar.mp3',
      throw_shuriken: 'assets/audio/sfx/heroes_sounds/throw_shuriken.mp3',

      battle_start: 'assets/audio/sfx/common_sounds/battle_start.mp3',
      hit_crit: 'assets/audio/sfx/common_sounds/hit_crit.mp3',
      hit_miss: 'assets/audio/sfx/common_sounds/hit_miss.mp3',
      block: 'assets/audio/sfx/common_sounds/block.mp3',
      heal: 'assets/audio/sfx/common_sounds/heal.mp3',
      unit_defeat: 'assets/audio/sfx/common_sounds/unit_defeat.mp3',
      enemy_defeat: 'assets/audio/sfx/common_sounds/enemy_defeat.mp3',
      boss_intro: 'assets/audio/sfx/common_sounds/boss_intro.mp3',
      boss_defeat: 'assets/audio/sfx/common_sounds/boss_defeat.mp3',
      victory: 'assets/audio/sfx/common_sounds/victory.mp3',
      defeat: 'assets/audio/sfx/common_sounds/defeat.mp3'
    };

    const base = {};
    Object.keys(MAP).forEach(k => {
      const a = new Audio(MAP[k]);
      a.preload = 'auto';
      a.volume = 0.72;
      base[k] = a;
    });

    let sfxVol = 0.2;
    let sfxMuted = false;
    const lastPlayed = {};
    // Плавное затухание в конце клипа: не длиннее FADE_OUT_MS и не больше 40% длительности
    const FADE_OUT_MS = 140;

    function attachFadeOut(node, peakVol) {
      if (!node || peakVol <= 0) return;
      let fadeTimer = null;
      let fadeIv = null;
      const clear = () => {
        if (fadeTimer) { clearTimeout(fadeTimer); fadeTimer = null; }
        if (fadeIv) { clearInterval(fadeIv); fadeIv = null; }
      };
      const schedule = () => {
        const dur = node.duration;
        if (!isFinite(dur) || dur <= 0.08) return;
        const fadeMs = Math.min(FADE_OUT_MS, dur * 1000 * 0.4);
        if (fadeMs < 40) return;
        const startAtMs = Math.max(0, dur * 1000 - fadeMs);
        const delay = Math.max(0, startAtMs - (node.currentTime || 0) * 1000);
        clear();
        fadeTimer = setTimeout(() => {
          const steps = Math.max(6, Math.round(fadeMs / 20));
          const stepMs = fadeMs / steps;
          let i = 0;
          fadeIv = setInterval(() => {
            i++;
            const t = Math.min(1, i / steps);
            // ease-out quadratic — мягкое затухание
            node.volume = peakVol * (1 - t) * (1 - t);
            if (t >= 1) {
              clear();
              try { node.pause(); } catch (e) { /* */ }
            }
          }, stepMs);
        }, delay);
      };
      node.addEventListener('ended', clear, { once: true });
      node.addEventListener('pause', clear, { once: true });
      if (node.readyState >= 1 && isFinite(node.duration) && node.duration > 0) {
        schedule();
      } else {
        node.addEventListener('loadedmetadata', schedule, { once: true });
      }
    }

    function play(key, vol) {
      if (!key || !MAP[key]) return;
      if (sfxMuted || sfxVol <= 0) return;
      const nowMs = Date.now();
      const minGap = key === 'ui_click' || key === 'ui_tab' ? 45 : 35;
      if (lastPlayed[key] && nowMs - lastPlayed[key] < minGap) return;
      lastPlayed[key] = nowMs;

      try {
        const src = base[key] || new Audio(MAP[key]);
        const node = src.cloneNode ? src.cloneNode() : new Audio(MAP[key]);
        const baseVol = vol != null ? vol : 0.72;
        const peakVol = Math.max(0, Math.min(1, baseVol * sfxVol));
        node.volume = peakVol;
        const p = node.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
        attachFadeOut(node, peakVol);
      } catch (e) { /* */ }
    }

    function setVolume(v) {
      sfxVol = Math.max(0, Math.min(1, +v || 0));
    }

    function getVolume() {
      return sfxVol;
    }

    function setMuted(m) {
      sfxMuted = !!m;
    }

    function isMuted() {
      return sfxMuted || sfxVol <= 0;
    }

    function heroAttack(attacker, sk, r) {
      if (!attacker || !attacker.u) return;
      const key = attacker.u.key;
      if (attacker.u.side === 'hero') {
        if (key === 'viking') return play('hit_axe', 0.78);
        if (key === 'knight') return play('hit_sword', 0.76);
        if (key === 'gnome') return play('hit_hammer', 0.78);
        if (key === 'witch') return play('throw_flask', 0.76);
        if (key === 'wizard') {
          const isIce = (sk && (sk.proj === 'ice' || sk.proj === 'snowball' || sk.fx === 'freeze')) || (r && r.status === 'freeze');
          return play(isIce ? 'cast_ice' : 'cast_magic', 0.78);
        }
        if (key === 'archer') return play('shot_arrow', 0.75);
        if (key === 'boar') return play('hit_boar', 0.78);
        if (key === 'ninja') return play('throw_shuriken', 0.76);
      }
      // Для атак врагов/боссов, у которых нет отдельного озвученного файла в ассетах,
      // подбираем ближайший ударный/магический/дальнего боя звук из имеющихся:
      if (sk && (sk.proj === 'ice' || sk.proj === 'snowball' || sk.fx === 'freeze' || (r && r.status === 'freeze'))) {
        return play('cast_ice', 0.74);
      }
      if (sk && (sk.proj === 'arrow' || sk.proj === 'pick' || sk.proj === 'shuriken')) {
        return play('shot_arrow', 0.72);
      }
      if (sk && (sk.proj === 'flask' || sk.proj === 'spore' || sk.proj === 'orbg' || sk.fx === 'poison')) {
        return play('throw_flask', 0.72);
      }
      if (sk && (sk.proj === 'orb' || sk.proj === 'lich_orb' || sk.proj === 'lich_vortex' || sk.fx === 'curse')) {
        return play('cast_magic', 0.74);
      }
      if (sk && (sk.fx === 'slam' || sk.melee)) {
        return play('hit_hammer', 0.74);
      }
      return play('hit_axe', 0.72);
    }

    return { play: play, heroAttack: heroAttack, setVolume: setVolume, getVolume: getVolume, setMuted: setMuted, isMuted: isMuted };
  })();



  /* ---------- Мелочи интерфейса ---------- */
  const ic = n => ART.icon(n);
  // картинки из сгенерированного арта (assets/ui)
  const mImg = (f, cls) => '<img class="' + (cls || 'mb-ic') + '" src="assets/ui/' + f + '" alt="">';
  // портрет: D — диаметр в пикселях (по умолчанию 64)
  const pt = (key, cls, extra, D) => '<span class="pt ' + (cls || '') + '" style="' + (D ? 'width:' + D + 'px;height:' + D + 'px;' : '') + ART.ptStyle(key, (D || 64) - 6) + '">' + (extra || '') + '</span>';
  function topbar(title, back) {
    const e = MB.energy(save, Date.now());
    const dly = MB.dailyState(save, now());
    const dq = MB.dailyQuestState(save, now());
    const hasQuestReward = MB.DAILY_QUESTS.some((q, i) => dq.wins >= q.wins && !dq.claimed[i]);
    const glow = dly.canClaim || hasQuestReward;
    return '<div class="top">' + (back ? '<button class="btn small" data-act="' + back + '">' + t('back') + '</button>' : '') + '<h1 class="out">' + title + '</h1>' +
      '<button class="dailychest' + (glow ? ' glow' : '') + '" data-act="daily" title="' + t('daily_reward') + '"><img src="assets/ui/daily_chest.webp" alt=""></button>' +
      '<div class="res energy" data-act="energy" title="' + t('energy') + (e.next ? ' · ' + fmtT(e.next) : '') + '"><img src="assets/ui/energy.webp" alt=""><span class="val" id="en">' + e.val + '/' + (e.max || MB.ENERGY.max) + '</span><img class="pls" src="assets/ui/plus_btn.webp" alt="+"></div>' +
      '<div class="res sparks" data-act="shoptab" data-t="free" title="' + t('sparks') + '"><img src="assets/ui/spark.webp" alt=""><span class="val">' + save.sparks + '</span><img class="pls" src="assets/ui/plus_btn.webp" alt="+"></div>' +
      '<div class="res ore" data-act="shoptab" data-t="ore" title="' + t('ore') + '"><img src="assets/ui/ore.webp" alt=""><span class="val">' + save.ore + '</span><img class="pls" src="assets/ui/plus_btn.webp" alt="+"></div>' +
      '<div class="res ccoin" data-act="shoptab" data-t="clan" title="' + t('clan_coin') + '"><img src="assets/ui/clan_coin.webp" alt=""><span class="val">' + (save.ccoin || 0) + '</span><img class="pls" data-act="shoptab" data-t="clan" src="assets/ui/plus_btn.webp" alt="+"></div>' +
      '<div class="res gems" data-act="shoptab" data-t="gems" title="' + t('gems') + '"><img src="assets/ui/gem.webp" alt=""><span class="val">' + save.gems + '</span><img class="pls" data-act="shoptab" data-t="gems" src="assets/ui/plus_btn.webp" alt="+"></div>' +
      '<button type="button" class="settings-gear" data-act="settings" title="' + t('settings') + '"><img src="assets/ui/set_gear.png" alt=""></button></div>';
  }
  function fmtT(ms) { if (!ms) return ''; const t = Math.ceil(ms / 1000), m = Math.floor(t / 60), x = t % 60; return m + ':' + String(x).padStart(2, '0'); }
  setInterval(() => {
    if (BV && BV.cleared && !BV.resultReady && !BV.b.result && Date.now() - BV.startMs >= 5000) {
      BV.resultReady = true;
      const rb = $('#btn-result');
      if (rb) { rb.disabled = false; rb.removeAttribute('title'); }
    }
    const a = $('#en'); if (!a || !save) return; const e = MB.energy(save, Date.now()); a.textContent = e.val + '/' + (e.max || MB.ENERGY.max);
  }, 250);
  function openModal(html) { modal.innerHTML = HT(html); modal.classList.add('on'); SFX.play('ui_open', 0.65); }
  function closeModal() { const wasOpen = modal && modal.classList.contains('on'); modal.classList.remove('on'); modal.innerHTML = ''; if (wasOpen) SFX.play('ui_back', 0.65); }
  let toastT = 0;
  function toast(text) {
    let el = $('.toast'); if (!el) { el = document.createElement('div'); el.className = 'toast'; $('#stage').appendChild(el); }
    el.textContent = localizeToast(String(text || '')); el.style.display = 'block'; clearTimeout(toastT); toastT = setTimeout(() => { el.style.display = 'none'; }, 2200);
    const s = String(text || '').toLowerCase();
    const isErr = /недостаточно|нет |нельзя|сначала|уже |ошибк|заблокирован|отклоняет|огранич|лимит|not enough|cannot|first|already|error|blocked|limit/.test(s);
    SFX.play(isErr ? 'ui_error' : 'ui_toast', 0.65);
  }
  /* Полный словарь UI-фраз RU→EN + автоперевод тостов и подписей */
    const PHRASE_EN = {
      'Заходите каждый день с понедельника по субботу — и в воскресенье заберёте 20 изумрудов. Пропущенный день сгорает, в понедельник серия начинается заново.': 'Log in every day Mon–Sat to claim 20 emeralds on Sunday. A missed day breaks the streak; it resets on Monday.',
      'Шкала активности и сундуки клана обновляются раз в неделю. Очки активности (и личный вклад) зарабатываются общими усилиями участников:': 'The activity bar and clan chests refresh weekly. Activity points (and personal contribution) are earned by members together:',
      'Покупка разовая и действует навсегда, повторно купить эликсир нельзя. Саму энергию он не добавляет: шкала просто становится больше.': 'One-time permanent purchase; cannot buy again. It does not add energy — the bar simply becomes larger.',
      'Дуэли 1 на 1: выберите одного героя. Каждую арену можно пройти только один раз. На 5-й — босс, на 10-й — финал.': '1v1 duels: pick one hero. Each arena can be cleared only once. Arena 5 is a boss, arena 10 is the finale.',
      'Пока нет открытых кланов для вступления. Создайте свой или дождитесь, когда появятся кланы других игроков.': 'No open clans to join yet. Create your own or wait for other players’ clans.',
      'Это прототип: покупки за рубли тестовые, деньги не списываются. В игре здесь откроется оплата площадки.': 'Prototype: ruble purchases are simulated and not charged. Platform billing will appear in the live build.',
      'За бой с клановым боссом: +20 монет, за победу: +400 всем соклановцам. Ключи: 2 бесплатно каждый день.': 'Clan boss battle: +20 coins, victory: +400 to all members. Keys: 2 free every day.',
      'за успешный бой с нанесением урона боссу начисляется +5 очков активности (и +5 к личному вкладу).': 'a successful fight that damages the boss grants +5 activity (+5 personal contribution).',
      'Монеты уже начислены. Если закрыть окно, опыт можно будет забрать позже — награда не пропадёт.': 'Coins already granted. If you close this, XP can be claimed later — the reward will not be lost.',
      'Нет ключей кланового босса — 2 новых дадут завтра, ещё можно купить в клановом магазине': 'No clan boss keys — 2 free tomorrow, or buy more in the clan shop',
      'Одно очко за каждый уровень героя. Узел открывается, если все предыдущие в ветке взяты.': 'One point per hero level. A node unlocks when all previous nodes in the branch are taken.',
      'Вам доступен золотой сундук за лучший урон прошлой недели — нажмите «Забрать награду».': 'Golden chest for last week’s top damage is ready — tap “Claim reward”.',
      'Вы единственный участник клана — сначала примите игрока и передайте ему статус лидера': 'You are the only member — accept a player first and transfer leadership',
      'Новая неделя: клановый босс обновлён. Вы лучший по урону — заберите золотой сундук!': 'New week: clan boss refreshed. You dealt the most damage — claim your golden chest!',
      'Сила аккаунта — сумма силы всех ваших героев, уровень — сумма их уровней. Вы на ': 'Account power is the sum of all hero power; level is the sum of their levels. You are #',
      'Сила аккаунта — сумма силы всех ваших героев, уровень — сумма их уровней. ': 'Account power is the sum of all hero power; level is the sum of their levels. ',
      'Логово боссов откроется после прохождения 1-й главы (победа над боссом).': 'Boss Lair unlocks after clearing chapter 1 (defeat the boss).',
      'Открыто «Логово боссов»! Теперь можно сражаться с боссами повторно.': 'Boss Lair unlocked! You can now refight bosses.',
      'Открыты «Кланы»! Вступайте в клан и сражайтесь с клановым боссом.': 'Clans unlocked! Join a clan and fight the clan boss.',
      'Кланы откроются после прохождения 4-й главы (победа над боссом).': 'Clans unlock after clearing chapter 4 (defeat the boss).',
      'Весь прогресс, герои и вещи будут удалены. Это нельзя отменить.': 'All progress, heroes and items will be deleted. This cannot be undone.',
      'руды — +50 очков активности) и продвигает клан к новому уровню.': 'ore — +50 activity) and progresses the clan level.',
      'Герб выбирается только при создании клана и больше не меняется': 'The emblem is chosen at clan creation and cannot be changed',
      'У вас закончились ключи для боя с клановым боссом (осталось: ': 'You have no keys left for the clan boss (remaining: ',
      'Недостаточно очков прокачки или достигнут максимум (20 ур.)': 'Not enough upgrade points or max level (20) reached',
      'Тащите бойцов мышкой. Позиции запоминаются для этой локации': 'Drag fighters with the mouse. Positions are saved for this location',
      'Для вступления в клан на площадке нужен вход через аккаунт': 'Sign in with a platform account to join a clan',
      '(1 раз в неделю) — забрать вместе с наградой за победу.': '(once per week) — claim with the victory reward.',
      'Вещи лежат в сумке на экране «Герои» и подходят только ': 'Items are in your bag on the Heroes screen and fit only ',
      'Для создания клана на площадке нужен вход через аккаунт': 'Sign in with a platform account to create a clan',
      'или дождаться бесплатного пополнения завтра (+2 ключа).': 'or wait for free keys tomorrow (+2).',
      'Сброс в понедельник 00:00 · 1-е место — золотой сундук': 'Resets Monday 00:00 · 1st place — golden chest',
      'Вещи лежат в сумке — наденьте их на экране «Герои».': 'Items are in your bag — equip them on the Heroes screen.',
      '. В рейтинге только проверенные аккаунты площадки.': '. Only verified platform accounts appear in the ranking.',
      'Колизей откроется после победы над боссом главы ': 'Coliseum unlocks after defeating the chapter ',
      'Пройдите 10 уровней, чтобы открыть бой с боссом.': 'Clear 10 stages to unlock the boss fight.',
      'а с ростом уровня расширяется (на 10 уровне — до': 'and grows with level (at level 10 — up to',
      '(+2 бесплатно каждый день, ещё — в лавке клана)': '(+2 free every day, more in the clan shop)',
      'Урон сохраняется в течение недели. За урон дают': 'Damage carries through the week. Damage grants',
      '— нажмите на героя, и он станет вашим аватаром': '— tap a hero to set as your avatar',
      'В отряде уже 3 героя — сначала уберите одного': 'Team already has 3 heroes — remove one first',
      'Вы лучший по урону — заберите золотой сундук!': 'You dealt the most damage — claim your golden chest!',
      'Введите никнейм — он будет виден в рейтинге.': 'Enter a nickname — it will appear on the ranking.',
      'Менять режим приёма может только лидер клана': 'Only the Leader can change recruitment mode',
      '✔ Куплено — облик переключается в меню героя': '✔ Owned — switch skin in the hero menu',
      'Улучшать постройки клана может только Лидер': 'Only the Leader can upgrade clan buildings',
      '(до 20 символов: буквы, пробел, «-» и «+»)': '(up to 20 characters: letters, space, “-” and “+”)',
      'Герб клана нельзя изменить после создания': 'Clan emblem cannot be changed after creation',
      'клановых монет. Выберите героя для опыта.': 'clan coins. Choose a hero for XP.',
      'Менять описание клана может только Лидер': 'Only the Leader can edit the clan description',
      'Отряд пал. Герои получают меньше опыта.': 'Your party fell. Heroes gain less XP.',
      '— приносит опыт клану и очки активности': '— grants clan XP and activity points',
      'Золотой сундук за лучший урон недели: ': 'Golden chest for weekly top damage: ',
      'Имя выбирается один раз и не меняется.': 'The name is chosen once and cannot be changed.',
      'Обновление в Пн 00:00 (+3 UTC) через: ': 'Resets Mon 00:00 (+3 UTC) in: ',
      'руды даёт +10 очков активности (взнос ': 'ore gives +10 activity (donation of ',
      'Вещь лежит в сумке на экране «Герои».': 'The item is in your bag on the Heroes screen.',
      'Вы лидируете по урону на этой неделе.': 'You lead in damage this week.',
      'Ключ кланового босса куплен! Ключей: ': 'Clan boss key purchased! Keys: ',
      'Опыт героя: даётся за битвы (победа +': 'Hero XP: earned in battles (win +',
      'Новая неделя: клановый босс обновлён': 'New week: clan boss refreshed',
      'Посмотрите короткий ролик и получите': 'Watch a short video and get',
      'Имя должно быть от 2 до 16 символов': 'Name must be 2–16 characters',
      'Сначала пройдите предыдущий уровень': 'Clear the previous stage first',
      'Попытки на этой неделе закончились': 'No attempts left this week',
      'Босс откроется после 10-го уровня': 'Boss unlocks after stage 10',
      'Доступно после прохождения уровня': 'Available after clearing the stage',
      'Нет ключей — 2 новых дадут завтра': 'No keys — 2 free keys tomorrow',
      'Нет предметов выбранной редкости.': 'No items of the selected rarity.',
      'Сначала пройдите предыдущую арену': 'Clear the previous arena first',
      'Выберите героя, который получит ': 'Choose a hero to receive ',
      'Станет доступно через 5 сек. боя': 'Available after 5 sec of battle',
      '↻ Поверните телефон для удобства': '↻ Rotate your phone for a better view',
      'Как начисляются очки активности': 'How activity points work',
      'роли (Лидер, Офицер, Участник)': 'roles (Leader, Officer, Member)',
      'Максимум энергии вырастет на ': 'Energy cap will increase by ',
      'Нет ключей — докупить в лавке': 'No keys — buy in the shop',
      'Передать права лидера игроку ': 'Transfer leadership to ',
      'Эту вещь может носить только ': 'Only this hero can equip: ',
      'Ключ кланового босса куплен!': 'Clan boss key purchased!',
      'Локальный профиль (гостевой)': 'Local profile (guest)',
      'Скопировать для разработчика': 'Copy for developer',
      'Недостаточно клановых монет': 'Not enough clan coins',
      'Пожертвования руды в казну:': 'Ore donations to the treasury:',
      'Расскажите о вашем клане...': 'Tell about your clan...',
      'Сумка общая на всех героев.': 'The bag is shared by all heroes.',
      'наибольшим уроном за неделю': 'the highest weekly damage',
      'Восстановление: +1 каждые ': 'Regen: +1 every ',
      'Атаки на кланового босса:': 'Clan boss attacks:',
      'Заблокировано от разборки': 'Locked from scrapping',
      'Лимиты рекламы обновлены!': 'Ad limits refreshed!',
      'Постройка клана улучшена!': 'Clan building upgraded!',
      'При создании клан вмещает': 'A new clan holds',
      'В бой с боссом! (1 ключ)': 'Fight the boss! (1 key)',
      'Надето — сначала снимите': 'Equipped — unequip first',
      'Обновление каждый день в': 'Refreshes every day at',
      'Описание клана обновлено': 'Clan description updated',
      'Попыток на этой неделе: ': 'Attempts this week: ',
      'Вместимость: 10 игроков': 'Capacity: 10 players',
      'Суммарный урон по боссу': 'Total damage to boss',
      'прокачка построек клана': 'clan building upgrades',
      'В клане вас ждёт общий': 'In a clan you get a shared',
      'Вернулся обычный облик': 'Default skin restored',
      'Недостаточно изумрудов': 'Not enough emeralds',
      'Эта арена уже пройдена': 'This arena is already cleared',
      'нажмите кнопку ещё раз': 'tap the button again',
      'Большая банка энергии': 'Large Energy Flask',
      'Золотой облик включён': 'Golden skin enabled',
      'Очки прокачки клана: ': 'Clan upgrade points: ',
      'Перейти в Лавку клана': 'Go to Clan Shop',
      'Пожертвование в казну': 'Donate to the treasury',
      'Сброс лимитов рекламы': 'Ad limits reset',
      'Соклановцы принесли +': 'Clan members brought +',
      'Средняя банка энергии': 'Medium Energy Flask',
      'для рангов снаряжения': 'for gear ranks',
      'награды за активность': 'activity rewards',
      'Вы вступили в клан «': 'You joined clan «',
      'Награда уже получена': 'Reward already claimed',
      'Недостаточно энергии': 'Not enough energy',
      'Вы можете перейти в': 'You can go to the',
      'Малая банка энергии': 'Small Energy Flask',
      'нажмите на союзника': 'tap an ally',
      'понедельник в 00:00': 'Monday at 00:00',
      'Вы станете лидером': 'You will be the Leader',
      'Добро пожаловать, ': 'Welcome, ',
      'Заявки отклоняются': 'Applications closed',
      'Исключить из клана': 'Kick from clan',
      'Максимум энергии: ': 'Energy cap: ',
      'Назначить Офицером': 'Promote to Officer',
      'Не состоит в клане': 'Not in a clan',
      'Победа над боссом:': 'Boss victory:',
      'Сбросить прогресс?': 'Reset progress?',
      'Снять роль Офицера': 'Remove Officer role',
      'Это имя недоступно': 'This name is not available',
      'и докупить ключ за': 'and buy a key for',
      'снята роль офицера': 'officer role removed',
      ' и покинуть клан?': ' and leave the clan?',
      ' — клан вырос до ': ' — clan reached level ',
      'Language: English': 'Language: English',
      'Деревянный сундук': 'Wooden Chest',
      'Клановые монеты: ': 'Clan coins: ',
      'Максимум (20 ур.)': 'Max (lv. 20)',
      'Награды за победу': 'Victory rewards',
      'Недостаточно искр': 'Not enough sparks',
      'Недостаточно руды': 'Not enough ore',
      'Осталось сегодня:': 'Left today:',
      'Только для Лидера': 'Leader only',
      'Улучшить (1 очко)': 'Upgrade (1 point)',
      'Фиолетовый сундук': 'Purple Chest',
      'исключён из клана': 'kicked from the clan',
      'назначен офицером': 'promoted to officer',
      'Аккаунт площадки': 'Platform account',
      'Бонус к Искрам: ': 'Sparks bonus: ',
      'Вы покинули клан': 'You left the clan',
      'Колизей · арена ': 'Coliseum · arena ',
      'Музыка выключена': 'Music disabled',
      'Награда за босса': 'Boss reward',
      'Нет ключей босса': 'No boss keys',
      'Одобрение заявки': 'Application required',
      'Подготовка к бою': 'Battle prep',
      'Редактор позиций': 'Position editor',
      'Реклама за Искры': 'Ad for Sparks',
      'Сделать аватаром': 'Set as avatar',
      'Сохранить иконку': 'Save icon',
      'всем соклановцам': 'to all clan members',
      'нажмите на врага': 'tap an enemy',
      '+1 бой · есть: ': '+1 fight · owned: ',
      'Забрать награду': 'Claim reward',
      'Заявка в клан «': 'Application to clan «',
      'Звуки выключены': 'Sounds disabled',
      'Клановая монета': 'Clan Coin',
      'Клановый босс: ': 'Clan boss: ',
      'Музыка включена': 'Music enabled',
      'Набор изумрудов': 'Emerald pack',
      'Награда за вход': 'Daily reward',
      'Награды и вклад': 'Rewards & contribution',
      'Покинуть клан «': 'Leave clan «',
      'Сдаться и выйти': 'Surrender and leave',
      'Уровень клана: ': 'Clan level: ',
      'Эликсир энергии': 'Energy Elixir',
      'очки активности': 'activity points',
      ' принят в клан': ' accepted into the clan',
      'Босс повержен!': 'Boss defeated!',
      'Героев открыто': 'Heroes unlocked',
      'До обновления:': 'Until reset:',
      'Заявка игрока ': 'Application from ',
      'Звуки включены': 'Sounds enabled',
      'Зелёный сундук': 'Green Chest',
      'Золотой сундук': 'Golden Chest',
      'Как вас зовут?': 'What is your name?',
      'Клан вырос до ': 'Clan reached level ',
      'Лечение за ход': 'Heal per turn',
      'Название клана': 'Clan name',
      'Описание клана': 'Clan description',
      'Открыта арена ': 'Arena unlocked: ',
      'Открыта глава ': 'Chapter unlocked: ',
      'Прокачка клана': 'Clan upgrades',
      'Разблокировать': 'Unlock',
      'Ранг повышен: ': 'Rank up: ',
      'Свободный вход': 'Open join',
      'Уровень игрока': 'Player level',
      'Урон за неделю': 'Weekly damage',
      'Урон по боссам': 'Boss damage',
      'Характеристики': 'Stats',
      'золотой сундук': 'a golden chest',
      'клановых монет': 'clan coins',
      'присоединяется': 'joins',
      ', поражение +': ', loss +',
      'Банки энергии': 'Energy flasks',
      'Заблокировать': 'Lock',
      'Закрытый клан': 'Closed clan',
      'Заявка подана': 'Application sent',
      'Клановый босс': 'Clan boss',
      'Логово боссов': 'Boss Lair',
      'Новый герой: ': 'New hero: ',
      'Повысить ранг': 'Rank up',
      'Подать заявку': 'Apply',
      'Покинуть клан': 'Leave clan',
      'Сила отряда: ': 'Team power: ',
      'Скорость хода': 'Turn speed',
      'Сменить отряд': 'Change team',
      'Снять офицера': 'Demote Officer',
      'Тестовый клан': 'Test clan',
      'Топ-20 кланов': 'Top 20 clans',
      'Язык: Русский': 'Language: Russian',
      'клановый босс': 'clan boss',
      'особый амулет': 'special amulet',
      'пак за монеты': 'pack for coins',
      '-м месте из ': ' of ',
      '» отправлена': '» sent',
      'Иконка клана': 'Clan icon',
      'Сброс босса:': 'Boss reset:',
      'Сила бойца: ': 'Fighter power: ',
      'Синий сундук': 'Blue Chest',
      'Создать клан': 'Create clan',
      'Урон боссу: ': 'Damage to boss: ',
      'Участников: ': 'Members: ',
      ' (Ваш клан)': ' (Your clan)',
      ' · уровень ': ' · stage ',
      ' активности': ' activity',
      'Боевой клич': 'War Cry',
      'Босс главы ': 'Chapter boss ',
      'Босс уцелел': 'Boss survived',
      'Ваш вклад: ': 'Your contribution: ',
      'Ваш никнейм': 'Your nickname',
      'Ваша роль: ': 'Your role: ',
      'Доп. атака!': 'Extra attack!',
      'Каждый бой:': 'Each battle:',
      'Лавка Клана': 'Clan Shop',
      'Лавка клана': 'Clan shop',
      'Лавку клана': 'Clan Shop',
      'Легендарная': 'Legendary',
      'Лучшая цена': 'Best value',
      'Новый герой': 'New hero',
      'Разобрано: ': 'Scrapped: ',
      'Сложность: ': 'Difficulty: ',
      ' · Искры +': ' · Sparks +',
      ' · элитный': ' · elite',
      ' опыта и +': ' XP and +',
      ' отклонена': ' rejected',
      'Арена Лича': 'Lich Arena',
      'Выделить (': 'Select (',
      'До сброса:': 'Until reset:',
      'Доп. атака': 'Extra attack',
      'Заморожен!': 'Frozen!',
      'Как играть': 'How to play',
      'Ключ босса': 'Boss key',
      'Крит. урон': 'Crit damage',
      'Мастерство': 'Mastery',
      'Надеть на ': 'Equip on ',
      'Подготовка': 'Prepare',
      'Получено ✔': 'Claimed ✔',
      'Получено: ': 'Received: ',
      'Пробивание': 'Pierce',
      'Противники': 'Enemies',
      'Реклама за': 'Ad for',
      'Снаряжение': 'Equipment',
      'активности': 'activity',
      'доп. атака': 'extra attack',
      'пробивание': 'pierce',
      '✔ В отряде': '✔ In roster',
      ' · глава ': ' · chapter ',
      ' получил ': ' gained ',
      '» создан!': '» created!',
      'Без имени': 'No name',
      'Бесплатно': 'Free',
      'Биография': 'Biography',
      'В Колизей': 'To Coliseum',
      'Ваш отряд': 'Your team',
      'Загрузка…': 'Loading…',
      'Заморозка': 'Freeze',
      'Изумрудов': 'Emeralds',
      'Куплено: ': 'Purchased: ',
      'Логово · ': 'Lair · ',
      'Мои герои': 'My heroes',
      'Награда: ': 'Reward: ',
      'Настройки': 'Settings',
      'Необычная': 'Uncommon',
      'Нет очков': 'No points',
      'Оглушение': 'Stun',
      'По вкладу': 'By contribution',
      'По уровню': 'By level',
      'Повторить': 'Retry',
      'Популярно': 'Popular',
      'Поражение': 'Defeat',
      'Пройдено ': 'Cleared ',
      'Проклятие': 'Curse',
      'Разобрать': 'Scrap',
      'Результат': 'Result',
      'С игрока ': 'From player ',
      'Свой клан': 'Your clan',
      'Сохранить': 'Save',
      'Спецатаки': 'Specials',
      'Стойкость': 'Fortitude',
      'Эпическая': 'Epic',
      'оглушение': 'stun',
      ' · мест ': ' · slots ',
      ' достиг ': ' reached level ',
      ' уровня!': '!',
      '1 вещь (': '1 item (',
      'В логово': 'To Lair',
      'Вступить': 'Join',
      'Загрузка': 'Loading',
      'Здоровье': 'Health',
      'Изумруды': 'Emeralds',
      'Кампания': 'Campaign',
      'Ключей: ': 'Keys: ',
      'Надето: ': 'Equipped: ',
      'Оглушён!': 'Stunned!',
      'Перчатки': 'Gloves',
      'Прокачка': 'Upgrades',
      'Сбросить': 'Reset',
      'Смотреть': 'Watch',
      'Создать ': 'Create ',
      'Улучшить': 'Upgrade',
      'Уровень ': 'Level ',
      'Участник': 'Member',
      'получает': 'gets',
      ' · ур. ': ' · lv. ',
      'Автобой': 'Auto-battle',
      'Ещё раз': 'Again',
      'Забрать': 'Claim',
      'Закрыто': 'Locked',
      'Закрыть': 'Close',
      'Игрок с': 'The player with',
      'Искры +': 'Sparks +',
      'История': 'Story',
      'К карте': 'To map',
      'Колизей': 'Coliseum',
      'Магазин': 'Shop',
      'Награды': 'Rewards',
      'Обычная': 'Common',
      'Отлично': 'Great',
      'По силе': 'By power',
      'Понятно': 'Got it',
      'Приём: ': 'Recruitment: ',
      'Профиль': 'Profile',
      'Рейтинг': 'Ranking',
      'Реклама': 'Ads',
      'Русский': 'Russian',
      'Сдаться': 'Surrender',
      'Сложная': 'Hard',
      'Создать': 'Create',
      'Сундуки': 'Chests',
      'Уворот!': 'Dodge!',
      'Уровень': 'Level',
      'Энергия': 'Energy',
      'игроков': 'players',
      'энергии': 'energy',
      'энергия': 'energy',
      '← Назад': '← Back',
      '0м 00с': '0m 00s',
      'Амулет': 'Amulet',
      'Болото': 'Swamp',
      'В бой!': 'Fight!',
      'В клан': 'To clan',
      'Вы на ': 'You are #',
      'Глава ': 'Chapter ',
      'Готово': 'Done',
      'Защита': 'Defense',
      'Клан «': 'Clan «',
      'Кошмар': 'Nightmare',
      'Купить': 'Buy',
      'Логово': 'Lair',
      'Музыка': 'Music',
      'Оружие': 'Weapon',
      'Отмена': 'Cancel',
      'Офицер': 'Officer',
      'Победа': 'Victory',
      'Поляна': 'Meadow',
      'Правая': 'Right',
      'Ранг: ': 'Rank: ',
      'Редкая': 'Rare',
      'Сапоги': 'Boots',
      'Стойка': 'Stance',
      'Тестер': 'Tester',
      'Уворот': 'Dodge',
      'Ярость': 'Enrage',
      'вещь: ': 'item: ',
      'взнос ': 'a donation of ',
      'каждый': 'every',
      'мест: ': 'slots: ',
      'Атака': 'Attack',
      'Броня': 'Armor',
      'Герои': 'Heroes',
      'Звуки': 'Sounds',
      'Игрок': 'Player',
      'Искры': 'Sparks',
      'Кланы': 'Clans',
      'Левая': 'Left',
      'Лидер': 'Leader',
      'Назад': 'Back',
      'Отряд': 'Team',
      'Снять': 'Unequip',
      'Шахта': 'Mine',
      'Щит +': 'Shield +',
      'мест ': 'slots ',
      'монет': 'coins',
      'опыта': 'XP',
      ' XP.': ' XP.',
      ' мин': ' min',
      'АВТО': 'AUTO',
      'Блок': 'Block',
      'Босс': 'Boss',
      'Выкл': 'Off',
      'Искр': 'Sparks',
      'Клан': 'Clan',
      'Крит': 'Crit',
      'Руда': 'Ore',
      'Руды': 'Ore',
      'Сила': 'Power',
      'Слой': 'Layer',
      'Ур. ': 'Lv. ',
      'Ход:': 'Turn:',
      'Шлем': 'Helmet',
      'Язык': 'Language',
      'блок': 'block',
      'есть': 'owned',
      'опыт': 'XP',
      'Вкл': 'On',
      'Все': 'All',
      'Нет': 'No',
      'Пик': 'Peak',
      'ур.': 'lv.',
      'щит': 'shield',
      '»?': '»?',
      'Вы': 'You',
      'Да': 'Yes',
      'Яд': 'Poison',
      'из': 'of',
      'и': 'and',
  };

  function L(text) {
    if (I18N.lang !== 'en' || text == null) return text;
    const s = String(text);
    if (!s) return s;
    if (PHRASE_EN[s]) return PHRASE_EN[s];
    return localizeToast(s);
  }

  function chestName(key) {
    if (I18N.lang === 'en' && CHEST_EN[key]) return CHEST_EN[key];
    return (MB.CHESTS[key] && MB.CHESTS[key].name) || key;
  }
  function potionName(key) {
    if (I18N.lang === 'en' && POTION_EN[key]) return POTION_EN[key];
    return (MB.POTIONS[key] && MB.POTIONS[key].name) || key;
  }
  function statusName(key) {
    if (I18N.lang === 'en' && STATUS_EN[key]) return STATUS_EN[key];
    return (MB.STATUS[key] && MB.STATUS[key].name) || key;
  }
  function slotName(sl) {
    if (I18N.lang === 'en' && SLOT_EN[sl]) return SLOT_EN[sl];
    return MB.SLOT_NAME[sl] || sl;
  }
  function elixirName() {
    return T('Эликсир энергии', 'Energy Elixir');
  }

  let _phraseKeysCache = null;
  function phraseKeysSorted() {
    if (!_phraseKeysCache || _phraseKeysCache.length !== Object.keys(PHRASE_EN).length) {
      _phraseKeysCache = Object.keys(PHRASE_EN).sort((a, b) => b.length - a.length);
    }
    return _phraseKeysCache;
  }
  /** Переводит HTML/текст целиком по словарю (для экранов с жёстко прошитым русским). */
  function HT(html) {
    if (I18N.lang !== 'en' || html == null) return html;
    let s = String(html);
    if (!s || !/[А-Яа-яЁё]/.test(s)) return s;
    const keys = phraseKeysSorted();
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      // Короткие/корневые ключи («опыт» внутри «попыток») ломают HTML
      if (k.length < 8) continue;
      if (s.indexOf(k) >= 0) s = s.split(k).join(PHRASE_EN[k]);
    }
    return s;
  }
  function applyUILang() {
    if (I18N.lang !== 'en' || !ui) return;
    try { ui.innerHTML = HT(ui.innerHTML); } catch (e) { /* */ }
  }

  function localizeToast(text) {
    if (I18N.lang !== 'en' || !text) return text;
    let s = String(text);
    if (PHRASE_EN[s]) return PHRASE_EN[s];
    // longest-key substring replace for composite messages
    const keys = Object.keys(PHRASE_EN).sort((a, b) => b.length - a.length);
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      if (k.length >= 4 && s.indexOf(k) >= 0) s = s.split(k).join(PHRASE_EN[k]);
    }
    let m = s.match(/^(.+) reached level (\d+)!$/);
    if (m) return s;
    m = s.match(/^(.+) достиг (\d+) уровня!$/);
    if (m) return m[1] + ' reached level ' + m[2] + '!';
    m = s.match(/^Новый герой: (.+)!$/);
    if (m) return 'New hero: ' + m[1] + '!';
    m = s.match(/^New hero: (.+)!$/);
    if (m) return s;
    m = s.match(/^\+(\d+) энергии$/);
    if (m) return '+' + m[1] + ' energy';
    m = s.match(/^\+(\d+) energy$/);
    if (m) return s;
    m = s.match(/^\+(\d+) Изумрудов$/);
    if (m) return '+' + m[1] + ' Emeralds';
    m = s.match(/^\+(\d+) Искр$/);
    if (m) return '+' + m[1] + ' Sparks';
    m = s.match(/^\+(\d+) Руды$/);
    if (m) return '+' + m[1] + ' Ore';
    m = s.match(/^\+(\d+) монет/);
    if (m) return s.replace('монет', 'coins').replace('клановых ', 'clan ');
    m = s.match(/^(.+) в вашем отряде!$/);
    if (m) return m[1] + ' joined your team!';
    m = s.match(/^Добро пожаловать, (.+)!$/);
    if (m) return 'Welcome, ' + m[1] + '!';
    m = s.match(/^Welcome, (.+)!$/);
    if (m) return s;
    m = s.match(/^Вы вступили в клан «(.+)»$/);
    if (m) return 'You joined clan «' + m[1] + '»';
    m = s.match(/^Клан «(.+)» создан!$/);
    if (m) return 'Clan «' + m[1] + '» created!';
    m = s.match(/^Заявка в клан «(.+)» отправлена$/);
    if (m) return 'Application to clan «' + m[1] + '» sent';
    m = s.match(/^Ключ кланового босса куплен! Ключей: (\d+)$/);
    if (m) return 'Clan boss key purchased! Keys: ' + m[1];
    m = s.match(/^Максимум энергии: (\d+)$/);
    if (m) return 'Energy cap: ' + m[1];
    m = s.match(/^Куплено: (.+)$/);
    if (m) return 'Purchased: ' + m[1];
    m = s.match(/^Награда: (.+)$/);
    if (m) return 'Reward: ' + m[1];
    m = s.match(/^(.+) получил (\d+) XP/);
    if (m) return m[1] + ' gained ' + m[2] + ' XP' + s.slice(m[0].length);
    m = s.match(/^Клан вырос до (\d+) уровня!/);
    if (m) return 'Clan reached level ' + m[1] + '!';
    m = s.match(/^Золотой сундук за лучший урон недели: (.+)!$/);
    if (m) return 'Golden chest for weekly top damage: ' + m[1] + '!';
    return s;
  }
  // фон и рамка слота под редкость вещи (легендарная — золотая пластина с сиянием)
  const RAR_BG = ['rgba(70, 72, 80, .55)', 'rgba(46, 104, 52, .5)', 'rgba(34, 84, 156, .5)', 'rgba(102, 48, 158, .5)', 'linear-gradient(#ffdf8e, #d9a32a 60%, #b87f14)'];
  const slotBg = it => 'border-color:' + MB.RARITY[it.r].color + ';background:' + RAR_BG[it.r] + (it.r === 4 ? ';box-shadow:0 0 12px rgba(245,179,1,.55), inset 0 0 10px rgba(255,246,210,.65)' : '');
  function itemCell(it, opts) {
    opts = opts || {};
    const R = MB.RARITY[it.r], own = MB.ownerOf(save, it.id);
    const act = opts.act || 'item';
    const extraCls = opts.cls ? ' ' + opts.cls : '';
    const lockBadge = it.locked ? '<span class="lock-ic" title="Заблокировано от разборки">' + ic('lock') + '</span>' : '';
    return '<div class="slot' + extraCls + '" style="' + slotBg(it) + '" data-act="' + act + '" data-id="' + it.id + '">' + ART.itemIcon(it, opts.hero || own || heroTab) +
      lockBadge +
      (it.up ? '<u>+' + it.up + '</u>' : '') + (it.rank ? '<b class="rk">' + '★'.repeat(it.rank) + '</b>' : '') + (own && !opts.noOwner ? '<q style="' + ART.ptStyle(own, 20) + '" title="' + T('Надето: ', 'Equipped: ') + heroLoc(own, 'name') + '"></q>' : '') + '</div>';
  }

  /* ---------- Главное меню ---------- */
  function showHub() {
    scene = { mode: 'hub', bg: 'fon_menu' };
    MUSIC.sync('menu'); BV = null; clock.speed = 1;
    const d = MB.dailyState(save, now()); persist();
    const av = save.avatar && save.unlocked.indexOf(save.avatar) >= 0 ? save.avatar : save.unlocked[0];
    ui.innerHTML = topbar('', null) +
      '<div class="hubtitle imgtitle"><span class="title-shimmer-wrap" style="--logo-url:url(\x27assets/ui/title_logo.png\x27)">' +'<img src="assets/ui/title_logo.png" alt="Heroes of Astoria: Magic Battle">' +'<span class="title-shimmer-beam" aria-hidden="true"></span>' +'</span></div>' +
      '<button class="pava" data-act="profile" title="' + t('profile') + '">' + pt(av, '', '<b>' + MB.accountLevel(save) + '</b>', 62) + '<span class="pnick">' + (save.name || '') + '</span></button>' +
      '<div class="hubmenu">' +
      '<button class="btn green hb" data-act="campaign" title="' + t('campaign') + '">' + mImg('mnu_swords.png') + '</button>' +
      '<button class="btn blue hb" data-act="heroes" title="' + t('heroes') + '">' + mImg('mnu_helm.png') + (freeTotal() ? '<span class="dot">' + freeTotal() + '</span>' : '') + '</button>' +
      '<button class="btn red hb" data-act="lair" title="' + t('lair') + '">' + mImg('mnu_skull.png') + (save.bosses[1] ? '' : '<span class="lk">' + ic('lock') + '</span>') + '</button>' +
      '<button class="btn purple hb" data-act="coliseum" title="' + t('coliseum') + '">' + mImg('mnu_shield_round.png') + (MB.coliseumOpen(save) ? '' : '<span class="lk">' + ic('lock') + '</span>') + '</button>' +
      '<button class="btn gold pale hb" data-act="shop" title="' + t('shop') + '">' + mImg('mnu_bag.png') + (totalAdsLeft() ? '<span class="dot">' + totalAdsLeft() + '</span>' : '') + '</button>' +
      '<button class="btn copper hb" data-act="rating" title="' + t('rating') + '">' + mImg('mnu_trophy.png') + '</button>' +
      '<button class="btn blue hb" data-act="clans" title="' + t('clans') + '">' + mImg('mnu_shield_herald.png') + (save.bosses[4] ? (save.clan && (MB.clanKeys(save) > 0 || MB.clanHasRewards(save)) ? '<span class="dot">!</span>' : '') : '<span class="lk">' + ic('lock') + '</span>') + '</button>' +
      '</div>';
    applyUILang();
    if (!save.name) showNamePrompt(); else if (!save.seenIntro) { save.seenIntro = true; persist(); showHelp(); } else if (d.canClaim && !showHub.shown) { showHub.shown = true; showDaily(); }
  }
  function refreshHubAvatar() {
    const btn = ui && ui.querySelector('.pava');
    if (!btn) return;
    const av = save.avatar && save.unlocked.indexOf(save.avatar) >= 0 ? save.avatar : save.unlocked[0];
    const nick = btn.querySelector('.pnick');
    const nickHtml = nick ? nick.outerHTML : '<span class="pnick">' + (save.name || '') + '</span>';
    btn.innerHTML = pt(av, '', '<b>' + MB.accountLevel(save) + '</b>', 62) + nickHtml;
  }
  // Никнейм при первом входе: выбирается один раз и не меняется
  function showNamePrompt() {
    openModal('<div class="panel win" style="width:520px;text-align:center"><h2 class="out">Как вас зовут?</h2>' +
      '<div class="paper"><p style="font-weight:700;margin:2px 0">Введите никнейм — он будет виден в рейтинге.<br><span class="note">Имя выбирается один раз и не меняется.</span></p>' +
      '<input id="nick" class="claninput" maxlength="16" placeholder="Ваш никнейм" autocomplete="off"></div>' +
      '<div class="foot"><button class="btn green" data-act="setname" style="min-width:220px">Сохранить</button></div></div>');
    const inp = $('#nick');
    if (inp) { inp.focus(); inp.addEventListener('keydown', e => { if (e.key === 'Enter') { const b = document.querySelector('[data-act="setname"]'); if (b) b.click(); } }); }
  }
  // Профиль игрока: никнейм, уровень, сила, герои и выбор аватара из открытых героев
  function showProfile() {
    const pw = MB.accountPower(save), lvl = MB.accountLevel(save);
    const av = save.avatar && save.unlocked.indexOf(save.avatar) >= 0 ? save.avatar : save.unlocked[0];
    const heroes = save.unlocked.map(k =>
      '<div class="h" data-act="setavatar" data-k="' + k + '" title="' + t('make_avatar') + '">' + pt(k, k === av ? 'sel' : '', '<b>' + save.heroes[k].lvl + '</b>') + '<br>' + heroLoc(k, 'name') + '</div>').join('');
    const verified = MB.net && MB.net.isVerified ? MB.net.isVerified(save) : !!save.authVerified;
    const authLabel = verified
      ? '<span style="color:#3f9a24">✓ Аккаунт площадки</span>'
      : '<span class="note">Локальный профиль (гостевой)</span>';
    openModal('<div class="panel win" style="position:relative;width:560px"><button class="x" data-act="close">✕</button><h2 class="out">' + t('profile') + '</h2>' +
      '<div class="paper pinfo" style="display:flex;gap:16px;align-items:center">' + pt(av, 'sel', '<b>' + lvl + '</b>', 92) +
      '<div style="text-align:left;font-weight:700"><div style="font-size:24px">' + (save.name || t('no_name')) + '</div>' +
      '<div style="font-size:13px;margin:2px 0 6px">' + authLabel + '</div>' +
      '<div>' + t('player_level') + ': ' + lvl + '</div><div>' + ic('power') + ' ' + t('power') + ': ' + pw + '</div>' +
      '<div>' + t('heroes_unlocked') + ': ' + save.unlocked.length + ' / ' + MB.HERO_ORDER.length + '</div>' +
      (save.clan ? '<div style="display:flex;align-items:center;gap:6px;margin-top:4px">' + ART.clanEmblem(save.clan.emblem, 26) + '<span>' + t('clan') + ': <b>' + save.clan.name + '</b> (' + t('lvl_short') + ' ' + save.clan.lvl + ')</span></div>' : '<div class="note">' + t('no_clan') + '</div>') +
      '</div></div>' +
      '<div class="paper" style="margin-top:10px"><b>' + t('my_heroes') + '</b> <span class="note">' + t('my_heroes_hint') + '</span><div class="teampick" style="flex-wrap:wrap">' + heroes + '</div></div></div>');
  }

  function showSettings() {
    const mVol = Math.round((save.musicVol != null ? save.musicVol : 0.3) * 100);
    const sVol = Math.round((save.sfxVol != null ? save.sfxVol : 0.2) * 100);
    const musicOn = !save.musicMuted && mVol > 0;
    const sfxOn = !save.sfxMuted && sVol > 0;
    const lang = (save.lang === 'en') ? 'en' : 'ru';
    openModal(
      '<div class="panel win settings-panel" style="position:relative;width:460px">' +
        '<button class="x" data-act="close">✕</button>' +
        '<h2 class="out">' + t('settings_title') + '</h2>' +
        '<div class="paper settings-body">' +
          '<div class="settings-row">' +
            '<div class="settings-label"><img class="set-ic" src="assets/ui/set_music.png" alt=""> ' + t('music') + '</div>' +
            '<button type="button" class="btn small settings-toggle ' + (musicOn ? 'gold' : '') + '" data-act="togglemusic">' + (musicOn ? t('on') : t('off')) + '</button>' +
            '<input type="range" class="settings-slider" id="vol-music" min="0" max="100" value="' + mVol + '">' +
            '<span class="settings-val" id="vol-music-val">' + mVol + '%</span>' +
          '</div>' +
          '<div class="settings-row">' +
            '<div class="settings-label"><img class="set-ic" src="assets/ui/set_sfx.png" alt=""> ' + t('sfx') + '</div>' +
            '<button type="button" class="btn small settings-toggle ' + (sfxOn ? 'gold' : '') + '" data-act="togglesfx">' + (sfxOn ? t('on') : t('off')) + '</button>' +
            '<input type="range" class="settings-slider" id="vol-sfx" min="0" max="100" value="' + sVol + '">' +
            '<span class="settings-val" id="vol-sfx-val">' + sVol + '%</span>' +
          '</div>' +
          '<div class="settings-row settings-lang-row">' +
            '<div class="settings-label"><img class="set-ic" src="assets/ui/set_lang.png" alt=""> ' + t('language') + '</div>' +
            '<div class="settings-lang">' +
              '<button type="button" class="btn small ' + (lang === 'ru' ? 'gold' : '') + '" data-act="setlang" data-l="ru">' + t('lang_ru') + '</button>' +
              '<button type="button" class="btn small ' + (lang === 'en' ? 'gold' : '') + '" data-act="setlang" data-l="en">' + t('lang_en') + '</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="foot"><button class="btn green" data-act="close">' + t('done') + '</button></div>' +
      '</div>'
    );
    const bindSlider = (id, onInput) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', () => onInput(+el.value));
    };
    bindSlider('vol-music', v => {
      save.musicVol = v / 100;
      if (v > 0) save.musicMuted = false;
      MUSIC.setVolume(save.musicVol);
      MUSIC.setMuted(!!save.musicMuted);
      persist();
      const lab = document.getElementById('vol-music-val');
      if (lab) lab.textContent = v + '%';
      const tog = document.querySelector('[data-act="togglemusic"]');
      if (tog) {
        const on = !save.musicMuted && v > 0;
        tog.textContent = on ? t('on') : t('off');
        tog.classList.toggle('gold', on);
      }
    });
    bindSlider('vol-sfx', v => {
      save.sfxVol = v / 100;
      if (v > 0) save.sfxMuted = false;
      SFX.setVolume(save.sfxVol);
      SFX.setMuted(!!save.sfxMuted);
      persist();
      const lab = document.getElementById('vol-sfx-val');
      if (lab) lab.textContent = v + '%';
      const tog = document.querySelector('[data-act="togglesfx"]');
      if (tog) {
        const on = !save.sfxMuted && v > 0;
        tog.textContent = on ? t('on') : t('off');
        tog.classList.toggle('gold', on);
      }
      if (v > 0 && !save.sfxMuted) SFX.play('ui_click', 0.55);
    });
  }

  function refreshAfterLang() {
    closeModal();
    if (scene.mode === 'hub') showHub();
    else if (scene.mode === 'battle' && BV) { renderHud(); if (BV.b) { const cur = MB.currentUnit && MB.currentUnit(BV.b); renderActions(cur || null); } }
    else if (scene.mode === 'lair') showLair();
    else if (scene.mode === 'menu') {
      // перерисуем текущий меню-экран по возможности
      if (typeof showCampaign === 'function' && campCh) showCampaign(campCh);
      else showHub();
    } else showHub();
    showSettings();
  }

  function showFgEditor(bg) {
    scene = { mode: 'fg', bg: bg || 'fon_polyana' }; BV = null; clock.speed = 1;
    const parts = fgParts(scene.bg); if (parts.indexOf(FG.sel) < 0) FG.sel = parts[0];
    const locs = Object.keys(FG_DEF).map(b => '<button class="btn small ' + (b === scene.bg ? 'gold' : '') + '" data-act="fgloc" data-b="' + b + '">' + (FG_LABEL[b] || b) + '</button>').join('');
    const ptabs = parts.map(k => '<button class="btn small ' + (FG.sel === k ? 'gold' : '') + '" data-act="fgsel" data-k="' + k + '">' + (FG_PART_LABEL[k] || k) + '</button>').join('');
    ui.innerHTML = '<div class="fghud"><b>Передний план</b>' + locs + '<span>·</span>' + ptabs +
      '<span>Тащите мышью, колесо — масштаб</span>' +
      '<button class="btn small" data-act="fgscale" data-k="minus">−</button>' +
      '<button class="btn small" data-act="fgscale" data-k="plus">+</button>' +
      '<button class="btn small" data-act="fgreset">Сброс</button>' +
      '<button class="btn small green" data-act="fgdone">Готово</button></div>';
    applyUILang();
  }

  function showPtEditor() {
    const keys = MB.HERO_ORDER.concat(Object.keys(MB.ENEMIES), Object.keys(MB.BOSSES));
    if (keys.indexOf(ptSel) < 0) ptSel = keys[0];
    const grid = keys.map(k => '<span class="pt' + (k === ptSel ? ' sel' : '') + '" data-act="ptpick" data-k="' + k + '" style="width:56px;height:56px;' + ART.ptStyle(k, 50) + '"></span>').join('');
    openModal('<div class="panel win" style="position:relative;width:840px"><button class="x" data-act="close">✕</button><h2 class="out">Портреты</h2>' +
      '<div class="ptedit"><div class="ptprev"><div class="ptbig" id="ptbig" style="' + ART.ptStyle(ptSel, 240) + '"></div><p class="note" style="text-align:center;margin-top:8px">Тащите мышью · колесо — масштаб</p></div>' +
      '<div class="ptgrid">' + grid + '</div></div>' +
      '<div class="foot"><button class="btn small" data-act="ptreset">Сброс</button><button class="btn small green" data-act="ptdone">Готово</button></div></div>');
    const big = $('#ptbig');
    let drag = null;
    big.addEventListener('pointerdown', e => {
      const st = ART.ptState(ptSel, 240);
      drag = { x: e.clientX, y: e.clientY, sx: st.sx, sy: st.sy, k: st.k };
      try { big.setPointerCapture(e.pointerId); } catch (er) { /* */ }
      e.preventDefault();
    });
    big.addEventListener('pointermove', e => {
      if (!drag) return;
      const st = ART.ptState(ptSel, 240);
      const nx = Math.max(0, Math.min(st.w - st.sz, drag.sx - (e.clientX - drag.x) / drag.k));
      const ny = Math.max(0, Math.min(st.h - st.sz, drag.sy - (e.clientY - drag.y) / drag.k));
      ART.PT[ptSel] = [nx, ny, st.zoom];
      big.setAttribute('style', ART.ptStyle(ptSel, 240));
    });
    const end = () => { if (drag) { drag = null; ART.savePT(); } };
    big.addEventListener('pointerup', end);
    big.addEventListener('pointercancel', end);
    big.addEventListener('wheel', e => {
      e.preventDefault();
      const st = ART.ptState(ptSel, 240);
      const z = Math.min(4, Math.max(0.4, st.zoom * (e.deltaY > 0 ? 0.94 : 1.06)));
      ART.PT[ptSel] = [st.sx, st.sy, z];
      ART.savePT();
      big.setAttribute('style', ART.ptStyle(ptSel, 240));
    }, { passive: false });
  }
  function ensureAdsDay() {
    // Сутки рекламы: с 03:00 UTC до 03:00 UTC следующего дня
    const t = MB.adsDayKey ? MB.adsDayKey(now()) : MB.utc3DayKey(now());
    if (!save.ads || save.ads.date !== t) {
      save.ads = { date: t, n: 0, potN: 0 };
    } else if (save.ads.potN == null) {
      save.ads.potN = 0;
    }
    return save.ads;
  }
  function adsLeft() { const a = ensureAdsDay(); return Math.max(0, MB.SHOP.ads.perDay - a.n); }
  function potAdsLeft() { const a = ensureAdsDay(); return Math.max(0, (MB.SHOP.ads.potPerDay || 5) - (a.potN || 0)); }
  function totalAdsLeft() { return adsLeft() + potAdsLeft(); }
  function freeTotal() { return save.unlocked.reduce((a, k) => a + MB.freePts(save.heroes[k]), 0); }
  function showHelp() {
    openModal('<div class="panel win" style="position:relative"><h2 class="out">' + T('Как играть', 'How to play') + '</h2><div class="paper" style="font-size:17px;line-height:1.5;font-weight:600">' +
      T(
        '• Проходите <b>Кампанию</b>: 5 глав по 10 уровней, в конце главы — босс.<br>• В бою выберите действие внизу и нажмите на врага. Кнопка <b>АВТО</b> включает автобой, <b>×2</b> ускоряет.<br>• За победы дают <b>Искры</b> — за них повышается уровень героев — и сундук со снаряжением.<br>• С боссов падает <b>Руда</b> для улучшения снаряжения. Боссов можно перепроходить в Логове.<br>• Каждый бой стоит ' + MB.ENERGY.cost + ' энергии из ' + MB.energyMax(save) + '. Энергия восстанавливается сама, а ещё есть банки энергии.',
        '• Play the <b>Campaign</b>: 5 chapters × 10 stages, with a boss at the end.<br>• In battle pick an action below and tap an enemy. <b>AUTO</b> enables auto-battle, <b>×2</b> speeds it up.<br>• Wins grant <b>Sparks</b> to level heroes and a chest with gear.<br>• Bosses drop <b>Ore</b> for upgrades. Refight bosses in the Lair.<br>• Each battle costs ' + MB.ENERGY.cost + ' energy of ' + MB.energyMax(save) + '. Energy regenerates, and flasks help too.'
      ) +
      '</div><div class="foot"><button class="btn green" data-act="close">' + T('Понятно', 'Got it') + '</button></div></div>');
  }

  /* ---------- Кампания ---------- */
  function chOpen(n) { return n === 1 || !!save.bosses[n - 1]; }
  function showCampaign(ch) {
    if (ch) campCh = ch; if (!chOpen(campCh)) campCh = 1;
    const C = MB.CHAPTERS[campCh - 1], prog = save.progress[campCh] || 0;
    scene = { mode: 'menu', bg: C.bg };
    MUSIC.sync('menu'); BV = null; clock.speed = 1;
    let chs = '';
    MB.CHAPTERS.forEach(c => {
      const p = save.progress[c.n] || 0, open = chOpen(c.n);
      const cls = c.n === campCh ? 'on' : open ? 'open' : c.n % 2 ? 'lock2' : 'lock1';
      chs += '<button class="chbtn ' + cls + '" data-act="chapter" data-ch="' + c.n + '"><b class="out">' + T('Глава ', 'Chapter ') + c.n + '. ' + chapterLoc(c.n) + '</b>' +
        '<small class="out">' + (open ? T('Пройдено ', 'Cleared ') + p + '/10' + (save.bosses[c.n] ? T(' · босс побеждён', ' · boss defeated') : '') : T('Откроется после главы ', 'Unlocks after chapter ') + (c.n - 1)) + '</small></button>';
    });
    let nodes = '';
    for (let s = 1; s <= 10; s++) {
      const st = s <= prog ? 'done' : s === prog + 1 ? 'open' : 'locked';
      const cx = 433 + (s - 1) % 5 * 185, cy = s > 5 ? 352 : 227;
      nodes += '<button class="lvln ' + st + '" data-act="stage" data-st="' + s + '" style="left:' + (cx - 62) + 'px;top:' + (cy - 62) + 'px">' +
        (st === 'done' ? '<img class="done-chk" src="assets/ui/check_green.webp" alt="">' : '') +
        '<span class="n">' + s + '</span><span class="l out">ур. ' + MB.stageLevel(campCh, s) + '</span></button>';
    }
    const B = MB.BOSSES[C.boss], bst = save.bosses[campCh] ? 'done' : prog >= 10 ? '' : 'locked';
    ui.innerHTML = topbar('', 'hub') + '<div class="camptitle"><b class="out">' + t('campaign') + '</b></div><div class="chlist">' + chs + '</div>' +
      '<div class="campteam"><button class="campheroes" data-act="campheroes" title="Герои и снаряжение"><img src="assets/ui/mnu_helm.png" alt="Герои">' + (freeTotal() ? '<span class="dot">' + freeTotal() + '</span>' : '') + '</button>' + save.team.slice(0, 3).map(tk => '<span data-act="campteam" title="Отряд">' + pt(tk, '', '<b>' + save.heroes[tk].lvl + '</b>', 54) + '</span>').join('') + '</div>' +
      '<div class="camphead"><h2 class="out">Глава ' + campCh + '. ' + C.name + '</h2><p class="out">Пройдите 10 уровней, чтобы открыть бой с боссом.</p></div>' + nodes +
      '<button class="bossb ' + bst + '" data-act="boss"><span class="bport">' + pt(C.boss, '', '', 90) + '</span><span class="bframe"></span>' +
      '<span class="btxt"><b class="out">Босс: ' + B.name + ' · ур. ' + MB.bossLevel(campCh) + '</b><i>' + (bst === 'locked' ? 'Откроется после 10-го уровня' : B.mechText) + '</i></span></button>';
    applyUILang();
  }

  /* ---------- Подготовка к бою ---------- */
  let prep = null;
  function openPrep(ctx) {
    prep = ctx;
    const C = MB.CHAPTERS[ctx.ch - 1];
    if (ctx.type === 'clan') { const info = MB.clanBossInfo(save.clan); ctx.bossName = info.name; ctx.enemies = [{ type: info.art, lvl: info.lvl, displayLvl: info.displayLvl, boss: true, clanBoss: true, hpMax: info.maxHp, hpCur: save.clan.bossHp }]; }
    else ctx.enemies = ctx.type === 'stage' ? MB.stageEnemies(ctx.ch, ctx.st) : ctx.type === 'col' ? MB.coliseumFloor(ctx.f) : MB.bossEnemies(ctx.ch, ctx.type === 'lair' ? MB.LAIR[ctx.diff].lvl : 0);
    save.team = save.team.filter(k => save.unlocked.indexOf(k) >= 0); if (!save.team.length) save.team = [save.unlocked[0]];
    if (ctx.type === 'col' && (!ctx.hero || save.unlocked.indexOf(ctx.hero) < 0)) ctx.hero = save.team[0] || save.unlocked[0];
    const title = ctx.type === 'clan' ? 'Клановый босс: ' + ctx.bossName : ctx.type === 'col' ? 'Колизей, арена ' + ctx.f : ctx.type === 'stage' ? 'Глава ' + ctx.ch + ', уровень ' + ctx.st : ctx.type === 'boss' ? 'Босс: ' + MB.BOSSES[C.boss].name : 'Логово: ' + MB.BOSSES[C.boss].name + ' (' + MB.LAIR[ctx.diff].name + ')';
    let en = '';
    ctx.enemies.forEach(e => { const d = MB.ENEMIES[e.type] || MB.BOSSES[e.type]; en += '<div class="e">' + pt(e.type, '', '', 56) + '<span>' + d.name + (e.elite ? ' ★' : '') + '<small>ур. ' + (e.displayLvl || e.lvl) + (e.elite ? ' · элитный' : '') + (e.hpMax ? ' · ❤ ' + e.hpCur + '/' + e.hpMax : '') + '</small></span></div>'; });
    const boss = ctx.enemies[0].boss ? '<p class="note" style="margin-top:6px"><b>Особенность босса.</b> ' + MB.BOSSES[ctx.enemies[0].type].mechText + '</p>' : '';
    // Награды за бой: игрок заранее видит, что получит за первое и повторное прохождение
    let rewHtml = '';
    if (ctx.type === 'clan') {
      const bl = save.clan ? save.clan.bossLvl : 1;
      rewHtml = '<div class="paper" style="margin-top:10px"><b>Награды</b><div class="prew">' +
        '<span class="r">✦ +' + MB.XP.clanFight + ' XP за бой</span>' +
        '<span class="r"><img class="mb-ic" src="assets/ui/clan_coin.webp" alt="">+' + MB.CCOIN.clanFight + ' за бой</span>' +
        '<span class="r">' + ic('spark') + '+1 за каждые 300 урона</span></div>' +
        '<p class="note" style="margin-top:6px">За победу над боссом: ✦ +' + MB.XP.clanKill + ' XP и +' + MB.CCOIN.clanKill + ' монет всем соклановцам, ' + ic('gem') + '+200, ' + ic('ore') + '+200' + ', ' + MB.CHESTS.purple.name + '. Ключ тратится даже при поражении.</p></div>';
    } else {
      const sparkBon = (ctx.type === 'col' ? [ctx.hero] : save.team.slice(0, 3)).reduce((a, kk) => a + (kk ? MB.heroStats(save, kk).sparksBonus : 0), 0) + MB.clanSparksBonus(save);
      const sparkN = (L2, f) => Math.round(MB.sparksFor(L2) * (f ? 2 : 1) * (1 + sparkBon / 100));
      let L, first, minR; const extraFirst = [], rw = []; let note2 = '';
      if (ctx.type === 'stage') { L = MB.stageLevel(ctx.ch, ctx.st); first = (save.progress[ctx.ch] || 0) < ctx.st; minR = 'wood'; }
      else if (ctx.type === 'boss') {
        L = MB.bossLevel(ctx.ch); first = !save.bosses[ctx.ch]; minR = 'blue';
        if (first) { extraFirst.push(ic('ore') + '+' + C.ore, ic('gem') + '+50');
          if (C.unlock) extraFirst.push('<span class="rew-hero" title="Новый герой: ' + heroLoc(C.unlock, 'full') + '">' + pt(C.unlock, '', '', 36) + '</span>');
          if (C.amulet) extraFirst.push('особый амулет'); }
      } else if (ctx.type === 'col') {
        L = MB.coliseumFloor(ctx.f)[0].lvl; first = save.col.best < ctx.f; minR = ctx.f % 5 === 0 ? 'purple' : 'blue';
        if (first) { extraFirst.push(ic('gem') + '+30', ic('ore') + '+' + (20 + ctx.f * 4));
          if (ctx.f === MB.COLISEUM.floors && save.unlocked.indexOf(MB.COLISEUM.reward) < 0) extraFirst.push('<span class="rew-hero" title="Новый герой: ' + heroLoc(MB.COLISEUM.reward, 'full') + '">' + pt(MB.COLISEUM.reward, '', '', 36) + '</span>'); }
      } else {
        const D = MB.LAIR[ctx.diff], lair = MB.lairState(save, now()), oreAmt = MB.lairOreFor(C.boss, ctx.diff);
        L = MB.bossLevel(ctx.ch) + D.lvl; first = false; minR = null;
        rw.push(ic('ore') + '+' + oreAmt);
        if ((lair.diff[C.boss] || 0) <= ctx.diff && ctx.diff < 2) note2 = 'Первая победа откроет сложность «' + MB.LAIR[ctx.diff + 1].name + '». ';
      }
      const xpWin = MB.XP.win + (first && ctx.type === 'stage' ? MB.XP.firstStage : 0) + (first && ctx.type === 'boss' ? MB.XP.firstBoss : 0);
      const rows = ['<span class="r">✦ +' + xpWin + ' XP</span>']
        .concat(ctx.type === 'lair' ? [] : ['<span class="r">' + ic('spark') + '+' + sparkN(L, first) + (first ? ' <small>(первое ×2)</small>' : '') + '</span>'])
        .concat(rw.map(x => '<span class="r">' + x + '</span>'))
        .concat(extraFirst.map(x => '<span class="r first">' + x + '</span>'))
        .concat(minR ? ['<span class="r">' + ART.icon('chest', MB.CHESTS[minR].col) + ' ' + (I18N.lang==='en' && CHEST_EN[minR] ? CHEST_EN[minR] : MB.CHESTS[minR].name) + '</span>'] : []);
      rewHtml = '<div class="paper" style="margin-top:10px"><b>Награды за победу</b>' + (first ? ' <span class="note">— первое прохождение, награды повышены</span>' : '') +
        '<div class="prew">' + rows.join('') + '</div>' +
        '<p class="note" style="margin-top:6px">' + note2 + (ctx.type === 'lair' ? 'Попытка (1 из 5 в неделю) тратится даже при поражении. Награда в Логове — только XP и Руда.' : ctx.type === 'col' ? 'Каждую арену можно пройти только один раз. ' : (first ? 'Повторное прохождение: ✦ +' + MB.XP.win + ' XP, Искры без ×2, сундук тот же. ' : 'Первое прохождение уже получено — награды обычные. ')) + 'За поражение: ✦ +' + MB.XP.loss + ' XP.</p></div>';
    }
    let team = '';
    const colDuel = ctx.type === 'col';
    save.unlocked.forEach(k => {
      if (colDuel) {
        const sel = ctx.hero === k;
        team += '<div class="h" data-act="colpick" data-k="' + k + '">' + pt(k, sel ? 'sel' : 'dim', '<b>' + save.heroes[k].lvl + '</b>') + '<br>' + heroLoc(k, 'name') + '</div>';
      } else {
        const i = save.team.indexOf(k);
        team += '<div class="h" data-act="pick" data-k="' + k + '">' + pt(k, i >= 0 ? 'sel' : 'dim', (i >= 0 ? '<i>' + (i + 1) + '</i>' : '') + '<b>' + save.heroes[k].lvl + '</b>') + '<br>' + heroLoc(k, 'name') + '</div>';
      }
    });
    const fightKeys = colDuel ? [ctx.hero] : save.team.slice(0, 3);
    openModal('<div class="panel win" style="position:relative"><button class="x" data-act="close">✕</button><div class="winscroll"><h2 class="out">' + title + '</h2>' +
      '<div class="paper"><b>' + (colDuel ? 'Противник' : 'Противники') + '</b><div class="enemyrow" style="margin-top:6px">' + en + '</div>' + boss + '</div>' + rewHtml +
      '<div class="paper" style="margin-top:10px"><b>' + (colDuel ? 'Ваш боец' : 'Ваш отряд') + '</b> <span class="note">' + (colDuel ? '— один герой на дуэль' : '— до 3 героев, номер = место в строю (1 — впереди)') + '</span><div class="teampick">' + team + '</div></div>' +
      '<p style="text-align:center;font-weight:800;font-size:18px;margin-top:10px">' + (function () { const tp = MB.teamPower(save, fightKeys), rp = MB.recPower(ctx.enemies); return (colDuel ? 'Сила бойца: ' : 'Сила отряда: ') + '<span style="color:' + (tp >= rp ? '#8dff8a' : tp >= rp * 0.85 ? '#ffd45e' : '#ff8a7a') + '">' + tp + '</span>' })() + '</p>' +
      '<div class="foot" style="margin-top:8px"><button class="btn green" data-act="fight" style="min-width:260px;font-size:24px">В бой! <span class="cost">' + (ctx.type === 'clan' ? '<img src="assets/ui/key_clan.webp" alt="" style="width:26px;height:26px;vertical-align:-6px"> 1 ключ · осталось ' + MB.clanKeys(save) : ic('energy') + MB.ENERGY.cost) + '</span></button></div></div></div>');
  }

  /* ---------- Бой: подготовка сцены ---------- */
  // строй: передний боец выше и ближе к центру, задний — ниже и у края экрана
  const HX = [0.365, 0.255, 0.14], HY = [0.695, 0.785, 0.875], DS = [0.9, 0.95, 1];
  // свои позиции бойцов (редактор в бою), хранятся отдельно от сохранения: { 'fon_polyana': { h0: [x, y], e1: [x, y] }, 'fon_polyana#boss': {...} }
  const LAYOUT_KEY = 'magicbattle_layout_v1';
  let LAYOUT = {}; try { LAYOUT = JSON.parse(localStorage.getItem(LAYOUT_KEY)) || {}; } catch (e) { LAYOUT = {}; }
  const saveLayout = () => { try { localStorage.setItem(LAYOUT_KEY, JSON.stringify(LAYOUT)); } catch (e) { /* хранилище недоступно */ } };
  const BOSSPOS = { boss: [0.79, 0.765, 1], m: [[0.60, 0.65, 0.9], [0.915, 0.885, 1]] };   // расстановка в бою с боссом
  function isBattleCleared(ctx) {
    if (!ctx) return false;
    if (ctx.type === 'clan') return true;
    if (ctx.type === 'stage') return (save.progress[ctx.ch] || 0) >= ctx.st;
    if (ctx.type === 'boss') return !!save.bosses[ctx.ch];
    if (ctx.type === 'col') return !!(save.col && save.col.best >= ctx.f);
    if (ctx.type === 'lair') {
      const C = MB.CHAPTERS[ctx.ch - 1];
      const lair = MB.lairState(save, now());
      return !!C && (lair.diff[C.boss] || 0) > ctx.diff;
    }
    return false;
  }
  function preloadSkillIcons(units) {
    const urls = new Set();
    units.forEach(u => {
      if (!u.skills) return;
      u.skills.forEach((s, i) => {
        if (ART.fx('sk_' + u.key + '_' + (i + 1))) urls.add('assets/fx/sk_' + u.key + '_' + (i + 1) + '.webp');
        const FX_ALIAS = { firehammer: 'hammer', buff: 'warcry' };
        let n = s.proj || s.fx;
        if (n && FX_ALIAS[n]) n = FX_ALIAS[n];
        if (n && ART.fx(n)) urls.add('assets/fx/' + n + '.webp');
        if (s.melee) urls.add('assets/ui/w_' + u.key + '.webp');
      });
    });
    return Promise.all(Array.from(urls).map(src => new Promise(resolve => {
      const img = new Image();
      img.onload = img.onerror = resolve;
      img.src = src;
    })));
  }
  function startBattle(ctx) {
    closeModal();
    if (ctx && ctx.type === 'lair') {
      const lair = MB.lairState(save, now());
      lair.used = (lair.used || 0) + 1;
    }
    persist();
    const fighters = ctx.type === 'col' ? [ctx.hero || save.unlocked[0]] : save.team.slice(0, 3);
    const C = MB.CHAPTERS[ctx.ch - 1], b = MB.createBattle(save, fighters, ctx.enemies);
    ui.innerHTML = '<div class="loading"><img class="loading-bg" src="assets/ui/loading_screen.webp" alt=""><div class="bar"><i style="width:30%"></i><div class="load-label">' + T('Подготовка боя...', 'Preparing battle...') + '</div></div></div>';
    preloadSkillIcons(b.units).then(() => {
      const BGS = MB.CHAPTERS.map(c => c.bg);
      const cleared = isBattleCleared(ctx);
      const bv = { b: b, ctx: ctx, units: {}, fx: [], sfx: [], floats: [], projs: [], current: null, pick: null, sel: 0, shake: 0, dim: 0, waiting: null, cleared: cleared, auto: cleared ? !!save.auto : false, startMs: Date.now(), resultReady: false, skipping: false };
      const bossFight = b.units.some(u => u.boss); let mi = 0;
      SFX.play('battle_start', 0.78);
      if (bossFight) setTimeout(() => SFX.play('boss_intro', 0.82), 260);
      const layKey = (ctx.type === 'col' ? 'fon_coliseum' : ctx.type === 'clan' ? 'fon_lich' : C.bg) + (bossFight ? '#boss' : '');
      b.units.forEach(u => {
        const idle = ART.sprite(u.key, 'idle'), hero = u.side === 'hero';
        let px = (hero ? HX[u.slot] : 1 - HX[u.slot]), py = HY[u.slot], ds = DS[u.slot];
        let slotKey = (hero ? 'h' : 'e') + u.slot;
        if (!hero && bossFight) { slotKey = u.boss ? 'b' : 'm' + mi; const p = u.boss ? BOSSPOS.boss : BOSSPOS.m[mi++]; px = p[0]; py = p[1]; ds = p[2]; }
        const own = (LAYOUT[layKey] || {})[slotKey]; if (own) { px = own[0]; py = own[1]; }
        u.slotKey = slotKey;
        const th = (hero ? 185 * ART.skinScale(u.key) : u.boss ? 280 * (u.def0.size || 1) : (u.elite ? 190 : 170) * (u.def0.size || 1)) * ds;
        bv.units[u.id] = { u: u, x: px * W, y: py * H, k: th / idle.h, h: th, w: idle.w * th / idle.h, pose: 'idle', ox: 0, oy: 0, alpha: 1, shakeT: -999, ph: Math.random() * 6,
          hp: u.hp, maxHp: u.maxHp, shield: 0, st: [], alive: true, turnN: 0 };
      });
      bv.layKey = layKey; BV = bv; scene = { mode: 'battle', bg: ctx.type === 'col' ? 'fon_coliseum' : ctx.type === 'clan' ? 'fon_lich' : C.bg }; clock.speed = save.speed || 1;
      MUSIC.sync('battle');
      renderHud(); battleLoop(bv);
    });
  }
  function renderHud() {
    const c = BV.ctx;
    let title;
    if (c.type === 'clan') title = T('Клановый босс: ', 'Clan boss: ') + c.bossName;
    else if (c.type === 'col') title = T('Колизей · арена ', 'Coliseum · arena ') + c.f;
    else if (c.type === 'stage') title = T('Глава ', 'Chapter ') + c.ch + T(' · уровень ', ' · stage ') + c.st;
    else if (c.type === 'boss') title = T('Босс главы ', 'Chapter boss ') + c.ch;
    else title = T('Логово · ', 'Lair · ') + (I18N.lang === 'en' ? (LAIR_EN[c.diff] || MB.LAIR[c.diff].name) : MB.LAIR[c.diff].name);
    const autoDis = BV.cleared ? '' : ' disabled title="' + t('after_clear') + '"';
    const resDis = (BV.cleared && BV.resultReady) ? '' : ' disabled title="' + (BV.cleared ? T('Станет доступно через 5 сек. боя', 'Available after 5 sec of battle') : t('after_clear')) + '"';
    ui.innerHTML = '<div class="bhud"><div class="bleft"><button class="btn small red" data-act="flee">' + t('flee') + '</button><b class="out">' + title + '</b></div>' +
      '<div class="queue" id="queue"></div><div class="bright"><button class="settings-gear" data-act="settings" title="' + t('settings') + '"><img src="assets/ui/set_gear.png" alt=""></button><button class="btn small tog ' + (BV.auto ? 'on' : '') + '" data-act="auto"' + autoDis + '>' + T('АВТО', 'AUTO') + '</button><button class="btn small tog ' + (clock.speed > 1 ? 'on' : '') + '" data-act="speed">×2</button><button class="btn small gold" id="btn-result" data-act="skipresult"' + resDis + '>' + T('Результат', 'Result') + '</button></div>' +
      '<div class="hint" id="hint" style="display:none"></div><div class="actions" id="actions"></div></div>';
    applyUILang();
  }
  function renderQueue(cur) {
    const q = $('#queue'); if (!q || !BV) return;
    const ids = [cur.id].concat(MB.peekQueue(BV.b)).slice(0, 8);
    q.innerHTML = '<span>' + T('Ход:', 'Turn:') + '</span>' + ids.map(id => { const u = MB.unit(BV.b, id); return pt(u.key, u.side, '', id === ids[0] && ids.indexOf(id) === 0 && u.id === cur.id ? 56 : 42); }).join('');
  }
  // Иконка навыка: картинка снаряда/эффекта из assets/fx, для рукопашных — оружие героя
  function skillIcon(s, u, i) {
    if (i != null && ART.fx('sk_' + u.key + '_' + (i + 1))) return '<img class="act-ic" src="assets/fx/sk_' + u.key + '_' + (i + 1) + '.webp" alt="">';
    const FX_ALIAS = { firehammer: 'hammer', buff: 'warcry' };
    let n = s.proj || s.fx;
    if (n && FX_ALIAS[n]) n = FX_ALIAS[n];
    if (n && ART.fx(n)) return '<img class="act-ic" src="assets/fx/' + n + '.webp" alt="">';
    if (s.melee) return '<img class="act-ic" src="assets/ui/w_' + u.key + '.webp" alt="">';
    return ic('power');
  }
  function renderActions(u) {
    const a = $('#actions'), h = $('#hint'); if (!a) return;
    if (!u) { a.innerHTML = ''; h.style.display = 'none'; return; }
    a.innerHTML = u.skills.map((s, i) => {
      const sn = (u.side === 'hero') ? skillLoc(u.key, i, 'name') : s.name;
      const sd = (u.side === 'hero') ? skillLoc(u.key, i, 'desc') : s.desc;
      return '<button class="act' + (i ? ' sp' + i : '') + (u.cds[i] > 0 ? ' cd' : '') + (BV.sel === i ? ' sel' : '') + '" data-act="skill" data-i="' + i + '" title="' + sn + ' — ' + sd + '">' + skillIcon(s, u, i) + '<b>' + sn + '</b>' +
      (u.cds[i] > 0 ? '<span class="cdn out">' + u.cds[i] + '</span>' : '') + '</button>';
    }).join('');
    const s = u.skills[BV.sel];
    h.style.display = 'block';
    const uname = unitName(u);
    h.textContent = uname + ': ' + (s.target === 'enemy' ? T('нажмите на врага', 'tap an enemy') : s.target === 'ally' ? T('нажмите на союзника', 'tap an ally') : T('нажмите кнопку ещё раз', 'tap the button again'));
  }

  /* ---------- Бой: цикл ---------- */
  function applySnap(d, s) { d.hp = s.hp; d.shield = s.shield; d.st = s.st; if (!s.alive && d.alive) { d.alive = false; d.pose = 'defeat'; if (d.u.boss) SFX.play('boss_defeat', 0.86); else if (d.u.side === 'enemy') SFX.play('enemy_defeat', 0.74); else SFX.play('unit_defeat', 0.76); if (d.u.side === 'enemy') { sleep(700).then(() => tween(d, 'alpha', 0, 600)); } } }
  function floatText(d, text, color, size, dy) { if (!BV) return; BV.floats.push({ x: d.x + (Math.random() * 30 - 15), y: d.y - d.h - 10 + (dy || 0), text: text, color: color, size: size || 30, t0: clock.t }); }
  // картинка-эффект: o.bottom — привязка к ногам, o.glow — цвет ореола, o.rise — всплывает вверх
  function sfx(name, x, y, w, ms, o) { if (!BV || !ART.fx(name)) return false; BV.sfx.push(Object.assign({ name: name, x: x, y: y, w: w, ms: ms, t0: clock.t }, o || {})); return true; }
  function statusFx(d, st) {
    if (st === 'poison') sfx('poison', d.x, d.y - d.h * 0.55, Math.min(200, Math.max(140, d.w * 0.8)), 900, { glow: '#7dff5a', rise: 24 });
    else if (st === 'freeze') sfx('freeze', d.x, d.y + 10, d.w * 1.15, 750, { bottom: true, glow: '#9fe4ff' });
    else if (st === 'curse') sfx('curse', d.x, d.y - d.h * 0.55, 120, 1000, { glow: '#7dff7a', rise: 30 });
  }
  function burst(x, y, color, n, big) {
    if (!BV) return;
    for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, v = (big ? 0.34 : 0.2) * (0.4 + Math.random()); BV.fx.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 0.12, r: 4 + Math.random() * (big ? 9 : 5), color: color, t0: clock.t, ms: 420 + Math.random() * 300 }); }
    BV.fx.push({ ring: true, x: x, y: y, color: color, t0: clock.t, ms: 380, R: big ? 120 : 70 });
  }
  async function playTurnEvents(bv, evs) {
    for (const e of evs) {
      const d = bv.units[e.id];
      if (e.t === 'tick') { applySnap(d, e.snap); floatText(d, '-' + e.dmg, '#7dff7a', 28); if (!sfx('poison', d.x, d.y - d.h * 0.45, 140, 650, { glow: '#7dff5a' })) burst(d.x, d.y - d.h / 2, '#5fd35f', 8); await sleep(420); }
      else if (e.t === 'heal') { applySnap(d, e.snap); floatText(d, '+' + e.amt, '#8dff8a', 24); SFX.play('heal', 0.72); await sleep(200); }
      else if (e.t === 'skip') { applySnap(d, e.snap); const fz = e.why !== 'stun'; floatText(d, fz ? T('Заморожен!', 'Frozen!') : T('Оглушён!', 'Stunned!'), fz ? '#9fe4ff' : '#ffe066', 24); if (fz || !sfx('stun', d.x, d.y - d.h * 0.92, Math.max(90, d.w * 0.55), 900, { glow: '#ffe066' })) burst(d.x, d.y - d.h / 2, fz ? '#9fe4ff' : '#ffe066', 10); await sleep(520); }
    }
  }
  const PROJ_COLOR = { orb: '#b06cff', wave: '#ffd45e', arrow: '#ff7a2a', ice: '#9fe4ff', snowball: '#9fe4ff', flask: '#6fe36a', spore: '#9be86a', orbg: '#7dff7a', web: '#e8e8e8', firehammer: '#ff8a2a', axe_gold: '#ffd23a', lich_orb: '#7dff5a', lich_vortex: '#7dff5a' };
  const FX_COLOR = { slam: '#ffd45e', buff: '#ff9d3c', shield: '#7fd6ff', heal: '#8dff8a', poison: '#5fd35f', curse: '#b06cff' };
  async function playCast(bv, ev) {
    const a = bv.units[ev.id], sk = ev.skill, hero = a.u.side === 'hero', dir = hero ? 1 : -1;
    a.turnN++; a.pose = hero ? (sk.pose || 'throw') : (sk.pose || 'attack');
    if (sk.special || ev.friendly || sk.big) {
      let sn = sk.name;
      if (a.u.side === 'hero' && a.u.skills) {
        const si = a.u.skills.findIndex(x => x === sk || (x && x.name === sk.name));
        if (si >= 0) sn = skillLoc(a.u.key, si, 'name') || sk.name;
      }
      floatText(a, sn, '#ffe9a8', 24, -26);
    }
    await sleep(260); if (BV !== bv) return;
    const targets = ev.targets.map(id => bv.units[id]);
    if (sk.breath && targets[0]) {
      const t = targets[0], lunge = Math.max(60, (Math.abs(t.x - a.x) - a.w * 0.4 - t.w * 0.5) * 0.35);
      await tween(a, 'ox', a.ox + dir * lunge, 240); if (BV !== bv) return;
      sfx('dragon_breath', a.x + a.ox + dir * a.w * 0.42, a.y - a.h * 0.62, Math.min(a.h * 0.85, 250), 640, { beam: true, x1: t.x - dir * t.w * 0.05, y1: t.y - t.h * 0.5, glow: '#9fe4ff', a: 0.97 });
      await sleep(430);
    }
    else if (sk.melee && targets[0]) { const t = targets[0]; await tween(a, 'ox', t.x - a.x - dir * (t.w * 0.35 + a.w * 0.3), 230); if (a.u && a.u.key === 'minotaur' && a.alive) a.pose = 'idle'; }
    else if (sk.proj) {
      const pr = sk.proj === 'axe' && a.u.key === 'viking' && ART.heroArt && ART.heroArt.viking ? 'axe_gold' : sk.proj;   // золотая секира при золотом облике Торвальда
      targets.forEach(t => bv.projs.push({ type: pr, big: sk.big, x0: a.x + dir * a.w * 0.3, y0: a.y - a.h * 0.6, x1: t.x, y1: t.y - t.h * 0.5, t0: clock.t, ms: 360, dir: dir }));
      await sleep(360);
    } else if (sk.fx === 'slam') { await tween(a, 'oy', -70, 160); await tween(a, 'oy', 0, 110); bv.shake = clock.t; sfx('slam', a.x + 40, a.y + 8, a.w * 1.6, 650, { bottom: true }); }
    if (BV !== bv) return;
    // применить результаты
    ev.results.forEach(r => {
      const d = bv.units[r.id]; if (!d) return;
      if (r.kind === 'hit') {
        if (r.dodge) { floatText(d, 'Уворот!', '#bfe6ff', 24); SFX.play('hit_miss', 0.72); }
        else {
          floatText(d, (r.crit ? r.dmg + '!' : '' + r.dmg), r.crit ? '#ffcf3a' : '#ffffff', r.crit ? 44 : 30);
          if (r.absorbed) floatText(d, 'щит', '#7fd6ff', 18, 26);
          if (r.block) { floatText(d, 'Блок', '#d0d6dd', 20, 26); SFX.play('block', 0.76); }
          if (r.crit) SFX.play('hit_crit', 0.82);
          else SFX.heroAttack(a, sk, r);
          if (r.extra) floatText(a, 'Доп. атака!', '#ffb86b', 22, -26);
          const big = r.crit || sk.big || sk.fx === 'slam';
          if (sk.fx === 'slam') sfx('slam', d.x, d.y + 8, Math.min(d.w * 1.1, 260), 650, { bottom: true });
          if (!sfx(r.crit ? 'crit' : 'hit', d.x + (Math.random() * 20 - 10), d.y - d.h * 0.5, r.crit ? 175 : big ? 135 : 105, r.crit ? 520 : 380, r.crit ? { glow: '#ffd23a' } : {}))
            burst(d.x, d.y - d.h / 2, r.crit ? '#ffcf3a' : (PROJ_COLOR[sk.proj] || FX_COLOR[sk.fx] || '#ffffff'), r.crit ? 16 : 9, big);
          else burst(d.x, d.y - d.h / 2, r.crit ? '#ffcf3a' : (PROJ_COLOR[sk.proj] || FX_COLOR[sk.fx] || '#ffffff'), r.crit ? 8 : 4, false);
          d.shakeT = clock.t; if (r.crit || sk.big) bv.shake = clock.t;
          if (r.status) { floatText(d, statusName(r.status), MB.STATUS[r.status].color, 20, 30); statusFx(d, r.status); }
          if (r.steal) { const s = bv.units[r.steal.id]; applySnap(s, r.steal.snap); floatText(s, '+' + r.steal.amt, '#8dff8a', 22); }
        }
        const wasAlive = d.alive; applySnap(d, r.snap);
        if (d.alive && !r.dodge) { d.pose = 'hit'; sleep(380).then(() => { if (d.alive && d.pose === 'hit') d.pose = 'idle'; }); }
        if (wasAlive && !d.alive) burst(d.x, d.y - d.h / 2, '#ffffff', 14, true);
      } else {
        applySnap(d, r.snap);
        const col = r.kind === 'heal' ? FX_COLOR.heal : r.kind === 'shield' ? FX_COLOR.shield : FX_COLOR[sk.fx] || '#ffd45e';
        let shown = false;
        if (r.kind === 'heal') { shown = sfx('heal', d.x, d.y + 6, Math.min(d.w * 0.5, 110), 900, { bottom: true, glow: '#8dff8a', rise: 30, a: 0.7 }); SFX.play('heal', 0.74); }
        else if (r.kind === 'shield') shown = sfx('shield', d.x, d.y - d.h * 0.48, d.h * 1.05, 800, { glow: '#ffd45e' });
        else if (r.status === 'poison' || r.status === 'curse' || r.status === 'freeze') { statusFx(d, r.status); shown = true; }
        else if (r.status === 'warcry') shown = sfx('warcry', d.x, d.y + 14, Math.max(160, d.w * 1.2), 900, { bottom: true, sy: 0.45, glow: '#ff9d3c' });
        burst(d.x, d.y - d.h / 2, col, shown ? 4 : 10);
        if (r.kind === 'heal') floatText(d, '+' + r.amt, '#8dff8a', 28);
        else if (r.kind === 'shield') floatText(d, 'Щит +' + r.amt, '#7fd6ff', 22);
        else if (r.status) floatText(d, statusName(r.status), MB.STATUS[r.status].color, 22);
        else floatText(d, 'Не подействовало', '#cccccc', 18);
      }
    });
    await sleep(sk.breath ? 240 : sk.melee ? 180 : 420);
    if (sk.melee || sk.breath) await tween(a, 'ox', 0, sk.breath ? 300 : 220);
    applySnap(a, ev.self); if (a.alive) a.pose = 'idle';
    await sleep(120);
  }
  function playerChoice(bv, u) {
    return new Promise(res => {
      bv.sel = 0; bv.current = u.id;
      const setPick = () => { const s = u.skills[bv.sel]; bv.pick = s.target === 'enemy' ? 'enemy' : s.target === 'ally' ? 'hero' : null; renderActions(u); };
      bv.waiting = {
        skill: i => { if (u.cds[i] > 0) return; const s = u.skills[i]; if (bv.sel === i && s.target !== 'enemy' && s.target !== 'ally') return done({ si: i }); bv.sel = i;
          if (s.target === 'enemy' && MB.alive(bv.b, 'enemy').length === 1 && i > 0) return done({ si: i, target: MB.alive(bv.b, 'enemy')[0].id }); setPick(); },
        unit: id => { const t = MB.unit(bv.b, id), s = u.skills[bv.sel]; if (!t.alive) return; if (bv.pick === 'enemy' && t.side === 'enemy' || bv.pick === 'hero' && t.side === 'hero') done({ si: bv.sel, target: id }); },
        auto: () => done(MB.autoChoose(bv.b, u))
      };
      function done(c) { bv.waiting = null; bv.pick = null; renderActions(null); res(c); }
      setPick();
    });
  }
  async function battleLoop(bv) {
    const b = bv.b; await sleep(500);
    while (!b.result && BV === bv && !bv.skipping) {
      const t = MB.nextTurn(b); if (!t) break;
      bv.current = t.unit.id; renderQueue(t.unit);
      await playTurnEvents(bv, t.events); if (BV !== bv || bv.skipping) return;
      if (t.skip) continue;
      let ev;
      if (t.unit.side === 'hero') { const c = bv.auto ? MB.autoChoose(b, t.unit) : await playerChoice(bv, t.unit); if (BV !== bv || bv.skipping) return; ev = MB.act(b, t.unit, c.si, c.target); }
      else { await sleep(250); if (BV !== bv || bv.skipping) return; ev = MB.enemyAct(b, t.unit); }
      await playCast(bv, ev); if (BV !== bv || bv.skipping) return;
    }
    if (BV !== bv || bv.skipping) return;
    bv.current = null; renderActions(null); const q = $('#queue'); if (q) q.innerHTML = '';
    if (b.result === 'win') { Object.values(bv.units).forEach(d => { if (d.alive && d.u.side === 'hero') d.pose = 'victory'; }); sfx('coins', W * 0.72, H * 0.52, 460, 1300, { glow: '#ffd23a', rise: 40 }); }
    await sleep(900); if (BV !== bv || bv.skipping) return;
    finishBattle(bv);
  }

  /* ---------- Итоги боя ---------- */
  function grantChest(ch, minR, fixed) { const it = MB.rollItem(save, ch, minR, null, fixed); save.bag.push(it); return it; }
  // Итог боя с клановым боссом: урон сохраняется между днями, ключ тратится в любом случае.
  // Каждый бой: 20 XP и 20 клановых монет; победа над боссом: всем 500 XP и 400 монет
  function clanBattleDone(bv, win, fled) {
    const c = bv.ctx, clan = save.clan, out = { sparks: 0, ore: 0, gems: 0, xp: 0, cc: 0, items: [], notes: [], dealt: 0 };
    if (!clan) return out;
    const unit = MB.unit(bv.b, 'e0');
    const dealt = Math.max(0, Math.round((c.bossHp0 || 0) - (unit && unit.hp > 0 ? unit.hp : 0)));
    const partKeys = bv.b.units.filter(u => u.side === 'hero').map(u => u.key);
    const defeated = Boolean(unit && !unit.alive);

    if (MB.net && typeof MB.net.submitClanBattle === 'function') {
      const txId = bv.clanTxId || (bv.clanTxId = 'cbt_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7));
      // Синхронно применяем локально и отправляем в сетевой слой / бэкенд
      const player = MB.net.getPlayerProfile ? MB.net.getPlayerProfile(save) : { id: 'me', name: 'Вы' };
      out.dealt = dealt;
      out.xp = MB.XP.clanFight; out.cc = MB.CCOIN.clanFight;
      save.ccoin = (save.ccoin || 0) + out.cc;
      MB.grantXp(save, partKeys, out.xp).forEach(u => out.notes.push(heroLoc(u.key, 'name') + T(' достиг ', ' reached level ') + u.to + T(' уровня!', '!')));
      let addedAct = 0;
      if (!fled && dealt > 0) {
        clan.myBossDmg = (clan.myBossDmg || 0) + dealt;
        out.sparks = Math.round(dealt / 300);
        save.sparks += out.sparks;
        addedAct = 5;
        MB.clanAddActivity(save, addedAct, addedAct);
        MB.clanTaskProgress(save, 'dmg', dealt);
      }
      const membersList = Array.isArray(clan.members) ? clan.members : [];
      let selfRow = membersList.find(m => m.id === player.id);
      if (!selfRow && player.id) {
        selfRow = { id: player.id, name: player.name || save.name || 'Игрок', power: MB.accountPower(save), role: clan.myRole || (clan.own ? 'leader' : 'member'), contrib: 0, bossDmg: 0 };
        membersList.push(selfRow);
      }
      if (selfRow) {
        if (addedAct) selfRow.contrib = (selfRow.contrib || 0) + addedAct;
        if (!fled && dealt > 0) selfRow.bossDmg = (selfRow.bossDmg || 0) + dealt;
      }
      const ups = MB.clanAddExp(save, MB.CLAN.clanFightExp || 5);
      if (ups) out.notes.push('Клан вырос до ' + clan.lvl + ' уровня! Получено очко прокачки клана.');
      if (defeated) {
        out.gems = 200; save.gems += out.gems;
        out.ore = 200; save.ore += out.ore;
        out.items.push(grantChest(MB.topChapter(save), 'purple')); out.chest = 'purple';
        MB.clanAddExp(save, MB.CLAN.killExp);
        registerClanBossReward(clan);
        clan.bossDefeatedThisWeek = true;
        out.notes.push('Клановый босс повержен! Награда ' + MB.XP.clanKill + ' XP и ' + MB.CCOIN.clanKill + ' монет доступна всем соклановцам — заберите её в зале клана.');
        clan.bossLvl = MB.CLAN.bossLvl(1);
        clan.bossHp = MB.CLAN.bossHp(1);
      } else {
        clan.bossHp = Math.max(1, clan.bossHp - dealt);
      }
      persist();
      if (MB.net.isRemote && MB.net.isRemote() && MB.net.config && MB.net.config.apiUrl) {
        fetch(MB.net.config.apiUrl.replace(/\/+$/, '') + '/clans/' + encodeURIComponent(clan.id || MB.net.config.sharedClanId) + '/battle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ txId: txId, player: player, dealt: dealt, fled: !!fled, defeated: defeated })
        }).then(() => MB.net.refreshClanState(save, persist)).catch(() => {});
      }
      return out;
    }

    out.dealt = dealt;
    out.xp = MB.XP.clanFight; out.cc = MB.CCOIN.clanFight;
    save.ccoin = (save.ccoin || 0) + out.cc;
    MB.grantXp(save, partKeys, out.xp).forEach(u => out.notes.push(heroLoc(u.key, 'name') + T(' достиг ', ' reached level ') + u.to + T(' уровня!', '!')));
    if (!fled && dealt > 0) {
      clan.myBossDmg = (clan.myBossDmg || 0) + dealt;
      out.sparks = Math.round(dealt / 300);
      save.sparks += out.sparks;
      const cPts = 5;
      MB.clanAddActivity(save, cPts, cPts);
      MB.clanTaskProgress(save, 'dmg', dealt);
    }
    const ups = MB.clanAddExp(save, MB.CLAN.clanFightExp || 5);
    if (ups) out.notes.push('Клан вырос до ' + clan.lvl + ' уровня! Получено очко прокачки клана.');
    if (defeated) {
      out.gems = 200; save.gems += out.gems;
      out.ore = 200; save.ore += out.ore;
      out.items.push(grantChest(MB.topChapter(save), 'purple')); out.chest = 'purple';
      MB.clanAddExp(save, MB.CLAN.killExp);
      registerClanBossReward(clan);
      clan.bossDefeatedThisWeek = true;
      out.notes.push('Клановый босс повержен! Награда ' + MB.XP.clanKill + ' XP и ' + MB.CCOIN.clanKill + ' монет доступна всем соклановцам — заберите её в зале клана.');
      clan.bossLvl = MB.CLAN.bossLvl(1);
      clan.bossHp = MB.CLAN.bossHp(1);
    } else {
      clan.bossHp = Math.max(1, clan.bossHp - dealt);
    }
    persist();
    return out;
  }
  function finishBattle(bv) {
    const c = bv.ctx, win = bv.b.result === 'win', C = MB.CHAPTERS[c.ch - 1], out = { sparks: 0, ore: 0, items: [], notes: [] };
    clock.speed = 1;
    if (c.type === 'clan') { persist(); showResult(bv, clanBattleDone(bv, win, false), win); return; }
    // опыт героям отряда: победа 5, поражение 2 (+бонусы за первое прохождение кампании)
    const partKeys = bv.b.units.filter(u => u.side === 'hero').map(u => u.key);
    let xp = win ? MB.XP.win : MB.XP.loss;
    if (win) {
      const bonus = (c.type === 'col' ? [c.hero] : save.team.slice(0, 3)).reduce((a, k) => a + (k ? MB.heroStats(save, k).sparksBonus : 0), 0) + MB.clanSparksBonus(save);
      let L, first = false, minR = 'wood';
      if (c.type === 'col') {
        L = MB.coliseumFloor(c.f)[0].lvl; first = save.col.best < c.f; minR = c.f % 5 === 0 ? 'purple' : 'blue';
        if (first) { save.col.best = c.f; save.gems += 30; out.gems = 30; out.ore += 20 + c.f * 4;
          if (c.f === MB.COLISEUM.floors && save.unlocked.indexOf(MB.COLISEUM.reward) < 0) { save.unlocked.push(MB.COLISEUM.reward); out.notes.push(T('Колизей покорён! К отряду присоединяется ', 'Coliseum conquered! Joining the team: ') + heroLoc(MB.COLISEUM.reward, 'full') + '!'); }
          else if (c.f < MB.COLISEUM.floors) out.notes.push('Открыта арена ' + (c.f + 1) + '.'); }
      } else if (c.type === 'stage') { L = MB.stageLevel(c.ch, c.st); first = (save.progress[c.ch] || 0) < c.st; if (first) save.progress[c.ch] = c.st; }
      else if (c.type === 'boss') {
        L = MB.bossLevel(c.ch); first = !save.bosses[c.ch]; minR = 'blue';
        if (first) {
          save.bosses[c.ch] = true; out.ore += C.ore; save.gems += 50; out.gems = 50;
          if (C.unlock && save.unlocked.indexOf(C.unlock) < 0) { save.unlocked.push(C.unlock); out.notes.push(T('Новый герой: ', 'New hero: ') + heroLoc(C.unlock, 'full') + '!'); }
          if (C.amulet) out.items.push(grantChest(c.ch, 0, { slot: 'amulet', amu: C.amulet.type, r: C.amulet.r }));
          if (c.ch === 1) out.notes.push(T('Открыто «Логово боссов»! Теперь можно сражаться с боссами повторно.', 'Boss Lair unlocked! You can now refight bosses.'));
          if (c.ch === 4) out.notes.push(T('Открыты «Кланы»! Вступайте в клан и сражайтесь с клановым боссом.', 'Clans unlocked! Join a clan and fight the clan boss.'));
          if (c.ch === MB.COLISEUM.needBoss) out.notes.push(T('Колизей откроется, когда любой герой достигнет ', 'Coliseum opens when any hero reaches level ') + MB.COLISEUM.needLvl + T('-го уровня.', '.'));
          if (c.ch < 5) out.notes.push(T('Открыта глава ', 'Chapter unlocked: ') + (c.ch + 1) + '.');
          else out.notes.push(T('Кампания пройдена! Спасибо за игру.', 'Campaign complete! Thanks for playing.'));
        }
      } else {
        const D = MB.LAIR[c.diff], key = C.boss, lair = MB.lairState(save, now()), oreAmt = MB.lairOreFor(key, c.diff);
        L = MB.bossLevel(c.ch) + D.lvl; minR = null; out.ore += oreAmt;
        if ((lair.diff[key] || 0) <= c.diff && c.diff < 2) { lair.diff[key] = c.diff + 1; out.notes.push('Открыта сложность «' + MB.LAIR[c.diff + 1].name + '».'); }
      }
      if (c.type !== 'lair') {
        out.sparks = Math.round(MB.sparksFor(L) * (first ? 2 : 1) * (1 + bonus / 100)); out.first = first;
      }
      if (first && c.type === 'stage') xp += MB.XP.firstStage;
      if (first && c.type === 'boss') xp += MB.XP.firstBoss;
      if (minR) { out.items.unshift(grantChest(c.type === 'col' ? 5 : c.ch, minR)); out.chest = minR; }
      save.sparks += out.sparks; save.ore += out.ore;
    }
    if (win && save.clan) MB.clanTaskProgress(save, 'battles', 1);
    if (win && c.type !== 'clan') {
      const dq = MB.dailyQuestState(save, now());
      dq.wins = (dq.wins || 0) + 1;
    }
    out.xp = xp;
    MB.grantXp(save, partKeys, xp).forEach(u => out.notes.push(heroLoc(u.key, 'name') + T(' достиг ', ' reached level ') + u.to + T(' уровня!', '!')));
    if (win) bv.cleared = true; persist(); showResult(bv, out, win);
    if (win) {
      SFX.play('victory', 0.82);
      if (out.sparks) setTimeout(() => SFX.play('spark_gain', 0.68), 180);
      if (out.ore) setTimeout(() => SFX.play('ore_gain', 0.68), 280);
      if (out.gems) setTimeout(() => SFX.play('gem_gain', 0.72), 360);
      if (out.cc) setTimeout(() => SFX.play('coin_gain', 0.7), 220);
    } else {
      SFX.play('defeat', 0.78);
    }
    if (out.notes && out.notes.some(n => n.indexOf('достиг') >= 0)) setTimeout(() => SFX.play('level_up', 0.8), 450);
    if (out.notes && out.notes.some(n => n.indexOf('Новый герой') >= 0 || n.indexOf('присоединяется') >= 0)) setTimeout(() => SFX.play('hero_unlock', 0.84), 600);
  }
  function showResult(bv, out, win) {
    const c = bv.ctx; let body = '';
    if (c.type === 'clan') {
      const clan = save.clan, info = clan ? MB.clanBossInfo(clan) : null;
      const rew = (out.xp ? '<div class="r">✦ +' + out.xp + ' XP</div>' : '') + (out.cc ? '<div class="r"><img class="mb-ic" src="assets/ui/clan_coin.webp" alt="">+' + out.cc + '</div>' : '') + (out.sparks ? '<div class="r">' + ic('spark') + '+' + out.sparks + '</div>' : '') + (out.ore ? '<div class="r">' + ic('ore') + '+' + out.ore + '</div>' : '') + (out.gems ? '<div class="r">' + ic('gem') + '+' + out.gems + '</div>' : '');
      body = '<p style="text-align:center;font-size:20px;font-weight:800;margin:10px 0">Урон боссу: ' + out.dealt + '</p>' +
        (rew ? '<div class="rew">' + rew + '</div>' : '') +
        out.notes.map(n => '<p style="text-align:center;font-weight:800;font-size:18px;margin:4px 0">' + n + '</p>').join('') +
        (win ? '<div id="chestbox" style="text-align:center;min-height:150px"><button class="chestbtn" data-act="openchest">' + ART.icon('chest', MB.CHESTS[out.chest].col) + '<small>' + (I18N.lang==='en' && CHEST_EN[out.chest] ? CHEST_EN[out.chest] : (I18N.lang==='en' && CHEST_EN[out.chest] ? CHEST_EN[out.chest] : MB.CHESTS[out.chest].name)) + '</small></button></div>'
          : '<p style="text-align:center;font-weight:700">У босса осталось ' + clan.bossHp + ' здоровья из ' + info.maxHp + '. Завтра вы продолжите с этого места!</p>');
    } else if (win) {
      const sparkRew = out.sparks ? '<div class="r">' + ic('spark') + '+' + out.sparks + (out.first ? ' <small>(первое прохождение ×2)</small>' : '') + '</div>' : '';
      const chestBox = out.chest ? '<div id="chestbox" style="text-align:center;min-height:150px"><button class="chestbtn" data-act="openchest">' + ART.icon('chest', MB.CHESTS[out.chest].col) + '<small>' + (I18N.lang==='en' && CHEST_EN[out.chest] ? CHEST_EN[out.chest] : (I18N.lang==='en' && CHEST_EN[out.chest] ? CHEST_EN[out.chest] : MB.CHESTS[out.chest].name)) + '</small></button></div>' : '';
      body = '<div class="rew"><div class="r">✦ +' + out.xp + ' XP</div>' + sparkRew + (out.ore ? '<div class="r">' + ic('ore') + '+' + out.ore + '</div>' : '') + (out.gems ? '<div class="r">' + ic('gem') + '+' + out.gems + '</div>' : '') + '</div>' +
        out.notes.map(n => '<p style="text-align:center;font-weight:800;font-size:18px;margin:4px 0">' + n + '</p>').join('') +
        chestBox;
    } else body = '<div class="rew"><div class="r">✦ +' + out.xp + ' XP</div></div>' +
      out.notes.map(n => '<p style="text-align:center;font-weight:800;font-size:18px;margin:4px 0">' + n + '</p>').join('') +
      '<p style="text-align:center;font-size:18px;font-weight:700;margin:14px 0">Отряд пал. Герои получают опыт даже в поражении — наденьте снаряжение получше или смените состав.</p>';
    const next = win && (c.type === 'stage' && c.st < 10 || c.type === 'col' && c.f < MB.COLISEUM.floors);
    showResult.items = out.items;
    openModal('<div class="panel win result ' + (win ? '' : 'lose') + '"><h2 class="out">' + (c.type === 'clan' ? (win ? T('Босс повержен!', 'Boss defeated!') : T('Босс уцелел', 'Boss survived')) : win ? t('victory') + '!' : t('defeat')) + '</h2><div class="paper">' + body + '</div><div class="foot">' +
      (next ? '<button class="btn green" data-act="nextstage">' + (c.type === 'col' ? 'Следующая арена' : 'Следующий уровень') + '</button>' : '') +
      (c.type !== 'clan' ? '<button class="btn" data-act="retry">' + (win ? 'Повторить' : 'Ещё раз') + '</button>' : '') + '<button class="btn blue" data-act="heroesfrom">Герои</button><button class="btn" data-act="leave">' + (c.type === 'clan' ? 'В клан' : c.type === 'lair' ? 'В логово' : c.type === 'col' ? 'В Колизей' : 'К карте') + '</button></div></div>');
  }
  function itemCardHtml(it, heroKey, compare) {
    const R = MB.RARITY[it.r]; let lines = MB.itemLines(it).map(l => '<li>' + l + '</li>').join('');
    if (it.heroOnly) lines += '<li style="color:#f5b301">Может носить только герой ' + heroLoc(it.heroOnly, 'name') + '</li>';
    if (compare && !(it.heroOnly && it.heroOnly !== heroKey)) {
      const cur = save.heroes[heroKey].equip[it.slot], ci = cur && cur !== it.id && MB.findItem(save, cur);
      if (cur !== it.id) { const h = save.heroes[heroKey], p0 = MB.power(save, heroKey); h.equip[it.slot] = it.id; const d = MB.power(save, heroKey) - p0; if (cur) h.equip[it.slot] = cur; else delete h.equip[it.slot];
        lines += '<li class="' + (d >= 0 ? 'up' : 'down') + '">' + (d >= 0 ? '▲ +' + d : '▼ −' + (-d)) + ' к силе героя ' + heroLoc(heroKey, 'name') + '</li>'; }
      void ci;
    }
    return '<div class="card"><div class="slot big" style="' + slotBg(it) + ';cursor:default">' + ART.itemIcon(it, heroKey) + '</div><div><b style="font-size:22px">' + MB.itemName(it, heroKey) + (it.up ? ' +' + it.up : '') + '</b>' +
      '<div style="color:' + R.color + ';font-weight:800;-webkit-text-stroke:.4px #3a2414">' + R.name + ' · глава ' + it.ch + '</div><ul>' + lines + '</ul></div></div>';
  }

  /* ---------- Герои и инвентарь ---------- */
  function showHeroes(key) {
    if (key) heroTab = key; if (save.unlocked.indexOf(heroTab) < 0) heroTab = save.unlocked[0];
    scene = { mode: 'menu', bg: scene.bg };
    MUSIC.sync('menu'); BV = null;
    const k = heroTab, h = save.heroes[k], D = MB.HEROES[k], s = MB.heroStats(save, k), free = MB.freePts(h);
    const tabs = MB.HERO_ORDER.map(x => { const un = save.unlocked.indexOf(x) >= 0; return '<span data-act="' + (un ? 'herotab' : 'lockedhero') + '" data-k="' + x + '" style="cursor:pointer">' + pt(x, (x === k ? 'sel ' : '') + (un ? '' : 'dim'), un ? '<b>' + save.heroes[x].lvl + '</b>' : '') + '</span>'; }).join('');
    const slot = sl => { const it = h.equip[sl] && MB.findItem(save, h.equip[sl]); return it ? itemCell(it, { hero: k, noOwner: true }) : '<div class="slot empty" data-act="slotfilter" data-sl="' + sl + '">' + ART.icon(sl === 'weapon' ? 'w_' + k : sl === 'chest' ? 'chestarmor' : sl, '#c9b08a') + '<em>' + (I18N.lang === 'en' ? (SLOT_EN[sl] || MB.SLOT_NAME[sl]) : MB.SLOT_NAME[sl]) + '</em></div>'; };
    const items = save.bag.filter(i => bagFilter === 'all' || i.slot === bagFilter).sort((a, b) => b.r - a.r || MB.itemScore(b) - MB.itemScore(a));
    const filt = [['all', T('Все', 'All')]].concat(MB.SLOTS.map(x => [x, I18N.lang === 'en' ? (SLOT_EN[x] || MB.SLOT_NAME[x]) : MB.SLOT_NAME[x]])).map(f => '<button class="btn small ' + (bagFilter === f[0] ? 'on' : '') + '" data-act="filter" data-f="' + f[0] + '">' + f[1] + '</button>').join('');
    ui.innerHTML = topbar(t('heroes'), showHeroes.back || 'hub') + '<div class="inv"><div class="panel invL"><div class="tabs">' + tabs + '</div>' +
      '<div class="doll"><div class="col">' + slot('weapon') + slot('helmet') + slot('chest') + '</div><div class="fig"><img src="' + ART.url(k, 'idle') + '" alt=""' + (ART.skinScale(k) !== 1 ? ' style="transform:scale(' + ART.skinScale(k) + ');transform-origin:50% 100%"' : '') + '></div><div class="col">' + slot('gloves') + slot('boots') + slot('amulet') + '</div></div>' +
      '<div class="hname"><b class="out">' + heroLoc(k, 'full') + '</b><span class="pw out">' + ic('power') + T('Сила ', 'Power ') + s.power + '</span>' +
      (save.skins && save.skins[k] ? '<button class="btn small gold skinbtn" data-act="skin" title="Переключить облик героя">ОБЛИК</button>' : '') +
      '<span>' + heroLoc(k, 'role') + (ART.isPlaceholder(k) ? T(' · временная картинка', ' · placeholder art') : '') + '</span></div>' +
      '<div class="lvlrow"><span class="lv out">' + T('Уровень ', 'Level ') + h.lvl + '</span>' +
      (h.lvl >= MB.MAX_LEVEL ? '<span class="note">' + T('максимальный уровень', 'max level') + '</span>' : '<span class="expbar xp" title="Опыт героя: даётся за битвы (победа +' + MB.XP.win + ', поражение +' + MB.XP.loss + ')"><i style="width:' + Math.round(100 * (h.xp || 0) / MB.xpNeed(h.lvl)) + '%"></i><span>' + (h.xp || 0) + ' / ' + MB.xpNeed(h.lvl) + ' XP</span></span>') +
      '<button class="btn small" data-act="bio">' + T('История', 'Story') + '</button><button class="btn small blue" data-act="stats" style="position:relative">' + T('Прокачка', 'Talent tree') + (free ? '<span class="dot">' + free + '</span>' : '') + '</button></div>' +
      '<div class="paper stats">' + [[T('Здоровье','HP'), s.hp], [T('Атака','Attack'), Math.round(s.atk * 0.9) + '–' + Math.round(s.atk * 1.1)], [T('Защита','Defense'), s.def], [T('Скорость хода','Speed'), s.spd], [T('Крит','Crit'), s.crit + '%'], [T('Крит. урон','Crit damage'), s.critDmg + '%'],
        ['Уворот', s.dodge + '%'], ['Блок', s.block + '%'], ['Доп. атака', s.extra + '%'], ['Оглушение', s.stun + '%'], ['Пробивание', s.pierce + '%'], ['Урон по боссам', '+' + s.boss + '%'],
        ['Стойкость', s.ctrl + '%'], ['Спецатаки', '+' + s.specBonus + '%'], ['Лечение за ход', s.regenPct + '%']].map(r => '<div>' + r[0] + ' <span>' + r[1] + '</span></div>').join('') + '</div>' +
      '<div class="teamrow"><button class="btn small gold" data-act="team">Отряд</button><div class="teamicons">' +
      save.team.slice(0, 3).map(tk => '<span data-act="herotab" data-k="' + tk + '" style="cursor:pointer">' + pt(tk, '', '<b>' + save.heroes[tk].lvl + '</b>', 54) + '</span>').join('') + '</div></div></div>' +
      '<div class="panel invR"><div class="filters">' + filt + '</div><div class="bag">' + (items.length ? items.map(i => itemCell(i)).join('') : '<div class="bagempty">Здесь появятся вещи из сундуков.<br>Сундук выпадает после каждой победы.</div>') + '</div>' +
      '<div class="row" style="display:flex;justify-content:space-between;align-items:center"><span class="note">Вещей: ' + save.bag.length + '. Сумка общая на всех героев.</span><button class="btn small" data-act="openscrap" ' + (save.bag.length ? '' : 'disabled') + '>Разобрать</button></div></div></div>';
    applyUILang();
  }
  function spentOre(it) { let s = 0; for (let i = 1; i <= (it.rank || 0); i++) s += MB.rankCost(i, it); return s; }
  // Окно выбора активного отряда (из меню героев)
  function showTeam() {
    save.team = save.team.filter(x => save.unlocked.indexOf(x) >= 0); if (!save.team.length) save.team = [save.unlocked[0]];
    let team = '';
    save.unlocked.forEach(x => {
      const i = save.team.indexOf(x);
      team += '<div class="h" data-act="teampick" data-k="' + x + '">' + pt(x, i >= 0 ? 'sel' : 'dim', (i >= 0 ? '<i>' + (i + 1) + '</i>' : '') + '<b>' + save.heroes[x].lvl + '</b>') + '<br>' + heroLoc(x, 'name') + '</div>';
    });
    openModal('<div class="panel win" style="position:relative"><button class="x" data-act="closeteam">✕</button><h2 class="out">Отряд</h2>' +
      '<div class="paper"><b>Ваш отряд</b> <span class="note">— до 3 героев, номер = место в строю (1 — впереди)</span><div class="teampick">' + team + '</div></div>' +
      '<p style="text-align:center;font-weight:800;font-size:18px;margin-top:10px">Сила отряда: ' + MB.teamPower(save, save.team.slice(0, 3)) + '</p>' +
      '<div class="foot" style="margin-top:8px"><button class="btn green" data-act="closeteam" style="min-width:220px">Готово</button></div></div>');
  }
  function scrapValue(it) { return MB.RARITY[it.r].ore + Math.floor(spentOre(it) / 2); }
  function showItem(id) {
    const it = MB.findItem(save, id); if (!it) return;
    const k = heroTab, own = MB.ownerOf(save, id), R = MB.RARITY[it.r];
    const canUp = MB.canUpgrade(it), needRank = MB.needRank(it), uc = MB.upgradeCost(it.up + 1, it);
    const rk = it.rank || 0, cap = MB.rankCap(it), canRank = MB.canRankUp(it), rc = MB.rankCost(rk + 1, it);
    const amu = it.slot === 'amulet';
    openModal('<div class="panel win" style="position:relative;width:800px"><button class="x" data-act="close">✕</button><div class="paper">' + itemCardHtml(it, k, own !== k) +
      (own && own !== k ? '<p class="note" style="margin-top:6px">Сейчас надето на героя ' + heroLoc(own, 'name') + '.</p>' : '') +
      '<p class="note" style="margin-top:6px">' + (amu ? 'Ранг: ' : 'Уровень вещи: +' + it.up + ' из +' + R.maxUp + ' (каждый даёт +6%, платится Искрами). Каждые 10 уровней для дальнейшей прокачки нужен новый ранг. Ранг: ') + (rk ? '★'.repeat(rk) : 'нет') + (cap ? ' из ' + '★'.repeat(cap) : '') + ' (каждый даёт +15%, платится Рудой).</p>' +
      (needRank ? '<p class="note" style="margin-top:6px;color:#ffb347"><b>Улучшение остановлено: чтобы качать дальше, повысьте ранг до ' + '★'.repeat(it.up / 10) + '.</b></p>' : '') + '</div><div class="foot">' +
      (own === k ? '<button class="btn" data-act="unequip" data-id="' + id + '">Снять</button>'
        : it.heroOnly && it.heroOnly !== k ? '<button class="btn green" disabled title="Эту вещь может носить только ' + heroLoc(it.heroOnly, 'name') + '">Носит только ' + heroLoc(it.heroOnly, 'name') + '</button>'
        : '<button class="btn green" data-act="equip" data-id="' + id + '">Надеть на ' + heroLoc(k, 'name') + '</button>') +
      (canUp ? '<button class="btn blue" data-act="upgrade" data-id="' + id + '" ' + (save.sparks < uc ? 'disabled' : '') + '>Уровень +1 ' + ic('spark') + uc + '</button>' : '') +
      (canRank ? '<button class="btn purple" data-act="rankup" data-id="' + id + '" ' + (save.ore < rc ? 'disabled' : '') + '>Ранг ' + '★'.repeat(rk + 1) + ' ' + ic('ore') + rc + '</button>' : (needRank ? '<button class="btn purple" disabled>Ранг ' + '★'.repeat(rk + 1) + ' ' + ic('ore') + rc + '</button>' : '')) +
      '<button class="btn ' + (it.locked ? 'gold' : '') + '" data-act="togglelock" data-id="' + id + '">' + (it.locked ? '🔓 Разблокировать' : '🔒 Заблокировать') + '</button>' +
      (own ? '<button class="btn red" disabled title="Сначала снимите вещь с героя">Надето на герое</button>'
        : it.locked ? '<button class="btn red" disabled title="Вещь заблокирована замочком">Заблокировано</button>'
        : '<button class="btn red" data-act="scrap" data-id="' + id + '">Разобрать ' + ic('ore') + '+' + scrapValue(it) + '</button>') + '</div></div>');
  }

  function showScrapModal() {
    // Очистить несуществующие, надетые или заблокированные вещи из выделения
    for (const k in scrapSel) {
      const it = MB.findItem(save, +k);
      if (!it || it.locked || MB.ownerOf(save, it.id)) delete scrapSel[k];
    }
    const rarBtns = [['all', 'Все', null]].concat(MB.RARITY.map((R, i) => [String(i), R.name, R.color])).map(x => {
      const on = String(scrapRar) === x[0];
      const dot = x[2] ? '<i class="rar-dot" style="background:' + x[2] + '"></i>' : '';
      return '<button class="btn small ' + (on ? 'gold' : '') + '" data-act="scraprar" data-r="' + x[0] + '">' + dot + x[1] + '</button>';
    }).join('');
    const list = save.bag
      .filter(i => scrapRar === 'all' || i.r === +scrapRar)
      .sort((a, b) => b.r - a.r || MB.itemScore(b) - MB.itemScore(a));
    const availableInFilter = list.filter(i => !i.locked && !MB.ownerOf(save, i.id));
    const allFilteredSelected = availableInFilter.length > 0 && availableInFilter.every(i => !!scrapSel[i.id]);

    const cells = list.length ? list.map(i => {
      const own = MB.ownerOf(save, i.id);
      const blocked = !!own || !!i.locked;
      const sel = !!scrapSel[i.id];
      return itemCell(i, {
        act: blocked ? 'scrapblocked' : 'scraptoggle',
        cls: blocked ? 'dis-scrap' : (sel ? 'sel-scrap' : '')
      });
    }).join('') : '<div class="bagempty" style="grid-column:1/-1">Нет предметов выбранной редкости.</div>';

    let selCount = 0, totalOre = 0;
    for (const idStr in scrapSel) {
      const it = MB.findItem(save, +idStr);
      if (it && !it.locked && !MB.ownerOf(save, it.id)) { selCount++; totalOre += scrapValue(it); }
    }

    openModal('<div class="panel win" style="position:relative;width:820px"><button class="x" data-act="close">✕</button><h2 class="out">Разборка снаряжения</h2>' +
      '<div class="paper">' +
        '<div class="rar-filters">' + rarBtns + '</div>' +
        '<p class="note" style="text-align:center">Нажмите на предметы, чтобы отметить их для разборки. Надетое на героев и заблокированное (🔒) не разбирается.</p>' +
        '<div class="scrap-grid">' + cells + '</div>' +
      '</div>' +
      '<div class="foot" style="flex-wrap:wrap;gap:10px">' +
        '<button class="btn blue" data-act="scrapselectall" ' + (availableInFilter.length ? '' : 'disabled') + '>' + (allFilteredSelected ? 'Снять выделение (' + availableInFilter.length + ')' : 'Выделить (' + availableInFilter.length + ')') + '</button>' +
        '<button class="btn red" data-act="scrapselected" ' + (selCount ? '' : 'disabled') + '>Разобрать отмеченные (' + selCount + ') ' + ic('ore') + '+' + totalOre + '</button>' +
        '<button class="btn" data-act="close">Отмена</button>' +
      '</div></div>');
  }

  let treeTab = 'atk';
  function showStats() {
    const k = heroTab, h = save.heroes[k], free = MB.freePts(h), rc = MB.resetCost(h), T = MB.TREES.find(t => t.key === treeTab), used = MB.usedPts(h);
    const tabs = MB.TREES.map(t => '<button class="btn small ' + (t.key === treeTab ? 'gold' : '') + '" data-act="treetab" data-t="' + t.key + '">' + t.name + ' ' + (h.tr[t.key][0] + h.tr[t.key][1] + h.tr[t.key][2]) + '/30</button>').join('');
    const cols = T.cols.map((col, ci) => '<div class="tcol">' + col.map((nd, ri) => {
      const n = h.tr[T.key][ci], st = ri < n ? 'taken' : ri === n ? (free > 0 ? 'open' : 'next') : 'lock', B = MB.BON[nd[0]];
      return '<div class="tn ' + st + '"><button data-act="node" data-c="' + ci + '" data-r="' + ri + '">' + ART.icon(B.ic) + '</button><span>' + B.f(nd[1]) + '</span></div>';
    }).join('') + '</div>').join('');
    const sc = $('.treebox'), top = sc ? sc.scrollTop : 0;
    openModal('<div class="panel win" style="position:relative;width:820px"><button class="x" data-act="closestats">✕</button><h2 class="out">Прокачка: ' + heroLoc(k, 'name') + '</h2>' +
      '<div class="row" style="justify-content:space-between;margin-bottom:8px"><div style="display:flex;gap:8px">' + tabs + '</div><b class="out" style="font-size:18px">Свободных очков: ' + free + '</b></div>' +
      '<div class="paper treebox"><div class="tree">' + cols + '</div></div>' +
      '<p class="note" style="margin-top:6px;text-align:center">Одно очко за каждый уровень героя. Узел открывается, когда взят узел над ним. Очков хватит примерно на полтора дерева.</p>' +
      '<div class="foot" style="margin-top:8px"><button class="btn" data-act="resetpts" ' + (used && save.gems >= rc ? '' : 'disabled') + '>Сбросить очки прокачки ' + ic('gem') + rc + '</button><button class="btn green" data-act="closestats">Готово</button></div></div>');
    const ns = $('.treebox'); if (ns) ns.scrollTop = top;
  }

  function showBio(k) {
    const D = MB.HEROES[k], base = Object.keys(D.base)[0];
    const talentNames = {
      stun: T('оглушение', 'stun'),
      extra: T('доп. атака', 'extra attack'),
      block: T('блок', 'block'),
      ctrl: T('стойкость к контролю', 'crowd-control resist'),
      pierce: T('пробивание', 'pierce')
    };
    const full = heroLoc(k, 'full');
    const title = heroLoc(k, 'bioTitle');
    const role = heroLoc(k, 'role');
    const paragraphs = heroBio(k);
    openModal('<div class="panel win" style="position:relative;width:880px"><button class="x" data-act="close">✕</button><div class="paper biobox"><img class="bio-' + k + '" src="' + ART.url(k, 'idle') + '" alt="">' +
      '<div><h2 style="text-align:left;margin:0">' + full + '</h2><div class="biosub">' + title + ' · ' + role + '</div>' +
      paragraphs.map(p => '<p>' + p + '</p>').join('') +
      '<div class="biotag">' + T('Врождённый талант:', 'Innate talent:') + ' ' + (talentNames[base] || base) + ' ' + D.base[base] + '%</div></div></div></div>');
  }

  /* ---------- Логово ---------- */
  function fmtLongT(ms) {
    if (!ms || ms <= 0) return '00:00:00';
    const totalSec = Math.ceil(ms / 1000);
    const days = Math.floor(totalSec / 86400);
    const rem = totalSec % 86400;
    const h = Math.floor(rem / 3600);
    const m = Math.floor((rem % 3600) / 60);
    const s = rem % 60;
    const hh = String(h).padStart(2, '0'), mm = String(m).padStart(2, '0'), ss = String(s).padStart(2, '0');
    const dayLbl = I18N.lang === 'en' ? ' d. ' : ' д. ';
    return (days > 0 ? days + dayLbl : '') + hh + ':' + mm + ':' + ss;
  }
  function updateLairTimer() {
    const el = $('#lair-timer');
    if (!el || scene.mode !== 'lair') return;
    const remMs = Math.max(0, MB.lairNextResetMs(Date.now()) - Date.now());
    el.textContent = fmtLongT(remMs);
  }
  setInterval(updateLairTimer, 1000);

  function showLair() {
    scene = { mode: 'lair', bg: 'fon_cavetroll' };
    MUSIC.sync('menu'); BV = null; clock.speed = 1;
    const nDate = now();
    const lair = MB.lairState(save, nDate); persist();
    const maxAtt = MB.LAIR_WEEKLY.maxAttempts;
    const left = Math.max(0, maxAtt - (lair.used || 0));
    const remMs = Math.max(0, MB.lairNextResetMs(nDate.getTime()) - nDate.getTime());
    let cards = '';
    MB.CHAPTERS.forEach(C => {
      const open = !!save.bosses[C.n], maxD = lair.diff[C.boss] || 0;
      const bName = bossLoc(C.boss, 'name');
      cards += '<div class="panel lcard ' + (open ? '' : 'locked') + '"><img src="' + ART.url(C.boss) + '" alt=""><b class="out">' + bName + '</b>' +
        (open
          ? '<span class="note">' + T('Попыток на неделю:', 'Attempts this week:') + ' ' + left + ' ' + T('из', 'of') + ' ' + maxAtt + '</span>' + MB.LAIR.map((D, i) => {
              const oreAmt = MB.lairOreFor(C.boss, i);
              const dName = (I18N.lang === 'en' && LAIR_EN[i]) ? LAIR_EN[i] : D.name;
              return '<button class="btn ' + (i === 0 ? 'green' : i === 1 ? 'blue' : 'red') + '" data-act="lairfight" data-ch="' + C.n + '" data-d="' + i + '" ' + (left > 0 && i <= maxD ? '' : 'disabled') + '><span>' + dName + '</span>' + ic('ore') + '<span>' + oreAmt + '</span></button>';
            }).join('')
          : '<span class="note">' + T('Победите босса главы', 'Defeat chapter') + ' ' + C.n + ' ' + T('в кампании', 'boss in the campaign') + '</span>') + '</div>';
    });
    ui.innerHTML = topbar(t('lair'), 'hub') +
      '<div class="lair-top out"><span>' + T('Общих попыток на неделю:', 'Weekly attempts:') + ' <b>' + left + ' / ' + maxAtt + '</b></span><span>·</span><span>' + T('Обновление в Пн 00:00 (+3 UTC) через:', 'Resets Mon 00:00 (+3 UTC) in:') + ' <b id="lair-timer">' + fmtLongT(remMs) + '</b></span></div>' +
      '<div class="lair">' + cards + '</div>' +
      '<p class="out" style="position:absolute;left:0;right:0;bottom:18px;text-align:center;font-weight:700">' + T('Здесь добывается Руда для улучшения снаряжения. Попытка тратится даже при поражении.', 'Ore for gear upgrades is earned here. An attempt is spent even on defeat.') + '</p>';
    // Не гоняем HT() по экрану — строки уже через T()/bossLoc, иначе «опыт» ломает «попыток»
  }

  /* ---------- Ежедневный вход ---------- */
  function showDaily() {
    const d = MB.dailyState(save, now()); let days = '';
    MB.DAILY.forEach((R, i) => {
      const st = d.days[i];
      days += '<div class="day ' + st + '"><b>' + MB.DAY_NAMES[i] + '</b>' + (R.chest ? ART.icon('chest', MB.CHESTS[R.chest].col) : R.pot ? ART.icon('potion', '#5db3f0') : ic(R.sparks ? 'spark' : R.gems ? 'gem' : 'ore')) + R.text +
        (st === 'claimed' ? '<span class="mark">✔</span>' : st === 'missed' ? '<span class="mark">✕</span>' : st === 'locked' ? '<em>Серия прервана</em>' : '') + '</div>';
    });
    const dq = MB.dailyQuestState(save, now());
    const maxW = MB.DAILY_QUESTS[MB.DAILY_QUESTS.length - 1].wins;
    const pct = Math.min(100, Math.round((dq.wins / maxW) * 100));
    const mid = new Date(); mid.setHours(24, 0, 0, 0);
    const rem = mid - now();
    const hh = Math.floor(rem / 3600000), mm = Math.floor((rem % 3600000) / 60000);
    let marks = '';
    MB.DAILY_QUESTS.forEach((q, i) => {
      const left = Math.round(8 + (q.wins / maxW) * 84);
      const ready = dq.wins >= q.wins && !dq.claimed[i];
      const done = !!dq.claimed[i];
      const icon = q.chest ? ART.icon('chest', MB.CHESTS[q.chest].col) : q.pot ? ART.icon('potion', '#a855f7') : ic('spark');
      marks += '<div class="dqmark" style="left:' + left + '%">' +
        '<button class="dqgift' + (ready ? ' ready' : '') + (done ? ' done' : '') + '" data-act="dqclaim" data-i="' + i + '" ' + (ready ? '' : 'disabled') + '>' +
          icon + '<i class="dqnum">' + q.wins + '</i></button>' +
        '<span class="dqlabel">' + q.label + (done ? ' ✔' : '') + '</span></div>';
    });
    const questBlock = '<div class="dqbox"><div class="dqhead">Выигрывайте бои каждый день и забирайте награды!<br>Обновление через: <b>' + hh + 'ч ' + mm + 'м</b></div>' +
      
      '<div class="dqrow"><div class="dqcheck">' + ic('spark') + '</div><b class="dqcount">' + dq.wins + '/' + maxW + '</b>' +
      '<div class="dqtrack"><i style="width:' + Math.max(pct, 6) + '%"></i>' + marks + '</div></div></div>';
    openModal('<div class="panel win" style="position:relative;width:920px"><button class="x" data-act="close">✕</button><h2 class="out">Награда за вход</h2><div class="paper"><p style="font-weight:700">Заходите каждый день с понедельника по субботу — и в воскресенье заберёте 20 изумрудов. Пропущенный день сгорает, в понедельник серия начинается заново.</p>' +
      '<div class="daily">' + days + '</div>' + (d.broken ? '<p style="font-weight:800;color:#a02a1e">Серия прервана — новая начнётся в понедельник. Награды оставшихся дней недели всё равно можно забирать.</p>' : '') +
      questBlock + '</div>' +
      '<div class="foot"><button class="btn green" data-act="claim" ' + (d.canClaim ? '' : 'disabled') + '>' + (d.canClaim ? T('Забрать награду','Claim reward') : d.days[d.idx] === 'claimed' ? 'Сегодня уже получено' : 'Сегодня награды нет') + '</button></div></div>');
  }

  /* ---------- Энергия ---------- */
  function showEnergy(need) {
    showEnergy.need = need; const e = MB.energy(save, Date.now());
    const pots = Object.keys(MB.POTIONS).map(k => { const P = MB.POTIONS[k]; return '<div class="shopcard">' + ART.icon('potion', k === 's' ? '#5db3f0' : k === 'm' ? '#a855f7' : '#f5b301') + '<b>' + P.name + '</b><span>+' + P.amt + ' энергии</span><span>Есть: ' + save.potions[k] + '</span>' +
      '<button class="btn small green" data-act="drink" data-p="' + k + '" ' + (save.potions[k] ? '' : 'disabled') + '>Выпить</button></div>'; }).join('') + elixirCard('modal');
    openModal('<div class="panel win" style="position:relative;width:820px"><button class="x" data-act="close">✕</button><h2 class="out">' + (need ? 'Не хватает энергии' : 'Энергия') + '</h2>' +
      '<div class="paper"><p style="font-weight:800;font-size:19px;text-align:center">' + ic('energy').replace('<svg', '<svg style="width:26px;height:26px;vertical-align:-6px"') + ' ' + e.val + ' / ' + (e.max || MB.ENERGY.max) +
      ' · бой стоит ' + MB.ENERGY.cost + ' · +1 каждые ' + MB.ENERGY.regenMin + ' мин' + (e.next ? ' (следующая через ' + fmtT(e.next) + ')' : '') + '</p>' +
      '<p class="note" style="text-align:center">Банки можно пить сверх максимума. Купить их можно в магазине.</p><div class="shopgrid" style="margin-top:8px">' + pots + '</div></div>' +
      '<div class="foot"><button class="btn gold" data-act="shoptab" data-t="energy">' + ic('cart') + 'В магазин</button></div></div>');
  }

  // Эликсир расширения энергии: from — 'modal' (меню энергии, кнопка без обёртки) или 'shop' (вкладка магазина)
  function elixirCard(from) {
    const X = MB.ENERGY_ELIXIR, own = !!save.energyElixir;
    const btn = own ? '<button class="btn small green" disabled>Применён</button>'
      : '<button class="btn small blue" data-act="elixir" data-from="' + from + '" ' + (save.gems < X.gems ? 'disabled' : '') + '>' + ic('gem') + X.gems + '</button>';
    return '<div class="shopcard">' + ART.icon('potion', X.col) + '<b>' + X.name + '</b><span>+' + X.add + ' к максимуму энергии</span><div class="shopcard-btns">' + btn + '</div></div>';
  }
  function elixirConfirm(from) {
    const X = MB.ENERGY_ELIXIR; elixirConfirm.from = from;
    if (save.energyElixir || save.gems < X.gems) return;
    openModal('<div class="panel win" style="width:600px"><h2 class="out">' + X.name + '</h2><div class="paper" style="text-align:center;font-weight:700">' +
      'Максимум энергии вырастет на ' + X.add + ': с ' + MB.energyMax(save) + ' до ' + (MB.energyMax(save) + X.add) + '.' +
      '<p class="note" style="margin-top:8px">Покупка разовая и действует навсегда, повторно купить эликсир нельзя. Саму энергию он не добавляет: шкала просто становится больше.</p></div>' +
      '<div class="foot"><button class="btn green" data-act="elixirbuy">Купить ' + ic('gem') + X.gems + '</button><button class="btn" data-act="elixircancel">Отмена</button></div></div>');
  }

  /* ---------- Магазин ---------- */
  let shopTab = 'chests';
  function showShop(tab, backTo) {
    if (backTo) showShop.back = backTo;
    else if (!showShop.back) showShop.back = 'hub';
    if (tab) shopTab = tab; closeModal();
    scene = { mode: 'menu', bg: scene.bg };
    MUSIC.sync('menu'); BV = null;
    const tabs = [['chests', T('Сундуки','Chests')], ['energy', T('Энергия','Energy')], ['ore', T('Руда','Ore')], ['free', T('Реклама','Ads')], ['heroes', T('Герои','Heroes')], ['gems', T('Изумруды','Emeralds')], ['clan', T('Лавка Клана','Clan Shop')]].map(x => '<button class="btn small ' + (shopTab === x[0] ? 'gold' : '') + '" data-act="shoptab" data-t="' + x[0] + '">' + x[1] + (x[0] === 'free' && totalAdsLeft() ? ' (' + totalAdsLeft() + ')' : '') + '</button>').join('');
    let banner = '', cards = '', gridCls = 'shopgrid', foot = '';
    const price = (gems, i) => '<button class="btn small blue" data-act="buygems" data-i="' + i + '" ' + (save.gems < gems ? 'disabled' : '') + '>' + ic('gem') + gems + '</button>';
    showShop.items = [];
    const add = (o) => { showShop.items.push(o); return showShop.items.length - 1; };
    if (shopTab === 'chests') {
      MB.SHOP.chests.forEach(x => {
        const C = MB.CHESTS[x.chest], i = add({ gems: x.gems, chest: x.chest });
        cards += '<div class="shopcard">' + ART.icon('chest', C.col) + '<b>' + chestName(x.chest) + '</b><span>' + T('1 вещь (', '1 item (') + rarityLoc(C.chance.indexOf(100)).toLowerCase() + ')</span><div class="shopcard-btns">' + price(x.gems, i) + '</div></div>';
      });
    }
    if (shopTab === 'energy') {
      Object.keys(MB.POTIONS).forEach(k => {
        const P = MB.POTIONS[k], i = add({ gems: P.gems, pot: k });
        cards += '<div class="shopcard">' + ART.icon('potion', k === 's' ? '#5db3f0' : k === 'm' ? '#a855f7' : '#f5b301') + '<b>' + potionName(k) + '</b><span>+' + P.amt + ' ' + T('энергии', 'energy') + ' · ' + T('есть', 'owned') + ' ' + save.potions[k] + '</span><div class="shopcard-btns">' + price(P.gems, i) + '</div></div>';
      });
      cards += elixirCard('shop');
    }
    if (shopTab === 'ore') {
      MB.SHOP.ore.forEach(x => {
        const i = add({ gems: x.gems, ore: x.ore });
        cards += '<div class="shopcard">' + ic('ore') + '<b>' + x.ore + ' ' + T('Руды', 'Ore') + '</b><span>' + T('для рангов снаряжения', 'for gear ranks') + '</span><div class="shopcard-btns">' + price(x.gems, i) + '</div></div>';
      });
    }
    if (shopTab === 'clan') {
      gridCls = 'shopgrid clan-grid';
      const ccImg = '<img class="mb-ic" src="assets/ui/clan_coin.webp" alt="" style="width:20px;height:20px;vertical-align:-4px">';
      banner = '<div class="paper shopbanner"><img src="assets/ui/clan_coin.webp" alt=""><div><b>Клановые монеты: ' + (save.ccoin || 0) + '</b><span class="note">За бой с клановым боссом: +20 монет, за победу: +400 всем соклановцам. Ключи: 2 бесплатно каждый день.</span></div></div>';
      MB.CLAN_SHOP.forEach(x => {
        const i = add(x);
        if (x.kind === 'sparks') cards += '<div class="shopcard">' + ic('spark') + '<b>' + x.n + ' Искр</b><span>пак за монеты</span><div class="shopcard-btns"><button class="btn small gold" data-act="buygems" data-i="' + i + '" ' + ((save.ccoin || 0) < x.cc ? 'disabled' : '') + '>' + ccImg + x.cc + '</button></div></div>';
        if (x.kind === 'ore') cards += '<div class="shopcard">' + ic('ore') + '<b>' + x.n + ' Руды</b><span>пак за монеты</span><div class="shopcard-btns"><button class="btn small gold" data-act="buygems" data-i="' + i + '" ' + ((save.ccoin || 0) < x.cc ? 'disabled' : '') + '>' + ccImg + x.cc + '</button></div></div>';
        if (x.kind === 'chest') { const C = MB.CHESTS[x.chest]; cards += '<div class="shopcard">' + ART.icon('chest', C.col) + '<b>' + chestName(x.chest) + '</b><span>' + T('1 вещь (', '1 item (') + rarityLoc(C.chance.indexOf(100)).toLowerCase() + ')</span><div class="shopcard-btns"><button class="btn small gold" data-act="buygems" data-i="' + i + '" ' + ((save.ccoin || 0) < x.cc ? 'disabled' : '') + '>' + ccImg + x.cc + '</button></div></div>'; }
        if (x.kind === 'key') cards += '<div class="shopcard"><img class="mb-ic" src="assets/ui/key_clan.webp" alt=""><b>Ключ босса</b><span>+1 бой · есть: ' + MB.clanKeys(save) + '</span><div class="shopcard-btns"><button class="btn small blue" data-act="buygems" data-i="' + i + '" ' + (save.gems < x.gems ? 'disabled' : '') + '>' + ic('gem') + x.gems + '</button></div></div>';
      });
    }
    if (shopTab === 'free') {
      const L = adsLeft(), amt = adReward();
      const PL = potAdsLeft(), pMax = MB.SHOP.ads.potPerDay || 5, pKey = MB.SHOP.ads.potType || 's', P = MB.POTIONS[pKey];
      const adResetTarget = MB.nextAdsResetMs(now());
      const adResetLeft = Math.max(0, adResetTarget - Date.now());
      const adResetStr = MB.formatDuration(adResetLeft, true, I18N.lang);
      const adH = MB.ADS_RESET_UTC_HOUR != null ? MB.ADS_RESET_UTC_HOUR : 3;
      const adM = MB.ADS_RESET_UTC_MINUTE != null ? MB.ADS_RESET_UTC_MINUTE : 0;
      const adTimeLbl = String(adH).padStart(2, '0') + ':' + String(adM).padStart(2, '0') + ' UTC';
      // Плашка сброса — отдельной строкой между вкладками и карточками
      banner = '<div class="paper shopbanner ad-reset-banner">' +
        '<div style="flex:1;text-align:center">' +
          '<b>' + T('Сброс лимитов рекламы', 'Ad limits reset') + '</b>' +
          '<span class="note">' + T('Обновление каждый день в', 'Refreshes every day at') + ' <b>' + adTimeLbl + '</b> · ' + T('До сброса:', 'Until reset:') + ' <b id="shop-ads-reset-timer" style="color:#c4841a" data-target="' + adResetTarget + '">' + adResetStr + '</b></span>' +
        '</div></div>';
      const pNm = potionName(pKey);
      cards += '<div class="shopcard wide">' + ic('spark') + '<b>' + T('Реклама за Искры', 'Ad for Sparks') + '</b><span>' + T('Посмотрите короткий ролик и получите', 'Watch a short video and get') + ' ' + amt + ' ' + T('Искр', 'Sparks') + '. ' + T('Осталось сегодня:', 'Left today:') + ' <b id="shop-ads-left">' + L + '</b> ' + T('из', 'of') + ' ' + MB.SHOP.ads.perDay + '.</span>' +
        '<div class="shopcard-btns"><button class="btn small green" data-act="ad" ' + (L ? '' : 'disabled') + '>▶ ' + T('Смотреть', 'Watch') + '</button></div></div>';
      cards += '<div class="shopcard wide">' + ART.icon('potion', '#5db3f0') + '<b>' + T('Реклама за', 'Ad for') + ' ' + pNm + '</b><span>' + T('Посмотрите короткий ролик и получите', 'Watch a short video and get') + ' ' + pNm + ' (+' + P.amt + ' ' + T('энергии', 'energy') + '). ' + T('Осталось сегодня:', 'Left today:') + ' <b id="shop-pot-ads-left">' + PL + '</b> ' + T('из', 'of') + ' ' + pMax + '.</span>' +
        '<div class="shopcard-btns"><button class="btn small green" data-act="adpot" ' + (PL ? '' : 'disabled') + '>▶ ' + T('Смотреть', 'Watch') + '</button></div></div>';
    }
    if (shopTab === 'heroes') {
      MB.SKIN_PACKS.forEach(p => {
        const owned = save.skins && save.skins[p.hero];
        cards += '<div class="shopcard wide pack">' + '<img class="packimg" src="assets/sprites/' + p.id + '_idle.webp" onerror="this.src=ART.url(\'' + p.id + '\',\'idle\')" alt="">' + '<b>' + p.name + '</b><span>' + p.desc + '</span><div class="shopcard-btns">' +
          (owned ? '<span class="owned">✔ Куплено — облик переключается в меню героя</span>' : price(p.gems, add({ gems: p.gems, pack: p.id }))) + '</div></div>';
      });
      MB.HERO_ORDER.filter(k => MB.HEROES[k].shop).forEach(k => {
        const H = MB.HEROES[k], own = save.unlocked.indexOf(k) >= 0;
        cards += '<div class="shopcard hero"><img src="' + ART.url(k, 'idle') + '" alt=""><b>' + H.full + '</b><span>' + H.role + '</span><div class="shopcard-btns">' +
          (own ? '<span class="owned">✔ В отряде</span>' : '<button class="btn small gold" data-act="buyreal" data-hero="' + k + '">' + H.shop.price + ' ₽</button>') +
          '<button class="btn small" data-act="bioshop" data-k="' + k + '">История</button></div></div>';
      });
      foot = '<p class="note out shopfoot">' + T('Это прототип: покупки за рубли тестовые, деньги не списываются. В игре здесь откроется оплата площадки.', 'Prototype: ruble purchases are simulated and not charged. Platform billing will appear in the live build.') + '</p>';
    }
    if (shopTab === 'gems') {
      MB.SHOP.gems.forEach((x, i) => {
        cards += '<div class="shopcard">' + ic('gem') + '<b>' + x.gems + ' ' + T('Изумрудов', 'Emeralds') + '</b><span>' + (i === 3 ? T('Лучшая цена','Best value') : i === 2 ? T('Популярно','Popular') : T('Набор изумрудов','Emerald pack')) + '</span><div class="shopcard-btns"><button class="btn small gold" data-act="buyreal" data-g="' + i + '">' + x.rub + ' ₽</button></div></div>';
      });
      foot = '<p class="note out shopfoot">' + T('Это прототип: покупки за рубли тестовые, деньги не списываются. В игре здесь откроется оплата площадки.', 'Prototype: ruble purchases are simulated and not charged. Platform billing will appear in the live build.') + '</p>';
    }
    ui.innerHTML = topbar(t('shop'), showShop.back || 'hub') + '<div class="shop shop-fit"><div class="tabs" style="justify-content:flex-start;margin-bottom:10px;flex:none">' + tabs + '</div>' + banner + '<div class="' + gridCls + '">' + cards + '</div>' + foot + '</div>';
    applyUILang();
    if (shopTab === 'free') startShopAdsResetTimer();
    else stopShopAdsResetTimer();
  }

  /* ---------- Живой таймер сброса рекламы (00:00 UTC+3) ---------- */
  let shopAdsResetTimerId = 0;
  function stopShopAdsResetTimer() {
    if (shopAdsResetTimerId) {
      clearInterval(shopAdsResetTimerId);
      shopAdsResetTimerId = 0;
    }
  }
  function startShopAdsResetTimer() {
    stopShopAdsResetTimer();
    if (!document.getElementById('shop-ads-reset-timer')) return;
    const tick = () => {
      const node = document.getElementById('shop-ads-reset-timer');
      if (!node || !document.querySelector('.shop')) {
        stopShopAdsResetTimer();
        return;
      }
      let target = +node.getAttribute('data-target');
      if (!target || !isFinite(target)) {
        target = MB.nextAdsResetMs(new Date());
        node.setAttribute('data-target', String(target));
      }
      const left = target - Date.now();
      if (left <= 0) {
        node.textContent = '0м 00с';
        stopShopAdsResetTimer();
        // Ровно 03:00 UTC — новый рекламный день
        ensureAdsDay();
        persist();
        toast('Лимиты рекламы обновлены!');
        setTimeout(() => {
          if (document.querySelector('.shop') && shopTab === 'free') showShop('free');
        }, 80);
        return;
      }
      node.textContent = MB.formatDuration(left, true, I18N.lang);
    };
    tick();
    shopAdsResetTimerId = setInterval(tick, 1000);
  }

  function adReward() { return MB.SHOP.ads.reward || 100; }
  function buy(i) {
    const o = showShop.items[i]; if (!o) return;
    if (o.cc) { if ((save.ccoin || 0) < o.cc) return; save.ccoin -= o.cc; }
    else if (o.gems) { if (save.gems < o.gems) return; save.gems -= o.gems; }
    if (o.kind === 'key') { save.ckeys.paid++; persist(); showShop(); toast('Ключ кланового босса куплен! Ключей: ' + MB.clanKeys(save)); return; }
    if (o.kind === 'sparks') { save.sparks += o.n; toast('+' + o.n + ' Искр'); }
    if (o.kind === 'ore') { save.ore += o.n; toast('+' + o.n + ' Руды'); }
    if (o.ore) { save.ore += o.ore; toast('+' + o.ore + ' Руды'); }
    if (o.pot) { save.potions[o.pot]++; toast(T('Куплено: ', 'Purchased: ') + potionName(o.pot)); }
    persist();
    if (o.pack) {
      const items = MB.grantSkinPack(save, o.pack), p = MB.SKIN_PACKS.find(x => x.id === o.pack); persist(); syncSkins();
      openModal('<div class="panel win" style="width:720px"><h2 class="out">' + p.name + '</h2><div class="paper" style="text-align:center">' +
        '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">' + items.map(it => '<div class="slot big" style="' + slotBg(it) + '" title="' + MB.itemName(it, p.hero) + '">' + ART.itemIcon(it, p.hero) + '</div>').join('') + '</div>' +
        '<p style="font-weight:700;margin-top:10px">Золотой облик ' + heroLoc(p.hero, 'name') + ' уже включён — переключить его можно кнопкой в меню героя.</p>' +
        '<p class="note" style="margin-top:6px">Вещи лежат в сумке на экране «Герои» и подходят только ' + (p.heroDat || heroLoc(p.hero, 'name')) + '.</p></div>' +
        '<div class="foot"><button class="btn green" data-act="closeopen">Отлично</button></div></div>');
      return;
    }
    if (o.chest) { const it = grantChest(MB.topChapter(save), o.chest); persist(); openModal('<div class="panel win" style="width:640px"><h2 class="out">' + (I18N.lang==='en' && CHEST_EN[o.chest] ? CHEST_EN[o.chest] : MB.CHESTS[o.chest].name) + '</h2><div class="paper">' + itemCardHtml(it, save.team[0], false) + '<p class="note" style="margin-top:6px">Вещь лежит в сумке на экране «Герои».</p></div><div class="foot"><button class="btn green" data-act="closeopen">Отлично</button></div></div>'); }
    else showShop();
  }
  function buyReal(d) {
    const sdk = window.PikabuSDK;
    if (sdk && sdk.store && typeof sdk.store.purchase === 'function') {
      const productId = d.hero
        ? (d.hero === 'archer' ? 'hero_yarra' : d.hero === 'boar' ? 'hero_pig' : 'hero_' + d.hero)
        : ('gems_' + MB.SHOP.gems[+d.g].gems);
      sdk.store.purchase({ productId: productId }).then(result => {
        if (!result.success) {
          console.log('Purchase failed:', result.reason, 'productId:', productId);
          if (result.reason === 'NON_CONSUMABLE_ALREADY_OWNED' && d.hero) {
            if (save.unlocked.indexOf(d.hero) < 0) {
              save.unlocked.push(d.hero);
              persist();
              toast(heroLoc(d.hero, 'full') + ' уже куплен — добавлен в отряд');
              showShop();
            }
            return;
          }
          if (result.reason !== 'USER_CANCELLED') toast('Покупка не завершена: ' + (result.reason || 'ошибка'));
          return;
        }
        if (d.hero) {
          if (save.unlocked.indexOf(d.hero) < 0) {
            save.unlocked.push(d.hero);
            setTimeout(() => SFX.play('hero_unlock', 0.84), 220);
          }
          toast(heroLoc(d.hero, 'full') + ' в вашем отряде!');
        } else {
          const amt = MB.SHOP.gems[+d.g].gems;
          save.gems += amt;
          setTimeout(() => SFX.play('gem_gain', 0.74), 180);
          toast('+' + amt + ' Изумрудов');
        }
        persist();
        if (result.purchase && result.purchase.isConsumable && typeof sdk.store.consumePurchase === 'function') {
          sdk.store.consumePurchase(result.purchase.purchaseId).catch(() => {});
        }
        showShop();
      }).catch(() => toast('Ошибка покупки'));
      return;
    }
    const what = d.hero ? heroLoc(d.hero, 'full') + ' — ' + MB.HEROES[d.hero].shop.price + ' ₽' : MB.SHOP.gems[+d.g].gems + ' Изумрудов — ' + MB.SHOP.gems[+d.g].rub + ' ₽';
    buyReal.d = d;
    openModal('<div class="panel win" style="width:600px"><h2 class="out">Покупка</h2><div class="paper" style="text-align:center;font-weight:700">' + what + '<p class="note" style="margin-top:8px">Тестовая покупка: деньги не списываются. В опубликованной игре здесь откроется оплата площадки.</p></div>' +
      '<div class="foot"><button class="btn green" data-act="confirmbuy">Купить (тест)</button><button class="btn" data-act="close">Отмена</button></div></div>');
  }
  function showChances(c) {
    const C = MB.CHESTS[c];
    openModal('<div class="panel win" style="position:relative;width:560px"><button class="x" data-act="close">✕</button><h2 class="out">' + C.name + '</h2><div class="paper"><p style="font-weight:700;margin-bottom:6px">Шанс редкости выпавшей вещи:</p>' +
      MB.RARITY.map((R, i) => '<div class="chrow"><span style="color:' + R.color + '">■</span> ' + R.name + '<b>' + C.chance[i] + '%</b></div>').join('') +
      '<p class="note" style="margin-top:8px">Слот вещи (оружие, шлем, нагрудник, перчатки, сапоги, амулет) выпадает с равным шансом.</p></div></div>');
  }
  function watchAd(kind) {
    const isPot = kind === 'pot';
    if (isPot ? !potAdsLeft() : !adsLeft()) return;
    const sdk = window.PikabuSDK;
    console.log('watchAd SDK:', !!sdk, sdk && sdk.ads ? Object.keys(sdk.ads) : 'no ads');
    const grantReward = () => {
      const adState = ensureAdsDay();
      if (isPot) {
        const pKey = MB.SHOP.ads.potType || 's';
        const P = MB.POTIONS[pKey];
        adState.potN = (adState.potN || 0) + 1;
        save.potions[pKey] = (save.potions[pKey] || 0) + 1;
        persist();
        showShop('free');
        toast('Получено: ' + P.name + ' (+' + P.amt + ' энергии)');
      } else {
        const a = adReward();
        adState.n++;
        save.sparks += a;
        persist();
        showShop('free');
        toast('+' + a + ' Искр');
      }
    };
    const rewarded = sdk && sdk.ads && sdk.ads.rewarded;
    if (rewarded && typeof rewarded.show === 'function') {
      rewarded.canShow().then(can => {
        console.log('canShow rewarded:', can);
        if (!can) { toast('Реклама сейчас недоступна'); return; }
        rewarded.show().then(result => {
          console.log('rewarded result:', result);
          if (result && result.reward) grantReward();
          else toast('Реклама не просмотрена');
        }).catch(e => { console.error('rewarded show error:', e); toast('Ошибка показа рекламы'); });
      }).catch(e => { console.error('canShow error:', e); toast('Реклама недоступна'); });
      return;
    }
    console.log('SDK rewarded not available, using fallback');
    let t = 5;
    openModal('<div class="panel win" style="width:560px"><h2 class="out">Реклама</h2><div class="paper adbox"><b id="adt">' + t + '</b><p>Здесь будет рекламный ролик площадки</p></div></div>');
    const iv = setInterval(() => {
      t--;
      const el = $('#adt');
      if (el) el.textContent = t;
      if (t <= 0) { clearInterval(iv); closeModal(); grantReward(); }
    }, 1000);
  }

  /* ---------- Колизей ---------- */
  function showColiseum() {
    scene = { mode: 'menu', bg: 'fon_coliseum' };
    MUSIC.sync('menu'); BV = null; clock.speed = 1;
    const best = save.col.best; let fl = '';
    for (let f = 1; f < MB.COLISEUM.floors; f++) {
      const en = MB.coliseumFloor(f), st = f <= best ? 'done' : f === best + 1 ? 'open' : 'locked';
      fl += '<button class="colmedal ' + st + '" data-act="colfight" data-f="' + f + '" title="' + en.map(e => (MB.ENEMIES[e.type] || MB.BOSSES[e.type]).name + ' · ур. ' + e.lvl).join(', ') + '">' +
        (st === 'done' ? '<img class="done-chk col-chk" src="assets/ui/check_green.webp" alt="">' : '') +
        '<img src="assets/ui/arena_' + (st === 'done' ? 'gold' : 'silver') + '.webp" alt=""><span class="ml out">Арена ' + f + ' · ур. ' + en[0].lvl + '</span></button>';
    }
    // 10-я арена — плашка финального босса, как в кампании
    const bf = MB.COLISEUM.floors, ben = MB.coliseumFloor(bf), BB = MB.BOSSES[ben[0].type];
    const bst = best >= bf ? 'done' : best + 1 === bf ? 'open' : 'locked';
    fl += '<button class="colboss ' + bst + '" data-act="colfight" data-f="' + bf + '"><span class="bport">' + pt(ben[0].type, '', '', 82) + '</span><span class="bframe"></span>' +
      '<span class="btxt"><b class="out">Босс: ' + BB.name + ' · ур. ' + ben[0].lvl + '</b><i>' + (bst === 'locked' ? 'Откроется после 9-й арены' : BB.mechText) + '</i></span></button>';
    const H = MB.HEROES[MB.COLISEUM.reward], got = save.unlocked.indexOf(MB.COLISEUM.reward) >= 0;
    ui.innerHTML = topbar(t('coliseum'), 'hub') + '<div class="colz"><div class="panel colinfo"><img src="' + ART.url(MB.COLISEUM.reward) + '" alt=""><b class="out">' + (heroLoc(MB.COLISEUM.reward, 'full') || H.full) + '</b><span>' + (got ? (I18N.lang === 'en' ? 'Already in your team!' : 'Уже в вашем отряде!') : (I18N.lang === 'en' ? 'Clear all 10 arenas and she will join you.' : 'Пройдите все 10 арен, и она присоединится к вам.')) + '</span>' +
      '<p>Дуэли 1 на 1: выберите одного героя. Каждую арену можно пройти только один раз. На 5-й — босс, на 10-й — Минотавр Арены. За победу: 30 Изумрудов, Руда и синий сундук, на 5-й и 10-й — фиолетовый.</p></div><div class="colarena">' + fl + '</div></div>';
    applyUILang();
  }

  /* ---------- Кланы ---------- */
  let clanTab = 'boss', memberSort = 'power', embDraft = null, embMode = 'create';
  function showEmblemEditor(mode) {
    embMode = mode || 'create';
    embDraft = Object.assign({}, (embMode === 'edit' && save.clan && save.clan.emblem) ? save.clan.emblem : MB.defaultEmblem());
    renderEmblemModal();
  }
  function renderEmblemModal() {
    if (!embDraft.icon) embDraft.icon = 'axes_red';
    const prev = ART.clanEmblem(embDraft, 128);
    const iconGrid = (MB.CLAN_ICONS || []).map(icItem => {
      const sel = embDraft.icon === icItem.id;
      return '<button type="button" class="clan-ic-pick' + (sel ? ' sel' : '') + '" data-act="embopt" data-k="icon" data-v="' + icItem.id + '" title="' + icItem.name + '">' +
        '<img src="assets/clans/' + icItem.file + '" alt="' + icItem.name + '"></button>';
    }).join('');
    const curName = ($('#clanname') && $('#clanname').value) || '';
    const curDesc = ($('#clandesc') && $('#clandesc').value) || '';
    const isCreate = embMode === 'create';
    openModal('<div class="panel win" style="position:relative;width:820px"><button class="x" data-act="close">✕</button>' +
      '<h2 class="out">' + (isCreate ? 'Создать клан' : 'Иконка клана') + '</h2>' +
      '<div class="paper" style="display:flex;gap:18px;align-items:flex-start">' +
        '<div style="width:176px;text-align:center;flex:none">' +
          '<div class="emb-preview">' + prev + '</div>' +
          '<p class="note" style="margin-top:6px">Выбранная иконка</p>' +
        '</div>' +
        '<div style="flex:1;display:flex;flex-direction:column;gap:8px">' +
          (isCreate
            ? '<div><b>Название клана</b> <span class="note">(до 20 символов: буквы, пробел, «-» и «+»)</span>' +
              '<input id="clanname" class="claninput" maxlength="20" placeholder="Например: Когти Дракона +" value="' + curName.replace(/"/g, '&quot;') + '"></div>' +
              '<div><b>Описание клана</b> <span class="note" id="clandesc-cnt">(' + curDesc.length + '/200, любые символы)</span>' +
              '<textarea id="clandesc" class="claninput clan-desc-inp" maxlength="200" rows="3" placeholder="Расскажите о вашем клане...">' + curDesc.replace(/</g, '&lt;') + '</textarea></div>'
            : '') +
          '<div><b>Иконка клана:</b><div class="clan-ic-grid">' + iconGrid + '</div></div>' +
        '</div>' +
      '</div>' +
      '<div class="foot">' +
        (isCreate
          ? '<button class="btn green" data-act="clancreateok" ' + (save.gems < MB.CLAN.createCost ? 'disabled' : '') + '>Создать ' + ic('gem') + MB.CLAN.createCost + '</button>'
          : '<button class="btn green" data-act="embsave">Сохранить иконку</button>') +
        '<button class="btn" data-act="close">Отмена</button>' +
      '</div></div>');
    const nameInp = $('#clanname');
    if (nameInp) {
      nameInp.addEventListener('input', () => {
        const cleaned = nameInp.value.replace(/[^A-Za-zА-Яа-яЁё +\-]/g, '').replace(/\s{2,}/g, ' ').slice(0, 20);
        if (nameInp.value !== cleaned) nameInp.value = cleaned;
      });
    }
    const descInp = $('#clandesc');
    if (descInp) {
      descInp.addEventListener('input', () => {
        const sliced = descInp.value.slice(0, 200);
        if (descInp.value !== sliced) descInp.value = sliced;
        const cnt = $('#clandesc-cnt');
        if (cnt) cnt.textContent = '(' + descInp.value.length + '/200, любые символы)';
      });
    }
  }
  function showClans() {
    scene = { mode: 'menu', bg: 'fon_coliseum' };
    MUSIC.sync('menu'); BV = null; clock.speed = 1;
    const npcIcons = (MB.CLAN_ICONS && MB.CLAN_ICONS.length) ? MB.CLAN_ICONS : [{ id: 'axes_red' }];
    save.clanApps = save.clanApps || {};
    const cfg = window.MB_NET_CONFIG || {};
    const api = (cfg.apiUrl || '').replace(/\/$/, '');
    const renderCards = (serverClans) => {
      const npcCards = MB.CLAN_NPC.map((c, i) => {
        const em = Object.assign({}, c.emblem || {}, { icon: c.icon || npcIcons[i % npcIcons.length].id });
        const recMode = c.recruit || 'free';
        const recLbl = (MB.CLAN_RECRUIT[recMode] && MB.CLAN_RECRUIT[recMode].name) || 'Свободный вход';
        const cap = MB.clanMaxMembers(c.lvl);
        const curCnt = Math.min(cap, 5 + (c.lvl % 5));
        const sent = !!save.clanApps[i];
        const btnHtml = recMode === 'closed'
          ? '<button class="btn small red" data-act="clanjoin" data-i="' + i + '">Заявки отклоняются</button>'
          : recMode === 'apply'
            ? '<button class="btn small ' + (sent ? 'gold' : 'blue') + '" data-act="clanjoin" data-i="' + i + '">' + (sent ? 'Заявка подана' : 'Подать заявку') + '</button>'
            : '<button class="btn small green" data-act="clanjoin" data-i="' + i + '">Вступить</button>';
        return '<div class="shopcard">' + ART.clanEmblem(em, 68) + '<b>' + c.name + '</b><span>Уровень ' + c.lvl + ' · мест: ' + curCnt + '/' + cap + '</span><span>Приём: ' + recLbl + ' · Искры +' + c.lvl + '%</span>' +
          btnHtml + '</div>';
      }).join('');
      const realCards = (serverClans || []).map(c => {
        const emblem = c.emblem ? ART.clanEmblem(c.emblem, 68) : ART.clanEmblem(MB.defaultEmblem(), 68);
        return '<div class="shopcard">' + emblem + '<b>' + (c.name || 'Клан') + '</b><span>Уровень ' + (c.lvl || 1) + ' · ' + (c.members || 0) + ' уч.</span><span>Сила: ' + (c.power || 0) + '</span>' +
          '<button class="btn small green" data-act="clanjoinreal" data-id="' + c.id + '" data-name="' + (c.name || '') + '">Вступить</button></div>';
      }).join('');
      const allCards = realCards + npcCards;
      const emptyNote = allCards
        ? ''
        : '<div class="paper" style="margin-bottom:12px;font-weight:600;font-size:15px;line-height:1.45">Пока нет открытых кланов для вступления. Создайте свой или дождитесь, когда появятся кланы других игроков.</div>';
      ui.innerHTML = topbar(t('clans'), 'hub') + '<div class="shop"><div class="paper" style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px;font-weight:700;font-size:16px;line-height:1.45">' +
        '<div>В клане вас ждёт общий <b>клановый босс</b>, <b>прокачка построек клана</b>, <b>роли (Лидер, Офицер, Участник)</b> и <b>награды за активность</b>. При создании клан вмещает <b>10 игроков</b>, а с ростом уровня расширяется (на 10 уровне — до <b>20 игроков</b>).</div>' +
        '<button type="button" class="btn small gold" data-act="clantop20" style="flex:none">Топ-20 кланов</button></div>' +
        emptyNote +
        '<div class="shopgrid">' +
        '<div class="shopcard">' + ART.clanEmblem(MB.defaultEmblem(), 68) + '<b>Свой клан</b><span>Вы станете лидером</span><span>Вместимость: 10 игроков</span>' +
        '<button class="btn small gold" data-act="clancreate" ' + (save.gems < MB.CLAN.createCost ? 'disabled' : '') + '>Создать ' + ic('gem') + MB.CLAN.createCost + '</button></div>' + allCards + '</div></div>';
      applyUILang();
    };
    if (api) {
      fetch(api + '/clans/top').then(r => r.json()).then(data => {
        renderCards(data && data.list ? data.list : []);
      }).catch(() => renderCards([]));
    } else {
      renderCards([]);
    }
  }
  function registerClanBossReward(clan) {
    if (!clan) return;
    clan.bossKillSeq = (clan.bossKillSeq || 0) + 1;
    const id = 'kill_' + clan.bossKillSeq + '_' + Date.now().toString(36);
    if (!Array.isArray(clan.bossRewards)) clan.bossRewards = [];
    clan.bossRewards.push({ id: id, xp: MB.XP.clanKill, cc: MB.CCOIN.clanKill, at: Date.now() });
    if (clan.bossRewards.length > 8) clan.bossRewards = clan.bossRewards.slice(-8);
  }
  function skipExistingClanRewards(clan) {
    if (!clan || !Array.isArray(clan.bossRewards)) return;
    if (!save.clanBossDone || typeof save.clanBossDone !== 'object') save.clanBossDone = {};
    clan.bossRewards.forEach(r => { if (r && r.id) save.clanBossDone[r.id] = true; });
    save.clanBossPending = null;
  }
  function clanRewardState(clan) {
    if (!clan || !Array.isArray(clan.bossRewards)) return null;
    if (!save.clanBossDone || typeof save.clanBossDone !== 'object') save.clanBossDone = {};
    const pending = save.clanBossPending;
    if (pending && pending.id && !save.clanBossDone[pending.id]) return { reward: pending, pending: true };
    const open = clan.bossRewards.find(r => r && r.id && !save.clanBossDone[r.id]);
    return open ? { reward: open, pending: false } : null;
  }
  function showClanXpPicker(reward) {
    const heroes = (save.unlocked || []).filter(k => save.heroes[k]);
    const cards = heroes.map(k =>
      '<button class="btn" data-act="applyclanxp" data-k="' + k + '" style="display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 10px;min-width:90px">' +
        pt(k, '', '', 72) + '<b>' + heroLoc(k, 'name') + '</b><span class="note">Ур. ' + save.heroes[k].lvl + '</span></button>'
    ).join('');
    openModal('<div class="panel win" style="position:relative;width:640px"><button class="x" data-act="close">✕</button><h2 class="out">Награда за босса</h2>' +
      '<div class="paper"><p style="font-weight:700">Выберите героя, который получит <b>' + reward.xp + ' XP</b>.</p>' +
      '<p class="note">Монеты уже начислены. Если закрыть окно, опыт можно будет забрать позже — награда не пропадёт.</p>' +
      '<div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-top:10px">' + cards + '</div></div></div>');
  }
  function showClanHall(tab) {
    if (tab) clanTab = tab;
    const clan = MB.ensureClan(save); if (!clan) return showClans();
    if (MB.net && typeof MB.net.attachContext === 'function') {
      MB.net.attachContext(save, persist);
      if (!showClanHall._unsub && typeof MB.net.subscribe === 'function') {
        showClanHall._unsub = MB.net.subscribe(() => {
          if (scene && scene.mode === 'menu' && save && save.clan && !modal.classList.contains('on') && document.querySelector('.clanwrap')) {
            showClanHall(clanTab);
          }
        });
      }
    }
    scene = { mode: 'menu', bg: 'fon_coliseum' }; BV = null; clock.speed = 1;
    const t = MB.clanTick(save, now()); persist();
    if (t && t.gain) toast('Соклановцы принесли +' + t.gain + ' опыта и +' + t.actGain + ' активности' + (t.ups ? ' — клан вырос до ' + clan.lvl + ' уровня!' : ''));
    const weekTick = MB.clanBossWeekTick(save, now());
    if (weekTick && weekTick.reset) {
      toast('Новая неделя: клановый босс обновлён' + (weekTick.mvp && weekTick.mvp.me && weekTick.bossDefeated ? '. Вы лучший по урону — заберите золотой сундук!' : ''));
    }
    persist();
    const info = MB.clanBossInfo(clan), keys = MB.clanKeys(save); persist();
    const expNeed = MB.CLAN.expFor(clan.lvl), hpPct = Math.max(0, Math.round(100 * clan.bossHp / info.maxHp));
    const totalSparksBon = MB.clanSparksBonus(save);
    const resetTargetMs = (weekTick && weekTick.nextMs) || MB.nextMondayMs(now());
    const resetLeftMs = Math.max(0, resetTargetMs - Date.now());
    const resetLeftStr = MB.formatDuration(resetLeftMs, true, I18N.lang);

    // Список участников (сортировка по силе или по вкладу), роли и вместимость клана
    const myRole = clan.myRole || (clan.own ? 'leader' : 'member');
    const isLeader = myRole === 'leader';
    const isOfficer = myRole === 'officer';
    const canManageApps = isLeader || isOfficer;
    const maxMembers = MB.clanMaxMembers(clan);
    const selfId = save.playerId || '';
    const selfName = (save.name || '').trim().toLowerCase();
    const isSelfMember = m => m && (m.me || m.id === 'me' || (selfId && m.id === selfId) || (selfName && String(m.name || '').trim().toLowerCase() === selfName));
    const otherMembers = (clan.members || []).filter(m => !isSelfMember(m));
    const rawMembers = [{ id: 'me', name: 'Вы', role: myRole, power: MB.accountPower(save), contrib: clan.myContrib || 0, me: true }].concat(otherMembers);
    const members = rawMembers.slice().sort((a, b) => memberSort === 'contrib' ? (b.contrib || 0) - (a.contrib || 0) : b.power - a.power);

    // Вкладки правой панели
    const readyChests = MB.CLAN_CHESTS.filter((ch, i) => !clan.actClaimed[i] && (clan.actPts || 0) >= ch.pts).length;
    const rewDot = readyChests > 0 ? '<span class="dot">' + readyChests + '</span>' : '';
    const buildDot = (clan.pts || 0) > 0 ? '<span class="dot">' + clan.pts + '</span>' : '';

    const bossReward = clanRewardState(clan);
    const mvpPending = !!(save.clanMvpPending && save.clanMvpPending.week && !(save.clanMvpClaimed && save.clanMvpClaimed[save.clanMvpPending.week]));
    const claimBtn = (bossReward || mvpPending)
      ? '<button class="btn small green" data-act="claimbossreward" style="margin-left:auto">Забрать награду' + (mvpPending ? ' ★' : '') + '</button>'
      : '';
    const tabsHtml = '<div class="tabs" style="justify-content:flex-start;margin-bottom:4px">' +
      '<button class="btn small ' + (clanTab === 'boss' ? 'gold' : '') + '" data-act="clantab" data-t="boss">Клановый босс</button>' +
      '<button class="btn small ' + (clanTab === 'builds' ? 'gold' : '') + '" data-act="clantab" data-t="builds" style="position:relative">Прокачка клана' + buildDot + '</button>' +
      '<button class="btn small ' + (clanTab === 'rewards' ? 'gold' : '') + '" data-act="clantab" data-t="rewards" style="position:relative">Награды и вклад' + rewDot + '</button>' +
      claimBtn +
      '<button class="btn small blue" data-act="shoptab" data-t="clan" data-from="clankeys"' + (claimBtn ? '' : ' style="margin-left:auto"') + '>Лавка клана</button>' +
      '</div>';

    let rightBody = '';
    if (clanTab === 'boss') {
      const dmgRows = MB.clanBossDmgLeaders(save);
      const top = dmgRows[0];
      const iAmTop = !!(top && top.me && (top.dmg || 0) > 0);
      const bossDefeated = !!clan.bossDefeatedThisWeek;
      const fightBtn = bossDefeated
        ? '<div class="paper" style="text-align:center;padding:12px"><b style="color:#3f9a24">Босс повержен!</b><div style="margin-top:6px">Следующий босс появится в понедельник</div><div style="margin-top:4px;color:#ffd45e;font-size:18px" id="clan-boss-reset-timer" data-target="' + resetTargetMs + '">' + resetLeftStr + '</div></div>'
        : '<button class="btn ' + (keys ? 'red' : 'gold') + ' clanfight" data-act="' + (keys ? 'clanboss' : 'clanbuykeys') + '">' +
          (keys ? T('В бой с боссом! (1 ключ)', 'Fight the boss! (1 key)') : T('Нет ключей — докупить в лавке', 'No keys — buy in the shop')) +
          '</button>';
      const dmgBoard =
        '<div class="paper clanboss-dmgboard">' +
          '<div class="clanboss-dmghead"><b>' + T('Урон за неделю', 'Weekly damage') + '</b>' +
            '<span class="note">' + T('Сброс в понедельник 00:00 · 1-е место — золотой сундук (если босс повержен)', 'Resets Monday 00:00 · 1st place — golden chest (if boss defeated)') + '</span></div>' +
          '<div class="clanboss-dmglist">' +
            dmgRows.map((r, i) =>
              '<div class="clanboss-dmgrow' + (r.me ? ' me' : '') + '">' +
                '<span class="rank">' + (i === 0 && (r.dmg || 0) > 0 ? '★ ' : '') + (i + 1) + '.</span>' +
                '<span class="name">' + r.name + '</span>' +
                '<span class="dmg">⚔ ' + (r.dmg || 0) + '</span>' +
              '</div>'
            ).join('') +
          '</div>' +
        '</div>';
      rightBody =
        '<div class="clanboss-stage">' +
          '<div class="clanboss-left">' +
            dmgBoard +
            '<div class="paper clanboss-reset">' +
              '<b>' + T('Сброс босса:', 'Boss reset:') + '</b> ' + T('каждый', 'every') + ' <b>' + T('понедельник в 00:00', 'Monday at 00:00') + '</b>' +
              '<div style="margin-top:4px">' + T('До обновления:', 'Until reset:') + ' <b id="clan-boss-reset-timer" style="color:#ffd45e" data-target="' + resetTargetMs + '">' + resetLeftStr + '</b></div>' +
              (mvpPending ? '<div class="note" style="margin-top:6px;color:#3f9a24">★ ' + T('Вам доступен золотой сундук за лучший урон прошлой недели — нажмите «Забрать награду».', 'Golden chest for last week’s top damage is ready — tap “Claim reward”.') + '</div>' : '') +
              (iAmTop && !mvpPending ? '<div class="note" style="margin-top:6px">' + T('Вы лидируете по урону на этой неделе.', 'You lead in damage this week.') + '</div>' : '') +
            '</div>' +
            '<div class="clanboss-keys">' +
              '<img src="assets/ui/key_clan.webp" alt="">' +
              '<div><b>' + T('Ключей:', 'Keys:') + ' ' + keys + '</b><small>' + T('(+2 бесплатно каждый день, ещё — в лавке клана)', '(+2 free every day, more in the clan shop)') + '</small></div>' +
            '</div>' +
          '</div>' +
          '<div class="clanboss-right">' +
            '<div class="clanboss-head">' +
              '<b class="out">' + info.name + '</b>' +
              '<span class="note">' + T('Ур. ', 'Lv. ') + (info.displayLvl || info.lvl) + '</span>' +
            '</div>' +
            '<div class="clanboss-artbox">' +
              '<img src="' + ART.url(info.art) + '" alt="' + info.name + '">' +
              '<div class="hpbar clanboss-hp"><i style="width:' + hpPct + '%"></i><span>' + clan.bossHp + ' / ' + info.maxHp + '</span></div>' +
              fightBtn +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="paper clanboss-info">' +
          '<p>' + T('Урон сохраняется в течение недели. За урон дают', 'Damage carries through the week. Damage grants') + ' <b>' + T('Искры', 'Sparks') + '</b>, <b>' + T('опыт', 'XP') + '</b> ' + T('и', 'and') + ' <b>' + T('очки активности', 'activity points') + '</b>.</p>' +
          '<p>' + T('Каждый бой:', 'Each battle:') + ' <b>+20 XP ' + T('и', 'and') + ' +20 ' + T('клановых монет', 'clan coins') + '</b>.</p>' +
          '<p>' + T('Победа над боссом:', 'Boss victory:') + ' <b>+500 XP ' + T('и', 'and') + ' +400 ' + T('монет', 'coins') + '</b> ' + T('всем соклановцам', 'to all clan members') + '.</p>' +
          '<p>' + T('Игрок с', 'The player with') + ' <b>' + T('наибольшим уроном за неделю', 'the highest weekly damage') + '</b> ' + T('получает', 'gets') + ' <b>' + T('золотой сундук', 'a golden chest') + '</b> ' + T('(1 раз в неделю, только если босс повержен) — забрать вместе с наградой за победу.', '(once per week, only if the boss is defeated) — claim with the victory reward.') + '</p>' +
        '</div>';
    } else if (clanTab === 'builds') {
      const bCards = MB.CLAN_BUILDINGS.map(b => {
        const cur = clan.builds[b.key] || 0, max = MB.CLAN.maxBuildLvl || 20;
        const canUp = isLeader && (clan.pts || 0) > 0 && cur < max;
        const btnLbl = cur >= max
          ? 'Максимум (20 ур.)'
          : !isLeader
            ? 'Только для Лидера'
            : ((clan.pts || 0) <= 0 ? 'Нет очков' : 'Улучшить (1 очко)');
        return '<div class="cbuild">' +
          '<div class="cbuild-head">' +
            '<div style="display:flex;align-items:center;gap:8px"><img class="cbuild-img" src="' + b.img + '" alt="' + b.name + '"><b>' + b.name + '</b></div>' +
            '<span>Ур. ' + cur + ' / ' + max + '</span>' +
          '</div>' +
          '<div class="cbuild-desc">Сейчас: <b>' + b.desc(cur) + '</b>' + (cur < max ? '<br><small>Следующий уровень: ' + b.desc(cur + 1) + '</small>' : '<br><small>Максимальный уровень</small>') + '</div>' +
          '<button type="button" class="btn small ' + (canUp ? 'green' : '') + '" data-act="clanbuildup" data-k="' + b.key + '" ' + (canUp ? '' : 'disabled') + '>' + btnLbl + '</button>' +
        '</div>';
      }).join('');
      rightBody =
        '<div class="paper" style="display:flex;align-items:center;justify-content:space-between">' +
          '<div><b>Очки прокачки клана: <span style="color:#a0660a;font-size:20px">' + (clan.pts || 0) + '</span></b><div class="note">За каждый новый уровень клан получает 1 очко. Лидер может вложить его в постройку (макс. 20 ур.).</div></div>' +
          '<div style="text-align:right"><span class="note">Уровень клана: <b>' + clan.lvl + '</b></span><br><span class="note">Общий бонус Искр: <b>+' + totalSparksBon + '%</b></span></div>' +
        '</div>' +
        '<div class="cbuild-grid">' + bCards + '</div>';
    } else if (clanTab === 'rewards') {
      const maxPts = MB.CLAN_CHESTS[MB.CLAN_CHESTS.length - 1].pts;
      const actPct = Math.min(100, Math.round(100 * (clan.actPts || 0) / maxPts));
      const chestsHtml = MB.CLAN_CHESTS.map((ch, idx) => {
        const done = !!clan.actClaimed[idx];
        const ready = !done && (clan.actPts || 0) >= ch.pts;
        const rewStr = [ch.sparks + ' Искр', ch.ore + ' Руды', ch.cc + ' монет', ch.chest ? (I18N.lang==='en' && CHEST_EN[ch.chest] ? CHEST_EN[ch.chest] : MB.CHESTS[ch.chest].name) : ''].filter(Boolean).join(', ');
        return '<div class="cchest ' + (done ? 'done' : ready ? 'ready' : '') + '">' +
          '<div><b>' + ch.name + '</b> <span class="note">(' + ch.pts + ' очков активности)</span><div class="note">' + rewStr + '</div></div>' +
          '<button class="btn small ' + (ready ? 'green' : '') + '" data-act="clanactclaim" data-i="' + idx + '" ' + (ready ? '' : 'disabled') + '>' + (done ? 'Получено ✔' : ready ? 'Забрать' : (clan.actPts || 0) + '/' + ch.pts) + '</button>' +
        '</div>';
      }).join('');

      const resetMs = MB.lairNextResetMs ? MB.lairNextResetMs(Date.now()) : (Date.now() + 7 * 86400000);
      const rem = Math.max(0, resetMs - Date.now());
      const rd = Math.floor(rem / 86400000) || 0, rh = Math.floor((rem % 86400000) / 3600000) || 0, rm = Math.floor((rem % 3600000) / 60000) || 0;
      const resetTxt = rd + 'д ' + rh + 'ч ' + rm + 'м';
      rightBody =
        '<div class="paper">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;flex-wrap:wrap;gap:6px"><b>Сундуки активности клана за неделю</b><span>Сброс через: <b style="color:#a02a1e">' + resetTxt + '</b></span><span>Очков: <b>' + (clan.actPts || 0) + ' / ' + maxPts + '</b></span></div>' +
          '<div class="expbar"><i style="width:' + actPct + '%"></i><span>' + (clan.actPts || 0) + ' / ' + maxPts + ' очков активности</span></div>' +
          '<div style="display:flex;flex-direction:column;gap:6px;margin-top:8px">' + chestsHtml + '</div>' +
        '</div>' +
        '<div class="paper"><b>Пожертвование в казну</b> <span class="note">— приносит опыт клану и очки активности</span>' +
          '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:6px">' +
            '<button class="btn small blue" data-act="clandonate" data-n="1" ' + (save.ore < MB.CLAN.donateOre ? 'disabled' : '') + '>' + ic('ore') + MB.CLAN.donateOre + ' → +' + MB.CLAN.donateExp + ' опыта · +10 активности</button>' +
            '<button class="btn small blue" data-act="clandonate" data-n="5" ' + (save.ore < MB.CLAN.donateOre * 5 ? 'disabled' : '') + '>' + ic('ore') + (MB.CLAN.donateOre * 5) + ' → +' + (MB.CLAN.donateExp * 5) + ' опыта · +50 активности</button>' +
          '</div></div>' +
        '<div class="paper clan-act-rules">' +
          '<b>Как начисляются очки активности</b>' +
          '<p>Шкала активности и сундуки клана обновляются раз в неделю. Очки активности (и личный вклад) зарабатываются общими усилиями участников:</p>' +
          '<ul>' +
            '<li><b>Атаки на кланового босса:</b> за успешный бой с нанесением урона боссу начисляется +5 очков активности (и +5 к личному вкладу).</li>' +
            '<li><b>Пожертвования руды в казну:</b> взнос ' + MB.CLAN.donateOre + ' руды даёт +10 очков активности (взнос ' + (MB.CLAN.donateOre * 5) + ' руды — +50 очков активности) и продвигает клан к новому уровню.</li>' +
          '</ul>' +
        '</div>';
    }

    ui.innerHTML = topbar('<span class="clan-top-title"><small class="clan-top-lbl">Клан</small><span class="clan-top-name">«' + clan.name + '»</span></span>', 'hub') +
      '<div class="clanwrap">' +
      '<div class="panel clanL">' +
        '<div class="clan-head">' +
          '<div class="clan-emb-box">' + ART.clanEmblem(clan.emblem, 78) + '</div>' +
          '<div style="flex:1">' +
            '<h2 class="out" style="text-align:left;margin:0;font-size:24px">Уровень ' + clan.lvl + ' · <span style="font-size:16px;color:#ffd45e">Ваша роль: ' + (MB.CLAN_ROLE_NAME[myRole] || 'Участник') + '</span></h2>' +
            '<div class="expbar" style="margin:6px 0"><i style="width:' + Math.min(100, Math.round(100 * clan.exp / expNeed)) + '%"></i><span>Опыт: ' + clan.exp + ' / ' + expNeed + '</span></div>' +
            '<div class="note">Бонус к Искрам: <b style="color:#ffd45e">+' + totalSparksBon + '%</b> · Ваш вклад: <b>' + (clan.myContrib || 0) + '</b></div>' +
            (clan.desc ? '<div class="clan-desc-box" title="' + clan.desc.replace(/"/g, '&quot;') + '">' + clan.desc.replace(/</g, '&lt;') + '</div>' : '') + (isLeader ? '<div style="margin-top:5px;display:flex;gap:6px"><button type="button" class="btn small" data-act="claneditdesc" style="min-height:28px;padding:1px 9px;font-size:12px">✎ ' + (clan.desc ? 'Изменить описание' : 'Добавить описание') + '</button><button type="button" class="btn small gold" data-act="clantop" style="min-height:28px;padding:1px 9px;font-size:12px">🏆 Топ кланов</button></div>' : '<div style="margin-top:5px"><button type="button" class="btn small gold" data-act="clantop" style="min-height:28px;padding:1px 9px;font-size:12px">🏆 Топ кланов</button></div>') +
          '</div>' +
        '</div>' +
        '<div class="clan-recruit-bar">' +
          '<span class="note">Приём: <b>' + ((MB.CLAN_RECRUIT[clan.recruit] && MB.CLAN_RECRUIT[clan.recruit].name) || 'Свободный вход') + '</b></span>' +
          (isLeader
            ? '<div class="clan-recruit-btns">' +
                Object.keys(MB.CLAN_RECRUIT).map(rk => {
                  const R = MB.CLAN_RECRUIT[rk];
    applyUILang();
                  return '<button type="button" class="btn small ' + (clan.recruit === rk ? 'gold' : '') + '" data-act="clanrecruit" data-m="' + rk + '" title="' + R.desc + '">' + R.name + '</button>';
                }).join('') +
              '</div>'
            : '') +
        '</div>' +
        (canManageApps && (clan.applicants || []).length
          ? '<div class="paper clan-apps">' +
              '<b style="display:block;margin-bottom:4px">Заявки в клан (' + clan.applicants.length + ')</b>' +
              clan.applicants.map(ap =>
                '<div class="clan-app-row">' +
                  '<span class="clan-app-meta"><b>' + ap.name + '</b> <small>(ур. ' + (ap.level || 1) + ', <span class="app-pwr">' + ic('power') + '</span>' + ap.power + ')</small></span>' +
                  '<div style="display:flex;gap:4px">' +
                    '<button type="button" class="btn small green" data-act="clanappok" data-id="' + ap.id + '">Принять</button>' +
                    '<button type="button" class="btn small red" data-act="clanappno" data-id="' + ap.id + '">Отклонить</button>' +
                  '</div>' +
                '</div>'
              ).join('') +
            '</div>'
          : '') +
        '<div style="display:flex;gap:6px;margin:6px 0">' +
          '<button class="btn small ' + (memberSort === 'power' ? 'gold' : '') + '" data-act="clansort" data-s="power" style="flex:1">По силе</button>' +
          '<button class="btn small ' + (memberSort === 'contrib' ? 'gold' : '') + '" data-act="clansort" data-s="contrib" style="flex:1">По вкладу</button>' +
        '</div>' +
        '<div class="paper clanmembers">' + members.map((m, idx) => {
          const rName = MB.CLAN_ROLE_NAME[m.role] || 'Участник';
          const canKick = !m.me && m.role !== 'leader' && (isLeader || (isOfficer && m.role === 'member'));
          const canRole = isLeader && !m.me && m.role !== 'leader';
          return '<div class="mrow' + (m.me ? ' me' : '') + '" data-act="viewprofile" data-id="' + m.id + '" style="cursor:pointer">' +
            pt(m.avatar || 'viking', '', '', 32) +
            '<div class="m-info"><b>' + (idx + 1) + '. ' + m.name + '</b><span class="m-role role-' + (m.role || 'member') + '">' + rName + '</span></div>' +
            '<div class="m-right">' +
              '<span>' + (memberSort === 'contrib' ? '★ ' + (m.contrib || 0) : ic('power') + m.power) + '</span>' +
              (canRole
                ? '<button type="button" class="btn small ' + (m.role === 'officer' ? 'gold' : 'blue') + ' m-act" data-act="clantoggleoff" data-id="' + m.id + '" title="' + (m.role === 'officer' ? 'Снять роль Офицера' : 'Назначить Офицером') + '">' + (m.role === 'officer' ? 'Снять офицера' : 'Офицер') + '</button>'
                : '') +
              (canKick
                ? '<button type="button" class="btn small red m-act" data-act="clankick" data-id="' + m.id + '" title="Исключить из клана">✕</button>'
                : '') +
            '</div>' +
          '</div>';
        }).join('') + '</div>' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:auto;padding-top:8px">' +
          '<span class="note">Участников: ' + members.length + ' / ' + maxMembers + '</span>' +
          '<button class="btn small red" data-act="clanleave">Покинуть клан</button>' +
        '</div>' +
      '</div>' +
      '<div class="panel clanR">' + tabsHtml + rightBody + '</div></div>';
    startClanBossResetTimer();
  }

  /* ---------- Живой таймер сброса кланового босса (пн 00:00) ---------- */
  let clanBossResetTimerId = 0;
  function stopClanBossResetTimer() {
    if (clanBossResetTimerId) {
      clearInterval(clanBossResetTimerId);
      clanBossResetTimerId = 0;
    }
  }
  function startClanBossResetTimer() {
    stopClanBossResetTimer();
    const el = document.getElementById('clan-boss-reset-timer');
    if (!el) return;
    const tick = () => {
      const node = document.getElementById('clan-boss-reset-timer');
      if (!node || !document.querySelector('.clanwrap')) {
        stopClanBossResetTimer();
        return;
      }
      let target = +node.getAttribute('data-target');
      if (!target || !isFinite(target)) {
        target = MB.nextMondayMs(new Date());
        node.setAttribute('data-target', String(target));
      }
      const left = target - Date.now();
      if (left <= 0) {
        node.textContent = '0м 00с';
        stopClanBossResetTimer();
        // Неделя сменилась — применяем сброс и перерисовываем зал
        if (save && save.clan) {
          const wt = MB.clanBossWeekTick(save, new Date());
          persist();
          if (wt && wt.reset) {
            toast('Новая неделя: клановый босс обновлён' + (wt.mvp && wt.mvp.me ? '. Вы лучший по урону — заберите золотой сундук!' : ''));
          }
          // Небольшая задержка, чтобы toast успел показаться
          setTimeout(() => {
            if (save && save.clan && document.querySelector('.clanwrap')) showClanHall(clanTab);
          }, 80);
        }
        return;
      }
      node.textContent = MB.formatDuration(left, true, I18N.lang);
    };
    tick();
    clanBossResetTimerId = setInterval(tick, 1000);
  }

  /* ---------- Рейтинг ---------- */
  let rateTab = 'power';
  let rateRefreshTimer = 0;
  function pushRating() {
    const cfg = window.MB_NET_CONFIG || {};
    const api = (cfg.apiUrl || '').replace(/\/$/, '');
    if (!api || !save || !save.playerId) return;
    const profile = MB.net && MB.net.getPlayerProfile ? MB.net.getPlayerProfile(save) : { id: save.playerId, name: save.name || 'Вы' };
    const isPlatform = !!(profile.verified || save.authVerified || (save.playerId && !/^plr_/i.test(save.playerId)));
    const heroLevels = Object.fromEntries(MB.HERO_ORDER.filter(k => (save.unlocked || []).includes(k)).map(k => {
      const lvl = (save.heroes[k] && save.heroes[k].lvl) || 1;
      return [k, Math.max(1, Math.min(999, Math.floor(lvl)))];
    }));
    const hash = JSON.stringify(heroLevels);
    if (pushRating._lastHash === hash && pushRating._lastPower === MB.accountPower(save)) return;
    pushRating._lastHash = hash;
    pushRating._lastPower = MB.accountPower(save);
    fetch(api + '/players/upsert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: save.playerId,
        name: save.name || profile.name || 'Игрок',
        power: MB.accountPower(save),
        level: MB.accountLevel(save),
        avatar: save.avatar || 'viking',
        unlocked: save.unlocked || ['viking'],
        heroLevels: heroLevels,
        verified: isPlatform
      })
    }).catch(() => {});
  }
  function showRating(tab) {
    if (tab) rateTab = tab; scene = { mode: 'menu', bg: scene.bg };
    MUSIC.sync('menu'); BV = null;
    if (rateRefreshTimer) { clearInterval(rateRefreshTimer); rateRefreshTimer = 0; }
    const profile = MB.net && MB.net.getPlayerProfile ? MB.net.getPlayerProfile(save) : { id: save.playerId || 'me', name: save.name || 'Вы' };
    const me = { id: profile.id, name: save.name || profile.name || 'Вы', power: MB.accountPower(save), level: MB.accountLevel(save), me: true, verified: !!(profile.verified || save.authVerified), avatar: save.avatar || 'viking', unlocked: save.unlocked || ['viking'] };
    const key = rateTab === 'power' ? 'power' : 'level';
    const cfg = window.MB_NET_CONFIG || {};
    const api = (cfg.apiUrl || '').replace(/\/$/, '');
    const drawList = (serverList) => {
      const others = (serverList || []).filter(p => p && p.id && p.id !== me.id).map(p => ({
        id: p.id, name: p.name || 'Игрок', power: p.power || 0, level: p.level || 0, me: false, verified: true,
        avatar: p.avatar || 'viking', unlocked: p.unlocked || ['viking']
      }));
      const bots = (MB.ratingBots() || []).filter(p => p && p.id && !others.some(o => o.id === p.id));
      const list = others.concat(bots).concat([me]).sort((a, b) => b[key] - a[key] || (a.me ? -1 : 1));
      const pos = list.findIndex(p => p.me) + 1;
      const posText = pos > 0 && pos <= 100 ? ('Вы на ' + pos + '-м месте из ' + list.length) : 'Вы вне топ-100';
      const row = (p, i) => '<div class="rrow ' + (p.me ? 'me' : '') + '" data-act="viewprofile" data-id="' + p.id + '" style="cursor:pointer">' +
        '<span class="rn">' + (i < 3 ? '<img src="assets/ui/medal_' + ['gold','silver','bronze'][i] + '.png" style="width:44px;height:44px;vertical-align:middle">' : i + 1) + '</span>' +
        pt(p.avatar || 'viking', '', '', 36) +
        '<b>' + p.name + '</b><span>' + ic('power') + p.power + '</span><span>Ур. ' + p.level + '</span></div>';
      ui.innerHTML = topbar(t('rating'), null) + '<div class="rate"><div class="panel" style="position:relative"><button class="x" data-act="hub" title="' + t('close') + '">✕</button><div class="tabs" style="margin-bottom:10px"><button class="btn small ' + (rateTab === 'power' ? 'gold' : '') + '" data-act="ratetab" data-t="power">' + t('by_power') + '</button><button class="btn small ' + (rateTab === 'level' ? 'gold' : '') + '" data-act="ratetab" data-t="level">' + t('by_level') + '</button></div>' +
        '<div class="paper ratelist">' + list.slice(0, 100).map((p, i) => row(p, i)).join('') + '</div>' +
        '<p class="note out" style="margin-top:8px">Сила аккаунта — сумма силы всех ваших героев, уровень — сумма их уровней. ' + posText + '.</p></div></div>';
      applyUILang();
    };
    const fetchRating = () => {
      if (api) {
        fetch(api + '/rating?by=' + key + '&limit=100').then(r => r.json()).then(data => {
          drawList(data && data.list ? data.list : []);
        }).catch(() => drawList([]));
      } else {
        drawList([]);
      }
    };
    pushRating();
    fetchRating();
    rateRefreshTimer = setInterval(fetchRating, 10000);
  }
  setInterval(pushRating, 45000);

  /* ---------- Действия ---------- */
  const ACT = {
    togglemusic: () => {
      save.musicMuted = !save.musicMuted;
      if (!save.musicMuted && !(save.musicVol > 0)) save.musicVol = 0.3;
      MUSIC.setVolume(save.musicVol != null ? save.musicVol : 0.3);
      MUSIC.setMuted(!!save.musicMuted);
      persist();
      if (modal && modal.classList.contains('on')) showSettings();
      else refreshTop();
      toast(save.musicMuted ? t('toast_music_off') : t('toast_music_on'));
    },
    togglesfx: () => {
      save.sfxMuted = !save.sfxMuted;
      if (!save.sfxMuted && !(save.sfxVol > 0)) save.sfxVol = 0.2;
      SFX.setVolume(save.sfxVol != null ? save.sfxVol : 0.2);
      SFX.setMuted(!!save.sfxMuted);
      persist();
      if (modal && modal.classList.contains('on')) showSettings();
      toast(save.sfxMuted ? t('toast_sfx_off') : t('toast_sfx_on'));
      if (!save.sfxMuted) SFX.play('ui_click', 0.55);
    },
    setlang: (d) => {
      const next = (d && d.l === 'en') ? 'en' : 'ru';
      save.lang = next;
      I18N.setLang(next);
      persist();
      toast(next === 'en' ? t('toast_lang_en') : t('toast_lang_ru'));
      refreshAfterLang();
    },
    settings: () => showSettings(),
    hub: () => { if (rateRefreshTimer) { clearInterval(rateRefreshTimer); rateRefreshTimer = 0; } showHub(); }, campaign: () => showCampaign(), heroes: () => { showHeroes.back = 'hub'; showHeroes(); },
    lair: () => {
      if (!save.bosses[1]) {
        toast(T('Логово боссов откроется после прохождения 1-й главы (победа над боссом).', 'Boss Lair unlocks after clearing chapter 1 (defeat the boss).'));
        return;
      }
      showLair();
    },
    daily: showDaily, close: closeModal,
    profile: () => showProfile(),
    setavatar: d => { if (save.unlocked.indexOf(d.k) < 0) return; save.avatar = d.k; persist(); refreshHubAvatar(); showProfile(); },
    setname: () => {
      const inp = $('#nick');
      const raw = inp ? inp.value : '';
      const clean = (MB.net && MB.net.sanitizeName) ? MB.net.sanitizeName(raw) : String(raw || '').trim().slice(0, 16);
      if (clean.length < 2 || clean.length > 16) { toast('Имя должно быть от 2 до 16 символов'); return; }
      if (/^(bot|npc|test|admin|null|undefined|guest|гость)$/i.test(clean)) { toast('Это имя недоступно'); return; }
      save.name = clean;
      if (MB.net && MB.net.getPlayerProfile) MB.net.getPlayerProfile(save);
      persist(); closeModal(); showHub(); toast('Добро пожаловать, ' + clean + '!');
    },
    chapter: d => { if (!chOpen(+d.ch)) return; showCampaign(+d.ch); },
    stage: d => { const p = save.progress[campCh] || 0; if (+d.st > p + 1) { toast('Сначала пройдите предыдущий уровень'); return; } openPrep({ type: 'stage', ch: campCh, st: +d.st }); },
    boss: () => { const p = save.progress[campCh] || 0; if (!save.bosses[campCh] && p < 10) { toast('Босс откроется после 10-го уровня'); return; } openPrep({ type: 'boss', ch: campCh }); },
    campteam: () => { showTeam.back = 'campaign'; showTeam(); },
    campheroes: () => { showHeroes.back = 'campaign'; showHeroes(); },
    lairfight: d => openPrep({ type: 'lair', ch: +d.ch, diff: +d.d }),
    pick: d => { const i = save.team.indexOf(d.k); if (i >= 0) { if (save.team.length > 1) save.team.splice(i, 1); } else if (save.team.length < 3) save.team.push(d.k); else toast('В отряде уже 3 героя — сначала уберите одного'); openPrep(prep); },
    colpick: d => { if (!prep || prep.type !== 'col' || save.unlocked.indexOf(d.k) < 0) return; prep.hero = d.k; openPrep(prep); },
    fight: () => { if (prep.type === 'clan') { if (!MB.spendClanKey(save)) { toast('Нет ключей кланового босса — 2 новых дадут завтра, ещё можно купить в клановом магазине'); return; } prep.bossHp0 = save.clan.bossHp; persist(); startBattle(prep); return; } if (!MB.spendEnergy(save, Date.now())) { showEnergy(true); return; } persist(); startBattle(prep); },
    energy: () => showEnergy(false), drink: d => { if (save.potions[d.p] > 0) { save.potions[d.p]--; save.energy.val += MB.POTIONS[d.p].amt; SFX.play('potion_drink', 0.76); persist(); toast('+' + MB.POTIONS[d.p].amt + T(' энергии', ' energy')); refreshTop(); showEnergy(showEnergy.need); } },
    shop: () => { showShop.back = 'hub'; showShop(); },
    shoptab: d => { if (d.from === 'clankeys') showShop.back = 'clans'; showShop(d.t); }, coliseum: () => { if (!MB.coliseumOpen(save)) { toast('Колизей откроется после победы над боссом главы ' + MB.COLISEUM.needBoss + ' и ' + MB.COLISEUM.needLvl + '-го уровня любого героя'); return; } showColiseum(); },
    colfight: d => {
      const f = +d.f;
      if (f <= (save.col && save.col.best || 0)) { toast(T('Эта арена уже пройдена', 'This arena is already cleared')); return; }
      if (f > (save.col && save.col.best || 0) + 1) { toast(T('Сначала пройдите предыдущую арену', 'Clear the previous arena first')); return; }
      openPrep({ type: 'col', ch: 5, f: f });
    }, rating: () => showRating(), ratetab: d => showRating(d.t),
    viewprofile: d => {
      const id = d.id;
      if (!id) return;
      const cfg = window.MB_NET_CONFIG || {};
      const api = (cfg.apiUrl || '').replace(/\/$/, '');
      const showProf = (p) => {
        if (!p) { toast('Профиль не найден'); return; }
        const heroes = (p.unlocked || []).map(k => {
          const heroLvl = (p.heroLevels && p.heroLevels[k]) || 1;
          return '<div style="display:inline-block;margin:6px;text-align:center;vertical-align:top">' + pt(k, '', '<b>' + heroLvl + '</b>', 56) + '<br><span style="font-size:12px">' + heroLoc(k, 'name') + '</span></div>';
        }).join('');
        openModal('<div class="panel win" style="width:420px;position:relative"><button class="x" data-act="close">✕</button><h2 class="out">' + (p.name || 'Игрок') + '</h2><div class="paper" style="text-align:center">' +
          '<div style="margin-bottom:8px">' + pt(p.avatar || 'viking', '', '<b>' + (p.level || 1) + '</b>', 64) + '</div>' +
          '<p style="margin:6px 0;font-size:15px"><b>Уровень:</b> ' + (p.level || 1) + '</p>' +
          '<p style="margin:6px 0;font-size:15px">⭐ ' + (p.power || 0) + '</p>' +
          '<p style="font-weight:700;margin:10px 0 6px">Герои (' + (p.unlocked || []).length + ')</p>' +
          '<div style="line-height:1.2">' + (heroes || '<span class="note">Нет данных</span>') + '</div></div></div>');
      };
      if (id === save.playerId) {
        showProf({ name: save.name, level: MB.accountLevel(save), power: MB.accountPower(save), avatar: save.avatar, unlocked: save.unlocked, heroLevels: Object.fromEntries(MB.HERO_ORDER.filter(k => (save.unlocked || []).includes(k)).map(k => {
        const lvl = (save.heroes[k] && save.heroes[k].lvl) || 1;
        return [k, Math.max(1, Math.min(999, Math.floor(lvl)))];
      })) });
        return;
      }
      if (api) {
        fetch(api + '/players/profile?id=' + encodeURIComponent(id)).then(r => r.json()).then(data => {
          showProf(data && data.profile);
        }).catch(() => toast('Ошибка загрузки профиля'));
      }
    },
    elixir: d => elixirConfirm(d.from),
    elixirbuy: () => { if (!MB.buyEnergyElixir(save, Date.now())) { closeModal(); return; } SFX.play('energy_elixir', 0.8); persist(); refreshTop(); toast('Максимум энергии: ' + MB.energyMax(save)); if (elixirConfirm.from === 'modal') showEnergy(showEnergy.need); else showShop(); },
    elixircancel: () => { if (elixirConfirm.from === 'modal') showEnergy(showEnergy.need); else closeModal(); },
    confirmbuy: () => { const d = buyReal.d; SFX.play('purchase', 0.76); if (d.hero) { if (save.unlocked.indexOf(d.hero) < 0) { save.unlocked.push(d.hero); setTimeout(() => SFX.play('hero_unlock', 0.84), 220); } toast(heroLoc(d.hero, 'full') + ' в вашем отряде!'); } else { save.gems += MB.SHOP.gems[+d.g].gems; setTimeout(() => SFX.play('gem_gain', 0.74), 180); toast('+' + MB.SHOP.gems[+d.g].gems + ' Изумрудов'); } persist(); closeModal(); showShop(); },
    bioshop: d => showBio(d.k),
    clans: () => {
      if (!save.bosses[4]) {
        toast(T('Кланы откроются после прохождения 4-й главы (победа над боссом).', 'Clans unlock after clearing chapter 4 (defeat the boss).'));
        return;
      }
      if (save.clan) showClanHall(); else showClans();
    },
    clantab: d => showClanHall(d.t),
    clansort: d => { memberSort = d.s; showClanHall(); },
    clanjoinreal: d => {
      if (save.clan) { toast('Вы уже в клане'); return; }
      const clanId = d.id, clanName = d.name || 'Клан';
      save.clan = MB.mkClan(save, clanName, false, 1, null, '', 'axes_red', 'free');
      save.clan.id = clanId;
      if (MB.net && MB.net.getPlayerProfile) {
        const p = MB.net.getPlayerProfile(save);
        if (p && p.id) {
          save.clan.members = [{ id: p.id, name: p.name || save.name || 'Игрок', power: p.power || 0, role: 'member', contrib: 0, bossDmg: 0, verified: !!p.verified }];
        }
      }
      persist(); showClanHall(); toast('Вы вступили в клан «' + clanName + '»');
    },
    clanjoin: d => {
      if (MB.net && MB.net.isRemote && MB.net.isRemote() && MB.net.canJoinCompetitive && !MB.net.canJoinCompetitive(save)) {
        toast('Для вступления в клан на площадке нужен вход через аккаунт');
        return;
      }
      const idx = +d.i, c = MB.CLAN_NPC[idx]; if (!c || save.clan) return;
      const rec = c.recruit || 'free';
      if (rec === 'closed') { toast('Клан «' + c.name + '» отклоняет заявки на вступление'); return; }
      if (rec === 'apply') {
        save.clanApps = save.clanApps || {};
        save.clanApps[idx] = true;
        persist(); showClans();
        toast('Заявка в клан «' + c.name + '» отправлена');
        return;
      }
      const npcIcons2 = (MB.CLAN_ICONS && MB.CLAN_ICONS.length) ? MB.CLAN_ICONS : [{ id: 'axes_red' }];
      save.clan = MB.mkClan(save, c.name, false, c.lvl, c.emblem, '', c.icon || npcIcons2[idx % npcIcons2.length].id, rec);
      skipExistingClanRewards(save.clan);
      persist(); showClanHall(); toast('Вы вступили в клан «' + c.name + '»');
    },
    clancreate: () => showEmblemEditor('create'),
    clantop: () => {
      const cfg = window.MB_NET_CONFIG || {};
      const api = (cfg.apiUrl || '').replace(/\/$/, '');
      if (!api) { toast('Сервер недоступен'); return; }
      fetch(api + '/clans/top').then(r => r.json()).then(data => {
        const list = (data && data.list) || [];
        if (!list.length) { toast('Пока нет кланов'); return; }
        const rows = list.map((c, i) => {
          const emblem = c.emblem ? ART.clanEmblem(c.emblem, 28) : '<span style="width:28px;height:28px;display:inline-block"></span>';
          return '<div class="rrow" style="gap:10px"><span class="rn">' + (i + 1) + '</span>' + emblem + '<b style="min-width:100px">' + (c.name || 'Клан') + '</b><span>Ур. ' + (c.lvl || 1) + '</span><span>Сила: ' + (c.power || 0) + '</span><span>' + (c.members || 0) + ' уч.</span></div>';
        }).join('');
        openModal('<div class="panel win" style="position:relative;width:480px"><button class="x" data-act="close">✕</button><h2 class="out">Топ кланов</h2><div class="paper ratelist">' + rows + '</div></div>');
      }).catch(() => toast('Ошибка загрузки'));
    },
    claneditdesc: () => {
      const c = MB.ensureClan(save); if (!c) return;
      const myRole = c.myRole || (c.own ? 'leader' : 'member');
      if (myRole !== 'leader') { toast('Менять описание клана может только Лидер'); return; }
      const curDesc = String(c.desc || '').slice(0, 200);
      openModal('<div class="panel win" style="position:relative;width:620px"><button class="x" data-act="close">✕</button>' +
        '<h2 class="out">Описание клана</h2>' +
        '<div class="paper">' +
          '<div><b>Описание клана</b> <span class="note" id="clandesc-cnt">(' + curDesc.length + '/200, любые символы)</span>' +
          '<textarea id="clandesc" class="claninput clan-desc-inp" maxlength="200" rows="3" placeholder="Расскажите о вашем клане...">' + curDesc.replace(/</g, '&lt;') + '</textarea></div>' +
        '</div>' +
        '<div class="foot">' +
          '<button type="button" class="btn green" data-act="clansavedesc">Сохранить</button>' +
          '<button type="button" class="btn" data-act="close">Отмена</button>' +
        '</div></div>');
      const descInp = $('#clandesc');
      if (descInp) {
        descInp.focus();
        descInp.addEventListener('input', () => {
          const sliced = descInp.value.slice(0, 200);
          if (descInp.value !== sliced) descInp.value = sliced;
          const cnt = $('#clandesc-cnt');
          if (cnt) cnt.textContent = '(' + descInp.value.length + '/200, любые символы)';
        });
      }
    },
    clansavedesc: () => {
      const c = MB.ensureClan(save); if (!c) return;
      const myRole = c.myRole || (c.own ? 'leader' : 'member');
      if (myRole !== 'leader') { toast('Менять описание клана может только Лидер'); return; }
      const descEl = $('#clandesc');
      c.desc = MB.sanitizeClanDesc(descEl ? descEl.value : '');
      persist(); closeModal(); showClanHall();
      toast('Описание клана обновлено');
    },
    emblemEdit: () => { toast('Герб выбирается только при создании клана и больше не меняется'); },
    embopt: d => {
      if (!embDraft) return;
      const savedName = ($('#clanname') && $('#clanname').value) || '';
      const savedDesc = ($('#clandesc') && $('#clandesc').value) || '';
      embDraft[d.k] = d.v;
      renderEmblemModal();
      const nEl = $('#clanname'); if (nEl && savedName) nEl.value = savedName.replace(/[^A-Za-zА-Яа-яЁё +\-]/g, '').replace(/\s{2,}/g, ' ').slice(0, 20);
      const dEl = $('#clandesc'); if (dEl && savedDesc) { dEl.value = savedDesc.slice(0, 200); const cEl = $('#clandesc-cnt'); if (cEl) cEl.textContent = '(' + dEl.value.length + '/200, любые символы)'; }
    },
    embsave: () => { toast('Герб клана нельзя изменить после создания'); },
    clancreateok: () => {
      console.log('clancreateok called, gems:', save.gems, 'clan:', !!save.clan, 'cost:', MB.CLAN.createCost);
      if (MB.net && MB.net.isRemote && MB.net.isRemote() && MB.net.canJoinCompetitive && !MB.net.canJoinCompetitive(save)) {
        toast('Для создания клана на площадке нужен вход через аккаунт');
        return;
      }
      const el = $('#clanname'), descEl = $('#clandesc');
      console.log('name input:', el ? el.value : 'no element');
      const chk = MB.validateClanName(el ? el.value : '');
      if (!chk.ok) { toast(chk.reason); return; }
      const desc = MB.sanitizeClanDesc(descEl ? descEl.value : '');
      if (save.gems < MB.CLAN.createCost) { toast('Недостаточно изумрудов'); return; }
      if (save.clan) { toast('Вы уже состоите в клане'); return; }
      save.gems -= MB.CLAN.createCost;
      const iconId = (embDraft && embDraft.icon) || 'axes_red';
      save.clan = MB.mkClan(save, chk.value, true, 1, embDraft, desc, iconId);
      save.clan.id = 'clan_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
      console.log('clan created:', save.clan.name, save.clan.id);
      const cfg = window.MB_NET_CONFIG || {};
      const api = (cfg.apiUrl || '').replace(/\/$/, '');
      const finishCreate = () => {
        if (MB.net && MB.net.getPlayerProfile) {
          const p = MB.net.getPlayerProfile(save);
          if (p && p.id) {
            save.clan.members = [{ id: p.id, name: p.name || save.name || 'Игрок', power: p.power || 0, role: 'leader', contrib: 0, bossDmg: 0, verified: !!p.verified }];
          }
        }
        skipExistingClanRewards(save.clan);
        persist(); closeModal(); showClanHall(); toast('Клан «' + chk.value + '» создан!');
      };
      if (api) {
        fetch(api + '/clans/' + encodeURIComponent(save.clan.id) + '/rename', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: chk.value, emblem: embDraft })
        }).then(() => finishCreate()).catch(() => finishCreate());
      } else {
        finishCreate();
      }
    },
    clanboss: () => { 
      if (!save.clan) return; 
      if (save.clan.bossDefeatedThisWeek) { toast('Босс уже повержен на этой неделе'); return; }
      if (!MB.clanKeys(save)) { ACT.clanbuykeys(); return; } 
      openPrep({ type: 'clan', ch: MB.topChapter(save) }); 
    },
    clanbuykeys: () => {
      const keyItem = (MB.CLAN_SHOP || []).find(x => x.kind === 'key');
      const price = keyItem ? keyItem.gems : 50;
      const curKeys = MB.clanKeys(save);
      openModal('<div class="panel win" style="position:relative;width:580px"><button class="x" data-act="close">✕</button><h2 class="out">Нет ключей босса</h2>' +
        '<div class="paper" style="text-align:center;font-weight:700;font-size:18px;line-height:1.45">' +
          '<p>У вас закончились ключи для боя с клановым боссом (осталось: <b>' + curKeys + '</b>).</p>' +
          '<p style="margin-top:8px">Вы можете перейти в <b>Лавку клана</b> и докупить ключ за ' + ic('gem').replace('<svg ', '<svg style="width:20px;height:20px;vertical-align:-4px;display:inline-block" ').replace('width="64" height="64"', 'width="20" height="20"') + '<b>' + price + '</b> или дождаться бесплатного пополнения завтра (+2 ключа).</p>' +
        '</div>' +
        '<div class="foot">' +
          '<button class="btn gold" data-act="shoptab" data-t="clan" data-from="clankeys">Перейти в Лавку клана</button>' +
          '<button class="btn" data-act="close">Закрыть</button>' +
        '</div></div>');
    },
    clandonate: d => {
      const n = +d.n, cost = MB.CLAN.donateOre * n; if (!save.clan || save.ore < cost) return;
      save.ore -= cost;
      const ups = MB.clanAddExp(save, MB.CLAN.donateExp * n);
      MB.clanAddActivity(save, 10 * n, 10 * n);
      MB.clanTaskProgress(save, 'donate', cost);
      persist(); showClanHall();
      toast('Клан получил +' + (MB.CLAN.donateExp * n) + ' опыта и +' + (10 * n) + ' активности' + (ups ? ' — уровень ' + save.clan.lvl + '!' : ''));
      const cfg = window.MB_NET_CONFIG || {};
      const api = (cfg.apiUrl || '').replace(/\/$/, '');
      if (api && save.clan.id) {
        fetch(api + '/clans/' + encodeURIComponent(save.clan.id) + '/donate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ player: { id: save.playerId, name: save.name }, count: n })
        }).catch(() => {});
      }
    },
    clanbuildup: d => {
      const c = MB.ensureClan(save); if (!c) return;
      const myRole = c.myRole || (c.own ? 'leader' : 'member');
      if (myRole !== 'leader') { toast('Улучшать постройки клана может только Лидер'); return; }
      if (MB.net && MB.net.submitClanBuildUpgrade) {
        MB.net.submitClanBuildUpgrade(save, d.k, persist).then(ok => {
          if (ok) { showClanHall('builds'); toast('Постройка клана улучшена!'); }
          else toast('Недостаточно очков или ошибка сервера');
        });
        return;
      }
      if (!MB.clanUpgradeBuild(save, d.k)) { toast('Недостаточно очков прокачки или достигнут максимум (20 ур.)'); return; }
      persist(); showClanHall('builds'); toast('Постройка клана улучшена!');
    },
    claimbossreward: () => {
      const clan = save.clan; if (!clan) return;
      MB.clanBossWeekTick(save, now());
      const st = clanRewardState(clan);
      const mvp = save.clanMvpPending;
      const mvpOk = !!(mvp && mvp.week && !(save.clanMvpClaimed && save.clanMvpClaimed[mvp.week]));
      if (!st && !mvpOk) { toast('Награда уже получена'); return; }

      // Золотой сундук лучшему по урону за неделю (раз в неделю)
      let mvpNote = '';
      if (mvpOk) {
        if (!save.clanMvpClaimed || typeof save.clanMvpClaimed !== 'object') save.clanMvpClaimed = {};
        save.clanMvpClaimed[mvp.week] = true;
        const it = grantChest(MB.topChapter(save), 'gold');
        mvpNote = ' Золотой сундук за лучший урон недели: ' + MB.itemName(it, 'viking') + '!';
        save.clanMvpPending = null;
        SFX.play('chest_open_gold', 0.78);
      }

      if (st) {
        const r = st.reward;
        if (!save.clanBossPending || save.clanBossPending.id !== r.id) {
          if (save.clanBossDone && save.clanBossDone[r.id]) {
            if (mvpNote) { persist(); toast(mvpNote.trim()); showClanHall(); }
            return;
          }
          save.ccoin = (save.ccoin || 0) + (r.cc || MB.CCOIN.clanKill);
          save.clanBossPending = { id: r.id, xp: r.xp || MB.XP.clanKill, coinsGiven: true, mvpNote: mvpNote };
          persist();
          toast('+' + (r.cc || MB.CCOIN.clanKill) + ' клановых монет.' + mvpNote + ' Выберите героя для опыта.');
        } else if (mvpNote) {
          save.clanBossPending.mvpNote = (save.clanBossPending.mvpNote || '') + mvpNote;
          persist();
        }
        showClanXpPicker(save.clanBossPending);
      } else {
        persist();
        toast(mvpNote.trim() || 'Награда получена');
        showClanHall();
      }
    },
    applyclanxp: d => {
      const p = save.clanBossPending;
      if (!p || !p.id || (save.clanBossDone && save.clanBossDone[p.id])) { closeModal(); return; }
      const k = d.k;
      if (!k || !save.heroes[k] || (save.unlocked || []).indexOf(k) < 0) return;
      if (!save.clanBossDone || typeof save.clanBossDone !== 'object') save.clanBossDone = {};
      save.clanBossDone[p.id] = true;
      const ups = MB.grantXp(save, [k], p.xp || MB.XP.clanKill);
      const mvpExtra = p.mvpNote || '';
      save.clanBossPending = null;
      persist();
      closeModal();
      const upTxt = ups.length ? (' ' + heroLoc(k, 'name') + ' достиг ' + ups[0].to + ' уровня!') : '';
      toast(heroLoc(k, 'name') + ' получил ' + (p.xp || MB.XP.clanKill) + ' XP.' + upTxt + mvpExtra);
      showClanHall();
    },
    clanactclaim: d => {
      const idx = +d.i, c = MB.ensureClan(save), ch = MB.CLAN_CHESTS[idx];
      if (!c || !ch || c.actClaimed[idx] || (c.actPts || 0) < ch.pts) return;
      c.actClaimed[idx] = true;
      save.sparks += ch.sparks; save.ore += ch.ore; save.ccoin = (save.ccoin || 0) + ch.cc;
      let extra = '';
      if (ch.chest) { const it = grantChest(MB.topChapter(save), ch.chest); extra = ', ' + MB.itemName(it, 'viking'); }
      persist(); showClanHall('rewards');
      toast('Награда: +' + ch.sparks + ' Искр, +' + ch.ore + ' Руды, +' + ch.cc + ' монет' + extra);
    },
    clanrecruit: d => {
      const c = MB.ensureClan(save); if (!c) return;
      const myRole = c.myRole || (c.own ? 'leader' : 'member');
      if (myRole !== 'leader') { toast('Менять режим приёма может только лидер клана'); return; }
      if (!MB.CLAN_RECRUIT[d.m]) return;
      c.recruit = d.m;
      if (d.m === 'closed' && Array.isArray(c.applicants) && c.applicants.length) {
        c.applicants = [];
      }
      persist(); showClanHall();
      toast('Режим приёма: «' + MB.CLAN_RECRUIT[d.m].name + '»');
    },
    clanappok: d => {
      const c = MB.ensureClan(save); if (!c) return;
      const myRole = c.myRole || (c.own ? 'leader' : 'member');
      if (myRole !== 'leader' && myRole !== 'officer') { toast('Недостаточно прав'); return; }
      const maxM = MB.clanMaxMembers(c);
      const curM = 1 + (c.members ? c.members.length : 0);
      if (curM >= maxM) { toast('Достигнут лимит участников клана (' + maxM + ')'); return; }
      const idx = (c.applicants || []).findIndex(a => a.id === d.id);
      if (idx < 0) return;
      const ap = c.applicants.splice(idx, 1)[0];
      c.members.push({ id: ap.id, name: ap.name, power: ap.power, role: 'member', contrib: 0 });
      persist(); showClanHall();
      toast('Игрок ' + ap.name + ' принят в клан');
    },
    clanappno: d => {
      const c = MB.ensureClan(save); if (!c) return;
      const myRole = c.myRole || (c.own ? 'leader' : 'member');
      if (myRole !== 'leader' && myRole !== 'officer') { toast('Недостаточно прав'); return; }
      const idx = (c.applicants || []).findIndex(a => a.id === d.id);
      if (idx < 0) return;
      const ap = c.applicants.splice(idx, 1)[0];
      persist(); showClanHall();
      toast('Заявка игрока ' + ap.name + ' отклонена');
    },
    clantoggleoff: d => {
      const c = MB.ensureClan(save); if (!c) return;
      const myRole = c.myRole || (c.own ? 'leader' : 'member');
      if (myRole !== 'leader') { toast('Назначать и снимать офицеров может только лидер клана'); return; }
      const m = (c.members || []).find(x => x.id === d.id);
      if (!m || m.role === 'leader') return;
      m.role = m.role === 'officer' ? 'member' : 'officer';
      persist(); showClanHall();
      toast(m.role === 'officer' ? (m.name + ' назначен офицером') : ('С игрока ' + m.name + ' снята роль офицера'));
    },
    clanmakeleader: d => {
      const c = MB.ensureClan(save); if (!c) return;
      const myRole = c.myRole || (c.own ? 'leader' : 'member');
      if (myRole !== 'leader') { toast('Передавать статус лидера может только лидер клана'); return; }
      const target = (c.members || []).find(m => m.id === d.id);
      if (!target || target.role === 'leader') return;
      c.members.push({ id: 'me_prev_' + Date.now(), name: 'Вы', power: MB.accountPower(save), role: 'officer', contrib: c.myContrib || 0 });
      target.role = 'leader';
      c.myRole = 'officer';
      c.own = false;
      persist(); showClanHall();
      toast('Статус лидера передан игроку ' + target.name + '. Ваша роль: Офицер');
    },
    clantop20: () => {
      const cfg = window.MB_NET_CONFIG || {};
      const api = (cfg.apiUrl || '').replace(/\/$/, '');
      if (!api) { toast('Сервер недоступен'); return; }
      fetch(api + '/clans/top').then(r => r.json()).then(data => {
        const list = (data && data.list) || [];
        if (!list.length) { toast('Пока нет кланов'); return; }
        const rows = list.map((c, i) => {
          const emblem = c.emblem ? ART.clanEmblem(c.emblem, 32) : '<span style="width:32px;height:32px;display:inline-block"></span>';
          return '<div class="rrow" style="gap:10px"><span class="rn">' + (i < 3 ? '<img src="assets/ui/medal_' + ['gold','silver','bronze'][i] + '.png" style="width:44px;height:44px;vertical-align:middle">' : (i + 1)) + '</span>' + emblem + '<b style="min-width:100px">' + (c.name || 'Клан') + '</b><span>Ур. ' + (c.lvl || 1) + '</span><span>Сила: ' + (c.power || 0) + '</span><span>' + (c.members || 0) + ' уч.</span></div>';
        }).join('');
        openModal('<div class="panel win" style="position:relative;width:600px"><button class="x" data-act="close">✕</button><h2 class="out">Топ-20 кланов по силе</h2><div class="paper ratelist">' + rows + '</div><div class="foot"><button class="btn green" data-act="close">Закрыть</button></div></div>');
      }).catch(() => toast('Ошибка загрузки'));
    },
    clankick: d => {
      const c = MB.ensureClan(save); if (!c) return;
      const myRole = c.myRole || (c.own ? 'leader' : 'member');
      const idx = (c.members || []).findIndex(x => x.id === d.id);
      if (idx < 0) return;
      const target = c.members[idx];
      if (target.role === 'leader') { toast('Нельзя исключить лидера клана'); return; }
      if (myRole === 'leader') {
        c.members.splice(idx, 1);
        persist(); showClanHall();
        toast(target.name + ' исключён из клана');
      } else if (myRole === 'officer') {
        if (target.role !== 'member') { toast('Офицер может исключать только обычных участников'); return; }
        c.members.splice(idx, 1);
        persist(); showClanHall();
        toast(target.name + ' исключён из клана');
      } else {
        toast('Недостаточно прав для исключения игроков');
      }
    },
    clanleave: () => {
      const c = MB.ensureClan(save); if (!c) return;
      const myRole = c.myRole || (c.own ? 'leader' : 'member');
      if (myRole === 'leader') {
        const candidates = (c.members || []).filter(m => m.id !== 'me' && m.id !== save.playerId);
        if (!candidates.length) {
          openModal('<div class="panel win" style="position:relative;width:560px"><button class="x" data-act="close">✕</button><h2 class="out">Распустить клан?</h2>' +
            '<div class="paper" style="text-align:center;font-weight:700">Вы единственный участник клана «' + c.name + '».<br>Распустить клан и выйти?</div>' +
            '<div class="foot"><button class="btn red" data-act="clandisband" style="min-width:140px">Распустить</button><button class="btn" data-act="close" style="min-width:140px">Отмена</button></div></div>');
          return;
        }
        const candHtml = candidates.map(m =>
          '<div class="clan-app-row">' +
            '<span><b>' + m.name + '</b> <small>(' + (MB.CLAN_ROLE_NAME[m.role] || 'Участник') + ', ' + ic('power') + m.power + ')</small></span>' +
            '<button type="button" class="btn small gold" data-act="clanpassleaveask" data-id="' + m.id + '">Передать и выйти</button>' +
          '</div>'
        ).join('');
        openModal('<div class="panel win" style="position:relative;width:600px"><button class="x" data-act="close">✕</button><h2 class="out">Передайте статус лидера</h2>' +
          '<div class="paper" style="font-weight:700"><p style="margin-bottom:8px">Лидер не может покинуть клан, пока не передаст статус лидера другому участнику:</p>' +
          '<div style="display:flex;flex-direction:column;gap:4px;max-height:260px;overflow-y:auto">' + candHtml + '</div></div>' +
          '<div class="foot"><button class="btn" data-act="close">Отмена</button></div></div>');
        return;
      }
      openModal('<div class="panel win" style="position:relative;width:560px"><button class="x" data-act="close">✕</button><h2 class="out">Вы точно уверены?</h2><div class="paper" style="text-align:center;font-weight:700">Вы действительно хотите покинуть клан «' + save.clan.name + '»?</div><div class="foot"><button class="btn green" data-act="clanleaveok" style="min-width:140px">Да</button><button class="btn red" data-act="close" style="min-width:140px">Нет</button></div></div>');
    },
    clandisband: () => {
      const clanId = save.clan && save.clan.id;
      save.clan = null;
      persist(); closeModal(); showClans();
      toast('Клан распущен');
      const cfg = window.MB_NET_CONFIG || {};
      const api = (cfg.apiUrl || '').replace(/\/$/, '');
      if (api && clanId) {
        fetch(api + '/clans/' + encodeURIComponent(clanId) + '/rename', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: '' })
        }).catch(() => {});
      }
    },
    clanpassleaveask: d => {
      const c = MB.ensureClan(save); if (!c) return;
      const myRole = c.myRole || (c.own ? 'leader' : 'member');
      if (myRole !== 'leader') return;
      const target = (c.members || []).find(m => m.id === d.id);
      if (!target) return;
      openModal('<div class="panel win" style="position:relative;width:540px"><button class="x" data-act="close">✕</button><h2 class="out">Вы точно уверены?</h2>' +
        '<div class="paper" style="text-align:center;font-weight:700">Передать права лидера игроку <b>' + target.name + '</b> и покинуть клан «' + c.name + '»?</div>' +
        '<div class="foot"><button class="btn green" data-act="clanpassleave" data-id="' + target.id + '" style="min-width:140px">Да</button><button class="btn red" data-act="clanleave" style="min-width:140px">Нет</button></div></div>');
    },
    clanpassleave: d => {
      const c = MB.ensureClan(save); if (!c) return;
      const myRole = c.myRole || (c.own ? 'leader' : 'member');
      if (myRole !== 'leader') return;
      const target = (c.members || []).find(m => m.id === d.id);
      if (!target) return;
      target.role = 'leader';
      save.clan = null;
      persist(); closeModal(); showClans();
      toast('Статус лидера передан игроку ' + target.name + '. Вы покинули клан');
    },
    clanleaveok: () => { save.clan = null; persist(); closeModal(); showClans(); toast('Вы покинули клан'); },
    buygems: d => buy(+d.i), buyreal: d => buyReal(d), chance: d => showChances(d.c),
    ad: () => watchAd('sparks'), adpot: () => watchAd('pot'), closeopen: () => { closeModal(); showShop(shopTab); },
    flee: () => {
      if (!BV) return;
      openModal('<div class="panel win" style="width:480px"><h2 class="out">' + t('flee') + '</h2><div class="paper" style="text-align:center;font-weight:700">' +
        T('Вы точно уверены?', 'Are you sure?') + '</div>' +
        '<div class="foot"><button class="btn red" data-act="fleeok">' + T('Да', 'Yes') + '</button><button class="btn" data-act="close">' + T('Нет', 'No') + '</button></div></div>');
    },
    fleeok: () => {
      if (!BV) { closeModal(); return; }
      const c = BV.ctx;
      if (c.type === 'clan') { clanBattleDone(BV, false, true); toast('Урон засчитан. Следующая попытка — завтра'); }
      BV = null; clock.speed = 1; closeModal(); leave(c);
    },
    auto: () => { if (!BV) return; if (!BV.cleared && isBattleCleared(BV.ctx)) BV.cleared = true; if (!BV.cleared) { toast('Доступно после прохождения уровня'); return; } BV.auto = !BV.auto; save.auto = BV.auto; persist(); renderHudToggles(); if (BV.auto && BV.waiting) BV.waiting.auto(); },
    skipresult: () => {
      if (!BV || !BV.cleared || !BV.resultReady || BV.skipping) return;
      const bv = BV, b = bv.b;
      bv.skipping = true;
      bv.waiting = null; bv.pick = null; bv.current = null;
      renderActions(null);
      const q = $('#queue'); if (q) q.innerHTML = '';
      let guard = 0;
      while (!b.result && guard++ < 2000) {
        const t = MB.nextTurn(b); if (!t || t.skip) continue;
        if (t.unit.side === 'hero') { const c = MB.autoChoose(b, t.unit); MB.act(b, t.unit, c.si, c.target); }
        else MB.enemyAct(b, t.unit);
      }
      if (!b.result) b.result = 'lose';
      b.units.forEach(u => {
        const d = bv.units[u.id];
        if (d) { d.hp = u.hp; d.shield = u.shield; d.alive = u.alive; d.st = []; if (!u.alive) d.pose = 'defeat'; }
      });
      finishBattle(bv);
    },
    layout: () => { if (!BV) return; BV.edit = !BV.edit; if (BV.edit && BV.auto) { BV.auto = false; save.auto = false; persist(); renderHudToggles(); } renderLayoutBar(); },
    layoutreset: () => { if (!BV) return; delete LAYOUT[BV.layKey]; saveLayout(); placeDefault(); renderLayoutBar(); },
    layoutcopy: () => { const txt = JSON.stringify(LAYOUT, (k, v) => typeof v === 'number' ? Math.round(v * 1000) / 1000 : v);
      try { navigator.clipboard.writeText(txt); } catch (e) { /* нет буфера */ }
      openModal('<div class="panel win" style="position:relative;width:640px"><button class="x" data-act="close">✕</button><h2 class="out">Позиции бойцов</h2><p>Текст уже скопирован. Если нет — выделите его и скопируйте вручную, потом пришлите мне, и я сделаю эти позиции стандартными для всех.</p><textarea style="width:100%;height:140px;font:13px monospace" readonly onclick="this.select()">' + txt + '</textarea></div>'); },
    speed: () => { if (!BV) return; clock.speed = clock.speed > 1 ? 1 : 2; save.speed = clock.speed; persist(); renderHudToggles(); },
    skill: d => { if (BV && BV.waiting) BV.waiting.skill(+d.i); },
    openchest: () => {
      const its = showResult.items || [], box = $('#chestbox'); if (!box) return;
      const isGold = its.some(it => (it.r || 0) >= 3) || (BV && BV.ctx && (BV.ctx.type === 'boss' || BV.ctx.type === 'col'));
      SFX.play(isGold ? 'chest_open_gold' : 'chest_open_wood', 0.82);
      box.innerHTML = its.map(it => '<div style="display:inline-block;text-align:left;margin:4px 8px">' + itemCardHtml(it, save.team[0], false) + '</div>').join('') + '<p class="note" style="margin-top:6px">Вещи лежат в сумке — наденьте их на экране «Герои».</p>';
    },
    nextstage: () => { const c = BV.ctx; closeModal(); if (c.type === 'col') { showColiseum(); openPrep({ type: 'col', ch: 5, f: c.f + 1 }); return; } showCampaign(c.ch); openPrep({ type: 'stage', ch: c.ch, st: c.st + 1 }); },
    retry: () => { const c = BV.ctx; closeModal(); if (c.type === 'clan') { if (!MB.clanKeys(save)) { toast('Нет ключей — 2 новых дадут завтра'); return showClanHall(); } return openPrep({ type: 'clan', ch: c.ch }); } if (c.type === 'lair') { const l = MB.lairState(save, now()); if ((l.used || 0) >= MB.LAIR_WEEKLY.maxAttempts) { toast('Попытки на этой неделе закончились'); return showLair(); } } leave(c); openPrep({ type: c.type, ch: c.ch, st: c.st, diff: c.diff, f: c.f }); },
    leave: () => { const c = BV ? BV.ctx : prep; closeModal(); leave(c); },
    heroesfrom: () => { const c = BV ? BV.ctx : prep; closeModal(); showHeroes.back = c.type === 'lair' ? 'lair' : c.type === 'col' ? 'coliseum' : c.type === 'clan' ? 'clans' : 'campaign'; campCh = c.ch; showHeroes(); },
    herotab: d => showHeroes(d.k), bio: () => showBio(heroTab),
    team: () => { showTeam.back = 'heroes'; showTeam(); },
    teampick: d => { const i = save.team.indexOf(d.k); if (i >= 0) { if (save.team.length > 1) save.team.splice(i, 1); } else if (save.team.length < 3) save.team.push(d.k); else toast('В отряде уже 3 героя — сначала уберите одного'); persist(); showTeam(); },
    closeteam: () => { closeModal(); if (showTeam.back === 'campaign') showCampaign(); else showHeroes(); },
    lockedhero: d => { const C = MB.CHAPTERS.find(c => c.unlock === d.k), H = MB.HEROES[d.k]; showBio(d.k); toast(C ? heroLoc(d.k, 'name') + T(' присоединится после победы над боссом главы ', ' joins after beating chapter boss ') + C.n : H.shop ? heroLoc(d.k, 'name') + T(' продаётся в магазине', ' is sold in the shop') : heroLoc(d.k, 'name') + T(' — награда за прохождение Колизея', ' — Coliseum clear reward')); },
    filter: d => { bagFilter = d.f; showHeroes(); }, slotfilter: d => { bagFilter = d.sl; showHeroes(); },
    item: d => showItem(+d.id),
    equip: d => { const id = +d.id, it = MB.findItem(save, id), own = MB.ownerOf(save, id);
      if (it.heroOnly && it.heroOnly !== heroTab) { toast('Эту вещь может носить только ' + heroLoc(it.heroOnly, 'name')); return; }
      if (own) delete save.heroes[own].equip[it.slot]; save.heroes[heroTab].equip[it.slot] = id; SFX.play('equip_item', 0.76); persist(); closeModal(); showHeroes(); },
    skin: () => { const k = heroTab; if (!save.skins || !save.skins[k]) return; save.skinUse = save.skinUse || {};
      if (save.skinUse[k]) delete save.skinUse[k]; else save.skinUse[k] = save.skins[k];
      persist(); syncSkins(); showHeroes(); toast(save.skinUse[k] ? 'Золотой облик включён' : 'Вернулся обычный облик'); },
    unequip: d => { const it = MB.findItem(save, +d.id); delete save.heroes[heroTab].equip[it.slot]; persist(); closeModal(); showHeroes(); },
    upgrade: d => { const it = MB.findItem(save, +d.id), c = MB.upgradeCost(it.up + 1, it); if (!MB.canUpgrade(it) || save.sparks < c) return; save.sparks -= c; it.up++; SFX.play('item_upgrade', 0.78); persist(); showHeroes(); showItem(it.id); },
    rankup: d => { const it = MB.findItem(save, +d.id), r = it.rank || 0, c = MB.rankCost(r + 1, it); if (!MB.canRankUp(it) || save.ore < c) return; save.ore -= c; it.rank = r + 1; SFX.play('rank_up', 0.8); persist(); showHeroes(); showItem(it.id); toast('Ранг повышен: ' + '★'.repeat(it.rank)); },
    togglelock: d => { const it = MB.findItem(save, +d.id); if (!it) return; it.locked = !it.locked; if (it.locked) delete scrapSel[it.id]; persist(); showHeroes(); showItem(it.id); toast(it.locked ? 'Доспех заблокирован 🔒' : 'Блокировка снята 🔓'); },
    scrap: d => { const id = +d.id, it = MB.findItem(save, id), own = MB.ownerOf(save, id); if (!it || own || it.locked) return; save.ore += scrapValue(it); save.bag = save.bag.filter(i => i.id !== id); delete scrapSel[id]; persist(); closeModal(); showHeroes(); toast('Получено Руды: ' + scrapValue(it)); },
    openscrap: () => { scrapRar = 'all'; scrapSel = {}; showScrapModal(); },
    scraprar: d => { scrapRar = d.r; showScrapModal(); },
    scraptoggle: d => { const id = +d.id, it = MB.findItem(save, id); if (!it || it.locked || MB.ownerOf(save, id)) return; if (scrapSel[id]) delete scrapSel[id]; else scrapSel[id] = true; showScrapModal(); },
    scrapblocked: d => { const id = +d.id, it = MB.findItem(save, id); if (!it) return; const own = MB.ownerOf(save, id); toast(own ? 'Надето на героя ' + heroLoc(own, 'name') + ' — нельзя разобрать' : 'Предмет заблокирован замочком 🔒'); },
    scrapselectall: () => {
      const list = save.bag.filter(i => (scrapRar === 'all' || i.r === +scrapRar) && !i.locked && !MB.ownerOf(save, i.id));
      if (!list.length) return;
      const allSel = list.every(i => !!scrapSel[i.id]);
      if (allSel) list.forEach(i => { delete scrapSel[i.id]; });
      else list.forEach(i => { scrapSel[i.id] = true; });
      showScrapModal();
    },
    scrapselected: () => {
      let n = 0, cnt = 0;
      save.bag = save.bag.filter(i => {
        if (scrapSel[i.id] && !i.locked && !MB.ownerOf(save, i.id)) {
          n += scrapValue(i);
          cnt++;
          return false;
        }
        return true;
      });
      scrapSel = {};
      if (!cnt) return;
      save.ore += n;
      persist();
      closeModal();
      showHeroes();
      toast('Разобрано: ' + cnt + ' шт. · получено Руды: +' + n);
    },
    levelup: () => { toast('Уровень героя растёт сам за опыт (XP) из битв'); },
    stats: showStats, closestats: () => { closeModal(); showHeroes(); },
    treetab: d => { treeTab = d.t; const b = $('.treebox'); if (b) b.scrollTop = 0; showStats(); },
    node: d => { const h = save.heroes[heroTab], c = +d.c; if (MB.freePts(h) > 0 && h.tr[treeTab][c] === +d.r) { h.tr[treeTab][c]++; persist(); showStats(); } else if (h.tr[treeTab][c] < +d.r) toast('Сначала возьмите узел выше'); else if (h.tr[treeTab][c] === +d.r) toast('Нет свободных очков — повысьте уровень героя'); },
    resetpts: () => { const h = save.heroes[heroTab], c = MB.resetCost(h); if (save.gems < c) return; save.gems -= c; h.resets++; h.tr = MB.newTree(); persist(); showStats(); refreshTop(); },
    dqclaim: d => {
      const dq = MB.dailyQuestState(save, now());
      const i = +d.i, q = MB.DAILY_QUESTS[i];
      if (!q || dq.claimed[i] || dq.wins < q.wins) return;
      dq.claimed[i] = true;
      let msg = q.label;
      if (q.sparks) { save.sparks += q.sparks; }
      if (q.chest) { grantChest(1, q.chest); }
      if (q.pot) { save.potions[q.pot] = (save.potions[q.pot] || 0) + 1; }
      persist(); showDaily(); refreshTop(); toast('Награда: ' + msg);
    },
    claim: () => {
      const d = MB.dailyState(save, now()); if (!d.canClaim) return; const R = MB.DAILY[d.idx]; save.daily.claimed[d.idx] = true;
      SFX.play('daily_reward', 0.82);
      let msg = [];
      if (R.sparks) { save.sparks += R.sparks; msg.push('+' + R.sparks + ' Искр'); }
      if (R.ore) { save.ore += R.ore; msg.push('+' + R.ore + ' Руды'); }
      if (R.gems) { save.gems += R.gems; msg.push('+' + R.gems + ' Изумрудов'); }
      if (R.pot) { save.potions[R.pot]++; msg.push(MB.POTIONS[R.pot].name); }
      if (R.chest != null) { const it = grantChest(MB.topChapter(save), R.chest); msg.push('вещь: ' + MB.itemName(it, 'viking') + ' (' + rarityLoc(it.r).toLowerCase() + ')'); }
      persist(); closeModal(); if (scene.mode === 'hub') showHub(); toast('Награда: ' + msg.join(', '));
    },
    askreset: () => openModal('<div class="panel win" style="width:560px"><h2 class="out">Сбросить прогресс?</h2><div class="paper" style="text-align:center;font-weight:700">Все герои, вещи и пройденные уровни будут удалены.</div><div class="foot"><button class="btn red" data-act="doreset">Сбросить</button><button class="btn" data-act="close">Отмена</button></div></div>'),
    doreset: () => { save = MB.newSave(); save.seenIntro = true; persist(); closeModal(); showHub(); },
    fgeditor: () => showFgEditor(),
    fgloc: d => { FG.sel = fgParts(d.b)[0]; showFgEditor(d.b); },
    fgsel: d => { FG.sel = d.k; showFgEditor(scene.bg); },
    fgscale: d => { const p = fgPos(scene.bg)[FG.sel]; p[2] = Math.min(4, Math.max(0.3, (p[2] || 1) * (d.k === 'minus' ? 0.95 : 1.05))); fgSave(); },
    fgreset: () => { delete FG_POS[scene.bg]; fgSave(); showFgEditor(scene.bg); },
    fgdone: () => { showHub(); },
    ptedit: () => showPtEditor(),
    ptpick: d => { ptSel = d.k; showPtEditor(); },
    ptreset: () => { delete ART.PT[ptSel]; ART.savePT(); showPtEditor(); },
    ptdone: () => { ART.savePT(); closeModal(); }
  };
  function leave(c) { if (c.type === 'clan') showClanHall(); else if (c.type === 'lair') showLair(); else if (c.type === 'col') showColiseum(); else showCampaign(c.ch); }
  function refreshTop() { const t = $('.top'); if (t && scene.mode !== 'battle') { const back = t.querySelector('[data-act]'); const h = t.querySelector('h1'); t.outerHTML = topbar(h ? h.textContent : '', back && back.textContent.indexOf('Назад') >= 0 ? back.dataset.act : null); } }
  function renderHudToggles() { const t = document.querySelectorAll('.bright .tog'); if (t.length) { t[0].classList.toggle('on', !!(BV && BV.auto)); t[1].classList.toggle('on', clock.speed > 1); } }
  function onClick(e) {
    const el = e.target.closest('[data-act]');
    if (!el || el.disabled || !ACT[el.dataset.act]) return;
    const a = el.dataset.act;
    const isTab = /^(herotab|filter|clantab|ratetab|treetab|shoptab|fgloc|fgsel|ptpick)$/.test(a);
    const isBack = /^(close|closestats|elixircancel|clanleaveno)$/.test(a);
    if (isTab) SFX.play('ui_tab', 0.62);
    else if (isBack) SFX.play('ui_back', 0.64);
    else if (!/^(equip|upgrade|rankup|drink|elixirbuy|confirmbuy|claim|openchest)$/.test(a)) SFX.play('ui_click', 0.62);
    e.stopPropagation();
    ACT[a](el.dataset);
  }
  function renderLayoutBar() {
    let bar = $('#laybar'); if (bar) bar.remove(); if (!BV || !BV.edit) return;
    bar = document.createElement('div'); bar.id = 'laybar'; bar.className = 'laybar';
    bar.innerHTML = '<b>Редактор позиций</b><span>Тащите бойцов мышкой. Позиции запоминаются для этой локации' + (BV.layKey.indexOf('#boss') > 0 ? ' (бой с боссом)' : '') + '.</span>' +
      '<button class="btn small green" data-act="layout">Готово</button><button class="btn small" data-act="layoutreset">Сбросить</button><button class="btn small blue" data-act="layoutcopy">Скопировать для разработчика</button>';
    ui.appendChild(bar);
  }
  function placeDefault() {
    const bossFight = BV.b.units.some(u => u.boss); let mi = 0;
    BV.b.units.forEach(u => { const d = BV.units[u.id], hero = u.side === 'hero'; let px = hero ? HX[u.slot] : 1 - HX[u.slot], py = HY[u.slot];
      if (!hero && bossFight) { const p = u.boss ? BOSSPOS.boss : BOSSPOS.m[mi++]; px = p[0]; py = p[1]; } d.x = px * W; d.y = py * H; });
  }
  let drag = null;
  const cvPt = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height }; };
  function onDown(e) {
    if (scene.mode === 'fg') {
      const p = cvPt(e), def = FG_DEF[scene.bg]; if (!def) return;
      const d = fgPos(scene.bg); let hit = null;
      Object.keys(def.parts).forEach(k => { const r = fgRect(def, def.parts[k]), pos = d[k] || [0, 0, 1], s = pos[2] || 1;
        const x = r.cx + (pos[0] || 0) - r.w * s / 2, y = r.cy + (pos[1] || 0) - r.h * s / 2;
        if (p.x >= x && p.x <= x + r.w * s && p.y >= y && p.y <= y + r.h * s) hit = k; });
      if (!hit) return;
      FG.sel = hit; const pos = d[hit]; FG.drag = { k: hit, sx: p.x, sy: p.y, ox: pos[0] || 0, oy: pos[1] || 0 };
      try { cv.setPointerCapture(e.pointerId); } catch (er) { /* */ } e.preventDefault(); return;
    }
    if (!BV || !BV.edit) return; const p = cvPt(e); let best = null;
    Object.values(BV.units).forEach(d => { if (p.x > d.x - d.w / 2 && p.x < d.x + d.w / 2 && p.y > d.y - d.h && p.y < d.y + 16) { if (!best || d.y > best.y) best = d; } });
    if (best) { drag = { d: best, dx: best.x - p.x, dy: best.y - p.y }; try { cv.setPointerCapture(e.pointerId); } catch (er) { /* */ } e.preventDefault(); }
  }
  function onMove(e) {
    if (FG.drag && scene.mode === 'fg') { const p = cvPt(e), pos = fgPos(scene.bg)[FG.drag.k]; pos[0] = FG.drag.ox + (p.x - FG.drag.sx); pos[1] = FG.drag.oy + (p.y - FG.drag.sy); return; }
    if (!drag) return; const p = cvPt(e); drag.d.x = Math.max(30, Math.min(W - 30, p.x + drag.dx)); drag.d.y = Math.max(200, Math.min(H - 4, p.y + drag.dy));
  }
  function onUp() {
    if (FG.drag && scene.mode === 'fg') { FG.drag = null; fgSave(); return; }
    if (!drag) return; const d = drag.d; drag = null;
    (LAYOUT[BV.layKey] = LAYOUT[BV.layKey] || {})[d.u.slotKey] = [d.x / W, d.y / H]; saveLayout();
  }
  function onWheel(e) {
    if (scene.mode !== 'fg') return;
    e.preventDefault();
    const p = fgPos(scene.bg)[FG.sel]; if (!p) return;
    p[2] = Math.min(4, Math.max(0.3, (p[2] || 1) * (e.deltaY > 0 ? 0.96 : 1.04)));
    fgSave();
  }
  function onCanvas(e) {
    if (scene.mode === 'fg' || (BV && BV.edit)) return;
    if (!BV || !BV.waiting || !BV.pick) return;
    const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) * W / r.width, y = (e.clientY - r.top) * H / r.height;
    let best = null;
    Object.values(BV.units).forEach(d => { if (!d.alive || d.u.side !== BV.pick) return; if (x > d.x - d.w / 2 - 10 && x < d.x + d.w / 2 + 10 && y > d.y - d.h - 30 && y < d.y + 14) { if (!best || d.y > best.y) best = d; } });
    if (best) BV.waiting.unit(best.u.id);
  }

  /* ---------- Отрисовка ---------- */
  function drawSprite(key, pose, x, y, k, flip, alpha, turnN, breathe, elite) {
    const s = ART.sprite(key, pose, turnN); if (!s || !s.img) return;
    const sk = k * (s.s || 1), br = breathe || 1, dw = s.w * sk, dh = s.h * sk * br, ay = s.ay == null ? s.h : s.ay;
    g.save(); g.globalAlpha = alpha; g.translate(x, y); if (flip) g.scale(-1, 1);
    if (elite) { g.shadowColor = 'rgba(255,205,70,.95)'; g.shadowBlur = 26 + 10 * Math.sin(clock.t / 280); }
    try { g.drawImage(s.img, -s.ax * sk, -ay * sk * br, dw, dh); } catch (e) { /* картинка не загрузилась */ }
    g.restore();
  }
  function drawProj(p, k) {
    const x = p.x0 + (p.x1 - p.x0) * k, arc = /axe|hammer|flask|rock|cone|bomb|pick/.test(p.type) ? 70 : 0, y = p.y0 + (p.y1 - p.y0) * k - Math.sin(k * Math.PI) * arc, sc = p.big ? 1.6 : 1;
    const PI = { axe: ['axe', 84, 14], axe_gold: ['axe_gold', 95, 14], pick: ['pick', 70, 14], hammer: ['hammer', 84, 12], firehammer: ['hammer', 84, 12], flask: ['flask', 52, 9], rock: ['rock', 66, 8], orb: ['orb', 96, 0], arrow: ['arrow', 112, 0], shuriken: ['shuriken', 54, 22], web: ['web', 70, 0], cone: ['cone', 44, 10], bomb: ['bomb', 54, 8], ice: ['ice', 104, 0, 1], snowball: ['snowball', 110, 0], wave: ['wave', 100, 0, 1], spore: ['spore', 64, 3], orbg: ['orbg', 64, 6], quill: ['quill', 110, 0, 1], wisp_orb: ['wisp_orb', 120, 0], lich_orb: ['lich_orb', 120, 0, 1], lich_vortex: ['lich_vortex', 170, 2, 1] }[p.type];
    const im = PI && ART.fx(PI[0]);
    if (im) {
      g.save(); g.translate(x, y); g.scale(sc * p.dir * (PI[3] ? -1 : 1), sc); g.rotate(k * PI[2]);
      if (p.type === 'firehammer') { g.shadowColor = '#ff7a1a'; g.shadowBlur = 30; } else if (PROJ_COLOR[p.type] && p.type !== 'web' && p.type !== 'flask') { g.shadowColor = p.type === 'orb' ? '#c27bff' : PROJ_COLOR[p.type]; g.shadowBlur = 24; }
      const w = PI[1], h = w * im.naturalHeight / im.naturalWidth; g.drawImage(im, -w / 2 - (p.type === 'orb' ? w * 0.18 : 0), -h / 2, w, h);
      if (p.type === 'firehammer') { g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.45; g.drawImage(im, -w / 2, -h / 2, w, h); }
      g.restore(); return;
    }
    g.save(); g.translate(x, y); g.scale(sc * p.dir, sc); g.lineJoin = 'round'; g.strokeStyle = '#3a2414'; g.lineWidth = 3;
    const spin = () => g.rotate(k * 14);
    switch (p.type) {
      case 'axe': case 'axe_gold': case 'pick': spin(); g.fillStyle = '#8a5a2b'; g.fillRect(-4, -24, 8, 48); g.strokeRect(-4, -24, 8, 48); g.fillStyle = '#cfd6dd'; g.beginPath();
        if (p.type !== 'pick') { g.moveTo(4, -24); g.quadraticCurveTo(28, -22, 26, -2); g.lineTo(4, -8); } else { g.moveTo(-26, -14); g.quadraticCurveTo(0, -34, 26, -14); g.lineTo(0, -20); }
        g.closePath(); g.fill(); g.stroke(); break;
      case 'hammer': case 'firehammer': spin(); if (p.type === 'firehammer') { g.shadowColor = '#ff7a1a'; g.shadowBlur = 24; } g.fillStyle = '#8a5a2b'; g.fillRect(-4, -8, 8, 34); g.strokeRect(-4, -8, 8, 34);
        g.fillStyle = p.type === 'firehammer' ? '#ff9a3a' : '#6b7480'; g.fillRect(-18, -24, 36, 18); g.strokeRect(-18, -24, 36, 18); break;
      case 'flask': spin(); g.fillStyle = '#6fe36a'; g.beginPath(); g.arc(0, 4, 14, 0, 7); g.fill(); g.stroke(); g.fillStyle = '#c9a45c'; g.fillRect(-5, -20, 10, 12); g.strokeRect(-5, -20, 10, 12); break;
      case 'rock': case 'cone': case 'bomb': spin(); g.fillStyle = p.type === 'rock' ? '#8a8f98' : p.type === 'cone' ? '#8a5a2b' : '#2b2b33'; g.beginPath(); g.ellipse(0, 0, 13, p.type === 'cone' ? 17 : 13, 0, 0, 7); g.fill(); g.stroke(); break;
      case 'arrow': g.shadowColor = '#ff7a2a'; g.shadowBlur = 18; g.fillStyle = '#8a5a2b'; g.fillRect(-34, -3, 56, 6); g.strokeRect(-34, -3, 56, 6); g.fillStyle = '#ff9a3a'; g.beginPath(); g.moveTo(34, 0); g.lineTo(18, -10); g.lineTo(18, 10); g.closePath(); g.fill(); g.stroke();
        g.fillStyle = '#e8edf2'; g.beginPath(); g.moveTo(-34, 0); g.lineTo(-44, -10); g.lineTo(-26, -3); g.lineTo(-26, 3); g.lineTo(-44, 10); g.closePath(); g.fill(); g.stroke(); break;
      case 'shuriken': g.rotate(k * 20); g.fillStyle = '#cfd6dd'; g.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, r = i % 2 ? 6 : 20; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#2b2b38'; g.beginPath(); g.arc(0, 0, 3, 0, 7); g.fill(); break;
      case 'wave': g.shadowColor = '#7fe3ff'; g.shadowBlur = 20; g.strokeStyle = '#bff3ff'; g.lineWidth = 9; g.beginPath(); g.arc(-26, 0, 40, -0.9, 0.9); g.stroke(); break;
      default: { const c = PROJ_COLOR[p.type] || '#ffffff'; g.shadowColor = c; g.shadowBlur = 22; g.fillStyle = c; g.beginPath(); g.arc(0, 0, 13, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(0, 0, 6, 0, 7); g.fill();
        g.globalAlpha = 0.5; g.fillStyle = c; g.beginPath(); g.moveTo(-10, -9); g.lineTo(-52, 0); g.lineTo(-10, 9); g.fill(); }
    }
    g.restore();
  }
  function drawBars(d) {
    const u = d.u, bw = u.boss ? 190 : 112, x = d.x - bw / 2, y = d.y - d.h - 30;
    g.fillStyle = 'rgba(20,12,6,.75)'; g.beginPath(); g.roundRect(x - 3, y - 3, bw + 6, 18, 8); g.fill();
    const k = Math.max(0, d.hp / d.maxHp);
    g.fillStyle = u.side === 'hero' ? '#63d13e' : '#e2483a'; g.beginPath(); g.roundRect(x, y, Math.max(2, bw * k), 12, 6); g.fill();
    if (d.shield > 0) { g.fillStyle = 'rgba(127,214,255,.9)'; g.beginPath(); g.roundRect(x, y - 1, Math.min(bw, bw * d.shield / d.maxHp), 5, 3); g.fill(); }
    g.font = '800 13px ' + UIFONT; g.textAlign = 'center'; g.lineWidth = 3; g.strokeStyle = '#1b120b'; g.fillStyle = '#fff';
    const label = (u.boss ? u.name + ' · ' : '') + 'ур.' + (u.displayLvl || u.lvl) + '  ' + Math.ceil(d.hp) + '/' + d.maxHp + (u.elite ? ' ★' : '');
    g.strokeText(label, d.x, y - 7); g.fillText(label, d.x, y - 7);
    d.st.forEach((s, i) => { const S = MB.STATUS[s]; if (!S) return; const sx = x + 9 + i * 22, sy = y + 26; g.fillStyle = S.color; g.beginPath(); g.arc(sx, sy, 9, 0, 7); g.fill(); g.lineWidth = 2; g.strokeStyle = '#1b120b'; g.stroke(); g.fillStyle = '#1b120b'; g.font = '800 12px ' + UIFONT; g.fillText(S.ch, sx, sy + 4); });
  }
  const tintCache = {};
  function draw() {
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H);
    const bg = ART.bg(scene.bg);
    let shx = 0, shy = 0;
    if (BV && clock.t - BV.shake < 260) { const a = 8 * (1 - (clock.t - BV.shake) / 260); shx = (Math.random() - 0.5) * a * 2; shy = (Math.random() - 0.5) * a * 2; }
    g.translate(shx, shy);
    if (bg && bg.complete && bg.naturalWidth) g.drawImage(bg, -10, -10, W + 20, H + 20); else { g.fillStyle = '#2c4a24'; g.fillRect(0, 0, W, H); }
    if (scene.mode === 'menu') { g.fillStyle = 'rgba(15,9,5,.55)'; g.fillRect(-10, -10, W + 20, H + 20); }
    if (scene.mode === 'fg') { g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(-10, -10, W + 20, H + 20); drawFgParts(g, true); }
    if (scene.mode === 'hub') {
      g.fillStyle = 'rgba(15,9,5,.2)'; g.fillRect(-10, -10, W + 20, H + 20);
      let list = save.team.filter(k => save.unlocked.indexOf(k) >= 0).slice(0, 3);
      if (!list.length) list = save.unlocked.slice(0, 3);
      const xs = [330, 190, 480], ys = [560, 600, 610];
      list.map((k, i) => ({ k: k, x: xs[i], y: ys[i] })).sort((a, b) => a.y - b.y).forEach((o, i) => {
        const s = ART.sprite(o.k, 'idle'), k = 230 / s.h * ART.skinScale(o.k);
        g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(o.x, o.y, 80, 18, 0, 0, 7); g.fill();
        drawSprite(o.k, 'idle', o.x, o.y, k, false, 1, 0, 1 + 0.0012 * Math.sin(clock.t / 420 + i * 1.7));
      });
    }
    if (scene.mode === 'battle' && BV) {
      const list = Object.values(BV.units).sort((a, b) => a.y - b.y), pulse = 0.5 + 0.5 * Math.sin(clock.t / 160);
      list.forEach(d => {
        if (d.alpha <= 0.01) return;
        const hero = d.u.side === 'hero';
        g.globalAlpha = d.alpha; g.fillStyle = 'rgba(0,0,0,.32)'; g.beginPath(); g.ellipse(d.x + d.ox, d.y + 2, d.w * 0.42, 15, 0, 0, 7); g.fill(); g.globalAlpha = 1;
        if (BV.current === d.u.id && d.alive) { g.strokeStyle = '#ffd45e'; g.lineWidth = 5; g.beginPath(); g.ellipse(d.x, d.y + 2, d.w * 0.5, 19, 0, 0, 7); g.stroke(); }
        if (BV.pick === d.u.side && d.alive) { g.strokeStyle = hero ? 'rgba(125,255,122,' + (0.5 + pulse * 0.5) + ')' : 'rgba(255,90,70,' + (0.5 + pulse * 0.5) + ')'; g.lineWidth = 5; g.beginPath(); g.ellipse(d.x, d.y + 2, d.w * 0.5 + pulse * 6, 19 + pulse * 3, 0, 0, 7); g.stroke(); }
        let sx = 0; if (clock.t - d.shakeT < 220) sx = Math.sin((clock.t - d.shakeT) / 18) * 7;
        const br = d.pose === 'idle' && d.alive ? 1 + 0.007 * Math.sin(clock.t / 420 + d.ph) : 1;
        const hasPoison = d.alive && d.st && d.st.indexOf('poison') >= 0;
        const hasFreeze = d.alive && d.st && d.st.indexOf('freeze') >= 0;
        if (d.u.elite) { const cy = d.y - d.h * 0.5, r = Math.max(d.w, d.h) * 0.7; const gr = g.createRadialGradient(d.x, cy, r * 0.2, d.x, cy, r); gr.addColorStop(0, 'rgba(255,210,80,.38)'); gr.addColorStop(0.55, 'rgba(255,180,40,.14)'); gr.addColorStop(1, 'rgba(255,160,20,0)'); g.save(); g.fillStyle = gr; g.beginPath(); g.arc(d.x, cy, r, 0, 7); g.fill(); g.restore(); }
        if (hasPoison) {
          const cy = d.y - d.h * 0.5, r = Math.max(d.w, d.h) * 0.68;
          const gr = g.createRadialGradient(d.x, cy, r * 0.15, d.x, cy, r);
          gr.addColorStop(0, 'rgba(110, 255, 95, .42)');
          gr.addColorStop(0.58, 'rgba(65, 220, 75, .18)');
          gr.addColorStop(1, 'rgba(40, 180, 50, 0)');
          g.save(); g.fillStyle = gr; g.beginPath(); g.arc(d.x, cy, r, 0, 7); g.fill(); g.restore();
        }
        if (hasFreeze) {
          const cy = d.y - d.h * 0.5, r = Math.max(d.w, d.h) * 0.68;
          const gr = g.createRadialGradient(d.x, cy, r * 0.15, d.x, cy, r);
          gr.addColorStop(0, 'rgba(115, 210, 255, .44)');
          gr.addColorStop(0.58, 'rgba(60, 165, 255, .18)');
          gr.addColorStop(1, 'rgba(40, 130, 240, 0)');
          g.save(); g.fillStyle = gr; g.beginPath(); g.arc(d.x, cy, r, 0, 7); g.fill(); g.restore();
        }
        drawSprite(d.u.key, d.pose, d.x + d.ox + sx, d.y + d.oy, d.k, false, d.alpha, d.turnN, br, d.u.elite);
        if (hasPoison || hasFreeze) {
          const s = ART.sprite(d.u.key, d.pose, d.turnN);
          if (s && s.img) {
            const sk = d.k * (s.s || 1), dw = s.w * sk, dh = s.h * sk * br, ay = s.ay == null ? s.h : s.ay, ax = s.ax == null ? s.w / 2 : s.ax;
            const ux = d.x + d.ox + sx, uy = d.y + d.oy;
            const tintColor = (hasPoison && hasFreeze) ? 'rgba(90, 235, 190, 0.34)' : hasPoison ? 'rgba(80, 235, 75, 0.32)' : 'rgba(75, 180, 255, 0.34)';
            const glowColor = (hasPoison && hasFreeze) ? '#70ffd6' : hasPoison ? '#6dff5a' : '#7fd6ff';
            const tw = Math.max(1, Math.ceil(dw)), th = Math.max(1, Math.ceil(dh));
            const tkey = (s.img.src || d.u.key) + '|' + tw + 'x' + th + '|' + tintColor;
            let oc = tintCache[tkey];
            if (!oc) {
              oc = document.createElement('canvas');
              oc.width = tw; oc.height = th;
              const octx = oc.getContext('2d');
              if (octx) {
                octx.drawImage(s.img, 0, 0, tw, th);
                octx.globalCompositeOperation = 'source-atop';
                octx.fillStyle = tintColor;
                octx.fillRect(0, 0, tw, th);
              }
              tintCache[tkey] = oc;
              const keys = Object.keys(tintCache);
              if (keys.length > 24) delete tintCache[keys[0]];
            }
            if (oc) {
              try {
                g.save();
                g.globalAlpha = d.alpha;
                g.translate(ux, uy);
                g.shadowColor = glowColor;
                g.shadowBlur = 22 + 6 * Math.sin(clock.t / 240);
                g.drawImage(oc, -ax * sk, -ay * sk * br, dw, dh);
                g.restore();
              } catch (e) { /* */ }
            }
          }
        }
        if (d.alive && d.st.indexOf('freeze') >= 0 && ART.fx('freeze')) { const im = ART.fx('freeze'), r0 = im.naturalHeight / im.naturalWidth, w = Math.min(d.w * 1.05, d.h * 0.42 / r0), h = w * r0; g.globalAlpha = 0.9; g.drawImage(im, d.x - w / 2, d.y + 10 - h, w, h); g.globalAlpha = 1; }
        if (d.alive && d.shield > 0 && ART.fx('shield')) { const im = ART.fx('shield'), s2 = d.h * (1 + 0.02 * Math.sin(clock.t / 300)); g.globalAlpha = 0.28; g.drawImage(im, d.x - s2 / 2, d.y - d.h * 0.48 - s2 / 2, s2, s2); g.globalAlpha = 1; }
      });
      BV.sfx = BV.sfx.filter(f => {
        const k = (clock.t - f.t0) / f.ms; if (k >= 1) return false;
        const im = ART.fx(f.name); if (!im) return false;
        if (f.beam) { /* луч-дыхание: из точки (x,y) в точку (x1,y1), узкий конец у источника */
          const dx = f.x1 - f.x, dy = f.y1 - f.y, len = Math.hypot(dx, dy), ang = Math.atan2(dy, dx);
          const grow = k < 0.22 ? k / 0.22 : 1, w = Math.max(1, len * grow), h = f.w * (1 + 0.07 * Math.sin(clock.t / 65));
          g.save(); g.translate(f.x, f.y); g.rotate(ang); g.scale(-1, 1);
          g.globalAlpha = (f.a || 1) * (k > 0.72 ? 1 - (k - 0.72) / 0.28 : Math.min(1, k / 0.08));
          if (f.glow) { g.shadowColor = f.glow; g.shadowBlur = 30; }
          try { g.drawImage(im, -w, -h / 2, w, h); } catch (e) { /* */ }
          g.restore(); return true;
        }
        const sc = k < 0.18 ? 0.55 + k / 0.18 * 0.53 : k < 0.3 ? 1.08 - (k - 0.18) / 0.12 * 0.08 : 1;
        const w = f.w * sc, h = w * im.naturalHeight / im.naturalWidth * (f.sy || 1), y = f.y - (f.rise || 0) * k;
        g.save(); g.globalAlpha = (f.a || 1) * (k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1);
        if (f.glow) { g.shadowColor = f.glow; g.shadowBlur = 26; }
        g.drawImage(im, f.x - w / 2, f.bottom ? y - h : y - h / 2, w, h); g.restore(); return true;
      });
      BV.projs = BV.projs.filter(p => { const k = (clock.t - p.t0) / p.ms; if (k >= 1) return false; drawProj(p, k); return true; });
      BV.fx = BV.fx.filter(f => {
        const k = (clock.t - f.t0) / f.ms; if (k >= 1) return false;
        g.globalAlpha = 1 - k;
        if (f.ring) { g.strokeStyle = f.color; g.lineWidth = 6 * (1 - k) + 1; g.beginPath(); g.arc(f.x, f.y, f.R * k, 0, 7); g.stroke(); }
        else { const dt = clock.t - f.t0; g.fillStyle = f.color; g.beginPath(); g.arc(f.x + f.vx * dt, f.y + f.vy * dt + 0.0004 * dt * dt, f.r * (1 - k * 0.6), 0, 7); g.fill(); }
        g.globalAlpha = 1; return true;
      });
      list.forEach(d => { if (d.alive) drawBars(d); });
      BV.floats = BV.floats.filter(f => {
        const k = (clock.t - f.t0) / 950; if (k >= 1) return false;
        const pop = k < 0.15 ? 0.6 + k / 0.15 * 0.5 : 1.1 - Math.min(0.1, (k - 0.15));
        g.globalAlpha = k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1; g.font = '900 ' + Math.round(f.size * pop) + 'px ' + UIFONT; g.textAlign = 'center';
        g.lineWidth = 6; g.strokeStyle = '#3a2414'; g.strokeText(f.text, f.x, f.y - k * 60); g.fillStyle = f.color; g.fillText(f.text, f.x, f.y - k * 60); g.globalAlpha = 1; return true;
      });
      // передний план локации — поверх бойцов и эффектов
      drawFgParts(g, false);
    }
  }

  /* ---------- Запуск ---------- */
  let zoom = 1, panX = 0, panY = 0;
  function viewBox() {
    const vv = window.visualViewport;
    return {
      w: vv ? vv.width : window.innerWidth,
      h: vv ? vv.height : window.innerHeight,
      ox: vv ? vv.offsetLeft : 0,
      oy: vv ? vv.offsetTop : 0
    };
  }
  function fit() {
    const st = $('#stage'); if (!st) return;
    const v = viewBox(), portrait = v.h > v.w;
    const viewW = portrait ? v.h : v.w, viewH = portrait ? v.w : v.h;
    const baseK = Math.min(viewW / W, viewH / H);
    const k = baseK * zoom;
    st.style.transformOrigin = 'center center';
    st.style.left = (v.ox + v.w / 2) + 'px';
    st.style.top = (v.oy + v.h / 2) + 'px';
    const rot = portrait ? ' rotate(90deg)' : '';
    // Применяем pan только если увеличено; форма остаётся привязанной к центру
    st.style.transform = 'translate(calc(-50% + ' + panX + 'px), calc(-50% + ' + panY + 'px))' + rot + ' scale(' + k + ')';
    let hint = document.getElementById('rot-hint');
    if (portrait) {
      if (!hint) {
        hint = document.createElement('div');
        hint.id = 'rot-hint';
        hint.innerHTML = '↻ Поверните телефон для удобства';
        document.body.appendChild(hint);
      }
      hint.style.display = 'block';
    } else if (hint) hint.style.display = 'none';
  }
  function clampPan() {
    // Ограничиваем pan так, чтобы форма не улетала полностью с экрана
    const maxPan = (zoom - 1) * 280; // чем больше zoom, тем больше можно сдвинуть
    panX = Math.max(-maxPan, Math.min(maxPan, panX));
    panY = Math.max(-maxPan, Math.min(maxPan, panY));
    if (zoom <= 1.01) { panX = 0; panY = 0; }
  }
  function clampZoom() {
    zoom = Math.max(1, Math.min(3, zoom));
    clampPan();
  }
  function setupPinch() {
    let startDist = 0, startZoom = 1;
    let panStartX = 0, panStartY = 0, lastX = 0, lastY = 0, panning = false;
    const dist = t => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    document.addEventListener('touchstart', e => {
      if (e.touches.length === 2) {
        startDist = dist(e.touches);
        startZoom = zoom;
        panning = false;
        e.preventDefault();
      } else if (e.touches.length === 1 && zoom > 1.05) {
        // Однопальцевый pan только когда уже увеличено
        panning = true;
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
        panStartX = panX;
        panStartY = panY;
      }
    }, { passive: false });
    document.addEventListener('touchmove', e => {
      if (e.touches.length === 2 && startDist) {
        const d = dist(e.touches);
        zoom = startZoom * (d / startDist);
        clampZoom();
        fit();
        e.preventDefault();
      } else if (e.touches.length === 1 && panning && zoom > 1.05) {
        const t = e.touches[0];
        panX = panStartX + (t.clientX - lastX);
        panY = panStartY + (t.clientY - lastY);
        clampPan();
        fit();
        e.preventDefault();
      }
    }, { passive: false });
    document.addEventListener('touchend', e => {
      if (e.touches.length < 2) startDist = 0;
      if (e.touches.length === 0) panning = false;
    });
    document.addEventListener('wheel', e => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      zoom *= e.deltaY < 0 ? 1.08 : 0.92;
      clampZoom();
      fit();
    }, { passive: false });
  }
  // Pikabu SDK init
  window.__pkbSdkReady = async function () {
    if (window.PikabuSDK || !window.PkbSDK) return;
    try {
      const sdk = await PkbSDK.init();
      window.PikabuSDK = sdk;
      if (typeof MB !== 'undefined' && MB.net && MB.net.attachContext && save) {
        MB.net.attachContext(save, persist);
      }
      if (sdk && typeof sdk.gameStarted === 'function') {
        setTimeout(() => sdk.gameStarted(), 300);
      }
    } catch (e) { /* SDK недоступен вне платформы */ }
  };
  if (window.PkbSDK && !window.PikabuSDK) window.__pkbSdkReady();

  window.addEventListener('load', function () {
    cv = $('#cv'); g = cv.getContext('2d'); ui = $('#ui'); modal = $('#modal');
    setupPinch();
    fit();
    let fitTimer = 0;
    const fitSoon = () => { if (fitTimer) return; fitTimer = setTimeout(() => { fitTimer = 0; fit(); }, 80); };
    window.addEventListener('resize', fitSoon);
    window.addEventListener('orientationchange', () => { setTimeout(fit, 50); setTimeout(fit, 250); setTimeout(fit, 600); });
    if (window.visualViewport) {
      visualViewport.addEventListener('resize', fitSoon);
      visualViewport.addEventListener('scroll', fitSoon);
    }
    let lastUiTap = 0;
    const onUiTap = e => {
      const now = Date.now();
      if (now - lastUiTap < 250) return;
      lastUiTap = now;
      onClick(e);
    };
    $('#stage').addEventListener('click', onUiTap);
    $('#stage').addEventListener('pointerup', e => { if (e.pointerType === 'touch' || e.pointerType === 'pen') onUiTap(e); });
cv.addEventListener('click', onCanvas); cv.addEventListener('pointerdown', onDown); cv.addEventListener('pointermove', onMove); cv.addEventListener('pointerup', onUp); cv.addEventListener('pointercancel', onUp); cv.addEventListener('wheel', onWheel, { passive: false });
    save = loadSave(); syncSkins();
    try {
      const cloud = cloudSaveGet();
      if (cloud && cloud.v === 1 && cloud._ts && (!save._ts || cloud._ts > save._ts)) {
        const d = MB.newSave();
        for (const k in d) if (cloud[k] === undefined) cloud[k] = d[k];
        MB.HERO_ORDER.forEach(k => { if (!cloud.heroes[k]) cloud.heroes[k] = d.heroes[k]; });
        save = cloud;
        syncSkins();
        try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) {}
        toast('Прогресс загружен из облака');
      }
    } catch (e) { /* облако недоступно */ }
    try {
      const cloud = cloudSaveGet();
      if (cloud && cloud.v === 1 && (!save.playerId || cloud.playerId === save.playerId || !cloud.playerId)) {
        const localTs = save._ts || 0;
        const cloudTs = cloud._ts || 0;
        if (cloudTs > localTs) {
          save = cloud;
          persist();
        }
      }
    } catch (e) { /* облако недоступно */ }
    save._ts = Date.now();
    const sessionStart = Date.now();
    const sendAnalytics = (event, extra) => {
      const cfg = window.MB_NET_CONFIG || {};
      const api = (cfg.apiUrl || '').replace(/\/$/, '');
      if (!api || !save || !save.playerId) return;
      const payload = {
        playerId: save.playerId,
        name: save.name || '',
        event: event,
        level: MB.accountLevel(save),
        power: MB.accountPower(save),
        sessionMs: Date.now() - sessionStart,
        extra: extra || null
      };
      fetch(api + '/analytics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).catch(() => {});
    };
    setTimeout(() => sendAnalytics('login'), 2000);
    window.addEventListener('beforeunload', () => {
      const cfg = window.MB_NET_CONFIG || {};
      const api = (cfg.apiUrl || '').replace(/\/$/, '');
      if (!api || !save || !save.playerId) return;
      navigator.sendBeacon(api + '/analytics', JSON.stringify({
        playerId: save.playerId,
        name: save.name || '',
        event: 'logout',
        level: MB.accountLevel(save),
        power: MB.accountPower(save),
        sessionMs: Date.now() - sessionStart
      }));
    });
    if (save.musicVol == null) save.musicVol = save.musicMuted ? 0 : 0.3;
    if (save.sfxVol == null) save.sfxVol = 0.2;
    if (save.sfxMuted == null) save.sfxMuted = false;
    if (save.lang !== 'en' && save.lang !== 'ru') save.lang = 'ru';
    I18N.setLang(save.lang);
    MUSIC.setVolume(save.musicVol);
    MUSIC.setMuted(!!save.musicMuted || save.musicVol <= 0);
    SFX.setVolume(save.sfxVol);
    SFX.setMuted(!!save.sfxMuted);
    ['pointerdown', 'keydown'].forEach(evName => window.addEventListener(evName, () => MUSIC.resumeOnGesture(), { once: true })); if (MB.net && typeof MB.net.attachContext === 'function') MB.net.attachContext(save, persist);
    if (['#nointro', '#battle', '#heroes', '#coliseum', '#clans', '#clanhall', '#lair'].indexOf(location.hash) >= 0 || location.hash.indexOf('#fgeditor') === 0) { save.seenIntro = true; const w = MB.weekInfo(new Date()); save.daily = { week: w.week, claimed: [true, true, true, true, true, true, true] }; }
    // 1) Сначала показываем экран загрузки и ждём его картинку — только потом ART.load
    ui.innerHTML = '<div class="loading"><img class="loading-bg" src="assets/ui/loading_screen.webp" alt="" fetchpriority="high" decoding="sync"><div class="bar"><i id="ld" style="width:0"></i><div class="load-label">Идёт загрузка</div></div></div>';
    applyUILang();
    const startAssetLoad = () => {
      const topCh = (typeof MB.topChapter === 'function') ? MB.topChapter(save) : 1;
      ART.load(p => { const b = $('#ld'); if (b) b.style.width = Math.round(p * 100) + '%'; }, { unlocked: save.unlocked || ['viking', 'knight'], topChapter: Math.max(1, topCh || 1) }).then(() => {
        showHub(); requestAnimationFrame(frame);
        if (window.PikabuSDK && typeof window.PikabuSDK.gameStarted === 'function') {
          window.PikabuSDK.gameStarted();
        }
        if (location.hash === '#battle') { save.seenIntro = true; openPrep({ type: 'stage', ch: 1, st: 1 }); ACT.fight(); }
        else if (location.hash === '#heroes') { save.seenIntro = true; showHeroes(save.unlocked[0] || MB.HERO_ORDER[0]); }
        else if (location.hash === '#coliseum') { save.seenIntro = true; save.name = save.name || 'Тестер'; save.bosses[MB.COLISEUM.needBoss] = true; const hk = save.unlocked[0] || MB.HERO_ORDER[0]; save.unlocked = MB.HERO_ORDER.slice(); save.heroes[hk].lvl = Math.max(save.heroes[hk].lvl, MB.COLISEUM.needLvl); closeModal(); showColiseum(); }
        else if (location.hash === '#clans') { save.seenIntro = true; showClans(); }
        else if (location.hash === '#clanhall') { save.seenIntro = true; save.name = save.name || 'Тестер'; save.clan = save.clan || MB.mkClan(save, 'Тестовый клан', true, 3); closeModal(); showClanHall(); }
        else if (location.hash === '#lair') { save.seenIntro = true; showLair(); }
        else if (location.hash.indexOf('#fgeditor') === 0) { save.seenIntro = true; showFgEditor(location.hash.split('-')[1] || 'fon_polyana'); }
      });
    };
    const bgImg = ui.querySelector('.loading-bg');
    if (bgImg && !bgImg.complete) {
      bgImg.addEventListener('load', startAssetLoad, { once: true });
      bgImg.addEventListener('error', startAssetLoad, { once: true });
    } else {
      startAssetLoad();
    }
  });
  MB.debug = { get save() { return save; }, set save(s) { save = s; persist(); }, hub: showHub, get bv() { return BV; }, clock: clock };
})();