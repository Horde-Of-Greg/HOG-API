import { OredicParser } from "../../utils/parsers/OredicParser";
import { OredicMatcher } from "../../utils/parsers/OredicMatcher";
import { OredicPack } from "../../config/routes";
import { Ast } from "../../types/parsing";
import { StandardError } from "../../types/errors";

type OredicResult = {
  type: "success" | "error";
  data?: any;
  error?: string;
};

export class OredicService {
  private parser = new OredicParser();

  async simplify(input: string, pack: OredicPack): Promise<OredicResult> {
    const parseResult = this.parse(input);

    if (!parseResult) {
      return {
        type: "error",
        error: "Failed to parse input",
      };
    }

    if ((parseResult as StandardError).type === "error") {
      const error = parseResult as StandardError;
      return {
        type: "error",
        error: error.message || "Parse error",
      };
    }

    try {
      const ast = parseResult as Ast;
      const result = this.match(ast, pack);
      return {
        type: "success",
        data: result,
      };
    } catch (error) {
      return {
        type: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private parse(input: string): Ast | StandardError {
    return this.parser.parse(input);
  }

  private match(ast: Ast, pack: OredicPack) {
    if (!ast) throw new Error("AST is null");
    const matcher = new OredicMatcher(pack);
    return matcher.match(ast);
  }
}
