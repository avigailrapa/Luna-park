const Ride = require('../models/Ride');
const { isShabbatOrHoliday } = require('../middleware/shabbat');
const { findRideByName, suggestRideNames } = require('./rideMatcher');
const { runHandler } = require('./runHandler');
const { getToolById, getToolsForRole, getUserRole } = require('./tools');
const { parseMessage } = require('./intentParser');

const authController = require('../controllers/authController');
const orderController = require('../controllers/orderController');
const rideController = require('../controllers/rideController');
const couponController = require('../controllers/couponController');

function buildReq(user, params = {}, body = {}) {
  const req = {
    user: user || null,
    params: {},
    query: {},
    body: { ...body },
    headers: {},
  };

  for (const [key, value] of Object.entries(params)) {
    if (key === 'code' && ['validate_coupon'].includes(body._tool)) {
      req.query.code = value;
    } else if (['id', 'code'].includes(key)) {
      req.params[key] = value;
    } else if (key === 'status') {
      req.query.status = value;
    } else {
      req.body[key] = value;
    }
  }

  return req;
}

async function executeHealth() {
  return { status: 200, data: { status: 'ok', service: 'luna-park-api' } };
}

async function executeTool(toolId, params, user) {
  const tool = getToolById(toolId);
  if (!tool) {
    return { status: 400, data: { message: `פעולה לא מוכרת: ${toolId}` } };
  }

  const role = getUserRole(user);
  if (!tool.roles.includes(role)) {
    return {
      status: 403,
      data: {
        message: role === 'guest'
          ? 'נדרשת התחברות לפעולה זו'
          : 'אין לך הרשאה לפעולה זו',
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
    const ride = await findRideByName(params.rideName);
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
    const ride = await findRideByName(params.rideName);
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
  const pathParams = {};

  if (params.id) {
    pathParams.id = params.id;
    delete bodyParams.id;
  }
  if (params.code && ['validate_coupon', 'validate_ticket'].includes(toolId)) {
    if (toolId === 'validate_coupon') {
      pathParams.code = params.code;
    } else {
      pathParams.code = params.code;
    }
    delete bodyParams.code;
  }

  const req = buildReq(user, pathParams, bodyParams);

  if (toolId === 'validate_coupon') {
    req.query.code = params.code;
  }

  const handlers = {
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
    req.files = {};
    const ride = await Ride.create({
      name: params.name,
      description: params.description || '',
      price: Number(params.price),
      category: params.category || 'family',
      capacity: params.capacity ? Number(params.capacity) : 1,
      minimumHeight: params.minimumHeight ? Number(params.minimumHeight) : 0,
      imageUrl: params.imageUrl || '',
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
    req.params.id = params.id;
  }

  const handler = handlers[toolId];
  if (!handler) {
    return { status: 400, data: { message: 'הפעולה לא ממומשת' } };
  }

  return runHandler(handler, req);
}

function formatToolResult(toolId, result) {
  const { status, data, clientAction } = result;

  if (status >= 400) {
    return {
      success: false,
      message: data?.message || data?.valid === false ? data.message : 'הפעולה נכשלה',
      status,
      data,
    };
  }

  if (toolId === 'list_rides' && data?.rides) {
    const lines = data.rides.slice(0, 12).map((r) => `• ${r.name} — ₪${r.price}`);
    return {
      success: true,
      message: `נמצאו ${data.rides.length} מתקנים:\n${lines.join('\n')}`,
      status,
      data,
    };
  }

  if (toolId === 'my_orders' && data?.orders) {
    if (!data.orders.length) {
      return { success: true, message: 'אין הזמנות עדיין.', status, data };
    }
    const lines = data.orders.map((o) => {
      const label = o.rideId?.name || o.ticketType;
      return `• ${label} — ₪${o.finalPrice}`;
    });
    return {
      success: true,
      message: `יש לך ${data.orders.length} הזמנות:\n${lines.join('\n')}`,
      status,
      data,
    };
  }

  if (toolId === 'create_order') {
    return {
      success: true,
      message: data?.message || 'ההזמנה נוצרה בהצלחה!',
      status,
      data,
    };
  }

  if (toolId === 'validate_coupon') {
    return {
      success: true,
      message: data?.message || 'הקופון תקין',
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
    return {
      success: true,
      message: `הוספתי את "${data.ride.name}" לסל 🛒 (₪${data.ride.price})`,
      status,
      data,
      clientAction: result.clientAction,
    };
  }

  if (toolId === 'remove_from_cart' && data?.ride) {
    return {
      success: true,
      message: `הסרתי את "${data.ride.name}" מהסל`,
      status,
      data,
      clientAction: result.clientAction,
    };
  }

  return {
    success: true,
    message: data?.message || 'הפעולה בוצעה בהצלחה',
    status,
    data,
    clientAction: result.clientAction,
  };
}

function buildHelpMessage(user) {
  const tools = getToolsForRole(user);
  const lines = tools.map((t) => `• ${t.id} (${t.method}) — ${t.description}`);
  return {
    success: true,
    message: `שלום! אני סוכן לונה פארק. אפשר לבקש בעברית או לשלוח JSON.\n\nדוגמאות:\n• "הצג מתקנים"\n• "הוסף מתקן לסל"\n• "מה בסל"\n• "ההזמנות שלי"\n• "הזמן כרטיס יום מלא ל-2026-06-15"\n• "בדוק קופון SUMMER20"\n\nפעולות זמינות לך:\n${lines.join('\n')}`,
    data: { tools },
  };
}

function buildMissingMessage(intent) {
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

async function handleChat(message, user) {
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

async function handleExecute(tool, params, user) {
  const result = await executeTool(tool, params || {}, user);
  const formatted = formatToolResult(tool, result);
  return { ...formatted, tool };
}

module.exports = { handleChat, handleExecute, getToolsForRole, executeTool };
