import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const league = searchParams.get('league') || 'bra.1';

  try {
    // 1. Define a busca de HOJE até os próximos 7 DIAS
    const hoje = new Date();
    const dataFinal = new Date(); 
    dataFinal.setDate(hoje.getDate() + 7);
    
    // Formata no padrão YYYYMMDD exigido pela ESPN
    const formataData = (d: Date) => d.toISOString().split('T')[0].replace(/-/g, '');
    const rangeDatas = `${formataData(hoje)}-${formataData(dataFinal)}`;

    // 2. Busca na ESPN usando a janela de 7 dias futuros
    const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/scoreboard?dates=${rangeDatas}`;
    
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('Falha ao buscar jogos');
    const data = await res.json();

    // 3. Organiza os dados e aplica o FILTRO DE JOGOS FUTUROS
    const matches = (data.events || [])
      .filter((event: any) => {
        // FILTRO MÁGICO: Só permite passar jogos com status 'pre' (agendados)
        // Ignora sumariamente 'in' (ao vivo) e 'post' (encerrados)
        return event.status?.type?.state === 'pre';
      })
      .map((event: any) => {
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
          status: event.status?.type?.shortDetail || 'Agendado'
        };
      });

    return NextResponse.json({ matches });
  } catch (error) {
    return NextResponse.json({ error: 'Erro', matches: [] });
  }
}
