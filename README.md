# NoteDrill (SmartDrill) 🚜🧨

**NoteDrill** é uma plataforma avançada para gestão e monitoramento de operações de Perfuração e Desmonte (Drill & Blast) em mineração e obras civis. O sistema centraliza o controle de obras, equipamentos, equipes e relatórios diários (BDP), oferecendo métricas de produtividade e controle de custos em tempo real.

![Status do Projeto](https://img.shields.io/badge/Status-Em_Desenvolvimento-blue)
![Tech Stack](https://img.shields.io/badge/Stack-Next.js_|_Supabase_|_Tailwind-black)

---

## 🚀 Funcionalidades Principais

### 📊 Dashboard Inteligente
*   Monitoramento em tempo real de KPIs (Metros perfurados, produção em m³, eficiência).
*   Gráficos detalhados de consumo de diesel e desempenho de coroas/bits.
*   Filtros dinâmicos por obra e período.

### 📝 Gestão de BDP (Boletim Diário de Perfuração)
*   Lançamento digital de relatórios diários.
*   Controle de horímetro, metros perfurados e atividades improdutivas.
*   Associação automática com operadores e equipamentos.

### 🏗️ Controle de Obras (Projetos)
*   Gestão de múltiplos canteiros de obras.
*   Acompanhamento de volume contratado vs. executado.

### 🚜 Gestão de Frota
*   Cadastro completo de equipamentos (Perfuratrizes, Compressores).
*   Histórico de manutenção e controle de horímetro.

### 👥 Gestão de Equipes & RH
*   Controle de colaboradores (Supervisores, Operadores, Auxiliares).
*   **Controle de EPIs:** Gestão de entrega e estoque de equipamentos de proteção individual.

### 🔐 Permissões e Planos (Novo)
Sistema robusto de controle de acesso baseado em assinaturas (SaaS):
*   **Basic:** Ideal para pequenas operações (1 Obra, 1 Equipamento).
*   **Pro:** Para médias empresas (3 Obras, 3 Equipamentos).
*   **Enterprise:** Limites personalizados e ilimitados.
*   **Controle de Acesso (RBAC):**
    *   **Gestor/Admin:** Acesso total.
    *   **Supervisor:** Gestão de equipes e relatórios.
    *   **Operador:** Acesso restrito apenas ao lançamento de BDP e configurações pessoais.

---

## 🛠️ Tecnologias Utilizadas

O projeto foi construído utilizando as tecnologias mais modernas do mercado para garantir performance, escalabilidade e segurança.

*   **Frontend:** [Next.js 14](https://nextjs.org/) (App Router), [React 18](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
*   **Estilização:** [Tailwind CSS](https://tailwindcss.com/), [Shadcn/ui](https://ui.shadcn.com/)
*   **Backend & Banco de Dados:** [Supabase](https://supabase.com/) (PostgreSQL, Auth, Realtime, Storage, Edge Functions)
*   **Pagamentos:** [Stripe](https://stripe.com/)
*   **Gráficos:** [Recharts](https://recharts.org/)
*   **Relatórios:** [jsPDF](https://github.com/parallax/jsPDF)

---

## ⚙️ Instalação e Configuração

Siga os passos abaixo para rodar o projeto localmente:

### 1. Pré-requisitos
*   Node.js 18+ instalado.
*   Conta no Supabase e Stripe.

### 2. Clonar o Repositório
```bash
git clone https://github.com/seu-usuario/notedrill.git
cd notedrill
```

### 3. Instalar Dependências
```bash
npm install
```

### 4. Configurar Variáveis de Ambiente
Crie um arquivo `.env.local` na raiz do projeto e preencha com suas credenciais:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role
NEXT_PUBLIC_APP_URL=http://localhost:3000
# Adicione chaves do Stripe se necessário
```

### 5. Configurar Banco de Dados
Execute os scripts SQL localizados na raiz do projeto no Editor SQL do Supabase para criar as tabelas e políticas de segurança necessárias.
*   Recomendado: Comece pelos scripts de `setup` e depois aplique os `fixes` mais recentes, como `add_subscription_limits.sql`.

### 6. Rodar o Projeto
```bash
npm run dev
```
Acesse `http://localhost:3000` no seu navegador.

---

## 📂 Estrutura do Projeto

*   `/app`: Páginas e rotas da aplicação (Next.js App Router).
*   `/components`: Componentes reutilizáveis da interface (Botões, Cards, Gráficos).
*   `/lib`: Funções utilitárias, clientes do Supabase e definições de Schema (Zod).
*   `/scripts`: Scripts de migração e manutenção do banco de dados.
*   `/public`: Arquivos estáticos (imagens, ícones).

---

## 🛡️ Segurança e Privacidade

*   **RLS (Row Level Security):** Todos os dados são protegidos a nível de banco de dados. Usuários só acessam dados permitidos para sua organização e função.
*   **Middleware:** Proteção de rotas no Next.js para impedir acesso não autorizado a páginas administrativas.

---

## 📄 Licença

Este projeto é proprietário e desenvolvido sob medida. Todos os direitos reservados.
