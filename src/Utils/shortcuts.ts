// utils/shortcut.ts
type KeyboardShortcut = {
  key: string;
  description: string;
  action: (currentIndex: number) => void;
};

const handleNext = (currentIndex: number) => {
  const nextField = document.querySelector<HTMLInputElement>(
    `[data-time-input="${currentIndex}"]`,
  );
  nextField?.focus();
};

const handleZoomIn = () => {
  console.log("Zooming in on the file preview");
};

const handleZoomOut = () => {
  console.log("Zooming out of the file preview");
};

const handleRotate = (degrees: number) => {
  console.log(`Rotating the file preview by ${degrees} degrees`);
};

const handleSearchOpen = () => {
  console.log("Opening the search options");
};

const handleSelectOption = (index: number) => {
  console.log(`Selecting option at index ${index}`);
};

const handleCloseSearch = () => {
  console.log("Closing the search options");
};

export const Shortcuts: KeyboardShortcut[] = [
  {
    key: "ArrowLeft",
    description: "Move focus to the previous input field",
    action: (currentIndex) => {
      if (currentIndex > 0) {
        const previousField = document.querySelector<HTMLInputElement>(
          `[data-time-input="${currentIndex - 1}"]`,
        );
        previousField?.focus();
      }
    },
  },
  {
    key: "ArrowRight",
    description: "Move focus to the next input field",
    action: (currentIndex) => {
      if (currentIndex < 4) {
        const nextField = document.querySelector<HTMLInputElement>(
          `[data-time-input="${currentIndex + 1}"]`,
        );
        nextField?.focus();
      }
    },
  },
  {
    key: "Backspace",
    description: "Clear current input and move to the previous field if empty",
    action: (currentIndex) => {
      const currentField = document.querySelector<HTMLInputElement>(
        `[data-time-input="${currentIndex}"]`,
      );
      if (currentField && currentField.value === "" && currentIndex > 0) {
        const previousField = document.querySelector<HTMLInputElement>(
          `[data-time-input="${currentIndex - 1}"]`,
        );
        previousField?.focus();
      }
    },
  },
  {
    key: "Delete",
    description: "Clear current input and move to the next field if empty",
    action: (currentIndex) => {
      const currentField = document.querySelector<HTMLInputElement>(
        `[data-time-input="${currentIndex}"]`,
      );
      if (currentField && currentField.value === "" && currentIndex < 4) {
        const nextField = document.querySelector<HTMLInputElement>(
          `[data-time-input="${currentIndex + 1}"]`,
        );
        nextField?.focus();
      }
    },
  },
  {
    key: "ArrowLeft",
    description: "Navigate to the previous file in the file preview.",
    action: (currentIndex) => handleNext(currentIndex - 1),
  },
  {
    key: "ArrowRight",
    description: "Navigate to the next file in the file preview.",
    action: (currentIndex) => handleNext(currentIndex + 1),
  },
  {
    key: "ArrowUp",
    description:
      "Zoom in on the file preview (increase the scale of the content).",
    action: () => handleZoomIn(),
  },
  {
    key: "ArrowDown",
    description:
      "Zoom out of the file preview (decrease the scale of the content).",
    action: () => handleZoomOut(),
  },
  {
    key: "r",
    description: "Rotate the file preview counterclockwise by 90 degrees.",
    action: () => handleRotate(-90),
  },
  {
    key: "t",
    description: "Rotate the file preview clockwise by 90 degrees.",
    action: () => handleRotate(90),
  },
  {
    key: "/",
    description: "Open the search options.",
    action: () => handleSearchOpen(),
  },
  {
    key: "ArrowDown",
    description: "Navigate to the next option in the search options.",
    action: (currentIndex) => {
      console.log("Navigating to next search option");
      handleSelectOption(currentIndex + 1);
    },
  },
  {
    key: "ArrowUp",
    description: "Navigate to the previous option in the search options.",
    action: (currentIndex) => {
      console.log("Navigating to previous search option");
      handleSelectOption(currentIndex - 1);
    },
  },
  {
    key: "Enter",
    description: "Select the currently focused option in the search options.",
    action: (currentIndex) => handleSelectOption(currentIndex),
  },
  {
    key: "Escape",
    description: "Close the search options dropdown.",
    action: () => handleCloseSearch(),
  },
];
