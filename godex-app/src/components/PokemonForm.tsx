import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
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

function PokemonForm() {
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [isShiny, setIsShiny] = useState(false);
  const [iv, setIv] = useState<number | string>("");
  const [date, setDate] = useState("");
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const [homePosition, setHomePosition] = useState<L.LatLng | null>(null);

  useEffect(() => {
    const fetchUserHome = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        return;
      }

      const response = await fetch("http://localhost:8080/api/protected", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.user.home) {
          console.log("Raw home data:", data.user.home);
          const homeCoords = parseLocation(data.user.home);
          if (homeCoords) {
            const homePosition = L.latLng(homeCoords.lat, homeCoords.lng);
            setHomePosition(homePosition);
            setPosition(homePosition); // Set initial marker at home position
          } else {
            console.error("Failed to parse home location:", data.user.home);
          }
        }
      }
    };

    fetchUserHome();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      alert("You need to be logged in to add a Pokémon.");
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
    };

    try {
      const response = await fetch("http://localhost:8080/api/pokemon", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to add Pokémon");
      }

      alert("Pokémon added successfully!");
      // Optionally reset the form
      setName("");
      setNickname("");
      setIsShiny(false);
      setIv("");
      setDate("");
      setPosition(homePosition); // Reset to home position
    } catch (error) {
      alert((error as Error).message); // Explicitly type 'error' as 'Error'
    }
  };

  const LocationMarker = () => {
    const map = useMap();

    useEffect(() => {
      if (homePosition) {
        map.setView(homePosition, map.getZoom());
      }
    }, [homePosition, map]);

    useMapEvents({
      click(e) {
        setPosition(e.latlng);
        map.flyTo(e.latlng, map.getZoom());
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
          Location (Pick from map):
          <div style={{ height: "400px", width: "100%" }}>
            <MapContainer
              center={homePosition || [51.505, -0.09]}
              zoom={13}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <LocationMarker />
            </MapContainer>
          </div>
        </label>
      </div>
      <button type="submit">Add Pokémon</button>
    </form>
  );
}

export default PokemonForm;
