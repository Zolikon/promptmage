import { BASE_PROMPT } from "../basePrompt";
import ConfirmButton from "./ConfirmButton";
import { MdFiberNew, MdDelete, MdOutlineDocumentScanner } from "react-icons/md";
import { FaClipboard } from "react-icons/fa";
import CopyButton from "./CopyButton";
import PropTypes from "prop-types";
import { AnimatePresence, motion } from "motion/react";

const convertForJsonInsertion = (text) => {
  return text.replace(/"/g, '\\"').replace(/\n/g, "\\n");
};

const convertFromJsonInsertion = (text) => {
  return text.replace(/\\"/g, '"').replace(/\\n/g, "\n");
};

const readTextFromClipboard = async () => {
  try {
    const text = await navigator.clipboard.readText();
    return text;
  } catch (error) {
    console.error("Failed to read clipboard contents:", error);
    return "";
  }
};

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
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.2, delay: 0.1 }}
            >
              <ConfirmButton
                key="new-prompt"
                name="New"
                message={"Are you sure you want to start a new prompt?"}
                onClick={() => updateValue(BASE_PROMPT)}
              >
                <MdFiberNew size={32} />
                Prompt
              </ConfirmButton>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.2, delay: 0.15 }}
            >
              <ConfirmButton
                key="clear-prompt"
                name="Clear"
                message={"Are you sure you want to clear current prompt?"}
                onClick={() => updateValue("")}
              >
                <MdDelete size={24} />
                Prompt
              </ConfirmButton>
            </motion.div>

            <motion.div
              className="flex flex-col gap-3 items-center justify-center bg-stone-800 text-stone-400 p-2 rounded-md w-2/3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              transition={{ duration: 0.25, delay: 0.2 }}
            >
              <p className="flex items-center justify-center gap-2">
                Import from <FaClipboard size={24} />
              </p>
              <div className="flex gap-3">
                <div className="flex flex-col items-center justify-center gap-3">
                  <p className="font-bold select-auto">MD</p>
                  <ConfirmButton
                    onClick={() => readTextFromClipboard().then((text) => updateValue(text))}
                    name="Paste Markdown"
                    message="This will override current prompt, are you sure?"
                  >
                    <MdOutlineDocumentScanner size={32} />
                  </ConfirmButton>
                </div>
                <div className="w-[5px] bg-stone-900 h-full" />
                <div className="flex flex-col items-center justify-center gap-3">
                  <p className="font-bold select-auto">JSON</p>
                  <ConfirmButton
                    onClick={() => readTextFromClipboard().then((text) => updateValue(convertFromJsonInsertion(text)))}
                    name="Paste from JSON"
                    message="This will override current prompt, are you sure?"
                  >
                    <MdOutlineDocumentScanner size={32} />
                  </ConfirmButton>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="flex flex-col gap-3 items-center justify-center bg-stone-800 text-stone-400 p-2 rounded-md w-2/3 select-none"
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
          Export to <FaClipboard size={24} />
        </p>
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
