import { useState } from "react";
import IconButton from "./IconButton";

interface CopyButtonProps {
  textToCopy: string;
}

const CopyButton = ({ textToCopy }: CopyButtonProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return <IconButton onClick={handleCopy} disabled={copied} iconName={copied ? "done" : "content_copy"} />;
};

export default CopyButton;
