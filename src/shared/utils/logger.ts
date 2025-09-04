export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  component?: string;
  action?: string;
  error?: Error;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Максимальное количество логов в памяти
  private debugModeEnabled = false;
  private listeners: Set<() => void> = new Set();

  constructor() {
    // Проверяем localStorage при создании логгера
    this.checkDebugMode();
  }

  private checkDebugMode() {
    try {
      const appConfig = localStorage.getItem('d2r-app-config');
      if (appConfig) {
        const config = JSON.parse(appConfig);
        this.debugModeEnabled = config.debugMode || false;
      }
    } catch (error) {
      console.warn('Failed to check debug mode from localStorage:', error);
    }
  }

  setDebugMode(enabled: boolean) {
    this.debugModeEnabled = enabled;
  }

  private addLog(level: LogLevel, message: string, data?: any, component?: string, action?: string, error?: Error) {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      component,
      action,
      error
    };

    // Добавляем лог в массив
    this.logs.push(logEntry);

    // Ограничиваем размер массива логов
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Если включен отладочный режим, выводим в консоль
    if (this.debugModeEnabled) {
      this.outputToConsole(logEntry);
    }

    // Уведомляем слушателей об изменениях
    this.notifyListeners();
  }

  private outputToConsole(entry: LogEntry) {
    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}]${entry.component ? ` [${entry.component}]` : ''}${entry.action ? ` [${entry.action}]` : ''}`;
    
    switch (entry.level) {
      case 'debug':
        console.debug(prefix, entry.message, entry.data || '');
        break;
      case 'info':
        console.info(prefix, entry.message, entry.data || '');
        break;
      case 'warn':
        console.warn(prefix, entry.message, entry.data || '');
        break;
      case 'error':
        console.error(prefix, entry.message, entry.data || '', entry.error || '');
        break;
    }
  }

  debug(message: string, data?: any, component?: string, action?: string) {
    this.addLog('debug', message, data, component, action);
  }

  info(message: string, data?: any, component?: string, action?: string) {
    this.addLog('info', message, data, component, action);
  }

  warn(message: string, data?: any, component?: string, action?: string) {
    this.addLog('warn', message, data, component, action);
  }

  error(message: string, error?: Error, data?: any, component?: string, action?: string) {
    this.addLog('error', message, data, component, action, error);
  }

  // Получить все логи
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  // Получить логи по уровню
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  // Получить логи по компоненту
  getLogsByComponent(component: string): LogEntry[] {
    return this.logs.filter(log => log.component === component);
  }

  // Получить логи за определенный период
  getLogsByTimeRange(startTime: Date, endTime: Date): LogEntry[] {
    return this.logs.filter(log => {
      const logTime = new Date(log.timestamp);
      return logTime >= startTime && logTime <= endTime;
    });
  }

  // Экспорт логов в JSON
  exportLogs(): string {
    // Экспортируем ошибки, предупреждения и информационные сообщения
    const logsToExport = this.logs.filter(l => l.level === 'error' || l.level === 'warn' || l.level === 'info');
    const exportData = {
      exportedAt: new Date().toISOString(),
      totalLogs: logsToExport.length,
      logs: logsToExport
    };
    return JSON.stringify(exportData, null, 2);
  }

  // Экспорт логов в текстовом формате
  exportLogsAsText(): string {
    // Экспортируем ошибки, предупреждения и информационные сообщения
    const logsToExport = this.logs.filter(l => l.level === 'error' || l.level === 'warn' || l.level === 'info');
    let output = `=== Debug Logs Export ===\n`;
    output += `Exported at: ${new Date().toISOString()}\n`;
    output += `Total logs: ${logsToExport.length}\n\n`;

    logsToExport.forEach(log => {
      output += `[${log.timestamp}] [${log.level.toUpperCase()}]`;
      if (log.component) output += ` [${log.component}]`;
      if (log.action) output += ` [${log.action}]`;
      output += `: ${log.message}\n`;
      
      if (log.data) {
        output += `  Data: ${JSON.stringify(log.data, null, 2)}\n`;
      }
      
      if (log.error) {
        output += `  Error: ${log.error.message}\n`;
        if (log.error.stack) {
          output += `  Stack: ${log.error.stack}\n`;
        }
      }
      
      output += '\n';
    });

    return output;
  }

  // Очистить логи
  clearLogs() {
    const prevCount = this.logs.length;
    this.logs = [];
    if (this.debugModeEnabled) {
      console.info(`[Logger] ${prevCount} logs cleared`);
    }
    // Уведомляем слушателей об очистке
    this.notifyListeners();
  }

  // Добавляем методы для подписки на изменения
  addListener(listener: () => void) {
    this.listeners.add(listener);
  }

  removeListener(listener: () => void) {
    this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }

  // Получить статистику логов
  getLogStats() {
    const stats = {
      total: this.logs.length,
      debug: 0,
      info: 0,
      warn: 0,
      error: 0,
      components: new Set<string>(),
      actions: new Set<string>()
    };

    this.logs.forEach(log => {
      stats[log.level]++;
      if (log.component) stats.components.add(log.component);
      if (log.action) stats.actions.add(log.action);
    });

    return {
      ...stats,
      components: Array.from(stats.components),
      actions: Array.from(stats.actions)
    };
  }
}

// Создаем глобальный экземпляр логгера
export const logger = new Logger();

// Хук для использования логгера в React компонентах
export const useLogger = (component?: string) => {
  return {
    debug: (message: string, data?: any, action?: string) => 
      logger.debug(message, data, component, action),
    info: (message: string, data?: any, action?: string) => 
      logger.info(message, data, component, action),
    warn: (message: string, data?: any, action?: string) => 
      logger.warn(message, data, component, action),
    error: (message: string, error?: Error, data?: any, action?: string) => 
      logger.error(message, error, data, component, action),
  };
};
