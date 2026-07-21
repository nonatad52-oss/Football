'use client';

import { useState, useEffect } from 'react';

export default function FootballAnalystDashboard() {
  const [formData, setFormData] = useState({
    homeTeam: '',
    awayTeam: '',
    league: '',
    homeStats: '',
    awayStats: '',
    odds: '1.85'
  });

  const [loading, setLoading] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<any>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setCurrentAnalysis(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setCurrentAnalysis(data);
      } else {
        alert('Erro: ' + data.error);
      }
    } catch (err) {
      alert('Falha ao gerar análise.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Cabeçalho */}
        <header className="border-b border-slate-800 pb-4">
          <h1 className="text-3xl font-bold text-emerald-400">⚽ IA Analyst - Bet Memory</h1>
          <p className="text-slate-400">Sistema de Análise Preditiva de Futebol com Aprendizado Contínuo</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Formulário de Análise */}
          <section className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
            <h2 className="text-xl font-semibold text-slate-200">Nova Análise de Partida</h2>
            <form onSubmit={handleAnalyze} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Liga / Campeonato</label>
                <input 
                  type="text" 
                  placeholder="Ex: Brasileirão Série A"
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-100"
                  value={formData.league}
                  onChange={e => setFormData({...formData, league: e.target.value})}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Time Mandante</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Flamengo"
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-100"
                    value={formData.homeTeam}
                    onChange={e => setFormData({...formData, homeTeam: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Time Visitante</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Palmeiras"
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-100"
                    value={formData.awayTeam}
                    onChange={e => setFormData({...formData, awayTeam: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Estatísticas do Mandante (Últimos jogos, média de gols)</label>
                <textarea 
                  rows={3}
                  placeholder="Ex: 4V, 1D. Média de 2.1 gols marcados em casa..."
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-100"
                  value={formData.homeStats}
                  onChange={e => setFormData({...formData, homeStats: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Estatísticas do Visitante</label>
                <textarea 
                  rows={3}
                  placeholder="Ex: Sofreu gols nos últimos 5 jogos fora..."
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-100"
                  value={formData.awayStats}
                  onChange={e => setFormData({...formData, awayStats: e.target.value})}
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition"
              >
                {loading ? 'Consultando IA & Memória...' : 'Gerar Análise'}
              </button>
            </form>
          </section>

          {/* Resultado da Análise */}
          <section className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
            <h2 className="text-xl font-semibold text-slate-200">Prognóstico da IA</h2>
            {currentAnalysis ? (
              <div className="space-y-4">
                <div className="bg-slate-950 p-4 rounded-lg border border-emerald-500/30">
                  <span className="text-xs text-emerald-400 uppercase font-bold tracking-wider">Mercado Sugerido</span>
                  <p className="text-2xl font-bold text-white mt-1">{currentAnalysis.prediction.market_suggested}</p>
                  <p className="text-sm text-slate-400 mt-1">Odd Recomendada: <strong className="text-white">{currentAnalysis.prediction.suggested_odds}</strong></p>
                  <p className="text-sm text-slate-400">Confiança: <strong className="text-emerald-400">{currentAnalysis.prediction.confidence_score}/5 ⭐</strong></p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-400 uppercase">Justificativa Técnica</h3>
                  <p className="text-slate-300 text-sm mt-1 bg-slate-950 p-3 rounded border border-slate-800 leading-relaxed">
                    {currentAnalysis.prediction.ai_rationale}
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center border border-dashed border-slate-800 rounded-lg text-slate-500">
                Preencha os dados ao lado para gerar uma análise baseada em aprendizado.
              </div>
            )}
          </section>

        </div>
      </div>
    </main>
  );
}
