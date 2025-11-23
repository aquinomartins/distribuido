const API = (path) => `api/${path}`;
const AUTH = (path) => `auth/${path}`;
const NFT_IMAGE_PLACEHOLDER = 'https://via.placeholder.com/140x140.png?text=NFT';

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
function truncateText(value, maxLength=120){
  const text = String(value ?? '').trim();
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1)}…`;
}
function esc(str){
  return String(str ?? '').replace(/[&<>"']/g, s=>({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  })[s]);
}

function clamp(value, min, max){
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.min(Math.max(number, min), max);
}

function formatDateTime(value){
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
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

function renderLandingView(){
  return `
    <section class="landing-hero">
      <div class="hero-backdrop" aria-hidden="true"></div>
      <div class="hero-content">
        <p class="hero-kicker">hub distribuído</p>
        <h1>Bem-vindo! Escolha um módulo do menu.</h1>
        <p>
          Explore os ambientes de mercado, coleções e eventos em um painel vivo.
          Cada módulo foi desenhado para reagir em tempo real às decisões da sua
          equipe.
        </p>
        <div class="hero-actions">
          <a class="hero-cta" href="#appMenu">Explorar módulos</a>
          <a class="hero-ghost" href="#" data-view="live_market">Ver mercado ao vivo</a>
        </div>
      </div>
      <div class="hero-visual">
        <div class="hero-orb" aria-hidden="true"></div>
        <div class="hero-grid" aria-hidden="true"></div>
        <ul class="hero-modules">
          <li>
            <button class="hero-module" type="button" data-view="live_market" aria-label="Ir para Mercado ao vivo">
              <span>01</span>
              <strong>Mercado ao vivo</strong>
              <small>Liquidez dinâmica 24/7</small>
            </button>
          </li>
          <li>
            <button class="hero-module" type="button" data-view="collections" aria-label="Ir para Coleções">
              <span>02</span>
              <strong>Coleções</strong>
              <small>Curadoria generativa e NFT</small>
            </button>
          </li>
          <li>
            <button class="hero-module" type="button" data-view="events" aria-label="Ir para Eventos">
              <span>03</span>
              <strong>Eventos</strong>
              <small>Streams, torneios e ativos raros</small>
            </button>
          </li>
        </ul>
      </div>
    </section>

    <section class="landing-panels" aria-label="Resumo dos módulos">
      <a class="panel-card" href="#" data-view="user_assets" aria-label="Ir para 1.8 Meus Ativos">
        <header>
          <p>1.8 Meus Ativos</p>
          <strong>Controle total</strong>
        </header>
        <p>Gestão detalhada das posições e NFTs com filtros avançados.</p>
      </a>
      <a class="panel-card" href="#" data-view="pending_transactions" aria-label="Ir para Transações pendentes">
        <header>
          <p>Transações pendentes</p>
          <strong>Fluxo em tempo real</strong>
        </header>
        <p>Assuma o comando das aprovações e mantenha o time sincronizado.</p>
      </a>
      <a class="panel-card" href="#" data-view="liquidity_game" aria-label="Ir para Jogo Piscina de Liquidez">
        <header>
          <p>Jogo Piscina de Liquidez</p>
          <strong>Simulações</strong>
        </header>
        <p>Teste cenários de liquidez e compartilhe insights com o grupo.</p>
      </a>
    </section>

    <section class="landing-footer">
      <div>
        <span>Status</span>
        <strong>Plataforma ativa</strong>
      </div>
      <div>
        <span>Última atualização</span>
        <strong>Agora mesmo</strong>
      </div>
      <div>
        <span>Equipe logada</span>
        <strong>Conecte-se pelo menu</strong>
      </div>
    </section>
  `;
}

function viewHome(){
  const view = document.getElementById('view');
  if (!view) return;
  view.className = 'landing-view';
  view.innerHTML = renderLandingView();
}

/* ========= Coleções ========= */
const MARKET_COLLECTIONS = [
  {
    id: 'cryptopunks',
    name: 'CryptoPunks',
    category: 'Coleção OG',
    totalItems: 10000,
    owners: 3300,
    floorEth: 45.8,
    volumeEth: 850000,
    change24h: '+4.2%',
    coverImage: 'https://www.larvalabs.com/public/images/cryptopunks/punk-variety-2x.png',
    featuredItem: 'punk7885',
    description: 'Uma das coleções pioneiras em Ethereum com personagens pixelados que se tornaram ícones da cultura NFT.',
    items: [
      {
        id: 'punk3100',
        name: 'CryptoPunk #3100',
        priceEth: 48.2,
        lastSaleEth: 46.5,
        owner: '0xb8...1190',
        availability: 'À venda',
        traits: ['Alien', 'Headband'],
        image: 'https://www.larvalabs.com/public/images/cryptopunks/punk3100.png'
      },
      {
        id: 'punk7804',
        name: 'CryptoPunk #7804',
        priceEth: 69.4,
        lastSaleEth: 57.7,
        owner: '0x73...ff21',
        availability: 'Leilão',
        traits: ['Alien', 'Pipe', 'Small Shades'],
        image: 'https://www.larvalabs.com/public/images/cryptopunks/punk7804.png'
      },
      {
        id: 'punk7885',
        name: 'CryptoPunk #7885',
        priceEth: 52.1,
        lastSaleEth: 50.0,
        owner: '0x19...2f3c',
        availability: 'Oferta ativa',
        traits: ['Zombie', 'Do-rag', 'Big Shades'],
        image: 'https://www.larvalabs.com/public/images/cryptopunks/punk7885.png'
      },
      {
        id: 'punk2140',
        name: 'CryptoPunk #2140',
        priceEth: 43.9,
        lastSaleEth: 41.3,
        owner: '0xa3...4b11',
        availability: 'Oferta aceita',
        traits: ['Ape', 'Knitted Cap'],
        image: 'https://www.larvalabs.com/public/images/cryptopunks/punk2140.png'
      }
    ]
  },
  {
    id: 'boredapeyc',
    name: 'Bored Ape Yacht Club',
    category: 'Club Membership',
    totalItems: 10000,
    owners: 5600,
    floorEth: 28.6,
    volumeEth: 102300,
    change24h: '+1.6%',
    coverImage: 'https://i.seadn.io/gae/7bKs64h0/promo1?w=500&auto=format',
    featuredItem: 'bayc9151',
    description: 'Coleção de macacos entediados com acesso a experiências exclusivas do BAYC.',
    items: [
      {
        id: 'bayc9151',
        name: 'BAYC #9151',
        priceEth: 31.0,
        lastSaleEth: 30.1,
        owner: '0x8a...cc90',
        availability: 'Compra imediata',
        traits: ['Golden Brown', 'Leather Jacket', 'Crazy Eyes'],
        image: 'https://i.seadn.io/gae/xO_Bp6kd06P88eaJEqn3Ejj6mUeJ8V4aHcRUW2KIiMzFxLpy0X58F3RDeo63e_kUsVTN_S7kwh28ykVfoCEN0z7LxyzKDn5XxhxL7sRKqzZo4PMBVXgSns0?w=500&auto=format'
      },
      {
        id: 'bayc183',
        name: 'BAYC #183',
        priceEth: 34.8,
        lastSaleEth: 33.0,
        owner: '0xc4...751d',
        availability: 'Oferta recebida',
        traits: ['Robot', 'Bayc Flipped Brim', 'Rainbow Grill'],
        image: 'https://i.seadn.io/gae/vH14RJCdxu2QG8kmJshlMsHx8X7x1YgnPZXoqBYwygJyI072QtdgQXl3k_VufADG7n2_ceDzy83H8-ei2qxGn8pYtBXexdF7nRmow4ppIqhzyapMI2vlA7E?w=500&auto=format'
      },
      {
        id: 'bayc3367',
        name: 'BAYC #3367',
        priceEth: 29.4,
        lastSaleEth: 0,
        owner: '0xfe...77da',
        availability: 'Novo anúncio',
        traits: ['Blue Beam', 'Safari Hat', 'Hawaiian'],
        image: 'https://i.seadn.io/gae/CZ0w-AV2XpVZl8vGeOawxDFUY8ailqXFz83vGN9VOGBev5nYeD1yfknhk_PaoCA8DmF5asJ5AZt0pOEt_KoYNWZLxE-tobVhtSGcVwqDAVBBusZT6F-T1w?w=500&auto=format'
      }
    ]
  },
  {
    id: 'pudgypenguins',
    name: 'Pudgy Penguins',
    category: 'Coleção PFP',
    totalItems: 8888,
    owners: 4600,
    floorEth: 12.3,
    volumeEth: 76000,
    change24h: '+6.8%',
    coverImage: 'https://i.seadn.io/gae/_nT0OqQE0Vh1TQm9n1VWeN_GX2VINeodIZ6hO6PvxI6B_A5lHppZArYrusS4x2maFG-vfZfbQ3VIAtF_forNCz7Lxyz0_Z7dxyzKDn5XxhxL?w=500&auto=format',
    featuredItem: 'penguin6523',
    description: 'Pingüins com personalidade única que combinam estética kawaii e utilidades sociais.',
    items: [
      {
        id: 'penguin6523',
        name: 'Pudgy Penguin #6523',
        priceEth: 13.2,
        lastSaleEth: 12.8,
        owner: '0xb1...6231',
        availability: 'Oferta ativa',
        traits: ['Crown', 'Fishing Pole', 'Green Background'],
        image: 'https://i.seadn.io/gae/HEdBDEuDfSUeYEYVplpXCMVvjJAnCmvYzu3n6PvJEa3TBUnIFJnyGryuVKyXjHimoMuquxYZc13JUO2cMjJ1ytY1qXK2vNhbbX6YsJhBKt3vnDnNQfXlYQA?w=500&auto=format'
      },
      {
        id: 'penguin1245',
        name: 'Pudgy Penguin #1245',
        priceEth: 12.5,
        lastSaleEth: 11.9,
        owner: '0xaa...9031',
        availability: 'Compra imediata',
        traits: ['Mustache', 'Trapper Hat', 'Yellow Background'],
        image: 'https://i.seadn.io/gae/1X7sKnzG-TpA0RduCMsZIXdlAUPI0dR1vZ1tcHTTX3e8DqRL3-KjaxAgq6MqxsVXni4eWh05rq6ArtyTc95xJMu38xpv8uKXu95syEcxrB6f0GO6zkRgLQ?w=500&auto=format'
      },
      {
        id: 'penguin701',
        name: 'Pudgy Penguin #701',
        priceEth: 11.9,
        lastSaleEth: 12.0,
        owner: '0xf0...a129',
        availability: 'Leilão',
        traits: ['Angel Wings', 'Halo', 'Purple Background'],
        image: 'https://i.seadn.io/gae/XXAUPI0dR1vZ1tcHTT3I8iRrPq3P2wAPOQgQnXlLxyzKDn5XxhxL7sRKqzZo4PMBVXgSnwp?w=500&auto=format'
      }
    ]
  }
];

const PLATFORM_EVENTS = [
  {
    id: 'token_summit_brasilia',
    title: 'Token Summit Brasília',
    date: '2024-07-05T09:00:00-03:00',
    location: 'Brasília/DF · Auditório B3',
    type: 'Roadshow',
    status: 'Lote 2 aberto',
    seats: '60 vagas presenciais',
    highlight: 'Demonstração do fluxo de ativos tokenizados e integração contábil.',
    tags: ['Governança', 'Custódia'],
    registrationUrl: 'mailto:eventos@ergasterio.com',
    registrationLabel: 'Reservar vaga'
  },
  {
    id: 'webinar_liquidez',
    title: 'Webinar · Liquidez Especial 2.0',
    date: '2024-07-18T11:00:00-03:00',
    location: 'Online · Microsoft Teams',
    type: 'Webinar',
    status: 'Inscrições abertas',
    seats: 'Vagas ilimitadas',
    highlight: 'Atualização do módulo de transações pendentes e novas APIs.',
    tags: ['API', 'Operações'],
    registrationUrl: 'https://meet.ergasterio.com/liquidez',
    registrationLabel: 'Inscrever-se'
  },
  {
    id: 'creator_day_sp',
    title: 'Creator Day São Paulo',
    date: '2024-08-08T10:00:00-03:00',
    location: 'São Paulo/SP · Hub Faria Lima',
    type: 'Workshop',
    status: 'Lista de espera',
    seats: '40 lugares',
    highlight: 'Imersão em coleções, mint interno e roteiro de vendas.',
    tags: ['NFT', 'Marketplace'],
    registrationUrl: 'https://meet.ergasterio.com/creator-day',
    registrationLabel: 'Entrar na lista'
  }
];

let collectionsEscHandler = null;
let mintedCollectionsCache = [];

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

async function syncSpecialAssetsFromServer(force=false){
  if (!currentSession.is_special_liquidity_user) return false;
  if (!force && liquiditySpecialAssets) return true;
  try {
    const data = await getJSON(API('liquidity_game_state.php'));
    if (data.__auth === false) return false;
    liquiditySpecialAssets = normalizeSpecialAssets(data && data.special_assets);
    return true;
  } catch (err) {
    console.error('Erro ao sincronizar ativos protegidos:', err);
    return false;
  }
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

const LIQUIDITY_ANONYMOUS_PLAYER_ASSETS = {
  brl: 1600,
  bitcoin: 0,
  nft: 1,
  quotas: 0
};

function createAnonymousLiquidityPlayers(count){
  const total = Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
  const players = [];
  for (let i = 0; i < total; i += 1){
    players.push({
      id: null,
      name: `Time ${i + 1}`,
      assets: { ...LIQUIDITY_ANONYMOUS_PLAYER_ASSETS }
    });
  }
  return players;
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

function renderLiquidityPlayerRosterSection(players, options={}){
  const list = Array.isArray(players) ? players : [];
  const isAdmin = !!options.isAdmin;
  const playerCount = list.length;
  const title = options.title || (isAdmin ? `Jogadores cadastrados (${playerCount})` : 'Seus ativos iniciais');
  const intro = options.intro !== undefined
    ? options.intro
    : (isAdmin ? '' : '<p class="hint">Esta sessão mostra somente os seus saldos registrados no sistema.</p>');
  const emptyMessage = options.emptyMessage || '<p class="hint">Nenhum jogador cadastrado para o jogo no momento.</p>';
  const fallbackSelfLabel = options.viewerLabel || 'Você';

  const items = list.map((player, idx)=>{
    const name = (player && typeof player.name === 'string') ? player.name.trim() : '';
    const label = name || (isAdmin ? `Jogador ${idx + 1}` : fallbackSelfLabel);
    const assets = normalizeSpecialAssets(player && player.assets);
    const summary = [
      `BTC: ${formatBTC(assets.bitcoin)}`,
      `NFTs: ${assets.nft}`,
      `R$: ${formatBRL(assets.brl)}`,
      `Cotas: ${formatNumber(assets.quotas)}`
    ].join(' • ');
    return `<li><strong>${esc(label)}</strong><br><small>${esc(summary)}</small></li>`;
  }).join('');

  const listHtml = playerCount
    ? `<ol class="player-list">${items}</ol>`
    : emptyMessage;

  return `
    <div class="player-roster">
      <h3>${esc(title)}</h3>
      ${intro}
      ${listHtml}
    </div>`;
}

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
  const maxSelectablePlayers = Math.min(10, playerCount);
  const minSelectablePlayers = Math.max(minPlayers, 1);
  const canSelectPlayers = maxSelectablePlayers >= minSelectablePlayers;
  const defaultSelection = canSelectPlayers
    ? Math.max(minSelectablePlayers, Math.min(maxSelectablePlayers, playerCount))
    : null;
  let playerSelectionSection = '<p class="hint err">Nenhum jogador disponível para iniciar o jogo.</p>';
  if (canSelectPlayers) {
    const options = [];
    for (let i = minSelectablePlayers; i <= maxSelectablePlayers; i += 1) {
      const plural = i > 1 ? 'es' : '';
      options.push(`<option value="${i}"${i === defaultSelection ? ' selected' : ''}>${i} jogador${plural}</option>`);
    }
    const availabilityNote = playerCount > 10
      ? `<p class="hint">Jogadores disponíveis: ${playerCount}. Somente 10 podem participar por partida.</p>`
      : `<p class="hint">Jogadores disponíveis: ${playerCount}.</p>`;
    playerSelectionSection = `
      <div class="player-selection">
        <h3>Quantidade de jogadores</h3>
        <label for="playerCountSelect">Escolha quantos participantes iniciarão o jogo (máximo de 10):</label>
        <select id="playerCountSelect">${options.join('')}</select>
        ${availabilityNote}
      </div>`;
  }
  const btnLabel = liquidityGame ? 'Reiniciar jogo' : 'Iniciar jogo';
  const disabledAttr = playerCount < minPlayers ? 'disabled' : '';
  const warning = playerCount < minPlayers
    ? (currentSession.is_admin
      ? '<p class="hint err">Cadastre pelo menos 2 usuários confirmados para iniciar o jogo.</p>'
      : '<p class="hint err">Seus ativos ainda não estão disponíveis para o jogo. Verifique com o administrador.</p>')
    : '<p class="hint">Cada time anônimo inicia com R$ 1.600 e 1 NFT (sem BTC ou cotas). Você pode renomear o time após o início.</p>';

  view.innerHTML = `
    <div class="section game-setup">
      <h1>Jogo Piscina de Liquidez</h1>
      <p>Gerencie as ações disponíveis, a semifinal (times com NFT em mãos) e a final para definir quem lidera em reais nesse jogo com NFTs, Bitcoin e cotas da piscina de liquidez.</p>
      ${playerSelectionSection}
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
      const selectEl = document.getElementById('playerCountSelect');
      const selectedPlayers = selectEl ? Math.max(minPlayers, Math.min(parseInt(selectEl.value, 10) || minPlayers, maxSelectablePlayers)) : liquidityPlayers.length;
      const gamePlayers = createAnonymousLiquidityPlayers(selectedPlayers);
      const game = createLiquidityGame(gamePlayers, minPlayers);
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
  const minPlayers = currentSession.is_admin ? 2 : 1;
  if (!liquidityGame){
    const count = liquidityPlayers.length;
    if (count >= minPlayers){
      container.innerHTML = `<p class="hint">Clique em <strong>Iniciar jogo</strong> para começar com os ${count} jogador(es) cadastrados.</p>`;
    } else if (count > 0){
      container.innerHTML = `<p class="hint">${currentSession.is_admin ? 'Cadastre pelo menos mais um usuário confirmado para iniciar o jogo.' : 'Seus ativos ainda não estão disponíveis para simulação. Entre em contato com o administrador.'}</p>`;
    } else {
      container.innerHTML = `<p class="hint">${currentSession.is_admin ? 'Cadastre novos usuários para habilitar o jogo.' : 'Nenhum ativo encontrado para o seu usuário no momento.'}</p>`;
    }
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
    const phone = document.getElementById('r_phone').value.trim();
    const password = document.getElementById('r_password').value;
    const payload = {name,email,password};
    if (phone) payload.phone = phone;
    const r = await fetch(API('register.php'), {
      method:'POST', credentials:'include',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    const msg = document.getElementById('authMsg');
    if (r.ok) {
      msg.textContent = 'Conta criada! Verifique seu e-mail para confirmar.';
      form.reset(); form.style.display='none';
      msg.classList.remove('err');
    } else {
      const err = await r.json().catch(()=>({}));
      if (err.error === 'phone_invalid') {
        msg.textContent = 'Erro: informe um telefone válido com DDD.';
      } else {
        msg.textContent = 'Erro ao registrar: ' + (err.detail || err.error || r.statusText);
      }
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
      description: 'Utilize o saldo em moeda fiduciária.',
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
              <option value="buy" selected>Compra</option>
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
      <div class="user-nfts" data-role="user-nfts">
        <h2>NFTs vinculadas</h2>
        <p class="hint">Visualize as obras digitais atualmente sob sua custódia.</p>
        <div class="user-nft-grid" data-role="user-nft-list"></div>
        <p class="hint user-nft-empty" data-role="user-nft-message"></p>
        <p class="hint user-nft-feedback" data-role="user-nft-feedback" hidden></p>
        <div class="user-nft-chassis" data-role="user-nft-chassis" hidden>
          <h3>Chassis disponíveis</h3>
          <p class="hint">Você possui chassis em branco prontos para novas mintagens.</p>
          <ul class="user-nft-chassis-list" data-role="user-nft-chassis-list"></ul>
        </div>
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

  loadUserNfts(view.querySelector('[data-role="user-nfts"]'), { enableListing: isOwner });

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
      const action = actionSelect ? actionSelect.value : 'buy';
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

      const action = actionSelect ? actionSelect.value : 'buy';
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

      if (action === 'buy' && availableAsset < amountValue) {
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
            actionSelect.value = 'buy';
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

function normalizeUserNftWorks(rawWorks){
  if (!Array.isArray(rawWorks)) return [];
  return rawWorks.map((item)=>{
    const work = item || {};
    const listingPrice = Number(work.listing_price);
    return {
      work_id: work.work_id ?? work.id ?? null,
      title: work.title || work.name || null,
      asset_id: work.asset_id ?? null,
      instance_id: work.instance_id ?? null,
      token_id: work.token_id || work.asset_token_id || null,
      image_url: work.image_url || work.thumbnail || work.thumbnail_url || work.cover_image || work.image || null,
      collection: work.collection || work.collection_name || null,
      listing_order_id: work.listing_order_id ?? null,
      listing_price: Number.isFinite(listingPrice) ? listingPrice : null
    };
  });
}

function renderUserNftCard(nft, options={}){
  const enableListing = !!options.enableListing;
  const listingPrice = Number.isFinite(nft.listing_price) ? nft.listing_price : null;
  const title = nft.title || `NFT #${nft.work_id || nft.instance_id || nft.asset_id || '—'}`;
  const subtitleParts = [];
  if (nft.collection) subtitleParts.push(nft.collection);
  if (nft.work_id) subtitleParts.push(`Obra #${nft.work_id}`);
  const subtitle = subtitleParts.join(' · ');
  const detailItems = [
    nft.asset_id ? `<dt>Asset</dt><dd>#${esc(nft.asset_id)}</dd>` : '',
    nft.instance_id ? `<dt>Instância</dt><dd>#${esc(nft.instance_id)}</dd>` : '',
    nft.token_id ? `<dt>Token</dt><dd>${esc(nft.token_id)}</dd>` : ''
  ].filter(Boolean).join('');
  const details = detailItems || '<dt>ID</dt><dd>—</dd>';
  const imageUrl = nft.image_url || NFT_IMAGE_PLACEHOLDER;
  const listingInfo = (() => {
    if (!enableListing) return '';
    const hasListing = Number.isFinite(listingPrice);
    const label = hasListing
      ? `Anunciada por <strong>${esc(formatBRL(listingPrice))}</strong>`
      : 'Não anunciada para venda';
    const buttonLabel = hasListing ? 'Atualizar preço' : 'Colocar à venda';
    const priceData = hasListing ? String(listingPrice) : '';
    return `
      <div class="user-nft-actions">
        <p class="user-nft-sale${hasListing ? '' : ' muted'}">${label}</p>
        <button type="button" class="user-nft-sell-btn" data-action="list-nft"
          data-instance-id="${esc(nft.instance_id || '')}"
          data-order-id="${esc(nft.listing_order_id || '')}"
          data-title="${esc(title)}"
          data-price="${esc(priceData)}">${buttonLabel}</button>
      </div>
    `;
  })();
  return `
    <article class="user-nft-card">
      <div class="user-nft-thumb">
        <img src="${esc(imageUrl)}" alt="${esc(title)}" loading="lazy" />
      </div>
      <div class="user-nft-body">
        ${subtitle ? `<p class="user-nft-subtitle">${esc(subtitle)}</p>` : ''}
        <h3>${esc(title)}</h3>
        <dl class="user-nft-meta">
          ${details}
        </dl>
        ${listingInfo}
      </div>
    </article>
  `;
}

function renderUserNftChassisItem(item, index){
  const chassis = item || {};
  const size = chassis.size ? `Tamanho ${chassis.size}` : null;
  const material = chassis.material || null;
  const status = chassis.status || null;
  const labelParts = [];
  if (size) labelParts.push(size);
  if (material) labelParts.push(material);
  const label = labelParts.join(' · ') || `Chassi ${index + 1}`;
  return `
    <li>
      <strong>${esc(label)}</strong>
      ${status ? `<span>${esc(status)}</span>` : ''}
    </li>
  `;
}

async function loadUserNfts(section, options={}){
  if (!section) return;
  const enableListing = !!options.enableListing;
  const listEl = section.querySelector('[data-role="user-nft-list"]');
  const messageEl = section.querySelector('[data-role="user-nft-message"]');
  const feedbackEl = section.querySelector('[data-role="user-nft-feedback"]');
  const chassisBox = section.querySelector('[data-role="user-nft-chassis"]');
  const chassisList = section.querySelector('[data-role="user-nft-chassis-list"]');
  if (listEl) listEl.innerHTML = '';
  if (messageEl) {
    messageEl.textContent = 'Carregando NFTs registradas...';
    messageEl.hidden = false;
  }
  if (feedbackEl) {
    feedbackEl.hidden = true;
    feedbackEl.textContent = '';
    feedbackEl.classList.remove('err');
  }
  if (chassisBox) chassisBox.hidden = true;

  let nftData;
  try {
    nftData = await getJSON(API('nfts.php'));
  } catch (err) {
    if (messageEl) {
      messageEl.textContent = 'Não foi possível carregar as NFTs no momento.';
      messageEl.hidden = false;
    }
    return;
  }

  if (nftData.__auth === false) {
    needLogin();
    return;
  }

  if (nftData.__forbidden || nftData.error) {
    if (messageEl) {
      messageEl.textContent = nftData.message || 'Não foi possível carregar as NFTs no momento.';
      messageEl.hidden = false;
    }
    return;
  }

  const works = normalizeUserNftWorks(nftData.obras);
  const chassis = Array.isArray(nftData.chassis) ? nftData.chassis.filter(Boolean) : [];

  if (works.length) {
    if (listEl) listEl.innerHTML = works.map((work)=>renderUserNftCard(work, { enableListing })).join('');
    if (messageEl) messageEl.hidden = true;
  } else if (messageEl) {
    messageEl.textContent = 'Nenhuma NFT registrada no momento.';
    messageEl.hidden = false;
  }

  if (chassisBox && chassisList) {
    if (chassis.length) {
      chassisBox.hidden = false;
      chassisList.innerHTML = chassis.map((item, index)=>renderUserNftChassisItem(item, index)).join('');
    } else {
      chassisBox.hidden = true;
      chassisList.innerHTML = '';
    }
  }

  if (enableListing && !section.__nftListingHandlerBound) {
    section.addEventListener('click', (event) => handleNftListButtonClick(event, section));
    section.__nftListingHandlerBound = true;
  }
}

function setUserNftFeedback(section, message, isError=false){
  if (!section) return;
  const feedbackEl = section.querySelector('[data-role="user-nft-feedback"]');
  if (!feedbackEl) return;
  if (!message) {
    feedbackEl.hidden = true;
    feedbackEl.textContent = '';
    feedbackEl.classList.remove('err');
    return;
  }
  feedbackEl.hidden = false;
  feedbackEl.textContent = message;
  if (isError) {
    feedbackEl.classList.add('err');
  } else {
    feedbackEl.classList.remove('err');
  }
}

async function handleNftListButtonClick(event, section){
  const btn = event.target.closest('[data-action="list-nft"]');
  if (!btn) return;
  event.preventDefault();
  const instanceId = parseInt(btn.dataset.instanceId, 10);
  if (!Number.isFinite(instanceId)) {
    setUserNftFeedback(section, 'NFT inválida selecionada.', true);
    return;
  }
  const title = btn.dataset.title || 'sua NFT';
  const currentPrice = parseFloat(btn.dataset.price || '');
  const defaultValue = Number.isFinite(currentPrice) ? String(currentPrice) : '';
  const input = window.prompt(`Por qual valor deseja listar ${title}?`, defaultValue);
  if (input === null) {
    return;
  }
  const normalized = input.replace(/\s+/g, '').replace(',', '.');
  const priceValue = parseFloat(normalized);
  if (!Number.isFinite(priceValue) || priceValue <= 0) {
    setUserNftFeedback(section, 'Informe um preço válido para anunciar a NFT.', true);
    return;
  }
  btn.disabled = true;
  setUserNftFeedback(section, 'Enviando anúncio de venda...', false);
  try {
    const res = await fetch(API('orders.php'), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        side: 'sell',
        asset_instance_id: instanceId,
        qty: 1,
        price: priceValue
      })
    });
    if (res.status === 401) {
      needLogin();
      return;
    }
    const data = await res.json().catch(() => ({}));
    if (res.ok && data && data.ok) {
      await loadUserNfts(section, { enableListing: true });
      setUserNftFeedback(section, `NFT anunciada por ${formatBRL(priceValue)}.`, false);
    } else {
      const detail = data && (data.detail || data.error);
      let message = detail || 'Não foi possível anunciar a NFT.';
      if (detail === 'not_owner_of_nft') {
        message = 'Você precisa ser o proprietário desta NFT para colocá-la à venda.';
      } else if (detail === 'insufficient_nft_qty') {
        message = 'Quantidade indisponível para esta NFT.';
      }
      setUserNftFeedback(section, message, true);
    }
  } catch (err) {
    setUserNftFeedback(section, 'Falha inesperada ao anunciar a NFT.', true);
  } finally {
    btn.disabled = false;
  }
}

async function viewAdmin(){
  const view = document.getElementById('view');
  view.innerHTML = `<h1>Painel Administrativo</h1><p>Carregando informações...</p>`;

  const [data, liquidityData] = await Promise.all([
    getJSON(API('admin_users.php')),
    getJSON(API('users.php'))
  ]);
  if (data.__auth === false || liquidityData.__auth === false) return needLogin();
  if (data.__forbidden || liquidityData.__forbidden) {
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

  const liquidityPlayers = Array.isArray(liquidityData && liquidityData.users) ? liquidityData.users : [];
  const rosterSection = renderLiquidityPlayerRosterSection(liquidityPlayers, {
    isAdmin: true,
    emptyMessage: '<p class="hint">Nenhum jogador cadastrado para o jogo no momento.</p>'
  });
  let specialAssetsSection = '';
  if (currentSession.is_special_liquidity_user) {
    await syncSpecialAssetsFromServer(true);
    specialAssetsSection = renderSpecialLiquidityAssetsPanel();
  }

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
      ${rosterSection}
      ${specialAssetsSection}
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

  if (specialAssetsSection) {
    attachSpecialAssetsListeners();
  }
}

function renderMintedNftList(container, items){
  if (!container) return;
  if (!Array.isArray(items) || items.length === 0) {
    container.innerHTML = '<p class="hint">Nenhuma NFT cadastrada até o momento.</p>';
    return;
  }

  container.innerHTML = items.map(item => {
    const imagePath = item.image_url || '';
    const imageUrl = esc(imagePath || NFT_IMAGE_PLACEHOLDER);
    const title = esc(item.title || 'NFT sem título');
    const owner = esc(item.owner_name || 'Usuário removido');
    const ownerEmail = item.owner_email ? ` <small>${esc(item.owner_email)}</small>` : '';
    const desc = item.description ? `<p class="minted-desc">${esc(item.description)}</p>` : '';
    const mintedAt = formatDateTime(item.created_at) || '';
    const tokenTag = item.instance_id ? `#${item.instance_id}` : '#-';
    const workId = Number(item.work_id) || '';
    const actions = workId
      ? `<div class="minted-actions">
          <button type="button" class="minted-edit-btn" data-action="edit-minted" data-work-id="${workId}" data-title="${title}" data-description="${esc(item.description || '')}" data-image="${esc(imagePath)}">Editar NFT</button>
          <button type="button" class="minted-delete-btn" data-action="delete-minted" data-work-id="${workId}" data-title="${title}">Excluir NFT</button>
        </div>`
      : '';
    return `
      <article class="minted-card">
        <div class="minted-thumb">
          <img src="${imageUrl}" alt="${title}" loading="lazy" />
        </div>
        <div class="minted-info">
          <header>
            <h3>${title}</h3>
            <span>${tokenTag}</span>
          </header>
          <p class="minted-owner"><strong>Proprietário:</strong> ${owner}${ownerEmail}</p>
          ${desc}
          <p class="minted-meta">${mintedAt ? `Registrado em ${mintedAt}` : ''}</p>
          ${actions}
        </div>
      </article>
    `;
  }).join('');
}

async function viewAdminMint(){
  const view = document.getElementById('view');
  if (!currentSession.is_admin) {
    view.innerHTML = `<h1>Acesso restrito</h1><p>Somente administradores podem criar NFTs.</p>`;
    return;
  }

  view.innerHTML = `<h1>Mint de NFT</h1><p>Carregando informações...</p>`;

  const [usersData, mintedData] = await Promise.all([
    getJSON(API('admin_users.php')),
    getJSON(API('admin_minted_nfts.php'))
  ]);

  if (usersData.__auth === false || mintedData.__auth === false) return needLogin();
  if (usersData.__forbidden || mintedData.__forbidden) {
    view.innerHTML = `<h1>Acesso restrito</h1><p>Somente administradores podem criar NFTs.</p>`;
    return;
  }

  const users = Array.isArray(usersData) ? usersData : [];
  const minted = Array.isArray(mintedData) ? mintedData : [];

  const selectDisabled = users.length === 0 ? 'disabled' : '';
  const userOptions = users.length
    ? ['<option value="">Selecione um usuário</option>', ...users.map(u => {
        const label = esc(u.name || u.email || `Usuário #${u.id}`);
        return `<option value="${u.id}">${label}</option>`;
      })].join('')
    : '<option value="" disabled selected>Nenhum usuário disponível</option>';

  const mintedCountText = minted.length === 1 ? '1 item' : `${minted.length} itens`;

  view.innerHTML = `
    <section class="mint-nft">
      <div class="card mint-nft-form">
        <h1>Criação (mint) de NFT</h1>
        <p class="hint">Envie uma imagem e associe a NFT a um usuário específico.</p>
        <form id="mintNftForm" enctype="multipart/form-data">
          <label>Usuário proprietário</label>
          <select name="user_id" required ${selectDisabled}>${userOptions}</select>
          <label>Título da obra</label>
          <input type="text" name="title" placeholder="Ex: Aurora Digital" required ${selectDisabled} />
          <label>Descrição</label>
          <textarea name="description" rows="3" placeholder="Detalhes da obra" ${selectDisabled}></textarea>
          <label>Imagem (PNG, JPG, GIF ou WEBP)</label>
          <input type="file" name="image" accept="image/*" required ${selectDisabled} />
          <p class="hint">A imagem será enviada e armazenada no servidor no momento do mint.</p>
          <button type="submit" ${selectDisabled}>Criar NFT</button>
          ${users.length === 0 ? '<p class="hint err">Cadastre um usuário para habilitar o mint.</p>' : ''}
          <p class="msg" id="mintNftMsg"></p>
        </form>
      </div>
      <section class="mint-nft-list">
        <div class="mint-nft-list-header">
          <h2>NFTs cadastradas</h2>
          <span data-role="minted-count">${mintedCountText}</span>
        </div>
        <div data-role="minted-list" class="minted-grid"></div>
      </section>
    </section>
  `;

  const mintedContainer = view.querySelector('[data-role="minted-list"]');
  renderMintedNftList(mintedContainer, minted);
  const countEl = view.querySelector('[data-role="minted-count"]');

  const refreshMintedList = async () => {
    if (!mintedContainer) return;
    mintedContainer.innerHTML = '<p class="hint">Atualizando NFTs...</p>';
    const latest = await getJSON(API('admin_minted_nfts.php'));
    if (latest.__auth === false) return needLogin();
    if (latest.__forbidden) {
      mintedContainer.innerHTML = '<p class="hint err">Acesso restrito.</p>';
      return;
    }
    const list = Array.isArray(latest) ? latest : [];
    if (countEl) countEl.textContent = list.length === 1 ? '1 item' : `${list.length} itens`;
    renderMintedNftList(mintedContainer, list);
  };

  const createMintedEditModal = () => {
    const existingModal = document.querySelector('.minted-edit-modal');
    if (existingModal) {
      existingModal.remove();
    }
    const overlay = document.createElement('div');
    overlay.className = 'minted-edit-modal';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = `
      <div class="minted-edit-panel" role="dialog" aria-modal="true">
        <button type="button" class="minted-edit-close" data-action="close-edit">&times;</button>
        <h2>Editar NFT</h2>
        <p class="hint">Atualize título, descrição ou substitua a imagem (opcional).</p>
        <figure class="minted-edit-preview">
          <img src="${NFT_IMAGE_PLACEHOLDER}" alt="Pré-visualização da NFT" data-role="minted-edit-preview" />
        </figure>
        <form data-role="minted-edit-form">
          <label>Título</label>
          <input type="text" name="title" required maxlength="160" />
          <label>Descrição</label>
          <textarea name="description" rows="3" placeholder="Detalhes da obra"></textarea>
          <label>Nova imagem (opcional)</label>
          <input type="file" name="image" accept="image/*" />
          <p class="hint">Formatos suportados: JPG, PNG, GIF ou WEBP (até 5 MB).</p>
          <button type="submit">Salvar alterações</button>
          <p class="msg" data-role="minted-edit-msg"></p>
        </form>
      </div>
    `;

    document.body.appendChild(overlay);
    const form = overlay.querySelector('[data-role="minted-edit-form"]');
    const msgEl = overlay.querySelector('[data-role="minted-edit-msg"]');
    const previewImg = overlay.querySelector('[data-role="minted-edit-preview"]');
    const titleInput = form.querySelector('[name="title"]');
    const descInput = form.querySelector('[name="description"]');
    const imageInput = form.querySelector('[name="image"]');
    let currentPreview = NFT_IMAGE_PLACEHOLDER;
    let latestObjectUrl = null;

    const closeModal = () => {
      overlay.classList.remove('visible');
      overlay.setAttribute('aria-hidden', 'true');
      form.reset();
      form.dataset.workId = '';
      msgEl.textContent = '';
      msgEl.classList.remove('err');
      if (latestObjectUrl) {
        URL.revokeObjectURL(latestObjectUrl);
        latestObjectUrl = null;
      }
      previewImg.src = NFT_IMAGE_PLACEHOLDER;
      currentPreview = NFT_IMAGE_PLACEHOLDER;
    };

    overlay.addEventListener('click', (evt) => {
      if (evt.target === overlay) {
        closeModal();
      }
    });

    overlay.querySelector('[data-action="close-edit"]').addEventListener('click', (evt) => {
      evt.preventDefault();
      closeModal();
    });

    imageInput.addEventListener('change', () => {
      if (latestObjectUrl) {
        URL.revokeObjectURL(latestObjectUrl);
        latestObjectUrl = null;
      }
      const file = imageInput.files && imageInput.files[0];
      if (file) {
        const url = URL.createObjectURL(file);
        latestObjectUrl = url;
        previewImg.src = url;
      } else {
        previewImg.src = currentPreview;
      }
    });

    form.addEventListener('submit', async (evt) => {
      evt.preventDefault();
      msgEl.textContent = '';
      msgEl.classList.remove('err');
      const workId = Number(form.dataset.workId);
      if (!workId) {
        msgEl.textContent = 'NFT inválida.';
        msgEl.classList.add('err');
        return;
      }
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Salvando...';
      const formData = new FormData(form);
      formData.append('work_id', workId);
      try {
        const res = await fetch(API('admin_update_nft.php'), {
          method: 'POST',
          credentials: 'include',
          body: formData
        });
        if (res.status === 401) {
          closeModal();
          return needLogin();
        }
        if (res.status === 403) {
          closeModal();
          view.innerHTML = `<h1>Acesso restrito</h1><p>Somente administradores podem criar NFTs.</p>`;
          return;
        }
        const data = await res.json().catch(() => ({}));
        if (res.ok && data && data.ok) {
          msgEl.textContent = 'NFT atualizada com sucesso.';
          if (data.image_url) {
            currentPreview = data.image_url;
            previewImg.src = data.image_url;
          }
          await refreshMintedList();
          setTimeout(() => {
            closeModal();
          }, 700);
        } else {
          msgEl.textContent = data.detail || data.error || 'Falha ao atualizar NFT.';
          msgEl.classList.add('err');
        }
      } catch (error) {
        console.error(error);
        msgEl.textContent = 'Erro inesperado ao atualizar NFT.';
        msgEl.classList.add('err');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        imageInput.value = '';
      }
    });

    return {
      open(data) {
        overlay.classList.add('visible');
        overlay.removeAttribute('aria-hidden');
        form.dataset.workId = data.workId || '';
        titleInput.value = data.title || '';
        descInput.value = data.description || '';
        currentPreview = data.image || NFT_IMAGE_PLACEHOLDER;
        previewImg.src = currentPreview;
        msgEl.textContent = '';
        msgEl.classList.remove('err');
        imageInput.value = '';
        if (latestObjectUrl) {
          URL.revokeObjectURL(latestObjectUrl);
          latestObjectUrl = null;
        }
      },
      close: closeModal
    };
  };

  const getMintedEditModal = (() => {
    let modal;
    return () => {
      if (!modal) {
        modal = createMintedEditModal();
      }
      return modal;
    };
  })();

  if (mintedContainer) {
    mintedContainer.addEventListener('click', async (evt) => {
      const editBtn = evt.target.closest('[data-action="edit-minted"]');
      if (editBtn) {
        evt.preventDefault();
        const modal = getMintedEditModal();
        modal.open({
          workId: Number(editBtn.getAttribute('data-work-id')),
          title: editBtn.getAttribute('data-title') || '',
          description: editBtn.getAttribute('data-description') || '',
          image: editBtn.getAttribute('data-image') || NFT_IMAGE_PLACEHOLDER
        });
        return;
      }
      const btn = evt.target.closest('[data-action="delete-minted"]');
      if (!btn) return;
      const workId = Number(btn.getAttribute('data-work-id'));
      if (!workId) return;
      const nftTitle = btn.getAttribute('data-title') || 'esta NFT';
      if (!confirm(`Tem certeza de que deseja excluir ${nftTitle}? Esta ação não pode ser desfeita.`)) return;
      const originalText = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Excluindo...';
      try {
        const res = await fetch(API('admin_delete_minted_nft.php'), {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ work_id: workId })
        });
        if (res.status === 401) return needLogin();
        if (res.status === 403) {
          view.innerHTML = `<h1>Acesso restrito</h1><p>Somente administradores podem criar NFTs.</p>`;
          return;
        }
        const data = await res.json().catch(() => ({}));
        if (res.ok && data && data.ok) {
          alert('NFT excluída com sucesso.');
          await refreshMintedList();
        } else {
          alert('Erro ao excluir NFT: ' + (data.detail || data.error || res.statusText));
        }
      } catch (err) {
        alert('Erro inesperado ao excluir a NFT.');
      } finally {
        btn.disabled = false;
        btn.textContent = originalText;
      }
    });
  }

  const form = document.getElementById('mintNftForm');
  if (form && users.length > 0) {
    const msgEl = document.getElementById('mintNftMsg');
    const submitBtn = form.querySelector('button[type="submit"]');
    form.addEventListener('submit', async (evt) => {
      evt.preventDefault();
      if (msgEl) {
        msgEl.textContent = '';
        msgEl.classList.remove('err');
      }
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando...';
      }
      try {
        const formData = new FormData(form);
        const res = await fetch(API('admin_mint_nft.php'), {
          method: 'POST',
          credentials: 'include',
          body: formData
        });
        const data = await res.json().catch(() => ({}));
        if (res.status === 401) return needLogin();
        if (res.status === 403) {
          view.innerHTML = `<h1>Acesso restrito</h1><p>Somente administradores podem criar NFTs.</p>`;
          return;
        }
        if (res.ok && data && data.ok) {
          form.reset();
          if (msgEl) {
            msgEl.textContent = 'NFT criada com sucesso.';
            msgEl.classList.remove('err');
          }
          await refreshMintedList();
        } else {
          if (msgEl) {
            msgEl.textContent = 'Erro: ' + (data.detail || data.error || res.statusText);
            msgEl.classList.add('err');
          }
        }
      } catch (err) {
        if (msgEl) {
          msgEl.textContent = 'Erro inesperado ao enviar o formulário.';
          msgEl.classList.add('err');
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Criar NFT';
        }
      }
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

function buildCollectionCard(collection, index){
  const featured = collection.items.find(item => item.id === collection.featuredItem) || collection.items[0];
  return `
    <article class="collection-card" data-collection="${collection.id}">
      <div class="collection-card-rank">#${index + 1}</div>
      <img src="${esc(collection.coverImage)}" alt="${esc(collection.name)}" class="collection-card-cover" loading="lazy"/>
      <div class="collection-card-body">
        <div class="collection-card-title">
          <h3>${esc(collection.name)}</h3>
          <span>${esc(collection.category)}</span>
        </div>
        <dl class="collection-card-stats">
          <div>
            <dt>Piso</dt>
            <dd>${formatNumber(collection.floorEth, 2)} ETH</dd>
          </div>
          <div>
            <dt>Volume</dt>
            <dd>${formatNumber(collection.volumeEth, 0)} ETH</dd>
          </div>
          <div>
            <dt>24h</dt>
            <dd class="${String(collection.change24h).startsWith('-') ? 'neg' : 'pos'}">${esc(collection.change24h)}</dd>
          </div>
        </dl>
        <div class="collection-card-highlight">
          <img src="${esc(featured.image)}" alt="${esc(featured.name)}" loading="lazy"/>
          <div>
            <span>${esc(featured.name)}</span>
            <strong>${formatNumber(featured.priceEth, 2)} ETH</strong>
          </div>
        </div>
      </div>
    </article>
  `;
}

function renderCollectionItems(container, collection){
  if (!container) return;
  container.innerHTML = collection.items.map(item => `
    <button class="collection-item-card" data-collection="${collection.id}" data-item="${item.id}">
      <img src="${esc(item.image)}" alt="${esc(item.name)}" loading="lazy"/>
      <div class="collection-item-info">
        <strong>${esc(item.name)}</strong>
        <span>${formatNumber(item.priceEth, 2)} ETH</span>
        <small>${esc(item.availability)}</small>
      </div>
    </button>
  `).join('');
}

function openCollectionItemModal(collectionId, itemId){
  const collection = MARKET_COLLECTIONS.find(col => col.id === collectionId);
  if (!collection) return;
  const item = collection.items.find(it => it.id === itemId);
  const modal = document.querySelector('[data-role="item-modal"]');
  if (!item || !modal) return;
  modal.innerHTML = `
    <div class="item-modal-backdrop" data-action="close"></div>
    <article class="item-modal-card">
      <header>
        <div>
          <span>${esc(collection.name)}</span>
          <h2>${esc(item.name)}</h2>
        </div>
        <button class="ghost" data-action="close">Fechar</button>
      </header>
      <div class="item-modal-body">
        <img src="${esc(item.image)}" alt="${esc(item.name)}" loading="lazy"/>
        <div class="item-modal-details">
          <dl>
            <div>
              <dt>Preço atual</dt>
              <dd>${formatNumber(item.priceEth, 2)} ETH</dd>
            </div>
            <div>
              <dt>Última venda</dt>
              <dd>${item.lastSaleEth ? `${formatNumber(item.lastSaleEth, 2)} ETH` : '—'}</dd>
            </div>
            <div>
              <dt>Disponibilidade</dt>
              <dd>${esc(item.availability)}</dd>
            </div>
            <div>
              <dt>Proprietário</dt>
              <dd>${esc(item.owner)}</dd>
            </div>
          </dl>
          <div class="item-modal-traits">
            <h3>Atributos</h3>
            <div>${item.traits.map(trait => `<span>${esc(trait)}</span>`).join('')}</div>
          </div>
          <button>Fazer oferta</button>
        </div>
      </div>
    </article>
  `;
  modal.removeAttribute('hidden');
  modal.classList.add('visible');
  modal.querySelectorAll('[data-action="close"]').forEach(btn => {
    btn.addEventListener('click', () => closeCollectionModal(modal), { once:true });
  });
}

function closeCollectionModal(modal){
  modal = modal || document.querySelector('[data-role="item-modal"]');
  if (!modal) return;
  modal.setAttribute('hidden', 'hidden');
  modal.classList.remove('visible');
}

function findMintedItem(workId){
  const parsedId = Number(workId);
  if (!Number.isFinite(parsedId)) return null;
  for (const collection of mintedCollectionsCache) {
    if (!collection || !Array.isArray(collection.items)) continue;
    const item = collection.items.find(it => Number(it.work_id) === parsedId);
    if (item) {
      return { item, collection };
    }
  }
  return null;
}

function openMintedItemModal(workId){
  const match = findMintedItem(workId);
  if (!match) return;
  const { item, collection } = match;
  const modal = document.querySelector('[data-role="item-modal"]');
  if (!modal) return;
  const placeholder = 'https://via.placeholder.com/320x320.png?text=NFT';
  const title = esc(item.title || 'NFT sem título');
  const owner = esc(collection.owner_display || collection.owner_name || collection.owner_email || 'Sem proprietário definido');
  const ownerEmail = collection.owner_email ? `<small>${esc(collection.owner_email)}</small>` : '';
  const mintedAt = formatDateTime(item.created_at) || 'Data não informada';
  const tokenId = item.instance_id ? `#${item.instance_id}` : '#—';
  const description = item.description ? esc(item.description) : 'Nenhuma descrição foi informada para esta NFT.';
  const imageUrl = esc(item.image_url || placeholder);
  modal.innerHTML = `
    <div class="item-modal-backdrop" data-action="close"></div>
    <article class="item-modal-card minted-detail">
      <header>
        <div>
          <span>${owner}</span>
          <h2>${title}</h2>
          ${ownerEmail}
        </div>
        <button class="ghost" data-action="close">Fechar</button>
      </header>
      <div class="item-modal-body">
        <img src="${imageUrl}" alt="${title}" loading="lazy"/>
        <div class="item-modal-details">
          <dl>
            <div>
              <dt>Token</dt>
              <dd>${tokenId}</dd>
            </div>
            <div>
              <dt>Registrado em</dt>
              <dd>${mintedAt}</dd>
            </div>
            <div>
              <dt>ID interno</dt>
              <dd>${item.work_id || '—'}</dd>
            </div>
          </dl>
          <div class="item-modal-description">
            <h3>Descrição</h3>
            <p>${description}</p>
          </div>
        </div>
      </div>
    </article>
  `;
  modal.removeAttribute('hidden');
  modal.classList.add('visible');
  modal.querySelectorAll('[data-action="close"]').forEach(btn => {
    btn.addEventListener('click', () => closeCollectionModal(modal), { once:true });
  });
}

function renderCollectionDetail(section, collection){
  if (!section) return;
  if (!collection){
    section.innerHTML = '<p class="hint">Selecione uma coleção para ver os detalhes.</p>';
    return;
  }
  section.innerHTML = `
    <article class="collection-hero">
      <div>
        <p>${esc(collection.category)}</p>
        <h2>${esc(collection.name)}</h2>
        <p class="collection-description">${esc(collection.description)}</p>
        <dl class="collection-hero-stats">
          <div>
            <dt>Itens</dt>
            <dd>${collection.totalItems.toLocaleString('pt-BR')}</dd>
          </div>
          <div>
            <dt>Proprietários</dt>
            <dd>${collection.owners.toLocaleString('pt-BR')}</dd>
          </div>
          <div>
            <dt>Piso</dt>
            <dd>${formatNumber(collection.floorEth, 2)} ETH</dd>
          </div>
          <div>
            <dt>Volume</dt>
            <dd>${formatNumber(collection.volumeEth, 0)} ETH</dd>
          </div>
        </dl>
      </div>
      <img src="${esc(collection.coverImage)}" alt="${esc(collection.name)}" loading="lazy"/>
    </article>
    <section class="collection-items-panel">
      <div class="panel-header">
        <h3>Itens da coleção</h3>
        <span>${collection.items.length} listados</span>
      </div>
      <div class="collection-items" data-role="collection-items"></div>
    </section>
  `;
  const itemsContainer = section.querySelector('[data-role="collection-items"]');
  renderCollectionItems(itemsContainer, collection);
  section.querySelectorAll('.collection-item-card').forEach(card => {
    card.addEventListener('click', ()=>{
      openCollectionItemModal(card.dataset.collection, card.dataset.item);
    });
  });
}

function renderMintedCollectionsGrid(section, payload){
  if (!section) return;
  const grid = section.querySelector('[data-role="minted-grid"]');
  const ownersEl = section.querySelector('[data-role="minted-owners"]');
  const itemsEl = section.querySelector('[data-role="minted-items"]');
  if (!grid) return;

  const payloadIsObject = payload && typeof payload === 'object';
  const collections = Array.isArray(payload)
    ? payload
    : (payloadIsObject && Array.isArray(payload.collections) ? payload.collections : []);
  mintedCollectionsCache = collections;
  const totalItems = payloadIsObject && typeof payload.total_items === 'number'
    ? payload.total_items
    : collections.reduce((acc, col) => acc + ((col.items && col.items.length) || 0), 0);

  if (ownersEl) {
    ownersEl.textContent = collections.length === 1
      ? '1 coleção'
      : `${collections.length} coleções`;
  }
  if (itemsEl) {
    itemsEl.textContent = totalItems === 1
      ? '1 NFT'
      : `${totalItems} NFTs`;
  }

  if (collections.length === 0) {
    grid.innerHTML = '<p class="hint">Nenhuma NFT foi mintada até o momento.</p>';
    return;
  }

  const placeholder = 'https://via.placeholder.com/140x140.png?text=NFT';
  grid.innerHTML = collections.map(collection => {
    const ownerDisplay = esc(collection.owner_display
      || collection.owner_name
      || collection.owner_email
      || 'Coleção sem proprietário');
    const ownerEmail = collection.owner_email
      ? `<small>${esc(collection.owner_email)}</small>`
      : '';
    const items = Array.isArray(collection.items) ? collection.items : [];
    const itemsHtml = items.map(item => {
      const imageUrl = esc(item.image_url || placeholder);
      const title = esc(item.title || 'NFT sem título');
      const desc = item.description
        ? `<p>${esc(truncateText(item.description, 110))}</p>`
        : '<p class="muted">Sem descrição</p>';
      const mintedText = formatDateTime(item.created_at) || '';
      return `
        <div class="minted-collection-item" data-work-id="${item.work_id || ''}">
          <img src="${imageUrl}" alt="${title}" loading="lazy" />
          <div>
            <strong>${title}</strong>
            ${desc}
            <small>${mintedText ? `Mintado em ${mintedText}` : 'Data não informada'}</small>
          </div>
        </div>
      `;
    }).join('');

    const countLabel = items.length === 1 ? '1 NFT' : `${items.length} NFTs`;
    return `
      <article class="minted-collection-card">
        <header>
          <div>
            <p>${ownerDisplay}</p>
            ${ownerEmail}
          </div>
          <span>${countLabel}</span>
        </header>
        <div class="minted-collection-items">${itemsHtml}</div>
      </article>
    `;
  }).join('');
}

async function loadMintedCollections(section){
  if (!section) return;
  const grid = section.querySelector('[data-role="minted-grid"]');
  if (grid) grid.innerHTML = '<p class="hint">Carregando NFTs do mint...</p>';
  try {
    const data = await getJSON(API('minted_collections.php'));
    if (data.__auth === false) {
      if (grid) grid.innerHTML = '<p class="hint err">Faça login para visualizar as NFTs mintadas.</p>';
      return;
    }
    if (data.error) {
      if (grid) grid.innerHTML = `<p class="hint err">${esc(data.detail || 'Erro ao carregar NFTs mintadas.')}</p>`;
      return;
    }
    renderMintedCollectionsGrid(section, data);
  } catch (err) {
    if (grid) grid.innerHTML = '<p class="hint err">Não foi possível carregar as NFTs mintadas.</p>';
  }
}

function renderMarketplaceListings(section, listings){
  if (!section) return;
  const grid = section.querySelector('[data-role="marketplace-grid"]');
  if (!grid) return;
  if (!Array.isArray(listings) || listings.length === 0) {
    grid.innerHTML = '<p class="hint">Nenhuma NFT foi anunciada para venda ainda.</p>';
    return;
  }
  grid.innerHTML = listings.map((item) => {
    const title = item.title || `NFT #${item.work_id || item.instance_id || '—'}`;
    const seller = item.seller_name || item.seller_email || (item.seller_id ? `Usuário #${item.seller_id}` : 'Usuário desconhecido');
    const description = item.description
      ? `<p>${esc(truncateText(item.description, 110))}</p>`
      : '<p class="muted">Sem descrição</p>';
    const imageUrl = item.image_url || NFT_IMAGE_PLACEHOLDER;
    const priceNumber = Number(item.price);
    const priceLabel = Number.isFinite(priceNumber) ? formatBRL(priceNumber) : '—';
    const disabledAttr = Number.isFinite(priceNumber) ? '' : ' disabled';
    return `
      <article class="marketplace-card">
        <div class="marketplace-card-thumb">
          <img src="${esc(imageUrl)}" alt="${esc(title)}" loading="lazy" />
        </div>
        <div class="marketplace-card-body">
          <div>
            <p class="marketplace-card-seller">${esc(seller)}</p>
            <h3>${esc(title)}</h3>
            ${description}
          </div>
          <div class="marketplace-card-actions">
            <div>
              <span>Preço</span>
              <strong>${esc(priceLabel)}</strong>
            </div>
            <button type="button" class="marketplace-buy-btn" data-action="buy-nft" data-instance-id="${esc(item.instance_id || '')}"
              data-price="${Number.isFinite(priceNumber) ? esc(String(priceNumber)) : ''}"
              data-title="${esc(title)}"${disabledAttr}>Comprar</button>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

async function loadMarketplaceListings(section){
  if (!section) return;
  const grid = section.querySelector('[data-role="marketplace-grid"]');
  const messageEl = section.querySelector('[data-role="marketplace-message"]');
  if (messageEl) {
    messageEl.hidden = true;
    messageEl.textContent = '';
    messageEl.classList.remove('err');
  }
  if (grid) {
    grid.innerHTML = '<p class="hint">Carregando NFTs à venda...</p>';
  }
  let data;
  try {
    data = await getJSON(API('nft_listings.php'));
  } catch (err) {
    if (grid) grid.innerHTML = '<p class="hint err">Não foi possível carregar as NFTs à venda.</p>';
    return;
  }
  if (data.__auth === false) {
    if (grid) grid.innerHTML = '<p class="hint err">Faça login para visualizar as NFTs à venda.</p>';
    return;
  }
  if (data.error) {
    if (grid) {
      grid.innerHTML = `<p class="hint err">${esc(data.detail || 'Erro ao carregar as NFTs à venda.')}</p>`;
    }
    return;
  }
  const listings = Array.isArray(data.listings) ? data.listings : [];
  renderMarketplaceListings(section, listings);
}

async function handleMarketplaceAction(event, section){
  const btn = event.target.closest('[data-action="buy-nft"]');
  if (!btn) return;
  event.preventDefault();
  const instanceId = parseInt(btn.dataset.instanceId, 10);
  const priceValue = parseFloat(btn.dataset.price);
  const title = btn.dataset.title || 'NFT';
  if (!Number.isFinite(instanceId) || !Number.isFinite(priceValue)) {
    const messageEl = section.querySelector('[data-role="marketplace-message"]');
    if (messageEl) {
      messageEl.hidden = false;
      messageEl.textContent = 'Não foi possível identificar esta NFT para compra.';
      messageEl.classList.add('err');
    }
    return;
  }
  if (!window.confirm(`Confirmar compra de ${title} por ${formatBRL(priceValue)}?`)) {
    return;
  }
  const messageEl = section.querySelector('[data-role="marketplace-message"]');
  if (messageEl) {
    messageEl.hidden = false;
    messageEl.textContent = 'Processando compra...';
    messageEl.classList.remove('err');
  }
  btn.disabled = true;
  try {
    const res = await fetch(API('orders.php'), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        side: 'buy',
        asset_instance_id: instanceId,
        qty: 1,
        price: priceValue,
        immediate_or_cancel: true
      })
    });
    if (res.status === 401) {
      needLogin();
      return;
    }
    const data = await res.json().catch(() => ({}));
    if (res.ok && data && data.ok) {
      if (messageEl) {
        messageEl.hidden = false;
        messageEl.textContent = 'Compra realizada com sucesso!';
        messageEl.classList.remove('err');
      }
      await loadMarketplaceListings(section);
    } else {
      const detail = data && (data.detail || data.error);
      let message = detail || 'Não foi possível concluir a compra.';
      if (detail === 'not_filled') {
        message = 'A NFT não está mais disponível.';
      }
      if (messageEl) {
        messageEl.hidden = false;
        messageEl.textContent = message;
        messageEl.classList.add('err');
      }
    }
  } catch (err) {
    if (messageEl) {
      messageEl.hidden = false;
      messageEl.textContent = 'Falha inesperada ao processar a compra.';
      messageEl.classList.add('err');
    }
  } finally {
    btn.disabled = false;
  }
}

function viewEvents(){
  const view = document.getElementById('view');
  if (!view) return;
  const formatEventDateTime = (value) => {
    const formatted = formatDateTime(value);
    return formatted || 'Data a confirmar';
  };
  const cards = Array.isArray(PLATFORM_EVENTS) && PLATFORM_EVENTS.length
    ? PLATFORM_EVENTS.map((event) => {
        const dateLabel = formatEventDateTime(event.date);
        const tags = Array.isArray(event.tags) && event.tags.length
          ? `<ul class="event-card__tags">${event.tags.map((tag) => `<li>${esc(tag)}</li>`).join('')}</ul>`
          : '';
        const cta = event.registrationUrl
          ? `<a class="event-card__cta" href="${esc(event.registrationUrl)}" target="_blank" rel="noreferrer">${esc(event.registrationLabel || 'Inscrever-se')}</a>`
          : '<span class="event-card__cta event-card__cta--disabled">Agenda privada</span>';
        return `
          <article class="event-card" data-event="${esc(event.id)}">
            <header class="event-card__header">
              <span class="event-card__badge">${esc(event.type || 'Evento')}</span>
              <time datetime="${esc(event.date || '')}">${esc(dateLabel)}</time>
            </header>
            <h3>${esc(event.title)}</h3>
            <p>${esc(event.highlight || 'Atualização estratégica da plataforma.')}</p>
            <ul class="event-card__meta">
              <li><span>Local</span><strong>${esc(event.location || 'A definir')}</strong></li>
              <li><span>Status</span><strong>${esc(event.status || 'Em breve')}</strong></li>
              <li><span>Vagas</span><strong>${esc(event.seats || 'Sob consulta')}</strong></li>
            </ul>
            ${tags}
            <div class="event-card__footer">
              <div>
                <small>Contato</small>
                <strong>${esc(event.contact || 'eventos@ergasterio.com')}</strong>
              </div>
              ${cta}
            </div>
          </article>
        `;
      }).join('')
    : '<p class="hint">Nenhum evento cadastrado até o momento.</p>';
  const upcoming = Array.isArray(PLATFORM_EVENTS) && PLATFORM_EVENTS.length ? PLATFORM_EVENTS[0] : null;
  const upcomingLabel = upcoming ? formatEventDateTime(upcoming.date) : 'Agenda em atualização';
  view.innerHTML = `
    <section class="events-view">
      <header class="events-header">
        <div>
          <p>Agenda oficial</p>
          <h1>Eventos e ativações da plataforma</h1>
          <span>Sincronizados com o time de operações e atualizados nesta semana.</span>
        </div>
        <div class="events-highlight">
          <strong>${esc(upcomingLabel)}</strong>
          <span>Próximo encontro</span>
        </div>
      </header>
      <div class="events-grid">${cards}</div>
    </section>
  `;
}

function viewCollections(){
  const view = document.getElementById('view');
  const firstCollection = MARKET_COLLECTIONS[0];
  view.innerHTML = `
    <section class="collections-view">
      <header class="collections-header">
        <div>
          <p>Marketplace</p>
          <h1>Descubra coleções em destaque</h1>
          <span>Estilo inspirado no OpenSea, com cards interativos e dados em tempo real.</span>
        </div>
        <button class="ghost">Explorar tudo</button>
      </header>
      <section class="marketplace-listings" data-role="marketplace-listings">
        <div class="marketplace-header">
          <div>
            <p>Negociações diretas</p>
            <h2>NFTs à venda pelos usuários</h2>
            <span>Listagens publicadas pelos proprietários na aba Meus Ativos.</span>
          </div>
          <button class="ghost" data-role="refresh-marketplace">Atualizar</button>
        </div>
        <p class="hint marketplace-message" data-role="marketplace-message" hidden></p>
        <div class="marketplace-grid" data-role="marketplace-grid">
          <p class="hint">Carregando NFTs à venda...</p>
        </div>
      </section>
      <section class="minted-collections" data-role="minted-collections">
        <div class="minted-collections-header">
          <div>
            <p>Mint interno</p>
            <h2>NFTs criadas na plataforma</h2>
            <span>Organizadas automaticamente pelas NFTs do módulo de mint.</span>
          </div>
          <div class="minted-collections-metrics">
            <strong data-role="minted-owners">0 coleções</strong>
            <strong data-role="minted-items">0 NFTs</strong>
          </div>
        </div>
        <div class="minted-collections-grid" data-role="minted-grid">
          <p class="hint">Carregando NFTs do mint...</p>
        </div>
      </section>
      <div class="collections-grid" data-role="collections-grid"></div>
      <section class="collection-detail" data-role="collection-detail"></section>
      <div class="item-modal" data-role="item-modal" hidden></div>
    </section>
  `;
  const grid = view.querySelector('[data-role="collections-grid"]');
  grid.innerHTML = MARKET_COLLECTIONS.map((collection, index)=>buildCollectionCard(collection, index)).join('');
  const detailSection = view.querySelector('[data-role="collection-detail"]');
  renderCollectionDetail(detailSection, firstCollection);
  const marketplaceSection = view.querySelector('[data-role="marketplace-listings"]');
  loadMarketplaceListings(marketplaceSection);
  const mintedSection = view.querySelector('[data-role="minted-collections"]');
  loadMintedCollections(mintedSection);
  if (mintedSection) {
    mintedSection.addEventListener('click', (evt) => {
      const item = evt.target.closest('.minted-collection-item');
      if (!item) return;
      const workId = item.getAttribute('data-work-id');
      if (workId) {
        openMintedItemModal(workId);
      }
    });
  }
  if (marketplaceSection) {
    marketplaceSection.addEventListener('click', (evt) => handleMarketplaceAction(evt, marketplaceSection));
    const refreshBtn = marketplaceSection.querySelector('[data-role="refresh-marketplace"]');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', (evt) => {
        evt.preventDefault();
        loadMarketplaceListings(marketplaceSection);
      });
    }
  }
  grid.querySelectorAll('.collection-card').forEach(card => {
    card.addEventListener('click', ()=>{
      const collection = MARKET_COLLECTIONS.find(col => col.id === card.dataset.collection);
      renderCollectionDetail(detailSection, collection);
      grid.querySelectorAll('.collection-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
    });
  });
  const firstCard = grid.querySelector('.collection-card');
  if (firstCard) firstCard.classList.add('active');
  if (collectionsEscHandler){
    document.removeEventListener('keydown', collectionsEscHandler);
  }
  collectionsEscHandler = (evt)=>{
    if (evt.key === 'Escape'){
      closeCollectionModal();
    }
  };
  document.addEventListener('keydown', collectionsEscHandler);
}

/* ========= Leilões ========= */
const AUCTION_STATUS_LABELS = {
  draft: 'Agendado',
  running: 'Leilão ativo',
  ended: 'Encerrado',
  settled: 'Liquidado'
};

let auctionHandlersBound = false;
let auctionTickerState = { items: [], serverOffsetMs: 0 };
let auctionTickerInterval = null;
let auctionTickerContainer = null;

function ensureAuctionHandlers(){
  if (auctionHandlersBound) return;
  const viewEl = document.getElementById('view');
  if (!viewEl) return;
  viewEl.addEventListener('submit', handleAuctionSubmit);
  viewEl.addEventListener('click', handleAuctionClick);
  auctionHandlersBound = true;
}

function stopAuctionTicker(){
  if (auctionTickerInterval) {
    clearInterval(auctionTickerInterval);
    auctionTickerInterval = null;
  }
  auctionTickerContainer = null;
  auctionTickerState = { items: [], serverOffsetMs: 0 };
}

function getServerSyncedNow(){
  return Date.now() + (auctionTickerState.serverOffsetMs || 0);
}

function formatAuctionDuration(ms){
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (val) => String(val).padStart(2, '0');
  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

function getAuctionCountdownState(auction, nowMs = getServerSyncedNow()){
  const start = auction && auction.starts_at ? new Date(auction.starts_at).getTime() : null;
  const end = auction && auction.ends_at ? new Date(auction.ends_at).getTime() : null;
  if (!Number.isFinite(end)) {
    return { text: 'Sem data', label: 'Em configuração', phase: 'unknown' };
  }
  if (auction.status === 'draft' && Number.isFinite(start) && nowMs < start) {
    return {
      text: formatAuctionDuration(start - nowMs),
      label: 'Aguardando início',
      phase: 'waiting'
    };
  }
  const diff = end - nowMs;
  if (diff <= 0 || auction.status === 'ended') {
    return { text: '00:00', label: 'Dou-lhe três! Encerrado', phase: 'ended' };
  }
  const seconds = Math.floor(diff / 1000);
  if (seconds <= 5) {
    return { text: formatAuctionDuration(diff), label: 'Dou-lhe três!', phase: 'tres' };
  }
  if (seconds <= 15) {
    return { text: formatAuctionDuration(diff), label: 'Dou-lhe duas', phase: 'duas' };
  }
  if (seconds <= 30) {
    return { text: formatAuctionDuration(diff), label: 'Dou-lhe uma', phase: 'uma' };
  }
  return { text: formatAuctionDuration(diff), label: 'Em disputa', phase: 'running' };
}

function startAuctionTicker(container){
  if (!container || !auctionTickerState.items.length) {
    stopAuctionTicker();
    return;
  }
  auctionTickerContainer = container;
  updateAuctionCountdowns();
  auctionTickerInterval = setInterval(updateAuctionCountdowns, 1000);
}

function updateAuctionCountdowns(){
  if (!auctionTickerContainer) return;
  const now = getServerSyncedNow();
  auctionTickerState.items.forEach(auction => {
    const state = getAuctionCountdownState(auction, now);
    const timeEl = auctionTickerContainer.querySelector(`[data-countdown="${auction.id}"]`);
    if (timeEl) timeEl.textContent = state.text;
    const phaseEl = auctionTickerContainer.querySelector(`[data-phase="${auction.id}"]`);
    if (phaseEl) {
      phaseEl.textContent = state.label;
      phaseEl.dataset.state = state.phase;
    }
  });
}

function buildAuctionCard(auction, nowMs){
  const imageUrl = esc(auction.image_url || NFT_IMAGE_PLACEHOLDER);
  const title = esc(auction.title || `NFT #${auction.id}`);
  const desc = auction.description
    ? `<p>${esc(truncateText(auction.description, 180))}</p>`
    : '<p class="hint">Sem descrição.</p>';
  const seller = esc(auction.seller_name || 'Admin');
  const statusLabel = AUCTION_STATUS_LABELS[auction.status] || auction.status;
  const countdown = getAuctionCountdownState(auction, nowMs);
  const reserve = Number(auction.reserve_price || 0);
  const reserveText = formatBRL(reserve);
  const highest = Number(auction.highest_bid || 0);
  const highestText = highest > 0 ? formatBRL(highest) : 'Sem lances';
  const bidsCount = Number(auction.bids_count || 0);
  const reserveReached = highest > 0 && highest >= reserve;
  const nextBid = Number(auction.next_minimum_bid || 0);
  const nextBidText = nextBid > 0 ? formatBRL(nextBid) : reserveText;
  const running = auction.status === 'running';
  const minValue = nextBid > 0 ? nextBid : 0.01;
  const bidForm = running && currentSession.logged
    ? `
      <form class="auction-bid-form" data-role="bid-form" data-auction-id="${auction.id}">
        <label>
          Lance (R$)
          <input type="number" name="amount" step="0.01" min="${minValue.toFixed(2)}" placeholder="Mínimo ${nextBidText}" required />
        </label>
        <button type="submit">Dar lance</button>
        <p class="msg auction-msg" data-role="bid-msg"></p>
      </form>
    `
    : running
      ? `
        <div class="auction-login-cta">
          <p>Faça login ou cadastre-se para disputar este lote.</p>
          <div class="auction-login-actions">
            <button type="button" class="ghost" data-role="focus-login">Entrar</button>
            <button type="button" data-role="focus-register">Criar conta</button>
          </div>
        </div>
      `
      : '<p class="auction-closed">Lances indisponíveis para este leilão.</p>';

  return `
    <article class="auction-card" data-auction="${auction.id}">
      <div class="auction-media">
        <span class="auction-badge">${statusLabel}</span>
        <img src="${imageUrl}" alt="${title}" loading="lazy" />
      </div>
      <div class="auction-body">
        <header class="auction-header">
          <div>
            <p class="auction-collection">Lote #${auction.id}</p>
            <h3>${title}</h3>
          </div>
          <div class="auction-countdown">
            <span class="auction-phase" data-phase="${auction.id}">${countdown.label}</span>
            <strong data-countdown="${auction.id}">${countdown.text}</strong>
          </div>
        </header>
        ${desc}
        <dl class="auction-meta">
          <div><dt>Lance atual</dt><dd>${highestText}</dd></div>
          <div><dt>Próximo mínimo</dt><dd>${running ? nextBidText : '-'}</dd></div>
          <div><dt>Lances</dt><dd>${bidsCount}</dd></div>
        </dl>
        <div class="auction-seller-line">
          <span class="auction-seller">Vendedor: ${seller}</span>
          <span class="auction-reserve ${reserveReached ? 'ok' : ''}">${reserveReached ? 'Reserva atingida' : `Reserva: ${reserveText}`}</span>
        </div>
      </div>
      <div class="auction-actions">
        ${bidForm}
      </div>
    </article>
  `;
}

function renderAuctionsList(container, auctions){
  if (!container) return;
  if (!Array.isArray(auctions) || auctions.length === 0) {
    container.innerHTML = '<p class="hint">Nenhum leilão disponível no momento.</p>';
    stopAuctionTicker();
    return;
  }
  const nowMs = getServerSyncedNow();
  container.innerHTML = auctions.map(auction => buildAuctionCard(auction, nowMs)).join('');
  startAuctionTicker(container);
}

async function loadAuctionsSection(view){
  const list = view.querySelector('[data-role="auction-list"]');
  if (!list) return;
  list.innerHTML = '<p class="hint">Carregando leilões...</p>';
  const data = await getJSON(API('auctions.php'));
  if (data.__auth === false) {
    list.innerHTML = '<p class="hint">Os leilões podem ser visualizados sem login, tente novamente em instantes.</p>';
    return;
  }
  if (data.__forbidden) {
    list.innerHTML = '<p class="hint err">Acesso restrito.</p>';
    return;
  }
  const auctions = Array.isArray(data.auctions) ? data.auctions : (Array.isArray(data) ? data : []);
  const serverTime = data.server_time ? Date.parse(data.server_time) : Date.now();
  auctionTickerState = {
    items: auctions,
    serverOffsetMs: Number.isFinite(serverTime) ? serverTime - Date.now() : 0
  };
  renderAuctionsList(list, auctions);
  if (currentSession.is_admin) {
    updateAuctionAdminOverview(view);
  }
}

async function submitBidForm(form){
  const auctionId = parseInt(form.getAttribute('data-auction-id'), 10);
  if (!Number.isFinite(auctionId)) return;
  const amountInput = form.querySelector('input[name="amount"]');
  const button = form.querySelector('button[type="submit"]');
  const msg = form.querySelector('[data-role="bid-msg"]');
  if (msg) {
    msg.textContent = '';
    msg.classList.remove('err');
  }
  if (!amountInput) return;
  const amount = Number(amountInput.value);
  if (!Number.isFinite(amount) || amount <= 0) {
    if (msg) {
      msg.textContent = 'Informe um valor válido.';
      msg.classList.add('err');
    }
    return;
  }
  if (button) button.disabled = true;
  try {
    const res = await fetch(API('bid.php'), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ auction_id: auctionId, amount })
    });
    const rawPayload = await res.json().catch(()=>({}));
    const payload = (rawPayload && typeof rawPayload === 'object') ? rawPayload : {};
    if (res.status === 401 || payload.__auth === false || payload.error === 'not_authenticated') {
      needLogin();
      return;
    }
    if (res.ok && payload.ok) {
      if (msg) {
        msg.textContent = 'Lance registrado com sucesso!';
        msg.classList.remove('err');
      }
      amountInput.value = '';
      await loadAuctionsSection(document.getElementById('view'));
    } else {
      const code = typeof payload.error === 'string' ? payload.error : 'unknown_error';
      let text = 'Não foi possível registrar o lance.';
      if (code === 'amount_too_low') text = 'Lance abaixo do mínimo permitido para este lote.';
      else if (code === 'auction_not_running' || code === 'auction_closed') text = 'Leilão não está mais ativo.';
      else if (code === 'auction_not_found') text = 'Leilão não encontrado.';
      else if (code === 'auction_not_started') text = 'Leilão ainda não começou.';
      else if (code === 'amount_invalid') text = 'Informe um valor de lance válido.';
      else if (code === 'missing_accounts') text = 'Sua conta não possui as carteiras necessárias para dar lances.';
      else if (code === 'cannot_register_bid' && typeof payload.detail === 'string' && payload.detail.trim() !== '') {
        text = `Falha ao registrar o lance: ${payload.detail}`;
      } else if (!res.ok && payload.detail) {
        text = String(payload.detail);
      }
      if (msg) {
        msg.textContent = text;
        msg.classList.add('err');
      }
    }
  } catch (err) {
    if (msg) {
      msg.textContent = 'Falha ao enviar o lance. Tente novamente.';
      msg.classList.add('err');
    }
  } finally {
    if (button) button.disabled = false;
  }
}

async function handleAuctionSubmit(event){
  const form = event.target.closest('[data-role="bid-form"]');
  if (form) {
    event.preventDefault();
    await submitBidForm(form);
    return;
  }
  const createForm = event.target.closest('[data-role="auction-create-form"]');
  if (createForm) {
    event.preventDefault();
    await submitAuctionCreateForm(createForm);
  }
}

async function handleAuctionClick(event){
  const focusLoginBtn = event.target.closest('[data-role="focus-login"]');
  if (focusLoginBtn) {
    event.preventDefault();
    document.getElementById('appMenu')?.scrollIntoView({ behavior: 'smooth' });
    const emailField = document.getElementById('email');
    if (emailField) emailField.focus();
    return;
  }
  const focusRegisterBtn = event.target.closest('[data-role="focus-register"]');
  if (focusRegisterBtn) {
    event.preventDefault();
    const toggle = document.getElementById('toggleRegister');
    const registerForm = document.getElementById('registerForm');
    if (registerForm && registerForm.style.display === 'none' && toggle) {
      toggle.click();
    }
    document.getElementById('appMenu')?.scrollIntoView({ behavior: 'smooth' });
    const nameField = document.getElementById('r_name');
    if (nameField) nameField.focus();
    return;
  }
  const refreshBtn = event.target.closest('[data-role="auction-refresh"]');
  if (refreshBtn) {
    event.preventDefault();
    refreshBtn.disabled = true;
    await loadAuctionsSection(document.getElementById('view'));
    refreshBtn.disabled = false;
    return;
  }
  const finalizeBtn = event.target.closest('[data-action="finalize-auction"]');
  if (finalizeBtn) {
    event.preventDefault();
    const auctionId = parseInt(finalizeBtn.getAttribute('data-auction-id'), 10);
    if (Number.isFinite(auctionId) && window.confirm('Encerrar este leilão agora?')) {
      finalizeBtn.disabled = true;
      await performAuctionAdminAction('finalize', auctionId);
      finalizeBtn.disabled = false;
    }
    return;
  }
  const startBtn = event.target.closest('[data-action="start-auction"]');
  if (startBtn) {
    event.preventDefault();
    const auctionId = parseInt(startBtn.getAttribute('data-auction-id'), 10);
    if (Number.isFinite(auctionId) && window.confirm('Iniciar o leilão agora?')) {
      startBtn.disabled = true;
      await performAuctionAdminAction('start', auctionId);
      startBtn.disabled = false;
    }
  }
}

async function performAuctionAdminAction(action, auctionId){
  const msg = document.querySelector('[data-role="auction-admin-msg"]');
  if (msg) {
    msg.textContent = '';
    msg.classList.remove('err');
  }
  try {
    const res = await fetch(API('auctions.php'), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, auction_id: auctionId })
    });
    const rawPayload = await res.json().catch(()=>({}));
    const payload = (rawPayload && typeof rawPayload === 'object') ? rawPayload : {};
    if (res.status === 401 || payload.__auth === false || payload.error === 'not_authenticated') {
      needLogin();
      return;
    }
    if (!res.ok || payload.error) {
      if (msg) {
        const errText = typeof payload.error === 'string'
          ? `Não foi possível atualizar o leilão (${payload.error}).`
          : 'Não foi possível atualizar o leilão.';
        msg.textContent = payload.detail ? `${errText} ${payload.detail}` : errText;
        msg.classList.add('err');
      }
      return;
    }
    if (msg) {
      msg.textContent = action === 'finalize' ? 'Leilão encerrado.' : 'Leilão iniciado.';
      msg.classList.remove('err');
    }
    await loadAuctionsSection(document.getElementById('view'));
  } catch (err) {
    if (msg) {
      msg.textContent = 'Falha ao comunicar com o servidor.';
      msg.classList.add('err');
    }
  }
}

