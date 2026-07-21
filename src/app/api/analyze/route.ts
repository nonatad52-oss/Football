import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import Groq from 'groq-sdk';
import { createClient } from '@supabase/supabase-js';

// Robô de busca avançado focado em estatísticas esportivas (Gols, Cartões, Escanteios, Sofascore/Flashscore)
async function buscarDadosNaWeb(termo: string) {
  try {
    // Buscando com foco em estatísticas detalhadas
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(termo)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!res.ok) return "Sem dados estatísticos disponíveis.";
    
    const xml = await res.text();
    const $ = cheerio.load(xml, { xmlMode: true });
    
    let resultados = "";
    $('item').each((i, el) => {
      if (i < 6) {
        const titulo = $(el).find('title').text();
        const descHtml = $(el).find('description').text();
        const cleanDesc = cheerio.load(descHtml).text();
        resultados += `[${titulo} - ${cleanDesc}] `;
      }
    });
    
    return resultados || "Nenhuma estatística detalhada encontrada.";
  } catch (error) {
    console.error("Erro na busca de estatísticas:", error);
    return "Erro ao buscar dados estatísticos.";
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

    // 1. BUSCA DIRECIONADA A ESTATÍSTICAS (Gols, Cartões, Escanteios e plataformas como SofaScore/Flashscore)
    const dadosMandante = await buscarDadosNaWeb(`${mandante} estatisticas media gols cartoes escanteios sofascore flashscore`);
    const dadosVisitante = await buscarDadosNaWeb(`${visitante} estatisticas media gols cartoes escanteios sofascore flashscore`);

    // 2. PROMPT RIGOROSO EXIGINDO DADOS ESTATÍSTICOS PROFISSIONAIS
    const prompt = `
      Você é o PredictAI, um analista estatístico profissional de futebol (tipo especialista de mercado e scout).
      Analise rigorosamente o confronto: ${mandante} (Mandante) x ${visitante} (Visitante) pelo torneio ${liga}.
      
      ATENÇÃO: Sua análise deve se basear ESTRITAMENTE nos dados estatísticos extraídos da web abaixo (referentes a médias de gols, desempenho, cartões, escanteios e dados de plataformas de scout/estatísticas). Não invente dados.
      
      - Dados Estatísticos do Mandante (${mandante}): ${dadosMandante}
      - Dados Estatísticos do Visitante (${visitante}): ${dadosVisitante}
      
      Estruture sua resposta técnica em 4 tópicos detalhados com foco em números:
      1. Panorama Estatístico e Médias (Analise o comportamento de gols pró/contra, posse ou desempenho recente com base nos dados).
      2. Disciplina, Cartões e Escanteios (Aponte tendências de cartões amarelos/vermelhos e média de escanteios se encontrados nos relatórios de scout).
      3. Análise de Jogadores / Desfalques (Destaque atletas importantes ou baixas citadas nos relatórios).
      4. Prognóstico Técnico e Placar Exato (Fundamente matematicamente a probabilidade de vitória e o placar exato com base nas médias de gols dos times).
    `;

    // 3. CHAMADA DA IA
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.2,
    });

    const analiseFinal = chatCompletion.choices[0]?.message?.content || "A IA não conseguiu gerar a análise estatística.";

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
