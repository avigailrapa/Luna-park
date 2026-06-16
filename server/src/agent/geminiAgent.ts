import {
  GoogleGenerativeAI,
  type Content,
  type Part,
  type ChatSession,
} from '@google/generative-ai';
import { geminiApiKey, geminiModel } from '../config/env';
import { executeTool, formatToolResult, type FormattedResult } from './agentService';
import { getUserRole } from './tools';
import { toGeminiFunctionDeclarations } from './geminiTools';
import type { AuthUser } from '../types';

const MAX_TOOL_ROUNDS = 5;
const MAX_HISTORY_TURNS = 12;
const MAX_RETRIES = 2;

export interface ChatHistoryTurn {
  role: 'user' | 'agent';
  text: string;
}

function buildHistory(turns: ChatHistoryTurn[] | undefined): Content[] {
  if (!turns?.length) return [];
  // Gemini history must start with a 'user' turn; drop leading agent turns.
  const trimmed = turns.slice(-MAX_HISTORY_TURNS);
  const history: Content[] = [];
  for (const turn of trimmed) {
    const text = (turn.text || '').trim();
    if (!text) continue;
    const role = turn.role === 'user' ? 'user' : 'model';
    if (!history.length && role !== 'user') continue;
    history.push({ role, parts: [{ text }] });
  }
  while (history.length && history[0].role !== 'user') {
    history.shift();
  }
  return history;
}

function isRateLimitError(err: unknown): boolean {
  const text = String(err);
  return text.includes('429') || text.includes('Too Many Requests') || text.includes('RESOURCE_EXHAUSTED');
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function sendMessageWithRetry(
  chat: ChatSession,
  content: string | Part[],
): Promise<Awaited<ReturnType<ChatSession['sendMessage']>>['response']> {
  let attempt = 0;
  for (;;) {
    try {
      const result = await chat.sendMessage(content);
      return result.response;
    } catch (err) {
      if (isRateLimitError(err) && attempt < MAX_RETRIES) {
        attempt += 1;
        await sleep(1500 * attempt);
        continue;
      }
      throw err;
    }
  }
}

function buildSystemPrompt(user: AuthUser | null): string {
  const role = getUserRole(user);
  const userLine = user ? `המשתמש מחובר: ${user.email} (${role}).` : 'המשתמש אורח (לא מחובר).';

  const adminCrud =
    role === 'admin'
      ? `
CRUD מתקנים (admin בלבד):
- list_rides / get_ride — קריאה (get_ride עם rideName או id)
- create_ride — יצירה (name, price חובה)
- update_ride — עדכון לפי rideName (לא צריך id!): למשל { rideName: "מגלשת המים הכחולה", price: 40 }
- delete_ride — מחיקה לפי rideName או id

CRUD קופונים (admin):
- list_coupons, create_coupon, update_coupon (code + שדות), delete_coupon (code)
- list_orders, validate_ticket`
      : '';

  return `אתה סוכן לונה פארק תל אביב — עוזר בעברית.

${userLine}

כללים:
- ענה תמיד בעברית, בקצרה וידידותית.
- השתמש רק בכלים (functions) שסופקו.
- לסל: cart_show, cart_clear, pick_ride_for_cart, add_to_cart, remove_from_cart.
- add_to_cart דורש customer/admin.
- list_rides להצגת מתקנים.
- my_orders (customer), validate_coupon עם code.
- הסוכן אינו מבצע תשלום/הזמנה בעצמו. כשהמשתמש רוצה לקנות/להזמין/לשלם — קרא לכלי checkout שמעביר לדף התשלום:
  • כרטיס יום מלא או שעתי → checkout עם ticketType=full_day או hourly (מעביר לדף ההזמנה, שם משלמים). לא צריך סל לזה.
  • תשלום על מתקנים שבסל → checkout בלי ticketType (מעביר לדף הסל). להוספת מתקנים השתמש קודם ב-add_to_cart.
${adminCrud}
- לעדכון מחיר מתקן: update_ride עם rideName + price — אל תבקש id מהמשתמש.
- אם חסר מידע — שאל בעברית.`;
}

function sanitizeArgs(args: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!args) return {};
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(args)) {
    if (value !== undefined && value !== null) {
      clean[key] = value;
    }
  }
  return clean;
}

export async function runGeminiAgent(
  message: string,
  user: AuthUser | null,
  history?: ChatHistoryTurn[],
): Promise<FormattedResult> {
  if (!geminiApiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const genAI = new GoogleGenerativeAI(geminiApiKey);
  const declarations = toGeminiFunctionDeclarations(user);

  const model = genAI.getGenerativeModel({
    model: geminiModel,
    systemInstruction: buildSystemPrompt(user),
    tools: [{ functionDeclarations: declarations }],
  });

  const chat = model.startChat({ history: buildHistory(history) });
  let response = await sendMessageWithRetry(chat, message);

  let lastFormatted: FormattedResult | null = null;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const calls = response.functionCalls();
    if (!calls?.length) break;

    const functionResponses: Part[] = [];

    for (const call of calls) {
      const toolId = call.name;
      const params = sanitizeArgs(call.args as Record<string, unknown>);
      const result = await executeTool(toolId, params, user);
      const formatted = formatToolResult(toolId, result);
      lastFormatted = { ...formatted, tool: toolId };

      functionResponses.push({
        functionResponse: {
          name: toolId,
          response: {
            success: result.status < 400,
            status: result.status,
            message: formatted.message,
            data: result.data,
          },
        },
      });
    }

    if (lastFormatted && (!lastFormatted.success || lastFormatted.clientAction)) {
      return lastFormatted;
    }

    response = await sendMessageWithRetry(chat, functionResponses);
  }

  if (lastFormatted) {
    const finalText = response.text()?.trim();
    if (finalText) {
      return { ...lastFormatted, message: finalText };
    }
    return lastFormatted;
  }

  const text = response.text()?.trim();
  if (text) {
    return { success: true, message: text };
  }

  return {
    success: false,
    message: 'לא הבנתי. נסי: "הצג מתקנים", "הוסף לסל", או "עזרה"',
  };
}

