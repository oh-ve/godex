import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./components/Login";
import Pokemon from "./components/Pokemon";
import PokemonDetails from "./components/PokemonDetails";

function App() {
  return (
    <Router>
      <div>
        <Navbar />
        <h1>GoDex</h1>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Pokemon />} />
          <Route path="/pokemon/:name" element={<PokemonDetails />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
