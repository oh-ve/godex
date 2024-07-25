import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { UserPokemon } from "../types";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { parseLocation } from "../utils";
import { capitalize } from "../utils";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const markerIcon = new L.Icon({
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const PokemonList: React.FC = () => {
  const { name } = useParams<{ name: string }>();
  const [pokemonList, setPokemonList] = useState<UserPokemon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof UserPokemon;
    direction: "asc" | "desc";
  } | null>(null);

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

    const sortedData = [...pokemonList].sort((a, b) => {
      if (a[key] < b[key]) {
        return direction === "asc" ? -1 : 1;
      }
      if (a[key] > b[key]) {
        return direction === "asc" ? 1 : -1;
      }
      return 0;
    });

    setPokemonList(sortedData);
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
            <th>Location</th>
          </tr>
        </thead>
        <tbody>
          {pokemonList.map((pokemon) => {
            const location = parseLocation(pokemon.location);
            const distance = parseFloat(pokemon.distance);
            return (
              <tr key={pokemon.id}>
                <td>{pokemon.name}</td>
                <td>{pokemon.nickname}</td>
                <td>{pokemon.iv}</td>
                <td>{pokemon.is_shiny ? "Yes" : "No"}</td>
                <td>{distance ? distance.toFixed(2) : "N/A"}</td>
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
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default PokemonList;
