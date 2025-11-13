import {
  AstNode,
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
    this.ast = rules;
    this.validOredics = this.parse(this.ast);
  }

  parse(ast: exAst): string[] {
    this.parsePatterns(ast);
    // 2nd parse: match logic to oredics. Return array of valid oredics
    return [];
  }

  private parsePatterns(ast: exAst): void {
    if (!ast || ast.type === "regex") return;

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

  private createRegex(patternNode: PatternNode): RegexNode {
    let pattern = "";
    for (const child of patternNode.children) {
      if (child.type === "wildcard") {
        pattern += "[a-zA-Z]+";
      } else {
        pattern += child.content;
      }
    }
    return {
      type: "regex",
      negation: patternNode.negation,
      child: new RegExp(pattern),
    };
  }
}
