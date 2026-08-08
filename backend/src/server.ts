import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { CONFIG } from './config';
import { db } from './database';
import { User, Order, DeliveryMode, FeeBreakdown } from './models';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Log requests
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── Auth Endpoints ───────────────────────────────────────────────────────────

app.post('/api/auth/register', (req: Request, res: Response) => {
  const { email, name, phoneNumber, role } = req.body;

  if (!email || !name || !phoneNumber || !role) {
    return res.status(400).json({ error: 'All registration fields are required' });
  }

  // Domain whitelist validation
  const emailParts = email.split('@');
  if (emailParts.length !== 2) {
    return res.status(400).json({ error: 'Invalid email address format' });
  }

  const domain = emailParts[1].toLowerCase();
  const isAllowed = CONFIG.allowedDomains.includes(domain);

  if (role !== 'owner' && !isAllowed) {
    return res.status(403).json({
      error: `Registration is restricted to authorized college domains only (${CONFIG.allowedDomains.join(', ')}).`
    });
  }

  const existingUser = db.getUserByEmail(email);
  if (existingUser) {
    return res.status(200).json({ message: 'User already registered', user: existingUser });
  }

  const newUser: User = { email, name, phoneNumber, role };
  db.addUser(newUser);

  console.log(`[AUTH] User registered: ${email} (${name})`);
  return res.status(201).json({ message: 'Registration successful', user: newUser });
});

// ── Orders Endpoints ──────────────────────────────────────────────────────────

// Estimate fees endpoint
app.post('/api/orders/estimate', (req: Request, res: Response) => {
  const { deliveryMode } = req.body as { deliveryMode: DeliveryMode };

  if (deliveryMode !== 'regular' && deliveryMode !== 'instant') {
    return res.status(400).json({ error: 'Invalid delivery mode' });
  }

  const feeConfig = CONFIG.fees[deliveryMode];
  const breakdown: FeeBreakdown = {
    deliveryFee: feeConfig.deliveryFee,
    platformFee: feeConfig.platformFee,
    totalCharges: feeConfig.deliveryFee + feeConfig.platformFee
  };

  return res.json(breakdown);
});

// Create Order
app.post('/api/orders/create', (req: Request, res: Response) => {
  const { userEmail, shopName, items, deliveryMode, selectedSlotId } = req.body;

  if (!userEmail || !shopName || !items || !Array.isArray(items) || items.length === 0 || !deliveryMode) {
    return res.status(400).json({ error: 'Missing required order details' });
  }

  if (deliveryMode !== 'regular' && deliveryMode !== 'instant') {
    return res.status(400).json({ error: 'Invalid delivery mode' });
  }

  // Calculate Subtotal
  const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

  // Compute Fee Breakdown based on mode
  const feeConfig = CONFIG.fees[deliveryMode as DeliveryMode];
  const feeBreakdown: FeeBreakdown = {
    deliveryFee: feeConfig.deliveryFee,
    platformFee: feeConfig.platformFee,
    totalCharges: feeConfig.deliveryFee + feeConfig.platformFee
  };

  // Regular slot specific validation
  let slotLabel = undefined;
  if (deliveryMode === 'regular') {
    if (!selectedSlotId) {
      return res.status(400).json({ error: 'Fulfillment slot selection is required for regular delivery' });
    }
    const slot = CONFIG.deliverySlots.find(s => s.id === selectedSlotId);
    if (!slot) {
      return res.status(400).json({ error: 'Invalid delivery slot selection' });
    }
    slotLabel = slot.label;
  }

  const newOrder: Order = {
    id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
    userEmail,
    shopName,
    items,
    totalAmount: subtotal + feeBreakdown.totalCharges,
    deliveryMode,
    selectedSlotId,
    selectedSlotLabel: slotLabel,
    feeBreakdown,
    deliveryVenue: CONFIG.fixedDeliveryVenue,
    status: 'pending',
    createdAt: Date.now()
  };

  db.addOrder(newOrder);
  console.log(`[ORDER] Created: ${newOrder.id} (${deliveryMode}) for ${userEmail}`);

  return res.status(201).json(newOrder);
});

// Get orders list
app.get('/api/orders', (req: Request, res: Response) => {
  const { email, slotId } = req.query;
  let orders = db.getOrders();

  if (email) {
    orders = orders.filter(o => o.userEmail.toLowerCase() === (email as string).toLowerCase());
  }

  if (slotId) {
    orders = orders.filter(o => o.selectedSlotId === slotId);
  }

  // Sort by newest
  orders.sort((a, b) => b.createdAt - a.createdAt);

  return res.json(orders);
});

// Update Order status
app.post('/api/orders/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['pending', 'preparing', 'on_the_way', 'delivered'].includes(status)) {
    return res.status(400).json({ error: 'Invalid or missing order status' });
  }

  const updatedOrder = db.updateOrderStatus(id, status);
  if (!updatedOrder) {
    return res.status(404).json({ error: 'Order not found' });
  }

  console.log(`[ORDER] Updated: ${id} status to ${status}`);
  return res.json(updatedOrder);
});

// Get configurations (whitelist info, slots info)
app.get('/api/config', (_req: Request, res: Response) => {
  return res.json(CONFIG);
});

app.listen(PORT, () => {
  console.log(`==========================================`);
  console.log(`   VAAYU Hyperlocal Delivery API Server`);
  console.log(`   Running on http://localhost:${PORT}`);
  console.log(`   Whitelisted domains: ${CONFIG.allowedDomains.join(', ')}`);
  console.log(`   Pre-filled Venue: ${CONFIG.fixedDeliveryVenue}`);
  console.log(`==========================================`);
});
