'use client';

import { useState } from 'react';

interface AnalysisResult {
  matchId: string;
  prediction: string;
  oddSuggested?: string;
  confidence: number;
  justification: string;
}

export default function Home() {
  // Estados do Formulário
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [league, setLeague] = useState('');
  const [statsNotes, setStatsNotes] = useState('');

  // Estados de Controle e Resultado
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Submeter dados para análise da IA
  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    if (!homeTeam || !awayTeam) return;

    setLoading(true);
    setAnalysis(null);
    setStatusMessage(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          homeTeam,
          awayTeam,
          league,
          statsNotes,
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Erro ao analisar partida.');

      setAnalysis(data);
    } catch (err: any) {
      setStatusMessage(`❌ Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  // Registrar se deu Green ou Red
  async function handleFeedback(outcome: 'GREEN' | 'RED') {
    if (!analysis?.matchId) return;

    try {
      const response = await fetch('/api/result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: analysis.matchId,
          outcome,
        }),
      });

      if (!response.ok) throw new Error('Erro ao salvar resultado.');

      setStatusMessage(
        outcome === 'GREEN' 
          ? '✅ Resultado salvo como GREEN! Aprendizado registrado.' 
          : '🔴 Resultado salvo como RED! A IA vai usar essa falha para ajustar análises futuras.'
      );
      setAnalysis(null); // Limpa para a próxima análise
    } catch (err: any) {
      setStatusMessage(`❌ Erro: ${err.message}`);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <header className="mb-8 text-center md:text-left">
        <h1 className="text-3xl font-extrabold text-emerald-400">
          ⚽ PredictAI Football
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Análise preditiva automatizada com aprendizado contínuo.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8">
        {/* Formulário de Análise */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <h2 className="text-xl font-bold mb-4 text-slate-200">
            Nova Análise de Partida
          </h2>

          <form onSubmit={handleAnalyze} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Time Mandante *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Flamengo"
                  value={homeTeam}
                  onChange={(e) => setHomeTeam(e.target.value)}
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Time Visitante *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Palmeiras"
                  value={awayTeam}
                  onChange={(e) => setAwayTeam(e.target.value)}
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Campeonato / Liga
              </label>
              <input
                type="text"
                placeholder="Ex: Brasileirão Série A"
                value={league}
                onChange={(e) => setLeague(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Estatísticas & Notas (Últimos jogos, desfalques, etc.)
              </label>
              <textarea
                rows={4}
                placeholder="Ex: Mandante vem de 3 vitórias seguidas. Visitante sem o atacante principal..."
                value={statsNotes}
                onChange={(e) => setStatsNotes(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition-colors duration-200 disabled:opacity-50"
            >
              {loading ? '🤖 Analisando com Groq IA...' : 'Gerar Prognóstico'}
            </button>
          </form>
        </section>

        {/* Mensagens de Feedback */}
        {statusMessage && (
          <div className="p-4 rounded-lg bg-slate-800 border border-slate-700 text-sm font-medium">
            {statusMessage}
          </div>
        )}

        {/* Card de Análise Gerada */}
        {analysis && (
          <section className="bg-slate-900 border-2 border-emerald-500/40 rounded-xl p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Prognóstico Sugerido
                </span>
                <h3 className="text-2xl font-black text-white mt-1">
                  {analysis.prediction}
                </h3>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400">Confiança</span>
                <div className="text-xl font-bold text-emerald-400">
                  {analysis.confidence}%
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">
                Justificativa da IA
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-lg border border-slate-800">
                {analysis.justification}
              </p>
            </div>

            {/* Ações de Feedback (Green / Red) */}
            <div className="pt-4 border-t border-slate-800">
              <p className="text-xs text-slate-400 mb-3 text-center">
                O jogo acabou? Qual foi o resultado real desta entrada?
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleFeedback('GREEN')}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-lg transition"
                >
                  🟢 GREEN (Acertou)
                </button>
                <button
                  onClick={() => handleFeedback('RED')}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-bold py-2.5 rounded-lg transition"
                >
                  🔴 RED (Errou)
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
