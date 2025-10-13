import React, { useEffect } from "react";
import MDEditor from "@uiw/react-md-editor";
import Switch from "./Switch";
import CopyButton from "./CopyButton";
import TableOfContents from "./TableOfContent";
import useStore from "../hooks/useStorage";

const COMMANDS_TO_HIDE = ["image", "edit", "live", "preview"];

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

  function countWords(text) {
    return text.trim().split(/\s+/).length;
  }

  function estimateTokensAdvanced(text) {
    // Count words, punctuation, and special characters differently
    const words = (text.match(/\b\w+\b/g) || []).length;
    const punctuation = (text.match(/[^\w\s]/g) || []).length;
    const whitespace = (text.match(/\s/g) || []).length;

    // Rough weights based on tokenization patterns
    return Math.ceil(words * 1.3 + punctuation * 0.5 + whitespace * 0.1);
  }

  useEffect(() => {
    mapOut();
  }, [value]);

  function mapOut() {
    const newHeaderMap = [];
    document.querySelectorAll("span.token.title").forEach((el) => {
      const level = el.children[0].textContent.length;
      const text = el.textContent.slice(level).trim();
      newHeaderMap.push({
        level,
        text,
      });
    });
    setHeaderMap(newHeaderMap);
  }

  return (
    <div className="w-full h-full p-4 grid grid-rows-8 grid-cols-6 gap-4">
      <div className="flex justify-center items-center col-span-7 row-start-1 row-span-1">
        <Switch
          values={["Edit", "Preview"]}
          selected={editorMode ? "Edit" : "Preview"}
          onSelect={(value) => setEditorMode(value === "Edit")}
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
        <div className="flex gap-3 items-center justify-center bg-green-600 p-2 rounded-md w-1/2">
          <div className="flex flex-col items-center justify-center gap-3">
            <p className="font-bold">MD</p>
            <CopyButton textToCopy={value} />
          </div>
          <div className="w-[5px] bg-stone-800 h-full" />
          <div className="flex flex-col items-center justify-center gap-3">
            <p className="font-bold">JSON</p>
            <CopyButton textToCopy={convertForJsonInsertion(value)} />
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
