import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import Groq from 'groq-sdk';
import { createClient } from '@supabase/supabase-js';

// Robô de busca
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
    return "Erro ao buscar dados recentes.";
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { mandante, visitante, campeonato } = body;

    if (!mandante || !visitante) {
      return NextResponse.json({ error: 'Os times mandante e visitante são obrigatórios.' });
    }

    // 1. VERIFICAÇÃO DE SEGURANÇA DAS CHAVES
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json({ error: 'Falta a chave GROQ_API_KEY nas variáveis de ambiente da Vercel.' });
    }

    // Inicializa o Groq apenas se a chave existir
    const groq = new Groq({ apiKey: groqApiKey });
    const liga = campeonato || 'Futebol';

    // 2. BUSCA NA WEB
    const dadosMandante = await buscarDadosNaWeb(`últimas notícias desfalques ${mandante} ${liga}`);
    const dadosVisitante = await buscarDadosNaWeb(`últimas notícias desfalques ${visitante} ${liga}`);

    // 3. PROMPT PARA A IA
    const prompt = `
      Você é o PredictAI, um especialista em análise preditiva de futebol.
      Analise o confronto: ${mandante} (Mandante) x ${visitante} (Visitante) pelo torneio ${liga}.
      
      Baseie-se nestes dados reais e atuais da web:
      - ${mandante}: ${dadosMandante}
      - ${visitante}: ${dadosVisitante}
      
      Responda em 4 tópicos:
      1. Momento das Equipes
      2. Impacto de Desfalques
      3. Prognóstico Final
      4. Placar Exato Mais Provável
    `;

    // 4. CHAMADA DA IA
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama3-8b-8192',
      temperature: 0.3,
    });

    const analiseFinal = chatCompletion.choices[0]?.message?.content || "A IA não conseguiu gerar a análise.";

    // 5. TENTATIVA DE SALVAR NO BANCO (NÃO TRAVA SE FALHAR)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        await supabase.from('analises').insert([
          { mandante, visitante, campeonato: liga, resultado_ia: analiseFinal }
        ]);
      } catch (dbError) {
        console.log("Aviso: Falha ao salvar no banco, mas a análise será exibida.", dbError);
      }
    }

    // 6. DEVOLVE A ANÁLISE COM SUCESSO
    return NextResponse.json({ analise: analiseFinal });

  } catch (error: any) {
    console.error("Erro completo na API:", error);
    return NextResponse.json({ error: 'Erro no servidor: ' + (error.message || 'Desconhecido') });
  }
}
