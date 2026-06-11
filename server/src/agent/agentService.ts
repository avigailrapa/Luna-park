import { Request } from 'express';
import Ride from '../models/Ride';
import { isShabbatOrHoliday } from '../middleware/shabbat';
import { findRideByName, suggestRideNames } from './rideMatcher';
import { runHandler, type ExpressHandler } from './runHandler';
import type { IRide } from '../models/Ride';
import { getToolById, getToolsForRole, getUserRole } from './tools';
import { parseMessage } from './intentParser';
import type { Intent } from './intentParser';
import * as authController from '../controllers/authController';
import * as orderController from '../controllers/orderController';
import * as rideController from '../controllers/rideController';
import * as couponController from '../controllers/couponController';
import type { AuthUser } from '../types';

interface ToolResult {
  status: number;
  data: Record<string, unknown>;
  clientAction?: Record<string, unknown>;
}

interface FormattedResult {
  success: boolean;
  message: string;
  status?: number;
  data?: unknown;
  clientAction?: Record<string, unknown>;
  tool?: string;
}

function buildReq(user: AuthUser | null, params: Record<string, unknown> = {}, body: Record<string, unknown> = {}): Request {
  const req = {
    user: user || null,
    params: {} as Record<string, string>,
    query: {} as Record<string, string>,
    body: { ...body },
    headers: {},
  } as Request;

  for (const [key, value] of Object.entries(params)) {
    if (key === 'code' && ['validate_coupon'].includes(String(body._tool))) {
      req.query.code = String(value);
    } else if (['id', 'code'].includes(key)) {
      req.params[key] = String(value);
    } else if (key === 'status') {
      req.query.status = String(value);
    } else {
      req.body[key] = value;
    }
  }

  return req;
}

async function executeHealth(): Promise<ToolResult> {
  return { status: 200, data: { status: 'ok', service: 'luna-park-api' } };
}

