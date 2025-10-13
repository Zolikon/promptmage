import { useRef } from "react";
import Prompt from "./components/Prompt";

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
      <div className="flex flex-col h-full w-full">
        <header className="h-[8%] flex items-center justify-center bg-linear-to-br from-orange-700 to-yellow-500">
          <div className="text-center m-auto font-bold text-3xl text-stone-300">PromptMage</div>
        </header>
        <main className="flex flex-col grow w-full h-full overflow-y-auto">
          <Prompt />
        </main>
        <footer className="h-[20px] xl:h-[40px] text-stone-100 bg-linear-to-tl from-orange-700 to-yellow-500 flex justify-end gap-4 px-2 items-center">
          <button onClick={openDialog} className="cursor-pointer">
            About
          </button>
          <p className="">{`PromptMage | 2025`}</p>
        </footer>
      </div>
      <dialog ref={dialogRef} onClick={onBackdropClick} className="rounded-md w-[80vw] h-[80vh] m-auto">
        <div className=" p-4 flex flex-col items-center justify-between size-full">
          <p className="font-bold text-2xl">PromptMage</p>
          <div>
            <p>Markdown prompt editor</p>
            <p>Gives freedom to create and edit prompts, you are no longer limited by simple text inputs.</p>
            <p>Supports copy as is or as insertable into JSON</p>
          </div>
          <button onClick={closeDialog} className="bg-green-600 py-2 px-4 rounded-md text-stone-200">
            Close
          </button>
        </div>
      </dialog>
    </>
  );
}

export default App;
