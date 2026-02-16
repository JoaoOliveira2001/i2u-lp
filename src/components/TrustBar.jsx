import React from 'react';
import './TrustBar.css';

const TrustBar = () => {
  const partners = [
    { name: 'n8n', icon: '⚙️' },
    { name: 'AWS', icon: '☁️' },
    { name: 'Node.js', icon: '🟢' },
    { name: 'React', icon: '⚛️' },
    { name: 'Prisma', icon: '🗄️' }
  ];

  const badges = [
    { text: 'LGPD Compliant', icon: '🔒' },
    { text: 'TypeScript', icon: '📘' }
  ];

  return (
    <section className="trust-bar">
      <div className="container">
        <div className="trust-content">
          <div className="partners-section">
            <p className="trust-label">Tecnologias de Elite</p>
            <div className="partners-logos">
              {partners.map((partner, index) => (
                <div key={index} className="partner-item">
                  <span className="partner-icon">{partner.icon}</span>
                  <span className="partner-name">{partner.name}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="badges-section">
            {badges.map((badge, index) => (
              <div key={index} className="badge-item">
                <span className="badge-icon">{badge.icon}</span>
                <span className="badge-text">{badge.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustBar;
