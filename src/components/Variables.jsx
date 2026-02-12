import React, { useEffect, useState, useRef } from "react";
import Mustache from "mustache";
import PropTypes from "prop-types";
import { MdDelete, MdClose, MdAdd, MdEdit, MdCheck } from "react-icons/md";

const Variables = ({ value, initialValues = {}, onVariablesChange, onRenameVariable }) => {
    const [variables, setVariables] = useState(initialValues);
    const [variableToDelete, setVariableToDelete] = useState(null);
    const [usedVars, setUsedVars] = useState(new Set());

    // New state for adding variable
    const [newVarName, setNewVarName] = useState("");
    const [newVarError, setNewVarError] = useState("");
    const addPopoverRef = useRef(null);
    const inputRef = useRef(null);

    // State for renaming
    const [editingVar, setEditingVar] = useState(null);
    const [editName, setEditName] = useState("");
    const [editError, setEditError] = useState("");
    const editInputRef = useRef(null);


    // Sync with initialValues when they change (e.g., when switching prompts)
    useEffect(() => {
        setVariables(initialValues);
    }, [initialValues]);

    // Extract variables from content and track which ones are used
    useEffect(() => {
        try {
            const parsed = Mustache.parse(value);
            const extractedVars = new Set();

            // Recursively find variables in the parsed tokens
            const findVars = (tokens) => {
                tokens.forEach((token) => {
                    if (token[0] === "name" || token[0] === "#" || token[0] === "^") {
                        const varName = token[1];
                        if (varName && varName.trim() !== "") {
                            extractedVars.add(varName);
                        }
                        if (token[4]) { // Nested tokens for sections
                            findVars(token[4]);
                        }
                    }
                });
            };

            findVars(parsed);
            setUsedVars(extractedVars);
        } catch (e) {
            // Ignore parse errors while typing
        }
    }, [value]);

    const prevVariablesRef = useRef(initialValues);
    const onVariablesChangeRef = useRef(onVariablesChange);
    onVariablesChangeRef.current = onVariablesChange;

    // Notify parent of changes, avoiding loops with deep comparison
    useEffect(() => {
        const jsonVars = JSON.stringify(variables);
        const jsonInit = JSON.stringify(initialValues);
        const jsonPrev = JSON.stringify(prevVariablesRef.current);

        // If variables match initialValues, it's a sync or redundant update
        if (jsonVars === jsonInit) {
            prevVariablesRef.current = variables;
            return;
        }

        // If variables have not actually changed content-wise from previous emit
        if (jsonVars === jsonPrev) {
            return;
        }

        prevVariablesRef.current = variables;
        onVariablesChangeRef.current(variables);
    }, [variables, initialValues]);

    // Focus edit input when editing starts
    useEffect(() => {
        if (editingVar && editInputRef.current) {
            editInputRef.current.focus();
        }
    }, [editingVar]);

    const handleChange = (key, val) => {
        setVariables((prev) => ({ ...prev, [key]: val }));
    };

    const handleDelete = (key) => {
        setVariableToDelete(key);
    };

    const executeDelete = () => {
        if (variableToDelete) {
            setVariables((prev) => {
                const next = { ...prev };
                delete next[variableToDelete];
                return next;
            });
            setVariableToDelete(null);
        }
    };

    const handleAddVariable = () => {
        const name = newVarName.trim();
        if (!name) {
            setNewVarError("Name cannot be empty.");
            return;
        }
        if (!/^[a-zA-Z0-9_]+$/.test(name)) {
            setNewVarError("Only letters, numbers and '_' allowed.");
            return;
        }
        if (variables.hasOwnProperty(name)) {
            setNewVarError("Variable already exists.");
            return;
        }

        setVariables((prev) => ({ ...prev, [name]: "" }));
        setNewVarName("");
        setNewVarError("");
        if (addPopoverRef.current) {
            addPopoverRef.current.hidePopover();
        }
    };

    const handleConfirmVariable = (name) => {
        setVariables((prev) => ({ ...prev, [name]: "" }));
    };

    // Renaming Logic
    const startEditing = (key) => {
        setEditingVar(key);
        setEditName(key);
        setEditError("");
    };

    const cancelEditing = () => {
        setEditingVar(null);
        setEditName("");
        setEditError("");
    };

    const saveRename = () => {
        const oldName = editingVar;
        const newName = editName.trim();

        if (!newName) {
            setEditError("Name cannot be empty.");
            return;
        }
        if (newName === oldName) {
            cancelEditing();
            return;
        }
        if (!/^[a-zA-Z0-9_]+$/.test(newName)) {
            setEditError("Only letters, numbers and '_' allowed.");
            return;
        }
        if (variables.hasOwnProperty(newName)) {
            setEditError("Variable already exists.");
            return;
        }

        // Call parent to handle the rename (updating prompt content and variable values)
        if (onRenameVariable) {
            onRenameVariable(oldName, newName, variables[oldName]);
        }

        cancelEditing();
    };

    const handleEditKeyDown = (e) => {
        if (e.key === "Enter") {
            saveRename();
        } else if (e.key === "Escape") {
            cancelEditing();
        }
    };

    const varKeys = Object.keys(variables);
    const pendingVars = [...usedVars].filter(key => !variables.hasOwnProperty(key));

    // Reset state when popovers close
    useEffect(() => {
        const deletePopover = document.getElementById("delete-variable-popover");
        const addPopover = document.getElementById("add-variable-popover");

        const handleDeleteToggle = (e) => {
            if (e.newState === "closed") {
                setVariableToDelete(null);
            }
        };

        const handleAddToggle = (e) => {
            if (e.newState === "closed") {
                setNewVarName("");
                setNewVarError("");
            } else if (e.newState === "open") {
                if (inputRef.current) {
                    inputRef.current.focus();
                }
            }
        };

        if (deletePopover) deletePopover.addEventListener("toggle", handleDeleteToggle);
        if (addPopover) addPopover.addEventListener("toggle", handleAddToggle);

        return () => {
            if (deletePopover) deletePopover.removeEventListener("toggle", handleDeleteToggle);
            if (addPopover) addPopover.removeEventListener("toggle", handleAddToggle);
        };
    }, []);

    return (
        <>
            <div className="flex justify-between items-center p-2 border-b border-stone-700 mb-2">
                <h3 className="text-stone-200 font-medium">Variables</h3>
                <button
                    popovertarget="add-variable-popover"
                    popovertargetaction="show"
                    className="p-1 hover:text-green-400 text-stone-400 transition cursor-pointer outline-none"
                    title="Add variable"
                >
                    <MdAdd size={20} />
                </button>
            </div>

            <div className="flex flex-col gap-3 w-full p-2">
                {pendingVars.length > 0 && (
                    <div className="flex flex-col gap-2 mb-2 pb-2 border-b border-stone-800">
                        <h4 className="text-xs uppercase text-stone-500 font-bold tracking-wider">Pending</h4>
                        {pendingVars.map(key => (
                            <div key={key} className="flex justify-between items-center bg-stone-800/50 p-2 rounded border border-stone-700 border-dashed">
                                <span className="text-stone-300 font-mono text-sm">{key}</span>
                                <button
                                    onClick={() => handleConfirmVariable(key)}
                                    className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded transition"
                                >
                                    Confirm
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {varKeys.length === 0 && pendingVars.length === 0 ? (
                    <div className="text-stone-500 text-center p-4 italic">
                        No variables detected. Use {"{{variable}}"} syntax or add one manually.
                    </div>
                ) : (
                    varKeys.map((key) => {
                        const isUsed = usedVars.has(key);
                        const isEditing = editingVar === key;

                        return (
                            <div key={key} className="flex flex-col gap-1">
                                <div className="flex justify-between items-center min-h-[28px]">
                                    {isEditing ? (
                                        <div className="flex items-center gap-2 w-full mr-2">
                                            <div className="flex flex-col w-full">
                                                <input
                                                    ref={editInputRef}
                                                    type="text"
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    onKeyDown={handleEditKeyDown}
                                                    onBlur={saveRename}
                                                    className={`bg-stone-900 text-white text-sm font-mono px-1 rounded border ${editError ? "border-red-500" : "border-blue-500"} outline-none w-full`}
                                                />
                                                {editError && <span className="text-red-500 text-[10px]">{editError}</span>}
                                            </div>
                                            <button
                                                onMouseDown={(e) => e.preventDefault()} // Prevent blur before click
                                                onClick={saveRename}
                                                className="text-green-500 hover:text-green-400"
                                                title="Save"
                                            >
                                                <MdCheck size={16} />
                                            </button>
                                            <button
                                                onMouseDown={(e) => e.preventDefault()}
                                                onClick={cancelEditing}
                                                className="text-stone-500 hover:text-stone-300"
                                                title="Cancel"
                                            >
                                                <MdClose size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <label className="text-stone-400 text-sm font-mono truncate" title={key}>{key}</label>
                                                {!isUsed && (
                                                    <span className="text-xs text-orange-500 italic flex-shrink-0">(unused)</span>
                                                )}
                                            </div>
                                            <div className="flex gap-1 flex-shrink-0">
                                                <button
                                                    onClick={() => startEditing(key)}
                                                    className="p-1 hover:text-blue-400 text-stone-500 transition cursor-pointer"
                                                    title="Rename variable"
                                                >
                                                    <MdEdit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(key)}
                                                    popovertarget="delete-variable-popover"
                                                    popovertargetaction="show"
                                                    className="p-1 hover:text-red-400 text-stone-500 transition cursor-pointer"
                                                    title="Delete variable"
                                                >
                                                    <MdDelete size={16} />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                                {!isEditing && (
                                    <textarea
                                        value={variables[key]}
                                        onChange={(e) => handleChange(key, e.target.value)}
                                        className={`bg-stone-800 text-stone-200 rounded p-2 border ${isUsed ? "border-stone-700" : "border-orange-900"
                                            } focus:border-blue-500 outline-none resize-y min-h-[40px] overflow-y-hidden`}
                                        rows={1}
                                    />
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            <div
                id="delete-variable-popover"
                popover="auto"
                className="bg-stone-900 border border-stone-700 rounded-lg p-6 m-auto backdrop:bg-black backdrop:opacity-50 relative min-w-[300px] max-w-[400px]"
            >
                <button
                    className="px-4 py-2 text-stone-400 hover:text-stone-200 transition cursor-pointer absolute top-2 right-2"
                    popovertarget="delete-variable-popover"
                    popovertargetaction="hide"
                >
                    <MdClose size={24} />
                </button>

                <h3 className="text-stone-200 text-lg font-medium mb-2">Delete Variable</h3>
                <p className="text-stone-400 mb-6">
                    Are you sure you want to delete variable <span className="text-stone-200 font-mono font-bold">{variableToDelete}</span>?
                    <br />This will remove its stored value.
                </p>

                <div className="flex justify-end gap-3">
                    <button
                        popovertarget="delete-variable-popover"
                        popovertargetaction="hide"
                        className="px-4 py-2 text-stone-400 hover:text-stone-200 transition cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={executeDelete}
                        popovertarget="delete-variable-popover"
                        popovertargetaction="hide"
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition cursor-pointer"
                    >
                        Delete
                    </button>
                </div>
            </div>

            <div
                id="add-variable-popover"
                ref={addPopoverRef}
                popover="auto"
                className="bg-stone-900 border border-stone-700 rounded-lg p-6 m-auto backdrop:bg-black backdrop:opacity-50 relative min-w-[300px] max-w-[400px]"
            >
                <button
                    className="px-4 py-2 text-stone-400 hover:text-stone-200 transition cursor-pointer absolute top-2 right-2"
                    popovertarget="add-variable-popover"
                    popovertargetaction="hide"
                >
                    <MdClose size={24} />
                </button>

                <h3 className="text-stone-200 text-lg font-medium mb-4">Add New Variable</h3>

                <div className="flex flex-col gap-2 mb-6">
                    <label className="text-stone-400 text-sm">Variable Name</label>
                    <input
                        type="text"
                        value={newVarName}
                        onChange={(e) => {
                            const val = e.target.value;
                            setNewVarName(val);
                            if (variables.hasOwnProperty(val.trim())) {
                                setNewVarError("Variable already exists.");
                            } else if (val && !/^[a-zA-Z0-9_]+$/.test(val)) {
                                setNewVarError("Only letters, numbers and '_' allowed.");
                            } else {
                                setNewVarError("");
                            }
                        }}
                        className="bg-stone-800 text-stone-200 rounded p-2 border border-stone-700 focus:border-blue-500 outline-none"
                        placeholder="variable name"
                        ref={inputRef}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddVariable();
                            }
                        }}
                    />
                    {newVarError && <span className="text-red-500 text-xs">{newVarError}</span>}
                </div>

                <div className="flex justify-end gap-3">
                    <button
                        popovertarget="add-variable-popover"
                        popovertargetaction="hide"
                        className="px-4 py-2 text-stone-400 hover:text-stone-200 transition cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleAddVariable}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition cursor-pointer"
                    >
                        Create
                    </button>
                </div>
            </div>
        </>
    );
};

Variables.propTypes = {
    value: PropTypes.string.isRequired,
    initialValues: PropTypes.object,
    onVariablesChange: PropTypes.func.isRequired,
    onRenameVariable: PropTypes.func,
};

export default Variables;
