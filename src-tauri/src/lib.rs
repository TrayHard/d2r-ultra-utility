// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use rfd::FileDialog;
use std::env;
use std::fs;
use std::path::Path;
use std::process::Command;
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

    // Windows paths
    #[cfg(target_os = "windows")]
    {
        paths.push("C:\\Program Files (x86)\\Diablo II Resurrected".to_string());
        paths.push("C:\\Program Files\\Diablo II Resurrected".to_string());
        paths.push("C:\\Games\\Diablo II Resurrected".to_string());
        paths.push("D:\\Games\\Diablo II Resurrected".to_string());
        paths.push("E:\\Games\\Diablo II Resurrected".to_string());
    }

    // Linux paths
    #[cfg(not(target_os = "windows"))]
    {
        if let Ok(home) = env::var("HOME") {
            // Direct path in home
            paths.push(format!("{}/Diablo II Resurrected", home));

            // Steam paths
            paths.push(format!("{}/.steam/steam/steamapps/common/Diablo II Resurrected", home));
            paths.push(format!("{}/.local/share/Steam/steamapps/common/Diablo II Resurrected", home));
            paths.push(format!("{}/Games/Diablo II Resurrected", home));
            paths.push(format!("{}/.games/Diablo II Resurrected", home));

            // Lutris paths
            paths.push(format!("{}/Games/lutris/Diablo II Resurrected", home));
            paths.push(format!("{}/.local/share/lutris/games/diablo-ii-resurrected", home));

            // Heroic Games Launcher paths
            paths.push(format!("{}/.config/heroic/Diablo II Resurrected", home));
            paths.push(format!("{}/.local/share/heroic/Diablo II Resurrected", home));

            // Bottles (Wine) paths
            paths.push(format!("{}/.local/share/bottles/bottles/Diablo II Resurrected/drive_c/Program Files (x86)/Diablo II Resurrected", home));
            paths.push(format!("{}/.local/share/bottles/bottles/Diablo II Resurrected/drive_c/Program Files/Diablo II Resurrected", home));

            // Common Wine prefix paths
            paths.push(format!("{}/.wine/drive_c/Program Files (x86)/Diablo II Resurrected", home));
            paths.push(format!("{}/.wine/drive_c/Program Files/Diablo II Resurrected", home));
            paths.push(format!("{}/.wine/drive_c/Games/Diablo II Resurrected", home));
        }

        // System paths for Linux
        paths.push("/opt/Diablo II Resurrected".to_string());
        paths.push("/usr/local/games/Diablo II Resurrected".to_string());
        paths.push("/usr/games/Diablo II Resurrected".to_string());
    }

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

    // Игнорируем системные пути
    if let Some(path_str) = dir.to_str() {
        let path_lower = path_str.to_lowercase();
        #[cfg(target_os = "windows")]
        {
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
        #[cfg(not(target_os = "windows"))]
        {
            if path_lower.contains("/proc")
                || path_lower.contains("/sys")
                || path_lower.contains("/dev")
                || path_lower.contains("/run")
                || path_lower.contains("/tmp")
                || path_lower.contains("/var/tmp")
                || path_lower.contains("/var/cache")
                || path_lower.contains("/var/log")
                || path_lower.contains("/usr/share")
                || path_lower.contains("/lib")
                || path_lower.contains("/lib64")
                || path_lower.contains("/bin")
                || path_lower.contains("/sbin")
                || path_lower.contains("node_modules")
            {
                return;
            }
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
            open_file_dialog,
            ensure_writable,
            ensure_dir
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[derive(serde::Serialize)]
struct EnsureResult {
    path: String,
    is_readonly: bool,
    removed_readonly: bool,
    granted_acl: bool,
    writable: bool,
    error: Option<String>,
}

#[tauri::command]
async fn ensure_writable(paths: Vec<String>) -> Result<Vec<EnsureResult>, String> {
    let mut results: Vec<EnsureResult> = Vec::with_capacity(paths.len());

    for path in paths {
        let mut is_readonly = false;
        let mut removed_readonly = false;
        let mut granted_acl = false;
        let mut writable = false;
        let mut error: Option<String> = None;

        let target = Path::new(&path);
        let parent = target.parent().map(|p| p.to_path_buf());

        // Step 1: check readonly and try to clear it (file or parent dir if file missing)
        let target_for_attr = if target.exists() {
            target.to_path_buf()
        } else if let Some(parent_dir) = &parent {
            parent_dir.to_path_buf()
        } else {
            target.to_path_buf()
        };

        match fs::metadata(&target_for_attr) {
            Ok(md) => {
                is_readonly = md.permissions().readonly();
                if is_readonly {
                    // Try via Rust API
                    let mut perms = md.permissions();
                    perms.set_readonly(false);
                    if fs::set_permissions(&target_for_attr, perms).is_ok() {
                        removed_readonly = true;
                    } else {
                        // Fallback to attrib
                        let status = Command::new("cmd")
                            .args(["/C", "attrib", "+S", "+H"]) // no-op to warm shell
                            .status();
                        let _ = status; // ignore
                        let out = Command::new("cmd")
                            .args(["/C", "attrib", "-R", &format!("\"{}\"", target_for_attr.display())])
                            .output();
                        if let Ok(o) = out {
                            if o.status.success() {
                                removed_readonly = true;
                            }
                        }
                    }
                }
            }
            Err(e) => {
                error = Some(format!("metadata error: {}", e));
            }
        }

        // Step 2: try grant ACL full control to current user (best effort)
        #[cfg(target_os = "windows")]
        {
            // Resolve current user as DOMAIN\\User via whoami
            let user = Command::new("whoami").output().ok().and_then(|o| String::from_utf8(o.stdout).ok()).map(|s| s.trim().to_string());
            if let Some(u) = user {
                let icacls_cmd = format!("icacls \"{}\" /grant {}:F /C /Q", target_for_attr.display(), u);
                if let Ok(o) = Command::new("cmd").args(["/C", &icacls_cmd]).output() {
                    if o.status.success() {
                        granted_acl = true;
                    }
                }
            }
        }

        #[cfg(not(target_os = "windows"))]
        {
            // For Linux, try to change permissions
            if let Some(parent_dir) = &parent {
                // Try to make directory writable
                let chmod_cmd = format!("chmod -R u+w \"{}\"", parent_dir.display());
                if let Ok(o) = Command::new("sh").args(["-c", &chmod_cmd]).output() {
                    if o.status.success() {
                        granted_acl = true;
                    }
                }
            }
        }

        // Step 3: check writability by attempting to open for append/create
        match fs::OpenOptions::new().create(true).append(true).open(&target_for_attr) {
            Ok(_) => {
                writable = true;
            }
            Err(e) => {
                if error.is_none() {
                    error = Some(format!("open error: {}", e));
                }
            }
        }

        results.push(EnsureResult {
            path,
            is_readonly,
            removed_readonly,
            granted_acl,
            writable,
            error,
        });
    }

    Ok(results)
}

#[tauri::command]
async fn ensure_dir(paths: Vec<String>) -> Result<Vec<String>, String> {
    use std::fs;
    use std::path::Path;

    let mut created: Vec<String> = Vec::new();
    for p in paths {
        let path = Path::new(&p);
        if path.exists() {
            // если это файл, удалим его
            if let Ok(md) = fs::metadata(&path) {
                if md.is_file() {
                    let _ = fs::remove_file(&path);
                }
            }
        }
        if let Err(e) = fs::create_dir_all(&path) {
            return Err(format!("create_dir_all failed for {}: {}", p, e));
        }
        created.push(p);
    }
    Ok(created)
}

