import { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { parseMarkdownToTree } from "../utils/treeUtils";

const STORAGE_KEY = "promptMage.library";
const OLD_STORAGE_KEY = "promptMage.stored";
const LAST_PROMPT_KEY = "promptMage.lastPromptId";

const DEFAULT_PROMPT = {
    id: "default",
    name: "My First Prompt",
    content: parseMarkdownToTree("**Hello world!!!**"),
    createdAt: Date.now(),
    updatedAt: Date.now(),
};

export default function usePromptLibrary() {
    const [prompts, setPrompts] = useState([]);
    const [selectedPromptId, _setSelectedPromptId] = useState(null);

    const setSelectedPromptId = useCallback((id) => {
        _setSelectedPromptId(id);
        if (id) localStorage.setItem(LAST_PROMPT_KEY, id);
    }, []);

    // Load from storage on mount
    useEffect(() => {
        const storedLibrary = localStorage.getItem(STORAGE_KEY);
        let initialPrompts = [];

        if (storedLibrary) {
            try {
                initialPrompts = JSON.parse(storedLibrary);
                // Ensure all prompts have tree structure content
                initialPrompts = initialPrompts.map(p => {
                    if (typeof p.content === 'string') {
                        return { ...p, content: parseMarkdownToTree(p.content) };
                    }
                    return p;
                });
            } catch (e) {
                console.error("Failed to parse prompt library", e);
            }
        }

        // Migration: Check for old single prompt if library is empty
        if (initialPrompts.length === 0) {
            const oldStored = localStorage.getItem(OLD_STORAGE_KEY);
            if (oldStored) {
                try {
                    // If it's a raw string (which it was in previous version), use it
                    // The previous hook used JSON.stringify, so it might be a quoted string
                    let content = oldStored;
                    try {
                        const parsed = JSON.parse(oldStored);
                        if (typeof parsed === 'string') content = parsed;
                    } catch {
                        // use raw
                    }

                    initialPrompts.push({
                        ...DEFAULT_PROMPT,
                        id: uuidv4(),
                        content: parseMarkdownToTree(content),
                    });
                } catch (e) {
                    initialPrompts.push({ ...DEFAULT_PROMPT, id: uuidv4() });
                }
            } else {
                initialPrompts.push({ ...DEFAULT_PROMPT, id: uuidv4() });
            }
        }

        setPrompts(initialPrompts);
        if (initialPrompts.length > 0) {
            const lastId = localStorage.getItem(LAST_PROMPT_KEY);
            const match = lastId && initialPrompts.find(p => p.id === lastId);
            setSelectedPromptId(match ? match.id : initialPrompts[0].id);
        }
    }, []);

    // Persist to storage whenever prompts change
    useEffect(() => {
        if (prompts.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
        }
    }, [prompts]);

    const addPrompt = useCallback((options = {}) => {
        const newPrompt = {
            id: uuidv4(),
            name: options.name || "New Prompt",
            content: options.content !== undefined
                ? (typeof options.content === 'string' ? parseMarkdownToTree(options.content) : options.content)
                : parseMarkdownToTree(""),
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        setPrompts((prev) => [...prev, newPrompt]);
        setSelectedPromptId(newPrompt.id);
        return newPrompt.id;
    }, []);

    const updatePrompt = useCallback((id, updates) => {
        setPrompts((prev) =>
            prev.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p))
        );
    }, []);

    const deletePrompt = useCallback((id) => {
        setPrompts((prev) => {
            const newPrompts = prev.filter((p) => p.id !== id);
            // If we deleted the selected one, select the first one available
            if (selectedPromptId === id && newPrompts.length > 0) {
                setSelectedPromptId(newPrompts[0].id);
            } else if (newPrompts.length === 0) {
                // Don't allow empty library
                const newDefault = { ...DEFAULT_PROMPT, id: uuidv4() };
                setSelectedPromptId(newDefault.id);
                return [newDefault];
            }
            return newPrompts;
        });
    }, [selectedPromptId]);

    const selectedPrompt = prompts.find((p) => p.id === selectedPromptId) || prompts[0];

    return {
        prompts,
        selectedPrompt,
        setSelectedPromptId,
        addPrompt,
        updatePrompt,
        deletePrompt,
    };
}
