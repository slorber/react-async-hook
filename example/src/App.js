import React, { useState } from "react";

import {
  useAsync,
} from "react-async-hook";

const fetchStarwarsHero = id => fetch(`https://swapi.co/api/people/${id}/`).then(result => {
  if ( result.status !== 200 ) {
    throw new Error("bad status = " + result.status);
  }
  return result.json();
});

const buttonStyle = {
  border: "solid",
  cursor: "pointer",
  borderRadius: 50,
  padding: 10,
  margin: 10,
};

const App = () => {
  const [heroId,setHeroId] = useState(1);
  const next = () => setHeroId(heroId + 1);
  const previous = () => setHeroId(heroId - 1);
  return (
    <div style={{ padding: 20 }}>
      <div style={{margin: 20, display: "flex"}}>
        <div style={buttonStyle} onClick={previous}>Previous</div>
        <div style={buttonStyle} onClick={next}>Next</div>
      </div>
      <div style={{margin: 20}}>Current hero id={heroId}</div>
      <div style={{margin: 20}}>
        <StarwarsHero id={heroId}/>
      </div>
    </div>
  );
};


const StarwarsHero = ({id}) => {

  const asyncHero = useAsync(fetchStarwarsHero, [id]);

  return (
    <div>
      {asyncHero.loading && (
        <div>Loading</div>
      )}
      {asyncHero.error && (
        <div>Error: {asyncHero.error.message}</div>
      )}
      {asyncHero.result && (
        <div>
          <div>Success!</div>
          <div>Name: {asyncHero.result.name}</div>
        </div>
      )}
    </div>
  );
};


export default App;
