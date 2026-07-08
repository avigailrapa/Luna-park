import {
  GoogleGenerativeAI,
  FunctionCallingMode,
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
const MAX_RETRIES = 3;

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

function isRetryableError(err: unknown): boolean {
  const text = String(err);
  return (
    text.includes('429') ||
    text.includes('Too Many Requests') ||
    text.includes('RESOURCE_EXHAUSTED') ||
    text.includes('503') ||
    text.includes('Service Unavailable') ||
    text.includes('UNAVAILABLE') ||
    text.includes('high demand')
  );
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
      if (isRetryableError(err) && attempt < MAX_RETRIES) {
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
  const userLine = user
    ? `The user is logged in: ${user.email} (role: ${role}).`
    : 'The user is a guest (not logged in).';

  const adminCrud =
    role === 'admin'
      ? `
Ride CRUD (admin only):
- list_rides / get_ride — read (get_ride takes rideName or id)
- create_ride — create (name, price required)
- update_ride — update by rideName (no id needed!), e.g. { rideName: "מגלשת המים הכחולה", price: 40 }
- delete_ride — delete by rideName or id

Coupon CRUD (admin only):
- list_coupons, create_coupon, update_coupon (code + fields), delete_coupon (code)
- list_orders, validate_ticket`
      : '';

  return `You are the Luna Park Tel Aviv assistant agent.

${userLine}

TOP PRIORITY RULE: Whenever the user's request matches one of the functions available to you, you MUST call that function to get real data — never answer questions about rides, prices, coupons, orders, or cart contents from your own general knowledge or by guessing. Only reply directly (without a function call) for greetings, small talk, or questions no available function can answer.

Other rules:
- Always reply to the user in Hebrew, briefly and in a friendly tone — regardless of the language of these instructions.
- Only use the functions (tools) provided to you.
- Cart actions: cart_show, cart_clear, pick_ride_for_cart, add_to_cart, remove_from_cart.
- add_to_cart requires role customer/admin.
- Use list_rides to answer any question about what rides/attractions exist in the park.
- my_orders (customer only), validate_coupon takes a code.
- The agent never performs payment/booking itself. When the user wants to buy/book/pay, call the checkout tool, which navigates to the payment page:
  • Full-day or hourly ticket → checkout with ticketType=full_day or hourly (goes to the booking page, where payment happens). No cart needed for this.
  • Paying for rides already in the cart → checkout without ticketType (goes to the cart page). Use add_to_cart first to add rides.
${adminCrud}
- To update a ride's price: call update_ride with rideName + price — never ask the user for an id.
- If required information is missing, ask for it in Hebrew.`;
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
    toolConfig: { functionCallingConfig: { mode: FunctionCallingMode.AUTO } },
    generationConfig: { temperature: 0.2 },
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

