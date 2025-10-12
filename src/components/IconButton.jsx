import PropTypes from "prop-types";

const IconButton = ({ iconName, onClick }) => {
  return (
    <button
      className=" p-2 flex items-center justify-center rounded-full aspect-square w-12 hover:bg-slate-300"
      onClick={onClick}
    >
      <i className="material-symbols-outlined">{iconName}</i>
    </button>
  );
};

IconButton.propTypes = {
  iconName: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
};

export default IconButton;
