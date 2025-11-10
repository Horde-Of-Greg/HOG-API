/*
 * Meant to imitate the logic in
 * https://github.com/AE2-UEL/Applied-Energistics-2/blob/26bb5986c636e9bdde62559b0d1c2bbc48c4b9e3/src/main/java/appeng/util/item/OreDictFilterMatcher.java#L11
 */

import { MiscError } from "../../types/server";

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

type ParseState = {
  ast: Ast;
  tokenBuffer: Token[];
  operandBuffer: AstNode[];
  currentOperator: "AND" | "XOR" | "OR" | null;
  negationFlag: boolean;
};

export class Ae2uelOredicParser {
  lexemeBuffer: string;

  parenthesesCount: number;

  error: MiscError;

  constructor(private oredicString: string) {
    this.lexemeBuffer = "";

    this.parenthesesCount = 0;

    this.error = {
      code: null,
      status: false,
      send: false,
      message: null,
      location: __dirname,
      time: null,
    };
  }

  parse(): Ast | MiscError {
    const { lexemeList } = this.lexicalParse(this.oredicString.split(""));

    if (this.parenthesesCount !== 0) {
      this.setError(400, "Unbalanced parentheses");
      return this.error;
    }

    const ast = this.parseNode(lexemeList);

    if (this.error.status) {
      return this.error;
    }

    return ast;
  }

  private lexicalParse(pattern: string[]): {
    lexemeList: LexemeElement[];
    consumed: number;
  } {
    let lexemeList: LexemeElement[] = [];

    for (let i = 0; i < pattern.length; i++) {
      switch (pattern[i]) {
        case " ":
          break;

        case "(":
          lexemeList = this.flushLexemeBuffer(lexemeList);
          this.updateParCount("START");

          const result = this.lexicalParse(pattern.slice(i + 1));
          lexemeList.push({ type: "group", content: result.lexemeList });

          i += result.consumed;

          break;
        case ")":
          lexemeList = this.flushLexemeBuffer(lexemeList);
          this.updateParCount("END");
          return { lexemeList, consumed: i + 1 };

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
    }

    this.flushLexemeBuffer(lexemeList);
    return { lexemeList, consumed: pattern.length };
  }

  private parseNode(lexemeList: LexemeElement[]): Ast {
    if (this.error.status) {
      return null;
    }

    const state: ParseState = {
      ast: null,
      tokenBuffer: [],
      operandBuffer: [],
      currentOperator: null,
      negationFlag: false,
    };

    for (let i = 0; i < lexemeList.length; i++) {
      switch (lexemeList[i].type) {
        case "group":
          const subLexeme = lexemeList[i].content;
          if (typeof subLexeme === "string" || !subLexeme) {
            this.setError(400, "Invalid group content");
            return null;
          }
          const subAst: Ast = this.parseNode(subLexeme);

          if (this.error.status) {
            return null;
          }

          if (!subAst) {
            this.setError(400, "Failed to parse group");
            return null;
          }

          if (state.negationFlag) {
            subAst.negation = true;
            state.negationFlag = false;
          }

          if (!state.ast) {
            state.ast = subAst;
            break;
          }

          state.operandBuffer.push(subAst);
          break;

        case "operator":
          const operator = lexemeList[i].content;
          if (operator !== "AND" && operator !== "OR" && operator !== "XOR") {
            this.setError(400, "Invalid operator");
            return null;
          }

          this.flushTokens(state);

          if (state.operandBuffer.length > 0 && state.currentOperator) {
            this.flushOperands(state, state.currentOperator);
          }

          state.currentOperator = operator;
          break;

        case "negation":
          if (state.tokenBuffer.length !== 0) {
            this.setError(400, "Negation must come before pattern tokens");
            return null;
          }
          state.negationFlag = !state.negationFlag;
          break;

        case "wildcard":
          state.tokenBuffer.push({ type: "wildcard" });
          break;

        case "text":
          const content = lexemeList[i].content;
          if (typeof content !== "string") {
            this.setError(400, "Invalid text content");
            return null;
          }
          state.tokenBuffer.push({ type: "text", content: content });
          break;
      }
    }

    return this.flushEnd(state);
  }

  private flushLexemeBuffer(lexemeList: LexemeElement[]): LexemeElement[] {
    if (this.lexemeBuffer === "") {
      return lexemeList;
    }
    lexemeList.push({ type: "text", content: this.lexemeBuffer });
    this.lexemeBuffer = "";

    return lexemeList;
  }

  private flushTokens(state: ParseState): void {
    if (state.tokenBuffer.length > 0) {
      state.operandBuffer.push(
        this.createPatternNode(state.tokenBuffer, state.negationFlag)
      );
      state.tokenBuffer = [];
      state.negationFlag = false;
    }
  }

  private flushOperands(
    state: ParseState,
    operator: "AND" | "XOR" | "OR"
  ): void {
    if (state.operandBuffer.length === 0) {
      return;
    }

    if (!state.ast) {
      if (state.operandBuffer.length === 1) {
        state.ast = state.operandBuffer[0];
        state.operandBuffer = [];
        return;
      }

      state.ast = {
        type: "operator",
        operator: operator,
        negation: false,
        children: state.operandBuffer,
      };
      state.operandBuffer = [];
      return;
    }

    if (state.ast.type === "operator" && state.ast.operator === operator) {
      state.ast.children = state.ast.children.concat(state.operandBuffer);
      state.operandBuffer = [];
      return;
    }

    state.ast = {
      type: "operator",
      operator: operator,
      negation: false,
      children: [state.ast].concat(state.operandBuffer),
    };
    state.operandBuffer = [];
  }

  private flushEnd(state: ParseState): Ast {
    if (state.tokenBuffer.length > 0) {
      const pattern = this.createPatternNode(
        state.tokenBuffer,
        state.negationFlag
      );

      if (!state.ast && !state.currentOperator) {
        return pattern;
      }

      state.operandBuffer.push(pattern);
    }

    if (state.operandBuffer.length > 0 && state.currentOperator) {
      this.flushOperands(state, state.currentOperator);
    }

    return state.ast;
  }

  private updateParCount(side: "START" | "END"): void {
    switch (side) {
      case "START":
        this.parenthesesCount += 1;
        break;

      case "END":
        if (this.parenthesesCount === 0) {
          this.setError(400, "Closing parenthesis without opening");
          return;
        }
        this.parenthesesCount -= 1;
        break;
    }
  }

  private createPatternNode(
    children: Token[],
    negation: boolean = false
  ): PatternNode {
    const node: PatternNode = {
      type: "pattern",
      negation: negation,
      children: children,
    };
    return node;
  }

  private setError(code: number, message: string): void {
    this.error.code = code;
    this.error.status = true;
    this.error.send = true;
    this.error.message = message;
    this.error.time = new Date();
  }
}
