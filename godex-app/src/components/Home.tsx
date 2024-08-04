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
  const [accountPokemonList, setAccountPokemonList] = useState<any[]>([]);
  const [filterOption, setFilterOption] = useState<string>("");

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
        setAccountPokemonList(data);
        setFilteredPokemonList(
          pokemonList.filter((pokemon) =>
            data.some(
              (entry: any) =>
                entry.name.toLowerCase() === pokemon.name.toLowerCase()
            )
          )
        );
      }
    };

    fetchAccountPokemon();
  }, [selectedAccount, pokemonList]);

  useEffect(() => {
    let updatedList = accountPokemonList;

    if (filterOption !== "") {
      switch (filterOption) {
        case "shinyYes":
          updatedList = updatedList.filter((entry) => entry.is_shiny);
          break;
        case "iv100":
          updatedList = updatedList.filter(
            (entry) => parseFloat(entry.iv) === 100
          );
          break;
        case "shinyNo":
          updatedList = accountPokemonList.filter(
            (pokemon) =>
              !accountPokemonList.some(
                (entry) =>
                  entry.name.toLowerCase() === pokemon.name.toLowerCase() &&
                  entry.is_shiny
              )
          );
          break;
        case "ivNot100":
          updatedList = accountPokemonList.filter(
            (pokemon) =>
              !accountPokemonList.some(
                (entry) =>
                  entry.name.toLowerCase() === pokemon.name.toLowerCase() &&
                  parseFloat(entry.iv) === 100
              )
          );
          break;
        case "ivRange":
          updatedList = accountPokemonList.filter(
            (pokemon) =>
              accountPokemonList.some(
                (entry) =>
                  entry.name.toLowerCase() === pokemon.name.toLowerCase() &&
                  parseFloat(entry.iv) >= 95.6 &&
                  parseFloat(entry.iv) <= 99.9
              ) &&
              !accountPokemonList.some(
                (entry) =>
                  entry.name.toLowerCase() === pokemon.name.toLowerCase() &&
                  parseFloat(entry.iv) === 100
              )
          );
          break;
        case "shundo":
          updatedList = updatedList.filter(
            (entry) => entry.is_shiny && parseFloat(entry.iv) === 100
          );
          break;
        default:
          break;
      }
    }

    if (searchQuery !== "") {
      updatedList = updatedList.filter((entry) =>
        entry.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredPokemonList(
      pokemonList.filter((pokemon) =>
        updatedList.some(
          (entry: any) =>
            entry.name.toLowerCase() === pokemon.name.toLowerCase()
        )
      )
    );
  }, [searchQuery, accountPokemonList, filterOption, pokemonList]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleAccountClick = (accountId: number) => {
    setSelectedAccount(accountId);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterOption(e.target.value);
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
      <div>
        <label>
          Filter:
          <select value={filterOption} onChange={handleFilterChange}>
            <option value="">All</option>
            <option value="shinyYes">Shiny</option>
            <option value="shinyNo">No shiny</option>
            <option value="iv100">IV 100</option>
            <option value="ivNot100">No IV 100</option>
            <option value="ivRange">IV 96 - 98</option>
            <option value="shundo">Shundo</option>
          </select>
        </label>
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
