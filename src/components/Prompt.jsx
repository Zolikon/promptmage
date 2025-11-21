import React, { useCallback, useEffect, useMemo, useState } from "react";
import MDEditor from "@uiw/react-md-editor";
import Switch from "./Switch";
import TableOfContents from "./TableOfContent";
import usePromptLibrary from "../hooks/usePromptLibrary";
import PromptMenu from "./PrompMenu";
import PromptStatistics from "./PromptStatistics";
import Library from "./Library";
import Variables from "./Variables";
import { AnimatePresence, motion } from "motion/react";
import { NewMenu } from "./NewMenu";
import { ReplaceMenu } from "./ReplaceMenu";
import Mustache from "mustache";

const COMMANDS_TO_HIDE = ["image", "edit", "live", "preview", "title"];

export default function Prompt() {
  const {
    prompts,
    selectedPrompt,
    setSelectedPromptId,
    addPrompt,
    updatePrompt,
    deletePrompt,
  } = usePromptLibrary();

  const [headerMap, setHeaderMap] = useState([]);
  const [editorMode, setEditorMode] = useState(true);
  const [leftTab, setLeftTab] = useState("Library"); // "Library" | "TOC"
  const [rightTab, setRightTab] = useState("Variables"); // "Variables" | "Stats"

  const value = selectedPrompt ? selectedPrompt.content : "";
  const variableValues = selectedPrompt?.variableValues || {};

  const updateValue = (newValue) => {
    if (selectedPrompt) {
      updatePrompt(selectedPrompt.id, { content: newValue });
    }
  };

  const setVariableValues = useCallback((newValues) => {
    if (selectedPrompt) {
      updatePrompt(selectedPrompt.id, { variableValues: newValues });
    }
  }, [selectedPrompt, updatePrompt]);

  const handleReplace = (searchValue, replaceValue) => {
    if (selectedPrompt) {
      const escapedSearch = searchValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedSearch, 'g');
      const newValue = value.replace(regex, replaceValue);
      updateValue(newValue);
    }
  };

  const handleRenameVariable = (oldName, newName, currentValue) => {
    if (selectedPrompt) {
      // Update variable values
      const newVariableValues = { ...variableValues };

      if (newVariableValues.hasOwnProperty(oldName)) {
        newVariableValues[newName] = newVariableValues[oldName];
        delete newVariableValues[oldName];
      } else {
        // Fallback: if oldName is missing (e.g. race condition where parent state is stale),
        // use the currentValue passed from the child component.
        newVariableValues[newName] = currentValue !== undefined ? currentValue : "";
      }

      // Update prompt content
      // We need to replace {{oldName}} with {{newName}}
      // Handling potential whitespace: {{ oldName }}
      const escapedOldName = oldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\{\\{\\s*${escapedOldName}\\s*\\}\\}`, 'g');
      const newValue = value.replace(regex, `{{${newName}}}`);

      updatePrompt(selectedPrompt.id, {
        content: newValue,
        variableValues: newVariableValues
      });
    }
  };

  const mapHeaders = useCallback((text) => {
    const newHeaderMap = [];
    if (text) {
      text.split("\n").forEach((line) => {
        const headerMatch = line.match(/^(#{1,6})\s+(.*)/);
        if (headerMatch) {
          newHeaderMap.push({ level: headerMatch[1].length, text: headerMatch[2] });
        }
      });
    }
    setHeaderMap(newHeaderMap);
  }, []);

  useEffect(() => {
    if (leftTab === "TOC") {
      mapHeaders(value);
    }
  }, [leftTab, value, mapHeaders]);

  useEffect(() => {
    // Auto-switch to TOC if in preview mode, else Library
    if (!editorMode) {
      setLeftTab("TOC");
    } else {
      setLeftTab("Library");
    }
  }, [editorMode]);


  const compiledValue = useMemo(() => {
    try {
      return Mustache.render(value, variableValues);
    } catch (e) {
      return value;
    }
  }, [value, variableValues]);

  // Sync scroll fix
  useEffect(() => {
    if (editorMode) {
      if (window.location.hash) {
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      }
    }
  }, [editorMode]);

  if (!selectedPrompt) return <div className="text-white">Loading...</div>;

  return (
    <div className="w-full h-full p-4 grid grid-rows-8 grid-cols-12 gap-4">
      {/* Top Bar: Editor/Preview Switch */}
      <div className="flex justify-center items-center col-span-12 row-start-1 row-span-1">
        <Switch
          values={["Editor", "Preview"]}
          selected={editorMode ? "Editor" : "Preview"}
          onSelect={(val) => setEditorMode(val === "Editor")}
        />
      </div>

      {/* Left Column: Library / TOC */}
      <div className="col-span-2 row-start-2 row-span-7 flex flex-col gap-2">
        <div className="flex gap-2 justify-center mb-2">
          <button
            onClick={() => setLeftTab("Library")}
            className={`text-sm px-2 py-1 rounded ${leftTab === "Library" ? "bg-stone-700 text-white" : "text-stone-500 hover:text-stone-300"}`}
          >
            Library
          </button>
          <button
            onClick={() => setLeftTab("TOC")}
            className={`text-sm px-2 py-1 rounded ${leftTab === "TOC" ? "bg-stone-700 text-white" : "text-stone-500 hover:text-stone-300"}`}
          >
            Structure
          </button>
        </div>

        <div className="flex-grow overflow-hidden relative">
          <AnimatePresence mode="wait">
            {leftTab === "Library" ? (
              <motion.div
                key="library"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full w-full absolute"
              >
                <Library
                  prompts={prompts}
                  selectedPromptId={selectedPrompt.id}
                  onSelect={setSelectedPromptId}
                  onAdd={addPrompt}
                  onDelete={deletePrompt}
                  onUpdateName={updatePrompt}
                />
              </motion.div>
            ) : (
              <motion.div
                key="toc"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="h-full w-full absolute overflow-y-auto"
              >
                <TableOfContents headerMap={headerMap} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Center Column: Editor */}
      <div className="row-start-2 row-span-7 col-span-7 text-stone-200" data-color-mode="dark">
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
                height={"100%"}
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
                source={compiledValue}
                style={{ padding: 12, height: "100%", borderRadius: 8, overflowY: "auto" }}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Right Column: Variables / Stats / Menu */}
      <div className="flex flex-col items-center row-start-2 col-span-3 row-span-7 gap-3 overflow-hidden">
        <div className="w-full flex flex-col items-center gap-2">
          <NewMenu addPrompt={addPrompt} />
          <ReplaceMenu value={value} onReplace={handleReplace} />
        </div>
        <div className="w-full flex justify-center gap-2 mb-2">
          <button
            onClick={() => setRightTab("Variables")}
            className={`text-sm px-2 py-1 rounded ${rightTab === "Variables" ? "bg-stone-700 text-white" : "text-stone-500 hover:text-stone-300"}`}
          >
            Variables
          </button>
          <button
            onClick={() => setRightTab("Stats")}
            className={`text-sm px-2 py-1 rounded ${rightTab === "Stats" ? "bg-stone-700 text-white" : "text-stone-500 hover:text-stone-300"}`}
          >
            Stats
          </button>
        </div>

        <div className="w-full flex-grow overflow-y-auto bg-stone-900 rounded-lg p-2">
          {rightTab === "Variables" ? (
            <Variables
              value={value}
              initialValues={variableValues}
              onVariablesChange={setVariableValues}
              onRenameVariable={handleRenameVariable}
            />
          ) : (
            <PromptStatistics value={compiledValue} />
          )}
        </div>

        <div className="w-full mt-auto">
          <PromptMenu value={compiledValue} updateValue={updateValue} inEditMode={editorMode} />
        </div>
      </div>
    </div>
  );
}

