export interface Pokemon {
  id: number;
  name: string;
  type: string;
  sprite: string;
}

export interface UserPokemon {
  id: number;
  user_id: number;
  name: string;
  nickname: string;
  is_shiny: boolean;
  iv: number;
  date: string;
  location: string;
  distance: string;
}
