import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import Groq from 'groq-sdk';
import { createClient } from '@supabase/supabase-js';

async function buscarDadosNaWeb(termo: string) {
  try {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(termo)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!res.ok) return "Sem dados recentes.";
    
    const xml = await res.text();
    const $ = cheerio.load(xml, { xmlMode: true });
    
    let resultados = "";
    $('item').each((i, el) => {
      if (i < 5) {
        const descHtml = $(el).find('description').text();
        const cleanDesc = cheerio.load(descHtml).text();
        resultados += `[${cleanDesc}] `;
      }
    });
    
    return resultados || "Sem dados.";
  } catch (error) {
    return "Erro na busca.";
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { mandante, visitante, campeonato, arbitro } = body;

    if (!mandante || !visitante) {
      return NextResponse.json({ error: 'Times obrigatórios.' });
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json({ error: 'Falta a chave GROQ_API_KEY.' });
    }

    const groq = new Groq({ apiKey: groqApiKey });
    const liga = campeonato || 'Futebol';
    const refInfo = arbitro ? `Árbitro: ${arbitro}` : 'Árbitro padrão';

    // 1. Busca silenciosa (agora incluindo impedimentos e over/under gols)
    const dadosMandante = await buscarDadosNaWeb(`${mandante} estatisticas gols escanteios cartoes impedimentos`);
    const dadosVisitante = await buscarDadosNaWeb(`${visitante} estatisticas gols escanteios cartoes impedimentos`);
    const dadosArbitro = arbitro ? await buscarDadosNaWeb(`arbitro ${arbitro} cartoes faltas`) : 'Sem dados.';

    // 2. PROMPT CEGO: A IA não pode falar, apenas devolver os números
    const prompt = `
      Você é um motor estatístico preditivo. Sua função é calcular probabilidades silenciosamente.
      
      Partida: ${mandante} x ${visitante} (${liga}). ${refInfo}.
      Dados: ${dadosMandante} | ${dadosVisitante} | ${dadosArbitro}
      
      REGRA ABSOLUTA: NÃO ESCREVA NENHUMA FRASE, EXPLICAÇÃO OU TEXTO ADICIONAL.
      Faça a sua análise internamente e devolva ESTRITAMENTE o painel abaixo preenchido com as porcentagens calculadas.

      🎯 RESULTADO FINAL
      - Vitória do ${mandante}: [X]%
      - Empate: [X]%
      - Vitória do ${visitante}: [X]%
      - Placar Exato Mais Provável: [X] x [X]

      ⚽ MERCADO DE GOLS
      - Ambas as Equipes Marcam (Sim): [X]%
      - Mais de 1.5 Gols na Partida: [X]%
      - Mais de 2.5 Gols na Partida: [X]%

      🚩 ESCANTEIOS
      - Mais de 8.5 Escanteios: [X]%
      - Mais de 9.5 Escanteios: [X]%
      - Mais de 10.5 Escanteios: [X]%

      🟨 CARTÕES (Baseado no Árbitro)
      - Mais de 4.5 Cartões: [X]%
      - Mais de 5.5 Cartões: [X]%
      - Chance de Cartão Vermelho: [X]%

      🚷 IMPEDIMENTOS
      - Mais de 2.5 Impedimentos: [X]%
      - Mais de 3.5 Impedimentos: [X]%
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.1, // Quase zero para evitar que a IA tente "conversar"
    });

    const analiseFinal = chatCompletion.choices[0]?.message?.content || "Erro ao gerar métricas.";

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        await supabase.from('analises').insert([
          { mandante, visitante, campeonato: liga, resultado_ia: analiseFinal }
        ]);
      } catch (dbError) {
        console.log("Banco de dados ignorado.");
      }
    }

    return NextResponse.json({ analise: analiseFinal });

  } catch (error: any) {
    return NextResponse.json({ error: 'Erro interno: ' + (error.message || '') });
  }
}
