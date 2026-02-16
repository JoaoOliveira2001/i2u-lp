import React from 'react';
import ChatBubbles from './ChatBubbles';
import './Hero.css';

const Hero = () => {
  return (
    <section className="hero section">
      <ChatBubbles />
      <div className="container">
        <div className="hero-content fade-in">
          <h1 className="hero-headline">
            Escale seu Negócio com Automações de Elite
          </h1>
          <p className="hero-subtitle">
            Automatize seu CRM, crie sistemas personalizados e conecte todas as suas ferramentas. 
            Economize tempo e aumente suas vendas com tecnologia que funciona.
          </p>
          <a href="#contato" className="cta-button">
            Falar com Especialista via WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
};

export default Hero;
