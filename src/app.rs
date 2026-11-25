use crate::audio::Audio;
use crate::catalog::SORTING_ALGORITHMS;
use crate::engine::{Runner, VisualEvent};
use eframe::egui;
use egui::{
    vec2, Align, Align2, Color32, FontId, Layout, Rect, RichText, Sense, Stroke, StrokeKind,
    TextEdit, Ui, UiBuilder,
};
use rand::RngExt;
use std::sync::{mpsc, Arc};
use std::time::{Duration, Instant};

const SIZES: [usize; 9] = [16, 32, 64, 128, 256, 512, 1024, 2048, 4096];
const MAX_BARS: usize = 512;

// REAPER-ish palette: neutral charcoal surfaces, hairline borders, one teal
// accent and one warm status colour. No decorative fills beyond these.
const BG: Color32 = Color32::from_rgb(24, 27, 31);
const PANEL: Color32 = Color32::from_rgb(31, 35, 40);
const PANEL_RAISED: Color32 = Color32::from_rgb(38, 43, 49);
const CHART_BG: Color32 = Color32::from_rgb(18, 21, 25);
const BORDER: Color32 = Color32::from_rgb(54, 61, 69);
const GRID: Color32 = Color32::from_rgb(34, 40, 47);
const GRID_STRONG: Color32 = Color32::from_rgb(64, 74, 84);
const ACCENT: Color32 = Color32::from_rgb(76, 194, 197);
const ACCENT_DIM: Color32 = Color32::from_rgb(38, 105, 108);
const ACCENT_LIGHT: Color32 = Color32::from_rgb(150, 232, 232);
const TEXT: Color32 = Color32::from_rgb(219, 226, 233);
const MUTED: Color32 = Color32::from_rgb(151, 162, 173);
const FAINT: Color32 = Color32::from_rgb(103, 114, 126);
const BAR: Color32 = Color32::from_rgb(58, 67, 77);
const WARN: Color32 = Color32::from_rgb(224, 164, 88);
const ERROR: Color32 = Color32::from_rgb(226, 106, 106);

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
    shuffle: bool,
    ambient: bool,
    next_at: Option<Instant>,
}

impl FocusWavesApp {
    pub fn new() -> Self {
        let (tx, rx) = mpsc::channel();
        let mut error = None;
        let ambient = true;
        let audio = match Audio::new() {
            Ok(audio) => {
                audio.set_ambient(ambient);
                Some(Arc::new(audio))
            }
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
            shuffle: false,
            ambient,
            next_at: None,
        }
    }

    /// Advance the shuffle player: once the current one-pass run finishes, wait
    /// briefly so the final sorted sweep is audible, then start another one.
    fn tick_shuffle(&mut self) {
        if !self.shuffle {
            return;
        }
        let Some(runner) = self.runner.as_mut() else {
            return;
        };
        if runner.is_playing() {
            return;
        }
        match self.next_at {
            None => {
                self.next_at = Some(Instant::now() + Duration::from_millis(600));
            }
            Some(deadline) if Instant::now() >= deadline => {
                let index = random_algorithm_index(self.selected);
                self.selected = index;
                let alg = SORTING_ALGORITHMS[index];
                if runner.start_once(alg.id, self.size) {
                    self.values = seeded_values(self.size);
                    self.highlights.clear();
                }
                self.next_at = None;
            }
            _ => {}
        }
    }

    fn stop_playback(&mut self) {
        self.shuffle = false;
        self.next_at = None;
        if let Some(runner) = self.runner.as_mut() {
            runner.stop();
        }
        self.values = seeded_values(self.size);
        self.highlights.clear();
    }

    fn toggle_playback(&mut self) {
        let playing = self.runner.as_mut().is_some_and(|runner| runner.is_playing());
        if playing {
            self.stop_playback();
        } else {
            self.shuffle = false;
            self.next_at = None;
            if let Some(runner) = self.runner.as_mut() {
                let alg = SORTING_ALGORITHMS[self.selected];
                if !runner.start(alg.id, self.size) {
                    self.error = Some("That algorithm is not available.".to_string());
                } else {
                    self.values = seeded_values(self.size);
                    self.highlights.clear();
                }
            }
        }
    }

    fn start_shuffle(&mut self) {
        self.shuffle = true;
        self.next_at = None;
        if let Some(runner) = self.runner.as_mut() {
            let index = random_algorithm_index(self.selected);
            self.selected = index;
            let alg = SORTING_ALGORITHMS[index];
            if !runner.start_once(alg.id, self.size) {
                self.error = Some("That algorithm is not available.".to_string());
                self.shuffle = false;
            } else {
                self.values = seeded_values(self.size);
                self.highlights.clear();
            }
        }
    }
}

