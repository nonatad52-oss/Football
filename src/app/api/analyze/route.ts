import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import Groq from 'groq-sdk';
import { createClient } from '@supabase/supabase-js';

// Inicializa Groq e Supabase com as chaves da Vercel
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Robô de busca gratuito usando DuckDuckGo HTML
async function buscarDadosNaWeb(termo: string) {
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(termo)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!res.ok) return "Sem dados recentes disponíveis.";
    
    const html = await res.text();
    const $ = cheerio.load(html);
    
    let resultados = "";
    $('.result__snippet').each((i, el) => {
      if (i < 4) resultados += $(el).text() + " | "; 
    });
    
    return resultados || "Nenhuma informação relevante encontrada hoje.";
  } catch (error) {
    console.error("Erro na busca:", error);
    return "Erro ao buscar dados recentes.";
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { mandante, visitante, campeonato } = body;

    if (!mandante || !visitante) {
      return NextResponse.json({ error: 'Times são obrigatórios.' }, { status: 400 });
    }

    const liga = campeonato || 'Futebol';

    // 1. O robô faz as buscas invisíveis
    const dadosMandante = await buscarDadosNaWeb(`notícias recentes últimos jogos desfalques ${mandante} ${liga}`);
    const dadosVisitante = await buscarDadosNaWeb(`notícias recentes últimos jogos desfalques ${visitante} ${liga}`);

    // 2. Prepara o cérebro da IA
    const prompt = `
      Você é o PredictAI, um especialista em análise preditiva de futebol.
      Sua missão é analisar o confronto entre: ${mandante} (Mandante) x ${visitante} (Visitante) pelo torneio ${liga}.
      
      Você deve basear sua análise EXCLUSIVAMENTE nas informações atualizadas coletadas da web hoje:
      - Dados recentes do Mandante (${mandante}): ${dadosMandante}
      - Dados recentes do Visitante (${visitante}): ${dadosVisitante}
      
      Formate sua resposta de forma clara:
      1. Resumo do Momento das Equipes (quem chega melhor, baseando-se nos dados acima).
      2. Impacto de Desfalques ou Notícias (se houver menção nos dados).
      3. Prognóstico Final (Quem tem maior probabilidade de vencer ou se é empate).
      4. Placar Exato Mais Provável.
      
      Seja direto, profissional e não invente estatísticas antigas.
    `;

    // 3. Pede para o Groq gerar a resposta
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama3-8b-8192', // Ou o modelo Groq da sua preferência (ex: mixtral-8x7b-32768)
      temperature: 0.3, // Menos "criativo", mais focado em dados lógicos
    });

    const analiseFinal = chatCompletion.choices[0]?.message?.content || "Erro ao processar análise.";

    // 4. Salva no banco de dados Supabase (Opcional, mas mantém seu histórico!)
    if (supabaseUrl && supabaseKey) {
      await supabase.from('analises').insert([
        { 
          mandante, 
          visitante, 
          campeonato: liga, 
          resultado_ia: analiseFinal 
        }
      ]).select();
    }

    // 5. Devolve para a tela do usuário
    return NextResponse.json({ analise: analiseFinal });

  } catch (error: any) {
    console.error("Erro na API:", error);
    return NextResponse.json({ error: 'Erro interno no servidor de análise.' }, { status: 500 });
  }
}
