# Sonification research notes

## Why tone-per-access works

- Adams, Allen, Fowler, Wissink & Wright (2022), *The Sounds of Sorting Algorithms:
  Sonification as a Pedagogical Tool*, SIGCSE '22, pp. 189–195,
  doi:10.1145/3478431.3499304. Tone-per-value-access sonifications of common sorts
  improved students' long-term recall in a controlled experiment.
- Adams & Anderson (2024), *Hearing Iterative and Recursive Behavior*, SIGCSE '24 V.1,
  doi:10.1145/3626252.3630866 (open access). Iterative vs recursive control flow is
  audibly discriminable; spectrograms and a student experiment support the claim.

These two results motivate keeping the one-tone-per-comparison/swap mapping and adding
algorithms whose control flow has a distinctive shape, rather than merely different names.

## Candidates evaluated against the existing catalog

| Algorithm | Reference | Decision | Reason |
|---|---|---|---|
| BFPRT (median-of-medians) quicksort | Blum, Floyd, Pratt, Rivest & Tarjan (1973), JCSS 7(4):448–461, doi:10.1016/S0022-0000(73)80033-9 | **Added** (`bfprt`) | Groups of five sound as quintets, then the medians-of-medians form a secondary recursive voice; balanced pivots give even phrase lengths. |
| SymMerge (ratio-based stable in-place merge) | Kim & Kutzner (2008), TAMC, LNCS 4978:246–257, doi:10.1007/978-3-540-79228-4_22 | **Added** (`symmerge`) | Recursive rank splitting plus three block reversals give nested up/down pitch sweeps, unlike the interleaved texture of `merge`. |
| Min–max heapsort | Atkinson, Sack, Santoro & Strothotte (1986), CACM 29(10):996–1000, doi:10.1145/6617.6621 | Deferred | Alternating min/max levels would sound distinctive, but an alias with this name was removed in the earlier curation; revisit only with a genuine implementation. |
| Binomial-heap sort | Vuillemin (1978), CACM 21(4):309–315, doi:10.1145/359460.359478 | Deferred | Ruler-function merge cascades; same caveat as above. |
| Pairing-heap sort | Fredman, Sedgewick, Sleator & Tarjan (1986), Algorithmica 1:111–129, doi:10.1007/BF01840439 | Deferred | Two-pass re-merge cadence; moderate overlap with `splay`/`weak-heap`. |
| Polyphase merge sort | Knuth, TAOCP Vol. 3 §5.4.2D; Reynolds (1961), CACM 4(8):347–349, doi:10.1145/366678.366689 | Deferred | Fibonacci run distribution; needs 3–4 tape buffers, not pure swaps. |
| Batcher odd–even mergesort | Batcher (1968), AFIPS Spring Joint Computer Conference, doi:10.1145/1468075.1468121 | Skipped | Duplicates the `bitonic`/`network` sonic niche. |
| Spaghetti (poll) sort | Dewdney (1984), Scientific American 250(6):19–26 | Skipped | Its output is just the final sweep in reverse; conceptual value only. |
| AKS sorting network | Ajtai, Komlós & Szemerédi (1983), STOC '83:1–9, doi:10.1145/800061.808726 | Skipped | Not portable with this API's array primitives; enormous constant would be a dense rumble. |

## Limitations

The SIGCSE 2022 paper is paywalled; its exact four sonified sorts were not inspected.
Novelty judgements are based on the current catalog ids and published algorithm structure.
Pitch mapping and note density dominate perceived distinctiveness, so deferred candidates
may still sound closer to existing entries than the descriptions suggest.
