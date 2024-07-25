import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { UserPokemon } from "../types";

const PokemonList: React.FC = () => {
  const { name } = useParams<{ name: string }>();
  const [pokemonList, setPokemonList] = useState<UserPokemon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPokemon = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`http://localhost:8080/api/pokemon`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch Pokémon");
        }
        const data: UserPokemon[] = await response.json();
        const filteredData = data.filter(
          (pokemon) => pokemon.name.toLowerCase() === name?.toLowerCase()
        );
        setPokemonList(filteredData);
        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchPokemon();
  }, [name]);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <div>
      <h1>Pokémon named {name}</h1>
      <ul>
        {pokemonList.map((pokemon) => (
          <li key={pokemon.id}>
            <p>ID: {pokemon.id}</p>
            <p>Nickname: {pokemon.nickname}</p>
            <p>Shiny: {pokemon.is_shiny ? "Yes" : "No"}</p>
            <p>IV: {pokemon.iv}</p>
            <p>Date: {pokemon.date}</p>
            <p>
              Distance:{" "}
              {pokemon.distance
                ? "More than 100km from home"
                : "Within 100km from home"}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PokemonList;
