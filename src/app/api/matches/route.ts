import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const league = searchParams.get('league') || 'bra.1';

  try {
    // 1. Ampliando o Radar: Pega a data de hoje, 2 dias atrás e 5 dias pra frente
    const hoje = new Date();
    const dataInicial = new Date(); 
    dataInicial.setDate(hoje.getDate() - 2);
    
    const dataFinal = new Date(); 
    dataFinal.setDate(hoje.getDate() + 5);
    
    // Formata no padrão YYYYMMDD exigido pela ESPN (Ex: 20260723)
    const formataData = (d: Date) => d.toISOString().split('T')[0].replace(/-/g, '');
    const rangeDatas = `${formataData(dataInicial)}-${formataData(dataFinal)}`;

    // 2. Busca na ESPN usando a janela de 7 dias
    const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/scoreboard?dates=${rangeDatas}`;
    
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('Falha ao buscar jogos');
    const data = await res.json();

    // 3. Organiza os dados para o Front-end
    const matches = data.events?.map((event: any) => {
      const comp = event.competitions?.[0];
      const home = comp?.competitors?.find((c: any) => c.homeAway === 'home')?.team?.name || 'Casa';
      const away = comp?.competitors?.find((c: any) => c.homeAway === 'away')?.team?.name || 'Fora';
      
      const dateObj = new Date(event.date);
      const time = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const day = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

      return {
        id: event.id,
        home,
        away,
        date: `${day} às ${time}`,
        status: event.status?.type?.shortDetail || 'Pendente'
      };
    }) || [];

    return NextResponse.json({ matches });
  } catch (error) {
    return NextResponse.json({ error: 'Erro', matches: [] });
  }
}
