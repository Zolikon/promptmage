import React, { useEffect, useState, useRef } from "react";
import Mustache from "mustache";
import PropTypes from "prop-types";
import { MdDelete, MdClose } from "react-icons/md";

const Variables = ({ value, initialValues = {}, onVariablesChange }) => {
    const [variables, setVariables] = useState(initialValues);
    const [variableToDelete, setVariableToDelete] = useState(null);
    const [usedVars, setUsedVars] = useState(new Set());
    const isSyncingRef = useRef(false);

    // Sync with initialValues when they change (e.g., when switching prompts)
    useEffect(() => {
        isSyncingRef.current = true;
        setVariables(initialValues);
        // We'll extract used vars in the next effect
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
                        extractedVars.add(token[1]);
                        if (token[4]) { // Nested tokens for sections
                            findVars(token[4]);
                        }
                    }
                });
            };

            findVars(parsed);
            setUsedVars(extractedVars);

            // Add new variables found in content (but don't remove unused ones)
            setVariables((prev) => {
                const next = { ...prev };
                let hasChanges = false;

                // Only add new vars, don't remove unused ones
                extractedVars.forEach((key) => {
                    if (next[key] === undefined) {
                        next[key] = "";
                        hasChanges = true;
                    }
                });

                return hasChanges ? next : prev;
            });
        } catch (e) {
            // Ignore parse errors while typing
        }
    }, [value]);

    // Notify parent of changes, but not during initial sync
    useEffect(() => {
        if (isSyncingRef.current) {
            isSyncingRef.current = false;
            return;
        }
        onVariablesChange(variables);
    }, [variables, onVariablesChange]);

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

    const varKeys = Object.keys(variables);

    // Reset state when popover closes
    useEffect(() => {
        const popover = document.getElementById("delete-variable-popover");
        if (!popover) return;

        const handleToggle = (e) => {
            if (e.newState === "closed") {
                setVariableToDelete(null);
            }
        };

        popover.addEventListener("toggle", handleToggle);
        return () => popover.removeEventListener("toggle", handleToggle);
    }, []);

    if (varKeys.length === 0) {
        return (
            <div className="text-stone-500 text-center p-4 italic">
                No variables detected. Use {"{{variable}}"} syntax.
            </div>
        );
    }

    return (
        <>
            <div className="flex flex-col gap-3 w-full p-2">
                {varKeys.map((key) => {
                    const isUsed = usedVars.has(key);
                    return (
                        <div key={key} className="flex flex-col gap-1">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <label className="text-stone-400 text-sm font-mono">{key}</label>
                                    {!isUsed && (
                                        <span className="text-xs text-orange-500 italic">(unused)</span>
                                    )}
                                </div>
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
                            <textarea
                                value={variables[key]}
                                onChange={(e) => handleChange(key, e.target.value)}
                                className={`bg-stone-800 text-stone-200 rounded p-2 border ${isUsed ? "border-stone-700" : "border-orange-900"
                                    } focus:border-blue-500 outline-none resize-y min-h-[40px]`}
                                rows={1}
                            />
                        </div>
                    );
                })}
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
        </>
    );
};

Variables.propTypes = {
    value: PropTypes.string.isRequired,
    initialValues: PropTypes.object,
    onVariablesChange: PropTypes.func.isRequired,
};

export default Variables;
