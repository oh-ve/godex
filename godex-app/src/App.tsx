import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./components/Login";
import Home from "./components/Home";
import PokemonForm from "./components/PokemonForm";
import PokemonEditForm from "./components/PokemonEditForm";
import PokemonList from "./components/PokemonList";
import UserDetails from "./components/UserDetails";
import type { Pokemon } from "./types";

function App() {
  const [pokemonList, setPokemonList] = useState<Pokemon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const fetchPokemonList = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const response = await fetch(
          "https://pokeapi.co/api/v2/pokemon?limit=10000"
        );
        if (!response.ok) {
          throw new Error("Failed to fetch Pokémon list");
        }
        const data = await response.json();

        const fetchPokemonDetails = async (url: string) => {
          const response = await fetch(url);
          const data = await response.json();
          return {
            id: data.id,
            name: data.name,
            type: data.types
              .map((typeInfo: any) => typeInfo.type.name)
              .join(", "),
            sprite: data.sprites.front_default,
          };
        };

        const detailedPokemonList = await Promise.all(
          data.results.map(async (pokemon: { url: string }) => {
            const details = await fetchPokemonDetails(pokemon.url);
            return details;
          })
        );

        setPokemonList(detailedPokemonList);
        setLoading(false);
      } catch (err) {
        setError((err as Error).message);
        setLoading(false);
      }
    };

    fetchPokemonList();
  }, [navigate]);

  const allPokemonNames = pokemonList.map((pokemon) => pokemon.name);

  return (
    <div>
      <Navbar />
      <h1>GoDex</h1>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <Home pokemonList={pokemonList} loading={loading} error={error} />
          }
        />
        <Route path="/user-details" element={<UserDetails />} />
        <Route
          path="/add-pokemon"
          element={<PokemonForm allPokemonNames={allPokemonNames} />}
        />
        <Route path="/edit-pokemon/:id" element={<PokemonEditForm />} />
        <Route path="/pokemon/:name" element={<PokemonList />} />
      </Routes>
    </div>
  );
}

const AppWithRouter = () => (
  <Router>
    <App />
  </Router>
);

export default AppWithRouter;
