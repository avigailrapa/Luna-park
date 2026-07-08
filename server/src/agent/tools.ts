import type { AgentRole, AuthUser } from '../types';

export interface ToolParam {
  name: string;
  required?: boolean;
  optional?: boolean;
  description?: string;
}

export interface ToolDefinition {
  id: string;
  method: string;
  path: string;
  roles: AgentRole[];
  description: string;
  params: ToolParam[];
}

export const TOOL_CATALOG: ToolDefinition[] = [
  {
    id: 'health',
    method: 'GET',
    path: '/api/health',
    roles: ['guest', 'customer', 'admin'],
    description: 'Checks whether the server is up and healthy.',
    params: [],
  },
  {
    id: 'list_rides',
    method: 'GET',
    path: '/api/rides',
    roles: ['guest', 'customer', 'admin'],
    description:
      'Returns the list of all rides/attractions in the park with their name and price. Call this tool for ANY message about rides/attractions in the park, including short imperative commands, e.g. "מתקנים", "הצג מתקנים", "רשימת מתקנים", "מה יש בפארק", "אילו אטרקציות יש", "מה אפשר לעשות בפארק", "show me the rides" — never answer this from general knowledge, and treat short 2-word commands like "הצג מתקנים" as a direct instruction to call this tool, not as small talk.',
    params: [{ name: 'status', optional: true, description: 'Filter by "active" or "maintenance"' }],
  },
  {
    id: 'get_ride',
    method: 'GET',
    path: '/api/rides/:id',
    roles: ['guest', 'customer', 'admin'],
    description: 'Gets details of a single ride by its name or id.',
    params: [
      { name: 'rideName', optional: true, description: "The ride's name (in Hebrew, as the user typed it)" },
      { name: 'id', optional: true },
    ],
  },
  {
    id: 'pick_ride_for_cart',
    method: 'CLIENT',
    path: 'cart',
    roles: ['guest', 'customer', 'admin'],
    description: 'Shows the user a picker list of rides so they can choose one to add to the cart.',
    params: [],
  },
  {
    id: 'add_to_cart',
    method: 'CLIENT',
    path: 'cart',
    roles: ['customer', 'admin'],
    description:
      'Adds a ride to the shopping cart by name. Call this whenever a logged-in customer/admin asks to add a specific ride to the cart, e.g. "add Adrenaline to my cart".',
    params: [{ name: 'rideName', required: true, description: "The ride's name (in Hebrew, as the user typed it)" }],
  },
  {
    id: 'remove_from_cart',
    method: 'CLIENT',
    path: 'cart',
    roles: ['guest', 'customer', 'admin'],
    description: 'Removes a ride from the shopping cart by name.',
    params: [{ name: 'rideName', required: true, description: "The ride's name (in Hebrew, as the user typed it)" }],
  },
  {
    id: 'cart_show',
    method: 'CLIENT',
    path: 'cart',
    roles: ['guest', 'customer', 'admin'],
    description: 'Shows the current contents of the shopping cart.',
    params: [],
  },
  {
    id: 'cart_clear',
    method: 'CLIENT',
    path: 'cart',
    roles: ['guest', 'customer', 'admin'],
    description: 'Empties the shopping cart.',
    params: [],
  },
  {
    id: 'validate_coupon',
    method: 'GET',
    path: '/api/coupons/validate',
    roles: ['guest', 'customer', 'admin'],
    description:
      'Checks whether a coupon code is valid and returns its discount. Call this whenever the user asks to check/validate a coupon code, e.g. "check coupon SUMMER20".',
    params: [{ name: 'code', required: true, description: 'The coupon code' }],
  },
  {
    id: 'register',
    method: 'POST',
    path: '/api/auth/register',
    roles: ['guest'],
    description: 'Registers a new user account.',
    params: [
      { name: 'name', required: true },
      { name: 'email', required: true },
      { name: 'password', required: true },
    ],
  },
  {
    id: 'login',
    method: 'POST',
    path: '/api/auth/login',
    roles: ['guest'],
    description: 'Logs a user in and returns a JWT.',
    params: [
      { name: 'email', required: true },
      { name: 'password', required: true },
    ],
  },
  {
    id: 'checkout',
    method: 'CLIENT',
    path: 'checkout',
    roles: ['customer', 'admin'],
    description:
      'Navigates the user to the payment page to complete a purchase — the agent never performs the payment itself. For a full-day or hourly ticket pass ticketType=full_day or hourly (goes to the booking page). For paying for rides already in the cart, do not pass ticketType (goes to the cart page).',
    params: [
      { name: 'ticketType', optional: true, description: 'full_day | hourly | ride' },
    ],
  },
  {
    id: 'my_orders',
    method: 'GET',
    path: '/api/orders/my-orders',
    roles: ['customer'],
    description: "Lists the logged-in customer's own past orders.",
    params: [],
  },
  {
    id: 'order_barcode',
    method: 'GET',
    path: '/api/orders/my-orders/:id/barcode',
    roles: ['customer'],
    description: 'Gets the entry barcode image for one of the customer\'s orders.',
    params: [{ name: 'id', required: true }],
  },
  {
    id: 'list_orders',
    method: 'GET',
    path: '/api/orders',
    roles: ['admin'],
    description: 'Lists all orders in the system (admin only).',
    params: [],
  },
  {
    id: 'validate_ticket',
    method: 'GET',
    path: '/api/orders/validate/:code',
    roles: ['admin'],
    description: 'Validates an entry ticket code at the park gate (admin only).',
    params: [{ name: 'code', required: true }],
  },
  {
    id: 'list_coupons',
    method: 'GET',
    path: '/api/coupons',
    roles: ['admin'],
    description: 'Lists all coupons (admin only).',
    params: [],
  },
  {
    id: 'create_coupon',
    method: 'POST',
    path: '/api/coupons',
    roles: ['admin'],
    description: 'Creates a new coupon (admin only).',
    params: [
      { name: 'code', required: true },
      { name: 'discountPercent', required: true },
      { name: 'expiresAt', required: true },
      { name: 'description', optional: true },
      { name: 'usageLimit', optional: true },
    ],
  },
  {
    id: 'update_coupon',
    method: 'PUT',
    path: '/api/coupons/:id',
    roles: ['admin'],
    description: 'Updates a coupon by code or id (admin only).',
    params: [
      { name: 'code', optional: true, description: 'The coupon code, e.g. SUMMER20' },
      { name: 'id', optional: true },
      { name: 'discountPercent', optional: true },
      { name: 'expiresAt', optional: true, description: 'YYYY-MM-DD' },
      { name: 'description', optional: true },
      { name: 'usageLimit', optional: true },
      { name: 'isActive', optional: true, description: 'true | false' },
    ],
  },
  {
    id: 'delete_coupon',
    method: 'DELETE',
    path: '/api/coupons/:id',
    roles: ['admin'],
    description: 'Deletes a coupon by code or id (admin only).',
    params: [
      { name: 'code', optional: true, description: 'The coupon code' },
      { name: 'id', optional: true },
    ],
  },
  {
    id: 'create_ride',
    method: 'POST',
    path: '/api/rides',
    roles: ['admin'],
    description: 'Creates a new ride/attraction (admin only).',
    params: [
      { name: 'name', required: true },
      { name: 'price', required: true },
      { name: 'description', optional: true },
      { name: 'category', optional: true, description: 'thrill | family | kids | water | show' },
      { name: 'capacity', optional: true },
      { name: 'minimumHeight', optional: true },
      { name: 'imageUrl', optional: true },
      { name: 'status', optional: true, description: 'active | maintenance' },
    ],
  },
  {
    id: 'update_ride',
    method: 'PUT',
    path: '/api/rides/:id',
    roles: ['admin'],
    description:
      'Updates a ride by name or id (price, name, status, description, etc). Admin only. Prefer rideName over id — never ask the user for an id.',
    params: [
      { name: 'rideName', optional: true, description: "The ride's name (in Hebrew, as the user typed it), e.g. מגלשת המים הכחולה" },
      { name: 'id', optional: true },
      { name: 'price', optional: true },
      { name: 'name', optional: true },
      { name: 'description', optional: true },
      { name: 'category', optional: true },
      { name: 'capacity', optional: true },
      { name: 'minimumHeight', optional: true },
      { name: 'status', optional: true, description: 'active | maintenance' },
      { name: 'imageUrl', optional: true },
    ],
  },
  {
    id: 'delete_ride',
    method: 'DELETE',
    path: '/api/rides/:id',
    roles: ['admin'],
    description: 'Deletes a ride by name or id (admin only).',
    params: [
      { name: 'rideName', optional: true, description: "The ride's name (in Hebrew, as the user typed it)" },
      { name: 'id', optional: true },
    ],
  },
];

export function getUserRole(user: AuthUser | null): AgentRole {
  if (!user) return 'guest';
  return user.role === 'admin' ? 'admin' : 'customer';
}

export function getToolsForRole(user: AuthUser | null): ToolDefinition[] {
  const role = getUserRole(user);
  return TOOL_CATALOG.filter((tool) => tool.roles.includes(role));
}

export function getToolById(id: string): ToolDefinition | null {
  return TOOL_CATALOG.find((tool) => tool.id === id) || null;
}