impl eframe::App for FocusWavesApp {
    fn ui(&mut self, ui: &mut egui::Ui, _frame: &mut eframe::Frame) {
        let ctx = (*ui.ctx()).clone();
        apply_theme(&ctx);

        // eframe 0.37's `on_exit` signature changes with the `glow` feature, so stop
        // from the close-request frame instead (works with either backend).
        if ctx.input(|i| i.viewport().close_requested())
            && let Some(runner) = self.runner.as_mut()
        {
            runner.stop();
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

        self.tick_shuffle();

        let playing = self
            .runner
            .as_mut()
            .is_some_and(|runner| runner.is_playing());
        let loop_active = playing && !self.shuffle;
        // Keep repainting through the short shuffle pause so its timer elapses.
        if playing || self.shuffle {
            ctx.request_repaint();
        }

        // Shortcuts. While the search box owns focus every key belongs to it.
        // Consuming our keys here also stops a focused button from re-firing Space.
        let search_id = egui::Id::NULL.with("focus-waves-search");
        let search_focused = ctx.memory(|m| m.focused()) == Some(search_id);
        let (toggle_key, shuffle_key, focus_key, nav_key) = if search_focused {
            (false, false, false, 0)
        } else {
            ctx.input_mut(|i| {
                let toggle = i.consume_key(egui::Modifiers::NONE, egui::Key::Space);
                let shuffle = i.consume_key(egui::Modifiers::NONE, egui::Key::S);
                let focus = i.consume_key(egui::Modifiers::NONE, egui::Key::Slash);
                let nav = if i.consume_key(egui::Modifiers::NONE, egui::Key::ArrowDown) {
                    1
                } else if i.consume_key(egui::Modifiers::NONE, egui::Key::ArrowUp) {
                    -1
                } else {
                    0
                };
                (toggle, shuffle, focus, nav)
            })
        };
        if toggle_key {
            self.toggle_playback();
        }
        if shuffle_key {
            if self.shuffle {
                self.stop_playback();
            } else {
                self.start_shuffle();
            }
        }
        if focus_key {
            ctx.memory_mut(|m| m.request_focus(search_id));
        }

        let filtered = filtered_indices(&self.search, self.category.as_deref());
        if nav_key != 0 && !filtered.is_empty() {
            let pos = filtered
                .iter()
                .position(|&index| index == self.selected)
                .unwrap_or(0);
            let next = (pos as isize + nav_key).rem_euclid(filtered.len() as isize) as usize;
            self.selected = filtered[next];
        }

        let (bars, lit) = display_snapshot(&self.values, &self.highlights);
        let bar_count = bars.len();
        let peak = bars.iter().copied().max().unwrap_or(0);
        let audio_online = self.audio.is_some();

        ui.painter().rect_filled(ui.max_rect(), 0.0, BG);

        let pad = 12.0;
        let gap = 8.0;
        let full_width = (ui.available_width() - pad * 2.0).max(260.0);
        let x0 = ui.cursor().min.x + pad;
        let mut y = ui.cursor().min.y + pad;

        // ---- transport strip -------------------------------------------------
        let transport_h = 54.0;
        let transport_rect = Rect::from_min_size(egui::pos2(x0, y), vec2(full_width, transport_h));
        let mut transport_ui = child_ui(ui, transport_rect, "transport");
        panel_frame().show(&mut transport_ui, |ui| {
            draw_transport(ui, self, loop_active, full_width);
        });
        y += transport_h + gap;

        // ---- main work area --------------------------------------------------
        let footer_h = 26.0;
        let bottom = ui.max_rect().max.y - pad - footer_h - gap;
        let main_h = (bottom - y).max(260.0);

        if full_width >= 900.0 {
            let browser_w = 250.0;
            let inspector_w = 270.0;
            let center_w = full_width - browser_w - inspector_w - gap * 2.0;

            let browser_rect =
                Rect::from_min_size(egui::pos2(x0, y), vec2(browser_w, main_h));
            let center_rect = Rect::from_min_size(
                egui::pos2(x0 + browser_w + gap, y),
                vec2(center_w, main_h),
            );
            let inspector_rect = Rect::from_min_size(
                egui::pos2(x0 + browser_w + gap + center_w + gap, y),
                vec2(inspector_w, main_h),
            );

            let mut browser_ui = child_ui(ui, browser_rect, "browser");
            panel_frame().show(&mut browser_ui, |ui| {
                draw_browser(ui, self, &filtered, playing, search_id);
            });
            let mut center_ui = child_ui(ui, center_rect, "center");
            panel_frame().show(&mut center_ui, |ui| {
                draw_center(ui, &bars, &lit, peak, playing, self.shuffle, self.size);
            });
            let mut inspector_ui = child_ui(ui, inspector_rect, "inspector");
            panel_frame().show(&mut inspector_ui, |ui| {
                draw_inspector(ui, self, playing);
            });
        } else {
            // Narrow layout: browser and canvas share the top row, inspector
            // drops underneath at full width. Every width is derived from the
            // available space, so nothing is pushed off screen.
            let browser_w = (full_width * 0.40).clamp(150.0, 230.0);
            let center_w = full_width - browser_w - gap;
            let top_h = (main_h * 0.64).max(220.0);
            let bottom_h = main_h - top_h - gap;

            let browser_rect = Rect::from_min_size(egui::pos2(x0, y), vec2(browser_w, top_h));
            let center_rect =
                Rect::from_min_size(egui::pos2(x0 + browser_w + gap, y), vec2(center_w, top_h));
            let mut browser_ui = child_ui(ui, browser_rect, "browser");
            panel_frame().show(&mut browser_ui, |ui| {
                draw_browser(ui, self, &filtered, playing, search_id);
            });
            let mut center_ui = child_ui(ui, center_rect, "center");
            panel_frame().show(&mut center_ui, |ui| {
                draw_center(ui, &bars, &lit, peak, playing, self.shuffle, self.size);
            });

            if bottom_h > 100.0 {
                let inspector_rect =
                    Rect::from_min_size(egui::pos2(x0, y + top_h + gap), vec2(full_width, bottom_h));
                let mut inspector_ui = child_ui(ui, inspector_rect, "inspector");
                panel_frame().show(&mut inspector_ui, |ui| {
                    draw_inspector(ui, self, playing);
                });
            }
        }
        y += main_h + gap;

        // ---- status footer ---------------------------------------------------
        let footer_rect = Rect::from_min_size(egui::pos2(x0, y), vec2(full_width, footer_h));
        let mut footer_ui = child_ui(ui, footer_rect, "footer");
        panel_frame().show(&mut footer_ui, |ui| {
            draw_footer(
                ui,
                SORTING_ALGORITHMS.len(),
                self.size,
                bar_count,
                audio_online,
                self.error.as_deref(),
                self.shuffle,
                playing,
                full_width,
            );
        });
    }
}

// ---------------------------------------------------------------------------
// Layout helpers
// ---------------------------------------------------------------------------

fn apply_theme(ctx: &egui::Context) {
    let mut visuals = egui::Visuals::dark();
    visuals.window_fill = BG;
    visuals.panel_fill = BG;
    visuals.extreme_bg_color = CHART_BG;
    visuals.widgets.noninteractive.bg_fill = PANEL;
    visuals.widgets.inactive.bg_fill = PANEL_RAISED;
    visuals.widgets.hovered.bg_fill = Color32::from_rgb(46, 53, 61);
    visuals.widgets.active.bg_fill = ACCENT_DIM;
    visuals.selection.bg_fill = ACCENT_DIM;
    visuals.selection.stroke.color = ACCENT;
    ctx.set_visuals(visuals);
    ctx.all_styles_mut(|style| {
        style.spacing.item_spacing = vec2(6.0, 4.0);
        style.spacing.button_padding = vec2(8.0, 3.0);
    });
}

fn child_ui(parent: &mut Ui, rect: Rect, salt: &'static str) -> Ui {
    parent.new_child(
        UiBuilder::new()
            .max_rect(rect)
            .layout(Layout::top_down(Align::Min))
            .id_salt(salt),
    )
}

fn panel_frame() -> egui::Frame {
    egui::Frame::NONE
        .fill(PANEL)
        .stroke(Stroke::new(1.0, BORDER))
        .corner_radius(0.0)
        .inner_margin(egui::Margin::symmetric(10, 8))
}

fn panel_header(ui: &mut Ui, title: &str, right: &str) {
    let x = ui.cursor().min.x;
    let y = ui.cursor().min.y;
    let w = ui.available_width();
    let p = ui.painter();
    p.text(
        egui::pos2(x, y + 6.0),
        Align2::LEFT_CENTER,
        title,
        FontId::proportional(10.0),
        FAINT,
    );
    p.text(
        egui::pos2(x + w, y + 6.0),
        Align2::RIGHT_CENTER,
        right,
        FontId::monospace(10.0),
        MUTED,
    );
    p.rect_filled(
        Rect::from_min_size(egui::pos2(x, y + 13.0), vec2(w, 1.0)),
        0.0,
        BORDER,
    );
    ui.add_space(18.0);
}

fn rule(ui: &mut Ui) {
    let x = ui.cursor().min.x;
    let y = ui.cursor().min.y;
    ui.add_space(1.0);
    ui.painter().rect_filled(
        Rect::from_min_size(egui::pos2(x, y), vec2(ui.available_width(), 1.0)),
        0.0,
        BORDER,
    );
}

fn vrule(ui: &mut Ui, height: f32) {
    let (rect, _) = ui.allocate_exact_size(vec2(1.0, height), Sense::hover());
    ui.painter().rect_filled(rect, 0.0, BORDER);
}

fn square_button(label: &str, active: bool, enabled: bool, width: f32) -> egui::Button<'_> {
    let fill = if !enabled {
        PANEL
    } else if active {
        ACCENT_DIM
    } else {
        PANEL_RAISED
    };
    let color = if !enabled {
        FAINT
    } else if active {
        ACCENT
    } else {
        TEXT
    };
    let stroke = if active {
        ACCENT
    } else {
        BORDER
    };
    egui::Button::new(RichText::new(label).size(11.0).strong().color(color))
        .fill(fill)
        .stroke(Stroke::new(1.0, stroke))
        .min_size(vec2(width, 24.0))
        .corner_radius(2.0)
}

