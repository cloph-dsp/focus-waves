use crate::audio::Audio;
use crate::catalog::SORTING_ALGORITHMS;
use crate::engine::{Runner, VisualEvent};
use eframe::egui;
use egui::{Color32, RichText, Stroke};
use std::sync::{mpsc, Arc};

const SIZES: [usize; 9] = [16, 32, 64, 128, 256, 512, 1024, 2048, 4096];
const MAX_BARS: usize = 512;
const CHART_HEIGHT: f32 = 320.0;

const BG: Color32 = Color32::from_rgb(8, 12, 20);
const PANEL: Color32 = Color32::from_rgb(15, 21, 32);
const PANEL_RAISED: Color32 = Color32::from_rgb(18, 26, 39);
const CHART_BG: Color32 = Color32::from_rgb(7, 11, 18);
const BORDER: Color32 = Color32::from_rgb(30, 41, 59);
const ACCENT: Color32 = Color32::from_rgb(45, 212, 191);
const ACCENT_DIM: Color32 = Color32::from_rgb(20, 184, 166);
const TEXT: Color32 = Color32::from_rgb(226, 232, 240);
const MUTED: Color32 = Color32::from_rgb(148, 163, 184);
const FAINT: Color32 = Color32::from_rgb(100, 116, 139);
const BAR: Color32 = Color32::from_rgb(51, 65, 85);
const STOP: Color32 = Color32::from_rgb(59, 25, 32);
const STOP_TEXT: Color32 = Color32::from_rgb(251, 113, 133);
const ERROR: Color32 = Color32::from_rgb(248, 113, 113);

pub struct FocusWavesApp {
    audio: Option<Arc<Audio>>,
    runner: Option<Runner>,
    rx: mpsc::Receiver<VisualEvent>,
    values: Vec<i64>,
    highlights: Vec<usize>,
    selected: usize,
    search: String,
    category: Option<String>,
    size: usize,
    error: Option<String>,
}

impl FocusWavesApp {
    pub fn new() -> Self {
        let (tx, rx) = mpsc::channel();
        let mut error = None;
        let audio = match Audio::new() {
            Ok(audio) => Some(Arc::new(audio)),
            Err(err) => {
                error = Some(err);
                None
            }
        };
        let runner = audio
            .as_ref()
            .map(|audio| Runner::new(Arc::clone(audio), tx));

        Self {
            audio,
            runner,
            rx,
            values: seeded_values(64),
            highlights: Vec::new(),
            selected: 0,
            search: String::new(),
            category: None,
            size: 64,
            error,
        }
    }
}

