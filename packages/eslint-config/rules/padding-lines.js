"use strict";

/**
 * Mechanical blank-line style from .cursor/rules/code-style.mdc.
 *
 * Requires a blank line after a multiline statement, after a braced
 * control-flow statement, after a guard clause, and around function and class
 * declarations. Keeps consecutive guard clauses and function overloads
 * together, and removes blank lines between call arguments.
 *
 * A blank line between ordinary one-line statements is left in place. That
 * break is a logical grouping, which this rule cannot infer.
 */

/** @type {import("eslint").Rule.RuleModule} */
module.exports = {
  meta: {
    type: "layout",
    docs: {
      description:
        "Enforce blank lines around multiline statements, control flow, guards, and declarations",
    },
    fixable: "whitespace",
    schema: [],
    messages: {
      expectedBlankLine: "Expected a blank line before this statement.",
      unexpectedBlankLine: "Unexpected blank line between these statements.",
      unexpectedArgumentBlankLine:
        "Unexpected blank line between call arguments.",
    },
  },
  create(context) {
    const sourceCode = context.sourceCode;

    /**
     * @param {import("estree").Node} left
     * @param {import("estree").Node} right
     */
    function gapBetween(left, right) {
      return sourceCode.text.slice(left.range[1], right.range[0]);
    }

    /**
     * @param {import("estree").Node} left
     * @param {import("estree").Node} right
     */
    function hasBlankLine(left, right) {
      return /\n[ \t\r]*\n/.test(gapBetween(left, right));
    }

    /**
     * @param {string} gap
     */
    function collapseExtraBlankLines(gap) {
      const indent = gap.match(/[ \t]*$/)[0];
      let body = gap.slice(0, gap.length - indent.length);
      let previous;

      do {
        previous = body;
        body = body.replace(/\n[ \t\r]*(?=\n)/g, "");
      } while (body !== previous);

      return body + indent;
    }

    /**
     * @param {import("estree").Node} node
     */
    function isMultiline(node) {
      return node.loc.start.line !== node.loc.end.line;
    }

    /**
     * @param {import("estree").Node} node
     */
    function unwrapDeclaration(node) {
      if (
        (node.type === "ExportNamedDeclaration" ||
          node.type === "ExportDefaultDeclaration") &&
        node.declaration
      ) {
        return node.declaration;
      }

      return node;
    }

    /**
     * @param {import("estree").Node} node
     */
    function isFunctionOrClassDeclaration(node) {
      const declaration = unwrapDeclaration(node);

      return (
        declaration.type === "FunctionDeclaration" ||
        declaration.type === "ClassDeclaration" ||
        declaration.type === "TSDeclareFunction"
      );
    }

    /**
     * @param {import("estree").Node} node
     */
    function functionName(node) {
      const declaration = unwrapDeclaration(node);

      if (
        (declaration.type === "FunctionDeclaration" ||
          declaration.type === "TSDeclareFunction") &&
        declaration.id
      ) {
        return declaration.id.name;
      }

      return null;
    }

    /**
     * @param {import("estree").Node} node
     */
    function isFunctionOverload(node) {
      const declaration = unwrapDeclaration(node);

      return (
        (declaration.type === "FunctionDeclaration" ||
          declaration.type === "TSDeclareFunction") &&
        declaration.body == null
      );
    }

    /**
     * @param {import("estree").Node} prev
     * @param {import("estree").Node} next
     */
    function isOverloadPair(prev, next) {
      const name = functionName(prev);

      if (!name || name !== functionName(next)) {
        return false;
      }

      if (!isFunctionOverload(prev)) {
        return false;
      }

      const nextDeclaration = unwrapDeclaration(next);

      return (
        isFunctionOverload(next) ||
        (nextDeclaration.type === "FunctionDeclaration" &&
          nextDeclaration.body != null)
      );
    }

    /**
     * @param {import("estree").Node} node
     */
    function isJumpStatement(node) {
      if (node.type === "BlockStatement") {
        return node.body.length === 1 && isJumpStatement(node.body[0]);
      }

      return (
        node.type === "ReturnStatement" ||
        node.type === "ThrowStatement" ||
        node.type === "ContinueStatement" ||
        node.type === "BreakStatement"
      );
    }

    /**
     * @param {import("estree").Node} node
     */
    function isGuardIf(node) {
      return (
        node.type === "IfStatement" &&
        !node.alternate &&
        isJumpStatement(node.consequent)
      );
    }

    /**
     * @param {import("estree").Node} node
     */
    function isBlockControlFlow(node) {
      switch (node.type) {
        case "IfStatement":
          return (
            node.consequent.type === "BlockStatement" ||
            node.alternate?.type === "BlockStatement"
          );
        case "ForStatement":
        case "ForInStatement":
        case "ForOfStatement":
        case "WhileStatement":
        case "DoWhileStatement":
          return node.body.type === "BlockStatement";
        case "SwitchStatement":
        case "TryStatement":
          return true;
        default:
          return false;
      }
    }

    /**
     * @param {import("estree").Node} prev
     * @param {import("estree").Node} next
     */
    function needsBlankLine(prev, next) {
      if (isGuardIf(prev) && !isGuardIf(next)) {
        return true;
      }

      if (isMultiline(prev) || isBlockControlFlow(prev)) {
        return true;
      }

      if (
        isFunctionOrClassDeclaration(prev) ||
        isFunctionOrClassDeclaration(next)
      ) {
        return true;
      }

      return false;
    }

    /**
     * @param {import("eslint").Rule.RuleFixer} fixer
     * @param {import("estree").Node} prev
     * @param {import("estree").Node} next
     */
    function insertBlankLine(fixer, prev, next) {
      const text = sourceCode.text;
      const newline = text.includes("\r\n") ? "\r\n" : "\n";
      let index = prev.range[1];
      const limit = next.range[0];

      while (index < limit && text[index] !== "\n") {
        index += 1;
      }

      if (index < limit && text[index] === "\n") {
        if (text[index - 1] === "\r") {
          index -= 1;
        }

        return fixer.insertTextBeforeRange([index, index + 1], newline);
      }

      return fixer.insertTextAfter(prev, newline);
    }

    /**
     * @param {import("estree").Node} prev
     * @param {import("estree").Node} next
     * @param {string} messageId
     */
    function enforceNoBlankLine(prev, next, messageId) {
      if (!hasBlankLine(prev, next)) {
        return;
      }

      context.report({
        node: next,
        messageId,
        fix(fixer) {
          const gap = gapBetween(prev, next);
          const collapsed = collapseExtraBlankLines(gap);

          if (collapsed === gap) {
            return null;
          }

          return fixer.replaceTextRange(
            [prev.range[1], next.range[0]],
            collapsed,
          );
        },
      });
    }

    /**
     * @param {import("estree").Node} prev
     * @param {import("estree").Node} next
     */
    function enforceBlankLine(prev, next) {
      if (hasBlankLine(prev, next)) {
        return;
      }

      context.report({
        node: next,
        messageId: "expectedBlankLine",
        fix(fixer) {
          return insertBlankLine(fixer, prev, next);
        },
      });
    }

    /**
     * @param {import("estree").Statement[]} statements
     */
    function checkStatementList(statements) {
      for (let index = 0; index < statements.length - 1; index += 1) {
        const prev = statements[index];
        const next = statements[index + 1];

        if (!prev || !next) {
          continue;
        }

        if (
          isOverloadPair(prev, next) ||
          (isGuardIf(prev) && isGuardIf(next))
        ) {
          enforceNoBlankLine(prev, next, "unexpectedBlankLine");
          continue;
        }

        if (
          prev.type === "ImportDeclaration" &&
          next.type === "ImportDeclaration"
        ) {
          continue;
        }

        if (needsBlankLine(prev, next)) {
          enforceBlankLine(prev, next);
        }
      }
    }

    /**
     * @param {import("estree").CallExpression | import("estree").NewExpression} node
     */
    function checkCallArguments(node) {
      for (let index = 0; index < node.arguments.length - 1; index += 1) {
        enforceNoBlankLine(
          node.arguments[index],
          node.arguments[index + 1],
          "unexpectedArgumentBlankLine",
        );
      }
    }

    return {
      Program(node) {
        checkStatementList(node.body);
      },
      BlockStatement(node) {
        checkStatementList(node.body);
      },
      StaticBlock(node) {
        checkStatementList(node.body);
      },
      SwitchCase(node) {
        checkStatementList(node.consequent);
      },
      TSModuleBlock(node) {
        checkStatementList(node.body);
      },
      CallExpression: checkCallArguments,
      NewExpression: checkCallArguments,
    };
  },
};
