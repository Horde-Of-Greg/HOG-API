import type { OredicPack } from "../../config/routes";
import { getLogger } from "../../helpers/Logger";
import { startTimer, stopTimer, Timer } from "../../helpers/Timer";
import { DUMPS } from "../../loaders/storage";
import type { StandardError } from "../../types/errors";
import type { TimerRes } from "../../types/timer";
import { ErrorProne } from "../parentClasses/ErrorProne";
import { OredicMatcher } from "./OredicMatcher";

const PROGRESS_UPDATE_INTERVAL = 10;

type TelemetryResults = {
    result: {
        string: string;
        length: number;
        shortening: number;
    };
    timings: TimerRes;
};

export class OredicShortener extends ErrorProne {
    private dump: string[];
    private matcher: OredicMatcher;
    private telemetry: Map<string, TelemetryResults>;
    private shortcuts: Map<string, string>;

    constructor(private pack: OredicPack) {
        super("OredicShortener");
        this.dump = this.loadDump();
        this.matcher = new OredicMatcher(this.pack);
        this.telemetry = new Map();
        this.shortcuts = new Map();
    }

    initShortcuts() {
        const shortcuts = this.getShortcuts();
        if (this.isError(shortcuts)) {
            return this.propagateError(shortcuts, "Could not initialize shortcuts", "initShortcuts");
        }
        if (this.shortcuts.size === 0) {
            return this.setError(500, "Could not initialize shortcuts", "initShortcuts");
        }
    }

    getShortcuts(): Map<string, string> | StandardError {
        //TODO: Implement caching strategy!!!

        if (this.shortcuts.size === 0) {
            const result = this.findAll();
            if (this.isError(result)) {
                return this.propagateError(result, "Failed to generate shortcuts", "getShortcuts");
            }
            this.shortcuts = result;
        }

        return this.shortcuts;
    }

    getTelemetry(): Map<string, TelemetryResults> {
        return new Map(this.telemetry);
    }

    private findAll(): Map<string, string> {
        getLogger().simpleLog("info", `Finding shortest patterns for ${this.pack}`);
        startTimer("shortening");

        const result = new Map<string, string>();

        for (let i = 0; i < this.dump.length; i++) {
            const oredicTimer = new Timer();
            const oredic = this.dump[i];
            const pattern = this.findShortest(oredic, i);
            result.set(oredic, pattern);

            const timerResult = oredicTimer.getTime();
            this.telemetry.set(oredic, {
                timings: timerResult,
                result: {
                    string: pattern,
                    length: pattern.length,
                    shortening: oredic.length - pattern.length,
                },
            });

            if ((i + 1) % PROGRESS_UPDATE_INTERVAL === 0 || i === this.dump.length - 1) {
                this.logProgress(i + 1, this.dump.length);
            }
        }

        const time = stopTimer("shortening").getTime();
        getLogger().simpleLog("success", `Found ${result.size} patterns in ${time.formatted}`);

        return result;
    }

    private findShortest(oredic: string, oredicIndex: number): string {
        const maxUsefulLength = oredic.length - 2;

        for (let length = 1; length <= maxUsefulLength; length++) {
            const pattern = this.tryLength(oredic, oredicIndex, length);
            if (pattern) return pattern;
        }

        return oredic;
    }

    private tryLength(text: string, oredicIndex: number, length: number): string | null {
        return this.tryPositions(text, oredicIndex, length, 0, []);
    }

    private tryPositions(
        text: string,
        oredicIndex: number,
        remaining: number,
        start: number,
        positions: number[],
    ): string | null {
        if (remaining === 0) {
            if (this.hasUselessGaps(positions)) {
                return null;
            }

            const pattern = this.buildPattern(text, positions);
            return this.matcher.isUniqueMatch(pattern, oredicIndex) ? pattern : null;
        }

        const maxPos = text.length - remaining;
        for (let pos = start; pos <= maxPos; pos++) {
            positions.push(pos);
            const result = this.tryPositions(text, oredicIndex, remaining - 1, pos + 1, positions);
            if (result) return result;
            positions.pop();
        }

        return null;
    }

    private hasUselessGaps(positions: number[]): boolean {
        for (let i = 0; i < positions.length - 1; i++) {
            const gapSize = positions[i + 1] - positions[i] - 1;
            if (gapSize === 1) {
                return true;
            }
        }
        return false;
    }

    private buildPattern(text: string, positions: number[]): string {
        if (positions.length === 0) return "";

        const parts: string[] = [];

        if (positions[0] > 0) parts.push("*");

        for (let i = 0; i < positions.length; i++) {
            parts.push(text[positions[i]]);

            if (i < positions.length - 1 && positions[i + 1] > positions[i] + 1) {
                parts.push("*");
            }
        }

        if (positions[positions.length - 1] < text.length - 1) parts.push("*");

        return parts.join("");
    }

    private loadDump(): string[] {
        const dumpContent = DUMPS.get(this.pack);
        if (!dumpContent) {
            throw new Error(`Failed to load oredic dump for pack: ${this.pack}`);
        }
        return dumpContent.split("\n");
    }

    private logProgress(current: number, total: number): void {
        getLogger().progressBar(current, total, "shortening", 50, "Processing");
    }
}
