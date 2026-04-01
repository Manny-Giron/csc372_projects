import "./App.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import HoroscopeDetail from "./components/HoroscopeDetail";
import ZodiacGrid from "./components/ZodiacGrid";
import { useState } from 'react';

function App() {
  const [selectedSign, setSelectedSign] = useState(null);
  const zodiacSigns = [
    { id: 1, name: "Aries", range: "Mar 21 - Apr 19", image: "/img/aries.png", mood: 4, success: 3, love: 2, healh: 3 },
    { id: 2, name: "Taurus", range: "Apr 20 - May 20", image: "/img/taurus.png", mood: 3, success: 4, love: 3, healh: 4 },
    { id: 3, name: "Gemini", range: "May 21 - Jun 20", image: "/img/gemini.png", mood: 5, success: 2, love: 4, healh: 2 },
    { id: 4, name: "Cancer", range: "Jun 21 - Jul 22", image: "/img/cancer.png", mood: 4, success: 3, love: 5, healh: 3 },
    { id: 5, name: "Leo", range: "Jul 23 - Aug 22", image: "/img/leo.png", mood: 5, success: 4, love: 3, healh: 4 },
    { id: 6, name: "Virgo", range: "Aug 23 - Sep 22", image: "/img/virgo.png", mood: 3, success: 5, love: 2, healh: 5 },
    { id: 7, name: "Libra", range: "Sep 23 - Oct 22", image: "/img/libra.png", mood: 4, success: 3, love: 4, healh: 3 },
    { id: 8, name: "Scorpio", range: "Oct 23 - Nov 21", image: "/img/scorpio.png", mood: 5, success: 4, love: 5, healh: 4 },
    { id: 9, name: "Sagittarius", range: "Nov 22 - Dec 21", image: "/img/sagittarius.png", mood: 5, success: 5, love: 4, healh: 5 },
    { id: 10, name: "Capricorn", range: "Dec 22 - Jan 19", image: "/img/capricorn.png", mood: 4, success: 5, love: 3, healh: 4 },
    { id: 11, name: "Aquarius", range: "Jan 20 - Feb 18", image: "/img/aquarius.png", mood: 5, success: 4, love: 3, healh: 4 },
    { id: 12, name: "Pisces", range: "Feb 19 - Mar 20", image: "/img/pisces.png", mood: 4, success: 3, love: 5, healh: 4 }
  ];


  return (
    <>
      <Header />
      <main className="content-box">
        <h1>Choose Your Zodiac Sign</h1>

        {!selectedSign ? (
          <ZodiacGrid zodiacSigns={zodiacSigns} setSelectedSign={setSelectedSign} />
        ) : (
          <HoroscopeDetail selectedSign={selectedSign} />
        )}

      </main>
      <Footer />
    </>
  );
}

export default App;