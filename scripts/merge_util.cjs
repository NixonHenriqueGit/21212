const fs = require('fs');
const path = require('path');

// Helper to normalize and add
function mergeDataset(newItems) {
  const officialFile = path.join(__dirname, '..', 'src', 'data', 'quebrasOfficialDataset.json');
  let dataset = [];
  if (fs.existsSync(officialFile)) {
    dataset = JSON.parse(fs.readFileSync(officialFile, 'utf-8'));
  }
  
  const existingKeys = new Set(dataset.map(item => {
    const data = item.dataISO || item.data || item.Data || '';
    const cod = item.codProduto || item.CodProduto || '';
    const colab = item.colaborador || item.colaboradorQuebrou || item.Colaborador || '';
    const area = item.area || item.Area || '';
    const qtd = item.quantidade || item.Quantidade || 0;
    const codQ = item.codQuebra || item.CodQuebra || '';
    const mot = item.motivo || item.Motivo || '';
    return `${data}_${cod}_${colab}_${area}_${qtd}_${codQ}_${mot}`.trim().toLowerCase();
  }));

  let added = 0;
  for (const raw of newItems) {
    const data = raw.dataISO || raw.data || raw.Data || '';
    const cod = raw.codProduto || raw.CodProduto || '';
    const colab = raw.colaborador || raw.colaboradorQuebrou || raw.Colaborador || '';
    const area = raw.area || raw.Area || '';
    const qtd = raw.quantidade || raw.Quantidade || 0;
    const codQ = raw.codQuebra || raw.CodQuebra || '';
    const mot = raw.motivo || raw.Motivo || '';
    const key = `${data}_${cod}_${colab}_${area}_${qtd}_${codQ}_${mot}`.trim().toLowerCase();

    if (!existingKeys.has(key)) {
      dataset.push(raw);
      existingKeys.add(key);
      added++;
    }
  }

  fs.writeFileSync(officialFile, JSON.stringify(dataset, null, 2), 'utf-8');
  console.log(`Merged ${added} new records into quebrasOfficialDataset.json. Total count: ${dataset.length}`);
}

module.exports = { mergeDataset };