impl eframe::App for FocusWavesApp {
    fn ui(&mut self, ui: &mut egui::Ui, _frame: &mut eframe::Frame) {
        let ctx = (*ui.ctx()).clone();
        apply_theme(&ctx);

        // eframe 0.37's `on_exit` signature changes with the `glow` feature, so stop
        // from the close-request frame instead (works with either backend).
        if ctx.input(|i| i.viewport().close_requested()) {
            if let Some(runner) = self.runner.as_mut() {
                runner.stop();
            }
        }

        // Keep only the newest of up to four frames per UI tick.
        let mut newest = None;
        for _ in 0..4 {
            match self.rx.try_recv() {
                Ok(event) => newest = Some(event),
                Err(_) => break,
            }
        }
        if let Some(event) = newest {
            self.values = event.values;
            self.highlights = event.highlights;
        }

        let playing = self
            .runner
            .as_ref()
            .is_some_and(|runner| runner.is_playing());
        if playing {
            ctx.request_repaint();
        }

        let FocusWavesApp {
            audio: _,
            runner,
            rx: _,
            values,
            highlights,
            selected,
            search,
            category,
            size,
            error,
        } = self;

        ui.painter().rect_filled(ui.max_rect(), 0.0, BG);
        egui::ScrollArea::vertical().show(ui, |ui| {
            ui.add_space(8.0);

            // Header
            ui.horizontal(|ui| {
                ui.label(RichText::new("Focus").size(26.0).color(TEXT));
                ui.label(RichText::new("Waves").size(26.0).strong().color(ACCENT));
                ui.add_space(8.0);
                ui.label(
                    RichText::new("Audio sonification · sorting algorithms made audible")
                        .size(12.0)
                        .color(FAINT),
                );
            });
            ui.add_space(8.0);
            let (rule, _) =
                ui.allocate_exact_size(egui::vec2(ui.available_width(), 2.0), egui::Sense::hover());
            ui.painter().rect_filled(rule, 0.0, BORDER);
            let accent_rule = egui::Rect::from_min_size(rule.min, egui::vec2(72.0, 2.0));
            ui.painter().rect_filled(accent_rule, 0.0, ACCENT_DIM);
            ui.add_space(18.0);

            if let Some(message) = error.as_deref() {
                panel(PANEL_RAISED, STOP).show(ui, |ui| {
                    ui.label(RichText::new("Audio unavailable").strong().color(STOP_TEXT));
                    ui.label(RichText::new(message).size(12.0).color(MUTED));
                    ui.label(
                        RichText::new("Playback is disabled, but the visualizer still works.")
                            .size(12.0)
                            .color(FAINT),
                    );
                });
                ui.add_space(14.0);
            }

            // Controls
            panel(PANEL, BORDER).show(ui, |ui| {
                section_label(ui, "ALGORITHM");
                ui.add_sized(
                    [ui.available_width(), 32.0],
                    egui::TextEdit::singleline(search)
                        .hint_text("Search algorithms by name…")
                        .font(egui::FontId::proportional(13.0)),
                );
                ui.add_space(12.0);

                let needle = search.to_lowercase();
                let filtered: Vec<usize> = SORTING_ALGORITHMS
                    .iter()
                    .enumerate()
                    .filter(|(_, alg)| {
                        category
                            .as_deref()
                            .is_none_or(|cat| cat == alg.category)
                            && alg.name.to_lowercase().contains(&needle)
                    })
                    .map(|(index, _)| index)
                    .collect();

                let total = ui.available_width();
                let alg_width = (total - 24.0 - 160.0 - 136.0).max(200.0);
                ui.horizontal(|ui| {
                    ui.spacing_mut().item_spacing.x = 12.0;

                    ui.vertical(|ui| {
                        section_label(ui, "FILTERED ALGORITHMS");
                        let name = SORTING_ALGORITHMS[*selected].name;
                        egui::ComboBox::from_id_salt("algorithm")
                            .selected_text(name)
                            .width(alg_width)
                            .show_ui(ui, |ui| {
                                if filtered.is_empty() {
                                    ui.label(RichText::new("No matches").color(FAINT));
                                }
                                for &index in &filtered {
                                    let alg = SORTING_ALGORITHMS[index];
                                    let label = format!("{}  ·  {}", alg.name, alg.category);
                                    if ui.selectable_value(selected, index, label).clicked()
                                        && playing
                                    {
                                        if let Some(runner) = runner.as_mut() {
                                            runner.stop();
                                        }
                                        *values = seeded_values(*size);
                                        highlights.clear();
                                    }
                                }
                            });
                    });

                    ui.vertical(|ui| {
                        section_label(ui, "CATEGORY");
                        let mut categories = vec!["All"];
                        for alg in SORTING_ALGORITHMS {
                            if !categories.contains(&alg.category) {
                                categories.push(alg.category);
                            }
                        }
                        let active = category.as_deref().unwrap_or("All").to_string();
                        egui::ComboBox::from_id_salt("category")
                            .selected_text(active)
                            .width(160.0)
                            .show_ui(ui, |ui| {
                                for cat in categories {
                                    let value = (cat != "All").then(|| cat.to_string());
                                    ui.selectable_value(category, value, cat);
                                }
                            });
                    });

                    ui.vertical(|ui| {
                        section_label(ui, "SAMPLE SIZE");
                        egui::ComboBox::from_id_salt("sample-size")
                            .selected_text(format!("{} elements", *size))
                            .width(136.0)
                            .show_ui(ui, |ui| {
                                for option in SIZES {
                                    if ui
                                        .selectable_value(
                                            size,
                                            option,
                                            format!("{} elements", option),
                                        )
                                        .clicked()
                                        && !playing
                                    {
                                        *values = seeded_values(*size);
                                        highlights.clear();
                                    }
                                }
                            });
                    });
                });

                ui.add_space(18.0);
                let label = if playing { "STOP" } else { "PLAY" };
                let button = if playing {
                    egui::Button::new(RichText::new(label).size(15.0).strong().color(STOP_TEXT))
                        .fill(STOP)
                        .stroke(Stroke::new(1.0, STOP_TEXT.gamma_multiply(0.5)))
                } else {
                    egui::Button::new(
                        RichText::new(label)
                            .size(15.0)
                            .strong()
                            .color(Color32::from_rgb(5, 18, 22)),
                    )
                    .fill(ACCENT)
                };
                let button = button.min_size(egui::vec2(200.0, 42.0)).corner_radius(10.0);
                let width = ui.available_width();
                ui.horizontal(|ui| {
                    ui.add_space((width - 200.0).max(0.0) * 0.5);
                    if ui.add_enabled(runner.is_some(), button).clicked() {
                        if playing {
                            if let Some(runner) = runner.as_mut() {
                                runner.stop();
                            }
                            *values = seeded_values(*size);
                            highlights.clear();
                        } else if let Some(runner) = runner.as_mut() {
                            let alg = SORTING_ALGORITHMS[*selected];
                            if !runner.start(alg.id, *size) {
                                *error = Some("That algorithm is not available.".to_string());
                            } else {
                                *values = seeded_values(*size);
                                highlights.clear();
                            }
                        }
                    }
                });
            });

            ui.add_space(16.0);

            // Algorithm detail
            let alg = SORTING_ALGORITHMS[*selected];
            panel(PANEL_RAISED, BORDER).show(ui, |ui| {
                ui.horizontal_wrapped(|ui| {
                    let (dot, _) =
                        ui.allocate_exact_size(egui::vec2(12.0, 12.0), egui::Sense::hover());
                    ui.painter().circle_filled(dot.center(), 5.0, accent_for(alg.color));
                    ui.add_space(4.0);
                    ui.label(RichText::new(alg.name).size(19.0).strong().color(TEXT));
                    ui.add_space(6.0);
                    chip(ui, alg.category, MUTED);
                    chip(ui, alg.complexity, ACCENT);
                });
                ui.add_space(8.0);
                ui.label(RichText::new(alg.description).size(13.0).color(MUTED));
            });

            ui.add_space(16.0);

            // Live visualizer
            panel(CHART_BG, BORDER).show(ui, |ui| {
                ui.horizontal(|ui| {
                    section_label(ui, "VISUALIZER");
                    ui.add_space(8.0);
                    let status = if playing { "STREAMING" } else { "READY" };
                    let color = if playing { ACCENT } else { FAINT };
                    ui.label(RichText::new(status).size(10.0).strong().color(color));
                });
                ui.add_space(10.0);
                draw_visualizer(ui, values, highlights, playing);
            });

            ui.add_space(14.0);
            ui.label(
                RichText::new("100 sorting algorithms · sonified in real time")
                    .size(11.0)
                    .color(FAINT),
            );
            ui.add_space(8.0);
        });
    }
}

