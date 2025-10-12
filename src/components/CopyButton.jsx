import { useState } from "react";
import Button from "./Button";

const CopyButton = ({ textToCopy, children }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      setCopied(false);
    }
  };

  return (
    <Button onClick={handleCopy} disabled={copied}>
      {copied ? <i className="material-symbols-outlined">done</i> : children}
    </Button>
  );
};

export default CopyButton;
