import React from 'react';
import './AboutUs.css';

const AboutUs = () => {
  const founders = [
    {
      name: 'Fundador 1',
      role: 'CEO & Co-Founder',
      description: 'Especialista em arquitetura de sistemas e integrações empresariais.',
      image: 'https://via.placeholder.com/200x200/00d4ff/ffffff?text=F1'
    },
    {
      name: 'Fundador 2',
      role: 'CTO & Co-Founder',
      description: 'Expert em automação e soluções tecnológicas inovadoras.',
      image: 'https://via.placeholder.com/200x200/a855f7/ffffff?text=F2'
    }
  ];

  return (
    <section className="about-us section" id="sobre">
      <div className="container">
        <h2 className="section-title">A Equipe Por Trás das Soluções</h2>
        <p className="about-intro">
          Arquitetos de software e especialistas em automação com mais de 10 anos de experiência
          em transformar processos empresariais através de tecnologia de ponta.
        </p>
        <div className="founders-grid">
          {founders.map((founder, index) => (
            <div key={index} className="founder-card fade-in">
              <div className="founder-image-wrapper">
                <img 
                  src={founder.image} 
                  alt={founder.name}
                  className="founder-image"
                  loading="lazy"
                  decoding="async"
                />
                <div className="founder-image-glow"></div>
              </div>
              <h3 className="founder-name">{founder.name}</h3>
              <p className="founder-role">{founder.role}</p>
              <p className="founder-description">{founder.description}</p>
            </div>
          ))}
        </div>
        <div className="about-cta">
          <a href="#contato" className="cta-button-secondary">
            Junte-se a mais de 50 empresas automatizadas. Inicie seu projeto no chat →
          </a>
        </div>
      </div>
    </section>
  );
};

export default AboutUs;
