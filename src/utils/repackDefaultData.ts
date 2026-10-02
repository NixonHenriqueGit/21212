import { RepackRow } from '../types';
import { RetroactiveRecord } from './dadosRetroativosUtils';
import { RawRepackJsonItem } from './retroactiveRepackParser';

/**
 * Base de Dados Oficial de Repack (Ano 2026) Embutida no Código da Plataforma
 * Contém registros históricos detalhados por data, embalagem, operador, tempos reais e metas calculadas.
 */
export const OFFICIAL_REPACK_DATA_JSON: RawRepackJsonItem[] = [
  {
    "Data": "2026-01-01",
    "Embalagem": "PET 2,5L",
    "Quantidade": 1,
    "Inicio": "14:50:21",
    "Fim": "14:57:12",
    "Meta": "00:04:30",
    "Resultado": "🔴 ACIMA DA META",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-01",
    "Embalagem": "PET 500ML",
    "Quantidade": 2,
    "Inicio": "15:55:05",
    "Fim": "15:57:17",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-01",
    "Embalagem": "LATA 350",
    "Quantidade": 11,
    "Inicio": "15:14:49",
    "Fim": "15:43:46",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-01",
    "Embalagem": "PET 200ML",
    "Quantidade": 2,
    "Inicio": "16:01:57",
    "Fim": "16:04:57",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-01",
    "Embalagem": "PET 2L",
    "Quantidade": 1,
    "Inicio": "15:48:19",
    "Fim": "15:50:09",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-01",
    "Embalagem": "PET 1L",
    "Quantidade": 2,
    "Inicio": "14:50:21",
    "Fim": "15:07:47",
    "Meta": "00:05:30",
    "Resultado": "🔴 ACIMA DA META",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-01",
    "Embalagem": "PET 2L",
    "Quantidade": 7,
    "Inicio": "14:20:00",
    "Fim": "14:48:37",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-06",
    "Embalagem": "LATA 350",
    "Quantidade": 2,
    "Inicio": "14:17:37",
    "Fim": "14:20:25",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-06",
    "Embalagem": "PET 2L",
    "Quantidade": 10,
    "Inicio": "11:30:09",
    "Fim": "11:52:45",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-06",
    "Embalagem": "LONG NECK",
    "Quantidade": 3,
    "Inicio": "08:37:44",
    "Fim": "08:46:11",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-06",
    "Embalagem": "LATA 269",
    "Quantidade": 2,
    "Inicio": "10:30:41",
    "Fim": "10:35:19",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-06",
    "Embalagem": "LATA 473",
    "Quantidade": 1,
    "Inicio": "10:19:12",
    "Fim": "10:21:22",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-06",
    "Embalagem": "PET 1L",
    "Quantidade": 3,
    "Inicio": "11:05:48",
    "Fim": "11:13:30",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-06",
    "Embalagem": "PET 200ML",
    "Quantidade": 1,
    "Inicio": "10:30:41",
    "Fim": "11:05:22",
    "Meta": "00:05:00",
    "Resultado": "🔴 ACIMA DA META",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-06",
    "Embalagem": "LATA 350",
    "Quantidade": 19,
    "Inicio": "09:01:23",
    "Fim": "09:49:28",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-06",
    "Embalagem": "LATA 269",
    "Quantidade": 2,
    "Inicio": "14:10:06",
    "Fim": "14:13:31",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-06",
    "Embalagem": "PET 2,5L",
    "Quantidade": 1,
    "Inicio": "14:06:46",
    "Fim": "14:09:38",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-07",
    "Embalagem": "PET 200ML",
    "Quantidade": 2,
    "Inicio": "11:29:17",
    "Fim": "11:45:51",
    "Meta": "00:05:00",
    "Resultado": "🔴 ACIMA DA META",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-07",
    "Embalagem": "LATA 269",
    "Quantidade": 1,
    "Inicio": "11:29:17",
    "Fim": "11:48:10",
    "Meta": "00:04:30",
    "Resultado": "🔴 ACIMA DA META",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-07",
    "Embalagem": "LATA 350",
    "Quantidade": 12,
    "Inicio": "08:56:37",
    "Fim": "09:31:59",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-07",
    "Embalagem": "LATA 473",
    "Quantidade": 3,
    "Inicio": "09:46:56",
    "Fim": "09:51:36",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-07",
    "Embalagem": "PET 1L",
    "Quantidade": 4,
    "Inicio": "10:03:00",
    "Fim": "10:13:27",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-07",
    "Embalagem": "PET 500ML",
    "Quantidade": 3,
    "Inicio": "11:29:17",
    "Fim": "11:35:12",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-07",
    "Embalagem": "PET 1L",
    "Quantidade": 7,
    "Inicio": "10:31:17",
    "Fim": "10:45:21",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-07",
    "Embalagem": "LONG NECK",
    "Quantidade": 1,
    "Inicio": "08:27:53",
    "Fim": "08:29:50",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-07",
    "Embalagem": "PET 2L",
    "Quantidade": 5,
    "Inicio": "11:08:49",
    "Fim": "11:21:20",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-08",
    "Embalagem": "LATA 473",
    "Quantidade": 2,
    "Inicio": "10:53:18",
    "Fim": "10:59:38",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-08",
    "Embalagem": "LATA 350",
    "Quantidade": 14,
    "Inicio": "08:52:24",
    "Fim": "09:24:00",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-08",
    "Embalagem": "LONG NECK",
    "Quantidade": 1,
    "Inicio": "11:34:40",
    "Fim": "11:36:56",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-08",
    "Embalagem": "LATA 473",
    "Quantidade": 3,
    "Inicio": "08:43:04",
    "Fim": "08:52:02",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-08",
    "Embalagem": "PET 1L",
    "Quantidade": 5,
    "Inicio": "09:46:20",
    "Fim": "09:58:56",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-08",
    "Embalagem": "PET 2L",
    "Quantidade": 6,
    "Inicio": "10:18:43",
    "Fim": "10:34:01",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-08",
    "Embalagem": "LATA 350",
    "Quantidade": 2,
    "Inicio": "10:53:18",
    "Fim": "10:55:52",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-08",
    "Embalagem": "PET 500ML",
    "Quantidade": 2,
    "Inicio": "11:06:47",
    "Fim": "11:11:38",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-11",
    "Embalagem": "PET 2L",
    "Quantidade": 7,
    "Inicio": "14:14:21",
    "Fim": "14:30:03",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-11",
    "Embalagem": "PET 1L",
    "Quantidade": 5,
    "Inicio": "14:52:10",
    "Fim": "15:03:10",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-11",
    "Embalagem": "LATA 473",
    "Quantidade": 4,
    "Inicio": "10:40:53",
    "Fim": "10:48:12",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-11",
    "Embalagem": "LATA 350",
    "Quantidade": 16,
    "Inicio": "11:07:32",
    "Fim": "11:36:51",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-11",
    "Embalagem": "PET 2L",
    "Quantidade": 1,
    "Inicio": "15:23:42",
    "Fim": "15:25:32",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-11",
    "Embalagem": "PET 500ML",
    "Quantidade": 3,
    "Inicio": "15:12:05",
    "Fim": "15:17:15",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-11",
    "Embalagem": "PET 200ML",
    "Quantidade": 2,
    "Inicio": "15:06:11",
    "Fim": "15:09:27",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-11",
    "Embalagem": "LATA 350",
    "Quantidade": 7,
    "Inicio": "15:48:39",
    "Fim": "16:00:37",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-11",
    "Embalagem": "LONG NECK",
    "Quantidade": 3,
    "Inicio": "10:29:02",
    "Fim": "10:36:57",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-12",
    "Embalagem": "LATA 350",
    "Quantidade": 7,
    "Inicio": "09:05:24",
    "Fim": "09:19:24",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-12",
    "Embalagem": "PET 2L",
    "Quantidade": 8,
    "Inicio": "10:27:54",
    "Fim": "10:45:08",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-12",
    "Embalagem": "LATA 269",
    "Quantidade": 2,
    "Inicio": "10:51:43",
    "Fim": "10:53:11",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-12",
    "Embalagem": "PET 1L",
    "Quantidade": 3,
    "Inicio": "10:14:29",
    "Fim": "10:21:25",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-12",
    "Embalagem": "PET 500ML",
    "Quantidade": 7,
    "Inicio": "09:46:34",
    "Fim": "09:59:19",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-12",
    "Embalagem": "LONG NECK",
    "Quantidade": 2,
    "Inicio": "08:16:06",
    "Fim": "08:23:48",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-12",
    "Embalagem": "LATA 473",
    "Quantidade": 6,
    "Inicio": "08:27:23",
    "Fim": "08:38:24",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-12",
    "Embalagem": "PET 200ML",
    "Quantidade": 1,
    "Inicio": "10:53:22",
    "Fim": "10:55:27",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-13",
    "Embalagem": "LATA 473",
    "Quantidade": 2,
    "Inicio": "14:08:29",
    "Fim": "14:11:31",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-13",
    "Embalagem": "PET 1L",
    "Quantidade": 4,
    "Inicio": "10:11:11",
    "Fim": "10:18:33",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-13",
    "Embalagem": "PET 2L",
    "Quantidade": 2,
    "Inicio": "10:34:35",
    "Fim": "10:38:03",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-13",
    "Embalagem": "LONG NECK",
    "Quantidade": 2,
    "Inicio": "09:19:40",
    "Fim": "09:26:07",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-13",
    "Embalagem": "LATA 350",
    "Quantidade": 16,
    "Inicio": "11:25:06",
    "Fim": "11:50:18",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-13",
    "Embalagem": "PET 500ML",
    "Quantidade": 2,
    "Inicio": "10:46:07",
    "Fim": "10:49:31",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-13",
    "Embalagem": "LATA 269",
    "Quantidade": 2,
    "Inicio": "14:11:47",
    "Fim": "14:14:07",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-13",
    "Embalagem": "PET 1L",
    "Quantidade": 1,
    "Inicio": "10:38:10",
    "Fim": "10:40:28",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-13",
    "Embalagem": "PET 2L",
    "Quantidade": 10,
    "Inicio": "09:32:29",
    "Fim": "09:57:15",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-13",
    "Embalagem": "LATA 350",
    "Quantidade": 5,
    "Inicio": "13:58:47",
    "Fim": "14:07:58",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-14",
    "Embalagem": "LATA 350",
    "Quantidade": 14,
    "Inicio": "09:39:55",
    "Fim": "10:09:16",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-14",
    "Embalagem": "PET 1L",
    "Quantidade": 3,
    "Inicio": "09:16:20",
    "Fim": "09:23:35",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-14",
    "Embalagem": "LONG NECK",
    "Quantidade": 1,
    "Inicio": "10:43:07",
    "Fim": "10:45:02",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-14",
    "Embalagem": "LATA 473",
    "Quantidade": 3,
    "Inicio": "10:16:26",
    "Fim": "10:21:18",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-14",
    "Embalagem": "PET 2L",
    "Quantidade": 12,
    "Inicio": "08:21:54",
    "Fim": "08:54:20",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-14",
    "Embalagem": "LATA 269",
    "Quantidade": 1,
    "Inicio": "10:36:53",
    "Fim": "10:37:46",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-14",
    "Embalagem": "PET 500ML",
    "Quantidade": 1,
    "Inicio": "10:45:14",
    "Fim": "10:46:39",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-14",
    "Embalagem": "PET 200ML",
    "Quantidade": 1,
    "Inicio": "10:38:01",
    "Fim": "10:39:04",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-18",
    "Embalagem": "PET 1L",
    "Quantidade": 2,
    "Inicio": "11:29:26",
    "Fim": "11:34:44",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-18",
    "Embalagem": "PET 2L",
    "Quantidade": 12,
    "Inicio": "10:38:16",
    "Fim": "11:11:43",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-18",
    "Embalagem": "LATA 473",
    "Quantidade": 1,
    "Inicio": "16:22:03",
    "Fim": "16:23:38",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-18",
    "Embalagem": "LATA 473",
    "Quantidade": 6,
    "Inicio": "11:48:08",
    "Fim": "11:56:32",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-18",
    "Embalagem": "LATA 350",
    "Quantidade": 38,
    "Inicio": "14:52:40",
    "Fim": "16:19:55",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-19",
    "Embalagem": "LATA 473",
    "Quantidade": 1,
    "Inicio": "09:17:23",
    "Fim": "09:19:01",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-19",
    "Embalagem": "LATA 350",
    "Quantidade": 15,
    "Inicio": "08:22:06",
    "Fim": "08:48:24",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-19",
    "Embalagem": "PET 2,5L",
    "Quantidade": 1,
    "Inicio": "10:57:52",
    "Fim": "11:00:09",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-19",
    "Embalagem": "LATA 250",
    "Quantidade": 1,
    "Inicio": "11:09:51",
    "Fim": "11:11:40",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-19",
    "Embalagem": "PET 500ML",
    "Quantidade": 11,
    "Inicio": "11:17:09",
    "Fim": "11:42:17",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-19",
    "Embalagem": "PET 1L",
    "Quantidade": 3,
    "Inicio": "10:18:46",
    "Fim": "10:24:42",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-19",
    "Embalagem": "LATA 269",
    "Quantidade": 4,
    "Inicio": "09:19:15",
    "Fim": "09:24:06",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-19",
    "Embalagem": "PET 2L",
    "Quantidade": 6,
    "Inicio": "10:32:44",
    "Fim": "10:47:52",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-19",
    "Embalagem": "LATA 473",
    "Quantidade": 1,
    "Inicio": "11:47:17",
    "Fim": "11:49:39",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-19",
    "Embalagem": "PET 1L",
    "Quantidade": 7,
    "Inicio": "09:55:35",
    "Fim": "10:17:11",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-20",
    "Embalagem": "PET 500ML",
    "Quantidade": 3,
    "Inicio": "10:50:30",
    "Fim": "10:58:44",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-20",
    "Embalagem": "LATA 350",
    "Quantidade": 12,
    "Inicio": "11:01:08",
    "Fim": "11:27:17",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-20",
    "Embalagem": "PET 2,5L",
    "Quantidade": 1,
    "Inicio": "09:56:40",
    "Fim": "09:59:03",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-20",
    "Embalagem": "PET 500ML",
    "Quantidade": 2,
    "Inicio": "14:46:23",
    "Fim": "14:49:15",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-20",
    "Embalagem": "LATA 473",
    "Quantidade": 3,
    "Inicio": "11:40:51",
    "Fim": "11:47:21",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-20",
    "Embalagem": "LATA 250",
    "Quantidade": 3,
    "Inicio": "11:32:10",
    "Fim": "11:37:06",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-20",
    "Embalagem": "PET 200ML",
    "Quantidade": 10,
    "Inicio": "14:17:47",
    "Fim": "14:29:52",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-20",
    "Embalagem": "PET 1L",
    "Quantidade": 4,
    "Inicio": "10:17:35",
    "Fim": "10:26:22",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-20",
    "Embalagem": "LONG NECK",
    "Quantidade": 4,
    "Inicio": "08:46:35",
    "Fim": "08:58:16",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-20",
    "Embalagem": "PET 2L",
    "Quantidade": 10,
    "Inicio": "09:28:22",
    "Fim": "09:55:17",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-21",
    "Embalagem": "PET 200ML",
    "Quantidade": 3,
    "Inicio": "14:30:11",
    "Fim": "14:37:21",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-21",
    "Embalagem": "LATA 350",
    "Quantidade": 4,
    "Inicio": "14:44:33",
    "Fim": "14:54:36",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-21",
    "Embalagem": "LATA 350",
    "Quantidade": 2,
    "Inicio": "14:17:28",
    "Fim": "14:23:44",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-21",
    "Embalagem": "LONG NECK",
    "Quantidade": 1,
    "Inicio": "10:45:25",
    "Fim": "10:48:12",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-21",
    "Embalagem": "PET 2L",
    "Quantidade": 7,
    "Inicio": "08:06:05",
    "Fim": "08:25:16",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-21",
    "Embalagem": "PET 500ML",
    "Quantidade": 2,
    "Inicio": "10:50:37",
    "Fim": "10:57:14",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-21",
    "Embalagem": "PET 1L",
    "Quantidade": 6,
    "Inicio": "08:43:45",
    "Fim": "09:03:13",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-21",
    "Embalagem": "LATA 269",
    "Quantidade": 1,
    "Inicio": "14:54:53",
    "Fim": "14:56:06",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-21",
    "Embalagem": "LATA 350",
    "Quantidade": 8,
    "Inicio": "11:37:31",
    "Fim": "11:53:18",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-21",
    "Embalagem": "LATA 473",
    "Quantidade": 4,
    "Inicio": "11:05:45",
    "Fim": "11:16:51",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-22",
    "Embalagem": "PET 2,5L",
    "Quantidade": 2,
    "Inicio": "16:01:05",
    "Fim": "16:07:07",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-22",
    "Embalagem": "PET 2L",
    "Quantidade": 11,
    "Inicio": "14:41:04",
    "Fim": "15:16:40",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-22",
    "Embalagem": "LONG NECK",
    "Quantidade": 3,
    "Inicio": "14:30:02",
    "Fim": "14:37:01",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-22",
    "Embalagem": "PET 1L",
    "Quantidade": 6,
    "Inicio": "16:07:28",
    "Fim": "16:20:19",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-22",
    "Embalagem": "LATA 350",
    "Quantidade": 12,
    "Inicio": "16:25:14",
    "Fim": "16:47:12",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-25",
    "Embalagem": "PET 2L",
    "Quantidade": 4,
    "Inicio": "15:19:47",
    "Fim": "15:31:04",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-25",
    "Embalagem": "PET 200ML",
    "Quantidade": 3,
    "Inicio": "15:35:34",
    "Fim": "15:43:21",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-25",
    "Embalagem": "LATA 269",
    "Quantidade": 5,
    "Inicio": "11:17:43",
    "Fim": "11:27:22",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-25",
    "Embalagem": "LATA 350",
    "Quantidade": 12,
    "Inicio": "10:26:09",
    "Fim": "10:56:58",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-25",
    "Embalagem": "PET 500ML",
    "Quantidade": 8,
    "Inicio": "11:35:52",
    "Fim": "11:54:21",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-25",
    "Embalagem": "LATA 350",
    "Quantidade": 1,
    "Inicio": "15:43:33",
    "Fim": "15:45:06",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-25",
    "Embalagem": "PET 1L",
    "Quantidade": 11,
    "Inicio": "14:10:30",
    "Fim": "15:10:43",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-25",
    "Embalagem": "LATA 473",
    "Quantidade": 5,
    "Inicio": "10:01:00",
    "Fim": "10:13:50",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-26",
    "Embalagem": "LATA 269",
    "Quantidade": 2,
    "Inicio": "12:01:44",
    "Fim": "12:04:18",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-26",
    "Embalagem": "LATA 473",
    "Quantidade": 2,
    "Inicio": "11:57:24",
    "Fim": "12:01:30",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-26",
    "Embalagem": "LATA 350",
    "Quantidade": 15,
    "Inicio": "11:19:25",
    "Fim": "11:55:44",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-26",
    "Embalagem": "PET 1L",
    "Quantidade": 5,
    "Inicio": "10:24:00",
    "Fim": "10:38:34",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-26",
    "Embalagem": "PET 500ML",
    "Quantidade": 7,
    "Inicio": "10:50:03",
    "Fim": "11:04:55",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-26",
    "Embalagem": "PET 2L",
    "Quantidade": 11,
    "Inicio": "09:52:24",
    "Fim": "10:17:04",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-26",
    "Embalagem": "LONG NECK",
    "Quantidade": 2,
    "Inicio": "14:27:13",
    "Fim": "14:32:56",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-27",
    "Embalagem": "LATA 473",
    "Quantidade": 2,
    "Inicio": "08:48:27",
    "Fim": "08:53:56",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-27",
    "Embalagem": "PET 1L",
    "Quantidade": 5,
    "Inicio": "10:45:33",
    "Fim": "11:01:57",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-27",
    "Embalagem": "PET 2,5L",
    "Quantidade": 2,
    "Inicio": "10:28:48",
    "Fim": "10:34:45",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-27",
    "Embalagem": "PET 200ML",
    "Quantidade": 1,
    "Inicio": "11:04:22",
    "Fim": "11:05:35",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-27",
    "Embalagem": "LONG NECK",
    "Quantidade": 2,
    "Inicio": "08:25:00",
    "Fim": "08:34:14",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-27",
    "Embalagem": "LATA 269",
    "Quantidade": 1,
    "Inicio": "11:02:13",
    "Fim": "11:03:57",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-27",
    "Embalagem": "LATA 350",
    "Quantidade": 12,
    "Inicio": "09:26:47",
    "Fim": "09:49:50",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-27",
    "Embalagem": "PET 2L",
    "Quantidade": 5,
    "Inicio": "10:15:28",
    "Fim": "10:28:35",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-28",
    "Embalagem": "PET 200ML",
    "Quantidade": 1,
    "Inicio": "11:19:53",
    "Fim": "11:21:05",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-28",
    "Embalagem": "LATA 250",
    "Quantidade": 6,
    "Inicio": "14:56:18",
    "Fim": "15:02:32",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-28",
    "Embalagem": "PET 2L",
    "Quantidade": 8,
    "Inicio": "08:58:11",
    "Fim": "09:23:01",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-28",
    "Embalagem": "LATA 350",
    "Quantidade": 2,
    "Inicio": "14:51:24",
    "Fim": "14:55:59",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-28",
    "Embalagem": "LATA 269",
    "Quantidade": 3,
    "Inicio": "11:14:07",
    "Fim": "11:19:27",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-28",
    "Embalagem": "PET 1L",
    "Quantidade": 5,
    "Inicio": "09:23:27",
    "Fim": "09:37:34",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-28",
    "Embalagem": "PET 500ML",
    "Quantidade": 2,
    "Inicio": "11:05:40",
    "Fim": "11:08:44",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-28",
    "Embalagem": "LATA 350",
    "Quantidade": 1,
    "Inicio": "11:21:19",
    "Fim": "11:22:22",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-28",
    "Embalagem": "LATA 473",
    "Quantidade": 1,
    "Inicio": "11:02:34",
    "Fim": "11:04:29",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-28",
    "Embalagem": "LATA 350",
    "Quantidade": 16,
    "Inicio": "10:05:48",
    "Fim": "10:53:27",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-28",
    "Embalagem": "PET 500ML",
    "Quantidade": 11,
    "Inicio": "14:36:26",
    "Fim": "14:36:40",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-29",
    "Embalagem": "PET 1L",
    "Quantidade": 3,
    "Inicio": "10:55:35",
    "Fim": "11:06:57",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-29",
    "Embalagem": "PET 2L",
    "Quantidade": 10,
    "Inicio": "10:20:10",
    "Fim": "10:52:55",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-29",
    "Embalagem": "LATA 350",
    "Quantidade": 28,
    "Inicio": "14:14:12",
    "Fim": "15:19:06",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-29",
    "Embalagem": "LATA 350",
    "Quantidade": 11,
    "Inicio": "11:26:15",
    "Fim": "11:47:32",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-29",
    "Embalagem": "LATA 473",
    "Quantidade": 1,
    "Inicio": "15:23:24",
    "Fim": "15:25:01",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-29",
    "Embalagem": "PET 500ML",
    "Quantidade": 2,
    "Inicio": "11:07:14",
    "Fim": "11:10:54",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-29",
    "Embalagem": "PET 200ML",
    "Quantidade": 2,
    "Inicio": "15:19:50",
    "Fim": "15:23:12",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-01-29",
    "Embalagem": "PET 2,5L",
    "Quantidade": 1,
    "Inicio": "10:53:09",
    "Fim": "10:55:16",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-01",
    "Embalagem": "LATA 350",
    "Quantidade": 7,
    "Inicio": "09:24:34",
    "Fim": "09:39:02",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-01",
    "Embalagem": "LATA 473",
    "Quantidade": 3,
    "Inicio": "10:03:17",
    "Fim": "10:11:11",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-01",
    "Embalagem": "LATA 350",
    "Quantidade": 3,
    "Inicio": "09:57:05",
    "Fim": "10:03:05",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-01",
    "Embalagem": "PET 2,5L",
    "Quantidade": 2,
    "Inicio": "09:11:55",
    "Fim": "09:16:08",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-01",
    "Embalagem": "PET 1L",
    "Quantidade": 1,
    "Inicio": "10:36:36",
    "Fim": "10:40:13",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-01",
    "Embalagem": "LONG NECK",
    "Quantidade": 3,
    "Inicio": "10:27:03",
    "Fim": "10:36:23",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-01",
    "Embalagem": "PET 2L",
    "Quantidade": 9,
    "Inicio": "08:38:26",
    "Fim": "09:10:30",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-02",
    "Embalagem": "LATA 350",
    "Quantidade": 14,
    "Inicio": "11:13:22",
    "Fim": "11:28:14",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-02",
    "Embalagem": "LATA 350",
    "Quantidade": 22,
    "Inicio": "08:41:19",
    "Fim": "09:44:24",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-02",
    "Embalagem": "PET 2,5L",
    "Quantidade": 1,
    "Inicio": "10:36:29",
    "Fim": "10:38:54",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-02",
    "Embalagem": "PET 500ML",
    "Quantidade": 1,
    "Inicio": "11:01:32",
    "Fim": "11:03:38",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-02",
    "Embalagem": "PET 2L",
    "Quantidade": 5,
    "Inicio": "10:25:17",
    "Fim": "10:35:55",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-02",
    "Embalagem": "LATA 473",
    "Quantidade": 2,
    "Inicio": "09:57:03",
    "Fim": "10:02:35",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-02",
    "Embalagem": "PET 1L",
    "Quantidade": 4,
    "Inicio": "10:50:39",
    "Fim": "11:01:19",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-02",
    "Embalagem": "LONG NECK",
    "Quantidade": 1,
    "Inicio": "10:05:51",
    "Fim": "10:08:15",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-03",
    "Embalagem": "PET 2L",
    "Quantidade": 3,
    "Inicio": "11:38:39",
    "Fim": "11:49:47",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-03",
    "Embalagem": "PET 200ML",
    "Quantidade": 1,
    "Inicio": "14:39:51",
    "Fim": "14:41:50",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-03",
    "Embalagem": "PET 1L",
    "Quantidade": 2,
    "Inicio": "14:28:12",
    "Fim": "14:36:06",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-03",
    "Embalagem": "LATA 473",
    "Quantidade": 4,
    "Inicio": "11:08:44",
    "Fim": "11:20:55",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-03",
    "Embalagem": "LATA 250",
    "Quantidade": 4,
    "Inicio": "15:06:34",
    "Fim": "15:10:50",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-03",
    "Embalagem": "LATA 350",
    "Quantidade": 20,
    "Inicio": "09:53:47",
    "Fim": "10:48:30",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-03",
    "Embalagem": "LONG NECK",
    "Quantidade": 3,
    "Inicio": "14:56:43",
    "Fim": "15:05:19",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-03",
    "Embalagem": "PET 2L",
    "Quantidade": 4,
    "Inicio": "14:10:43",
    "Fim": "14:23:16",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-03",
    "Embalagem": "PET 500ML",
    "Quantidade": 1,
    "Inicio": "14:36:18",
    "Fim": "14:39:39",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-04",
    "Embalagem": "LATA 350",
    "Quantidade": 13,
    "Inicio": "16:00:52",
    "Fim": "16:28:19",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-04",
    "Embalagem": "PET 2L",
    "Quantidade": 8,
    "Inicio": "10:51:21",
    "Fim": "11:13:08",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-04",
    "Embalagem": "PET 1L",
    "Quantidade": 7,
    "Inicio": "09:50:55",
    "Fim": "10:13:39",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-04",
    "Embalagem": "PET 500ML",
    "Quantidade": 3,
    "Inicio": "11:24:50",
    "Fim": "11:31:54",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-04",
    "Embalagem": "LATA 473",
    "Quantidade": 2,
    "Inicio": "11:47:00",
    "Fim": "11:52:25",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-04",
    "Embalagem": "PET 200ML",
    "Quantidade": 4,
    "Inicio": "11:33:10",
    "Fim": "11:40:10",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-05",
    "Embalagem": "LATA 473",
    "Quantidade": 1,
    "Inicio": "09:29:56",
    "Fim": "09:31:54",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-05",
    "Embalagem": "PET 1L",
    "Quantidade": 5,
    "Inicio": "11:03:43",
    "Fim": "11:17:26",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-05",
    "Embalagem": "PET 200ML",
    "Quantidade": 3,
    "Inicio": "10:23:21",
    "Fim": "10:28:51",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-05",
    "Embalagem": "PET 500ML",
    "Quantidade": 6,
    "Inicio": "10:09:22",
    "Fim": "10:23:05",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-05",
    "Embalagem": "PET 2L",
    "Quantidade": 6,
    "Inicio": "10:37:07",
    "Fim": "10:55:28",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-05",
    "Embalagem": "LATA 269",
    "Quantidade": 1,
    "Inicio": "09:32:12",
    "Fim": "09:33:26",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-05",
    "Embalagem": "LONG NECK",
    "Quantidade": 3,
    "Inicio": "11:33:49",
    "Fim": "11:42:04",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-05",
    "Embalagem": "LATA 350",
    "Quantidade": 6,
    "Inicio": "09:13:35",
    "Fim": "09:29:22",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-05",
    "Embalagem": "PET 1L",
    "Quantidade": 4,
    "Inicio": "09:41:44",
    "Fim": "09:54:39",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-06",
    "Embalagem": "PET 2L",
    "Quantidade": 9,
    "Inicio": "09:25:22",
    "Fim": "09:53:38",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-06",
    "Embalagem": "PET 1L",
    "Quantidade": 3,
    "Inicio": "08:39:23",
    "Fim": "08:47:19",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-06",
    "Embalagem": "LATA 350",
    "Quantidade": 10,
    "Inicio": "10:01:05",
    "Fim": "10:22:58",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-06",
    "Embalagem": "PET 200ML",
    "Quantidade": 2,
    "Inicio": "10:26:46",
    "Fim": "10:32:14",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-06",
    "Embalagem": "PET 500ML",
    "Quantidade": 1,
    "Inicio": "10:32:26",
    "Fim": "10:34:07",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-06",
    "Embalagem": "LONG NECK",
    "Quantidade": 2,
    "Inicio": "08:54:49",
    "Fim": "08:59:53",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-06",
    "Embalagem": "LATA 473",
    "Quantidade": 1,
    "Inicio": "10:23:28",
    "Fim": "10:25:07",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-08",
    "Embalagem": "LATA 269",
    "Quantidade": 1,
    "Inicio": "11:13:05",
    "Fim": "11:14:44",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-08",
    "Embalagem": "PET 500ML",
    "Quantidade": 2,
    "Inicio": "11:42:56",
    "Fim": "11:48:15",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-08",
    "Embalagem": "PET 200ML",
    "Quantidade": 1,
    "Inicio": "11:48:39",
    "Fim": "11:50:24",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-08",
    "Embalagem": "PET 1L",
    "Quantidade": 2,
    "Inicio": "11:28:22",
    "Fim": "11:34:28",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-08",
    "Embalagem": "LONG NECK",
    "Quantidade": 2,
    "Inicio": "09:29:01",
    "Fim": "09:36:33",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-08",
    "Embalagem": "LATA 350",
    "Quantidade": 1,
    "Inicio": "11:50:46",
    "Fim": "11:52:37",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-08",
    "Embalagem": "PET 2L",
    "Quantidade": 3,
    "Inicio": "11:17:41",
    "Fim": "11:28:13",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-08",
    "Embalagem": "LATA 473",
    "Quantidade": 7,
    "Inicio": "10:55:48",
    "Fim": "11:12:51",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-08",
    "Embalagem": "LATA 350",
    "Quantidade": 13,
    "Inicio": "10:19:17",
    "Fim": "10:46:28",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-09",
    "Embalagem": "PET 2L",
    "Quantidade": 5,
    "Inicio": "14:48:12",
    "Fim": "15:06:39",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-09",
    "Embalagem": "PET 2L",
    "Quantidade": 2,
    "Inicio": "15:38:10",
    "Fim": "15:44:42",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-09",
    "Embalagem": "PET 1L",
    "Quantidade": 7,
    "Inicio": "11:27:19",
    "Fim": "11:47:53",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-09",
    "Embalagem": "PET 2,5L",
    "Quantidade": 1,
    "Inicio": "15:06:57",
    "Fim": "15:09:07",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-09",
    "Embalagem": "LATA 350",
    "Quantidade": 18,
    "Inicio": "10:32:30",
    "Fim": "11:20:15",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-09",
    "Embalagem": "PET 200ML",
    "Quantidade": 2,
    "Inicio": "15:58:22",
    "Fim": "16:01:29",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-09",
    "Embalagem": "PET 1L",
    "Quantidade": 2,
    "Inicio": "15:31:01",
    "Fim": "15:37:58",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-09",
    "Embalagem": "PET 500ML",
    "Quantidade": 2,
    "Inicio": "15:50:13",
    "Fim": "15:55:41",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-09",
    "Embalagem": "LATA 350",
    "Quantidade": 1,
    "Inicio": "16:01:41",
    "Fim": "16:03:59",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-09",
    "Embalagem": "LATA 473",
    "Quantidade": 7,
    "Inicio": "09:50:03",
    "Fim": "10:24:27",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-09",
    "Embalagem": "LONG NECK",
    "Quantidade": 1,
    "Inicio": "15:55:54",
    "Fim": "15:58:13",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-09",
    "Embalagem": "PET 1L",
    "Quantidade": 6,
    "Inicio": "14:12:45",
    "Fim": "14:32:22",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-10",
    "Embalagem": "LATA 473",
    "Quantidade": 4,
    "Inicio": "14:25:58",
    "Fim": "14:39:26",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-10",
    "Embalagem": "LATA 350",
    "Quantidade": 3,
    "Inicio": "14:39:44",
    "Fim": "14:47:23",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-10",
    "Embalagem": "PET 2L",
    "Quantidade": 8,
    "Inicio": "10:14:58",
    "Fim": "10:39:36",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-10",
    "Embalagem": "LATA 350",
    "Quantidade": 7,
    "Inicio": "14:06:50",
    "Fim": "14:25:13",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-10",
    "Embalagem": "LATA 269",
    "Quantidade": 3,
    "Inicio": "11:02:31",
    "Fim": "11:07:54",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-10",
    "Embalagem": "PET 200ML",
    "Quantidade": 1,
    "Inicio": "14:49:12",
    "Fim": "14:50:41",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-10",
    "Embalagem": "PET 1L",
    "Quantidade": 4,
    "Inicio": "09:24:44",
    "Fim": "09:39:15",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-10",
    "Embalagem": "PET 500ML",
    "Quantidade": 2,
    "Inicio": "10:57:04",
    "Fim": "11:02:19",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-10",
    "Embalagem": "LONG NECK",
    "Quantidade": 2,
    "Inicio": "11:29:15",
    "Fim": "11:34:52",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-10",
    "Embalagem": "LATA 269",
    "Quantidade": 1,
    "Inicio": "14:47:36",
    "Fim": "14:49:01",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-11",
    "Embalagem": "PET 200ML",
    "Quantidade": 1,
    "Inicio": "15:10:34",
    "Fim": "15:12:24",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-11",
    "Embalagem": "LATA 473",
    "Quantidade": 2,
    "Inicio": "14:57:03",
    "Fim": "15:02:11",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-11",
    "Embalagem": "PET 1L",
    "Quantidade": 7,
    "Inicio": "09:00:10",
    "Fim": "09:36:18",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-11",
    "Embalagem": "LONG NECK",
    "Quantidade": 1,
    "Inicio": "15:08:26",
    "Fim": "15:10:24",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-11",
    "Embalagem": "PET 500ML",
    "Quantidade": 7,
    "Inicio": "09:37:02",
    "Fim": "09:57:45",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-11",
    "Embalagem": "PET 2,5L",
    "Quantidade": 2,
    "Inicio": "10:23:35",
    "Fim": "10:27:49",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-11",
    "Embalagem": "PET 2L",
    "Quantidade": 4,
    "Inicio": "10:00:30",
    "Fim": "10:16:00",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-11",
    "Embalagem": "LATA 350",
    "Quantidade": 9,
    "Inicio": "14:05:49",
    "Fim": "14:28:08",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-11",
    "Embalagem": "PET 1L",
    "Quantidade": 1,
    "Inicio": "15:13:05",
    "Fim": "15:15:53",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-11",
    "Embalagem": "LATA 350",
    "Quantidade": 13,
    "Inicio": "10:47:51",
    "Fim": "11:37:31",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-11",
    "Embalagem": "LATA 269",
    "Quantidade": 18,
    "Inicio": "15:35:51",
    "Fim": "16:06:32",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-12",
    "Embalagem": "PET 2L",
    "Quantidade": 4,
    "Inicio": "09:57:52",
    "Fim": "10:12:56",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-12",
    "Embalagem": "LONG NECK",
    "Quantidade": 1,
    "Inicio": "11:07:11",
    "Fim": "11:09:15",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-12",
    "Embalagem": "LATA 350",
    "Quantidade": 7,
    "Inicio": "10:30:39",
    "Fim": "10:45:05",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-12",
    "Embalagem": "LATA 350",
    "Quantidade": 2,
    "Inicio": "10:50:32",
    "Fim": "10:55:15",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-12",
    "Embalagem": "LATA 473",
    "Quantidade": 2,
    "Inicio": "10:45:29",
    "Fim": "10:50:20",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-12",
    "Embalagem": "PET 1L",
    "Quantidade": 2,
    "Inicio": "09:39:17",
    "Fim": "09:44:20",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-12",
    "Embalagem": "PET 500ML",
    "Quantidade": 4,
    "Inicio": "09:26:23",
    "Fim": "09:39:06",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-12",
    "Embalagem": "PET 2,5L",
    "Quantidade": 1,
    "Inicio": "10:13:09",
    "Fim": "10:15:09",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-17",
    "Embalagem": "PET 200ML",
    "Quantidade": 2,
    "Inicio": "11:22:51",
    "Fim": "11:26:18",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-17",
    "Embalagem": "LATA 350",
    "Quantidade": 6,
    "Inicio": "14:21:34",
    "Fim": "14:35:14",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-17",
    "Embalagem": "PET 1L",
    "Quantidade": 3,
    "Inicio": "10:43:55",
    "Fim": "10:53:09",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-17",
    "Embalagem": "PET 2L",
    "Quantidade": 8,
    "Inicio": "15:06:17",
    "Fim": "15:28:27",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-17",
    "Embalagem": "LATA 269",
    "Quantidade": 1,
    "Inicio": "14:42:28",
    "Fim": "14:43:49",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-17",
    "Embalagem": "PET 2L",
    "Quantidade": 5,
    "Inicio": "11:06:25",
    "Fim": "11:22:37",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-17",
    "Embalagem": "LATA 350",
    "Quantidade": 26,
    "Inicio": "08:27:18",
    "Fim": "09:51:57",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-17",
    "Embalagem": "PET 500ML",
    "Quantidade": 1,
    "Inicio": "15:04:15",
    "Fim": "15:06:09",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-17",
    "Embalagem": "PET 500ML",
    "Quantidade": 3,
    "Inicio": "10:34:29",
    "Fim": "10:43:28",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-17",
    "Embalagem": "LATA 473",
    "Quantidade": 1,
    "Inicio": "09:54:21",
    "Fim": "09:56:25",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-18",
    "Embalagem": "PET 1L",
    "Quantidade": 5,
    "Inicio": "11:36:40",
    "Fim": "11:50:32",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-18",
    "Embalagem": "PET 2L",
    "Quantidade": 7,
    "Inicio": "14:28:01",
    "Fim": "14:59:44",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-18",
    "Embalagem": "PET 200ML",
    "Quantidade": 1,
    "Inicio": "15:13:40",
    "Fim": "15:15:17",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-18",
    "Embalagem": "PET 2,5L",
    "Quantidade": 3,
    "Inicio": "15:00:55",
    "Fim": "15:13:16",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-18",
    "Embalagem": "LATA 473",
    "Quantidade": 2,
    "Inicio": "11:08:24",
    "Fim": "11:15:00",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-18",
    "Embalagem": "LATA 473",
    "Quantidade": 3,
    "Inicio": "09:58:52",
    "Fim": "10:06:32",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-18",
    "Embalagem": "LATA 350",
    "Quantidade": 14,
    "Inicio": "10:35:06",
    "Fim": "11:07:52",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-18",
    "Embalagem": "PET 500ML",
    "Quantidade": 2,
    "Inicio": "11:29:48",
    "Fim": "11:36:29",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-18",
    "Embalagem": "LONG NECK",
    "Quantidade": 4,
    "Inicio": "09:28:57",
    "Fim": "09:39:15",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-19",
    "Embalagem": "LATA 350",
    "Quantidade": 2,
    "Inicio": "15:11:09",
    "Fim": "15:14:02",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-19",
    "Embalagem": "LATA 473",
    "Quantidade": 3,
    "Inicio": "10:41:23",
    "Fim": "10:47:26",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-19",
    "Embalagem": "PET 200ML",
    "Quantidade": 5,
    "Inicio": "15:11:21",
    "Fim": "15:22:50",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-19",
    "Embalagem": "PET 2L",
    "Quantidade": 3,
    "Inicio": "08:56:56",
    "Fim": "09:06:35",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-19",
    "Embalagem": "PET 500ML",
    "Quantidade": 6,
    "Inicio": "09:30:22",
    "Fim": "09:45:25",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-19",
    "Embalagem": "PET 200ML",
    "Quantidade": 2,
    "Inicio": "10:47:35",
    "Fim": "10:51:22",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-19",
    "Embalagem": "LATA 350",
    "Quantidade": 11,
    "Inicio": "10:07:26",
    "Fim": "10:30:30",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-19",
    "Embalagem": "PET 1L",
    "Quantidade": 2,
    "Inicio": "09:10:16",
    "Fim": "09:17:49",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-19",
    "Embalagem": "LATA 269",
    "Quantidade": 20,
    "Inicio": "11:19:04",
    "Fim": "11:49:32",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-22",
    "Embalagem": "PET 2L",
    "Quantidade": 4,
    "Inicio": "14:05:21",
    "Fim": "14:19:47",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-22",
    "Embalagem": "LATA 269",
    "Quantidade": 2,
    "Inicio": "15:24:03",
    "Fim": "15:26:24",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-22",
    "Embalagem": "PET 1L",
    "Quantidade": 8,
    "Inicio": "11:04:09",
    "Fim": "11:34:52",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-22",
    "Embalagem": "LATA 350",
    "Quantidade": 15,
    "Inicio": "14:34:46",
    "Fim": "15:23:31",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-22",
    "Embalagem": "PET 500ML",
    "Quantidade": 1,
    "Inicio": "15:29:27",
    "Fim": "15:31:27",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-22",
    "Embalagem": "LATA 473",
    "Quantidade": 2,
    "Inicio": "15:26:34",
    "Fim": "15:29:19",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-22",
    "Embalagem": "PET 200ML",
    "Quantidade": 11,
    "Inicio": "09:57:35",
    "Fim": "10:29:55",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-23",
    "Embalagem": "LATA 250",
    "Quantidade": 1,
    "Inicio": "15:23:08",
    "Fim": "15:24:32",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-23",
    "Embalagem": "PET 200ML",
    "Quantidade": 4,
    "Inicio": "10:22:38",
    "Fim": "10:30:06",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-23",
    "Embalagem": "PET 1L",
    "Quantidade": 2,
    "Inicio": "10:11:04",
    "Fim": "10:17:18",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-23",
    "Embalagem": "LATA 350",
    "Quantidade": 15,
    "Inicio": "11:17:38",
    "Fim": "11:51:15",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-23",
    "Embalagem": "LATA 473",
    "Quantidade": 4,
    "Inicio": "15:13:44",
    "Fim": "15:22:51",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-23",
    "Embalagem": "PET 500ML",
    "Quantidade": 2,
    "Inicio": "10:17:29",
    "Fim": "10:22:28",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-23",
    "Embalagem": "PET 2L",
    "Quantidade": 7,
    "Inicio": "09:38:04",
    "Fim": "09:58:26",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-23",
    "Embalagem": "LATA 269",
    "Quantidade": 3,
    "Inicio": "11:09:06",
    "Fim": "11:16:55",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-23",
    "Embalagem": "LATA 350",
    "Quantidade": 6,
    "Inicio": "14:33:59",
    "Fim": "14:46:33",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-23",
    "Embalagem": "LATA 269",
    "Quantidade": 1,
    "Inicio": "15:24:47",
    "Fim": "15:26:09",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-24",
    "Embalagem": "LATA 473",
    "Quantidade": 7,
    "Inicio": "14:19:47",
    "Fim": "14:43:51",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-24",
    "Embalagem": "PET 2L",
    "Quantidade": 14,
    "Inicio": "09:23:01",
    "Fim": "10:07:39",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-24",
    "Embalagem": "LATA 269",
    "Quantidade": 7,
    "Inicio": "15:44:55",
    "Fim": "15:55:40",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-24",
    "Embalagem": "PET 200ML",
    "Quantidade": 1,
    "Inicio": "15:34:02",
    "Fim": "15:35:52",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-24",
    "Embalagem": "PET 500ML",
    "Quantidade": 7,
    "Inicio": "10:54:40",
    "Fim": "11:13:15",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-24",
    "Embalagem": "LATA 350",
    "Quantidade": 13,
    "Inicio": "14:56:05",
    "Fim": "15:31:00",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-24",
    "Embalagem": "PET 1L",
    "Quantidade": 4,
    "Inicio": "10:17:29",
    "Fim": "10:34:40",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-24",
    "Embalagem": "PET 500ML",
    "Quantidade": 1,
    "Inicio": "15:31:30",
    "Fim": "15:33:53",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-25",
    "Embalagem": "LATA 350",
    "Quantidade": 1,
    "Inicio": "11:51:15",
    "Fim": "11:53:19",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-25",
    "Embalagem": "LATA 473",
    "Quantidade": 2,
    "Inicio": "11:43:21",
    "Fim": "11:51:02",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-25",
    "Embalagem": "LATA 350",
    "Quantidade": 3,
    "Inicio": "16:00:06",
    "Fim": "16:07:03",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-25",
    "Embalagem": "LATA 269",
    "Quantidade": 5,
    "Inicio": "16:17:16",
    "Fim": "16:25:10",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-25",
    "Embalagem": "PET 1L",
    "Quantidade": 7,
    "Inicio": "15:25:04",
    "Fim": "15:47:04",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-25",
    "Embalagem": "LATA 350",
    "Quantidade": 25,
    "Inicio": "10:18:00",
    "Fim": "11:20:28",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-25",
    "Embalagem": "PET 500ML",
    "Quantidade": 2,
    "Inicio": "16:07:15",
    "Fim": "16:13:23",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-25",
    "Embalagem": "LONG NECK",
    "Quantidade": 2,
    "Inicio": "14:22:33",
    "Fim": "14:27:29",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-25",
    "Embalagem": "PET 200ML",
    "Quantidade": 3,
    "Inicio": "16:13:32",
    "Fim": "16:17:07",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-25",
    "Embalagem": "PET 2L",
    "Quantidade": 11,
    "Inicio": "14:32:31",
    "Fim": "15:11:50",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-26",
    "Embalagem": "LATA 350",
    "Quantidade": 16,
    "Inicio": "09:33:47",
    "Fim": "10:09:08",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-26",
    "Embalagem": "LATA 350",
    "Quantidade": 39,
    "Inicio": "10:53:30",
    "Fim": "11:44:54",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-26",
    "Embalagem": "PET 2,5L",
    "Quantidade": 1,
    "Inicio": "09:00:30",
    "Fim": "09:03:02",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-26",
    "Embalagem": "LATA 269",
    "Quantidade": 1,
    "Inicio": "11:45:11",
    "Fim": "11:45:36",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-26",
    "Embalagem": "LATA 269",
    "Quantidade": 6,
    "Inicio": "14:31:10",
    "Fim": "14:40:23",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-26",
    "Embalagem": "PET 1L",
    "Quantidade": 2,
    "Inicio": "08:53:09",
    "Fim": "09:00:20",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-26",
    "Embalagem": "PET 2L",
    "Quantidade": 10,
    "Inicio": "08:14:47",
    "Fim": "08:52:46",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-02-26",
    "Embalagem": "LATA 350",
    "Quantidade": 27,
    "Inicio": "13:59:52",
    "Fim": "14:30:53",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-01",
    "Embalagem": "PET 1L",
    "Quantidade": 3,
    "Inicio": "10:46:48",
    "Fim": "10:57:47",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-01",
    "Embalagem": "LATA 473",
    "Quantidade": 1,
    "Inicio": "09:31:24",
    "Fim": "09:34:00",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-01",
    "Embalagem": "LATA 473",
    "Quantidade": 1,
    "Inicio": "09:20:39",
    "Fim": "09:23:29",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-01",
    "Embalagem": "LATA 350",
    "Quantidade": 9,
    "Inicio": "08:51:55",
    "Fim": "09:14:20",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-01",
    "Embalagem": "PET 2L",
    "Quantidade": 8,
    "Inicio": "10:11:37",
    "Fim": "10:35:58",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-01",
    "Embalagem": "PET 200ML",
    "Quantidade": 3,
    "Inicio": "09:34:11",
    "Fim": "09:39:53",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-01",
    "Embalagem": "LATA 250",
    "Quantidade": 4,
    "Inicio": "09:40:12",
    "Fim": "09:46:02",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-02",
    "Embalagem": "LATA 350",
    "Quantidade": 14,
    "Inicio": "10:52:12",
    "Fim": "11:20:08",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-02",
    "Embalagem": "PET 2L",
    "Quantidade": 10,
    "Inicio": "08:47:10",
    "Fim": "09:33:36",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-02",
    "Embalagem": "PET 1L",
    "Quantidade": 2,
    "Inicio": "08:26:38",
    "Fim": "08:33:41",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-02",
    "Embalagem": "PET 2L",
    "Quantidade": 2,
    "Inicio": "11:43:12",
    "Fim": "11:48:16",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-02",
    "Embalagem": "LATA 473",
    "Quantidade": 4,
    "Inicio": "11:30:00",
    "Fim": "11:36:23",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-02",
    "Embalagem": "PET 200ML",
    "Quantidade": 5,
    "Inicio": "10:21:46",
    "Fim": "10:31:51",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-02",
    "Embalagem": "PET 500ML",
    "Quantidade": 6,
    "Inicio": "09:53:20",
    "Fim": "10:06:03",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-03",
    "Embalagem": "LATA 350",
    "Quantidade": 18,
    "Inicio": "09:00:39",
    "Fim": "09:48:39",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-03",
    "Embalagem": "LATA 250",
    "Quantidade": 1,
    "Inicio": "10:21:00",
    "Fim": "10:22:20",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-03",
    "Embalagem": "PET 1L",
    "Quantidade": 5,
    "Inicio": "14:25:03",
    "Fim": "14:40:26",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-03",
    "Embalagem": "PET 200ML",
    "Quantidade": 1,
    "Inicio": "10:17:04",
    "Fim": "10:18:28",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-03",
    "Embalagem": "LATA 473",
    "Quantidade": 2,
    "Inicio": "10:07:06",
    "Fim": "10:12:11",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-03",
    "Embalagem": "LATA 350",
    "Quantidade": 7,
    "Inicio": "15:02:25",
    "Fim": "15:17:51",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-03",
    "Embalagem": "PET 2L",
    "Quantidade": 5,
    "Inicio": "10:32:34",
    "Fim": "10:50:16",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-04",
    "Embalagem": "PET 1L",
    "Quantidade": 3,
    "Inicio": "14:48:17",
    "Fim": "14:57:39",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-04",
    "Embalagem": "LATA 350",
    "Quantidade": 31,
    "Inicio": "08:38:46",
    "Fim": "10:32:31",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-04",
    "Embalagem": "LATA 350",
    "Quantidade": 1,
    "Inicio": "08:36:00",
    "Fim": "08:37:48",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-04",
    "Embalagem": "LATA 473",
    "Quantidade": 1,
    "Inicio": "10:49:09",
    "Fim": "10:52:40",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-04",
    "Embalagem": "PET 2L",
    "Quantidade": 9,
    "Inicio": "11:14:51",
    "Fim": "11:42:18",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-04",
    "Embalagem": "LATA 269",
    "Quantidade": 5,
    "Inicio": "15:05:04",
    "Fim": "15:12:28",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-04",
    "Embalagem": "PET 2L",
    "Quantidade": 1,
    "Inicio": "14:57:49",
    "Fim": "15:02:08",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-05",
    "Embalagem": "LATA 473",
    "Quantidade": 2,
    "Inicio": "10:02:48",
    "Fim": "10:08:32",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-05",
    "Embalagem": "PET 500ML",
    "Quantidade": 2,
    "Inicio": "10:08:50",
    "Fim": "10:17:41",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-05",
    "Embalagem": "PET 1L",
    "Quantidade": 2,
    "Inicio": "11:13:06",
    "Fim": "11:20:03",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-05",
    "Embalagem": "LATA 350",
    "Quantidade": 1,
    "Inicio": "10:17:56",
    "Fim": "10:20:14",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-05",
    "Embalagem": "LATA 350",
    "Quantidade": 15,
    "Inicio": "08:39:39",
    "Fim": "09:32:20",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-05",
    "Embalagem": "PET 2L",
    "Quantidade": 8,
    "Inicio": "10:34:17",
    "Fim": "11:03:32",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-05",
    "Embalagem": "PET 1L",
    "Quantidade": 2,
    "Inicio": "11:13:06",
    "Fim": "11:19:55",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-08",
    "Embalagem": "PET 1L",
    "Quantidade": 1,
    "Inicio": "10:48:08",
    "Fim": "10:50:44",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-08",
    "Embalagem": "LONG NECK",
    "Quantidade": 4,
    "Inicio": "10:21:08",
    "Fim": "10:31:09",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-08",
    "Embalagem": "LATA 350",
    "Quantidade": 19,
    "Inicio": "08:07:00",
    "Fim": "09:26:10",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-08",
    "Embalagem": "PET 2L",
    "Quantidade": 3,
    "Inicio": "10:38:51",
    "Fim": "10:47:58",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-08",
    "Embalagem": "LATA 473",
    "Quantidade": 2,
    "Inicio": "09:47:44",
    "Fim": "09:53:29",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-08",
    "Embalagem": "LATA 250",
    "Quantidade": 5,
    "Inicio": "11:10:22",
    "Fim": "11:17:07",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-08",
    "Embalagem": "LATA 269",
    "Quantidade": 11,
    "Inicio": "11:34:56",
    "Fim": "11:53:28",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-08",
    "Embalagem": "LATA 269",
    "Quantidade": 55,
    "Inicio": "14:38:12",
    "Fim": "16:36:06",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-08",
    "Embalagem": "PET 500ML",
    "Quantidade": 3,
    "Inicio": "10:54:54",
    "Fim": "11:02:22",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-09",
    "Embalagem": "PET 200ML",
    "Quantidade": 2,
    "Inicio": "10:35:02",
    "Fim": "10:38:13",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-09",
    "Embalagem": "PET 1L",
    "Quantidade": 1,
    "Inicio": "10:31:24",
    "Fim": "10:34:54",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-09",
    "Embalagem": "LATA 350",
    "Quantidade": 8,
    "Inicio": "09:51:00",
    "Fim": "10:20:36",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-09",
    "Embalagem": "PET 2L",
    "Quantidade": 4,
    "Inicio": "10:39:32",
    "Fim": "10:51:28",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-09",
    "Embalagem": "LONG NECK",
    "Quantidade": 2,
    "Inicio": "11:11:29",
    "Fim": "11:16:11",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-09",
    "Embalagem": "PET 500ML",
    "Quantidade": 1,
    "Inicio": "10:28:09",
    "Fim": "10:31:11",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-09",
    "Embalagem": "LATA 473",
    "Quantidade": 1,
    "Inicio": "10:25:00",
    "Fim": "10:28:02",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-10",
    "Embalagem": "LATA 473",
    "Quantidade": 1,
    "Inicio": "14:58:17",
    "Fim": "15:01:30",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-10",
    "Embalagem": "PET 1L",
    "Quantidade": 1,
    "Inicio": "10:31:24",
    "Fim": "10:34:54",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-10",
    "Embalagem": "LATA 269",
    "Quantidade": 1,
    "Inicio": "15:01:45",
    "Fim": "15:03:52",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-10",
    "Embalagem": "LATA 473",
    "Quantidade": 1,
    "Inicio": "10:25:00",
    "Fim": "10:28:02",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-10",
    "Embalagem": "LONG NECK",
    "Quantidade": 2,
    "Inicio": "11:11:29",
    "Fim": "11:16:11",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-10",
    "Embalagem": "PET 2L",
    "Quantidade": 14,
    "Inicio": "08:33:00",
    "Fim": "09:42:04",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-10",
    "Embalagem": "PET 1L",
    "Quantidade": 5,
    "Inicio": "09:54:02",
    "Fim": "10:10:40",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-10",
    "Embalagem": "PET 2L",
    "Quantidade": 4,
    "Inicio": "10:39:32",
    "Fim": "10:51:28",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-10",
    "Embalagem": "LATA 350",
    "Quantidade": 17,
    "Inicio": "10:56:00",
    "Fim": "11:43:43",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-10",
    "Embalagem": "PET 200ML",
    "Quantidade": 2,
    "Inicio": "10:35:02",
    "Fim": "10:38:13",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-10",
    "Embalagem": "PET 500ML",
    "Quantidade": 3,
    "Inicio": "10:23:38",
    "Fim": "10:34:01",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-10",
    "Embalagem": "LATA 350",
    "Quantidade": 4,
    "Inicio": "14:41:39",
    "Fim": "14:49:54",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-10",
    "Embalagem": "LATA 350",
    "Quantidade": 8,
    "Inicio": "09:51:00",
    "Fim": "10:20:36",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-10",
    "Embalagem": "LATA 250",
    "Quantidade": 2,
    "Inicio": "11:44:43",
    "Fim": "11:47:22",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-10",
    "Embalagem": "PET 500ML",
    "Quantidade": 1,
    "Inicio": "10:28:09",
    "Fim": "10:31:11",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-10",
    "Embalagem": "PET 200ML",
    "Quantidade": 1,
    "Inicio": "14:55:48",
    "Fim": "14:58:06",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-11",
    "Embalagem": "PET 1L",
    "Quantidade": 2,
    "Inicio": "10:04:01",
    "Fim": "10:10:55",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-11",
    "Embalagem": "LATA 269",
    "Quantidade": 1,
    "Inicio": "10:34:20",
    "Fim": "10:36:48",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-11",
    "Embalagem": "PET 500ML",
    "Quantidade": 2,
    "Inicio": "10:27:53",
    "Fim": "10:33:58",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-11",
    "Embalagem": "LATA 350",
    "Quantidade": 13,
    "Inicio": "08:45:59",
    "Fim": "09:16:34",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-11",
    "Embalagem": "PET 2L",
    "Quantidade": 5,
    "Inicio": "09:36:41",
    "Fim": "09:55:22",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-11",
    "Embalagem": "LONG NECK",
    "Quantidade": 2,
    "Inicio": "10:17:04",
    "Fim": "10:21:09",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-12",
    "Embalagem": "PET 1L",
    "Quantidade": 2,
    "Inicio": "11:23:09",
    "Fim": "11:30:56",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-12",
    "Embalagem": "PET 500ML",
    "Quantidade": 1,
    "Inicio": "11:31:08",
    "Fim": "11:33:34",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-12",
    "Embalagem": "PET 2L",
    "Quantidade": 13,
    "Inicio": "10:32:53",
    "Fim": "11:07:30",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-12",
    "Embalagem": "PET 200ML",
    "Quantidade": 2,
    "Inicio": "11:33:42",
    "Fim": "11:37:31",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-15",
    "Embalagem": "LATA 350",
    "Quantidade": 15,
    "Inicio": "09:28:00",
    "Fim": "10:10:17",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-15",
    "Embalagem": "PET 200ML",
    "Quantidade": 1,
    "Inicio": "10:45:03",
    "Fim": "10:46:44",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-15",
    "Embalagem": "LATA 269",
    "Quantidade": 1,
    "Inicio": "10:39:25",
    "Fim": "10:42:12",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-15",
    "Embalagem": "LONG NECK",
    "Quantidade": 4,
    "Inicio": "14:38:17",
    "Fim": "14:51:44",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-15",
    "Embalagem": "LATA 473",
    "Quantidade": 3,
    "Inicio": "10:29:13",
    "Fim": "10:39:08",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-15",
    "Embalagem": "PET 500ML",
    "Quantidade": 1,
    "Inicio": "10:42:21",
    "Fim": "10:44:43",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-15",
    "Embalagem": "PET 2L",
    "Quantidade": 7,
    "Inicio": "11:03:34",
    "Fim": "11:25:13",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-16",
    "Embalagem": "PET 200ML",
    "Quantidade": 4,
    "Inicio": "15:41:00",
    "Fim": "15:49:05",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-16",
    "Embalagem": "PET 1L",
    "Quantidade": 3,
    "Inicio": "11:14:57",
    "Fim": "11:25:27",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-16",
    "Embalagem": "PET 500ML",
    "Quantidade": 14,
    "Inicio": "10:13:37",
    "Fim": "11:02:30",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-16",
    "Embalagem": "LATA 473",
    "Quantidade": 5,
    "Inicio": "15:21:03",
    "Fim": "15:32:56",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-16",
    "Embalagem": "LATA 350",
    "Quantidade": 7,
    "Inicio": "11:39:26",
    "Fim": "11:53:04",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-16",
    "Embalagem": "LATA 350",
    "Quantidade": 14,
    "Inicio": "14:36:53",
    "Fim": "15:13:12",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-16",
    "Embalagem": "LONG NECK",
    "Quantidade": 1,
    "Inicio": "15:51:27",
    "Fim": "15:54:08",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-16",
    "Embalagem": "PET 2L",
    "Quantidade": 5,
    "Inicio": "09:31:38",
    "Fim": "09:51:17",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-16",
    "Embalagem": "PET 2,5L",
    "Quantidade": 2,
    "Inicio": "09:56:26",
    "Fim": "10:03:44",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-17",
    "Embalagem": "LONG NECK",
    "Quantidade": 2,
    "Inicio": "16:13:04",
    "Fim": "16:18:18",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-17",
    "Embalagem": "LATA 473",
    "Quantidade": 2,
    "Inicio": "15:55:16",
    "Fim": "16:01:50",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-17",
    "Embalagem": "PET 500ML",
    "Quantidade": 2,
    "Inicio": "11:42:40",
    "Fim": "11:47:23",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-17",
    "Embalagem": "LATA 350",
    "Quantidade": 22,
    "Inicio": "14:52:58",
    "Fim": "15:47:58",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-17",
    "Embalagem": "PET 2,5L",
    "Quantidade": 1,
    "Inicio": "14:28:00",
    "Fim": "14:31:36",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-17",
    "Embalagem": "PET 200ML",
    "Quantidade": 1,
    "Inicio": "14:39:00",
    "Fim": "14:41:38",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-17",
    "Embalagem": "PET 1L",
    "Quantidade": 9,
    "Inicio": "11:10:00",
    "Fim": "11:42:26",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-17",
    "Embalagem": "PET 2L",
    "Quantidade": 14,
    "Inicio": "09:35:14",
    "Fim": "10:30:09",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-18",
    "Embalagem": "PET 1L",
    "Quantidade": 3,
    "Inicio": "11:37:11",
    "Fim": "11:46:58",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-18",
    "Embalagem": "PET 2L",
    "Quantidade": 4,
    "Inicio": "11:04:04",
    "Fim": "11:16:58",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-18",
    "Embalagem": "LATA 350",
    "Quantidade": 12,
    "Inicio": "15:52:56",
    "Fim": "16:26:27",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-18",
    "Embalagem": "PET 2L",
    "Quantidade": 3,
    "Inicio": "08:35:44",
    "Fim": "08:46:19",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-18",
    "Embalagem": "PET 1L",
    "Quantidade": 7,
    "Inicio": "14:19:31",
    "Fim": "14:50:42",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-18",
    "Embalagem": "PET 500ML",
    "Quantidade": 3,
    "Inicio": "15:28:01",
    "Fim": "15:38:28",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-18",
    "Embalagem": "PET 200ML",
    "Quantidade": 1,
    "Inicio": "15:49:00",
    "Fim": "15:51:42",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-18",
    "Embalagem": "PET 2,5L",
    "Quantidade": 1,
    "Inicio": "11:17:12",
    "Fim": "11:20:48",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-19",
    "Embalagem": "LATA 350",
    "Quantidade": 41,
    "Inicio": "09:28:47",
    "Fim": "11:42:26",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-19",
    "Embalagem": "LATA 350",
    "Quantidade": 18,
    "Inicio": "14:16:00",
    "Fim": "15:17:44",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-19",
    "Embalagem": "LATA 473",
    "Quantidade": 15,
    "Inicio": "15:24:37",
    "Fim": "16:03:23",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-20",
    "Embalagem": "PET 2L",
    "Quantidade": 14,
    "Inicio": "08:28:00",
    "Fim": "09:32:28",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-20",
    "Embalagem": "PET 1L",
    "Quantidade": 10,
    "Inicio": "09:28:00",
    "Fim": "10:09:49",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-20",
    "Embalagem": "PET 500ML",
    "Quantidade": 5,
    "Inicio": "10:30:00",
    "Fim": "10:45:00",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-20",
    "Embalagem": "PET 2,5L",
    "Quantidade": 1,
    "Inicio": "10:10:09",
    "Fim": "10:12:23",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-22",
    "Embalagem": "LATA 473",
    "Quantidade": 8,
    "Inicio": "11:10:00",
    "Fim": "11:33:27",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-22",
    "Embalagem": "PET 2L",
    "Quantidade": 19,
    "Inicio": "14:43:55",
    "Fim": "15:55:08",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-22",
    "Embalagem": "LATA 350",
    "Quantidade": 9,
    "Inicio": "08:46:49",
    "Fim": "09:14:45",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-22",
    "Embalagem": "PET 1L",
    "Quantidade": 4,
    "Inicio": "14:09:49",
    "Fim": "14:20:49",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-22",
    "Embalagem": "PET 500ML",
    "Quantidade": 2,
    "Inicio": "16:09:55",
    "Fim": "16:15:01",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-22",
    "Embalagem": "PET 1L",
    "Quantidade": 5,
    "Inicio": "11:40:40",
    "Fim": "11:51:50",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-22",
    "Embalagem": "LATA 269",
    "Quantidade": 3,
    "Inicio": "09:58:23",
    "Fim": "10:05:49",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-22",
    "Embalagem": "PET 1L",
    "Quantidade": 1,
    "Inicio": "10:05:58",
    "Fim": "10:09:10",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-22",
    "Embalagem": "PET 2,5L",
    "Quantidade": 2,
    "Inicio": "16:01:26",
    "Fim": "16:08:39",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-22",
    "Embalagem": "LATA 473",
    "Quantidade": 2,
    "Inicio": "09:50:44",
    "Fim": "09:58:10",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-22",
    "Embalagem": "LATA 350",
    "Quantidade": 26,
    "Inicio": "09:16:00",
    "Fim": "10:47:08",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-24",
    "Embalagem": "PET 1L",
    "Quantidade": 3,
    "Inicio": "09:00:25",
    "Fim": "09:10:08",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-24",
    "Embalagem": "LATA 350",
    "Quantidade": 14,
    "Inicio": "10:42:56",
    "Fim": "11:19:46",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-24",
    "Embalagem": "LATA 473",
    "Quantidade": 4,
    "Inicio": "11:52:20",
    "Fim": "12:01:37",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-24",
    "Embalagem": "PET 200ML",
    "Quantidade": 2,
    "Inicio": "09:47:41",
    "Fim": "09:51:37",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-24",
    "Embalagem": "PET 2L",
    "Quantidade": 2,
    "Inicio": "08:39:56",
    "Fim": "08:47:04",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-24",
    "Embalagem": "PET 500ML",
    "Quantidade": 4,
    "Inicio": "09:33:00",
    "Fim": "09:47:26",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-25",
    "Embalagem": "PET 2L",
    "Quantidade": 5,
    "Inicio": "09:27:27",
    "Fim": "09:44:05",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-25",
    "Embalagem": "PET 2,5L",
    "Quantidade": 1,
    "Inicio": "10:20:53",
    "Fim": "10:23:15",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-25",
    "Embalagem": "LATA 473",
    "Quantidade": 14,
    "Inicio": "15:14:58",
    "Fim": "16:03:28",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-25",
    "Embalagem": "LATA 350",
    "Quantidade": 11,
    "Inicio": "14:19:00",
    "Fim": "14:59:41",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-25",
    "Embalagem": "LATA 350",
    "Quantidade": 12,
    "Inicio": "10:23:27",
    "Fim": "11:01:48",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-25",
    "Embalagem": "PET 1L",
    "Quantidade": 9,
    "Inicio": "08:24:37",
    "Fim": "08:59:43",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-25",
    "Embalagem": "LATA 250",
    "Quantidade": 10,
    "Inicio": "16:15:39",
    "Fim": "16:30:30",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-26",
    "Embalagem": "LATA 350",
    "Quantidade": 11,
    "Inicio": "15:56:56",
    "Fim": "16:35:21",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-26",
    "Embalagem": "PET 1L",
    "Quantidade": 3,
    "Inicio": "15:33:02",
    "Fim": "15:42:27",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-26",
    "Embalagem": "PET 2L",
    "Quantidade": 10,
    "Inicio": "14:36:26",
    "Fim": "15:11:17",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-30",
    "Embalagem": "LATA 250",
    "Quantidade": 4,
    "Inicio": "11:37:18",
    "Fim": "11:42:07",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-30",
    "Embalagem": "LATA 473",
    "Quantidade": 15,
    "Inicio": "08:30:26",
    "Fim": "09:30:43",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-30",
    "Embalagem": "LATA 350",
    "Quantidade": 17,
    "Inicio": "09:49:25",
    "Fim": "10:42:20",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-30",
    "Embalagem": "PET 500ML",
    "Quantidade": 2,
    "Inicio": "11:27:55",
    "Fim": "11:33:06",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-30",
    "Embalagem": "PET 2L",
    "Quantidade": 3,
    "Inicio": "10:51:03",
    "Fim": "10:59:37",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-30",
    "Embalagem": "PET 200ML",
    "Quantidade": 3,
    "Inicio": "11:24:11",
    "Fim": "11:27:43",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-30",
    "Embalagem": "LATA 473",
    "Quantidade": 4,
    "Inicio": "09:31:22",
    "Fim": "09:45:04",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-03-30",
    "Embalagem": "PET 1L",
    "Quantidade": 1,
    "Inicio": "11:33:14",
    "Fim": "11:35:57",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-04-05",
    "Embalagem": "LATA 350",
    "Quantidade": 10,
    "Inicio": "11:28:54",
    "Fim": "11:59:02",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-04-05",
    "Embalagem": "PET 1L",
    "Quantidade": 1,
    "Inicio": "11:06:43",
    "Fim": "11:09:05",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-04-05",
    "Embalagem": "PET 2,5L",
    "Quantidade": 1,
    "Inicio": "10:53:14",
    "Fim": "10:57:43",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-04-05",
    "Embalagem": "PET 2L",
    "Quantidade": 4,
    "Inicio": "10:04:18",
    "Fim": "10:18:03",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-04-05",
    "Embalagem": "LATA 473",
    "Quantidade": 2,
    "Inicio": "11:22:54",
    "Fim": "11:28:44",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-04-05",
    "Embalagem": "PET 200ML",
    "Quantidade": 2,
    "Inicio": "11:00:00",
    "Fim": "11:06:35",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-04-05",
    "Embalagem": "PET 1L",
    "Quantidade": 2,
    "Inicio": "10:18:16",
    "Fim": "10:25:07",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-04-05",
    "Embalagem": "PET 500ML",
    "Quantidade": 4,
    "Inicio": "10:42:55",
    "Fim": "10:52:46",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-04-06",
    "Embalagem": "PET 500ML",
    "Quantidade": 2,
    "Inicio": "09:28:32",
    "Fim": "09:35:01",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-04-06",
    "Embalagem": "LONG NECK",
    "Quantidade": 1,
    "Inicio": "11:27:13",
    "Fim": "11:31:08",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-04-06",
    "Embalagem": "LATA 350",
    "Quantidade": 1,
    "Inicio": "11:25:30",
    "Fim": "11:27:04",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-04-06",
    "Embalagem": "LATA 473",
    "Quantidade": 5,
    "Inicio": "11:06:45",
    "Fim": "11:25:13",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-04-06",
    "Embalagem": "LATA 350",
    "Quantidade": 13,
    "Inicio": "10:03:14",
    "Fim": "10:37:06",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-04-06",
    "Embalagem": "PET 1L",
    "Quantidade": 4,
    "Inicio": "08:43:46",
    "Fim": "09:02:51",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-04-06",
    "Embalagem": "PET 2L",
    "Quantidade": 5,
    "Inicio": "08:16:30",
    "Fim": "08:35:47",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-04-06",
    "Embalagem": "PET 2L",
    "Quantidade": 1,
    "Inicio": "09:03:07",
    "Fim": "09:05:25",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-04-07",
    "Embalagem": "PET 500ML",
    "Quantidade": 2,
    "Inicio": "10:49:48",
    "Fim": "10:55:50",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-04-07",
    "Embalagem": "PET 200ML",
    "Quantidade": 2,
    "Inicio": "10:55:57",
    "Fim": "11:01:04",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-04-07",
    "Embalagem": "LATA 350",
    "Quantidade": 9,
    "Inicio": "11:33:38",
    "Fim": "11:58:44",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-04-07",
    "Embalagem": "LATA 350",
    "Quantidade": 3,
    "Inicio": "14:53:32",
    "Fim": "15:00:46",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-04-07",
    "Embalagem": "LATA 269",
    "Quantidade": 2,
    "Inicio": "14:31:03",
    "Fim": "14:35:31",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-04-07",
    "Embalagem": "PET 1L",
    "Quantidade": 12,
    "Inicio": "09:46:16",
    "Fim": "10:38:02",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-04-07",
    "Embalagem": "LONG NECK",
    "Quantidade": 1,
    "Inicio": "14:42:26",
    "Fim": "14:46:23",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-04-07",
    "Embalagem": "PET 2L",
    "Quantidade": 2,
    "Inicio": "14:46:36",
    "Fim": "14:53:16",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-04-07",
    "Embalagem": "LATA 473",
    "Quantidade": 1,
    "Inicio": "15:01:06",
    "Fim": "15:04:00",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-04-07",
    "Embalagem": "LATA 350",
    "Quantidade": 5,
    "Inicio": "14:18:43",
    "Fim": "14:30:50",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-04-07",
    "Embalagem": "PET 2L",
    "Quantidade": 6,
    "Inicio": "08:43:01",
    "Fim": "09:06:35",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-04-08",
    "Embalagem": "PET 2L",
    "Quantidade": 19,
    "Inicio": "08:54:00",
    "Fim": "10:27:43",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-04-08",
    "Embalagem": "LATA 350",
    "Quantidade": 26,
    "Inicio": "14:14:56",
    "Fim": "15:34:57",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-04-08",
    "Embalagem": "LONG NECK",
    "Quantidade": 2,
    "Inicio": "16:12:58",
    "Fim": "16:20:16",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-04-08",
    "Embalagem": "LATA 473",
    "Quantidade": 3,
    "Inicio": "15:35:10",
    "Fim": "15:45:43",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-04-08",
    "Embalagem": "PET 1L",
    "Quantidade": 6,
    "Inicio": "10:45:00",
    "Fim": "11:13:44",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-04-08",
    "Embalagem": "PET 500ML",
    "Quantidade": 3,
    "Inicio": "11:30:37",
    "Fim": "11:41:43",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-04-08",
    "Embalagem": "LATA 269",
    "Quantidade": 2,
    "Inicio": "15:56:27",
    "Fim": "16:00:10",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-04-08",
    "Embalagem": "LATA 250",
    "Quantidade": 4,
    "Inicio": "15:49:18",
    "Fim": "15:56:13",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-04-08",
    "Embalagem": "LONG NECK",
    "Quantidade": 1,
    "Inicio": "16:20:00",
    "Fim": "16:24:16",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-04-09",
    "Embalagem": "LATA 473",
    "Quantidade": 9,
    "Inicio": "09:58:39",
    "Fim": "10:32:11",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-09",
    "Embalagem": "LONG NECK",
    "Quantidade": 2,
    "Inicio": "11:50:38",
    "Fim": "11:59:01",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-09",
    "Embalagem": "PET 2L",
    "Quantidade": 8,
    "Inicio": "08:28:00",
    "Fim": "09:04:53",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-09",
    "Embalagem": "PET 1L",
    "Quantidade": 4,
    "Inicio": "09:30:49",
    "Fim": "09:46:17",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-09",
    "Embalagem": "LATA 350",
    "Quantidade": 22,
    "Inicio": "10:32:26",
    "Fim": "11:47:06",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-12",
    "Embalagem": "PET 1L",
    "Quantidade": 3,
    "Inicio": "10:18:00",
    "Fim": "10:27:18",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-12",
    "Embalagem": "LATA 269",
    "Quantidade": 1,
    "Inicio": "14:28:47",
    "Fim": "14:30:08",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-12",
    "Embalagem": "LATA 473",
    "Quantidade": 4,
    "Inicio": "14:15:01",
    "Fim": "14:28:30",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-12",
    "Embalagem": "PET 200ML",
    "Quantidade": 2,
    "Inicio": "10:47:49",
    "Fim": "10:52:42",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-12",
    "Embalagem": "LATA 350",
    "Quantidade": 14,
    "Inicio": "11:19:57",
    "Fim": "11:47:00",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-12",
    "Embalagem": "PET 500ML",
    "Quantidade": 4,
    "Inicio": "10:36:26",
    "Fim": "10:47:35",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-12",
    "Embalagem": "LONG NECK",
    "Quantidade": 1,
    "Inicio": "10:56:59",
    "Fim": "11:01:26",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-12",
    "Embalagem": "PET 2L",
    "Quantidade": 9,
    "Inicio": "09:23:00",
    "Fim": "10:00:27",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-13",
    "Embalagem": "LATA 350",
    "Quantidade": 15,
    "Inicio": "11:02:44",
    "Fim": "11:36:28",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-13",
    "Embalagem": "LATA 269",
    "Quantidade": 1,
    "Inicio": "14:23:50",
    "Fim": "14:27:00",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-13",
    "Embalagem": "LATA 473",
    "Quantidade": 5,
    "Inicio": "14:07:41",
    "Fim": "14:23:37",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-13",
    "Embalagem": "PET 200ML",
    "Quantidade": 6,
    "Inicio": "14:31:44",
    "Fim": "14:43:51",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-13",
    "Embalagem": "PET 1L",
    "Quantidade": 9,
    "Inicio": "09:55:36",
    "Fim": "10:35:32",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-13",
    "Embalagem": "PET 2L",
    "Quantidade": 10,
    "Inicio": "09:01:00",
    "Fim": "09:49:13",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-14",
    "Embalagem": "PET 1L",
    "Quantidade": 1,
    "Inicio": "11:18:51",
    "Fim": "11:22:42",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-14",
    "Embalagem": "PET 2L",
    "Quantidade": 1,
    "Inicio": "09:03:42",
    "Fim": "09:06:52",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-14",
    "Embalagem": "PET 1L",
    "Quantidade": 3,
    "Inicio": "08:48:00",
    "Fim": "09:03:09",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-14",
    "Embalagem": "LATA 473",
    "Quantidade": 1,
    "Inicio": "10:58:32",
    "Fim": "11:01:35",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-14",
    "Embalagem": "LATA 269",
    "Quantidade": 1,
    "Inicio": "11:01:46",
    "Fim": "11:03:10",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-14",
    "Embalagem": "PET 500ML",
    "Quantidade": 1,
    "Inicio": "11:22:51",
    "Fim": "11:25:11",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-14",
    "Embalagem": "LATA 350",
    "Quantidade": 25,
    "Inicio": "09:18:00",
    "Fim": "10:57:36",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-14",
    "Embalagem": "PET 200ML",
    "Quantidade": 6,
    "Inicio": "11:25:19",
    "Fim": "11:42:50",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-14",
    "Embalagem": "PET 2L",
    "Quantidade": 9,
    "Inicio": "08:02:00",
    "Fim": "08:42:41",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-15",
    "Embalagem": "PET 500ML",
    "Quantidade": 5,
    "Inicio": "10:49:00",
    "Fim": "11:10:49",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-15",
    "Embalagem": "PET 2L",
    "Quantidade": 4,
    "Inicio": "14:31:39",
    "Fim": "14:46:23",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-15",
    "Embalagem": "PET 1L",
    "Quantidade": 1,
    "Inicio": "14:46:41",
    "Fim": "14:50:52",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-15",
    "Embalagem": "LATA 350",
    "Quantidade": 4,
    "Inicio": "14:01:25",
    "Fim": "14:18:03",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-15",
    "Embalagem": "PET 2,5L",
    "Quantidade": 1,
    "Inicio": "10:43:38",
    "Fim": "10:47:26",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-15",
    "Embalagem": "PET 2L",
    "Quantidade": 16,
    "Inicio": "09:02:00",
    "Fim": "10:15:15",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-15",
    "Embalagem": "LONG NECK",
    "Quantidade": 1,
    "Inicio": "14:18:24",
    "Fim": "14:22:44",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-15",
    "Embalagem": "PET 1L",
    "Quantidade": 3,
    "Inicio": "10:30:39",
    "Fim": "10:43:21",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-15",
    "Embalagem": "LATA 350",
    "Quantidade": 11,
    "Inicio": "11:15:59",
    "Fim": "11:56:02",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-16",
    "Embalagem": "LATA 350",
    "Quantidade": 5,
    "Inicio": "13:59:31",
    "Fim": "14:17:26",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-16",
    "Embalagem": "PET 2L",
    "Quantidade": 8,
    "Inicio": "09:55:21",
    "Fim": "10:25:00",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-16",
    "Embalagem": "LATA 350",
    "Quantidade": 12,
    "Inicio": "11:19:00",
    "Fim": "11:49:10",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-16",
    "Embalagem": "PET 200ML",
    "Quantidade": 1,
    "Inicio": "14:24:28",
    "Fim": "14:26:57",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-16",
    "Embalagem": "PET 2,5L",
    "Quantidade": 5,
    "Inicio": "09:16:27",
    "Fim": "09:33:23",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-16",
    "Embalagem": "LONG NECK",
    "Quantidade": 3,
    "Inicio": "14:41:00",
    "Fim": "14:54:09",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-16",
    "Embalagem": "LATA 473",
    "Quantidade": 2,
    "Inicio": "14:17:37",
    "Fim": "14:24:15",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-16",
    "Embalagem": "PET 1L",
    "Quantidade": 5,
    "Inicio": "10:37:21",
    "Fim": "10:58:25",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-21",
    "Embalagem": "LATA 350",
    "Quantidade": 4,
    "Inicio": "11:50:52",
    "Fim": "12:00:18",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-21",
    "Embalagem": "LATA 350",
    "Quantidade": 15,
    "Inicio": "10:50:21",
    "Fim": "11:42:18",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-21",
    "Embalagem": "LATA 473",
    "Quantidade": 2,
    "Inicio": "11:43:47",
    "Fim": "11:50:38",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-21",
    "Embalagem": "PET 1L",
    "Quantidade": 3,
    "Inicio": "10:00:03",
    "Fim": "10:10:50",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-21",
    "Embalagem": "PET 500ML",
    "Quantidade": 2,
    "Inicio": "10:40:20",
    "Fim": "10:50:03",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-21",
    "Embalagem": "PET 2L",
    "Quantidade": 12,
    "Inicio": "09:01:19",
    "Fim": "09:46:25",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-21",
    "Embalagem": "LONG NECK",
    "Quantidade": 3,
    "Inicio": "08:34:52",
    "Fim": "08:47:21",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-22",
    "Embalagem": "LATA 473",
    "Quantidade": 6,
    "Inicio": "14:06:28",
    "Fim": "14:30:15",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-22",
    "Embalagem": "PET 2L",
    "Quantidade": 6,
    "Inicio": "10:58:00",
    "Fim": "11:22:54",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-22",
    "Embalagem": "PET 1L",
    "Quantidade": 1,
    "Inicio": "16:06:16",
    "Fim": "16:10:45",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-22",
    "Embalagem": "LATA 350",
    "Quantidade": 1,
    "Inicio": "16:10:56",
    "Fim": "16:13:41",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-22",
    "Embalagem": "PET 500ML",
    "Quantidade": 2,
    "Inicio": "11:46:26",
    "Fim": "11:52:03",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-22",
    "Embalagem": "LATA 250",
    "Quantidade": 18,
    "Inicio": "15:32:47",
    "Fim": "16:05:51",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-22",
    "Embalagem": "LONG NECK",
    "Quantidade": 3,
    "Inicio": "10:42:20",
    "Fim": "10:56:04",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-22",
    "Embalagem": "PET 1L",
    "Quantidade": 2,
    "Inicio": "11:30:00",
    "Fim": "11:38:30",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-22",
    "Embalagem": "LATA 350",
    "Quantidade": 9,
    "Inicio": "14:55:13",
    "Fim": "15:19:37",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-23",
    "Embalagem": "PET 2L",
    "Quantidade": 6,
    "Inicio": "10:58:00",
    "Fim": "11:22:54",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-23",
    "Embalagem": "LONG NECK",
    "Quantidade": 3,
    "Inicio": "10:42:20",
    "Fim": "10:56:04",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-24",
    "Embalagem": "PET 1L",
    "Quantidade": 2,
    "Inicio": "11:30:00",
    "Fim": "11:38:30",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-24",
    "Embalagem": "PET 1L",
    "Quantidade": 1,
    "Inicio": "16:06:16",
    "Fim": "16:10:45",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-24",
    "Embalagem": "LATA 250",
    "Quantidade": 18,
    "Inicio": "15:32:47",
    "Fim": "16:05:51",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-24",
    "Embalagem": "LATA 350",
    "Quantidade": 1,
    "Inicio": "16:10:56",
    "Fim": "16:13:41",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-24",
    "Embalagem": "LATA 350",
    "Quantidade": 9,
    "Inicio": "14:55:13",
    "Fim": "15:19:37",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-24",
    "Embalagem": "PET 500ML",
    "Quantidade": 2,
    "Inicio": "11:46:26",
    "Fim": "11:52:03",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-24",
    "Embalagem": "LATA 473",
    "Quantidade": 6,
    "Inicio": "14:06:28",
    "Fim": "14:30:15",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-26",
    "Embalagem": "LATA 473",
    "Quantidade": 9,
    "Inicio": "10:34:19",
    "Fim": "11:07:27",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-26",
    "Embalagem": "LATA 269",
    "Quantidade": 3,
    "Inicio": "16:13:45",
    "Fim": "16:19:27",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-26",
    "Embalagem": "PET 2,5L",
    "Quantidade": 1,
    "Inicio": "08:50:00",
    "Fim": "08:53:27",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-26",
    "Embalagem": "LATA 350",
    "Quantidade": 8,
    "Inicio": "11:26:55",
    "Fim": "11:52:18",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-26",
    "Embalagem": "PET 200ML",
    "Quantidade": 6,
    "Inicio": "10:00:10",
    "Fim": "10:14:08",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-26",
    "Embalagem": "PET 1L",
    "Quantidade": 5,
    "Inicio": "08:59:59",
    "Fim": "09:18:51",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-26",
    "Embalagem": "PET 2L",
    "Quantidade": 5,
    "Inicio": "08:30:00",
    "Fim": "08:48:42",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-26",
    "Embalagem": "LATA 250",
    "Quantidade": 4,
    "Inicio": "16:19:40",
    "Fim": "16:29:23",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-26",
    "Embalagem": "PET 500ML",
    "Quantidade": 5,
    "Inicio": "09:37:24",
    "Fim": "09:54:14",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-26",
    "Embalagem": "LATA 350",
    "Quantidade": 30,
    "Inicio": "14:37:32",
    "Fim": "16:13:29",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-27",
    "Embalagem": "PET 500ML",
    "Quantidade": 5,
    "Inicio": "10:55:00",
    "Fim": "11:13:02",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-27",
    "Embalagem": "PET 200ML",
    "Quantidade": 2,
    "Inicio": "11:12:00",
    "Fim": "11:17:18",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-27",
    "Embalagem": "LATA 350",
    "Quantidade": 8,
    "Inicio": "14:14:00",
    "Fim": "14:47:00",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-27",
    "Embalagem": "PET 1L",
    "Quantidade": 13,
    "Inicio": "10:06:15",
    "Fim": "10:57:11",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-27",
    "Embalagem": "PET 2L",
    "Quantidade": 2,
    "Inicio": "09:50:05",
    "Fim": "09:57:26",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-27",
    "Embalagem": "LATA 350",
    "Quantidade": 10,
    "Inicio": "11:25:34",
    "Fim": "11:56:22",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-27",
    "Embalagem": "PET 2L",
    "Quantidade": 12,
    "Inicio": "08:50:00",
    "Fim": "09:43:19",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-28",
    "Embalagem": "LATA 350",
    "Quantidade": 22,
    "Inicio": "15:25:49",
    "Fim": "16:26:14",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-28",
    "Embalagem": "PET 2,5L",
    "Quantidade": 1,
    "Inicio": "14:48:00",
    "Fim": "14:50:54",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-28",
    "Embalagem": "PET 500ML",
    "Quantidade": 4,
    "Inicio": "14:26:31",
    "Fim": "14:40:02",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-28",
    "Embalagem": "LATA 350",
    "Quantidade": 33,
    "Inicio": "08:48:15",
    "Fim": "10:49:53",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-28",
    "Embalagem": "LATA 473",
    "Quantidade": 6,
    "Inicio": "14:51:38",
    "Fim": "15:12:20",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-28",
    "Embalagem": "PET 2L",
    "Quantidade": 11,
    "Inicio": "11:02:00",
    "Fim": "11:43:38",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-28",
    "Embalagem": "PET 200ML",
    "Quantidade": 2,
    "Inicio": "14:40:22",
    "Fim": "14:45:54",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-28",
    "Embalagem": "PET 1L",
    "Quantidade": 3,
    "Inicio": "11:47:01",
    "Fim": "11:57:03",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-28",
    "Embalagem": "PET 1L",
    "Quantidade": 3,
    "Inicio": "14:07:41",
    "Fim": "14:19:30",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-29",
    "Embalagem": "PET 200ML",
    "Quantidade": 2,
    "Inicio": "10:00:18",
    "Fim": "10:05:05",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-29",
    "Embalagem": "LONG NECK",
    "Quantidade": 6,
    "Inicio": "11:35:59",
    "Fim": "12:00:23",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-29",
    "Embalagem": "LATA 269",
    "Quantidade": 2,
    "Inicio": "12:00:46",
    "Fim": "12:06:26",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-29",
    "Embalagem": "LATA 350",
    "Quantidade": 15,
    "Inicio": "10:05:00",
    "Fim": "10:59:03",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-29",
    "Embalagem": "PET 1L",
    "Quantidade": 4,
    "Inicio": "09:25:42",
    "Fim": "09:43:14",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-29",
    "Embalagem": "PET 500ML",
    "Quantidade": 4,
    "Inicio": "09:47:08",
    "Fim": "10:00:07",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-29",
    "Embalagem": "PET 2L",
    "Quantidade": 7,
    "Inicio": "08:39:16",
    "Fim": "09:03:35",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-29",
    "Embalagem": "LATA 350",
    "Quantidade": 1,
    "Inicio": "12:06:42",
    "Fim": "12:09:21",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-04-29",
    "Embalagem": "PET 2,5L",
    "Quantidade": 1,
    "Inicio": "09:43:30",
    "Fim": "09:46:51",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-03",
    "Embalagem": "PET 1L",
    "Quantidade": 6,
    "Inicio": "09:03:32",
    "Fim": "09:25:39",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-03",
    "Embalagem": "PET 2L",
    "Quantidade": 6,
    "Inicio": "08:35:39",
    "Fim": "08:57:38",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-03",
    "Embalagem": "LATA 350",
    "Quantidade": 16,
    "Inicio": "14:02:45",
    "Fim": "14:38:40",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-03",
    "Embalagem": "LATA 473",
    "Quantidade": 3,
    "Inicio": "10:43:54",
    "Fim": "10:52:26",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-03",
    "Embalagem": "PET 500ML",
    "Quantidade": 1,
    "Inicio": "10:58:00",
    "Fim": "11:02:01",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-03",
    "Embalagem": "LATA 269",
    "Quantidade": 2,
    "Inicio": "10:52:40",
    "Fim": "10:57:15",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-03",
    "Embalagem": "LATA 350",
    "Quantidade": 16,
    "Inicio": "09:43:35",
    "Fim": "10:35:29",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-04",
    "Embalagem": "LATA 350",
    "Quantidade": 9,
    "Inicio": "14:01:35",
    "Fim": "14:24:44",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-04",
    "Embalagem": "PET 500ML",
    "Quantidade": 3,
    "Inicio": "14:30:54",
    "Fim": "14:40:45",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-04",
    "Embalagem": "LATA 473",
    "Quantidade": 8,
    "Inicio": "10:46:15",
    "Fim": "11:11:35",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-04",
    "Embalagem": "LATA 350",
    "Quantidade": 8,
    "Inicio": "11:32:39",
    "Fim": "11:53:39",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-04",
    "Embalagem": "PET 2L",
    "Quantidade": 11,
    "Inicio": "09:39:19",
    "Fim": "10:28:42",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-04",
    "Embalagem": "PET 1L",
    "Quantidade": 13,
    "Inicio": "08:25:00",
    "Fim": "09:16:56",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-04",
    "Embalagem": "PET 2,5L",
    "Quantidade": 1,
    "Inicio": "10:29:00",
    "Fim": "10:32:43",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-04",
    "Embalagem": "PET 200ML",
    "Quantidade": 1,
    "Inicio": "14:41:02",
    "Fim": "14:43:27",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-05",
    "Embalagem": "PET 2L",
    "Quantidade": 10,
    "Inicio": "07:58:00",
    "Fim": "08:37:07",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-05",
    "Embalagem": "PET 200ML",
    "Quantidade": 8,
    "Inicio": "10:40:16",
    "Fim": "10:56:15",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-05",
    "Embalagem": "PET 500ML",
    "Quantidade": 2,
    "Inicio": "11:37:38",
    "Fim": "11:43:18",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-05",
    "Embalagem": "LATA 350",
    "Quantidade": 24,
    "Inicio": "09:02:31",
    "Fim": "10:32:50",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-05",
    "Embalagem": "PET 2,5L",
    "Quantidade": 1,
    "Inicio": "08:55:00",
    "Fim": "08:58:21",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-05",
    "Embalagem": "LONG NECK",
    "Quantidade": 2,
    "Inicio": "11:10:35",
    "Fim": "11:19:01",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-05",
    "Embalagem": "LATA 350",
    "Quantidade": 4,
    "Inicio": "11:24:00",
    "Fim": "11:37:16",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-05",
    "Embalagem": "PET 1L",
    "Quantidade": 2,
    "Inicio": "08:47:00",
    "Fim": "08:55:40",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-06",
    "Embalagem": "LATA 350",
    "Quantidade": 15,
    "Inicio": "11:20:18",
    "Fim": "11:56:22",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-06",
    "Embalagem": "LATA 250",
    "Quantidade": 4,
    "Inicio": "14:26:48",
    "Fim": "14:34:08",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-06",
    "Embalagem": "PET 200ML",
    "Quantidade": 1,
    "Inicio": "11:04:36",
    "Fim": "11:06:45",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-06",
    "Embalagem": "PET 1L",
    "Quantidade": 12,
    "Inicio": "09:39:00",
    "Fim": "10:32:25",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-06",
    "Embalagem": "PET 2,5L",
    "Quantidade": 1,
    "Inicio": "10:33:05",
    "Fim": "10:36:02",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-06",
    "Embalagem": "LATA 473",
    "Quantidade": 2,
    "Inicio": "14:16:44",
    "Fim": "14:21:33",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-06",
    "Embalagem": "PET 500ML",
    "Quantidade": 6,
    "Inicio": "10:42:29",
    "Fim": "11:04:17",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-06",
    "Embalagem": "LATA 269",
    "Quantidade": 2,
    "Inicio": "14:21:47",
    "Fim": "14:26:39",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-06",
    "Embalagem": "PET 2L",
    "Quantidade": 12,
    "Inicio": "08:31:00",
    "Fim": "09:17:00",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-07",
    "Embalagem": "PET 2L",
    "Quantidade": 18,
    "Inicio": "08:45:00",
    "Fim": "09:47:57",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-07",
    "Embalagem": "PET 2,5L",
    "Quantidade": 2,
    "Inicio": "14:46:35",
    "Fim": "14:53:29",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-07",
    "Embalagem": "LATA 350",
    "Quantidade": 1,
    "Inicio": "15:24:36",
    "Fim": "15:28:24",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-07",
    "Embalagem": "PET 200ML",
    "Quantidade": 3,
    "Inicio": "15:09:16",
    "Fim": "15:15:08",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-07",
    "Embalagem": "PET 1L",
    "Quantidade": 10,
    "Inicio": "14:12:01",
    "Fim": "14:46:13",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-07",
    "Embalagem": "LATA 473",
    "Quantidade": 8,
    "Inicio": "11:43:40",
    "Fim": "12:01:47",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-07",
    "Embalagem": "LONG NECK",
    "Quantidade": 1,
    "Inicio": "15:20:02",
    "Fim": "15:24:26",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-07",
    "Embalagem": "LATA 350",
    "Quantidade": 30,
    "Inicio": "10:02:38",
    "Fim": "11:32:38",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-10",
    "Embalagem": "PET 2L",
    "Quantidade": 7,
    "Inicio": "10:25:28",
    "Fim": "10:50:23",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-10",
    "Embalagem": "PET 1L",
    "Quantidade": 2,
    "Inicio": "10:59:00",
    "Fim": "11:07:30",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-10",
    "Embalagem": "LATA 473",
    "Quantidade": 2,
    "Inicio": "09:46:52",
    "Fim": "09:53:38",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-10",
    "Embalagem": "PET 2,5L",
    "Quantidade": 1,
    "Inicio": "10:50:36",
    "Fim": "10:53:12",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-10",
    "Embalagem": "PET 200ML",
    "Quantidade": 3,
    "Inicio": "09:53:46",
    "Fim": "10:00:35",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-10",
    "Embalagem": "LATA 350",
    "Quantidade": 35,
    "Inicio": "07:10:33",
    "Fim": "09:11:28",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-10",
    "Embalagem": "PET 500ML",
    "Quantidade": 3,
    "Inicio": "10:00:43",
    "Fim": "10:12:36",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-10",
    "Embalagem": "LATA 269",
    "Quantidade": 1,
    "Inicio": "10:20:02",
    "Fim": "10:22:20",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-10",
    "Embalagem": "LATA 250",
    "Quantidade": 4,
    "Inicio": "10:12:45",
    "Fim": "10:19:50",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-10",
    "Embalagem": "LONG NECK",
    "Quantidade": 3,
    "Inicio": "11:25:00",
    "Fim": "11:38:32",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-11",
    "Embalagem": "PET 1L",
    "Quantidade": 2,
    "Inicio": "09:27:38",
    "Fim": "09:34:07",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-11",
    "Embalagem": "PET 200ML",
    "Quantidade": 1,
    "Inicio": "11:21:30",
    "Fim": "11:24:34",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-11",
    "Embalagem": "PET 2L",
    "Quantidade": 10,
    "Inicio": "08:17:23",
    "Fim": "08:58:41",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-11",
    "Embalagem": "LATA 269",
    "Quantidade": 1,
    "Inicio": "11:24:00",
    "Fim": "11:26:28",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-11",
    "Embalagem": "LONG NECK",
    "Quantidade": 1,
    "Inicio": "11:16:42",
    "Fim": "11:21:20",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-11",
    "Embalagem": "LATA 350",
    "Quantidade": 15,
    "Inicio": "10:35:36",
    "Fim": "11:16:14",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-11",
    "Embalagem": "PET 500ML",
    "Quantidade": 3,
    "Inicio": "09:34:16",
    "Fim": "09:41:42",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-11",
    "Embalagem": "PET 200ML",
    "Quantidade": 3,
    "Inicio": "09:46:18",
    "Fim": "09:53:47",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-11",
    "Embalagem": "LATA 473",
    "Quantidade": 7,
    "Inicio": "10:12:00",
    "Fim": "10:35:23",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-12",
    "Embalagem": "LATA 269",
    "Quantidade": 4,
    "Inicio": "14:35:02",
    "Fim": "14:45:55",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-12",
    "Embalagem": "LATA 350",
    "Quantidade": 3,
    "Inicio": "14:55:44",
    "Fim": "15:06:00",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-12",
    "Embalagem": "PET 1L",
    "Quantidade": 4,
    "Inicio": "10:11:17",
    "Fim": "10:27:03",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-12",
    "Embalagem": "PET 500ML",
    "Quantidade": 2,
    "Inicio": "14:16:22",
    "Fim": "14:22:36",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-12",
    "Embalagem": "PET 1L",
    "Quantidade": 2,
    "Inicio": "14:06:08",
    "Fim": "14:12:47",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-12",
    "Embalagem": "PET 2L",
    "Quantidade": 17,
    "Inicio": "08:45:00",
    "Fim": "10:01:40",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-12",
    "Embalagem": "LATA 350",
    "Quantidade": 15,
    "Inicio": "10:50:04",
    "Fim": "11:32:46",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-12",
    "Embalagem": "LATA 473",
    "Quantidade": 7,
    "Inicio": "11:43:18",
    "Fim": "12:01:49",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-13",
    "Embalagem": "PET 1L",
    "Quantidade": 4,
    "Inicio": "09:06:12",
    "Fim": "09:18:12",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-13",
    "Embalagem": "PET 2,5L",
    "Quantidade": 1,
    "Inicio": "08:59:45",
    "Fim": "09:02:55",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-13",
    "Embalagem": "LATA 350",
    "Quantidade": 12,
    "Inicio": "09:58:47",
    "Fim": "10:25:16",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-13",
    "Embalagem": "LATA 473",
    "Quantidade": 1,
    "Inicio": "10:26:10",
    "Fim": "10:29:24",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-13",
    "Embalagem": "PET 500ML",
    "Quantidade": 1,
    "Inicio": "09:49:45",
    "Fim": "09:52:51",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-13",
    "Embalagem": "PET 2L",
    "Quantidade": 4,
    "Inicio": "08:45:06",
    "Fim": "08:59:34",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-14",
    "Embalagem": "PET 1L",
    "Quantidade": 4,
    "Inicio": "14:13:26",
    "Fim": "14:29:26",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-14",
    "Embalagem": "PET 500ML",
    "Quantidade": 4,
    "Inicio": "14:44:57",
    "Fim": "14:57:47",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-14",
    "Embalagem": "LATA 350",
    "Quantidade": 24,
    "Inicio": "10:24:10",
    "Fim": "11:37:24",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-14",
    "Embalagem": "LATA 269",
    "Quantidade": 2,
    "Inicio": "14:58:13",
    "Fim": "15:04:44",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-14",
    "Embalagem": "PET 2L",
    "Quantidade": 12,
    "Inicio": "08:41:24",
    "Fim": "09:19:41",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-14",
    "Embalagem": "PET 200ML",
    "Quantidade": 6,
    "Inicio": "15:04:55",
    "Fim": "15:16:21",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-18",
    "Embalagem": "PET 500ML",
    "Quantidade": 4,
    "Inicio": "10:58:41",
    "Fim": "11:12:26",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-18",
    "Embalagem": "LATA 473",
    "Quantidade": 7,
    "Inicio": "15:48:35",
    "Fim": "16:13:28",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-18",
    "Embalagem": "PET 500ML",
    "Quantidade": 3,
    "Inicio": "10:39:20",
    "Fim": "10:48:42",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-18",
    "Embalagem": "LATA 350",
    "Quantidade": 11,
    "Inicio": "11:15:32",
    "Fim": "11:57:43",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-18",
    "Embalagem": "PET 1L",
    "Quantidade": 11,
    "Inicio": "09:48:00",
    "Fim": "10:29:57",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-18",
    "Embalagem": "PET 200ML",
    "Quantidade": 7,
    "Inicio": "10:39:20",
    "Fim": "10:56:24",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-18",
    "Embalagem": "PET 2L",
    "Quantidade": 22,
    "Inicio": "07:47:23",
    "Fim": "09:32:28",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-18",
    "Embalagem": "LATA 350",
    "Quantidade": 1,
    "Inicio": "16:21:47",
    "Fim": "16:25:21",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-18",
    "Embalagem": "LATA 350",
    "Quantidade": 19,
    "Inicio": "14:04:19",
    "Fim": "15:12:24",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-18",
    "Embalagem": "LATA 250",
    "Quantidade": 3,
    "Inicio": "16:14:01",
    "Fim": "16:21:30",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-19",
    "Embalagem": "PET 2,5L",
    "Quantidade": 1,
    "Inicio": "14:57:22",
    "Fim": "15:00:53",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-19",
    "Embalagem": "PET 1L",
    "Quantidade": 3,
    "Inicio": "15:15:45",
    "Fim": "15:22:53",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-19",
    "Embalagem": "PET 500ML",
    "Quantidade": 2,
    "Inicio": "14:48:02",
    "Fim": "14:57:03",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-19",
    "Embalagem": "PET 2L",
    "Quantidade": 8,
    "Inicio": "14:04:06",
    "Fim": "14:30:36",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-19",
    "Embalagem": "LATA 350",
    "Quantidade": 15,
    "Inicio": "10:28:05",
    "Fim": "11:07:25",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-19",
    "Embalagem": "LATA 350",
    "Quantidade": 5,
    "Inicio": "14:57:22",
    "Fim": "15:15:20",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-19",
    "Embalagem": "PET 2L",
    "Quantidade": 1,
    "Inicio": "15:23:17",
    "Fim": "15:28:00",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-19",
    "Embalagem": "LATA 350",
    "Quantidade": 6,
    "Inicio": "09:10:40",
    "Fim": "09:33:13",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-19",
    "Embalagem": "LATA 473",
    "Quantidade": 7,
    "Inicio": "11:07:42",
    "Fim": "11:36:01",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-19",
    "Embalagem": "PET 1L",
    "Quantidade": 2,
    "Inicio": "14:30:55",
    "Fim": "14:37:37",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-19",
    "Embalagem": "LATA 269",
    "Quantidade": 1,
    "Inicio": "15:29:51",
    "Fim": "15:32:15",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-19",
    "Embalagem": "LATA 350",
    "Quantidade": 3,
    "Inicio": "14:37:47",
    "Fim": "14:47:52",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-20",
    "Embalagem": "PET 500ML",
    "Quantidade": 1,
    "Inicio": "11:55:16",
    "Fim": "11:57:38",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-20",
    "Embalagem": "LATA 350",
    "Quantidade": 18,
    "Inicio": "08:37:16",
    "Fim": "09:33:12",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-20",
    "Embalagem": "LATA 350",
    "Quantidade": 7,
    "Inicio": "11:24:57",
    "Fim": "11:55:01",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-20",
    "Embalagem": "PET 2L",
    "Quantidade": 9,
    "Inicio": "10:13:13",
    "Fim": "10:40:50",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-20",
    "Embalagem": "LONG NECK",
    "Quantidade": 1,
    "Inicio": "10:53:13",
    "Fim": "10:56:17",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-20",
    "Embalagem": "LATA 473",
    "Quantidade": 4,
    "Inicio": "09:43:56",
    "Fim": "09:59:41",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-20",
    "Embalagem": "PET 1L",
    "Quantidade": 2,
    "Inicio": "10:44:41",
    "Fim": "10:53:03",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-21",
    "Embalagem": "LATA 350",
    "Quantidade": 24,
    "Inicio": "08:32:38",
    "Fim": "10:03:59",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-24",
    "Embalagem": "PET 2L",
    "Quantidade": 4,
    "Inicio": "14:21:00",
    "Fim": "14:40:41",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-24",
    "Embalagem": "PET 1L",
    "Quantidade": 8,
    "Inicio": "14:57:51",
    "Fim": "15:39:10",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-24",
    "Embalagem": "PET 2,5L",
    "Quantidade": 2,
    "Inicio": "14:40:52",
    "Fim": "14:48:36",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-24",
    "Embalagem": "LATA 350",
    "Quantidade": 22,
    "Inicio": "09:06:48",
    "Fim": "10:26:15",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-24",
    "Embalagem": "LONG NECK",
    "Quantidade": 3,
    "Inicio": "16:12:06",
    "Fim": "16:26:30",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-24",
    "Embalagem": "LATA 473",
    "Quantidade": 15,
    "Inicio": "10:26:41",
    "Fim": "11:16:51",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-24",
    "Embalagem": "PET 2L",
    "Quantidade": 8,
    "Inicio": "11:30:44",
    "Fim": "11:58:31",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-25",
    "Embalagem": "LATA 350",
    "Quantidade": 22,
    "Inicio": "10:05:58",
    "Fim": "11:09:00",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-25",
    "Embalagem": "LONG NECK",
    "Quantidade": 1,
    "Inicio": "15:10:06",
    "Fim": "15:13:13",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-25",
    "Embalagem": "PET 500ML",
    "Quantidade": 9,
    "Inicio": "11:26:00",
    "Fim": "11:57:56",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-25",
    "Embalagem": "LATA 350",
    "Quantidade": 3,
    "Inicio": "14:48:44",
    "Fim": "14:56:17",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-25",
    "Embalagem": "PET 1L",
    "Quantidade": 9,
    "Inicio": "14:02:49",
    "Fim": "14:37:18",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-25",
    "Embalagem": "PET 2L",
    "Quantidade": 4,
    "Inicio": "15:13:22",
    "Fim": "15:26:15",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-25",
    "Embalagem": "LATA 250",
    "Quantidade": 4,
    "Inicio": "14:56:28",
    "Fim": "15:03:59",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-25",
    "Embalagem": "LATA 269",
    "Quantidade": 2,
    "Inicio": "15:04:11",
    "Fim": "15:08:49",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-25",
    "Embalagem": "LATA 350",
    "Quantidade": 13,
    "Inicio": "08:18:34",
    "Fim": "09:01:59",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-25",
    "Embalagem": "LATA 473",
    "Quantidade": 5,
    "Inicio": "11:09:26",
    "Fim": "11:26:51",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-26",
    "Embalagem": "PET 2L",
    "Quantidade": 15,
    "Inicio": "09:27:06",
    "Fim": "10:11:16",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-26",
    "Embalagem": "PET 2L",
    "Quantidade": 5,
    "Inicio": "08:38:30",
    "Fim": "08:57:48",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-26",
    "Embalagem": "LATA 269",
    "Quantidade": 1,
    "Inicio": "14:44:03",
    "Fim": "14:47:15",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-26",
    "Embalagem": "LONG NECK",
    "Quantidade": 2,
    "Inicio": "14:22:25",
    "Fim": "14:31:06",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-26",
    "Embalagem": "PET 1L",
    "Quantidade": 1,
    "Inicio": "14:37:16",
    "Fim": "14:40:28",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-26",
    "Embalagem": "LATA 350",
    "Quantidade": 20,
    "Inicio": "10:38:24",
    "Fim": "11:44:20",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-26",
    "Embalagem": "PET 500ML",
    "Quantidade": 1,
    "Inicio": "14:40:40",
    "Fim": "14:43:54",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-26",
    "Embalagem": "LATA 473",
    "Quantidade": 2,
    "Inicio": "11:44:32",
    "Fim": "11:50:09",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-27",
    "Embalagem": "LATA 350",
    "Quantidade": 10,
    "Inicio": "11:08:57",
    "Fim": "11:38:42",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-27",
    "Embalagem": "LONG NECK",
    "Quantidade": 1,
    "Inicio": "10:36:23",
    "Fim": "10:40:46",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-27",
    "Embalagem": "PET 500ML",
    "Quantidade": 4,
    "Inicio": "09:24:29",
    "Fim": "09:34:04",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-27",
    "Embalagem": "PET 1L",
    "Quantidade": 4,
    "Inicio": "08:34:48",
    "Fim": "08:48:22",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-27",
    "Embalagem": "LATA 473",
    "Quantidade": 2,
    "Inicio": "10:20:56",
    "Fim": "10:30:42",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-27",
    "Embalagem": "LATA 269",
    "Quantidade": 1,
    "Inicio": "10:30:52",
    "Fim": "10:33:02",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-27",
    "Embalagem": "PET 2L",
    "Quantidade": 2,
    "Inicio": "08:48:32",
    "Fim": "08:54:05",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-27",
    "Embalagem": "LATA 350",
    "Quantidade": 11,
    "Inicio": "09:48:28",
    "Fim": "10:20:47",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-28",
    "Embalagem": "LATA 473",
    "Quantidade": 3,
    "Inicio": "11:47:12",
    "Fim": "11:58:50",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-28",
    "Embalagem": "PET 1L",
    "Quantidade": 3,
    "Inicio": "10:00:08",
    "Fim": "10:12:25",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-28",
    "Embalagem": "LATA 350",
    "Quantidade": 19,
    "Inicio": "10:48:56",
    "Fim": "11:42:26",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-28",
    "Embalagem": "PET 500ML",
    "Quantidade": 5,
    "Inicio": "10:13:03",
    "Fim": "10:28:32",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-28",
    "Embalagem": "PET 2,5L",
    "Quantidade": 3,
    "Inicio": "09:41:49",
    "Fim": "09:51:23",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-28",
    "Embalagem": "LATA 269",
    "Quantidade": 1,
    "Inicio": "11:58:59",
    "Fim": "12:01:02",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-28",
    "Embalagem": "PET 2L",
    "Quantidade": 11,
    "Inicio": "08:23:24",
    "Fim": "09:11:56",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-31",
    "Embalagem": "PET 2L",
    "Quantidade": 8,
    "Inicio": "10:00:18",
    "Fim": "10:32:55",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-31",
    "Embalagem": "LONG NECK",
    "Quantidade": 3,
    "Inicio": "15:36:12",
    "Fim": "15:47:35",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-31",
    "Embalagem": "LATA 473",
    "Quantidade": 3,
    "Inicio": "11:24:00",
    "Fim": "11:32:27",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-31",
    "Embalagem": "LATA 350",
    "Quantidade": 4,
    "Inicio": "11:45:30",
    "Fim": "11:56:59",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-31",
    "Embalagem": "LATA 269",
    "Quantidade": 2,
    "Inicio": "15:22:38",
    "Fim": "15:30:19",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-31",
    "Embalagem": "LATA 350",
    "Quantidade": 14,
    "Inicio": "14:39:25",
    "Fim": "15:21:52",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-31",
    "Embalagem": "PET 500ML",
    "Quantidade": 3,
    "Inicio": "11:01:57",
    "Fim": "11:11:24",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-05-31",
    "Embalagem": "PET 1L",
    "Quantidade": 3,
    "Inicio": "10:39:58",
    "Fim": "10:49:39",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-01",
    "Embalagem": "PET 500ML",
    "Quantidade": 2,
    "Inicio": "14:48:04",
    "Fim": "14:54:39",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-01",
    "Embalagem": "PET 2L",
    "Quantidade": 13,
    "Inicio": "07:57:08",
    "Fim": "09:01:54",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-01",
    "Embalagem": "PET 200ML",
    "Quantidade": 2,
    "Inicio": "14:54:47",
    "Fim": "14:58:50",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-01",
    "Embalagem": "PET 1L",
    "Quantidade": 4,
    "Inicio": "09:45:44",
    "Fim": "09:56:06",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-01",
    "Embalagem": "PET 2,5L",
    "Quantidade": 3,
    "Inicio": "09:28:40",
    "Fim": "09:37:02",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-01",
    "Embalagem": "LATA 473",
    "Quantidade": 9,
    "Inicio": "13:57:51",
    "Fim": "14:35:26",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-01",
    "Embalagem": "LATA 350",
    "Quantidade": 17,
    "Inicio": "11:12:00",
    "Fim": "11:54:26",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-01",
    "Embalagem": "LATA 350",
    "Quantidade": 3,
    "Inicio": "14:40:13",
    "Fim": "14:47:39",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-02",
    "Embalagem": "PET 1L",
    "Quantidade": 2,
    "Inicio": "08:25:50",
    "Fim": "08:35:14",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-02",
    "Embalagem": "PET 2L",
    "Quantidade": 7,
    "Inicio": "07:51:38",
    "Fim": "08:16:46",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-02",
    "Embalagem": "PET 200ML",
    "Quantidade": 2,
    "Inicio": "08:47:44",
    "Fim": "08:52:30",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-02",
    "Embalagem": "PET 500ML",
    "Quantidade": 2,
    "Inicio": "10:01:43",
    "Fim": "10:10:37",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-02",
    "Embalagem": "LATA 350",
    "Quantidade": 15,
    "Inicio": "09:13:33",
    "Fim": "09:50:05",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-02",
    "Embalagem": "PET 500ML",
    "Quantidade": 4,
    "Inicio": "08:35:31",
    "Fim": "08:47:33",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-02",
    "Embalagem": "LONG NECK",
    "Quantidade": 2,
    "Inicio": "10:10:58",
    "Fim": "10:20:43",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-02",
    "Embalagem": "PET 2L",
    "Quantidade": 2,
    "Inicio": "10:25:20",
    "Fim": "10:31:09",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-02",
    "Embalagem": "LATA 473",
    "Quantidade": 2,
    "Inicio": "09:55:11",
    "Fim": "10:01:37",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-03",
    "Embalagem": "PET 500ML",
    "Quantidade": 4,
    "Inicio": "09:41:17",
    "Fim": "09:53:53",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-03",
    "Embalagem": "PET 2L",
    "Quantidade": 7,
    "Inicio": "10:43:21",
    "Fim": "11:09:12",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-03",
    "Embalagem": "LONG NECK",
    "Quantidade": 1,
    "Inicio": "11:19:38",
    "Fim": "11:22:16",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-03",
    "Embalagem": "LATA 350",
    "Quantidade": 11,
    "Inicio": "08:36:08",
    "Fim": "09:05:24",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-03",
    "Embalagem": "PET 1L",
    "Quantidade": 7,
    "Inicio": "10:00:38",
    "Fim": "10:27:22",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-03",
    "Embalagem": "PET 1L",
    "Quantidade": 3,
    "Inicio": "11:09:25",
    "Fim": "11:19:26",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-03",
    "Embalagem": "LATA 269",
    "Quantidade": 1,
    "Inicio": "09:05:46",
    "Fim": "09:08:08",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-03",
    "Embalagem": "PET 200ML",
    "Quantidade": 2,
    "Inicio": "09:54:06",
    "Fim": "09:59:10",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-03",
    "Embalagem": "LATA 473",
    "Quantidade": 2,
    "Inicio": "09:25:33",
    "Fim": "09:33:51",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-04",
    "Embalagem": "PET 2L",
    "Quantidade": 9,
    "Inicio": "10:21:11",
    "Fim": "10:49:00",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-04",
    "Embalagem": "LATA 473",
    "Quantidade": 1,
    "Inicio": "14:48:12",
    "Fim": "14:51:27",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-04",
    "Embalagem": "LATA 350",
    "Quantidade": 12,
    "Inicio": "11:18:22",
    "Fim": "11:52:07",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-04",
    "Embalagem": "PET 500ML",
    "Quantidade": 8,
    "Inicio": "14:57:30",
    "Fim": "15:20:13",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-04",
    "Embalagem": "PET 2,5L",
    "Quantidade": 1,
    "Inicio": "10:49:20",
    "Fim": "10:53:11",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-04",
    "Embalagem": "LATA 350",
    "Quantidade": 3,
    "Inicio": "14:40:01",
    "Fim": "14:48:01",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-04",
    "Embalagem": "PET 1L",
    "Quantidade": 11,
    "Inicio": "09:11:28",
    "Fim": "09:53:55",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-04",
    "Embalagem": "LATA 473",
    "Quantidade": 4,
    "Inicio": "14:27:14",
    "Fim": "14:39:33",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-04",
    "Embalagem": "PET 200ML",
    "Quantidade": 8,
    "Inicio": "15:28:41",
    "Fim": "15:49:24",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-07",
    "Embalagem": "PET 2L",
    "Quantidade": 5,
    "Inicio": "09:38:13",
    "Fim": "09:57:42",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-07",
    "Embalagem": "LATA 473",
    "Quantidade": 1,
    "Inicio": "11:47:25",
    "Fim": "11:49:12",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-07",
    "Embalagem": "PET 1L",
    "Quantidade": 6,
    "Inicio": "10:08:22",
    "Fim": "10:30:03",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-07",
    "Embalagem": "LATA 350",
    "Quantidade": 18,
    "Inicio": "10:59:16",
    "Fim": "11:44:23",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-07",
    "Embalagem": "LATA 269",
    "Quantidade": 2,
    "Inicio": "11:59:47",
    "Fim": "12:04:53",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-07",
    "Embalagem": "PET 500ML",
    "Quantidade": 3,
    "Inicio": "11:51:25",
    "Fim": "11:59:37",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-08",
    "Embalagem": "LATA 350",
    "Quantidade": 18,
    "Inicio": "14:28:20",
    "Fim": "15:17:08",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-08",
    "Embalagem": "LATA 350",
    "Quantidade": 26,
    "Inicio": "10:40:15",
    "Fim": "11:57:14",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-08",
    "Embalagem": "PET 2L",
    "Quantidade": 8,
    "Inicio": "16:14:01",
    "Fim": "16:40:18",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-08",
    "Embalagem": "LATA 473",
    "Quantidade": 8,
    "Inicio": "15:39:53",
    "Fim": "16:04:18",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-08",
    "Embalagem": "PET 1L",
    "Quantidade": 11,
    "Inicio": "09:42:03",
    "Fim": "10:19:39",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-08",
    "Embalagem": "LATA 473",
    "Quantidade": 2,
    "Inicio": "16:05:00",
    "Fim": "16:11:03",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-08",
    "Embalagem": "PET 200ML",
    "Quantidade": 1,
    "Inicio": "12:05:21",
    "Fim": "12:07:12",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-09",
    "Embalagem": "LATA 473",
    "Quantidade": 4,
    "Inicio": "11:37:51",
    "Fim": "11:51:25",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-09",
    "Embalagem": "LATA 350",
    "Quantidade": 1,
    "Inicio": "11:51:38",
    "Fim": "11:54:41",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-09",
    "Embalagem": "LATA 350",
    "Quantidade": 51,
    "Inicio": "08:38:21",
    "Fim": "11:19:56",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-09",
    "Embalagem": "PET 1L",
    "Quantidade": 6,
    "Inicio": "14:15:20",
    "Fim": "14:36:07",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-09",
    "Embalagem": "PET 2L",
    "Quantidade": 16,
    "Inicio": "14:47:38",
    "Fim": "15:57:44",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-10",
    "Embalagem": "PET 2L",
    "Quantidade": 9,
    "Inicio": "08:30:35",
    "Fim": "09:01:13",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-10",
    "Embalagem": "LATA 269",
    "Quantidade": 1,
    "Inicio": "15:10:59",
    "Fim": "15:14:37",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-10",
    "Embalagem": "PET 2,5L",
    "Quantidade": 2,
    "Inicio": "15:03:43",
    "Fim": "15:10:50",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-10",
    "Embalagem": "LATA 473",
    "Quantidade": 4,
    "Inicio": "14:49:21",
    "Fim": "15:03:28",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-10",
    "Embalagem": "LONG NECK",
    "Quantidade": 3,
    "Inicio": "15:39:16",
    "Fim": "15:54:03",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-10",
    "Embalagem": "LATA 350",
    "Quantidade": 5,
    "Inicio": "14:20:00",
    "Fim": "14:36:02",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-10",
    "Embalagem": "PET 500ML",
    "Quantidade": 8,
    "Inicio": "10:40:59",
    "Fim": "11:05:19",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-10",
    "Embalagem": "PET 200ML",
    "Quantidade": 1,
    "Inicio": "15:14:49",
    "Fim": "15:16:46",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-10",
    "Embalagem": "LONG NECK",
    "Quantidade": 3,
    "Inicio": "16:01:58",
    "Fim": "16:14:14",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-10",
    "Embalagem": "PET 1L",
    "Quantidade": 9,
    "Inicio": "09:40:24",
    "Fim": "10:09:18",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-10",
    "Embalagem": "LATA 350",
    "Quantidade": 10,
    "Inicio": "11:34:14",
    "Fim": "12:00:18",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-11",
    "Embalagem": "PET 1L",
    "Quantidade": 2,
    "Inicio": "11:41:54",
    "Fim": "11:48:09",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-11",
    "Embalagem": "LATA 473",
    "Quantidade": 1,
    "Inicio": "10:06:33",
    "Fim": "10:09:50",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-11",
    "Embalagem": "PET 2L",
    "Quantidade": 5,
    "Inicio": "10:39:02",
    "Fim": "10:53:54",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-11",
    "Embalagem": "PET 200ML",
    "Quantidade": 1,
    "Inicio": "10:19:04",
    "Fim": "10:21:36",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-11",
    "Embalagem": "LATA 350",
    "Quantidade": 1,
    "Inicio": "11:48:16",
    "Fim": "11:51:23",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-11",
    "Embalagem": "LONG NECK",
    "Quantidade": 4,
    "Inicio": "11:21:27",
    "Fim": "11:39:42",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-11",
    "Embalagem": "PET 500ML",
    "Quantidade": 2,
    "Inicio": "10:10:00",
    "Fim": "10:16:36",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-11",
    "Embalagem": "LATA 350",
    "Quantidade": 21,
    "Inicio": "08:44:00",
    "Fim": "09:52:59",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-11",
    "Embalagem": "LATA 250",
    "Quantidade": 1,
    "Inicio": "10:16:45",
    "Fim": "10:18:54",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-14",
    "Embalagem": "LATA 250",
    "Quantidade": 4,
    "Inicio": "14:51:20",
    "Fim": "14:59:43",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-14",
    "Embalagem": "LATA 269",
    "Quantidade": 2,
    "Inicio": "11:50:17",
    "Fim": "11:55:36",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-14",
    "Embalagem": "PET 500ML",
    "Quantidade": 5,
    "Inicio": "10:33:26",
    "Fim": "10:50:34",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-14",
    "Embalagem": "PET 200ML",
    "Quantidade": 1,
    "Inicio": "11:55:52",
    "Fim": "11:58:38",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-14",
    "Embalagem": "LATA 473",
    "Quantidade": 2,
    "Inicio": "11:44:05",
    "Fim": "11:49:57",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-14",
    "Embalagem": "PET 2L",
    "Quantidade": 11,
    "Inicio": "09:45:53",
    "Fim": "10:32:42",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-14",
    "Embalagem": "LATA 350",
    "Quantidade": 8,
    "Inicio": "11:11:16",
    "Fim": "11:32:49",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-14",
    "Embalagem": "LATA 269",
    "Quantidade": 1,
    "Inicio": "15:00:05",
    "Fim": "15:03:34",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-14",
    "Embalagem": "PET 1L",
    "Quantidade": 10,
    "Inicio": "09:09:55",
    "Fim": "09:45:38",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-14",
    "Embalagem": "LONG NECK",
    "Quantidade": 6,
    "Inicio": "14:11:23",
    "Fim": "14:29:40",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-15",
    "Embalagem": "PET 500ML",
    "Quantidade": 3,
    "Inicio": "11:21:22",
    "Fim": "11:31:49",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-15",
    "Embalagem": "LATA 269",
    "Quantidade": 1,
    "Inicio": "11:32:01",
    "Fim": "11:34:49",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-15",
    "Embalagem": "PET 1L",
    "Quantidade": 4,
    "Inicio": "10:29:58",
    "Fim": "10:45:06",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-15",
    "Embalagem": "LATA 473",
    "Quantidade": 10,
    "Inicio": "09:56:00",
    "Fim": "10:18:19",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-15",
    "Embalagem": "LONG NECK",
    "Quantidade": 2,
    "Inicio": "11:38:58",
    "Fim": "11:49:41",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-15",
    "Embalagem": "LATA 350",
    "Quantidade": 14,
    "Inicio": "09:07:45",
    "Fim": "09:44:52",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-15",
    "Embalagem": "PET 1L",
    "Quantidade": 2,
    "Inicio": "10:45:29",
    "Fim": "10:53:45",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-15",
    "Embalagem": "PET 2L",
    "Quantidade": 10,
    "Inicio": "10:53:59",
    "Fim": "11:21:12",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-17",
    "Embalagem": "PET 2L",
    "Quantidade": 21,
    "Inicio": "08:01:37",
    "Fim": "09:03:35",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-06-17",
    "Embalagem": "PET 200ML",
    "Quantidade": 6,
    "Inicio": "11:41:09",
    "Fim": "11:57:18",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-06-17",
    "Embalagem": "PET 2,5L",
    "Quantidade": 6,
    "Inicio": "09:33:15",
    "Fim": "09:53:56",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-06-17",
    "Embalagem": "PET 2,5L",
    "Quantidade": 2,
    "Inicio": "09:54:27",
    "Fim": "10:00:47",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-06-17",
    "Embalagem": "LATA 350",
    "Quantidade": 25,
    "Inicio": "14:30:59",
    "Fim": "15:30:34",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-06-17",
    "Embalagem": "PET 1L",
    "Quantidade": 8,
    "Inicio": "10:24:42",
    "Fim": "10:52:19",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-06-17",
    "Embalagem": "PET 500ML",
    "Quantidade": 9,
    "Inicio": "11:13:38",
    "Fim": "11:36:59",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-06-19",
    "Embalagem": "LATA 350",
    "Quantidade": 45,
    "Inicio": "07:19:38",
    "Fim": "09:32:23",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-22",
    "Embalagem": "PET 2L",
    "Quantidade": 9,
    "Inicio": "11:35:31",
    "Fim": "11:59:42",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-22",
    "Embalagem": "LATA 269",
    "Quantidade": 3,
    "Inicio": "14:56:55",
    "Fim": "15:06:40",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-22",
    "Embalagem": "LATA 350",
    "Quantidade": 9,
    "Inicio": "10:09:08",
    "Fim": "10:27:07",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-22",
    "Embalagem": "LATA 350",
    "Quantidade": 10,
    "Inicio": "09:27:10",
    "Fim": "10:08:55",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-22",
    "Embalagem": "PET 500ML",
    "Quantidade": 12,
    "Inicio": "15:06:49",
    "Fim": "15:35:45",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-22",
    "Embalagem": "PET 200ML",
    "Quantidade": 5,
    "Inicio": "15:35:57",
    "Fim": "15:49:32",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-22",
    "Embalagem": "PET 1L",
    "Quantidade": 12,
    "Inicio": "14:13:25",
    "Fim": "14:56:29",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-22",
    "Embalagem": "PET 2,5L",
    "Quantidade": 1,
    "Inicio": "15:49:47",
    "Fim": "15:53:11",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-22",
    "Embalagem": "LATA 473",
    "Quantidade": 12,
    "Inicio": "10:27:24",
    "Fim": "10:57:23",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-22",
    "Embalagem": "LONG NECK",
    "Quantidade": 6,
    "Inicio": "10:57:34",
    "Fim": "11:25:32",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-24",
    "Embalagem": "LATA 269",
    "Quantidade": 2,
    "Inicio": "11:08:10",
    "Fim": "11:12:17",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-24",
    "Embalagem": "PET 200ML",
    "Quantidade": 4,
    "Inicio": "11:48:07",
    "Fim": "11:55:40",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-24",
    "Embalagem": "PET 2L",
    "Quantidade": 5,
    "Inicio": "08:30:34",
    "Fim": "08:46:21",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-24",
    "Embalagem": "LATA 473",
    "Quantidade": 5,
    "Inicio": "10:52:36",
    "Fim": "11:07:55",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-24",
    "Embalagem": "PET 1L",
    "Quantidade": 6,
    "Inicio": "09:00:34",
    "Fim": "09:22:24",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-24",
    "Embalagem": "LATA 350",
    "Quantidade": 20,
    "Inicio": "09:47:55",
    "Fim": "10:47:31",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-24",
    "Embalagem": "LONG NECK",
    "Quantidade": 4,
    "Inicio": "11:34:13",
    "Fim": "11:47:52",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-25",
    "Embalagem": "LATA 350",
    "Quantidade": 17,
    "Inicio": "11:14:43",
    "Fim": "11:57:07",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-25",
    "Embalagem": "LATA 269",
    "Quantidade": 2,
    "Inicio": "14:20:45",
    "Fim": "14:25:57",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-25",
    "Embalagem": "PET 2L",
    "Quantidade": 18,
    "Inicio": "08:59:49",
    "Fim": "10:00:39",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-25",
    "Embalagem": "LATA 473",
    "Quantidade": 5,
    "Inicio": "14:26:06",
    "Fim": "14:43:11",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-25",
    "Embalagem": "LONG NECK",
    "Quantidade": 3,
    "Inicio": "15:05:57",
    "Fim": "15:22:44",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-25",
    "Embalagem": "PET 2,5L",
    "Quantidade": 3,
    "Inicio": "14:43:26",
    "Fim": "14:52:54",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-25",
    "Embalagem": "PET 1L",
    "Quantidade": 6,
    "Inicio": "10:16:21",
    "Fim": "10:36:17",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-28",
    "Embalagem": "PET 1L",
    "Quantidade": 3,
    "Inicio": "11:31:00",
    "Fim": "11:39:27",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-28",
    "Embalagem": "PET 500ML",
    "Quantidade": 2,
    "Inicio": "12:43:52",
    "Fim": "12:48:54",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-28",
    "Embalagem": "PET 2,5L",
    "Quantidade": 1,
    "Inicio": "11:17:58",
    "Fim": "11:21:09",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-28",
    "Embalagem": "LATA 473",
    "Quantidade": 3,
    "Inicio": "12:35:57",
    "Fim": "12:43:40",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-28",
    "Embalagem": "LATA 350",
    "Quantidade": 11,
    "Inicio": "11:54:11",
    "Fim": "12:35:44",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-28",
    "Embalagem": "PET 2L",
    "Quantidade": 7,
    "Inicio": "10:55:37",
    "Fim": "11:17:42",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-30",
    "Embalagem": "PET 2L",
    "Quantidade": 8,
    "Inicio": "10:13:48",
    "Fim": "10:39:28",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-30",
    "Embalagem": "LONG NECK",
    "Quantidade": 2,
    "Inicio": "11:23:11",
    "Fim": "11:31:23",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-30",
    "Embalagem": "LATA 473",
    "Quantidade": 2,
    "Inicio": "14:04:12",
    "Fim": "14:13:09",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-30",
    "Embalagem": "PET 200ML",
    "Quantidade": 2,
    "Inicio": "14:22:01",
    "Fim": "14:28:25",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-30",
    "Embalagem": "PET 1L",
    "Quantidade": 3,
    "Inicio": "10:46:46",
    "Fim": "10:56:50",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-30",
    "Embalagem": "LATA 350",
    "Quantidade": 6,
    "Inicio": "11:34:57",
    "Fim": "11:55:43",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-30",
    "Embalagem": "PET 2L",
    "Quantidade": 1,
    "Inicio": "09:49:37",
    "Fim": "09:52:45",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-06-30",
    "Embalagem": "LATA 350",
    "Quantidade": 4,
    "Inicio": "14:13:20",
    "Fim": "14:21:49",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-01",
    "Embalagem": "PET 2L",
    "Quantidade": 5,
    "Inicio": "09:56:49",
    "Fim": "10:11:59",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-01",
    "Embalagem": "PET 500ML",
    "Quantidade": 5,
    "Inicio": "10:24:08",
    "Fim": "10:40:24",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-01",
    "Embalagem": "PET 2L",
    "Quantidade": 10,
    "Inicio": "09:11:01",
    "Fim": "09:50:05",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-01",
    "Embalagem": "PET 1L",
    "Quantidade": 7,
    "Inicio": "08:25:02",
    "Fim": "08:48:05",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-01",
    "Embalagem": "PET 200ML",
    "Quantidade": 2,
    "Inicio": "10:40:42",
    "Fim": "10:45:50",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-01",
    "Embalagem": "LATA 350",
    "Quantidade": 33,
    "Inicio": "08:22:52",
    "Fim": "10:16:06",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-02",
    "Embalagem": "LATA 473",
    "Quantidade": 1,
    "Inicio": "10:28:47",
    "Fim": "10:31:55",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-02",
    "Embalagem": "PET 500ML",
    "Quantidade": 1,
    "Inicio": "10:34:16",
    "Fim": "10:37:03",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-02",
    "Embalagem": "LATA 269",
    "Quantidade": 1,
    "Inicio": "10:32:13",
    "Fim": "10:34:07",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-02",
    "Embalagem": "PET 2L",
    "Quantidade": 6,
    "Inicio": "10:46:06",
    "Fim": "11:03:23",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-02",
    "Embalagem": "LONG NECK",
    "Quantidade": 1,
    "Inicio": "11:28:35",
    "Fim": "11:33:07",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-02",
    "Embalagem": "PET 1L",
    "Quantidade": 4,
    "Inicio": "11:07:28",
    "Fim": "11:28:23",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-05",
    "Embalagem": "PET 200ML",
    "Quantidade": 2,
    "Inicio": "15:04:21",
    "Fim": "15:09:37",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-05",
    "Embalagem": "PET 1L",
    "Quantidade": 9,
    "Inicio": "10:40:00",
    "Fim": "11:17:40",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-05",
    "Embalagem": "LATA 350",
    "Quantidade": 20,
    "Inicio": "14:09:55",
    "Fim": "14:54:18",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-05",
    "Embalagem": "LATA 473",
    "Quantidade": 3,
    "Inicio": "14:54:41",
    "Fim": "15:04:11",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-05",
    "Embalagem": "PET 2L",
    "Quantidade": 11,
    "Inicio": "09:43:26",
    "Fim": "10:24:11",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-07",
    "Embalagem": "LATA 473",
    "Quantidade": 1,
    "Inicio": "11:49:24",
    "Fim": "11:52:25",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-07",
    "Embalagem": "PET 2L",
    "Quantidade": 8,
    "Inicio": "11:19:31",
    "Fim": "11:49:03",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-07",
    "Embalagem": "PET 500ML",
    "Quantidade": 1,
    "Inicio": "14:37:07",
    "Fim": "14:40:15",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-07",
    "Embalagem": "PET 1L",
    "Quantidade": 7,
    "Inicio": "10:40:02",
    "Fim": "11:08:02",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-07",
    "Embalagem": "LONG NECK",
    "Quantidade": 1,
    "Inicio": "14:25:01",
    "Fim": "14:29:23",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-07",
    "Embalagem": "LATA 350",
    "Quantidade": 14,
    "Inicio": "08:28:39",
    "Fim": "09:09:00",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-07",
    "Embalagem": "PET 2,5L",
    "Quantidade": 2,
    "Inicio": "14:29:35",
    "Fim": "14:36:47",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-08",
    "Embalagem": "LONG NECK",
    "Quantidade": 3,
    "Inicio": "14:37:00",
    "Fim": "14:50:59",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-07-08",
    "Embalagem": "PET 2L",
    "Quantidade": 15,
    "Inicio": "08:46:12",
    "Fim": "09:48:51",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-07-08",
    "Embalagem": "LATA 473",
    "Quantidade": 4,
    "Inicio": "11:38:49",
    "Fim": "11:50:45",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-07-08",
    "Embalagem": "PET 1L",
    "Quantidade": 3,
    "Inicio": "10:00:11",
    "Fim": "10:11:27",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-07-08",
    "Embalagem": "PET 500ML",
    "Quantidade": 1,
    "Inicio": "11:50:55",
    "Fim": "11:53:56",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-07-08",
    "Embalagem": "LATA 269",
    "Quantidade": 1,
    "Inicio": "11:56:11",
    "Fim": "11:59:04",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-07-08",
    "Embalagem": "PET 1L",
    "Quantidade": 1,
    "Inicio": "10:11:51",
    "Fim": "10:15:00",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-07-08",
    "Embalagem": "LATA 350",
    "Quantidade": 15,
    "Inicio": "10:42:01",
    "Fim": "11:30:07",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-07-08",
    "Embalagem": "PET 200ML",
    "Quantidade": 1,
    "Inicio": "11:54:04",
    "Fim": "11:56:01",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-07-12",
    "Embalagem": "LATA 350",
    "Quantidade": 3,
    "Inicio": "11:46:37",
    "Fim": "11:57:50",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-12",
    "Embalagem": "LATA 250",
    "Quantidade": 2,
    "Inicio": "15:37:16",
    "Fim": "15:41:11",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-12",
    "Embalagem": "PET 2,5L",
    "Quantidade": 1,
    "Inicio": "08:56:11",
    "Fim": "09:00:17",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-12",
    "Embalagem": "PET 1L",
    "Quantidade": 16,
    "Inicio": "10:01:08",
    "Fim": "11:08:55",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-12",
    "Embalagem": "LATA 350",
    "Quantidade": 19,
    "Inicio": "14:29:53",
    "Fim": "15:30:56",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-12",
    "Embalagem": "LATA 473",
    "Quantidade": 1,
    "Inicio": "15:31:36",
    "Fim": "15:34:07",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-12",
    "Embalagem": "LATA 269",
    "Quantidade": 1,
    "Inicio": "15:34:19",
    "Fim": "15:37:07",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-12",
    "Embalagem": "PET 1L",
    "Quantidade": 6,
    "Inicio": "15:48:46",
    "Fim": "16:07:56",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-12",
    "Embalagem": "PET 2L",
    "Quantidade": 14,
    "Inicio": "08:09:52",
    "Fim": "08:55:49",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-12",
    "Embalagem": "LATA 473",
    "Quantidade": 3,
    "Inicio": "11:31:55",
    "Fim": "11:46:26",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-13",
    "Embalagem": "LATA 269",
    "Quantidade": 2,
    "Inicio": "14:21:38",
    "Fim": "14:28:43",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-13",
    "Embalagem": "LONG NECK",
    "Quantidade": 2,
    "Inicio": "14:13:52",
    "Fim": "14:21:25",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-13",
    "Embalagem": "PET 200ML",
    "Quantidade": 7,
    "Inicio": "11:16:56",
    "Fim": "11:33:19",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-13",
    "Embalagem": "LATA 473",
    "Quantidade": 4,
    "Inicio": "14:59:22",
    "Fim": "15:12:53",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-13",
    "Embalagem": "PET 1L",
    "Quantidade": 6,
    "Inicio": "10:32:32",
    "Fim": "10:54:53",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-13",
    "Embalagem": "PET 500ML",
    "Quantidade": 2,
    "Inicio": "11:10:12",
    "Fim": "11:16:42",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-13",
    "Embalagem": "PET 2L",
    "Quantidade": 9,
    "Inicio": "08:44:00",
    "Fim": "09:18:13",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-13",
    "Embalagem": "LATA 350",
    "Quantidade": 2,
    "Inicio": "14:51:11",
    "Fim": "14:59:05",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-13",
    "Embalagem": "PET 2L",
    "Quantidade": 2,
    "Inicio": "10:23:00",
    "Fim": "10:31:03",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-13",
    "Embalagem": "PET 2L",
    "Quantidade": 8,
    "Inicio": "09:50:28",
    "Fim": "10:18:36",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-15",
    "Embalagem": "PET 1L",
    "Quantidade": 1,
    "Inicio": "10:34:31",
    "Fim": "10:38:55",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-15",
    "Embalagem": "LATA 350",
    "Quantidade": 25,
    "Inicio": "14:24:52",
    "Fim": "15:22:45",
    "Meta": "02:17:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-15",
    "Embalagem": "PET 500ml",
    "Quantidade": 1,
    "Inicio": "10:45:17",
    "Fim": "10:49:29",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-15",
    "Embalagem": "PET 2L",
    "Quantidade": 1,
    "Inicio": "08:22:00",
    "Fim": "08:50:00",
    "Meta": "00:05:00",
    "Resultado": "🔴 ACIMA DA META",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-15",
    "Embalagem": "LATA 350",
    "Quantidade": 24,
    "Inicio": "10:52:02",
    "Fim": "11:53:21",
    "Meta": "02:12:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-15",
    "Embalagem": "LATA 473",
    "Quantidade": 25,
    "Inicio": "14:19:00",
    "Fim": "15:35:01",
    "Meta": "02:17:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-15",
    "Embalagem": "LATA 269",
    "Quantidade": 1,
    "Inicio": "10:39:52",
    "Fim": "10:42:21",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-15",
    "Embalagem": "LATA 350",
    "Quantidade": 12,
    "Inicio": "09:47:45",
    "Fim": "10:27:16",
    "Meta": "01:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-15",
    "Embalagem": "LONG NECK",
    "Quantidade": 2,
    "Inicio": "09:18:23",
    "Fim": "09:25:23",
    "Meta": "00:12:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-16",
    "Embalagem": "PET 2L",
    "Quantidade": 10,
    "Inicio": "10:41:52",
    "Fim": "11:23:45",
    "Meta": "00:50:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-16",
    "Embalagem": "PET 500ml",
    "Quantidade": 2,
    "Inicio": "14:07:00",
    "Fim": "14:15:15",
    "Meta": "00:10:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-16",
    "Embalagem": "LATA 350",
    "Quantidade": 15,
    "Inicio": "08:06:40",
    "Fim": "09:09:25",
    "Meta": "01:22:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-16",
    "Embalagem": "PET 1L",
    "Quantidade": 4,
    "Inicio": "11:33:25",
    "Fim": "11:48:15",
    "Meta": "00:22:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-16",
    "Embalagem": "PET 200ml",
    "Quantidade": 6,
    "Inicio": "14:15:35",
    "Fim": "14:31:53",
    "Meta": "00:27:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-16",
    "Embalagem": "LATA 350",
    "Quantidade": 10,
    "Inicio": "09:29:14",
    "Fim": "10:05:33",
    "Meta": "00:55:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-16",
    "Embalagem": "PET 2,5L",
    "Quantidade": 1,
    "Inicio": "11:24:03",
    "Fim": "11:27:48",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-16",
    "Embalagem": "LATA 269",
    "Quantidade": 1,
    "Inicio": "14:32:20",
    "Fim": "14:36:21",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-16",
    "Embalagem": "LATA 473",
    "Quantidade": 9,
    "Inicio": "10:06:12",
    "Fim": "10:41:07",
    "Meta": "00:49:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-20",
    "Embalagem": "LATA 250",
    "Quantidade": 3,
    "Inicio": "14:43:30",
    "Fim": "14:52:12",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-20",
    "Embalagem": "LONG NECK",
    "Quantidade": 2,
    "Inicio": "15:05:30",
    "Fim": "15:14:59",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-20",
    "Embalagem": "PET 200ml",
    "Quantidade": 1,
    "Inicio": "14:52:37",
    "Fim": "14:55:42",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-20",
    "Embalagem": "LATA 473",
    "Quantidade": 7,
    "Inicio": "10:48:03",
    "Fim": "11:13:01",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-20",
    "Embalagem": "LATA 350",
    "Quantidade": 17,
    "Inicio": "09:35:46",
    "Fim": "10:25:46",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-20",
    "Embalagem": "PET 1L",
    "Quantidade": 4,
    "Inicio": "14:16:54",
    "Fim": "14:31:45",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-20",
    "Embalagem": "PET 2L",
    "Quantidade": 6,
    "Inicio": "11:21:35",
    "Fim": "11:43:41",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-20",
    "Embalagem": "LATA 269",
    "Quantidade": 2,
    "Inicio": "14:32:16",
    "Fim": "14:37:36",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-21",
    "Embalagem": "LONG NECK",
    "Quantidade": 1,
    "Inicio": "16:21:32",
    "Fim": "16:25:58",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-21",
    "Embalagem": "PET 2L",
    "Quantidade": 15,
    "Inicio": "11:00:26",
    "Fim": "11:17:12",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-21",
    "Embalagem": "PET 1L",
    "Quantidade": 3,
    "Inicio": "11:33:24",
    "Fim": "11:43:25",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-21",
    "Embalagem": "LATA 269",
    "Quantidade": 1,
    "Inicio": "16:17:35",
    "Fim": "16:21:13",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-21",
    "Embalagem": "LATA 350",
    "Quantidade": 32,
    "Inicio": "14:17:56",
    "Fim": "15:58:09",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-21",
    "Embalagem": "PET 500ml",
    "Quantidade": 2,
    "Inicio": "11:43:42",
    "Fim": "11:51:11",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-21",
    "Embalagem": "LATA 473",
    "Quantidade": 3,
    "Inicio": "16:06:28",
    "Fim": "16:17:06",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-22",
    "Embalagem": "LATA 350",
    "Quantidade": 13,
    "Inicio": "15:14:05",
    "Fim": "15:47:35",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-07-22",
    "Embalagem": "LATA 350",
    "Quantidade": 6,
    "Inicio": "14:00:01",
    "Fim": "14:39:55",
    "Meta": "00:05:30",
    "Resultado": "🔴 ACIMA DA META",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-07-22",
    "Embalagem": "LATA 473",
    "Quantidade": 6,
    "Inicio": "11:36:33",
    "Fim": "11:57:10",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-07-22",
    "Embalagem": "PET 500ml",
    "Quantidade": 1,
    "Inicio": "11:22:56",
    "Fim": "11:27:42",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-07-22",
    "Embalagem": "PET 1L",
    "Quantidade": 2,
    "Inicio": "10:41:59",
    "Fim": "10:50:20",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-07-22",
    "Embalagem": "PET 1L",
    "Quantidade": 4,
    "Inicio": "10:25:00",
    "Fim": "10:41:07",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-07-22",
    "Embalagem": "PET 2L",
    "Quantidade": 14,
    "Inicio": "09:16:11",
    "Fim": "10:08:43",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-07-22",
    "Embalagem": "LATA 250",
    "Quantidade": 1,
    "Inicio": "15:54:50",
    "Fim": "15:57:42",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-07-22",
    "Embalagem": "PET 200ml",
    "Quantidade": 5,
    "Inicio": "11:07:34",
    "Fim": "11:22:20",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-07-22",
    "Embalagem": "PET 2,5L",
    "Quantidade": 2,
    "Inicio": "10:18:25",
    "Fim": "10:24:41",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-07-22",
    "Embalagem": "LATA 269",
    "Quantidade": 2,
    "Inicio": "15:48:36",
    "Fim": "15:54:29",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-07-23",
    "Embalagem": "PET 2L",
    "Quantidade": 6,
    "Inicio": "14:00:48",
    "Fim": "14:25:19",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-23",
    "Embalagem": "LATA 350",
    "Quantidade": 32,
    "Inicio": "09:34:03",
    "Fim": "11:22:32",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-23",
    "Embalagem": "LATA 269",
    "Quantidade": 1,
    "Inicio": "15:09:47",
    "Fim": "15:12:25",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-23",
    "Embalagem": "PET 2,5L",
    "Quantidade": 1,
    "Inicio": "14:34:11",
    "Fim": "14:37:20",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-23",
    "Embalagem": "LATA 250",
    "Quantidade": 1,
    "Inicio": "15:12:43",
    "Fim": "15:15:31",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-23",
    "Embalagem": "LATA 473",
    "Quantidade": 8,
    "Inicio": "11:28:33",
    "Fim": "11:55:36",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-23",
    "Embalagem": "PET 200ml",
    "Quantidade": 8,
    "Inicio": "14:41:46",
    "Fim": "15:02:23",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-23",
    "Embalagem": "PET 500ml",
    "Quantidade": 2,
    "Inicio": "15:02:56",
    "Fim": "15:09:15",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-26",
    "Embalagem": "LONG NECK",
    "Quantidade": 1,
    "Inicio": "15:12:19",
    "Fim": "15:15:55",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-26",
    "Embalagem": "LATA 250",
    "Quantidade": 3,
    "Inicio": "15:05:10",
    "Fim": "15:12:03",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-26",
    "Embalagem": "LATA 350",
    "Quantidade": 13,
    "Inicio": "14:00:41",
    "Fim": "14:50:45",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-26",
    "Embalagem": "PET 500ml",
    "Quantidade": 4,
    "Inicio": "11:29:36",
    "Fim": "11:44:11",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-26",
    "Embalagem": "PET 1L",
    "Quantidade": 4,
    "Inicio": "10:34:47",
    "Fim": "10:52:34",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-26",
    "Embalagem": "PET 200ml",
    "Quantidade": 4,
    "Inicio": "14:51:20",
    "Fim": "15:04:53",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-26",
    "Embalagem": "PET 2L",
    "Quantidade": 12,
    "Inicio": "09:44:25",
    "Fim": "10:34:07",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-26",
    "Embalagem": "LATA 250",
    "Quantidade": 6,
    "Inicio": "11:07:41",
    "Fim": "11:25:11",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-27",
    "Embalagem": "LATA 350",
    "Quantidade": 15,
    "Inicio": "14:09:08",
    "Fim": "15:12:51",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-27",
    "Embalagem": "LATA 350",
    "Quantidade": 4,
    "Inicio": "11:31:54",
    "Fim": "11:49:04",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-27",
    "Embalagem": "PET 1L",
    "Quantidade": 4,
    "Inicio": "10:36:44",
    "Fim": "10:49:28",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-27",
    "Embalagem": "LATA 473",
    "Quantidade": 5,
    "Inicio": "15:14:53",
    "Fim": "15:32:05",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-27",
    "Embalagem": "PET 500ml",
    "Quantidade": 6,
    "Inicio": "10:55:37",
    "Fim": "11:14:11",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-27",
    "Embalagem": "PET 2L",
    "Quantidade": 2,
    "Inicio": "09:34:56",
    "Fim": "09:42:31",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-27",
    "Embalagem": "PET 2L",
    "Quantidade": 7,
    "Inicio": "09:47:28",
    "Fim": "10:14:47",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-27",
    "Embalagem": "LATA 250",
    "Quantidade": 3,
    "Inicio": "15:32:29",
    "Fim": "15:40:37",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-27",
    "Embalagem": "PET 200ml",
    "Quantidade": 2,
    "Inicio": "11:15:17",
    "Fim": "11:19:42",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-27",
    "Embalagem": "LONG NECK",
    "Quantidade": 2,
    "Inicio": "15:41:03",
    "Fim": "15:50:44",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-28",
    "Embalagem": "PET 2L",
    "Quantidade": 9,
    "Inicio": "09:32:29",
    "Fim": "10:05:53",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-28",
    "Embalagem": "PET 500ml",
    "Quantidade": 2,
    "Inicio": "14:57:08",
    "Fim": "15:03:56",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-28",
    "Embalagem": "LONG NECK",
    "Quantidade": 1,
    "Inicio": "15:16:37",
    "Fim": "15:20:33",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-28",
    "Embalagem": "LATA 269",
    "Quantidade": 1,
    "Inicio": "14:37:07",
    "Fim": "14:39:33",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-28",
    "Embalagem": "LATA 350",
    "Quantidade": 9,
    "Inicio": "15:25:00",
    "Fim": "15:51:56",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-28",
    "Embalagem": "PET 1L",
    "Quantidade": 5,
    "Inicio": "10:06:14",
    "Fim": "10:25:46",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-28",
    "Embalagem": "LATA 350",
    "Quantidade": 9,
    "Inicio": "11:23:20",
    "Fim": "11:55:39",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-28",
    "Embalagem": "LATA 473",
    "Quantidade": 2,
    "Inicio": "14:47:09",
    "Fim": "14:53:20",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-28",
    "Embalagem": "PET 1L",
    "Quantidade": 1,
    "Inicio": "15:08:01",
    "Fim": "15:11:55",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-28",
    "Embalagem": "PET 200ml",
    "Quantidade": 1,
    "Inicio": "15:04:19",
    "Fim": "15:07:26",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-28",
    "Embalagem": "LONG NECK",
    "Quantidade": 4,
    "Inicio": "10:45:50",
    "Fim": "11:04:39",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-28",
    "Embalagem": "LATA 350",
    "Quantidade": 6,
    "Inicio": "14:14:41",
    "Fim": "14:36:38",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-29",
    "Embalagem": "LATA 350",
    "Quantidade": 28,
    "Inicio": "09:25:39",
    "Fim": "11:31:07",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-29",
    "Embalagem": "LATA 473",
    "Quantidade": 8,
    "Inicio": "11:32:00",
    "Fim": "12:02:54",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-30",
    "Embalagem": "LATA 350",
    "Quantidade": 17,
    "Inicio": "14:13:59",
    "Fim": "15:20:41",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-30",
    "Embalagem": "PET 2,5L",
    "Quantidade": 1,
    "Inicio": "11:19:54",
    "Fim": "11:23:31",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-30",
    "Embalagem": "LATA 269",
    "Quantidade": 2,
    "Inicio": "15:46:40",
    "Fim": "15:51:02",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-30",
    "Embalagem": "LATA 350",
    "Quantidade": 2,
    "Inicio": "15:37:01",
    "Fim": "15:45:42",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-30",
    "Embalagem": "LATA 473",
    "Quantidade": 2,
    "Inicio": "15:28:17",
    "Fim": "15:36:14",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-30",
    "Embalagem": "PET 2L",
    "Quantidade": 7,
    "Inicio": "10:12:06",
    "Fim": "10:38:05",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-30",
    "Embalagem": "PET 200ml",
    "Quantidade": 6,
    "Inicio": "11:40:54",
    "Fim": "11:56:10",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-30",
    "Embalagem": "PET 1L",
    "Quantidade": 8,
    "Inicio": "10:47:02",
    "Fim": "11:19:28",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-07-30",
    "Embalagem": "PET 500ml",
    "Quantidade": 3,
    "Inicio": "11:28:06",
    "Fim": "11:37:54",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-08-02",
    "Embalagem": "PET 2L",
    "Quantidade": 6,
    "Inicio": "15:20:36",
    "Fim": "15:42:32",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-08-02",
    "Embalagem": "LATA 350",
    "Quantidade": 21,
    "Inicio": "10:25:00",
    "Fim": "11:31:18",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-08-02",
    "Embalagem": "LATA 473",
    "Quantidade": 4,
    "Inicio": "11:37:22",
    "Fim": "11:52:19",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-08-02",
    "Embalagem": "PET 500ml",
    "Quantidade": 4,
    "Inicio": "15:47:34",
    "Fim": "16:00:27",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-08-02",
    "Embalagem": "PET 200ml",
    "Quantidade": 1,
    "Inicio": "16:01:27",
    "Fim": "16:04:57",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-08-02",
    "Embalagem": "PET 1L",
    "Quantidade": 8,
    "Inicio": "14:11:19",
    "Fim": "14:41:45",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-08-02",
    "Embalagem": "PET 2L",
    "Quantidade": 6,
    "Inicio": "14:50:30",
    "Fim": "15:13:32",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-08-02",
    "Embalagem": "LATA 350",
    "Quantidade": 18,
    "Inicio": "08:25:01",
    "Fim": "09:43:45",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-08-03",
    "Embalagem": "PET 500ml",
    "Quantidade": 2,
    "Inicio": "11:07:06",
    "Fim": "11:13:20",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-08-03",
    "Embalagem": "LONG NECK",
    "Quantidade": 2,
    "Inicio": "10:57:45",
    "Fim": "11:06:27",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-08-03",
    "Embalagem": "LATA 350",
    "Quantidade": 17,
    "Inicio": "08:38:14",
    "Fim": "09:40:56",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-08-03",
    "Embalagem": "PET 1L",
    "Quantidade": 3,
    "Inicio": "10:07:04",
    "Fim": "10:20:14",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-08-03",
    "Embalagem": "PET 2L",
    "Quantidade": 1,
    "Inicio": "11:13:36",
    "Fim": "11:17:43",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-08-03",
    "Embalagem": "PET 2L",
    "Quantidade": 5,
    "Inicio": "10:27:29",
    "Fim": "10:48:38",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-08-03",
    "Embalagem": "PET 2,5L",
    "Quantidade": 1,
    "Inicio": "11:17:58",
    "Fim": "11:21:55",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-08-05",
    "Embalagem": "PET 2L",
    "Quantidade": 2,
    "Inicio": "10:10:23",
    "Fim": "10:16:46",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-08-05",
    "Embalagem": "LATA 350",
    "Quantidade": 1,
    "Inicio": "10:19:08",
    "Fim": "10:21:43",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-08-05",
    "Embalagem": "LATA 350",
    "Quantidade": 13,
    "Inicio": "08:37:06",
    "Fim": "09:17:19",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-08-05",
    "Embalagem": "PET 1L",
    "Quantidade": 7,
    "Inicio": "09:43:34",
    "Fim": "10:08:12",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-08-05",
    "Embalagem": "PET 200ml",
    "Quantidade": 2,
    "Inicio": "10:26:04",
    "Fim": "10:30:32",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-08-05",
    "Embalagem": "PET 1L",
    "Quantidade": 1,
    "Inicio": "10:22:13",
    "Fim": "10:25:47",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "OZENILDO (G1137)"
  },
  {
    "Data": "2026-08-06",
    "Embalagem": "PET 2,5L",
    "Quantidade": 2,
    "Inicio": "14:54:18",
    "Fim": "15:02:22",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-08-06",
    "Embalagem": "LATA 350",
    "Quantidade": 1,
    "Inicio": "10:37:26",
    "Fim": "10:40:08",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-08-06",
    "Embalagem": "LATA 350",
    "Quantidade": 20,
    "Inicio": "08:31:06",
    "Fim": "09:53:50",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-08-06",
    "Embalagem": "LONG NECK",
    "Quantidade": 3,
    "Inicio": "11:42:24",
    "Fim": "11:56:50",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-08-06",
    "Embalagem": "PET 2L",
    "Quantidade": 3,
    "Inicio": "14:41:18",
    "Fim": "14:53:16",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-08-06",
    "Embalagem": "PET 200ml",
    "Quantidade": 3,
    "Inicio": "11:10:10",
    "Fim": "11:19:09",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-08-06",
    "Embalagem": "LATA 269",
    "Quantidade": 3,
    "Inicio": "10:58:25",
    "Fim": "11:09:10",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-08-06",
    "Embalagem": "PET 1L",
    "Quantidade": 6,
    "Inicio": "14:10:50",
    "Fim": "14:34:32",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-08-06",
    "Embalagem": "LATA 473",
    "Quantidade": 4,
    "Inicio": "10:18:15",
    "Fim": "10:36:41",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-08-06",
    "Embalagem": "PET 500ml",
    "Quantidade": 4,
    "Inicio": "15:14:12",
    "Fim": "15:26:30",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-08-09",
    "Embalagem": "LATA 350",
    "Quantidade": 4,
    "Inicio": "09:50:49",
    "Fim": "10:07:57",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-08-09",
    "Embalagem": "LATA 350",
    "Quantidade": 1,
    "Inicio": "15:03:18",
    "Fim": "15:06:42",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-08-09",
    "Embalagem": "PET 1L",
    "Quantidade": 4,
    "Inicio": "08:46:37",
    "Fim": "09:02:47",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-08-09",
    "Embalagem": "LATA 350",
    "Quantidade": 5,
    "Inicio": "14:09:52",
    "Fim": "14:29:55",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-08-09",
    "Embalagem": "PET 2L",
    "Quantidade": 11,
    "Inicio": "07:51:14",
    "Fim": "08:31:00",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-08-09",
    "Embalagem": "LONG NECK",
    "Quantidade": 2,
    "Inicio": "14:52:00",
    "Fim": "15:02:52",
    "Meta": "00:06:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-08-09",
    "Embalagem": "LATA 250",
    "Quantidade": 3,
    "Inicio": "14:38:29",
    "Fim": "14:46:14",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-08-09",
    "Embalagem": "LATA 473",
    "Quantidade": 2,
    "Inicio": "14:30:49",
    "Fim": "14:36:52",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-08-09",
    "Embalagem": "PET 500ml",
    "Quantidade": 2,
    "Inicio": "09:03:12",
    "Fim": "09:09:02",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-08-10",
    "Embalagem": "LATA 250",
    "Quantidade": 7,
    "Inicio": "11:06:00",
    "Fim": "11:24:20",
    "Meta": "00:04:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-08-10",
    "Embalagem": "LATA 350",
    "Quantidade": 8,
    "Inicio": "11:25:24",
    "Fim": "11:52:59",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-08-11",
    "Embalagem": "PET 1L",
    "Quantidade": 5,
    "Inicio": "09:56:11",
    "Fim": "10:12:20",
    "Meta": "00:05:30",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  },
  {
    "Data": "2026-08-11",
    "Embalagem": "PET 2L",
    "Quantidade": 9,
    "Inicio": "09:09:05",
    "Fim": "09:42:12",
    "Meta": "00:05:00",
    "Resultado": "🟢 META BATIDA",
    "Operador": "GLADSON LISBOA (G1145)"
  }
];

