

function ZodiacGrid({ zodiacSigns, setSelectedSign }) {
   return (
      <div className="zodiac-grid">
         {zodiacSigns.map((sign) => (
            <div key={sign.id} className="zodiac-card" onClick={() => setSelectedSign(sign)}>
               <img src={sign.image} alt={sign.name} />
               <h3>{sign.name}</h3>
               <p>{sign.range}</p>
            </div>
         ))}
      </div>
   )
};

export default ZodiacGrid;