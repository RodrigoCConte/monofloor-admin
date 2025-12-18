import React, { useState, useMemo } from 'react';

// Dados de referência originais (apenas piso)
const dadosReferencia = [
  { area: 50, prestadores: 2, dias: 5 },
  { area: 80, prestadores: 2, dias: 5 },
  { area: 150, prestadores: 3, dias: 8 },
  { area: 200, prestadores: 3, dias: 8 },
  { area: 250, prestadores: 4, dias: 10 },
  { area: 300, prestadores: 4, dias: 12 },
  { area: 350, prestadores: 4, dias: 12 },
  { area: 400, prestadores: 5, dias: 11 },
  { area: 500, prestadores: 5, dias: 12 },
  { area: 600, prestadores: 6, dias: 12 },
  { area: 700, prestadores: 6, dias: 16 },
  { area: 800, prestadores: 7, dias: 17 },
  { area: 900, prestadores: 8, dias: 18 },
  { area: 1000, prestadores: 9, dias: 20 },
  { area: 1200, prestadores: 12, dias: 20 },
];

// Configuração por tipo de projeto
const TIPOS = {
  piso: {
    nome: 'Apenas Piso',
    fatorProdutividade: 1.0,
    diasMinimoBase: 5,
  },
  misto: {
    nome: 'Piso + Paredes',
    fatorProdutividade: 0.7, // 30% menos produtivo
    diasMinimoBase: 8,
  },
};

// Calcular dias mínimos baseado na área e tipo
function calcularDiasMinimos(area, tipo) {
  const config = TIPOS[tipo];
  const diasBase = config.diasMinimoBase;
  
  if (area <= 100) return diasBase;
  if (area <= 300) return diasBase + 2;
  if (area <= 500) return diasBase + 4;
  if (area <= 800) return diasBase + 6;
  if (area <= 1000) return diasBase + 8;
  return diasBase + 10;
}

// Função de interpolação com ajuste para tipo
function calcularComInterpolacao(area, tipo) {
  const config = TIPOS[tipo];
  const sorted = [...dadosReferencia].sort((a, b) => a.area - b.area);
  const diasMinimos = calcularDiasMinimos(area, tipo);
  
  let prestadores, diasBase;
  
  const exato = sorted.find(d => d.area === area);
  if (exato) {
    prestadores = exato.prestadores;
    diasBase = exato.dias;
  } else if (area < sorted[0].area) {
    prestadores = 2;
    diasBase = Math.max(5, Math.ceil(area / 12));
  } else if (area > sorted[sorted.length - 1].area) {
    prestadores = Math.ceil(area / 100);
    diasBase = Math.ceil(area / (prestadores * 6));
  } else {
    let inferior = sorted[0];
    let superior = sorted[sorted.length - 1];
    
    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i].area <= area && sorted[i + 1].area >= area) {
        inferior = sorted[i];
        superior = sorted[i + 1];
        break;
      }
    }
    
    const proporcao = (area - inferior.area) / (superior.area - inferior.area);
    prestadores = Math.round(
      inferior.prestadores + proporcao * (superior.prestadores - inferior.prestadores)
    );
    diasBase = Math.round(
      inferior.dias + proporcao * (superior.dias - inferior.dias)
    );
  }
  
  let diasAjustados = Math.ceil(diasBase / config.fatorProdutividade);
  const diasFinal = Math.max(diasAjustados, diasMinimos);
  
  return {
    prestadores: Math.max(2, prestadores),
    dias: diasFinal,
    diasMinimos,
    diasBase,
    limitadoPorEtapas: diasFinal === diasMinimos && diasAjustados < diasMinimos,
  };
}

