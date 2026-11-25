use crate::audio::Wave;
use crate::engine::SortCtx;

const NULL: usize = usize::MAX;

/// Array-backed BST: (value, left child index, right child index).
fn inorder(
    ctx: &mut SortCtx,
    nodes: &[(i64, usize, usize)],
    idx: usize,
    result: &mut Vec<i64>,
    frame: &mut [i64],
    size: usize,
    note_duration: f32,
) {
    if ctx.stopped() || idx == NULL {
        return;
    }
    let (value, left, right) = nodes[idx];
    inorder(ctx, nodes, left, result, frame, size, note_duration);
    if ctx.stopped() {
        return;
    }
    result.push(value);
    ctx.play(
        ctx.freq(value as f64, size as f64),
        note_duration,
        Wave::Sine,
    );
    // Mirror the TS visual: sorted prefix followed by zeros.
    frame.fill(0);
    frame[..result.len()].copy_from_slice(&result[..]);
    ctx.visual(&frame[..], &[result.len() - 1]);
    ctx.delay(ctx.adaptive_delay(200.0, size));
    inorder(ctx, nodes, right, result, frame, size, note_duration);
}

// Ported from TypeScript: src/utils/audio/algorithms/tree.ts
#[allow(non_snake_case)]
pub fn generateTreeSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let note_duration = ctx.adaptive_duration(0.0075, size);
        let mut nodes: Vec<(i64, usize, usize)> = Vec::with_capacity(array.len());
        let mut root = NULL;

        for &value in array.iter() {
            if ctx.stopped() {
                return;
            }
            if root == NULL {
                ctx.play(
                    ctx.freq(value as f64, size as f64),
                    note_duration,
                    Wave::Sine,
                );
                nodes.push((value, NULL, NULL));
                root = nodes.len() - 1;
            } else {
                let mut cur = root;
                loop {
                    if ctx.stopped() {
                        return;
                    }
                    let (node_value, left, right) = nodes[cur];
                    if value < node_value {
                        if left == NULL {
                            ctx.play(
                                ctx.freq(value as f64, size as f64),
                                note_duration,
                                Wave::Sine,
                            );
                            nodes.push((value, NULL, NULL));
                            nodes[cur].1 = nodes.len() - 1;
                            break;
                        }
                        cur = left;
                    } else {
                        if right == NULL {
                            ctx.play(
                                ctx.freq(value as f64, size as f64),
                                note_duration,
                                Wave::Sine,
                            );
                            nodes.push((value, NULL, NULL));
                            nodes[cur].2 = nodes.len() - 1;
                            break;
                        }
                        cur = right;
                    }
                }
            }
        }

        let mut sorted = Vec::with_capacity(array.len());
        let mut frame = vec![0i64; array.len()];
        inorder(
            ctx,
            &nodes,
            root,
            &mut sorted,
            &mut frame,
            size,
            note_duration,
        );

        for i in 0..sorted.len() {
            if ctx.stopped() {
                return;
            }
            array[i] = sorted[i];
        }
        ctx.play_sorted(&array);
        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}
