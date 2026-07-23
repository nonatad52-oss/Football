import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const league = searchParams.get('league') || 'bra.1';

  try {
    // API pública e gratuita da ESPN
    const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/scoreboard`, {
      cache: 'no-store'
    });
    
    if (!res.ok) throw new Error('Falha ao buscar jogos');
    const data = await res.json();

    // Filtra e organiza apenas as informações que importam para nós
    const matches = data.events.map((event: any) => {
      const homeTeam = event.competitions[0].competitors.find((c: any) => c.homeAway === 'home').team.name;
      const awayTeam = event.competitions[0].competitors.find((c: any) => c.homeAway === 'away').team.name;
      
      const dateObj = new Date(event.date);
      const time = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const day = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

      return {
        id: event.id,
        home: homeTeam,
        away: awayTeam,
        date: `${day} às ${time}`,
        status: event.status.type.shortDetail // Ex: "16:00", "Encerrado", "Ao vivo"
      };
    });

    return NextResponse.json({ matches });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar jogos. Tente novamente.' }, { status: 500 });
  }
}
