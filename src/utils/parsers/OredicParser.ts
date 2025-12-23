/*
 * Meant to imitate the logic in
 * https://github.com/AE2-UEL/Applied-Energistics-2/blob/26bb5986c636e9bdde62559b0d1c2bbc48c4b9e3/src/main/java/appeng/util/item/OreDictFilterMatcher.java#L11
 */

import type { OredicPack } from "../../config/routes";
import type { StandardError } from "../../types/errors";
import type { AstNode, LexemeElement, OperatorNode, PatternNode, Token } from "../../types/parsing";
import { LexemeNames, NodeNames, OperatorChar, SpecialChar } from "../../types/parsing";
import { ErrorProne } from "../parentClasses/ErrorProne";

type ParseState = {
    ast: AstNode | null;
    tokenBuffer: Token[];
    operandBuffer: AstNode[];
    currentOperator: "AND" | "XOR" | "OR" | null;
    negationFlag: boolean;
};

export class OredicParser extends ErrorProne {
    private lexemeBuffer: string;
    private parenthesesCount: number;
    private optimizationPipeline: Array<(node: AstNode) => void>;

    constructor(private pack: OredicPack) {
        super("OredicParser");
        this.lexemeBuffer = "";
        this.parenthesesCount = 0;

        this.optimizationPipeline = [
            this.applyAssociativity.bind(this),
            this.applyAnnihilatorXor.bind(this),
            this.applyDeMorgan.bind(this),
            this.applyWildcardConjunction.bind(this),
        ];
    }

    parse(input: string): AstNode | StandardError {
        this.resetState();

        const { lexemeList } = this.lexicalParse(input.split(""));

        if (this.parenthesesCount !== 0) {
            return this.setError(400, "Unbalanced parentheses", "parse");
        }

        const ast = this.parseNode(lexemeList);

        if (this.isError(ast)) {
            return this.propagateError(ast, "Failed to parse node", "parse");
        }

        if (!ast) {
            return this.setError(400, "Failed to parse input", "parse");
        }

        if (this.error.status) {
            return this.error;
        }

        this.flattenAst(ast);

        if (this.error.status) {
            return this.error;
        }

        return ast;
    }

    /*
     * State management
     */

    private resetState(): void {
        this.lexemeBuffer = "";
        this.parenthesesCount = 0;
        this.error.status = false;
        this.error.code = null;
        this.error.message = null;
    }

    /*
     * Lexical parsing
     */

    private lexicalParse(pattern: string[]): {
        lexemeList: LexemeElement[];
        consumed: number;
    } {
        let lexemeList: LexemeElement[] = [];

        for (let i = 0; i < pattern.length; i++) {
            switch (pattern[i]) {
                case SpecialChar.SPACE:
                    break;

                case SpecialChar.GROUP_START:
                    lexemeList = this.flushLexemeBuffer(lexemeList);
                    this.incrementParentheses();

                    const result = this.lexicalParse(pattern.slice(i + 1));
                    lexemeList.push({
                        type: LexemeNames.GROUP,
                        content: result.lexemeList,
                    });

                    i += result.consumed;

                    break;
                case SpecialChar.GROUP_END:
                    lexemeList = this.flushLexemeBuffer(lexemeList);
                    this.decrementParentheses();
                    return { lexemeList, consumed: i + 1 };

                case OperatorChar.AND:
                    lexemeList = this.flushLexemeBuffer(lexemeList);
                    lexemeList.push({ type: LexemeNames.OPERATOR, content: "AND" });
                    break;
                case OperatorChar.XOR:
                    lexemeList = this.flushLexemeBuffer(lexemeList);
                    lexemeList.push({ type: LexemeNames.OPERATOR, content: "XOR" });
                    break;
                case OperatorChar.OR:
                    lexemeList = this.flushLexemeBuffer(lexemeList);
                    lexemeList.push({ type: LexemeNames.OPERATOR, content: "OR" });
                    break;

                case SpecialChar.NEGATION:
                    lexemeList = this.flushLexemeBuffer(lexemeList);
                    lexemeList.push({ type: LexemeNames.NEGATION, content: null });
                    break;

                case SpecialChar.WILDCARD:
                    lexemeList = this.flushLexemeBuffer(lexemeList);
                    lexemeList.push({ type: LexemeNames.WILDCARD, content: null });
                    break;

                default:
                    this.lexemeBuffer += pattern[i];
                    break;
            }
        }

        this.flushLexemeBuffer(lexemeList);
        return { lexemeList, consumed: pattern.length };
    }

    private parseNode(lexemeList: LexemeElement[]): AstNode | null {
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
                        this.setError(400, "Invalid group content", "parseNode");
                        return null;
                    }
                    const subAst: AstNode | null = this.parseNode(subLexeme);

                    if (this.error.status) {
                        return null;
                    }

