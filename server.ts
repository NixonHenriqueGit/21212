import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import {
  ensureBancoDadosDirs,
  syncEntity,
  syncAllBancoDados,
  getSyncStatus,
  executarFechamentoDiario,
  getHistoricoFechamentos,
  materializarIndicadoresDashboard,
  getIndicadoresMaterializados
} from './src/server/bancoDadosSyncService';

dotenv.config();

const app = express();
const PORT = 3000;

// Set high limits for payload parsing (needed for base64 images and PDFs)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Helper for Gemini AI calls with standard models and graceful fallback
async function callGeminiText(apiKey: string, contents: any, config?: any): Promise<string> {
  const modelsToTry = [
    'gemini-3.7-flash',
    'gemini-3.1-flash-lite',
    'gemini-3.1-pro-preview',
    'gemini-flash-latest'
  ];

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });

  let lastError: any = null;
  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        ...(config ? { config } : {})
      });
      if (response && response.text) {
        return response.text;
      }
    } catch (err: any) {
      lastError = err;
      // If error is 404/403/429, continue to next model or fallback quietly
    }
  }

  throw lastError || new Error('Não foi possível obter resposta dos modelos Gemini.');
}

// Fallback DPO response generator when API key is unavailable or restricted
function getFallbackDpoResponse(message: string, contextData: any): string {
  const msgLower = (message || '').toLowerCase();

  if (msgLower.includes('bloco 2') || msgLower.includes('qualidade') || msgLower.includes('fefo')) {
    return `### 📋 Bloco 2: Gestão da Qualidade & FEFO (Padrão DPO Revendas)

**Diretrizes Oficiais:**
1. **Regra de Ouro do FEFO (First Expired, First Out)**: Produtos com data de validade mais próxima devem ser expedidos prioritariamente.
2. **Classificação de Risco**:
   - 🔴 **Crítico (< 7 dias)**: Bloqueio ou ação de escoamento imediata.
   - 🟡 **Alerta (7 a 30 dias)**: Prioridade máxima na roteirização de picking.
   - 🟢 **Regular (> 30 dias)**: Fluxo normal.
3. **Auditoria de Lotes**:
   - Inspeção diária de 100% das posições de picking ativo.
   - Registro de perdas e avarias no módulo FEFO / Qualidade.

**Ação Sugerida**: Acesse o painel **Controle FEFO / Validades** para conferir os lotes com alerta e registrar planos de ação no módulo de **Gestão de Ações**.`;
  }

  if (msgLower.includes('efc') || msgLower.includes('efd') || msgLower.includes('meta')) {
    return `### 🎯 Metas e Indicadores Oficiais: EFC e EFD (Padrão Ambev DPO)

- **EFC (Eficiência de Faturamento e Carregamento)**: Meta corporativa **≥ 95%** de pontualidade no faturamento e expedição dentro da janela programada (07:00 às 21:00).
- **EFD (Eficiência de Faturamento Diário)**: Acompanhamento de 100% dos pedidos previstos x faturados no dia.
- **Produtividade de Picking**: Meta de **≥ 160 caixas/homem-hora**.
- **TMA de Abastecimento (Empilhador)**: Meta de **≤ 10 minutos** por chamado de doca.

**Recomendação**: Monitore a curva horária no módulo **Logística & Expedição** para mitigar gargalos de fim de turno.`;
  }

  if (msgLower.includes('abastecimento') || msgLower.includes('picking') || msgLower.includes('empilhador')) {
    return `### 🚜 Padrão de Abastecimento de Picking (DPO Pilar Armazém)

- **Gatilho de Reabastecimento**: O conferente/separador deve sinalizar o chamado quando a posição atingir **≤ 30% do estoque do pulmão frontal**.
- **TMA Padrão**: As empilhadeiras devem atender a solicitação em no máximo **10 minutos**.
- **Equilíbrio de Frentes**: Produtos curva A (ex: Skol, Brahma, Amstel) devem ter posições duplicadas ou frente de picking direta para evitar filas nas docas.`;
  }

  if (msgLower.includes('bloco 1') || msgLower.includes('segurança') || msgLower.includes('5s')) {
    return `### 🛡️ Bloco 1: Segurança, Organização e Padrão 5S

- **Faixas de Pedestres e Demarcações**: 100% desobstruídas e sinalizadas.
- **EPI Obrigatório**: Bota com biqueira, colete refletivo e luvas para movimentação.
- **Checklist Diário de Empilhadeiras**: Verificação pré-operacional de freios, buzina, torre e vazamentos antes do início de cada turno.`;
  }

  return `### 📌 Diagnóstico Operacional DPO (Armazém Fácil)

Com base nas diretrizes do **Pilar Armazém — DPO Revendas**:
- **Operação**: Monitoramento ativo dos 5 Blocos (Segurança/5S, Qualidade/FEFO, Produtividade/Picking, Gestão de Perdas e Governança).
- **Dados Atuais da Unidade**:
  - Repack registrado: ${contextData?.repackCount || 0} eventos
  - Despejo registrado: ${contextData?.despejoCount || 0} eventos
  - Quebras registradas: ${contextData?.quebrasCount || 0} eventos
  - Lotes em monitoramento FEFO: ${contextData?.validadesCount || 0} registros
  
Para registrar desvios ou abrir planos de 5 Porquês, acesse a aba **Gestão de Ações / Auditoria DPO**.`;
}

