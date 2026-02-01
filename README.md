# NoteDrill (SmartDrill) 🚜🧨

**NoteDrill** é uma plataforma avançada para gestão e monitoramento de operações de Perfuração e Desmonte (Drill & Blast) em mineração e obras civis. O sistema centraliza o controle de obras, equipamentos, equipes e relatórios diários (BDP), oferecendo métricas de produtividade e controle de custos em tempo real.

![Status do Projeto](https://img.shields.io/badge/Status-Em_Desenvolvimento-blue)
![Tech Stack](https://img.shields.io/badge/Stack-Next.js_|_Supabase_|_Tailwind-black)
[![Deploy com Vercel](https://vercel.com/button)](https://notedrill.vercel.app/signup)

### 🔗 **Link do Projeto:** [https://notedrill.vercel.app/signup](https://notedrill.vercel.app/signup)

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

## ⚙️ Instalação e Configuração

Siga os passos abaixo para rodar o projeto localmente:

### 1. Pré-requisitos
*   Node.js 18+ instalado.
*   Conta no Supabase (configurada).
*   Conta no Stripe (opcional para simular pagamentos).

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
Crie um arquivo `.env.local` na raiz do projeto e preencha com as chaves corretas.
**Exemplo completo:**

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima-publica
SUPABASE_SERVICE_ROLE_KEY=sua-chave-secreta-service-role (Para admin/scripts)

# App URL (Localhost para desenvolvimento)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Opcional (Integrações)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 5. Configurar Banco de Dados (Supabase)
O projeto contém scripts SQL na raiz para criar a estrutura necessária. No dashboard do Supabase, vá em **SQL Editor** e execute-os na seguinte ordem (recomendada):

1.  **Estrutura Base:** Execute o conteúdo de `setup.sql` (ou equivalente `_setup.sql` dos módulos).
2.  **Correções e Updates:** É crucial rodar os scripts de correção mais recentes.
    *   `fix_settings_schema.sql` (Configurações gerais)
    *   `fix_profiles_schema.sql` (Perfis de usuário)
    *   `add_subscription_limits.sql` (Adiciona colunas de limites Basic/Pro/Enterprise)
3.  **Permissões (RLS):** Garanta que as políticas de segurança estejam ativas rodando `fix_permissions_final.sql` ou `grant_full_access.sql` caso encontre erros de permissão.

### 6. Rodar o Projeto
```bash
npm run dev
```
Acesse `http://localhost:3000` no seu navegador.

---

## 🗺️ Rotas e Endpoints

O projeto utiliza o **App Router** do Next.js. Abaixo estão as principais rotas da aplicação:

### Páginas (Frontend)
| Rota | Descrição | Acesso |
| :--- | :--- | :--- |
| `/login` | Tela de login/cadastro | Público |
| `/dashboard` | Visão geral e KPIs | Gestor/Supervisor |
| `/dashboard/bdp` | Lista e lançamento de BDPs | **Todos** (Principal para Operadores) |
| `/dashboard/projects` | Gestão de Obras | Gestor/Supervisor |
| `/dashboard/equipments` | Frota e Manutenção | Gestor/Supervisor |
| `/dashboard/team` | Gestão de Equipe e EPIs | Gestor/Supervisor |
| `/dashboard/settings` | Configurações do Sistema | Gestor |
| `/pricing` | Planos e Assinaturas | Público/Gestor |

### API (Server Actions & Route Handlers)
A lógica de backend está concentrada principalmente em **Server Actions** (`actions.ts` dentro de cada módulo), mas existem endpoints dedicados:
*   `/api/webhooks/stripe`: Recebe eventos de pagamento do Stripe.
*   `/api/cron/process-bdp`: (Exemplo) Processamento agendado de relatórios.

---

## 🛠️ Tecnologias Utilizadas

*   **Frontend:** [Next.js 14](https://nextjs.org/) (App Router), [React 18](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
*   **Estilização:** [Tailwind CSS](https://tailwindcss.com/), [Shadcn/ui](https://ui.shadcn.com/)
*   **Backend & Banco de Dados:** [Supabase](https://supabase.com/) (PostgreSQL, Auth, Realtime, Storage, Edge Functions)
*   **Pagamentos:** [Stripe](https://stripe.com/)
*   **Relatórios:** [jsPDF](https://github.com/parallax/jsPDF)

---

## 📄 Licença

Este projeto é proprietário e desenvolvido sob medida. Todos os direitos reservados.
