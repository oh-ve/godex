import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./components/Login";
import Home from "./components/Home";
import PokemonForm from "./components/PokemonForm";
import PokemonEditForm from "./components/PokemonEditForm";
import PokemonList from "./components/PokemonList";
import UserDetails from "./components/UserDetails";

function App() {
  return (
    <Router>
      <div>
        <Navbar />
        <h1>GoDex</h1>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Home />} />
          <Route path="/user-details" element={<UserDetails />} />
          <Route path="/add-pokemon" element={<PokemonForm />} />
          <Route path="/edit-pokemon/:id" element={<PokemonEditForm />} />
          <Route path="/pokemon/:name" element={<PokemonList />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
