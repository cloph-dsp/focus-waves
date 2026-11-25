#![allow(non_snake_case)]

use crate::engine::SortCtx;
mod bubble;
#[path = "optimized-bubble.rs"] mod optimized_bubble;
#[path = "reverse-bubble.rs"] mod reverse_bubble;
mod quick;
mod merge;
mod insertion;
mod selection;
mod heap;
mod shell;
mod cocktail;
mod comb;
mod gnome;
#[path = "odd-even.rs"] mod odd_even;
mod radix;
mod counting;
mod bucket;
mod tim;
mod bogo;
mod bingo;
mod bogobogo;
mod bitonic;
mod cycle;
mod pancake;
mod stooge;
mod bead;
mod slow;
#[path = "binary-insertion.rs"] mod binary_insertion;
mod tree;
mod intro;
mod smooth;
mod strand;
mod pigeonhole;
mod flash;
mod library;
mod block;
mod patience;
mod tournament;
mod tag;
#[path = "american-flag.rs"] mod american_flag;
mod burst;
mod sleep;
mod stalin;
mod postman;
#[path = "merge-insertion.rs"] mod merge_insertion;
#[path = "cartesian-tree.rs"] mod cartesian_tree;
#[path = "double-selection.rs"] mod double_selection;
mod gravity;
mod network;
mod splaysort;
mod franceschini;
mod wiki;
mod cube;
#[path = "weak-heap.rs"] mod weak_heap;
#[path = "oscillating-merge.rs"] mod oscillating_merge;
mod grail;
#[path = "adaptive-merge.rs"] mod adaptive_merge;
mod lazy;
mod spreadsort;
mod pdq;
#[path = "dual-pivot-quick.rs"] mod dual_pivot_quick;
#[path = "3-way-quick.rs"] mod _3_way_quick;
mod brick;
mod shear;
mod columnsort;
mod samplesort;
#[path = "recursive-bubble.rs"] mod recursive_bubble;
#[path = "iterative-merge.rs"] mod iterative_merge;
#[path = "bottom-up-heap.rs"] mod bottom_up_heap;
#[path = "smooth-stooge.rs"] mod smooth_stooge;
#[path = "binary-tree.rs"] mod binary_tree;
#[path = "red-black-tree.rs"] mod red_black_tree;
#[path = "aa-tree.rs"] mod aa_tree;
#[path = "b-tree.rs"] mod b_tree;
mod treap;
#[path = "skip-list.rs"] mod skip_list;
mod merge3;
mod merge4;
#[path = "polyphase-merge.rs"] mod polyphase_merge;
#[path = "cascade-merge.rs"] mod cascade_merge;
#[path = "tournament-heap.rs"] mod tournament_heap;
#[path = "min-max-heap.rs"] mod min_max_heap;
#[path = "binomial-heap.rs"] mod binomial_heap;
#[path = "fibonacci-heap.rs"] mod fibonacci_heap;
#[path = "pairing-heap.rs"] mod pairing_heap;
#[path = "leftist-heap.rs"] mod leftist_heap;
#[path = "skew-heap.rs"] mod skew_heap;
#[path = "median-of3-quick.rs"] mod median_of3_quick;
#[path = "random-pivot-quick.rs"] mod random_pivot_quick;
#[path = "yaroslavskiy-quick.rs"] mod yaroslavskiy_quick;
#[path = "hoare-partition.rs"] mod hoare_partition;
#[path = "lomuto-partition.rs"] mod lomuto_partition;
#[path = "natural-merge.rs"] mod natural_merge;
#[path = "insertion-binary.rs"] mod insertion_binary;
#[path = "shell-ciura.rs"] mod shell_ciura;
#[path = "shell-knuth.rs"] mod shell_knuth;
#[path = "shell-tokuda.rs"] mod shell_tokuda;
#[path = "odd-even-merge.rs"] mod odd_even_merge;
mod pairwise;
#[path = "merge-exchange.rs"] mod merge_exchange;
mod batch;
pub fn run(id: &str, ctx: &mut SortCtx, size: usize, loop_: bool) -> bool {
    match id {
        "bubble" => bubble::generateBubbleSort(ctx, size, loop_),
        "optimized-bubble" => optimized_bubble::generateOptimizedBubbleSort(ctx, size, loop_),
        "reverse-bubble" => reverse_bubble::generateReverseBubbleSort(ctx, size, loop_),
        "quick" => quick::generateQuickSort(ctx, size, loop_),
        "merge" => merge::generateMergeSort(ctx, size, loop_),
        "insertion" => insertion::generateInsertionSort(ctx, size, loop_),
        "selection" => selection::generateSelectionSort(ctx, size, loop_),
        "heap" => heap::generateHeapSort(ctx, size, loop_),
        "shell" => shell::generateShellSort(ctx, size, loop_),
        "cocktail" => cocktail::generateCocktailSort(ctx, size, loop_),
        "comb" => comb::generateCombSort(ctx, size, loop_),
        "gnome" => gnome::generateGnomeSort(ctx, size, loop_),
        "odd-even" => odd_even::generateOddEvenSort(ctx, size, loop_),
        "radix" => radix::generateRadixSort(ctx, size, loop_),
        "counting" => counting::generateCountingSort(ctx, size, loop_),
        "bucket" => bucket::generateBucketSort(ctx, size, loop_),
        "tim" => tim::generateTimSort(ctx, size, loop_),
        "bogo" => bogo::generateBogoSort(ctx, size, loop_),
        "bingo" => bingo::generateBingoSort(ctx, size, loop_),
        "bogobogo" => bogobogo::generateBogobogoSort(ctx, size, loop_),
        "bitonic" => bitonic::generateBitonicSort(ctx, size, loop_),
        "cycle" => cycle::generateCycleSort(ctx, size, loop_),
        "pancake" => pancake::generatePancakeSort(ctx, size, loop_),
        "stooge" => stooge::generateStoogeSort(ctx, size, loop_),
        "bead" => bead::generateBeadSort(ctx, size, loop_),
        "slow" => slow::generateSlowSort(ctx, size, loop_),
        "binary-insertion" => binary_insertion::generateBinaryInsertionSort(ctx, size, loop_),
        "tree" => tree::generateTreeSort(ctx, size, loop_),
        "intro" => intro::generateIntroSort(ctx, size, loop_),
        "smooth" => smooth::generateSmoothSort(ctx, size, loop_),
        "strand" => strand::generateStrandSort(ctx, size, loop_),
        "pigeonhole" => pigeonhole::generatePigeonholeSort(ctx, size, loop_),
        "flash" => flash::generateFlashSort(ctx, size, loop_),
        "library" => library::generateLibrarySort(ctx, size, loop_),
        "block" => block::generateBlockSort(ctx, size, loop_),
        "patience" => patience::generatePatienceSort(ctx, size, loop_),
        "tournament" => tournament::generateTournamentSort(ctx, size, loop_),
        "tag" => tag::generateTagSort(ctx, size, loop_),
        "american-flag" => american_flag::generateAmericanFlagSort(ctx, size, loop_),
        "burst" => burst::generateBurstSort(ctx, size, loop_),
        "sleep" => sleep::generateSleepSort(ctx, size, loop_),
        "stalin" => stalin::generateStalinSort(ctx, size, loop_),
        "postman" => postman::generatePostmanSort(ctx, size, loop_),
        "merge-insertion" => merge_insertion::generateMergeInsertionSort(ctx, size, loop_),
        "cartesian-tree" => cartesian_tree::generateCartesianTreeSort(ctx, size, loop_),
        "double-selection" => double_selection::generateDoubleSelectionSort(ctx, size, loop_),
        "gravity" => gravity::generateGravitySort(ctx, size, loop_),
        "network" => network::generateNetworkSort(ctx, size, loop_),
        "splay" => splaysort::generateSplaysort(ctx, size, loop_),
        "franceschini" => franceschini::generateFranceschiniSort(ctx, size, loop_),
        "wiki" => wiki::generateWikiSort(ctx, size, loop_),
        "cube" => cube::generateCubeSort(ctx, size, loop_),
        "weak-heap" => weak_heap::generateWeakHeapSort(ctx, size, loop_),
        "oscillating" => oscillating_merge::generateOscillatingMergeSort(ctx, size, loop_),
        "grail" => grail::generateGrailSort(ctx, size, loop_),
        "adaptive-merge" => adaptive_merge::generateAdaptiveMergeSort(ctx, size, loop_),
        "lazy" => lazy::generateLazySort(ctx, size, loop_),
        "spread" => spreadsort::generateSpreadsort(ctx, size, loop_),
        "pdq" => pdq::generatePDQSort(ctx, size, loop_),
        "dual-pivot" => dual_pivot_quick::generateDualPivotQuickSort(ctx, size, loop_),
        "3-way" => _3_way_quick::generate3WayQuickSort(ctx, size, loop_),
        "brick" => brick::generateBrickSort(ctx, size, loop_),
        "shear" => shear::generateShearSort(ctx, size, loop_),
        "columnsort" => columnsort::generateColumnsort(ctx, size, loop_),
        "samplesort" => samplesort::generateSamplesort(ctx, size, loop_),
        "recursive-bubble" => recursive_bubble::generateRecursiveBubbleSort(ctx, size, loop_),
        "iterative-merge" => iterative_merge::generateIterativeMergeSort(ctx, size, loop_),
        "bottom-up-heap" => bottom_up_heap::generateBottomUpHeapSort(ctx, size, loop_),
        "smooth-stooge" => smooth_stooge::generateSmoothStoogeSort(ctx, size, loop_),
        "binary-tree" => binary_tree::generateBinaryTreeSort(ctx, size, loop_),
        "red-black" => red_black_tree::generateRedBlackTreeSort(ctx, size, loop_),
        "aa-tree" => aa_tree::generateAATreeSort(ctx, size, loop_),
        "b-tree" => b_tree::generateBTreeSort(ctx, size, loop_),
        "treap" => treap::generateTreapSort(ctx, size, loop_),
        "skip-list" => skip_list::generateSkipListSort(ctx, size, loop_),
        "merge3" => merge3::generateMerge3Sort(ctx, size, loop_),
        "merge4" => merge4::generateMerge4Sort(ctx, size, loop_),
        "polyphase" => polyphase_merge::generatePolyphaseMergeSort(ctx, size, loop_),
        "cascade" => cascade_merge::generateCascadeMergeSort(ctx, size, loop_),
        "tournament-heap" => tournament_heap::generateTournamentHeapSort(ctx, size, loop_),
        "min-max-heap" => min_max_heap::generateMinMaxHeapSort(ctx, size, loop_),
        "binomial-heap" => binomial_heap::generateBinomialHeapSort(ctx, size, loop_),
        "fibonacci-heap" => fibonacci_heap::generateFibonacciHeapSort(ctx, size, loop_),
        "pairing-heap" => pairing_heap::generatePairingHeapSort(ctx, size, loop_),
        "leftist-heap" => leftist_heap::generateLeftistHeapSort(ctx, size, loop_),
        "skew-heap" => skew_heap::generateSkewHeapSort(ctx, size, loop_),
        "median-of-3" => median_of3_quick::generateMedianOf3QuickSort(ctx, size, loop_),
        "random-pivot" => random_pivot_quick::generateRandomPivotQuickSort(ctx, size, loop_),
        "yaroslavskiy" => yaroslavskiy_quick::generateYaroslavskiyQuickSort(ctx, size, loop_),
        "hoare-partition" => hoare_partition::generateHoarePartitionSort(ctx, size, loop_),
        "lomuto-partition" => lomuto_partition::generateLomutoPartitionSort(ctx, size, loop_),
        "natural-merge" => natural_merge::generateNaturalMergeSort(ctx, size, loop_),
        "insertion-binary" => insertion_binary::generateInsertionBinarySort(ctx, size, loop_),
        "shell-ciura" => shell_ciura::generateShellCiuraSort(ctx, size, loop_),
        "shell-knuth" => shell_knuth::generateShellKnuthSort(ctx, size, loop_),
        "shell-tokuda" => shell_tokuda::generateShellTokudaSort(ctx, size, loop_),
        "odd-even-merge" => odd_even_merge::generateOddEvenMergeSort(ctx, size, loop_),
        "pairwise" => pairwise::generatePairwiseSort(ctx, size, loop_),
        "merge-exchange" => merge_exchange::generateMergeExchangeSort(ctx, size, loop_),
        "batch-sort" => batch::generateBatchSort(ctx, size, loop_),
        _ => return false,
    }
    true
}