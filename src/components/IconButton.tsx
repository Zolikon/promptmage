interface IconButtonProps {
  iconName: string;
  onClick: () => void;
  disabled?: boolean;
}

const IconButton = ({ iconName, onClick, disabled }: IconButtonProps) => {
  return (
    <button
      className={`p-2 flex items-center justify-center rounded-full aspect-square w-12 hover:scale-110 transition-transform ${
        disabled ? "opacity-50 cursor-default" : "cursor-pointer"
      }`}
      onClick={onClick}
      disabled={disabled}
    >
      <i className="material-symbols-outlined">{iconName}</i>
    </button>
  );
};

export default IconButton;
