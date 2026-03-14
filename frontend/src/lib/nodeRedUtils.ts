import { NodeType, NodeProperty } from "@/types/graph";

// Схемы свойств для каждого типа узла
export const NODE_PROPERTIES_SCHEMAS: Record<NodeType, NodeProperty[]> = {
  inject: [
    {
      name: "payload",
      value: "",
      type: "string",
      description: "Значение для отправки",
      placeholder: "Введите значение payload",
    },
    {
      name: "topic",
      value: "",
      type: "string",
      description: "Тема сообщения",
      placeholder: "Введите тему",
    },
    {
      name: "repeat",
      value: 0,
      type: "number",
      description: "Интервал повторения (сек), 0 = не повторять",
      min: 0,
      max: 86400,
    },
    {
      name: "crontab",
      value: "",
      type: "string",
      description: "Cron выражение для планирования",
      placeholder: "*/5 * * * *",
    },
    {
      name: "once",
      value: false,
      type: "boolean",
      description: "Запустить только один раз при старте",
    },
    {
      name: "injectAtStart",
      value: false,
      type: "boolean",
      description: "Запустить при старте потока",
    },
  ],
  http: [
    {
      name: "method",
      value: "GET",
      type: "select",
      description: "HTTP метод",
      options: [
        { label: "GET", value: "GET" },
        { label: "POST", value: "POST" },
        { label: "PUT", value: "PUT" },
        { label: "DELETE", value: "DELETE" },
        { label: "PATCH", value: "PATCH" },
      ],
    },
    {
      name: "url",
      value: "",
      type: "string",
      description: "URL для запроса",
      required: true,
      placeholder: "https://api.example.com/data",
    },
    {
      name: "tls",
      value: false,
      type: "boolean",
      description: "Использовать TLS/SSL",
    },
    {
      name: "proxy",
      value: "",
      type: "string",
      description: "Прокси сервер",
      placeholder: "http://proxy:8080",
    },
    {
      name: "timeout",
      value: 30,
      type: "number",
      description: "Таймаут запроса (сек)",
      min: 1,
      max: 300,
    },
    {
      name: "followRedirects",
      value: true,
      type: "boolean",
      description: "Следовать редиректам",
    },
    {
      name: "rejectUnauthorized",
      value: true,
      type: "boolean",
      description: "Отклонять неавторизованные сертификаты",
    },
  ],
  mqtt: [
    {
      name: "topic",
      value: "",
      type: "string",
      description: "MQTT топик",
      required: true,
      placeholder: "sensor/temperature",
    },
    {
      name: "qos",
      value: 0,
      type: "select",
      description: "Уровень качества обслуживания",
      options: [
        { label: "0 - At most once", value: 0 },
        { label: "1 - At least once", value: 1 },
        { label: "2 - Exactly once", value: 2 },
      ],
    },
    {
      name: "retain",
      value: false,
      type: "boolean",
      description: "Сохранять сообщение",
    },
    {
      name: "payload",
      value: "",
      type: "string",
      description: "Содержимое сообщения",
      placeholder: '{"temperature": 25}',
    },
    {
      name: "payloadType",
      value: "string",
      type: "select",
      description: "Тип payload",
      options: [
        { label: "String", value: "string" },
        { label: "Buffer", value: "buffer" },
        { label: "JSON", value: "json" },
      ],
    },
    {
      name: "broker",
      value: "",
      type: "string",
      description: "MQTT брокер",
      required: true,
      placeholder: "mqtt://localhost:1883",
    },
    {
      name: "username",
      value: "",
      type: "string",
      description: "Имя пользователя",
    },
    {
      name: "password",
      value: "",
      type: "password",
      description: "Пароль",
    },
    {
      name: "clientId",
      value: "",
      type: "string",
      description: "ID клиента",
      placeholder: "node-red-client",
    },
  ],
  function: [
    {
      name: "func",
      value:
        "// Введите JavaScript код\nmsg.payload = msg.payload;\nreturn msg;",
      type: "textarea",
      description: "JavaScript код функции",
      required: true,
    },
    {
      name: "outputCount",
      value: 1,
      type: "number",
      description: "Количество выходов",
      min: 1,
      max: 10,
    },
    {
      name: "timeout",
      value: 0,
      type: "number",
      description: "Таймаут выполнения (мс), 0 = без таймаута",
      min: 0,
      max: 30000,
    },
    {
      name: "stopOnError",
      value: true,
      type: "boolean",
      description: "Остановить поток при ошибке",
    },
  ],
  change: [
    {
      name: "rules",
      value: [],
      type: "json",
      description: "Правила изменения сообщений",
      placeholder:
        '[{"t":"set","p":"payload","pt":"msg","to":"","tot":"","value":""}]',
    },
  ],
  switch: [
    {
      name: "property",
      value: "payload",
      type: "string",
      description: "Свойство для проверки",
      placeholder: "payload",
    },
    {
      name: "propertyType",
      value: "msg",
      type: "select",
      description: "Тип свойства",
      options: [
        { label: "Message", value: "msg" },
        { label: "Flow", value: "flow" },
        { label: "Global", value: "global" },
      ],
    },
    {
      name: "checkAll",
      value: false,
      type: "boolean",
      description: "Проверять все правила",
    },
  ],
  template: [
    {
      name: "template",
      value: "",
      type: "textarea",
      description: "Шаблон для рендеринга",
      required: true,
      placeholder: "{{msg.payload}}",
    },
    {
      name: "syntax",
      value: "mustache",
      type: "select",
      description: "Синтаксис шаблона",
      options: [
        { label: "Mustache", value: "mustache" },
        { label: "JSONata", value: "jsonata" },
      ],
    },
    {
      name: "output",
      value: "str",
      type: "select",
      description: "Тип вывода",
      options: [
        { label: "String", value: "str" },
        { label: "Buffer", value: "bin" },
        { label: "Object", value: "obj" },
      ],
    },
    {
      name: "format",
      value: "none",
      type: "select",
      description: "Формат вывода",
      options: [
        { label: "None", value: "none" },
        { label: "JSON", value: "json" },
        { label: "YAML", value: "yaml" },
        { label: "XML", value: "xml" },
        { label: "HTML", value: "html" },
      ],
    },
  ],
  file: [
    {
      name: "filename",
      value: "",
      type: "string",
      description: "Имя файла",
      required: true,
      placeholder: "/path/to/file.txt",
    },
    {
      name: "filenameType",
      value: "str",
      type: "select",
      description: "Тип имени файла",
      options: [
        { label: "String", value: "str" },
        { label: "JSONata", value: "jsonata" },
      ],
    },
    {
      name: "action",
      value: "read",
      type: "select",
      description: "Действие с файлом",
      options: [
        { label: "Read", value: "read" },
        { label: "Write", value: "write" },
        { label: "Delete", value: "delete" },
        { label: "Append", value: "append" },
      ],
    },
    {
      name: "appendNewline",
      value: true,
      type: "boolean",
      description: "Добавить перенос строки",
    },
    {
      name: "createDir",
      value: false,
      type: "boolean",
      description: "Создать директорию если не существует",
    },
    {
      name: "overwrite",
      value: true,
      type: "boolean",
      description: "Перезаписать существующий файл",
    },
    {
      name: "encoding",
      value: "utf8",
      type: "select",
      description: "Кодировка файла",
      options: [
        { label: "UTF-8", value: "utf8" },
        { label: "Base64", value: "base64" },
        { label: "Hex", value: "hex" },
      ],
    },
  ],
  debug: [
    {
      name: "active",
      value: true,
      type: "boolean",
      description: "Активен",
    },
    {
      name: "complete",
      value: false,
      type: "boolean",
      description: "Полное сообщение",
    },
    {
      name: "console",
      value: false,
      type: "boolean",
      description: "Вывести в консоль",
    },
    {
      name: "tosidebar",
      value: true,
      type: "boolean",
      description: "Показать в боковой панели",
    },
    {
      name: "toconsole",
      value: false,
      type: "boolean",
      description: "Вывести в консоль браузера",
    },
    {
      name: "targetType",
      value: "msg",
      type: "select",
      description: "Тип цели",
      options: [
        { label: "Message", value: "msg" },
        { label: "Flow", value: "flow" },
        { label: "Global", value: "global" },
      ],
    },
    {
      name: "statusVal",
      value: "",
      type: "string",
      description: "Значение статуса",
      placeholder: "payload",
    },
    {
      name: "statusType",
      value: "auto",
      type: "select",
      description: "Тип статуса",
      options: [
        { label: "Auto", value: "auto" },
        { label: "Text", value: "text" },
      ],
    },
  ],
  delay: [
    {
      name: "pauseType",
      value: "delay",
      type: "select",
      description: "Тип задержки",
      options: [
        { label: "Delay", value: "delay" },
        { label: "Rate", value: "rate" },
        { label: "Rate Limit", value: "rateLimit" },
      ],
    },
    {
      name: "timeout",
      value: 5,
      type: "number",
      description: "Время задержки (сек)",
      min: 0,
      max: 3600,
    },
    {
      name: "rate",
      value: 1,
      type: "number",
      description: "Частота (сообщений в единицу времени)",
      min: 1,
      max: 1000,
    },
    {
      name: "rateUnits",
      value: "second",
      type: "select",
      description: "Единицы частоты",
      options: [
        { label: "Second", value: "second" },
        { label: "Minute", value: "minute" },
        { label: "Hour", value: "hour" },
      ],
    },
    {
      name: "drop",
      value: false,
      type: "boolean",
      description: "Отбрасывать лишние сообщения",
    },
  ],
  json: [
    {
      name: "property",
      value: "payload",
      type: "string",
      description: "Свойство для обработки",
      placeholder: "payload",
    },
    {
      name: "propertyType",
      value: "msg",
      type: "select",
      description: "Тип свойства",
      options: [
        { label: "Message", value: "msg" },
        { label: "Flow", value: "flow" },
        { label: "Global", value: "global" },
      ],
    },
    {
      name: "action",
      value: "parse",
      type: "select",
      description: "Действие",
      options: [
        { label: "Parse", value: "parse" },
        { label: "Stringify", value: "stringify" },
      ],
    },
    {
      name: "pretty",
      value: false,
      type: "boolean",
      description: "Красивый вывод JSON",
    },
  ],
  split: [
    {
      name: "mode",
      value: "split",
      type: "select",
      description: "Режим работы",
      options: [
        { label: "Split", value: "split" },
        { label: "Join", value: "join" },
      ],
    },
    {
      name: "splitType",
      value: "length",
      type: "select",
      description: "Тип разделения",
      options: [
        { label: "Length", value: "length" },
        { label: "Count", value: "count" },
        { label: "Regex", value: "regex" },
        { label: "JSONata", value: "jsonata" },
      ],
    },
    {
      name: "splitLength",
      value: 100,
      type: "number",
      description: "Длина части",
      min: 1,
      max: 10000,
    },
    {
      name: "splitCount",
      value: 10,
      type: "number",
      description: "Количество частей",
      min: 1,
      max: 100,
    },
  ],
  serial: [
    {
      name: "port",
      value: "",
      type: "string",
      description: "COM порт",
      required: true,
      placeholder: "COM1",
    },
    {
      name: "baudRate",
      value: 9600,
      type: "number",
      description: "Скорость передачи",
      options: [
        { label: "9600", value: 9600 },
        { label: "19200", value: 19200 },
        { label: "38400", value: 38400 },
        { label: "57600", value: 57600 },
        { label: "115200", value: 115200 },
      ],
    },
    {
      name: "dataBits",
      value: 8,
      type: "select",
      description: "Биты данных",
      options: [
        { label: "7", value: 7 },
        { label: "8", value: 8 },
      ],
    },
    {
      name: "stopBits",
      value: 1,
      type: "select",
      description: "Стоп-биты",
      options: [
        { label: "1", value: 1 },
        { label: "2", value: 2 },
      ],
    },
    {
      name: "parity",
      value: "none",
      type: "select",
      description: "Четность",
      options: [
        { label: "None", value: "none" },
        { label: "Even", value: "even" },
        { label: "Odd", value: "odd" },
      ],
    },
  ],
  rbe: [
    {
      name: "property",
      value: "payload",
      type: "string",
      description: "Свойство для проверки",
      placeholder: "payload",
    },
    {
      name: "propertyType",
      value: "msg",
      type: "select",
      description: "Тип свойства",
      options: [
        { label: "Message", value: "msg" },
        { label: "Flow", value: "flow" },
        { label: "Global", value: "global" },
      ],
    },
    {
      name: "mode",
      value: "block",
      type: "select",
      description: "Режим работы",
      options: [
        { label: "Block", value: "block" },
        { label: "Allow", value: "allow" },
      ],
    },
  ],
  link: [
    {
      name: "linkType",
      value: "in",
      type: "select",
      description: "Тип связи",
      options: [
        { label: "Input", value: "in" },
        { label: "Output", value: "out" },
      ],
    },
    {
      name: "target",
      value: "",
      type: "string",
      description: "Целевой узел",
      required: true,
      placeholder: "node-id",
    },
    {
      name: "targetType",
      value: "node",
      type: "select",
      description: "Тип цели",
      options: [
        { label: "Node", value: "node" },
        { label: "Tab", value: "tab" },
      ],
    },
  ],
  // Системные узлы
  server: [
    {
      name: "host",
      value: "localhost",
      type: "string",
      description: "Хост сервера",
      placeholder: "localhost",
    },
    {
      name: "port",
      value: 8080,
      type: "number",
      description: "Порт сервера",
      min: 1,
      max: 65535,
    },
    {
      name: "protocol",
      value: "http",
      type: "select",
      description: "Протокол",
      options: [
        { label: "HTTP", value: "http" },
        { label: "HTTPS", value: "https" },
        { label: "TCP", value: "tcp" },
        { label: "UDP", value: "udp" },
      ],
    },
  ],
  database: [
    {
      name: "type",
      value: "mysql",
      type: "select",
      description: "Тип базы данных",
      options: [
        { label: "MySQL", value: "mysql" },
        { label: "PostgreSQL", value: "postgresql" },
        { label: "MongoDB", value: "mongodb" },
        { label: "Redis", value: "redis" },
      ],
    },
    {
      name: "host",
      value: "localhost",
      type: "string",
      description: "Хост БД",
      placeholder: "localhost",
    },
    {
      name: "port",
      value: 3306,
      type: "number",
      description: "Порт БД",
      min: 1,
      max: 65535,
    },
    {
      name: "database",
      value: "",
      type: "string",
      description: "Имя базы данных",
      required: true,
      placeholder: "mydb",
    },
  ],
  network: [
    {
      name: "interface",
      value: "eth0",
      type: "string",
      description: "Сетевой интерфейс",
      placeholder: "eth0",
    },
    {
      name: "ip",
      value: "",
      type: "string",
      description: "IP адрес",
      placeholder: "192.168.1.1",
    },
    {
      name: "subnet",
      value: "",
      type: "string",
      description: "Подсеть",
      placeholder: "255.255.255.0",
    },
    {
      name: "gateway",
      value: "",
      type: "string",
      description: "Шлюз",
      placeholder: "192.168.1.1",
    },
  ],
  service: [
    {
      name: "serviceName",
      value: "",
      type: "string",
      description: "Имя сервиса",
      required: true,
      placeholder: "my-service",
    },
    {
      name: "status",
      value: "running",
      type: "select",
      description: "Статус сервиса",
      options: [
        { label: "Running", value: "running" },
        { label: "Stopped", value: "stopped" },
        { label: "Starting", value: "starting" },
        { label: "Stopping", value: "stopping" },
      ],
    },
    {
      name: "autoStart",
      value: true,
      type: "boolean",
      description: "Автозапуск",
    },
  ],
  api: [
    {
      name: "endpoint",
      value: "",
      type: "string",
      description: "API endpoint",
      required: true,
      placeholder: "/api/v1/data",
    },
    {
      name: "method",
      value: "GET",
      type: "select",
      description: "HTTP метод",
      options: [
        { label: "GET", value: "GET" },
        { label: "POST", value: "POST" },
        { label: "PUT", value: "PUT" },
        { label: "DELETE", value: "DELETE" },
      ],
    },
    {
      name: "auth",
      value: "none",
      type: "select",
      description: "Тип аутентификации",
      options: [
        { label: "None", value: "none" },
        { label: "Basic", value: "basic" },
        { label: "Bearer", value: "bearer" },
        { label: "API Key", value: "apikey" },
      ],
    },
  ],
  storage: [
    {
      name: "type",
      value: "local",
      type: "select",
      description: "Тип хранилища",
      options: [
        { label: "Local", value: "local" },
        { label: "S3", value: "s3" },
        { label: "Azure", value: "azure" },
        { label: "Google Cloud", value: "gcp" },
      ],
    },
    {
      name: "path",
      value: "",
      type: "string",
      description: "Путь к хранилищу",
      required: true,
      placeholder: "/data",
    },
    {
      name: "capacity",
      value: 1000,
      type: "number",
      description: "Емкость (GB)",
      min: 1,
      max: 10000,
    },
  ],
};

