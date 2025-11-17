-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Tempo de geração: 17/11/2025 às 16:12
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
-- Banco de dados: `oftalmol_distribuido`
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
(50, 'user', 49, 'BTC', 'bitcoin_wallet'),
(52, 'user', 50, 'BRL', 'cash'),
(55, 'user', 50, 'BRL', 'nft_inventory'),
(53, 'user', 50, 'BRL', 'escrow'),
(54, 'user', 50, 'BTC', 'bitcoin_wallet'),
(56, 'user', 51, 'BRL', 'cash'),
(59, 'user', 51, 'BRL', 'nft_inventory'),
(57, 'user', 51, 'BRL', 'escrow'),
(58, 'user', 51, 'BTC', 'bitcoin_wallet'),
(60, 'user', 52, 'BRL', 'cash'),
(63, 'user', 52, 'BRL', 'nft_inventory'),
(61, 'user', 52, 'BRL', 'escrow'),
(62, 'user', 52, 'BTC', 'bitcoin_wallet'),
(64, 'user', 53, 'BRL', 'cash'),
(67, 'user', 53, 'BRL', 'nft_inventory'),
(65, 'user', 53, 'BRL', 'escrow'),
(66, 'user', 53, 'BTC', 'bitcoin_wallet'),
(68, 'user', 54, 'BRL', 'cash'),
(71, 'user', 54, 'BRL', 'nft_inventory'),
(69, 'user', 54, 'BRL', 'escrow'),
(70, 'user', 54, 'BTC', 'bitcoin_wallet'),
(72, 'user', 57, 'BRL', 'cash'),
(75, 'user', 57, 'BRL', 'nft_inventory'),
(73, 'user', 57, 'BRL', 'escrow'),
(74, 'user', 57, 'BTC', 'bitcoin_wallet'),
(76, 'user', 58, 'BRL', 'cash'),
(79, 'user', 58, 'BRL', 'nft_inventory'),
(77, 'user', 58, 'BRL', 'escrow'),
(78, 'user', 58, 'BTC', 'bitcoin_wallet'),
(80, 'user', 59, 'BRL', 'cash'),
(83, 'user', 59, 'BRL', 'nft_inventory'),
(81, 'user', 59, 'BRL', 'escrow'),
(82, 'user', 59, 'BTC', 'bitcoin_wallet'),
(84, 'user', 60, 'BRL', 'cash'),
(87, 'user', 60, 'BRL', 'nft_inventory'),
(85, 'user', 60, 'BRL', 'escrow'),
(86, 'user', 60, 'BTC', 'bitcoin_wallet');

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

--
-- Despejando dados para a tabela `assets`
--

INSERT INTO `assets` (`id`, `type`, `symbol`, `parent_asset_id`, `metadata_json`) VALUES
(19, 'nft', NULL, NULL, '{\"image\": \"uploads/nfts/nft_20251114141003_512aa44b.jpg\", \"title\": \"Floresta Doré\"}'),
(20, 'nft', NULL, NULL, '{\"image\": \"uploads/nfts/nft_20251114194133_d40f220d.png\", \"title\": \"Vanitas\"}'),
(22, 'nft', NULL, NULL, '{\"image\": \"uploads/nfts/nft_20251117092420_b9d317e0.png\", \"title\": \"Floresta\"}'),
(23, 'nft', NULL, NULL, '{\"image\": \"uploads/nfts/nft_20251117092528_490470d5.png\", \"title\": \"Tuba\"}'),
(24, 'nft', NULL, NULL, '{\"image\": \"uploads/nfts/nft_20251117092717_efe8be0a.webp\", \"title\": \"Cristo Crucificado\"}'),
(25, 'nft', NULL, NULL, '{\"image\": \"uploads/nfts/nft_20251117093056_703df3d7.png\", \"title\": \"Cachos Negros\"}'),
(26, 'nft', NULL, NULL, '{\"image\": \"uploads/nfts/nft_20251117093210_0861a36b.png\", \"title\": \"Lula Gigante\"}');

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

--
-- Despejando dados para a tabela `asset_instances`
--

INSERT INTO `asset_instances` (`id`, `asset_id`, `chain`, `contract_addr`, `token_id`, `serial`, `metadata_json`, `created_at`) VALUES
(19, 19, 'internal', NULL, 'nft-68f641c94f1e791f', NULL, '{\"mime\": \"image/jpeg\", \"image\": \"uploads/nfts/nft_20251114141003_512aa44b.jpg\", \"title\": \"Floresta Doré\", \"description\": \"Gravura\\r\\nAutor: Gustave Doré\"}', '2025-11-14 14:10:03'),
(20, 20, 'internal', NULL, 'nft-cbc94486571630fb', NULL, '{\"mime\": \"image/png\", \"image\": \"uploads/nfts/nft_20251114194133_d40f220d.png\", \"title\": \"Vanitas\", \"description\": \"Caveira\"}', '2025-11-14 19:41:34'),
(22, 22, 'internal', NULL, 'nft-1a018079cc7d707f', NULL, '{\"mime\": \"image/png\", \"image\": \"uploads/nfts/nft_20251117092420_b9d317e0.png\", \"title\": \"Floresta\", \"description\": \"Óleo sobre tela, 2025\\r\\nAutora: Valentina\"}', '2025-11-17 09:24:22'),
(23, 23, 'internal', NULL, 'nft-3dfcc1e845c03df1', NULL, '{\"mime\": \"image/png\", \"image\": \"uploads/nfts/nft_20251117092528_490470d5.png\", \"title\": \"Tuba\", \"description\": \"Óleo sobre tela, 2025.\\r\\nAutora: Júlia\"}', '2025-11-17 09:25:29'),
(24, 24, 'internal', NULL, 'nft-1564c1cb9e8fd722', NULL, '{\"mime\": \"image/webp\", \"image\": \"uploads/nfts/nft_20251117092717_efe8be0a.webp\", \"title\": \"Cristo Crucificado\", \"description\": \"Estudo de Cristo Crucificado de Francisco Pacheco e Velázquez\\r\\nAutor: Fernando Aquino Martins\"}', '2025-11-17 09:27:20'),
(25, 25, 'internal', NULL, 'nft-862f8661d61cfb99', NULL, '{\"mime\": \"image/png\", \"image\": \"uploads/nfts/nft_20251117093056_703df3d7.png\", \"title\": \"Cachos Negros\", \"description\": \"Óleo sobre Tela\\r\\nAutora: Diana\"}', '2025-11-17 09:30:56'),
(26, 26, 'internal', NULL, 'nft-4c2703f7c2cc503f', NULL, '{\"mime\": \"image/png\", \"image\": \"uploads/nfts/nft_20251117093210_0861a36b.png\", \"title\": \"Lula Gigante\", \"description\": \"Óleo sobre Tela\\r\\nAutor: Morian\"}', '2025-11-17 09:32:10');

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
-- Despejando dados para a tabela `asset_moves`
--

