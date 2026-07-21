# ⚽ IA Analyst - Bet Memory

Sistema inteligente de análise preditiva para partidas de futebol com **memória de aprendizado contínuo**.

## 🛠️ Tecnologias Utilizadas
- **Next.js & React** (Front-end e API Routes)
- **Supabase** (PostgreSQL para dados de partidas, análises e resultados)
- **Engine de IA** (Processamento de estatísticas e raciocínio lógico)
- **Tailwind CSS** (Estilização do Dashboard)
- **Vercel** (Hospedagem e Deploy)

## 🚀 Como Funciona o Aprendizado
1. **Entrada de Dados:** Inserção de informações e estatísticas dos times.
2. **Consulta de Memória:** O sistema busca análises e erros passados na tabela `results` do Supabase.
3. **Análise Preditiva:** A IA gera o prognóstico considerando os desvios de análises anteriores.
4. **Feedback Loop:** Ao registrar o resultado final (Green/Red), a IA armazena notas de aprendizado para ajustar futuras decisões.
