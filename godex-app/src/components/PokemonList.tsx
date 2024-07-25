import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { UserPokemon } from "../types";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { parseLocation } from "../utils";
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
        {pokemonList.map((pokemon) => {
          const location = parseLocation(pokemon.location);
          return (
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
              {location && (
                <MapContainer
                  center={[location.lat, location.lng]}
                  zoom={13}
                  style={{ height: "200px", width: "100%" }}
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
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default PokemonList;