INSERT INTO `asset_moves` (`id`, `journal_id`, `asset_id`, `asset_instance_id`, `qty`, `from_account_id`, `to_account_id`) VALUES
(16, 16, NULL, 19, 1.00000000, NULL, 63),
(20, 20, NULL, 20, 1.00000000, NULL, 11),
(21, 21, NULL, 20, 1.00000000, 11, 35),
(22, 22, NULL, 20, 1.00000000, 35, 11),
(24, 24, NULL, 20, 1.00000000, 11, 35),
(25, 25, NULL, 20, 1.00000000, 35, 39),
(26, 26, NULL, 19, 1.00000000, 63, 39),
(27, 27, NULL, 20, 1.00000000, 39, 63),
(34, 34, NULL, 19, 1.00000000, 39, 63),
(35, 35, NULL, 20, 1.00000000, 63, 11),
(38, 38, NULL, 22, 1.00000000, NULL, 11),
(39, 39, NULL, 23, 1.00000000, NULL, 35),
(40, 40, NULL, 24, 1.00000000, NULL, 35),
(41, 41, NULL, 25, 1.00000000, NULL, 75),
(42, 42, NULL, 26, 1.00000000, NULL, 63);

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

--
-- Despejando dados para a tabela `auctions`
--

INSERT INTO `auctions` (`id`, `seller_id`, `asset_id`, `asset_instance_id`, `starts_at`, `ends_at`, `reserve_price`, `status`) VALUES
(1, 2, NULL, 20, '2025-11-17 17:19:33', '2025-11-17 17:24:50', 100.00000000, 'ended');

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

--
-- Despejando dados para a tabela `entries`
--

INSERT INTO `entries` (`id`, `journal_id`, `account_id`, `debit`, `credit`) VALUES
(17, 21, 8, 10000.00000000, 0.00000000),
(18, 21, 32, 0.00000000, 10000.00000000),
(19, 22, 32, 75.00000000, 0.00000000),
(20, 22, 8, 0.00000000, 75.00000000),
(23, 24, 8, 1001.00000000, 0.00000000),
(24, 24, 32, 0.00000000, 1001.00000000),
(25, 25, 32, 1.00000000, 0.00000000),
(26, 25, 36, 0.00000000, 1.00000000),
(27, 26, 60, 4.00000000, 0.00000000),
(28, 26, 36, 0.00000000, 4.00000000),
(29, 27, 36, 10.00000000, 0.00000000),
(30, 27, 60, 0.00000000, 10.00000000),
(41, 34, 36, 4.00000000, 0.00000000),
(42, 34, 60, 0.00000000, 4.00000000),
(43, 35, 60, 7.00000000, 0.00000000),
(44, 35, 8, 0.00000000, 7.00000000);

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
  `ref_type` enum('deposit','withdraw','trade','prize','lease','mint','buy','sell','fee') NOT NULL,
  `ref_id` bigint DEFAULT NULL,
  `memo` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Despejando dados para a tabela `journals`
--