let cachedOfficialRepackRows: Record<string, RepackRow[]> = {};

/**
 * Converte o dataset oficial de Repack em RepackRow formatadas para a plataforma
 */
export function buildOfficialRepackRows(empresaId: string = 'demo'): RepackRow[] {
  if (cachedOfficialRepackRows[empresaId] && cachedOfficialRepackRows[empresaId].length > 0) {
    return cachedOfficialRepackRows[empresaId];
  }

  const parseSec = (hms: string) => {
    if (!hms) return 0;
    const parts = hms.split(':').map(Number);
    if (parts.length === 3) return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
    if (parts.length === 2) return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60;
    return 0;
  };

  const formatHMS = (totalSec: number) => {
    totalSec = Math.max(0, Math.floor(totalSec));
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
  };

  const rows = OFFICIAL_REPACK_DATA_JSON.map((item, idx) => {
    const dataISO = item.Data || '2026-01-01';
    const dataFormatada = new Date(dataISO + 'T00:00:00').toLocaleDateString('pt-BR');
    const ini = item.Inicio || '08:00:00';
    const fim = item.Fim || '08:30:00';
    const rawDiff = parseSec(fim) - parseSec(ini);
    const durSec = rawDiff < 0 ? rawDiff + 86400 : rawDiff;
    const duracao = durSec > 0 ? formatHMS(durSec) : '00:15:00';

    const rawRes = (item.Resultado || '').toUpperCase();
    const isDentro = rawRes.includes('BATIDA') || rawRes.includes('DENTRO') || rawRes.includes('🟢');

    return {
      _docId: `repack_official_${dataISO.replace(/-/g, '')}_${idx}`,
      id: `repack_official_${dataISO.replace(/-/g, '')}_${idx}`,
      empresaId: empresaId,
      data: dataFormatada,
      dataISO: dataISO,
      hora: ini,
      embalagem: item.Embalagem ? item.Embalagem.trim().toUpperCase() : 'LATA 350',
      quantidade: Number(item.Quantidade) || 1,
      caixas: Number(item.Quantidade) || 1,
      caixasReembaladas: Number(item.Quantidade) || 1,
      inicio: ini,
      fim: fim,
      duracao: duracao,
      meta: String(item.Meta || '00:05:00'),
      resultado: isDentro ? 'Dentro da Meta' : 'Fora da Meta',
      operador: item.Operador ? item.Operador.trim() : 'Ozenildo Silva',
      _criadoEm: `${dataISO}T${ini}.000Z`
    };
  });

  cachedOfficialRepackRows[empresaId] = rows;
  return rows;
}

