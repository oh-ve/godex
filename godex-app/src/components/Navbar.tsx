import { Link, useNavigate } from "react-router-dom";
import cetoddle1 from "../img/cetoddle1.png";
import { useSelectedPokemon } from "./context/SelectedPokemonContext";

interface NavbarProps {
  toggleSidebar: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const { selectedPokemon } = useSelectedPokemon();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="navlinks-left">
        <img
          src={cetoddle1}
          alt="Logo"
          style={{ height: "50px", marginRight: "1rem" }}
        />
        <Link to="/">Home</Link>
        <Link to="/add-pokemon">Add Pokemon</Link>
        <Link to="/user-details">User details</Link>
        <button onClick={toggleSidebar}>
          Show selected ({selectedPokemon.length})
        </button>
      </div>
      <button onClick={handleLogout}>Logout</button>
    </nav>
  );
};

export default Navbar;