// ---------------------------------------------------------------------------
// Transport
// ---------------------------------------------------------------------------

fn draw_transport(ui: &mut Ui, app: &mut FocusWavesApp, loop_active: bool, width: f32) {
    ui.spacing_mut().item_spacing = vec2(8.0, 0.0);
    ui.horizontal(|ui| {
        ui.vertical(|ui| {
            ui.spacing_mut().item_spacing.y = 0.0;
            ui.horizontal(|ui| {
                ui.spacing_mut().item_spacing = vec2(0.0, 0.0);
                ui.label(RichText::new("FOCUS").size(13.0).strong().color(TEXT));
                ui.label(RichText::new("WAVES").size(13.0).strong().color(ACCENT));
            });
            ui.label(RichText::new("SORTING SONIFICATION").size(9.0).color(FAINT));
        });
        vrule(ui, 28.0);

        let play = square_button("PLAY", loop_active, app.runner.is_some(), 74.0);
        let shuffle = square_button("SHUFFLE", app.shuffle, app.runner.is_some(), 82.0);
        let playing = app.runner.as_mut().is_some_and(|runner| runner.is_playing());
        let running = playing || app.shuffle;
        let stop = if running {
            egui::Button::new(RichText::new("STOP").size(11.0).strong().color(WARN))
                .fill(PANEL_RAISED)
                .stroke(Stroke::new(1.0, WARN.gamma_multiply(0.6)))
                .min_size(vec2(62.0, 24.0))
                .corner_radius(2.0)
        } else {
            square_button("STOP", false, false, 62.0)
        };

        if ui.add_enabled(app.runner.is_some(), play).clicked() {
            app.toggle_playback();
        }
        if ui.add_enabled(app.runner.is_some(), shuffle).clicked() {
            if app.shuffle {
                app.stop_playback();
            } else {
                app.start_shuffle();
            }
        }
        if ui.add_enabled(running, stop).clicked() {
            app.stop_playback();
        }

        ui.add_space(6.0);
        let ambient = square_button("AMBIENT", app.ambient, app.runner.is_some(), 72.0);
        if ui.add_enabled(app.runner.is_some(), ambient).clicked() {
            app.ambient = !app.ambient;
            if let Some(a) = app.audio.as_ref() {
                a.set_ambient(app.ambient);
            }
        }

        vrule(ui, 28.0);

        // Readout uses post-click state so the current frame is already accurate.
        let playing_now = app.runner.as_mut().is_some_and(|runner| runner.is_playing());
        let shuffle_now = app.shuffle;
        let alg = SORTING_ALGORITHMS[app.selected];
        let (state, state_color) = if shuffle_now {
            ("SHUFFLE", WARN)
        } else if playing_now {
            ("PLAYING", ACCENT)
        } else {
            ("IDLE", FAINT)
        };
        ui.label(RichText::new("ALG").size(9.0).strong().color(FAINT));
        ui.label(RichText::new(alg.name).size(12.0).strong().color(TEXT));
        if width >= 760.0 {
            ui.add_space(8.0);
            ui.label(RichText::new("N").size(9.0).strong().color(FAINT));
            ui.label(
                RichText::new(app.size.to_string())
                    .size(12.0)
                    .color(TEXT)
                    .font(FontId::monospace(12.0)),
            );
            ui.add_space(8.0);
        }
        ui.add_space(8.0);
        ui.label(RichText::new("STATE").size(9.0).strong().color(FAINT));
        ui.label(RichText::new(state).size(10.0).strong().color(state_color));
    });
}

