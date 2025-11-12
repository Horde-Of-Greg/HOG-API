/*
 * Meant to imitate the logic in
 * https://github.com/AE2-UEL/Applied-Energistics-2/blob/26bb5986c636e9bdde62559b0d1c2bbc48c4b9e3/src/main/java/appeng/util/item/OreDictFilterMatcher.java#L11
 */

import { MiscError } from "../../types/server";
import { getLogger } from "../Logger";
import { startTimer, stopTimer, Timer } from "../Timer";

type Ast = AstNode | null;

type AstNode = PatternNode | OperatorNode;
type PatternNode = {
  type: "pattern";
  negation: boolean;
  children: Array<Token>;
};

type AndNode = {
  type: "operator";
  operator: "AND";
  negation: boolean;
  children: Array<AstNode>;
};

type OrNode = {
  type: "operator";
  operator: "OR";
  negation: boolean;
  children: Array<AstNode>;
};

type XorNode = {
  type: "operator";
  operator: "XOR";
  negation: boolean;
  children: Array<AstNode>;
};

type OperatorNode = AndNode | OrNode | XorNode;

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

  private optimizationPipeline: Array<(node: AstNode) => void>;

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

    this.optimizationPipeline = [
      this.applyAssociativity.bind(this),
      this.applyAnnihilatorXor.bind(this),
      this.applyDoubleNegation.bind(this),
      this.applyDeMorgan.bind(this),
      this.applyWildcardConjunction.bind(this),
    ];
  }

  parse(): Ast | MiscError {
    startTimer("parser");
    const { lexemeList } = this.lexicalParse(this.oredicString.split(""));

    if (this.parenthesesCount !== 0) {
      this.setError(400, "Unbalanced parentheses");
      return this.error;
    }

    const ast = this.parseNode(lexemeList);
    const badAst = JSON.stringify(ast);

    if (this.error.status) {
      return this.error;
    }

    getLogger().formattingLog("Bad AST");
    getLogger().simpleLog("debug", JSON.stringify(ast, undefined, 4));

    this.flattenAst(ast);

    if (this.error.status) {
      return this.error;
    }

    getLogger().formattingLog("Good AST");
    getLogger().simpleLog("debug", JSON.stringify(ast, undefined, 4));

    getLogger().formattingLog("Results:");
    getLogger().simpleLog("debug", `Input: ${this.oredicString}`);

    getLogger().simpleLog(
      "debug",
      `Time taken: ${stopTimer("parser").getTime().formatted}`
    );
    getLogger().simpleLog(
      "debug",
      `Changed?: ${JSON.stringify(ast) !== badAst}`
    );
    return ast;
  }

  /*
   * Main methods
   */

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

  private flattenAst(ast: Ast): void {
    if (!ast) {
      return;
    }

    let currentAst = ast;
    let previousAst: Ast = null;

    while (JSON.stringify(currentAst) !== JSON.stringify(previousAst)) {
      previousAst = JSON.parse(JSON.stringify(currentAst));

      for (const fn of this.optimizationPipeline) {
        fn(currentAst);
      }

      if (currentAst.type === "pattern") return;

      for (const child of currentAst.children) {
        this.flattenAst(child);
      }

      if (this.error.status) return;
    }
  }

  /*
   * Helper methods
   */

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

  /*
   * Optimization methods
   */

  // Associativity (OR, AND, XOR): OR: (a, OR: (b, c)) = OR: (a, b, c)
  private applyAssociativity(node: AstNode): void {
    if (!this.operatorAccepted(node, "all")) return;
    const operatorNode = node as OperatorNode;

    const topLevelOperator = operatorNode.operator;
    const newChildren: AstNode[] = [];

    for (let i = 0; i < operatorNode.children.length; i++) {
      const child = operatorNode.children[i];
      if (
        child.type === "operator" &&
        child.operator === topLevelOperator &&
        child.negation === false
      ) {
        for (const subChild of child.children) {
          newChildren.push(subChild);
        }
      } else {
        newChildren.push(child);
      }
    }

    node.children = newChildren;
  }

  // Distributivity of AND over OR: OR: (AND: (a, b), AND: (a, c)) = AND: (a, OR: (b, c))
  // Distributivity of OR over AND: AND: (OR: (a, b), OR: (a, c)) = OR: (a, AND: (b, c))
  private applyDistributivity(node: AstNode): void {
    if (!this.operatorAccepted(node, ["AND", "OR"])) return;
    const operatorNode = node as OperatorNode;
  }

  // Identity for OR: OR: (a, false) = a
  private applyIdentityOr(node: AstNode): void {
    if (!this.operatorAccepted(node, ["OR"])) return;
    const operatorNode = node as OperatorNode;
  }

  // Identity for AND: AND: (a, true) = a
  private applyIdentityAnd(node: AstNode): void {
    if (!this.operatorAccepted(node, ["AND"])) return;
    const operatorNode = node as OperatorNode;
  }

  // Identity for XOR: XOR: (a, false) = a
  private applyIdentityXor(node: AstNode): void {
    if (!this.operatorAccepted(node, ["XOR"])) return;
    const operatorNode = node as OperatorNode;
  }

  // Annihilator for OR: OR: (a, true) = true
  private applyAnnihilatorOr(node: AstNode): void {
    if (!this.operatorAccepted(node, ["OR"])) return;
    const operatorNode = node as OperatorNode;
  }

  // Annihilator for AND: AND: (a, false) = false => error
  private applyAnnihilatorAnd(node: AstNode): void {
    if (!this.operatorAccepted(node, ["AND"])) return;
    const operatorNode = node as OperatorNode;
  }

  // Annihilator for XOR: XOR: (a, a) = false => error
  private applyAnnihilatorXor(node: AstNode): void {
    if (!this.operatorAccepted(node, ["XOR"])) return;
    const operatorNode = node as OperatorNode;

    const uniqueChildren = new Map<string, boolean>();

    for (const child of operatorNode.children) {
      const hash = JSON.stringify(child);
      if (uniqueChildren.has(hash)) {
        this.setWarn(
          "Invalid Logic: XOR has two identical elements. XOR(a,a) is always false"
        );
        return;
      }
      uniqueChildren.set(hash, true);
    }
  }

  // Idempotence (OR, AND): OR: (a, a) = a
  private applyIdempotence(node: AstNode): void {
    if (!this.operatorAccepted(node, ["AND", "OR"])) return;
    const operatorNode = node as OperatorNode;
  }

  // Absorption (OR, AND): AND: (a, OR: (a, b)) = a
  private applyAbsorption(node: AstNode): void {
    if (!this.operatorAccepted(node, ["AND", "OR"])) return;
    const operatorNode = node as OperatorNode;
  }

  // Complementation for AND: AND: (a, NOT(a)) = false => error
  private applyComplementationAnd(node: AstNode): void {
    if (!this.operatorAccepted(node, ["AND"])) return;
    const operatorNode = node as OperatorNode;
  }

  // Complementation for OR: OR: (a, NOT(a)) = true
  private applyComplementationOr(node: AstNode): void {
    if (!this.operatorAccepted(node, ["OR"])) return;
    const operatorNode = node as OperatorNode;
  }

  // Complementary for XOR: XOR(a, true) = NOT(a), XOR(a, NOT(a)) = true
  // Complementation for OR: OR: (a, NOT(a)) = true
  private applyComplementaryOrs(node: AstNode): void {
    if (!this.operatorAccepted(node, ["XOR"])) return;
    const operatorNode = node as OperatorNode;
  }

  // Double negation: NOT(NOT(a)) = a
  private applyDoubleNegation(node: AstNode): void {
    if (!this.operatorAccepted(node, "all")) return;
    const operatorNode = node as OperatorNode;
  }

  // De Morgan's laws: OR: (NOT(a), NOT(b)) = NOT(AND: (a, b))
  private applyDeMorgan(node: AstNode): void {
    if (!this.operatorAccepted(node, ["AND", "OR"])) return;
    const operatorNode = node as OperatorNode;

    let allNegation = true;

    for (const child of operatorNode.children) {
      if (!child.negation) allNegation = false;
    }

    if (allNegation) {
      const complemetary = operatorNode.operator === "OR" ? "AND" : "OR";
      operatorNode.negation = true;
      operatorNode.operator = complemetary;
      operatorNode.children.forEach((child) => {
        child.negation = false;
      });
    }

    node = operatorNode;
  }

  // Conjunction for wildcards: Token(a, wildcard, wildcard, b) = Token(a, wildcard, b)
  private applyWildcardConjunction(node: AstNode): void {
    if (node.type !== "pattern") return;
    for (let i = 1; i < node.children.length; i++) {
      const lastChild = node.children[i - 1];
      const currChild = node.children[i];
      if (currChild.type === "wildcard" && lastChild.type === "wildcard") {
        node.children.splice(i, 1);
        i -= 1;
      }
    }
  }

  // Helper to check if an operator is in the list of accepted operators
  private operatorAccepted(
    node: AstNode,
    acceptedOperators: Array<"AND" | "OR" | "XOR"> | "all"
  ): boolean {
    if (node.type === "pattern") return false;
    if (acceptedOperators === "all") return true;
    return acceptedOperators.includes(node.operator);
  }

  private setError(code: number, message: string): void {
    this.error.code = code;
    this.error.status = true;
    this.error.send = true;
    this.error.message = message;
    this.error.time = new Date();
  }

  private setWarn(message: string): void {
    this.error.code = 200;
    this.error.status = true;
    this.error.send = true;
    this.error.message = message;
    this.error.time = new Date();
  }
}
