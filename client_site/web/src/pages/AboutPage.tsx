import { Link } from 'react-router-dom';

export function AboutPage() {
  return (
    <div className="static-page about-page">
      <header className="static-hero">
        <h1>About Rocket Rentals</h1>
        <p className="static-lead">
          This is a mock &ldquo;about&rdquo; page for a classroom project: a
          tool-rental experience with a React front end and a Node API backed
          by MySQL. Branding and layout echo the original PHP/HTML site—orange
          accents, monospace type, and bordered panels.
        </p>
      </header>

      <section className="card-panel about-block">
        <h2>What this project is</h2>
        <p>
          Rocket Rentals lets visitors browse a tool catalog, view details, and
          (when logged in) build a cart and move through a rental checkout flow.
          Admin and ops routes are gated by role for demo purposes.
        </p>
      </section>

      <section className="card-panel about-block">
        <h2>Team &amp; mission (sample copy)</h2>
        <p>
          We care about making equipment accessible for weekend projects and
          small jobs without buying tools you will only use once. Delivery areas,
          hours, and inventory shown here are fictional unless configured for a
          real deployment.
        </p>
      </section>

      <section className="card-panel about-block">
        <h2>Contact (placeholder)</h2>
        <p>
          For this demo, use your course channels or your deployed site&rsquo;s
          support email. No messages are sent from this page.
        </p>
        <p className="about-fine-print">
          Built for learning: accessibility and production hardening are
          incremental goals—feedback welcome.
        </p>
      </section>

      <p className="static-footer-nav">
        <Link to="/how-it-works" className="home-inline-link">
          How it works
        </Link>
        <span className="dot-sep" aria-hidden>
          ·
        </span>
        <Link to="/tools" className="home-inline-link">
          Browse tools
        </Link>
      </p>
    </div>
  );
}