// ---------------------------------------------------------------------------
// Browser
// ---------------------------------------------------------------------------

fn draw_browser(
    ui: &mut Ui,
    app: &mut FocusWavesApp,
    filtered: &[usize],
    playing: bool,
    search_id: egui::Id,
) {
    panel_header(
        ui,
        "BROWSER",
        &format!("{}/{}", filtered.len(), SORTING_ALGORITHMS.len()),
    );
    ui.add_space(4.0);
    ui.add_sized(
        [ui.available_width(), 26.0],
        TextEdit::singleline(&mut app.search)
            .id(search_id)
            .hint_text("Filter by name...")
            .font(FontId::proportional(12.0)),
    );
    ui.add_space(8.0);

    let mut categories: Vec<&'static str> = vec!["All"];
    for alg in SORTING_ALGORITHMS {
        if !categories.contains(&alg.category) {
            categories.push(alg.category);
        }
    }

    ui.label(RichText::new("CATEGORY").size(9.0).strong().color(FAINT));
    ui.add_space(2.0);
    egui::ScrollArea::vertical()
        .max_height(112.0)
        .auto_shrink(false)
        .show(ui, |ui| {
            ui.spacing_mut().item_spacing.y = 1.0;
            for cat in categories {
                let active = app.category.as_deref().unwrap_or("All") == cat;
                let count = if cat == "All" {
                    SORTING_ALGORITHMS.len()
                } else {
                    SORTING_ALGORITHMS
                        .iter()
                        .filter(|alg| alg.category == cat)
                        .count()
                };
                let (rect, response) = ui.allocate_exact_size(
                    vec2(ui.available_width(), 17.0),
                    Sense::click(),
                );
                let p = ui.painter();
                let fill = if active {
                    ACCENT_DIM
                } else if response.hovered() {
                    PANEL_RAISED
                } else {
                    PANEL
                };
                p.rect_filled(rect, 0.0, fill);
                if active {
                    p.rect_filled(
                        Rect::from_min_size(rect.min, vec2(2.0, rect.height())),
                        0.0,
                        ACCENT,
                    );
                }
                p.text(
                    egui::pos2(rect.min.x + 8.0, rect.center().y),
                    Align2::LEFT_CENTER,
                    format!("{cat:<20}{:>3}", count),
                    FontId::monospace(10.0),
                    if active { TEXT } else { MUTED },
                );
                if response.clicked() {
                    app.category = (cat != "All").then(|| cat.to_string());
                }
            }
        });

    ui.add_space(8.0);
    rule(ui);
    ui.add_space(8.0);
    ui.label(RichText::new("ALGORITHMS").size(9.0).strong().color(FAINT));
    ui.add_space(2.0);
    egui::ScrollArea::vertical()
        .auto_shrink(false)
        .show(ui, |ui| {
            ui.spacing_mut().item_spacing.y = 1.0;
            for &index in filtered {
                let alg = SORTING_ALGORITHMS[index];
                let active = index == app.selected;
                let (rect, response) = ui.allocate_exact_size(
                    vec2(ui.available_width(), 19.0),
                    Sense::click(),
                );
                let p = ui.painter();
                let fill = if active {
                    ACCENT_DIM
                } else if response.hovered() {
                    PANEL_RAISED
                } else {
                    PANEL
                };
                p.rect_filled(rect, 0.0, fill);
                if active {
                    p.rect_filled(
                        Rect::from_min_size(rect.min, vec2(2.0, rect.height())),
                        0.0,
                        ACCENT,
                    );
                }
                p.circle_filled(
                    egui::pos2(rect.min.x + 9.0, rect.center().y),
                    3.0,
                    accent_for(alg.color),
                );
                p.text(
                    egui::pos2(rect.min.x + 20.0, rect.center().y),
                    Align2::LEFT_CENTER,
                    alg.name,
                    FontId::proportional(11.0),
                    if active { TEXT } else { MUTED },
                );
                p.text(
                    egui::pos2(rect.max.x - 6.0, rect.center().y),
                    Align2::RIGHT_CENTER,
                    alg.category,
                    FontId::proportional(9.0),
                    FAINT,
                );
                if response.clicked() && index != app.selected {
                    app.selected = index;
                    if playing {
                        app.stop_playback();
                    }
                }
            }
        });
}