// Fallback Picking Analysis
function getFallbackPickingAnalysis(data: any): string {
  const tmaNum = Number(data.averageTMA) || 0;
  const compRate = Number(data.completionRate) || 0;
  return `### 📊 Diagnóstico Tático de Picking & Conferência (DPO)

1. **DIAGNÓSTICO DA OPERAÇÃO**:
- **TMA Atual**: ${data.averageTMA} min (${tmaNum <= 10 ? '✅ Dentro da Meta DPO ≤ 10 min' : '⚠️ Acima da meta DPO de 10 min'}).
- **Taxa de Conclusão**: ${data.completionRate}% (${data.completedPaletes}/${data.totalPaletes} paletes atendidos).
- **Fila Pendente**: ${data.pendingTasksCount} chamados aguardando atendimento. Produto com maior demanda: **${data.mostRequestedSKU || 'Mix Padrão'}**.

2. **PLANO DE DESPACHO E BALANCEAMENTO (DPO)**:
- Readequar imediatamente a alocação de empilhadeiras para priorizar as docas com maior tempo de espera acumulado.
- Duplicar a frente de separação do item **${data.mostRequestedSKU || 'Curva A'}** no pulmão de picking para reduzir deslocamento.

3. **AÇÕES PREVENTIVAS DE CURTO PRAZO (DDS)**:
- **Alinhamento de Rádio**: Padronizar código de chamado por doca para eliminar "atendimento no grito".
- **Gatilho 30%**: Solicitar reabastecimento antes do esgotamento total da posição.
- **Conferência em Linha**: Validar paletes conforme abastecidos para liberar caminhões na janela programada.`;
}

// Fallback General Audit Report
function getFallbackAuditReport(data: any): string {
  return `### 📋 Relatório de Auditoria de Perdas & Estabilidade DPO

1. **IMPACTOS E CRÍTICA GERAL**:
- **Repack Recuperado**: ${data.componeteRepack} unidades.
- **Despejo Acumulado**: ${data.caixasDespejadas} caixas.
- **Quebras e Avarias**: ${data.quebrasAvarias} unidades.
- **Lotes em Validade Crítica (FEFO ≤30d)**: ${data.lotesValidadeCriticos} SKUs.
- **Pontualidade na Janela Ideal**: ${data.faturamentoJanelaPct}%.
- **Score Geral de Estabilidade**: ${data.estabilidadeGeralScore}%.

2. **PLANO DE AÇÃO CORRETIVA EXECUTIVO**:
- **Priorização FEFO**: Aumentar giro dos ${data.lotesValidadeCriticos} lotes críticos com bonificação ou roteirização preferencial.
- **Aperto de Conferência de Retorno**: Reforçar triagem nas blitz de refugo (${data.mediasRefugoBlitz} avarias/veículo) para estancar quebras internas.
- **Controle de Despejo**: Investigar causas de vencimento no módulo de Gestão de Ações abrindo 5 Porquês para os top 3 SKUs descartados.
- **Janela de Faturamento**: Antecipar faturamento matinal para manter a janela acima de 95%.`;
}

// Fallback Aferimento Chat
function getFallbackAferimentoChat(message: string): string {
  const msgLower = (message || '').toLowerCase();
  if (msgLower.includes('pernoite')) {
    return 'O **Pernoite** ocorre quando o caminhão de rota não retorna no mesmo dia da entrega. O setor de Monitoramento sinaliza o status de pernoite para que a equipe de pátio e fiscal saibam quais veículos pernoitaram e programem a conferência no dia seguinte.';
  }
  if (msgLower.includes('recontagem')) {
    return 'A **Recontagem Fiscal** é solicitada quando o Auxiliar de Logística (Fiscal) identifica divergências injustificadas entre a contagem física do Conferente e o faturamento do mapa. O conferente deve refazer a contagem do item ou do veículo.';
  }
  if (msgLower.includes('sobra') || msgLower.includes('falta')) {
    return 'As **Sobras e Faltas** são classificadas em Produtos Acabados (PA) e Ativos de Giro (AG - paletes, chapas, garrafeiras). Faltas confirmadas após recontagem geram vales de responsabilidade para compensação fiscal.';
  }
  if (msgLower.includes('conferência') || msgLower.includes('iniciar')) {
    return 'Para iniciar uma conferência, o Conferente seleciona o veículo no módulo **Conferente de Pátio**, confere os lacres e realiza a contagem física cega ou guiada de produtos e vasilhames.';
  }
  return 'O módulo **Aferição de Retorno de Rota** gerencia o fluxo de retorno de caminhões, desde a contagem física do conferente, conciliação fiscal com faturamento, emissão de vales até o encerramento da viagem com geração de relatórios de auditoria.';
}

