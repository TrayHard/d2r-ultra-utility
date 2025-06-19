// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use std::fs;
use std::path::{Path, PathBuf};
use std::env;
use tauri::{AppHandle, Emitter};
use tokio::time::{sleep, Duration};

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn search_file(filename: String, app: AppHandle) -> Result<Vec<String>, String> {
    let mut found_paths = Vec::new();
    let mut total_searched = 0u32;
    
    // Эмитим событие начала поиска
    let _ = app.emit("search_progress", SearchProgress {
        current: 0,
        total: 100,
        message: "Starting search...".to_string(),
        found_count: 0,
    });
    
    // Получаем домашний каталог пользователя
    if let Ok(home_dir) = env::var("USERPROFILE") {
        let _ = app.emit("search_progress", SearchProgress {
            current: 10,
            total: 100,
            message: format!("Searching in home directory: {}", home_dir),
            found_count: found_paths.len(),
        });
        
        search_in_directory(&Path::new(&home_dir), &filename, &mut found_paths, 0, &app, &mut total_searched).await;
    }
    
    // Также ищем на всех дисках, но игнорируем системные папки
    let drives = get_available_drives();
    let drive_count = drives.len();
    
    for (index, drive) in drives.iter().enumerate() {
        let progress = 10 + ((index + 1) * 80 / drive_count.max(1)) as u32;
        let _ = app.emit("search_progress", SearchProgress {
            current: progress,
            total: 100,
            message: format!("Searching drive: {}", drive),
            found_count: found_paths.len(),
        });
        
        search_in_directory(&Path::new(drive), &filename, &mut found_paths, 0, &app, &mut total_searched).await;
        
        // Небольшая задержка чтобы не спамить события
        sleep(Duration::from_millis(10)).await;
    }
    
    // Завершаем поиск
    let _ = app.emit("search_progress", SearchProgress {
        current: 100,
        total: 100,
        message: format!("Search completed! Found {} files", found_paths.len()),
        found_count: found_paths.len(),
    });
    
    Ok(found_paths)
}

#[derive(Clone, serde::Serialize)]
struct SearchProgress {
    current: u32,
    total: u32,
    message: String,
    found_count: usize,
}

fn get_available_drives() -> Vec<String> {
    let mut drives = Vec::new();
    for letter in 'A'..='Z' {
        let drive = format!("{}:\\", letter);
        if Path::new(&drive).exists() {
            drives.push(drive);
        }
    }
    drives
}

async fn search_in_directory(
    dir: &Path, 
    filename: &str, 
    found_paths: &mut Vec<String>, 
    depth: u32,
    app: &AppHandle,
    total_searched: &mut u32,
) {
    // Ограничиваем глубину поиска чтобы не зависнуть нахуй
    if depth > 8 {
        return;
    }
    
    // Игнорируем системные каталоги
    if let Some(dir_name) = dir.file_name() {
        let dir_str = dir_name.to_string_lossy().to_lowercase();
        if is_system_directory(&dir_str) {
            return;
        }
    }
    
    // Игнорируем системные пути Windows
    if let Some(path_str) = dir.to_str() {
        let path_lower = path_str.to_lowercase();
        if path_lower.contains("windows") || 
           path_lower.contains("program files") || 
           path_lower.contains("programdata") ||
           path_lower.contains("system32") ||
           path_lower.contains("$recycle.bin") ||
           path_lower.contains("recovery") ||
           path_lower.contains("appdata\\local\\temp") ||
           path_lower.contains("node_modules") {
            return;
        }
    }
    
    // Читаем содержимое директории
    if let Ok(entries) = fs::read_dir(dir) {
        let mut count = 0;
        for entry in entries.flatten() {
            let path = entry.path();
            
            if path.is_file() {
                // Проверяем имя файла
                if let Some(file_name) = path.file_name() {
                    if file_name.to_string_lossy().to_lowercase() == filename.to_lowercase() {
                        if let Some(path_str) = path.to_str() {
                            found_paths.push(path_str.to_string());
                        }
                    }
                }
            } else if path.is_dir() {
                // Рекурсивно ищем в подпапках
                Box::pin(search_in_directory(&path, filename, found_paths, depth + 1, app, total_searched)).await;
            }
            
            count += 1;
            *total_searched += 1;
            
            // Каждые 100 файлов даем UI время обновиться
            if count % 100 == 0 {
                sleep(Duration::from_millis(1)).await;
            }
        }
    }
}

fn is_system_directory(dir_name: &str) -> bool {
    matches!(dir_name, 
        "windows" | "system32" | "syswow64" | "programdata" | 
        "$recycle.bin" | "recovery" | "boot" | "msocache" |
        "system volume information" | "config.msi" | "temp" |
        "tmp" | "pagefile.sys" | "hiberfil.sys" | "node_modules" |
        ".git" | "target" | "dist" | "build"
    )
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, search_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
