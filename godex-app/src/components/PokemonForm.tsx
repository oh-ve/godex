import { useState } from "react";

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
  const [location, setLocation] = useState("");
  const [distance, setDistance] = useState(false);

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
      location,
      distance,
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
      setLocation("");
      setDistance(false);
    } catch (error) {
      alert((error as Error).message); // Explicitly type 'error' as 'Error'
    }
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
          Location (GeoData):
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />
        </label>
      </div>
      <div>
        <label>
          Distance:
          <input
            type="checkbox"
            checked={distance}
            onChange={(e) => setDistance(e.target.checked)}
          />
        </label>
      </div>
      <button type="submit">Add Pokémon</button>
    </form>
  );
}

export default PokemonForm;
