use crate::audio::Wave;
use crate::engine::SortCtx;

struct Node {
    value: i64,
    left: Option<usize>,
    right: Option<usize>,
}

fn insert(nodes: &mut Vec<Node>, root: Option<usize>, value: i64) -> usize {
    let root_id = match root {
        Some(id) => id,
        None => {
            let id = nodes.len();
            nodes.push(Node { value, left: None, right: None });
            return id;
        }
    };
    let mut current = root_id;
    loop {
        let go_left = value < nodes[current].value;
        let next = if go_left { nodes[current].left } else { nodes[current].right };
        match next {
            Some(id) => current = id,
            None => {
                let id = nodes.len();
                nodes.push(Node { value, left: None, right: None });
                if go_left {
                    nodes[current].left = Some(id);
                } else {
                    nodes[current].right = Some(id);
                }
                return root_id;
            }
        }
    }
}

fn inorder(
    ctx: &mut SortCtx,
    nodes: &[Node],
    root: Option<usize>,
    result: &mut Vec<i64>,
    size: usize,
    note_duration: f32,
) {
    let id = match root {
        Some(id) if !ctx.stopped() => id,
        _ => return,
    };
    inorder(ctx, nodes, nodes[id].left, result, size, note_duration);
    if ctx.stopped() {
        return;
    }
    result.push(nodes[id].value);
    ctx.play(ctx.freq(nodes[id].value as f64, size as f64), note_duration, Wave::Sine);
    ctx.visual(result, &[result.len() - 1]);
    ctx.delay(ctx.adaptive_delay(200.0, size));
    inorder(ctx, nodes, nodes[id].right, result, size, note_duration);
}

// Ported from TypeScript: src/utils/audio/algorithms/splaysort.ts
#[allow(non_snake_case)]
pub fn generateSplaysort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let note_duration = ctx.adaptive_duration(0.0075, size);

        let mut nodes: Vec<Node> = Vec::with_capacity(array.len());
        let mut root: Option<usize> = None;
        for i in 0..array.len() {
            if ctx.stopped() {
                return;
            }
            root = Some(insert(&mut nodes, root, array[i]));
            ctx.play(ctx.freq(array[i] as f64, size as f64), note_duration / 2.0, Wave::Sine);
            ctx.visual(&array, &[i]);
            ctx.delay(ctx.adaptive_delay(40.0, size));
        }

        let mut result: Vec<i64> = Vec::with_capacity(array.len());
        inorder(ctx, &nodes, root, &mut result, size, note_duration);
        array[..result.len()].copy_from_slice(&result[..]);

        ctx.play_sorted(&array);
        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}
