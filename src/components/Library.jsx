import React, { useState } from "react";
import { MdDelete, MdEdit, MdAdd, MdSearch, MdClose, MdCheck } from "react-icons/md";
import { motion, AnimatePresence } from "motion/react";
import PropTypes from "prop-types";

const Library = ({ prompts, selectedPromptId, onSelect, onAdd, onDelete, onUpdateName }) => {
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);

    const startEditing = (e, prompt) => {
        e.stopPropagation();
        setEditingId(prompt.id);
        setEditName(prompt.name);
    };

    const saveName = (e) => {
        e.stopPropagation();
        if (editingId) {
            onUpdateName(editingId, { name: editName });
            setEditingId(null);
        }
    };

    const handleCancelEdit = (e) => {
        e.stopPropagation();
        setEditingId(null);
        setEditName("");
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            saveName(e);
        } else if (e.key === "Escape") {
            handleCancelEdit(e);
        }
    };

    const handleCloseSearch = () => {
        setIsSearchOpen(false);
        setSearchQuery("");
    };

    const handleDeleteClick = (e, promptId) => {
        e.stopPropagation();
        setDeleteConfirmId(promptId);
    };

    const handleConfirmDelete = (e) => {
        e.stopPropagation();
        if (deleteConfirmId) {
            onDelete(deleteConfirmId);
            setDeleteConfirmId(null);
        }
    };

    const handleCancelDelete = (e) => {
        e.stopPropagation();
        setDeleteConfirmId(null);
    };

    const filteredPrompts = prompts.filter((prompt) =>
        prompt.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const promptToDelete = prompts.find(p => p.id === deleteConfirmId);

    return (
        <div className="flex flex-col h-full w-full bg-stone-900 text-stone-300 p-2 gap-2 rounded-lg overflow-hidden">
            <div className="flex justify-between items-center p-2 border-b border-stone-700">
                <h2 className="font-bold text-lg">Library</h2>
                <div className="flex gap-1">
                    <button
                        onClick={() => setIsSearchOpen(!isSearchOpen)}
                        className="p-1 hover:bg-stone-700 rounded-full transition cursor-pointer"
                        title="Search"
                    >
                        <MdSearch size={24} />
                    </button>
                    <button
                        onClick={onAdd}
                        className="p-1 hover:bg-stone-700 rounded-full transition cursor-pointer"
                        title="New Prompt"
                    >
                        <MdAdd size={24} />
                    </button>
                </div>
            </div>
            <AnimatePresence>
                {isSearchOpen && (
                    <motion.div
                        className="px-2"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                        <div className="flex items-center bg-stone-800 rounded-md px-2 py-1 gap-2">
                            <MdSearch className="text-stone-500" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-transparent border-none outline-none text-stone-300 w-full text-sm"
                                autoFocus
                            />
                            <button
                                onClick={handleCloseSearch}
                                className="p-1 hover:bg-stone-700 rounded-full transition cursor-pointer"
                                title="Close Search"
                            >
                                <MdClose size={18} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <div className="flex flex-col gap-1 overflow-y-auto flex-grow relative">
                {filteredPrompts.map((prompt) => (
                    <motion.div
                        key={prompt.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-2 rounded-md cursor-pointer flex justify-between items-center group ${selectedPromptId === prompt.id ? "bg-stone-700 text-white" : "hover:bg-stone-800"
                            }`}
                        onClick={() => onSelect(prompt.id)}
                    >
                        {editingId === prompt.id ? (
                            <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                onFocus={(e) => e.target.select()}
                                onKeyDown={handleKeyDown}
                                autoFocus
                                className="bg-stone-600 text-white px-1 rounded w-full outline-none"
                                onClick={(e) => e.stopPropagation()}
                            />
                        ) : (
                            <span className="truncate flex-grow">{prompt.name}</span>
                        )}

                        <div className={`flex gap-1 transition-opacity ${editingId === prompt.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                            }`}>
                            {editingId === prompt.id ? (
                                <>
                                    <button
                                        onClick={saveName}
                                        className="p-1 hover:text-green-400"
                                        title="Save"
                                    >
                                        <MdCheck />
                                    </button>
                                    <button
                                        onClick={handleCancelEdit}
                                        className="p-1 hover:text-red-400"
                                        title="Cancel"
                                    >
                                        <MdClose />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={(e) => startEditing(e, prompt)}
                                        className="p-1 hover:text-blue-400"
                                        title="Rename"
                                    >
                                        <MdEdit />
                                    </button>
                                    <button
                                        onClick={(e) => handleDeleteClick(e, prompt.id)}
                                        className="p-1 hover:text-red-400"
                                        title="Delete"
                                    >
                                        <MdDelete />
                                    </button>
                                </>
                            )}
                        </div>
                    </motion.div>
                ))}

                {/* Delete Confirmation Popover */}
                <AnimatePresence>
                    {deleteConfirmId && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.2 }}
                            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm z-10"
                            onClick={handleCancelDelete}
                        >
                            <div
                                className="bg-stone-800 border-2 border-red-600 rounded-lg p-4 max-w-[280px] shadow-lg"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <h3 className="text-white font-bold mb-2">Delete Prompt?</h3>
                                <p className="text-stone-300 text-sm mb-4">
                                    Are you sure you want to delete <span className="font-bold text-white">"{promptToDelete?.name}"</span>? This action cannot be undone.
                                </p>
                                <div className="flex gap-2 justify-end">
                                    <button
                                        onClick={handleCancelDelete}
                                        className="px-3 py-1 bg-stone-700 hover:bg-stone-600 text-white rounded transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleConfirmDelete}
                                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded transition"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

Library.propTypes = {
    prompts: PropTypes.array.isRequired,
    selectedPromptId: PropTypes.string,
    onSelect: PropTypes.func.isRequired,
    onAdd: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    onUpdateName: PropTypes.func.isRequired,
};

export default Library;

