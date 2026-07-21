import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import Groq from 'groq-sdk';
import { createClient } from '@supabase/supabase-js';

// Robô de busca atualizado: Usando Google News RSS (oficial, rápido e não bloqueia)
async function buscarDadosNaWeb(termo: string) {
  try {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(termo)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!res.ok) return "Sem dados recentes disponíveis.";
    
    const xml = await res.text();
    // Passando o xmlMode para o Cheerio entender o formato do Google
    const $ = cheerio.load(xml, { xmlMode: true });
    
    let resultados = "";
    // Pega os títulos das 5 notícias mais recentes sobre o time
    $('item title').each((i, el) => {
      if (i < 5) resultados += $(el).text() + " | "; 
    });
    
    return resultados || "Nenhuma informação relevante encontrada hoje.";
  } catch (error) {
    console.error("Erro na busca do Google News:", error);
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

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json({ error: 'Falta a chave GROQ_API_KEY nas variáveis de ambiente da Vercel.' });
    }

    const groq = new Groq({ apiKey: groqApiKey });
    const liga = campeonato || 'Futebol';

    // 1. BUSCA NA WEB (Agora no Google News)
    const dadosMandante = await buscarDadosNaWeb(`últimas notícias desfalques ${mandante} ${liga}`);
    const dadosVisitante = await buscarDadosNaWeb(`últimas notícias desfalques ${visitante} ${liga}`);

    // 2. PROMPT PARA A IA
    const prompt = `
      Você é o PredictAI, um especialista em análise preditiva de futebol.
      Analise o confronto: ${mandante} (Mandante) x ${visitante} (Visitante) pelo torneio ${liga}.
      
      Baseie-se ESTRITAMENTE nestas manchetes reais de hoje extraídas da web:
      - Manchetes recentes sobre o ${mandante}: ${dadosMandante}
      - Manchetes recentes sobre o ${visitante}: ${dadosVisitante}
      
      Se os dados acima mencionarem desfalques, lesões ou fase atual, use isso na sua análise.
      
      Responda em 4 tópicos curtos e diretos:
      1. Momento das Equipes
      2. Impacto de Desfalques e Notícias Recentes
      3. Prognóstico Final
      4. Placar Exato Mais Provável
    `;

    // 3. CHAMADA DA IA
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.3,
    });

    const analiseFinal = chatCompletion.choices[0]?.message?.content || "A IA não conseguiu gerar a análise.";

    // 4. SALVAMENTO NO BANCO
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        await supabase.from('analises').insert([
          { mandante, visitante, campeonato: liga, resultado_ia: analiseFinal }
        ]);
      } catch (dbError) {
        console.log("Aviso: Falha ao salvar no banco, mas a análise será exibida.");
      }
    }

    return NextResponse.json({ analise: analiseFinal });

  } catch (error: any) {
    console.error("Erro completo na API:", error);
    return NextResponse.json({ error: 'Erro no servidor: ' + (error.message || 'Desconhecido') });
  }
}
