export const evaluate = (
  code: string,
  context: Record<string, any> = {},
): any => {
  return function evaluateEval(): any {
    const argsStr = Object.keys(context)
      .map((key) => `${key} = this.${key}`)
      .join(",");

    const argsDef = argsStr ? `let ${argsStr};` : "";
    const evalStr = `(() => {${argsDef} return ${code}})`;

    const result = eval(evalStr);
    return result();
  }.call(context);
};
