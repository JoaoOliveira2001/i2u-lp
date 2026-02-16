import React from 'react';
import './Testimonials.css';

const Testimonials = () => {
  const testimonials = [
    {
      name: 'Carlos Silva',
      role: 'CTO',
      company: 'TechCorp Solutions',
      image: 'https://via.placeholder.com/80x80/00d4ff/ffffff?text=CS',
      metric: '60%',
      metricLabel: 'Redução de Tempo',
      quote: 'Reduzimos o tempo de processamento de pedidos em 60% com as automações. Em menos de 3 meses já vimos o retorno do investimento.',
      highlight: 'Resultado em 3 meses'
    },
    {
      name: 'Ana Paula',
      role: 'Diretora de Operações',
      company: 'InnovaTech',
      image: 'https://via.placeholder.com/80x80/a855f7/ffffff?text=AP',
      metric: '37%',
      metricLabel: 'Aumento em Vendas',
      quote: 'A integração com nosso CRM aumentou as vendas em 37%. O sistema funciona 24 horas por dia, sem parar.',
      highlight: 'Sistema sempre funcionando'
    },
    {
      name: 'Roberto Mendes',
      role: 'CEO',
      company: 'DataFlow Inc',
      image: 'https://via.placeholder.com/80x80/10b981/ffffff?text=RM',
      metric: '80%',
      metricLabel: 'Menos Trabalho Manual',
      quote: 'Automatizamos 80% das tarefas manuais. A equipe agora foca em estratégia, não em operação.',
      highlight: '80% automatizado'
    }
  ];

  return (
    <section className="testimonials section" id="depoimentos">
      <div className="container">
        <h2 className="section-title">Resultados Reais de Clientes</h2>
        <p className="section-subtitle">
          Métricas quantificáveis que comprovam o impacto das nossas soluções
        </p>
        <div className="testimonials-grid">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="testimonial-card fade-in">
              <div className="testimonial-header">
                <div className="testimonial-avatar">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.name}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="testimonial-info">
                  <h3 className="testimonial-name">{testimonial.name}</h3>
                  <p className="testimonial-role">{testimonial.role}</p>
                  <p className="testimonial-company">{testimonial.company}</p>
                </div>
              </div>
              <div className="testimonial-metric">
                <span className="metric-value">{testimonial.metric}</span>
                <span className="metric-label">{testimonial.metricLabel}</span>
              </div>
              <p className="testimonial-quote">"{testimonial.quote}"</p>
              <div className="testimonial-highlight">
                <span className="highlight-icon">⭐</span>
                <span>{testimonial.highlight}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
