import { IconLogo} from "../layout/icons/IconsBiblioteca";

const Splash = () => {
  return (
    <div className="loader-container">
      <IconLogo className="text-accent" size={156} />
      <div className="loader"></div>
    </div>
  );
};

export default Splash;
