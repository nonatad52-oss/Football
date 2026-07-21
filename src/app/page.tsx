'use client';
import { useState } from 'react';

export default function Home() {
  const [mandante, setMandante] = useState('');
  const [visitante, setVisitante] = useState('');
  const [campeonato, setCampeonato] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState('');

  const gerarPrognostico = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResultado('');
    
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mandante, visitante, campeonato })
      });
      
      const data = await response.json();
      
      if (data.error) {
        setResultado('Erro: ' + data.error);
      } else {
        setResultado(data.analise);
      }
    } catch (error) {
      setResultado('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0B1120] text-white p-4 md:p-8 font-sans">
      <div className="max-w-xl mx-auto mt-8">
        
        {/* Cabeçalho */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-2 mb-2">
            ⚽ <span className="text-[#00D084]">PredictAI Football</span>
          </h1>
          <p className="text-gray-400 text-sm">
            Análise preditiva automatizada com IA em tempo real.
          </p>
        </div>

        {/* Formulário */}
        <div className="bg-[#111827] border border-gray-800 rounded-xl p-6 shadow-xl">
          <h2 className="text-xl font-semibold mb-6 border-b border-gray-700 pb-2">Nova Análise de Partida</h2>
          
          <form onSubmit={gerarPrognostico} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Time Mandante *</label>
              <input 
                required 
                type="text" 
                value={mandante} 
                onChange={e => setMandante(e.target.value)} 
                className="w-full bg-[#1F2937] border border-gray-600 focus:border-[#00D084] focus:ring-1 focus:ring-[#00D084] p-3 rounded-lg outline-none transition-all" 
                placeholder="Ex: Flamengo" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Time Visitante *</label>
              <input 
                required 
                type="text" 
                value={visitante} 
                onChange={e => setVisitante(e.target.value)} 
                className="w-full bg-[#1F2937] border border-gray-600 focus:border-[#00D084] focus:ring-1 focus:ring-[#00D084] p-3 rounded-lg outline-none transition-all" 
                placeholder="Ex: Palmeiras" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Campeonato / Liga (Opcional)</label>
              <input 
                type="text" 
                value={campeonato} 
                onChange={e => setCampeonato(e.target.value)} 
                className="w-full bg-[#1F2937] border border-gray-600 focus:border-[#00D084] focus:ring-1 focus:ring-[#00D084] p-3 rounded-lg outline-none transition-all" 
                placeholder="Ex: Brasileirão Série A" 
              />
            </div>

            <button 
              disabled={loading} 
              type="submit" 
              className={`w-full mt-4 p-4 rounded-lg font-bold text-white transition-all ${
                loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-[#00D084] hover:bg-[#00B370] active:scale-95'
              }`}
            >
              {loading ? 'A IA está buscando dados e analisando...' : 'Gerar Prognóstico'}
            </button>
          </form>
        </div>

        {/* Exibição do Resultado */}
        {resultado && (
          <div className="mt-8 bg-[#111827] border border-[#00D084] rounded-xl p-6 shadow-xl whitespace-pre-wrap">
            <h3 className="text-[#00D084] font-bold text-lg mb-4">🏆 Prognóstico da IA:</h3>
            <div className="text-gray-200 leading-relaxed text-sm md:text-base">
              {resultado}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