// Simular adição de prestadores
function simularComMaisPrestadores(area, tipo, prestadoresExtra) {
  const base = calcularComInterpolacao(area, tipo);
  const config = TIPOS[tipo];
  const diasMinimos = calcularDiasMinimos(area, tipo);
  
  const novosPrestadores = base.prestadores + prestadoresExtra;
  const produtividadeBase = 6.5 * config.fatorProdutividade;
  
  let diasComMaisGente = Math.ceil(area / (produtividadeBase * novosPrestadores));
  diasComMaisGente = Math.max(diasComMaisGente, diasMinimos);
  
  return {
    prestadores: novosPrestadores,
    dias: diasComMaisGente,
    diasMinimos,
    limitadoPorEtapas: diasComMaisGente === diasMinimos,
  };
}

export default function CalculadoraPrazos() {
  const [area, setArea] = useState(200);
  const [tipo, setTipo] = useState('piso');
  const [prestadoresExtra, setPrestadoresExtra] = useState(0);
  
  const resultado = useMemo(() => {
    const areaNum = parseFloat(area) || 0;
    
    if (prestadoresExtra > 0) {
      return simularComMaisPrestadores(areaNum, tipo, prestadoresExtra);
    }
    
    return calcularComInterpolacao(areaNum, tipo);
  }, [area, tipo, prestadoresExtra]);
  
  const config = TIPOS[tipo];
  const homensDia = resultado.prestadores * resultado.dias;
  const produtividade = area > 0 ? (parseFloat(area) / homensDia).toFixed(2) : 0;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            🏗️ Calculadora de Prazos
          </h1>
          <p className="text-slate-400">Instalação de Pisos e Revestimentos</p>
        </div>
        
        {/* Tipo de Projeto */}
        <div className="bg-slate-800 rounded-2xl p-4 mb-4 shadow-xl border border-slate-700">
          <label className="block text-slate-300 text-sm font-medium mb-3">
            Tipo de Projeto
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => { setTipo('piso'); setPrestadoresExtra(0); }}
              className={`py-4 px-4 rounded-xl text-sm font-medium transition-all flex flex-col items-center gap-2 ${
                tipo === 'piso'
                  ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <span className="text-2xl">🪨</span>
              <span>Apenas Piso</span>
              <span className="text-xs opacity-75">Produtividade 100%</span>
            </button>
            <button
              onClick={() => { setTipo('misto'); setPrestadoresExtra(0); }}
              className={`py-4 px-4 rounded-xl text-sm font-medium transition-all flex flex-col items-center gap-2 ${
                tipo === 'misto'
                  ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <span className="text-2xl">🧱</span>
              <span>Piso + Paredes</span>
              <span className="text-xs opacity-75">Produtividade 70%</span>
            </button>
          </div>
        </div>
        
        {/* Input Área */}
        <div className="bg-slate-800 rounded-2xl p-4 mb-4 shadow-xl border border-slate-700">
          <label className="block text-slate-300 text-sm font-medium mb-2">
            Área Total (m²)
          </label>
          <input
            type="number"
            value={area}
            onChange={(e) => { setArea(e.target.value); setPrestadoresExtra(0); }}
            className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Digite a área..."
            min="1"
          />
        </div>
        
        {/* Ajuste de Prestadores */}
        <div className="bg-slate-800 rounded-2xl p-4 mb-4 shadow-xl border border-slate-700">
          <label className="block text-slate-300 text-sm font-medium mb-3">
            Simular com mais prestadores: <span className="text-blue-400">+{prestadoresExtra}</span>
          </label>
          <input
            type="range"
            min="0"
            max="10"
            value={prestadoresExtra}
            onChange={(e) => setPrestadoresExtra(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>Padrão</span>
            <span>+10 pessoas</span>
          </div>
        </div>
        
        {/* Results Cards */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className={`rounded-2xl p-5 shadow-xl ${
            tipo === 'piso' 
              ? 'bg-gradient-to-br from-blue-600 to-blue-700' 
              : 'bg-gradient-to-br from-purple-600 to-purple-700'
          }`}>
            <div className="text-white/80 text-sm font-medium mb-1">Prestadores</div>
            <div className="text-white text-4xl font-bold">{resultado.prestadores}</div>
            <div className="text-white/60 text-xs mt-1">pessoas</div>
          </div>
          
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl p-5 shadow-xl">
            <div className="text-emerald-200 text-sm font-medium mb-1">Prazo</div>
            <div className="text-white text-4xl font-bold">{resultado.dias}</div>
            <div className="text-emerald-200 text-xs mt-1">dias úteis</div>
          </div>
        </div>
        
        {/* Aviso de Etapas */}
        {resultado.limitadoPorEtapas && (
          <div className="bg-amber-900/50 border border-amber-600 rounded-xl p-4 mb-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <div className="text-amber-200 font-medium">Limitado pelas etapas</div>
                <div className="text-amber-300/80 text-sm mt-1">
                  Mesmo com mais prestadores, o prazo mínimo é de <strong>{resultado.diasMinimos} dias</strong> devido às etapas sequenciais (cura, secagem, etc).
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Stats */}
        <div className="bg-slate-800 rounded-2xl p-4 mb-4 shadow-xl border border-slate-700">
          <h3 className="text-white font-semibold mb-4">📈 Métricas</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-400">{homensDia}</div>
              <div className="text-slate-400 text-xs">Homens-dia</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{produtividade}</div>
              <div className="text-slate-400 text-xs">m²/H-D</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">
                {(config.fatorProdutividade * 100).toFixed(0)}%
              </div>
              <div className="text-slate-400 text-xs">Produtividade</div>
            </div>
          </div>
        </div>
        
        {/* Comparativo Piso vs Misto */}
        {tipo === 'misto' && (
          <div className="bg-slate-800 rounded-2xl p-4 mb-4 shadow-xl border border-slate-700">
            <h3 className="text-white font-semibold mb-3">📊 Comparativo</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-900/30 rounded-xl p-3 border border-blue-800">
                <div className="text-blue-300 text-xs mb-1">Se fosse só Piso</div>
                <div className="text-white font-bold">
                  {calcularComInterpolacao(parseFloat(area) || 0, 'piso').dias} dias
                </div>
              </div>
              <div className="bg-purple-900/30 rounded-xl p-3 border border-purple-800">
                <div className="text-purple-300 text-xs mb-1">Piso + Paredes</div>
                <div className="text-white font-bold">
                  {resultado.dias} dias
                </div>
                <div className="text-red-400 text-xs mt-1">
                  +{resultado.dias - calcularComInterpolacao(parseFloat(area) || 0, 'piso').dias} dias
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Reference Table */}
        <div className="bg-slate-800 rounded-2xl p-4 shadow-xl border border-slate-700">
          <h3 className="text-white font-semibold mb-4">📋 Tabela de Referência</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400 border-b border-slate-700">
                  <th className="py-2 text-left">Área</th>
                  <th className="py-2 text-center">Prest.</th>
                  <th className="py-2 text-center">Dias</th>
                  <th className="py-2 text-right">H-D</th>
                </tr>
              </thead>
              <tbody>
                {dadosReferencia.map((d, i) => (
                  <tr 
                    key={i} 
                    className={`border-b border-slate-700/50 ${
                      parseFloat(area) === d.area 
                        ? 'bg-blue-600/20 text-blue-300' 
                        : 'text-slate-300'
                    }`}
                  >
                    <td className="py-2">{d.area} m²</td>
                    <td className="py-2 text-center">{d.prestadores}</td>
                    <td className="py-2 text-center">{d.dias}</td>
                    <td className="py-2 text-right text-slate-500">
                      {d.prestadores * d.dias}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Footer */}
        <div className="mt-6 text-center text-slate-500 text-xs space-y-1">
          <div>Piso: ~6.5 m²/homem-dia | Misto: ~4.5 m²/homem-dia</div>
          <div>⚠️ Dias mínimos não podem ser reduzidos com mais pessoas</div>
        </div>
      </div>
    </div>
  );
}