function formatLocalDateTimeValue(date){
  const pad = (val) => String(val).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fillAuctionScheduleDefaults(form){
  if (!form) return;
  const startInput = form.querySelector('[name="starts_at"]');
  const endInput = form.querySelector('[name="ends_at"]');
  const now = new Date();
  const start = new Date(now.getTime() + 5 * 60 * 1000);
  const end = new Date(now.getTime() + 35 * 60 * 1000);
  if (startInput) startInput.value = formatLocalDateTimeValue(start);
  if (endInput) endInput.value = formatLocalDateTimeValue(end);
}

async function loadAuctionAdminPanel(view){
  const panel = view.querySelector('[data-role="auction-admin-panel"]');
  if (!panel) return;
  panel.innerHTML = '<div class="card"><p class="hint">Carregando painel administrativo...</p></div>';
  const [usersData, mintedData] = await Promise.all([
    getJSON(API('admin_users.php')),
    getJSON(API('admin_minted_nfts.php'))
  ]);
  if (usersData.__auth === false || mintedData.__auth === false) {
    needLogin();
    return;
  }
  if (usersData.__forbidden || mintedData.__forbidden) {
    panel.innerHTML = '<p class="hint err">Apenas administradores podem configurar os leilões.</p>';
    return;
  }
  const users = (Array.isArray(usersData) ? usersData : []).filter(u => Number(u.confirmed) === 1);
  const minted = Array.isArray(mintedData) ? mintedData : [];
  const disableForm = users.length === 0 || minted.length === 0;
  const userOptions = users.length
    ? users.map(user => {
        const label = esc(user.name || user.email || `Usuário #${user.id}`);
        return `<option value="${user.id}">${label}</option>`;
      }).join('')
    : '<option value="" disabled>Nenhum usuário confirmado</option>';
  const nftOptions = minted.length
    ? minted.map(item => {
        const label = esc(item.title || `NFT #${item.instance_id}`);
        const owner = esc(item.owner_name || item.owner_email || 'Sem proprietário');
        return `<option value="${item.instance_id}">${label} • ${owner}</option>`;
      }).join('')
    : '<option value="" disabled>Nenhuma NFT disponível</option>';

  panel.innerHTML = `
    <section class="auction-admin card">
      <h2>Painel administrativo</h2>
      <p class="hint">Cadastre a NFT, defina a janela de lances e acompanhe os lotes ativos.</p>
      <form class="auction-create-form" data-role="auction-create-form">
        <label>NFT disponível
          <select name="asset_instance_id" ${disableForm ? 'disabled' : ''} required>
            ${nftOptions}
          </select>
        </label>
        <label>Vendedor
          <select name="seller_id" ${disableForm ? 'disabled' : ''} required>
            ${userOptions}
          </select>
        </label>
        <label>Início do leilão
          <input type="datetime-local" name="starts_at" ${disableForm ? 'disabled' : ''} required />
        </label>
        <label>Encerramento
          <input type="datetime-local" name="ends_at" ${disableForm ? 'disabled' : ''} required />
        </label>
        <label>Reserva (R$)
          <input type="number" step="0.01" min="0" name="reserve_price" ${disableForm ? 'disabled' : ''} value="0" />
        </label>
        <button type="submit" ${disableForm ? 'disabled' : ''}>Criar leilão</button>
        ${disableForm ? '<p class="hint err">Cadastre usuários confirmados e NFTs para habilitar o formulário.</p>' : ''}
        <p class="msg" data-role="auction-admin-msg"></p>
      </form>
      <div class="auction-admin-overview" data-role="auction-admin-overview"></div>
    </section>
  `;
  fillAuctionScheduleDefaults(panel.querySelector('[data-role="auction-create-form"]'));
  updateAuctionAdminOverview(view);
}

function updateAuctionAdminOverview(view){
  const container = view.querySelector('[data-role="auction-admin-overview"]');
  if (!container) return;
  const auctions = Array.isArray(auctionTickerState.items) ? auctionTickerState.items : [];
  if (auctions.length === 0) {
    container.innerHTML = '<p class="hint">Nenhum leilão configurado até o momento.</p>';
    return;
  }
  const rows = buildAuctionAdminTableRows(auctions);
  container.innerHTML = `
    <div class="auction-admin-table-wrapper">
      <h3>Leilões cadastrados</h3>
      <table class="tbl auction-admin-table">
        <thead>
          <tr><th>Lote</th><th>Status</th><th>Início</th><th>Término</th><th>Lance atual</th><th>Ações</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function buildAuctionAdminTableRows(auctions){
  return auctions.map(auction => {
    const statusLabel = AUCTION_STATUS_LABELS[auction.status] || auction.status;
    const startText = auction.starts_at ? formatDateTime(auction.starts_at) : '-';
    const endText = auction.ends_at ? formatDateTime(auction.ends_at) : '-';
    const bidText = Number(auction.highest_bid || 0) > 0 ? formatBRL(auction.highest_bid) : 'Sem lances';
    let actions = '<span class="hint">Sem ações</span>';
    if (auction.status === 'draft') {
      actions = `<button type="button" data-action="start-auction" data-auction-id="${auction.id}">Iniciar</button>`;
    } else if (auction.status === 'running') {
      actions = `<button type="button" data-action="finalize-auction" data-auction-id="${auction.id}">Encerrar</button>`;
    }
    const title = esc(auction.title || `NFT #${auction.id}`);
    return `<tr>
      <td>${title}</td>
      <td>${statusLabel}</td>
      <td>${startText}</td>
      <td>${endText}</td>
      <td>${bidText}</td>
      <td>${actions}</td>
    </tr>`;
  }).join('');
}

