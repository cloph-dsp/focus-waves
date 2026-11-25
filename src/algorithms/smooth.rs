use crate::audio::Wave;
use crate::engine::SortCtx;

// Dijkstra's Smooth Sort. The prefix of the array is kept as a sequence of
// Leonardo heaps (sizes L(k) = L(k-1)+L(k-2)+1), whose roots are ordered by the
// "stepson" links. `sift` restores order inside one heap; `trinkle` restores it
// along the stepson chain. The heaps are grown, then the maximum is detached and
// the heap shrinks. Heapify rotations are Sine tones, extracts are Triangle.

#[inline]
fn leo_up(b: &mut usize, c: &mut usize) {
    let (old_b, old_c) = (*b, *c);
    *b = old_b.wrapping_add(old_c).wrapping_add(1);
    *c = old_b;
}

#[inline]
fn leo_down(b: &mut usize, c: &mut usize) {
    let (old_b, old_c) = (*b, *c);
    *b = old_c;
    *c = old_b.wrapping_sub(old_c).wrapping_sub(1);
}

#[inline]
fn emit(
    ctx: &mut SortCtx,
    arr: &[i64],
    size: usize,
    idx: usize,
    note_duration: f32,
    delay: u64,
    wave: Wave,
) {
    ctx.play(ctx.freq(arr[idx] as f64, size as f64), note_duration, wave);
    ctx.visual(arr, &[idx]);
    ctx.delay(delay);
}

struct Smooth {
    q: usize, // next position to incorporate into the heap prefix
    r: usize, // index of the rightmost heap root
    p: usize, // bit pattern of the standard concatenation
    b: usize, // Leonardo number of the rightmost heap
    c: usize, // companion Leonardo number
    r1: usize,
    b1: usize,
    c1: usize,
}

impl Smooth {
    fn sift(
        &mut self,
        ctx: &mut SortCtx,
        arr: &mut [i64],
        size: usize,
        note_duration: f32,
        delay: u64,
        wave: Wave,
    ) {
        let r0 = self.r1;
        let tmp = arr[r0];
        while self.b1 > 2 {
            if ctx.stopped() {
                return;
            }
            let mut r2 = self.r1.wrapping_sub(self.b1).wrapping_add(self.c1);
            if arr[self.r1.wrapping_sub(1)] >= arr[r2] {
                r2 = self.r1.wrapping_sub(1);
                leo_down(&mut self.b1, &mut self.c1);
            }
            if arr[r2] < tmp {
                self.b1 = 1;
            } else {
                arr[self.r1] = arr[r2];
                emit(ctx, arr, size, self.r1, note_duration, delay, wave);
                self.r1 = r2;
                leo_down(&mut self.b1, &mut self.c1);
            }
        }
        if self.r1 != r0 {
            arr[self.r1] = tmp;
            emit(ctx, arr, size, self.r1, note_duration, delay, wave);
        }
    }

    fn trinkle(
        &mut self,
        ctx: &mut SortCtx,
        arr: &mut [i64],
        size: usize,
        note_duration: f32,
        delay: u64,
        wave: Wave,
    ) {
        let mut p1 = self.p;
        self.b1 = self.b;
        self.c1 = self.c;
        let r0 = self.r1;
        let tmp = arr[r0];
        while p1 > 0 {
            if ctx.stopped() {
                return;
            }
            while (p1 & 1) == 0 {
                p1 >>= 1;
                leo_up(&mut self.b1, &mut self.c1);
            }
            let r3 = self.r1.wrapping_sub(self.b1);
            if p1 == 1 || arr[r3] < tmp {
                p1 = 0;
            } else {
                p1 -= 1;
                if self.b1 == 1 {
                    arr[self.r1] = arr[r3];
                    emit(ctx, arr, size, self.r1, note_duration, delay, wave);
                    self.r1 = r3;
                } else if self.b1 >= 3 {
                    let mut r2 = self.r1.wrapping_sub(self.b1).wrapping_add(self.c1);
                    if arr[self.r1.wrapping_sub(1)] >= arr[r2] {
                        r2 = self.r1.wrapping_sub(1);
                        leo_down(&mut self.b1, &mut self.c1);
                        p1 <<= 1;
                    }
                    if arr[r2] < arr[r3] {
                        arr[self.r1] = arr[r3];
                        emit(ctx, arr, size, self.r1, note_duration, delay, wave);
                        self.r1 = r3;
                    } else {
                        arr[self.r1] = arr[r2];
                        emit(ctx, arr, size, self.r1, note_duration, delay, wave);
                        self.r1 = r2;
                        leo_down(&mut self.b1, &mut self.c1);
                        p1 = 0;
                    }
                }
            }
        }
        if self.r1 != r0 {
            arr[self.r1] = tmp;
            emit(ctx, arr, size, self.r1, note_duration, delay, wave);
        }
        self.sift(ctx, arr, size, note_duration, delay, wave);
    }

