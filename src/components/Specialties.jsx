import React from 'react';
import './Specialties.css';

const Specialties = () => {
  const specialties = [
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      title: 'Automação de CRM',
      description: 'Automatize seu atendimento e vendas. Clientes atendidos 24/7, leads organizados automaticamente. Reduza o trabalho manual e aumente suas vendas.',
      size: 'large'
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3 9h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M9 21V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      title: 'Dashboards e Análises',
      description: 'Visualize todos os dados do seu negócio em tempo real. Gráficos, relatórios e métricas importantes em um só lugar. Tome decisões baseadas em dados.',
      size: 'large'
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      title: 'Criação de Sistemas',
      description: 'Sistema feito sob medida para seu negócio. Do zero ao funcionando, sem complicação. Tudo personalizado para suas necessidades.',
      size: 'medium'
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      title: 'Integração entre Sistemas',
      description: 'Conecte todas suas ferramentas. CRM, WhatsApp, site, tudo conversando entre si. Dados sincronizados automaticamente.',
      size: 'medium'
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 3V21H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M7 16L12 11L16 15L21 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M21 10V6H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      title: 'Business Intelligence',
      description: 'Transforme dados em insights valiosos. Relatórios inteligentes, análises preditivas e métricas que ajudam a crescer seu negócio.',
      size: 'medium'
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      title: 'Chatbots e Atendimento Automatizado',
      description: 'Atendimento automático que funciona. Responde clientes, agenda reuniões, vende mais. Disponível 24 horas por dia.',
      size: 'medium'
    }
  ];

  return (
    <section className="specialties section" id="especialidades">
      <div className="container">
        <h2 className="section-title">Nossas Soluções</h2>
        <p className="section-subtitle">
          Tecnologia simples que resolve problemas reais do seu negócio
        </p>
        <div className="bento-grid">
          {specialties.map((specialty, index) => (
            <div key={index} className={`bento-card bento-${specialty.size} fade-in`}>
              <div className="bento-icon">
                {specialty.icon}
              </div>
              <h3 className="bento-title">{specialty.title}</h3>
              <p className="bento-description">{specialty.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Specialties;
