-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Tempo de geração: 08/11/2025 às 19:37
-- Versão do servidor: 8.0.37
-- Versão do PHP: 8.1.33

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `oftalmol_arte`
--

-- --------------------------------------------------------

--
-- Estrutura para tabela `accounts`
--

CREATE TABLE `accounts` (
  `id` bigint NOT NULL,
  `owner_type` enum('user','org') DEFAULT 'user',
  `owner_id` bigint NOT NULL,
  `currency` varchar(16) NOT NULL,
  `purpose` enum('cash','bitcoin_wallet','nft_inventory','fees','revenue','escrow') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Despejando dados para a tabela `accounts`
--

INSERT INTO `accounts` (`id`, `owner_type`, `owner_id`, `currency`, `purpose`) VALUES
(1, 'user', 1, 'BRL', 'cash'),
(2, 'user', 1, 'BRL', 'escrow'),
(3, 'user', 1, 'BTC', 'bitcoin_wallet'),
(32, 'user', 2, 'BRL', 'cash'),
(35, 'user', 2, 'BRL', 'nft_inventory'),
(33, 'user', 2, 'BRL', 'escrow'),
(34, 'user', 2, 'BTC', 'bitcoin_wallet'),
(4, 'user', 5, 'BRL', 'cash'),
(7, 'user', 5, 'BRL', 'nft_inventory'),
(5, 'user', 5, 'BRL', 'escrow'),
(6, 'user', 5, 'BTC', 'bitcoin_wallet'),
(8, 'user', 9, 'BRL', 'cash'),
(11, 'user', 9, 'BRL', 'nft_inventory'),
(9, 'user', 9, 'BRL', 'escrow'),
(10, 'user', 9, 'BTC', 'bitcoin_wallet'),
(12, 'user', 10, 'BRL', 'cash'),
(15, 'user', 10, 'BRL', 'nft_inventory'),
(13, 'user', 10, 'BRL', 'escrow'),
(14, 'user', 10, 'BTC', 'bitcoin_wallet'),
(16, 'user', 11, 'BRL', 'cash'),
(19, 'user', 11, 'BRL', 'nft_inventory'),
(17, 'user', 11, 'BRL', 'escrow'),
(18, 'user', 11, 'BTC', 'bitcoin_wallet'),
(20, 'user', 12, 'BRL', 'cash'),
(23, 'user', 12, 'BRL', 'nft_inventory'),
(21, 'user', 12, 'BRL', 'escrow'),
(22, 'user', 12, 'BTC', 'bitcoin_wallet'),
(24, 'user', 13, 'BRL', 'cash'),
(27, 'user', 13, 'BRL', 'nft_inventory'),
(25, 'user', 13, 'BRL', 'escrow'),
(26, 'user', 13, 'BTC', 'bitcoin_wallet'),
(28, 'user', 14, 'BRL', 'cash'),
(31, 'user', 14, 'BRL', 'nft_inventory'),
(29, 'user', 14, 'BRL', 'escrow'),
(30, 'user', 14, 'BTC', 'bitcoin_wallet'),
(36, 'user', 17, 'BRL', 'cash'),
(39, 'user', 17, 'BRL', 'nft_inventory'),
(37, 'user', 17, 'BRL', 'escrow'),
(38, 'user', 17, 'BTC', 'bitcoin_wallet'),
(40, 'user', 18, 'BRL', 'cash'),
(43, 'user', 18, 'BRL', 'nft_inventory'),
(41, 'user', 18, 'BRL', 'escrow'),
(42, 'user', 18, 'BTC', 'bitcoin_wallet'),
(44, 'user', 48, 'BRL', 'cash'),
(47, 'user', 48, 'BRL', 'nft_inventory'),
(45, 'user', 48, 'BRL', 'escrow'),
(46, 'user', 48, 'BTC', 'bitcoin_wallet'),
(48, 'user', 49, 'BRL', 'cash'),
(51, 'user', 49, 'BRL', 'nft_inventory'),
(49, 'user', 49, 'BRL', 'escrow'),
(50, 'user', 49, 'BTC', 'bitcoin_wallet');

-- --------------------------------------------------------

--
-- Estrutura para tabela `assets`
--

CREATE TABLE `assets` (
  `id` bigint NOT NULL,
  `type` enum('bitcoin','nft','share','frame','chassis','gallery_space') NOT NULL,
  `symbol` varchar(64) DEFAULT NULL,
  `parent_asset_id` bigint DEFAULT NULL,
  `metadata_json` json DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `asset_instances`
--

CREATE TABLE `asset_instances` (
  `id` bigint NOT NULL,
  `asset_id` bigint NOT NULL,
  `chain` varchar(32) DEFAULT NULL,
  `contract_addr` varchar(128) DEFAULT NULL,
  `token_id` varchar(128) DEFAULT NULL,
  `serial` varchar(64) DEFAULT NULL,
  `metadata_json` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `asset_moves`
--

CREATE TABLE `asset_moves` (
  `id` bigint NOT NULL,
  `journal_id` bigint NOT NULL,
  `asset_id` bigint DEFAULT NULL,
  `asset_instance_id` bigint DEFAULT NULL,
  `qty` decimal(24,8) NOT NULL DEFAULT '0.00000000',
  `from_account_id` bigint DEFAULT NULL,
  `to_account_id` bigint DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Acionadores `asset_moves`
--
DELIMITER $$
CREATE TRIGGER `trg_positions_upsert` AFTER INSERT ON `asset_moves` FOR EACH ROW BEGIN
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
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estrutura para tabela `auctions`
--

CREATE TABLE `auctions` (
  `id` bigint NOT NULL,
  `seller_id` bigint NOT NULL,
  `asset_id` bigint DEFAULT NULL,
  `asset_instance_id` bigint DEFAULT NULL,
  `starts_at` datetime NOT NULL,
  `ends_at` datetime NOT NULL,
  `reserve_price` decimal(24,8) DEFAULT '0.00000000',
  `status` enum('draft','running','ended','settled') DEFAULT 'draft'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `bids`
--

CREATE TABLE `bids` (
  `id` bigint NOT NULL,
  `auction_id` bigint NOT NULL,
  `bidder_id` bigint NOT NULL,
  `amount` decimal(24,8) NOT NULL,
  `status` enum('valid','outbid','winner','cancelled') DEFAULT 'valid',
  `journal_id` bigint DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `chassis`
--

CREATE TABLE `chassis` (
  `id` bigint NOT NULL,
  `asset_instance_id` bigint NOT NULL,
  `size` varchar(64) DEFAULT NULL,
  `material` varchar(64) DEFAULT NULL,
  `status` enum('blank','used') DEFAULT 'blank'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `entries`
--

CREATE TABLE `entries` (
  `id` bigint NOT NULL,
  `journal_id` bigint NOT NULL,
  `account_id` bigint NOT NULL,
  `debit` decimal(24,8) NOT NULL DEFAULT '0.00000000',
  `credit` decimal(24,8) NOT NULL DEFAULT '0.00000000'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `frames`
--

CREATE TABLE `frames` (
  `id` bigint NOT NULL,
  `asset_instance_id` bigint NOT NULL,
  `size` varchar(64) DEFAULT NULL,
  `material` varchar(64) DEFAULT NULL,
  `status` enum('free','used') DEFAULT 'free'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `galleries`
--

CREATE TABLE `galleries` (
  `id` bigint NOT NULL,
  `name` varchar(160) NOT NULL,
  `address` varchar(200) DEFAULT NULL,
  `owner_id` bigint NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `gallery_spaces`
--

CREATE TABLE `gallery_spaces` (
  `id` bigint NOT NULL,
  `asset_instance_id` bigint NOT NULL,
  `gallery_id` bigint NOT NULL,
  `label` varchar(64) DEFAULT NULL,
  `size` varchar(64) DEFAULT NULL,
  `status` enum('free','occupied') DEFAULT 'free'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `journals`
--

CREATE TABLE `journals` (
  `id` bigint NOT NULL,
  `occurred_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ref_type` enum('deposit','withdraw','trade','prize','lease','mint','buy','sell','fee','market_purchase','bid') NOT NULL,
  `ref_id` bigint DEFAULT NULL,
  `memo` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `liquidity_game_states`
--

CREATE TABLE `liquidity_game_states` (
  `user_id` bigint NOT NULL,
  `state_json` json NOT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Despejando dados para a tabela `liquidity_game_states`
--

INSERT INTO `liquidity_game_states` (`user_id`, `state_json`, `updated_at`) VALUES
(2, '{\"pool\": {\"nfts\": 0, \"shares\": 0}, \"stage\": \"regular\", \"teams\": [{\"id\": 1, \"btc\": 10, \"cash\": 2289, \"name\": \"abraao\", \"userId\": 14, \"nftHand\": 0, \"eliminated\": false, \"playerName\": \"abraao\", \"poolShares\": 0}, {\"id\": 2, \"btc\": 63, \"cash\": 22349, \"name\": \"aqyo\", \"userId\": 2, \"nftHand\": 14, \"eliminated\": false, \"playerName\": \"aqyo\", \"poolShares\": 2}, {\"id\": 3, \"btc\": 6, \"cash\": 0, \"name\": \"Davi\", \"userId\": 48, \"nftHand\": 0, \"eliminated\": false, \"playerName\": \"Davi\", \"poolShares\": 0}, {\"id\": 4, \"btc\": 0, \"cash\": 0, \"name\": \"GEMNIO12h\", \"userId\": 17, \"nftHand\": 0, \"eliminated\": false, \"playerName\": \"GEMNIO12h\", \"poolShares\": 0}, {\"id\": 5, \"btc\": 5, \"cash\": 200, \"name\": \"Giulia\", \"userId\": 18, \"nftHand\": 0, \"eliminated\": false, \"playerName\": \"Giulia\", \"poolShares\": 0}, {\"id\": 6, \"btc\": 12, \"cash\": 2000, \"name\": \"Ines ABN\", \"userId\": 12, \"nftHand\": 0, \"eliminated\": false, \"playerName\": \"Ines ABN\", \"poolShares\": 0}, {\"id\": 7, \"btc\": 2, \"cash\": 522, \"name\": \"martys\", \"userId\": 9, \"nftHand\": 3, \"eliminated\": false, \"playerName\": \"martys\", \"poolShares\": 4}], \"history\": [], \"championId\": null}', '2025-11-08 04:04:50'),
(9, '{\"pool\": {\"nfts\": 0, \"shares\": 0}, \"stage\": \"regular\", \"teams\": [{\"id\": 1, \"btc\": 0, \"cash\": 7722, \"name\": \"martys\", \"userId\": 9, \"nftHand\": 3, \"eliminated\": false, \"playerName\": \"martys\", \"poolShares\": 4}], \"history\": [], \"championId\": null}', '2025-11-08 02:31:17'),
(12, '{\"pool\": {\"nfts\": 0, \"shares\": 0}, \"round\": 1, \"stage\": \"regular\", \"teams\": [{\"id\": 1, \"btc\": 0, \"cash\": 1600, \"name\": \"aqyo\", \"userId\": 2, \"nftHand\": 1, \"eliminated\": false, \"playerName\": \"aqyo\", \"poolShares\": 0}, {\"id\": 2, \"btc\": 0, \"cash\": 1600, \"name\": \"gemnio\", \"userId\": 10, \"nftHand\": 1, \"eliminated\": false, \"playerName\": \"gemnio\", \"poolShares\": 0}, {\"id\": 3, \"btc\": 0, \"cash\": 1600, \"name\": \"Ines ABN\", \"userId\": 12, \"nftHand\": 1, \"eliminated\": false, \"playerName\": \"Ines ABN\", \"poolShares\": 0}, {\"id\": 4, \"btc\": 0, \"cash\": 1600, \"name\": \"martys\", \"userId\": 9, \"nftHand\": 1, \"eliminated\": false, \"playerName\": \"martys\", \"poolShares\": 0}], \"history\": [], \"turnIndex\": 0, \"championId\": null, \"awaitingRoundEnd\": false}', '2025-11-03 13:18:04'),
(18, '{\"pool\": {\"nfts\": 2, \"shares\": 2}, \"round\": 1, \"stage\": \"regular\", \"teams\": [{\"id\": 1, \"btc\": 10, \"cash\": 1600, \"name\": \"abraao\", \"userId\": 14, \"nftHand\": 0, \"eliminated\": false, \"playerName\": \"abraao\", \"poolShares\": 1}, {\"id\": 2, \"btc\": 10, \"cash\": 1600, \"name\": \"aqyo\", \"userId\": 2, \"nftHand\": 0, \"eliminated\": false, \"playerName\": \"aqyo\", \"poolShares\": 1}, {\"id\": 3, \"btc\": 0, \"cash\": 1600, \"name\": \"Giulia\", \"userId\": 18, \"nftHand\": 1, \"eliminated\": false, \"playerName\": \"Giulia\", \"poolShares\": 0}, {\"id\": 4, \"btc\": 0, \"cash\": 1600, \"name\": \"Ines ABN\", \"userId\": 12, \"nftHand\": 1, \"eliminated\": false, \"playerName\": \"Ines ABN\", \"poolShares\": 0}, {\"id\": 5, \"btc\": 0, \"cash\": 1600, \"name\": \"martys\", \"userId\": 9, \"nftHand\": 1, \"eliminated\": false, \"playerName\": \"martys\", \"poolShares\": 0}], \"history\": [{\"team\": \"aqyo\", \"round\": 1, \"message\": \"Depositou uma NFT na piscina (+10 BTC e +1 cota).\", \"timestamp\": \"2025-11-07T14:41:28.306Z\"}, {\"team\": \"abraao\", \"round\": 1, \"message\": \"Depositou uma NFT na piscina (+10 BTC e +1 cota).\", \"timestamp\": \"2025-11-07T14:41:26.999Z\"}], \"turnIndex\": 2, \"championId\": null, \"awaitingRoundEnd\": false}', '2025-11-07 14:41:28');

-- --------------------------------------------------------

--
-- Estrutura para tabela `offers`
--

CREATE TABLE `offers` (
  `id` bigint NOT NULL,
  `seller_id` bigint NOT NULL,
  `kind` enum('NFT','BTC') NOT NULL,
  `asset_instance_id` bigint DEFAULT NULL,
  `qty` decimal(24,8) NOT NULL,
  `locked_qty` decimal(24,8) NOT NULL DEFAULT '0.00000000',
  `price_brl` decimal(24,8) NOT NULL,
  `status` enum('open','pending','filled','cancelled') DEFAULT 'open',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `pending_transactions`
--

CREATE TABLE `pending_transactions` (
  `id` bigint NOT NULL,
  `origin_type` enum('order_match','buy_offer','special_asset_trade') NOT NULL,
  `origin_id` bigint DEFAULT NULL,
  `buy_order_id` bigint DEFAULT NULL,
  `sell_order_id` bigint DEFAULT NULL,
  `offer_id` bigint DEFAULT NULL,
  `proposer_id` bigint NOT NULL,
  `buyer_id` bigint NOT NULL,
  `seller_id` bigint NOT NULL,
  `asset_type` varchar(32) DEFAULT NULL,
  `asset_id` bigint DEFAULT NULL,
  `asset_instance_id` bigint DEFAULT NULL,
  `qty` decimal(24,8) NOT NULL,
  `price` decimal(24,8) NOT NULL,
  `status` enum('pending','settled','rejected','expired','cancelled') DEFAULT 'pending',
  `buyer_status` enum('pending','approved','rejected') DEFAULT 'pending',
  `seller_status` enum('pending','approved','rejected') DEFAULT 'pending',
  `journal_id` bigint DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `expires_at` datetime DEFAULT NULL,
  `finalized_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `orders`
--

CREATE TABLE `orders` (
  `id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `side` enum('buy','sell') NOT NULL,
  `asset_id` bigint DEFAULT NULL,
  `asset_instance_id` bigint DEFAULT NULL,
  `qty` decimal(24,8) NOT NULL,
  `locked_qty` decimal(24,8) NOT NULL DEFAULT '0.00000000',
  `price` decimal(24,8) NOT NULL,
  `status` enum('open','pending','filled','cancelled') DEFAULT 'open',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Despejando dados para a tabela `orders`
--

INSERT INTO `orders` (`id`, `user_id`, `side`, `asset_id`, `asset_instance_id`, `qty`, `locked_qty`, `price`, `status`, `created_at`) VALUES
(1, 3, 'buy', NULL, 2, 1.00000000, 0.00000000, 12.00000000, 'open', '2025-10-29 03:02:37');

-- --------------------------------------------------------

--
-- Estrutura para tabela `positions`
--

CREATE TABLE `positions` (
  `id` bigint NOT NULL,
  `owner_type` enum('user','org') DEFAULT 'user',
  `owner_id` bigint NOT NULL,
  `asset_id` bigint NOT NULL,
  `qty` decimal(24,8) NOT NULL DEFAULT '0.00000000'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `prizes`
--

CREATE TABLE `prizes` (
  `id` bigint NOT NULL,
  `name` varchar(120) NOT NULL,
  `rules_json` json DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `prize_grants`
--

CREATE TABLE `prize_grants` (
  `id` bigint NOT NULL,
  `prize_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `amount` decimal(24,8) DEFAULT '0.00000000',
  `journal_id` bigint NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `schools`
--

CREATE TABLE `schools` (
  `id` bigint NOT NULL,
  `name` varchar(160) NOT NULL,
  `city` varchar(120) DEFAULT NULL,
  `metadata_json` json DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `special_liquidity_assets`
--

CREATE TABLE `special_liquidity_assets` (
  `user_id` bigint NOT NULL,
  `bitcoin` decimal(24,8) NOT NULL DEFAULT '0.00000000',
  `nft` int NOT NULL DEFAULT '0',
  `brl` decimal(24,2) NOT NULL DEFAULT '0.00',
  `quotas` decimal(24,8) NOT NULL DEFAULT '0.00000000',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Despejando dados para a tabela `special_liquidity_assets`
--

INSERT INTO `special_liquidity_assets` (`user_id`, `bitcoin`, `nft`, `brl`, `quotas`, `updated_at`) VALUES
(2, 55.00000000, 13, 22349.00, 2.00000000, '2025-11-08 12:01:31'),
(9, 11.00000000, 4, 322.00, 4.00000000, '2025-11-08 12:01:31'),
(12, 11.00000000, 0, 2200.00, 0.00000000, '2025-11-08 11:49:05'),
(14, 10.00000000, 0, 2289.00, 0.00000000, '2025-11-08 04:04:50'),
(17, 0.00000000, 0, 0.00, 0.00000000, '2025-11-08 04:04:50'),
(18, 5.00000000, 0, 200.00, 0.00000000, '2025-11-08 04:04:50'),
(48, 6.00000000, 0, 0.00, 0.00000000, '2025-11-08 04:04:50');

-- --------------------------------------------------------

--
-- Estrutura para tabela `special_liquidity_guardian`
--

CREATE TABLE `special_liquidity_guardian` (
  `id` tinyint NOT NULL,
  `user_id` bigint NOT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Despejando dados para a tabela `special_liquidity_guardian`
--

INSERT INTO `special_liquidity_guardian` (`id`, `user_id`, `updated_at`) VALUES
(1, 2, '2025-11-07 03:08:53');

-- --------------------------------------------------------

--
-- Estrutura para tabela `trades`
--

CREATE TABLE `trades` (
  `id` bigint NOT NULL,
  `buy_order_id` bigint DEFAULT NULL,
  `sell_order_id` bigint DEFAULT NULL,
  `qty` decimal(24,8) NOT NULL,
  `price` decimal(24,8) NOT NULL,
  `journal_id` bigint NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `users`
--

CREATE TABLE `users` (
  `id` bigint NOT NULL,
  `name` varchar(120) NOT NULL,
  `email` varchar(160) DEFAULT NULL,
  `phone` varchar(40) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `confirmed` tinyint DEFAULT '0',
  `is_admin` tinyint DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Despejando dados para a tabela `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `phone`, `password_hash`, `created_at`, `confirmed`, `is_admin`) VALUES
(1, 'Demo', 'demo@artx', NULL, 'x', '2025-10-29 02:32:49', 0, 0),
(2, 'aqyo', 'aquinomartins.art@gmail.com', NULL, '$2y$10$xEl6WrRLdyKfBu17dW7IKe8.hxKsoeXCInt32i/LytJqzYi6RfvQ2', '2025-10-29 02:48:49', 1, 1),
(3, 'maria', 'mariaaqui@gmail.com', NULL, '$2y$10$4.QM2P615hITRzV2rdyr/.WP5hInaKL1YYOflglVR.xnApKy8VxZu', '2025-10-29 02:56:54', 0, 0),
(9, 'martys', 'alvorascapital@gmail.com', NULL, '$2y$10$0up.acQQw4X1HU9DkTQXduL2sMQtP.mua8qNjr0FRagssFEyK5yzK', '2025-10-29 04:05:08', 1, 0),
(11, 'Abr3', 'tra32@gmail.com', NULL, '$2y$10$OPBtznx/VSh9C9ml/6edXOC5UE5lPf33s.YpFIFO0ZrP7S1W2F9C.', '2025-11-02 21:06:54', 0, 0),
(12, 'Ines ABN', 'ines.abn@gmail.com', NULL, '$2y$10$WBw6SD.yGF0YGpEqqAl8.uECd7KN./n2TPRqScojNtPpUNi1uguiG', '2025-11-03 13:16:18', 1, 0),
(13, 'Neide', 'neideals0809@gmail.com', NULL, '$2y$10$9MRwCY/GDcfhfYpVgiP6oePv0f/9SZdimW.ZXLSFcTmmogAUdqGRW', '2025-11-03 14:14:50', 0, 0),
(14, 'abraao', 'contasala770@gmail.com', NULL, '$2y$10$.IEOdrh5uUH2lRzieILXVOHp4hLBY14wBgHGLiVjbGDpjzcl33Skm', '2025-11-04 01:41:40', 1, 0),
(17, 'GEMNIO12h', 'gemnio.com.br@gmail.com', NULL, '$2y$10$2Xz3BKTpo3Aro1W0ad4d.e5zDrG8GxzztQurdBmNHegTFb/VMEzJ.', '2025-11-05 16:08:55', 1, 0),
(18, 'Giulia', 'giuliacacaes2@gmail.com', NULL, '$2y$10$gqKf3H8k6wZnXnSp7hNUpuJF7ssdjDMCxfSvjC2vQUJdtjNjeVF4a', '2025-11-07 14:37:42', 1, 0),
(48, 'Davi', 'davifigueira126@gmail.com', NULL, '$2y$10$lmJmdHwdFgvPK.TMPJmHAuDGhXiHG2WBT1JPRA3ZQO6479Asav3b.', '2025-11-07 16:47:25', 1, 0),
(49, 'Lucas Cacaes', 'lucascacaes@gmail.com', NULL, '$2y$10$.idO9xe7xD6HHPMTWSdo8Op2xlgTAfjSi3U/J0UMwwxvNRWIeI7C2', '2025-11-07 16:49:26', 0, 0);

-- --------------------------------------------------------

--
-- Estrutura para tabela `user_confirmations`
--

CREATE TABLE `user_confirmations` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `token` varchar(64) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Despejando dados para a tabela `user_confirmations`
--

INSERT INTO `user_confirmations` (`id`, `user_id`, `token`, `created_at`) VALUES
(3, 11, 'bb7cc716e6c4cfaa36893ac0925447f3', '2025-11-02 21:06:54'),
(5, 13, 'f56fd7d3c514e8eb4885e0510f109f6b', '2025-11-03 14:14:50'),
(8, 18, '69d6133f46a3082abeb057badfb9968a', '2025-11-07 14:37:42'),
(10, 49, '8402d200157f9065883fed3d7b33f527', '2025-11-07 16:49:26');

-- --------------------------------------------------------

--
-- Estrutura para tabela `works`
--

CREATE TABLE `works` (
  `id` bigint NOT NULL,
  `asset_instance_id` bigint NOT NULL,
  `title` varchar(160) NOT NULL,
  `artist_id` bigint NOT NULL,
  `specs_json` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `accounts`
--
ALTER TABLE `accounts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_owner_cur_purpose` (`owner_type`,`owner_id`,`currency`,`purpose`),
  ADD KEY `owner_type` (`owner_type`,`owner_id`);

--
-- Índices de tabela `assets`
--
ALTER TABLE `assets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `parent_asset_id` (`parent_asset_id`);

--
-- Índices de tabela `asset_instances`
--
ALTER TABLE `asset_instances`
  ADD PRIMARY KEY (`id`),
  ADD KEY `asset_id` (`asset_id`);

--
-- Índices de tabela `asset_moves`
--
ALTER TABLE `asset_moves`
  ADD PRIMARY KEY (`id`),
  ADD KEY `journal_id` (`journal_id`),
  ADD KEY `from_account_id` (`from_account_id`),
  ADD KEY `to_account_id` (`to_account_id`),
  ADD KEY `asset_id` (`asset_id`),
  ADD KEY `asset_instance_id` (`asset_instance_id`);

--
-- Índices de tabela `auctions`
--
ALTER TABLE `auctions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `seller_id` (`seller_id`);

--
-- Índices de tabela `bids`
--
ALTER TABLE `bids`
  ADD PRIMARY KEY (`id`),
  ADD KEY `auction_id` (`auction_id`),
  ADD KEY `bidder_id` (`bidder_id`);

--
-- Índices de tabela `chassis`
--
ALTER TABLE `chassis`
  ADD PRIMARY KEY (`id`),
  ADD KEY `asset_instance_id` (`asset_instance_id`);

--
-- Índices de tabela `entries`
--
ALTER TABLE `entries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `journal_id` (`journal_id`),
  ADD KEY `account_id` (`account_id`);

--
-- Índices de tabela `frames`
--
ALTER TABLE `frames`
  ADD PRIMARY KEY (`id`),
  ADD KEY `asset_instance_id` (`asset_instance_id`);

--
-- Índices de tabela `galleries`
--
ALTER TABLE `galleries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `owner_id` (`owner_id`);

--
-- Índices de tabela `gallery_spaces`
--
ALTER TABLE `gallery_spaces`
  ADD PRIMARY KEY (`id`),
  ADD KEY `asset_instance_id` (`asset_instance_id`),
  ADD KEY `gallery_id` (`gallery_id`);

--
-- Índices de tabela `journals`
--
ALTER TABLE `journals`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `liquidity_game_states`
--
ALTER TABLE `liquidity_game_states`
  ADD PRIMARY KEY (`user_id`);

--
-- Índices de tabela `offers`
--
ALTER TABLE `offers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_offers_status` (`status`),
  ADD KEY `idx_offers_kind` (`kind`);

--
-- Índices de tabela `pending_transactions`
--
ALTER TABLE `pending_transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `buy_order_id` (`buy_order_id`),
  ADD KEY `sell_order_id` (`sell_order_id`),
  ADD KEY `offer_id` (`offer_id`),
  ADD KEY `proposer_id` (`proposer_id`),
  ADD KEY `buyer_id` (`buyer_id`),
  ADD KEY `seller_id` (`seller_id`),
  ADD KEY `asset_id` (`asset_id`),
  ADD KEY `asset_instance_id` (`asset_instance_id`),
  ADD KEY `status` (`status`),
  ADD KEY `expires_at` (`expires_at`);

--
-- Índices de tabela `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Índices de tabela `positions`
--
ALTER TABLE `positions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_pos` (`owner_type`,`owner_id`,`asset_id`),
  ADD KEY `owner_type` (`owner_type`,`owner_id`),
  ADD KEY `asset_id` (`asset_id`);

--
-- Índices de tabela `prizes`
--
ALTER TABLE `prizes`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `prize_grants`
--
ALTER TABLE `prize_grants`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `schools`
--
ALTER TABLE `schools`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `special_liquidity_assets`
--
ALTER TABLE `special_liquidity_assets`
  ADD PRIMARY KEY (`user_id`);

--
-- Índices de tabela `special_liquidity_guardian`
--
ALTER TABLE `special_liquidity_guardian`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_special_liquidity_guardian_user` (`user_id`);

--
-- Índices de tabela `trades`
--
ALTER TABLE `trades`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Índices de tabela `user_confirmations`
--
ALTER TABLE `user_confirmations`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `works`
--
ALTER TABLE `works`
  ADD PRIMARY KEY (`id`),
  ADD KEY `asset_instance_id` (`asset_instance_id`),
  ADD KEY `artist_id` (`artist_id`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `accounts`
--
ALTER TABLE `accounts`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=52;

--
-- AUTO_INCREMENT de tabela `assets`
--
ALTER TABLE `assets`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de tabela `asset_instances`
--
ALTER TABLE `asset_instances`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de tabela `asset_moves`
--
ALTER TABLE `asset_moves`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `auctions`
--
ALTER TABLE `auctions`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `bids`
--
ALTER TABLE `bids`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `chassis`
--
ALTER TABLE `chassis`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `entries`
--
ALTER TABLE `entries`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `frames`
--
ALTER TABLE `frames`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `galleries`
--
ALTER TABLE `galleries`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `gallery_spaces`
--
ALTER TABLE `gallery_spaces`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `journals`
--
ALTER TABLE `journals`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `offers`
--
ALTER TABLE `offers`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `pending_transactions`
--
ALTER TABLE `pending_transactions`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `orders`
--
ALTER TABLE `orders`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de tabela `positions`
--
ALTER TABLE `positions`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `prizes`
--
ALTER TABLE `prizes`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `prize_grants`
--
ALTER TABLE `prize_grants`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `schools`
--
ALTER TABLE `schools`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `trades`
--
ALTER TABLE `trades`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=50;

--
-- AUTO_INCREMENT de tabela `user_confirmations`
--
ALTER TABLE `user_confirmations`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de tabela `works`
--
ALTER TABLE `works`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- Restrições para tabelas despejadas
--

--
-- Restrições para tabelas `assets`
--
ALTER TABLE `assets`
  ADD CONSTRAINT `assets_ibfk_1` FOREIGN KEY (`parent_asset_id`) REFERENCES `assets` (`id`);

--
-- Restrições para tabelas `asset_instances`
--
ALTER TABLE `asset_instances`
  ADD CONSTRAINT `asset_instances_ibfk_1` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`);

--
-- Restrições para tabelas `asset_moves`
--
ALTER TABLE `asset_moves`
  ADD CONSTRAINT `asset_moves_ibfk_1` FOREIGN KEY (`journal_id`) REFERENCES `journals` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `asset_moves_ibfk_2` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`),
  ADD CONSTRAINT `asset_moves_ibfk_3` FOREIGN KEY (`asset_instance_id`) REFERENCES `asset_instances` (`id`),
  ADD CONSTRAINT `asset_moves_ibfk_4` FOREIGN KEY (`from_account_id`) REFERENCES `accounts` (`id`),
  ADD CONSTRAINT `asset_moves_ibfk_5` FOREIGN KEY (`to_account_id`) REFERENCES `accounts` (`id`);

--
-- Restrições para tabelas `auctions`
--
ALTER TABLE `auctions`
  ADD CONSTRAINT `auctions_ibfk_1` FOREIGN KEY (`seller_id`) REFERENCES `users` (`id`);

--
-- Restrições para tabelas `bids`
--
ALTER TABLE `bids`
  ADD CONSTRAINT `bids_ibfk_1` FOREIGN KEY (`auction_id`) REFERENCES `auctions` (`id`),
  ADD CONSTRAINT `bids_ibfk_2` FOREIGN KEY (`bidder_id`) REFERENCES `users` (`id`);

--
-- Restrições para tabelas `chassis`
--
ALTER TABLE `chassis`
  ADD CONSTRAINT `chassis_ibfk_1` FOREIGN KEY (`asset_instance_id`) REFERENCES `asset_instances` (`id`);

--
-- Restrições para tabelas `entries`
--
ALTER TABLE `entries`
  ADD CONSTRAINT `entries_ibfk_1` FOREIGN KEY (`journal_id`) REFERENCES `journals` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `entries_ibfk_2` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`);

--
-- Restrições para tabelas `frames`
--
ALTER TABLE `frames`
  ADD CONSTRAINT `frames_ibfk_1` FOREIGN KEY (`asset_instance_id`) REFERENCES `asset_instances` (`id`);

--
-- Restrições para tabelas `galleries`
--
ALTER TABLE `galleries`
  ADD CONSTRAINT `galleries_ibfk_1` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`);

--
-- Restrições para tabelas `gallery_spaces`
--
ALTER TABLE `gallery_spaces`
  ADD CONSTRAINT `gallery_spaces_ibfk_1` FOREIGN KEY (`asset_instance_id`) REFERENCES `asset_instances` (`id`),
  ADD CONSTRAINT `gallery_spaces_ibfk_2` FOREIGN KEY (`gallery_id`) REFERENCES `galleries` (`id`);

--
-- Restrições para tabelas `liquidity_game_states`
--
ALTER TABLE `liquidity_game_states`
  ADD CONSTRAINT `liquidity_game_states_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Restrições para tabelas `offers`
--
ALTER TABLE `offers`
  ADD CONSTRAINT `offers_ibfk_1` FOREIGN KEY (`seller_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `offers_ibfk_2` FOREIGN KEY (`asset_instance_id`) REFERENCES `asset_instances` (`id`);

--
-- Restrições para tabelas `pending_transactions`
--
ALTER TABLE `pending_transactions`
  ADD CONSTRAINT `pending_transactions_ibfk_1` FOREIGN KEY (`buy_order_id`) REFERENCES `orders` (`id`),
  ADD CONSTRAINT `pending_transactions_ibfk_2` FOREIGN KEY (`sell_order_id`) REFERENCES `orders` (`id`),
  ADD CONSTRAINT `pending_transactions_ibfk_3` FOREIGN KEY (`offer_id`) REFERENCES `offers` (`id`),
  ADD CONSTRAINT `pending_transactions_ibfk_4` FOREIGN KEY (`proposer_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `pending_transactions_ibfk_5` FOREIGN KEY (`buyer_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `pending_transactions_ibfk_6` FOREIGN KEY (`seller_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `pending_transactions_ibfk_7` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`),
  ADD CONSTRAINT `pending_transactions_ibfk_8` FOREIGN KEY (`asset_instance_id`) REFERENCES `asset_instances` (`id`);

--
-- Restrições para tabelas `positions`
--
ALTER TABLE `positions`
  ADD CONSTRAINT `positions_ibfk_1` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`);

--
-- Restrições para tabelas `special_liquidity_assets`
--
ALTER TABLE `special_liquidity_assets`
  ADD CONSTRAINT `special_liquidity_assets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `special_liquidity_guardian`
--
ALTER TABLE `special_liquidity_guardian`
  ADD CONSTRAINT `fk_special_liquidity_guardian_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `works`
--
ALTER TABLE `works`
  ADD CONSTRAINT `works_ibfk_1` FOREIGN KEY (`asset_instance_id`) REFERENCES `asset_instances` (`id`),
  ADD CONSTRAINT `works_ibfk_2` FOREIGN KEY (`artist_id`) REFERENCES `users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;