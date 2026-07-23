'use client';
import { useState, useEffect } from 'react';

// Ligas disponíveis na API gratuita
const LIGAS = [
  { id: 'bra.1', nome: 'Brasileirão Série A' },
  { id: 'bra.2', nome: 'Brasileirão Série B' },
  { id: 'conmebol.libertadores', nome: 'Copa Libertadores' },
  { id: 'conmebol.sudamericana', nome: 'Copa Sul-Americana' },
  { id: 'eng.1', nome: 'Premier League (Inglaterra)' },
  { id: 'esp.1', nome: 'La Liga (Espanha)' },
  { id: 'uefa.champions', nome: 'Champions League' }
];

export default function Home() {
  // Estados para o fluxo Automático
  const [ligaSelecionada, setLigaSelecionada] = useState(LIGAS[0].id);
  const [nomeCampeonato, setNomeCampeonato] = useState(LIGAS[0].nome);
  const [jogos, setJogos] = useState<any[]>([]);
  const [jogoSelecionado, setJogoSelecionado] = useState<any>(null);
  const [loadingJogos, setLoadingJogos] = useState(false);

  // Estados para Análise da IA
  const [loadingIA, setLoadingIA] = useState(false);
  const [resultado, setResultado] = useState('');
  const [arbitro, setArbitro] = useState('');

  // Busca os jogos sempre que o campeonato mudar
  useEffect(() => {
    buscarJogos(ligaSelecionada);
  }, [ligaSelecionada]);

  const buscarJogos = async (leagueId: string) => {
    setLoadingJogos(true);
    setJogoSelecionado(null);
    setResultado('');
    try {
      const res = await fetch(`/api/matches?league=${leagueId}`);
      const data = await res.json();
      if (data.matches) setJogos(data.matches);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingJogos(false);
    }
  };

  const selecionarLiga = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    const liga = LIGAS.find(l => l.id === id);
    setLigaSelecionada(id);
    setNomeCampeonato(liga?.nome || '');
  };

  const gerarPrognostico = async () => {
    if (!jogoSelecionado) return;
    setLoadingIA(true);
    setResultado('');
    
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          mandante: jogoSelecionado.home, 
          visitante: jogoSelecionado.away, 
          campeonato: nomeCampeonato,
          arbitro 
        })
      });
      
      const data = await response.json();
      setResultado(data.error ? 'Erro: ' + data.error : data.analise);
    } catch (error) {
      setResultado('Erro de conexão com o servidor.');
    } finally {
      setLoadingIA(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0B1120] text-white p-4 md:p-8 font-sans pb-20">
      <div className="max-w-2xl mx-auto mt-4 md:mt-8">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-2 mb-2">
            ⚽ <span className="text-[#00D084]">PredictAI Pro</span>
          </h1>
          <p className="text-gray-400 text-sm">
            Painel Preditivo Automatizado
          </p>
        </div>

        {/* 1. SELETOR DE LIGA */}
        <div className="bg-[#111827] border border-gray-800 rounded-xl p-5 shadow-xl mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">1. Selecione o Campeonato</label>
          <select 
            value={ligaSelecionada} 
            onChange={selecionarLiga}
            className="w-full bg-[#1F2937] border border-gray-600 focus:border-[#00D084] focus:ring-1 focus:ring-[#00D084] p-3 rounded-lg outline-none transition-all text-white"
          >
            {LIGAS.map(liga => (
              <option key={liga.id} value={liga.id}>{liga.nome}</option>
            ))}
          </select>
        </div>

        {/* 2. LISTA DE JOGOS */}
        <div className="bg-[#111827] border border-gray-800 rounded-xl p-5 shadow-xl mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-3">2. Selecione a Partida</label>
          
          {loadingJogos ? (
            <div className="text-center text-gray-400 py-4">Buscando agenda de jogos...</div>
          ) : (
            <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
              {jogos.length === 0 && <div className="text-gray-500 text-sm">Nenhum jogo encontrado para esta rodada.</div>}
              
              {jogos.map(jogo => (
                <button
                  key={jogo.id}
                  onClick={() => { setJogoSelecionado(jogo); setResultado(''); }}
                  className={`w-full text-left p-4 rounded-lg border transition-all flex justify-between items-center ${
                    jogoSelecionado?.id === jogo.id 
                      ? 'bg-[#00D084]/10 border-[#00D084]' 
                      : 'bg-[#1F2937] border-gray-700 hover:border-gray-500'
                  }`}
                >
                  <div className="font-semibold text-sm md:text-base">
                    {jogo.home} <span className="text-gray-500 mx-2">x</span> {jogo.away}
                  </div>
                  <div className="text-xs text-gray-400 bg-black/30 px-2 py-1 rounded">
                    {jogo.date}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 3. AÇÃO DE ANÁLISE */}
        {jogoSelecionado && (
          <div className="bg-[#111827] border border-[#00D084]/30 rounded-xl p-5 shadow-xl">
            <h3 className="text-lg font-bold mb-4 text-[#00D084]">
              Analisar: {jogoSelecionado.home} x {jogoSelecionado.away}
            </h3>
            
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-300 mb-1">Nome do Árbitro (Opcional, para métrica de cartões)</label>
              <input 
                type="text" 
                value={arbitro} 
                onChange={e => setArbitro(e.target.value)} 
                className="w-full bg-[#1F2937] border border-gray-600 focus:border-[#00D084] focus:ring-1 focus:ring-[#00D084] p-3 rounded-lg outline-none transition-all text-sm" 
                placeholder="Ex: Anderson Daronco" 
              />
            </div>

            <button 
              onClick={gerarPrognostico}
              disabled={loadingIA} 
              className={`w-full p-4 rounded-lg font-bold text-white transition-all ${
                loadingIA ? 'bg-gray-600 cursor-not-allowed' : 'bg-[#00D084] hover:bg-[#00B370] active:scale-95'
              }`}
            >
              {loadingIA ? 'Processando dados na IA...' : 'GERAR PAINEL PREDITIVO AGORA'}
            </button>
          </div>
        )}

        {/* 4. RESULTADO DA IA */}
        {resultado && (
          <div className="mt-8 bg-[#111827] border border-[#00D084] rounded-xl p-6 shadow-2xl whitespace-pre-wrap">
            <h3 className="text-[#00D084] font-bold text-lg mb-4 flex items-center gap-2">
              📊 Probabilidades Calculadas
            </h3>
            <div className="text-gray-200 leading-relaxed text-sm md:text-base font-mono">
              {resultado}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
