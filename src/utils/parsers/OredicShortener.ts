import { DUMPS } from "../../loaders/storage";
import { Ast, exAst, NodeNames, SupportedPack } from "../../types/parsing";
import { getLogger } from "../Logger";
import { ErrorProne } from "../parentClasses/ErrorProne";
import { OredicMatcher } from "./OredicMatcher";
import { startTimer } from "../Timer";

const PROGRESS_UPDATE_INTERVAL = 10;

export class OredicSubstrings extends ErrorProne {
  private dump: string[];
  private shortestPatterns: Map<string, string>;

  constructor(private pack: SupportedPack) {
    super();
    this.dump = this.loadDump();
    this.shortestPatterns = new Map<string, string>();
    this.findShortestPatterns();
  }

  /*
   * Main processing
   */
  simplifyPatterns(ast: Ast) {
    if (!ast) return null;

    if (ast.type === NodeNames.PATTERN) {
      for (const child of ast.children) {
        if (child.type === NodeNames.WILDCARD) continue;

        const newText = this.shortestPatterns.get(child.content);

        if (!newText) continue;

        delete (child as any).content;
        child.content = newText;
      }
      return ast;
    }

    for (const child of ast.children) {
      this.simplifyPatterns(child);
    }
  }

  private findShortestPatterns(): void {
    getLogger().simpleLog(
      "info",
      `Finding shortest unique patterns for ${this.pack}`
    );
    startTimer("substrings");

    for (let position = 0; position < this.dump.length; position++) {
      const oredicName = this.dump[position];
      const shortestPattern = this.findShortestUniquePattern(oredicName);
      this.shortestPatterns.set(oredicName, shortestPattern);

      const currentIndex = position + 1;
      const shouldUpdateProgress =
        currentIndex % PROGRESS_UPDATE_INTERVAL === 0 ||
        currentIndex === this.dump.length;

      if (shouldUpdateProgress) {
        this.updateProgress(currentIndex, this.dump.length);
      }
    }

    getLogger().simpleLog(
      "success",
      `Found shortest patterns for ${this.dump.length} oredics`
    );
  }

  private findShortestUniquePattern(targetOredic: string): string {
    const patternGenerators = [
      () => this.generateSingleCharPatterns(targetOredic),
      () => this.generateTwoCharPatterns(targetOredic),
      () => this.generateThreeCharPatterns(targetOredic),
      () => this.generatePrefixSuffixPatterns(targetOredic),
      () => [targetOredic],
    ];

    for (const generator of patternGenerators) {
      const candidatePatterns = generator();

      for (const pattern of candidatePatterns) {
        if (this.isUniqueMatch(pattern, targetOredic)) {
          return pattern;
        }
      }
    }

    return targetOredic;
  }

  /*
   * Pattern validation
   */

  private isUniqueMatch(pattern: string, targetOredic: string): boolean {
    const matcher = new OredicMatcher(pattern, this.pack);
    const matchingOredics = matcher.match();

    const hasExactlyOneMatch = matchingOredics?.length === 1;
    const matchesTarget = matchingOredics?.[0] === targetOredic;

    return hasExactlyOneMatch && matchesTarget;
  }

  /*
   * Pattern generation
   */

  private generateSingleCharPatterns(text: string): string[] {
    const patterns: string[] = [];
    const lastIndex = text.length - 1;

    for (let index = 0; index < text.length; index++) {
      const char = text[index];
      const isFirstChar = index === 0;
      const isLastChar = index === lastIndex;

      patterns.push(`*${char}*`);

      if (isFirstChar) {
        patterns.push(`${char}*`);
      }

      if (isLastChar) {
        patterns.push(`*${char}`);
      }
    }

    return patterns;
  }

  private generateTwoCharPatterns(text: string): string[] {
    const patterns: string[] = [];

    this.generateConsecutivePairs(text, patterns);
    this.generateNonConsecutivePairs(text, patterns);

    return patterns;
  }

  private generateConsecutivePairs(text: string, patterns: string[]): void {
    const lastPairIndex = text.length - 2;

    for (let index = 0; index < text.length - 1; index++) {
      const pair = text.substring(index, index + 2);
      const isFirstPair = index === 0;
      const isLastPair = index === lastPairIndex;

      patterns.push(`*${pair}*`);

      if (isFirstPair) {
        patterns.push(`${pair}*`);
      }

      if (isLastPair) {
        patterns.push(`*${pair}`);
      }
    }
  }

  private generateNonConsecutivePairs(text: string, patterns: string[]): void {
    const lastIndex = text.length - 1;

    for (let firstIndex = 0; firstIndex < text.length - 1; firstIndex++) {
      const firstChar = text[firstIndex];

      for (
        let secondIndex = firstIndex + 2;
        secondIndex < text.length;
        secondIndex++
      ) {
        const secondChar = text[secondIndex];
        const isAtBoundary = firstIndex > 0 || secondIndex < lastIndex;

        patterns.push(`${firstChar}*${secondChar}`);

        if (isAtBoundary) {
          patterns.push(`*${firstChar}*${secondChar}*`);
        }
      }
    }
  }

  private generateThreeCharPatterns(text: string): string[] {
    const patterns: string[] = [];
    const lastTripletIndex = text.length - 3;

    for (let index = 0; index < text.length - 2; index++) {
      const triplet = text.substring(index, index + 3);
      const isFirstTriplet = index === 0;
      const isLastTriplet = index === lastTripletIndex;

      patterns.push(`*${triplet}*`);

      if (isFirstTriplet) {
        patterns.push(`${triplet}*`);
      }

      if (isLastTriplet) {
        patterns.push(`*${triplet}`);
      }
    }

    return patterns;
  }

  private generatePrefixSuffixPatterns(text: string): string[] {
    const patterns: string[] = [];

    for (let length = 4; length < text.length; length++) {
      const prefix = text.substring(0, length);
      const suffixStartIndex = text.length - length;
      const suffix = text.substring(suffixStartIndex);

      patterns.push(`${prefix}*`);
      patterns.push(`*${suffix}`);
    }

    return patterns;
  }

  /*
   * Utility methods
   */

  private loadDump(): string[] {
    const dumpContent = DUMPS.get(this.pack);

    if (!dumpContent) {
      throw new Error(`Failed to load oredic dump for pack: ${this.pack}`);
    }

    return dumpContent.split("\n");
  }

  private updateProgress(currentCount: number, totalCount: number): void {
    const PROGRESS_BAR_WIDTH = 50;
    const TIMER_ID = "substrings";
    const PROGRESS_LABEL = "Processing oredics";

    getLogger().progressBar(
      currentCount,
      totalCount,
      TIMER_ID,
      PROGRESS_BAR_WIDTH,
      PROGRESS_LABEL
    );
  }
}
