import { Link } from 'react-router-dom';
import { HiOutlineViewGrid, HiOutlineDocumentText, HiOutlineChatAlt2, HiOutlineMicrophone, HiArrowRight, HiOutlineSparkles, HiOutlineLightningBolt, HiOutlineShieldCheck } from 'react-icons/hi';
import './Landing.css';

const features = [
  {
    icon: HiOutlineViewGrid,
    title: 'Profile Analyzer',
    description: 'Connect LeetCode, CodeChef, HackerRank & Codeforces. Get AI-powered insights on your placement readiness.',
    color: '#6c5ce7',
    gradient: 'linear-gradient(135deg, #6c5ce7, #a29bfe)'
  },
  {
    icon: HiOutlineDocumentText,
    title: 'Resume Optimizer',
    description: 'Upload your resume, get ATS scores, keyword gaps, and let AI auto-optimize it for your dream role.',
    color: '#00cec9',
    gradient: 'linear-gradient(135deg, #00cec9, #55efc4)'
  },
  {
    icon: HiOutlineChatAlt2,
    title: 'Study Companion',
    description: 'Chat with AI about DSA, System Design, OS, DBMS. Get structured explanations, code examples & resources.',
    color: '#fd79a8',
    gradient: 'linear-gradient(135deg, #fd79a8, #e17055)'
  },
  {
    icon: HiOutlineMicrophone,
    title: 'Voice Interview Coach',
    description: 'Practice HR & Technical interviews with an AI voice agent. Get real-time feedback and improvement tracking.',
    color: '#fdcb6e',
    gradient: 'linear-gradient(135deg, #fdcb6e, #f39c12)'
  }
];

const stats = [
  { value: '4+', label: 'Coding Platforms' },
  { value: 'AI', label: 'Powered Analysis' },
  { value: '5', label: 'Resume Templates' },
  { value: '∞', label: 'Study Sessions' }
];

const Landing = () => {
  return (
    <div className="landing" id="landing-page">
      {/* Animated background */}
      <div className="landing-bg">
        <div className="landing-orb orb-1"></div>
        <div className="landing-orb orb-2"></div>
        <div className="landing-orb orb-3"></div>
      </div>

      {/* Header */}
      <header className="landing-header">
        <div className="landing-logo">
          <div className="logo-icon"><HiOutlineSparkles /></div>
          <span>PrepHelp</span>
        </div>
        <nav className="landing-nav">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <Link to="/login" className="btn btn-ghost">Log in</Link>
          <Link to="/register" className="btn btn-primary">Get Started</Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="hero" id="hero">
        <div className="hero-content">
          <div className="hero-badge animate-fade-in-up">
            <HiOutlineLightningBolt /> AI-Powered Placement Prep
          </div>
          <h1 className="hero-title animate-fade-in-up" style={{animationDelay: '0.1s'}}>
            Your AI Placement<br />
            <span className="gradient-text">Readiness Coach</span>
          </h1>
          <p className="hero-subtitle animate-fade-in-up" style={{animationDelay: '0.2s'}}>
            Stop coding randomly. Get a personalized AI analysis of your coding profiles, 
            optimize your resume, study smarter with AI, and practice interviews with voice coaching.
          </p>
          <div className="hero-actions animate-fade-in-up" style={{animationDelay: '0.3s'}}>
            <Link to="/register" className="btn btn-primary btn-lg">
              Start Free <HiArrowRight />
            </Link>
            <Link to="/login" className="btn btn-secondary btn-lg">
              I have an account
            </Link>
          </div>
        </div>

        <div className="hero-stats animate-fade-in-up" style={{animationDelay: '0.4s'}}>
          {stats.map((stat, i) => (
            <div key={i} className="hero-stat">
              <span className="hero-stat-value">{stat.value}</span>
              <span className="hero-stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="features-section" id="features">
        <div className="section-header">
          <h2>Everything you need to <span className="gradient-text">crack placements</span></h2>
          <p>From profile analysis to mock interviews — one platform to rule them all.</p>
        </div>

        <div className="features-grid stagger-children">
          {features.map((f, i) => (
            <div key={i} className="feature-card glass-card">
              <div className="feature-icon" style={{background: f.gradient}}>
                <f.icon />
              </div>
              <h3>{f.title}</h3>
              <p>{f.description}</p>
              <Link to="/register" className="feature-link" style={{color: f.color}}>
                Get started <HiArrowRight />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="how-section" id="how-it-works">
        <div className="section-header">
          <h2>How <span className="gradient-text">PrepHelp</span> works</h2>
          <p>Three simple steps to supercharge your placement prep.</p>
        </div>

        <div className="steps stagger-children">
          <div className="step glass-card">
            <div className="step-number">01</div>
            <h3>Connect Profiles</h3>
            <p>Add your LeetCode, CodeChef, HackerRank, and Codeforces usernames. We analyze your stats automatically.</p>
          </div>
          <div className="step-connector"><div className="connector-line"></div></div>
          <div className="step glass-card">
            <div className="step-number">02</div>
            <h3>Get AI Insights</h3>
            <p>Our AI analyzes your strengths, weaknesses, and generates a personalized 30-day preparation plan.</p>
          </div>
          <div className="step-connector"><div className="connector-line"></div></div>
          <div className="step glass-card">
            <div className="step-number">03</div>
            <h3>Prepare & Practice</h3>
            <p>Optimize your resume, study with AI, practice mock interviews, and track your progress.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-card">
          <div className="cta-glow"></div>
          <h2>Ready to ace your placements?</h2>
          <p>Join thousands of students who are preparing smarter with AI.</p>
          <Link to="/register" className="btn btn-primary btn-lg">
            Get Started — It's Free <HiArrowRight />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="landing-logo">
              <div className="logo-icon"><HiOutlineSparkles /></div>
              <span>PrepHelp</span>
            </div>
            <p>AI-powered placement preparation platform for students.</p>
          </div>
          <div className="footer-links">
            <h4>Product</h4>
            <a href="#features">Features</a>
            <a href="#how-it-works">How it works</a>
          </div>
          <div className="footer-links">
            <h4>Support</h4>
            <a href="#">Help Center</a>
            <a href="#">Contact</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2025 PrepHelp. Built with ❤️ for students.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
