import { Link } from "@tanstack/router";
import { enumObject } from "./enums";

const NavLink = (props: enumObject) => {
  const baseStyle =
    "flex m-4 text-lg font-medium rounded-lg cursor-pointer hover:bg-primary items-center px-4 py-2 grow ";
  const activeStyle = `${baseStyle} cursor-pointer bg-primary text-white`;
  return (
    <li>
      <Link
        activeProps={{ className: activeStyle }}
        className={baseStyle}
        to={props.path}
        search={{}}
        params={{}}
      >
        <span className="text-2xl">{props.icon}</span>
        <span className="ml-4">{props.title}</span>
      </Link>
    </li>
  );
};

export default NavLink;