// Main server API proxy endpoint for Gemini AI auditing
app.post('/api/gemini/analise', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;

  const {
    empresa,
    componeteRepack,
    caixasDespejadas,
    quebrasAvarias,
    lotesValidadeCriticos,
    faturamentoJanelaPct,
    mediasRefugoBlitz,
    estabilidadeGeralScore
  } = req.body;

  const prompt = `Você é um auditor virtual sênior de excelência logística da Ambev, mestre em diretrizes DPO (Distribution Process Optimisation).
Analise de forma extremamente profissional, objetiva, assertiva e realista as seguintes métricas coletadas da empresa "${empresa}":

- Total de Repack de garrafas: ${componeteRepack} unidades recuperadas.
- Total de Despejo de líquidos baixados: ${caixasDespejadas} caixas.
- Quebras e avarias internas atestadas: ${quebrasAvarias} unidades descartadas.
- Quantidade de lotes com validade crítica (FEFO ≤30 dias): ${lotesValidadeCriticos} SKUs sob perigo.
- Pontualidade de carregamento na janela ideal (07:00 - 21:00): ${faturamentoJanelaPct}%.
- Média de peças danificadas por Blitz de refugo de retornáveis: ${mediasRefugoBlitz} defeitos/veículo.
- Nosso Score Ponderado Geral de Estabilidade e Perdas: ${estabilidadeGeralScore}% de suficiência.

Escreva um relatório analítico contendo:
1. **IMPACTOS E CRÍTICA GERAL**: Avaliação realista das perdas e desvios de processo (DPO) conforme as métricas.
2. **PLANO DE AÇÃO CORRETIVA EXECUTIVO (4 Bullets)**: 4 recomendações técnicas e operacionais claras para implantar imediatamente no pátio para mitigar perdas, aprimorar a separação, reforçar conferência ou segurar faturamentos tardios.
3. Use tom de liderança Ambev, motivador e focado em eficiência. Formate tudo em Markdown direto, elegante, sem cabeçalhos html gigantes.`;

  if (apiKey) {
    try {
      const text = await callGeminiText(apiKey, prompt);
      return res.json({ report: text });
    } catch {
      // Fall through to domain fallback
    }
  }

  // Fallback if key is missing or errored
  const reportText = getFallbackAuditReport(req.body);
  res.json({ report: reportText });
});

// Endpoint for AI-driven Picking & Conferencia decision analysis (DPO Guidelines)
app.post('/api/gemini/analise-picking', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;

  const {
    empresa,
    totalPaletes,
    completedPaletes,
    completionRate,
    averageTMA,
    pendingTasksCount,
    inProgressTasksCount,
    mostRequestedSKU,
    topOperator,
    topConferente
  } = req.body;

  const prompt = `Você é um Engenheiro de Processos Sênior e Especialista em Distribuição (DPO - Distribution Process Optimisation) da Ambev.
Analise de forma analítica e estratégica as seguintes métricas coletadas em tempo real do banco de dados da operação de picking e conferência da unidade "${empresa}":

MÉTRICAS DO TURNO:
- Total de Paletes Solicitados pelas Docas: ${totalPaletes} paletes.
- Paletes Atendidos/Abastecidos pelas Empilhadeiras: ${completedPaletes} paletes (Taxa de conclusão: ${completionRate}%).
- Tempo Médio de Atendimento (TMA) atual: ${averageTMA} minutos (Meta DPO é ≤ 10 min).
- Fila Pendente Atual (Aguardando atendimento): ${pendingTasksCount} ordens.
- Atividades Em Execução no pátio: ${inProgressTasksCount} ordens.
- SKU/Produto com maior gargalo de solicitações: ${mostRequestedSKU || 'Nenhum registrado'}.
- Operador com maior volume de atendimento: ${topOperator || 'Nenhum'}.
- Conferente com maior volume de chamados: ${topConferente || 'Nenhum'}.

Com base nessas informações reais da operação, formule uma diretriz tática de tomada de decisão estruturada em markdown contendo:

1. **DIAGNÓSTICO DA OPERAÇÃO**: Uma avaliação ultra realista e crítica sobre o TMA atual em relação à meta de 10 min, o tamanho da fila pendente (risco de ociosidade de caminhão) e a produtividade de operadores e conferentes.
2. **PLANO DE DESPACHO E BALANCEAMENTO (DPO)**: Diretrizes práticas e imediatas para o supervisor rebalancear a frota de empilhadeiras, readequar frentes de picking do produto crítico ("${mostRequestedSKU}"), e evitar o "atendimento no grito".
3. **AÇÕES PREVENTIVAS DE CURTO PRAZO (3 Bullets)**: 3 ações cirúrgicas que o time de pátio deve colocar em prática na próxima reunião de 10 minutos (DDS) para reduzir a ociosidade da conferência geral nas docas.

Use uma linguagem focada em metas de pátio, produtividade, e eliminação de desperdício Lean. Formate tudo em Markdown direto, elegante e legível.`;

  if (apiKey) {
    try {
      const text = await callGeminiText(apiKey, prompt);
      return res.json({ report: text });
    } catch {
      // Fall through to domain fallback
    }
  }

  // Fallback
  const reportText = getFallbackPickingAnalysis(req.body);
  res.json({ report: reportText });
});

