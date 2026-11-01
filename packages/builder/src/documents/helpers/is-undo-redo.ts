export const isUndoRedo = (e: KeyboardEvent) => {
  if (e.key !== "z" && e.key !== "Z") return false;
  if (e.metaKey || e.ctrlKey) {
    return e.shiftKey ? "redo" : "undo";
  }

  return false;
};