// Получить схему свойств для типа узла
export function getNodePropertiesSchema(nodeType: NodeType): NodeProperty[] {
  return NODE_PROPERTIES_SCHEMAS[nodeType] || [];
}

// Создать свойства по умолчанию для типа узла
export function createDefaultNodeProperties(
  nodeType: NodeType
): Record<string, any> {
  const schema = getNodePropertiesSchema(nodeType);
  const properties: Record<string, any> = {};

  schema.forEach((prop) => {
    properties[prop.name] = prop.value;
  });

  return properties;
}

// Валидация свойств узла
export function validateNodeProperties(
  nodeType: NodeType,
  properties: Record<string, any>
): string[] {
  const schema = getNodePropertiesSchema(nodeType);
  const errors: string[] = [];

  schema.forEach((prop) => {
    if (
      prop.required &&
      (!properties[prop.name] || properties[prop.name] === "")
    ) {
      errors.push(`Поле "${prop.name}" обязательно для заполнения`);
    }

    if (prop.type === "number" && properties[prop.name] !== undefined) {
      const value = Number(properties[prop.name]);
      if (isNaN(value)) {
        errors.push(`Поле "${prop.name}" должно быть числом`);
      } else if (prop.min !== undefined && value < prop.min) {
        errors.push(`Поле "${prop.name}" должно быть не менее ${prop.min}`);
      } else if (prop.max !== undefined && value > prop.max) {
        errors.push(`Поле "${prop.name}" должно быть не более ${prop.max}`);
      }
    }
  });

  return errors;
}
