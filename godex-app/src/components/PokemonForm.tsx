import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { parseLocation, capitalize } from "../utils";

const markerIcon = new L.Icon({
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface DecodedToken {
  id: number;
  username: string;
}

interface PokemonFormProps {
  allPokemonNames: string[];
}

function decodeJWT(token: string): DecodedToken {
  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split("")
      .map(function (c) {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join("")
  );

  return JSON.parse(jsonPayload);
}

function formatDateForInput(date: Date): string {
  return date.toISOString().slice(0, 16);
}

function PokemonForm({ allPokemonNames }: PokemonFormProps) {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [wp, setWp] = useState<number | string>("");
  const [nickname, setNickname] = useState("");
  const [isShiny, setIsShiny] = useState(false);
  const [iv, setIv] = useState<number | string>("");
  const [date, setDate] = useState(formatDateForInput(new Date()));
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const [homePosition, setHomePosition] = useState<L.LatLng | null>(null);
  const [accounts, setAccounts] = useState<
    { id: number; account_name: string }[]
  >([]);
  const [selectedAccount, setSelectedAccount] = useState<number | null>(null);
  const [filteredPokemonNames, setFilteredPokemonNames] = useState<string[]>(
    []
  );

  useEffect(() => {
    const fetchUserHome = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        return;
      }

      const response = await fetch(
        "https://godex-7rfv.onrender.com/api/protected",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.user.home) {
          console.log("Raw home data:", data.user.home);
          const homeCoords = parseLocation(data.user.home);
          if (homeCoords) {
            const homePosition = L.latLng(homeCoords.lat, homeCoords.lng);
            setHomePosition(homePosition);
            setPosition(homePosition);
          } else {
            console.error("Failed to parse home location:", data.user.home);
          }
        }
      }
    };

    const fetchUserAccounts = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        return;
      }

      const response = await fetch(
        "https://godex-7rfv.onrender.com/api/accounts",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAccounts(data);
      }
    };

    fetchUserHome();
    fetchUserAccounts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      alert("You need to be logged in to add a Pokémon.");
      return;
    }

    if (!selectedAccount) {
      alert("Please select an account.");
      return;
    }

    const decodedToken = decodeJWT(token);

    const payload = {
      user_id: decodedToken.id,
      account_id: selectedAccount,
      name,
      nickname,
      is_shiny: isShiny,
      iv: typeof iv === "string" ? parseFloat(iv) : iv,
      date,
      location: position
        ? `SRID=4326;POINT(${position.lng} ${position.lat})`
        : homePosition
        ? `SRID=4326;POINT(${homePosition.lng} ${homePosition.lat})`
        : null,
      wp: typeof wp === "string" ? parseInt(wp) : wp,
    };

    try {
      const response = await fetch(
        "https://godex-7rfv.onrender.com/api/pokemon",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to add Pokémon");
      }

      alert("Pokémon added successfully!");
      navigate(`/pokemon/${name}?accountId=${selectedAccount}`);

      setName("");
      setNickname("");
      setIsShiny(false);
      setIv("");
      setDate(formatDateForInput(new Date()));
      setPosition(homePosition);
      setSelectedAccount(null);
    } catch (error) {
      alert((error as Error).message);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);

    if (value) {
      const filtered = allPokemonNames
        .filter((pokemonName) =>
          pokemonName.toLowerCase().includes(value.toLowerCase())
        )
        .slice(0, 3);
      setFilteredPokemonNames(filtered);
    } else {
      setFilteredPokemonNames([]);
    }
  };

  const handlePokemonSelect = (name: string) => {
    setName(name);
    setFilteredPokemonNames([]);
  };

  const LocationMarker = () => {
    useMapEvents({
      click(e) {
        setPosition(e.latlng);
      },
    });

    return position === null ? null : (
      <Marker position={position} icon={markerIcon}></Marker>
    );
  };

  return (
    <div className="pokemon-form">
      <form onSubmit={handleSubmit}>
        <h1>Add Pokémon</h1>
        <div>
          <label>
            Name:
            <input
              type="text"
              value={name}
              onChange={handleNameChange}
              required
            />
            {filteredPokemonNames.length > 0 && (
              <ul style={{ listStyleType: "none", padding: 0 }}>
                {filteredPokemonNames.map((pokemonName) => (
                  <li
                    key={pokemonName}
                    onClick={() => handlePokemonSelect(capitalize(pokemonName))}
                    style={{ cursor: "pointer" }}
                  >
                    {capitalize(pokemonName)}
                  </li>
                ))}
              </ul>
            )}
          </label>
        </div>
        <div>
          <label>
            WP:
            <input
              type="number"
              value={wp}
              onChange={(e) => setWp(e.target.value)}
              required
            />
          </label>
        </div>
        <div>
          <label>
            Nickname:
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </label>
        </div>
        <div>
          <label>
            Shiny:
            <input
              type="checkbox"
              checked={isShiny}
              onChange={(e) => setIsShiny(e.target.checked)}
            />
          </label>
        </div>
        <div>
          <label>
            IV:
            <input
              type="number"
              value={iv}
              onChange={(e) => setIv(e.target.value)}
              required
            />
          </label>
        </div>
        <div>
          <label>
            Date Caught:
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </label>
        </div>
        <div>
          <label>
            Account:
            <select
              value={selectedAccount ?? ""}
              onChange={(e) => setSelectedAccount(Number(e.target.value))}
              required
            >
              <option value="" disabled>
                Select an account
              </option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.account_name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div>
          <label>
            Location (Pick from map):
            <div style={{ height: "400px", width: "100%" }}>
              {homePosition && (
                <MapContainer
                  center={homePosition}
                  zoom={13}
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <LocationMarker />
                </MapContainer>
              )}
            </div>
          </label>
        </div>
        <div className="button-wrapper">
          <button type="submit">Add Pokémon</button>
        </div>
      </form>
    </div>
  );
}

export default PokemonForm;
