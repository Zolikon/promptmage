import { FaClipboard } from "react-icons/fa";
import CopyButton from "./CopyButton";
import PropTypes from "prop-types";
import { motion } from "motion/react";
import { convertForJsonInsertion } from "./clipboardUtils";

const PromptMenu = ({ value, updateValue, inEditMode }) => {
  return (
    <div className="w-full flex flex-col items-center justify-center gap-3">
      <motion.div
        className="flex gap-4 items-center justify-center bg-stone-800 text-stone-400 p-2 rounded-md w-full select-none"
        initial={{ y: 0, opacity: 1 }}
        animate={{
          y: 0,
          opacity: 1,
        }}
        layout
      >
        <div className="flex items-center gap-2">
          <p className="font-bold text-sm">MD</p>
          <CopyButton textToCopy={value} />
        </div>
        <div className="w-[1px] bg-stone-600 h-6" />
        <div className="flex items-center gap-2">
          <p className="font-bold text-sm">JSON</p>
          <CopyButton textToCopy={convertForJsonInsertion(value)} />
        </div>
      </motion.div>
    </div>
  );
};

PromptMenu.propTypes = {
  value: PropTypes.string.isRequired,
  updateValue: PropTypes.func.isRequired,
  inEditMode: PropTypes.bool,
};

export default PromptMenu;
