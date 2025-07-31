// Test utilities for HyperLiquid API integration

interface OrderPayload {
  action?: {
    type?: string;
    orders?: unknown[];
    grouping?: string;
  };
  nonce?: number;
  signature?: {
    r?: string;
    s?: string;
    v?: number;
  };
}

export function validateOrderStructure(orderPayload: OrderPayload): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check required fields
  if (!orderPayload.action) errors.push("Missing action field");
  if (!orderPayload.nonce) errors.push("Missing nonce field");
  if (!orderPayload.signature) errors.push("Missing signature field");
  
  // Check action structure
  if (orderPayload.action) {
    if (!orderPayload.action.type) errors.push("Missing action.type");
    if (!orderPayload.action.orders) errors.push("Missing action.orders");
    if (!orderPayload.action.grouping) errors.push("Missing action.grouping");
    
    // Check orders array
    if (orderPayload.action.orders && Array.isArray(orderPayload.action.orders)) {
      orderPayload.action.orders.forEach((order: unknown, index: number) => {
        const o = order as Record<string, unknown>;
        if (typeof o.a !== 'number') errors.push(`Order ${index}: asset (a) must be number`);
        if (typeof o.b !== 'boolean') errors.push(`Order ${index}: isBuy (b) must be boolean`);
        if (typeof o.s !== 'string') errors.push(`Order ${index}: size (s) must be string`);
        if (typeof o.p !== 'string') errors.push(`Order ${index}: price (p) must be string`);
        if (typeof o.r !== 'boolean') errors.push(`Order ${index}: reduceOnly (r) must be boolean`);
        if (!o.t) errors.push(`Order ${index}: missing type (t) field`);
      });
    }
  }
  
  // Check signature structure
  if (orderPayload.signature) {
    if (!orderPayload.signature.r) errors.push("Missing signature.r");
    if (!orderPayload.signature.s) errors.push("Missing signature.s");
    if (typeof orderPayload.signature.v !== 'number') errors.push("Missing or invalid signature.v");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function logOrderDetails(orderPayload: OrderPayload) {
      
  const validation = validateOrderStructure(orderPayload);
  if (validation.isValid) {
      } else {
      }
  
  // Show specific details
  if (orderPayload.action?.orders?.[0]) {
    const order = orderPayload.action.orders[0] as Record<string, unknown>;
      }
}
