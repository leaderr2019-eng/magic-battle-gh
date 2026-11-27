/* Magic Battle — сетевой слой, SDK-адаптер и синхронизация клана в реальном времени. */
(function (root) {
  'use strict';
  const MB = root.MB = root.MB || {};

  const cfg = Object.assign({
    mode: 'auto',          // 'auto' | 'local' | 'remote'
    apiUrl: '',            // например 'https://your-clan-api.example.com'
    wsUrl: '',             // например 'wss://your-clan-api.example.com/ws'
    pollMs: 4000,          // резервный опрос состояния клана (мс)
    sharedClanId: 'global_astoria_clan', // общий клан всех игроков на площадке (или конкретный clanId)
    allowGuests: false     // true = можно кланы/рейтинг без SDK площадки (для тестов)
  }, root.MB_NET_CONFIG || {});

  const bc = (typeof BroadcastChannel !== 'undefined') ? new BroadcastChannel('mb_clan_sync_v1') : null;

  function uid(prefix) {
    return (prefix || 'tx') + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }

  /* ---------- Валидация подлинности аккаунтов ---------- */
  // Источники ID: platform (SDK площадки) — доверенный; guest (локальный plr_*) — не для рейтинга/кланов на площадке
  const AUTH = {
    // Локальные/гостевые ID, сгенерированные клиентом
    guestIdRe: /^(plr_|tx_|m_\d+_)/i,
    // Запрещённые/тестовые префиксы и имена
    bannedIdRe: /^(bot_|npc_|test_|fake_|dummy_)/i,
    bannedNameRe: /^(bot|npc|test|admin|null|undefined|guest|гость)$/i,
    // Допустимый ID: 2–64 символа, буквы/цифры/_-:.@
    idRe: /^[A-Za-z0-9_.:\-@]{2,64}$/,
    nameMax: 24
  };

  function getPlatformSdk() {
    return root.PikabuSDK || root.GameSDK || root.YandexGamesSDK || null;
  }

  function sanitizeName(raw) {
    let n = String(raw == null ? '' : raw).replace(/[\u0000-\u001f\u007f]/g, '').trim();
    n = n.replace(/\s+/g, ' ').slice(0, AUTH.nameMax);
    return n;
  }

  function isGuestId(id) {
    return !id || AUTH.guestIdRe.test(String(id));
  }

  function isBannedId(id) {
    return !id || AUTH.bannedIdRe.test(String(id));
  }

  function isValidIdFormat(id) {
    return typeof id === 'string' && AUTH.idRe.test(id) && !isBannedId(id);
  }

  function isValidDisplayName(name) {
    const n = sanitizeName(name);
    if (!n || n.length < 2) return false;
    if (AUTH.bannedNameRe.test(n)) return false;
    return true;
  }

  // Читает игрока из SDK площадки (если доступен)
  function readSdkPlayer() {
    const sdk = getPlatformSdk();
    if (!sdk) return null;
    try {
      if (typeof sdk.getPlayer === 'function') {
        const p = sdk.getPlayer();
        if (p && (p.id || p.uid || p.userId)) {
          return {
            id: String(p.id || p.uid || p.userId),
            name: sanitizeName(p.name || p.displayName || p.nickname || ''),
            avatar: p.avatar || p.photo || '',
            source: 'sdk'
          };
        }
      }
      if (sdk.player && (sdk.player.id || sdk.player.uid)) {
        return {
          id: String(sdk.player.id || sdk.player.uid),
          name: sanitizeName(sdk.player.name || sdk.player.displayName || ''),
          avatar: sdk.player.avatar || '',
          source: 'sdk'
        };
      }
    } catch (e) { /* SDK недоступен */ }
    return null;
  }

  /**
   * Проверка подлинности аккаунта.
   * verified = true только если ID пришёл с площадки (SDK) или уже помечен как platform.
   * guest/local — можно играть офлайн, но не попадают в общий рейтинг/кланы как «реальные».
   */
  function validateAccount(save, opts) {
    opts = opts || {};
    const sdkPlayer = readSdkPlayer();
    let id = '';
    let name = '';
    let source = 'guest';
    let verified = false;
    const reasons = [];

    if (sdkPlayer && isValidIdFormat(sdkPlayer.id) && !isGuestId(sdkPlayer.id)) {
      id = sdkPlayer.id;
      name = sdkPlayer.name || sanitizeName(save && save.name) || 'Игрок';
      source = 'platform';
      verified = true;
    } else if (save && save.playerId && isValidIdFormat(save.playerId) && !isGuestId(save.playerId) && save.authSource === 'platform') {
      // Ранее подтверждённый platform-ID (SDK был, сейчас недоступен — доверяем сохранённому флагу)
      id = String(save.playerId);
      name = sanitizeName(save.name) || 'Игрок';
      source = 'platform';
      verified = true;
      reasons.push('sdk_unavailable_cached');
    } else {
      // Гостевой режим: стабильный локальный ID
      id = (save && save.playerId && isValidIdFormat(save.playerId)) ? String(save.playerId) : uid('plr');
      if (!isValidIdFormat(id) || isGuestId(id) === false && isBannedId(id)) {
        id = uid('plr');
      }
      name = sanitizeName(save && save.name) || 'Игрок';
      source = 'guest';
      verified = false;
      if (!getPlatformSdk()) reasons.push('no_sdk');
      else reasons.push('sdk_no_player');
    }

    if (!isValidIdFormat(id)) {
      reasons.push('bad_id_format');
      verified = false;
    }
    if (isBannedId(id)) {
      reasons.push('banned_id');
      verified = false;
    }
    if (!isValidDisplayName(name)) {
      name = verified ? ('Игрок_' + id.slice(-4)) : 'Игрок';
      reasons.push('name_sanitized');
    }

    // Требование платформы (для сетевых действий)
    if (opts.requirePlatform && !verified) {
      return {
        ok: false,
        verified: false,
        source: source,
        id: id,
        name: name,
        reasons: reasons.concat(['platform_required']),
        error: 'Требуется вход через аккаунт площадки'
      };
    }

    return {
      ok: true,
      verified: verified,
      source: source,
      id: id,
      name: name,
      reasons: reasons,
      error: null
    };
  }

  // Фильтр участников/записей рейтинга: только валидные ID, без гостевых и забаненных префиксов
  function isAuthenticPlayerEntry(entry) {
    if (!entry || !entry.id) return false;
    const id = String(entry.id);
    if (!isValidIdFormat(id)) return false;
    if (isGuestId(id) || isBannedId(id)) return false;
    if (entry.name && AUTH.bannedNameRe.test(sanitizeName(entry.name))) return false;
    return true;
  }

  // Адаптер профиля игрока: SDK площадки → доверенный ID; иначе гость.
  function resolvePlayerProfile(save) {
    const v = validateAccount(save || {});
    if (save) {
      save.playerId = v.id;
      save.authSource = v.source;
      save.authVerified = !!v.verified;
      if (v.verified && v.name && (!save.name || save.name === 'Игрок')) {
        save.name = v.name;
      }
    }
    return {
      id: v.id,
      name: (save && save.name) || v.name || 'Игрок',
      power: MB.accountPower ? MB.accountPower(save) : 0,
      level: MB.accountLevel ? MB.accountLevel(save) : 1,
      verified: v.verified,
      source: v.source
    };
  }

  function isRemoteEnabled() {
    if (cfg.mode === 'local') return false;
    return Boolean(cfg.apiUrl || cfg.wsUrl);
  }

  // Применяет серверный снимок клана к локальному объекту clan и сохраняет его
  function applyServerClanSnapshot(save, snap, persistFn) {
    if (!snap || typeof snap !== 'object') return null;
    const c = MB.ensureClan(save) || MB.mkClan(save, snap.name || 'Астория', false, snap.lvl || 1);
    if (snap.name && !snap.name.startsWith('clan_')) c.name = String(snap.name).slice(0, MB.CLAN_NAME_MAX || 20);
    if (typeof snap.lvl === 'number') c.lvl = Math.max(1, snap.lvl);
    if (typeof snap.exp === 'number') c.exp = Math.max(0, snap.exp);
    if (typeof snap.pts === 'number') c.pts = Math.max(0, snap.pts);
    if (typeof snap.bossHp === 'number') c.bossHp = Math.max(0, snap.bossHp);
    if (typeof snap.bossLvl === 'number') c.bossLvl = snap.bossLvl;
    if (typeof snap.actPts === 'number') c.actPts = Math.max(0, snap.actPts);
    if (Array.isArray(snap.actClaimed)) c.actClaimed = snap.actClaimed.slice();
    if (snap.builds && typeof snap.builds === 'object') c.builds = Object.assign({}, snap.builds);
    if (Array.isArray(snap.members)) {
      c.members = snap.members
        .map(m => Object.assign({
          id: m.id,
          name: sanitizeName(m.name) || 'Игрок',
          power: m.power || 0,
          role: m.role || 'member',
          contrib: m.contrib || 0,
          bossDmg: m.bossDmg || 0
        }, m))
        // Отсекаем гостевые/фейковые записи; себя оставляем всегда
        .filter(m => m.id === save.playerId || m.isMe || isAuthenticPlayerEntry(m));
      const meRow = c.members.find(m => m.id === save.playerId || m.isMe);
      if (meRow) {
        c.myContrib = meRow.contrib || 0;
        c.myBossDmg = meRow.bossDmg || 0;
        if (meRow.role) {
          c.myRole = meRow.role;
          c.own = meRow.role === 'leader';
        }
      }
    }
    if (typeof snap.myContrib === 'number') c.myContrib = snap.myContrib;
    if (typeof snap.myBossDmg === 'number') c.myBossDmg = snap.myBossDmg;
    save.clan = c;
    if (typeof persistFn === 'function') persistFn();
    return c;
  }

  // Синхронизирует запись текущего игрока в списке участников клана
  function upsertSelfInMembers(clan, player, deltaContrib, deltaDmg) {
    if (!clan || !player) return;
    if (!Array.isArray(clan.members)) clan.members = [];
    let row = clan.members.find(m => m.id === player.id);
    if (!row) {
      row = {
        id: player.id,
        name: player.name,
        power: player.power,
        role: clan.myRole || (clan.own ? 'leader' : 'member'),
        contrib: 0,
        bossDmg: 0
      };
      clan.members.push(row);
    }
    row.name = player.name || row.name;
    row.power = player.power || row.power;
    if (deltaContrib) row.contrib = (row.contrib || 0) + deltaContrib;
    if (deltaDmg) row.bossDmg = (row.bossDmg || 0) + deltaDmg;
    clan.myContrib = row.contrib;
    clan.myBossDmg = row.bossDmg;
  }

  // Проверяет, не применялась ли уже транзакция (защита от двойного начисления при ретраях)
  function markTxOnce(save, txId) {
    if (!txId) return true;
    save._appliedClanTx = save._appliedClanTx || {};
    if (save._appliedClanTx[txId]) return false;
    save._appliedClanTx[txId] = Date.now();
    // Очищаем старые ключи, оставляя последние 200
    const keys = Object.keys(save._appliedClanTx);
    if (keys.length > 200) {
      keys.slice(0, keys.length - 200).forEach(k => delete save._appliedClanTx[k]);
    }
    return true;
  }

  const subscribers = new Set();
  let pollTimer = null;
  let ws = null;
  let currentSaveRef = null;
  let currentPersistRef = null;

  function notifySubscribers(payload) {
    subscribers.forEach(fn => {
      try { fn(payload); } catch (e) { /* */ }
    });
  }

  async function apiPost(path, body) {
    if (!cfg.apiUrl) return null;
    const base = cfg.apiUrl.replace(/\/+$/, '');
    const res = await fetch(base + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {})
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  }

  async function apiGet(path) {
    if (!cfg.apiUrl) return null;
    const base = cfg.apiUrl.replace(/\/+$/, '');
    const res = await fetch(base + path, { method: 'GET' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  }

  function connectRealtime(clanId) {
    if (!isRemoteEnabled()) return;
    const targetId = clanId || cfg.sharedClanId;
    if (cfg.wsUrl && typeof WebSocket !== 'undefined') {
      const connect = () => {
        try {
          if (ws) { try { ws.close(); } catch (e) { /* */ } }
          const sep = cfg.wsUrl.indexOf('?') >= 0 ? '&' : '?';
          ws = new WebSocket(cfg.wsUrl + sep + 'clanId=' + encodeURIComponent(targetId));
          ws.onopen = () => { console.log('[ws] connected', targetId); };
          ws.onmessage = evt => {
            try {
              const msg = JSON.parse(evt.data);
              if (msg && msg.type === 'ping') {
                ws.send(JSON.stringify({ type: 'pong', ts: Date.now() }));
                return;
              }
              if (msg && msg.type === 'clan_state' && msg.clan && currentSaveRef) {
                applyServerClanSnapshot(currentSaveRef, msg.clan, currentPersistRef);
                notifySubscribers({ source: 'ws', event: msg.event || null, clan: currentSaveRef.clan });
              }
            } catch (e) { /* */ }
          };
          ws.onclose = () => {
            console.log('[ws] disconnected, reconnecting...');
            setTimeout(connect, 3000);
          };
          ws.onerror = () => { try { ws.close(); } catch (e) {} };
        } catch (e) { setTimeout(connect, 5000); }
      };
      connect();
    }

    if (pollTimer) clearInterval(pollTimer);
    if (cfg.apiUrl && cfg.pollMs > 0) {
      pollTimer = setInterval(() => {
        if (!currentSaveRef || !currentSaveRef.clan) return;
        MB.net.refreshClanState(currentSaveRef, currentPersistRef).catch(() => {});
      }, cfg.pollMs);
    }
  }

  if (bc) {
    bc.onmessage = evt => {
      const data = evt && evt.data;
      if (!data || data.type !== 'clan_update' || !currentSaveRef || !currentSaveRef.clan) return;
      if (data.senderId && currentSaveRef.playerId === data.senderId) return;
      if (data.clanSnap) {
        applyServerClanSnapshot(currentSaveRef, data.clanSnap, currentPersistRef);
        notifySubscribers({ source: 'broadcast', event: data.event || null, clan: currentSaveRef.clan });
      }
    };
  }

  function broadcastLocalClan(save, eventInfo) {
    if (!bc || !save || !save.clan) return;
    try {
      bc.postMessage({
        type: 'clan_update',
        senderId: save.playerId,
        event: eventInfo || null,
        clanSnap: {
          name: save.clan.name,
          lvl: save.clan.lvl,
          exp: save.clan.exp,
          pts: save.clan.pts,
          bossHp: save.clan.bossHp,
          bossLvl: save.clan.bossLvl,
          actPts: save.clan.actPts,
          actClaimed: save.clan.actClaimed,
          builds: save.clan.builds,
          members: save.clan.members
        }
      });
    } catch (e) { /* */ }
  }

  MB.net = {
    config: cfg,
    isRemote: isRemoteEnabled,
    getPlayerProfile: resolvePlayerProfile,
    /** Проверка подлинности текущего/переданного аккаунта */
    validateAccount: validateAccount,
    /** Аккаунт подтверждён площадкой (SDK) */
    isVerified: function (save) {
      const s = save || currentSaveRef;
      if (!s) return false;
      if (typeof s.authVerified === 'boolean') return s.authVerified;
      return !!(validateAccount(s).verified);
    },
    /** Можно ли участвовать в сетевом рейтинге/кланах */
    canJoinCompetitive: function (save) {
      const s = save || currentSaveRef;
      // Локальный режим — всегда можно (одиночная игра)
      if (!isRemoteEnabled()) return true;
      // Тесты без SDK площадки: allowGuests: true в MB_NET_CONFIG
      if (cfg.allowGuests) return !!(s && s.playerId);
      return !!(s && validateAccount(s, { requirePlatform: true }).ok);
    },
    isAuthenticEntry: isAuthenticPlayerEntry,
    sanitizeName: sanitizeName,
    subscribe(fn) {
      subscribers.add(fn);
      return () => subscribers.delete(fn);
    },
    attachContext(save, persistFn) {
      currentSaveRef = save;
      currentPersistRef = persistFn;
      resolvePlayerProfile(save);
      if (typeof persistFn === 'function') persistFn();
      if (save && save.clan && isRemoteEnabled()) {
        connectRealtime(save.clan && save.clan.id ? save.clan.id : cfg.sharedClanId);
      }
    },
    async refreshClanState(save, persistFn) {
      const clan = MB.ensureClan(save);
      if (!clan || !isRemoteEnabled() || !cfg.apiUrl) return clan;
      const clanId = clan.id || cfg.sharedClanId;
      const data = await apiGet('/clans/' + encodeURIComponent(clanId) + '?playerId=' + encodeURIComponent(save.playerId || ''));
      if (data && data.clan) {
        applyServerClanSnapshot(save, data.clan, persistFn);
        notifySubscribers({ source: 'poll', event: null, clan: save.clan });
      }
      return save.clan;
    },
    // Отправка результата битвы с клановым боссом и применение наград по формулам
    async submitClanBattle(save, payload, persistFn) {
      const clan = MB.ensureClan(save);
      if (!clan) return null;
      const player = resolvePlayerProfile(save);
      const txId = payload.txId || uid('boss_battle');
      if (!markTxOnce(save, txId)) {
        return { duplicate: true, dealt: payload.dealt || 0, sparks: 0, ore: 0, gems: 0, xp: 0, cc: 0, items: [], notes: [] };
      }

      if (isRemoteEnabled() && cfg.apiUrl) {
        try {
          const resp = await apiPost('/clans/' + encodeURIComponent(clan.id || cfg.sharedClanId) + '/battle', {
            txId: txId,
            player: player,
            dealt: payload.dealt || 0,
            fled: !!payload.fled,
            win: !!payload.win
          });
          if (resp && resp.clan) {
            applyServerClanSnapshot(save, resp.clan, persistFn);
          }
          if (resp && resp.reward) {
            return resp.reward;
          }
        } catch (e) {
          // Если сеть недоступна — применяем локально с тем же txId
        }
      }

      const dealt = Math.max(0, Math.round(payload.dealt || 0));
      const fled = !!payload.fled;
      const out = { sparks: 0, ore: 0, gems: 0, xp: 0, cc: 0, items: [], notes: [], dealt: dealt };

      out.xp = MB.XP.clanFight;
      out.cc = MB.CCOIN.clanFight;
      save.ccoin = (save.ccoin || 0) + out.cc;
      (payload.partKeys || []).forEach(() => {});
      if (typeof payload.grantHeroXp === 'function') {
        payload.grantHeroXp(out.xp).forEach(u => out.notes.push(MB.HEROES[u.key].name + ' достиг ' + u.to + ' уровня!'));
      }

      let addedAct = 0;
      if (!fled && dealt > 0) {
        out.sparks = Math.round(dealt / 300);
        save.sparks += out.sparks;
        addedAct = 5;
        MB.clanAddActivity(save, addedAct, addedAct);
        MB.clanTaskProgress(save, 'dmg', dealt);
      }
      upsertSelfInMembers(clan, player, addedAct, (!fled && dealt > 0) ? dealt : 0);

      const ups = MB.clanAddExp(save, MB.CLAN.clanFightExp || 5);
      if (ups) out.notes.push('Клан вырос до ' + clan.lvl + ' уровня! Получено очко прокачки клана.');

      const bossDefeated = Boolean(payload.defeated) || (clan.bossHp - dealt <= 0 && !fled && dealt > 0);
      if (bossDefeated) {
        const bl = clan.bossLvl;
        out.gems = 200;
        save.gems += out.gems;
        out.ore = 200;
        save.ore += out.ore;
        if (typeof payload.grantPurpleChest === 'function') {
          out.items.push(payload.grantPurpleChest());
          out.chest = 'purple';
        }
        MB.clanAddExp(save, MB.CLAN.killExp);
        out.xp += MB.XP.clanKill;
        out.cc += MB.CCOIN.clanKill;
        save.ccoin += MB.CCOIN.clanKill;
        if (typeof payload.grantHeroXp === 'function') {
          payload.grantHeroXp(MB.XP.clanKill).forEach(u => out.notes.push(MB.HEROES[u.key].name + ' достиг ' + u.to + ' уровня!'));
        }
        out.notes.push('Победа над боссом: всем соклановцам +' + MB.XP.clanKill + ' XP и +' + MB.CCOIN.clanKill + ' клановых монет!');
        out.notes.push('Клановый босс повержен! Завтра его место займёт более сильный противник.');
        clan.bossLvl = MB.CLAN.bossLvl(1);
        clan.bossHp = MB.CLAN.bossHp(1);
      } else {
        clan.bossHp = Math.max(1, clan.bossHp - dealt);
      }

      if (typeof persistFn === 'function') persistFn();
      broadcastLocalClan(save, { kind: 'battle', playerName: player.name, dealt: dealt, defeated: bossDefeated });
      notifySubscribers({ source: 'local', event: { kind: 'battle', dealt: dealt }, clan: clan });
      return out;
    },
    // Синхронизация пожертвования руды в казну
    async submitClanDonate(save, n, persistFn) {
      const clan = MB.ensureClan(save);
      if (!clan) return null;
      const count = Math.max(1, +n || 1);
      const cost = MB.CLAN.donateOre * count;
      if (save.ore < cost) return null;
      const player = resolvePlayerProfile(save);
      const txId = uid('donate');
      if (!markTxOnce(save, txId)) return null;

      if (isRemoteEnabled() && cfg.apiUrl) {
        try {
          const resp = await apiPost('/clans/' + encodeURIComponent(clan.id || cfg.sharedClanId) + '/donate', {
            txId: txId,
            player: player,
            count: count,
            oreCost: cost,
            expGain: MB.CLAN.donateExp * count,
            actGain: 10 * count
          });
          if (resp && resp.clan) {
            save.ore = Math.max(0, save.ore - cost);
            applyServerClanSnapshot(save, resp.clan, persistFn);
            return { ups: resp.ups || 0, expGain: MB.CLAN.donateExp * count, actGain: 10 * count };
          }
        } catch (e) { /* fallback на локальную логику */ }
      }

      save.ore -= cost;
      const expGain = MB.CLAN.donateExp * count;
      const actGain = 10 * count;
      const ups = MB.clanAddExp(save, expGain);
      MB.clanAddActivity(save, actGain, actGain);
      upsertSelfInMembers(clan, player, actGain, 0);
      MB.clanTaskProgress(save, 'donate', cost);
      if (typeof persistFn === 'function') persistFn();
      broadcastLocalClan(save, { kind: 'donate', playerName: player.name, expGain: expGain, actGain: actGain });
      notifySubscribers({ source: 'local', event: { kind: 'donate' }, clan: clan });
      return { ups: ups, expGain: expGain, actGain: actGain };
    },
    // Синхронизация улучшения постройки клана лидером
    async submitClanBuildUpgrade(save, buildKey, persistFn) {
      const clan = MB.ensureClan(save);
      if (!clan) return false;
      const player = resolvePlayerProfile(save);
      const txId = uid('build');
      if (!markTxOnce(save, txId)) return false;

      if (isRemoteEnabled() && cfg.apiUrl) {
        try {
          const resp = await apiPost('/clans/' + encodeURIComponent(clan.id || cfg.sharedClanId) + '/build', {
            txId: txId,
            player: player,
            buildKey: buildKey
          });
          if (resp && resp.ok && resp.clan) {
            applyServerClanSnapshot(save, resp.clan, persistFn);
            return true;
          }
        } catch (e) { /* fallback на локальную логику */ }
      }

      const ok = MB.clanUpgradeBuild(save, buildKey);
      if (!ok) return false;
      if (typeof persistFn === 'function') persistFn();
      broadcastLocalClan(save, { kind: 'build', buildKey: buildKey });
      notifySubscribers({ source: 'local', event: { kind: 'build' }, clan: clan });
      return true;
    },
    // Синхронизация получения недельного сундука активности
    async submitClanChestClaim(save, chestIdx, persistFn) {
      const clan = MB.ensureClan(save);
      const ch = MB.CLAN_CHESTS && MB.CLAN_CHESTS[chestIdx];
      if (!clan || !ch) return null;
      const player = resolvePlayerProfile(save);
      const txId = uid('chest_' + chestIdx);
      if (!markTxOnce(save, txId)) return null;

      if (isRemoteEnabled() && cfg.apiUrl) {
        try {
          const resp = await apiPost('/clans/' + encodeURIComponent(clan.id || cfg.sharedClanId) + '/chest', {
            txId: txId,
            player: player,
            chestIdx: chestIdx
          });
          if (resp && resp.ok && resp.clan) {
            applyServerClanSnapshot(save, resp.clan, persistFn);
            save.sparks += ch.sparks || 0;
            save.ore += ch.ore || 0;
            save.ccoin = (save.ccoin || 0) + (ch.cc || 0);
            if (typeof persistFn === 'function') persistFn();
            return { ch: ch, serverHandled: true };
          }
        } catch (e) { /* fallback на локальную логику */ }
      }

      if (clan.actClaimed[chestIdx] || (clan.actPts || 0) < ch.pts) return null;
      clan.actClaimed[chestIdx] = true;
      save.sparks += ch.sparks || 0;
      save.ore += ch.ore || 0;
      save.ccoin = (save.ccoin || 0) + (ch.cc || 0);
      if (typeof persistFn === 'function') persistFn();
      broadcastLocalClan(save, { kind: 'chest', chestIdx: chestIdx });
      notifySubscribers({ source: 'local', event: { kind: 'chest' }, clan: clan });
      return { ch: ch, serverHandled: false };
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
