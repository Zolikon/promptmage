import PropTypes from "prop-types";

const Button = ({ name, onClick, disabled = false, children }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center py-2 px-4 rounded-lg text-stone-200 ${
        disabled ? "bg-gray-400" : "bg-green-600 hover:bg-green-800 cursor-pointer"
      } transition-colors duration-200`}
    >
      {name ? name : children}
    </button>
  );
};

Button.propTypes = {
  name: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  children: PropTypes.node,
  disabled: PropTypes.bool,
};

export default Button;
