// src/app/api/analyze/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { homeTeam, awayTeam, league, matchDate, homeStats, awayStats, odds } = body;

    if (!homeTeam || !awayTeam || !league) {
      return NextResponse.json({ error: 'Dados incompletos da partida.' }, { status: 400 });
    }

    // -------------------------------------------------------------
    // 🧠 PASSO DE APRENDIZADO: Buscar histórico recente no Supabase
    // -------------------------------------------------------------
    const { data: pastResults } = await supabase
      .from('results')
      .select(`
        bet_won,
        learning_notes,
        matches ( home_team, away_team, league ),
        predictions ( market_suggested, ai_rationale )
      `)
      .order('updated_at', { ascending: false })
      .limit(10); // Pega as últimas 10 análises resolvidas

    // Formata o histórico em texto legível para a IA
    let memoryContext = "HISTÓRICO DE APRENDIZADO DE ANÁLISES ANTERIORES:\n";
    if (pastResults && pastResults.length > 0) {
      pastResults.forEach((item: any) => {
        const resultText = item.bet_won ? 'GREEN (Acerto)' : 'RED (Erro)';
        memoryContext += `- [${resultText}] Jogo: ${item.matches.home_team} x ${item.matches.away_team} (${item.matches.league}) | Mercado Sugerido: ${item.predictions.market_suggested} | Nota de Aprendizado: ${item.learning_notes || 'Sem observações'}\n`;
      });
    } else {
      memoryContext += "Ainda não há histórico acumulado de apostas passadas.\n";
    }

    // -------------------------------------------------------------
    // 📝 ENGENHARIA DE PROMPT COM MEMÓRIA DE APRENDIZADO
    // -------------------------------------------------------------
    const prompt = `
      Você é um analista profissional de apostas esportivas e estatísticas de futebol de elite.
      Analise a partida abaixo com base nos dados fornecidos e LEVE EM CONSIDERAÇÃO SEUS ERROS E ACERTOS PASSADOS.

      ${memoryContext}

      PARTIDA ATUAL PARA ANALISAR:
      Confronto: ${homeTeam} x ${awayTeam} (${league})
      Estatísticas do Mandante (Casa): ${homeStats}
      Estatísticas do Visitante (Fora): ${awayStats}
      Odds Atuais do Mercado: ${odds}

      DIRETRIZES DE APRENDIZADO:
      - Evite repetir padrões de análise que causaram resultados RED no histórico.
      - Se a liga/contexto for parecido com um erro recente, seja mais conservador na confiança.

      Retorne sua resposta estritamente no formato JSON puro:
      {
        "market_suggested": "Mercado recomendado",
        "suggested_odds": 1.85,
        "confidence_score": 4,
        "ai_rationale": "Explicação técnica detalhada justificando a escolha"
      }
    `;

    // Chamada fictícia do cliente da sua IA (Substitua pela chamada real do seu SDK de IA)
    // const aiResponse = await aiClient.generate({ prompt });
    // const analysis = JSON.parse(aiResponse);

    // Simulação do retorno da IA
    const analysis = {
      market_suggested: "Over 2.5 Gols",
      suggested_odds: parseFloat(odds?.over25 || 1.85),
      confidence_score: 4,
      ai_rationale: `Análise considerando estatísticas recentes do ${homeTeam} e ${awayTeam}. Levando em conta o aprendizado acumulado, evitou-se mercados com baixa liquidez.`
    };

    // Salva a Partida no Supabase
    const { data: matchData, error: matchError } = await supabase
      .from('matches')
      .insert([{ home_team: homeTeam, away_team: awayTeam, league, match_date: matchDate || new Date().toISOString() }])
      .select().single();

    if (matchError) throw matchError;

    // Salva a Previsão no Supabase
    const { data: predictionData, error: predError } = await supabase
      .from('predictions')
      .insert([{
        match_id: matchData.id,
        market_suggested: analysis.market_suggested,
        suggested_odds: analysis.suggested_odds,
        confidence_score: analysis.confidence_score,
        ai_rationale: analysis.ai_rationale
      }])
      .select().single();

    if (predError) throw predError;

    return NextResponse.json({ success: true, match: matchData, prediction: predictionData });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
