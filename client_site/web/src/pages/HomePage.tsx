import { Link } from 'react-router-dom';

export function HomePage() {
  return (
    <>
      <div id="TopContent">
        <h1>Fast and Easy Tool Rentals</h1>
        <h1>Delivered to your door</h1>
        <p>Rent top-quality tools and equipment without leaving your home</p>
        <div id="searchBox">
          <input
            id="searchInput"
            placeholder="Search tools..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const q = (e.target as HTMLInputElement).value.trim();
                window.location.href = q
                  ? `/tools?search=${encodeURIComponent(q)}`
                  : '/tools';
              }
            }}
          />
          <Link
            id="searchButton"
            to="/tools"
            onClick={(e) => {
              const input = document.getElementById('searchInput') as HTMLInputElement | null;
              const q = input?.value.trim();
              if (q) {
                e.preventDefault();
                window.location.href = `/tools?search=${encodeURIComponent(q)}`;
              }
            }}
          >
            ?
          </Link>
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
        <h1>How It Works</h1>
        <div id="displayCards">
          <div className="displayCard">
            <h3>Choose Your Tools</h3>
            <p>Search through our catalog of options that suit your project.</p>
          </div>
          <div className="displayCard">
            <h3>Request Your Delivery</h3>
            <p>Enter your delivery address and instructions.</p>
          </div>
          <div className="displayCard">
            <h3>Get Your Rental</h3>
            <p>Sign in to add items, schedule, and complete checkout.</p>
          </div>
        </div>
      </div>
    </>
  );
}
