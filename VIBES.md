# What is this?

A document for transparency about which parts of the code are made using AI. Important for potential future changes to this repository, to identify which parts could have issues. Each element in the list should say what is vibe coded, and why.

# List

### `src/middleware/validateRequest.ts`

- What is vibe coded: l17-l59
- Reasons: very simple logic, but repetitive. Could be improved with recursion.
- Author: D-Alessian

### `storage/filters/*`

- What is vibe coded: All the filter JSONs, except exploits.json
- Reasons: I really don't feel like writing 150000 regexes manually, and I don't really care about doing this right.
- Author: D-Alessian