export async function executeTool(
  toolId: string,
  params: Record<string, unknown>,
  user: AuthUser | null,
): Promise<ToolResult> {
  const tool = getToolById(toolId);
  if (!tool) {
    return { status: 400, data: { message: `פעולה לא מוכרת: ${toolId}` } };
  }

  const role = getUserRole(user);
  if (!tool.roles.includes(role)) {
    return {
      status: 403,
      data: {
        message:
          role === 'guest' ? 'נדרשת התחברות לפעולה זו' : 'אין לך הרשאה לפעולה זו',
      },
    };
  }

  if (toolId === 'health') {
    return executeHealth();
  }

  if (toolId === 'pick_ride_for_cart') {
    const rides = await Ride.find({ status: 'active' }).sort({ name: 1 }).select('name price status');
    const list = rides.map((ride) => ({
      _id: ride._id.toString(),
      name: ride.name,
      price: ride.price,
    }));
    return {
      status: 200,
      data: { rides: list },
      clientAction: { type: 'show_ride_picker', rides: list },
    };
  }

  if (toolId === 'add_to_cart') {
    const ride = await findRideByName(String(params.rideName || ''));
    if (!ride) {
      const suggestions = await suggestRideNames(6);
      return {
        status: 404,
        data: {
          message: `לא מצאתי מתקן בשם "${params.rideName}".\nאולי התכוונת ל: ${suggestions.join(', ')}`,
        },
      };
    }
    return {
      status: 200,
      data: { ride },
      clientAction: { type: 'cart_add', ride },
    };
  }

  if (toolId === 'remove_from_cart') {
    const ride = await findRideByName(String(params.rideName || ''));
    if (!ride) {
      return { status: 404, data: { message: `לא מצאתי מתקן בשם "${params.rideName}"` } };
    }
    return {
      status: 200,
      data: { ride },
      clientAction: { type: 'cart_remove', rideId: ride._id.toString(), rideName: ride.name },
    };
  }

  if (['POST', 'PUT', 'DELETE'].includes(tool.method)) {
    const blocked = await isShabbatOrHoliday();
    if (blocked) {
      return {
        status: 403,
        data: { message: 'הפעולה אינה זמינה בשבת ובחגים. נסו שוב לאחר צאת השבת/ החג.' },
      };
    }
  }

  const bodyParams = { ...params };
  const pathParams: Record<string, unknown> = {};

  if (params.id) {
    pathParams.id = params.id;
    delete bodyParams.id;
  }
  if (params.code && ['validate_coupon', 'validate_ticket'].includes(toolId)) {
    pathParams.code = params.code;
    delete bodyParams.code;
  }

  const req = buildReq(user, pathParams, bodyParams);

  if (toolId === 'validate_coupon') {
    req.query.code = String(params.code);
  }

  const handlers: Record<string, ExpressHandler> = {
    register: authController.register,
    login: authController.login,
    create_order: orderController.createOrder,
    my_orders: orderController.getMyOrders,
    list_orders: orderController.getAllOrders,
    validate_ticket: orderController.validateTicket,
    order_barcode: orderController.getOrderBarcode,
    list_rides: rideController.getRides,
    get_ride: rideController.getRideById,
    validate_coupon: couponController.validateCouponCode,
    list_coupons: couponController.getCoupons,
    create_coupon: couponController.createCoupon,
    update_coupon: couponController.updateCoupon,
    delete_coupon: couponController.deleteCoupon,
    create_ride: rideController.createRide,
    update_ride: rideController.updateRide,
    delete_ride: rideController.deleteRide,
  };

  if (toolId === 'create_ride' && !req.files) {
    const ride = await Ride.create({
      name: String(params.name),
      description: String(params.description || ''),
      price: Number(params.price),
      category: (params.category as IRide['category']) || 'family',
      capacity: params.capacity ? Number(params.capacity) : 1,
      minimumHeight: params.minimumHeight ? Number(params.minimumHeight) : 0,
      imageUrl: String(params.imageUrl || ''),
      status: 'active',
    });
    return { status: 201, data: { ride, message: 'המתקן נוצר בהצלחה' } };
  }

  if (toolId === 'update_ride' && params.id) {
    const payload = { ...params };
    delete payload.id;
    const ride = await Ride.findByIdAndUpdate(params.id, payload, { new: true, runValidators: true });
    if (!ride) return { status: 404, data: { message: 'המתקן לא נמצא' } };
    return { status: 200, data: { ride, message: 'המתקן עודכן' } };
  }

  if (toolId === 'get_ride' && params.id) {
    req.params.id = String(params.id);
  }

  const handler = handlers[toolId];
  if (!handler) {
    return { status: 400, data: { message: 'הפעולה לא ממומשת' } };
  }

  return runHandler(handler, req) as Promise<ToolResult>;
}

function formatToolResult(toolId: string, result: ToolResult): FormattedResult {
  const { status, data, clientAction } = result;

  if (status >= 400) {
    return {
      success: false,
      message:
        (data?.message as string) || (data?.valid === false ? (data.message as string) : 'הפעולה נכשלה'),
      status,
      data,
    };
  }

  if (toolId === 'list_rides' && data?.rides) {
    const rides = data.rides as Array<{ name: string; price: number }>;
    const lines = rides.slice(0, 12).map((r) => `• ${r.name} — ₪${r.price}`);
    return {
      success: true,
      message: `נמצאו ${rides.length} מתקנים:\n${lines.join('\n')}`,
      status,
      data,
    };
  }

  if (toolId === 'my_orders' && data?.orders) {
    const orders = data.orders as Array<{ rideId?: { name?: string }; ticketType: string; finalPrice: number }>;
    if (!orders.length) {
      return { success: true, message: 'אין הזמנות עדיין.', status, data };
    }
    const lines = orders.map((o) => {
      const label = o.rideId?.name || o.ticketType;
      return `• ${label} — ₪${o.finalPrice}`;
    });
    return {
      success: true,
      message: `יש לך ${orders.length} הזמנות:\n${lines.join('\n')}`,
      status,
      data,
    };
  }

  if (toolId === 'create_order') {
    return {
      success: true,
      message: (data?.message as string) || 'ההזמנה נוצרה בהצלחה!',
      status,
      data,
    };
  }

  if (toolId === 'validate_coupon') {
    return {
      success: true,
      message: (data?.message as string) || 'הקופון תקין',
      status,
      data,
    };
  }

  if (toolId === 'login' || toolId === 'register') {
    return {
      success: true,
      message: toolId === 'login' ? 'התחברת בהצלחה! שמרי את ה-JWT מהתשובה.' : 'נרשמת בהצלחה!',
      status,
      data,
    };
  }

  if (toolId === 'health') {
    return { success: true, message: 'השרת פעיל ותקין ✓', status, data };
  }

  if (toolId === 'pick_ride_for_cart' && data?.rides) {
    return {
      success: true,
      message: 'בחרי מתקן להוספה לסל 👇',
      status,
      data,
      clientAction: result.clientAction,
    };
  }

  if (toolId === 'add_to_cart' && data?.ride) {
    const ride = data.ride as { name: string; price: number };
    return {
      success: true,
      message: `הוספתי את "${ride.name}" לסל 🛒 (₪${ride.price})`,
      status,
      data,
      clientAction: result.clientAction,
    };
  }

  if (toolId === 'remove_from_cart' && data?.ride) {
    const ride = data.ride as { name: string };
    return {
      success: true,
      message: `הסרתי את "${ride.name}" מהסל`,
      status,
      data,
      clientAction: result.clientAction,
    };
  }

  return {
    success: true,
    message: (data?.message as string) || 'הפעולה בוצעה בהצלחה',
    status,
    data,
    clientAction: result.clientAction,
  };
}