INSERT INTO `journals` (`id`, `occurred_at`, `ref_type`, `ref_id`, `memo`) VALUES
(16, '2025-11-14 14:10:03', 'mint', NULL, 'Mint NFT: NFT Sistema Ilustrativo'),
(20, '2025-11-14 19:41:34', 'mint', NULL, 'Mint NFT: Vanitas'),
(21, '2025-11-14 19:42:15', 'trade', NULL, 'Liquidacao de trade'),
(22, '2025-11-14 19:42:59', 'trade', NULL, 'Liquidacao de trade'),
(24, '2025-11-15 19:06:44', 'trade', NULL, 'Liquidacao de trade'),
(25, '2025-11-15 19:09:49', 'trade', NULL, 'Liquidacao de trade'),
(26, '2025-11-15 19:10:41', 'trade', NULL, 'Liquidacao de trade'),
(27, '2025-11-15 19:20:28', 'trade', NULL, 'Liquidacao de trade'),
(34, '2025-11-16 00:40:34', 'trade', NULL, 'Liquidacao de trade'),
(35, '2025-11-16 00:41:34', 'trade', NULL, 'Liquidacao de trade'),
(38, '2025-11-17 09:24:22', 'mint', NULL, 'Mint NFT: Floresta'),
(39, '2025-11-17 09:25:29', 'mint', NULL, 'Mint NFT: Tuba'),
(40, '2025-11-17 09:27:20', 'mint', NULL, 'Mint NFT: Estudo de Cristo Crucificado de Francisco Pacheco e Velázquez'),
(41, '2025-11-17 09:30:56', 'mint', NULL, 'Mint NFT: Cachos Negros'),
(42, '2025-11-17 09:32:10', 'mint', NULL, 'Mint NFT: Lula Gigante');

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
(2, '{\"pool\": {\"nfts\": 0, \"shares\": 0}, \"stage\": \"regular\", \"teams\": [{\"id\": 1, \"btc\": 0, \"cash\": 1600, \"name\": \"Time 1\", \"userId\": null, \"nftHand\": 1, \"eliminated\": false, \"playerName\": \"Time 1\", \"poolShares\": 0}, {\"id\": 2, \"btc\": 0, \"cash\": 1600, \"name\": \"Time 2\", \"userId\": null, \"nftHand\": 1, \"eliminated\": false, \"playerName\": \"Time 2\", \"poolShares\": 0}, {\"id\": 3, \"btc\": 0, \"cash\": 1600, \"name\": \"Time 3\", \"userId\": null, \"nftHand\": 1, \"eliminated\": false, \"playerName\": \"Time 3\", \"poolShares\": 0}, {\"id\": 4, \"btc\": 0, \"cash\": 1600, \"name\": \"Time 4\", \"userId\": null, \"nftHand\": 1, \"eliminated\": false, \"playerName\": \"Time 4\", \"poolShares\": 0}, {\"id\": 5, \"btc\": 0, \"cash\": 1600, \"name\": \"Time 5\", \"userId\": null, \"nftHand\": 1, \"eliminated\": false, \"playerName\": \"Time 5\", \"poolShares\": 0}, {\"id\": 6, \"btc\": 0, \"cash\": 1600, \"name\": \"Time 6\", \"userId\": null, \"nftHand\": 1, \"eliminated\": false, \"playerName\": \"Time 6\", \"poolShares\": 0}, {\"id\": 7, \"btc\": 0, \"cash\": 1600, \"name\": \"Time 7\", \"userId\": null, \"nftHand\": 1, \"eliminated\": false, \"playerName\": \"Time 7\", \"poolShares\": 0}, {\"id\": 8, \"btc\": 0, \"cash\": 1600, \"name\": \"Time 8\", \"userId\": null, \"nftHand\": 1, \"eliminated\": false, \"playerName\": \"Time 8\", \"poolShares\": 0}, {\"id\": 9, \"btc\": 0, \"cash\": 1600, \"name\": \"Time 9\", \"userId\": null, \"nftHand\": 1, \"eliminated\": false, \"playerName\": \"Time 9\", \"poolShares\": 0}], \"history\": [], \"championId\": null}', '2025-11-16 14:36:57'),
(9, '{\"pool\": {\"nfts\": 0, \"shares\": 0}, \"stage\": \"regular\", \"teams\": [{\"id\": 1, \"btc\": 0, \"cash\": 7722, \"name\": \"martys\", \"userId\": 9, \"nftHand\": 3, \"eliminated\": false, \"playerName\": \"martys\", \"poolShares\": 4}], \"history\": [], \"championId\": null}', '2025-11-14 13:58:34'),
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
(1, 3, 'buy', NULL, 2, 1.00000000, 0.00000000, 12.00000000, 'open', '2025-10-29 03:02:37'),
(5, 2, 'sell', 16, 16, 1.00000000, 0.00000000, 200.00000000, 'cancelled', '2025-11-14 13:26:51'),
(6, 9, 'buy', 16, 16, 0.00000000, 0.00000000, 200.00000000, 'filled', '2025-11-14 13:26:59'),
(8, 2, 'buy', 16, 16, 0.00000000, 0.00000000, 200.00000000, 'filled', '2025-11-14 13:27:53'),
(9, 2, 'sell', 16, 16, 0.00000000, 0.00000000, 244.00000000, 'filled', '2025-11-14 13:50:49'),
(10, 9, 'buy', 16, 16, 0.00000000, 0.00000000, 244.00000000, 'filled', '2025-11-14 13:51:21'),
(11, 9, 'sell', 16, 16, 0.00000000, 0.00000000, 111.00000000, 'filled', '2025-11-14 13:53:15'),
(12, 9, 'sell', 16, 16, 0.00000000, 0.00000000, 111.00000000, 'filled', '2025-11-14 13:54:11'),
(14, 2, 'sell', 16, 16, 0.00000000, 0.00000000, 8.00000000, 'filled', '2025-11-14 13:55:21'),
(15, 52, 'buy', 16, 16, 0.00000000, 0.00000000, 8.00000000, 'filled', '2025-11-14 13:55:46'),
(16, 9, 'sell', 18, 18, 0.00000000, 0.00000000, 100.00000000, 'filled', '2025-11-14 14:10:26'),
(18, 2, 'sell', 18, 18, 0.00000000, 0.00000000, 10.00000000, 'filled', '2025-11-14 14:11:50'),
(19, 52, 'buy', 18, 18, 0.00000000, 0.00000000, 10.00000000, 'filled', '2025-11-14 14:12:02'),
(20, 52, 'sell', 18, 18, 0.00000000, 0.00000000, 22.00000000, 'filled', '2025-11-14 14:57:09'),
(21, 2, 'buy', 18, 18, 0.00000000, 0.00000000, 22.00000000, 'filled', '2025-11-14 14:58:31'),
(22, 9, 'sell', 20, 20, 0.00000000, 0.00000000, 10000.00000000, 'filled', '2025-11-14 19:41:59'),
(23, 2, 'buy', 20, 20, 0.00000000, 0.00000000, 10000.00000000, 'filled', '2025-11-14 19:42:15'),
(24, 2, 'sell', 20, 20, 0.00000000, 0.00000000, 75.00000000, 'filled', '2025-11-14 19:42:46'),
(25, 9, 'buy', 20, 20, 0.00000000, 0.00000000, 75.00000000, 'filled', '2025-11-14 19:42:59'),
(26, 2, 'sell', 18, 18, 0.00000000, 0.00000000, 120.00000000, 'filled', '2025-11-14 20:48:03'),
(27, 57, 'buy', 18, 18, 0.00000000, 0.00000000, 120.00000000, 'filled', '2025-11-14 21:55:41'),
(28, 9, 'sell', 20, 20, 0.00000000, 0.00000000, 1001.00000000, 'filled', '2025-11-15 19:06:15'),
(29, 2, 'buy', 20, 20, 0.00000000, 0.00000000, 1001.00000000, 'filled', '2025-11-15 19:06:44'),
(30, 2, 'sell', 20, 20, 0.00000000, 0.00000000, 1.00000000, 'filled', '2025-11-15 19:09:27'),
(32, 52, 'sell', 19, 19, 0.00000000, 0.00000000, 4.00000000, 'filled', '2025-11-15 19:10:25'),
(35, 52, 'buy', 20, 20, 0.00000000, 0.00000000, 10.00000000, 'filled', '2025-11-15 19:20:28'),
(36, 52, 'sell', 21, 21, 0.00000000, 0.00000000, 1.00000000, 'filled', '2025-11-15 19:22:15'),
(37, 2, 'buy', 21, 21, 0.00000000, 0.00000000, 1.00000000, 'filled', '2025-11-15 19:22:40'),
(38, 2, 'sell', 21, 21, 0.00000000, 0.00000000, 100.00000000, 'filled', '2025-11-15 19:33:00'),
(39, 52, 'buy', 21, 21, 0.00000000, 0.00000000, 100.00000000, 'filled', '2025-11-15 19:33:18'),
(40, 52, 'sell', 21, 21, 0.00000000, 0.00000000, 5000.00000000, 'filled', '2025-11-15 19:40:10'),
(41, 2, 'buy', 21, 21, 0.00000000, 0.00000000, 5000.00000000, 'filled', '2025-11-15 19:40:44'),
(42, 2, 'sell', 21, 21, 0.00000000, 0.00000000, 20.00000000, 'filled', '2025-11-15 19:42:15'),
(45, 52, 'buy', 19, 19, 1.00000000, 0.00000000, 5001.00000000, 'cancelled', '2025-11-15 19:49:01'),
(47, 52, 'buy', 19, 19, 1.00000000, 0.00000000, 5000.00000000, 'cancelled', '2025-11-15 19:49:27'),
(48, 52, 'buy', 19, 19, 1.00000000, 0.00000000, 5000.00000000, 'cancelled', '2025-11-15 19:50:46'),
(50, 52, 'buy', 21, 21, 0.00000000, 0.00000000, 4900.00000000, 'filled', '2025-11-15 19:51:05'),
(51, 2, 'buy', 19, 19, 1.00000000, 0.00000000, 5000.00000000, 'cancelled', '2025-11-16 00:35:46'),
(52, 2, 'buy', 19, 19, 1.00000000, 0.00000000, 5000.00000000, 'cancelled', '2025-11-16 00:36:14'),
(53, 2, 'buy', 19, 19, 1.00000000, 0.00000000, 5000.00000000, 'cancelled', '2025-11-16 00:36:20'),
(55, 2, 'buy', 19, 19, 1.00000000, 0.00000000, 4000.00000000, 'cancelled', '2025-11-16 00:37:27'),
(56, 2, 'buy', 19, 19, 1.00000000, 0.00000000, 4000.00000000, 'cancelled', '2025-11-16 00:38:13'),
(58, 2, 'buy', 19, 19, 1.00000000, 0.00000000, 4.00000000, 'cancelled', '2025-11-16 00:38:48'),
(59, 2, 'buy', 19, 19, 1.00000000, 0.00000000, 4.00000000, 'cancelled', '2025-11-16 00:40:23'),
(60, 52, 'buy', 19, 19, 0.00000000, 0.00000000, 4.00000000, 'filled', '2025-11-16 00:40:34'),
(61, 52, 'sell', 20, 20, 0.00000000, 0.00000000, 7.00000000, 'filled', '2025-11-16 00:40:56'),
(62, 2, 'buy', 20, 20, 1.00000000, 0.00000000, 7.00000000, 'cancelled', '2025-11-16 00:41:08'),
(63, 9, 'buy', 20, 20, 0.00000000, 0.00000000, 7.00000000, 'filled', '2025-11-16 00:41:34'),
(64, 52, 'sell', 21, 21, 0.00000000, 0.00000000, 5000.00000000, 'filled', '2025-11-16 00:54:23'),
(65, 2, 'buy', 21, 21, 0.00000000, 0.00000000, 5000.00000000, 'filled', '2025-11-16 00:55:03'),
(66, 57, 'sell', 18, 18, 0.00000000, 0.00000000, 1000.00000000, 'filled', '2025-11-16 16:08:39'),
(67, 2, 'buy', 18, 18, 0.00000000, 0.00000000, 1000.00000000, 'filled', '2025-11-16 16:09:52'),
(68, 9, 'sell', 22, 22, 1.00000000, 0.00000000, 250.00000000, 'open', '2025-11-17 13:07:08'),
(69, 52, 'sell', 26, 26, 1.00000000, 0.00000000, 220.00000000, 'open', '2025-11-17 13:08:01');

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
-- Estrutura para tabela `positions`
--

