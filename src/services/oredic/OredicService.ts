import type { OredicPack } from "../../config/routes";
import type { StandardError } from "../../types/errors";
import type { AstNode, BuildOptions, OredicMatches } from "../../types/parsing";
import { ErrorProne } from "../../utils/parentClasses/ErrorProne";
import { OredicBuilder } from "../../utils/parsers/OredicBuilder";
import { OredicMatcher } from "../../utils/parsers/OredicMatcher";
import { OredicParser } from "../../utils/parsers/OredicParser";

export class OredicService extends ErrorProne {
    constructor(private pack: OredicPack) {
        super("OredicService");
    }

    private parser = new OredicParser(this.pack);
    private matcher = new OredicMatcher(this.pack);
    private builder = new OredicBuilder(this.pack);

    async parse(input: string): Promise<AstNode | StandardError> {
        const parseResult = this.parser.parse(input);
        if (!parseResult) {
            return this.setError(500, "Unknown Error: Could not parse input", "parse");
        }
        return parseResult;
    }

    async match(ast: AstNode): Promise<OredicMatches | StandardError> {
        const matchResult = this.matcher.match(ast);
        return matchResult;
    }

    async buildAsts(matches: OredicMatches, options: BuildOptions): Promise<AstNode[] | StandardError> {
        const builtAst = this.builder.buildFromMatches(matches, options);
        return builtAst;
    }

    async buildSingleAst(matches: OredicMatches, options: BuildOptions): Promise<AstNode | StandardError> {
        let optionsCount = 0;

        for (const option in options) {
            if (options[option as keyof BuildOptions] === true) {
                optionsCount += 1;
            }
        }

        if (optionsCount !== 1) {
            return this.setError(400, "Must select one and only one way to build the ast.", "buildSingleAst");
        }

        const builtAst = this.builder.buildFromMatches(matches, options);

        if (this.isError(builtAst)) {
            return this.propagateError(builtAst, "Failed to build AST", "buildSingleAst");
        }

        if (builtAst.length === 0) {
            return this.setError(400, "No AST was built", "buildSingleAst");
        }

        return builtAst[0];
    }

    async build(ast: AstNode): Promise<string | StandardError> {
        return this.builder.buildFromAst(ast);
    }

    async buildAndFindBest(asts: AstNode[]): Promise<string | StandardError> {
        let candidates: string[] = [];

        for (const ast of asts) {
            const candidate = this.builder.buildFromAst(ast);

            if (this.isError(candidate)) {
                return this.propagateError(candidate, "Failed to find best string from Ast");
            }

            candidates.push(candidate);
        }

        candidates = candidates.sort((a, b) => a.length - b.length);
        return candidates[0];
    }
}
