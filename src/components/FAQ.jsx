import React, { useState } from 'react';
import './FAQ.css';

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(1); // Inicia com a segunda pergunta aberta

  const faqs = [
    {
      question: 'Como funciona a automação de CRM? Preciso trocar meu sistema atual?',
      answer: 'Não é necessário trocar seu sistema atual. Criamos integrações que conectam seu CRM existente com outras ferramentas, automatizando tarefas repetitivas como cadastro de leads, envio de e-mails e atualização de status. Você mantém tudo que já usa e ganha mais eficiência.'
    },
    {
      question: 'Quanto custa criar um sistema personalizado para minha empresa?',
      answer: 'O investimento varia conforme a complexidade e funcionalidades necessárias. Oferecemos um diagnóstico gratuito onde analisamos suas necessidades e apresentamos uma proposta personalizada com valores transparentes. Trabalhamos com diferentes orçamentos e sempre buscamos a melhor relação custo-benefício para seu negócio.'
    },
    {
      question: 'Os dashboards mostram dados em tempo real? Posso acessar pelo celular?',
      answer: 'Sim! Nossos dashboards atualizam automaticamente e mostram informações em tempo real. Você pode acessar de qualquer dispositivo - celular, tablet ou computador - de qualquer lugar. Tudo fica na nuvem, seguro e sempre disponível quando você precisar.'
    },
    {
      question: 'Como vocês fazem a integração entre diferentes sistemas? É seguro?',
      answer: 'Criamos conexões seguras entre seus sistemas usando APIs e automações. Todos os dados são criptografados e seguimos os mais altos padrões de segurança. Você mantém controle total sobre quais informações são compartilhadas entre sistemas. Fazemos testes extensivos antes de colocar em produção.'
    }
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="faq section" id="faq">
      <div className="container">
        <div className="faq-header">
          <span className="faq-label">Dúvidas Frequentes</span>
          <h2 className="faq-title">
            Entenda como a tecnologia pode trabalhar a favor do seu crescimento.
          </h2>
        </div>
        <div className="faq-list">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className={`faq-item ${openIndex === index ? 'open' : ''}`}
              onClick={() => toggleFAQ(index)}
            >
              <div className="faq-question">
                <h3>{faq.question}</h3>
                <span className="faq-icon">
                  {openIndex === index ? '−' : '+'}
                </span>
              </div>
              {openIndex === index && (
                <div className="faq-answer">
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
