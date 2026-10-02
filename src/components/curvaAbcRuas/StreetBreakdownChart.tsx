import React from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid,
  Cell
} from 'recharts';
import { BarChart2, Info, MousePointerClick } from 'lucide-react';
import { DesvioAderenciaRow } from '../CurvaAbcAderenciaRuasTab';

export interface StreetQuebraData {
  rua: string;
  bloco: string;
  palletsOk: number;
  palletsQuebra: number;
  totalPallets: number;
  pctQuebra: number;
  pctAderencia: number;
  lotesTotal: number;
  lotesQuebra: number;
  itensQuebrados: DesvioAderenciaRow[];
}

interface StreetBreakdownChartProps {
  data: StreetQuebraData[];
  onSelectStreet: (rua: string) => void;
  selectedRua?: string | null;
}

export const StreetBreakdownChart: React.FC<StreetBreakdownChartProps> = ({
  data,
  onSelectStreet,
  selectedRua
}) => {
  return (
    <div className="bg-white dark:bg-[#11192e] p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-blue-500" />
            Gráfico de Quebra e Aderência por Rua (A1 a A8, B1 a B4, C1 a C4)
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Exibe o volume de <strong>Pallets Fechados (PL)</strong> Conformes (OK) vs Quebrados (NOK) e o % de Quebra por rua.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-xl border border-blue-500/20 text-[11px] font-bold">
          <MousePointerClick className="w-3.5 h-3.5" />
          <span>Clique em uma barra para detalhar os itens desviados</span>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 15, right: 15, left: -15, bottom: 5 }}
            onClick={(state: any) => {
              if (state && state.activePayload && state.activePayload.length > 0) {
                const clickedRua = state.activePayload[0].payload.rua;
                if (clickedRua) {
                  onSelectStreet(clickedRua);
                }
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
            <XAxis 
              dataKey="rua" 
              tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 'bold' }} 
            />
            <YAxis 
              tick={{ fontSize: 10, fill: '#94a3b8' }} 
              label={{ value: 'Pallets (PL)', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#64748b' }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload as StreetQuebraData;
                  return (
                    <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-1.5 min-w-[200px]">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                        <span className="font-black text-white text-sm">Rua {d.rua} (Bloco {d.bloco})</span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                          d.pctQuebra === 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                        }`}>
                          {d.pctQuebra.toFixed(1)}% Quebra
                        </span>
                      </div>
                      <div className="text-emerald-400 font-bold flex justify-between">
                        <span>✓ Conformes (OK):</span>
                        <span>{d.palletsOk} PL</span>
                      </div>
                      <div className="text-rose-400 font-bold flex justify-between">
                        <span>✗ Quebrados (NOK):</span>
                        <span>{d.palletsQuebra} PL</span>
                      </div>
                      <div className="text-slate-300 font-medium flex justify-between pt-1 border-t border-slate-800">
                        <span>Total na Rua:</span>
                        <span>{d.totalPallets} PL ({d.lotesTotal} lotes)</span>
                      </div>
                      <div className="text-[10px] text-blue-400 font-bold text-center pt-1 mt-1 bg-blue-500/10 rounded-lg py-1">
                        👉 Clique para ver a lista de SKUs errados
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
              formatter={(value) => (
                <span className="font-bold text-slate-700 dark:text-slate-300">{value}</span>
              )}
            />
            <Bar 
              dataKey="palletsOk" 
              name="Pallets Conformes (OK)" 
              stackId="a" 
              fill="#10b981" 
              radius={[0, 0, 0, 0]}
              cursor="pointer"
            />
            <Bar 
              dataKey="palletsQuebra" 
              name="Pallets Quebrados / Desvios (NOK)" 
              stackId="a" 
              fill="#f43f5e" 
              radius={[4, 4, 0, 0]}
              cursor="pointer"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-quebra-${index}`} 
                  fill={entry.rua === selectedRua ? '#ff0055' : entry.pctQuebra > 25 ? '#ef4444' : entry.pctQuebra > 0 ? '#f43f5e' : '#10b981'} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* MINI CARDS DE QUEBRA RÁPIDA POR RUA */}
      <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-12 gap-1.5 pt-2">
        {data.map(item => {
          const isSelected = selectedRua === item.rua;
          const hasQuebra = item.palletsQuebra > 0;
          return (
            <button
              key={item.rua}
              onClick={() => onSelectStreet(item.rua)}
              className={`p-2 rounded-xl text-center border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-400 shadow-md ring-2 ring-blue-400'
                  : hasQuebra
                  ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/30'
                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              }`}
            >
              <div className="text-xs font-black">{item.rua}</div>
              <div className="text-[10px] font-bold mt-0.5">
                {item.palletsQuebra > 0 ? (
                  <span className="text-rose-400 font-mono">-{item.palletsQuebra} PL</span>
                ) : (
                  <span className="text-emerald-400">100% OK</span>
                )}
              </div>
              <div className="text-[9px] text-slate-400 mt-0.5">
                {item.pctQuebra.toFixed(0)}% qb
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
