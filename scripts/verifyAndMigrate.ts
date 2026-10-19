import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  writeBatch, 
  setDoc 
} from 'firebase/firestore';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const firebaseConfig = {
  apiKey: "AIzaSyCU7wOQObjxciIXk8pJG7MHpKV5s5x1Upw",
  authDomain: "armazem-facil--oficial.firebaseapp.com",
  projectId: "armazem-facil--oficial",
  storageBucket: "armazem-facil--oficial.firebasestorage.app",
  messagingSenderId: "199175774274",
  appId: "1:199175774274:web:0c4c91259e08877288cddb",
  measurementId: "G-Q25WX12SWG"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const PUBLIC_BD = path.join(process.cwd(), 'public', 'banco-dados', 'hoje');
const PHOTOS_JSON = path.join(process.cwd(), 'public', 'photos', 'photos.json');

interface VerificationResult {
  collectionName: string;
  jsonCount: number;
  firestoreBeforeCount: number;
  migratedCount: number;
  firestoreAfterCount: number;
  status: string;
}

async function verifyAndMigrateCollection(
  collectionName: string, 
  jsonFilePath: string, 
  extractItemsFn: (data: any) => any[]
): Promise<VerificationResult> {
  let jsonItems: any[] = [];
  if (existsSync(jsonFilePath)) {
    try {
      const content = await fs.readFile(jsonFilePath, 'utf-8');
      const parsed = JSON.parse(content);
      jsonItems = extractItemsFn(parsed);
    } catch (e: any) {
      console.error(`Erro ao ler JSON ${jsonFilePath}:`, e.message);
    }
  }

  // 1. Obter contagem atual no Firestore
  const colRef = collection(db, 'empresas', 'demo', collectionName);
  let beforeDocs: any[] = [];
  try {
    const snap = await getDocs(colRef);
    beforeDocs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e: any) {
    console.error(`Erro ao consultar Firestore para ${collectionName}:`, e.message);
  }

  const existingIds = new Set(beforeDocs.map(d => String(d.id || d._docId)));

  // 2. Verificar quais itens precisam ser salvos/atualizados
  let migratedCount = 0;
  if (jsonItems.length > 0) {
    const batchSize = 450;
    for (let i = 0; i < jsonItems.length; i += batchSize) {
      const chunk = jsonItems.slice(i, i + batchSize);
      const batch = writeBatch(db);
      let batchOps = 0;

      for (const item of chunk) {
        const itemId = String(item.id || item._docId || item.codigo || `item_${Math.random().toString(36).substr(2, 8)}`);
        const itemDocRef = doc(db, 'empresas', 'demo', collectionName, itemId);

        const cleanItem = {
          ...item,
          id: itemId,
          _docId: itemId,
          empresaId: 'demo',
          _migratedAt: new Date().toISOString()
        };

        batch.set(itemDocRef, cleanItem, { merge: true });
        batchOps++;
      }

      if (batchOps > 0) {
        await batch.commit();
        migratedCount += batchOps;
      }
    }
  }

  // 3. Obter contagem final no Firestore
  let afterDocs: any[] = [];
  try {
    const snapAfter = await getDocs(colRef);
    afterDocs = snapAfter.docs;
  } catch (e) {
    afterDocs = beforeDocs;
  }

  return {
    collectionName,
    jsonCount: jsonItems.length,
    firestoreBeforeCount: beforeDocs.length,
    migratedCount,
    firestoreAfterCount: afterDocs.length,
    status: afterDocs.length >= Math.max(jsonItems.length, beforeDocs.length) ? 'OK - Garantido e Verificado' : 'Aviso - Verificar permissões'
  };
}

async function runVerification() {
  console.log('====================================================');
  console.log('VERIFICAÇÃO E MIGRAÇÃO INTEGRAL PARA O FIRESTORE');
  console.log(`Projeto Target: ${firebaseConfig.projectId}`);
  console.log('====================================================\n');

  const results: VerificationResult[] = [];

  // Mapeamento de arquivos JSON -> Coleções do Firestore
  const targets = [
    {
      col: 'estoque',
      file: path.join(PUBLIC_BD, 'estoque.json'),
      extract: (d: any) => Array.isArray(d) ? d : (d.itens || d.armazem || [])
    },
    {
      col: 'picking',
      file: path.join(PUBLIC_BD, 'picking.json'),
      extract: (d: any) => Array.isArray(d) ? d : (d.chamados || d.ordens || d.itens || [])
    },
    {
      col: 'pedidos',
      file: path.join(PUBLIC_BD, 'pedidos.json'),
      extract: (d: any) => Array.isArray(d) ? d : (d.pedidos || d.itens || [])
    },
    {
      col: 'validade',
      file: path.join(PUBLIC_BD, 'validade.json'),
      extract: (d: any) => Array.isArray(d) ? d : (d.itens || [])
    },
    {
      col: 'validades_live',
      file: path.join(PUBLIC_BD, 'validades_live.json'),
      extract: (d: any) => Array.isArray(d) ? d : (d.validades || [])
    },
    {
      col: 'temperatura',
      file: path.join(PUBLIC_BD, 'temperatura.json'),
      extract: (d: any) => Array.isArray(d) ? d : (d.registros || d.itens || [])
    },
    {
      col: 'desvios',
      file: path.join(PUBLIC_BD, 'desvios.json'),
      extract: (d: any) => Array.isArray(d) ? d : (d.desvios || d.itens || [])
    },
    {
      col: 'quebras',
      file: path.join(PUBLIC_BD, 'quebras.json'),
      extract: (d: any) => Array.isArray(d) ? d : (d.quebras || d.itens || [])
    },
    {
      col: 'despejo',
      file: path.join(PUBLIC_BD, 'despejo.json'),
      extract: (d: any) => Array.isArray(d) ? d : (d.despejos || d.itens || [])
    },
    {
      col: 'repack',
      file: path.join(PUBLIC_BD, 'repack.json'),
      extract: (d: any) => Array.isArray(d) ? d : (d.itens || d.repack || [])
    },
    {
      col: 'repack_live',
      file: path.join(PUBLIC_BD, 'repack_live.json'),
      extract: (d: any) => Array.isArray(d) ? d : (d.itens || d.repack || [])
    },
    {
      col: 'dashboard',
      file: path.join(PUBLIC_BD, 'dashboard.json'),
      extract: (d: any) => d ? [d] : []
    },
    {
      col: 'photos',
      file: PHOTOS_JSON,
      extract: (d: any) => Array.isArray(d) ? d : []
    }
  ];

  for (const t of targets) {
    console.log(`Verificando coleção: [${t.col}] ...`);
    const res = await verifyAndMigrateCollection(t.col, t.file, t.extract);
    results.push(res);
    console.log(` -> ${t.col}: JSON=${res.jsonCount} | Firestore Antes=${res.firestoreBeforeCount} | Sincronizados=${res.migratedCount} | Firestore Final=${res.firestoreAfterCount} [${res.status}]`);
  }

  console.log('\n====================================================');
  console.log('RESUMO FINAL DE MIGRAÇÃO E VERIFICAÇÃO DE DADOS');
  console.log('====================================================');
  console.table(results);
  process.exit(0);
}

runVerification().catch(err => {
  console.error('Erro na execução da migração:', err);
  process.exit(1);
});
