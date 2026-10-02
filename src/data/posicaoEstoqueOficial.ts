import { PRODUCT_MASTER_DATA } from './productMasterData';

export interface PosicaoEstoqueItem {
  armazem: string;
  deposito: string;
  codigo: number;
  descricao: string;
  unidade: string;
  saldoAnterior: string;
  entradas: string;
  saidas: string;
  saldoAtual: string;
  transito: string;
  disponivelRaw: string;
  disponivelCx: number;
  disponivelAvulso: number;
  fatorPallet: number;
  fatorHecto: number;
  palletsDisponiveis: number;
  possuiPalletFechado: boolean;
  curva: 'A' | 'B' | 'C';
  grupo: string;
}

// Raw table parsed directly from the user's provided stock position spreadsheet
const RAW_ESTOQUE_TABLE = [
  { sku: 347, desc: "SUKITA PET 1L CAIXA C/12", un: "cx", disp: "260/04" },
  { sku: 371, desc: "MALZBIER BRAHMA LONG NECK 355ML SIX-PACK BAND", un: "cx", disp: "50/08" },
  { sku: 503, desc: "SUKITA PET 2L CAIXA C/6", un: "cx", disp: "595/00" },
  { sku: 504, desc: "PEPSI COLA PET 2L CAIXA C/6", un: "cx", disp: "411/01" },
  { sku: 982, desc: "SKOL 600ML", un: "Dz", disp: "350/10" },
  { sku: 988, desc: "BRAHMA CHOPP 600ML", un: "Dz", disp: "365/09" },
  { sku: 1164, desc: "SUKITA UVA LATA 350ML SH C/12 NPAL", un: "cx", disp: "284/08" },
  { sku: 1166, desc: "SUKITA UVA PET 2L CAIXA C/6", un: "cx", disp: "1/03" },
  { sku: 1388, desc: "SKOL GFA VD 1L 2,99", un: "Dz", disp: "0/06" },
  { sku: 1695, desc: "BRAHMA CHOPP GFA VD 1L COM TTC", un: "Dz", disp: "1/11" },
  { sku: 1743, desc: "ANTARCTICA PILSEN GFA VD 1L COM TTC", un: "Dz", disp: "0/08" },
  { sku: 1745, desc: "SKOL LT 269ML SH C15 NPAL", un: "cx", disp: "137/10" },
  { sku: 1898, desc: "BRAHMA CHOPP LT 269ML SH C15 NPAL", un: "cx", disp: "1/12" },
  { sku: 2008, desc: "ANTARCTICA SUBZERO LATA 350ML SH C/12 NPAL", un: "cx", disp: "208/05" },
  { sku: 2319, desc: "GUARANA CHP ANTARCTICA PET 1L CAIXA C/12", un: "cx", disp: "407/09" },
  { sku: 2320, desc: "SODA LIMONADA ANTARCTICA PET 1L CAIXA C/12", un: "cx", disp: "102/06" },
  { sku: 2349, desc: "GUARANA CHP ANTARCTICA PET 2L CAIXA C/6", un: "cx", disp: "1.072/05" },
  { sku: 2350, desc: "SODA LIMONADA ANTARCTICA PET 2L CAIXA C/6", un: "cx", disp: "327/05" },
  { sku: 2353, desc: "GUARANA CHP ANTARCTICA DIET PET 2L CAIXA C/6", un: "cx", disp: "262/00" },
  { sku: 2354, desc: "SODA LIMONADA ANTARCTICA DIET PET 2L CAIXA C/", un: "cx", disp: "238/00" },
  { sku: 2538, desc: "ANTARCTICA PILSEN 600ML", un: "Dz", disp: "0/03" },
  { sku: 2546, desc: "ORIGINAL 600ML", un: "Dz", disp: "86/01" },
  { sku: 2548, desc: "BUDWEISER 600ML", un: "Dz", disp: "345/05" },
  { sku: 4262, desc: "MICHELOB ULTRA N LT SLEEK 350ML C 8 CX CARTAO", un: "cx", disp: "1.806/07" },
  { sku: 4293, desc: "PEPSI BLACK PET 200ML SH C/12", un: "cx", disp: "13/05" },
  { sku: 4367, desc: "INDAIA AGUA MINERAL S/GAS GFA PET 1,5L FD C/6", un: "cx", disp: "3/05" },
  { sku: 4409, desc: "PEPSI TWIST PET 2L SHRINK C/6", un: "cx", disp: "223/02" },
  { sku: 6181, desc: "AGUA MIN DIAS DAVILA S/GAS PET 500ML CAIXA C/", un: "cx", disp: "8/09" },
  { sku: 6185, desc: "AGUA MIN DIAS DAVILA S/GAS PET 1,5L CAIXA C/6", un: "cx", disp: "0/01" },
  { sku: 7325, desc: "PEPSI COLA PET 1L CAIXA C/12", un: "cx", disp: "6/09" },
  { sku: 7945, desc: "PEPSI COLA PET 2,5L CAIXA C/6", un: "cx", disp: "41/04" },
  { sku: 7947, desc: "GUARANA CHP ANTARCTICA PET 2,5L CAIXA C/6", un: "cx", disp: "1/00" },
  { sku: 7977, desc: "GATORADE UVA PET 500ML SIXPACK", un: "cx", disp: "48/05" },
  { sku: 7980, desc: "GATORADE TANGERINA PET 500ML SIXPACK", un: "cx", disp: "300/03" },
  { sku: 7981, desc: "GATORADE LARANJA PET 500ML SIXPACK", un: "cx", disp: "89/00" },
  { sku: 7982, desc: "GATORADE LIMAO PET 500ML SIXPACK", un: "cx", disp: "157/04" },
  { sku: 7983, desc: "GATORADE MORANGO-MARACUJA PET 500ML SIXPACK", un: "cx", disp: "241/00" },
  { sku: 8791, desc: "H2OH LIMAO C/GAS PET 500ML CAIXA C/12", un: "cx", disp: "190/09" },
  { sku: 8793, desc: "H2OH LIMAO C/GAS PET 1,5L CAIXA C/6", un: "cx", disp: "26/00" },
  { sku: 9067, desc: "ANTARCTICA PILSEN LATA 350ML SH C/12 NPAL", un: "cx", disp: "1.340/08" },
  { sku: 9068, desc: "SKOL LATA 350ML SH C/12 NPAL", un: "cx", disp: "1.421/01" },
  { sku: 9069, desc: "BRAHMA CHOPP LATA 350ML SH C/12 NPAL", un: "cx", disp: "778/06" },
  { sku: 9071, desc: "CARACU LATA 350ML SH C/12 NPAL", un: "cx", disp: "0/11" },
  { sku: 9072, desc: "BOHEMIA NOVA EMBALAGEM LATA 350ML SH C/12 NPA", un: "cx", disp: "231/02" },
  { sku: 9081, desc: "MALZBIER BRAHMA LATA 350ML SH C/12 NPAL", un: "cx", disp: "230/03" },
  { sku: 9083, desc: "SKOL LT 473ML SH C/12 NPAL", un: "cx", disp: "1.160/07" },
  { sku: 9084, desc: "GUARANA CHP ANTARCTICA LATA 350ML SH C/12 NPA", un: "cx", disp: "215/00" },
  { sku: 9085, desc: "GUARANA CHP ANTARCTICA DIET LATA 350ML SH C/1", un: "cx", disp: "994/03" },
  { sku: 9087, desc: "SODA LIMONADA ANTARCTICA LATA 350ML SH C/12 N", un: "cx", disp: "74/03" },
  { sku: 9088, desc: "SODA LIMONADA ANTARCTICA DIET LATA 350ML SH C", un: "cx", disp: "505/11" },
  { sku: 9089, desc: "SUKITA LATA 350ML SH C/12 NPAL", un: "cx", disp: "38/09" },
  { sku: 9091, desc: "TONICA ANTARCTICA LATA 350ML SH C/12 NPAL", un: "cx", disp: "4/03" },
  { sku: 9092, desc: "TONICA ANTARCTICA DIET LATA 350ML SH C/12 NPA", un: "cx", disp: "301/05" },
  { sku: 9093, desc: "PEPSI TWIST LATA 350ML SH C/12 NPAL", un: "cx", disp: "289/06" },
  { sku: 9096, desc: "PEPSI COLA LATA 350ML SH C/12 NPAL", un: "cx", disp: "210/10" },
  { sku: 9274, desc: "PEPSI ZERO LATA 350ML SH C/12 NPAL", un: "cx", disp: "277/11" },
  { sku: 9276, desc: "PEPSI ZERO PET 2L CAIXA C/6", un: "cx", disp: "392/01" },
  { sku: 9320, desc: "BRAHMA CHOPP LT 473ML SH C/12 NPAL", un: "cx", disp: "431/05" },
  { sku: 9427, desc: "ANTARCTICA PILSEN LT 473ML SH C/12 NPAL", un: "cx", disp: "346/08" },
  { sku: 9795, desc: "GUARANA ANTARCTICA ZERO PET 1L CAIXA C/12", un: "cx", disp: "138/01" },
  { sku: 10175, desc: "ANTARCTICA SUBZERO LT 473ML SH C/12 NPAL", un: "cx", disp: "0/08" },
  { sku: 10530, desc: "ANTARCTICA SUBZERO GFA VD 1L", un: "Dz", disp: "0/09" },
  { sku: 12948, desc: "BRAHMA CHOPP ZERO LATA 350ML SH C/12 NPAL", un: "cx", disp: "405/07" },
  { sku: 12951, desc: "BRAHMA CHOPP ZERO LN 355ML SIXPACK CX CART C/", un: "cx", disp: "39/00" },
  { sku: 13061, desc: "H2OH LIMONETO PET 500ML SHRINK C/12 NPAL", un: "cx", disp: "1.879/07" },
  { sku: 13065, desc: "H2OH LIMONETO PET 1,5 SHRINK C/06 NPAL", un: "cx", disp: "2/04" },
  { sku: 13201, desc: "BRAHMA CHOPP GFA VD 300ML CX C/23", un: "cx", disp: "450/05" },
  { sku: 13203, desc: "ANTARCTICA PILSEN GFA VD 300ML CX C/23", un: "cx", disp: "1/04" },
  { sku: 13205, desc: "SKOL GFA VD 300ML CX C/23", un: "cx", disp: "865/09" },
  { sku: 13566, desc: "SKOL BEATS SENSES LT 269ML CX C/8 FRIDGE PACK", un: "cx", disp: "385/00" },
  { sku: 14135, desc: "BUDWEISER LATA 473ML SIX-PACK SH C/2 NPAL", un: "cx", disp: "74/02" },
  { sku: 17266, desc: "BOHEMIA LT 473ML CX CARTAO C/12", un: "cx", disp: "197/02" },
  { sku: 17808, desc: "BUDWEISER OW 330ML CX C/24", un: "cx", disp: "402/21" },
  { sku: 18152, desc: "GUARANA CHP ANTARCTICA PET 200ML SH C/12", un: "cx", disp: "1.025/02" },
  { sku: 18266, desc: "PEPSI COLA PET 200ML SH C/12", un: "cx", disp: "510/01" },
  { sku: 18267, desc: "SODA LIMONADA ANTARCTICA PET 200ML SH C/12", un: "cx", disp: "694/09" },
  { sku: 18268, desc: "SUKITA PET 200ML SH C/12", un: "cx", disp: "0/09" },
  { sku: 18780, desc: "CORONITA EXTRA N OW 210ML CX C/4 SIX PACK", un: "cx", disp: "228/16" },
  { sku: 18807, desc: "STELLA ARTOIS LONG NECK 330ML SIX-PACK SHRINK", un: "cx", disp: "179/17" },
  { sku: 18836, desc: "CORONA EXTRA N LONG NECK 330ML CX C/24 NPAL", un: "cx", disp: "493/03" },
  { sku: 19164, desc: "GUARANA CHP ANTARCTICA PET 1L PACK C/2 MULTPA", un: "cx", disp: "3.939/01" },
  { sku: 19225, desc: "RED BULL BR LATA 250ML CX C 24 NPAL .", un: "cx", disp: "15/22" },
  { sku: 19227, desc: "RED BULL BR LATA 355ML FOUR PACK .", un: "cx", disp: "0/02" },
  { sku: 19229, desc: "RED BULL BR LATA 250ML SIX PACK NPAL .", un: "cx", disp: "612/05" },
  { sku: 19231, desc: "RED BULL SUGAR FREE BR LATA 250ML FOUR PACK N", un: "cx", disp: "5/00" },
  { sku: 19321, desc: "GUARANA ANTARCTICA ZERO PET 200ML SH C/12", un: "cx", disp: "902/09" },
  { sku: 19668, desc: "ORIGINAL LATA 350ML SH C/12 NPAL", un: "cx", disp: "1.638/02" },
  { sku: 19729, desc: "STELLA ARTOIS LT SLEEK 350ML C 8 CX CARTAO", un: "cx", disp: "408/03" },
  { sku: 20164, desc: "SKOL LT 473ML SH C/12 NPAL MULTPACK 12", un: "cx", disp: "435/06" },
  { sku: 20217, desc: "ORIGINAL GFA VD 300ML CX C/23", un: "cx", disp: "422/13" },
  { sku: 20498, desc: "BRAHMA DUPLO MALTE LT SLEEK 350ML SH C 12", un: "cx", disp: "170/08" },
  { sku: 20530, desc: "STELLA ARTOIS 600 ML", un: "Dz", disp: "156/05" },
  { sku: 20535, desc: "STELLA ARTOIS ONE WAY 600ML CX C/12 NPAL", un: "cx", disp: "153/00" },
  { sku: 20651, desc: "CORONA EXTRA N LT SLEEK 350ML C 8 CX CARTAO", un: "cx", disp: "441/00" },
  { sku: 21020, desc: "BUDWEISER LT SLEEK 350ML CX CART C 12", un: "cx", disp: "2.822/00" },
  { sku: 21119, desc: "SKOL BEATS GT LT 269ML CX CARTAO C/8 NPAL", un: "cx", disp: "472/07" },
  { sku: 21441, desc: "SUKITA LIMAO PET 2L CAIXA C/6", un: "cx", disp: "128/03" },
  { sku: 21526, desc: "JOHNNIE WALKER RED LABEL GARRAFA VIDRO 1 L", un: "un", disp: "1.524/00" },
  { sku: 21527, desc: "TANQUERAY GIN LONDON DRY GARRAFA VIDRO 750ML", un: "un", disp: "3/00" },
  { sku: 21529, desc: "ABSOLUT ORIGINAL GARRAFA VIDRO 1 L", un: "un", disp: "356/00" },
  { sku: 21530, desc: "SMIRNOFF ORIGINAL GARRAFA VIDRO 998ML", un: "un", disp: "530/00" },
  { sku: 21632, desc: "SPATEN N LN 355ML SIXPACK SH C/4", un: "cx", disp: "1/17" },
  { sku: 21658, desc: "SPATEN N LT SLEEK 350ML CX CART C 12", un: "cx", disp: "876/06" },
  { sku: 21666, desc: "RED BULL TROPICAL BR LATA 250ML FOUR PACK NPA", un: "cx", disp: "4/00" },
  { sku: 21668, desc: "SPATEN N ONE WAY 600ML CX C/12 NP ARTE", un: "cx", disp: "35/11" },
  { sku: 21781, desc: "SMIRNOFF ICE GARRAFA VD 275ML CX C24", un: "cx", disp: "15/00" },
  { sku: 21787, desc: "DREHER GARRAFA VIDRO 900ML", un: "un", disp: "4/00" },
  { sku: 21792, desc: "WHITE HORSE GARRAFA VIDRO 1 L", un: "un", disp: "84/00" },
  { sku: 21955, desc: "CHIVAS REGAL 12 ANOS GARRAFA VIDRO 1 L", un: "un", disp: "309/00" },
  { sku: 21968, desc: "TRIDENT HORTELA ENVELOPE 8G CX C/21", un: "cx", disp: "65/00" },
  { sku: 21973, desc: "TRIDENT MELANCIA ENVELOPE 8G CX C/21", un: "cx", disp: "34/00" },
  { sku: 21974, desc: "TRIDENT TUTTI-FRUTTI ENVELOPE 8G CX C/21", un: "cx", disp: "10/00" },
  { sku: 22003, desc: "HALLS CEREJA ENVELOPE 28G CX C/21", un: "cx", disp: "100/00" },
  { sku: 22005, desc: "HALLS MENTA ENVELOPE 28G CX C/21", un: "cx", disp: "59/00" },
  { sku: 22007, desc: "HALLS EXTRA FORTE ENVELOPE 28G CX C/21", un: "cx", disp: "1/00" },
  { sku: 22177, desc: "BUDWEISER ZERO LT SLEEK 350ML C 8 CX CARTAO", un: "cx", disp: "508/04" },
  { sku: 22180, desc: "BUDWEISER ZERO LONG NECK 330ML SIX-PACK SHRIN", un: "cx", disp: "41/07" },
  { sku: 22382, desc: "PASSPORT SELECTION GARRAFA VIDRO 1 L", un: "un", disp: "208/00" },
  { sku: 22562, desc: "DOMECQ COQ. COMPOSTO GARRAFA VIDRO 1 L", un: "un", disp: "330/00" },
  { sku: 23028, desc: "BUCHANANS WHISKY DELUXE 12 ANOS GARRAFA VIDRO", un: "un", disp: "70/00" },
  { sku: 23184, desc: "PITU AGUARDENTE LT 350ML CX C/12", un: "cx", disp: "0/02" },
  { sku: 23186, desc: "SPATEN N 600ML", un: "Dz", disp: "38/08" },
  { sku: 23269, desc: "SKOL BEATS GT LONG NECK 269ML SIX-PACK SH C/4", un: "cx", disp: "1/06" },
  { sku: 23271, desc: "SKOL BEATS SENSES LONG NECK 269ML SIX-PACK SH", un: "cx", disp: "34/23" },
  { sku: 23443, desc: "PITU AGUARDENTE GARRAFA VIDRO 965ML", un: "un", disp: "1/00" },
  { sku: 23546, desc: "INDAIA AGUA MINERAL C/GAS GFA PET 500ML PACK", un: "cx", disp: "0/07" },
  { sku: 23552, desc: "INDAIA AGUA MINERAL S/GAS GFA PET 500ML PACK", un: "cx", disp: "430/08" },
  { sku: 23671, desc: "CERVEGELA PLASTICA BRAHMA 1 UN P/ GFA 1L CX C", un: "cx", disp: "160/00" },
  { sku: 23672, desc: "CERVEGELA PLASTICA BRAHMA 1 UN P/ GFA 600ML C", un: "cx", disp: "435/00" },
  { sku: 24161, desc: "S. JOAO BARRA CONHAQUE ALC. GARRAFA VIDRO 900", un: "un", disp: "420/00" },
  { sku: 24168, desc: "MICHELOB ULTRA N LONG NECK 330ML SIX-PACK SHR", un: "cx", disp: "177/06" },
  { sku: 24256, desc: "PETROPOLIS AGUA MIN SEM GAS PET 1,5 SHRINK C/", un: "cx", disp: "1/00" },
  { sku: 24304, desc: "TODDYNHO 200ML TETRA PAK 200 ML CX C/27", un: "cx", disp: "61/00" },
  { sku: 24306, desc: "RED BULL MELANCIA LATA 250ML FOUR PACK NPAL", un: "cx", disp: "818/02" },
  { sku: 24408, desc: "QUINTA DO MORGADO VINHO TINTO SECO GFA VD 750", un: "un", disp: "50/00" },
  { sku: 24409, desc: "QUINTA DO MORGADO VINHO TINTO SUAVE GFA VD 75", un: "un", disp: "469/00" },
  { sku: 24410, desc: "QUINTA DO MORGADO VINHO BRANCO SUAVE GFA VD 7", un: "un", disp: "200/00" },
  { sku: 24486, desc: "GALLO AZEITE OLIVA EX. VIR. GFA VDR 500ML", un: "un", disp: "496/00" },
  { sku: 24488, desc: "GALLO AZEITE OLIVA EX. VIR. GFA VDR 250ML", un: "un", disp: "86/00" },
  { sku: 24609, desc: "MINALBA AGUA PREMIUM S/GAS GFA VDR 300ML CX/1", un: "cx", disp: "2/00" },
  { sku: 25151, desc: "OLD PARR WHISKY GFA VDR 1L", un: "un", disp: "3.205/00" },
  { sku: 25178, desc: "51 ICE LIMAO GARRAFA VD 275ML CX C24", un: "cx", disp: "2/00" },
  { sku: 25194, desc: "CACHACA 51 LT 350ML CX C/12", un: "cx", disp: "1/04" },
  { sku: 25303, desc: "GARRAFEIRA PL. PRETO BEES 1 UN P/24 GFA 600ML", un: "un", disp: "899/00" },
  { sku: 25329, desc: "SALTON ESPUMANTE BRUT GFA VD 750 ML", un: "un", disp: "29/00" },
  { sku: 25335, desc: "SALTON ESPUMANTE BRUT ROSE GFA VD 750 ML", un: "un", disp: "2/00" },
  { sku: 25347, desc: "SALTON ESPUMANTE CLASSIC MOSCATEL GFA VD 750", un: "un", disp: "72/00" },
  { sku: 25429, desc: "MATUTA CACHACA CRISTAL GARRAFA VIDRO 1 L", un: "un", disp: "71/00" },
  { sku: 25430, desc: "MATUTA CACHACA UMBURANA GARRAFA VIDRO 1 L", un: "un", disp: "177/00" },
  { sku: 25434, desc: "MATUTA CACHACA MEL E LIMAO GARRAFA VIDRO 1 L", un: "un", disp: "10/00" },
  { sku: 25546, desc: "GARRAFEIRA PL. AL. LAT. AB. PRETA BEES 1 UN P", un: "un", disp: "1.365/00" },
  { sku: 25700, desc: "FUSION PET 2L SHRINK C/6", un: "cx", disp: "2/04" },
  { sku: 25837, desc: "SPATEN N LT 473ML CX CARTAO C/12", un: "cx", disp: "85/10" },
  { sku: 26037, desc: "MONTILLA CARTA CRISTAL GFA VDR 1L", un: "un", disp: "3/00" },
  { sku: 26462, desc: "ORIGINAL LT 473ML CX CARTAO C/12", un: "cx", disp: "105/11" },
  { sku: 27177, desc: "HALLS MENTOL ENVELOPE 28G CX C/21", un: "cx", disp: "65/00" },
  { sku: 27179, desc: "HALLS MORANGO ENVELOPE 28G CX C/21", un: "cx", disp: "4/00-" },
  { sku: 27522, desc: "CACHACA 51 PIRASSUNUNGA GFA VD 965ML RET CX/1", un: "cx", disp: "0/11" },
  { sku: 27559, desc: "CACHACA 51 PIRASSUNUNGA OURO GFA VD 965ML RET", un: "cx", disp: "12/10" },
  { sku: 27560, desc: "CASILLERO DEL DIABLO VINH RESERVA MALBEC GFA", un: "un", disp: "13/00" },
  { sku: 27562, desc: "CASILLERO DEL DIABLO VINH RESERVA MERLOT GFA", un: "un", disp: "11/00" },
  { sku: 27566, desc: "RESERVADO VINHO SWEET RED GFA VD 750 ML", un: "un", disp: "13/00" },
  { sku: 27613, desc: "CASILLERO DEL DIABLO VNH RSV CABER SAUVG GFA", un: "un", disp: "1/00" },
  { sku: 27866, desc: "CORONA CERO SUNBREW N LONG NECK 330 ML SP BAS", un: "cx", disp: "109/11" },
  { sku: 29197, desc: "TANG REFRESCO EM PO LIMAO PCT 18G DP C/18", un: "cx", disp: "27/00" },
  { sku: 29199, desc: "TANG REFRESCO EM PO LARANJA PCT 18G DP C/18", un: "cx", disp: "5/00" },
  { sku: 29201, desc: "TANG REFRESCO EM PO ABACAXI PCT 18G DP C/18", un: "cx", disp: "30/08" },
  { sku: 29207, desc: "TANG REFRESCO EM PO MORANGO PCT 18G DP C/18", un: "cx", disp: "15/00" },
  { sku: 29209, desc: "TANG REFRESCO EM PO MARACUJA PCT 18G DP C/18", un: "cx", disp: "4/00" },
  { sku: 29215, desc: "TANG REFRESCO EM PO UVA PCT 18G DP C/18", un: "cx", disp: "12/00" },
  { sku: 29253, desc: "ORIGINAL GFA VD 1L", un: "Dz", disp: "2/05" },
  { sku: 29323, desc: "INDAIA BEB MISTA CITRUS LARANJA GFA PET 330ML", un: "cx", disp: "0/10" },
  { sku: 29326, desc: "INDAIA BEB MISTA CITRUS LARANJA GFA PET 1,5L", un: "cx", disp: "1/00" },
  { sku: 29416, desc: "CERVEGELA BUDWEISER 1 UN P/ GF 600ML CX3", un: "cx", disp: "407/00" },
  { sku: 29418, desc: "CERVEGELA BUDWEISER LITRAO 1 UN P/ GF 1L PACK", un: "cx", disp: "107/00" },
  { sku: 29504, desc: "OLD PARR WHISKY 12 ANOS GFA VD 750 ML", un: "un", disp: "365/00" },
  { sku: 29505, desc: "CIROC VODKA GFA VD 750 ML", un: "un", disp: "15/00" },
  { sku: 29508, desc: "JOHNNIE WALKER WHISKY GOLD LABEL RESERVE GFA", un: "un", disp: "154/00" },
  { sku: 29580, desc: "STELLA ARTOIS PURE GOLD LONG NECK 330ML SP SH", un: "cx", disp: "299/00" },
  { sku: 29733, desc: "HALLS MELANCIA ENVELOPE 28G CX C/21", un: "cx", disp: "27/00" },
  { sku: 29845, desc: "PEPSI BLACK PET 1 L SH C/12", un: "cx", disp: "141/06" },
  { sku: 29926, desc: "JOHNNIE  WALKER BLACK LABEL WHISKY ICONS GARR", un: "un", disp: "7/00" },
  { sku: 30045, desc: "RED BULL BR LATA 473ML CX C 12", un: "cx", disp: "36/04" },
  { sku: 31064, desc: "BUDWEISER LT 269ML SH C 15", un: "cx", disp: "229/09" },
  { sku: 31582, desc: "YPE LAVA LOUCAS LIQUIDO CLEAR FRASCO PLASTICO", un: "cx", disp: "12/00" },
  { sku: 31589, desc: "YPE LAVA LOUCAS LIQUIDO MACA FRASCO PLASTICO", un: "cx", disp: "0/20" },
  { sku: 31667, desc: "YPE LAVA LOUCAS LIQUIDO NEUTRO FRASCO PLASTIC", un: "cx", disp: "30/00" },
  { sku: 31669, desc: "YPE LAVA LOUCAS LIQUIDO COCO FRASCO PLASTICO", un: "cx", disp: "0/23" },
  { sku: 31678, desc: "YPE AMACIANTE CONC BLUE GARDEN FRASCO PLAST 1", un: "cx", disp: "15/00" },
  { sku: 31708, desc: "YPE AMACIANTE CONC BLUE GARDEN FRASCO PLAST 5", un: "cx", disp: "1/00" },
  { sku: 31713, desc: "YPE AMACIANTE CONC PINK FRASCO PLAST 500ML CX", un: "cx", disp: "1/00" },
  { sku: 31805, desc: "YPE TIXAN LAVA ROUPAS LIQ PRIMAVERA FRASCO PL", un: "cx", disp: "41/00" },
  { sku: 31807, desc: "YPE LAVA ROUPAS LIQ POWER ACT FRASCO PLAST 1", un: "cx", disp: "1/00" },
  { sku: 32067, desc: "GATORADE BERRY BLUE PET 500ML SIXPACK", un: "cx", disp: "95/00" },
  { sku: 32126, desc: "AMINDUS GRELHADITOS AMEND. TOR. S/ PELE PCT 2", un: "cx", disp: "2/00" },
  { sku: 32349, desc: "BEATS TROPICAL LT 269ML CX CARTAO C/8 NPAL", un: "cx", disp: "2/00" },
  { sku: 32361, desc: "BEATS TROPICAL LONG NECK 269ML SIX-PACK SH C/", un: "cx", disp: "4/12" },
  { sku: 32500, desc: "STELLA ARTOIS PURE GOLD LT SLEEK 350ML C 8 CX", un: "cx", disp: "269/00" },
  { sku: 32526, desc: "PETROPOLIS AGUA MIN SEM GAS GARRAFA PET 500ML", un: "cx", disp: "204/05" },
  { sku: 32528, desc: "PETROPOLIS AGUA MIN COM GAS GARRAFA PET 500ML", un: "cx", disp: "132/07" },
  { sku: 32538, desc: "PERGOLA SEL. VINHO TINTO SUAVE GARRAFA VIDRO", un: "un", disp: "545/00" },
  { sku: 32644, desc: "BUBBALOO UVA DISPLAY 5G CX/60", un: "cx", disp: "2/00" },
  { sku: 32648, desc: "BUBBALOO MORANGO DISPLAY 5G CX/60", un: "cx", disp: "2/00" },
  { sku: 32969, desc: "RED BULL SUMMER MORANGO E PESSEGO LATA 250ML", un: "cx", disp: "0/03" },
  { sku: 33046, desc: "YPE TIXAN LAVA ROUPAS PO MACIEZ SACHE PLASTIC", un: "cx", disp: "2/00" },
  { sku: 33048, desc: "YPE TIXAN LAVA ROUPAS PO PRIMAV SACHE PLASTIC", un: "cx", disp: "2/00" },
  { sku: 33061, desc: "YPE TIXAN LAVA ROUPAS PO MACIEZ SACHE 400G CX", un: "cx", disp: "1/00" },
  { sku: 33109, desc: "51 OURO AGUARDENTE COMPOSTA LT 350ML CX C/12", un: "cx", disp: "30/00" },
  { sku: 33212, desc: "SKOL BEATS SENSES PET 1 L SH C/06", un: "cx", disp: "162/04" },
  { sku: 33734, desc: "BEATS RED MIX LT 269ML SH C/8", un: "cx", disp: "490/07" },
  { sku: 33738, desc: "BEATS RED MIX LONG NECK 269ML SIX-PACK SH C/2", un: "cx", disp: "28/11" },
  { sku: 33818, desc: "ORIGINAL LATA 350ML SHRINK C/12 MULTPACK", un: "cx", disp: "103/06" },
  { sku: 33820, desc: "BRAHMA CHOPP LATA 350ML SH C/12 NPAL MULTIPAC", un: "cx", disp: "1.811/02" },
  { sku: 33857, desc: "STELLA ARTOIS PURE GOLD 600ML", un: "Dz", disp: "118/05" },
  { sku: 34027, desc: "GUARANA CHP ANTARCTICA LATA 350ML SH C/12 NPA", un: "cx", disp: "14/06" },
  { sku: 34263, desc: "CORONA CERO SUNBREW N LT SLEEK 350ML C 8 CX C", un: "cx", disp: "479/04" },
  { sku: 34296, desc: "TRIDENT CANELA ENVELOPE 8G CX C/21", un: "cx", disp: "97/00" },
  { sku: 34298, desc: "TRIDENT MORANGO ENVELOPE 8G CX C/21", un: "cx", disp: "2/00" },
  { sku: 34320, desc: "GUARANA ANTARCTICA ZERO LATA 350ML SH C/12 NP", un: "cx", disp: "16/02" },
  { sku: 34325, desc: "ELEVE AGUA MIN C GAS GFA PET 510ML FD C/12", un: "cx", disp: "464/08" },
  { sku: 34410, desc: "HALLS UVA VERDE ENVELOPE 28G CX C/21", un: "cx", disp: "1/00" },
  { sku: 34420, desc: "RED BULL SUMMER MARACUJA E MELAO LATA 250ML F", un: "cx", disp: "1/02" },
  { sku: 34429, desc: "RED BULL SUGAR FREE AMORA LATA 250ML FOUR PAC", un: "cx", disp: "845/03" },
  { sku: 34454, desc: "H2OH LIMONETO LT SLEEK 350ML SH C 12", un: "cx", disp: "338/02" },
  { sku: 34475, desc: "ELEVE AGUA MIN S GAS GFA PET 510ML FD C/12", un: "cx", disp: "117/03" },
  { sku: 34479, desc: "ELEVE AGUA MIN S GAS PET 1,5 SHRINK C/6", un: "cx", disp: "227/03" },
  { sku: 34529, desc: "YPE TIXAN LAVA ROUPAS LIQ MACIEZ FRASCO PLAST", un: "cx", disp: "38/00" },
  { sku: 34608, desc: "SKOL LATA 350ML SH C/12 NPAL MULTIPACK", un: "cx", disp: "8.361/05" },
  { sku: 34770, desc: "RED BULL SUGAR FREE POMELO LATA 250ML FOUR PA", un: "cx", disp: "149/00" },
  { sku: 34918, desc: "DIAS DAVILA AGUA MINERAL S GAS GFA PET 500ML", un: "cx", disp: "274/11" },
  { sku: 34920, desc: "DIAS DAVILA AGUA MINERAL S GAS GFA PET 1,5L F", un: "cx", disp: "0/02" },
  { sku: 34923, desc: "DIAS DAVILA AGUA MINERAL C GAS GFA PET 500ML", un: "cx", disp: "24/01" },
  { sku: 35003, desc: "TRIDENT XFRESH 5S PRETO CEREJA ENVELOPE 8G CX", un: "cx", disp: "4/00" },
  { sku: 35012, desc: "MENDORATO PCT 45G DISPLAY C10", un: "cx", disp: "2/00" },
  { sku: 35331, desc: "BUDWEISER GFA VD 1L", un: "Dz", disp: "258/11" },
  { sku: 35338, desc: "BUDWEISER ZERO LT 473ML SH C/12 NPAL", un: "cx", disp: "149/00" },
  { sku: 35617, desc: "BEATS GREEN MIX LT 269ML SH C/8", un: "cx", disp: "176/03" },
  { sku: 35620, desc: "BEATS GREEN MIX LONG NECK 269ML SIX-PACK SH C", un: "cx", disp: "70/00" },
  { sku: 35992, desc: "CASAL GARCIA VINHO BR VERDE GFA VD 750 ML", un: "un", disp: "70/00" },
  { sku: 36024, desc: "SKOL ZERO LONG NECK 330ML SIX-PACK SHRINK C/4", un: "cx", disp: "5/00" },
  { sku: 36028, desc: "SKOL ZERO LT SLEEK 350ML SH C 12", un: "cx", disp: "323/00" },
  { sku: 36034, desc: "BUDWEISER LT 473ML SH C12 NP MULTIPACK", un: "cx", disp: "273/05" },
  { sku: 37450, desc: "BUDWEISER LT SLEEK 350ML SH C 12 MULTIPACK", un: "cx", disp: "2.205/00" },
  { sku: 37576, desc: "DOCES VIEIRA PE DE MOCA PCT PLAST 23G POTE C/", un: "cx", disp: "14/00" },
  { sku: 37579, desc: "DOCES VIEIRA BEIJO DE LEITE PCT PLAST 23G POT", un: "cx", disp: "97/00" },
  { sku: 37580, desc: "DOCES VIEIRA CHURRITOS PCT PLAST 23G POTE C/4", un: "cx", disp: "35/00" },
  { sku: 37581, desc: "DOCES VIEIRA COCADA BAIANA PCT PLAST 23G POTE", un: "cx", disp: "3/00" },
  { sku: 37582, desc: "DOCES VIEIRA COCADA BRANCA PCT PLAST 23G POTE", un: "cx", disp: "12/00" },
  { sku: 37583, desc: "DOCES VIEIRA BEIJO DE MOCA PCT PLAST 23G POTE", un: "cx", disp: "58/39" },
  { sku: 37933, desc: "DOCES VIEIRA BRIGADEIRO PCT PLAST 23G POTE C/", un: "cx", disp: "2/39" }
];

