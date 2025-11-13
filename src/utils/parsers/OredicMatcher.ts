import { DUMPS } from "../../loaders/storage";
import {
  AndNode,
  AstNode,
  OperatorNode,
  PatternNode,
  SupportedPack,
  exAndNode,
  exAst,
  exOperatorNode,
  RegexNode,
  OredicNode,
  exOrNode,
  exXorNode,
} from "../../types/parsing";
import { MiscError } from "../../types/server";
import { getLogger } from "../Logger";

export class OredicMatcher {
  validOredics: string[] | null;
  ast: exAst;
  error: MiscError;

  constructor(
    private rules: AstNode,
    private pack: SupportedPack
  ) {
    this.pack = "nomi-ceu";
    this.ast = rules;

    this.error = {
      type: "error",
      code: null,
      status: false,
      send: false,
      message: null,
      location: __dirname,
      time: null,
    };

    this.validOredics = this.parse(this.ast);
  }

  parse(ast: exAst): string[] | null {
    this.parsePatterns(ast);
    this.parseRegexes(ast);
    const finalNode = this.parseOredics(ast);
    if (!finalNode) return null;
    return finalNode.children;
  }

  private parsePatterns(ast: exAst): void {
    if (!ast || ast.type === "regex" || ast.type === "oredic") return;

    if (ast.type === "pattern") {
      const regexNode = this.createRegex(ast);
      delete (ast as any).children;
      Object.assign(ast, regexNode);
      return;
    }

    for (const child of ast.children) {
      this.parsePatterns(child);
    }
  }

  private parseRegexes(ast: exAst): void {
    if (!ast || ast.type === "pattern" || ast.type === "oredic") return;

    if (ast.type === "regex") {
      const oredicNode = this.matchOredics(ast);

      if (!oredicNode) return; // Error

      delete (ast as any).children;
      delete (ast as any).child;
      delete (ast as any).rawChild;
      Object.assign(ast, oredicNode);
      return;
    }

    for (const child of ast.children) {
      this.parseRegexes(child);
    }
  }

  private parseOredics(ast: exAst): OredicNode | null {
    if (!ast) return null;

    if (ast.type === "oredic") return ast;

    if (ast.type !== "operator") {
      this.setError(
        500,
        "Unknown Error: Got something else than Oredic and Operator Nodes in the final parse"
      );
      return null;
    }

    if (ast.negation && (ast.operator === "AND" || ast.operator === "OR")) {
      ast.operator = ast.operator === "AND" ? "OR" : "AND";
      ast.negation = false;
      for (const child of ast.children) {
        child.negation = !child.negation;
      }
    }

    for (let i = 0; i < ast.children.length; i++) {
      const result = this.parseOredics(ast.children[i]);
      if (result) {
        ast.children[i] = result;
      }
    }

    let newNode: OredicNode | null = null;
    switch (ast.operator) {
      case "AND":
        newNode = this.applyConjunction(ast);
        break;
      case "OR":
        newNode = this.applyDisjunction(ast);
        break;
      case "XOR":
        newNode = this.applyExclusiveDisjunction(ast);
        break;
    }

    if (newNode) {
      delete (ast as any).operator;
      Object.assign(ast, newNode);
      return ast as unknown as OredicNode;
    }

    return null;
  }

  private createRegex(node: PatternNode): RegexNode {
    let pattern = "^";
    for (const child of node.children) {
      if (child.type === "wildcard") {
        pattern += "[a-zA-Z]+";
      } else {
        pattern += child.content;
      }
    }
    pattern += "$";
    return {
      type: "regex",
      negation: node.negation,
      rawChild: pattern,
      child: new RegExp(pattern, "gm"),
    };
  }

  private matchOredics(node: RegexNode): OredicNode | null {
    const dump = DUMPS.get(this.pack);
    if (!dump) {
      return null;
      // Error
    }
    const oredicList = dump.match(node.child);
    return {
      type: "oredic",
      negation: node.negation,
      children: oredicList,
    };
  }

  private applyConjunction(node: exAndNode): OredicNode {
    const occurences = new Map<string, number>();
    const toRemove = new Set<string>();
    let newChildren: string[] = [];
    let nonNegatedCount = 0;

    for (const child of node.children) {
      if (child.type !== "oredic") {
        this.setError(
          500,
          "Unknown Error: Tried to apply conjunction on something else than an oredic node"
        );
        return {
          type: "oredic",
          negation: false,
          children: [],
        };
      }

      if (!child.children || child.children.length === 0) {
        if (!child.negation) {
          return {
            type: "oredic",
            negation: false,
            children: [],
          };
        }
        continue;
      }

      if (child.negation) {
        for (const oredic of child.children) {
          toRemove.add(oredic);
        }
      } else {
        nonNegatedCount++;
        for (const oredic of child.children) {
          const currentCount = occurences.get(oredic) ?? 0;
          occurences.set(oredic, currentCount + 1);
        }
      }
    }

    if (nonNegatedCount === 0) {
      this.setError(
        500,
        "AND operation requires at least one non-negated child"
      );
      return {
        type: "oredic",
        negation: false,
        children: [],
      };
    }

    occurences.forEach((value, key) => {
      if (value === nonNegatedCount && !toRemove.has(key)) {
        newChildren.push(key);
      }
    });

    return {
      type: "oredic",
      negation: false,
      children: newChildren,
    };
  }

  private applyDisjunction(node: exOrNode): OredicNode {
    let newChildren: string[] = [];

    for (const child of node.children) {
      if (child.type !== "oredic") {
        this.setError(
          500,
          "Unknown Error: Tried to apply disjunction on something else than an oredic node"
        );
        return {
          type: "oredic",
          negation: false,
          children: [],
        };
      }

      if (!child.negation) {
        const toConcat = child.children ? child.children : [];
        newChildren = newChildren.concat(toConcat);
      }
    }

    return {
      type: "oredic",
      negation: false,
      children: newChildren,
    };
  }

  private applyExclusiveDisjunction(node: exXorNode): OredicNode {
    const occurences = new Map<string, number>();
    let newChildren: string[] = [];

    for (const child of node.children) {
      if (child.type !== "oredic") {
        this.setError(
          500,
          "Unknown Error: Tried to apply xor on something else than an oredic node"
        );
        return {
          type: "oredic",
          negation: false,
          children: [],
        };
      }

      if (!child.children || child.children.length === 0) {
        continue;
      }

      const multiplier = child.negation ? -1 : 1;

      for (const oredic of child.children) {
        const currentCount = occurences.get(oredic) ?? 0;
        occurences.set(oredic, currentCount + multiplier);
      }
    }

    occurences.forEach((value, key) => {
      if (Math.abs(value) % 2 === 1) {
        newChildren.push(key);
      }
    });

    if (node.negation) {
      const dump = DUMPS.get(this.pack);
      if (!dump) {
        this.setError(500, "Failed to get dump for negated XOR operation");
        return {
          type: "oredic",
          negation: false,
          children: [],
        };
      }

      const allOredics = dump.split("\n").filter((line) => line.trim() !== "");
      const resultSet = new Set(newChildren);
      newChildren = allOredics.filter((oredic) => !resultSet.has(oredic));
    }

    return {
      type: "oredic",
      negation: false,
      children: newChildren,
    };
  }

  private setError(code: number, message: string): void {
    this.error.code = code;
    this.error.status = true;
    this.error.send = true;
    this.error.message = message;
    this.error.time = new Date();
  }
}
