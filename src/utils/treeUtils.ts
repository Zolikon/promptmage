import { v4 as uuidv4 } from 'uuid';
import { TreeNode } from '../types';

export const createNode = (level: number, text: string, content: string | null = null): TreeNode => ({
    id: uuidv4(),
    level,
    text,
    content,
    children: [],
    isOpen: true
});

export const parseMarkdownToTree = (markdown: string): TreeNode => {
    const root = createNode(0, "Root");
    if (!markdown) return root;

    // Normalize newlines
    const lines = markdown.split(/\r?\n/);
    const nodeStack: TreeNode[] = [root];

    let currentContentLines: string[] = [];

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
        const headerMatch = line.match(/^(#{1,6})\s+(.*)/);

        if (headerMatch) {
            flushContent();
            const level = headerMatch[1].length;
            const text = headerMatch[2];
            const newNode = createNode(level, text);

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

export const treeToMarkdown = (node: TreeNode, _isTopLevel = true): string => {
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

export const ensureUniqueIds = (root: TreeNode): TreeNode => {
    const seen = new Set<string>();
    const traverse = (node: TreeNode): TreeNode => {
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

export const findNodeById = (root: TreeNode, id: string): TreeNode | null => {
    if (root.id === id) return root;
    if (root.children) {
        for (const child of root.children) {
            const found = findNodeById(child, id);
            if (found) return found;
        }
    }
    return null;
};

export const findPathToNode = (root: TreeNode, targetId: string, currentPath: string[] = []): string[] | null => {
    if (root.id === targetId) return currentPath;
    if (root.children) {
        for (const child of root.children) {
            const result = findPathToNode(child, targetId, [...currentPath, child.text]);
            if (result) return result;
        }
    }
    return null;
};

// Find parent of node by ID
export const findParentNode = (root: TreeNode, childId: string): TreeNode | null => {
    if (!root.children) return null;
    for (const child of root.children) {
        if (child.id === childId) return root;
        const found = findParentNode(child, childId);
        if (found) return found;
    }
    return null;
}

export const replaceNodeInTree = (root: TreeNode, targetId: string, newNodes: TreeNode[]): TreeNode => {
    if (root.id === targetId) {
        if (newNodes.length === 1 && newNodes[0].level === 0) {
            return newNodes[0];
        } else {
            return newNodes[0];
        }
    }

    if (!root.children) return root;

    const index = root.children.findIndex(c => c.id === targetId);
    if (index !== -1) {
        const newChildren = [...root.children];
        newChildren.splice(index, 1, ...newNodes);
        return { ...root, children: newChildren };
    }

    const newChildren = root.children.map(child => replaceNodeInTree(child, targetId, newNodes));
    const changed = newChildren.some((child, i) => child !== root.children[i]);
    if (!changed) return root;

    return { ...root, children: newChildren };
}

export const updateNodeTitle = (root: TreeNode, nodeId: string, newTitle: string): TreeNode => {
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

export const updateTreeWithFragment = (root: TreeNode, targetId: string, fragmentRoot: TreeNode): TreeNode => {
    // Handling Root edit case
    if (root.id === targetId) {
        return { ...fragmentRoot, id: root.id };
    }

    // Helper to traverse and find parent
    const traverse = (node: TreeNode): TreeNode => {
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
