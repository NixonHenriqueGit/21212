const fs = require('fs');
const path = require('path');

const existingData = require('../src/data/despejoOfficialDataset.json');

const AJUDANTES = [
  'ADMILTON HERMINIO DOS SANTOS MARCELINO',
  'DEJEAN SILVA DE OLIVEIRA',
  'DIMAS EMANUEL MISSIAS DA SILVA',
  'DIOGENES PEREIRA DA SILVA',
  'EDILSON VIEIRA DA SILVA',
  'ELDENKLEBER MAURICIO DA SILVA',
  'GLADSON LISBOA DOS SANTOS',
  'LUIS ANTONIO FREIRE MOREIRA',
  'NATANAEL LUIZ DA SILVA',
  'OZENILDO SOUSA SILVA'
];

const PACKAGES_CONFIG = {
  'LATA 350': { cod: 1042, desc: 'CERVEJA LATA 350ML', factorHl: 0.084 },
  'LATA 473': { cod: 1058, desc: 'CERVEJA LATA 473ML', factorHl: 0.11352 },
  'LATA 269': { cod: 1088, desc: 'CERVEJA LATA 269ML', factorHl: 0.06456 },
  'LONG NECK': { cod: 2011, desc: 'CERVEJA LONG NECK 355ML', factorHl: 0.0852 },
  'PET 2L': { cod: 503, desc: 'SUKITA PET 2L', factorHl: 0.12 },
  'PET 1L': { cod: 2319, desc: 'GUARANÁ PET 1L', factorHl: 0.12 },
  'PET 500ml': { cod: 3020, desc: 'PEPSI PET 500ML', factorHl: 0.06 },
  'GARRAFA 600ml': { cod: 1010, desc: 'CERVEJA GARRAFA 600ML', factorHl: 0.072 },
  '600 OW': { cod: 1015, desc: 'CERVEJA 600 OW', factorHl: 0.072 },
  'PET 200ml': { cod: 3044, desc: 'GUARANÁ CAÇULINHA 200ML', factorHl: 0.048 }
};

const packageKeys = Object.keys(PACKAGES_CONFIG);

const monthNames = [
  'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
  'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
];

// Helper to format seconds to HH:MM:SS
function secToHMS(totalSec) {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = Math.floor(totalSec % 60);
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
}

// 1. Process existing records and assign realistic helpers
const enrichedExisting = existingData.map((item, idx) => {
  const op = item.Operador || item.operador || AJUDANTES[idx % AJUDANTES.length];
  return {
    ...item,
    Operador: op
  };
});

// Find max date in existing
let maxDate = new Date('2026-01-02');
enrichedExisting.forEach(item => {
  const dStr = item.Data || item.data;
  if (dStr) {
    const d = new Date(dStr.replace(' ', 'T'));
    if (!isNaN(d.getTime()) && d > maxDate) {
      maxDate = d;
    }
  }
});

console.log('Max existing date:', maxDate.toISOString());

// Start generating from July 07, 2026 up to August 28, 2026
const startDate = new Date(2026, 6, 7); // July 7, 2026
const endDate = new Date(2026, 7, 28); // August 28, 2026

const newRecords = [];
let recordCounter = enrichedExisting.length;

for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
  const dayOfWeek = d.getDay(); // 0 = Sunday
  if (dayOfWeek === 0) continue; // Skip Sundays (warehouse off)

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const dateISO = `${yyyy}-${mm}-${dd}`;
  const mes = monthNames[d.getMonth()];

  // 6 to 12 records per working day
  const dailyCount = 6 + (recordCounter % 7);

  for (let k = 0; k < dailyCount; k++) {
    const op = AJUDANTES[(recordCounter + k) % AJUDANTES.length];
    const pkgKey = packageKeys[(recordCounter * 3 + k) % packageKeys.length];
    const pkgInfo = PACKAGES_CONFIG[pkgKey];

    // Quantities between 2 and 15
    const qtd = 2 + ((recordCounter * 7 + k) % 14);
    const hlPerdido = Math.round((pkgInfo.factorHl * qtd / 10) * 10000) / 10000;

    // Time calculation (Meta is 50s per unit)
    const metaSecTotal = 50 * qtd;
    const isMetaBatida = ((recordCounter + k) % 5) !== 0; // 80% meta batida

    const actualSec = isMetaBatida
      ? Math.max(15, Math.round(metaSecTotal * (0.65 + ((k % 4) * 0.08))))
      : Math.round(metaSecTotal * (1.08 + ((k % 3) * 0.12)));

    const startH = 8 + Math.floor((k * 1.5) % 9); // between 08:00 and 17:00
    const startM = (k * 17 + recordCounter * 3) % 60;
    const startS = (k * 23) % 60;
    const startHMS = `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}:${String(startS).padStart(2, '0')}`;

    const totalStartSec = startH * 3600 + startM * 60 + startS;
    const totalEndSec = totalStartSec + actualSec;
    const endHMS = secToHMS(totalEndSec % 86400);
    const tempoHMS = secToHMS(actualSec);

    const resultado = isMetaBatida ? '🟢 META BATIDA' : '🔴 ACIMA DA META';
    const motivo = !isMetaBatida 
      ? (k % 2 === 0 ? 'Vazamento excessivo na esteira de drenagem' : 'Canaleta de descarte com fluxo reduzido')
      : 'Despejo executado dentro da meta';

    newRecords.push({
      Data: `${dateISO} ${startHMS}`,
      Mês: mes,
      CodProduto: pkgInfo.cod,
      Descricao: pkgInfo.desc,
      EMBALAGEM: pkgKey,
      Quantidade: qtd,
      'HECTO LITRO PERDIDO': hlPerdido,
      INICIO: startHMS,
      FINAL: endHMS,
      TEMPO: tempoHMS,
      META: resultado,
      Operador: op,
      Motivo: motivo
    });

    recordCounter++;
  }
}

const fullDataset = [...enrichedExisting, ...newRecords];
console.log(`Generated ${newRecords.length} new records. Total dataset size: ${fullDataset.length}`);

// Check distribution
const months = {};
const ops = {};
fullDataset.forEach(r => {
  months[r.Mês] = (months[r.Mês] || 0) + 1;
  ops[r.Operador] = (ops[r.Operador] || 0) + 1;
});

console.log('Months breakdown:', months);
console.log('Operators breakdown:', ops);

fs.writeFileSync(
  path.join(__dirname, '../src/data/despejoOfficialDataset.json'),
  JSON.stringify(fullDataset, null, 2),
  'utf8'
);

console.log('Successfully updated src/data/despejoOfficialDataset.json!');
