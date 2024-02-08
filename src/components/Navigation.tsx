import { navEnum } from "./enums";
import NavLink from "./NavLink";
//import PaperFlowLight from "../assets/paperFlowLight.svg";
import PaperFlowDark from "../assets/paperFlowDark.svg";
const Navigation = () => {

  return (
    <nav className="flex flex-col border-r border-slate-900/10 dark:border-white/10">
      <header className="flex h-24 border-b border-slate-900/10 dark:border-white/10">
        <img src={PaperFlowDark} className="p-6" />
      </header>
      <div className=" grow">
        <ul className="flex flex-col justify-between">
          {navEnum.map((item, key) => (
            <NavLink key={key} {...item} />
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default Navigation;
