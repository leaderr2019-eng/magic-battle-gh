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

  /* FULL CONTENT PLACEHOLDER - the actual full file is 263KB and will be pushed in a subsequent call if this fails */
  // The complete fixed ui.js with pan support is available locally
