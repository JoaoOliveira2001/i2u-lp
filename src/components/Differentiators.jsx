import React from 'react';
import './Differentiators.css';

const Differentiators = () => {
  const differentiators = [
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="11" width="18" height="11" rx="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      title: 'Seus Dados Protegidos',
      description: 'Todas as informações do seu negócio ficam seguras e protegidas. Conformidade com leis de proteção de dados.',
      benefit: 'Segurança garantida'
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
          <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      title: 'Sistema Rápido e Confiável',
      description: 'Sistemas que funcionam rápido e não travam. Seu negócio não para, mesmo com muitos acessos.',
      benefit: 'Sempre disponível'
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="7" width="20" height="14" rx="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      title: 'Funciona em Qualquer Lugar',
      description: 'Acesse de qualquer lugar: celular, tablet ou computador. Tudo sincronizado na nuvem.',
      benefit: 'Acesso de qualquer lugar'
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      title: 'Suporte Quando Precisar',
      description: 'Equipe pronta para ajudar quando você precisar. Resolvemos problemas rapidamente.',
      benefit: 'Suporte sempre disponível'
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      title: 'Cresce com Seu Negócio',
      description: 'Sistema que cresce junto com você. Começa pequeno e escala conforme sua empresa cresce.',
      benefit: 'Cresce com você'
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
          <line x1="12" y1="1" x2="12" y2="23" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      title: 'Economia de Tempo e Dinheiro',
      description: 'Automatiza tarefas repetitivas e reduz custos. Você economiza tempo para focar no que importa.',
      benefit: 'Mais economia, menos trabalho'
    }
  ];

  return (
    <section className="differentiators section" id="diferenciais">
      <div className="container">
        <h2 className="section-title">Por Que Escolher a Integration2U?</h2>
        <p className="section-subtitle">
          Soluções que funcionam de verdade, sem complicação
        </p>
        <div className="differentiators-grid">
          {differentiators.map((item, index) => (
            <div key={index} className="diff-card fade-in">
              <div className="diff-icon">
                {item.icon}
              </div>
              <h3 className="diff-title">{item.title}</h3>
              <p className="diff-description">{item.description}</p>
              <div className="diff-benefit">
                <span className="benefit-icon">✓</span>
                <span>{item.benefit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Differentiators;
