import { useEffect, useRef, useState } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useNavigate,
  Navigate,
} from "react-router-dom";
import "./Styles.css";
import Navbar from "./components/Navbar";
import Login from "./components/Login";
import Home from "./components/Home";
import PokemonForm from "./components/PokemonForm";
import PokemonEditForm from "./components/PokemonEditForm";
import PokemonList from "./components/PokemonList";
import UserDetails from "./components/UserDetails";
import Sidebar from "./components/Sidebar";
import { SelectedPokemonProvider } from "./components/context/SelectedPokemonContext";
import type { BasicPokemon } from "./types";

function App() {
  const [pokemonList, setPokemonList] = useState<BasicPokemon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (
      sidebarRef.current &&
      !sidebarRef.current.contains(event.target as Node)
    ) {
      setSidebarOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
        setPokemonList(data.results);
        setLoading(false);
      } catch (err) {
        setError((err as Error).message);
        setLoading(false);
      }
    };

    fetchPokemonList();
  }, [navigate]);

  const token = localStorage.getItem("token");

  return (
    <SelectedPokemonProvider>
      {token && <Navbar toggleSidebar={toggleSidebar} isOpen={sidebarOpen} />}
      {sidebarOpen && (
        <div className="overlay visible" onClick={toggleSidebar}></div>
      )}
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
                  <PokemonForm
                    allPokemonNames={pokemonList.map((p) => p.name)}
                  />
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
        {token && <Sidebar ref={sidebarRef} isOpen={sidebarOpen} />}
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
