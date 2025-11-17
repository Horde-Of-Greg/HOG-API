export enum OperatorChar {
  AND = "&",
  OR = "|",
  XOR = "^",
}

export enum SpecialChar {
  WILDCARD = "*",
  NEGATION = "!",
  GROUP_START = "(",
  GROUP_END = ")",
  SPACE = " ",
}

export enum LexemeNames {
  OPERATOR = "operator",
  WILDCARD = "wildcard",
  NEGATION = "negation",
  GROUP = "group",
  TEXT = "text",
}

export enum NodeNames {
  OPERATOR = "operator",
  PATTERN = "pattern",
  REGEX = "regex",
  OREDIC = "oredic",
  TEXT = "text",
  WILDCARD = "wildcard",
}

export type ParseState = {
  ast: Ast;
  tokenBuffer: Token[];
  operandBuffer: AstNode[];
  currentOperator: "AND" | "XOR" | "OR" | null;
  negationFlag: boolean;
};

export type Ast = AstNode | null;
export type exAst = exAstNode | null;

export type AstNode = PatternNode | OperatorNode;
export type exAstNode = RegexNode | OredicNode | exOperatorNode | AstNode;

export type OperatorNode = AndNode | OrNode | XorNode;

export type LexemeElement = {
  type: LexemeNames;
  content: LexemeElement[] | string | null;
};

export type AndNode = {
  type: NodeNames.OPERATOR;
  operator: "AND";
  negation: boolean;
  children: Array<AstNode>;
};
export type OrNode = {
  type: NodeNames.OPERATOR;
  operator: "OR";
  negation: boolean;
  children: Array<AstNode>;
};
export type XorNode = {
  type: NodeNames.OPERATOR;
  operator: "XOR";
  negation: boolean;
  children: Array<AstNode>;
};

export type exOperatorNode = exAndNode | exOrNode | exXorNode;

export type exAndNode = {
  type: NodeNames.OPERATOR;
  operator: "AND";
  negation: boolean;
  children: Array<exAstNode>;
};
export type exOrNode = {
  type: NodeNames.OPERATOR;
  operator: "OR";
  negation: boolean;
  children: Array<exAstNode>;
};
export type exXorNode = {
  type: NodeNames.OPERATOR;
  operator: "XOR";
  negation: boolean;
  children: Array<exAstNode>;
};

export type PatternNode = {
  type: NodeNames.PATTERN;
  negation: boolean;
  children: Array<Token>;
};

export type RegexNode = {
  type: NodeNames.REGEX;
  negation: boolean;
  rawChild: string;
  child: RegExp;
};

export type OredicNode = {
  type: NodeNames.OREDIC;
  negation: boolean;
  children: string[];
};

export type Token =
  | { type: NodeNames.TEXT; content: string }
  | { type: NodeNames.WILDCARD };

export type Matches = string[];

export type BuildOptions = {
  shortenedDisjunction: boolean;
};
