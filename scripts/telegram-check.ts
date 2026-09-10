import { formatLeadMessage } from "../app/lib/lead-message.ts";
import { readDevVars } from "./dev-vars.ts";

/**
 * Проверка связки с телеграмом: жив ли токен, какой у чата id и доходит ли
 * до него сообщение.
 *
 * Нужен, потому что настройка бота — единственное место во всём проекте,
 * где ошибиться легко, а узнать об этом можно только от заказчика, который
 * не дождался заявки. Три частые беды: токен скопирован с пробелом,
 * chat_id взят не тот, боту не написали первым — и тогда он не имеет права
 * написать вам.
 *
 * Токен нигде не печатается: в выводе только имя бота и id чатов.
 *
 * Запуск: npm run tg:check
 */

/**
 * Тело вынесено в функцию, чтобы выходить возвратом кода, а не
 * process.exit(): вызов посреди незакрытых сокетов роняет libuv
 * на Windows ассертом уже после того, как всё напечатано.
 */
async function main(): Promise<number> {
  const vars = await readDevVars();
  const token = process.env.TELEGRAM_BOT_TOKEN ?? vars.TELEGRAM_BOT_TOKEN ?? "";
  const chatId = process.env.TELEGRAM_CHAT_ID ?? vars.TELEGRAM_CHAT_ID ?? "";

  if (!token) {
    console.error("Не нашёл TELEGRAM_BOT_TOKEN.");
    console.error("Положите его в .dev.vars в корне проекта:");
    console.error("  TELEGRAM_BOT_TOKEN=123456:AA...");
    console.error("  TELEGRAM_CHAT_ID=123456789");
    return 1;
  }

  if (/\s/.test(token)) {
    console.error(
      "В токене есть пробел или перенос строки — скопировался лишний символ.",
    );
    return 1;
  }

  const api = async (method: string, body?: unknown) => {
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: body ? "POST" : "GET",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    return (await res.json()) as {
      ok: boolean;
      result?: unknown;
      description?: string;
    };
  };

  // 1. Жив ли токен.
  const me = await api("getMe");
  if (!me.ok) {
    console.error("Токен не принят:", me.description);
    console.error("Возьмите новый у @BotFather: /mybots → бот → API Token.");
    return 1;
  }
  const bot = me.result as { username: string; first_name: string };
  console.log(`Бот на связи: ${bot.first_name} (@${bot.username})`);

  // 2. Кто ему писал — оттуда и берётся chat_id.
  const updates = await api("getUpdates");
  const found = new Map<string, string>();
  for (const u of (updates.result ?? []) as Record<string, any>[]) {
    const chat = u.message?.chat ?? u.channel_post?.chat;
    if (!chat) continue;
    const label =
      chat.title ?? [chat.first_name, chat.last_name].filter(Boolean).join(" ");
    found.set(String(chat.id), `${chat.type}, ${label || "без названия"}`);
  }

  if (found.size === 0) {
    console.log("\nБоту ещё никто не писал.");
    console.log(`Откройте https://t.me/${bot.username}, нажмите «Начать»`);
    console.log(
      "и напишите ему любое сообщение, потом запустите проверку снова.",
    );
    console.log("Для группы: добавьте бота в неё и напишите там сообщение.");
  } else {
    console.log("\nЧаты, из которых боту писали:");
    for (const [id, label] of found) {
      const mark = id === chatId ? "  ← этот в .dev.vars" : "";
      console.log(`  ${id}  (${label})${mark}`);
    }
  }

  // 3. Доходит ли сообщение.
  if (!chatId) {
    console.log("\nTELEGRAM_CHAT_ID не задан — тестовую заявку не отправляю.");
    console.log("Возьмите id из списка выше и добавьте в .dev.vars.");
    return 0;
  }

  const text = formatLeadMessage(
    {
      name: "Проверка связи",
      phone: "+375 (29) 123-45-67",
      consent: true,
      source: "home",
      message: "Это тестовая заявка со скрипта npm run tg:check.",
      quizAnswers: { area: "35", place: "flat", heat: "yes", windows: "2" },
    },
    "https://example.by",
  );

  const sent = await api("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
  });

  if (!sent.ok) {
    console.error("\nСообщение не ушло:", sent.description);
    if (sent.description?.includes("chat not found")) {
      console.error("Неверный chat_id — возьмите его из списка выше.");
    }
    if (sent.description?.includes("bot was blocked")) {
      console.error("Бот заблокирован в этом чате — разблокируйте его.");
    }
    if (sent.description?.includes("parse entities")) {
      console.error(
        "Разметка сообщения битая — это уже наша ошибка, скажите мне.",
      );
    }
    return 1;
  }

  console.log(`\nТестовая заявка ушла в чат ${chatId}. Проверьте телеграм.`);

  return 0;
}

process.exitCode = await main();