// ---------------------------------------------------------------------------
// Visualizer
// ---------------------------------------------------------------------------

fn draw_center(
    ui: &mut Ui,
    bars: &[i64],
    lit: &[usize],
    peak: i64,
    playing: bool,
    shuffle: bool,
    size: usize,
) {
    let status = if shuffle {
        "SHUFFLE"
    } else if playing {
        "LIVE"
    } else {
        "IDLE"
    };
    panel_header(ui, "VISUALIZER", status);

    ui.horizontal(|ui| {
        ui.spacing_mut().item_spacing = vec2(14.0, 0.0);
        metric(ui, "SAMPLES", &size.to_string());
        metric(ui, "BARS", &bars.len().to_string());
        metric(ui, "PEAK", &peak.to_string());
    });
    ui.add_space(8.0);

    let canvas_h = (ui.available_height() - 2.0).max(140.0);
    draw_canvas(ui, vec2(ui.available_width(), canvas_h), bars, lit, peak);
}

fn metric(ui: &mut Ui, label: &str, value: &str) {
    ui.vertical(|ui| {
        ui.spacing_mut().item_spacing.y = 0.0;
        ui.label(RichText::new(label).size(9.0).strong().color(FAINT));
        ui.label(
            RichText::new(value)
                .size(12.0)
                .color(TEXT)
                .font(FontId::monospace(12.0)),
        );
    });
}

