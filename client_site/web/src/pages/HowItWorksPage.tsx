import { Link } from 'react-router-dom';

const steps = [
  {
    title: 'Browse & search',
    body: 'Explore categories or use search to find tools by name or description. Each listing shows daily rate and how many units are available.',
  },
  {
    title: 'Add to cart & sign in',
    body: 'Create an account or log in to add tools to your cart. You will need a verified account before checkout so we can schedule delivery and contact you.',
  },
  {
    title: 'Delivery details',
    body: 'Tell us where to drop off equipment and any access notes. For delivery-only items, we will route the request to our ops team.',
  },
  {
    title: 'Rent & return',
    body: 'Complete checkout, keep the tool for your rental window, then prepare it for pickup or return per your agreement. Questions? Reach us from your account area.',
  },
];

export function HowItWorksPage() {
  return (
    <div className="static-page how-page">
      <header className="static-hero">
        <h1>How Rocket Rentals works</h1>
        <p className="static-lead">
          From first search to delivery, here is the path most customers follow.
          This is a student demo site—processes are simplified compared to a
          production rental business.
        </p>
      </header>

      <ol className="how-steps">
        {steps.map((s, i) => (
          <li key={s.title} className="how-step card-panel">
            <span className="how-step-num" aria-hidden>
              {i + 1}
            </span>
            <div>
              <h2>{s.title}</h2>
              <p>{s.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <section className="card-panel static-aside">
        <h2>Ready to browse?</h2>
        <p>
          Head to the catalog to search tools, or return home to explore
          categories by image.
        </p>
        <div className="static-actions">
          <Link to="/tools" className="static-btn primary">
            View tools
          </Link>
          <Link to="/" className="static-btn ghost">
            Home
          </Link>
        </div>
      </section>
    </div>
  );
}
