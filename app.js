const API = (path) => `api/${path}`;
const AUTH = (path) => `auth/${path}`;

let currentSession = {
  logged:false,
  user_id:null,
  is_admin:false,
  name:null,
  email:null,
  is_special_liquidity_user:false,
  special_liquidity_email:null
};

/* ========= Helpers ========= */
function table(rows, keys, labels){
  const thead = `<thead><tr>${labels.map(l=>`<th>${l}</th>`).join('')}</tr></thead>`;
  const tbody = `<tbody>${rows.map(r=>`<tr>${keys.map(k=>`<td>${(r[k]??'')}</td>`).join('')}</tr>`).join('')}</tbody>`;
  return `<table class="tbl">${thead}${tbody}</table>`;
}
function needLogin(){
  document.getElementById('view').innerHTML = `<h1>Login necessário</h1><p>Use o formulário à esquerda (ou registre um novo usuário).</p>`;
}
async function getJSON(url, opts={}){
  const r = await fetch(url, { credentials:'include', ...opts });
  if (r.status === 401) return { __auth:false };
  if (r.status === 403){
    const err = await r.json().catch(()=>({}));
    return { __forbidden:true, ...err };
  }
  const data = await r.json().catch(()=>({}));
  return data;
}

function formatBRL(value){
  const num = Number.isFinite(value) ? value : Number(value) || 0;
  return num.toLocaleString('pt-BR', { style:'currency', currency:'BRL' });
}
function formatBTC(value){
  const num = Number.isFinite(value) ? value : Number(value) || 0;
  return num.toLocaleString('pt-BR', { minimumFractionDigits:2, maximumFractionDigits:8 });
}
function formatNumber(value, digits=2){
  const num = Number.isFinite(value) ? value : Number(value) || 0;
  return num.toLocaleString('pt-BR', { minimumFractionDigits:digits, maximumFractionDigits:digits });
}
function esc(str){
  return String(str ?? '').replace(/[&<>"']/g, s=>({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  })[s]);
}

function formatSpecialAssetAction(action){
  const key = String(action ?? '').toLowerCase();
  return SPECIAL_ASSET_ACTION_LABELS[key] || (key ? key.charAt(0).toUpperCase() + key.slice(1) : '');
}
function formatSpecialAssetAmountText(asset, amount){
  const key = String(asset ?? '').toLowerCase();
  const value = Number(amount);
  if (!Number.isFinite(value)) {
    return String(amount ?? '');
  }
  if (key === 'brl') {
    return formatBRL(value);
  }
  if (key === 'bitcoin') {
    return formatBTC(value);
  }
  if (key === 'nft') {
    return String(Math.round(value));
  }
  if (key === 'quotas') {
    return formatNumber(value, 4);
  }
  return formatNumber(value);
}

/* ========= Liquidity Game ========= */
let liquidityGame = null;
let liquidityPlayers = [];
let liquidityGameSaveTimer = null;
let liquidityGameLastSaved = null;
let liquiditySpecialAssets = null;

function serializeLiquidityGameState(state){
  if (!state) return null;
  const normalizeNumber = (value, fallback = 0)=>{
    if (value === null || typeof value === 'undefined' || value === '') return fallback;
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
  };
  const teams = Array.isArray(state.teams) ? state.teams.map(team=>{
    const userId = (()=>{
      if (!team || team.userId === null || typeof team.userId === 'undefined') return null;
      const parsed = Number(team.userId);
      if (Number.isFinite(parsed)) return parsed;
      const fallback = parseInt(team.userId, 10);
      return Number.isFinite(fallback) ? fallback : null;
    })();
    return {
      id: normalizeNumber(team && team.id, 0),
      userId,
      playerName: team && typeof team.playerName === 'string' ? team.playerName : '',
      name: team && typeof team.name === 'string' ? team.name : '',
      cash: normalizeNumber(team && team.cash),
      btc: normalizeNumber(team && team.btc),
      nftHand: normalizeNumber(team && team.nftHand),
      poolShares: normalizeNumber(team && team.poolShares),
      eliminated: !!(team && team.eliminated)
    };
  }) : [];
  const history = Array.isArray(state.history) ? state.history.map(item=>{
    const ts = item && item.timestamp instanceof Date
      ? item.timestamp
      : (item && item.timestamp ? new Date(item.timestamp) : null);
    const iso = ts && Number.isFinite(ts.getTime()) ? ts.toISOString() : null;
    const entry = {
      team: typeof (item && item.team) === 'string' ? item.team : null,
      message: typeof (item && item.message) === 'string' ? item.message : '',
      timestamp: iso
    };
    if (item && Object.prototype.hasOwnProperty.call(item, 'round')){
      entry.round = normalizeNumber(item.round, 0);
    }
    return entry;
  }) : [];
  return {
    teams,
    pool: {
      nfts: normalizeNumber(state.pool && state.pool.nfts, 0),
      shares: normalizeNumber(state.pool && state.pool.shares, 0)
    },
    history,
    stage: typeof state.stage === 'string' ? state.stage : 'regular',
    championId: (state.championId === null || typeof state.championId === 'undefined')
      ? null
      : (()=>{
        const parsed = Number(state.championId);
        return Number.isFinite(parsed) ? parsed : null;
      })()
  };
}

function deserializeLiquidityGameState(data){
  if (!data || typeof data !== 'object') return null;
  const normalizeNumber = (value, fallback = 0)=>{
    if (value === null || typeof value === 'undefined' || value === '') return fallback;
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
  };
  const teams = Array.isArray(data.teams) ? data.teams.map((team, idx)=>{
    const idValue = normalizeNumber(team && team.id, idx + 1);
    const userIdValue = (()=>{
      if (!team || team.userId === null || typeof team.userId === 'undefined') return null;
      const parsed = Number(team.userId);
      if (Number.isFinite(parsed)) return parsed;
      const fallback = parseInt(team.userId, 10);
      return Number.isFinite(fallback) ? fallback : null;
    })();
    const nameValue = team && typeof team.name === 'string'
      ? team.name
      : (team && typeof team.playerName === 'string' && team.playerName
        ? team.playerName
        : `Jogador ${idx + 1}`);
    return {
      id: idValue,
      userId: userIdValue,
      playerName: team && typeof team.playerName === 'string' ? team.playerName : '',
      name: nameValue,
      cash: normalizeNumber(team && team.cash),
      btc: normalizeNumber(team && team.btc),
      nftHand: normalizeNumber(team && team.nftHand),
      poolShares: normalizeNumber(team && team.poolShares),
      eliminated: !!(team && team.eliminated)
    };
  }) : [];
  const history = Array.isArray(data.history) ? data.history.map(item=>{
    const iso = item && typeof item.timestamp === 'string' ? item.timestamp : null;
    const date = iso ? new Date(iso) : null;
    const validDate = date && Number.isFinite(date.getTime()) ? date : null;
    const entry = {
      team: item && typeof item.team === 'string' ? item.team : null,
      message: item && typeof item.message === 'string' ? item.message : '',
      timestamp: validDate
    };
    if (item && Object.prototype.hasOwnProperty.call(item, 'round')){
      entry.round = normalizeNumber(item.round, 0);
    }
    return entry;
  }) : [];
  return {
    teams,
    pool: {
      nfts: normalizeNumber(data.pool && data.pool.nfts, 0),
      shares: normalizeNumber(data.pool && data.pool.shares, 0)
    },
    history,
    stage: typeof data.stage === 'string' ? data.stage : 'regular',
    championId: (data.championId === null || typeof data.championId === 'undefined')
      ? null
      : (()=>{
        const parsed = Number(data.championId);
        return Number.isFinite(parsed) ? parsed : null;
      })()
  };
}

const SPECIAL_ASSET_FIELDS = ['bitcoin', 'nft', 'brl', 'quotas'];
const SPECIAL_ASSET_LABELS = {
  bitcoin: 'Bitcoin (BTC)',
  nft: 'NFTs',
  brl: 'Saldo em R$',
  quotas: 'Cotas'
};

const SPECIAL_ASSET_ACTION_LABELS = {
  buy: 'Compra',
  sell: 'Venda',
  deposit: 'Depósito'
};

function summarizeUserAssets(assets){
  const normalized = normalizeSpecialAssets(assets);
  return [
    { key:'bitcoin', label:'Bitcoin', value: formatBTC(normalized.bitcoin), detail:'Saldo em BTC' },
    { key:'nft', label:'NFTs', value: String(normalized.nft), detail:'Quantidade de NFTs registrados' },
    { key:'brl', label:'Reais (R$)', value: formatBRL(normalized.brl), detail:'Saldo disponível em moeda fiduciária' },
    { key:'quotas', label:'Cotas', value: formatNumber(normalized.quotas, 4), detail:'Participação na piscina de liquidez' }
  ];
}

function renderUserAssetCardsHtml(assets){
  return summarizeUserAssets(assets).map(item => `
    <div class="user-asset-card" data-asset="${esc(item.key)}">
      <span>${esc(item.label)}</span>
      <strong>${esc(item.value)}</strong>
      <small>${esc(item.detail)}</small>
    </div>
  `).join('');
}

function normalizeSpecialAssets(raw){
  const base = {
    bitcoin: 0,
    nft: 0,
    brl: 0,
    quotas: 0
  };
  if (!raw || typeof raw !== 'object') return { ...base };
  const result = { ...base };
  SPECIAL_ASSET_FIELDS.forEach(key => {
    const value = raw[key];
    if (key === 'nft') {
      const parsed = Number(value);
      result[key] = Number.isFinite(parsed) ? Math.round(parsed) : 0;
    } else {
      const parsed = Number(value);
      result[key] = Number.isFinite(parsed) ? parsed : 0;
    }
  });
  return result;
}

function normalizeOtherUsersSummary(raw){
  const normalized = {
    count: 0,
    assets: normalizeSpecialAssets()
  };
  if (!raw || typeof raw !== 'object') {
    return normalized;
  }
  const count = Number(raw.count);
  normalized.count = Number.isFinite(count) ? count : 0;
  normalized.assets = normalizeSpecialAssets(raw.assets);
  return normalized;
}

function normalizeOtherUsersList(raw){
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.map(user => {
    const id = Number(user && user.id);
    const normalizedId = Number.isFinite(id) ? id : null;
    const name = user && typeof user.name === 'string' && user.name.trim()
      ? user.name.trim()
      : (Number.isFinite(id) ? `Usuário #${id}` : 'Usuário desconhecido');
    return {
      id: normalizedId,
      name,
      assets: normalizeSpecialAssets(user && user.assets)
    };
  }).filter(user => user.id !== null);
}

function describeOtherUsersHeadline(count){
  if (count === 1) {
    return 'Há 1 outro usuário confirmado com ativos registrados.';
  }
  if (count > 1) {
    return `Há ${count} outros usuários confirmados com ativos registrados.`;
  }
  return 'Nenhum outro usuário confirmado possui ativos registrados no momento.';
}

function formatOtherAssetAvailability(key, amount, count){
  if (!count) {
    return 'Nenhum outro usuário confirmado possui ativos disponíveis.';
  }
  const numericAmount = Number.isFinite(amount) ? amount : 0;
  const formattedAmount = (() => {
    if (key === 'brl') {
      return formatBRL(numericAmount);
    }
    if (key === 'nft') {
      return formatNumber(Math.round(numericAmount), 0);
    }
    if (key === 'bitcoin') {
      return formatBTC(numericAmount);
    }
    return formatNumber(numericAmount, 8);
  })();
  if (numericAmount <= 0) {
    return count === 1
      ? 'O outro usuário confirmado não possui este ativo disponível no momento.'
      : 'Os demais usuários confirmados não possuem este ativo disponível no momento.';
  }
  if (count === 1) {
    return `O outro usuário confirmado possui ${formattedAmount} disponíveis.`;
  }
  return `Os ${count} outros usuários confirmados somam ${formattedAmount} disponíveis.`;
}

function ensureSpecialAssets(){
  if (!currentSession.is_special_liquidity_user) {
    return null;
  }
  if (!liquiditySpecialAssets) {
    liquiditySpecialAssets = normalizeSpecialAssets();
  } else {
    liquiditySpecialAssets = normalizeSpecialAssets(liquiditySpecialAssets);
  }
  return liquiditySpecialAssets;
}

function getSpecialAssetsPayload(){
  if (!currentSession.is_special_liquidity_user) return null;
  const ensured = ensureSpecialAssets();
  if (!ensured) return null;
  return { ...ensured };
}

function formatSpecialAssetValue(key, value){
  if (typeof value !== 'number' || Number.isNaN(value)) value = 0;
  if (key === 'nft') return String(Math.round(value));
  const decimals = key === 'brl' ? 2 : 8;
  return value.toFixed(decimals);
}

function setSpecialAssetValue(key, value){
  if (!currentSession.is_special_liquidity_user) return;
  const ensured = ensureSpecialAssets();
  if (!ensured) return;
  const numeric = Number(value);
  let sanitized = Number.isFinite(numeric) ? numeric : 0;
  if (key === 'nft') {
    sanitized = Math.max(0, Math.round(sanitized));
  } else if (key === 'brl') {
    sanitized = Math.round(sanitized * 100) / 100;
  } else {
    sanitized = Math.round(sanitized * 1e8) / 1e8;
  }
  ensured[key] = sanitized;
  liquiditySpecialAssets = normalizeSpecialAssets(ensured);
  scheduleLiquidityGameSave(true);
}

function renderSpecialLiquidityAssetsPanel(){
  if (!currentSession.is_special_liquidity_user) return '';
  const assets = ensureSpecialAssets() || normalizeSpecialAssets();
  const emailInfo = currentSession.special_liquidity_email
    ? `<p class="hint">Ativos vinculados ao usuário <strong>${esc(currentSession.special_liquidity_email)}</strong>.</p>`
    : '';
  const inputs = SPECIAL_ASSET_FIELDS.map(field => {
    const label = SPECIAL_ASSET_LABELS[field] || field;
    const id = `specialAsset${field.charAt(0).toUpperCase()}${field.slice(1)}`;
    const step = field === 'nft' ? '1' : (field === 'brl' ? '0.01' : '0.00000001');
    const minAttr = field === 'nft' ? ' min="0"' : '';
    const value = esc(formatSpecialAssetValue(field, assets[field]));
    return `
      <label class="special-asset-card">
        <span>${esc(label)}</span>
        <input type="number" id="${id}" step="${step}"${minAttr} value="${value}">
      </label>`;
  }).join('');
  return `
    <section class="section special-assets-panel">
      <h2>Ativos protegidos</h2>
      ${emailInfo}
      <div class="special-assets-grid">
        ${inputs}
      </div>
      <p class="hint">Qualquer ajuste exige autenticação do usuário especial e é salvo imediatamente.</p>
    </section>`;
}

function attachSpecialAssetsListeners(){
  if (!currentSession.is_special_liquidity_user) return;
  SPECIAL_ASSET_FIELDS.forEach(field => {
    const id = `specialAsset${field.charAt(0).toUpperCase()}${field.slice(1)}`;
    const input = document.getElementById(id);
    if (!input) return;
    input.addEventListener('change', ()=>{
      setSpecialAssetValue(field, input.value);
      const ensured = ensureSpecialAssets();
      if (ensured) {
        input.value = formatSpecialAssetValue(field, ensured[field]);
      }
    });
  });
}

async function persistLiquidityGameState(force=false){
  const payload = liquidityGame ? serializeLiquidityGameState(liquidityGame) : null;
  const requestBody = { state: payload };
  const specialPayload = getSpecialAssetsPayload();
  if (specialPayload) {
    requestBody.special_assets = specialPayload;
  }
  const serialized = JSON.stringify(requestBody);
  if (!force && liquidityGameLastSaved === serialized) return;
  try {
    const response = await fetch(API('liquidity_game_state.php'), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: serialized
    });
    if (response.status === 401) {
      liquidityGameLastSaved = serialized;
      return;
    }
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json().catch(()=>null);
    if (currentSession.is_special_liquidity_user && result && result.special_assets) {
      liquiditySpecialAssets = normalizeSpecialAssets(result.special_assets);
    }
    const snapshot = { state: payload };
    const updatedSpecial = getSpecialAssetsPayload();
    if (updatedSpecial) snapshot.special_assets = updatedSpecial;
    liquidityGameLastSaved = JSON.stringify(snapshot);
  } catch (err) {
    console.error('Erro ao salvar estado do jogo:', err);
  }
}

function scheduleLiquidityGameSave(force=false){
  if (liquidityGameSaveTimer){
    clearTimeout(liquidityGameSaveTimer);
  }
  liquidityGameSaveTimer = setTimeout(()=>{
    liquidityGameSaveTimer = null;
    void persistLiquidityGameState(force);
  }, force ? 0 : 250);
}

async function loadLiquidityGameState(){
  if (liquidityGameSaveTimer){
    clearTimeout(liquidityGameSaveTimer);
    liquidityGameSaveTimer = null;
  }
  const data = await getJSON(API('liquidity_game_state.php'));
  if (data.__auth === false) return false;
  if (!data || typeof data !== 'object' || !Object.prototype.hasOwnProperty.call(data, 'state')){
    return true;
  }
  if (currentSession.is_special_liquidity_user) {
    liquiditySpecialAssets = normalizeSpecialAssets(data.special_assets);
  } else {
    liquiditySpecialAssets = null;
  }
  const loaded = deserializeLiquidityGameState(data.state);
  if (loaded){
    liquidityGame = loaded;
    const snapshot = { state: serializeLiquidityGameState(liquidityGame) };
    const specialPayload = getSpecialAssetsPayload();
    if (specialPayload) snapshot.special_assets = specialPayload;
    liquidityGameLastSaved = JSON.stringify(snapshot);
  } else {
    liquidityGame = null;
    const snapshot = { state: null };
    const specialPayload = getSpecialAssetsPayload();
    if (specialPayload) snapshot.special_assets = specialPayload;
    liquidityGameLastSaved = JSON.stringify(snapshot);
  }
  return true;
}

function createLiquidityGame(players, minPlayers = 1){
  const list = Array.isArray(players) ? players : [];
  const validPlayers = list
    .map(player => ({
      userId: typeof player.id === 'number' ? player.id : (parseInt(player.id, 10) || null),
      playerName: typeof player.name === 'string' ? player.name.trim() : '',
      assets: normalizeSpecialAssets(player && player.assets)
    }))
    .filter(p => p.userId !== null || p.playerName);

  const requiredPlayers = Number.isFinite(minPlayers) && minPlayers > 0 ? Math.floor(minPlayers) : 1;
  if (validPlayers.length < requiredPlayers) return null;

  const teams = validPlayers.map((player, idx)=>{
    const assets = normalizeSpecialAssets(player && player.assets);
    const fallbackName = `Jogador ${idx + 1}`;
    const baseName = player.playerName || fallbackName;
    return {
      id: idx + 1,
      userId: player.userId,
      playerName: baseName,
      name: baseName,
      cash: assets.brl,
      btc: assets.bitcoin,
      nftHand: assets.nft,
      poolShares: assets.quotas,
      eliminated: false
    };
  });

  return {
    teams,
    pool: { nfts:0, shares:0 },
    history: [],
    stage: 'regular',
    championId: null
  };
}

const LIQUIDITY_STAGE_LABELS = {
  regular: 'Fase classificatória',
  semifinal: 'Semifinal',
  final: 'Final',
  finished: 'Jogo encerrado'
};

function activeLiquidityTeams(state){
  return state.teams.filter(t=>!t.eliminated);
}

async function viewLiquidityGame(){
  const view = document.getElementById('view');
  const data = await getJSON(API('users.php'));
  if (data.__auth===false) return needLogin();

  liquidityPlayers = (Array.isArray(data.users) ? data.users : []).map(player => {
    const assets = normalizeSpecialAssets(player && player.assets);
    return {
      id: player ? player.id : null,
      name: (player && typeof player.name === 'string') ? player.name.trim() : '',
      assets
    };
  });
  const stateLoaded = await loadLiquidityGameState();
  if (stateLoaded === false) return needLogin();
  const minPlayers = currentSession.is_admin ? 2 : 1;
  const playerCount = liquidityPlayers.length;
  const playerItems = liquidityPlayers
    .map((player, idx)=>{
      const label = player.name
        ? player.name
        : (currentSession.is_admin ? `Jogador ${idx + 1}` : 'Você');
      const assets = normalizeSpecialAssets(player && player.assets);
      const summary = [
        `BTC: ${formatBTC(assets.bitcoin)}`,
        `NFTs: ${assets.nft}`,
        `R$: ${formatBRL(assets.brl)}`,
        `Cotas: ${formatNumber(assets.quotas)}`
      ].join(' • ');
      return `<li><strong>${esc(label)}</strong><br><small>${esc(summary)}</small></li>`;
    })
    .join('');
  const playerList = playerCount
    ? `<ol class="player-list">${playerItems}</ol>`
    : '<p class="hint">Nenhum dado disponível para o seu usuário no momento.</p>';
  const btnLabel = liquidityGame ? 'Reiniciar jogo' : 'Iniciar jogo';
  const disabledAttr = playerCount < minPlayers ? 'disabled' : '';
  const warning = playerCount < minPlayers
    ? (currentSession.is_admin
      ? '<p class="hint err">Cadastre pelo menos 2 usuários confirmados para iniciar o jogo.</p>'
      : '<p class="hint err">Seus ativos ainda não estão disponíveis para o jogo. Verifique com o administrador.</p>')
    : '<p class="hint">Cada jogador inicia com os saldos registrados em Ativos protegidos (R$, BTC, NFTs e cotas). Você pode renomear o time (apelido) após o início.</p>';
  const rosterTitle = currentSession.is_admin ? `Jogadores cadastrados (${playerCount})` : 'Seus ativos iniciais';
  const rosterIntro = currentSession.is_admin
    ? ''
    : '<p class="hint">Esta sessão mostra somente os seus saldos registrados no sistema.</p>';

  view.innerHTML = `
    <div class="section game-setup">
      <h1>Jogo Piscina de Liquidez</h1>
      <p>Gerencie as ações disponíveis, a semifinal (times com NFT em mãos) e a final para definir quem lidera em reais nesse jogo com NFTs, Bitcoin e cotas da piscina de liquidez.</p>
      <div class="player-roster">
        <h3>${esc(rosterTitle)}</h3>
        ${rosterIntro}
        ${playerList}
      </div>
      <div class="actions">
        <button id="startGameBtn" ${disabledAttr}>${btnLabel}</button>
      </div>
      ${warning}
    </div>
    <div id="gameArea"></div>`;

  const startBtn = document.getElementById('startGameBtn');
  if (startBtn){
    startBtn.addEventListener('click', ()=>{
      if (liquidityPlayers.length < minPlayers){
        alert(currentSession.is_admin
          ? 'Cadastre pelo menos 2 usuários para iniciar o jogo.'
          : 'Seus ativos ainda não estão disponíveis para o jogo. Verifique com o administrador.');
        return;
      }
      const game = createLiquidityGame(liquidityPlayers, minPlayers);
      if (!game){
        alert('Não foi possível iniciar o jogo com os usuários cadastrados.');
        return;
      }
      liquidityGame = game;
      liquidityGameLastSaved = null;
      renderLiquidityGameArea();
    });
  }

  renderLiquidityGameArea();
}

function renderLiquidityGameArea(){
  const container = document.getElementById('gameArea');
  if (!container) return;
  scheduleLiquidityGameSave();
  const specialPanel = renderSpecialLiquidityAssetsPanel();
  const minPlayers = currentSession.is_admin ? 2 : 1;
  if (!liquidityGame){
    const count = liquidityPlayers.length;
    if (count >= minPlayers){
      container.innerHTML = `${specialPanel}<p class="hint">Clique em <strong>Iniciar jogo</strong> para começar com os ${count} jogador(es) cadastrados.</p>`;
    } else if (count > 0){
      container.innerHTML = `${specialPanel}<p class="hint">${currentSession.is_admin ? 'Cadastre pelo menos mais um usuário confirmado para iniciar o jogo.' : 'Seus ativos ainda não estão disponíveis para simulação. Entre em contato com o administrador.'}</p>`;
    } else {
      container.innerHTML = `${specialPanel}<p class="hint">${currentSession.is_admin ? 'Cadastre novos usuários para habilitar o jogo.' : 'Nenhum ativo encontrado para o seu usuário no momento.'}</p>`;
    }
    attachSpecialAssetsListeners();
    return;
  }
  const state = liquidityGame;
  const active = activeLiquidityTeams(state);
  const stageLabel = LIQUIDITY_STAGE_LABELS[state.stage] || state.stage;
  const dividendTotal = state.pool.nfts * 2000 * 0.10;
  const perShare = state.pool.shares ? dividendTotal / state.pool.shares : 0;
  const semifinalReady = state.teams.filter(t=>!t.eliminated && t.nftHand>0);
  const leaderCash = active.slice().sort((a,b)=>b.cash - a.cash);

  const rows = state.teams.map(t=>{
    const classes = [];
    const semifinalClass = t.eliminated ? 'eliminated' : (t.nftHand>0 ? 'ready-semifinal' : 'awaiting-semifinal');
    classes.push(semifinalClass);
    if (state.championId === t.id) classes.push('champion');
    const semifinalTxt = t.eliminated ? 'Eliminado' : (t.nftHand>0 ? 'Sim' : 'Não');
    const playerInfo = (t.playerName && t.playerName !== t.name)
      ? `<div class="player-label"><small>Jogador: ${esc(t.playerName)}</small></div>`
      : '';
    return `
      <tr class="${classes.join(' ')}">
        <td>${t.id}</td>
        <td>
          <span class="team-name">${esc(t.name)}</span>
          ${playerInfo}
          <button class="btn-inline ghost rename-btn" data-team="${t.id}">Renomear</button>
        </td>
        <td class="numeric">${formatBRL(t.cash)}</td>
        <td class="numeric">${formatBTC(t.btc)}</td>
        <td class="numeric">${t.nftHand}</td>
        <td class="numeric">${t.poolShares}</td>
        <td><span class="flag">${semifinalTxt}</span></td>
      </tr>`;
  }).join('');

  const historyItems = state.history.map(h=>{
    const when = h.timestamp ? h.timestamp.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit', second:'2-digit' }) : '';
    const who = h.team ? `<strong>${esc(h.team)}</strong> — ` : '';
    const timeLabel = when ? when : '—';
    return `<li><time>${timeLabel}</time>${who}${esc(h.message)}</li>`;
  }).join('');

  const leaderTxt = leaderCash.length ? `${leaderCash[0].name} (${formatBRL(leaderCash[0].cash)})` : '—';
  const activeCount = active.length;
  const activeOptions = active.map(team=>`<option value="${team.id}">${esc(team.name)}</option>`).join('');
  const stageButtons = [];
  if (state.stage === 'regular') stageButtons.push('<button id="startSemifinalBtn">Iniciar semifinal</button>');
  if (state.stage === 'semifinal') stageButtons.push('<button id="startFinalBtn">Iniciar final</button>');
  if (state.stage === 'final') stageButtons.push('<button id="finishGameBtn">Encerrar jogo e definir campeão</button>');
  const stageControls = stageButtons.length ? `
    <div class="stage-controls">
      <h3>Etapas do torneio</h3>
      <div class="action-buttons">${stageButtons.join('')}</div>
    </div>` : '';

  container.innerHTML = `
    ${specialPanel}
    <div class="game-summary">
      <div class="summary-card">
        <h4>Fase atual</h4>
        <p>${esc(stageLabel)}</p>
      </div>
      <div class="summary-card">
        <h4>NFTs na piscina</h4>
        <p>${state.pool.nfts} NFT(s)</p>
      </div>
      <div class="summary-card">
        <h4>Cotas em circulação</h4>
        <p>${state.pool.shares}</p>
      </div>
      <div class="summary-card">
        <h4>Dividendo projetado</h4>
        <p>${state.pool.shares ? `${formatBRL(dividendTotal)} (${formatBRL(perShare)} / cota)` : 'Sem cotas ativas'}</p>
      </div>
      <div class="summary-card">
        <h4>Aptos à semifinal</h4>
        <p>${semifinalReady.length}/${state.teams.length}</p>
      </div>
      <div class="summary-card">
        <h4>Times ativos</h4>
        <p>${activeCount}</p>
      </div>
      <div class="summary-card">
        <h4>Liderança em R$</h4>
        <p>${esc(leaderTxt)}</p>
      </div>
      <div class="summary-card">
        <h4>Modo de ações</h4>
        <p>Ações livres</p>
      </div>
    </div>
    <section class="section">
      <h2>Placar dos times</h2>
      <table class="tbl game-table">
        <thead>
          <tr>
            <th>#</th><th>Time / Jogador</th><th>Caixa (R$)</th><th>Bitcoin (BTC)</th><th>NFTs em mãos</th><th>Cotas</th><th>Semifinal</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </section>
    <section class="section game-actions">
      <h2>Ações disponíveis</h2>
      ${state.stage==='finished' ? `
        <p>O jogo foi encerrado. Reinicie a partida para jogar novamente.</p>
      ` : activeCount ? `
        <p>Selecione um time ativo para realizar uma ação a qualquer momento.</p>
        <div class="team-selector">
          <label for="liquidityTeamSelect">Time:</label>
          <select id="liquidityTeamSelect">
            ${activeOptions}
          </select>
        </div>
        <div class="action-buttons">
          <button data-act="deposit">Depositar NFT na piscina</button>
          <button data-act="withdraw">Retirar NFT da piscina</button>
          <button data-act="buy_btc">Comprar Bitcoin</button>
          <button data-act="sell_btc">Vender Bitcoin</button>
          <button data-act="sell_nft">Vender NFT em mãos</button>
          <button data-act="sell_share">Vender cota</button>
          <button data-act="pass">Sem ação</button>
        </div>
      ` : '<p>Nenhum time ativo disponível para jogar.</p>'}
      ${stageControls}
    </section>
    <section class="section">
      <h2>Histórico</h2>
      ${state.history.length ? `<ol class="game-history">${historyItems}</ol>` : '<p class="hint">As ações aparecem aqui conforme o jogo avança.</p>'}
    </section>`;
  attachSpecialAssetsListeners();

  container.querySelectorAll('.rename-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const id = parseInt(btn.dataset.team,10);
      renameLiquidityTeam(id);
    });
  });
  container.querySelectorAll('.action-buttons button[data-act]').forEach(btn=>{
    btn.addEventListener('click', ()=>handleLiquidityAction(btn.dataset.act));
  });
  const semifinalBtn = container.querySelector('#startSemifinalBtn');
  if (semifinalBtn) semifinalBtn.addEventListener('click', startLiquiditySemifinal);
  const finalBtn = container.querySelector('#startFinalBtn');
  if (finalBtn) finalBtn.addEventListener('click', startLiquidityFinal);
  const finishBtn = container.querySelector('#finishGameBtn');
  if (finishBtn) finishBtn.addEventListener('click', finishLiquidityGame);
}