fn apply_theme(ctx: &egui::Context) {
    let mut visuals = egui::Visuals::dark();
    visuals.window_fill = BG;
    visuals.panel_fill = BG;
    visuals.extreme_bg_color = CHART_BG;
    visuals.widgets.noninteractive.bg_fill = PANEL;
    visuals.widgets.inactive.bg_fill = PANEL_RAISED;
    visuals.widgets.hovered.bg_fill = Color32::from_rgb(30, 41, 59);
    visuals.widgets.active.bg_fill = Color32::from_rgb(38, 51, 70);
    visuals.selection.bg_fill = ACCENT_DIM;
    visuals.selection.stroke.color = ACCENT;
    ctx.set_visuals(visuals);
}

fn panel(fill: Color32, stroke: Color32) -> egui::Frame {
    egui::Frame::NONE
        .fill(fill)
        .stroke(Stroke::new(1.0, stroke))
        .corner_radius(12.0)
        .inner_margin(egui::Margin::symmetric(18, 16))
}

fn section_label(ui: &mut egui::Ui, text: &str) {
    ui.label(RichText::new(text).size(10.0).strong().color(FAINT));
}

fn chip(ui: &mut egui::Ui, text: &str, color: Color32) {
    egui::Frame::NONE
        .fill(PANEL)
        .stroke(Stroke::new(1.0, BORDER))
        .corner_radius(6.0)
        .inner_margin(egui::Margin::symmetric(8, 4))
        .show(ui, |ui| {
            ui.label(RichText::new(text).size(11.0).color(color));
        });
}

