use crate::engine::SortCtx;

// Ported from TypeScript: src/utils/audio/algorithms/merge4.ts
// The TS implementation is an alias: it returns generateMerge3Sort(...).
#[allow(non_snake_case)]
pub fn generateMerge4Sort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    super::merge3::generateMerge3Sort(ctx, size, loop_);
}