function renameLiquidityTeam(teamId){
  if (!liquidityGame) return;
  const team = liquidityGame.teams.find(t=>t.id===teamId);
  if (!team) return;
  const newName = prompt('Novo nome do time:', team.name);
  if (newName && newName.trim()){
    team.name = newName.trim();
    renderLiquidityGameArea();
  }
}

function addLiquidityHistory(team, message){
  if (!liquidityGame) return;
  liquidityGame.history.unshift({
    team: team ? team.name : null,
    message,
    timestamp: new Date()
  });
  if (liquidityGame.history.length > 200){
    liquidityGame.history.length = 200;
  }
}

function handleLiquidityAction(action){
  if (!liquidityGame || liquidityGame.stage==='finished') return;
  const select = document.getElementById('liquidityTeamSelect');
  if (!select){
    alert('Selecione um time para realizar a ação.');
    return;
  }
  const teamId = parseInt(select.value, 10);
  const team = liquidityGame.teams.find(t=>t.id===teamId);
  if (!team || team.eliminated){
    alert('Escolha um time ativo válido.');
    return;
  }
  if (action==='deposit') return liquidityDeposit(team);
  if (action==='withdraw') return liquidityWithdraw(team);
  if (action==='buy_btc') return liquidityBuyBTC(team);
  if (action==='sell_btc') return liquiditySellBTC(team);
  if (action==='sell_nft') return liquiditySellNFT(team);
  if (action==='sell_share') return liquiditySellShare(team);
  if (action==='pass') return liquidityPass(team);
}

