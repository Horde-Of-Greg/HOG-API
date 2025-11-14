import { DUMPS } from "../../loaders/storage";
import { SupportedPack } from "../../types/parsing";
import { ErrorProne } from "../parentClasses/ErrorProne";

export class OredicSubstrings extends ErrorProne {
  baseStrings: string[] | undefined;

  constructor(private pack: SupportedPack) {
    super();
    this.baseStrings = DUMPS.get(pack)?.split("\n");
    if (!this.baseStrings) {
      this.setError(500, "Failed to load oredic dump");
    }
  }
}
