import { FaClipboard } from "react-icons/fa";
import CopyButton from "./CopyButton";
import PropTypes from "prop-types";
import { AnimatePresence, motion } from "motion/react";
import { NewMenu } from "./NewMenu";
import { convertForJsonInsertion } from "./clipboardUtils";

const PromptMenu = ({ value, updateValue, inEditMode }) => {
  return (
    <div className="w-full flex flex-col items-center justify-center gap-3">
      <AnimatePresence mode="wait">
        {inEditMode && (
          <motion.div
            key="editor-buttons"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{
              duration: 0.3,
              ease: "easeInOut",
            }}
            className="flex flex-col items-center justify-center gap-3 w-full"
          >
            <NewMenu updateValue={updateValue} />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="flex flex-col gap-1 items-center justify-center bg-stone-800 text-stone-400 p-2 rounded-md w-2/3 select-none"
        initial={{ y: 0, opacity: 1 }}
        animate={{
          y: inEditMode ? 0 : -10,
          opacity: 1,
        }}
        transition={{
          duration: 0.4,
          delay: inEditMode ? 0 : 0.3,
          ease: "easeOut",
        }}
        layout
      >
        <p className="flex items-center justify-center gap-2">
          Copy to <FaClipboard size={24} />
        </p>
        <p>as</p>
        <div className="flex gap-3">
          <div className="flex flex-col items-center justify-center gap-3">
            <p className="font-bold select-auto">MD</p>
            <CopyButton textToCopy={value} />
          </div>
          <div className="w-[5px] bg-stone-900 h-full" />
          <div className="flex flex-col items-center justify-center gap-3">
            <p className="font-bold select-auto">JSON</p>
            <CopyButton textToCopy={convertForJsonInsertion(value)} />
          </div>
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