function liquidityDeposit(team){
  if (team.nftHand <= 0){ alert('Este time não possui NFT em mãos para depositar.'); return; }
  team.nftHand -= 1;
  team.btc += 10;
  team.poolShares += 1;
  liquidityGame.pool.nfts += 1;
  liquidityGame.pool.shares += 1;
  addLiquidityHistory(team, 'Depositou uma NFT na piscina (+10 BTC e +1 cota).');
  renderLiquidityGameArea();
}

function liquidityWithdraw(team){
  if (team.poolShares <= 0){ alert('Este time não possui cotas para resgatar uma NFT.'); return; }
  if (liquidityGame.pool.nfts <= 0){ alert('Não há NFTs disponíveis na piscina.'); return; }
  const pay = prompt('Forma de pagamento (BTC ou BRL)?', 'BTC');
  if (!pay) return;
  const mode = pay.trim().toUpperCase();
  let paymentText = '';
  if (mode === 'BTC'){
    if (team.btc + 1e-9 < 11){ alert('BTC insuficiente para pagar 11 BTC.'); return; }
    team.btc -= 11;
    paymentText = `${formatBTC(11)} BTC`;
  } else if (mode === 'BRL' || mode === 'R$' || mode === 'DINHEIRO'){
    if (team.cash + 1e-9 < 2000){ alert('Saldo insuficiente em reais para pagar R$2.000.'); return; }
    team.cash -= 2000;
    paymentText = formatBRL(2000);
  } else {
    alert('Informe BTC ou BRL.');
    return;
  }
  team.nftHand += 1;
  team.poolShares -= 1;
  liquidityGame.pool.nfts -= 1;
  liquidityGame.pool.shares -= 1;
  addLiquidityHistory(team, `Resgatou uma NFT da piscina pagando ${paymentText}.`);
  renderLiquidityGameArea();
}

