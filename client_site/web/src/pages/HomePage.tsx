import { useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export function HomePage() {
  const navigate = useNavigate();
  const searchRef = useRef<HTMLInputElement>(null);

  function goSearch() {
    const q = searchRef.current?.value.trim() ?? '';
    if (q) {
      navigate(`/tools?search=${encodeURIComponent(q)}`);
    } else {
      navigate('/tools');
    }
  }

  return (
    <>
      <div id="TopContent">
        <h1>Fast and Easy Tool Rentals</h1>
        <h1>Delivered to your door</h1>
        <p>Rent top-quality tools and equipment without leaving your home</p>
        <div id="searchBox">
          <input
            ref={searchRef}
            id="searchInput"
            name="q"
            type="search"
            autoComplete="off"
            placeholder="Search tools..."
            aria-label="Search tools"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                goSearch();
              }
            }}
          />
          <button
            type="button"
            id="searchButton"
            aria-label="Search"
            onClick={goSearch}
          >
            ?
          </button>
        </div>
      </div>
      <div id="CenterContent">
        <div id="ToolsContent">
          <Link to="/tools?category=cleaning">
            <div className="ToolCat">
              <img src="/images/RR_Floor_IMG.png" alt="Cleaning" />
            </div>
          </Link>
          <Link to="/tools?category=lawn">
            <div className="ToolCat">
              <img src="/images/RR_Lawn_IMG.png" alt="Lawn" />
            </div>
          </Link>
          <Link to="/tools?category=ladders">
            <div className="ToolCat">
              <img src="/images/RR_LaddersLift_IMG.png" alt="Ladders" />
            </div>
          </Link>
        </div>
        <Link to="/tools" id="viewToolsButton" className="button-link">
          View All Tools
        </Link>
      </div>
      <div id="BottomContent">
        <h1>How it works</h1>
        <div id="displayCards">
          <div className="displayCard">
            <h3>Choose your tools</h3>
            <p>Search through our catalog of options that suit your project.</p>
          </div>
          <div className="displayCard">
            <h3>Request your delivery</h3>
            <p>Enter your delivery address and instructions.</p>
          </div>
          <div className="displayCard">
            <h3>Get your rental</h3>
            <p>Sign in to add items, schedule, and complete checkout.</p>
          </div>
        </div>
        <p className="home-how-cta">
          <Link to="/how-it-works" className="home-inline-link">
            Read the full guide →
          </Link>
        </p>
      </div>
    </>
  );
}
