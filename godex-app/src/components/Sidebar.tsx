import React from "react";
import { useSelectedPokemon } from "./context/SelectedPokemonContext";

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const { selectedPokemon, handleSelect } = useSelectedPokemon();

  if (!isOpen) return null;

  return (
    <div className="sidebar">
      <h2>Selected Pokémon</h2>
      {selectedPokemon.length === 0 && <p>No Pokémon selected.</p>}
      {selectedPokemon.map((pokemon) => (
        <div key={pokemon.id} className="selected-pokemon">
          <p>Name: {pokemon.name}</p>
          <p>WP: {pokemon.wp}</p>
          <p>IV: {pokemon.iv}</p>
          <p>Account: {pokemon.account_name}</p>
          {pokemon.sprite && <img src={pokemon.sprite} alt={pokemon.name} />}
          <button onClick={() => handleSelect(pokemon)}>Deselect</button>
        </div>
      ))}
    </div>
  );
};

export default Sidebar;
