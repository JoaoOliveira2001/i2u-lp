import React from 'react';
import './ChatBubbles.css';

const ChatBubbles = () => {
  const bubbles = [
    { text: 'Automatize seu CRM', delay: 0, size: 'small', position: 'top-left' },
    { text: 'Integre seus sistemas', delay: 0.5, size: 'medium', position: 'top-right' },
    { text: 'Aumente suas vendas', delay: 1, size: 'small', position: 'bottom-left' },
    { text: 'Economize tempo', delay: 1.5, size: 'medium', position: 'bottom-right' },
    { text: 'Sistema personalizado', delay: 2, size: 'small', position: 'center-left' },
    { text: 'Atendimento 24/7', delay: 2.5, size: 'medium', position: 'center-right' },
  ];

  return (
    <div className="chat-bubbles-container">
      {bubbles.map((bubble, index) => (
        <div
          key={index}
          className={`chat-bubble bubble-${bubble.size} bubble-${bubble.position}`}
          style={{ animationDelay: `${bubble.delay}s` }}
        >
          <div className="bubble-content">
            <span>{bubble.text}</span>
          </div>
          <div className="bubble-tail"></div>
        </div>
      ))}
    </div>
  );
};

export default ChatBubbles;
