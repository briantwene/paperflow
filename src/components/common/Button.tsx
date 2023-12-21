// TODO: Make this a proper reusable button: https://www.smashingmagazine.com/2020/05/reusable-react-components-tailwind/

type Props = {
  text: string;
  onClick: () => void;
};
const Button = ({ text, onClick }: Props) => {
  return (
    <button
      type="button"
      className="inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white transition-all bg-blue-500 border border-transparent rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
      onClick={onClick}
    >
      {text}
    </button>
  );
};

export default Button;
