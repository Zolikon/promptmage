import React, { useCallback, useEffect } from "react";
import MDEditor from "@uiw/react-md-editor";
import Switch from "./Switch";
import TableOfContents from "./TableOfContent";
import useStore from "../hooks/useStorage";
import PromptMenu from "./PrompMenu";
import PromptStatistics from "./PromptStatistics";
import { AnimatePresence, motion } from "motion/react";

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
      <AnimatePresence mode="wait">
        <motion.div
          key={editorMode ? "no-toc" : "toc"}
          className="flex flex-col justify-start col-start-1 col-span-1 row-start-2 row-span-7"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -10, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {!editorMode && <TableOfContents headerMap={headerMap} />}
        </motion.div>
      </AnimatePresence>
      <div className=" row-start-2 row-span-7 col-span-4 col-start-2 text-stone-200" data-color-mode="dark">
        <AnimatePresence mode="wait">
          <motion.div
            className="h-full w-full"
            key={editorMode ? "editor" : "preview"}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ duration: 0.2 }}
            layout
          >
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
          </motion.div>
          )
        </AnimatePresence>
      </div>
      <div className="flex flex-col items-center row-start-2 col-start-6 col-span-1 gap-3">
        <AnimatePresence mode="wait">
          <PromptMenu value={value} updateValue={updateValue} inEditMode={editorMode} />
          <PromptStatistics value={value} />
        </AnimatePresence>
      </div>
    </div>
  );
}