    fn semitrinkle(
        &mut self,
        ctx: &mut SortCtx,
        arr: &mut [i64],
        size: usize,
        note_duration: f32,
        delay: u64,
        wave: Wave,
    ) {
        self.r1 = self.r.wrapping_sub(self.c);
        if arr[self.r1] >= arr[self.r] {
            arr.swap(self.r, self.r1);
            emit(ctx, arr, size, self.r, note_duration, delay, wave);
            self.trinkle(ctx, arr, size, note_duration, delay, wave);
        }
    }
}

// Ported from TypeScript: src/utils/audio/algorithms/smooth.ts
#[allow(non_snake_case)]
pub fn generateSmoothSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let note_duration = ctx.adaptive_duration(0.0075, size);
        let audio_delay = ctx.adaptive_delay(200.0, size);
        let n = array.len();

        if n > 0 {
            let mut s = Smooth {
                q: 1,
                r: 0,
                p: 1,
                b: 1,
                c: 1,
                r1: 0,
                b1: 1,
                c1: 1,
            };

            // Grow the Leonardo-heap prefix; rotations sound as Sine tones.
            while s.q < n {
                if ctx.stopped() {
                    return;
                }
                s.r1 = s.r;
                if (s.p & 7) == 3 {
                    s.b1 = s.b;
                    s.c1 = s.c;
                    s.sift(ctx, &mut array, size, note_duration, audio_delay, Wave::Sine);
                    s.p = (s.p + 1) >> 2;
                    let tmp = s.b.wrapping_add(s.c).wrapping_add(1);
                    s.b = s.b.wrapping_add(tmp).wrapping_add(1);
                    s.c = tmp;
                } else if (s.p & 3) == 1 {
                    if s.q + s.c < n {
                        s.b1 = s.b;
                        s.c1 = s.c;
                        s.sift(ctx, &mut array, size, note_duration, audio_delay, Wave::Sine);
                    } else {
                        s.trinkle(ctx, &mut array, size, note_duration, audio_delay, Wave::Sine);
                    }
                    loop {
                        leo_down(&mut s.b, &mut s.c);
                        s.p <<= 1;
                        if s.b <= 1 {
                            break;
                        }
                    }
                    s.p += 1;
                }
                s.r += 1;
                s.q += 1;
            }

            s.r1 = s.r;
            s.trinkle(ctx, &mut array, size, note_duration, audio_delay, Wave::Sine);

            // Detach the maximum and shrink the heap; extracts sound as Triangle.
            loop {
                if s.q <= 1 {
                    break;
                }
                if ctx.stopped() {
                    return;
                }
                s.q -= 1;
                if s.b == 1 {
                    s.r = s.r.wrapping_sub(1);
                    s.p = s.p.wrapping_sub(1);
                    while (s.p & 1) == 0 {
                        s.p >>= 1;
                        leo_up(&mut s.b, &mut s.c);
                    }
                } else if s.b > 2 {
                    s.p = s.p.wrapping_sub(1);
                    s.r = s.r.wrapping_sub(s.b).wrapping_add(s.c);
                    if s.p > 0 {
                        s.semitrinkle(
                            ctx, &mut array, size, note_duration, audio_delay, Wave::Triangle,
                        );
                    }
                    leo_down(&mut s.b, &mut s.c);
                    s.p = (s.p << 1) + 1;
                    s.r = s.r.wrapping_add(s.c);
                    s.semitrinkle(
                        ctx, &mut array, size, note_duration, audio_delay, Wave::Triangle,
                    );
                    leo_down(&mut s.b, &mut s.c);
                    s.p = (s.p << 1) + 1;
                }
            }
        }

        ctx.play_sorted(&array);
        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}
