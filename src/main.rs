#![allow(non_snake_case)]

mod algorithms;
mod app;
mod audio;
mod catalog;
mod engine;

fn main() -> eframe::Result<()> {
    let options = eframe::NativeOptions {
        viewport: eframe::egui::ViewportBuilder::default().with_inner_size([1100.0, 820.0]),
        ..Default::default()
    };
    eframe::run_native(
        "Focus Waves",
        options,
        Box::new(|_cc| Ok(Box::new(app::FocusWavesApp::new()) as Box<dyn eframe::App>)),
    )
}
