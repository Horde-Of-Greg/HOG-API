import fs from "fs";

import { filtersConfig } from "../config/config";
import type { Filter, PatternConfig } from "../types/server";
import { FILTERS_FILES } from "./files";

export const FILTERS: Filter[] = [];
FILTERS_FILES.forEach((value, key) => {
    if (!filtersConfig.grok.enabledFilters.includes(key)) {
        return;
    }

    const object = JSON.parse(fs.readFileSync(value, "utf-8"));

    object.patterns.forEach((element: PatternConfig) => {
        const filter: Filter = {
            pattern: new RegExp(`${element.pattern}`, "gi"),
            severity: element.severity,
            description: element.description,
        };
        FILTERS.push(filter);
    });
});
