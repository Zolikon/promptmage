import React, { useCallback, useEffect } from "react";
import MDEditor from "@uiw/react-md-editor";
import Switch from "./Switch";
import CopyButton from "./CopyButton";
import TableOfContents from "./TableOfContent";
import useStore from "../hooks/useStorage";
import { MdFiberNew, MdDelete, MdOutlineDocumentScanner } from "react-icons/md";
import { FaClipboard } from "react-icons/fa";
import ConfirmButton from "./ConfirmButton";
import { BASE_PROMPT } from "../basePrompt";
import ReadFromClipboardButton from "./ReadFromClipboardButton";

const COMMANDS_TO_HIDE = ["image", "edit", "live", "preview", "title"];

export default function Prompt() {
  const [storedValue, setStoredValue] = useStore("promptMage.stored", "**Hello world!!!**");
  const [value, setValue] = React.useState(storedValue);
  const [headerMap, setHeaderMap] = React.useState([]);
  const [editorMode, setEditorMode] = React.useState(true);

  const updateValue = (newValue) => {
    setValue(newValue);
    setStoredValue(newValue);
  };

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

  function countWords(text) {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  }

  function estimateTokensAdvanced(text) {
    const words = (text.match(/\b\w+\b/g) || []).length;
    const punctuation = (text.match(/[^\w\s]/g) || []).length;
    const whitespace = (text.match(/\s/g) || []).length;

    return Math.ceil(words * 1.3 + punctuation * 0.5 + whitespace * 0.1);
  }

  const mapHeaders = useCallback((text) => {
    const newHeaderMap = [];
    text.split("\n").forEach((line) => {
      const headerMatch = line.match(/^(#{1,6})\s+(.*)/);
      if (headerMatch) {
        newHeaderMap.push({ level: headerMatch[1].length, text: headerMatch[2] });
      }
    });
    setHeaderMap(newHeaderMap);
  }, []);

  useEffect(() => {
    if (!editorMode) {
      mapHeaders(value);
    }
  }, [editorMode, value, mapHeaders]);

  useEffect(() => {
    if (editorMode) {
      if (window.location.hash) {
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      }
    }
  }, [editorMode]);

  return (
    <div className="w-full h-full p-4 grid grid-rows-8 grid-cols-6 gap-4">
      <div className="flex justify-center items-center col-span-7 row-start-1 row-span-1">
        <Switch
          values={["Editor", "Preview"]}
          selected={editorMode ? "Editor" : "Preview"}
          onSelect={(value) => setEditorMode(value === "Editor")}
        />
      </div>
      <div className="flex flex-col justify-start col-start-1 col-span-1 row-start-2 row-span-7">
        {!editorMode && <TableOfContents headerMap={headerMap} />}
      </div>
      <div className=" row-start-2 row-span-7 col-span-4 col-start-2 text-stone-200" data-color-mode="dark">
        {editorMode ? (
          <MDEditor
            value={value}
            onChange={updateValue}
            height={"90%"}
            style={{ borderRadius: 8 }}
            preview="edit"
            draggable={false}
            commandsFilter={(command) => {
              if (COMMANDS_TO_HIDE.includes(command.name)) return false;
              return command;
            }}
          />
        ) : (
          <MDEditor.Markdown
            source={value}
            style={{ padding: 12, height: "90%", borderRadius: 8, overflowY: "auto" }}
          />
        )}
      </div>
      <div className="flex flex-col items-center row-start-2 col-start-6 col-span-1 gap-3">
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
        <div className="flex flex-col items-center justify-center text-xl text-stone-400">
          <p>{`Prompt length: ${value.length}`}</p>
          <p>{`Word count: ${countWords(value)}`}</p>
          <p>{`Estimated tokens: ${estimateTokensAdvanced(value)}`}</p>
        </div>
      </div>
    </div>
  );
}
