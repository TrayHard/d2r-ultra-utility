import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Получаем текущую директорию для ES модулей
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Читаем файлы
const basesPath = path.join(__dirname, "bases.json");
const setItemsPath = path.join(__dirname, "setItems.json");

console.log("Читаем файлы...");
const basesData = JSON.parse(fs.readFileSync(basesPath, "utf8"));
const setItemsData = JSON.parse(fs.readFileSync(setItemsPath, "utf8"));

console.log(`Загружено ${basesData.length} базовых предметов`);
console.log(`Загружено ${setItemsData.length} сетовых предметов`);

// Инициализируем поле setItems для всех базовых предметов
basesData.forEach((base) => {
  base.setItems = [];
});

// Создаем карту базовых предметов для быстрого поиска
const basesMap = new Map();
basesData.forEach((base, index) => {
  basesMap.set(base.key, index);
});

// Счетчики для статистики
let addedSetItems = 0;
let processedBases = 0;

// Обрабатываем каждый сетовый предмет
setItemsData.forEach((setItem) => {
  const baseKey = setItem.base;

  if (basesMap.has(baseKey)) {
    const baseIndex = basesMap.get(baseKey);
    const base = basesData[baseIndex];

    // Добавляем сетовый предмет с только нужными полями
    base.setItems.push({
      key: setItem.key,
      imgName: setItem.imgName,
    });

    addedSetItems++;
  }
});

// Подсчитываем количество базовых предметов с сетовыми предметами
basesData.forEach((base) => {
  if (base.setItems.length > 0) {
    processedBases++;
  }
});

console.log(`Добавлено сетовых предметов: ${addedSetItems}`);
console.log(`Обработано базовых предметов: ${processedBases}`);

// Сохраняем обновленный файл
const outputPath = path.join(__dirname, "bases_out.json");
fs.writeFileSync(outputPath, JSON.stringify(basesData, null, 2), "utf8");

console.log("Файл bases_out.json создан!");
