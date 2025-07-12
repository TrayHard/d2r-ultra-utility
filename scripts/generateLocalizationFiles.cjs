const fs = require("fs");
const path = require("path");

// Читаем исходные файлы
const setItems = JSON.parse(
  fs.readFileSync(path.join(__dirname, "setItems.json"), "utf8")
);
const itemNames = JSON.parse(
  fs.readFileSync(path.join(__dirname, "item-names.json"), "utf8")
);

// Создаем карту для быстрого поиска переводов
const nameToRuMap = {};
itemNames.forEach((item) => {
  if (item.enUS && item.ruRU) {
    nameToRuMap[item.enUS] = item.ruRU;
  }
});

// Генерируем en.json
const enLocalization = {};
setItems.forEach((item) => {
  if (item.key && item.name) {
    enLocalization[item.key] = item.name;
  }
});

// Генерируем ru.json
const ruLocalization = {};
setItems.forEach((item) => {
  if (item.key && item.name) {
    const ruName = nameToRuMap[item.name];
    if (ruName) {
      ruLocalization[item.key] = ruName;
    } else {
      console.warn(`Не найден русский перевод для: ${item.name}`);
      // Оставляем английское название если перевод не найден
      ruLocalization[item.key] = item.name;
    }
  }
});

// Создаем директорию для результатов если её нет
const outputDir = path.join(__dirname, "localization");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Записываем результаты в файлы
fs.writeFileSync(
  path.join(outputDir, "en.json"),
  JSON.stringify(enLocalization, null, 2),
  "utf8"
);

fs.writeFileSync(
  path.join(outputDir, "ru.json"),
  JSON.stringify(ruLocalization, null, 2),
  "utf8"
);

console.log(`Создано файлов локализации:`);
console.log(`- en.json: ${Object.keys(enLocalization).length} элементов`);
console.log(`- ru.json: ${Object.keys(ruLocalization).length} элементов`);
console.log(`Файлы сохранены в директории: ${outputDir}`);
