export interface TreeNode {
  id: string;
  level: number;
  text: string;
  content: string | null;
  children: TreeNode[];
  isOpen: boolean;
}

export interface Prompt {
  id: string;
  name: string;
  content: TreeNode;
  createdAt: number;
  updatedAt: number;
}
