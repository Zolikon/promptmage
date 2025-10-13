import { BASE_PROMPT } from "../basePrompt";
import ConfirmButton from "./ConfirmButton";
import { MdFiberNew, MdDelete, MdOutlineDocumentScanner } from "react-icons/md";
import { FaClipboard } from "react-icons/fa";
import CopyButton from "./CopyButton";
import PropTypes from "prop-types";

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
    <>
      {inEditMode && (
        <>
          <ConfirmButton
            key="new-prompt"
            name="New"
            message={"Are you sure you want to start a new prompt?"}
            onClick={() => updateValue(BASE_PROMPT)}
          >
            <MdFiberNew size={32} />
            Prompt
          </ConfirmButton>
          <ConfirmButton
            key="clear-prompt"
            name="Clear"
            message={"Are you sure you want to clear current prompt?"}
            onClick={() => updateValue("")}
          >
            <MdDelete size={24} />
            Prompt
          </ConfirmButton>
          <div className="flex flex-col gap-3 items-center justify-center bg-stone-800 text-stone-400 p-2 rounded-md w-2/3">
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
          </div>
        </>
      )}

      <div className="flex flex-col gap-3 items-center justify-center bg-stone-800 text-stone-400 p-2 rounded-md w-2/3 select-none">
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
      </div>
    </>
  );
};

PromptMenu.propTypes = {
  value: PropTypes.string.isRequired,
  updateValue: PropTypes.func.isRequired,
  inEditMode: PropTypes.bool,
};

export default PromptMenu;
