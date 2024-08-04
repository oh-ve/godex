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
  const [accounts, setAccounts] = useState<
    { id: number; account_name: string }[]
  >([]);

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

  useEffect(() => {
    const fetchUserAccounts = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        return;
      }
      const response = await fetch("http://localhost:8080/api/accounts", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAccounts(data);
      }
    };
    fetchUserAccounts();
  }, []);

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
      {accounts.map((acc) => (
        <button>{acc.account_name}</button>
      ))}
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
