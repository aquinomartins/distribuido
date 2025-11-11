# Trading Add-on (multiusuário + P2P)

Este pacote adiciona:
- Registro de usuários com contas padrão (BRL/BTC/inventário).
- API de ordens (buy/sell) com *matching* simples e liquidação contábil.
- Listagem de trades.

## Instalação (em public_html/)
1) Envie os arquivos de **lib/** e **api/** deste pacote e mantenha os existentes do projeto.
   - lib/util.php (novo)
   - api/register.php (novo)
   - api/orders.php (novo)
   - api/trades.php (novo)
2) Nada a alterar no schema (já temos orders/trades).

## Fluxo
- `POST /api/register.php` {name,email,password} → cria usuário + contas.
- `POST /auth/login.php` {email,password} → sessão.
- `POST /api/orders.php` {side, asset_id|asset_instance_id, qty, price} → cria ordem e tenta casar imediatamente.
- `GET /api/orders.php?asset_id=...` → livro simples.
- `GET /api/trades.php?asset_id=...` → últimos trades.

## Observações
- A liquidação usa BRL em `accounts(purpose='cash')` por padrão; ajuste se quiser BTC.
- Para NFTs (`asset_instance_id`), o *asset_move* transfere a instância única entre inventários.
- Para cotas (`asset_id`), o *asset_move* usa `qty` fungível.
