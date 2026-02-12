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
import Breadcrumbs from "./Breadcrumbs";
import { MdLibraryBooks, MdClose, MdEdit, MdDelete, MdCheck } from "react-icons/md";
import {
  createNode,
  parseMarkdownToTree,
  treeToMarkdown,
  findNodeById,
  findPathToNode,
  updateTreeWithFragment,
  findParentNode,
  updateNodeTitle,
  ensureUniqueIds,
} from "../utils/treeUtils";

const COMMANDS_TO_HIDE = ["image", "edit", "live", "preview", "title"];

export default function Prompt() {
  const { prompts, selectedPrompt, setSelectedPromptId, addPrompt, updatePrompt, deletePrompt } = usePromptLibrary();

  // Root node of the current prompt
  // Fallback to a default root if something is wrong
  // ensureUniqueIds repairs legacy data where root ID was copied to first child
  const rootNode = useMemo(() => {
    const node = selectedPrompt?.content?.id ? selectedPrompt.content : createNode(0, "Root");
    return ensureUniqueIds(node);
  }, [selectedPrompt?.content]);

  const [focusedNodeId, setFocusedNodeId] = useState(null);
  const [editorMode, setEditorMode] = useState(true);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [rightTab, setRightTab] = useState("Variables"); // "Variables" | "Stats"
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Reset focus and editing state when switching prompts
  useEffect(() => {
    if (selectedPrompt?.id) {
      if (rootNode?.id) {
        setFocusedNodeId(null);
      }
      setIsEditingName(false);
      setShowDeleteConfirm(false);
    }
  }, [selectedPrompt?.id]);

  // Derived Values
  const focusedNode = useMemo(() => {
    if (!focusedNodeId) return rootNode;
    return findNodeById(rootNode, focusedNodeId) || rootNode;
  }, [rootNode, focusedNodeId]);

  const displayedMarkdown = useMemo(() => {
    return treeToMarkdown(focusedNode);
  }, [focusedNode]);

  const fullMarkdown = useMemo(() => treeToMarkdown(rootNode), [rootNode]);

  const variableValues = selectedPrompt?.variableValues || {};

  const handleEditorChange = (newMarkdown) => {
    if (!selectedPrompt) return;

    let sanitizedMarkdown = newMarkdown;
    const level = focusedNode.level;

    // Enforce Level Restriction: Children must be deeper than parent
    if (level > 0) {
      const lines = newMarkdown.split("\n");
      // Determine the level of the node itself (first line)
      const firstLineMatch = lines[0]?.match(/^(#{1,6})\s/);

      if (firstLineMatch) {
        const currentSelfLevel = firstLineMatch[1].length;
        const minChildLevel = currentSelfLevel + 1;

        if (minChildLevel <= 6 && lines.length > 1) {
          // Scan content lines for invalid headers (<= currentSelfLevel)
          const content = lines.slice(1).join("\n");
          const regex = new RegExp(`^(#{1,${currentSelfLevel}})\\s`, "gm");
          const sanitizedContent = content.replace(regex, () => {
            return "#".repeat(minChildLevel) + " ";
          });
          sanitizedMarkdown = lines[0] + "\n" + sanitizedContent;
        }
      }
    }

    // Parse the new markdown content
    const fragmentRoot = parseMarkdownToTree(sanitizedMarkdown);

    // Logic to preserve ID or handle deletion
    let targetId = focusedNode.id;
    let nextFocusId = focusedNode.id;
    let preserveId = true;

    // Check for deletion (merging) scenario
    if (fragmentRoot.children.length === 0 && focusedNode.level > 0) {
      // User deleted the header line of the focused node (and didn't replace it with another header)
      // We are merging content upwards.
      const parent = findParentNode(rootNode, focusedNode.id);
      if (parent) {
        const index = parent.children.findIndex((c) => c.id === focusedNode.id);
        if (index > 0) {
          nextFocusId = parent.children[index - 1].id;
        } else {
          nextFocusId = parent.id;
        }
      }
      preserveId = false;
    } else if (fragmentRoot.children.length > 0 && focusedNode.level > 0) {
      // We have headers. We want to preserve the ID of the primary node we are editing.
      fragmentRoot.children[0].id = focusedNode.id;
    }

    const newRoot = updateTreeWithFragment(rootNode, targetId, fragmentRoot);

    updatePrompt(selectedPrompt.id, { content: newRoot });
    if (!preserveId) {
      setFocusedNodeId(nextFocusId);
    }
  };

  const setVariableValues = useCallback(
    (newValues) => {
      if (selectedPrompt) {
        updatePrompt(selectedPrompt.id, { variableValues: newValues });
      }
    },
    [selectedPrompt, updatePrompt],
  );

  const handleGlobalReplace = (searchValue, replaceValue) => {
    if (!selectedPrompt) return;
    const escapedSearch = searchValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escapedSearch, "g");
    const newValue = fullMarkdown.replace(regex, replaceValue);
    const newRoot = parseMarkdownToTree(newValue);
    // This resets IDs, so we reset focus to Root
    setFocusedNodeId(null);
    updatePrompt(selectedPrompt.id, { content: newRoot });
  };

  const handleRenameVariable = (oldName, newName, currentValue) => {
    // Global replace in full markdown
    const newVariableValues = { ...variableValues };
    if (newVariableValues.hasOwnProperty(oldName)) {
      newVariableValues[newName] = newVariableValues[oldName];
      delete newVariableValues[oldName];
    } else {
      newVariableValues[newName] = currentValue !== undefined ? currentValue : "";
    }

    const escapedOldName = oldName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\{\\{\\s*${escapedOldName}\\s*\\}\\}`, "g");
    const newValue = fullMarkdown.replace(regex, `{{${newName}}}`);

    const newRoot = parseMarkdownToTree(newValue);
    // IDs reset, focus Root
    setFocusedNodeId(null);

    updatePrompt(selectedPrompt.id, {
      content: newRoot,
      variableValues: newVariableValues,
    });
  };

  // Helper to compile mustache, preserving unset vars as {{varName}}
  const compileMustache = useCallback(
    (markdown) => {
      try {
        const parsed = Mustache.parse(markdown);
        const view = { ...variableValues };

        // Find unconfirmed section/inverted-section variables so we can
        // escape their tags and prevent Mustache from hiding the content.
        const unconfirmedSections = new Set();
        const findUnconfirmedSections = (tokens) => {
          tokens.forEach((token) => {
            if ((token[0] === "#" || token[0] === "^") &&
                !Object.prototype.hasOwnProperty.call(view, token[1])) {
              unconfirmedSections.add(token[1]);
            }
            if (token[4]) findUnconfirmedSections(token[4]);
          });
        };
        findUnconfirmedSections(parsed);

        // Replace unconfirmed section tags with placeholders so Mustache
        // treats them as plain text instead of hiding the section content.
        let processedMarkdown = markdown;
        const placeholders = [];
        for (const varName of unconfirmedSections) {
          const escaped = varName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const ph = `__MSTC_${varName}_`;
          placeholders.push(
            { placeholder: `${ph}OPEN__`, original: `{{#${varName}}}` },
            { placeholder: `${ph}CLOSE__`, original: `{{/${varName}}}` },
            { placeholder: `${ph}INV__`, original: `{{^${varName}}}` },
          );
          processedMarkdown = processedMarkdown
            .replace(new RegExp(`\\{\\{\\s*#\\s*${escaped}\\s*\\}\\}`, "g"), `${ph}OPEN__`)
            .replace(new RegExp(`\\{\\{\\s*\\/\\s*${escaped}\\s*\\}\\}`, "g"), `${ph}CLOSE__`)
            .replace(new RegExp(`\\{\\{\\s*\\^\\s*${escaped}\\s*\\}\\}`, "g"), `${ph}INV__`);
        }

        // Re-parse after escaping to handle remaining name tokens
        const newParsed = Mustache.parse(processedMarkdown);
        const findVars = (tokens) => {
          tokens.forEach((token) => {
            if (token[0] === "name") {
              const varName = token[1];
              if (!Object.prototype.hasOwnProperty.call(view, varName)) {
                view[varName] = `{{${varName}}}`;
              }
            }
            if (token[4]) findVars(token[4]);
          });
        };
        findVars(newParsed);
        let result = Mustache.render(processedMarkdown, view);

        // Restore placeholders back to original mustache tags
        for (const { placeholder, original } of placeholders) {
          result = result.replaceAll(placeholder, original);
        }
        return result;
      } catch (e) {
        return markdown;
      }
    },
    [variableValues],
  );

  // Compile full markdown (used for copy/export/stats)
  const compiledValue = useMemo(() => compileMustache(fullMarkdown), [fullMarkdown, compileMustache]);

  // Compile displayed (focused node) markdown for preview
  const compiledDisplayedValue = useMemo(
    () => compileMustache(displayedMarkdown),
    [displayedMarkdown, compileMustache],
  );

  // Breadcrumbs Path
  const currentPath = useMemo(() => {
    const path = [];
    let current = focusedNode.id;
    let safety = 0;
    while (current && safety < 100) {
      safety++;
      const node = findNodeById(rootNode, current);
      if (node) {
        path.unshift({ id: node.id, name: node.text || "Prompt" });
        if (node.level === 0) break;
        const parent = findParentNode(rootNode, current);
        current = parent ? parent.id : null;
      } else {
        break;
      }
    }
    if (path.length > 0 && path[0].name === "Root") {
      path.shift();
    }
    return path;
  }, [rootNode, focusedNodeId]);

  const handleBreadcrumbNavigate = (index) => {
    if (index >= 0 && index < currentPath.length) {
      setFocusedNodeId(currentPath[index].id);
    } else {
      setFocusedNodeId(null);
    }
  };

  const handleNodeRename = (id, newName) => {
    const newRoot = updateNodeTitle(rootNode, id, newName);
    updatePrompt(selectedPrompt.id, { content: newRoot });
  };

  // Prompt name inline rename/delete handlers
  const startEditingName = () => {
    setIsEditingName(true);
    setEditName(selectedPrompt.name);
  };

  const savePromptName = () => {
    if (editName.trim()) {
      updatePrompt(selectedPrompt.id, { name: editName.trim() });
    }
    setIsEditingName(false);
    setEditName("");
  };

  const cancelEditingName = () => {
    setIsEditingName(false);
    setEditName("");
  };

  const handleNameKeyDown = (e) => {
    if (e.key === "Enter") savePromptName();
    else if (e.key === "Escape") cancelEditingName();
  };

  const handleDeletePrompt = () => {
    deletePrompt(selectedPrompt.id);
    setShowDeleteConfirm(false);
  };

  if (!selectedPrompt) return <div className="text-white">Loading...</div>;

  return (
    <div className="w-full h-full p-4 grid grid-rows-8 grid-cols-12 gap-4">
      {/* Top Bar */}
      <div className="flex items-center col-span-12 row-start-1 row-span-1 px-4">
        <button
          onClick={() => setIsLibraryOpen(true)}
          className="flex items-center gap-2 px-3 py-1 bg-stone-700 hover:bg-stone-600 text-stone-200 rounded transition-colors"
        >
          <MdLibraryBooks />
          <span>Library</span>
        </button>

        <div className="flex-1 flex justify-center">
          {isEditingName ? (
            <div className="flex items-center gap-2 bg-stone-800 border border-stone-600 rounded-lg px-4 py-1.5">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={handleNameKeyDown}
                autoFocus
                onFocus={(e) => e.target.select()}
                className="bg-stone-700 text-white text-xl font-bold px-2 py-0.5 rounded outline-none"
              />
              <button
                onClick={savePromptName}
                className="p-1 text-stone-400 hover:text-green-400 transition-colors"
                title="Save"
              >
                <MdCheck size={18} />
              </button>
              <button
                onClick={cancelEditingName}
                className="p-1 text-stone-400 hover:text-red-400 transition-colors"
                title="Cancel"
              >
                <MdClose size={18} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 relative bg-stone-800/60 border border-stone-700 rounded-lg px-4 py-1.5">
              <span className="text-white text-4xl font-bold truncate max-w-[400px]">{selectedPrompt.name}</span>
              <button
                onClick={startEditingName}
                className="p-1 text-stone-500 hover:text-blue-400 transition-colors"
                title="Rename"
              >
                <MdEdit size={16} />
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-1 text-stone-500 hover:text-red-400 transition-colors"
                title="Delete"
              >
                <MdDelete size={16} />
              </button>

              {/* Delete Confirmation Popover */}
              <AnimatePresence>
                {showDeleteConfirm && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 mt-2 bg-stone-800 border-2 border-red-600 rounded-lg p-4 shadow-lg z-50 min-w-[260px]"
                  >
                    <h3 className="text-white font-bold mb-2">Delete Prompt?</h3>
                    <p className="text-stone-300 text-sm mb-4">
                      Are you sure you want to delete{" "}
                      <span className="font-bold text-white">"{selectedPrompt.name}"</span>? This cannot be undone.
                    </p>
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="px-3 py-1 bg-stone-700 hover:bg-stone-600 text-white rounded transition"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDeletePrompt}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded transition"
                      >
                        Delete
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Left Column: TOC */}
      <div className="col-span-2 row-start-2 row-span-7 flex flex-col gap-8">
        <div className="border-r border-stone-800 pr-2 w-full flex justify-center">
          <Switch
            values={["Editor", "Preview"]}
            selected={editorMode ? "Editor" : "Preview"}
            onSelect={(val) => setEditorMode(val === "Editor")}
          />
        </div>
        <div className="flex-grow overflow-hidden relative border-r border-stone-800 pr-2">
          <TableOfContents
            rootNode={rootNode}
            onNodeClick={setFocusedNodeId}
            onNodeRename={handleNodeRename}
            activeNodeId={focusedNodeId}
          />
        </div>
      </div>

      {/* Center Column: Editor */}
      <div
        className="row-start-2 row-span-7 col-span-7 text-stone-200 flex flex-col gap-2 relative"
        data-color-mode="dark"
      >
        {currentPath.length > 0 && (
          <div className="w-full">
            <Breadcrumbs path={currentPath} onNavigate={handleBreadcrumbNavigate} />
          </div>
        )}
        <AnimatePresence mode="wait">
          <motion.div
            className="h-full w-full flex-grow"
            key={editorMode ? "editor" : "preview"}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ duration: 0.2 }}
            layout
          >
            {editorMode ? (
              <MDEditor
                value={displayedMarkdown}
                onChange={handleEditorChange}
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
                source={compiledDisplayedValue}
                style={{ padding: 12, height: "100%", borderRadius: 8, overflowY: "auto" }}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Right Column */}
      <div className="flex flex-col items-center row-start-2 col-span-3 row-span-7 gap-3 overflow-hidden">
        <div className="w-full flex flex-col items-center gap-2">
          <NewMenu addPrompt={addPrompt} />
          <ReplaceMenu value={fullMarkdown} onReplace={handleGlobalReplace} />
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
              value={fullMarkdown}
              initialValues={variableValues}
              onVariablesChange={setVariableValues}
              onRenameVariable={handleRenameVariable}
            />
          ) : (
            <PromptStatistics value={compiledValue} />
          )}
        </div>

        <div className="w-full mt-auto">
          <PromptMenu value={compiledValue} updateValue={handleEditorChange} inEditMode={editorMode} />
        </div>
      </div>

      {/* Library Modal */}
      <AnimatePresence>
        {isLibraryOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-10"
            onClick={() => setIsLibraryOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-stone-900 w-full max-w-4xl h-[80vh] rounded-xl shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 pb-0">
                <h2 className="text-white font-bold text-lg">Library</h2>
                <button
                  onClick={() => setIsLibraryOpen(false)}
                  className="text-stone-400 hover:text-white p-1 rounded-full hover:bg-stone-700 transition"
                >
                  <MdClose size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-hidden p-4 pt-2">
                <Library
                  prompts={prompts}
                  selectedPromptId={selectedPrompt.id}
                  onSelect={(id) => {
                    setSelectedPromptId(id);
                    setIsLibraryOpen(false);
                  }}
                  onAdd={addPrompt}
                  onDelete={deletePrompt}
                  onUpdateName={updatePrompt}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
