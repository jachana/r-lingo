# Content audit — 30 September 2026

Reviewed all 108 prompts, choices, expected answers and accepted alternatives. Code fragments are assessed in their named context; function-name answers are syntax exercises, not standalone scripts. The generic string-vector task intentionally allows other object names and quoted values. All other tasks use exact normalization and authored alternatives.

All 9 unit theory scripts and the output/error examples are executed by `npm run verify:r`; this does not claim every textual distractor was executed. See [R execution evidence](r-runtime.json). The runtime uses webR as a development tool, as described by its [official documentation](https://docs.r-wasm.org/webr/latest/downloading.html); it is not part of the app bundle.

| Challenge | Validation | Review decision |
|---|---|---|
| r-basics-q01 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| r-basics-q02 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| r-basics-q03 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| r-basics-q04 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| r-basics-q05 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| r-basics-q06 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| r-basics-q07 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| r-basics-q08 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| r-basics-q09 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| r-basics-q10 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| r-basics-q11 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| r-basics-q12 | exact (default) | Defined the population so the undefined-object error has one intended cause. |
| vectors-q01 | exact (default) | Named the required object; exact alternatives retain assignment syntax flexibility. |
| vectors-q02 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| vectors-q03 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| vectors-q04 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| vectors-q05 | string-vector | Authored string-vector policy: values and object name are intentionally open-ended. |
| vectors-q06 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| vectors-q07 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| vectors-q08 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| vectors-q09 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| vectors-q10 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| vectors-q11 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| vectors-q12 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| tables-q01 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| tables-q02 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| tables-q03 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| tables-q04 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| tables-q05 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| tables-q06 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| tables-q07 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| tables-q08 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| tables-q09 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| tables-q10 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| tables-q11 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| tables-q12 | exact (default) | Specified the absence of readr so the base-R alternative is appropriate. |
| cleaning-q01 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| cleaning-q02 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| cleaning-q03 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| cleaning-q04 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| cleaning-q05 | exact (default) | Specified the data-pipeline context for the verb fragment. |
| cleaning-q06 | exact (default) | Specified the data-pipeline context for the verb fragment. |
| cleaning-q07 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| cleaning-q08 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| cleaning-q09 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| cleaning-q10 | exact (default) | Specified the data-pipeline context for the verb fragment. |
| cleaning-q11 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| cleaning-q12 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| filtering-q01 | exact (default) | Specified the data-pipeline context for the verb fragment. |
| filtering-q02 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| filtering-q03 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| filtering-q04 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| filtering-q05 | exact (default) | Specified the data-pipeline context for the verb fragment. |
| filtering-q06 | exact (default) | Changed older than 60 to 60 or older to match >=. |
| filtering-q07 | exact (default) | Specified the data-pipeline context for the verb fragment. |
| filtering-q08 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| filtering-q09 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| filtering-q10 | exact (default) | Specified the data-pipeline context for the verb fragment. |
| filtering-q11 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| filtering-q12 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| indicators-q01 | exact (default) | Specified the data-pipeline context for the verb fragment. |
| indicators-q02 | exact (default) | Specified the data-pipeline context for the verb fragment. |
| indicators-q03 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| indicators-q04 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| indicators-q05 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| indicators-q06 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| indicators-q07 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| indicators-q08 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| indicators-q09 | exact (default) | Specified the data-pipeline context for the verb fragment. |
| indicators-q10 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| indicators-q11 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| indicators-q12 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| plots-q01 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| plots-q02 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| plots-q03 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| plots-q04 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| plots-q05 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| plots-q06 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| plots-q07 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| plots-q08 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| plots-q09 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| plots-q10 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| plots-q11 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| plots-q12 | exact (default) | Described a missing plotted layer, not an execution failure. |
| dates-q01 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| dates-q02 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| dates-q03 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| dates-q04 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| dates-q05 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| dates-q06 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| dates-q07 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| dates-q08 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| dates-q09 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| dates-q10 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| dates-q11 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| dates-q12 | exact (default) | Described a format mismatch, not an exception. |
| export-q01 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| export-q02 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| export-q03 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| export-q04 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| export-q05 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| export-q06 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| export-q07 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| export-q08 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| export-q09 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| export-q10 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| export-q11 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
| export-q12 | exact (default) | Prompt, choices, alternatives and answer reviewed; no wording change required. |
