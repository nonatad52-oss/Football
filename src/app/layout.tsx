import type { Metadata } from 'next';
import './globals.css'; // Carrega os estilos do Tailwind CSS

export const metadata: Metadata = {
  title: 'PredictAI Football',
  description: 'Sistema de Análise Preditiva de Futebol',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-slate-950 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
