const when = (utility: string) =>
  [
    `aria-[invalid=true]:${utility}`,
    `[&[invalid]]:${utility}`,
    `has-[[aria-invalid=true]]:${utility}`,
    `has-[[invalid]]:${utility}`,
  ].join(" ");

/** Border and focus ring for the element that carries the invalid state. */
export const invalidControlClass = [
  "aria-[invalid=true]:border-destructive",
  "[&[invalid]]:border-destructive",
  "aria-[invalid=true]:focus:ring-destructive",
  "[&[invalid]]:focus:ring-destructive",
  "aria-[invalid=true]:focus-visible:ring-destructive",
  "[&[invalid]]:focus-visible:ring-destructive",
].join(" ");

/** Wrapper whose own border is the control, including invalid children. */
export const invalidShellClass = [
  when("border-destructive"),
  when("focus-within:ring-destructive"),
].join(" ");

/** Grouped control: shell plus borders on the input, nested buttons, and direct addons. */
export const invalidGroupedClass = [
  invalidShellClass,
  when("[&_input]:border-destructive"),
  when("[&_button]:border-destructive"),
  when("[&>*]:border-destructive"),
  // One variant. Stacking has- with [&_button] attaches :has() to the button.
  "[&:has([aria-invalid=true])_input]:border-destructive",
  "[&:has([invalid])_input]:border-destructive",
  "[&:has([aria-invalid=true])_button]:border-destructive",
  "[&:has([invalid])_button]:border-destructive",
  "[&:has([aria-invalid=true])>*]:border-destructive",
  "[&:has([invalid])>*]:border-destructive",
  "[&:has([aria-invalid=true]):has([data-state=open])]:ring-destructive",
  "[&:has([invalid]):has([data-state=open])]:ring-destructive",
  "[&:has([aria-invalid=true]):has([data-state=open])_input]:border-destructive",
  "[&:has([invalid]):has([data-state=open])_input]:border-destructive",
  "[&:has([aria-invalid=true]):has([data-state=open])_button]:border-destructive",
  "[&:has([invalid]):has([data-state=open])_button]:border-destructive",
  "[&:has([aria-invalid=true]):has([data-state=open])>*]:border-destructive",
  "[&:has([invalid]):has([data-state=open])>*]:border-destructive",
].join(" ");

export const isInvalidProp = (props: {
  "aria-invalid"?: unknown;
  invalid?: unknown;
}) => {
  const ariaInvalid = props["aria-invalid"];
  const invalid = props.invalid;

  return (
    ariaInvalid === true ||
    ariaInvalid === "true" ||
    invalid === true ||
    invalid === "" ||
    invalid === "true"
  );
};
