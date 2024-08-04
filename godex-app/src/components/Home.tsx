import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import type { Pokemon } from "../types";
import { capitalize } from "../utils";
import "../Styles.css";

interface HomeProps {
  pokemonList: Pokemon[];
  loading: boolean;
  error: string;
}

const Home: React.FC<HomeProps> = ({ pokemonList, loading, error }) => {
  const [filteredPokemonList, setFilteredPokemonList] = useState<Pokemon[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setFilteredPokemonList(pokemonList);
  }, [pokemonList]);

  useEffect(() => {
    const filteredList = pokemonList.filter((pokemon) =>
      pokemon.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredPokemonList(filteredList);
  }, [searchQuery, pokemonList]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <div className="pokelist">
      <h1>All Pokémon</h1>
      <input
        type="text"
        placeholder="Search Pokémon"
        value={searchQuery}
        onChange={handleSearchChange}
        style={{ marginBottom: "20px" }}
      />
      <button>Freizeitrobin</button>
      <button>QueenSanRosa</button>
      <table>
        <tbody>
          {filteredPokemonList.map((pokemon) => (
            <tr key={pokemon.id} className="pokemon-row">
              <Link to={`/pokemon/${pokemon.name}`} className="row-link">
                <td>{pokemon.id}</td>
                <td>
                  <img src={pokemon.sprite} alt={pokemon.name} />
                </td>
                <td>{capitalize(pokemon.name)}</td>
              </Link>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Home;
