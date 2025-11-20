import React, { useEffect, useState, useRef } from "react";
import Mustache from "mustache";
import PropTypes from "prop-types";
import { MdDelete } from "react-icons/md";

const Variables = ({ value, initialValues = {}, onVariablesChange }) => {
    const [variables, setVariables] = useState(initialValues);
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
        if (confirm(`Delete variable "${key}"? This will remove its stored value.`)) {
            setVariables((prev) => {
                const next = { ...prev };
                delete next[key];
                return next;
            });
        }
    };

    const varKeys = Object.keys(variables);

    if (varKeys.length === 0) {
        return (
            <div className="text-stone-500 text-center p-4 italic">
                No variables detected. Use {"{{variable}}"} syntax.
            </div>
        );
    }

    return (
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
                                className="p-1 hover:text-red-400 text-stone-500 transition"
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
    );
};

Variables.propTypes = {
    value: PropTypes.string.isRequired,
    initialValues: PropTypes.object,
    onVariablesChange: PropTypes.func.isRequired,
};

export default Variables;