function parseDisponivel(raw: string): { cx: number; avulso: number } {
  if (!raw) return { cx: 0, avulso: 0 };
  const cleaned = raw.trim().replace('-', '');
  const parts = cleaned.split('/');
  const cxStr = (parts[0] || '0').replace(/\./g, '').trim();
  const avulsoStr = (parts[1] || '0').trim();
  const cx = parseInt(cxStr, 10) || 0;
  const avulso = parseInt(avulsoStr, 10) || 0;
  return { cx, avulso };
}

// Lookup rápido por SKU no cadastro de produtos
const MASTER_MAP = new Map<number, (typeof PRODUCT_MASTER_DATA)[0]>();
PRODUCT_MASTER_DATA.forEach(p => MASTER_MAP.set(Number(p.cod), p));

// Itens com dados consolidados e cálculo de pallets fechados
export const POSICAO_ESTOQUE_OFICIAL: PosicaoEstoqueItem[] = RAW_ESTOQUE_TABLE.map(row => {
  const master = MASTER_MAP.get(row.sku);
  const { cx, avulso } = parseDisponivel(row.disp);
  
  // Fator pallet cadastrado
  let fatorPal = master?.fatorPallet && master.fatorPallet > 0 ? master.fatorPallet : 84;
  if (row.un.toLowerCase().includes('dz')) {
    fatorPal = master?.fatorPallet && master.fatorPallet > 0 ? master.fatorPallet : 84;
  }

  const fatorHec = master?.fatorHecto && master.fatorHecto > 0 ? master.fatorHecto : 0.072;
  const curva = (master?.curva as 'A' | 'B' | 'C') || 'B';
  const grupo = master?.grupo || 'CERVEJA';

  // Pallets fechados disponíveis = caixas inteiras / fator do pallet
  const palletsDisponiveis = fatorPal > 0 ? Math.floor(cx / fatorPal) : 0;
  const possuiPalletFechado = palletsDisponiveis >= 1;

  return {
    armazem: "01",
    deposito: "01",
    codigo: row.sku,
    descricao: master?.descricao || row.desc,
    unidade: row.un,
    saldoAnterior: "",
    entradas: "",
    saidas: "",
    saldoAtual: "",
    transito: "",
    disponivelRaw: row.disp,
    disponivelCx: cx,
    disponivelAvulso: avulso,
    fatorPallet: fatorPal,
    fatorHecto: fatorHec,
    palletsDisponiveis,
    possuiPalletFechado,
    curva,
    grupo
  };
});

// Apenas itens com quantidade suficiente para formar pallet fechado (palletsDisponiveis >= 1)
export const ITENS_ELEGIVEIS_PALLET_FECHADO = POSICAO_ESTOQUE_OFICIAL.filter(
  item => item.possuiPalletFechado && item.palletsDisponiveis >= 1
);

// Mapa de fácil acesso por SKU
export const POSICAO_ESTOQUE_MAP = new Map<number, PosicaoEstoqueItem>();
POSICAO_ESTOQUE_OFICIAL.forEach(item => POSICAO_ESTOQUE_MAP.set(item.codigo, item));
