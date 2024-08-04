import { createContext, useContext, useState, ReactNode } from "react";
import { UserPokemon } from "../../types";

interface SelectedPokemonContextType {
  selectedPokemon: UserPokemon[];
  handleSelect: (pokemon: UserPokemon) => void;
}

const SelectedPokemonContext = createContext<
  SelectedPokemonContextType | undefined
>(undefined);

export const useSelectedPokemon = () => {
  const context = useContext(SelectedPokemonContext);
  if (!context) {
    throw new Error(
      "useSelectedPokemon must be used within a SelectedPokemonProvider"
    );
  }
  return context;
};

export const SelectedPokemonProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [selectedPokemon, setSelectedPokemon] = useState<UserPokemon[]>([]);

  const handleSelect = (pokemon: UserPokemon) => {
    setSelectedPokemon((prevSelected) => {
      if (prevSelected.some((p) => p.id === pokemon.id)) {
        return prevSelected.filter((p) => p.id !== pokemon.id);
      } else {
        return [...prevSelected, pokemon];
      }
    });
  };

  return (
    <SelectedPokemonContext.Provider value={{ selectedPokemon, handleSelect }}>
      {children}
    </SelectedPokemonContext.Provider>
  );
};
