import { useRef } from "react";
import PropTypes from "prop-types";

const ConfirmButton = ({ name, message, onClick, children }) => {
  const popoverRef = useRef(null);

  const handleConfirm = () => {
    popoverRef.current?.hidePopover();
    onClick();
  };

  const popoverId = `confirm-popover-${name.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <>
      <button
        popovertarget={popoverId}
        popovertargetaction="show"
        className="bg-stone-800 text-stone-400 p-2 rounded-md hover:bg-stone-700 hover:text-stone-200 transition cursor-pointer flex items-center justify-center gap-2"
      >
        {children || name}
      </button>

      <div
        ref={popoverRef}
        id={popoverId}
        popover="auto"
        className="bg-stone-900 border border-stone-700 rounded-lg p-6 m-auto  backdrop:bg-black backdrop:opacity-50"
      >
        <h3 className="text-stone-200 text-lg font-medium mb-4">Be careful</h3>
        <p className="text-stone-400 mb-6">{message || `Are you sure you want to ${name.toLowerCase()}?`}</p>
        <div className="flex gap-3 justify-end">
          <button
            className="px-4 py-2 text-stone-400 hover:text-stone-200 transition cursor-pointer"
            popovertarget={popoverId}
            popovertargetaction="hide"
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition cursor-pointer"
            onClick={handleConfirm}
          >
            {name}
          </button>
        </div>
      </div>
    </>
  );
};

ConfirmButton.propTypes = {
  name: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  children: PropTypes.node,
};

export default ConfirmButton;
