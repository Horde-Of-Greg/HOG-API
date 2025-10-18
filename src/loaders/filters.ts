import fs from "fs";
import { Filter, PatternConfig } from "../types/server";
import { FILTERS_FILES } from "./files";
import { filtersConfig } from "../config/config";

export let FILTERS: Filter[] = [];
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
