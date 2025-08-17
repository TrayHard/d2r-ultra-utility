// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use rfd::FileDialog;
use std::env;
use std::fs;
use std::path::Path;
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
    let _ = app.emit(
        "search_progress",
        SearchProgress {
            current: 0,
            total: 100,
            message: "Starting search...".to_string(),
            found_count: 0,
        },
    );

    // Предопределенные пути для поиска
    let predefined_paths = get_predefined_search_paths();
    let total_paths = predefined_paths.len();

    // Ищем в предопределенных путях
    for (index, search_path) in predefined_paths.iter().enumerate() {
        let progress = ((index + 1) * 80 / total_paths.max(1)) as u32;
        let _ = app.emit(
            "search_progress",
            SearchProgress {
                current: progress,
                total: 100,
                message: format!("Searching in: {}", search_path),
                found_count: found_paths.len(),
            },
        );

        if Path::new(search_path).exists() {
            search_in_directory(
                &Path::new(search_path),
                &filename,
                &mut found_paths,
                0,
                &app,
                &mut total_searched,
            )
            .await;
        }

        // Небольшая задержка чтобы не спамить события
        sleep(Duration::from_millis(10)).await;
    }

    // Если нашли что-то, возвращаем результат
    if !found_paths.is_empty() {
        let _ = app.emit(
            "search_progress",
            SearchProgress {
                current: 100,
                total: 100,
                message: format!("Search completed! Found {} files", found_paths.len()),
                found_count: found_paths.len(),
            },
        );
        return Ok(found_paths);
    }

    // Если не нашли, предлагаем пользователю выбрать файл
    let _ = app.emit(
        "search_progress",
        SearchProgress {
            current: 90,
            total: 100,
            message: "File not found in predefined paths. Please select file manually..."
                .to_string(),
            found_count: 0,
        },
    );

    // Отправляем событие что нужно открыть диалог выбора файла
    let _ = app.emit(
        "open_file_dialog",
        OpenFileDialogRequest {
            filename: filename.clone(),
            message: "File not found in predefined paths. Please select the file manually."
                .to_string(),
        },
    );

    Ok(found_paths) // Возвращаем пустой список, фронтенд должен обработать событие диалога
}

#[derive(Clone, serde::Serialize)]
struct SearchProgress {
    current: u32,
    total: u32,
    message: String,
    found_count: usize,
}

#[derive(Clone, serde::Serialize)]
struct OpenFileDialogRequest {
    filename: String,
    message: String,
}

fn get_predefined_search_paths() -> Vec<String> {
    let mut paths = Vec::new();

    // Общие места где может лежать Diablo 2
    paths.push("C:\\Program Files (x86)\\Diablo II Resurrected".to_string());
    paths.push("C:\\Program Files\\Diablo II Resurrected".to_string());
    paths.push("C:\\Games\\Diablo II Resurrected".to_string());
    paths.push("D:\\Games\\Diablo II Resurrected".to_string());
    paths.push("E:\\Games\\Diablo II Resurrected".to_string());

    paths
}

#[tauri::command]
fn set_selected_file(file_path: String) -> Result<String, String> {
    // Эта команда будет вызвана с фронтенда когда пользователь выберет файл
    if Path::new(&file_path).exists() {
        Ok(file_path)
    } else {
        Err("Selected file does not exist".to_string())
    }
}

#[tauri::command]
async fn open_file_dialog() -> Result<String, String> {
    let file = FileDialog::new()
        .add_filter("Executable files", &["exe"])
        .add_filter("All files", &["*"])
        .set_title("Select file")
        .pick_file();

    match file {
        Some(path) => {
            if let Some(path_str) = path.to_str() {
                Ok(path_str.to_string())
            } else {
                Err("Invalid file path".to_string())
            }
        }
        None => Err("No file selected".to_string()),
    }
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
        if path_lower.contains("windows")
            || path_lower.contains("program files")
            || path_lower.contains("programdata")
            || path_lower.contains("system32")
            || path_lower.contains("$recycle.bin")
            || path_lower.contains("recovery")
            || path_lower.contains("appdata\\local\\temp")
            || path_lower.contains("node_modules")
        {
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
                Box::pin(search_in_directory(
                    &path,
                    filename,
                    found_paths,
                    depth + 1,
                    app,
                    total_searched,
                ))
                .await;
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
    matches!(
        dir_name,
        "windows"
            | "system32"
            | "syswow64"
            | "programdata"
            | "$recycle.bin"
            | "recovery"
            | "boot"
            | "msocache"
            | "system volume information"
            | "config.msi"
            | "temp"
            | "tmp"
            | "pagefile.sys"
            | "hiberfil.sys"
            | "node_modules"
            | ".git"
            | "target"
            | "dist"
            | "build"
    )
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            #[cfg(desktop)]
            app.handle().plugin(tauri_plugin_updater::Builder::new().build())?;
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            search_file,
            set_selected_file,
            open_file_dialog
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