/// Seed a calm, deterministic "shuffled" ramp so the chart is never empty.
fn seeded_values(n: usize) -> Vec<i64> {
    let mut values: Vec<i64> = (1..=n as i64).collect();
    let mut state: u64 = 0x9E37_79B9_7F4A_7C15;
    for i in (1..values.len()).rev() {
        state ^= state << 13;
        state ^= state >> 7;
        state ^= state << 17;
        let j = (state as usize) % (i + 1);
        values.swap(i, j);
    }
    values
}

/// The catalog stores Tailwind gradient classes (`from-purple-500 to-pink-500`).
/// Use the first gradient stop for the accent dot; unknown names fall back to cyan.
fn accent_for(color: &str) -> Color32 {
    let token = color.split_whitespace().next().unwrap_or("");
    let name = token.strip_prefix("from-").unwrap_or(token);
    let rgb = match name {
        "slate" => (100, 116, 139),
        "gray" => (107, 114, 128),
        "stone" => (120, 113, 108),
        "red" => (239, 68, 68),
        "rose" => (244, 63, 94),
        "pink" => (236, 72, 153),
        "purple" => (168, 85, 247),
        "violet" => (139, 92, 246),
        "fuchsia" => (217, 70, 239),
        "indigo" => (99, 102, 241),
        "blue" => (59, 130, 246),
        "sky" => (14, 165, 233),
        "cyan" => (6, 182, 212),
        "teal" => (20, 184, 166),
        "emerald" => (16, 185, 129),
        "green" => (34, 197, 94),
        "lime" => (132, 204, 22),
        "amber" => (245, 158, 11),
        "orange" => (249, 115, 22),
        "yellow" => (234, 179, 8),
        _ => return Color32::from_rgb(6, 182, 212),
    };
    Color32::from_rgb(rgb.0, rgb.1, rgb.2)
}

/// Bucket to at most `MAX_BARS`, keeping each bucket's maximum value.
fn display_snapshot(values: &[i64], highlights: &[usize]) -> (Vec<i64>, Vec<usize>) {
    if values.is_empty() {
        return (Vec::new(), Vec::new());
    }
    if values.len() <= MAX_BARS {
        let mut bars = highlights.to_vec();
        bars.retain(|&index| index < values.len());
        bars.sort_unstable();
        bars.dedup();
        return (values.to_vec(), bars);
    }

    let step = values.len() as f32 / MAX_BARS as f32;
    let mut bars = Vec::with_capacity(MAX_BARS);
    for i in 0..MAX_BARS {
        let start = (i as f32 * step) as usize;
        let end = (((i + 1) as f32 * step) as usize)
            .min(values.len())
            .max(start + 1);
        let mut peak = values[start];
        for &value in &values[start + 1..end] {
            if value > peak {
                peak = value;
            }
        }
        bars.push(peak);
    }
    let mut lit: Vec<usize> = highlights
        .iter()
        .map(|&index| ((index as f32 / step) as usize).min(MAX_BARS - 1))
        .collect();
    lit.sort_unstable();
    lit.dedup();
    (bars, lit)
}