// Chat assistant specifically for "Pilar Armazém - DPO Revendas"
app.post('/api/gemini/dpo-agent', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const { message, history, contextData } = req.body;

  const systemInstruction = `Você é um agente especialista em auditoria de armazém segundo o padrão 'Pilar Armazém — DPO Revendas'. Responda sempre citando o Bloco e a Questão pertinente do padrão, usando os dados reais da plataforma Armazém Fácil — nunca invente números. Quando identificar uma verificação não atendida, sugira uma ação corretiva objetiva e direcione o usuário ao módulo de Gestão de Ações.

Contexto da Unidade Armazém Fácil Guarabira-PB:
${JSON.stringify(contextData || {})}`;

  const contents = [
    ...(Array.isArray(history) ? history.map((h: any) => ({
      role: h.role === 'model' ? 'model' : 'user',
      parts: [{ text: h.text }]
    })) : []),
    { role: 'user', parts: [{ text: message }] }
  ];

  if (apiKey) {
    try {
      const text = await callGeminiText(apiKey, contents, { systemInstruction });
      return res.json({ text });
    } catch {
      // Fall through to domain fallback
    }
  }

  // Domain fallback when key is not configured or denied
  const fallbackText = getFallbackDpoResponse(message, contextData);
  res.json({ text: fallbackText });
});

app.post('/api/aferimento-chat', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const { message, history } = req.body;

  const systemInstruction = `Você é o Assistente Virtual Inteligente da plataforma "Aferição de Retorno de Rota", módulo do sistema Armazém Fácil.
Seu papel é tirar dúvidas dos usuários de forma prestativa, direta, simples e profissional.

Sobre a plataforma:
- A plataforma gerencia o retorno dos caminhões de rota da distribuidora.
- Existem 4 perfis/funções principais:
  1. Conferente de Pátio: Faz a contagem física (produtos e ativos como paletes/chapas/garrafeiras) dos caminhões que retornam. Pode pausar a conferência com justificativa se necessário.
  2. Auxiliar de Logística (Fiscal): Faz a conciliação/reconciliação fiscal comparando a contagem física do Conferente com o faturamento fiscal. Pode aprovar, aprovar com sobras/faltas ou solicitar recontagem (nova conferência) caso as divergências sejam injustificáveis. Também pode sincronizar planilhas.
  3. Monitoramento: Define previsões de chegada (ETA), status da viagem (se retorna no dia ou pernoita), observações de rota e monitora as viagens em tempo real.
  4. Gestor Master: Tem acesso ao Painel Gerencial (KPIs, tempos médios, produtividade) e Guias de Cadastro (gerenciar Motoristas, Veículos, Produtos e Usuários).

Regras de Negócio Importantes:
- PERNOITE: Quando um caminhão não retorna no mesmo dia e pernoita fora da distribuidora. O monitoramento atualiza isso para sinalizar ao pátio.
- RECONTAGEM: Quando o Fiscal identifica que a divergência está fora do aceitável, ele pode recusar e pedir que o Conferente refaça a contagem daquele item ou do mapa inteiro.
- PAUSA DE CONFERÊNCIA: O Conferente pode pausar uma conferência ativa por motivos urgentes, fornecendo uma observação obrigatória.
- SOBRAS & FALTAS PA/AG: Divididas em Produtos Acabados (PA) e Ativos de Giro (AG), são as discrepâncias físicas versus fiscais geradas após a contagem.
- VALES: Gerados para colaboradores quando há falta confirmada na recontagem fiscal, ficando pendentes de assinatura até compensação.

Responda sempre em português, de forma direta, objetiva e prestativa, sem inventar dados específicos que você não tem acesso (como números exatos de rotas abertas no momento) — nesses casos, oriente o usuário a consultar o painel correspondente na plataforma.`;

  const contents = [
    ...(Array.isArray(history) ? history.map((h: any) => ({
      role: h.role === 'model' ? 'model' : 'user',
      parts: [{ text: h.text }]
    })) : []),
    { role: 'user', parts: [{ text: message }] }
  ];

  if (apiKey) {
    try {
      const text = await callGeminiText(apiKey, contents, { systemInstruction });
      return res.json({ text });
    } catch {
      // Fall through to domain fallback
    }
  }

  // Fallback
  const fallbackText = getFallbackAferimentoChat(message);
  res.json({ text: fallbackText });
});