function liquidityBuyBTC(team){
  const sellerId = prompt('Número do time vendedor (veja a coluna # na tabela):', '');
  if (!sellerId) return;
  const sellerIdx = parseInt(sellerId, 10) - 1;
  const seller = liquidityGame.teams[sellerIdx];
  if (!seller){ alert('Time vendedor inválido.'); return; }
  if (seller === team){ alert('Não é possível comprar de si mesmo.'); return; }
  if (seller.eliminated){ alert('O vendedor informado já foi eliminado do jogo.'); return; }
  const qty = parseFloat(prompt('Quantidade de BTC a comprar:', '1'));
  if (!(qty > 0)) return;
  if ((seller.btc ?? 0) + 1e-6 < qty){ alert('O vendedor não possui essa quantidade de BTC.'); return; }
  const price = parseFloat(prompt('Preço por BTC (R$):', '100000'));
  if (!(price >= 0)) return;
  const total = qty * price;
  if (team.cash + 1e-6 < total){ alert('Saldo insuficiente para esta compra.'); return; }
  team.cash -= total;
  team.btc += qty;
  seller.cash += total;
  seller.btc -= qty;
  addLiquidityHistory(team, `Comprou ${formatBTC(qty)} BTC de ${seller.name} por ${formatBRL(total)} (R$ ${formatNumber(price)} / BTC).`);
  renderLiquidityGameArea();
}

function liquiditySellBTC(team){
  const buyerId = prompt('Número do time comprador (veja a coluna # na tabela):', '');
  if (!buyerId) return;
  const buyerIdx = parseInt(buyerId, 10) - 1;
  const buyer = liquidityGame.teams[buyerIdx];
  if (!buyer){ alert('Time comprador inválido.'); return; }
  if (buyer === team){ alert('Não é possível vender para o próprio time.'); return; }
  if (buyer.eliminated){ alert('O comprador informado já foi eliminado do jogo.'); return; }
  const qty = parseFloat(prompt('Quantidade de BTC a vender:', '1'));
  if (!(qty > 0)) return;
  if (team.btc + 1e-6 < qty){ alert('Este time não possui essa quantidade de BTC.'); return; }
  const price = parseFloat(prompt('Preço por BTC (R$):', '100000'));
  if (!(price >= 0)) return;
  const total = qty * price;
  if (buyer.cash + 1e-6 < total){ alert('O comprador não possui caixa suficiente.'); return; }
  team.btc -= qty;
  team.cash += total;
  buyer.btc = (buyer.btc || 0) + qty;
  buyer.cash -= total;
  addLiquidityHistory(team, `Vendeu ${formatBTC(qty)} BTC para ${buyer.name} por ${formatBRL(total)} (R$ ${formatNumber(price)} / BTC).`);
  renderLiquidityGameArea();
}

function liquiditySellNFT(team){
  if (team.nftHand <= 0){ alert('Este time não possui NFT disponível para venda.'); return; }
  const price = parseFloat(prompt('Preço de venda da NFT (R$):', '2000'));
  if (!(price > 0)) return;
  const buyerId = prompt('Número do time comprador (veja a coluna # na tabela):', '');
  if (!buyerId) return;
  const idx = parseInt(buyerId,10) - 1;
  const buyer = liquidityGame.teams[idx];
  if (!buyer){ alert('Time comprador inválido.'); return; }
  if (buyer === team){ alert('Não é possível vender para o próprio time.'); return; }
  if (buyer.eliminated){ alert('O comprador informado já foi eliminado do jogo.'); return; }
  if (buyer.cash + 1e-6 < price){ alert('O comprador não possui caixa suficiente.'); return; }
  buyer.cash -= price;
  buyer.nftHand = (buyer.nftHand || 0) + 1;
  team.cash += price;
  team.nftHand -= 1;
  addLiquidityHistory(team, `Vendeu uma NFT para ${buyer.name} por ${formatBRL(price)}.`);
  renderLiquidityGameArea();
}

function liquiditySellShare(team){
  if (team.poolShares <= 0){ alert('Este time não possui cotas para vender.'); return; }
  const qty = parseInt(prompt('Quantidade de cotas a vender:', '1'),10);
  if (!(qty > 0) || qty > team.poolShares){ alert('Quantidade de cotas inválida.'); return; }
  const price = parseFloat(prompt('Preço total da venda (R$):', String(qty * 500)));
  if (!(price > 0)) return;
  const buyerId = prompt('Número do time comprador (veja a coluna # na tabela):', '');
  if (!buyerId) return;
  const idx = parseInt(buyerId,10) - 1;
  const buyer = liquidityGame.teams[idx];
  if (!buyer){ alert('Time comprador inválido.'); return; }
  if (buyer === team){ alert('Não é possível vender para o próprio time.'); return; }
  if (buyer.eliminated){ alert('O comprador informado já foi eliminado do jogo.'); return; }
  if (buyer.cash + 1e-6 < price){ alert('O comprador não possui caixa suficiente.'); return; }
  buyer.cash -= price;
  buyer.poolShares = (buyer.poolShares || 0) + qty;
  team.poolShares -= qty;
  team.cash += price;
  addLiquidityHistory(team, `Vendeu ${qty} cota(s) para ${buyer.name} por ${formatBRL(price)}.`);
  renderLiquidityGameArea();
}

function liquidityPass(team){
  addLiquidityHistory(team, 'Sem ação registrada.');
  renderLiquidityGameArea();
}

function startLiquiditySemifinal(){
  if (!liquidityGame || liquidityGame.stage!=='regular') return;
  const qualifiers = liquidityGame.teams.filter(t=>!t.eliminated && t.nftHand>0);
  if (!qualifiers.length){
    alert('Nenhum time possui NFT em mãos para avançar à semifinal.');
    return;
  }
  const eliminated = liquidityGame.teams.filter(t=>!t.eliminated && t.nftHand<=0);
  eliminated.forEach(t=>{ t.eliminated = true; });
  liquidityGame.stage = 'semifinal';
  const elimTxt = eliminated.length ? ` Eliminados: ${eliminated.map(t=>t.name).join(', ')}.` : ' Todos os times avançaram.';
  addLiquidityHistory(null, `Semifinal iniciada. Classificados: ${qualifiers.map(t=>t.name).join(', ')}.${elimTxt}`);
  renderLiquidityGameArea();
}

function startLiquidityFinal(){
  if (!liquidityGame || liquidityGame.stage!=='semifinal') return;
  const finalists = activeLiquidityTeams(liquidityGame);
  if (!finalists.length){
    alert('Nenhum time ativo para disputar a final.');
    return;
  }
  liquidityGame.stage = 'final';
  addLiquidityHistory(null, `Final iniciada com ${finalists.map(t=>t.name).join(', ')}.`);
  renderLiquidityGameArea();
}

function finishLiquidityGame(){
  if (!liquidityGame || liquidityGame.stage!=='final') return;
  const finalists = activeLiquidityTeams(liquidityGame);
  if (!finalists.length){
    liquidityGame.stage = 'finished';
    liquidityGame.championId = null;
    addLiquidityHistory(null, 'Jogo encerrado sem times ativos.');
    renderLiquidityGameArea();
    return;
  }
  const topCash = Math.max(...finalists.map(t=>t.cash));
  const winners = finalists.filter(t=>Math.abs(t.cash - topCash) < 1e-6);
  liquidityGame.stage = 'finished';
  if (winners.length === 1){
    liquidityGame.championId = winners[0].id;
    addLiquidityHistory(null, `Jogo encerrado! Campeão: ${winners[0].name} com ${formatBRL(winners[0].cash)}.`);
  } else {
    liquidityGame.championId = null;
    const names = winners.map(t=>t.name).join(', ');
    addLiquidityHistory(null, `Jogo encerrado com empate entre ${names} (cada um com ${formatBRL(topCash)}).`);
  }
  renderLiquidityGameArea();
}

