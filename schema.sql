-- ====== CORE ======
CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) UNIQUE,
  phone VARCHAR(40) DEFAULT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  confirmed TINYINT DEFAULT 0,
  is_admin TINYINT DEFAULT 0
);

CREATE TABLE assets (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  type ENUM('bitcoin','nft','share','frame','chassis','gallery_space') NOT NULL,
  symbol VARCHAR(64),                -- p/ BTC: 'BTC'; p/ cotas: código; opcional p/ NFT
  parent_asset_id BIGINT NULL,       -- cota de obra/galeria aponta p/ asset pai
  metadata_json JSON NULL,
  INDEX(parent_asset_id),
  FOREIGN KEY (parent_asset_id) REFERENCES assets(id)
);

CREATE TABLE asset_instances (       -- instâncias únicas: um NFT, um chassis específico etc.
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  asset_id BIGINT NOT NULL,
  chain VARCHAR(32),                 -- 'bitcoin','eth','polygon'...
  contract_addr VARCHAR(128),
  token_id VARCHAR(128),
  serial VARCHAR(64),
  metadata_json JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX(asset_id),
  FOREIGN KEY (asset_id) REFERENCES assets(id)
);

-- Contas do razão
CREATE TABLE accounts (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  owner_type ENUM('user','org') DEFAULT 'user',
  owner_id BIGINT NOT NULL,
  currency VARCHAR(16) NOT NULL,     -- 'BRL','USD','BTC'...
  purpose ENUM('cash','bitcoin_wallet','nft_inventory','fees','revenue','escrow') NOT NULL,
  UNIQUE KEY uniq_owner_cur_purpose(owner_type, owner_id, currency, purpose),
  INDEX(owner_type, owner_id)
);

CREATE TABLE journals (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  occurred_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ref_type ENUM('deposit','withdraw','trade','prize','lease','mint','buy','sell','fee','market_purchase','bid') NOT NULL,
  ref_id BIGINT NULL,
  memo VARCHAR(255)
);

CREATE TABLE entries (               -- dupla entrada (débito/crédito)
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  journal_id BIGINT NOT NULL,
  account_id BIGINT NOT NULL,
  debit DECIMAL(24,8) NOT NULL DEFAULT 0,
  credit DECIMAL(24,8) NOT NULL DEFAULT 0,
  FOREIGN KEY (journal_id) REFERENCES journals(id) ON DELETE CASCADE,
  FOREIGN KEY (account_id) REFERENCES accounts(id),
  INDEX(journal_id),
  INDEX(account_id)
);

-- Movimentações de ativos (qtds)
CREATE TABLE asset_moves (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  journal_id BIGINT NOT NULL,
  asset_id BIGINT NULL,                 -- para cotas/ativos fungíveis
  asset_instance_id BIGINT NULL,        -- para NFTs/itens únicos
  qty DECIMAL(24,8) NOT NULL DEFAULT 0, -- p/ NFT usar 1.0
  from_account_id BIGINT NULL,
  to_account_id BIGINT NULL,
  FOREIGN KEY (journal_id) REFERENCES journals(id) ON DELETE CASCADE,
  FOREIGN KEY (asset_id) REFERENCES assets(id),
  FOREIGN KEY (asset_instance_id) REFERENCES asset_instances(id),
  FOREIGN KEY (from_account_id) REFERENCES accounts(id),
  FOREIGN KEY (to_account_id) REFERENCES accounts(id),
  INDEX(asset_id),
  INDEX(asset_instance_id)
);

-- Posições derivadas (atualizadas por trigger p/ consultas rápidas)
CREATE TABLE positions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  owner_type ENUM('user','org') DEFAULT 'user',
  owner_id BIGINT NOT NULL,
  asset_id BIGINT NOT NULL,
  qty DECIMAL(24,8) NOT NULL DEFAULT 0,
  UNIQUE KEY uniq_pos(owner_type, owner_id, asset_id),
  INDEX(owner_type, owner_id),
  FOREIGN KEY (asset_id) REFERENCES assets(id)
);

