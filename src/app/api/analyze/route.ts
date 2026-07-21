import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
// Importe aqui o cliente da sua IA (o mesmo que usou no projeto de ativos)
// import { aiClient } from '@/lib/ai-provider'; 

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { homeTeam, awayTeam, league, matchDate, homeStats, awayStats, odds } = body;

    // 1. Validação básica dos dados de entrada
    if (!homeTeam || !awayTeam || !league) {
      return NextResponse.json(
        { error: 'Dados incompletos da partida.' },
        { status: 400 }
      );
    }

    // 2. Montando o Prompt para a IA
    const prompt = `
      Você é um analista profissional de apostas esportivas e estatísticas de futebol de elite.
      Analise a partida abaixo com base nos dados fornecidos e produza um prognóstico de alta qualidade.

      Partida: ${homeTeam} x ${awayTeam} (${league})
      Estatísticas do Mandante (Casa): ${homeStats}
      Estatísticas do Visitante (Fora): ${awayStats}
      Odds Atuais do Mercado: ${odds}

      Retorne sua resposta estritamente no formato JSON puro, sem marcações markdown extras, com as seguintes chaves:
      - "market_suggested": O melhor mercado de aposta (ex: "Over 2.5 Gols", "Ambas Marcam: Sim", "Match Odds: Mandante").
      - "suggested_odds": O valor numérico da odd sugerida (ex: 1.85).
      - "confidence_score": Um número inteiro de 1 a 5 indicando seu nível de confiança.
      - "ai_rationale": Uma explicação técnica detalhada e fundamentada justificando a escolha, mencionando tendências estatísticas.
    `;

    // 3. Chamando a IA (Substitua pela chamada real do seu SDK de IA)
    /* 
    const aiResponse = await aiClient.models.generateContent({
      model: 'seu-modelo-de-ia',
      contents: prompt,
    });
    const analysis = JSON.parse(aiResponse.text());
    */

    // Simulação do retorno da IA para fins de exemplo estrutural:
    const analysis = {
      market_suggested: "Over 2.5 Gols",
      suggested_odds: 1.90,
      confidence_score: 4,
      ai_rationale: "Ambas as equipes possuem médias superiores a 1.5 gols marcados por partida nos últimos 5 jogos, e a defesa visitante cedeu espaços significativos pelo lado direito recentemente."
    };

    // 4. Salvando a Partida no Supabase (Tabela 'matches')
    const { data: matchData, error: matchError } = await supabase
      .from('matches')
      .insert([
        {
          home_team: homeTeam,
          away_team: awayTeam,
          league: league,
          match_date: matchDate || new Date().toISOString(),
          status: 'pending'
        }
      ])
      .select()
      .single();

    if (matchError) throw matchError;

    // 5. Salvando a Previsão da IA no Supabase (Tabela 'predictions')
    const { data: predictionData, error: predError } = await supabase
      .from('predictions')
      .insert([
        {
          match_id: matchData.id,
          market_suggested: analysis.market_suggested,
          suggested_odds: analysis.suggested_odds,
          confidence_score: analysis.confidence_score,
          ai_rationale: analysis.ai_rationale
        }
      ])
      .select()
      .single();

    if (predError) throw predError;

    // 6. Retornando o sucesso para o front-end
    return NextResponse.json({
      success: true,
      match: matchData,
      prediction: predictionData
    });

  } catch (error: any) {
    console.error('Erro ao processar análise:', error);
    return NextResponse.json(
      { error: 'Erro interno ao gerar análise da partida.', details: error.message },
      { status: 500 }
    );
  }
}