fn draw_visualizer(ui: &mut egui::Ui, values: &[i64], highlights: &[usize], playing: bool) {
    let (area, _) = ui.allocate_exact_size(
        egui::vec2(ui.available_width(), CHART_HEIGHT),
        egui::Sense::hover(),
    );
    let painter = ui.painter_at(area);
    painter.rect_filled(area, 10.0, CHART_BG);

    let chart = egui::Rect::from_min_max(
        area.min + egui::vec2(14.0, 14.0),
        area.max - egui::vec2(14.0, 30.0),
    );
    let baseline = chart.max.y;

    // Quiet horizontal guides, then the baseline.
    for fraction in [0.25_f32, 0.5, 0.75] {
        let y = baseline - chart.height() * fraction;
        painter.line_segment(
            [egui::pos2(chart.min.x, y), egui::pos2(chart.max.x, y)],
            Stroke::new(1.0, BORDER),
        );
    }
    painter.line_segment(
        [egui::pos2(chart.min.x, baseline), egui::pos2(chart.max.x, baseline)],
        Stroke::new(1.0, Color32::from_rgb(51, 65, 85)),
    );

    let (bars, lit) = display_snapshot(values, highlights);
    if bars.is_empty() {
        painter.text(
            chart.center(),
            egui::Align2::CENTER_CENTER,
            "Select an algorithm to begin",
            egui::FontId::proportional(13.0),
            FAINT,
        );
        return;
    }

    let max_value = bars.iter().copied().max().unwrap_or(1).max(1) as f32;
    let lit_set: std::collections::HashSet<usize> = lit.into_iter().collect();
    let slot = chart.width() / bars.len() as f32;
    let gap = if bars.len() > 256 { 0.5 } else { 2.0 };
    let bar_width = (slot - gap).max(0.5);

    for (index, &value) in bars.iter().enumerate() {
        let height = (value as f32 / max_value * chart.height()).max(1.0);
        let rect = egui::Rect::from_min_max(
            egui::pos2(chart.min.x + index as f32 * slot, baseline - height),
            egui::pos2(chart.min.x + index as f32 * slot + bar_width, baseline),
        );
        if lit_set.contains(&index) {
            painter.rect_filled(
                egui::Rect::from_min_max(
                    rect.min - egui::vec2(2.0, 2.0),
                    rect.max + egui::vec2(2.0, 2.0),
                ),
                3.0,
                Color32::from_rgba_unmultiplied(45, 212, 191, 28),
            );
            painter.rect_filled(rect, 2.0, ACCENT);
        } else {
            painter.rect_filled(rect, 2.0, BAR);
        }
    }

    let caption = format!(
        "{} bars  ·  {}",
        bars.len(),
        if playing { "streaming" } else { "ready" }
    );
    painter.text(
        egui::pos2(chart.min.x, area.max.y - 14.0),
        egui::Align2::LEFT_CENTER,
        caption,
        egui::FontId::monospace(10.0),
        FAINT,
    );
    painter.text(
        egui::pos2(chart.max.x, area.max.y - 14.0),
        egui::Align2::RIGHT_CENTER,
        format!("max {}", max_value as i64),
        egui::FontId::monospace(10.0),
        FAINT,
    );
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn snapshot_buckets_and_maps_highlights() {
        let values: Vec<i64> = (1..=1024).collect();
        let (bars, lit) = display_snapshot(&values, &[0, 1023]);
        assert_eq!(bars.len(), MAX_BARS);
        assert_eq!(bars[0], 2);
        assert_eq!(*bars.last().unwrap(), 1024);
        assert_eq!(lit, vec![0, 511]);
    }

    #[test]
    fn accent_uses_first_gradient_stop_and_falls_back() {
        assert_eq!(
            accent_for("from-cyan-500 to-blue-500"),
            Color32::from_rgb(6, 182, 212)
        );
        assert_eq!(
            accent_for("mystery"),
            Color32::from_rgb(6, 182, 212)
        );
    }
}
