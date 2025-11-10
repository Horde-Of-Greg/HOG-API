/*
 * Meant to imitate the logic in
 * https://github.com/AE2-UEL/Applied-Energistics-2/blob/26bb5986c636e9bdde62559b0d1c2bbc48c4b9e3/src/main/java/appeng/util/item/OreDictFilterMatcher.java#L11
 */

import { getLogger } from "../Logger";

type Ast = AstNode | null;

type AstNode = PatternNode | OperatorNode;
type PatternNode = {
  type: "pattern";
  negation: boolean;
  children: Array<Token>;
};
type OperatorNode = {
  type: "operator";
  operator: "AND" | "OR" | "XOR";
  negation: boolean;
  children: Array<AstNode>;
};

type Token = { type: "text"; content: string } | { type: "wildcard" };

type LexemeElement = {
  type: "group" | "operator" | "negation" | "wildcard" | "text";
  content: LexemeElement[] | string | null;
};

export class Ae2uelOredicParser {
  lexemeBuffer: string;

  parenthesesCount: number;

  pos: 0;

  negationFlag: boolean;
  currentOperator: "AND" | "XOR" | "OR" | null;

  constructor(private oredicString: string) {
    this.lexemeBuffer = "";

    this.parenthesesCount = 0;

    this.pos = 0;

    this.negationFlag = false;
    this.currentOperator = null;
  }

  parse() {
    getLogger().simpleLog("debug", `parsing: ${this.oredicString}`);

    const lexemeList = this.lexicalParse(this.oredicString.split(""));
    if (this.parenthesesCount !== 0) {
      // Handle Error. Parantheses should be balanced
    }

    const ast = this.parseNode(lexemeList);
    getLogger().simpleLog(
      "debug",
      `Ast Parse: ${JSON.stringify(ast, undefined, 4)}`
    );
    return ast;
  }

  /*
   * This function iterates over the input once and makes an ordered list of lexeme
   * elements. This groups every kind of node together in only one element, making the
   * further parsing easier.
   */
  private lexicalParse(pattern: string[]) {
    let lexemeList: LexemeElement[] = [];

    for (let i = 0; i < pattern.length; i++) {
      switch (pattern[i]) {
        case " ":
          break;

        case "(":
          lexemeList = this.flushLexemeBuffer(lexemeList);
          this.updateParCount("START");

          const subList = this.lexicalParse(pattern.slice(i + 1));
          lexemeList.push({ type: "group", content: subList });

          i = this.pos + 1;

          break;
        case ")":
          this.flushLexemeBuffer(lexemeList);
          this.updateParCount("END");
          return lexemeList;

        case "&":
          lexemeList = this.flushLexemeBuffer(lexemeList);
          lexemeList.push({ type: "operator", content: "AND" });
          break;
        case "^":
          lexemeList = this.flushLexemeBuffer(lexemeList);
          lexemeList.push({ type: "operator", content: "XOR" });
          break;
        case "|":
          lexemeList = this.flushLexemeBuffer(lexemeList);
          lexemeList.push({ type: "operator", content: "OR" });
          break;

        case "!":
          lexemeList = this.flushLexemeBuffer(lexemeList);
          lexemeList.push({ type: "negation", content: null });
          break;

        case "*":
          lexemeList = this.flushLexemeBuffer(lexemeList);
          lexemeList.push({ type: "wildcard", content: null });
          break;

        default:
          this.lexemeBuffer += pattern[i];
          break;
      }
      this.pos += 1;
    }

    this.flushLexemeBuffer(lexemeList);
    return lexemeList;
  }

  /*
   * This is the function that actually parses the Lexeme List for the logic.
   */
  private parseNode(lexemeList: LexemeElement[]): Ast {
    let ast: Ast = null;
    let tokenBuffer: Token[] = [];
    let operandBuffer: Array<AstNode> = [];

    for (let i = 0; i < lexemeList.length; i++) {
      switch (lexemeList[i].type) {
        case "group":
          const subLexeme = lexemeList[i].content;
          if (typeof subLexeme === "string" || !subLexeme) {
            // Handle Error. Isn't an array.
            return null;
          }
          const subAst: Ast = this.parseNode(subLexeme);

          if (!subAst) {
            // Handle Error. Empty sub Ast
            return null;
          }

          if (!ast) {
            ast = subAst;
          } else {
            operandBuffer.push(subAst);
          }

          break;

        case "operator":
          const operator = lexemeList[i].content;
          if (operator !== "AND" && operator !== "OR" && operator !== "XOR") {
            // Handle Error. No valid operator
            return null;
          }

          if (tokenBuffer.length > 0) {
            operandBuffer.push(
              this.createPatternNode(tokenBuffer, this.negationFlag)
            );
            tokenBuffer = [];
            this.negationFlag = false;
          }

          if (operandBuffer.length > 0) {
            ast = this.flushOperatorNode(ast, operator, operandBuffer);
            operandBuffer = [];
          }

          this.currentOperator = operator;

          break;

        case "negation":
          if (tokenBuffer.length !== 0) {
            // Handle Error. Negation in the middle of a text element
            return null;
          }

          this.negationFlag = !this.negationFlag;
          break;

        case "wildcard":
          tokenBuffer.push({ type: "wildcard" });
          break;

        case "text":
          const content = lexemeList[i].content;
          if (typeof content !== "string") {
            // Handle Error. Text Lexeme with no Content
            return null;
          }
          tokenBuffer.push({ type: "text", content: content });
          break;
      }
    }
    ast = this.flushEnd(ast, tokenBuffer, operandBuffer);
    return ast;
  }

  private flushLexemeBuffer(lexemeList: LexemeElement[]) {
    if (this.lexemeBuffer === "") {
      return lexemeList;
    }
    lexemeList.push({ type: "text", content: this.lexemeBuffer });
    this.lexemeBuffer = "";

    return lexemeList;
  }

  private flushOperatorNode(
    ast: Ast,
    situation: "AND" | "XOR" | "OR",
    content: AstNode[]
  ): Ast {
    if (!content) {
      // Handle error. No content
      return null;
    }

    if (!ast) {
      return content[0];
    }

    if (ast.type === "pattern" || this.currentOperator !== situation) {
      return {
        type: "operator",
        operator: situation,
        negation: false,
        children: [ast].concat(content),
      };
    }

    if (this.currentOperator === situation) {
      ast.children = ast.children.concat(content);
      return ast;
    }

    return ast;
  }

  private flushEnd(
    ast: Ast,
    tokenBuffer: Token[],
    operandBuffer: AstNode[]
  ): Ast {
    if (tokenBuffer.length > 0) {
      operandBuffer.push(
        this.createPatternNode(tokenBuffer, this.negationFlag)
      );
    }

    if (operandBuffer.length > 0 && this.currentOperator) {
      ast = this.flushOperatorNode(ast, this.currentOperator, operandBuffer);
    }

    return ast;
  }

  private updateParCount(side: "START" | "END") {
    switch (side) {
      case "START":
        this.parenthesesCount += 1;
        break;

      case "END":
        if (this.parenthesesCount === 0) {
          // Handle Error. ) comes before (
          return;
        }
        this.parenthesesCount -= 1;
        break;
    }
  }

  private createPatternNode(
    children: Token[],
    negation: boolean = this.negationFlag
  ): PatternNode {
    const node: PatternNode = {
      type: "pattern",
      negation: negation,
      children: children,
    };
    this.negationFlag = false;
    return node;
  }
}
