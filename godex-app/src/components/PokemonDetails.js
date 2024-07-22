import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

function PokemonDetails() {
  const { name } = useParams();
  const [pokemonData, setPokemonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPokemonDetails = async () => {
      try {
        const response = await fetch(
          `https://pokeapi.co/api/v2/pokemon/${name}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch Pokémon details");
        }
        const data = await response.json();
        setPokemonData(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchPokemonDetails();
  }, [name]);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <div>
      <h1>{pokemonData.name}</h1>
      <p>ID: {pokemonData.id}</p>
      <p>
        Type:{" "}
        {pokemonData.types.map((typeInfo) => typeInfo.type.name).join(", ")}
      </p>
      <img src={pokemonData.sprites.front_default} alt={pokemonData.name} />
    </div>
  );
}

export default PokemonDetails;