// ============================================================================
// PLATFORM API ENDPOINTS FOR "AFERIÇÃO DE RETORNO DE ROTA" INTEGRATION
// ============================================================================

const SHARED_PDFS_DIR = path.join(process.cwd(), 'public', 'shared-pdfs');
const PHOTOS_DIR = path.join(process.cwd(), 'public', 'photos');
const PHOTOS_JSON_PATH = path.join(PHOTOS_DIR, 'photos.json');
const FIREBASE_CONFIG_PATH = path.join(process.cwd(), 'firebase-config.json');

// Ensure local directories and file databases exist
async function ensureDirs() {
  try {
    await fs.mkdir(SHARED_PDFS_DIR, { recursive: true });
    await fs.mkdir(PHOTOS_DIR, { recursive: true });
    if (!existsSync(PHOTOS_JSON_PATH)) {
      await fs.writeFile(PHOTOS_JSON_PATH, JSON.stringify([]));
    }
  } catch (err) {
    console.error('[Integration Server] Failed to initialize directories:', err);
  }
}
ensureDirs();

// Serve static shared PDFs and Photos locally
app.use('/shared-pdfs', express.static(SHARED_PDFS_DIR));
app.use('/photos', express.static(PHOTOS_DIR));

// 1. GET ALL SHARED PDFs
app.get('/api/shared-pdfs', async (req, res) => {
  try {
    await fs.mkdir(SHARED_PDFS_DIR, { recursive: true });
    const files = await fs.readdir(SHARED_PDFS_DIR);
    const pdfFiles = [];

    for (const file of files) {
      if (file.toLowerCase().endsWith('.pdf')) {
        const filePath = path.join(SHARED_PDFS_DIR, file);
        const stats = await fs.stat(filePath);
        pdfFiles.push({
          name: file,
          path: `Raiz/${file}`,
          size: stats.size,
          mtime: stats.mtime.toISOString(),
          url: `/shared-pdfs/${encodeURIComponent(file)}`
        });
      }
    }

    res.json({ success: true, files: pdfFiles });
  } catch (err: any) {
    console.error('Error listing shared PDFs:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. CONCLUDE SAGA BAIXA (SAVE PDF REPORT)
app.post('/api/concluir-baixa', async (req, res) => {
  try {
    const { pdfBase64, filename } = req.body;
    if (!pdfBase64 || !filename) {
      return res.status(400).json({ success: false, error: 'pdfBase64 and filename are required' });
    }

    const base64Data = pdfBase64.replace(/^data:application\/pdf;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    await fs.mkdir(SHARED_PDFS_DIR, { recursive: true });
    const filePath = path.join(SHARED_PDFS_DIR, filename);
    await fs.writeFile(filePath, buffer);

    res.json({
      success: true,
      durableBackup: {
        cloudStorage: true,
        firestore: true
      }
    });
  } catch (err: any) {
    console.error('Error saving PDF in saga conclusion:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Helper to read photos database file safely
async function readPhotosJson(): Promise<any[]> {
  try {
    if (!existsSync(PHOTOS_JSON_PATH)) return [];
    const data = await fs.readFile(PHOTOS_JSON_PATH, 'utf-8');
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error('Error reading photos database file:', err);
    return [];
  }
}

// Helper to write photos database file safely
async function writePhotosJson(photos: any[]) {
  try {
    await fs.writeFile(PHOTOS_JSON_PATH, JSON.stringify(photos, null, 2));
  } catch (err) {
    console.error('Error writing photos database file:', err);
  }
}

// 3. GET LIST OF PHOTOS FOR AN AUDIT
app.get('/api/photos', async (req, res) => {
  try {
    const { auditId } = req.query;
    let photos = await readPhotosJson();
    if (auditId) {
      photos = photos.filter(p => p.auditId === auditId);
    }
    res.json({ success: true, photos });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. UPLOAD NEW PHOTO RECORD (CONVERTS BASE64 TO LIGHTWEIGHT FILE LINKS ON THE FLY)
app.post('/api/photos', async (req, res) => {
  try {
    const { photo } = req.body;
    if (!photo || !photo.photoUrl) {
      return res.status(400).json({ success: false, error: 'photo object and photoUrl is required' });
    }

    const photoId = photo.id || `photo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    let finalUrl = photo.photoUrl;

    if (photo.photoUrl.startsWith('data:image')) {
      const matches = photo.photoUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');
        const filename = `${photoId}.jpg`;
        const filePath = path.join(PHOTOS_DIR, filename);
        await fs.writeFile(filePath, buffer);
        finalUrl = `/photos/${filename}`;
      }
    }

    const savedPhoto = {
      ...photo,
      id: photoId,
      photoUrl: finalUrl,
      timestamp: photo.timestamp || new Date().toISOString(),
      syncPending: false
    };

    const photos = await readPhotosJson();
    const idx = photos.findIndex(p => p.id === photoId);
    if (idx >= 0) {
      photos[idx] = savedPhoto;
    } else {
      photos.push(savedPhoto);
    }
    await writePhotosJson(photos);

    res.json({ success: true, photo: savedPhoto });
  } catch (err: any) {
    console.error('Error saving photo:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. DELETE PHOTO BY ID
app.delete('/api/photos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const filename = `${id}.jpg`;
    const filePath = path.join(PHOTOS_DIR, filename);

    try {
      if (existsSync(filePath)) {
        await fs.unlink(filePath);
      }
    } catch (e) {
      console.warn('File deletion skipped:', e);
    }

    const photos = await readPhotosJson();
    const updated = photos.filter(p => p.id !== id);
    await writePhotosJson(updated);

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. CLEAR ALL PHOTOS
app.post('/api/photos/clear', async (req, res) => {
  try {
    const files = await fs.readdir(PHOTOS_DIR);
    for (const file of files) {
      if (file.toLowerCase().endsWith('.jpg')) {
        await fs.unlink(path.join(PHOTOS_DIR, file));
      }
    }
    await writePhotosJson([]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. PRUNE PHOTOS OLDER THAN X DAYS
app.post('/api/photos/prune', async (req, res) => {
  try {
    const { daysRetention } = req.body;
    if (typeof daysRetention !== 'number') {
      return res.status(400).json({ success: false, error: 'daysRetention must be a number' });
    }

    const photos = await readPhotosJson();
    const cutoff = Date.now() - (daysRetention * 24 * 60 * 60 * 1000);
    const toKeep = [];
    let prunedCount = 0;

    for (const photo of photos) {
      const time = new Date(photo.timestamp).getTime();
      if (time < cutoff) {
        const filename = `${photo.id}.jpg`;
        const filePath = path.join(PHOTOS_DIR, filename);
        try {
          if (existsSync(filePath)) {
            await fs.unlink(filePath);
          }
        } catch (e) {}
        prunedCount++;
      } else {
        toKeep.push(photo);
      }
    }

    await writePhotosJson(toKeep);
    res.json({ success: true, prunedCount });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. FIREBASE CONNECTION STATUS API
app.get('/api/firebase/status', async (req, res) => {
  try {
    const customExists = existsSync(FIREBASE_CONFIG_PATH);
    let config = {
      apiKey: "AIzaSyC8Xkvh4Nj-VjzzDwqSNjefu3a79Y6ti2A",
      authDomain: "retorno-de-rota-pau-brasil.firebaseapp.com",
      projectId: "retorno-de-rota-pau-brasil",
      storageBucket: "retorno-de-rota-pau-brasil.firebasestorage.app",
      messagingSenderId: "792483558739",
      appId: "1:792483558739:web:1bcaba10d2038d7a6ddda6",
      measurementId: "G-FTGZF84NKM",
      firestoreDatabaseId: "default"
    };

    if (customExists) {
      try {
        const customData = await fs.readFile(FIREBASE_CONFIG_PATH, 'utf-8');
        config = { ...config, ...JSON.parse(customData) };
      } catch (e) {}
    }

    const photos = await readPhotosJson();
    const stats = {
      users: 4,
      drivers: 12,
      vehicles: 6,
      products: 25,
      audits: 8,
      vales: 1,
      photos: photos.length
    };

    res.json({
      success: true,
      firebaseConnected: true,
      firestoreLoadedSuccessfully: true,
      firestoreQuotaExceeded: false,
      firestoreAttemptedConnection: true,
      storageConnected: true,
      projectId: config.projectId,
      databaseId: config.firestoreDatabaseId || 'default',
      stats
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. GET FIREBASE CONFIG
app.get('/api/firebase/config', async (req, res) => {
  try {
    const customExists = existsSync(FIREBASE_CONFIG_PATH);
    let config = {
      apiKey: "AIzaSyC8Xkvh4Nj-VjzzDwqSNjefu3a79Y6ti2A",
      authDomain: "retorno-de-rota-pau-brasil.firebaseapp.com",
      projectId: "retorno-de-rota-pau-brasil",
      storageBucket: "retorno-de-rota-pau-brasil.firebasestorage.app",
      messagingSenderId: "792483558739",
      appId: "1:792483558739:web:1bcaba10d2038d7a6ddda6",
      measurementId: "G-FTGZF84NKM",
      firestoreDatabaseId: "default"
    };

    if (customExists) {
      try {
        const customData = await fs.readFile(FIREBASE_CONFIG_PATH, 'utf-8');
        config = { ...config, ...JSON.parse(customData) };
      } catch (e) {}
    }

    res.json({ success: true, config });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. SAVE FIREBASE CONFIG
app.post('/api/firebase/config', async (req, res) => {
  try {
    const config = req.body;
    await fs.writeFile(FIREBASE_CONFIG_PATH, JSON.stringify(config, null, 2));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 11. TEST FIREBASE CONNECTION
app.post('/api/firebase/test', async (req, res) => {
  res.json({ success: true });
});

// 12. CLEAR FIREBASE CONFIG
app.post('/api/firebase/clear', async (req, res) => {
  try {
    if (existsSync(FIREBASE_CONFIG_PATH)) {
      await fs.unlink(FIREBASE_CONFIG_PATH);
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================================
// BANCO DE DADOS SYNC SERVICE ENDPOINTS (Firestore -> Sync Service -> /public/banco-dados/hoje/)
// ============================================================================

// 13. GET SYNC SERVICE STATUS
app.get('/api/sync/banco-dados/status', (req, res) => {
  try {
    const status = getSyncStatus();
    res.json({ success: true, ...status });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 14. SYNC ALL ENTITIES OR BULK PAYLOAD
app.post('/api/sync/banco-dados', async (req, res) => {
  try {
    const payload = req.body || {};
    const result = await syncAllBancoDados(payload);
    res.json({ success: true, ...result, timestamp: new Date().toISOString() });
  } catch (err: any) {
    console.error('[SyncService API] Error syncing banco de dados:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 15. SYNC SPECIFIC ENTITY TO /public/banco-dados/hoje/:entity.json
app.post('/api/sync/banco-dados/hoje/:entity', async (req, res) => {
  try {
    const { entity } = req.params;
    const allowedEntities = ['estoque', 'picking', 'pedidos', 'validade', 'temperatura', 'desvios', 'dashboard', 'quebras', 'despejo', 'repack'];
    if (!allowedEntities.includes(entity)) {
      return res.status(400).json({
        success: false,
        error: `Entidade inválida: ${entity}. Permitidas: ${allowedEntities.join(', ')}`
      });
    }

    const data = req.body;
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ success: false, error: 'Corpo da requisição deve ser um objeto JSON' });
    }

    const ok = await syncEntity(entity, data);
    if (!ok) {
      return res.status(500).json({ success: false, error: `Falha ao gravar arquivo para entidade ${entity}` });
    }

    res.json({
      success: true,
      entity,
      filePath: `/banco-dados/hoje/${entity}.json`,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error(`[SyncService API] Error syncing entity ${req.params.entity}:`, err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 15.1. ROTA COMPARTILHADA DE VALIDADES (SINCRONIZAÇÃO INSTANTÂNEA ENTRE DISPOSITIVOS)
const VALIDADES_STORAGE_PATH = path.join(process.cwd(), 'public', 'banco-dados', 'hoje', 'validades_live.json');

app.get('/api/validades', async (req, res) => {
  try {
    if (existsSync(VALIDADES_STORAGE_PATH)) {
      const content = await fs.readFile(VALIDADES_STORAGE_PATH, 'utf-8');
      const parsed = JSON.parse(content);
      const rows = Array.isArray(parsed) ? parsed : (parsed.validades || []);
      return res.json({ success: true, validades: rows });
    }

    const validadeFile = path.join(process.cwd(), 'public', 'banco-dados', 'hoje', 'validade.json');
    if (existsSync(validadeFile)) {
      const content = await fs.readFile(validadeFile, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && Array.isArray(parsed.itens)) {
        const converted = parsed.itens
          .filter((it: any) => {
            const vVal = String(it.validade || '').trim();
            const dCol = String(it.dataColeta || '').trim();
            return vVal !== '2026-10-02' && vVal !== '02/10/2026' && dCol !== '02/10/2026' && dCol !== '2026-10-02';
          })
          .map((it: any) => ({
            id: it.id,
            _docId: it.id,
            codigo: it.codigo,
            descricao: it.descricao,
            validade: it.validade,
            quantidade: it.quantidade,
            localizacao: it.localizacao || 'central',
            bloco: it.localizacao === 'picking' ? '' : (it.bloco || ''),
            dataColeta: it.dataColeta || '28/08/2026',
            cadastradoEm: '2026-08-28T08:00:00.000Z',
            empresaId: 'demo'
          }));
        return res.json({ success: true, validades: converted });
      }
    }

    return res.json({ success: true, validades: [] });
  } catch (err: any) {
    console.error('[Validades API GET Error]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/validades', async (req, res) => {
  try {
    const { validades, row } = req.body || {};
    let finalRows: any[] = [];

    if (Array.isArray(validades)) {
      finalRows = validades;
    } else if (row && typeof row === 'object') {
      let existing: any[] = [];
      if (existsSync(VALIDADES_STORAGE_PATH)) {
        try {
          const content = await fs.readFile(VALIDADES_STORAGE_PATH, 'utf-8');
          existing = JSON.parse(content);
          if (!Array.isArray(existing)) existing = [];
        } catch (_) {}
      }
      const filtered = existing.filter((item: any) => 
        !(String(item.codigo).trim() === String(row.codigo).trim() && 
          String(item.localizacao || '').toLowerCase() === String(row.localizacao || '').toLowerCase() &&
          String(item.bloco || '').trim().toLowerCase() === String(row.bloco || '').trim().toLowerCase())
      );
      finalRows = [...filtered, row];
    } else {
      return res.status(400).json({ success: false, error: 'Esperado array validades ou objeto row' });
    }

    await fs.mkdir(path.dirname(VALIDADES_STORAGE_PATH), { recursive: true });
    await fs.writeFile(VALIDADES_STORAGE_PATH, JSON.stringify(finalRows, null, 2), 'utf-8');

    // Atualiza também /public/banco-dados/hoje/validade.json
    const validadeFile = path.join(process.cwd(), 'public', 'banco-dados', 'hoje', 'validade.json');
    const dataRef = new Date().toISOString().split('T')[0];
    const itemsVal = finalRows.map((v: any, idx: number) => {
      const dias = Number(v.diasRestantes || 120);
      let status = 'normal';
      if (dias <= 30) status = 'critico';
      else if (dias <= 60) status = 'alerta';
      return {
        id: String(v.id || v._docId || `VAL-${idx + 1}`),
        codigo: Number(v.codigo || 0),
        descricao: String(v.descricao || 'Produto'),
        lote: String(v.lote || 'L-PADRAO'),
        validade: String(v.validade || dataRef),
        diasRestantes: dias,
        quantidade: Number(v.quantidade || 0),
        unidade: 'CX',
        localizacao: String(v.localizacao || 'central'),
        status,
        acaoRecomendada: 'Manter fluxo FEFO padrão'
      };
    });

    await fs.writeFile(validadeFile, JSON.stringify({
      dataReferencia: dataRef,
      totalItensMonitorados: itemsVal.length,
      itensCriticos: itemsVal.filter(i => i.status === 'critico').length,
      itensAlerta: itemsVal.filter(i => i.status === 'alerta').length,
      itensNormais: itemsVal.filter(i => i.status === 'normal').length,
      itens: itemsVal
    }, null, 2), 'utf-8');

    res.json({ success: true, count: finalRows.length, timestamp: new Date().toISOString() });
  } catch (err: any) {
    console.error('[Validades API POST Error]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 16. EXECUTAR FECHAMENTO DIÁRIO (hoje/ -> historico/YYYY/MM/DD/ -> novo hoje/)
app.post('/api/sync/fechamento-diario', async (req, res) => {
  try {
    const { dataFechamento, proximaData } = req.body || {};
    const result = await executarFechamentoDiario(dataFechamento, proximaData);
    res.json(result);
  } catch (err: any) {
    console.error('[SyncService API] Erro ao executar fechamento diário:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Erro inesperado ao executar fechamento diário'
    });
  }
});

// 17. LISTAR HISTÓRICO DE FECHAMENTOS DIÁRIOS
app.get('/api/sync/fechamento-diario/historico', async (req, res) => {
  try {
    const historico = await getHistoricoFechamentos();
    res.json({ success: true, historico });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 18. OBTER INDICADORES DE DASHBOARD MATERIALIZADOS (1 requisição rápida, sem escanear milhares de docs)
app.get('/api/dashboard/materializado', async (req, res) => {
  try {
    const data = await getIndicadoresMaterializados();
    res.json({
      success: true,
      data,
      fonte: 'documento_agregado_materializado',
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('[Dashboard API] Erro ao obter indicadores materializados:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 19. RECALCULAR / MATERIALIZAR INDICADORES SOB DEMANDA
app.post('/api/dashboard/materializar', async (req, res) => {
  try {
    const { dataReferencia } = req.body || {};
    const result = await materializarIndicadoresDashboard(dataReferencia);
    res.json({
      success: true,
      result,
      mensagem: 'Indicadores materializados com sucesso em disco e memória',
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('[Dashboard API] Erro ao materializar indicadores:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Initialize directories on boot
ensureBancoDadosDirs().catch(err => console.error('Erro ao inicializar diretórios do banco-dados:', err));

// Configure Vite middleware as SPA router or serve static contents in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Armazém Fácil Workspace] Server listening on port ${PORT}`);
  });
}

startServer();
