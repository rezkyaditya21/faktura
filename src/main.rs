use axum::{
    extract::Query,
    http::{header, HeaderValue, StatusCode},
    response::{IntoResponse, Response},
    routing::get,
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::{fs, net::SocketAddr, path::PathBuf};
use tower_http::{cors::CorsLayer, services::ServeDir};

#[derive(Debug, Serialize, Deserialize)]
struct HealthResponse {
    status: String,
    service: String,
    engine: String,
    message: String,
}

#[derive(Debug, Deserialize)]
struct QRParams {
    text: String,
    fg: Option<String>,
    bg: Option<String>,
}

#[tokio::main]
async fn main() {
    println!("⚡ Menginisialisasi Faktura Engine (Powered by Rust)...");

    // Static files folder
    let static_dir = PathBuf::from("static");

    // Router definition
    let app = Router::new()
        .route("/api/health", get(health_handler))
        .route("/api/config", get(config_handler))
        .route("/api/tools/qr", get(qr_handler))
        .nest_service("/", ServeDir::new(&static_dir))
        .layer(CorsLayer::permissive());

    let addr = SocketAddr::from(([0, 0, 0, 0], 3000));
    println!("🚀 Server aktif di seluruh jaringan lokal: port 3000");
    println!("✨ Akses laptop: http://127.0.0.1:3000");
    println!("📱 Akses HP: http://192.168.1.9:3000");

    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .expect("Gagal mengikat port 3000");

    axum::serve(listener, app)
        .await
        .expect("Server mengalami kendala");
}

async fn health_handler() -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "ok".to_string(),
        service: "Faktura Engine Server".to_string(),
        engine: "Rust 1.98 (Axum + Tokio)".to_string(),
        message: "Sistem beroperasi dengan latensi sub-milidetik".to_string(),
    })
}

async fn config_handler() -> Response {
    match fs::read_to_string("monetization.json") {
        Ok(content) => (
            StatusCode::OK,
            [(header::CONTENT_TYPE, HeaderValue::from_static("application/json"))],
            content,
        )
            .into_response(),
        Err(_) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            "Gagal membaca konfigurasi monetisasi",
        )
            .into_response(),
    }
}

async fn qr_handler(Query(params): Query<QRParams>) -> Response {
    if params.text.trim().is_empty() {
        return (StatusCode::BAD_REQUEST, "Parameter 'text' tidak boleh kosong").into_response();
    }

    // Generate QR code using qrcode crate
    match qrcode::QrCode::new(params.text.as_bytes()) {
        Ok(code) => {
            // Render to SVG or PNG
            let svg = code
                .render()
                .min_dimensions(200, 200)
                .dark_color(qrcode::render::svg::Color(params.fg.as_deref().unwrap_or("#000000")))
                .light_color(qrcode::render::svg::Color(params.bg.as_deref().unwrap_or("#ffffff")))
                .build();

            (
                StatusCode::OK,
                [(header::CONTENT_TYPE, HeaderValue::from_static("image/svg+xml"))],
                svg,
            )
                .into_response()
        }
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Gagal membuat QR Code: {}", e),
        )
            .into_response(),
    }
}
