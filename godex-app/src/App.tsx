import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useNavigate,
  Navigate,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./components/Login";
import Home from "./components/Home";
import PokemonForm from "./components/PokemonForm";
import PokemonEditForm from "./components/PokemonEditForm";
import PokemonList from "./components/PokemonList";
import UserDetails from "./components/UserDetails";
import Sidebar from "./components/Sidebar";
import { SelectedPokemonProvider } from "./components/context/SelectedPokemonContext";
import type { Pokemon } from "./types";

function App() {
  const [pokemonList, setPokemonList] = useState<Pokemon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchPokemonList = async () => {
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
  const token = localStorage.getItem("token");

  return (
    <SelectedPokemonProvider>
      {token && <Navbar />}
      <div style={{ display: "flex" }}>
        <div style={{ flex: 1 }}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                token ? (
                  <Home
                    pokemonList={pokemonList}
                    loading={loading}
                    error={error}
                  />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/user-details"
              element={token ? <UserDetails /> : <Navigate to="/login" />}
            />
            <Route
              path="/add-pokemon"
              element={
                token ? (
                  <PokemonForm allPokemonNames={allPokemonNames} />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/edit-pokemon/:id"
              element={token ? <PokemonEditForm /> : <Navigate to="/login" />}
            />
            <Route
              path="/pokemon/:name"
              element={token ? <PokemonList /> : <Navigate to="/login" />}
            />
          </Routes>
        </div>
        {token && <Sidebar />}
      </div>
    </SelectedPokemonProvider>
  );
}

const AppWithRouter = () => (
  <Router>
    <App />
  </Router>
);

export default AppWithRouter;
