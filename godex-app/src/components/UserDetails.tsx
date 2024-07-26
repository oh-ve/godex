import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { parseLocation } from "../utils";

const markerIcon = new L.Icon({
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const UserDetails: React.FC = () => {
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [homePosition, setHomePosition] = useState<L.LatLng | null>(null);
  const [accounts, setAccounts] = useState<string[]>([]);
  const [newAccount, setNewAccount] = useState<string>("");

  useEffect(() => {
    const fetchUserDetails = async () => {
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
        setUsername(data.user.username);
        if (data.user.home) {
          console.log("Raw home data:", data.user.home);
          const homeCoords = parseLocation(data.user.home);
          if (homeCoords) {
            setHomePosition(L.latLng(homeCoords.lat, homeCoords.lng));
            setPosition(L.latLng(homeCoords.lat, homeCoords.lng));
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

      const response = await fetch("http://localhost:8080/api/accounts", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAccounts(data.map((account: any) => account.account_name));
      }
    };

    fetchUserDetails();
    fetchUserAccounts();
  }, []);

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

  const handleSubmit = async () => {
    if (position) {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("You need to be logged in to update your home location");
        return;
      }

      const response = await fetch("http://localhost:8080/api/update-home", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          home: `SRID=4326;POINT(${position.lng} ${position.lat})`,
        }),
      });

      if (response.ok) {
        alert("Home location changed!");
      } else {
        alert("Failed to update home location.");
      }
    } else {
      alert("Please select a location on the map.");
    }
  };

  const handleAddAccount = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You need to be logged in to add an account");
      return;
    }

    const response = await fetch("http://localhost:8080/api/accounts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        account_name: newAccount,
      }),
    });

    if (response.ok) {
      setAccounts([...accounts, newAccount]);
      setNewAccount("");
    } else {
      alert("Failed to add new account.");
    }
  };

  return (
    <div>
      <h2>User Details</h2>
      {username && <p>Username: {username}</p>}
      <h2>Update Home Location</h2>
      {homePosition && (
        <MapContainer
          center={homePosition}
          zoom={13}
          style={{ height: "400px", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <LocationMarker />
        </MapContainer>
      )}
      <button onClick={handleSubmit}>Update Home Location</button>
      <h2>Accounts</h2>
      <ul>
        {accounts.map((account, index) => (
          <li key={index}>{account}</li>
        ))}
      </ul>
      <input
        type="text"
        value={newAccount}
        onChange={(e) => setNewAccount(e.target.value)}
        placeholder="New Account"
      />
      <button onClick={handleAddAccount}>Add Account</button>
    </div>
  );
};

export default UserDetails;
