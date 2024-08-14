import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { parseLocation, capitalize } from "../utils";
import type { Account } from "../types";

const markerIcon = new L.Icon({
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const UserDetails: React.FC = () => {
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [homePosition, setHomePosition] = useState<L.LatLng | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [newAccount, setNewAccount] = useState<string>("");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: string;
  }>({ key: "account_name", direction: "ascending" });

  useEffect(() => {
    const fetchUserDetails = async () => {
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
        setUsername(capitalize(data.user.username));
        if (data.user.home) {
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
        setAccounts(
          data.map((account: any) => ({
            account_name: account.account_name,
            avg_iv: Number(account.avg_iv),
            is_main: account.is_main,
            num_shiny: account.num_shiny,
            num_hundos: account.num_hundos,
            num_shundos: account.num_shundos,
          }))
        );
      }
    };

    fetchUserDetails();
    fetchUserAccounts();
  }, []);

  const sortedAccounts = [...accounts].sort((a, b) => {
    if ((a as any)[sortConfig.key] < (b as any)[sortConfig.key]) {
      return sortConfig.direction === "ascending" ? -1 : 1;
    }
    if ((a as any)[sortConfig.key] > (b as any)[sortConfig.key]) {
      return sortConfig.direction === "ascending" ? 1 : -1;
    }
    return 0;
  });

  const requestSort = (key: string) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
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

  const handleSubmit = async () => {
    if (position) {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("You need to be logged in to update your home location");
        return;
      }

      const response = await fetch(
        "https://godex-7rfv.onrender.com/api/update-home",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            home: `SRID=4326;POINT(${position.lng} ${position.lat})`,
          }),
        }
      );

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

    const response = await fetch(
      "https://godex-7rfv.onrender.com/api/accounts",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          account_name: newAccount,
        }),
      }
    );

    if (response.ok) {
      setAccounts([
        ...accounts,
        {
          account_name: newAccount,
          avg_iv: 0,
          is_main: false,
          num_shiny: 0,
          num_hundos: 0,
          num_shundos: 0,
        },
      ]);
      setNewAccount("");
    } else {
      alert("Failed to add new account.");
    }
  };

  return (
    <div className="user-details">
      {username && <h2>Username: {username}</h2>}
      <h3>Home Location</h3>
      {homePosition && (
        <MapContainer center={homePosition} zoom={13} className="map-container">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <LocationMarker />
        </MapContainer>
      )}
      <button onClick={handleSubmit}>Update Home Location</button>
      <h3>Accounts</h3>
      <table>
        <thead>
          <tr>
            <th onClick={() => requestSort("account_name")}>Account</th>
            <th onClick={() => requestSort("avg_iv")}>Average IV</th>
            <th onClick={() => requestSort("num_shiny")}>Number of Shiny</th>
            <th onClick={() => requestSort("num_hundos")}>Number of Hundos</th>
            <th onClick={() => requestSort("num_shundos")}>
              Number of Shundos
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedAccounts.map((account, index) => (
            <tr key={index}>
              <td style={{ fontWeight: account.is_main ? "bold" : "normal" }}>
                {account.account_name}
              </td>
              <td>
                {typeof account.avg_iv === "number"
                  ? account.avg_iv.toFixed(2)
                  : "N/A"}{" "}
                %
              </td>
              <td>{account.num_shiny}</td>
              <td>{account.num_hundos}</td>
              <td>{account.num_shundos}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="input-row">
        <input
          type="text"
          value={newAccount}
          onChange={(e) => setNewAccount(e.target.value)}
          placeholder="New Account"
        />
        <button onClick={handleAddAccount}>Add Account</button>
      </div>
    </div>
  );
};

export default UserDetails;
