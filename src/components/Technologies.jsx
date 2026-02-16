import React from 'react';
import './Technologies.css';

const Technologies = () => {
  const technologies = [
    {
      name: 'AWS',
      logo: (
        <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M5.8 15.8c-.1 0-.2 0-.3-.1-.1-.1-.1-.2-.1-.3V8.6c0-.1 0-.2.1-.3.1-.1.2-.1.3-.1h2.5c.1 0 .2 0 .3.1.1.1.1.2.1.3v6.8c0 .1 0 .2-.1.3-.1.1-.2.1-.3.1H5.8zm12.4-7.2c-.1 0-.2 0-.3-.1-.1-.1-.1-.2-.1-.3V8.6c0-.1 0-.2.1-.3.1-.1.2-.1.3-.1h2.5c.1 0 .2 0 .3.1.1.1.1.2.1.3v.4c0 .1 0 .2-.1.3-.1.1-.2.1-.3.1h-2.5zm-4.2 7.2c-.1 0-.2 0-.3-.1-.1-.1-.1-.2-.1-.3v-2.5c0-.1 0-.2.1-.3.1-.1.2-.1.3-.1h2.5c.1 0 .2 0 .3.1.1.1.1.2.1.3v2.5c0 .1 0 .2-.1.3-.1.1-.2.1-.3.1h-2.5z"/>
        </svg>
      )
    },
    {
      name: 'Node.js',
      logo: (
        <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
      )
    },
    {
      name: 'React',
      logo: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="2" fill="currentColor"/>
          <ellipse cx="12" cy="12" rx="11" ry="4.2" fill="none" strokeWidth="1.5"/>
          <ellipse cx="12" cy="12" rx="11" ry="4.2" fill="none" strokeWidth="1.5" transform="rotate(60 12 12)"/>
          <ellipse cx="12" cy="12" rx="11" ry="4.2" fill="none" strokeWidth="1.5" transform="rotate(-60 12 12)"/>
        </svg>
      )
    }
  ];

  return (
    <section className="technologies section" id="tecnologias">
      <div className="container">
        <h2 className="section-title">Tecnologias Confiáveis</h2>
        <p className="section-subtitle">
          Usamos as melhores ferramentas do mercado para garantir que seu sistema funcione perfeitamente
        </p>
        <div className="technologies-grid">
          {technologies.map((tech, index) => (
            <div key={index} className="tech-logo fade-in">
              <div className="tech-logo-circle">
                {tech.logo}
              </div>
              <span className="tech-name">{tech.name}</span>
            </div>
          ))}
        </div>
        <div className="tech-cta">
          <a href="#contato" className="cta-link">
            Quer saber mais? Fale com nosso especialista →
          </a>
        </div>
      </div>
    </section>
  );
};

export default Technologies;
