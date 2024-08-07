export interface Pokemon {
  id: number;
  name: string;
  type: string;
  sprite: string;
}

export interface UserPokemon {
  wp: number;
  id: number;
  user_id: number;
  name: string;
  nickname: string;
  is_shiny: boolean;
  iv: number;
  date: string;
  location: string;
  distance: string;
  account_name: string;
  sprite: any;
}

export type Account = {
  account_name: string;
  avg_iv: number;
  is_main: boolean;
  num_shiny: number;
};
