import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { UserPokemon } from "../types";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { parseLocation, capitalize } from "../utils";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useLocation } from "react-router-dom";
import { useSelectedPokemon } from "./context/SelectedPokemonContext";

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
  const [filter100iv, setFilter100iv] = useState(false);
  const [filter95to99iv, setFilter95to99iv] = useState(false);
  const [filterLessThan95iv, setFilterLessThan95iv] = useState(false);
  const navigate = useNavigate();
  const { selectedPokemon, handleSelect } = useSelectedPokemon();

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
      if (filter100iv) {
        filteredList = filteredList.filter(
          (pokemon) => Number(pokemon.iv) === 100
        );
      }
      if (filter95to99iv) {
        filteredList = filteredList.filter(
          (pokemon) => Number(pokemon.iv) >= 95 && Number(pokemon.iv) < 100
        );
      }
      if (filterLessThan95iv) {
        filteredList = filteredList.filter(
          (pokemon) => Number(pokemon.iv) < 95
        );
      }

      setFilteredPokemonList(filteredList);
    };

    applyFilters();
  }, [
    filterShiny,
    filter100iv,
    filter95to99iv,
    filterLessThan95iv,
    pokemonList,
  ]);

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

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <div>
      <h1>{name ? capitalize(name) : ""}</h1>
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
            checked={filter100iv}
            onChange={(e) => setFilter100iv(e.target.checked)}
          />
          100 IV
        </label>
        <label>
          <input
            type="checkbox"
            checked={filter95to99iv}
            onChange={(e) => setFilter95to99iv(e.target.checked)}
          />
          IV 95-99
        </label>
        <label>
          <input
            type="checkbox"
            checked={filterLessThan95iv}
            onChange={(e) => setFilterLessThan95iv(e.target.checked)}
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
            <th>Actions</th> {/* Added column for actions */}
          </tr>
        </thead>
        <tbody>
          {filteredPokemonList.map((pokemon) => {
            const location = parseLocation(pokemon.location);
            const distance = parseFloat(pokemon.distance);
            const year = new Date(pokemon.date).getFullYear();
            const isSelected = selectedPokemon.some((p) => p.id === pokemon.id); // Check if Pokémon is selected
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
                    Edit
                  </button>
                  <button onClick={() => handleDelete(pokemon.id)}>
                    Delete
                  </button>
                  <button onClick={() => handleSelect(pokemon)}>
                    {isSelected ? "Deselect" : "Select"}
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
