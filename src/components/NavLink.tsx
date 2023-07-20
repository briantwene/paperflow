import { Link } from "@tanstack/router";

const NavLink = ({ item: { path, title, icon } }) => {
  const baseStyle =
    "flex m-4 text-lg font-medium rounded-lg cursor-pointer hover:bg-primary items-center px-4 py-2 grow ";
  const activeStyle = `${baseStyle} cursor-pointer bg-primary text-white`;
  return (
    <li>
      <Link
        activeProps={{ className: activeStyle }}
        className={baseStyle}
        to={path}
      >
        <span className="text-2xl">{icon}</span>
        <span className="ml-4">{title}</span>
      </Link>
    </li>
  );
};

export default NavLink;
