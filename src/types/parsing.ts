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

export type AstNode = PatternNode | OperatorNode;
export type MatcherNode =
  | RegexNode
  | OredicNode
  | MatcherOperatorNode
  | AstNode;

export type OperatorNode = AndNode | OrNode | XorNode;
export type MatcherOperatorNode =
  | MatcherAndNode
  | MatcherOrNode
  | MatcherXorNode;

export type LexemeElement =
  | TextLexeme
  | OperatorLexeme
  | NegationLexeme
  | WildcardLexeme
  | GroupLexeme;

export type TextLexeme = {
  type: LexemeNames.TEXT;
  content: string;
};

export type OperatorLexeme = {
  type: LexemeNames.OPERATOR;
  content: "AND" | "OR" | "XOR";
};

export type NegationLexeme = {
  type: LexemeNames.NEGATION;
  content: null;
};

export type WildcardLexeme = {
  type: LexemeNames.WILDCARD;
  content: null;
};

export type GroupLexeme = {
  type: LexemeNames.GROUP;
  content: LexemeElement[];
};

export type LexicalParseResult = {
  lexemes: LexemeElement[];
  consumed: number;
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

export type MatcherAndNode = {
  type: NodeNames.OPERATOR;
  operator: "AND";
  negation: boolean;
  children: Array<MatcherNode>;
};
export type MatcherOrNode = {
  type: NodeNames.OPERATOR;
  operator: "OR";
  negation: boolean;
  children: Array<MatcherNode>;
};
export type MatcherXorNode = {
  type: NodeNames.OPERATOR;
  operator: "XOR";
  negation: boolean;
  children: Array<MatcherNode>;
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

export type OredicMatches = string[];

export type BuildOptions = {
  shortenedDisjunction: boolean;
};
