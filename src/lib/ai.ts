import Groq from 'groq-sdk';

// Inicializa o cliente do Groq usando a chave do .env
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function generateMatchAnalysis(promptText: string) {
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'Você é um especialista em análise estatística de futebol e apostas esportivas. Devolva todas as respostas estritamente em formato JSON válido.',
        },
        {
          role: 'user',
          content: promptText,
        },
      ],
      // Modelo Llama 3.3 de 70B parâmetros (gratuito e de altíssimo nível no Groq)
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' }, // Força a resposta em formato JSON sem quebrar
    });

    const content = completion.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('Nenhum conteúdo retornado pelo Groq.');
    }

    return JSON.parse(content);
  } catch (error) {
    console.error('Erro ao chamar a API do Groq:', error);
    throw new Error('Falha ao gerar análise com a IA (Groq).');
  }
}
