

function HoroscopeDetail({ selectedSign }) {
   return (
      <div className="horoscope-detail">
         <img src={selectedSign.image} alt={selectedSign.name} />
         <h2>{selectedSign.name}</h2>
         <p>{selectedSign.range}</p>

         <div className="ratings">
            <h3>Today's Ratings:</h3>
            <p>Mood: {"★".repeat(selectedSign.mood)}</p>
            <p>Success: {"★".repeat(selectedSign.success)}</p>
            <p>Love: {"★".repeat(selectedSign.love)}</p>
         </div>

         <div className="horoscope-text">
            <h3>Today's Horoscope:</h3>
            <p>{selectedSign.horoscope}</p>
         </div>
      </div>
   )
};

export default HoroscopeDetail;