let cachedOfficialRepackRetro: Record<string, RetroactiveRecord[]> = {};

/**
 * Converte o dataset oficial de Repack em RetroactiveRecord para a Base Central
 */
export function buildOfficialRepackRetroactiveRecords(empresaId: string = 'demo'): RetroactiveRecord[] {
  if (cachedOfficialRepackRetro[empresaId] && cachedOfficialRepackRetro[empresaId].length > 0) {
    return cachedOfficialRepackRetro[empresaId];
  }

  const records = OFFICIAL_REPACK_DATA_JSON.map((item, idx) => {
    const dataISO = item.Data || '2026-01-01';
    const dataFormatada = new Date(dataISO + 'T00:00:00').toLocaleDateString('pt-BR');
    const qtd = Number(item.Quantidade) || 1;
    
    return {
      id: `retro-repack-off-${dataISO.replace(/-/g, '')}-${idx}`,
      modulo: 'repack' as const,
      dataISO: dataISO,
      dataFormatada: dataFormatada,
      codigoProduto: `REPACK-${item.Embalagem?.replace(/\s+/g, '-').toUpperCase() || 'LATA-350'}`,
      descricao: `Reembalagem (Repack) ${item.Embalagem || 'Geral'} - Qtd: ${qtd} CX`,
      quantidade: qtd,
      unidade: 'CX',
      valorFinanceiro: qtd * 42.50,
      operador: item.Operador || 'OZENILDO (G1137)',
      colaboradorAjudante: item.Operador || 'OZENILDO (G1137)',
      horaInicio: item.Inicio || '08:00',
      horaFim: item.Fim || '09:30',
      duracaoMinutos: 60,
      setor: 'Bancada Repack / Armazém',
      observacoes: `Resultado: ${item.Resultado || 'Dentro da Meta'} | Meta: ${item.Meta || '00:05:00'}`,
      status: 'Concluído' as const,
      simuladoHistorico: true as const,
      criadoEm: `${dataISO}T08:00:00.000Z`
    };
  });

  cachedOfficialRepackRetro[empresaId] = records;
  return records;
}
