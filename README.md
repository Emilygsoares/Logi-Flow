# Order Orbit Logistics Hub

# LOGIFLOW — Plataforma SaaS de Gestão Logística para Pequenos Lojistas

## 1. VISÃO GERAL DO PRODUTO

Desenvolva uma aplicação web SaaS chamada **LogiFlow**, destinada a pequenos lojistas e empreendedores que comercializam produtos físicos e precisam organizar suas operações de expedição e entrega.

O objetivo é centralizar o gerenciamento de pedidos, conferência de mercadorias, agendamento manual de coletas, acompanhamento de entregas e registro de ocorrências.

### Problema que o produto resolve

Pequenos lojistas frequentemente administram suas entregas por meio de planilhas, mensagens de WhatsApp e controles manuais. Isso dificulta o acompanhamento dos pedidos, a organização das coletas e a identificação de falhas operacionais.

### Proposta de valor

Oferecer uma ferramenta simples, acessível e intuitiva para que pequenos negócios possam controlar suas operações logísticas em um único ambiente.

### Público-alvo

- MEIs.
- Microempresas comerciais.
- Pequenas lojas virtuais.
- Lojistas que vendem pelo Instagram, WhatsApp e e-commerce.
- Negócios que utilizam entregadores próprios ou transportadoras terceirizadas.

---

## 2. IDENTIDADE VISUAL

Criar uma interface moderna, profissional, minimalista e intuitiva.

### Paleta de cores

- Azul-marinho: #172B4D
- Azul principal: #2864DC
- Azul-claro: #EAF1FF
- Verde: #21A179
- Fundo: #F7F9FC
- Branco: #FFFFFF
- Texto: #202B3C
- Vermelho: #DC5555

### Diretrizes de design

- Utilizar tipografia Inter.
- Utilizar ícones Lucide.
- Criar cards com bordas arredondadas.
- Utilizar sidebar lateral.
- Priorizar hierarquia visual e espaçamento.
- Criar gráficos simples e legíveis.
- Garantir responsividade para desktop, tablet e celular.
- Utilizar feedback visual nas ações.
- Evitar excesso de elementos decorativos.

O resultado deve transmitir a qualidade visual de um SaaS profissional.

---

## 3. TECNOLOGIA E ARQUITETURA

Utilizar exclusivamente o **Lovable Cloud** para:

- Banco de dados.
- Autenticação.
- Armazenamento de dados.
- Controle de acesso.
- Operações de leitura e escrita.

Não configurar Supabase externo, Firebase ou servidor próprio.

Organizar a aplicação com componentes reutilizáveis e separação entre interface, regras de negócio e acesso aos dados.

### Estrutura principal

O MVP terá um único ambiente principal: a área de gestão do lojista.

Não desenvolver painel administrativo independente da plataforma nesta primeira versão.

---

## 4. AUTENTICAÇÃO E CADASTRO

Criar uma página inicial com:

- Logotipo LogiFlow.
- Breve apresentação da plataforma.
- Benefícios da solução.
- Botão "Começar agora".
- Botão "Entrar".

### Cadastro

Solicitar:

- Nome completo.
- E-mail.
- Senha.
- Nome da loja.

Após o cadastro, criar a empresa e associar o usuário à empresa correspondente.

### Login

Implementar autenticação pelo Lovable Cloud.

Incluir:

- E-mail.
- Senha.
- Recuperação de senha.
- Mensagens de erro.
- Encerramento de sessão.

Após o login, direcionar o usuário ao dashboard.

---

## 5. DASHBOARD — PRIORIDADE PRINCIPAL

Criar um dashboard completo, funcional e visualmente profissional.

O dashboard

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/fa02bdce-0b58-4289-bd8f-c2cb621824d8).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
