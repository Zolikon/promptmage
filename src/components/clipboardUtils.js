export const convertForJsonInsertion = (text) => {
  console.log("Converting for JSON insertion:", text);
  return text.replace(/"/g, '\\"').replace(/\n/g, "\\n");
};

export const convertFromJsonInsertion = (text) => {
  return text.replace(/\\"/g, '"').replace(/\\n/g, "\n");
};

export const readTextFromClipboard = async () => {
  try {
    const text = await navigator.clipboard.readText();
    return text;
  } catch (error) {
    console.error("Failed to read clipboard contents:", error);
    return "";
  }
};
