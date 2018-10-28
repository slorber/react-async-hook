import React, {useState} from "react";

import {
  useAsync,
} from "react-async-hook";

const fetchStarwarsHero = id => fetch(`https://swapi.co/api/people/${id}/`).then(result => {
  if (result.status !== 200) {
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
  const [heroId, setHeroId] = useState(1);
  const next = () => setHeroId(heroId + 1);
  const previous = () => setHeroId(heroId - 1);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
      }}
    >

      <div style={{display: "flex"}}>
        <div style={buttonStyle} onClick={previous}>Previous</div>
        <div style={buttonStyle} onClick={next}>Next</div>
      </div>

      <div style={{display: "flex", marginTop: 50}}>
        <HeroContainer>
          <StarwarsHero id={heroId}/>
        </HeroContainer>
        <HeroContainer>
          <StarwarsHero id={heroId + 1}/>
        </HeroContainer>
        <HeroContainer>
          <StarwarsHero id={heroId + 2}/>
        </HeroContainer>
      </div>

    </div>
  );
};


const HeroContainer = ({children}) => (
  <div style={{
    margin: 10,
    padding: 10,
    border: "solid",
    borderRadius: 10,
    width: 200,
    height: 80,
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  }}>
    {children}
  </div>
);


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
          <div>Id: {id}</div>
          <div>Name: {asyncHero.result.name}</div>
        </div>
      )}
    </div>
  );
};


export default App;
