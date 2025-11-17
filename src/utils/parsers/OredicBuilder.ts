import { set } from "zod";
import { OredicPack } from "../../config/routes";
import { StandardError } from "../../types/errors";
import {
  Ast,
  BuildOptions,
  Matches,
  NodeNames,
  OperatorChar,
  OrNode,
  PatternNode,
} from "../../types/parsing";
import { ErrorProne } from "../parentClasses/ErrorProne";
import { OredicParser } from "./OredicParser";
import { OredicShortener } from "./OredicShortener";
export class OredicBuilder extends ErrorProne {
  Shortener: OredicShortener;
  Parser: OredicParser;
  shortcuts: Map<string, string>;
  private buildPipeline: Array<(matches: Matches) => Ast | StandardError>;

  constructor(
    private pack: OredicPack,
    private options: BuildOptions
  ) {
    super();

    this.Shortener = new OredicShortener("nomi-ceu");
    this.Parser = new OredicParser();
    this.shortcuts = this.Shortener.getShortcuts();

    this.buildPipeline = [];

    if (options.shortenedDisjunction) {
      this.buildPipeline.push(this.shortenedDisjuntion.bind(this));
    }
  }

  buildFromMatches(matches: Matches): Ast[] | StandardError {
    const candidates = new Set<Ast>();

    for (const buildStrategy of this.buildPipeline) {
      const result = buildStrategy(matches);

      if (result && typeof result === "object" && result.type === "error") {
        return result;
      }
      if (result) {
        candidates.add(result);
      }
    }

    if (candidates.size === 0) {
      return this.setError(500, "No valid AST candidates generated");
    }
    return Array.from(candidates);
  }

  buildFromAsts(asts: Ast[]) {
    const candidates = new Set<string>();

    for (const ast of asts) {
      const built = this.buildFromAst(ast);

      if (!built) {
        continue;
      }
      if (typeof built !== "string") return built;

      candidates.add(built);
    }

    return Array.from(candidates).sort((a, b) => a.length - b.length)[0];
  }

  private shortenedDisjuntion(matches: Matches): OrNode | StandardError {
    const children: PatternNode[] = [];
    for (const match in matches) {
      const candidate = this.shortcuts.get(match);
      const rawPattern = candidate ? candidate : match;
      const nodeCandidate = this.Parser.parse(rawPattern);

      if (!nodeCandidate) {
        continue;
      }
      if (nodeCandidate.type === "error") {
        return nodeCandidate;
      }
      if (nodeCandidate.type === NodeNames.OPERATOR) {
        return this.setError(500, "Parsed a pattern as an operator");
      }

      children.push(nodeCandidate);
    }

    return {
      type: NodeNames.OPERATOR,
      operator: "OR",
      negation: false,
      children: children,
    };
  }

  private buildFromAst(ast: Ast): string | StandardError {
    if (!ast) {
      return "";
    }

    switch (ast.type) {
      case NodeNames.OPERATOR:
        const char: OperatorChar = this.getOperatorChar(ast.operator);
        const children: string[] = [];

        for (let i = 0; i < ast.children.length; i++) {
          const child: Ast = ast.children[i];
          let subFilter = this.buildFromAst(child);

          if (typeof subFilter !== "string") return subFilter;

          if (child.type === NodeNames.OPERATOR) {
            const needsParens = i > 0 && child.operator !== ast.operator;
            if (needsParens) {
              subFilter = `(${subFilter})`;
            }
          }

          if (child.negation) {
            subFilter = `!${subFilter}`;
          }

          children.push(subFilter);
        }
        return children.join(char);

      case NodeNames.PATTERN:
        return ast.children
          .map((token) => {
            if (token.type === NodeNames.WILDCARD) {
              return "*";
            } else if (token.type === NodeNames.TEXT) {
              return token.content;
            }
            return "";
          })
          .join("");
    }
  }

  private getOperatorChar(string: "AND" | "OR" | "XOR"): OperatorChar {
    switch (string) {
      case "AND":
        return OperatorChar.AND;
      case "OR":
        return OperatorChar.OR;
      case "XOR":
        return OperatorChar.XOR;
      default:
        throw new Error(`Invalid operator string: ${string}`);
    }
  }
}
