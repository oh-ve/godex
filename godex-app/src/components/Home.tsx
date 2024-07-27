import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import type { Pokemon } from "../types";

interface HomeProps {
  pokemonList: Pokemon[];
  loading: boolean;
  error: string;
}

const Home: React.FC<HomeProps> = ({ pokemonList, loading, error }) => {
  const [filteredPokemonList, setFilteredPokemonList] = useState<Pokemon[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setFilteredPokemonList(pokemonList); // Initialize filtered list
  }, [pokemonList]);

  useEffect(() => {
    // Filter the Pokémon list based on the search query
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
      {filteredPokemonList.map((pokemon) => (
        <div key={pokemon.id} className="pokemon-card">
          <Link to={`/pokemon/${pokemon.name}`}>
            <img src={pokemon.sprite} alt={pokemon.name} />
            <p>ID: {pokemon.id}</p>
            <p>Name: {pokemon.name}</p>
          </Link>
        </div>
      ))}
    </div>
  );
};

export default Home;
