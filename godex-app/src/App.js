import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Pokemon from "./components/Pokemon";
import PokemonDetails from "./components/PokemonDetails";

function App() {
  return (
    <Router>
      <div>
        <h1>GoDex App</h1>
        <Routes>
          <Route path="/" element={<Pokemon />} />
          <Route path="/pokemon/:name" element={<PokemonDetails />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
