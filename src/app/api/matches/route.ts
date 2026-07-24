import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const league = searchParams.get('league') || 'bra.1';

  try {
    // 1. Ampliando a busca: de ONTEM até os próximos 10 DIAS (evita o bug de fuso horário UTC vs Brasília)
    const dataInicial = new Date();
    dataInicial.setDate(dataInicial.getDate() - 1); 
    
    const dataFinal = new Date(); 
    dataFinal.setDate(dataFinal.getDate() + 10);
    
    const formataData = (d: Date) => d.toISOString().split('T')[0].replace(/-/g, '');
    const rangeDatas = `${formataData(dataInicial)}-${formataData(dataFinal)}`;

    // 2. Busca na ESPN
    const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/scoreboard?dates=${rangeDatas}`;
    
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('Falha ao buscar jogos');
    const data = await res.json();

    // 3. Filtra apenas os jogos que AINDA VÃO ACONTECER e organiza as datas
    const matches = (data.events || [])
      .filter((event: any) => {
        const state = event.status?.type?.state;
        // Pega apenas jogos pré-jogo ('pre') ou agendados ('scheduled')
        return state === 'pre' || state === 'scheduled';
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
          status: event.status?.type?.shortDetail || 'Agendado',
          timestamp: dateObj.getTime() // Usado para ordenar
        };
      });

    // 4. Ordena cronologicamente: do jogo mais perto de acontecer para o mais longe
    matches.sort((a: any, b: any) => a.timestamp - b.timestamp);

    return NextResponse.json({ matches });
  } catch (error) {
    return NextResponse.json({ error: 'Erro', matches: [] });
  }
}
