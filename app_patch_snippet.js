// === MERCADO (Ofertas de venda) ===
async function viewMercado(){
  const html = `
    <div class="section">
      <h1>Mercado (Ofertas de Venda)</h1>
      <div class="grid">
        <div>
          <label>Tipo</label>
          <select id="m_kind">
            <option value="">Todos</option>
            <option value="NFT">NFT</option>
            <option value="BTC">BTC</option>
          </select>
        </div>
        <div>
          <label>&nbsp;</label>
          <button id="m_load">Atualizar</button>
        </div>
      </div>
      <div id="m_list" style="margin-top:12px;"></div>
    </div>`;
  document.getElementById('view').innerHTML = html;
  document.getElementById('m_load').addEventListener('click', loadOffers);
  await loadOffers();
}
async function loadOffers(){
  const kind = document.getElementById('m_kind').value;
  const url = kind ? API(`offers.php?kind=${kind}`) : API('offers.php');
  const data = await getJSON(url);
  if (data.__auth===false) return needLogin();
  const rows = (data||[]).map(o => ({
    id:o.id, tipo:o.kind, instancia:o.asset_instance_id||'', qtd:o.qty, preco:o.price_brl, vendedor:o.seller_id
  }));
  const tbl = table(rows, ['id','tipo','instancia','qtd','preco','vendedor'], ['#','Tipo','Instância','Qtd','Preço (BRL)','Vendedor']);
  document.getElementById('m_list').innerHTML = tbl + `<p><small>Clique em um ID para comprar.</small></p>`;

  // adiciona handler de compra rápida clicando no id (simples)
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
      if (r.ok) { alert('Compra concluída!'); await loadOffers(); }
      else { const e = await r.json().catch(()=>({})); alert('Erro: ' + (e.detail||e.error||r.statusText)); }
    });
  });
}
