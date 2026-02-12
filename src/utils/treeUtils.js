import { v4 as uuidv4 } from 'uuid';

export const createNode = (level, text, content = null) => ({
    id: uuidv4(),
    level,
    text,
    content,
    children: [],
    isOpen: true
});

export const parseMarkdownToTree = (markdown) => {
    const root = createNode(0, "Root");
    if (!markdown) return root;

    // Normalize newlines
    const lines = markdown.split(/\r?\n/);
    const nodeStack = [root];

    let currentContentLines = [];

    const flushContent = () => {
        if (currentContentLines.length > 0) {
            const activeNode = nodeStack[nodeStack.length - 1];
            const contentText = currentContentLines.join("\n");
            if (activeNode.content != null) {
                activeNode.content += "\n" + contentText;
            } else {
                activeNode.content = contentText;
            }
            currentContentLines = [];
        }
    };

    lines.forEach((line) => {
        // Determine if line is a header
        const headerMatch = line.match(/^(#{1,6})\s+(.*)/);

        // Check if we are inside a code block?
        // Simple heuristic: if we see header pattern, we assume header. 
        // Ideally we should track ``` code blocks, but for now we follow the simple logic of previous implementation.

        if (headerMatch) {
            flushContent();
            const level = headerMatch[1].length;
            const text = headerMatch[2];
            const newNode = createNode(level, text);

            // Find the correct parent in the stack
            // Pop nodes that are same level or deeper (higher number)
            // Example: Stack has [Root, H1, H2]. New node is H2.
            // H2 level 2 >= H2 level 2. Pop H2. Stack: [Root, H1]. Parent is H1.
            // New node H1. H1 level 1 >= H1 level 1. Pop H1. Stack: [Root]. Parent Root.
            while (nodeStack.length > 1 && nodeStack[nodeStack.length - 1].level >= level) {
                nodeStack.pop();
            }

            const parent = nodeStack[nodeStack.length - 1];
            parent.children.push(newNode);
            nodeStack.push(newNode);
        } else {
            currentContentLines.push(line);
        }
    });

    flushContent();
    return root;
};

export const treeToMarkdown = (node, _isTopLevel = true) => {
    let output = "";
    // Don't print root header
    if (node.level > 0) {
        output += `${"#".repeat(node.level)} ${node.text}\n`;
    }
    if (node.content != null) {
        output += node.content + "\n";
    }

    if (node.children && node.children.length > 0) {
        node.children.forEach(child => {
            output += treeToMarkdown(child, false);
        });
    }

    // Only strip the trailing newline at the top level to prevent
    // newline accumulation across parse→tree→markdown cycles
    if (_isTopLevel && output.endsWith("\n")) {
        output = output.slice(0, -1);
    }
    return output;
};

export const ensureUniqueIds = (root) => {
    const seen = new Set();
    const traverse = (node) => {
        let id = node.id;
        if (seen.has(id)) {
            id = uuidv4();
        }
        seen.add(id);

        let children = node.children;
        if (children && children.length > 0) {
            const newChildren = children.map(traverse);
            if (newChildren.some((c, i) => c !== children[i])) {
                children = newChildren;
            }
        }

        if (id !== node.id || children !== node.children) {
            return { ...node, id, children };
        }
        return node;
    };
    return traverse(root);
};

export const findNodeById = (root, id) => {
    if (root.id === id) return root;
    if (root.children) {
        for (let child of root.children) {
            const found = findNodeById(child, id);
            if (found) return found;
        }
    }
    return null;
};

export const findPathToNode = (root, targetId, currentPath = []) => {
    if (root.id === targetId) return currentPath;
    if (root.children) {
        for (let child of root.children) {
            // Note: Use child.text for visual Breadcrumbs?
            // User requested Breadcrumbs reflect structure.
            const result = findPathToNode(child, targetId, [...currentPath, child.text]);
            if (result) return result;
        }
    }
    return null;
};

// Find parent of node by ID
export const findParentNode = (root, childId) => {
    if (!root.children) return null;
    for (let child of root.children) {
        if (child.id === childId) return root;
        const found = findParentNode(child, childId);
        if (found) return found;
    }
    return null;
}

export const replaceNodeInTree = (root, targetId, newNodes) => {
    // If root itself is the target, we can't replace it with multiple nodes easily if the return type is single Root.
    // Use case: modifying a child.
    // If targetId is root.id, we expect newNodes to be what?
    // If we edit Root, newNodes is [Root].
    if (root.id === targetId) {
        if (newNodes.length === 1 && newNodes[0].level === 0) {
            return newNodes[0];
        } else {
            // If we get multiple nodes for Root, it's weird. 
            // Maybe we return a new Root with these as children? 
            // Logic: Root is container.
            // If we edit Root content, we parse it. Parser returns a Root.
            return newNodes[0]; // Assume parser returns a Root for full doc
        }
    }

    if (!root.children) return root;

    const index = root.children.findIndex(c => c.id === targetId);
    if (index !== -1) {
        const newChildren = [...root.children];
        // Ensure newNodes are marked as children (level > root.level check?)
        // We trust the parser gave valid nodes.
        // But we might need to fix levels if we "hoisted"?
        // For now, trust the parse result relative to the edit context.
        newChildren.splice(index, 1, ...newNodes);
        return { ...root, children: newChildren };
    }

    const newChildren = root.children.map(child => replaceNodeInTree(child, targetId, newNodes));
    if (newChildren === root.children) return root; // Optimization: referential equality check if map didn't change anything? 
    // Actually map always returns new array.
    // We can optimization:
    const changed = newChildren.some((child, i) => child !== root.children[i]);
    if (!changed) return root;

    return { ...root, children: newChildren };
}

export const updateNodeTitle = (root, nodeId, newTitle) => {
    if (root.id === nodeId) {
        return { ...root, text: newTitle };
    }
    if (!root.children) return root;

    // Check children first
    const index = root.children.findIndex(c => c.id === nodeId);
    if (index !== -1) {
        const newChildren = [...root.children];
        newChildren[index] = { ...newChildren[index], text: newTitle };
        return { ...root, children: newChildren };
    }

    const newChildren = root.children.map(child => updateNodeTitle(child, nodeId, newTitle));
    return { ...root, children: newChildren };
}

export const updateTreeWithFragment = (root, targetId, fragmentRoot) => {
    // Handling Root edit case
    if (root.id === targetId) {
        return { ...fragmentRoot, id: root.id };
    }

    // Helper to traverse and find parent
    const traverse = (node) => {
        if (!node.children || node.children.length === 0) return node;

        const index = node.children.findIndex(c => c.id === targetId);

        if (index !== -1) {
            // Found parent
            const newChildren = [...node.children];
            let newContent = node.content != null ? node.content : "";

            // Merge content logic
            if (fragmentRoot.content) {
                if (index > 0) {
                    // Merge to previous sibling
                    const prevSibling = newChildren[index - 1];
                    // We need to clone prevSibling to update its content
                    newChildren[index - 1] = {
                        ...prevSibling,
                        content: (prevSibling.content || "") + ((prevSibling.content && fragmentRoot.content) ? "\n" : "") + fragmentRoot.content
                    };
                } else {
                    // Merge to parent (this node)
                    newContent = newContent + ((newContent && fragmentRoot.content) ? "\n" : "") + fragmentRoot.content;
                }
            }

            // Replace target with fragment children
            newChildren.splice(index, 1, ...(fragmentRoot.children || []));

            return { ...node, content: newContent, children: newChildren };
        }

        // Continue traversal
        const nextChildren = node.children.map(traverse);
        // Check if any child changed ref
        if (nextChildren.some((child, i) => child !== node.children[i])) {
            return { ...node, children: nextChildren };
        }

        return node;
    }

    return traverse(root);
};

