import { Link, useNavigate } from "react-router-dom";
import cetoddle1 from "../img/cetoddle1.png";
import { useSelectedPokemon } from "./context/SelectedPokemonContext";

interface NavbarProps {
  toggleSidebar: () => void;
  isOpen: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ toggleSidebar, isOpen }) => {
  const navigate = useNavigate();
  const { selectedPokemon } = useSelectedPokemon();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <img
        src={cetoddle1}
        alt="Logo"
        style={{ height: "50px", marginRight: "1rem" }}
      />
      <Link to="/">Home</Link>
      <Link to="/add-pokemon">Add Pokemon</Link>
      <Link to="/user-details">User details</Link>
      <button onClick={toggleSidebar}>
        {isOpen
          ? `Hide selected (${selectedPokemon.length})`
          : `Show selected (${selectedPokemon.length})`}
      </button>
      <button onClick={handleLogout}>Logout</button>
    </nav>
  );
};

export default Navbar;
