import { forwardRef } from "react";
import { useSelectedPokemon } from "./context/SelectedPokemonContext";

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar = forwardRef<HTMLDivElement, SidebarProps>(({ isOpen }, ref) => {
  const { selectedPokemon, handleSelect } = useSelectedPokemon();

  if (!isOpen) return null;

  return (
    <div ref={ref} className={`sidebar ${isOpen ? "open" : ""}`}>
      <h2>Selected Pokémon</h2>
      {selectedPokemon.length === 0 && <p>No Pokémon selected.</p>}
      {selectedPokemon.map((pokemon) => (
        <div key={pokemon.id} className="selected-pokemon">
          <div className="selected-pokemon-info">
            <div className="selected-pokemon-text">
              <span>{pokemon.account_name}'s </span>
              <span>
                <h3>{pokemon.name}</h3>
              </span>
              <p>{pokemon.wp} CP</p>
              <p>IV {pokemon.iv}</p>
            </div>
            {pokemon.sprite && <img src={pokemon.sprite} alt={pokemon.name} />}
          </div>
          <button onClick={() => handleSelect(pokemon)}>Deselect</button>
        </div>
      ))}
    </div>
  );
});

export default Sidebar;
