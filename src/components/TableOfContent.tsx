import { useState } from "react";
import { MdEdit, MdCheck, MdClose } from "react-icons/md";
import { TreeNode } from "../types";

const HEADER_COLOR_MAP: Record<number, string> = {
  1: "bg-stone-500",
  2: "bg-stone-600",
  3: "bg-stone-600/70",
  4: "bg-stone-700",
  5: "bg-stone-700/70",
  6: "bg-stone-800",
};

interface TableOfContentsProps {
  rootNode: TreeNode;
  onNodeClick?: (id: string | null) => void;
  onNodeRename?: (id: string, newName: string) => void;
  activeNodeId: string | null;
}

const TableOfContents = ({ rootNode, onNodeClick, onNodeRename, activeNodeId }: TableOfContentsProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const startEditing = (e: React.MouseEvent, id: string, currentName: string) => {
    e.stopPropagation();
    setEditingId(id);
    setEditName(currentName);
  };

  const saveName = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (editingId !== null) {
      if (editName.trim() && onNodeRename) {
        onNodeRename(id, editName);
      }
      setEditingId(null);
    }
  };

  const cancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === "Enter") saveName(e as unknown as React.MouseEvent, id);
    else if (e.key === "Escape") cancelEdit(e as unknown as React.MouseEvent);
  };

  const renderNode = (node: TreeNode): React.ReactNode => {
    // Skip rendering root itself, only its children
    if (node.level === 0) {
      return <>{node.children && node.children.map((child) => renderNode(child))}</>;
    }

    const isActive = node.id === activeNodeId;

    return (
      <div key={node.id} className="flex flex-col w-full">
        <div
          style={{
            marginLeft: `${(node.level - 1) * 10}px`,
          }}
          className={`text-stone-200 text-sm p-2 rounded-md flex justify-between items-center group mb-1 ${HEADER_COLOR_MAP[node.level] || "bg-stone-700"} ${isActive ? "border-l-4 border-white brightness-110" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            if (editingId !== node.id) {
              if (onNodeClick) onNodeClick(isActive ? null : node.id);
            }
          }}
        >
          {editingId === node.id ? (
            <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, node.id)}
                onClick={(e) => e.stopPropagation()}
                autoFocus
                className="bg-stone-800 text-white px-1 rounded w-full outline-none min-w-0"
              />
              <button onClick={(e) => saveName(e, node.id)} className="p-0.5 hover:text-green-300 transition-colors">
                <MdCheck />
              </button>
              <button onClick={cancelEdit} className="p-0.5 hover:text-red-300 transition-colors">
                <MdClose />
              </button>
            </div>
          ) : (
            <>
              <span className="truncate flex-grow mr-2 cursor-pointer" title={node.text}>
                {node.text}
              </span>
              {onNodeRename && (
                <button
                  onClick={(e) => startEditing(e, node.id, node.text)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-black/20 rounded text-white/70 hover:text-white"
                  title="Rename"
                >
                  <MdEdit />
                </button>
              )}
            </>
          )}
        </div>
        {/* Recursively render children */}
        {node.children && node.children.map((child) => renderNode(child))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full items-center">
      <p className="text-stone-300 font-bold text-lg mb-2">Table of Contents</p>
      <div className="flex flex-col overflow-y-auto flex-grow gap-1 w-full">
        {(!rootNode || !rootNode.children || rootNode.children.length === 0) && (
          <p className="text-stone-400 text-sm italic">No markdown headers found</p>
        )}
        {rootNode && renderNode(rootNode)}
      </div>
    </div>
  );
};

export default TableOfContents;
