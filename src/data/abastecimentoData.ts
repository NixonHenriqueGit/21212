export interface BaseSkuData {
  sku: number;
  descricao: string;
  unidade: string;
  embalagem: number;
  qtdPallet: number; // Qtd por pallet em caixas/unidades
  estoqueInicialCaixas: number; // Estoque Inicial no Picking (Área 2)
  estoquePicking?: number; // Área 2: Picking
  estoqueCentral?: number; // Área 1: Central
  estoqueMarketplace?: number; // Área 3: Marketplace
  estoqueContingencia?: number; // Área 4: Área de Contingência
  estoquePulmao?: number; // Área 5: Pulmão
  estoquePNC?: number; // Área 6: PNC (Produto Não Conforme / Bloqueados / Avarias)
  vendaCaixas: number;
  curvaAbc?: 'A' | 'B' | 'C';
}

// Catálogo com os dados base dos produtos (iniciam zerados até importação dos relatórios 021101 e 020304)
export const ABASTECIMENTO_PRODUCTS_DATA: BaseSkuData[] = [
  // CURVA A - MAIOR SAÍDA (Reabastecimento Prioritário)
  { sku: 9067, descricao: "ANTARCTICA PILSEN LATA 350ML SH C/12 NPAL", unidade: "cx", embalagem: 12, qtdPallet: 120, estoqueInicialCaixas: 0, estoquePicking: 0, estoqueCentral: 0, estoqueMarketplace: 0, estoquePulmao: 0, estoqueContingencia: 0, vendaCaixas: 0, curvaAbc: 'A' },
  { sku: 34608, descricao: "SKOL LATA 350ML SH C/12 NPAL MULTIPACK", unidade: "cx", embalagem: 12, qtdPallet: 120, estoqueInicialCaixas: 0, estoquePicking: 0, estoqueCentral: 0, estoqueMarketplace: 0, estoquePulmao: 0, estoqueContingencia: 0, vendaCaixas: 0, curvaAbc: 'A' },
  { sku: 9068, descricao: "SKOL LATA 350ML SH C/12", unidade: "cx", embalagem: 12, qtdPallet: 120, estoqueInicialCaixas: 0, estoquePicking: 0, estoqueCentral: 0, estoqueMarketplace: 0, estoquePulmao: 0, estoqueContingencia: 0, vendaCaixas: 0, curvaAbc: 'A' },
  { sku: 33820, descricao: "BRAHMA CHOPP LT 350ML SH C/12 NP MULTIPK", unidade: "cx", embalagem: 12, qtdPallet: 120, estoqueInicialCaixas: 0, estoquePicking: 0, estoqueCentral: 0, estoqueMarketplace: 0, estoquePulmao: 0, estoqueContingencia: 0, vendaCaixas: 0, curvaAbc: 'A' },
  { sku: 37450, descricao: "BUDWEISER LT SLEEK 350ML MULTIPACK", unidade: "cx", embalagem: 12, qtdPallet: 120, estoqueInicialCaixas: 0, estoquePicking: 0, estoqueCentral: 0, estoqueMarketplace: 0, estoquePulmao: 0, estoqueContingencia: 0, vendaCaixas: 0, curvaAbc: 'A' },
  { sku: 21020, descricao: "BUDWEISER LT SLEEK 350ML CX CARTON C/12", unidade: "cx", embalagem: 12, qtdPallet: 120, estoqueInicialCaixas: 0, estoquePicking: 0, estoqueCentral: 0, estoqueMarketplace: 0, estoquePulmao: 0, estoqueContingencia: 0, vendaCaixas: 0, curvaAbc: 'A' },
  { sku: 19164, descricao: "GUARANA CHP ANTARCTICA PET 1L MULTIPACK", unidade: "cx", embalagem: 12, qtdPallet: 84, estoqueInicialCaixas: 0, estoquePicking: 0, estoqueCentral: 0, estoqueMarketplace: 0, estoquePulmao: 0, estoqueContingencia: 0, vendaCaixas: 0, curvaAbc: 'A' },
  { sku: 2349, descricao: "GUARANA CHP ANTARCTICA PET 2L CAIXA C/6", unidade: "cx", embalagem: 6, qtdPallet: 100, estoqueInicialCaixas: 0, estoquePicking: 0, estoqueCentral: 0, estoqueMarketplace: 0, estoquePulmao: 0, estoqueContingencia: 0, vendaCaixas: 0, curvaAbc: 'A' },
  { sku: 988, descricao: "BRAHMA CHOPP 600ML", unidade: "Dz", embalagem: 18, qtdPallet: 84, estoqueInicialCaixas: 0, estoquePicking: 0, estoqueCentral: 0, estoqueMarketplace: 0, estoquePulmao: 0, estoqueContingencia: 0, vendaCaixas: 0, curvaAbc: 'A' },
  { sku: 982, descricao: "SKOL 600ML", unidade: "Dz", embalagem: 18, qtdPallet: 84, estoqueInicialCaixas: 0, estoquePicking: 0, estoqueCentral: 0, estoqueMarketplace: 0, estoquePulmao: 0, estoqueContingencia: 0, vendaCaixas: 0, curvaAbc: 'A' },
  { sku: 2538, descricao: "ANTARCTICA PILSEN 600ML", unidade: "Dz", embalagem: 18, qtdPallet: 84, estoqueInicialCaixas: 0, estoquePicking: 0, estoqueCentral: 0, estoqueMarketplace: 0, estoquePulmao: 0, estoqueContingencia: 0, vendaCaixas: 0, curvaAbc: 'A' },
  { sku: 2546, descricao: "ORIGINAL 600ML CX C/24", unidade: "cx", embalagem: 24, qtdPallet: 84, estoqueInicialCaixas: 0, estoquePicking: 0, estoqueCentral: 0, estoqueMarketplace: 0, estoquePulmao: 0, estoqueContingencia: 0, vendaCaixas: 0, curvaAbc: 'A' },
  { sku: 23186, descricao: "SPATEN N 600ML", unidade: "Dz", embalagem: 18, qtdPallet: 84, estoqueInicialCaixas: 0, estoquePicking: 0, estoqueCentral: 0, estoqueMarketplace: 0, estoquePulmao: 0, estoqueContingencia: 0, vendaCaixas: 0, curvaAbc: 'A' },
  { sku: 20164, descricao: "SKOL LT 473ML SH C/12 NPAL MULTPACK 12", unidade: "cx", embalagem: 12, qtdPallet: 96, estoqueInicialCaixas: 0, estoquePicking: 0, estoqueCentral: 0, estoqueMarketplace: 0, estoquePulmao: 0, estoqueContingencia: 0, vendaCaixas: 0, curvaAbc: 'A' },
  { sku: 2548, descricao: "BUDWEISER 600ML", unidade: "Dz", embalagem: 18, qtdPallet: 84, estoqueInicialCaixas: 0, estoquePicking: 0, estoqueCentral: 0, estoqueMarketplace: 0, estoquePulmao: 0, estoqueContingencia: 0, vendaCaixas: 0, curvaAbc: 'A' },
  { sku: 1743, descricao: "ANTARCTICA PILSEN GFA VD 1L COM TTC", unidade: "cx", embalagem: 12, qtdPallet: 60, estoqueInicialCaixas: 0, estoquePicking: 0, estoqueCentral: 0, estoqueMarketplace: 0, estoquePulmao: 0, estoqueContingencia: 0, vendaCaixas: 0, curvaAbc: 'A' },
  { sku: 1388, descricao: "SKOL GFA VD 1L 2,99", unidade: "cx", embalagem: 12, qtdPallet: 60, estoqueInicialCaixas: 0, estoquePicking: 0, estoqueCentral: 0, estoqueMarketplace: 0, estoquePulmao: 0, estoqueContingencia: 0, vendaCaixas: 0, curvaAbc: 'A' },
  { sku: 504, descricao: "PEPSI COLA PET 2L CAIXA C/6", unidade: "cx", embalagem: 6, qtdPallet: 100, estoqueInicialCaixas: 0, estoquePicking: 0, estoqueCentral: 0, estoqueMarketplace: 0, estoquePulmao: 0, estoqueContingencia: 0, vendaCaixas: 0, curvaAbc: 'A' },
  { sku: 13201, descricao: "BRAHMA CHOPP GFA VD 300ML CX C/23", unidade: "cx", embalagem: 23, qtdPallet: 96, estoqueInicialCaixas: 0, estoquePicking: 0, estoqueCentral: 0, estoqueMarketplace: 0, estoquePulmao: 0, estoqueContingencia: 0, vendaCaixas: 0, curvaAbc: 'A' },
  { sku: 13205, descricao: "SKOL GFA VD 300ML CX C/23", unidade: "cx", embalagem: 23, qtdPallet: 96, estoqueInicialCaixas: 0, estoquePicking: 0, estoqueCentral: 0, estoqueMarketplace: 0, estoquePulmao: 0, estoqueContingencia: 0, vendaCaixas: 0, curvaAbc: 'A' },

  // CURVA B - MÉDIO GIRO
  { sku: 18807, descricao: "STELLA ARTOIS LONG NECK 330ML", unidade: "cx", embalagem: 24, qtdPallet: 84, estoqueInicialCaixas: 0, estoquePicking: 0, estoqueCentral: 0, estoqueMarketplace: 0, estoquePulmao: 0, estoqueContingencia: 0, vendaCaixas: 0, curvaAbc: 'B' },
  { sku: 18836, descricao: "CORONA EXTRA N LONG NECK 330ML CX C/24", unidade: "cx", embalagem: 24, qtdPallet: 84, estoqueInicialCaixas: 0, estoquePicking: 0, estoqueCentral: 0, estoqueMarketplace: 0, estoquePulmao: 0, estoqueContingencia: 0, vendaCaixas: 0, curvaAbc: 'B' },
  { sku: 9083, descricao: "SKOL LATÃO 473ML SH C/12", unidade: "cx", embalagem: 12, qtdPallet: 96, estoqueInicialCaixas: 0, estoquePicking: 0, estoqueCentral: 0, estoqueMarketplace: 0, estoquePulmao: 0, estoqueContingencia: 0, vendaCaixas: 0, curvaAbc: 'B' },
  { sku: 2319, descricao: "GUARANA CHP ANTARCTICA PET 1L CAIXA C/12", unidade: "cx", embalagem: 12, qtdPallet: 84, estoqueInicialCaixas: 0, estoquePicking: 0, estoqueCentral: 0, estoqueMarketplace: 0, estoquePulmao: 0, estoqueContingencia: 0, vendaCaixas: 0, curvaAbc: 'B' },
  { sku: 2353, descricao: "GUARANA ZERO PET 2L CAIXA C/6", unidade: "cx", embalagem: 6, qtdPallet: 100, estoqueInicialCaixas: 0, estoquePicking: 0, estoqueCentral: 0, estoqueMarketplace: 0, estoquePulmao: 0, estoqueContingencia: 0, vendaCaixas: 0, curvaAbc: 'B' },
  { sku: 17808, descricao: "BUDWEISER OW 330ML CX C/24", unidade: "cx", embalagem: 24, qtdPallet: 84, estoqueInicialCaixas: 0, estoquePicking: 0, estoqueCentral: 0, estoqueMarketplace: 0, estoquePulmao: 0, estoqueContingencia: 0, vendaCaixas: 0, curvaAbc: 'B' },
  { sku: 13061, descricao: "H2OH LIMONETO PET 500ML CX C/12", unidade: "cx", embalagem: 12, qtdPallet: 120, estoqueInicialCaixas: 0, estoquePicking: 0, estoqueCentral: 0, estoqueMarketplace: 0, estoquePulmao: 0, estoqueContingencia: 0, vendaCaixas: 0, curvaAbc: 'B' },
  { sku: 13065, descricao: "H2OH LIMONETO PET 1,5 SHRINK C/06 NPAL", unidade: "cx", embalagem: 6, qtdPallet: 100, estoqueInicialCaixas: 0, estoquePicking: 0, estoqueCentral: 0, estoqueMarketplace: 0, estoquePulmao: 0, estoqueContingencia: 0, vendaCaixas: 0, curvaAbc: 'B' },
  { sku: 34475, descricao: "ELEVE AGUA MIN S GAS GFA PET 510ML FD C/12", unidade: "cx", embalagem: 12, qtdPallet: 120, estoqueInicialCaixas: 0, estoquePicking: 0, estoqueCentral: 0, estoqueMarketplace: 0, estoquePulmao: 0, estoqueContingencia: 0, vendaCaixas: 0, curvaAbc: 'B' },
  { sku: 503, descricao: "SUKITA PET 2L CAIXA C/6", unidade: "cx", embalagem: 6, qtdPallet: 100, estoqueInicialCaixas: 0, estoquePicking: 0, estoqueCentral: 0, estoqueMarketplace: 0, estoquePulmao: 0, estoqueContingencia: 0, vendaCaixas: 0, curvaAbc: 'B' },
  { sku: 22177, descricao: "BUDWEISER ZERO LATA SLEEK 350ML", unidade: "cx", embalagem: 12, qtdPallet: 120, estoqueInicialCaixas: 0, estoquePicking: 0, estoqueCentral: 0, estoqueMarketplace: 0, estoquePulmao: 0, estoqueContingencia: 0, vendaCaixas: 0, curvaAbc: 'B' },
  { sku: 4262, descricao: "MICHELOB ULTRA LATA SLEEK 350ML", unidade: "cx", embalagem: 12, qtdPallet: 120, estoqueInicialCaixas: 0, estoquePicking: 0, estoqueCentral: 0, estoqueMarketplace: 0, estoquePulmao: 0, estoqueContingencia: 0, vendaCaixas: 0, curvaAbc: 'B' },
  { sku: 26037, descricao: "MONTILLA CARTA CRISTAL GFA VD 1L", unidade: "un", embalagem: 1, qtdPallet: 72, estoqueInicialCaixas: 0, estoquePicking: 0, estoqueCentral: 0, estoqueMarketplace: 0, estoquePulmao: 0, estoqueContingencia: 0, vendaCaixas: 0, curvaAbc: 'B' },

  // CURVA C - BAIXO GIRO / ESPECIALIDADES / FRACIONADOS
  { sku: 21787, descricao: "DREHER GFA VD 900ML", unidade: "un", embalagem: 1, qtdPallet: 80, estoqueInicialCaixas: 0, estoquePicking: 0, estoqueCentral: 0, estoqueMarketplace: 0, estoquePulmao: 0, estoqueContingencia: 0, vendaCaixas: 0, curvaAbc: 'C' },
  { sku: 19229, descricao: "RED BULL BR LATA 250ML SIX PACK NPAL .", unidade: "cx", embalagem: 24, qtdPallet: 576, estoqueInicialCaixas: 0, estoquePicking: 0, estoqueCentral: 0, estoqueMarketplace: 0, estoquePulmao: 0, estoqueContingencia: 0, vendaCaixas: 0, curvaAbc: 'C' },
  { sku: 19225, descricao: "RED BULL BR LATA 250ML CX C/24", unidade: "cx", embalagem: 24, qtdPallet: 144, estoqueInicialCaixas: 0, estoquePicking: 0, estoqueCentral: 0, estoqueMarketplace: 0, estoquePulmao: 0, estoqueContingencia: 0, vendaCaixas: 0, curvaAbc: 'C' },
  { sku: 25160, descricao: "BLACK & WHITE WHISKY GFA VD 1L", unidade: "un", embalagem: 1, qtdPallet: 72, estoqueInicialCaixas: 0, estoquePicking: 0, estoqueCentral: 0, estoqueMarketplace: 0, estoquePulmao: 0, estoqueContingencia: 0, vendaCaixas: 0, curvaAbc: 'C' },
  { sku: 21526, descricao: "JOHNNIE WALKER RED LABEL GFA VD 1L", unidade: "un", embalagem: 1, qtdPallet: 72, estoqueInicialCaixas: 0, estoquePicking: 0, estoqueCentral: 0, estoqueMarketplace: 0, estoquePulmao: 0, estoqueContingencia: 0, vendaCaixas: 0, curvaAbc: 'C' },
  { sku: 21530, descricao: "SMIRNOFF VODKA GFA VD 998ML", unidade: "un", embalagem: 1, qtdPallet: 72, estoqueInicialCaixas: 0, estoquePicking: 0, estoqueCentral: 0, estoqueMarketplace: 0, estoquePulmao: 0, estoqueContingencia: 0, vendaCaixas: 0, curvaAbc: 'C' },
  { sku: 29580, descricao: "STELLA PURE GOLD LONG NECK 330ML", unidade: "cx", embalagem: 24, qtdPallet: 84, estoqueInicialCaixas: 0, estoquePicking: 0, estoqueCentral: 0, estoqueMarketplace: 0, estoquePulmao: 0, estoqueContingencia: 0, vendaCaixas: 0, curvaAbc: 'C' },
  { sku: 12948, descricao: "BRAHMA CHOPP ZERO LATA 350ML SH C/12 NPAL", unidade: "cx", embalagem: 12, qtdPallet: 120, estoqueInicialCaixas: 0, estoquePicking: 0, estoqueCentral: 0, estoqueMarketplace: 0, estoquePulmao: 0, estoqueContingencia: 0, vendaCaixas: 0, curvaAbc: 'C' },
  { sku: 34325, descricao: "ELEVE AGUA MIN C GAS GFA PET 510ML", unidade: "cx", embalagem: 12, qtdPallet: 120, estoqueInicialCaixas: 0, estoquePicking: 0, estoqueCentral: 0, estoqueMarketplace: 0, estoquePulmao: 0, estoqueContingencia: 0, vendaCaixas: 0, curvaAbc: 'C' },
  { sku: 21658, descricao: "SPATEN LATA SLEEK 350ML CX CART C/12", unidade: "cx", embalagem: 12, qtdPallet: 120, estoqueInicialCaixas: 0, estoquePicking: 0, estoqueCentral: 0, estoqueMarketplace: 0, estoquePulmao: 0, estoqueContingencia: 0, vendaCaixas: 0, curvaAbc: 'C' },
  { sku: 34454, descricao: "H2OH LIMONETO LATA SLEEK 350ML", unidade: "cx", embalagem: 12, qtdPallet: 120, estoqueInicialCaixas: 0, estoquePicking: 0, estoqueCentral: 0, estoqueMarketplace: 0, estoquePulmao: 0, estoqueContingencia: 0, vendaCaixas: 0, curvaAbc: 'C' },
  { sku: 9084, descricao: "GUARANA CHP ANTARCTICA LATA 350ML", unidade: "cx", embalagem: 12, qtdPallet: 120, estoqueInicialCaixas: 0, estoquePicking: 0, estoqueCentral: 0, estoqueMarketplace: 0, estoquePulmao: 0, estoqueContingencia: 0, vendaCaixas: 0, curvaAbc: 'C' },
  { sku: 32500, descricao: "STELLA PURE GOLD LATA SLEEK 350ML", unidade: "cx", embalagem: 12, qtdPallet: 120, estoqueInicialCaixas: 0, estoquePicking: 0, estoqueCentral: 0, estoqueMarketplace: 0, estoquePulmao: 0, estoqueContingencia: 0, vendaCaixas: 0, curvaAbc: 'C' }
];
