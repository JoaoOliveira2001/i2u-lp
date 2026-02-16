import React from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import TrustBar from './components/TrustBar';
import Specialties from './components/Specialties';
import Differentiators from './components/Differentiators';
import FAQ from './components/FAQ';
import Testimonials from './components/Testimonials';
import ContactForm from './components/ContactForm';
import FloatingWhatsApp from './components/FloatingWhatsApp';
import './App.css';

function App() {
  return (
    <div className="App">
      <Header />
      <Hero />
      <TrustBar />
      <Specialties />
      <Differentiators />
      <FAQ />
      <Testimonials />
      <ContactForm />
      <FloatingWhatsApp />
      <footer className="footer">
        <div className="container">
          <p>&copy; 2024 Integration2U. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
