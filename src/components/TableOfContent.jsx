import PropTypes from "prop-types";
import { useState } from "react";
import { MdEdit, MdCheck, MdClose } from "react-icons/md";

const HEADER_COLOR_MAP = {
  1: "bg-red-600",
  2: "bg-orange-600",
  3: "bg-yellow-600",
  4: "bg-green-600",
  5: "bg-blue-600",
  6: "bg-purple-600",
};

const TableOfContents = ({ rootNode, onNodeClick, onNodeRename, activeNodeId }) => {
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  const startEditing = (e, id, currentName) => {
    e.stopPropagation();
    setEditingId(id);
    setEditName(currentName);
  };

  const saveName = (e, id) => {
    e.stopPropagation();
    if (editingId !== null) {
      if (editName.trim() && onNodeRename) {
        onNodeRename(id, editName);
      }
      setEditingId(null);
    }
  };

  const cancelEdit = (e) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleKeyDown = (e, id) => {
    if (e.key === "Enter") saveName(e, id);
    else if (e.key === "Escape") cancelEdit(e);
  };

  const renderNode = (node) => {
    // Skip rendering root itself, only its children
    if (node.level === 0) {
      return (
        <>
          {node.children && node.children.map(child => renderNode(child))}
        </>
      );
    }

    const isActive = node.id === activeNodeId;
    // Check if node is ancestor of active node? 
    // The previous code highlighted children indices too. 
    // "Selected... it and all its children should be displayed". 
    // If I select a parent, it is displayed.
    // The visual indication should probably just be on the selected node itself unless we want to highlight the scope.
    // We'll stick to highlighting the specific active node for now.

    return (
      <div key={node.id} className="flex flex-col w-full">
        <div
          style={{
            marginLeft: `${(node.level - 1) * 10}px`, // Adjusted since level 1 is top
          }}
          className={`text-stone-200 text-sm w-[90%] p-2 rounded-md flex justify-between items-center group mb-1 ${HEADER_COLOR_MAP[node.level] || 'bg-stone-700'} ${isActive ? 'border-l-4 border-white brightness-110' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            if (editingId !== node.id) {
              if (onNodeClick) onNodeClick(node.id);
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
              <button onClick={(e) => saveName(e, node.id)} className="p-0.5 hover:text-green-300 transition-colors"><MdCheck /></button>
              <button onClick={cancelEdit} className="p-0.5 hover:text-red-300 transition-colors"><MdClose /></button>
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
        {node.children && node.children.map(child => renderNode(child))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <p className="text-stone-300 font-bold text-lg mb-2">Table of Contents</p>
      <div className="flex flex-col overflow-y-auto flex-grow gap-1">
        {(!rootNode || !rootNode.children || rootNode.children.length === 0) && (
          <p className="text-stone-400 text-sm italic">No markdown headers found</p>
        )}
        {rootNode && renderNode(rootNode)}
      </div>
    </div>
  );
};

TableOfContents.propTypes = {
  rootNode: PropTypes.object,
  onNodeClick: PropTypes.func,
  onNodeRename: PropTypes.func,
  activeNodeId: PropTypes.string,
};

export default TableOfContents;
