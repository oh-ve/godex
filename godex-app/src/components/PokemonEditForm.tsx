import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { parseLocation } from "../utils";

const markerIcon = new L.Icon({
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface DecodedToken {
  id: number;
  username: string;
}

interface Account {
  id: number;
  account_name: string;
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

function formatDateForInput(dateString: string): string {
  const date = new Date(dateString);
  return date.toISOString().slice(0, 16);
}

function PokemonEditForm() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [isShiny, setIsShiny] = useState(false);
  const [iv, setIv] = useState<number | string>("");
  const [date, setDate] = useState("");
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const [accountId, setAccountId] = useState<number | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPokemonDetails = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        console.log("No token found, redirecting to login.");
        navigate("/login");
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:8080/api/pokemon/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          console.log("Fetched Pokémon data:", data);
          setName(data.name);
          setNickname(data.nickname);
          setIsShiny(data.is_shiny);
          setIv(data.iv);
          setDate(formatDateForInput(data.date));
          setAccountId(data.account_id);

          if (data.location) {
            const locationCoords = parseLocation(data.location);
            if (locationCoords) {
              console.log("Parsed Pokémon location:", locationCoords); // Add this line
              const position = L.latLng(locationCoords.lat, locationCoords.lng);
              setPosition(position);
            } else {
              console.log("Failed to parse location:", data.location);
            }
          } else {
            console.log("No location data found for Pokémon.");
          }
        } else {
          console.log("Failed to fetch Pokémon details:", response.statusText);
        }
      } catch (error) {
        console.error("Error fetching Pokémon details:", error);
      }
    };

    const fetchAccounts = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        console.log("No token found, redirecting to login.");
        navigate("/login");
        return;
      }

      try {
        const response = await fetch(`http://localhost:8080/api/accounts`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setAccounts(data);
        } else {
          console.log("Failed to fetch accounts:", response.statusText);
        }
      } catch (error) {
        console.error("Error fetching accounts:", error);
      }
    };

    fetchPokemonDetails();
    fetchAccounts();
  }, [id, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      alert("You need to be logged in to update a Pokémon.");
      return;
    }

    const decodedToken = decodeJWT(token);

    const payload = {
      user_id: decodedToken.id,
      name,
      nickname,
      is_shiny: isShiny,
      iv: typeof iv === "string" ? parseFloat(iv) : iv,
      date,
      location: position
        ? `SRID=4326;POINT(${position.lng} ${position.lat})`
        : null,
      account_id: accountId,
    };

    try {
      const response = await fetch(`http://localhost:8080/api/pokemon/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to update Pokémon");
      }

      alert("Pokémon updated successfully!");
      navigate(`/pokemon/${name}?accountId=${accountId}`); // Redirect to Pokémon list page with accountId
    } catch (error) {
      alert((error as Error).message); // Explicitly type 'error' as 'Error'
    }
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
    <form onSubmit={handleSubmit}>
      <div>
        <label>
          Name:
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
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
            value={accountId ?? ""}
            onChange={(e) => setAccountId(Number(e.target.value))}
            required
          >
            <option value="" disabled>
              Select account
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
            {position && (
              <MapContainer
                center={position}
                zoom={13}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <LocationMarker />
              </MapContainer>
            )}
          </div>
        </label>
      </div>
      <button type="submit">Update Pokémon</button>
    </form>
  );
}

export default PokemonEditForm;