CREATE TABLE `positions` (
  `id` bigint NOT NULL,
  `owner_type` enum('user','org') DEFAULT 'user',
  `owner_id` bigint NOT NULL,
  `asset_id` bigint NOT NULL,
  `qty` decimal(24,8) NOT NULL DEFAULT '0.00000000'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Despejando dados para a tabela `positions`
--

INSERT INTO `positions` (`id`, `owner_type`, `owner_id`, `asset_id`, `qty`) VALUES
(21, 'user', 52, 19, 1.00000000),
(28, 'user', 9, 20, 1.00000000),
(29, 'user', 2, 20, 0.00000000),
(37, 'user', 17, 20, 0.00000000),
(39, 'user', 17, 19, 0.00000000),
(41, 'user', 52, 20, 0.00000000),
(62, 'user', 9, 22, 1.00000000),
(63, 'user', 2, 23, 1.00000000),
(64, 'user', 2, 24, 1.00000000),
(65, 'user', 57, 25, 1.00000000),
(66, 'user', 52, 26, 1.00000000);

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
-- Estrutura para tabela `special_asset_action_approvals`
--

CREATE TABLE `special_asset_action_approvals` (
  `id` bigint NOT NULL,
  `request_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `confirmed_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Despejando dados para a tabela `special_asset_action_approvals`
--

INSERT INTO `special_asset_action_approvals` (`id`, `request_id`, `user_id`, `confirmed_at`, `created_at`, `updated_at`) VALUES
(1, 5, 2, '2025-11-10 23:02:31', '2025-11-11 02:01:20', '2025-11-11 02:02:31'),
(3, 6, 2, '2025-11-10 23:59:07', '2025-11-11 02:55:26', '2025-11-11 02:59:07'),
(5, 7, 2, '2025-11-10 23:58:28', '2025-11-11 02:55:39', '2025-11-11 02:58:28'),
(7, 8, 2, '2025-11-10 23:58:17', '2025-11-11 02:56:05', '2025-11-11 02:58:17'),
(8, 8, 9, '2025-11-10 23:57:42', '2025-11-11 02:56:05', '2025-11-11 02:57:42'),
(19, 14, 2, '2025-11-11 00:02:32', '2025-11-11 03:02:25', '2025-11-11 03:02:32'),
(20, 15, 2, '2025-11-11 00:03:15', '2025-11-11 03:02:50', '2025-11-11 03:03:15'),
(21, 16, 2, '2025-11-11 00:03:15', '2025-11-11 03:02:59', '2025-11-11 03:03:15'),
(22, 17, 2, '2025-11-11 00:03:13', '2025-11-11 03:03:09', '2025-11-11 03:03:13'),
(23, 18, 2, '2025-11-11 00:03:55', '2025-11-11 03:03:51', '2025-11-11 03:03:55'),
(24, 19, 2, '2025-11-11 00:05:01', '2025-11-11 03:04:57', '2025-11-11 03:05:01'),
(26, 20, 2, NULL, '2025-11-11 03:24:42', '2025-11-11 03:24:42'),
(27, 20, 9, NULL, '2025-11-11 03:24:42', '2025-11-11 03:24:42'),
(28, 21, 2, NULL, '2025-11-11 03:25:46', '2025-11-11 03:25:46'),
(29, 21, 9, NULL, '2025-11-11 03:25:46', '2025-11-11 03:26:07'),
(30, 22, 9, NULL, '2025-11-11 03:26:37', '2025-11-11 03:27:06'),
(31, 22, 2, NULL, '2025-11-11 03:26:37', '2025-11-11 03:26:37'),
(32, 23, 2, '2025-11-11 08:40:12', '2025-11-11 11:31:28', '2025-11-11 11:40:12'),
(34, 24, 2, NULL, '2025-11-11 11:41:19', '2025-11-11 11:41:19'),
(36, 25, 2, '2025-11-12 11:14:21', '2025-11-11 18:21:14', '2025-11-12 14:14:21'),
(37, 25, 9, '2025-11-12 11:26:47', '2025-11-11 18:21:14', '2025-11-12 14:26:47'),
(38, 26, 2, '2025-11-11 15:22:24', '2025-11-11 18:21:49', '2025-11-11 18:22:24'),
(44, 29, 2, '2025-11-12 11:47:36', '2025-11-12 14:47:08', '2025-11-12 14:47:36'),
(45, 29, 9, '2025-11-12 11:47:26', '2025-11-12 14:47:08', '2025-11-12 14:47:26'),
(46, 30, 2, '2025-11-12 11:48:15', '2025-11-12 14:48:10', '2025-11-12 14:48:15'),
(47, 30, 9, '2025-11-12 11:48:30', '2025-11-12 14:48:10', '2025-11-12 14:48:30'),
(48, 31, 52, '2025-11-13 18:52:12', '2025-11-13 21:52:04', '2025-11-13 21:52:12'),
(49, 32, 2, '2025-11-14 08:19:48', '2025-11-14 11:19:40', '2025-11-14 11:19:48'),
(50, 32, 9, '2025-11-14 10:06:39', '2025-11-14 11:19:40', '2025-11-14 13:06:39'),
(51, 33, 2, NULL, '2025-11-14 13:48:30', '2025-11-14 13:57:50'),
(52, 33, 9, NULL, '2025-11-14 13:48:30', '2025-11-14 13:48:30'),
(53, 34, 18, '2025-11-14 11:18:48', '2025-11-14 14:18:28', '2025-11-14 14:18:48'),
(54, 34, 2, '2025-11-14 11:19:28', '2025-11-14 14:18:28', '2025-11-14 14:19:28'),
(55, 35, 57, '2025-11-14 18:49:45', '2025-11-14 21:49:16', '2025-11-14 21:49:45'),
(56, 36, 57, '2025-11-14 18:49:44', '2025-11-14 21:49:25', '2025-11-14 21:49:44'),
(57, 37, 2, NULL, '2025-11-15 18:51:47', '2025-11-15 19:09:03'),
(58, 37, 9, NULL, '2025-11-15 18:51:47', '2025-11-15 19:09:03'),
(59, 38, 59, '2025-11-17 06:47:25', '2025-11-17 09:46:49', '2025-11-17 09:47:25'),
(60, 39, 59, '2025-11-17 06:47:24', '2025-11-17 09:47:20', '2025-11-17 09:47:24');

-- --------------------------------------------------------

--
-- Estrutura para tabela `special_asset_action_requests`
--

CREATE TABLE `special_asset_action_requests` (
  `id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `asset` varchar(32) NOT NULL,
  `action` varchar(16) NOT NULL,
  `amount` decimal(24,8) NOT NULL,
  `total_brl` decimal(24,8) DEFAULT NULL,
  `counterparty_id` bigint DEFAULT NULL,
  `payload_json` json NOT NULL,
  `token` varchar(64) NOT NULL,
  `status` enum('pending','confirmed','executed','cancelled') NOT NULL DEFAULT 'pending',
  `last_error` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `confirmed_at` datetime DEFAULT NULL,
  `executed_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Despejando dados para a tabela `special_asset_action_requests`
--

INSERT INTO `special_asset_action_requests` (`id`, `user_id`, `asset`, `action`, `amount`, `total_brl`, `counterparty_id`, `payload_json`, `token`, `status`, `last_error`, `created_at`, `confirmed_at`, `executed_at`) VALUES
(1, 9, 'bitcoin', 'buy', 1.00000000, 1.00000000, 2, '{\"asset\": \"bitcoin\", \"action\": \"buy\", \"amount\": 1, \"total_brl\": 1, \"counterparty_id\": 2}', '598b867ba53c53e6027995476a934f2f', 'pending', NULL, '2025-11-11 01:32:50', NULL, NULL),
(2, 2, 'bitcoin', 'buy', 1.00000000, 3.00000000, 9, '{\"asset\": \"bitcoin\", \"action\": \"buy\", \"amount\": 1, \"total_brl\": 3, \"counterparty_id\": 9}', '160d22000e502ab25fa87af5025ab7e3', 'pending', NULL, '2025-11-11 01:35:04', NULL, NULL),
(4, 2, 'bitcoin', 'buy', 12.00000000, 12.00000000, 17, '{\"asset\": \"bitcoin\", \"action\": \"buy\", \"amount\": 12, \"total_brl\": 12, \"counterparty_id\": 17}', 'c0278613c2f1ab5c50b3fb936e40d72f', 'pending', NULL, '2025-11-11 01:38:33', NULL, NULL),
(5, 2, 'bitcoin', 'buy', 1.00000000, 1.00000000, 17, '{\"asset\": \"bitcoin\", \"action\": \"buy\", \"amount\": 1, \"total_brl\": 1, \"counterparty_id\": 17}', '74952447ee69d36197945a7be06ca137', 'executed', NULL, '2025-11-11 02:01:20', '2025-11-10 23:02:31', '2025-11-10 23:02:31'),
(6, 2, 'nft', 'buy', 1.00000000, 1000.00000000, 17, '{\"asset\": \"nft\", \"action\": \"buy\", \"amount\": 1, \"total_brl\": 1000, \"counterparty_id\": 17}', '5d19620d526bd2617e65453da9eb2e1a', 'executed', NULL, '2025-11-11 02:55:26', '2025-11-10 23:59:07', '2025-11-10 23:59:07'),
(7, 2, 'brl', 'buy', 1000.00000000, NULL, 17, '{\"asset\": \"brl\", \"action\": \"buy\", \"amount\": 1000, \"total_brl\": null, \"counterparty_id\": 17}', '2b905ad5b0e41e20c304a8e831fbab08', 'executed', NULL, '2025-11-11 02:55:39', '2025-11-10 23:58:28', '2025-11-10 23:58:28'),
(8, 2, 'quotas', 'buy', 1.00000000, 1.00000000, 9, '{\"asset\": \"quotas\", \"action\": \"buy\", \"amount\": 1, \"total_brl\": 1, \"counterparty_id\": 9}', '110deafdccef8a99e3860a634d1fc303', 'executed', NULL, '2025-11-11 02:56:05', '2025-11-10 23:58:17', '2025-11-10 23:58:17'),
(14, 2, 'bitcoin', 'deposit', 45.00000000, NULL, NULL, '{\"asset\": \"bitcoin\", \"action\": \"deposit\", \"amount\": 45, \"total_brl\": null, \"counterparty_id\": null}', '89323f03e89cb198a9b06d8c297e2860', 'executed', NULL, '2025-11-11 03:02:25', '2025-11-11 00:02:32', '2025-11-11 00:02:32'),
(15, 2, 'nft', 'deposit', 4.00000000, NULL, NULL, '{\"asset\": \"nft\", \"action\": \"deposit\", \"amount\": 4, \"total_brl\": null, \"counterparty_id\": null}', '1bca6d85dfdbb2401c40309f4596c3b2', 'executed', NULL, '2025-11-11 03:02:50', '2025-11-11 00:03:15', '2025-11-11 00:03:15'),
(16, 2, 'brl', 'deposit', 97000.00000000, NULL, NULL, '{\"asset\": \"brl\", \"action\": \"deposit\", \"amount\": 97000, \"total_brl\": null, \"counterparty_id\": null}', '567f51d114a9e560ef3baf5a3033bca0', 'executed', NULL, '2025-11-11 03:02:59', '2025-11-11 00:03:15', '2025-11-11 00:03:15'),
(17, 2, 'quotas', 'deposit', 70.00000000, NULL, NULL, '{\"asset\": \"quotas\", \"action\": \"deposit\", \"amount\": 70, \"total_brl\": null, \"counterparty_id\": null}', 'eee799d0ba0dbf98ba210ed9efcc10a8', 'executed', NULL, '2025-11-11 03:03:09', '2025-11-11 00:03:13', '2025-11-11 00:03:13'),
(18, 2, 'brl', 'deposit', 97246.00000000, NULL, NULL, '{\"asset\": \"brl\", \"action\": \"deposit\", \"amount\": 97246, \"total_brl\": null, \"counterparty_id\": null}', '19d57a6202b4fb10f132c7e0a18751c8', 'executed', NULL, '2025-11-11 03:03:51', '2025-11-11 00:03:55', '2025-11-11 00:03:55'),
(19, 2, 'nft', 'sell', 1.00000000, 92484.00000000, 17, '{\"asset\": \"nft\", \"action\": \"sell\", \"amount\": 1, \"total_brl\": 92484, \"counterparty_id\": 17}', '7e99db36a0f580b1ebe6fd3a70fc7e70', 'executed', NULL, '2025-11-11 03:04:57', '2025-11-11 00:05:09', '2025-11-11 00:05:09'),
(20, 2, 'bitcoin', 'buy', 1.00000000, 1.00000000, 9, '{\"asset\": \"bitcoin\", \"action\": \"buy\", \"amount\": 1, \"total_brl\": 1, \"counterparty_id\": 9}', 'b8ef061f2cc3e312e2f36d64e316846d', 'cancelled', NULL, '2025-11-11 03:24:42', NULL, NULL),
(21, 2, 'bitcoin', 'buy', 1.00000000, 1000.00000000, 9, '{\"asset\": \"bitcoin\", \"action\": \"buy\", \"amount\": 1, \"total_brl\": 1000, \"counterparty_id\": 9}', 'a5904414c7bdd26c809ac299dae6ccbb', 'cancelled', NULL, '2025-11-11 03:25:46', NULL, NULL),
(22, 9, 'bitcoin', 'sell', 36.00000000, 360.00000000, 2, '{\"asset\": \"bitcoin\", \"action\": \"sell\", \"amount\": 36, \"total_brl\": 360, \"counterparty_id\": 2}', '8fd7d74cba960aaa5d18bc32b39171b4', 'cancelled', NULL, '2025-11-11 03:26:37', NULL, NULL),
(23, 2, 'bitcoin', 'buy', 10.00000000, 1000.00000000, 17, '{\"asset\": \"bitcoin\", \"action\": \"buy\", \"amount\": 10, \"total_brl\": 1000, \"counterparty_id\": 17}', 'e86a362d5163f1bdc52e8accefc1eb43', 'executed', NULL, '2025-11-11 11:31:28', '2025-11-11 08:40:12', '2025-11-11 08:40:12'),
(24, 2, 'bitcoin', 'sell', 80.00000000, 800.00000000, 17, '{\"asset\": \"bitcoin\", \"action\": \"sell\", \"amount\": 80, \"total_brl\": 800, \"counterparty_id\": 17}', '3fb63226de4a0a9af4179ab6dcc9a263', 'cancelled', NULL, '2025-11-11 11:41:19', NULL, NULL),
(25, 2, 'bitcoin', 'buy', 1.00000000, 10.00000000, 9, '{\"asset\": \"bitcoin\", \"action\": \"buy\", \"amount\": 1, \"total_brl\": 10, \"counterparty_id\": 9}', 'fa04ff948de9af759fb9f9991d16ba0f', 'executed', NULL, '2025-11-11 18:21:14', '2025-11-12 11:26:47', '2025-11-12 11:26:47'),
(26, 2, 'bitcoin', 'buy', 4.00000000, 400.00000000, 17, '{\"asset\": \"bitcoin\", \"action\": \"buy\", \"amount\": 4, \"total_brl\": 400, \"counterparty_id\": 17}', '83821423a0aed1f26eb28392ef25ea0a', 'executed', NULL, '2025-11-11 18:21:49', '2025-11-11 15:22:24', '2025-11-11 15:22:24'),
(29, 2, 'bitcoin', 'sell', 10.00000000, 10.00000000, 9, '{\"asset\": \"bitcoin\", \"action\": \"sell\", \"amount\": 10, \"total_brl\": 10, \"counterparty_id\": 9}', '8963ec4ea4039f3fa5a94aa984b98990', 'executed', NULL, '2025-11-12 14:47:08', '2025-11-12 11:47:36', '2025-11-12 11:47:36'),
(30, 2, 'bitcoin', 'sell', 2.00000000, 4.00000000, 9, '{\"asset\": \"bitcoin\", \"action\": \"sell\", \"amount\": 2, \"total_brl\": 4, \"counterparty_id\": 9}', '8de3ac9e2fca5f85f2bdf895f6d4074a', 'executed', NULL, '2025-11-12 14:48:10', '2025-11-12 11:48:30', '2025-11-12 11:48:30'),
(31, 52, 'bitcoin', 'deposit', 10.00000000, NULL, NULL, '{\"asset\": \"bitcoin\", \"action\": \"deposit\", \"amount\": 10, \"total_brl\": null, \"counterparty_id\": null}', 'cb99aa5e38560dcc7c7404cbfbde0d1b', 'executed', NULL, '2025-11-13 21:52:04', '2025-11-13 18:52:12', '2025-11-13 18:52:12'),
(32, 2, 'bitcoin', 'buy', 1.00000000, 1.00000000, 9, '{\"asset\": \"bitcoin\", \"action\": \"buy\", \"amount\": 1, \"total_brl\": 1, \"counterparty_id\": 9}', '22392d5222121d2f5932c9fd81ef71d1', 'executed', NULL, '2025-11-14 11:19:40', '2025-11-14 10:06:39', '2025-11-14 10:06:39'),
(33, 2, 'bitcoin', 'sell', 1.00000000, 10.00000000, 9, '{\"asset\": \"bitcoin\", \"action\": \"sell\", \"amount\": 1, \"total_brl\": 10, \"counterparty_id\": 9}', '99cf16fc8701f4c00542befebd0e2dcb', 'cancelled', NULL, '2025-11-14 13:48:30', NULL, NULL),
(34, 18, 'bitcoin', 'sell', 1.00000000, 300.00000000, 2, '{\"asset\": \"bitcoin\", \"action\": \"sell\", \"amount\": 1, \"total_brl\": 300, \"counterparty_id\": 2}', 'c248bd191953c1de11c43b38875f3eff', 'executed', NULL, '2025-11-14 14:18:28', '2025-11-14 11:19:28', '2025-11-14 11:19:28'),
(35, 57, 'bitcoin', 'deposit', 100.00000000, NULL, NULL, '{\"asset\": \"bitcoin\", \"action\": \"deposit\", \"amount\": 100, \"total_brl\": null, \"counterparty_id\": null}', '488fbb67012fa86b59b5922015d6f576', 'executed', NULL, '2025-11-14 21:49:16', '2025-11-14 18:49:45', '2025-11-14 18:49:45'),
(36, 57, 'brl', 'deposit', 10000.00000000, NULL, NULL, '{\"asset\": \"brl\", \"action\": \"deposit\", \"amount\": 10000, \"total_brl\": null, \"counterparty_id\": null}', '740701d0b7c40c1a5aeccbbe888d7b25', 'executed', NULL, '2025-11-14 21:49:25', '2025-11-14 18:49:44', '2025-11-14 18:49:44'),
(37, 2, 'bitcoin', 'buy', 1.00000000, 11111111.00000000, 9, '{\"asset\": \"bitcoin\", \"action\": \"buy\", \"amount\": 1, \"total_brl\": 11111111, \"counterparty_id\": 9}', 'c446ea057889c945149e78a8c3f6a781', 'cancelled', NULL, '2025-11-15 18:51:47', NULL, NULL),
(38, 59, 'bitcoin', 'deposit', 100.00000000, NULL, NULL, '{\"asset\": \"bitcoin\", \"action\": \"deposit\", \"amount\": 100, \"total_brl\": null, \"counterparty_id\": null}', 'bfe8847cf53b0fc10937ec7932ee5a8d', 'executed', NULL, '2025-11-17 09:46:49', '2025-11-17 06:47:25', '2025-11-17 06:47:25'),
(39, 59, 'bitcoin', 'deposit', 100.00000000, NULL, NULL, '{\"asset\": \"bitcoin\", \"action\": \"deposit\", \"amount\": 100, \"total_brl\": null, \"counterparty_id\": null}', '45be755acac775a663f3d86b84269208', 'executed', NULL, '2025-11-17 09:47:20', '2025-11-17 06:47:24', '2025-11-17 06:47:24');

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
(2, 67.00000000, 2, 4000.00, 0.00000000, '2025-11-17 09:34:20'),
(9, 36.00000000, 6, 67.00, 5.00000000, '2025-11-17 09:24:22'),
(12, 11.00000000, 0, 2200.00, 0.00000000, '2025-11-16 01:06:08'),
(14, 5.00000000, 0, 2888.00, 0.00000000, '2025-11-16 01:06:08'),
(18, 5.00000000, 0, 200.00, 0.00000000, '2025-11-16 01:06:08'),
(48, 6.00000000, 0, 0.00, 0.00000000, '2025-11-16 01:06:08'),
(52, 10.00000000, 3, 5103.00, 0.00000000, '2025-11-17 09:32:10'),
(57, 100.00000000, 1, 11000.00, 0.00000000, '2025-11-17 09:30:56'),
(59, 200.00000000, 0, 0.00, 0.00000000, '2025-11-17 09:47:25');

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
(1, 2, '2025-11-16 00:37:54');

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

--
-- Despejando dados para a tabela `trades`
--

INSERT INTO `trades` (`id`, `buy_order_id`, `sell_order_id`, `qty`, `price`, `journal_id`, `created_at`) VALUES
(1, 10, 9, 1.00000000, 244.00000000, 10, '2025-11-14 13:51:21'),
(2, 6, 11, 1.00000000, 200.00000000, 11, '2025-11-14 13:53:15'),
(3, 8, 12, 1.00000000, 200.00000000, 12, '2025-11-14 13:54:11'),
(4, 13, 2, 1.00000000, 100.00000000, 13, '2025-11-14 13:54:34'),
(5, 15, 14, 1.00000000, 8.00000000, 14, '2025-11-14 13:55:46'),
(6, 17, 16, 1.00000000, 100.00000000, 17, '2025-11-14 14:11:07'),
(7, 19, 18, 1.00000000, 10.00000000, 18, '2025-11-14 14:12:02'),
(8, 21, 20, 1.00000000, 22.00000000, 19, '2025-11-14 14:58:31'),
(9, 23, 22, 1.00000000, 10000.00000000, 21, '2025-11-14 19:42:15'),
(10, 25, 24, 1.00000000, 75.00000000, 22, '2025-11-14 19:42:59'),
(11, 27, 26, 1.00000000, 120.00000000, 23, '2025-11-14 21:55:41'),
(12, 29, 28, 1.00000000, 1001.00000000, 24, '2025-11-15 19:06:44'),
(13, 31, 30, 1.00000000, 1.00000000, 25, '2025-11-15 19:09:49'),
(14, 33, 32, 1.00000000, 4.00000000, 26, '2025-11-15 19:10:41'),
(15, 35, 34, 1.00000000, 10.00000000, 27, '2025-11-15 19:20:28'),
(16, 37, 36, 1.00000000, 1.00000000, 29, '2025-11-15 19:22:40'),
(17, 39, 38, 1.00000000, 100.00000000, 30, '2025-11-15 19:33:18'),
(18, 41, 40, 1.00000000, 5000.00000000, 31, '2025-11-15 19:40:44'),
(19, 43, 42, 1.00000000, 20.00000000, 32, '2025-11-15 19:42:30'),
(20, 50, 49, 1.00000000, 4900.00000000, 33, '2025-11-15 19:51:05'),
(21, 60, 57, 1.00000000, 4.00000000, 34, '2025-11-16 00:40:34'),
(22, 63, 61, 1.00000000, 7.00000000, 35, '2025-11-16 00:41:34'),
(23, 65, 64, 1.00000000, 5000.00000000, 36, '2025-11-16 00:55:03'),
(24, 67, 66, 1.00000000, 1000.00000000, 37, '2025-11-16 16:09:52');

-- --------------------------------------------------------

--
-- Estrutura para tabela `users`
--

CREATE TABLE `users` (
  `id` bigint NOT NULL,
  `name` varchar(120) NOT NULL,
  `email` varchar(160) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `confirmed` tinyint DEFAULT '0',
  `is_admin` tinyint DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Despejando dados para a tabela `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `created_at`, `confirmed`, `is_admin`) VALUES
(1, 'Demo', 'demo@artx', 'x', '2025-10-29 02:32:49', 0, 0),
(2, 'aqyo', 'aquinomartins.art@gmail.com', '$2y$10$xEl6WrRLdyKfBu17dW7IKe8.hxKsoeXCInt32i/LytJqzYi6RfvQ2', '2025-10-29 02:48:49', 1, 1),
(3, 'maria', 'mariaaqui@gmail.com', '$2y$10$4.QM2P615hITRzV2rdyr/.WP5hInaKL1YYOflglVR.xnApKy8VxZu', '2025-10-29 02:56:54', 0, 0),
(9, 'martys', 'alvorascapital@gmail.com', '$2y$10$0up.acQQw4X1HU9DkTQXduL2sMQtP.mua8qNjr0FRagssFEyK5yzK', '2025-10-29 04:05:08', 1, 0),
(11, 'Abr3', 'tra32@gmail.com', '$2y$10$OPBtznx/VSh9C9ml/6edXOC5UE5lPf33s.YpFIFO0ZrP7S1W2F9C.', '2025-11-02 21:06:54', 0, 0),
(12, 'Ines ABN', 'ines.abn@gmail.com', '$2y$10$WBw6SD.yGF0YGpEqqAl8.uECd7KN./n2TPRqScojNtPpUNi1uguiG', '2025-11-03 13:16:18', 1, 0),
(13, 'Neide', 'neideals0809@gmail.com', '$2y$10$9MRwCY/GDcfhfYpVgiP6oePv0f/9SZdimW.ZXLSFcTmmogAUdqGRW', '2025-11-03 14:14:50', 0, 0),
(14, 'abraao', 'contasala770@gmail.com', '$2y$10$.IEOdrh5uUH2lRzieILXVOHp4hLBY14wBgHGLiVjbGDpjzcl33Skm', '2025-11-04 01:41:40', 1, 0),
(18, 'Giulia', 'giuliacacaes2@gmail.com', '$2y$10$gqKf3H8k6wZnXnSp7hNUpuJF7ssdjDMCxfSvjC2vQUJdtjNjeVF4a', '2025-11-07 14:37:42', 1, 0),
(48, 'Davi', 'davifigueira126@gmail.com', '$2y$10$lmJmdHwdFgvPK.TMPJmHAuDGhXiHG2WBT1JPRA3ZQO6479Asav3b.', '2025-11-07 16:47:25', 1, 0),
(49, 'Lucas Cacaes', 'lucascacaes@gmail.com', '$2y$10$.idO9xe7xD6HHPMTWSdo8Op2xlgTAfjSi3U/J0UMwwxvNRWIeI7C2', '2025-11-07 16:49:26', 0, 0),
(50, 'Paloma', 'palomaamorimdasilva01@gmail.com', '$2y$10$OqinaKDsAlagg1uorNE2xeruNOvvsgi3hSvuMLesbpNAwJYlMoZdS', '2025-11-12 22:22:40', 0, 0),
(52, 'Sistema Ilustrativo', 'illustrationsystem@gmail.com', '$2y$10$qINg2.pqiDtlsB1apcvaUu4eZRdHV07ibo62cvoF65MCmJ3imsreW', '2025-11-13 21:50:40', 1, 0),
(53, 'Arthur', 'artuzinhuunai123@gmail.com', '$2y$10$2vdUAbfFc8Jsj.QmmzjEWuQ3OiHFsdxfDkQjg/eNERjxFpeguE4xi', '2025-11-14 11:21:51', 0, 0),
(54, 'Maria', 'mariaaquinoamorimmartins@gmail.com', '$2y$10$g5goMtwMKIhG8hMe30ylyuiEv0eViVin3xXIhSw9mL5iiq6yExMm6', '2025-11-14 21:35:55', 0, 0),
(57, 'DESENHO', 'desenho.art.br@gmail.com', '$2y$10$bin7L4CKW7z3AbYtATU9XOcCTb78B8rAJro26VVP7RsxfFH0RBDvS', '2025-11-14 21:47:41', 1, 0),
(58, 'MinasPADRÃO', 'minaspadrao@outlook.com', '$2y$10$GuvYmQ1nWxxjH0px25B3FeBT4jvVYNXQfBVikuprU/Q8G0.mvuB4u', '2025-11-15 21:19:19', 0, 0),
(59, 'GEMNIO 2025', 'gemnio.com.br@gmail.com', '$2y$10$2dQAv9x/A9sZCB.g13IoEOElfcN/el5xcfrki.Fvl6ITQ5XIWXL1.', '2025-11-17 09:45:09', 1, 0),
(60, 'João Marcelo Marques Cunha', 'joaomarcelo2008@gmail.com', '$2y$10$0qqiwbI6/.6QAxGdCY4Xr.EYyCglFpabgEX/T0ISFFM9C8gnxiHSG', '2025-11-17 13:15:33', 1, 0);

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
(10, 49, '8402d200157f9065883fed3d7b33f527', '2025-11-07 16:49:26'),
(11, 50, 'dfb0a635e842dab35b350801c2733c81', '2025-11-12 22:22:40'),
(12, 51, 'a0aa4ca1aed56d0123407e4ce652a668', '2025-11-13 20:38:39'),
(14, 53, 'd41ab3c597837dc7e0379680a7ce3577', '2025-11-14 11:21:51'),
(15, 54, '7087959d888ce37e830b809884e543cd', '2025-11-14 21:35:55'),
(17, 58, 'fba6605384652c29c8d375da47cb1512', '2025-11-15 21:19:19');

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
-- Despejando dados para a tabela `works`
--

INSERT INTO `works` (`id`, `asset_instance_id`, `title`, `artist_id`, `specs_json`, `created_at`) VALUES
(19, 19, 'Floresta Doré', 52, '{\"description\": \"Gravura\\r\\nAutor: Gustave Doré\"}', '2025-11-14 14:10:03'),
(20, 20, 'Vanitas', 9, '{\"description\": \"Caveira\"}', '2025-11-14 19:41:34'),
(22, 22, 'Floresta', 9, '{\"description\": \"Óleo sobre tela, 2025\\r\\nAutora: Valentina\"}', '2025-11-17 09:24:22'),
(23, 23, 'Tuba', 2, '{\"description\": \"Óleo sobre tela, 2025.\\r\\nAutora: Júlia\"}', '2025-11-17 09:25:29'),
(24, 24, 'Cristo Crucificado', 2, '{\"description\": \"Estudo de Cristo Crucificado de Francisco Pacheco e Velázquez\\r\\nAutor: Fernando Aquino Martins\"}', '2025-11-17 09:27:20'),
(25, 25, 'Cachos Negros', 57, '{\"description\": \"Óleo sobre Tela\\r\\nAutora: Diana\"}', '2025-11-17 09:30:56'),
(26, 26, 'Lula Gigante', 52, '{\"description\": \"Óleo sobre Tela\\r\\nAutor: Morian\"}', '2025-11-17 09:32:10');

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
  ADD KEY `idx_offers_kind` (`kind`),
  ADD KEY `offers_ibfk_1` (`seller_id`),
  ADD KEY `offers_ibfk_2` (`asset_instance_id`);

--
-- Índices de tabela `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

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
-- Índices de tabela `special_asset_action_approvals`
--
ALTER TABLE `special_asset_action_approvals`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_request_user` (`request_id`,`user_id`),
  ADD KEY `fk_special_asset_action_user` (`user_id`);

--
-- Índices de tabela `special_asset_action_requests`
--
ALTER TABLE `special_asset_action_requests`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `token` (`token`),
  ADD KEY `user_id` (`user_id`);

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
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=88;

--
-- AUTO_INCREMENT de tabela `assets`
--
ALTER TABLE `assets`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT de tabela `asset_instances`
--
ALTER TABLE `asset_instances`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT de tabela `asset_moves`
--
ALTER TABLE `asset_moves`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=43;

--
-- AUTO_INCREMENT de tabela `auctions`
--
ALTER TABLE `auctions`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

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
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=49;

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
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=43;

--
-- AUTO_INCREMENT de tabela `offers`
--
ALTER TABLE `offers`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `orders`
--
ALTER TABLE `orders`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=70;

--
-- AUTO_INCREMENT de tabela `pending_transactions`
--
ALTER TABLE `pending_transactions`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `positions`
--
ALTER TABLE `positions`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=67;

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
-- AUTO_INCREMENT de tabela `special_asset_action_approvals`
--
ALTER TABLE `special_asset_action_approvals`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=61;

--
-- AUTO_INCREMENT de tabela `special_asset_action_requests`
--
ALTER TABLE `special_asset_action_requests`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=40;

--
-- AUTO_INCREMENT de tabela `trades`
--
ALTER TABLE `trades`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT de tabela `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=61;

--
-- AUTO_INCREMENT de tabela `user_confirmations`
--
ALTER TABLE `user_confirmations`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT de tabela `works`
--
ALTER TABLE `works`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

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
-- Restrições para tabelas `offers`
--
ALTER TABLE `offers`
  ADD CONSTRAINT `offers_ibfk_1` FOREIGN KEY (`seller_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `offers_ibfk_2` FOREIGN KEY (`asset_instance_id`) REFERENCES `asset_instances` (`id`);

--
-- Restrições para tabelas `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

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
-- Restrições para tabelas `special_asset_action_approvals`
--
ALTER TABLE `special_asset_action_approvals`
  ADD CONSTRAINT `fk_special_asset_action_request` FOREIGN KEY (`request_id`) REFERENCES `special_asset_action_requests` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_special_asset_action_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `special_asset_action_requests`
--
ALTER TABLE `special_asset_action_requests`
  ADD CONSTRAINT `special_asset_action_requests_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

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
