import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { UserPokemon } from "../types";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { parseLocation, capitalize } from "../utils";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useLocation } from "react-router-dom";
import { useSelectedPokemon } from "./context/SelectedPokemonContext";
import { MdDelete, MdModeEditOutline } from "react-icons/md";
import { FaCirclePlus, FaCircleMinus } from "react-icons/fa6";

const markerIcon = new L.Icon({
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const PokemonList: React.FC = () => {
  const { name } = useParams<{ name: string }>();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const accountId = query.get("accountId");
  const [accountName, setAccountName] = useState("");
  const [pokemonList, setPokemonList] = useState<UserPokemon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filteredPokemonList, setFilteredPokemonList] = useState<UserPokemon[]>(
    []
  );
  const [sortConfig, setSortConfig] = useState<{
    key: keyof UserPokemon;
    direction: "asc" | "desc";
  } | null>(null);
  const [filterShiny, setFilterShiny] = useState(false);
  const [activeIvFilter, setActiveIvFilter] = useState<string | null>(null); // Only one IV filter can be active at a time
  const navigate = useNavigate();
  const { selectedPokemon, handleSelect } = useSelectedPokemon();

  useEffect(() => {
    const fetchAccountName = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `http://localhost:8080/api/accounts/${accountId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!response.ok) {
          throw new Error("Failed to fetch account details");
        }
        const data = await response.json();
        setAccountName(data.account_name);
      } catch (err: any) {
        setError(err.message);
      }
    };

    fetchAccountName();
  }, [accountId]);

  useEffect(() => {
    const fetchPokemon = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `http://localhost:8080/api/pokemon/account/${accountId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!response.ok) {
          throw new Error("Failed to fetch Pokémon");
        }
        const data: UserPokemon[] = await response.json();
        const filteredData = data.filter(
          (pokemon) => pokemon.name.toLowerCase() === name?.toLowerCase()
        );
        setPokemonList(filteredData);
        setFilteredPokemonList(filteredData); // Set initial filtered list
        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchPokemon();
  }, [name, accountId]);

  useEffect(() => {
    const applyFilters = () => {
      let filteredList = pokemonList;

      if (filterShiny) {
        filteredList = filteredList.filter((pokemon) => pokemon.is_shiny);
      }
      if (activeIvFilter) {
        switch (activeIvFilter) {
          case "100iv":
            filteredList = filteredList.filter(
              (pokemon) => Number(pokemon.iv) === 100
            );
            break;
          case "95to99iv":
            filteredList = filteredList.filter(
              (pokemon) => Number(pokemon.iv) >= 95 && Number(pokemon.iv) < 100
            );
            break;
          case "lessThan95iv":
            filteredList = filteredList.filter(
              (pokemon) => Number(pokemon.iv) < 95
            );
            break;
          default:
            break;
        }
      }

      setFilteredPokemonList(filteredList);
    };

    applyFilters();
  }, [filterShiny, activeIvFilter, pokemonList]);

  const sortData = (key: keyof UserPokemon) => {
    let direction: "asc" | "desc" = "asc";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setSortConfig({ key, direction });

    const sortedData = [...filteredPokemonList].sort((a, b) => {
      if (a[key] < b[key]) {
        return direction === "asc" ? -1 : 1;
      }
      if (a[key] > b[key]) {
        return direction === "asc" ? 1 : -1;
      }
      return 0;
    });

    setFilteredPokemonList(sortedData);
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this Pokémon?"
    );
    if (!confirmed) {
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("You need to be logged in to delete a Pokémon.");
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/api/pokemon/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete Pokémon");
      }

      setPokemonList(pokemonList.filter((pokemon) => pokemon.id !== id));
      setFilteredPokemonList(
        filteredPokemonList.filter((pokemon) => pokemon.id !== id)
      );
      alert("Pokémon deleted successfully!");
    } catch (error) {
      alert((error as Error).message);
    }
  };

  const handleIvFilterChange = (filter: string) => {
    setActiveIvFilter(filter === activeIvFilter ? null : filter);
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <div className="poke-list">
      <h1>{`${accountName}'s ${capitalize(name ?? "")}s`}</h1>
      <div>
        <label>
          <input
            type="checkbox"
            checked={filterShiny}
            onChange={(e) => setFilterShiny(e.target.checked)}
          />
          Shiny
        </label>
        <label>
          <input
            type="checkbox"
            checked={activeIvFilter === "100iv"}
            onChange={() => handleIvFilterChange("100iv")}
          />
          100 IV
        </label>
        <label>
          <input
            type="checkbox"
            checked={activeIvFilter === "95to99iv"}
            onChange={() => handleIvFilterChange("95to99iv")}
          />
          IV 95-99
        </label>
        <label>
          <input
            type="checkbox"
            checked={activeIvFilter === "lessThan95iv"}
            onChange={() => handleIvFilterChange("lessThan95iv")}
          />
          IV {"<"} 95
        </label>
      </div>
      <table>
        <thead>
          <tr>
            <th onClick={() => sortData("name")}>
              Name{" "}
              {sortConfig?.key === "name"
                ? sortConfig.direction === "asc"
                  ? "↑"
                  : "↓"
                : ""}
            </th>
            <th onClick={() => sortData("wp")}>
              WP{" "}
              {sortConfig?.key === "wp"
                ? sortConfig.direction === "asc"
                  ? "↑"
                  : "↓"
                : ""}
            </th>
            <th onClick={() => sortData("nickname")}>
              Nickname{" "}
              {sortConfig?.key === "nickname"
                ? sortConfig.direction === "asc"
                  ? "↑"
                  : "↓"
                : ""}
            </th>
            <th onClick={() => sortData("iv")}>
              IV{" "}
              {sortConfig?.key === "iv"
                ? sortConfig.direction === "asc"
                  ? "↑"
                  : "↓"
                : ""}
            </th>
            <th onClick={() => sortData("is_shiny")}>
              Shiny{" "}
              {sortConfig?.key === "is_shiny"
                ? sortConfig.direction === "asc"
                  ? "↑"
                  : "↓"
                : ""}
            </th>
            <th onClick={() => sortData("distance")}>
              Distance (km){" "}
              {sortConfig?.key === "distance"
                ? sortConfig.direction === "asc"
                  ? "↑"
                  : "↓"
                : ""}
            </th>
            <th onClick={() => sortData("date")}>
              Year
              {sortConfig?.key === "date"
                ? sortConfig.direction === "asc"
                  ? "↑"
                  : "↓"
                : ""}
            </th>
            <th>Location</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filteredPokemonList.map((pokemon) => {
            const location = parseLocation(pokemon.location);
            const distance = parseFloat(pokemon.distance);
            const year = new Date(pokemon.date).getFullYear();
            const isSelected = selectedPokemon.some((p) => p.id === pokemon.id);
            return (
              <tr key={pokemon.id} className={isSelected ? "selected" : ""}>
                <td>{pokemon.name}</td>
                <td>{pokemon.wp}</td>
                <td>{pokemon.nickname}</td>
                <td>{pokemon.iv}</td>
                <td>{pokemon.is_shiny ? "Yes" : "No"}</td>
                <td>{distance ? distance.toFixed(2) : "0"}</td>
                <td>{year}</td>
                <td>
                  {location && (
                    <MapContainer
                      center={[location.lat, location.lng]}
                      zoom={5}
                      style={{ height: "120px", width: "250px" }}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      />
                      <Marker
                        position={[location.lat, location.lng]}
                        icon={markerIcon}
                      ></Marker>
                    </MapContainer>
                  )}
                </td>
                <td>
                  <button
                    onClick={() => navigate(`/edit-pokemon/${pokemon.id}`)}
                  >
                    <MdModeEditOutline />
                  </button>
                  <button onClick={() => handleDelete(pokemon.id)}>
                    <MdDelete />
                  </button>
                  <button onClick={() => handleSelect(pokemon)}>
                    {isSelected ? <FaCircleMinus /> : <FaCirclePlus />}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default PokemonList;
