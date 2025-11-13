export type Ast = AstNode | null;
export type exAst = exAstNode | null;

export type AstNode = PatternNode | OperatorNode;
export type exAstNode = RegexNode | OredicNode | exOperatorNode | AstNode;

export type PatternNode = {
  type: "pattern";
  negation: boolean;
  children: Array<Token>;
};

export type RegexNode = {
  type: "regex";
  negation: boolean;
  rawChild: string;
  child: RegExp;
};

export type OredicNode = {
  type: "oredic";
  negation: boolean;
  children: string[] | null;
};

export type OperatorNode = AndNode | OrNode | XorNode;

export type AndNode = {
  type: "operator";
  operator: "AND";
  negation: boolean;
  children: Array<AstNode>;
};
export type OrNode = {
  type: "operator";
  operator: "OR";
  negation: boolean;
  children: Array<AstNode>;
};
export type XorNode = {
  type: "operator";
  operator: "XOR";
  negation: boolean;
  children: Array<AstNode>;
};

export type exOperatorNode = exAndNode | exOrNode | exXorNode;

export type exAndNode = {
  type: "operator";
  operator: "AND";
  negation: boolean;
  children: Array<exAstNode>;
};
export type exOrNode = {
  type: "operator";
  operator: "OR";
  negation: boolean;
  children: Array<exAstNode>;
};
export type exXorNode = {
  type: "operator";
  operator: "XOR";
  negation: boolean;
  children: Array<exAstNode>;
};

export type Token = { type: "text"; content: string } | { type: "wildcard" };

export type SupportedPack = "nomi-ceu";
