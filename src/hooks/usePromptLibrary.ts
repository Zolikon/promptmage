import { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { parseMarkdownToTree } from "../utils/treeUtils";
import { TreeNode, Prompt } from "../types";

const STORAGE_KEY = "promptMage.library";
const OLD_STORAGE_KEY = "promptMage.stored";
const LAST_PROMPT_KEY = "promptMage.lastPromptId";

const DEFAULT_PROMPT: Prompt = {
    id: "default",
    name: "My First Prompt",
    content: parseMarkdownToTree("**Hello world!!!**"),
    createdAt: Date.now(),
    updatedAt: Date.now(),
};

interface RawPrompt {
    id: string;
    name: string;
    content: TreeNode | string;
    createdAt: number;
    updatedAt: number;
    variableValues?: Record<string, string>;
}

// TEMPORARY: Migrate prompts from pre-2.1 data formats.
// Remove once all users have loaded the app at least once on 2.1+.
function migratePrompt(p: RawPrompt): Prompt {
    let changed = false;
    let content: TreeNode | string = p.content;

    // Pre-2.0: content was a plain markdown string
    if (typeof content === 'string') {
        content = parseMarkdownToTree(content);
        changed = true;
    }

    // Null / undefined / otherwise invalid content → empty tree
    if (!content || typeof content !== 'object' || !('id' in content) || !Array.isArray((content as TreeNode).children)) {
        content = parseMarkdownToTree("");
        changed = true;
    }

    // Pre-2.1: variableValues field is no longer used
    const hasVariableValues = 'variableValues' in p;

    if (!changed && !hasVariableValues) return p as Prompt;

    const { variableValues: _, ...rest } = p;
    return { ...rest, content: content as TreeNode };
}

export interface AddPromptOptions {
    name?: string;
    content?: string | TreeNode;
}

export interface PromptLibrary {
    prompts: Prompt[];
    selectedPrompt: Prompt | undefined;
    setSelectedPromptId: (id: string) => void;
    addPrompt: (options?: AddPromptOptions) => string;
    updatePrompt: (id: string, updates: Partial<Prompt>) => void;
    deletePrompt: (id: string) => void;
}

export default function usePromptLibrary(): PromptLibrary {
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [selectedPromptId, _setSelectedPromptId] = useState<string | null>(null);

    const setSelectedPromptId = useCallback((id: string) => {
        _setSelectedPromptId(id);
        if (id) localStorage.setItem(LAST_PROMPT_KEY, id);
    }, []);

    // Load from storage on mount
    useEffect(() => {
        const storedLibrary = localStorage.getItem(STORAGE_KEY);
        let initialPrompts: Prompt[] = [];

        if (storedLibrary) {
            try {
                initialPrompts = (JSON.parse(storedLibrary) as RawPrompt[]).map(migratePrompt);
            } catch (e) {
                console.error("Failed to parse prompt library", e);
            }
        }

        // Migration: Check for old single prompt if library is empty
        if (initialPrompts.length === 0) {
            const oldStored = localStorage.getItem(OLD_STORAGE_KEY);
            if (oldStored) {
                try {
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
                } catch {
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

    const addPrompt = useCallback((options: AddPromptOptions = {}): string => {
        const newPrompt: Prompt = {
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

    const updatePrompt = useCallback((id: string, updates: Partial<Prompt>) => {
        setPrompts((prev) =>
            prev.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p))
        );
    }, []);

    const deletePrompt = useCallback((id: string) => {
        setPrompts((prev) => {
            const newPrompts = prev.filter((p) => p.id !== id);
            // If we deleted the selected one, select the first one available
            if (selectedPromptId === id && newPrompts.length > 0) {
                setSelectedPromptId(newPrompts[0].id);
            } else if (newPrompts.length === 0) {
                // Don't allow empty library
                const newDefault: Prompt = { ...DEFAULT_PROMPT, id: uuidv4() };
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
