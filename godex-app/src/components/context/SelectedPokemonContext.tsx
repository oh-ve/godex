import React, { createContext, useContext, useState, ReactNode } from "react";
import { UserPokemon } from "../../types";

interface SelectedPokemon extends UserPokemon {
  sprite: string;
}

interface SelectedPokemonContextProps {
  selectedPokemon: SelectedPokemon[];
  handleSelect: (pokemon: UserPokemon) => void;
}

const SelectedPokemonContext = createContext<
  SelectedPokemonContextProps | undefined
>(undefined);

export const SelectedPokemonProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [selectedPokemon, setSelectedPokemon] = useState<SelectedPokemon[]>([]);

  const fetchSprite = async (name: string) => {
    try {
      const response = await fetch(
        `https://pokeapi.co/api/v2/pokemon/${name.toLowerCase()}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch sprite");
      }
      const data = await response.json();
      return data.sprites.front_default;
    } catch (error) {
      console.error("Error fetching sprite:", error);
      return ""; // Return an empty string or a placeholder image URL
    }
  };

  const handleSelect = async (pokemon: UserPokemon) => {
    const sprite = await fetchSprite(pokemon.name);
    setSelectedPokemon((prevSelected) => {
      const isSelected = prevSelected.some((p) => p.id === pokemon.id);
      if (isSelected) {
        return prevSelected.filter((p) => p.id !== pokemon.id);
      } else {
        return [...prevSelected, { ...pokemon, sprite }];
      }
    });
  };

  return (
    <SelectedPokemonContext.Provider value={{ selectedPokemon, handleSelect }}>
      {children}
    </SelectedPokemonContext.Provider>
  );
};

export const useSelectedPokemon = (): SelectedPokemonContextProps => {
  const context = useContext(SelectedPokemonContext);
  if (!context) {
    throw new Error(
      "useSelectedPokemon must be used within a SelectedPokemonProvider"
    );
  }
  return context;
};
