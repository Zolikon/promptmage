import React from "react";
import MDEditor from "@uiw/react-md-editor";
import Button from "./Button";
import Switch from "./Switch";
import CopyButton from "./CopyButton";
import IconButton from "./IconButton";

const variables = {
  test: "INJECTED VARIABLE",
};

export default function Prompt() {
  const [value, setValue] = React.useState("**Hello world!!!**");
  const [editorMode, setEditorMode] = React.useState(true);

  const updateValue = (newValue) => {
    if (newValue.endsWith("$$")) {
      const startIndex = newValue.slice(0, -2).lastIndexOf("$$");
      if (startIndex !== -1) {
        const variableName = newValue.slice(startIndex + 2, -2).trim();
        if (variables[variableName]) newValue = newValue.slice(0, startIndex) + variables[variableName];
      }
    }
    setValue(newValue);
  };

  const convertForJsonInsertion = (text) => {
    return text.replace(/"/g, '\\"').replace(/\n/g, "\\n");
  };

  return (
    <div className="w-full h-full p-4 grid grid-rows-8 grid-cols-6 gap-4">
      <div className="flex justify-center items-center col-span-7 row-start-1 row-span-1">
        <Switch
          values={["Edit", "Preview"]}
          selected={editorMode ? "Edit" : "Preview"}
          onSelect={(value) => setEditorMode(value === "Edit")}
        />
      </div>
      <div className=" row-start-2 row-span-7 col-span-5">
        {editorMode ? (
          <MDEditor
            value={value}
            onChange={updateValue}
            height={"100%"}
            commandsFilter={(command) => {
              if (command.name === "image") return false;
              return command;
            }}
          />
        ) : (
          <MDEditor.Markdown
            source={value}
            style={{ whiteSpace: "pre-wrap", padding: 12, height: "100%", borderRadius: 8 }}
          />
        )}
      </div>
      <div className="flex flex-col row-start-2 col-start-6 col-span-1 gap-3">
        <div className="flex gap-3 items-center justify-center">
          <CopyButton textToCopy={value}>
            <i className="material-symbols-outlined">content_copy</i>
          </CopyButton>
          <CopyButton textToCopy={convertForJsonInsertion(value)}>
            <i className="material-symbols-outlined">content_copy</i>
            {"  for JSON"}
          </CopyButton>
        </div>
      </div>
    </div>
  );
}
