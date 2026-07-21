// src/app/api/result/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { matchId, homeScore, awayScore, betWon, learningNotes } = await request.json();

    if (!matchId || homeScore === undefined || awayScore === undefined || betWon === undefined) {
      return NextResponse.json({ error: 'Dados insuficientes.' }, { status: 400 });
    }

    // 1. Busca a aposta correspondente para calcular o retorno financeiro
    const { data: prediction } = await supabase
      .from('predictions')
      .select('suggested_odds')
      .eq('match_id', matchId)
      .single();

    const odds = prediction?.suggested_odds || 1.0;
    const unitSize = 100; // Valor padrão de unidade de aposta (R$ 100)
    const profitLoss = betWon ? (unitSize * odds) - unitSize : -unitSize;

    // 2. Insere o resultado
    const { data: resultData, error: resultError } = await supabase
      .from('results')
      .insert([{
        match_id: matchId,
        home_score: homeScore,
        away_score: awayScore,
        bet_won: betWon,
        profit_loss: profitLoss,
        learning_notes: learningNotes || ''
      }])
      .select().single();

    if (resultError) throw resultError;

    // 3. Atualiza o status da partida para 'finished'
    await supabase
      .from('matches')
      .update({ status: 'finished' })
      .eq('id', matchId);

    return NextResponse.json({ success: true, result: resultData });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
