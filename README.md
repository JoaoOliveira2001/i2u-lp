# Integration2U Landing Page

Uma landing page moderna e de alta conversão para a Integration2U, desenvolvida com React e Vite. Focada em soluções práticas: automação de CRM, criação de sistemas, integração entre sistemas, dashboards e Business Intelligence.

## 🎨 Design

- **Dark Mode**: Fundo preto muito escuro (#0a0a0a)
- **Cores de Destaque**: Azul elétrico (#00d4ff) e roxo suave (#a855f7)
- **Estilo**: Minimalista, profissional, acessível ao público geral
- **Responsivo**: Otimizado para mobile, tablet e desktop
- **Animações**: Balões de conversa flutuantes no Hero

## 🚀 Como Executar

### Pré-requisitos

- Node.js 16+ instalado
- npm ou yarn

### Instalação

1. Instale as dependências:
```bash
npm install
```

2. Execute o servidor de desenvolvimento:
```bash
npm run dev
```

3. Abra o navegador em `http://localhost:5173`

### Build para Produção

```bash
npm run build
```

Os arquivos otimizados estarão na pasta `dist/`.

### Preview da Build

```bash
npm run preview
```

## 📁 Estrutura do Projeto

```
├── src/
│   ├── components/ # Componentes React
│   │   ├── Header.jsx (Logo Integration2U)
│   │   ├── Hero.jsx (com animação de balões)
│   │   ├── TrustBar.jsx (Logos de parceiros)
│   │   ├── Specialties.jsx (Bento Grid - 6 soluções)
│   │   ├── Differentiators.jsx (Diferenciais)
│   │   ├── FAQ.jsx (Dúvidas Frequentes)
│   │   ├── Testimonials.jsx (Depoimentos)
│   │   ├── ContactForm.jsx (Micro-formulário)
│   │   ├── FloatingWhatsApp.jsx (Botão flutuante)
│   │   └── ChatBubbles.jsx (Animação de balões)
│   ├── hooks/
│   │   └── useScrollReveal.js
│   ├── App.jsx     # Componente principal
│   ├── main.jsx    # Entry point
│   └── index.css   # Estilos globais
├── index.html
├── package.json
└── vite.config.js
```

## ✨ Funcionalidades

- **Header Fixo**: Logo Integration2U com efeito glassmorphism
- **Hero Section**: Headline impactante com animação de balões de conversa
- **Trust Bar**: Barra de credibilidade com logos e selos
- **Nossas Soluções**: Bento Grid com 6 soluções (CRM, Dashboards, Sistemas, Integrações, BI, Chatbots)
- **Diferenciais**: Por que escolher a Integration2U
- **FAQ**: Dúvidas frequentes em formato accordion
- **Depoimentos**: Testimonials com métricas quantificáveis
- **Formulário de Contato**: Micro-formulário que redireciona para WhatsApp (11998836070)
- **Botão Flutuante WhatsApp**: Sempre visível para contato rápido

## 📱 Responsividade

A landing page é totalmente responsiva com breakpoints para:
- Desktop (1200px+)
- Tablet (768px - 1024px)
- Mobile (< 768px)
- Mobile pequeno (< 480px)

## 🛠️ Tecnologias

- React 18+
- Vite
- CSS3 (com variáveis CSS)
- Google Fonts (Inter)

## 📝 Notas

- O formulário redireciona para WhatsApp (11998836070) com mensagem pré-preenchida
- Todas as animações são CSS puro para melhor performance
- Design focado em conversão com CTAs estratégicos
- Linguagem acessível, sem jargões técnicos

## 📄 Licença

Todos os direitos reservados - Integration2U © 2024