function buildHelpMessage(user: AuthUser | null): FormattedResult {
  const tools = getToolsForRole(user);
  const lines = tools.map((t) => `• ${t.id} (${t.method}) — ${t.description}`);
  return {
    success: true,
    message: `שלום! אני סוכן לונה פארק. אפשר לבקש בעברית או לשלוח JSON.\n\nדוגמאות:\n• "הצג מתקנים"\n• "הוסף מתקן לסל"\n• "מה בסל"\n• "ההזמנות שלי"\n• "הזמן כרטיס יום מלא ל-2026-06-15"\n• "בדוק קופון SUMMER20"\n\nפעולות זמינות לך:\n${lines.join('\n')}`,
    data: { tools },
  };
}

function buildMissingMessage(intent: Extract<Intent, { type: 'missing' }>): FormattedResult {
  const tool = getToolById(intent.tool);
  const names = intent.missing?.join(', ') || 'פרמטרים';
  let hint = `חסרים: ${names}.`;
  if (intent.tool === 'create_order') {
    hint += '\nדוגמה: הזמן כרטיס יום מלא ל-2026-06-15';
  }
  if (intent.tool === 'validate_coupon') {
    hint += '\nדוגמה: בדוק קופון SUMMER20';
  }
  if (intent.tool === 'add_to_cart') {
    hint += '\nדוגמה: הוסף אדרנלין לסל';
  }
  if (tool) {
    hint += `\nפעולה: ${tool.description}`;
  }
  return { success: false, message: hint, data: { partial: intent.partial || null } };
}

export async function handleChat(message: string, user: AuthUser | null): Promise<FormattedResult> {
  const intent = parseMessage(message);

  if (intent.type === 'help') {
    return buildHelpMessage(user);
  }

  if (intent.type === 'client') {
    return {
      success: true,
      message: 'מבצע פעולה מקומית...',
      clientAction: { type: intent.action },
    };
  }

  if (intent.type === 'missing') {
    return buildMissingMessage(intent);
  }

  if (intent.type === 'unknown') {
    return {
      success: false,
      message: 'לא הבנתי. נסי: "הוסף אדרנלין לסל", "הצג מתקנים", או "עזרה"',
    };
  }

  const result = await executeTool(intent.tool, intent.params || {}, user);
  const formatted = formatToolResult(intent.tool, result);
  return { ...formatted, tool: intent.tool };
}

export async function handleExecute(
  tool: string,
  params: Record<string, unknown>,
  user: AuthUser | null,
): Promise<FormattedResult & { status?: number }> {
  const result = await executeTool(tool, params || {}, user);
  const formatted = formatToolResult(tool, result);
  return { ...formatted, tool, status: result.status };
}

export { getToolsForRole };