/* ========= Auth UI ========= */
async function refreshAuthUI(){
  const s = await getJSON(API('session.php'));
  currentSession = {
    logged: !!(s && s.logged),
    user_id: s && typeof s.user_id !== 'undefined' && s.user_id !== null ? parseInt(s.user_id, 10) : null,
    name: s && s.name ? String(s.name) : null,
    email: s && s.email ? String(s.email) : null,
    is_admin: !!(s && s.is_admin),
    is_special_liquidity_user: !!(s && s.is_special_liquidity_user),
    special_liquidity_email: s && s.special_liquidity_email ? String(s.special_liquidity_email) : null
  };

  const loginForm = document.getElementById('loginForm');
  const loggedBox = document.getElementById('loggedBox');
  const sessionInfo = document.getElementById('sessionInfo');

  if (currentSession.logged) {
    if (loginForm) loginForm.style.display = 'none';
    if (loggedBox) loggedBox.style.display = 'block';
    if (sessionInfo) {
      let label = 'Conectado';
      const identity = currentSession.name || currentSession.email;
      if (identity) {
        label += ` como ${identity}`;
      }
      if (currentSession.is_admin) {
        label += ' • Admin';
      }
      sessionInfo.textContent = label;
    }
  } else {
    if (loginForm) loginForm.style.display = 'block';
    if (loggedBox) loggedBox.style.display = 'none';
    if (sessionInfo) sessionInfo.textContent = 'Conectado';
  }

  if (document.body) {
    document.body.classList.toggle('is-admin', currentSession.is_admin);
    document.body.classList.toggle('is-special-liquidity-user', currentSession.is_special_liquidity_user);
  }

  if (!currentSession.is_special_liquidity_user) {
    liquiditySpecialAssets = null;
  }
}
function initAuth(){
  // login
  document.getElementById('loginForm').addEventListener('submit', async (e)=>{
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const res = await fetch(AUTH('login.php'), {
      method: 'POST', credentials:'include',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({email,password})
    });
    const msg = document.getElementById('authMsg');
    if (res.ok) {
      msg.textContent = 'Login efetuado!';
      await refreshAuthUI();
      document.getElementById('view').innerHTML = `<h1>Bem-vindo!</h1><p>Escolha um módulo do menu.</p>`;
    } else {
      try {
        const err = await res.json();
        if (err.error === 'email_not_confirmed') {
          msg.textContent = 'Confirme seu e-mail antes de entrar.';
        } else {
          msg.textContent = 'Login inválido.';
        }
      } catch { msg.textContent = 'Falha no login.'; }
      msg.classList.add('err');
    }
  });
  // logout
  document.getElementById('logoutBtn').addEventListener('click', async ()=>{
    await fetch(AUTH('logout.php'), { credentials:'include' });
    await refreshAuthUI();
    document.getElementById('view').innerHTML = `<h1>Até mais!</h1><p>Você saiu da conta.</p>`;
  });
  // toggle register
  const toggle = document.getElementById('toggleRegister');
  const form = document.getElementById('registerForm');
  toggle.addEventListener('click', ()=>{
    form.style.display = form.style.display==='none' ? 'block':'none';
  });
  // register
  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const name = document.getElementById('r_name').value;
    const email = document.getElementById('r_email').value;
    const password = document.getElementById('r_password').value;
    const r = await fetch(API('register.php'), {
      method:'POST', credentials:'include',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({name,email,password})
    });
    const msg = document.getElementById('authMsg');
    if (r.ok) {
      msg.textContent = 'Conta criada! Verifique seu e-mail para confirmar.';
      form.reset(); form.style.display='none';
    } else {
      const err = await r.json().catch(()=>({}));
      msg.textContent = 'Erro ao registrar: ' + (err.detail || err.error || r.statusText);
      msg.classList.add('err');
    }
  });
  refreshAuthUI();
}

/* ========= Views ========= */
async function viewSaldo(){
  const data = await getJSON(API(`balance.php`));
  if (data.__auth===false) return needLogin();
  const acc = table(data.accounts, ['currency','purpose','balance'], ['Moeda','Finalidade','Saldo']);
  const hist = table(data.journals, ['id','occurred_at','ref_type','memo','debit','credit'],
                     ['#','Quando','Tipo','Memo','Débito','Crédito']);
  document.getElementById('view').innerHTML = `<h1>Saldo</h1>${acc}<h2>Histórico</h2>${hist}`;
}

async function viewBitcoin(){
  const d = await getJSON(API(`bitcoin.php`));
  if (d.__auth===false) return needLogin();
  document.getElementById('view').innerHTML =
    `<h1>Bitcoin</h1><p><strong>Total BTC:</strong> ${d.btc_total ?? 0}</p>
     <h2>Recebidos</h2>${table(d.recebidos,['occurred_at','ref_type','memo','amount'],['Quando','Tipo','Memo','Valor'])}
     <h2>Pagos</h2>${table(d.pagos,['occurred_at','ref_type','memo','amount'],['Quando','Tipo','Memo','Valor'])}`;
}

async function viewNFT(){
  const d = await getJSON(API(`nfts.php`));
  if (d.__auth===false) return needLogin();
  const obras = table(d.obras,['work_id','title','asset_id','instance_id'],['#','Título','Asset','Instância']);
  const chassis = table(d.chassis,['id','size','material','status'],['#','Tamanho','Material','Status']);
  const extra = `<div class="actions"><button id="mintBtn" style="margin-top:8px;width:auto">Criar NFT de Teste</button><span class="badge">demo</span></div>`;
  document.getElementById('view').innerHTML = `<h1>NFTs</h1>${extra}<h2>Obras</h2>${obras}<h2>Chassis</h2>${chassis}`;
  document.getElementById('mintBtn').addEventListener('click', async()=>{
    const r = await fetch(API('mint_test_nft.php'), { method:'POST', credentials:'include' });
    if (r.ok){ alert('NFT de teste criado! Recarregando lista.'); viewNFT(); }
    else { const e = await r.json().catch(()=>({})); alert('Erro: ' + (e.detail||e.error||r.statusText)); }
  });
}

/* === MERCADO (separado) === */
async function viewMercadoNFT(){ await renderMercado('NFT'); }
async function viewMercadoBTC(){ await renderMercado('BTC'); }

async function renderMercado(kind){
  const html = `
    <div class="section">
      <h1>Mercado ${kind} (Ofertas de Venda)</h1>
      <div class="actions" style="margin-bottom:10px;">
        <button id="reloadBtn">Atualizar</button>
      </div>
      <div id="m_list"></div>
    </div>`;
  document.getElementById('view').innerHTML = html;
  document.getElementById('reloadBtn').addEventListener('click', ()=>loadOffers(kind));
  await loadOffers(kind);
}
async function loadOffers(kind){
  const url = API(`offers.php?kind=${kind}`);
  const data = await getJSON(url);
  if (data.__auth===false) return needLogin();
  const rows = (data||[]).map(o => ({
    id:o.id, tipo:o.kind, instancia:o.asset_instance_id||'', qtd:o.qty, preco:o.price_brl, vendedor:o.seller_id
  }));
  const tbl = table(rows, ['id','tipo','instancia','qtd','preco','vendedor'], ['#','Tipo','Instância','Qtd','Preço (BRL)','Vendedor']);
  document.getElementById('m_list').innerHTML = tbl + `<p><small>Clique no <b>ID</b> para comprar.</small></p>`;

  // compra ao clicar no ID
  document.querySelectorAll('#m_list table tbody tr').forEach(tr => {
    const idCell = tr.querySelector('td'); // primeira coluna
    const offerId = parseInt(idCell.textContent,10);
    idCell.style.cursor = 'pointer';
    idCell.title = 'Comprar esta oferta';
    idCell.addEventListener('click', async ()=>{
      if (!confirm('Confirmar compra da oferta #' + offerId + '?')) return;
      const r = await fetch(API('buy_offer.php'), {
        method:'POST', credentials:'include',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({offer_id: offerId})
      });
      if (r.ok) { alert('Compra concluída!'); await loadOffers(kind); }
      else { const e = await r.json().catch(()=>({})); alert('Erro: ' + (e.detail||e.error||r.statusText)); }
    });
  });
}

async function viewLiveMarket(){
  if (!currentSession.logged) return needLogin();
  const view = document.getElementById('view');
  view.innerHTML = '<section class="section live-market" data-role="live-market-root"><h1>Mercado ao vivo</h1><p class="hint">Carregando histórico de transações...</p></section>';
  await loadLiveMarketHistory();
}

async function loadLiveMarketHistory(){
  const section = document.querySelector('[data-role="live-market-root"]');
  if (!section) return;
  const data = await getJSON(API('live_market.php'));
  if (data && data.__auth === false) {
    needLogin();
    return;
  }
  if (!data || data.error) {
    section.innerHTML = '<h1>Mercado ao vivo</h1><p class="msg err">Não foi possível carregar o histórico do mercado.</p>';
    return;
  }
  const history = Array.isArray(data.transactions) ? data.transactions : [];
  if (!history.length) {
    section.innerHTML = '<h1>Mercado ao vivo</h1><div class="actions"><button type="button" data-role="refresh-live-market">Atualizar</button></div><p class="hint">Nenhuma transação registrada até o momento.</p>';
    const btn = section.querySelector('[data-role="refresh-live-market"]');
    if (btn) {
      btn.addEventListener('click', (e)=>{ e.preventDefault(); loadLiveMarketHistory(); });
    }
    return;
  }

  const rows = history.map((tx)=>{
    const rawAssetType = (tx.asset_type || '').toLowerCase();
    const assetType = rawAssetType || null;
    let assetLabel = tx.asset_label;
    if (!assetLabel) {
      if (assetType === 'bitcoin') assetLabel = 'BTC';
      else if (assetType === 'nft') assetLabel = 'NFT';
      else if (assetType === 'brl') assetLabel = 'BRL';
      else if (assetType === 'quotas') assetLabel = 'Cotas';
      else assetLabel = '';
    }
    const qtyDigits = (()=>{
      switch (assetType) {
        case 'bitcoin': return 8;
        case 'nft': return 0;
        case 'brl': return 2;
        case 'quotas': return 4;
        default: return 4;
      }
    })();
    const qtyNumber = Number(tx.qty);
    const qtyText = Number.isFinite(qtyNumber)
      ? esc(formatNumber(qtyNumber, qtyDigits))
      : '—';
    const priceNumber = Number(tx.price);
    const priceText = Number.isFinite(priceNumber) && tx.price !== null && tx.price !== ''
      ? esc(formatBRL(priceNumber))
      : '—';
    const totalNumber = Number(tx.total);
    const totalText = Number.isFinite(totalNumber) && tx.total !== null && tx.total !== ''
      ? esc(formatBRL(totalNumber))
      : '—';
    const participants = tx.participants || [tx.buyer_name, tx.seller_name].filter(Boolean).join(' → ');
    const safeParticipants = esc(participants || '');
    const detailsParts = [];
    if (tx.asset_chain) detailsParts.push(`Chain: ${tx.asset_chain}`);
    if (tx.asset_token_id) detailsParts.push(`Token: ${tx.asset_token_id}`);
    if (tx.asset_serial) detailsParts.push(`Serial: ${tx.asset_serial}`);
    if (tx.asset_contract) detailsParts.push(`Contrato: ${tx.asset_contract}`);
    if (tx.source === 'special_asset') detailsParts.push('Origem: Meus Ativos');
    const detailsText = esc(detailsParts.join(' · '));
    const fullHash = typeof tx.hash === 'string' ? tx.hash : '';
    const shortHash = fullHash.length > 16 ? `${fullHash.slice(0,16)}…` : fullHash;
    const hashCell = fullHash ? `<code title="${esc(fullHash)}">${esc(shortHash)}</code>` : '';
    return {
      data: esc(tx.date || ''),
      horario: esc(tx.time || ''),
      tipo: esc(tx.type_label || tx.type || ''),
      ativo: esc(assetLabel),
      quantidade: qtyText,
      preco: priceText,
      valor: totalText,
      negociantes: safeParticipants,
      detalhes: detailsText,
      hash: hashCell
    };
  });

  const columns = ['data','horario','tipo','ativo','quantidade','preco','valor','negociantes','detalhes','hash'];
  const labels = ['Data','Horário','Tipo','Ativo','Qtd','Preço','Valor total','Negociantes','Detalhes','Hash'];
  section.innerHTML = `<h1>Mercado ao vivo</h1><div class="actions"><button type="button" data-role="refresh-live-market">Atualizar</button></div>${table(rows, columns, labels)}`;
  const refreshBtn = section.querySelector('[data-role="refresh-live-market"]');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', (e)=>{ e.preventDefault(); loadLiveMarketHistory(); });
  }
}

