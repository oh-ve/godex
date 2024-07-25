import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./components/Login";
import Home from "./components/Home";
import PokemonForm from "./components/PokemonForm";
import PokemonList from "./components/PokemonList";

function App() {
  return (
    <Router>
      <div>
        <Navbar />
        <h1>GoDex</h1>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Home />} />
          <Route path="/add-pokemon" element={<PokemonForm />} />
          <Route path="/pokemon/:name" element={<PokemonList />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
