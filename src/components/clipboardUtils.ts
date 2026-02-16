export const convertForJsonInsertion = (text: string): string => {
  return text.replace(/"/g, '\\"').replace(/\n/g, "\\n");
};

export const convertFromJsonInsertion = (text: string): string => {
  return text.replace(/\\"/g, '"').replace(/\\n/g, "\n");
};

export const readTextFromClipboard = async (): Promise<string> => {
  try {
    const text = await navigator.clipboard.readText();
    return text;
  } catch (error) {
    console.error("Failed to read clipboard contents:", error);
    return "";
  }
};
