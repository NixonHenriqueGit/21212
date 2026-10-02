import fs from 'fs';

// Let's create the full generator
const generatorScript = `
import fs from 'fs';

// Questions definitions
export interface ItemVerificacaoGSA {
  id: number;
  categoria: 'Piso & Estrutura' | 'Empilhamento & Armazenagem' | 'Emergência & Incêndio' | 'Equipamentos & Máquinas' | 'Pessoas & EPIs' | 'Ergonomia & Comportamento' | '5S & Meio Ambiente';
  norma: string;
  pergunta: string;
  perguntaCurta: string;
  descricaoOrientacao?: string;
  peso: number;
  riscoSeDesvio: 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO';
  acaoPadrao5W2H: {
    oQue: string;
    porQue: string;
    onde: string;
    quem: string;
    quando: string;
    como: string;
    quanto: string;
  };
}

export type StatusItemAvaliacao = 'OTIMO' | 'BOM' | 'RUIM' | 'NA';
`;

console.log("Starting GSA generator preparation...");
