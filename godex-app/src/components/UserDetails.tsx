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

const UserDetails: React.FC = () => {
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const [username, setUsername] = useState<string | null>(null);

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
            setPosition(L.latLng(homeCoords.lat, homeCoords.lng));
          } else {
            console.error("Failed to parse home location:", data.user.home);
          }
        }
      }
    };

    fetchUserDetails();
  }, []);

  const LocationMarker = () => {
    const map = useMap();
    useEffect(() => {
      if (position) {
        map.setView(position, map.getZoom());
      }
    }, [position, map]);

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
        alert("Home location updated successfully!");
      } else {
        alert("Failed to update home location.");
      }
    } else {
      alert("Please select a location on the map.");
    }
  };

  return (
    <div>
      <h2>User Details</h2>
      {username && <p>Username: {username}</p>}
      <h2>Update Home Location</h2>
      <MapContainer
        center={position || [51.505, -0.09]}
        zoom={13}
        style={{ height: "400px", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <LocationMarker />
      </MapContainer>
      <button onClick={handleSubmit}>Update Home Location</button>
    </div>
  );
};

export default UserDetails;