                    if (!subAst) {
                        this.setError(400, "Failed to parse group", "parseNode");
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
                        this.setError(400, "Invalid operator", "parseNode");
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
                        this.setError(400, "Negation must come before pattern tokens", "parseNode");
                        return null;
                    }
                    state.negationFlag = !state.negationFlag;
                    break;

                case "wildcard":
                    state.tokenBuffer.push({ type: NodeNames.WILDCARD });
                    break;

                case "text":
                    const content = lexemeList[i].content;
                    if (typeof content !== "string") {
                        this.setError(400, "Invalid text content", "parseNode");
                        return null;
                    }
                    state.tokenBuffer.push({ type: NodeNames.TEXT, content: content });
                    break;
            }
        }

        return this.flushEnd(state);
    }

    private flattenAst(ast: AstNode): void {
        if (!ast) {
            return;
        }

        const currentAst = ast;
        let previousAst: AstNode | null = null;

        while (JSON.stringify(currentAst) !== JSON.stringify(previousAst)) {
            previousAst = JSON.parse(JSON.stringify(currentAst));

            for (const fn of this.optimizationPipeline) {
                fn(currentAst);
            }

            if (currentAst.type === NodeNames.PATTERN) return;

            for (const child of currentAst.children) {
                this.flattenAst(child);
            }

            if (this.error.status) return;
        }
    }

    /*
     * Buffer management
     */

    private flushLexemeBuffer(lexemeList: LexemeElement[]): LexemeElement[] {
        if (this.lexemeBuffer === "") {
            return lexemeList;
        }
        lexemeList.push({ type: LexemeNames.TEXT, content: this.lexemeBuffer });
        this.lexemeBuffer = "";
        return lexemeList;
    }

    private flushTokens(state: ParseState): void {
        if (state.tokenBuffer.length > 0) {
            state.operandBuffer.push(this.createPatternNode(state.tokenBuffer, state.negationFlag));
            state.tokenBuffer = [];
            state.negationFlag = false;
        }
    }

    private flushOperands(state: ParseState, operator: "AND" | "XOR" | "OR"): void {
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
                type: NodeNames.OPERATOR,
                operator: operator,
                negation: false,
                children: state.operandBuffer,
            };
            state.operandBuffer = [];
            return;
        }

        if (state.ast.type === NodeNames.OPERATOR && state.ast.operator === operator) {
            state.ast.children = state.ast.children.concat(state.operandBuffer);
            state.operandBuffer = [];
            return;
        }

        state.ast = {
            type: NodeNames.OPERATOR,
            operator: operator,
            negation: false,
            children: [state.ast].concat(state.operandBuffer),
        };
        state.operandBuffer = [];
    }

    private flushEnd(state: ParseState): AstNode | null {
        if (state.tokenBuffer.length > 0) {
            const pattern = this.createPatternNode(state.tokenBuffer, state.negationFlag);

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

    /*
     * Character classification and operator helpers
     */

    private isOperatorChar(char: string): boolean {
        return char === OperatorChar.AND || char === OperatorChar.OR || char === OperatorChar.XOR;
    }

    private getOperatorName(char: string): "AND" | "OR" | "XOR" {
        switch (char) {
            case OperatorChar.AND:
                return "AND";
            case OperatorChar.OR:
                return "OR";
            case OperatorChar.XOR:
                return "XOR";
            default:
                throw new Error(`Invalid operator character: ${char}`);
        }
    }

    private incrementParentheses(): void {
        this.parenthesesCount += 1;
    }

    private decrementParentheses(): void {
        if (this.parenthesesCount === 0) {
            this.setError(400, "Closing parenthesis without opening", "decrementParentheses");
            return;
        }
        this.parenthesesCount -= 1;
    }

    private createPatternNode(children: Token[], negation: boolean = false): PatternNode {
        const node: PatternNode = {
            type: NodeNames.PATTERN,
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
                child.type === NodeNames.OPERATOR &&
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
                this.setWarn("Invalid Logic: XOR has two identical elements. XOR(a,a) is always false");
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

    private applyWildcardConjunction(node: AstNode): void {
        if (node.type !== NodeNames.PATTERN) return;
        for (let i = 1; i < node.children.length; i++) {
            const lastChild = node.children[i - 1];
            const currChild = node.children[i];
            if (currChild.type === NodeNames.WILDCARD && lastChild.type === NodeNames.WILDCARD) {
                node.children.splice(i, 1);
                i -= 1;
            }
        }
    }

    private operatorAccepted(node: AstNode, acceptedOperators: Array<"AND" | "OR" | "XOR"> | "all"): boolean {
        if (node.type === NodeNames.PATTERN) return false;
        if (acceptedOperators === "all") return true;
        return acceptedOperators.includes(node.operator);
    }
}
