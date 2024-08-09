import { Link, useNavigate } from "react-router-dom";
import cetoddle1 from "../img/cetoddle1.png";

const Navbar: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <nav>
      <button onClick={handleLogout}>Logout</button>
      <Link to="/">Home</Link>
      <Link to="/add-pokemon">Add Pokemon</Link>
      <Link to="/user-details">User details</Link>
    </nav>
  );
};

export default Navbar;
