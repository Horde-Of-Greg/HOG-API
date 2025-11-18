import { set } from "zod";
import { OredicPack } from "../../config/routes";
import { StandardError } from "../../types/errors";
import {
  AstNode,
  BuildOptions,
  OredicMatches,
  NodeNames,
  OperatorChar,
  OrNode,
  PatternNode,
} from "../../types/parsing";
import { ErrorProne } from "../parentClasses/ErrorProne";
import { OredicParser } from "./OredicParser";
import { OredicShortener } from "./OredicShortener";
export class OredicBuilder extends ErrorProne {
  private shortener: OredicShortener;
  private parser: OredicParser;
  private shortcuts: Map<string, string>;

  constructor(private pack: OredicPack) {
    super("OredicBuilder");

    this.shortener = new OredicShortener(pack);
    this.parser = new OredicParser(pack);

    const shortcuts = this.shortener.getShortcuts();
    if (this.isError(shortcuts)) {
      throw new Error(`Failed to load shortcuts: ${shortcuts.message}`);
    }
    this.shortcuts = shortcuts;
  }

  buildFromMatches(
    matches: OredicMatches,
    options: BuildOptions
  ): AstNode[] | StandardError {
    const candidates = new Set<AstNode>();
    const pipeline = this.buildPipeline(options);

    for (const buildStrategy of pipeline) {
      const result = buildStrategy(matches);

      if (this.isError(result)) {
        return this.propagateError(
          result,
          "Build strategy failed",
          "buildFromMatches"
        );
      }
      if (result) {
        candidates.add(result);
      }
    }

    if (candidates.size === 0) {
      return this.setError(
        500,
        "No valid AST candidates generated",
        "buildFromMatches"
      );
    }
    return Array.from(candidates);
  }

  buildFromAst(ast: AstNode): string | StandardError {
    if (!ast) {
      return "";
    }

    switch (ast.type) {
      case NodeNames.OPERATOR:
        const char: OperatorChar = this.getOperatorChar(ast.operator);
        const children: string[] = [];

        for (let i = 0; i < ast.children.length; i++) {
          const child: AstNode = ast.children[i];
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

  private shortenedDisjuntion(matches: OredicMatches): OrNode | StandardError {
    const children: PatternNode[] = [];
    for (const match in matches) {
      const candidate = this.shortcuts.get(match);
      const rawPattern = candidate ? candidate : match;
      const nodeCandidate = this.parser.parse(rawPattern);

      if (!nodeCandidate) {
        continue;
      }
      if (this.isError(nodeCandidate)) {
        return this.propagateError(
          nodeCandidate,
          "Failed to parse pattern",
          "shortenedDisjuntion"
        );
      }
      if (nodeCandidate.type === NodeNames.OPERATOR) {
        return this.setError(
          500,
          "Parsed a pattern as an operator",
          "shortenedDisjuntion"
        );
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

  private buildPipeline(options: BuildOptions) {
    const pipeline = [];

    if (options.shortenedDisjunction) {
      pipeline.push(this.shortenedDisjuntion.bind(this));
    }

    return pipeline;
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