async function submitAuctionCreateForm(form){
  const msg = form.querySelector('[data-role="auction-admin-msg"]');
  if (msg) {
    msg.textContent = '';
    msg.classList.remove('err');
  }
  const nftField = form.elements.namedItem('asset_instance_id');
  const sellerField = form.elements.namedItem('seller_id');
  const startField = form.elements.namedItem('starts_at');
  const endField = form.elements.namedItem('ends_at');
  const reserveField = form.elements.namedItem('reserve_price');
  const payload = {
    action: 'create',
    asset_instance_id: nftField ? parseInt(nftField.value, 10) : null,
    seller_id: sellerField ? parseInt(sellerField.value, 10) : null,
    starts_at: startField && startField.value ? new Date(startField.value).toISOString() : null,
    ends_at: endField && endField.value ? new Date(endField.value).toISOString() : null,
    reserve_price: reserveField && reserveField.value ? Number(reserveField.value) : 0
  };
  if (!payload.asset_instance_id || !payload.seller_id || !payload.starts_at || !payload.ends_at) {
    if (msg) {
      msg.textContent = 'Preencha todos os campos para criar o leilão.';
      msg.classList.add('err');
    }
    return;
  }
  try {
    const res = await fetch(API('auctions.php'), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(()=>({}));
    if (!res.ok || data.error) {
      if (msg) {
        msg.textContent = 'Não foi possível criar o leilão.';
        msg.classList.add('err');
      }
      return;
    }
    if (msg) {
      msg.textContent = 'Leilão criado com sucesso!';
      msg.classList.remove('err');
    }
    form.reset();
    fillAuctionScheduleDefaults(form);
    await loadAuctionsSection(document.getElementById('view'));
  } catch (err) {
    if (msg) {
      msg.textContent = 'Erro inesperado ao criar o leilão.';
      msg.classList.add('err');
    }
  }
}

async function viewAuctions(){
  const view = document.getElementById('view');
  if (!view) return;
  stopAuctionTicker();
  ensureAuctionHandlers();
  view.className = 'auctions-view';
  const adminPanel = currentSession.is_admin
    ? '<section class="auction-admin-wrapper" data-role="auction-admin-panel"><div class="card"><p class="hint">Carregando painel administrativo...</p></div></section>'
    : '<p class="hint auctions-admin-note">Toda a configuração é realizada pelos administradores. Usuários cadastrados podem dar lances.</p>';
  view.innerHTML = `
    <section class="auctions-shell">
      <header class="auctions-hero">
        <div class="auction-hero-copy">
          <p>Experiência em tempo real</p>
          <h1>Leilões de NFT</h1>
          <span>Explore todos os lotes livremente, no estilo OpenSea. Para dar um lance, conecte-se.</span>
          <div class="auction-hero-actions">
            <button type="button" data-role="auction-refresh">Atualizar leilões</button>
            <button type="button" class="ghost" data-role="focus-login">Entrar para dar lance</button>
          </div>
          <div class="auction-hero-stats">
            <div>
              <small>Acesso</small>
              <strong>Visualização sem login</strong>
            </div>
            <div>
              <small>Lances</small>
              <strong>Exigem cadastro</strong>
            </div>
            <div>
              <small>Layout</small>
              <strong>Inspired by OpenSea</strong>
            </div>
          </div>
        </div>
        <div class="auction-hero-gallery" aria-hidden="true">
          <div class="auction-hero-card"></div>
          <div class="auction-hero-card"></div>
          <div class="auction-hero-card"></div>
        </div>
      </header>
      <div class="auction-grid-header">
        <div>
          <p>Catálogo ao vivo</p>
          <h2>Veja tudo sem login</h2>
          <span>Cadastre-se ou faça login somente quando estiver pronto para dar um lance.</span>
        </div>
        <div class="auction-grid-chips">
          <span class="chip">Visível para todos</span>
          <span class="chip chip-warning">Login exigido para lances</span>
        </div>
      </div>
      <div class="auction-list" data-role="auction-list">
        <p class="hint">Carregando leilões...</p>
      </div>
      ${adminPanel}
    </section>
  `;
  await loadAuctionsSection(view);
  if (currentSession.is_admin) {
    await loadAuctionAdminPanel(view);
  }
}

/* ========= Menu ========= */
const VIEW_HANDLERS = {
  home: viewHome,
  saldo: viewSaldo,
  bitcoin: viewBitcoin,
  nft: viewNFT,
  mercado_nft: viewMercadoNFT,
  mercado_btc: viewMercadoBTC,
  live_market: viewLiveMarket,
  trades: viewTrades,
  user_assets: viewUserAssets,
  pending_transactions: viewPendingTransactions,
  liquidity_game: viewLiquidityGame,
  collections: viewCollections,
  auctions: viewAuctions,
  events: viewEvents,
  admin: viewAdmin,
  admin_mint: viewAdminMint,
};

function setActiveMenuItem(viewName){
  const menuLinks = document.querySelectorAll('.menu a[data-view]');
  menuLinks.forEach(link=>{
    const isActive = link.dataset.view === viewName;
    link.classList.toggle('is-active', isActive);
    if (isActive) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}

function updateViewQueryParam(viewName){
  try {
    const url = new URL(window.location.href);
    if (viewName && viewName !== 'home') {
      url.searchParams.set('view', viewName);
    } else {
      url.searchParams.delete('view');
    }
    const nextUrl = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState({}, '', nextUrl);
  } catch (err) {
    console.warn('Não foi possível atualizar a URL do módulo.', err);
  }
}

function navigateToView(viewName, options = {}){
  if (!viewName) return false;
  stopAuctionTicker();
  const handler = VIEW_HANDLERS[viewName];
  if (typeof handler !== 'function') return false;
  handler();
  requestAnimationFrame(()=>{
    initCardTilt(document.getElementById('view'));
  });
  setActiveMenuItem(viewName);
  if (options.updateUrl) {
    updateViewQueryParam(viewName);
  }
  return true;
}

function initMenu(){
  document.addEventListener('click', (event)=>{
    const trigger = event.target.closest('[data-view]');
    if (!trigger) return;
    const viewName = trigger.dataset.view;
    if (!viewName) return;
    if (trigger.tagName === 'A' || trigger.tagName === 'BUTTON') {
      event.preventDefault();
    }
    navigateToView(viewName, { updateUrl: true });
  });
}

function initResponsiveMenu(){
  const toggleBtn = document.getElementById('menuToggle');
  const menuLinks = document.querySelectorAll('.menu [data-view]');
  if (!toggleBtn) return;

  const mobileQuery = window.matchMedia('(max-width: 960px)');

  const setExpanded = (expanded)=>{
    toggleBtn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  };

  const closeMenu = ()=>{
    document.body.classList.remove('menu-open');
    setExpanded(false);
  };

  toggleBtn.addEventListener('click', ()=>{
    const isOpen = document.body.classList.toggle('menu-open');
    setExpanded(isOpen);
  });

  const handleViewportChange = (event)=>{
    if (!event.matches) {
      closeMenu();
    }
  };

  if (typeof mobileQuery.addEventListener === 'function'){
    mobileQuery.addEventListener('change', handleViewportChange);
  } else if (typeof mobileQuery.addListener === 'function') {
    mobileQuery.addListener(handleViewportChange);
  }

  const closeMenuOnNavigate = ()=>{
    if (mobileQuery.matches) {
      closeMenu();
    }
  };

  menuLinks.forEach(link=>{
    link.addEventListener('click', closeMenuOnNavigate);
  });

  setExpanded(false);
}

function initDeepLink(){
  try {
    const url = new URL(window.location.href);
    const viewParam = url.searchParams.get('view');
    if (viewParam) {
      navigateToView(viewParam);
    }
  } catch (err) {
    console.warn('Não foi possível carregar o view a partir da URL.', err);
  }
}

const INTERACTIVE_CARD_SELECTORS = ['.panel-card', '.hero-module'];

function attachTiltHandlers(card){
  if (!card || card.dataset.tiltReady === 'true') return;
  card.dataset.tiltReady = 'true';
  let frameId = null;
  const maxRotate = 9;

  const updateTilt = (event)=>{
    if (!card.isConnected) return;
    const rect = card.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const relativeX = clamp((event.clientX - rect.left) / rect.width - 0.5, -0.6, 0.6);
    const relativeY = clamp((event.clientY - rect.top) / rect.height - 0.5, -0.6, 0.6);
    if (frameId) cancelAnimationFrame(frameId);
    frameId = requestAnimationFrame(()=>{
      card.style.setProperty('--card-rotate-y', `${relativeX * maxRotate}deg`);
      card.style.setProperty('--card-rotate-x', `${relativeY * -maxRotate}deg`);
    });
  };

  const resetTilt = ()=>{
    if (frameId) cancelAnimationFrame(frameId);
    frameId = null;
    card.style.setProperty('--card-rotate-y', '0deg');
    card.style.setProperty('--card-rotate-x', '0deg');
  };

  card.addEventListener('pointermove', updateTilt);
  card.addEventListener('pointerleave', resetTilt);
  card.addEventListener('pointercancel', resetTilt);
  card.addEventListener('pointerup', resetTilt);
}

function initCardTilt(root=document){
  if (!root) return;
  const selector = INTERACTIVE_CARD_SELECTORS.join(',');
  if (!selector) return;
  root.querySelectorAll(selector).forEach(attachTiltHandlers);
}

function initAmbientParallax(){
  const root = document.documentElement;
  if (!root) return;
  let rafId = null;
  const updateCursor = (event)=>{
    const { clientX, clientY } = event;
    const { innerWidth, innerHeight } = window;
    if (!innerWidth || !innerHeight) return;
    const ratioX = clamp(clientX / innerWidth, 0, 1);
    const ratioY = clamp(clientY / innerHeight, 0, 1);
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(()=>{
      root.style.setProperty('--cursor-x', ratioX.toFixed(4));
      root.style.setProperty('--cursor-y', ratioY.toFixed(4));
    });
  };
  document.addEventListener('pointermove', updateCursor);
}

/* ========= Init ========= */
const defaultViewName = document.getElementById('view')?.dataset.defaultView || 'home';
navigateToView(defaultViewName, { updateUrl: false });
initAuth();
initMenu();
initDeepLink();
initResponsiveMenu();
initAmbientParallax();