/* ========= Trades (lista geral recente) ========= */
async function viewTrades(){
  document.getElementById('view').innerHTML = `<h1>Trades (últimos)</h1><div id="tradesBox"></div>`;
  const d = await getJSON(API(`trades.php`));
  if (d.__auth===false) return needLogin();
  const arr = Array.isArray(d) ? d : [];
  const rows = arr.map(t => ({ id:t.id, qty:t.qty, price:t.price, created_at:t.created_at }));
  document.getElementById('tradesBox').innerHTML = table(rows,['id','qty','price','created_at'],['#','Qtd','Preço','Quando']);
}

async function viewUserAssets(){
  if (!currentSession.logged) return needLogin();

  const view = document.getElementById('view');
  view.innerHTML = `<h1>Meus Ativos</h1><p class="hint">Carregando saldos do usuário...</p>`;

  const data = await getJSON(API('users.php'));
  if (data.__auth === false) return needLogin();

  const users = Array.isArray(data.users) ? data.users : [];
  const sessionUserId = Number.isFinite(currentSession.user_id) ? currentSession.user_id : null;
  let targetUser = null;

  if (sessionUserId !== null){
    targetUser = users.find(user => Number(user && user.id) === sessionUserId) || null;
  }

  if (!targetUser && users.length === 1){
    targetUser = users[0];
  }

  if (!targetUser){
    view.innerHTML = `<h1>Meus Ativos</h1><p class="hint err">Não encontramos ativos cadastrados para sua conta. Verifique com o administrador.</p>`;
    return;
  }

  const assets = normalizeSpecialAssets(targetUser.assets);
  const identity = targetUser.name || currentSession.name || currentSession.email || 'Você';

  const otherUsersSummary = normalizeOtherUsersSummary(data.others_summary);
  const otherUsersList = normalizeOtherUsersList(data.other_users);
  const otherUsersCount = otherUsersList.length || otherUsersSummary.count;
  const otherUsersAssets = otherUsersSummary.assets;
  const otherUsersById = new Map(otherUsersList.map(user => [String(user.id), user]));

  const isOwner = sessionUserId !== null && Number(targetUser.id) === sessionUserId;

  const assetActionsConfig = {
    bitcoin: {
      label: 'Bitcoin (BTC)',
      description: 'Negocie frações de bitcoin utilizando o saldo em reais.',
      amountLabel: 'Quantidade (BTC)',
      amountPlaceholder: 'Ex: 0.015',
      step: '0.00000001',
      min: '0.00000001',
      requiresBrlForTrade: true
    },
    nft: {
      label: 'NFTs',
      description: 'Movimente unidades inteiras de NFTs registrados.',
      amountLabel: 'Quantidade de NFTs',
      amountPlaceholder: 'Ex: 1',
      step: '1',
      min: '1',
      requiresBrlForTrade: true
    },
    brl: {
      label: 'Reais (R$)',
      description: 'Deposite ou utilize o saldo em moeda fiduciária.',
      amountLabel: 'Valor em R$',
      amountPlaceholder: 'Ex: 1500,00',
      step: '0.01',
      min: '0.01',
      requiresBrlForTrade: false
    },
    quotas: {
      label: 'Cotas',
      description: 'Atualize a participação nas cotas da piscina de liquidez.',
      amountLabel: 'Quantidade de cotas',
      amountPlaceholder: 'Ex: 2',
      step: '0.00000001',
      min: '0.00000001',
      requiresBrlForTrade: true
    }
  };

  const renderActions = () => Object.entries(assetActionsConfig).map(([key, cfg]) => {
    const rawAvailableAsset = Number(otherUsersAssets[key] ?? 0);
    const rawAvailableBrl = Number(otherUsersAssets.brl ?? 0);
    const availableAsset = Number.isFinite(rawAvailableAsset) ? rawAvailableAsset : 0;
    const availableBrl = Number.isFinite(rawAvailableBrl) ? rawAvailableBrl : 0;
    const availabilityText = formatOtherAssetAvailability(key, availableAsset, otherUsersCount);
    const buttonDisabledAttr = otherUsersCount === 0 ? ' disabled' : '';
    const counterpartyOptions = (() => {
      if (!otherUsersList.length) {
        return '<option value="" selected disabled>Nenhum usuário disponível</option>';
      }
      const placeholder = '<option value="" selected disabled>Selecione um usuário</option>';
      const items = otherUsersList.map(user => `
        <option value="${esc(user.id)}">${esc(user.name)}</option>
      `).join('');
      return placeholder + items;
    })();
    return `
      <div class="asset-action-card" data-asset="${esc(key)}">
        <h3>${esc(cfg.label)}</h3>
        <p class="hint">${esc(cfg.description)}</p>
        <p class="hint availability">${esc(availabilityText)}</p>
        <form id="assetAction-${esc(key)}" autocomplete="off"
          data-other-users-count="${otherUsersCount}"
          data-available-asset="${String(availableAsset)}"
          data-available-brl="${String(availableBrl)}">
          <label>Operação
            <select name="action">
              <option value="deposit" selected>Depósito</option>
              <option value="buy">Compra</option>
              <option value="sell">Venda</option>
            </select>
          </label>
          <div class="field-group field-counterparty">
            <label>Usuário para transação
              <select name="counterparty_id"${otherUsersCount === 0 ? ' disabled' : ''}>
                ${counterpartyOptions}
              </select>
            </label>
          </div>
          <label>${esc(cfg.amountLabel)}
            <input type="number" name="amount" min="${esc(cfg.min)}" step="${esc(cfg.step)}" placeholder="${esc(cfg.amountPlaceholder)}" required />
          </label>
          ${cfg.requiresBrlForTrade ? `
            <div class="field-group field-unit-price">
              <label>Valor por ativo (R$)
                <input type="number" name="unit_price" min="0.01" step="0.01" placeholder="Ex: 1500,00" />
              </label>
            </div>
          ` : ''}
          <button type="submit"${buttonDisabledAttr}>Executar</button>
          <p class="form-msg" aria-live="polite"></p>
        </form>
      </div>
    `;
  }).join('');

  const actionsSection = isOwner
    ? `
      <div class="user-asset-actions">
        <h2>Movimentar ativos</h2>
        <p class="hint">${esc(otherUsersCount === 0
          ? 'As operações estão temporariamente indisponíveis porque não há outros usuários confirmados com ativos registrados.'
          : 'Escolha abaixo a operação desejada para cada tipo de ativo. Informe a quantidade e, quando necessário, o valor em reais para concluir a compra ou venda.')}</p>
        <div class="asset-action-grid">
          ${renderActions()}
        </div>
      </div>`
    : `
      <div class="user-asset-actions">
        <p class="hint">Somente o usuário titular pode movimentar estes ativos.</p>
      </div>`;

  view.innerHTML = `
    <div class="section user-assets">
      <h1>Meus Ativos</h1>
      <p class="hint">Confira os saldos registrados para ${esc(identity)} no sistema.</p>
      <div class="user-asset-grid" id="userAssetSummary">
        ${renderUserAssetCardsHtml(assets)}
      </div>
      <div class="other-users-assets">
        <h2>Ativos dos demais usuários</h2>
        <p class="hint">${esc(describeOtherUsersHeadline(otherUsersCount))}</p>
        <div class="user-asset-grid other-assets-grid">
          ${renderUserAssetCardsHtml(otherUsersAssets)}
        </div>
      </div>
      ${actionsSection}
    </div>`;

  if (!isOwner) {
    return;
  }

  let currentAssets = { ...assets };

  const summaryContainer = document.getElementById('userAssetSummary');
  const updateSummaryView = (nextAssets) => {
    currentAssets = normalizeSpecialAssets(nextAssets);
    if (summaryContainer) {
      summaryContainer.innerHTML = renderUserAssetCardsHtml(currentAssets);
    }
  };

  Object.entries(assetActionsConfig).forEach(([key, cfg]) => {
    const form = document.getElementById(`assetAction-${key}`);
    if (!form) return;

    const actionSelect = form.querySelector('select[name="action"]');
    const counterpartySelect = form.querySelector('select[name="counterparty_id"]');
    const amountInput = form.querySelector('input[name="amount"]');
    const unitPriceInput = form.querySelector('input[name="unit_price"]');
    const messageBox = form.querySelector('.form-msg');
    const submitBtn = form.querySelector('button[type="submit"]');
    const counterpartyField = form.querySelector('.field-counterparty');
    const unitPriceField = form.querySelector('.field-unit-price');

    const toggleTradeFields = () => {
      const action = actionSelect ? actionSelect.value : 'deposit';
      const isTrade = action !== 'deposit';
      if (counterpartyField) {
        counterpartyField.style.display = isTrade ? '' : 'none';
      }
      if (unitPriceField) {
        if (cfg.requiresBrlForTrade && isTrade) {
          unitPriceField.style.display = '';
        } else {
          unitPriceField.style.display = 'none';
        }
      }
      if (!isTrade) {
        if (counterpartySelect) {
          counterpartySelect.selectedIndex = 0;
        }
        if (unitPriceInput) {
          unitPriceInput.value = '';
        }
      }
    };

    if (actionSelect) {
      actionSelect.addEventListener('change', toggleTradeFields);
      toggleTradeFields();
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (messageBox) {
        messageBox.textContent = '';
        messageBox.classList.remove('err');
      }

      const parsedOtherUsers = Number(form.dataset.otherUsersCount ?? 0);
      const otherUsersCount = Number.isFinite(parsedOtherUsers) ? parsedOtherUsers : 0;
      const parsedAvailableAsset = Number(form.dataset.availableAsset ?? 0);
      const availableAsset = Number.isFinite(parsedAvailableAsset) ? parsedAvailableAsset : 0;
      const parsedAvailableBrl = Number(form.dataset.availableBrl ?? 0);
      const availableBrl = Number.isFinite(parsedAvailableBrl) ? parsedAvailableBrl : 0;

      if (!Number.isFinite(otherUsersCount) || otherUsersCount <= 0) {
        if (messageBox) {
          messageBox.textContent = 'Nenhum outro usuário confirmado possui ativos disponíveis para operar no momento.';
          messageBox.classList.add('err');
        }
        return;
      }

      const action = actionSelect ? actionSelect.value : 'deposit';
      const isTrade = action !== 'deposit';
      const amountValue = amountInput ? parseFloat(amountInput.value) : NaN;
      if (!Number.isFinite(amountValue) || amountValue <= 0) {
        if (messageBox) {
          messageBox.textContent = 'Informe uma quantidade válida para a operação.';
          messageBox.classList.add('err');
        }
        return;
      }

      let selectedCounterpartyId = null;
      if (isTrade) {
        const parsedCounterparty = counterpartySelect ? parseInt(counterpartySelect.value, 10) : NaN;
        if (!Number.isFinite(parsedCounterparty)) {
          if (messageBox) {
            messageBox.textContent = 'Selecione o usuário com quem deseja realizar a transação.';
            messageBox.classList.add('err');
          }
          return;
        }
        selectedCounterpartyId = parsedCounterparty;
      }

      let unitPriceValue = null;
      let totalBrlValue = null;
      if (cfg.requiresBrlForTrade && isTrade) {
        const parsedUnit = unitPriceInput ? parseFloat(unitPriceInput.value) : NaN;
        if (!Number.isFinite(parsedUnit) || parsedUnit <= 0) {
          if (messageBox) {
            messageBox.textContent = 'Informe o valor por ativo em reais para concluir a operação.';
            messageBox.classList.add('err');
          }
          return;
        }
        unitPriceValue = parsedUnit;
        const totalRaw = unitPriceValue * amountValue;
        totalBrlValue = Math.round(totalRaw * 100) / 100;
      } else if (unitPriceInput && unitPriceInput.value) {
        const parsedUnit = parseFloat(unitPriceInput.value);
        if (Number.isFinite(parsedUnit) && parsedUnit > 0) {
          unitPriceValue = parsedUnit;
        }
      }

      if ((action === 'buy' || action === 'deposit') && availableAsset < amountValue) {
        if (messageBox) {
          messageBox.textContent = 'Os demais usuários não possuem saldo suficiente deste ativo para concluir a operação.';
          messageBox.classList.add('err');
        }
        return;
      }

      if (action === 'sell' && key !== 'brl' && totalBrlValue !== null && availableBrl < totalBrlValue) {
        if (messageBox) {
          messageBox.textContent = 'Os demais usuários não possuem saldo em reais suficiente para comprar este ativo.';
          messageBox.classList.add('err');
        }
        return;
      }

      if (isTrade) {
        const counterpartyData = otherUsersById.get(String(selectedCounterpartyId));
        if (!counterpartyData) {
          if (messageBox) {
            messageBox.textContent = 'Não foi possível localizar o usuário selecionado. Tente novamente.';
            messageBox.classList.add('err');
          }
          return;
        }
        const counterpartyAssets = counterpartyData.assets || {};
        const counterpartyAssetAvailable = Number(counterpartyAssets[key] ?? 0);
        if (action === 'buy' && counterpartyAssetAvailable < amountValue) {
          if (messageBox) {
            messageBox.textContent = 'O usuário selecionado não possui quantidade suficiente deste ativo.';
            messageBox.classList.add('err');
          }
          return;
        }
        if (action === 'sell' && key !== 'brl' && totalBrlValue !== null) {
          const counterpartyBrl = Number(counterpartyAssets.brl ?? 0);
          if (counterpartyBrl < totalBrlValue) {
            if (messageBox) {
              messageBox.textContent = 'O usuário selecionado não possui saldo em reais suficiente para esta compra.';
              messageBox.classList.add('err');
            }
            return;
          }
        }
      }

      const payload = {
        asset: key,
        action,
        amount: amountValue
      };
      if (selectedCounterpartyId !== null) {
        payload.counterparty_id = selectedCounterpartyId;
      }
      if (totalBrlValue !== null) {
        payload.total_brl = totalBrlValue;
      }
      if (unitPriceValue !== null) {
        payload.unit_price = unitPriceValue;
      }

      if (submitBtn) submitBtn.disabled = true;

      try {
        const res = await fetch(API('request_special_asset_action.php'), {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json().catch(() => ({}));

        if (res.ok) {
          if (messageBox) {
            const detail = data && (data.detail || 'Solicitação registrada. Confirme pela aba "Transações pendentes".');
            messageBox.textContent = detail;
            messageBox.classList.remove('err');
          }
          form.reset();
          if (actionSelect) {
            actionSelect.value = 'deposit';
          }
          toggleTradeFields();
        } else {
          const detail = data && (data.detail || data.error || res.statusText);
          if (messageBox) {
            messageBox.textContent = 'Erro: ' + detail;
            messageBox.classList.add('err');
          }
        }
      } catch (err) {
        if (messageBox) {
          messageBox.textContent = 'Erro inesperado ao registrar a solicitação.';
          messageBox.classList.add('err');
        }
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  });
}

async function viewAdmin(){
  const view = document.getElementById('view');
  view.innerHTML = `<h1>Painel Administrativo</h1><p>Carregando informações...</p>`;

  const data = await getJSON(API('admin_users.php'));
  if (data.__auth === false) return needLogin();
  if (data.__forbidden) {
    view.innerHTML = `<h1>Acesso restrito</h1><p>Somente administradores podem visualizar esta área.</p>`;
    return;
  }

  const arr = Array.isArray(data) ? data : [];
  const total = arr.length;
  const confirmedCount = arr.filter(u => Number(u.confirmed) === 1).length;
  const adminCount = arr.filter(u => Number(u.is_admin) === 1).length;
  const specialUser = arr.find(u => Number(u.is_special_liquidity_user) === 1) || null;
  const specialCount = specialUser ? 1 : 0;

  const rows = arr.map(u => ({
    id: u.id,
    nome: esc(u.name ?? ''),
    email: esc(u.email ?? ''),
    confirmado: Number(u.confirmed) === 1 ? 'Sim' : 'Não',
    admin: Number(u.is_admin) === 1 ? 'Sim' : 'Não',
    especial: Number(u.is_special_liquidity_user) === 1 ? 'Sim' : 'Não',
    criado_em: esc(u.created_at ?? '')
  }));

  const stats = `
    <div class="stats">
      <div class="stat-card"><span>Usuários</span><strong>${total}</strong></div>
      <div class="stat-card"><span>Confirmados</span><strong>${confirmedCount}</strong></div>
      <div class="stat-card"><span>Administradores</span><strong>${adminCount}</strong></div>
      <div class="stat-card"><span>Usuário especial</span><strong>${specialCount}</strong></div>
    </div>`;

  const specialOptions = arr.length > 0
    ? arr.map(u => {
        const label = esc(u.name || u.email || `Usuário #${u.id}`);
        const isCurrent = Number(u.is_special_liquidity_user) === 1;
        const tag = isCurrent ? ' (atual)' : '';
        return `<option value="${u.id}"${isCurrent ? ' selected' : ''}>${label}${tag}</option>`;
      }).join('')
    : '<option value="" disabled selected>Nenhum usuário disponível</option>';

  view.innerHTML = `
    <div class="section admin-dashboard">
      <h1>Painel Administrativo</h1>
      <p>Visualize rapidamente os usuários confirmados e quem possui acesso administrativo.</p>
      ${stats}
      <div class="card admin-special-user">
        <h2>Usuário Especial</h2>
        <p class="hint">Escolha o usuário que poderá controlar os ativos da piscina de liquidez.</p>
        <div class="special-user-actions">
          <select id="specialUserSelect">${specialOptions}</select>
          <button id="setSpecialUserBtn">Transformar em Usuário Especial</button>
        </div>
        <p class="msg" id="specialUserMsg"></p>
      </div>
      <h2>Usuários cadastrados</h2>
      ${table(rows, ['id','nome','email','confirmado','admin','especial','criado_em'], ['#','Nome','E-mail','Confirmado','Admin','Especial','Criado em'])}
    </div>`;

  const selectEl = document.getElementById('specialUserSelect');
  const btnEl = document.getElementById('setSpecialUserBtn');
  const msgEl = document.getElementById('specialUserMsg');

  if (selectEl && btnEl) {
    const updateButtonState = () => {
      const selectedId = parseInt(selectEl.value, 10);
      if (!Number.isFinite(selectedId)) {
        btnEl.disabled = true;
        btnEl.textContent = 'Transformar em Usuário Especial';
        return;
      }
      const isCurrent = specialUser && Number(specialUser.id) === selectedId;
      btnEl.disabled = !!isCurrent;
      btnEl.textContent = isCurrent ? 'Usuário já é especial' : 'Transformar em Usuário Especial';
    };

    updateButtonState();
    selectEl.addEventListener('change', () => {
      if (msgEl) {
        msgEl.textContent = '';
        msgEl.classList.remove('err');
      }
      updateButtonState();
    });

    btnEl.addEventListener('click', async () => {
      const selectedId = parseInt(selectEl.value, 10);
      if (!Number.isFinite(selectedId)) {
        return;
      }

      btnEl.disabled = true;
      btnEl.textContent = 'Atualizando...';
      if (msgEl) {
        msgEl.textContent = '';
        msgEl.classList.remove('err');
      }

      const res = await fetch(API('set_special_liquidity_user.php'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: selectedId })
      });

      if (res.ok) {
        if (msgEl) {
          msgEl.textContent = 'Usuário especial atualizado com sucesso.';
          msgEl.classList.remove('err');
        }
        await refreshAuthUI();
        await viewAdmin();
        return;
      }

      const err = await res.json().catch(()=>({}));
      if (msgEl) {
        msgEl.textContent = 'Erro: ' + (err.detail || err.error || res.statusText);
        msgEl.classList.add('err');
      }
      btnEl.disabled = false;
      btnEl.textContent = 'Transformar em Usuário Especial';
    });
  }
}

function renderPendingTransactionCard(req){
  if (!req || typeof req !== 'object') return '';
  const assetKey = String(req.asset ?? '').toLowerCase();
  const assetLabel = SPECIAL_ASSET_LABELS[assetKey] || (assetKey ? assetKey.toUpperCase() : 'Ativo');
  const actionLabel = formatSpecialAssetAction(req.action);
  const amountText = formatSpecialAssetAmountText(req.asset, req.amount);
  const totalBrlText = req.total_brl !== null && typeof req.total_brl !== 'undefined'
    ? formatBRL(Number(req.total_brl))
    : null;
  const createdAtRaw = req.created_at ? String(req.created_at) : '';
  let createdText = createdAtRaw;
  if (createdAtRaw) {
    const createdDate = new Date(createdAtRaw);
    if (createdDate instanceof Date && !Number.isNaN(createdDate.getTime())) {
      createdText = createdDate.toLocaleString('pt-BR');
    }
  }
  const approvals = Array.isArray(req.approvals) ? req.approvals : [];
  const participants = approvals.length
    ? approvals.map(participant => {
        const confirmed = !!participant.confirmed;
        const status = confirmed ? 'Confirmado' : 'Pendente';
        const statusClass = confirmed ? 'confirmed' : 'pending';
        const name = esc(participant.display_name ?? participant.name ?? 'Participante');
        return `<li class="participant ${statusClass}"><span>${name}</span><small>${status}</small></li>`;
      }).join('')
    : '<li class="participant pending"><span>Nenhum participante encontrado</span></li>';
  const initiatorName = req.initiator && req.initiator.display_name ? esc(req.initiator.display_name) : 'Usuário';
  const counterpartyName = req.counterparty && req.counterparty.display_name
    ? `<dt>Com</dt><dd>${esc(req.counterparty.display_name)}</dd>`
    : '';
  const currentApproval = approvals.find(p => Number(p.user_id) === Number(currentSession.user_id));
  const alreadyConfirmed = currentApproval ? !!currentApproval.confirmed : false;
  let confirmButton = '';
  if (req.can_confirm) {
    confirmButton = `<button class="btn-confirm" data-request="${req.id}">Confirmar transação</button>`;
  } else {
    const label = alreadyConfirmed ? 'Aguardando outros usuários' : 'Aguardando confirmação';
    confirmButton = `<button class="btn-confirm" data-request="${req.id}" disabled>${label}</button>`;
  }
  const cancelDisabled = req.can_cancel === false;
  const cancelButton = `<button class="btn-cancel" data-request="${req.id}" ${cancelDisabled ? 'disabled' : ''}>Cancelar transação</button>`;
  const actionButtons = [confirmButton, cancelButton].filter(Boolean).join('');
  const actionsSection = actionButtons ? `<div class="actions pending-actions">${actionButtons}</div>` : '';
  const lastError = req.last_error ? `<p class="msg err">${esc(req.last_error)}</p>` : '';
  const statusBadge = req.status === 'confirmed' && !req.can_confirm
    ? '<span class="badge badge-waiting">Aguardando outro participante</span>'
    : '';
  return `
    <article class="card pending-card" data-request="${req.id}">
      <header>
        <h3>${esc(actionLabel)} • ${esc(assetLabel)}</h3>
        <span class="meta">Criado em ${esc(createdText)}</span>
        ${statusBadge}
      </header>
      <dl class="details">
        <dt>Quantidade</dt><dd>${esc(amountText)}</dd>
        ${totalBrlText ? `<dt>Total em R$</dt><dd>${esc(totalBrlText)}</dd>` : ''}
        <dt>Solicitante</dt><dd>${initiatorName}</dd>
        ${counterpartyName}
      </dl>
      <div class="participants-wrapper">
        <h4>Participantes</h4>
        <ul class="participants">${participants}</ul>
      </div>
      ${lastError}
      <p class="msg" data-role="feedback"></p>
      ${actionsSection}
    </article>
  `;
}
function renderPendingTransactionsList(requests){
  if (!Array.isArray(requests) || requests.length === 0) {
    return '<p class="hint">Nenhuma transação pendente no momento.</p>';
  }
  return `<div class="pending-list">${requests.map(renderPendingTransactionCard).join('')}</div>`;
}
function renderPendingTransactionsContent(section, requests, flashMessage = null){
  if (!section) return;
  const flash = flashMessage && flashMessage.text
    ? `<p class="msg ${flashMessage.type === 'error' ? 'err' : ''}">${esc(flashMessage.text)}</p>`
    : '';
  section.innerHTML = `
    <h1>Transações Pendentes</h1>
    <p class="hint">Revise e confirme as operações de ativos especiais envolvendo sua conta.</p>
    ${flash}
    ${renderPendingTransactionsList(requests)}
  `;
  bindPendingTransactionActions(section);
}
function bindPendingTransactionActions(section){
  if (!section) return;
  section.querySelectorAll('button.btn-confirm[data-request]').forEach(btn => {
    if (btn.dataset.bound === '1') return;
    btn.dataset.bound = '1';
    if (btn.disabled) return;
    btn.addEventListener('click', async () => {
      const requestId = parseInt(btn.dataset.request, 10);
      if (!Number.isFinite(requestId)) {
        return;
      }
      const card = btn.closest('.pending-card');
      const feedback = card ? card.querySelector('[data-role="feedback"]') : null;
      if (feedback) {
        feedback.textContent = 'Confirmando transação...';
        feedback.classList.remove('err');
      }
      btn.disabled = true;
      let completed = false;
      try {
        const res = await fetch(API('confirm_special_asset_action.php'), {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ request_id: requestId })
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          const status = data && typeof data.status === 'string' ? data.status : 'pending';
          const flash = {
            text: status === 'executed'
              ? 'Transação confirmada e executada com sucesso.'
              : 'Sua confirmação foi registrada. Aguarde os demais participantes.',
            type: status === 'executed' ? 'success' : 'info'
          };
          const updated = Array.isArray(data.pending_requests) ? data.pending_requests : [];
          completed = true;
          renderPendingTransactionsContent(section, updated, flash);
          return;
        }
        const detail = data && (data.detail || data.error || res.statusText);
        if (feedback) {
          feedback.textContent = 'Erro: ' + detail;
          feedback.classList.add('err');
        }
      } catch (err) {
        if (feedback) {
          feedback.textContent = 'Erro inesperado ao confirmar a transação.';
          feedback.classList.add('err');
        }
      } finally {
        if (!completed && btn.isConnected) {
          btn.disabled = false;
        }
      }
    });
  });
  section.querySelectorAll('button.btn-cancel[data-request]').forEach(btn => {
    if (btn.dataset.bound === '1') return;
    btn.dataset.bound = '1';
    if (btn.disabled) return;
    btn.addEventListener('click', async () => {
      const requestId = parseInt(btn.dataset.request, 10);
      if (!Number.isFinite(requestId)) {
        return;
      }
      if (!window.confirm('Tem certeza de que deseja cancelar esta transação?')) {
        return;
      }
      const card = btn.closest('.pending-card');
      const feedback = card ? card.querySelector('[data-role="feedback"]') : null;
      const confirmBtn = card ? card.querySelector(`button.btn-confirm[data-request="${requestId}"]`) : null;
      const confirmWasDisabled = confirmBtn ? confirmBtn.disabled : false;
      if (feedback) {
        feedback.textContent = 'Cancelando transação...';
        feedback.classList.remove('err');
      }
      btn.disabled = true;
      if (confirmBtn) {
        confirmBtn.disabled = true;
      }
      let completed = false;
      try {
        const res = await fetch(API('cancel_special_asset_action.php'), {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ request_id: requestId })
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          const flash = {
            text: data && data.already_cancelled
              ? 'Esta transação já havia sido cancelada anteriormente.'
              : 'Transação cancelada com sucesso.',
            type: data && data.already_cancelled ? 'info' : 'success'
          };
          const updated = Array.isArray(data.pending_requests) ? data.pending_requests : [];
          completed = true;
          renderPendingTransactionsContent(section, updated, flash);
          return;
        }
        const detail = data && (data.detail || data.error || res.statusText);
        if (feedback) {
          feedback.textContent = 'Erro: ' + detail;
          feedback.classList.add('err');
        }
      } catch (err) {
        if (feedback) {
          feedback.textContent = 'Erro inesperado ao cancelar a transação.';
          feedback.classList.add('err');
        }
      } finally {
        if (!completed && btn.isConnected) {
          btn.disabled = false;
        }
        if (!completed && confirmBtn && confirmBtn.isConnected && !confirmWasDisabled) {
          confirmBtn.disabled = false;
        }
      }
    });
  });
}
async function viewPendingTransactions(flashMessage = null){
  if (!currentSession.logged) {
    return needLogin();
  }
  const view = document.getElementById('view');
  view.innerHTML = '<section class="section pending-transactions" data-role="pending-root"><h1>Transações Pendentes</h1><p class="hint">Carregando transações...</p></section>';
  const section = view.querySelector('[data-role="pending-root"]');
  const data = await getJSON(API('special_asset_requests.php'));
  if (data && data.__auth === false) {
    return needLogin();
  }
  if (data && data.error) {
    section.innerHTML = '<h1>Transações Pendentes</h1><p class="msg err">Não foi possível carregar as solicitações.</p>';
    return;
  }
  const requests = data && Array.isArray(data.requests) ? data.requests : [];
  renderPendingTransactionsContent(section, requests, flashMessage);
}

/* ========= Menu ========= */
function initMenu(){
  document.querySelectorAll('a[data-view]').forEach(a=>{
    a.addEventListener('click', (e)=>{
      e.preventDefault();
      const v = a.dataset.view;
      if (v==='saldo') return viewSaldo();
      if (v==='bitcoin') return viewBitcoin();
      if (v==='nft') return viewNFT();
      if (v==='mercado_nft') return viewMercadoNFT();
      if (v==='mercado_btc') return viewMercadoBTC();
      if (v==='live_market') return viewLiveMarket();
      if (v==='trades') return viewTrades();
      if (v==='user_assets') return viewUserAssets();
      if (v==='pending_transactions') return viewPendingTransactions();
      if (v==='liquidity_game') return viewLiquidityGame();
      if (v==='admin') return viewAdmin();
    });
  });
}

/* ========= Init ========= */
initAuth();
initMenu();