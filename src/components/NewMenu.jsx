import { motion } from "motion/react";
import { BASE_PROMPT } from "../basePrompt";
import { MdFiberNew, MdClose } from "react-icons/md";
import { FaClipboard, FaMarkdown } from "react-icons/fa";
import { BsFiletypeJson } from "react-icons/bs";
import { convertFromJsonInsertion, readTextFromClipboard } from "./clipboardUtils";
import PropTypes from "prop-types";

export const NewMenu = ({ updateValue }) => {
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
        id="confirm-popover-new"
        popover="auto"
        className="bg-stone-900 border border-stone-700 rounded-lg p-6 m-auto  backdrop:bg-black backdrop:opacity-50 relative"
      >
        <h3 className="text-stone-200 text-lg font-medium mb-4">New Prompt</h3>
        <p className="text-stone-400 mb-6">Select an option</p>
        <div className="flex gap-3 justify-center">
          <NewActionContainer message="Create an empty prompt" onClick={() => updateValue("")}>
            New Prompt
          </NewActionContainer>
          <NewActionContainer message="Use base prompt" onClick={() => updateValue(BASE_PROMPT)}>
            Base Prompt
          </NewActionContainer>
          <NewActionContainer
            message="Use clipboard as MD"
            onClick={() => readTextFromClipboard().then((text) => updateValue(text))}
          >
            From <FaClipboard /> as <FaMarkdown size={24} />
          </NewActionContainer>
          <NewActionContainer
            message="Import clipboard content as JSON escaped and transform to MD"
            onClick={() => readTextFromClipboard().then((text) => updateValue(convertFromJsonInsertion(text)))}
          >
            From <FaClipboard /> as <BsFiletypeJson size={24} />
          </NewActionContainer>
          <button
            className="px-4 py-2 text-stone-400 hover:text-stone-200 transition cursor-pointer absolute top-2 right-2"
            popovertarget="confirm-popover-new"
            popovertargetaction="hide"
          >
            <MdClose size={24} />
          </button>
        </div>
      </div>
    </>
  );
};

const NewActionContainer = ({ message, children, onClick }) => {
  return (
    <div className="flex flex-col gap-3 justify-between items-center border-2 border-stone-700 p-4 rounded-md w-1/4">
      <p className="text-stone-300 text-center">{message}</p>
      <button
        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-red-700 transition cursor-pointer flex items-center justify-center gap-2"
        popovertarget="confirm-popover-new"
        popovertargetaction="hide"
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
  updateValue: PropTypes.func.isRequired,
};