fn draw_canvas(ui: &mut Ui, size: egui::Vec2, bars: &[i64], lit: &[usize], peak: i64) {
    let (area, _) = ui.allocate_exact_size(size, Sense::hover());
    let p = ui.painter_at(area);
    p.rect_filled(area, 0.0, CHART_BG);
    p.rect_stroke(area, 0.0, Stroke::new(1.0, BORDER), StrokeKind::Inside);

    let plot = Rect::from_min_max(
        area.min + vec2(42.0, 14.0),
        area.max - vec2(14.0, 26.0),
    );
    if plot.width() <= 1.0 || plot.height() <= 1.0 {
        return;
    }

    // Level grid with a real percentage scale, plus quiet time divisions.
    for fraction in [0.0_f32, 0.25, 0.5, 0.75, 1.0] {
        let y = plot.max.y - plot.height() * fraction;
        let strong = fraction == 0.0;
        p.line_segment(
            [egui::pos2(plot.min.x, y), egui::pos2(plot.max.x, y)],
            Stroke::new(1.0, if strong { GRID_STRONG } else { GRID }),
        );
        p.text(
            egui::pos2(plot.min.x - 6.0, y),
            Align2::RIGHT_CENTER,
            ((fraction * 100.0) as i32).to_string(),
            FontId::monospace(9.0),
            FAINT,
        );
    }
    for division in 1..8 {
        let x = plot.min.x + plot.width() * division as f32 / 8.0;
        p.line_segment(
            [egui::pos2(x, plot.min.y), egui::pos2(x, plot.max.y)],
            Stroke::new(1.0, GRID),
        );
    }

    if bars.is_empty() {
        p.text(
            plot.center(),
            Align2::CENTER_CENTER,
            "NO SIGNAL",
            FontId::monospace(11.0),
            FAINT,
        );
        return;
    }

    let max = peak.max(1) as f32;
    let lit_set: std::collections::HashSet<usize> = lit.iter().copied().collect();
    let slot = plot.width() / bars.len() as f32;
    let gap = if bars.len() > 256 { 0.5 } else { 1.5 };
    let bar_width = (slot - gap).max(0.5);

    for (index, &value) in bars.iter().enumerate() {
        let height = (value as f32 / max * plot.height()).max(1.5);
        let x = plot.min.x + index as f32 * slot;
        let rect = Rect::from_min_max(
            egui::pos2(x, plot.max.y - height),
            egui::pos2(x + bar_width, plot.max.y),
        );
        if lit_set.contains(&index) {
            p.rect_filled(
                rect.expand2(vec2(1.0, 1.0)),
                0.0,
                Color32::from_rgba_unmultiplied(ACCENT.r(), ACCENT.g(), ACCENT.b(), 28),
            );
            p.rect_filled(rect, 0.0, ACCENT);
            p.rect_filled(
                Rect::from_min_max(rect.min, egui::pos2(rect.max.x, rect.min.y + 2.0)),
                0.0,
                ACCENT_LIGHT,
            );
        } else {
            p.rect_filled(rect, 0.0, BAR);
        }
    }

    // Peak marker sits on the same scale as the grid.
    let peak_y = plot.max.y - plot.height();
    p.line_segment(
        [egui::pos2(plot.min.x, peak_y), egui::pos2(plot.max.x, peak_y)],
        Stroke::new(1.0, Color32::from_rgba_unmultiplied(WARN.r(), WARN.g(), WARN.b(), 110)),
    );
    p.text(
        egui::pos2(plot.max.x, peak_y - 4.0),
        Align2::RIGHT_BOTTOM,
        format!("PEAK {}", peak),
        FontId::monospace(9.0),
        WARN,
    );
    p.text(
        egui::pos2(plot.min.x, area.max.y - 9.0),
        Align2::LEFT_CENTER,
        format!("{} BUCKETS  ·  LEVEL %", bars.len()),
        FontId::monospace(9.0),
        FAINT,
    );
}

