/* Magic Battle — данные и логика (без отрисовки). Работает и в браузере, и в node для проверки баланса. */
(function (root) {
  'use strict';
  const MB = {};

  /* ---------- Справочники ---------- */
  MB.RARITY = [
    { name: 'Обычная', color: '#9aa3ad', mult: 1.0, maxUp: 10, ore: 1 },
    { name: 'Необычная', color: '#4caf50', mult: 1.5, maxUp: 20, ore: 2 },
    { name: 'Редкая', color: '#3d8bfd', mult: 2.2, maxUp: 30, ore: 4 },
    { name: 'Эпическая', color: '#a855f7', mult: 3.2, maxUp: 50, ore: 8 },
    { name: 'Легендарная', color: '#f5b301', mult: 4.5, maxUp: 70, ore: 15 }
  ];
  MB.RARITY_CHANCE = [60, 25, 10, 4, 1];
  // Сундуки и шансы редкости вещи (в процентах: обычная, необычная, редкая, эпическая, легендарная)
  MB.CHESTS = {
    wood: { name: 'Деревянный сундук', col: '#9b6330', chance: [100, 0, 0, 0, 0] },
    green: { name: 'Зелёный сундук', col: '#4caf50', chance: [0, 100, 0, 0, 0] },
    blue: { name: 'Синий сундук', col: '#3d8bfd', chance: [0, 0, 100, 0, 0] },
    purple: { name: 'Фиолетовый сундук', col: '#a855f7', chance: [0, 0, 0, 100, 0] },
    gold: { name: 'Золотой сундук', col: '#f2c14e', chance: [0, 0, 0, 0, 100] }
  };
  MB.ENERGY = { max: 200, cost: 20, regenMin: 3 };
  // Эликсир расширения энергии: разовая покупка за изумруды, навсегда поднимает максимум энергии на add (200 → 400). col — ключ иконки (art.js)
  MB.ENERGY_ELIXIR = { name: 'Эликсир энергии', add: 200, gems: 3000, col: '#2fd6b4' };
  MB.POTIONS = { s: { name: 'Малая банка энергии', amt: 40, gems: 30 }, m: { name: 'Средняя банка энергии', amt: 200, gems: 120 }, l: { name: 'Большая банка энергии', amt: 600, gems: 300 } };
  MB.SHOP = {
    chests: [{ chest: 'green', gems: 50 }, { chest: 'blue', gems: 120 }, { chest: 'purple', gems: 300 }, { chest: 'gold', gems: 800 }],
    ore: [{ ore: 30, gems: 60 }, { ore: 100, gems: 180 }, { ore: 300, gems: 480 }],
    gems: [{ gems: 100, rub: 49 }, { gems: 550, rub: 199 }, { gems: 1200, rub: 399 }, { gems: 3000, rub: 899 }],
    ads: { perDay: 10, reward: 100, potPerDay: 5, potType: 's' }
  };
  // Эксклюзивные наборы: легендарные вещи одного героя + его облик. id — префикс спрайтов и суффикс иконок
  MB.SKIN_PACKS = [
    { id: 'viking_leg', hero: 'viking', heroDat: 'Торвальду', name: 'Золотой пак Торвальда', gems: 5000,
      desc: '5 легендарных вещей (оружие, шлем, нагрудник, перчатки, сапоги) и золотой облик героя. Подходит только Торвальду.',
      slots: ['weapon', 'helmet', 'chest', 'gloves', 'boots'],
      itemNames: { weapon: 'Золотые топоры Торвальда', helmet: 'Золотой шлем Торвальда', chest: 'Золотой нагрудник Торвальда', gloves: 'Золотые перчатки Торвальда', boots: 'Золотые сапоги Торвальда' } }
  ];
  MB.SLOTS = ['weapon', 'helmet', 'chest', 'gloves', 'boots', 'amulet'];
  MB.SLOT_NAME = { weapon: 'Оружие', helmet: 'Шлем', chest: 'Нагрудник', gloves: 'Перчатки', boots: 'Сапоги', amulet: 'Амулет' };
  MB.AMULETS = {
    crit: { name: 'Клык волка', max: 15, text: v => '+' + v + '% шанс крита' },
    hp: { name: 'Сердце тролля', max: 25, text: v => '+' + v + '% здоровья' },
    dodge: { name: 'Перо совы', max: 10, text: v => '+' + v + '% уворота' },
    regen: { name: 'Капля росы', max: 5, text: v => 'лечит ' + v + '% здоровья за ход' },
    spec: { name: 'Глаз дракона', max: 30, text: v => '+' + v + '% урона спецатак' },
    sparks: { name: 'Подкова удачи', max: 25, text: v => '+' + v + '% Искр за бой' }
  };
  // Прибавки, которые дают узлы деревьев
  MB.BON = {
    atk: { ic: 's_atk', f: v => '+' + v + '% Атаки' }, hp: { ic: 's_hp', f: v => '+' + v + '% Здоровья' }, def: { ic: 's_def', f: v => '+' + v + '% Защиты' },
    crit: { ic: 's_crit', f: v => '+' + v + '% крита' }, critDmg: { ic: 's_critdmg', f: v => '+' + v + '% крит. урона' }, dodge: { ic: 's_dodge', f: v => '+' + v + '% уворота' },
    block: { ic: 's_block', f: v => '+' + v + '% блока' }, extra: { ic: 's_extra', f: v => '+' + v + '% доп. атаки' }, stun: { ic: 's_stun', f: v => '+' + v + '% оглушения' },
    pierce: { ic: 's_pierce', f: v => '+' + v + '% пробивания' }, boss: { ic: 's_boss', f: v => '+' + v + '% по боссам' }, ctrl: { ic: 's_ctrl', f: v => '+' + v + '% стойкости' },
    spec: { ic: 's_spec', f: v => '+' + v + '% спецатак' }, sup: { ic: 's_sup', f: v => '+' + v + '% лечения и щитов' }, regen: { ic: 's_regen', f: v => 'лечит ' + v + '% за ход' },
    spd: { ic: 's_spd', f: v => '+' + v + ' Скорости' }, first: { ic: 's_first', f: () => 'Первый ход в бою' }
  };
  // Три дерева по 3 колонки и 10 узлов. Узел открывается, когда взят узел над ним.
  MB.TREES = [
    { key: 'atk', name: 'Атака', cols: [
      [['atk', 3], ['critDmg', 10], ['atk', 3], ['pierce', 4], ['atk', 4], ['critDmg', 10], ['atk', 4], ['pierce', 5], ['atk', 5], ['critDmg', 20]],
      [['crit', 2], ['boss', 3], ['crit', 2], ['extra', 3], ['crit', 2], ['boss', 4], ['crit', 3], ['extra', 4], ['crit', 3], ['boss', 8]],
      [['spd', 1], ['extra', 3], ['atk', 3], ['stun', 3], ['spd', 1], ['extra', 3], ['atk', 3], ['stun', 4], ['spd', 1], ['extra', 6]]] },
    { key: 'def', name: 'Защита', cols: [
      [['hp', 4], ['block', 3], ['hp', 4], ['def', 4], ['hp', 5], ['block', 4], ['hp', 5], ['def', 5], ['hp', 6], ['block', 6]],
      [['def', 3], ['ctrl', 5], ['def', 3], ['hp', 4], ['def', 4], ['ctrl', 5], ['def', 4], ['hp', 5], ['def', 5], ['ctrl', 10]],
      [['dodge', 1], ['regen', 1], ['dodge', 1], ['block', 3], ['dodge', 2], ['regen', 1], ['dodge', 2], ['block', 3], ['dodge', 2], ['regen', 2]]] },
    { key: 'mas', name: 'Мастерство', cols: [
      [['spec', 5], ['stun', 3], ['spec', 5], ['critDmg', 10], ['spec', 5], ['stun', 4], ['spec', 5], ['critDmg', 10], ['spec', 10], ['stun', 5]],
      [['sup', 5], ['ctrl', 5], ['sup', 5], ['hp', 3], ['sup', 5], ['ctrl', 5], ['sup', 5], ['hp', 4], ['sup', 10], ['ctrl', 5]],
      [['spd', 1], ['boss', 3], ['crit', 2], ['pierce', 4], ['spd', 1], ['boss', 4], ['crit', 2], ['pierce', 5], ['spd', 1], ['first', 1]]] }
  ];
  MB.newTree = function () { return { atk: [0, 0, 0], def: [0, 0, 0], mas: [0, 0, 0] }; };
  MB.MAX_LEVEL = 50;
  MB.STATUS = {
    poison: { name: 'Яд', color: '#5fd35f', ch: 'Я' },
    freeze: { name: 'Заморозка', color: '#7fd6ff', ch: 'Л' },
    curse: { name: 'Проклятие', color: '#b06cff', ch: 'П' },
    warcry: { name: 'Боевой клич', color: '#ff9d3c', ch: 'К' },
    stance: { name: 'Стойка', color: '#ffe066', ch: 'С' },
    stun: { name: 'Оглушение', color: '#ffd45e', ch: 'О' },
    enrage: { name: 'Ярость', color: '#ff4d4d', ch: '!' }
  };

  /* ---------- Герои ---------- */
  MB.HEROES = {
    viking: {
      bioTitle: "Гроза северных фьордов", bio: ["Торвальд родом с Северных фьордов, где детей учат метать топор раньше, чем ходить. Однажды он поспорил, что перебросит топор через весь фьорд. Топор улетел за горизонт, и его ищут до сих пор, а Торвальд с тех пор доказывает каждому встречному, что бросает дальше всех.", "Бороду он не стриг ни разу в жизни. По его словам, в ней спрятаны запасной топор, кусок копчёного сыра и счастливая монетка. Проверять никто не решается.", "Торвальд громкий, упрямый и всегда идёт в бой первым. Боится он только одного — щекотки, но об этом лучше не напоминать."],
      name: 'Торвальд', full: 'Торвальд Рыжебород', role: 'Воин · урон по всем', art: 'viking',
      hp: 120, atk: 14, def: 8, spd: 10, crit: 10, dodge: 5, base: { stun: 5 },
      skills: [
        { name: 'Бросок топора', target: 'enemy', mult: 1.0, pose: 'throw', proj: 'axe', desc: 'Обычная атака по одной цели.' },
        { name: 'Удар о землю', target: 'all', mult: 0.8, pose: 'special', fx: 'slam', cd: 3, special: true, desc: 'Бьёт всех врагов на 80% Атаки.' },
        { name: 'Боевой клич', target: 'team', status: { type: 'warcry', dur: 2 }, pose: 'victory', fx: 'buff', cd: 4, special: true, desc: 'Весь отряд наносит на 20% больше урона 2 хода.' }
      ]
    },
    knight: {
      bioTitle: "Юная стражница Солнечной заставы", bio: ["Лира — младшая дочь стражника с Солнечной заставы. С восьми лет она тренировалась на соломенных чучелах и победила всех сорок три. Сорок четвёртое, говорят, сдалось само.", "Её меч не похож ни на один другой. Однажды ночью Лира нашла в лесу упавший осколок звезды, а кузнец Борн выковал из него клинок, который светится в темноте и звенит перед бедой.", "Лира быстрая, весёлая и немного хвастливая. Мечтает, чтобы о ней сложили песню, и уже придумала первые строчки сама."],
      name: 'Лира', full: 'Лира Сияющий Клинок', role: 'Быстрый урон по одной цели', art: 'knight',
      hp: 95, atk: 15, def: 6, spd: 14, crit: 20, dodge: 10, base: { extra: 10 },
      skills: [
        { name: 'Световая волна', target: 'enemy', mult: 1.0, pose: 'throw', proj: 'wave', desc: 'Обычная атака по одной цели.' },
        { name: 'Сияющий удар', target: 'enemy', mult: 1.4, alwaysCrit: true, pose: 'special', proj: 'wave', big: true, cd: 3, special: true, desc: '140% Атаки, всегда крит.' },
        { name: 'Стойка', target: 'self', status: { type: 'stance', dur: 1 }, pose: 'special', fx: 'buff', cd: 4, special: true, desc: '+50% к увороту до своего следующего хода.' }
      ]
    },
    gnome: {
      bioTitle: "Кузнец из-под Каменных гор", bio: ["Борн двести лет простоял у наковальни в подгорном городе. Из его мастерской выходили лучшие доспехи и самые надёжные молоты во всех Каменных горах.", "Всё изменилось, когда гоблин Кирка со своей шайкой захватил старую шахту и перекрыл подземные дороги. Борн взвалил на плечо любимый молот, которого ласково зовёт «тётушкой Гретой», и отправился наводить порядок.", "Он не любит спешить и говорит, что хороший удар — как хорошая сталь: его надо выковать. Зато если Борн встал перед друзьями, сквозь него не пройдёт никто."],
      name: 'Борн', full: 'Борн Наковальня', role: 'Танк · защита отряда', art: 'gnome',
      hp: 150, atk: 10, def: 12, spd: 8, crit: 5, dodge: 3, base: { block: 15 },
      skills: [
        { name: 'Метательный молот', target: 'enemy', mult: 1.0, pose: 'throw', proj: 'hammer', desc: 'Обычная атака по одной цели.' },
        { name: 'Раскалённый молот', target: 'enemy', mult: 2.2, pose: 'special', proj: 'firehammer', big: true, cd: 3, special: true, desc: '220% Атаки по одной цели.' },
        { name: 'Щит кузнеца', target: 'ally', shield: 0.25, pose: 'victory', fx: 'shield', cd: 4, special: true, desc: 'Щит союзнику на 25% его здоровья.' }
      ]
    },
    witch: {
      bioTitle: "Болотная ведьма в котле", bio: ["Бурля варила суп из болотных кувшинок и полезла в котёл попробовать, не пересолила ли. С тех пор она из него не вылезает: котёл стал ей и домом, и бронёй, и способом передвижения.", "Её зелья лечат от всего на свете, хотя на вкус как тина с сапогом. А ядовитые отвары у неё получаются ещё лучше лечебных — Бурля считает это своим главным талантом.", "Грибной Король выгнал её с родного болота: решил, что зелья Бурли опаснее его спор. Теперь она мечтает вернуться домой и сварить из короля похлёбку."],
      name: 'Бурля', full: 'Бурля', role: 'Поддержка · лечение и яд', art: 'witch',
      hp: 90, atk: 11, def: 6, spd: 11, crit: 5, dodge: 8, base: { ctrl: 15 },
      skills: [
        { name: 'Склянка', target: 'enemy', mult: 0.9, pose: 'throw', proj: 'flask', desc: 'Обычная атака, 90% Атаки.' },
        { name: 'Ядовитое варево', target: 'all', status: { type: 'poison', dur: 3 }, pose: 'special', fx: 'poison', cd: 3, special: true, desc: 'Отравляет всех врагов на 3 хода.' },
        { name: 'Целебный отвар', target: 'team', heal: 0.25, pose: 'victory', fx: 'heal', cd: 4, special: true, desc: 'Лечит весь отряд на 25% здоровья.' }
      ]
    },
    wizard: {
      bioTitle: "Хранитель звёзд с Кристального пика", bio: ["Триста лет Мерлиус жил на вершине Кристального пика и пересчитывал звёзды. Он почти закончил, когда на пике поселился Кристальный дракончик и звёзды начали сыпаться с неба. Мерлиус сбился со счёта и очень на это обиделся.", "Колдует он могущественно, но рассеянно. Бывает, вместо ледяных оков у него получается снегопад, а вместо огненного шара — пирожок с капустой. Пирожки, впрочем, отличные.", "Мерлиус хочет вернуть небу покой и наконец досчитать звёзды. Говорит, что осталось всего несколько миллионов."],
      name: 'Мерлиус', full: 'Мерлиус Звездочёт', role: 'Маг · контроль', art: 'wizard',
      hp: 80, atk: 16, def: 4, spd: 12, crit: 10, dodge: 5, base: { pierce: 15 },
      skills: [
        { name: 'Магический сгусток', target: 'enemy', mult: 1.0, pose: 'throw', proj: 'orb', desc: 'Обычная атака по одной цели.' },
        { name: 'Ледяные оковы', target: 'enemy', mult: 1.2, status: { type: 'freeze', dur: 1 }, pose: 'special', proj: 'ice', big: true, cd: 3, special: true, desc: '120% Атаки и заморозка: цель пропускает ход.' },
        { name: 'Проклятие', target: 'all', mult: 0.6, status: { type: 'curse', dur: 2 }, pose: 'special', fx: 'curse', cd: 4, special: true, desc: '60% Атаки по всем врагам, они получают на 25% больше урона.' }
      ]
    },
    archer: {
      bioTitle: "Лучница из Пылающей рощи", bio: ["Ярра выросла в эльфийской роще, где деревья цветут огнём, а листья никогда не сгорают. Стрелять она научилась раньше, чем говорить, и до сих пор отвечает на вопросы выстрелом в яблочко.", "Её стрелы загораются сами, стоит ей только рассердиться. Поэтому сердить Ярру не советуют даже драконы.", "Она ищет древний лук своей бабушки, который, по слухам, спрятан где-то в Кристальном пике."],
      name: 'Ярра', full: 'Ярра Огнецвет', role: 'Лучница · урон огнём', art: 'archer', shop: { price: 299 },
      look: { skin: '#f6d2b0', hair: '#e2512b', armor: '#3f7a3a', trim: '#f2c14e', scarf: '#e2512b', boots: '#6b3d1f', weapon: 'bow', ears: 'elf', tail: 1 },
      hp: 90, atk: 16, def: 5, spd: 13, crit: 15, dodge: 10, base: { pierce: 10 },
      skills: [
        { name: 'Огненная стрела', target: 'enemy', mult: 1.0, pose: 'throw', proj: 'arrow', desc: 'Обычная атака по одной цели.' },
        { name: 'Град стрел', target: 'all', mult: 0.7, pose: 'special', proj: 'arrow', cd: 3, special: true, desc: '70% Атаки по всем врагам.' },
        { name: 'Поджог', target: 'enemy', mult: 1.1, status: { type: 'poison', dur: 3 }, pose: 'special', proj: 'arrow', big: true, cd: 4, special: true, desc: '110% Атаки и горение на 3 хода.' }
      ]
    },
    boar: {
      bioTitle: "Рыцарь Хрустального корыта", bio: ["Сэр Хрюндель — единственный кабан, посвящённый в рыцари. Это случилось после того, как он в одиночку вытащил королевскую карету из болота и даже не испачкался. Ну почти.", "Он носит доспехи, начищенные до блеска, и всегда говорит очень вежливо. Даже с троллями. Особенно с троллями, потому что после разговора с ним они обычно лежат.", "Хрюндель уверен, что лучшее лекарство — тёплое слово и крепкий щит. Друзья с ним соглашаются: под его щитом действительно тепло."],
      name: 'Хрюндель', full: 'Сэр Хрюндель', role: 'Паладин · танк и лечение', art: 'boar', shop: { price: 399 },
      look: { skin: '#f2a9a9', hair: '#8a5a3c', armor: '#9aa3ad', trim: '#f2c14e', scarf: '#3d6fb5', boots: '#5b6470', weapon: 'mace', ears: 'pig', snout: 1 },
      hp: 170, atk: 11, def: 13, spd: 7, crit: 5, dodge: 2, base: { block: 10 },
      skills: [
        { name: 'Удар булавой', target: 'enemy', mult: 1.0, pose: 'throw', melee: true, desc: 'Подбегает и бьёт одну цель.' },
        { name: 'Святой свет', target: 'team', heal: 0.18, pose: 'special', fx: 'heal', cd: 3, special: true, desc: 'Лечит весь отряд на 18% здоровья.' },
        { name: 'Клятва щита', target: 'ally', shield: 0.3, pose: 'special', fx: 'shield', cd: 4, special: true, desc: 'Щит союзнику на 30% его здоровья.' }
      ]
    },
    ninja: {
      bioTitle: "Чемпионка Колизея", bio: ["Никто не знает, откуда пришла Кира. Однажды она просто появилась на арене Колизея и победила всех чемпионов подряд, а потом исчезла в облаке дыма, забыв забрать награду.", "Говорят, она умеет ходить по натянутой паутине и прятаться в собственной тени. Сама Кира ничего не говорит: она вообще говорит мало, зато метко.", "Она присоединится только к тем, кто докажет свою силу на всех десяти аренах Колизея."],
      name: 'Кира', full: 'Кира Тень', role: 'Ассасин · криты и уклонение', art: 'ninja', coliseum: true,
      look: { skin: '#e9c3a0', hair: '#2b2b38', armor: '#2f2f45', trim: '#b06cff', scarf: '#b06cff', boots: '#22222e', weapon: 'dagger', mask: 1 },
      hp: 85, atk: 18, def: 4, spd: 16, crit: 25, dodge: 15, base: { extra: 10 },
      skills: [
        { name: 'Сюрикен', target: 'enemy', mult: 1.0, pose: 'throw', proj: 'shuriken', desc: 'Обычная атака по одной цели.' },
        { name: 'Удар из тени', target: 'enemy', mult: 1.8, alwaysCrit: true, pose: 'special', melee: true, cd: 3, special: true, desc: 'Подкрадывается: 180% Атаки, всегда крит.' },
        { name: 'Дымовая завеса', target: 'self', status: { type: 'stance', dur: 1 }, pose: 'special', fx: 'buff', cd: 4, special: true, desc: '+50% к увороту до своего следующего хода.' }
      ]
    }
  };
  MB.HERO_ORDER = ['viking', 'knight', 'gnome', 'witch', 'wizard', 'archer', 'boar', 'ninja'];

  /* ---------- Враги ---------- */
  // art: имя спрайтов (если есть), ph: параметры заглушки
  MB.ENEMIES = {
    goblin: { name: 'Лесной гоблин', art: 'mini_goblin', size: 0.92, hp: 40, atk: 9, def: 3, spd: 11, crit: 5, dodge: 5, proj: 'rock' },
    wolf: { name: 'Серый волк', art: 'mini_wolf', hp: 34, atk: 11, def: 2, spd: 14, crit: 15, dodge: 10, melee: true, size: 0.72 },
    penek: { name: 'Пень-шишкомёт', art: 'mini_penek', hp: 60, atk: 7, def: 7, spd: 6, crit: 5, dodge: 0, proj: 'cone' },
    kobold: { name: 'Кобольд-подрывник', art: 'en_kobold', size: 0.85, hp: 36, atk: 8, def: 3, spd: 10, crit: 5, dodge: 5, proj: 'bomb', aoe: 0.6 },
    bat: { name: 'Летучая мышь', art: 'en_bat', size: 0.75, hp: 30, atk: 9, def: 2, spd: 15, crit: 10, dodge: 22, melee: true },
    beetle: { name: 'Каменный жук', art: 'en_beetle', size: 0.72, hp: 62, atk: 8, def: 9, spd: 7, crit: 5, dodge: 0, melee: true },
    frog: { name: 'Лягушка-копейщик', art: 'en_frog', size: 0.9, hp: 48, atk: 10, def: 6, spd: 10, crit: 8, dodge: 5, melee: true },
    mosquito: { name: 'Комар-кровопийца', art: 'en_mosquito', size: 0.75, hp: 30, atk: 9, def: 2, spd: 15, crit: 5, dodge: 15, melee: true, lifesteal: 0.5 },
    sporeling: { name: 'Грибочек-спорник', art: 'en_sporeling', size: 0.8, hp: 40, atk: 7, def: 4, spd: 9, crit: 5, dodge: 3, proj: 'spore', onHit: { poison: 0.35 } },
    trollkid: { name: 'Троллёнок', art: 'en_trollkid', size: 0.95, hp: 55, atk: 12, def: 5, spd: 8, crit: 8, dodge: 2, melee: true },
    spider: { name: 'Пещерный паук', art: 'en_spider', size: 0.7, hp: 42, atk: 9, def: 4, spd: 12, crit: 8, dodge: 8, proj: 'web', onHit: { freeze: 0.2 } },
    shaman: { name: 'Гоблин-шаман', art: 'en_shaman', size: 0.95, hp: 38, atk: 9, def: 3, spd: 10, crit: 5, dodge: 5, proj: 'orbg', skill: { type: 'healAlly', pct: 0.2, every: 3, name: 'Исцеление' } },
    imp: { name: 'Ледяной бесёнок', art: 'en_imp', size: 0.8, hp: 34, atk: 10, def: 3, spd: 14, crit: 8, dodge: 12, proj: 'snowball', onHit: { freeze: 0.2 } },
    yeti: { name: 'Малыш-йети', art: 'en_yeti', size: 0.95, hp: 66, atk: 12, def: 6, spd: 8, crit: 8, dodge: 2, melee: true },
    guard: { name: 'Кристальный страж', art: 'en_guard', size: 0.95, hp: 55, atk: 10, def: 9, spd: 9, crit: 5, dodge: 0, melee: true, skill: { type: 'shieldSelf', pct: 0.2, every: 4, name: 'Кристальный щит' } },
    hedgehog: { name: 'Ёж-колючка', art: 'en_hedgehog', size: 0.9, hp: 48, atk: 10, def: 8, spd: 8, crit: 5, dodge: 2, proj: 'quill' },
    rat: { name: 'Рудная крыса', art: 'en_rat', size: 0.7, hp: 34, atk: 11, def: 2, spd: 15, crit: 12, dodge: 20, melee: true, lifesteal: 0.4 },
    wisp: { name: 'Болотный огонёк', art: 'en_wisp', size: 0.85, hp: 40, atk: 9, def: 3, spd: 12, crit: 8, dodge: 18, proj: 'wisp_orb', onHit: { curse: 0.25 } },
    bear: { name: 'Пещерный медведь', art: 'en_bear', size: 1.2, hp: 85, atk: 14, def: 7, spd: 7, crit: 8, dodge: 0, melee: true, onHit: { stun: 0.12 } },
    shard: { name: 'Кристальный элементаль', art: 'en_shard', size: 0.95, hp: 62, atk: 12, def: 10, spd: 8, crit: 5, dodge: 0, skill: { type: 'shieldSelf', pct: 0.15, every: 4, name: 'Кристальный щит' }, onHit: { freeze: 0.2 } }
  };
  MB.BOSSES = {
    golem: { name: 'Каменный голем', art: 'golem', boss: true, hp: 190, atk: 13, def: 10, spd: 7, crit: 5, dodge: 0, melee: true, mech: 'stoneskin', mechText: 'Каменная кожа: получает на 30% меньше урона, пока не заморожен и не проклят.' },
    kirka: { name: 'Гоблин-шахтёр Кирка', art: 'goblin', boss: true, hp: 180, atk: 12, def: 5, spd: 14, crit: 10, dodge: 30, proj: 'pick', multi: 2, mechText: 'Ловкач: 30% уворота, кидает кирки сразу в двух героев.' },
    king: { name: 'Грибной Король', art: 'mushroom_king', attackArt: ['attack1', 'attack2'], boss: true, hp: 200, atk: 11, def: 6, spd: 9, crit: 5, dodge: 3, proj: 'spore', onHit: { poison: 0.5 }, skill: { type: 'healAll', pct: 0.12, every: 3, name: 'Грибница' }, mechText: 'Каждые 3 хода лечит себя и слуг, атаки отравляют.' },
    troll: { name: 'Пещерный тролль', art: 'troll', boss: true, hp: 260, atk: 14, def: 6, spd: 8, crit: 8, dodge: 0, melee: true, mech: 'enrage', mechText: 'Ярость: при здоровье ниже 50% ходит дважды за раунд.' },
    dragon: { name: 'Кристальный дракончик', art: 'dragon', boss: true, hp: 240, atk: 13, def: 8, spd: 12, crit: 10, dodge: 5, proj: 'ice', skill: { type: 'shieldSelf', pct: 0.15, every: 4, name: 'Кристальный щит' }, breath: true, mechText: 'Каждый второй ход дышит льдом и замораживает героя, каждые 4 хода ставит себе щит.' },
    minotaur: { name: 'Минотавр Арены', art: 'minotaur', boss: true, hp: 300, atk: 16, def: 8, spd: 9, crit: 10, dodge: 5, melee: true, onHit: { stun: 0.15 }, mech: 'enrage', mechText: 'Слепая ярость: при здоровье ниже 50% ходит дважды за раунд, удары топором оглушают (15%).' },
    andoor: { name: 'Король Лич Андоор', art: 'lich', attackArt: ['attack1', 'attack2'], boss: true, size: 1.35, hp: 380, atk: 22, def: 12, spd: 10, crit: 12, dodge: 5, proj: 'lich_orb', proj2: 'lich_vortex', onHit: { curse: 0.3 }, skill: { type: 'shieldSelf', pct: 0.12, every: 4, name: 'Пелена тлена' }, mechText: 'Две атаки: шар тлена бьёт одного героя, вихрь душ — второй. Атаки проклинают (30%), каждые 4 хода ставит себе щит.' }
  };
  MB.CHAPTERS = [
    { n: 1, name: 'Волшебная поляна', bg: 'fon_polyana', enemies: ['goblin', 'wolf', 'penek', 'hedgehog'], boss: 'golem', ore: 20, unlock: 'gnome' },
    { n: 2, name: 'Заброшенная шахта', bg: 'fon_shahta', enemies: ['kobold', 'bat', 'beetle', 'rat'], boss: 'kirka', ore: 30, unlock: 'witch' },
    { n: 3, name: 'Грибное болото', bg: 'fon_mashroom', enemies: ['frog', 'mosquito', 'sporeling', 'wisp'], boss: 'king', ore: 40, unlock: 'wizard' },
    { n: 4, name: 'Логово тролля', bg: 'fon_cavetroll', enemies: ['trollkid', 'spider', 'shaman', 'bear'], boss: 'troll', ore: 50, amulet: { type: 'hp', r: 3 } },
    { n: 5, name: 'Кристальный пик', bg: 'fon_crystaallsnow', enemies: ['imp', 'yeti', 'guard', 'shard'], boss: 'dragon', ore: 60, amulet: { type: 'spec', r: 4 } }
  ];
  MB.LAIR = [
    { name: 'Обычная', lvl: 0, minR: 2 },
    { name: 'Сложная', lvl: 8, minR: 2 },
    { name: 'Кошмар', lvl: 16, minR: 3 }
  ];
  MB.LAIR_WEEKLY = {
    maxAttempts: 5,
    oreByBoss: {
      golem: [5, 10, 15],
      kirka: [10, 15, 20],
      king: [15, 20, 25],
      troll: [20, 25, 30],
      dragon: [25, 30, 35]
    }
  };
  MB.lairOreFor = function (bossKey, diffIdx) {
    const arr = MB.LAIR_WEEKLY.oreByBoss[bossKey];
    if (arr && arr[diffIdx] != null) return arr[diffIdx];
    return [10, 20, 35][diffIdx] || 10;
  };
  MB.utc3WeekKey = function (d) {
    const u = new Date(d.getTime() + 3 * 3600000);
    const dayIdx = (u.getUTCDay() + 6) % 7;
    const mon = new Date(Date.UTC(u.getUTCFullYear(), u.getUTCMonth(), u.getUTCDate() - dayIdx));
    return mon.getUTCFullYear() + '-' + String(mon.getUTCMonth() + 1).padStart(2, '0') + '-' + String(mon.getUTCDate()).padStart(2, '0');
  };
  MB.lairNextResetMs = function (nowMs) {
    const u = new Date(nowMs + 3 * 3600000);
    const dayIdx = (u.getUTCDay() + 6) % 7;
    const daysUntilMon = 7 - dayIdx;
    const nextMonUtc3 = Date.UTC(u.getUTCFullYear(), u.getUTCMonth(), u.getUTCDate() + daysUntilMon, 0, 0, 0, 0);
    return nextMonUtc3 - 3 * 3600000;
  };
  MB.DAILY = [
    { text: '100 Искр', sparks: 100 }, { text: 'Деревянный сундук', chest: 'wood' }, { text: 'Малая банка энергии', pot: 's' },
    { text: '300 Искр', sparks: 300 }, { text: 'Зелёный сундук', chest: 'green' }, { text: '20 Руды', ore: 20 },
    { text: '20 Изумрудов', gems: 20 }
  ];
  // Колизей: 10 арен, проход всех — герой Кира
  MB.COLISEUM = { needBoss: 3, needLvl: 25, floors: 10, reward: 'ninja' };
  MB.coliseumFloor = function (f) {
    const L = 26 + f * 4, pool = ['goblin', 'wolf', 'penek', 'kobold', 'bat', 'beetle', 'frog', 'mosquito', 'sporeling', 'trollkid', 'spider', 'shaman', 'imp', 'yeti', 'guard'];
    const bosses = ['golem', 'kirka', 'king', 'troll', 'dragon'];
    const pick = i => pool[(f * 7 + i * 5) % pool.length];
    if (f === MB.COLISEUM.floors) return [{ type: 'minotaur', lvl: L, boss: true }, { type: pick(1), lvl: L - 2 }, { type: pick(2), lvl: L - 2 }];   // финал арены — Минотавр
    if (f % 5 === 0) return [{ type: bosses[(f / 5 - 1 + 2) % 5], lvl: L, boss: true }, { type: pick(1), lvl: L - 2 }, { type: pick(2), lvl: L - 2 }];
    return [{ type: pick(0), lvl: L, elite: f >= 3 }, { type: pick(1), lvl: L }, { type: pick(2), lvl: L }];
  };
  MB.coliseumOpen = function (save) { return !!save.bosses[MB.COLISEUM.needBoss] && MB.HERO_ORDER.some(k => save.unlocked.indexOf(k) >= 0 && save.heroes[k].lvl >= MB.COLISEUM.needLvl); };
  MB.DAY_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  /* ---------- Формулы ---------- */
  MB.TUNE = { mobHp: 1.25, mobAtk: 1.2, bossHp: 0.8, rec: 0.9 };
  MB.enemyMult = function (L) { return 1 + 0.10 * (L - 1) + 0.0028 * (L - 1) * (L - 1); };
  MB.levelCost = function (lvl) { return 15 * lvl; };
  MB.sparksFor = function (L) { return 20 + 6 * L; };
  /* Опыт героев: победа 5 XP, поражение 2 XP; первое прохождение уровня кампании +5, первая победа над боссом кампании +15;
     бой с клановым боссом 20 XP + 20 клановых монет, победа над ним — всем 500 XP + 400 монет */
  MB.XP = { win: 5, loss: 2, firstStage: 5, firstBoss: 15, clanFight: 20, clanKill: 500 };
  MB.CCOIN = { clanFight: 20, clanKill: 400 };
  MB.xpNeed = function (lvl) { return 8 + 4 * (lvl - 1); };          // опыт до следующего уровня героя
  // Начислить опыт героям (keys — участники боя). Возвращает [{key, from, to}] — кто поднял уровень
  MB.grantXp = function (save, keys, n) {
    const ups = [];
    keys.forEach(k => {
      const h = save.heroes[k]; if (!h) return;
      if (h.xp == null) h.xp = 0;
      if (h.lvl >= MB.MAX_LEVEL) return;
      const from = h.lvl;
      h.xp += n;
      while (h.lvl < MB.MAX_LEVEL && h.xp >= MB.xpNeed(h.lvl)) { h.xp -= MB.xpNeed(h.lvl); h.lvl++; }
      if (h.lvl >= MB.MAX_LEVEL) h.xp = 0;
      if (h.lvl > from) ups.push({ key: k, from: from, to: h.lvl });
    });
    return ups;
  };
  // Ключи кланового босса: 2 бесплатных каждый день, купленные не сгорают
  MB.clanKeys = function (save) { const t = MB.dayKey(new Date()), k = save.ckeys; if (k.date !== t) { k.date = t; k.free = 2; } return k.free + k.paid; };
  MB.spendClanKey = function (save) { MB.clanKeys(save); const k = save.ckeys; if (k.free > 0) { k.free--; return true; } if (k.paid > 0) { k.paid--; return true; } return false; };
  // Клановый магазин: товары за клановые монеты (cc) и ключ за изумруды (gems)
  MB.CLAN_SHOP = [
    { kind: 'sparks', n: 1000, cc: 150 }, { kind: 'sparks', n: 5000, cc: 700 }, { kind: 'sparks', n: 10000, cc: 1300 },
    { kind: 'ore', n: 100, cc: 240 }, { kind: 'ore', n: 250, cc: 560 }, { kind: 'ore', n: 500, cc: 1040 },
    { kind: 'chest', chest: 'purple', cc: 1000 }, { kind: 'chest', chest: 'gold', cc: 2500 },
    { kind: 'key', n: 1, gems: 50 }
  ];
  MB.upgradeCost = function (toUp, it) { return Math.round(20 * toUp * (1 + 0.5 * (it ? it.r : 0))); };   // уровень вещи — Искры
  MB.MAX_RANK = 6;
  MB.rankCost = function (toRank, it) { return Math.round(10 * toRank * (1 + 0.5 * (it ? it.r : 0))); };   // ранг вещи — Руда
  // потолок ранга: по одному рангу на каждые 10 уровней ниже предела (обычная — без рангов, легендарная — до 6)
  MB.rankCap = function (it) { return it.slot === 'amulet' ? MB.MAX_RANK : Math.min(MB.MAX_RANK, Math.floor((MB.RARITY[it.r].maxUp - 1) / 10)); };
  // вещь уперлась в 10-й/20-й/... уровень и ждёт ранга, чтобы качать дальше
  MB.needRank = function (it) { return it.slot !== 'amulet' && it.up > 0 && it.up < MB.RARITY[it.r].maxUp && it.up % 10 === 0 && (it.rank || 0) < it.up / 10; };
  // ранг можно поднять только по достижении соответствующего десятого уровня
  MB.canRankUp = function (it) { const rk = it.rank || 0; return rk < MB.rankCap(it) && (it.slot === 'amulet' || it.up >= (rk + 1) * 10); };
  // можно качать уровень дальше (для не-амулетов)
  MB.canUpgrade = function (it) { return it.slot !== 'amulet' && it.up < MB.RARITY[it.r].maxUp && !MB.needRank(it); };
  MB.resetCost = function (h) { return 200; };
  MB.stageLevel = function (ch, st) { return (ch - 1) * 10 + st; };       // st 1..10
  MB.bossLevel = function (ch) { return (ch - 1) * 10 + 12; };

  MB.itemStats = function (it) {
    const R = MB.RARITY[it.r], m = R.mult * (1 + 0.3 * (it.ch - 1)) * (1 + 0.06 * (it.up || 0)) * (1 + 0.15 * (it.rank || 0));
    const s = {};
    switch (it.slot) {
      case 'weapon': s.atk = Math.round(4 * m); if (it.r >= 2) s.crit = [0, 0, 3, 5, 8][it.r]; break;
      case 'helmet': s.hp = Math.round(22 * m); break;
      case 'chest': s.def = Math.round(2.5 * m); s.hp = Math.round(12 * m); break;
      case 'gloves': s.atk = Math.round(2 * m); s.crit = [2, 3, 4, 6, 8][it.r]; break;
      case 'boots': s.spd = 1 + it.r + Math.floor((it.rank || 0) / 2); s.dodge = [1, 2, 3, 4, 6][it.r]; s.def = Math.round(1 * m); break;
      case 'amulet': s.amu = { type: it.amu, val: Math.round(MB.AMULETS[it.amu].max * (it.r + 1) / 5 * (1 + 0.1 * (it.rank || 0))) }; break;
    }
    return s;
  };
  MB.itemName = function (it, heroKey) {
    if (it.customName) return it.customName;
    if (it.slot === 'amulet') return MB.AMULETS[it.amu].name;
    if (it.slot === 'weapon') {
      const w = { viking: 'Топоры', knight: 'Меч', gnome: 'Молот', witch: 'Черпак', wizard: 'Посох', archer: 'Лук', boar: 'Булава', ninja: 'Кинжалы' };
      return w[heroKey] || 'Оружие';
    }
    return MB.SLOT_NAME[it.slot];
  };
  MB.itemLines = function (it) {
    const s = MB.itemStats(it), L = [];
    if (s.atk) L.push('Атака +' + s.atk);
    if (s.hp) L.push('Здоровье +' + s.hp);
    if (s.def) L.push('Защита +' + s.def);
    if (s.spd) L.push('Скорость хода +' + s.spd);
    if (s.crit) L.push('Крит +' + s.crit + '%');
    if (s.dodge) L.push('Уворот +' + s.dodge + '%');
    if (s.amu) L.push(MB.AMULETS[s.amu.type].text(s.amu.val));
    return L;
  };
  MB.itemScore = function (it) {
    const s = MB.itemStats(it);
    return (s.atk || 0) * 3 + (s.hp || 0) * 0.5 + (s.def || 0) * 3 + (s.spd || 0) * 4 + (s.crit || 0) * 2 + (s.dodge || 0) * 2 + (s.amu ? 10 * (it.r + 1) : 0);
  };
  // minR — либо минимальная редкость (число), либо ключ сундука
  MB.rollRarity = function (minR, rng) {
    const ch = typeof minR === 'string' ? MB.CHESTS[minR].chance : MB.RARITY_CHANCE;
    let x = (rng || Math.random)() * 100, r = 0;
    for (let i = 0; i < 5; i++) { if (x < ch[i]) { r = i; break; } x -= ch[i]; }
    return typeof minR === 'string' ? r : Math.max(r, minR || 0);
  };
  MB.rollItem = function (save, ch, minR, rng, fixed) {
    rng = rng || Math.random;
    const slot = fixed && fixed.slot || MB.SLOTS[Math.floor(rng() * MB.SLOTS.length)];
    const it = { id: save.nextId++, slot: slot, r: fixed && fixed.r != null ? fixed.r : MB.rollRarity(minR, rng), ch: ch, up: 0, rank: 0 };
    if (slot === 'amulet') { const k = Object.keys(MB.AMULETS); it.amu = fixed && fixed.amu || k[Math.floor(rng() * k.length)]; }
    return it;
  };

  /* ---------- Сохранение ---------- */
  // Покупка эксклюзивного набора: выдаёт вещи в сумку и открывает облик героя (он сразу включается)
  MB.grantSkinPack = function (save, id) {
    const p = MB.SKIN_PACKS.find(x => x.id === id); if (!p) return null;
    save.skins = save.skins || {}; save.skinUse = save.skinUse || {};
    save.skins[p.hero] = p.id; save.skinUse[p.hero] = p.id;
    return p.slots.map(sl => {
      const it = { id: save.nextId++, slot: sl, r: 4, ch: 5, up: 0, rank: 0, heroOnly: p.hero, skinIcon: p.id,
        customName: (p.itemNames && p.itemNames[sl]) || ('Золотой комплект: ' + MB.SLOT_NAME[sl]) };
      save.bag.push(it); return it;
    });
  };
  MB.newSave = function () {
    const s = { v: 1, name: '', avatar: '', sparks: 0, ore: 0, ccoin: 0, heroes: {}, unlocked: ['viking', 'knight'], bag: [], nextId: 1,
      progress: {}, bosses: {}, lair: { date: '', used: {}, diff: {} }, daily: { week: '', claimed: [] },
      skins: {}, skinUse: {}, ckeys: { date: '', free: 2, paid: 0 },
      team: ['viking', 'knight'], auto: false, speed: 1, seenIntro: false, musicMuted: false, musicVol: 0.45, sfxVol: 1, sfxMuted: false, lang: 'ru',
      gems: 50, energy: { val: 200, ts: Date.now() }, potions: { s: 1, m: 0, l: 0 }, energyElixir: false, ads: { date: '', n: 0, potN: 0 }, col: { best: 0 }, clan: null };
    MB.HERO_ORDER.forEach(k => { s.heroes[k] = { lvl: 1, xp: 0, tr: MB.newTree(), resets: 0, equip: {} }; });
    return s;
  };
  // Энергия восстанавливается на 1 каждые regenMin минут, пока меньше максимума
  MB.energyMax = function (save) {
    const b = save && save.clan && save.clan.builds && save.clan.builds.energy ? save.clan.builds.energy : 0;
    return MB.ENERGY.max + (save && save.energyElixir ? MB.ENERGY_ELIXIR.add : 0) + b * 10;
  };
  MB.energy = function (save, nowMs) {
    const E = save.energy, step = MB.ENERGY.regenMin * 60000, max = MB.energyMax(save);
    if (E.val >= max) { E.ts = nowMs; return { val: E.val, max: max, next: 0 }; }
    const add = Math.floor((nowMs - E.ts) / step);
    if (add > 0) { E.val = Math.min(max, E.val + add); E.ts += add * step; if (E.val >= max) E.ts = nowMs; }
    return { val: E.val, max: max, next: E.val >= max ? 0 : step - (nowMs - E.ts) };
  };
  MB.spendEnergy = function (save, nowMs) { const e = MB.energy(save, nowMs); if (e.val < MB.ENERGY.cost) return false; if (save.energy.val >= MB.energyMax(save)) save.energy.ts = nowMs; save.energy.val -= MB.ENERGY.cost; return true; };
  // Покупка эликсира расширения энергии: false — уже куплен или не хватает изумрудов
  MB.buyEnergyElixir = function (save, nowMs) {
    const X = MB.ENERGY_ELIXIR;
    if (save.energyElixir || save.gems < X.gems) return false;
    MB.energy(save, nowMs);   // пока шкала полная, отсчёт восстановления привязан к «сейчас»: так новые единицы пойдут с этого момента
    save.gems -= X.gems; save.energyElixir = true; return true;
  };
  MB.findItem = function (save, id) { return save.bag.find(i => i.id === id); };
  MB.ownerOf = function (save, id) {
    for (const k of MB.HERO_ORDER) for (const sl of MB.SLOTS) if (save.heroes[k].equip[sl] === id) return k;
    return null;
  };
  MB.usedPts = function (h) { let u = 0; for (const k in h.tr) u += h.tr[k][0] + h.tr[k][1] + h.tr[k][2]; return u; };
  MB.freePts = function (h) { return h.lvl - 1 - MB.usedPts(h); };
  MB.heroStats = function (save, key) {
    const h = save.heroes[key], b = MB.HEROES[key], g = 1 + 0.05 * (h.lvl - 1), bon = {};
    for (const k in b.base) bon[k] = b.base[k];
    MB.TREES.forEach(T => T.cols.forEach((col, ci) => { const n = h.tr[T.key][ci]; for (let i = 0; i < n; i++) bon[col[i][0]] = (bon[col[i][0]] || 0) + col[i][1]; }));
    const B = k => bon[k] || 0;
    let atk = b.atk * g * (1 + B('atk') / 100), hp = b.hp * g * (1 + B('hp') / 100), def = b.def * g * (1 + B('def') / 100);
    const infLvl = MB.clanBuildLvl(save, 'infirmary');
    const frgLvl = MB.clanBuildLvl(save, 'forge');
    const barLvl = MB.clanBuildLvl(save, 'barracks');
    if (infLvl > 0) hp *= 1 + infLvl * 0.05;
    if (frgLvl > 0) def *= 1 + frgLvl * 0.05;
    if (barLvl > 0) atk *= 1 + barLvl * 0.05;
    let spd = b.spd + Math.floor((h.lvl - 1) / 5) + B('spd'), crit = b.crit + B('crit'), dodge = b.dodge + B('dodge');   // скорость хода: +1 каждые 5 уровней
    const amu = { crit: 0, hp: 0, dodge: 0, regen: 0, spec: 0, sparks: 0 };
    MB.SLOTS.forEach(sl => {
      const it = h.equip[sl] && MB.findItem(save, h.equip[sl]); if (!it) return;
      const s = MB.itemStats(it);
      atk += s.atk || 0; hp += s.hp || 0; def += s.def || 0; spd += s.spd || 0; crit += s.crit || 0; dodge += s.dodge || 0;
      if (s.amu) amu[s.amu.type] += s.amu.val;
    });
    hp *= 1 + amu.hp / 100; crit += amu.crit; dodge += amu.dodge;
    const boosts = (h.lvl >= 10 ? 1 : 0) + (h.lvl >= 25 ? 1 : 0) + (h.lvl >= 40 ? 1 : 0);
    const st = {
      hp: Math.round(hp), atk: Math.round(atk), def: Math.round(def), spd: spd, crit: Math.min(crit, 75), dodge: Math.min(dodge, 60),
      critDmg: 200 + B('critDmg'), extra: Math.min(B('extra'), 60), stun: Math.min(B('stun'), 50), block: Math.min(B('block'), 60),
      pierce: Math.min(B('pierce'), 80), boss: B('boss'), ctrl: Math.min(B('ctrl'), 80),
      specBonus: Math.round(((1 + 0.15 * boosts) * (1 + (amu.spec + B('spec')) / 100) - 1) * 100), supBonus: Math.round(((1 + 0.15 * boosts) * (1 + B('sup') / 100) - 1) * 100),
      regenPct: amu.regen + B('regen'), sparksBonus: amu.sparks, first: !!B('first')
    };
    st.specPow = 1 + st.specBonus / 100; st.supPow = 1 + st.supBonus / 100; st.regen = st.regenPct / 100;
    st.power = Math.round(st.atk * 4 + st.hp * 0.6 + st.def * 3 + st.spd * 2 + st.crit * 1.5 + st.dodge * 1.5 + (st.critDmg - 200) * 0.3 + st.extra * 2 + st.stun * 2 + st.block * 1.5 +
      st.pierce + st.boss + st.ctrl * 0.5 + st.specBonus * 0.8 + st.supBonus * 0.4 + st.regenPct * 4 + (st.first ? 10 : 0));
    return st;
  };
  MB.power = function (save, key) { return MB.heroStats(save, key).power; };
  MB.teamPower = function (save, team) { return team.reduce((a, k) => a + MB.power(save, k), 0); };
  // Рекомендуемая сила отряда для набора врагов
  MB.enemyPower = function (enemies) {
    let p = 0;
    enemies.forEach(e => { const d = MB.ENEMIES[e.type] || MB.BOSSES[e.type], m = MB.enemyMult(e.lvl);
      p += d.atk * m * (d.boss ? 1 : MB.TUNE.mobAtk) * 4 + d.hp * m * (e.elite ? 1.5 : 1) * (d.boss ? MB.TUNE.bossHp : MB.TUNE.mobHp) * 0.6 + d.def * m * 3 + d.spd * 2; });
    return p;
  };
  MB.recPower = function (enemies) { return Math.round(MB.enemyPower(enemies) * MB.TUNE.rec / 10) * 10; };

  /* ---------- Составы уровней ---------- */
  MB.stageEnemies = function (ch, st) {
    const C = MB.CHAPTERS[ch - 1], L = MB.stageLevel(ch, st);
    const count = st === 1 ? 1 : st <= 4 ? 2 : 3;
    const list = [];
    for (let i = 0; i < count; i++) list.push({ type: C.enemies[(st - 1 + i) % C.enemies.length], lvl: L, elite: st >= 8 && i === 0 });
    return list;
  };
  MB.bossEnemies = function (ch, extraLvl) {
    const C = MB.CHAPTERS[ch - 1], L = MB.bossLevel(ch) + (extraLvl || 0);
    return [{ type: C.boss, lvl: L, boss: true }, { type: C.enemies[0], lvl: L - 2 }, { type: C.enemies[1], lvl: L - 2 }];
  };

  /* ---------- Бой ---------- */
  function mkHeroUnit(save, key, slot, id) {
    const s = MB.heroStats(save, key), d = MB.HEROES[key];
    return { id: id, side: 'hero', slot: slot, key: key, name: d.name, lvl: save.heroes[key].lvl, maxHp: s.hp, hp: s.hp, atk: s.atk, def: s.def, spd: s.spd, crit: s.crit, dodge: s.dodge,
      skills: d.skills, cds: [0, 0, 0], st: {}, shield: 0, shieldDur: 0, freezeImmune: 0, alive: true, specPow: s.specPow, supPow: s.supPow, regen: s.regen, perks: { critMult: s.critDmg / 100, first: s.first }, extra: s.extra, stun: s.stun, block: s.block, pierce: s.pierce, bossDmg: s.boss, ctrl: s.ctrl, nextCrit: false, turns: 0, def0: d };
  }
  function mkEnemyUnit(e, slot, id) {
    const d = MB.ENEMIES[e.type] || MB.BOSSES[e.type], m = MB.enemyMult(e.lvl), hpM = (e.elite ? 1.5 : 1) * (d.boss ? MB.TUNE.bossHp : MB.TUNE.mobHp);
    const hp = e.hpMax ? Math.round(e.hpMax) : Math.round(d.hp * m * hpM);   // hpMax/hpCur — клановый босс с постоянным здоровьем
    const hp0 = e.hpCur != null ? Math.max(1, Math.min(hp, Math.round(e.hpCur))) : hp;
    return { id: id, side: 'enemy', slot: slot, key: e.type, name: d.name, lvl: e.lvl, displayLvl: e.displayLvl || null, maxHp: hp, hp: hp0, atk: Math.round(d.atk * m * (d.boss ? 1 : MB.TUNE.mobAtk)), def: Math.round(d.def * m), spd: d.spd, crit: d.crit || 5, dodge: d.dodge || 0,
      cds: [0, 0, 0], st: {}, shield: 0, shieldDur: 0, freezeImmune: 0, alive: true, specPow: 1, supPow: 1, regen: 0, perks: { critMult: 2 }, extra: 0, stun: 0, block: 0, pierce: 0, bossDmg: 0, ctrl: 0, nextCrit: false, turns: 0, def0: d, boss: !!d.boss, elite: !!e.elite };
  }
  MB.createBattle = function (save, team, enemies, rng) {
    const b = { units: [], round: 0, queue: [], rng: rng || Math.random, result: null };
    team.forEach((k, i) => b.units.push(mkHeroUnit(save, k, i, 'h' + i)));
    // босс встаёт в середину, чтобы не закрывать слуг
    const order = enemies.length === 3 && enemies[0].boss ? [1, 0, 2] : [0, 1, 2];
    enemies.forEach((e, i) => b.units.push(mkEnemyUnit(e, order[i], 'e' + i)));
    return b;
  };
  function U(b, id) { return b.units.find(u => u.id === id); }
  MB.unit = U;
  function alive(b, side) { return b.units.filter(u => u.alive && u.side === side); }
  MB.alive = alive;
  function snap(u) { return { hp: u.hp, shield: u.shield, alive: u.alive, st: Object.keys(u.st).filter(k => u.st[k].dur > 0 || k === 'enrage' || k === 'freeze' || k === 'stun') }; }
  function checkEnd(b) {
    if (!alive(b, 'enemy').length) b.result = 'win'; else if (!alive(b, 'hero').length) b.result = 'lose';
    return b.result;
  }
  function buildQueue(b) {
    b.round++;
    const list = b.units.filter(u => u.alive);
    list.sort((x, y) => {
      if (b.round === 1) { const fx = x.perks.first ? 1 : 0, fy = y.perks.first ? 1 : 0; if (fx !== fy) return fy - fx; }
      if (y.spd !== x.spd) return y.spd - x.spd;
      if (x.side !== y.side) return x.side === 'hero' ? -1 : 1;
      return x.slot - y.slot;
    });
    b.queue = list.map(u => u.id);
    list.forEach(u => { if (u.def0.mech === 'enrage' && u.st.enrage) b.queue.push(u.id); });
  }
  MB.peekQueue = function (b) { return b.queue.filter(id => U(b, id).alive); };

  function dealDamage(b, t, dmg) {
    let absorbed = 0;
    if (t.shield > 0) { absorbed = Math.min(t.shield, dmg); t.shield -= absorbed; dmg -= absorbed; if (t.shield <= 0) t.shieldDur = 0; }
    t.hp = Math.max(0, t.hp - dmg);
    if (t.hp <= 0) { t.alive = false; t.st = {}; t.shield = 0; }
    else if (t.def0.mech === 'enrage' && !t.st.enrage && t.hp < t.maxHp / 2) t.st.enrage = { dur: 99 };
    return absorbed;
  }
  function applyStatus(b, t, type, dur, src) {
    if (!t.alive) return false;
    if (type === 'freeze' || type === 'stun') { if (t.freezeImmune > 0 || t.st.freeze || t.st.stun) return false; if (b.rng() * 100 < t.ctrl) return false; }
    // яд: рост от supPow ограничен — максимум 12% от maxHp за тик по обычным врагам и 5% по боссам,
    // а для яда от героев тик не может превышать 10× атаки наложившего (защита от миллионных тиков по клановому боссу)
    if (type === 'poison') {
      const pct = Math.min((t.boss ? 0.03 : 0.08) * (src ? src.supPow : 1), t.boss ? 0.05 : 0.12);
      const cap = src && src.side === 'hero' ? Math.max(1, Math.round(src.atk * 10)) : 0;
      t.st.poison = { dur: dur, pct: pct, cap: cap };
    } else t.st[type] = { dur: dur, pct: 0 };
    return true;
  }
  function strike(b, a, t, mult, o) {
    o = o || {};
    const r = { id: t.id, kind: 'hit' };
    const dch = (t.st.freeze || t.st.stun) ? 0 : t.dodge + (t.st.stance ? 50 : 0);
    if (b.rng() * 100 < dch) { r.dodge = true; r.snap = snap(t); return r; }
    const crit = o.alwaysCrit || a.nextCrit || b.rng() * 100 < a.crit; if (a.nextCrit) a.nextCrit = false;
    let dmg = a.atk * mult * (o.special ? a.specPow : 1) - t.def * (1 - a.pierce / 100) / 2;
    dmg = Math.max(1, dmg) * (0.9 + b.rng() * 0.2);
    if (crit) dmg *= a.perks.critMult || 2;
    if (a.st.warcry) dmg *= 1.2;
    if (t.st.curse) dmg *= 1.25;
    if (t.def0.mech === 'stoneskin' && !t.st.freeze && !t.st.curse) dmg *= 0.7;
    if (t.boss && a.bossDmg) dmg *= 1 + a.bossDmg / 100;
    if (t.block && !t.st.freeze && !t.st.stun && b.rng() * 100 < t.block) { dmg *= 0.5; r.block = true; }
    dmg = Math.max(1, Math.round(dmg));
    r.absorbed = dealDamage(b, t, dmg); r.dmg = dmg; r.crit = crit; r.dead = !t.alive;
    if (a.def0.lifesteal && a.alive) { const h = Math.min(a.maxHp - a.hp, Math.round(dmg * a.def0.lifesteal)); if (h > 0) { a.hp += h; r.steal = { id: a.id, amt: h, snap: snap(a) }; } }
    if (t.alive && o.status && applyStatus(b, t, o.status.type, o.status.dur, a)) r.status = o.status.type;
    if (t.alive && !r.status && a.stun && b.rng() * 100 < a.stun && applyStatus(b, t, 'stun', 1, a)) r.status = 'stun';
    r.snap = snap(t);
    return r;
  }

  // Начало хода: возвращает {unit, events, skip}. Если бой кончился — b.result.
  MB.nextTurn = function (b) {
    if (b.result) return null;
    let u = null;
    while (!u) {
      if (!b.queue.length) buildQueue(b);
      const c = U(b, b.queue.shift());
      if (c.alive) u = c;
    }
    const ev = [];
    u.turns++;
    // снять истёкшие эффекты
    for (const k in u.st) if (k !== 'enrage' && k !== 'freeze' && k !== 'stun' && u.st[k].dur <= 0) delete u.st[k];
    if (u.shield > 0 && u.shieldDur <= 0) u.shield = 0;
    if (u.st.poison) {
      const raw = Math.max(1, Math.round(u.maxHp * u.st.poison.pct));
      const d = u.st.poison.cap > 0 ? Math.min(raw, u.st.poison.cap) : raw;
      dealDamage(b, u, d);
      ev.push({ t: 'tick', id: u.id, dmg: d, dead: !u.alive, snap: snap(u) });
      if (!u.alive) { checkEnd(b); return { unit: u, events: ev, skip: true, died: true }; }
    }
    if (u.regen > 0 && u.hp < u.maxHp) {
      const h = Math.min(u.maxHp - u.hp, Math.max(1, Math.round(u.maxHp * u.regen))); u.hp += h;
      ev.push({ t: 'heal', id: u.id, amt: h, snap: snap(u) });
    }
    if (u.st.freeze || u.st.stun) {
      const why = u.st.freeze ? 'freeze' : 'stun';
      delete u.st.freeze; delete u.st.stun; u.freezeImmune = 3;
      endTurn(b, u);
      ev.push({ t: 'skip', id: u.id, why: why, snap: snap(u) });
      return { unit: u, events: ev, skip: true };
    }
    return { unit: u, events: ev, skip: false };
  };
  function endTurn(b, u) {
    for (const k in u.st) if (k !== 'enrage' && k !== 'freeze' && k !== 'stun') { if (u.st[k].fresh) u.st[k].fresh = false; else u.st[k].dur--; }
    for (let i = 0; i < 3; i++) if (u.cds[i] > 0) u.cds[i]--;
    if (u.shield > 0) u.shieldDur--;
    if (u.freezeImmune > 0) u.freezeImmune--;
  }

  // Действие героя (или врага через aiEnemy). Возвращает событие 'cast' с результатами.
  MB.act = function (b, u, si, targetId) {
    const sk = u.skills[si], res = [], ev = { t: 'cast', id: u.id, skill: sk, si: si, targets: [], results: res };
    const foes = alive(b, u.side === 'hero' ? 'enemy' : 'hero'), mates = alive(b, u.side);
    let targets = [];
    if (sk.target === 'enemy') { const t = U(b, targetId); targets = [t && t.alive ? t : foes[0]]; }
    else if (sk.target === 'all') targets = foes;
    else if (sk.target === 'ally') { const t = U(b, targetId); targets = [t && t.alive ? t : u]; }
    else if (sk.target === 'team') targets = mates;
    else targets = [u];
    ev.targets = targets.map(t => t.id);
    ev.friendly = sk.target === 'ally' || sk.target === 'team' || sk.target === 'self';
    targets.forEach(t => {
      if (sk.mult) res.push(strike(b, u, t, sk.mult, { special: sk.special, alwaysCrit: sk.alwaysCrit, status: sk.status }));
      else if (sk.heal) { const h = Math.min(t.maxHp - t.hp, Math.round(t.maxHp * sk.heal * u.supPow)); t.hp += h; res.push({ id: t.id, kind: 'heal', amt: h, snap: snap(t) }); }
      else if (sk.shield) { const s = Math.round(t.maxHp * sk.shield * u.supPow); t.shield = Math.max(t.shield, s); t.shieldDur = 3; res.push({ id: t.id, kind: 'shield', amt: s, snap: snap(t) }); }
      else if (sk.status) {
        const ok = applyStatus(b, t, sk.status.type, sk.status.dur, u);
        if (ok && t === u) t.st[sk.status.type].fresh = true;
        res.push({ id: t.id, kind: 'status', status: ok ? sk.status.type : null, snap: snap(t) });
      }
    });
    if (sk.mult && u.alive && u.extra && b.rng() * 100 < u.extra) {
      const left = alive(b, u.side === 'hero' ? 'enemy' : 'hero');
      if (left.length) { const t = targets[0].alive ? targets[0] : left[0], r = strike(b, u, t, u.skills[0].mult, {}); r.extra = true; res.push(r); ev.extra = true; }
    }
    if (sk.cd) u.cds[si] = sk.cd + 1;
    endTurn(b, u); ev.self = snap(u);
    checkEnd(b);
    return ev;
  };

  // Ход врага
  MB.enemyAct = function (b, u) {
    const d = u.def0, heroes = alive(b, 'hero'), mates = alive(b, 'enemy'), res = [];
    const ev = { t: 'cast', id: u.id, skill: { name: 'Атака', pose: 'attack', proj: d.proj2 && d.attackArt && u.turns % d.attackArt.length === 1 ? d.proj2 : d.proj, melee: d.melee }, targets: [], results: res };
    const pick = () => heroes[Math.floor(b.rng() * heroes.length)];
    const sk = d.skill;
    if (sk && u.turns % sk.every === 0) {
      ev.skill = { name: sk.name, pose: 'idle', fx: sk.type === 'shieldSelf' ? 'shield' : 'heal' }; ev.friendly = true;
      if (sk.type === 'shieldSelf') { const s = Math.round(u.maxHp * sk.pct); u.shield = s; u.shieldDur = 3; res.push({ id: u.id, kind: 'shield', amt: s, snap: snap(u) }); ev.targets = [u.id]; }
      else {
        const ts = sk.type === 'healAll' ? mates : [mates.slice().sort((x, y) => x.hp / x.maxHp - y.hp / y.maxHp)[0]];
        ts.forEach(t => { const h = Math.min(t.maxHp - t.hp, Math.round(t.maxHp * sk.pct)); t.hp += h; res.push({ id: t.id, kind: 'heal', amt: h, snap: snap(t) }); });
        ev.targets = ts.map(t => t.id);
      }
    } else if (d.breath && u.turns % 2 === 0) {
      const t = pick(); ev.skill = { name: 'Ледяное дыхание', pose: 'attack', breath: true, big: true }; ev.targets = [t.id];
      res.push(strike(b, u, t, 1.3, { special: true, status: { type: 'freeze', dur: 1 } }));
    } else if (d.aoe) {
      ev.targets = heroes.map(t => t.id);
      heroes.forEach(t => res.push(strike(b, u, t, d.aoe, { special: true })));
    } else {
      let ts = [pick()];
      if (d.multi && heroes.length > 1) { let t2; do { t2 = pick(); } while (t2 === ts[0]); ts.push(t2); }
      ev.targets = ts.map(t => t.id);
      ts.forEach(t => {
        let st = null;
        if (d.onHit) for (const k in d.onHit) if (b.rng() < d.onHit[k]) st = { type: k, dur: k === 'poison' ? 3 : k === 'freeze' ? 1 : 2 };
        res.push(strike(b, u, t, 1, { status: st }));
      });
    }
    endTurn(b, u); ev.self = snap(u);
    checkEnd(b);
    return ev;
  };

  // Автобой героя: выбор действия
  MB.autoChoose = function (b, u) {
    const foes = alive(b, 'enemy'), mates = alive(b, 'hero');
    const weakest = foes.slice().sort((x, y) => x.hp - y.hp)[0];
    const hurt = mates.slice().sort((x, y) => x.hp / x.maxHp - y.hp / y.maxHp)[0];
    for (let i = 1; i < 3; i++) {
      const sk = u.skills[i]; if (u.cds[i] > 0) continue;
      if (sk.heal) { if (hurt.hp / hurt.maxHp < 0.6) return { si: i }; continue; }
      if (sk.shield) { if (hurt.hp / hurt.maxHp < 0.6 && hurt.shield <= 0) return { si: i, target: hurt.id }; continue; }
      if (sk.status && !sk.mult) {
        if (sk.target === 'all' && foes.every(f => f.st[sk.status.type])) continue;
        if (sk.target === 'team' && mates.every(m => m.st[sk.status.type])) continue;
        return { si: i };
      }
      if (sk.status && sk.status.type === 'freeze') {
        const c = foes.filter(f => !f.freezeImmune && !f.st.freeze && !f.st.stun).sort((x, y) => y.atk - x.atk)[0];
        if (c) return { si: i, target: c.id }; continue;
      }
      if (sk.target === 'all' && foes.length < 2 && sk.mult < 1) continue;
      return { si: i, target: sk.target === 'enemy' ? (foes.slice().sort((x, y) => y.hp - x.hp)[0]).id : undefined };
    }
    return { si: 0, target: weakest.id };
  };

  // Быстрый прогон боя без отрисовки (для проверки баланса)
  MB.simulate = function (save, team, enemies, rng) {
    const b = MB.createBattle(save, team, enemies, rng); let guard = 0;
    while (!b.result && guard++ < 2000) {
      const t = MB.nextTurn(b); if (!t || t.skip) continue;
      if (t.unit.side === 'hero') { const c = MB.autoChoose(b, t.unit); MB.act(b, t.unit, c.si, c.target); } else MB.enemyAct(b, t.unit);
    }
    return { result: b.result || 'lose', turns: guard, b: b };
  };

  /* ---------- Ежедневный вход ---------- */
  MB.dayKey = function (d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  MB.utc3DayKey = function (d) { const u = new Date(d.getTime() + 3 * 3600000); return u.getUTCFullYear() + '-' + String(u.getUTCMonth() + 1).padStart(2, '0') + '-' + String(u.getUTCDate()).padStart(2, '0'); };
  MB.weekInfo = function (now) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate()), idx = (d.getDay() + 6) % 7;
    const mon = new Date(d); mon.setDate(d.getDate() - idx);
    return { week: MB.dayKey(mon), idx: idx, today: MB.dayKey(d) };
  };
  MB.dailyState = function (save, now) {
    const w = MB.weekInfo(now);
    if (save.daily.week !== w.week) save.daily = { week: w.week, claimed: [false, false, false, false, false, false, false] };
    const c = save.daily.claimed;
    const broken = c.slice(0, Math.min(w.idx, 6)).some(x => !x);   // пропущен хотя бы один из прошедших дней Пн–Сб
    const days = c.map((v, i) => {
      if (v) return 'claimed';
      if (i < w.idx) return 'missed';
      if (i === 6 && broken) return 'locked';
      return i === w.idx ? 'today' : 'future';
    });
    return { idx: w.idx, days: days, canClaim: days[w.idx] === 'today', broken: broken };
  };
  MB.lairState = function (save, now) {
    const w = MB.utc3WeekKey(now);
    if (!save.lair) save.lair = { week: '', used: 0, diff: {} };
    if (save.lair.week !== w) {
      save.lair.week = w;
      save.lair.used = 0;
      if (!save.lair.diff) save.lair.diff = {};
    } else if (typeof save.lair.used === 'object' && save.lair.used !== null) {
      let sum = 0;
      for (const k in save.lair.used) sum += (save.lair.used[k] || 0);
      save.lair.used = sum;
    }
    if (save.lair.used == null) save.lair.used = 0;
    return save.lair;
  };
  MB.accountPower = function (save) { return save.unlocked.reduce((a, k) => a + MB.power(save, k), 0); };
  MB.accountLevel = function (save) { return save.unlocked.reduce((a, k) => a + save.heroes[k].lvl, 0); };
  // Тестовый рейтинг: соперники — боты с фиксированной силой (100 позиций)
  MB.ratingBots = function () {
    const names = ['ГромоБорода', 'Лисичка_96', 'ТёмныйЛорд', 'Мурзик', 'Акела', 'Шаман_Вася', 'Кузнечик', 'Валькирия', 'DarkElf', 'Снежок', 'Рыцарь_Ордена', 'Котлетка', 'Бармалей', 'Гномик', 'Ведьмочка', 'Северянин',
      'Хоббит', 'Медоед', 'Злой_Тролль', 'Огонёк', 'Варвар', 'ЗвёздныйМаг', 'Карамелька', 'Берсерк', 'Сова', 'Дракоша', 'Леший', 'Барсик_ПРО', 'Ниндзя', 'Ёжик',
      'Тихий_Охотник', 'Молния', 'Хрусталь', 'Буян', 'Черепаха', 'Пират_Джо', 'Лунная_Кошка', 'Грибник', 'Стрела', 'Кочевник',
      'Мастер_Руны', 'Пепел', 'Сивый', 'Радуга', 'Топор_Правды', 'Ночная_Фея', 'Болотник', 'Кристалл', 'Вихрь', 'Тигрица',
      'Старейшина', 'Пирожок', 'Громила', 'Тень_Леса', 'Рубин', 'Хранитель', 'Ясный_Сокол', 'Кедр', 'Волкодав', 'Искорка',
      'Паладин_77', 'Морозко', 'Жнец', 'Буревестник', 'Смолка', 'Купец', 'Астроном', 'Рыжая_Бестия', 'Молотобоец', 'Туман',
      'Скиталец', 'Громозека', 'Лучница_Лэя', 'Чародей', 'Прыгун', 'Барсук', 'Змееглав', 'Травник', 'Соколиный_Глаз', 'Дуболом',
      'Мята', 'Скальд', 'Призрак', 'Кремень', 'Лютик', 'Разбойник', 'Жнец_Душ', 'Опоссум', 'Звонарь', 'Пустынник',
      'Кобра', 'Шипастик', 'Медвежонок', 'Витязь', 'Солнцеликий', 'Мгла', 'Проворный', 'Усач', 'Громошквал', 'Ледяной'];
    return names.map((n, i) => { const t = i / (names.length - 1), p = Math.round(600 * Math.pow(36, 1 - t) / 10) * 10; return { name: n, power: p, level: Math.max(3, Math.min(390, Math.round(p / 600 * 9.5))) }; });
  };
  MB.topChapter = function (save) { let c = 1; for (let i = 1; i <= 4; i++) if (save.bosses[i]) c = i + 1; return c; };

  /* ---------- Кланы ---------- */
  MB.CLAN = {
    createCost: 100,                              // изумруды за создание своего клана
    baseMembers: 10,                              // базовый размер клана при создании
    bossHp: () => 5000000,                        // единое здоровье кланового босса во всех кланах: 5 000 000
    bossLvl: () => 10,                            // единый боевой уровень кланового босса во всех кланах
    expFor: lvl => 80 * lvl,                      // опыт до следующего уровня клана
    donateOre: 20, donateExp: 25,                 // вклад: 20 руды → 25 опыта клану
    clanFightExp: 5,                              // опыт клану за 1 битву с боссом
    killExp: 40                                   // опыт клану за победу над боссом
  };
  MB.CLAN_RECRUIT = {
    free: { id: 'free', name: 'Свободный вход', desc: 'Игроки вступают в клан сразу без заявки.' },
    apply: { id: 'apply', name: 'Одобрение заявки', desc: 'Игроки отправляют заявку — лидер или офицер одобряет или отклоняет её.' },
    closed: { id: 'closed', name: 'Закрытый клан', desc: 'Закрытый клан: приём новых игроков закрыт, заявки отклоняются автоматически.' }
  };
  MB.CLAN_ROLE_NAME = {
    leader: 'Лидер',
    officer: 'Офицер',
    member: 'Участник'
  };
  MB.clanMaxMembers = function (clanOrLvl) {
    const lvl = typeof clanOrLvl === 'number' ? clanOrLvl : (clanOrLvl && clanOrLvl.lvl) || 1;
    return Math.max(10, 10 + (lvl - 1)) + (lvl >= 10 ? 1 : 0);
  };
  // Кланы-боты, в которые можно вступить (в игре на площадке — настоящие кланы игроков)
  MB.CLAN_NPC = [
    { name: 'Орден Рассвета', lvl: 12, recruit: 'free' }, { name: 'Топоры Севера', lvl: 9, recruit: 'apply' },
    { name: 'Хранители Рощи', lvl: 7, recruit: 'free' }, { name: 'Псы Войны', lvl: 15, recruit: 'apply' },
    { name: 'Клубок Змей', lvl: 5, recruit: 'free' }, { name: 'Серебряный Легион', lvl: 20, recruit: 'closed' },
    { name: 'Кот и Кинжал', lvl: 4, recruit: 'free' }, { name: 'Дети Грозы', lvl: 10, recruit: 'apply' }
  ];
  MB.clanBossInfo = function (clan) {
    const art = 'andoor';   // постоянный клановый босс — Король Лич Андоор
    const lvl = MB.CLAN.bossLvl(clan && clan.bossLvl);
    const maxHp = MB.CLAN.bossHp(clan && clan.bossLvl);
    return { art: art, name: MB.BOSSES[art].name, lvl: lvl, displayLvl: 100, maxHp: maxHp };
  };
  // Участники-боты: сила рядом с силой игрока (на площадке — настоящие игроки)
  MB.clanBots = function (save, n, rng, withRoles) {
    rng = rng || Math.random;
    const pool = MB.ratingBots().map(b => b.name).slice(), out = [];
    const me = Math.max(200, MB.accountPower(save));
    let idx = 0;
    while (out.length < n && pool.length) {
      const i = Math.floor(rng() * pool.length), name = pool.splice(i, 1)[0];
      const role = withRoles ? (idx === 0 ? 'leader' : (idx === 1 ? 'officer' : 'member')) : 'member';
      out.push({ id: 'm_' + (idx++) + '_' + Math.floor(rng() * 100000), name: name, power: Math.max(100, Math.round(me * (0.5 + rng() * 1.1) / 10) * 10), role: role, contrib: 0, bossDmg: 0 });
    }
    return out;
  };
  MB.mkClan = function (save, name, own, lvl, emblem, desc, iconId, recruitMode) {
    const bossLvl = MB.CLAN.bossLvl(1);
    const bossHp = MB.CLAN.bossHp(1);
    const botCount = own ? 3 : Math.min(MB.clanMaxMembers(lvl || 1) - 1, 5 + Math.floor(Math.random() * 4));
    const bots = MB.clanBots(save, botCount, null, !own);
    const apps = own ? [
      { id: 'app_1', name: 'Искатель_Рун', power: Math.max(150, Math.round(MB.accountPower(save) * 0.85 / 10) * 10), level: Math.max(2, Math.round(MB.accountLevel(save) * 0.8)) },
      { id: 'app_2', name: 'Северная_Искра', power: Math.max(150, Math.round(MB.accountPower(save) * 1.05 / 10) * 10), level: Math.max(2, MB.accountLevel(save)) }
    ] : [];
    return { name: String(name || '').slice(0, MB.CLAN_NAME_MAX), desc: MB.sanitizeClanDesc(desc || ''), icon: iconId || 'axes_red',
      own: !!own, myRole: own ? 'leader' : 'member', recruit: recruitMode || 'free',
      lvl: lvl || 1, exp: 0, bossLvl: bossLvl, bossHp: bossHp, myBossDmg: 0, lastFight: '', day: '',
      emblem: emblem ? Object.assign({}, emblem) : MB.defaultEmblem(),
      members: bots,
      applicants: apps };
  };
  // Ежедневная активность соклановцев: приносят клану опыт (вызывается при входе в клан)
  MB.clanTick = function (save, now, rng) {
    const c = MB.ensureClan(save); if (!c) return null;
    const t = MB.dayKey(now); if (c.day === t) return null;
    c.day = t; rng = rng || Math.random;
    let gain = 0, bossHitTotal = 0;
    c.members.forEach(m => {
      gain += 2 + Math.floor(rng() * 5);
      const hit = Math.max(120, Math.round(((m.power || 300) * (0.35 + rng() * 0.55))));
      m.bossDmg = (m.bossDmg || 0) + hit;
      bossHitTotal += hit;
    });
    if (bossHitTotal > 0 && typeof c.bossHp === 'number' && c.bossHp > 1) {
      c.bossHp = Math.max(1, c.bossHp - bossHitTotal);
    }
    const ups = MB.clanAddExp(save, gain);
    return { gain: gain, ups: ups, bossHitTotal: bossHitTotal };
  };
  MB.clanAddExp = function (save, n) {
    const c = save.clan; if (!c) return 0;
    c.exp += n; let ups = 0;
    while (c.exp >= MB.CLAN.expFor(c.lvl)) {
      c.exp -= MB.CLAN.expFor(c.lvl);
      c.lvl++;
      c.pts = (c.pts || 0) + 1;
      ups++;
    }
    return ups;
  };
  MB.clanBuildLvl = function (save, key) {
    const c = save && save.clan;
    if (!c || !c.builds) return 0;
    return Math.max(0, Math.min(MB.CLAN.maxBuildLvl || 20, +(c.builds[key] || 0)));
  };
  // Бонус клана к Искрам за бой: уровень клана + (Банк * 5%)
  MB.clanSparksBonus = function (save) {
    if (!save || !save.clan) return 0;
    return (save.clan.lvl || 0) + MB.clanBuildLvl(save, 'bank') * 5;
  };
  MB.clanTop20 = function (save) {
    const npcIcons = (MB.CLAN_ICONS && MB.CLAN_ICONS.length) ? MB.CLAN_ICONS : [{ id: 'axes_red' }];
    const extraNames = [
      'Железный Легион', 'Северные Волки', 'Хранители Бездны', 'Клинки Зари', 'Владыки Пепла',
      'Крылья Бури', 'Стражи Кристалла', 'Сумеречный Дозор', 'Охотники Ночи', 'Когти Тигра',
      'Пламя Севера', 'Щит Империи', 'Ледяные Клыки', 'Сыны Грома'
    ];
    const baseList = MB.CLAN_NPC.map((c, i) => {
      const em = Object.assign({}, c.emblem || {}, { icon: c.icon || npcIcons[i % npcIcons.length].id });
      const cap = MB.clanMaxMembers(c.lvl);
      const cnt = Math.min(cap, 6 + (c.lvl % 6));
      const power = c.lvl * 1450 + (8 - i) * 180;
      return { name: c.name, lvl: c.lvl, power: power, members: cnt, maxMembers: cap, recruit: c.recruit || 'free', emblem: em, isNpc: true, npcIdx: i };
    });
    extraNames.forEach((nm, idx) => {
      const lvl = Math.max(2, 18 - idx);
      const cap = MB.clanMaxMembers(lvl);
      const cnt = Math.min(cap, 5 + ((lvl + idx) % 6));
      const power = lvl * 1380 + (14 - idx) * 150;
      const em = { shape: 'shield', color: 'red', rim: 'gold', symbol: 'sword', icon: npcIcons[(idx + 3) % npcIcons.length].id };
      baseList.push({ name: nm, lvl: lvl, power: power, members: cnt, maxMembers: cap, recruit: idx % 3 === 0 ? 'closed' : (idx % 2 === 0 ? 'apply' : 'free'), emblem: em, isNpc: false });
    });
    if (save && save.clan) {
      const c = MB.ensureClan(save);
      const myPower = MB.accountPower(save) + (c.members || []).reduce((s, m) => s + (m.power || 0), 0) + (c.lvl || 1) * 800;
      const cap = MB.clanMaxMembers(c);
      const cnt = 1 + (c.members ? c.members.length : 0);
      baseList.push({ name: c.name, lvl: c.lvl, power: myPower, members: cnt, maxMembers: cap, recruit: c.recruit || 'free', emblem: c.emblem, isMe: true });
    }
    return baseList.sort((a, b) => b.power - a.power).slice(0, 20);
  };


  /* ---------- Совместимость расширенных кланов (гербы, постройки, награды) ---------- */
  MB.CLAN_EMBLEM = MB.CLAN_EMBLEM || {
    shapes: [{ id: 'shield', name: 'Щит' }],
    colors: [{ id: 'red', name: 'Алый', top: '#c93b2b', bot: '#7a1c12' }],
    rims: [{ id: 'gold', name: 'Золото' }],
    symbols: [{ id: 'sword', name: 'Меч' }]
  };
  MB.defaultEmblem = MB.defaultEmblem || function () { return { shape: 'shield', color: 'red', rim: 'gold', symbol: 'sword' }; };
  MB.CLAN.maxBuildLvl = 20;
  MB.CLAN_BUILDINGS = [
    { key: 'infirmary', name: 'Лазарет', img: 'assets/ui/lazaret.webp', desc: l => '+' + (l * 5) + '% здоровья всем персонажам' },
    { key: 'forge', name: 'Кузня', img: 'assets/ui/forge.webp', desc: l => '+' + (l * 5) + '% защиты всем персонажам' },
    { key: 'bank', name: 'Банк', img: 'assets/ui/bank.webp', desc: l => '+' + (l * 5) + '% дополнительных Искр за бои' },
    { key: 'barracks', name: 'Казарма', img: 'assets/ui/kazarma.webp', desc: l => '+' + (l * 5) + '% атаки всем персонажам' }
  ];
  MB.CLAN_CHESTS = [
    { name: 'Сундук новичка', pts: 150, sparks: 30, ore: 10, cc: 25, gems: 0, chest: 'wood' },
    { name: 'Сундук дружины', pts: 375, sparks: 70, ore: 20, cc: 50, gems: 0, chest: 'blue' },
    { name: 'Сундук клана', pts: 750, sparks: 140, ore: 35, cc: 100, gems: 0, chest: 'purple' }
  ];
  MB.ensureClan = MB.ensureClan || function (save) {
    const c = save && save.clan; if (!c) return null;
    if (!c.emblem) c.emblem = MB.defaultEmblem();
    if (!c.icon) c.icon = 'axes_red';
    if (c.desc == null) c.desc = '';
    if (!c.myRole) c.myRole = c.own ? 'leader' : 'member';
    if (c.myRole === 'leader') c.own = true;
    if (!c.recruit || !MB.CLAN_RECRUIT[c.recruit]) c.recruit = 'free';
    if (!Array.isArray(c.members)) c.members = [];
    let hasLeader = c.myRole === 'leader';
    c.members.forEach((m, idx) => {
      if (!m.id) m.id = 'm_' + idx + '_' + (idx + 1);
      if (!m.role) m.role = (!hasLeader && idx === 0) ? 'leader' : 'member';
      if (m.role === 'leader') hasLeader = true;
      if (m.contrib == null) m.contrib = 0;
    });
    if (!Array.isArray(c.applicants)) c.applicants = [];
    if (!c.builds) c.builds = {};
    if (c.pts == null) c.pts = 0;
    if (c.actPts == null) c.actPts = 0;
    if (!c.actClaimed) c.actClaimed = [];
    if (c.myContrib == null) c.myContrib = 0;
    if (c.myBossDmg == null) c.myBossDmg = 0;
    c.members.forEach(m => { if (m.bossDmg == null) m.bossDmg = 0; });
    const fixedLvl = MB.CLAN.bossLvl(1);
    const fixedHp = MB.CLAN.bossHp(1);
    if (c.bossLvl !== fixedLvl) c.bossLvl = fixedLvl;
    if (typeof c.bossHp !== 'number' || c.bossHp <= 0 || c.bossHp > fixedHp) c.bossHp = fixedHp;
    return c;
  };
  MB.clanHasRewards = MB.clanHasRewards || function () { return false; };
  MB.clanAddActivity = MB.clanAddActivity || function (save, act, contrib) {
    const c = MB.ensureClan(save); if (!c) return;
    c.actPts = (c.actPts || 0) + (act || 0);
    c.myContrib = (c.myContrib || 0) + (contrib || 0);
  };
  MB.clanTaskProgress = MB.clanTaskProgress || function () {};
  MB.clanUpgradeBuild = function (save, key) {
    const c = MB.ensureClan(save); if (!c) return false;
    const myRole = c.myRole || (c.own ? 'leader' : 'member');
    if (myRole !== 'leader') return false;
    const def = MB.CLAN_BUILDINGS.find(x => x.key === key); if (!def) return false;
    const maxL = MB.CLAN.maxBuildLvl || 20;
    const cur = +(c.builds[key] || 0);
    if ((c.pts || 0) <= 0 || cur >= maxL) return false;
    c.builds[key] = cur + 1;
    c.pts -= 1;
    return true;
  };


  MB.CLAN_ICONS = [
    { id: 'axes_red', name: 'Топоры', file: 'clan_axes_red.webp', color: '#c92a42' },
    { id: 'spears_green', name: 'Копья', file: 'clan_spears_green.webp', color: '#2b6e3f' },
    { id: 'hammer_navy', name: 'Молот', file: 'clan_hammer_navy.webp', color: '#1d3557' },
    { id: 'daggers_purple', name: 'Клинки', file: 'clan_daggers_purple.webp', color: '#5a2d82' },
    { id: 'fist_crimson', name: 'Кулак', file: 'clan_fist_crimson.webp', color: '#7a1c24' },
    { id: 'bow_brown', name: 'Лук', file: 'clan_bow_brown.webp', color: '#9c5221' },
    { id: 'wolf_slate', name: 'Волк', file: 'clan_wolf_slate.webp', color: '#4f6272' },
    { id: 'raven_slate', name: 'Ворон', file: 'clan_raven_slate.webp', color: '#4a5c6a' },
    { id: 'dragon_maroon', name: 'Дракон', file: 'clan_dragon_maroon.webp', color: '#6b1d24' },
    { id: 'paw_rust', name: 'Лапа', file: 'clan_paw_rust.webp', color: '#a64b22' },
    { id: 'lion_crimson', name: 'Лев', file: 'clan_lion_crimson.webp', color: '#9e1b2a' },
    { id: 'stag_green', name: 'Олень', file: 'clan_stag_green.webp', color: '#2c6b3f' },
    { id: 'eagle_blue', name: 'Орёл', file: 'clan_eagle_blue.webp', color: '#1f6fa5' },
    { id: 'cobra_olive', name: 'Кобра', file: 'clan_cobra_olive.webp', color: '#5c6b2e' },
    { id: 'frost_ice', name: 'Стужа', file: 'clan_frost_ice.webp', color: '#6bb8d9' },
    { id: 'flame_orange', name: 'Пламя', file: 'clan_flame_orange.webp', color: '#c84b19' },
    { id: 'crystal_purple', name: 'Кристалл', file: 'clan_crystal_purple.webp', color: '#6e3894' },
    { id: 'bolt_navy', name: 'Молния', file: 'clan_bolt_navy.webp', color: '#243b5a' },
    { id: 'sun_gold', name: 'Солнце', file: 'clan_sun_gold.webp', color: '#d49b1a' },
    { id: 'tree_green', name: 'Древо', file: 'clan_tree_green.webp', color: '#276b3a' },
    { id: 'moon_indigo', name: 'Луна', file: 'clan_moon_indigo.webp', color: '#393d7a' },
    { id: 'rose_wine', name: 'Роза', file: 'clan_rose_wine.webp', color: '#6e2338' },
    { id: 'trident_teal', name: 'Трезубец', file: 'clan_trident_teal.webp', color: '#1b5e63' },
    { id: 'peaks_slate', name: 'Горы', file: 'clan_peaks_slate.webp', color: '#63717a' },
    { id: 'feather_rust', name: 'Перо', file: 'clan_feather_rust.webp', color: '#a84c20' },
    { id: 'skull_charcoal', name: 'Череп', file: 'clan_skull_charcoal.webp', color: '#383c42' },
    { id: 'crown_crimson', name: 'Корона', file: 'clan_crown_crimson.webp', color: '#9e1f2e' },
    { id: 'eye_wine', name: 'Око', file: 'clan_eye_wine.webp', color: '#7d2238' },
    { id: 'hourglass_brown', name: 'Часы', file: 'clan_hourglass_brown.webp', color: '#8f4f1d' },
    { id: 'tower_rust', name: 'Башня', file: 'clan_tower_rust.webp', color: '#9e4724' }
  ];
  MB.CLAN_NAME_MAX = 20;
  MB.CLAN_DESC_MAX = 200;
  MB.validateClanName = function (raw) {
    const s = String(raw || '').replace(/\s+/g, ' ').trim();
    if (!s.length) return { ok: false, reason: 'Введите название клана (до 20 символов)' };
    if (s.length > MB.CLAN_NAME_MAX) return { ok: false, reason: 'Название не длиннее 20 символов' };
    if (!/^[A-Za-zА-Яа-яЁё +\-]+$/.test(s)) return { ok: false, reason: 'Разрешены русские и латинские буквы, пробел, «-» и «+»' };
    return { ok: true, value: s };
  };
  MB.sanitizeClanDesc = function (raw) {
    return String(raw || '').slice(0, MB.CLAN_DESC_MAX);
  };

  root.MB = MB;
  if (typeof module !== 'undefined' && module.exports) module.exports = MB;
})(typeof window !== 'undefined' ? window : globalThis);
