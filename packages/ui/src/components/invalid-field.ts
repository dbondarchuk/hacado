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

/** Grouped control: shell plus borders on the input and direct addons. */
export const invalidGroupedClass = [
  invalidShellClass,
  when("[&_input]:border-destructive"),
  when("[&>*]:border-destructive"),
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
