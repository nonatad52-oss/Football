// Exemplo estruturado para o prompt do modelo de IA
export async function generateMatchAnalysis(matchData: {
  homeTeam: string;
  awayTeam: string;
  league: string;
  homeStats: string;
  awayStats: string;
  odds: string;
}) {
  const prompt = `
    Você é um analista profissional de apostas esportivas e estatísticas de futebol de elite.
    Analise a partida abaixo com base nos dados fornecidos e produza um prognóstico de alta qualidade.

    Partida: ${matchData.homeTeam} x ${matchData.awayTeam} (${matchData.league})
    Estatísticas do Mandante (Casa): ${matchData.homeStats}
    Estatísticas do Visitante (Fora): ${matchData.awayStats}
    Odds Atuais do Mercado: ${matchData.odds}

    Retorne sua resposta estritamente no formato JSON com as seguintes chaves:
    - "market_suggested": O melhor mercado de aposta (ex: "Over 2.5 Gols", "Ambas Marcam: Sim", "Match Odds: Mandante").
    - "suggested_odds": O valor numérico da odd sugerida.
    - "confidence_score": Um número inteiro de 1 a 5 indicando seu nível de confiança.
    - "ai_rationale": Uma explicação técnica detalhada e fundamentada justificando a escolha, mencionando tendências estatísticas.
  `;

  // Aqui você chamará a API da sua IA (mesma biblioteca/SDK usada no projeto de ativos)
  // const response = await aiClient.generate({ prompt });
  // return JSON.parse(response);
}
