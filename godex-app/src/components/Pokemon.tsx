import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

interface Pokemon {
  id: number;
  name: string;
  type: string;
  sprite: string;
}

const Pokemon: React.FC = () => {
  const [pokemonList, setPokemonList] = useState<Pokemon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPokemonList = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login"); // Redirect to login if no token found
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

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <div className="pokelist">
      <h1>Complete Pokémon List</h1>
      {pokemonList.map((pokemon) => (
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

export default Pokemon;
