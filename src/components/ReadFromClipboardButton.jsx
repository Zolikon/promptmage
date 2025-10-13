import { useState } from "react";
import { MdOutlineDocumentScanner, MdDone } from "react-icons/md";

const ReadFromClipboardButton = ({ onRead }) => {
  const [copied, setCopied] = useState(false);

  const handleRead = async () => {
    try {
      const text = await navigator.clipboard.readText();
      onRead(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error("Failed to read clipboard contents:", error);
    }
  };

  return (
    <button onClick={handleRead} disabled={copied} className="cursor-pointer disabled:cursor-default">
      {copied ? <MdDone size={32} /> : <MdOutlineDocumentScanner size={32} />}
    </button>
  );
};
export default ReadFromClipboardButton;
