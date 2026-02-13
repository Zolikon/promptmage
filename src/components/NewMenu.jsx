import { motion, AnimatePresence } from "motion/react";
import { BASE_PROMPT } from "../basePrompt";
import { MdFiberNew, MdClose, MdArrowBack } from "react-icons/md";
import { FaClipboard, FaMarkdown } from "react-icons/fa";
import { BsFiletypeJson } from "react-icons/bs";
import { convertFromJsonInsertion, readTextFromClipboard } from "./clipboardUtils";
import PropTypes from "prop-types";
import { useState, useRef, useEffect } from "react";

export const NewMenu = ({ addPrompt }) => {
  const [step, setStep] = useState("name"); // "name" | "options"
  const [promptName, setPromptName] = useState("");
  const nameInputRef = useRef(null);
  const popoverRef = useRef(null);

  // Focus name input when popover opens
  useEffect(() => {
    const popover = popoverRef.current;
    if (!popover) return;

    const handleToggle = (e) => {
      if (e.newState === "open" && step === "name") {
        setTimeout(() => nameInputRef.current?.focus(), 100);
      } else if (e.newState === "closed") {
        // Reset state when popover closes
        setStep("name");
        setPromptName("");
      }
    };

    popover.addEventListener("toggle", handleToggle);
    return () => popover.removeEventListener("toggle", handleToggle);
  }, [step]);

  const handleNext = () => {
    if (promptName.trim()) {
      setStep("options");
    }
  };

  const handleBack = () => {
    setStep("name");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && promptName.trim()) {
      handleNext();
    }
  };

  const createPromptWithContent = (content) => {
    addPrompt({
      name: promptName.trim(),
      content: content,
    });
    // Close popover
    if (popoverRef.current) {
      popoverRef.current.hidePopover();
    }
  };

  const handleCreateEmpty = () => {
    createPromptWithContent("");
  };

  const handleCreateBase = () => {
    createPromptWithContent(BASE_PROMPT);
  };

  const handleCreateFromClipboardMd = async () => {
    const text = await readTextFromClipboard();
    createPromptWithContent(text);
  };

  const handleCreateFromClipboardJson = async () => {
    const text = await readTextFromClipboard();
    createPromptWithContent(convertFromJsonInsertion(text));
  };

  return (
    <>
      <motion.button
        popovertarget="confirm-popover-new"
        popovertargetaction="show"
        className="bg-stone-800 text-stone-400 p-2 rounded-md hover:bg-stone-700 hover:text-stone-200 transition cursor-pointer flex items-center justify-center gap-2 w-2/3"
      >
        <MdFiberNew size={32} />
      </motion.button>
      <div
        ref={popoverRef}
        id="confirm-popover-new"
        popover="auto"
        className="bg-stone-900 border border-stone-700 rounded-lg p-6 m-auto backdrop:bg-black backdrop:opacity-50 relative w-[90vw] max-w-[400px]"
      >
        <button
          className="px-4 py-2 text-stone-400 hover:text-stone-200 transition cursor-pointer absolute top-2 right-2"
          popovertarget="confirm-popover-new"
          popovertargetaction="hide"
        >
          <MdClose size={24} />
        </button>

        <AnimatePresence mode="wait">
          {step === "name" ? (
            <motion.div
              key="name-step"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-stone-200 text-lg font-medium mb-4">New Prompt</h3>
              <p className="text-stone-400 mb-4">Enter a name for your new prompt</p>
              <input
                ref={nameInputRef}
                type="text"
                value={promptName}
                onChange={(e) => setPromptName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Prompt name..."
                className="w-full bg-stone-800 text-stone-200 rounded p-2 border border-stone-700 focus:border-blue-500 outline-none mb-4"
              />
              <button
                onClick={handleNext}
                disabled={!promptName.trim()}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition cursor-pointer disabled:bg-stone-700 disabled:cursor-not-allowed disabled:text-stone-500"
              >
                Next
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="options-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={handleBack}
                  className="p-1 hover:bg-stone-800 rounded transition"
                  title="Back"
                >
                  <MdArrowBack size={20} className="text-stone-400" />
                </button>
                <h3 className="text-stone-200 text-lg font-medium">Create: {promptName}</h3>
              </div>
              <p className="text-stone-400 mb-6">Select how to create the prompt</p>
              <div className="flex flex-wrap gap-3 justify-center">
                <NewActionContainer message="Create an empty prompt" onClick={handleCreateEmpty}>
                  New Prompt
                </NewActionContainer>
                <NewActionContainer message="Use base prompt" onClick={handleCreateBase}>
                  Base Prompt
                </NewActionContainer>
                <NewActionContainer message="Use clipboard as MD" onClick={handleCreateFromClipboardMd}>
                  From <FaClipboard /> as <FaMarkdown size={24} />
                </NewActionContainer>
                <NewActionContainer
                  message="Import clipboard content as JSON escaped and transform to MD"
                  onClick={handleCreateFromClipboardJson}
                >
                  From <FaClipboard /> as <BsFiletypeJson size={24} />
                </NewActionContainer>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

const NewActionContainer = ({ message, children, onClick }) => {
  return (
    <div className="flex flex-col gap-3 justify-between items-center border-2 border-stone-700 p-4 rounded-md w-[45%]">
      <p className="text-stone-300 text-center text-sm">{message}</p>
      <button
        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition cursor-pointer flex items-center justify-center gap-2"
        onClick={onClick}
      >
        {children}
      </button>
    </div>
  );
};

NewActionContainer.propTypes = {
  message: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func.isRequired,
};

NewMenu.propTypes = {
  addPrompt: PropTypes.func.isRequired,
};
