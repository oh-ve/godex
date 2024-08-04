import React from "react";
import { useSelectedPokemon } from "./context/SelectedPokemonContext";

const Sidebar: React.FC = () => {
  const { selectedPokemon, handleSelect } = useSelectedPokemon();

  return (
    <div className="sidebar">
      <h2>Selected Pokémon</h2>
      {selectedPokemon.length === 0 && <p>No Pokémon selected.</p>}
      {selectedPokemon.map((pokemon) => (
        <div key={pokemon.id} className="selected-pokemon">
          <p>Name: {pokemon.name}</p>
          <p>IV: {pokemon.iv}</p>
          <p>Account: {pokemon.account_name}</p>
          <button onClick={() => handleSelect(pokemon)}>Deselect</button>
        </div>
      ))}
    </div>
  );
};

export default Sidebar;
