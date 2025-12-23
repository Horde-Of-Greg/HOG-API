import type fs from "fs";

export class StringUtils {
    static getUtf8Bytes(string: string): number {
        return new TextEncoder().encode(string).length;
    }

    static toUtf8Decimals(string: string): number[] {
        const out: number[] = [];
        for (let i = 0; i < string.length; i++) {
            const unicode = string.charCodeAt(i);
            out.push(unicode);
        }
        return out;
    }

    static isValidFileName(path: fs.PathLike): boolean {
        const fileName = path.toString();

        const byteLength = this.getUtf8Bytes(fileName);
        if (byteLength > 255) {
            return false;
        }

        const unicodes: number[] = this.toUtf8Decimals(fileName);
        for (const unicode of unicodes) {
            if (unicode === 0 || unicode === 47) {
                return false;
            }
        }

        if (unicodes.length === 0) return false;

        if (unicodes.length === 1 && unicodes[0] === 46) {
            return false;
        }
        if (unicodes.length === 2 && unicodes[0] === 46 && unicodes[1] === 46) {
            return false;
        }

        return true;
    }

    /* This enforces relative paths only, without dots to signify it is relative
     * No paths beginning with / are allowed.
     * This is good because npm always has some ambiguity as to where ./ is.
     * This codebase makes all file operations through FileSystem,
     * so paths should always be relative to the configured root directory.
     */
    static isValidPath(path: fs.PathLike) {
        let pathStr = path.toString();

        if (pathStr.length === 0) return false;

        if (pathStr.startsWith("/")) return false;

        if (pathStr.endsWith("/")) {
            pathStr = pathStr.substring(0, pathStr.length - 1);
        }

        const elements = pathStr.split("/");

        for (const element of elements) {
            if (element === "") return false;

            if (!this.isValidFileName(element)) return false;
        }

        return true;
    }
}
