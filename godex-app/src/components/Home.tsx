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
  const [selectedAccount, setSelectedAccount] = useState<number | null>(null);

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
        if (data.length > 0) {
          setSelectedAccount(data[0].id);
        }
      }
    };
    fetchUserAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccount === null) {
      setFilteredPokemonList([]);
      return;
    }

    const fetchAccountPokemon = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        return;
      }
      const response = await fetch(
        `http://localhost:8080/api/pokemon/account/${selectedAccount}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const accountPokemonNames = new Set(
          data.map((pokemon: any) => pokemon.name.toLowerCase())
        );

        const filteredList = pokemonList.filter((pokemon) =>
          accountPokemonNames.has(pokemon.name.toLowerCase())
        );
        setFilteredPokemonList(filteredList);
      }
    };

    fetchAccountPokemon();
  }, [selectedAccount, pokemonList]);

  useEffect(() => {
    const filteredList = filteredPokemonList.filter((pokemon) =>
      pokemon.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredPokemonList(filteredList);
  }, [searchQuery]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleAccountClick = (accountId: number) => {
    setSelectedAccount(accountId);
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
      <div>
        {accounts.map((acc) => (
          <button
            key={acc.id}
            onClick={() => handleAccountClick(acc.id)}
            style={{
              backgroundColor:
                acc.id === selectedAccount ? "lightblue" : "white",
            }}
          >
            {acc.account_name}
          </button>
        ))}
      </div>
      <table>
        <tbody>
          {filteredPokemonList.map((pokemon) => (
            <tr key={pokemon.id} className="pokemon-row">
              <Link
                to={`/pokemon/${pokemon.name}?accountId=${selectedAccount}`}
                className="row-link"
              >
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
