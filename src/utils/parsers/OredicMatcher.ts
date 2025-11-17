import { OredicPack } from "../../config/routes";
import { DUMPS } from "../../loaders/storage";
import {
  AstNode,
  exAst,
  RegexNode,
  OredicNode,
  exAndNode,
  exOrNode,
  exXorNode,
  PatternNode,
  NodeNames,
  exAstNode,
  Matches,
} from "../../types/parsing";
import { ErrorProne } from "../parentClasses/ErrorProne";
import { OredicParser } from "./OredicParser";

const EMPTY_OREDIC_NODE: OredicNode = {
  type: NodeNames.OREDIC,
  negation: false,
  children: [],
} as const;

export class OredicMatcher extends ErrorProne {
  private parser: OredicParser;
  private dump: string[];

  constructor(private pack: OredicPack) {
    super();
    this.parser = new OredicParser();
    const dump = DUMPS.get(this.pack);
    this.dump = dump ? dump.split("\n") : [];
  }

  match(rules: exAstNode): Matches | null {
    return this.parse(rules);
  }

  isUniqueMatch(pattern: string, targetIndex: number): boolean {
    if (targetIndex < 0 || targetIndex >= this.dump.length) {
      return false;
    }

    const target = this.dump[targetIndex];
    const regex = this.buildRegexFromPattern(pattern);

    if (!regex.test(target)) {
      return false;
    }

    const maxRadius = 128;
    for (let radius = 1; radius <= maxRadius; radius *= 2) {
      for (let offset = -radius; offset <= radius; offset++) {
        const checkIndex = targetIndex + offset;

        if (
          checkIndex === targetIndex ||
          checkIndex < 0 ||
          checkIndex >= this.dump.length
        ) {
          continue;
        }

        regex.lastIndex = 0;
        if (regex.test(this.dump[checkIndex])) {
          return false;
        }
      }
    }

    for (let i = 0; i < this.dump.length; i++) {
      const distance = Math.abs(i - targetIndex);

      if (distance <= maxRadius || i === targetIndex) {
        continue;
      }

      regex.lastIndex = 0;
      if (regex.test(this.dump[i])) {
        return false;
      }
    }

    return true;
  }

  /*
   * AST transformation pipeline
   */

  private parse(ast: exAst): string[] | null {
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
      type: NodeNames.REGEX,
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
    return this.newOredicNode(oredicList);
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
        return this.newOredicNode(null);
      }

      if (!child.children || child.children.length === 0) {
        if (!child.negation) {
          return this.newOredicNode(null);
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
      return this.newOredicNode(null);
    }

    occurences.forEach((value, key) => {
      if (value === nonNegatedCount && !toRemove.has(key)) {
        newChildren.push(key);
      }
    });

    return this.newOredicNode(newChildren);
  }

  private applyDisjunction(node: exOrNode): OredicNode {
    let newChildren: string[] = [];

    for (const child of node.children) {
      if (child.type !== "oredic") {
        this.setError(
          500,
          "Unknown Error: Tried to apply disjunction on something else than an oredic node"
        );
        return this.newOredicNode(null);
      }

      if (!child.negation) {
        const toConcat = child.children ? child.children : [];
        newChildren = newChildren.concat(toConcat);
      }
    }

    return this.newOredicNode(newChildren);
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
        return this.newOredicNode(null);
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
        return this.newOredicNode(null);
      }

      const allOredics = dump.split("\n").filter((line) => line.trim() !== "");
      const resultSet = new Set(newChildren);
      newChildren = allOredics.filter((oredic) => !resultSet.has(oredic));
    }

    return this.newOredicNode(newChildren);
  }

  private buildRegexFromPattern(pattern: string): RegExp {
    let regexPattern = "^";
    for (let i = 0; i < pattern.length; i++) {
      if (pattern[i] === "*") {
        regexPattern += ".+";
      } else {
        regexPattern += pattern[i];
      }
    }
    regexPattern += "$";
    return new RegExp(regexPattern);
  }

  private newOredicNode(children: string[] | null): OredicNode {
    return {
      type: NodeNames.OREDIC,
      negation: false,
      children: children ? children : [],
    };
  }
}
