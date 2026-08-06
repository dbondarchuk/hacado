import {
  Children,
  type ReactElement,
  type ReactNode,
  isValidElement,
} from "react";

export const transformChildrenToString = (
  children: ReactNode | ReactNode[],
): string => {
  if (!Array.isArray(children) && !isValidElement(children)) {
    return childToString(children);
  }

  return Children.toArray(children).reduce(
    (text: string, child: ReactNode): string => {
      let newText = "";

      if (hasChildren(child)) {
        newText = transformChildrenToString(child.props.children);
      } else if (isValidElement(child)) {
        newText = "";
      } else {
        newText = childToString(child);
      }

      return text.concat(newText);
    },
    "",
  );
};

const childToString = (child?: ReactNode): string => {
  if (
    typeof child === "undefined" ||
    child === null ||
    typeof child === "boolean"
  ) {
    return "";
  }

  if (JSON.stringify(child) === "{}") {
    return "";
  }

  return child.toString();
};

const hasChildren = (
  element: ReactNode,
): element is ReactElement<{ children: ReactNode | ReactNode[] }> =>
  isValidElement<{ children?: ReactNode[] }>(element) &&
  Boolean(element.props.children);
