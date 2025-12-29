import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Globe, Building2, Menu, X } from 'lucide-react';
import './LandingView.css';

export default function LandingView() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // Handle smooth scrolling for anchor links
  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      const offset = 80; // Account for fixed nav
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="nav-container">
          <div className="nav-logo">
            <span className="logo-text">ItineraryWeaver</span>
          </div>
          <div className="nav-links">
            <a href="#features" className="nav-link" onClick={(e) => handleAnchorClick(e, '#features')}>Features</a>
            <a href="#workspaces" className="nav-link" onClick={(e) => handleAnchorClick(e, '#workspaces')}>Workspaces</a>
            <a href="#about" className="nav-link" onClick={(e) => handleAnchorClick(e, '#about')}>About</a>
          </div>
          <div className="nav-actions">
            <button className="nav-btn-secondary" onClick={() => navigate('/login')}>Log in</button>
            <button className="nav-btn-primary" onClick={() => navigate('/traveler')}>Get started</button>
          </div>
          <button 
            className="mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div 
        className={`mobile-menu-overlay ${isMobileMenuOpen ? 'active' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <div 
          className={`mobile-menu ${isMobileMenuOpen ? 'active' : ''}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mobile-menu-header">
            <span className="logo-text">ItineraryWeaver</span>
            <button 
              className="mobile-menu-close"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Close menu"
            >
              <X size={24} />
            </button>
          </div>
          <div className="mobile-menu-links">
            <a 
              href="#features" 
              className="mobile-nav-link"
              onClick={(e) => handleAnchorClick(e, '#features')}
            >
              Features
            </a>
            <a 
              href="#workspaces" 
              className="mobile-nav-link"
              onClick={(e) => handleAnchorClick(e, '#workspaces')}
            >
              Workspaces
            </a>
            <a 
              href="#about" 
              className="mobile-nav-link"
              onClick={(e) => handleAnchorClick(e, '#about')}
            >
              About
            </a>
          </div>
          <div className="mobile-menu-actions">
            <button 
              className="mobile-nav-btn-secondary"
              onClick={() => {
                setIsMobileMenuOpen(false);
                navigate('/login');
              }}
            >
              Log in
            </button>
            <button 
              className="mobile-nav-btn-primary"
              onClick={() => {
                setIsMobileMenuOpen(false);
                navigate('/traveler');
              }}
            >
              Get started
            </button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <h1 className="hero-headline">
            Change the way you
            <span className="hero-headline-accent"> travel</span>
          </h1>
          <p className="hero-subheadline">
            Home or away, local or global — manage your itineraries seamlessly across 
            all your devices. Get started for free, in a tap.
          </p>
          <div className="hero-actions">
            <button 
              className="hero-cta-primary"
              onClick={() => navigate('/traveler')}
            >
              Get started
              <ArrowRight size={20} />
            </button>
            <button 
              className="hero-cta-secondary"
              onClick={() => navigate('/dmc')}
            >
              For DMCs
            </button>
          </div>
        </div>
      </section>

      {/* Workspace Selection - Simplified */}
      <section id="workspaces" className="workspaces-section">
        <div className="section-container">
          <h2 className="section-title">Choose your workspace</h2>
          <p className="section-description">
            Two powerful interfaces designed for different needs
          </p>
          
          <div className="workspaces-grid">
            <div 
              className="workspace-card-simple traveler-card"
              onClick={() => navigate('/traveler')}
            >
              <div className="workspace-icon-simple">
                <Globe size={40} />
              </div>
              <h3>Traveler</h3>
              <p>View and manage your personal itineraries</p>
              <div className="workspace-link">
                Enter workspace
                <ArrowRight size={18} />
              </div>
            </div>

            <div 
              className="workspace-card-simple dmc-card"
              onClick={() => navigate('/dmc')}
            >
              <div className="workspace-icon-simple">
                <Building2 size={40} />
              </div>
              <h3>DMC Control</h3>
              <p>Manage all client itineraries and bookings</p>
              <div className="workspace-link">
                Enter workspace
                <ArrowRight size={18} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Simple Features */}
      <section id="features" className="features-section-simple">
        <div className="section-container">
          <h2 className="section-title">Everything you need</h2>
          <div className="features-list">
            <div className="feature-item-simple">
              <div className="feature-number">01</div>
              <div className="feature-content">
                <h3>Flight Management</h3>
                <p>Search, book, and manage flights with real-time updates</p>
              </div>
            </div>
            <div className="feature-item-simple">
              <div className="feature-number">02</div>
              <div className="feature-content">
                <h3>Itinerary Planning</h3>
                <p>Create detailed travel plans with hotels, activities, and transfers</p>
              </div>
            </div>
            <div className="feature-item-simple">
              <div className="feature-number">03</div>
              <div className="feature-content">
                <h3>Multi-format Export</h3>
                <p>Share itineraries via WhatsApp, HTML, or JSON formats</p>
              </div>
            </div>
            <div className="feature-item-simple">
              <div className="feature-number">04</div>
              <div className="feature-content">
                <h3>Real-time Sync</h3>
                <p>All your data syncs instantly across all devices</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <h2 className="cta-title">Ready to get started?</h2>
          <p className="cta-description">
            Join thousands of travelers and DMCs already using ItineraryWeaver
          </p>
          <button 
            className="cta-button"
            onClick={() => navigate('/traveler')}
          >
            Get started for free
            <ArrowRight size={20} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-logo">ItineraryWeaver</div>
          <div className="footer-links">
            <a href="#" className="footer-link">Privacy</a>
            <a href="#" className="footer-link">Terms</a>
            <a href="#" className="footer-link">Support</a>
          </div>
          <div className="footer-copyright">
            © 2025 ItineraryWeaver. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
