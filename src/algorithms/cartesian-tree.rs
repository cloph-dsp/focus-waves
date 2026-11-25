use crate::audio::Wave;
use crate::engine::SortCtx;

/// Emit the current Cartesian-tree root (the minimum of the slice), then recurse on
/// the remaining nodes. A plain inorder walk rebuilds the original array, so the
/// root must be extracted — and sonified — in ascending order instead.
fn inorder(
    ctx: &SortCtx,
    arr: &[i64],
    result: &mut Vec<i64>,
    note_duration: f32,
    size: usize,
) {
    if arr.is_empty() || ctx.stopped() {
        return;
    }
    let min_pos = arr
        .iter()
        .enumerate()
        .min_by_key(|(_, value)| **value)
        .map(|(i, _)| i)
        .unwrap();

    let value = arr[min_pos];
    result.push(value);
    ctx.play(ctx.freq(value as f64, size as f64), note_duration, Wave::Sine);
    ctx.visual(result, &[result.len() - 1]);
    ctx.delay(ctx.adaptive_delay(200.0, size));

    let mut rest = Vec::with_capacity(arr.len() - 1);
    rest.extend_from_slice(&arr[..min_pos]);
    rest.extend_from_slice(&arr[min_pos + 1..]);
    inorder(ctx, &rest, result, note_duration, size);
}

// Ported from TypeScript: src/utils/audio/algorithms/cartesian-tree.ts
// Deviation: inorder traversal of a Cartesian tree returns the original order; this
// uses repeated root extraction (the actual Cartesian-tree sort) for ascending output.
#[allow(non_snake_case)]
pub fn generateCartesianTreeSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let note_duration = ctx.adaptive_duration(0.0075, size);
        let mut result = Vec::with_capacity(array.len());

        inorder(ctx, &array, &mut result, note_duration, size);
        if ctx.stopped() {
            return;
        }
        array.copy_from_slice(&result);

        ctx.play_sorted(&array);
        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}
