import { DUMPS } from "../../loaders/storage";
import {
  AstNode,
  OredicNode,
  PatternNode,
  RegexNode,
  SupportedPack,
  exAst,
} from "../../types/parsing";
import { getLogger } from "../Logger";

export class OredicMatcher {
  validOredics: string[];
  ast: exAst;

  constructor(
    private rules: AstNode,
    private pack: SupportedPack
  ) {
    this.pack = "nomi-ceu";
    this.ast = rules;
    this.validOredics = this.parse(this.ast);
  }

  parse(ast: exAst): string[] {
    this.parsePatterns(ast);
    this.parseRegexes(ast);
    // 2nd parse: match patterns to list of oredics
    // 3nd parse: join/disjoin children based on the operators and negation
    return [];
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

  private createRegex(node: PatternNode): RegexNode {
    let pattern = "";
    for (const child of node.children) {
      if (child.type === "wildcard") {
        pattern += "[a-zA-Z]+";
      } else {
        pattern += child.content;
      }
    }
    return {
      type: "regex",
      negation: node.negation,
      rawChild: pattern,
      child: new RegExp(pattern, "g"),
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
}
