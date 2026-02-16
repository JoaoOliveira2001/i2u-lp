import React, { useState } from 'react';
import './ContactForm.css';

const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    challenge: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const challenges = [
    'Automação de processos',
    'Integração de sistemas',
    'Desenvolvimento de APIs',
    'Chatbots e IA',
    'Migração de dados',
    'Outro'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    // Limpa erro do campo quando usuário começa a digitar
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    
    if (!formData.company.trim()) {
      newErrors.company = 'Empresa é obrigatória';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    // Mensagem simples pré-preenchida para WhatsApp
    const challengeText = formData.challenge ? `\n\nPreciso de ajuda com: ${formData.challenge}` : '';
    const whatsappMessage = `Olá! Meu nome é ${formData.name} da empresa ${formData.company}.

Email: ${formData.email}${challengeText}

Gostaria de saber mais sobre as soluções da Integration2U. Podemos conversar?`;

    const encodedMessage = encodeURIComponent(whatsappMessage);
    const whatsappUrl = `https://wa.me/5511998836070?text=${encodedMessage}`;
    
    // Pequeno delay para feedback visual
    setTimeout(() => {
      window.open(whatsappUrl, '_blank');
      setIsSubmitting(false);
      
      // Limpa o formulário
      setFormData({
        name: '',
        email: '',
        company: '',
        challenge: ''
      });
    }, 300);
  };

  return (
    <section className="contact section" id="contato">
      <div className="container">
        <h2 className="section-title">Fale com Nossa Equipe</h2>
        <p className="contact-intro">
          Quer saber como podemos ajudar seu negócio? 
          Preencha o formulário e vamos conversar pelo WhatsApp.
        </p>
        <form className="contact-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Nome Completo *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Seu nome"
              className={errors.name ? 'error' : ''}
              required
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email Corporativo *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="seu@empresa.com"
                className={errors.email ? 'error' : ''}
                required
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="company">Empresa *</label>
              <input
                type="text"
                id="company"
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="Nome da empresa"
                className={errors.company ? 'error' : ''}
                required
              />
              {errors.company && <span className="error-message">{errors.company}</span>}
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="challenge">Qual seu maior desafio? (Opcional)</label>
            <select
              id="challenge"
              name="challenge"
              value={formData.challenge}
              onChange={handleChange}
            >
              <option value="">Selecione um desafio</option>
              {challenges.map((challenge, index) => (
                <option key={index} value={challenge}>
                  {challenge}
                </option>
              ))}
            </select>
          </div>
          
          <button type="submit" className="submit-button" disabled={isSubmitting}>
            {isSubmitting ? 'Abrindo WhatsApp...' : 'Falar com Especialista via WhatsApp'}
          </button>
          
          <p className="form-note">
            Ao clicar, você será redirecionado para o WhatsApp com uma mensagem pré-preenchida.
          </p>
        </form>
      </div>
    </section>
  );
};

export default ContactForm;
