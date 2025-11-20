import { useRef } from "react";
import Prompt from "./components/Prompt";
import { VERSION } from "./environment";
import { MdOutlineSecurityUpdateWarning } from "react-icons/md";

function App() {
  const dialogRef = useRef(null);

  const openDialog = () => {
    dialogRef.current.showModal();
  };

  const closeDialog = () => {
    dialogRef.current.close();
  };

  const onBackdropClick = (e) => {
    if (e.target === dialogRef.current) {
      closeDialog();
    }
  };

  return (
    <>
      <div className="flex flex-col h-full w-full justify-between">
        <header className="h-[8%] flex items-center justify-center bg-linear-to-br from-[#3f51b5] to-[#9fa8da] gap-2">
          <img src="/logo.png" alt="PromptMage Logo" className="h-[80%] aspect-square rounded-md border-2 border-stone-200" />
          <div className="text-center font-bold text-3xl text-stone-300 select-none">PromptMage</div>
        </header>
        <main className="hidden md:flex flex-col grow w-full h-full overflow-y-auto">
          <Prompt />
        </main>
        <div className="md:hidden m-auto text-stone-400 flex flex-col gap-4 justify-center items-center p-10">
          <MdOutlineSecurityUpdateWarning size={64} />
          <p className="text-3xl text-center ">Sorry, mobile layout not supported</p>
        </div>
        <footer className="h-[20px] xl:h-[40px] text-stone-100 bg-linear-to-tl from-[#3f51b5] to-[#9fa8da] flex justify-end gap-4 px-2 items-center">
          <button onClick={openDialog} className="cursor-pointer">
            About
          </button>
          <p className="">{`PromptMage ${VERSION} | 2025`}</p>
        </footer>
      </div>
      <dialog ref={dialogRef} onClick={onBackdropClick} className="rounded-md w-[80vw] h-[80vh] m-auto">
        <div className=" p-4 flex flex-col items-center justify-between size-full bg-gradient-to-tl from-gray-900 to-gray-500 text-2xl text-stone-300 gap-3">
          <p className="font-bold text-2xl">PromptMage - The prompt editor</p>
          <div className="flex flex-col flex-grow">
            <p>Gives freedom to create and edit prompts, you are no longer limited by simple text inputs.</p>
            <p>Features:</p>
            <ul className="list-disc list-inside">
              <li>Integrated Markdown editor</li>
              <li>Dynamic real-time preview with interactive Table of Contents</li>
              <li>Smart base prompt suggestions</li>
              <li>Flexible export options (Markdown or JSON-escaped text to clipboard)</li>
              <li>Seamless import options (Markdown or JSON-escaped text from clipboard)</li>
              <li>Advanced prompt statistics including token estimation</li>
              <li>Local storage persistence for prompt management</li>
            </ul>
          </div>
          <button onClick={closeDialog} className="bg-green-600 py-2 px-4 rounded-md text-stone-200 ">
            Close
          </button>
        </div>
      </dialog>
    </>
  );
}

export default App;
