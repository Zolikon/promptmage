import { useCallback, useEffect, useMemo, useState } from "react";
import MDEditor from "@uiw/react-md-editor";
import Switch from "./Switch";
import TableOfContents from "./TableOfContent";
import usePromptLibrary from "../hooks/usePromptLibrary";
import PromptMenu from "./PrompMenu";
import PromptStatistics from "./PromptStatistics";
import Library from "./Library";
import { AnimatePresence, motion } from "motion/react";
import { NewMenu } from "./NewMenu";
import { ReplaceMenu } from "./ReplaceMenu";
import Breadcrumbs from "./Breadcrumbs";
import { MdLibraryBooks, MdClose, MdEdit, MdDelete, MdCheck, MdToc, MdBuild } from "react-icons/md";
import useIsMobile from "../hooks/useIsMobile";
import {
  createNode,
  parseMarkdownToTree,
  treeToMarkdown,
  findNodeById,
  updateTreeWithFragment,
  findParentNode,
  updateNodeTitle,
  ensureUniqueIds,
} from "../utils/treeUtils";
import type { TreeNode } from "../types";

const COMMANDS_TO_HIDE = ["image", "edit", "live", "preview", "title"];

type MobileTab = "editor" | "toc" | "tools";

export default function Prompt() {
  const { prompts, selectedPrompt, setSelectedPromptId, addPrompt, updatePrompt, deletePrompt } = usePromptLibrary();

  // Root node of the current prompt
  // Fallback to a default root if something is wrong
  // ensureUniqueIds repairs legacy data where root ID was copied to first child
  const rootNode = useMemo(() => {
    const node = selectedPrompt?.content?.id ? selectedPrompt.content : createNode(0, "Root");
    return ensureUniqueIds(node);
  }, [selectedPrompt?.content]);

  const isMobile = useIsMobile();
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState(true);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>("editor");

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

  const handleEditorChange = useCallback((newMarkdown: string | undefined) => {
    if (!selectedPrompt || newMarkdown === undefined) return;

    let sanitizedMarkdown = newMarkdown;
    const level = focusedNode.level;

    // Enforce Level Restriction: Children must be deeper than parent
    if (level > 0) {
      const lines = newMarkdown.split("\n");
      const firstLineMatch = lines[0]?.match(/^(#{1,6})\s/);

      if (firstLineMatch) {
        const currentSelfLevel = firstLineMatch[1].length;
        const minChildLevel = currentSelfLevel + 1;

        if (minChildLevel <= 6 && lines.length > 1) {
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
    const targetId = focusedNode.id;
    let nextFocusId: string | null = focusedNode.id;
    let preserveId = true;

    // Check for deletion (merging) scenario
    if (fragmentRoot.children.length === 0 && focusedNode.level > 0) {
      const parent = findParentNode(rootNode, focusedNode.id);
      if (parent) {
        const index = parent.children.findIndex((c: TreeNode) => c.id === focusedNode.id);
        if (index > 0) {
          nextFocusId = parent.children[index - 1].id;
        } else {
          nextFocusId = parent.id;
        }
      }
      preserveId = false;
    } else if (fragmentRoot.children.length > 0 && focusedNode.level > 0) {
      fragmentRoot.children[0].id = focusedNode.id;
    }

    const newRoot = updateTreeWithFragment(rootNode, targetId, fragmentRoot);

    updatePrompt(selectedPrompt.id, { content: newRoot });
    if (!preserveId) {
      setFocusedNodeId(nextFocusId);
    }
  }, [selectedPrompt, focusedNode, rootNode, updatePrompt]);

  const handleGlobalReplace = useCallback((searchValue: string, replaceValue: string) => {
    if (!selectedPrompt) return;
    const escapedSearch = searchValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escapedSearch, "g");
    const newValue = fullMarkdown.replace(regex, replaceValue);
    const newRoot = parseMarkdownToTree(newValue);
    setFocusedNodeId(null);
    updatePrompt(selectedPrompt.id, { content: newRoot });
  }, [selectedPrompt, fullMarkdown, updatePrompt]);

  // Breadcrumbs Path
  const currentPath = useMemo(() => {
    const path: { id: string; name: string }[] = [];
    let current: string | null = focusedNode.id;
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

  const handleBreadcrumbNavigate = useCallback((index: number) => {
    if (index >= 0 && index < currentPath.length) {
      setFocusedNodeId(currentPath[index].id);
    } else {
      setFocusedNodeId(null);
    }
  }, [currentPath]);

  const handleNodeRename = useCallback((id: string, newName: string) => {
    if (!selectedPrompt) return;
    const newRoot = updateNodeTitle(rootNode, id, newName);
    updatePrompt(selectedPrompt.id, { content: newRoot });
  }, [selectedPrompt, rootNode, updatePrompt]);

  // Prompt name inline rename/delete handlers
  const startEditingName = () => {
    if (!selectedPrompt) return;
    setIsEditingName(true);
    setEditName(selectedPrompt.name);
  };

  const savePromptName = () => {
    if (!selectedPrompt) return;
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

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") savePromptName();
    else if (e.key === "Escape") cancelEditingName();
  };

  const handleDeletePrompt = () => {
    if (!selectedPrompt) return;
    deletePrompt(selectedPrompt.id);
    setShowDeleteConfirm(false);
  };

  if (!selectedPrompt) return <div className="text-white">Loading...</div>;

  // Shared Library Modal — used by both mobile and desktop layouts
  const libraryModal = (
    <AnimatePresence>
      {isLibraryOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 md:p-10"
          onClick={() => setIsLibraryOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-stone-900 w-full h-full md:max-w-4xl md:h-[80vh] rounded-xl shadow-2xl flex flex-col"
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
  );

  // --- Mobile Layout ---
  if (isMobile) {
    return (
      <div className="w-full h-full flex flex-col">
        {/* Mobile Top Bar */}
        <div className="flex items-center gap-2 px-3 py-2 shrink-0">
          <button
            onClick={() => setIsLibraryOpen(true)}
            className="p-2 bg-stone-700 hover:bg-stone-600 text-stone-200 rounded transition-colors shrink-0"
          >
            <MdLibraryBooks size={20} />
          </button>

          <div className="flex-1 min-w-0">
            {isEditingName ? (
              <div className="flex items-center gap-1 bg-stone-800 border border-stone-600 rounded-lg px-2 py-1">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={handleNameKeyDown}
                  autoFocus
                  onFocus={(e) => e.target.select()}
                  className="bg-stone-700 text-white text-base font-bold px-2 py-0.5 rounded outline-none min-w-0 flex-1"
                />
                <button
                  onClick={savePromptName}
                  className="p-1 text-stone-400 hover:text-green-400 transition-colors shrink-0"
                >
                  <MdCheck size={18} />
                </button>
                <button
                  onClick={cancelEditingName}
                  className="p-1 text-stone-400 hover:text-red-400 transition-colors shrink-0"
                >
                  <MdClose size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-1 relative">
                <span className="text-white text-lg font-bold truncate">{selectedPrompt.name}</span>
                <button
                  onClick={startEditingName}
                  className="p-1 text-stone-500 hover:text-blue-400 transition-colors shrink-0"
                >
                  <MdEdit size={16} />
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-1 text-stone-500 hover:text-red-400 transition-colors shrink-0"
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
                      className="absolute top-full left-0 mt-2 bg-stone-800 border-2 border-red-600 rounded-lg p-4 shadow-lg z-50 w-[90vw] max-w-[280px]"
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

        {/* Mobile Content Area */}
        <div className="flex-grow min-h-0 overflow-hidden">
          {mobileTab === "editor" && (
            <div className="h-full flex flex-col gap-1 px-2 py-1" data-color-mode="dark">
              <div className="flex items-center justify-center gap-2 pb-1 shrink-0">
                <Switch
                  values={["Editor", "Preview"]}
                  selected={editorMode ? "Editor" : "Preview"}
                  onSelect={(val) => setEditorMode(val === "Editor")}
                />
              </div>
              {currentPath.length > 0 && (
                <div className="w-full shrink-0 pb-1">
                  <Breadcrumbs path={currentPath} onNavigate={handleBreadcrumbNavigate} />
                </div>
              )}
              <div className="flex-grow min-h-0 overflow-hidden">
                {editorMode ? (
                  <MDEditor
                    value={displayedMarkdown}
                    onChange={handleEditorChange}
                    height={"100%"}
                    style={{ borderRadius: 8 }}
                    preview="edit"
                    draggable={false}
                    commandsFilter={(command) => {
                      if (COMMANDS_TO_HIDE.includes(command.name ?? "")) return false;
                      return command;
                    }}
                  />
                ) : (
                  <MDEditor.Markdown
                    source={displayedMarkdown}
                    style={{ padding: 12, height: "100%", borderRadius: 8, overflowY: "auto" }}
                  />
                )}
              </div>
            </div>
          )}

          {mobileTab === "toc" && (
            <div className="h-full overflow-y-auto px-3 py-2">
              <TableOfContents
                rootNode={rootNode}
                onNodeClick={(id) => {
                  setFocusedNodeId(id);
                  setMobileTab("editor");
                }}
                onNodeRename={handleNodeRename}
                activeNodeId={focusedNodeId}
              />
            </div>
          )}

          {mobileTab === "tools" && (
            <div className="h-full overflow-y-auto px-3 py-2 flex flex-col gap-4">
              <div className="flex flex-col items-center gap-2">
                <NewMenu addPrompt={addPrompt} />
                <ReplaceMenu value={fullMarkdown} onReplace={handleGlobalReplace} />
              </div>
              <div className="bg-stone-900 rounded-lg p-2">
                <PromptStatistics value={fullMarkdown} />
              </div>
              <div>
                <PromptMenu value={fullMarkdown} updateValue={handleEditorChange} inEditMode={editorMode} />
              </div>
            </div>
          )}
        </div>

        {/* Bottom Tab Bar */}
        <div className="flex shrink-0 border-t border-stone-700 bg-stone-900">
          {([
            { key: "editor" as const, label: "Editor", icon: <MdEdit size={20} /> },
            { key: "toc" as const, label: "Contents", icon: <MdToc size={20} /> },
            { key: "tools" as const, label: "Tools", icon: <MdBuild size={20} /> },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setMobileTab(tab.key)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 transition-colors ${
                mobileTab === tab.key
                  ? "text-blue-400 bg-stone-800"
                  : "text-stone-500 hover:text-stone-300"
              }`}
            >
              {tab.icon}
              <span className="text-xs">{tab.label}</span>
            </button>
          ))}
        </div>

        {libraryModal}
      </div>
    );
  }

  // --- Desktop Layout (unchanged) ---
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
                  if (COMMANDS_TO_HIDE.includes(command.name ?? "")) return false;
                  return command;
                }}
              />
            ) : (
              <MDEditor.Markdown
                source={displayedMarkdown}
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
        <div className="w-full flex-grow overflow-y-auto bg-stone-900 rounded-lg p-2">
          <PromptStatistics value={fullMarkdown} />
        </div>

        <div className="w-full mt-auto">
          <PromptMenu value={fullMarkdown} updateValue={handleEditorChange} inEditMode={editorMode} />
        </div>
      </div>

      {libraryModal}
    </div>
  );
}
