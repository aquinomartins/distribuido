Marketplace (manual) — Add-on
================================

Recursos:
- Ofertas de venda (NFT ou BTC) em BRL (sem automação de matching).
- Listagem pública das ofertas abertas.
- Compra manual de uma oferta específica.
- Mint de NFT de teste para facilitar demos.

Arquivos:
- schema_offers.sql            (criar tabela offers)
- lib/util.php                 (ensure_user_accounts)
- api/offers.php               (GET lista / POST cria oferta)
- api/buy_offer.php            (POST compra oferta por ID)
- api/mint_test_nft.php        (POST cria NFT demo para usuário logado)
- app_patch_snippet.js         (funções JS para o front: viewMercado/loadOffers)

Passos:
1) Importe 'schema_offers.sql' no phpMyAdmin.
2) Envie os arquivos para public_html.
3) No front, adicione um item de menu que chame 'viewMercado()'.
4) (Opcional) usar 'mint_test_nft.php' para criar um NFT rapidamente.

Notas:
- Liquidação: BRL (cash) do comprador -> vendedor; NFT/BTC transferido para comprador.
- Nenhum matching automático é executado.