// ---------------------------------------------------------------------------
// Inspector
// ---------------------------------------------------------------------------

fn draw_inspector(ui: &mut Ui, app: &mut FocusWavesApp, playing: bool) {
    panel_header(
        ui,
        "INSPECTOR",
        &format!("{:02}/{:02}", app.selected + 1, SORTING_ALGORITHMS.len()),
    );
    let alg = SORTING_ALGORITHMS[app.selected];
    ui.add_space(6.0);

    ui.horizontal(|ui| {
        ui.spacing_mut().item_spacing = vec2(6.0, 0.0);
        let (dot, _) = ui.allocate_exact_size(vec2(10.0, 16.0), Sense::hover());
        ui.painter()
            .circle_filled(dot.center(), 4.0, accent_for(alg.color));
        ui.label(RichText::new(alg.name).size(13.0).strong().color(TEXT));
    });
    ui.add_space(6.0);
    ui.horizontal_wrapped(|ui| {
        chip(ui, alg.category, MUTED);
        chip(ui, alg.complexity, ACCENT);
    });

    ui.add_space(10.0);
    rule(ui);
    ui.add_space(8.0);
    ui.label(RichText::new("DETAILS").size(9.0).strong().color(FAINT));
    ui.add_space(4.0);
    detail_row(ui, "ID", alg.id);
    detail_row(ui, "CATEGORY", alg.category);
    detail_row(ui, "COMPLEXITY", alg.complexity);
    detail_row(
        ui,
        "INDEX",
        &format!("{} / {}", app.selected + 1, SORTING_ALGORITHMS.len()),
    );

    ui.add_space(10.0);
    rule(ui);
    ui.add_space(8.0);
    ui.label(RichText::new("DESCRIPTION").size(9.0).strong().color(FAINT));
    ui.add_space(3.0);
    ui.label(RichText::new(alg.description).size(11.0).color(MUTED));

    ui.add_space(10.0);
    rule(ui);
    ui.add_space(8.0);
    ui.label(RichText::new("PARAMETERS").size(9.0).strong().color(FAINT));
    ui.add_space(3.0);
    ui.label(RichText::new("Sample size").size(11.0).color(MUTED));
    egui::ComboBox::from_id_salt("sample-size")
        .selected_text(format!("{} elements", app.size))
        .width(ui.available_width())
        .show_ui(ui, |ui| {
            for option in SIZES {
                if ui
                    .selectable_value(&mut app.size, option, format!("{} elements", option))
                    .clicked()
                    && !playing
                {
                    app.values = seeded_values(app.size);
                    app.highlights.clear();
                }
            }
        });

    ui.add_space(10.0);
    rule(ui);
    ui.add_space(8.0);
    ui.label(RichText::new("SIGNAL").size(9.0).strong().color(FAINT));
    ui.add_space(4.0);
    ui.horizontal(|ui| {
        ui.spacing_mut().item_spacing = vec2(8.0, 0.0);
        sine_glyph(ui);
        ui.label(RichText::new("Sine : final sorted sweep").size(10.0).color(MUTED));
    });

    if let Some(message) = app.error.as_deref() {
        ui.add_space(10.0);
        rule(ui);
        ui.add_space(8.0);
        ui.label(RichText::new("AUDIO ERROR").size(9.0).strong().color(WARN));
        ui.label(RichText::new(message).size(10.0).color(ERROR));
    }
}

