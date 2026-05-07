import "./Header.css";

function Header() {
   return (
      <header>
         <div className="header-left">
            <img src="/img/logo.png" alt="Cosmic Horoscopes Logo" className="logo" />
         </div>

         <nav>
            <a href="#">Horoscopes</a>
         </nav>
      </header>
   )
};

export default Header;