CREATE TABLE liquidity_game_states (
  user_id BIGINT PRIMARY KEY,
  state_json JSON NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE special_liquidity_assets (
  user_id BIGINT PRIMARY KEY,
  bitcoin DECIMAL(24,8) NOT NULL DEFAULT 0,
  nft INT NOT NULL DEFAULT 0,
  brl DECIMAL(24,2) NOT NULL DEFAULT 0,
  quotas DECIMAL(24,8) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE parent_tab_visibility (
  user_id BIGINT PRIMARY KEY,
  allowed_tabs JSON NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

DELIMITER $$
CREATE TRIGGER trg_positions_upsert
AFTER INSERT ON asset_moves
FOR EACH ROW
BEGIN
  IF NEW.to_account_id IS NOT NULL THEN
    INSERT INTO positions (owner_type, owner_id, asset_id, qty)
    SELECT a.owner_type, a.owner_id, COALESCE(NEW.asset_id,
           (SELECT asset_id FROM asset_instances WHERE id=NEW.asset_instance_id)), NEW.qty
    FROM accounts a WHERE a.id = NEW.to_account_id
    ON DUPLICATE KEY UPDATE qty = qty + NEW.qty;
  END IF;

  IF NEW.from_account_id IS NOT NULL THEN
    INSERT INTO positions (owner_type, owner_id, asset_id, qty)
    SELECT a.owner_type, a.owner_id, COALESCE(NEW.asset_id,
           (SELECT asset_id FROM asset_instances WHERE id=NEW.asset_instance_id)), -NEW.qty
    FROM accounts a WHERE a.id = NEW.from_account_id
    ON DUPLICATE KEY UPDATE qty = qty - NEW.qty;
  END IF;
END$$
DELIMITER ;

-- ====== MERCADO (leilões / trades) ======
CREATE TABLE orders (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  side ENUM('buy','sell') NOT NULL,
  asset_id BIGINT NULL,
  asset_instance_id BIGINT NULL,
  qty DECIMAL(24,8) NOT NULL,
  price DECIMAL(24,8) NOT NULL,
  status ENUM('open','filled','cancelled') DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE trades (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  buy_order_id BIGINT,
  sell_order_id BIGINT,
  qty DECIMAL(24,8) NOT NULL,
  price DECIMAL(24,8) NOT NULL,
  journal_id BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE auctions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  seller_id BIGINT NOT NULL,
  asset_id BIGINT NULL,
  asset_instance_id BIGINT NULL,
  starts_at DATETIME NOT NULL,
  ends_at DATETIME NOT NULL,
  reserve_price DECIMAL(24,8) DEFAULT 0,
  status ENUM('draft','running','ended','settled') DEFAULT 'draft',
  FOREIGN KEY (seller_id) REFERENCES users(id)
);

CREATE TABLE bids (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  auction_id BIGINT NOT NULL,
  bidder_id BIGINT NOT NULL,
  amount DECIMAL(24,8) NOT NULL,
  status ENUM('valid','outbid','winner','cancelled') DEFAULT 'valid',
  journal_id BIGINT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (auction_id) REFERENCES auctions(id),
  FOREIGN KEY (bidder_id) REFERENCES users(id)
);

-- ====== PRODUÇÃO ======
CREATE TABLE works (                   -- Obras
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  asset_instance_id BIGINT NOT NULL,
  title VARCHAR(160) NOT NULL,
  artist_id BIGINT NOT NULL,
  specs_json JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (asset_instance_id) REFERENCES asset_instances(id),
  FOREIGN KEY (artist_id) REFERENCES users(id)
);

CREATE TABLE chassis (                 -- Chassis "carta em branco"
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  asset_instance_id BIGINT NOT NULL,
  size VARCHAR(64),
  material VARCHAR(64),
  status ENUM('blank','used') DEFAULT 'blank',
  FOREIGN KEY (asset_instance_id) REFERENCES asset_instances(id)
);

CREATE TABLE frames (                  -- Molduras
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  asset_instance_id BIGINT NOT NULL,
  size VARCHAR(64),
  material VARCHAR(64),
  status ENUM('free','used') DEFAULT 'free',
  FOREIGN KEY (asset_instance_id) REFERENCES asset_instances(id)
);

CREATE TABLE galleries (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(160) NOT NULL,
  address VARCHAR(200),
  owner_id BIGINT NOT NULL,
  FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE TABLE gallery_spaces (          -- espaços de exposição
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  asset_instance_id BIGINT NOT NULL,
  gallery_id BIGINT NOT NULL,
  label VARCHAR(64),
  size VARCHAR(64),
  status ENUM('free','occupied') DEFAULT 'free',
  FOREIGN KEY (asset_instance_id) REFERENCES asset_instances(id),
  FOREIGN KEY (gallery_id) REFERENCES galleries(id)
);

-- ====== PRÊMIOS / ESCOLAS (simples) ======
CREATE TABLE prizes (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  rules_json JSON NULL
);

CREATE TABLE prize_grants (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  prize_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  amount DECIMAL(24,8) DEFAULT 0,
  journal_id BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE schools (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(160) NOT NULL,
  city VARCHAR(120),
  metadata_json JSON NULL
);