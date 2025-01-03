// hooks/keyboardshortcut.ts
import { useEffect } from "react";

import { Shortcuts } from "@/Utils/shortcuts";

type CallbackType = (event: KeyboardEvent, currentIndex: number) => void;

const useKeyboardShortcuts = (
  currentIndex: number,
  callback?: CallbackType,
) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const shortcut = Shortcuts.find((s) => s.key === event.key);
      if (shortcut) {
        shortcut.action(currentIndex);
        if (callback) callback(event, currentIndex);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentIndex, callback]);
};

export default useKeyboardShortcuts;