fn detail_row(ui: &mut Ui, label: &str, value: &str) {
    ui.horizontal(|ui| {
        ui.spacing_mut().item_spacing = vec2(6.0, 0.0);
        ui.label(
            RichText::new(format!("{label:<11}"))
                .size(10.0)
                .color(FAINT)
                .font(FontId::monospace(10.0)),
        );
        ui.label(
            RichText::new(value)
                .size(10.0)
                .color(TEXT)
                .font(FontId::monospace(10.0)),
        );
    });
}

fn chip(ui: &mut Ui, text: &str, color: Color32) {
    egui::Frame::NONE
        .fill(PANEL_RAISED)
        .stroke(Stroke::new(1.0, BORDER))
        .corner_radius(2.0)
        .inner_margin(egui::Margin::symmetric(6, 2))
        .show(ui, |ui| {
            ui.label(RichText::new(text).size(10.0).color(color));
        });
}

/// The final sweep in `engine::SortCtx::play_sorted` is the only waveform that
/// is common to every algorithm; the rest vary per algorithm and are not in the
/// catalog, so the legend deliberately stops here.
fn sine_glyph(ui: &mut Ui) {
    let (rect, _) = ui.allocate_exact_size(vec2(48.0, 12.0), Sense::hover());
    let points: Vec<egui::Pos2> = (0..=24)
        .map(|i| {
            let t = i as f32 / 24.0;
            egui::pos2(
                rect.min.x + t * rect.width(),
                rect.center().y - (t * std::f32::consts::TAU * 2.0).sin() * 4.0,
            )
        })
        .collect();
    ui.painter().line(points, Stroke::new(1.0, ACCENT));
}

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

// One call site; passing every label/flag explicitly keeps the footer layout readable.
#[allow(clippy::too_many_arguments)]
fn draw_footer(
    ui: &mut Ui,
    algorithms: usize,
    size: usize,
    bars: usize,
    audio_online: bool,
    error: Option<&str>,
    shuffle: bool,
    playing: bool,
    width: f32,
) {
    let x = ui.cursor().min.x;
    let y = ui.cursor().min.y + 8.0;
    let w = ui.available_width();
    let p = ui.painter();
    p.text(
        egui::pos2(x, y),
        Align2::LEFT_CENTER,
        format!("{} ALGORITHMS   ·   {} SAMPLES   ·   {} BARS", algorithms, size, bars),
        FontId::monospace(10.0),
        MUTED,
    );
    if width >= 760.0 {
        let state = if shuffle {
            "SHUFFLE"
        } else if playing {
            "PLAYING"
        } else {
            "IDLE"
        };
        p.text(
            egui::pos2(x + w * 0.62, y),
            Align2::LEFT_CENTER,
            format!("STATE  {state}"),
            FontId::monospace(10.0),
            if shuffle || playing { ACCENT } else { FAINT },
        );
    }
    let (audio, color) = match error {
        Some(message) => (format!("AUDIO  {message}"), WARN),
        None if audio_online => ("AUDIO  ONLINE".to_string(), ACCENT),
        None => ("AUDIO  OFFLINE".to_string(), FAINT),
    };
    p.text(
        egui::pos2(x + w, y),
        Align2::RIGHT_CENTER,
        audio,
        FontId::monospace(10.0),
        color,
    );
}

// ---------------------------------------------------------------------------
// Data helpers
// ---------------------------------------------------------------------------

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

fn filtered_indices(search: &str, category: Option<&str>) -> Vec<usize> {
    let needle = search.to_lowercase();
    SORTING_ALGORITHMS
        .iter()
        .enumerate()
        .filter(|(_, alg)| {
            category.is_none_or(|cat| cat == alg.category)
                && alg.name.to_lowercase().contains(&needle)
        })
        .map(|(index, _)| index)
        .collect()
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

/// Pick a random algorithm index, avoiding an immediate repeat when possible.
fn random_algorithm_index(avoid: usize) -> usize {
    let len = SORTING_ALGORITHMS.len();
    let mut index = rand::rng().random_range(0..len);
    if len > 1 && index == avoid {
        index = (index + 1) % len;
    }
    index
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

    #[test]
    fn shuffle_index_stays_in_range_and_avoids_repeat() {
        let len = SORTING_ALGORITHMS.len();
        for avoid in [0, 1, len - 1] {
            let index = random_algorithm_index(avoid);
            assert!(index < len);
            assert_ne!(index, avoid);
        }
    }
}
