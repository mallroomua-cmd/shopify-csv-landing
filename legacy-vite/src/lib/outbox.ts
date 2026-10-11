import { dbGet, dbSet } from './db';
import { OrderDetails } from '../types';

export type OutboxPayload = OrderDetails & { orderId: string; website?: string; elapsedMs?: number };

const OUTBOX_KEY = 'shopify_pending_orders';

type OutboxSubscriber = (count: number) => void;
const subscribers: Set<OutboxSubscriber> = new Set();

export function subscribeToOutbox(cb: OutboxSubscriber): () => void {
  subscribers.add(cb);
  getOutboxPendingCount().then((cnt) => cb(cnt));
  return () => {
    subscribers.delete(cb);
  };
}

async function notifySubscribers(): Promise<void> {
  const cnt = await getOutboxPendingCount();
  subscribers.forEach((cb) => cb(cnt));
}

export async function sendOrderPayload(payload: OutboxPayload): Promise<boolean> {
  try {
    const res = await fetch('/api/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function getOutboxOrders(): Promise<OutboxPayload[]> {
  return (await dbGet<OutboxPayload[]>(OUTBOX_KEY)) || [];
}

export async function getOutboxPendingCount(): Promise<number> {
  const queue = await getOutboxOrders();
  return queue.length;
}

export async function enqueuePendingOrder(payload: OutboxPayload): Promise<void> {
  const queue = await getOutboxOrders();
  if (!queue.some((item) => item.orderId === payload.orderId)) {
    queue.push(payload);
  }
  await dbSet(OUTBOX_KEY, queue);
  await notifySubscribers();
}

export async function removeOutboxOrder(orderId: string): Promise<void> {
  const queue = await getOutboxOrders();
  const next = queue.filter((item) => item.orderId !== orderId);
  await dbSet(OUTBOX_KEY, next);
  await notifySubscribers();
}

export async function clearOutbox(): Promise<void> {
  await dbSet(OUTBOX_KEY, []);
  await notifySubscribers();
}

export async function flushOutboxWithReport(): Promise<{ total: number; sent: number; remaining: number }> {
  const queue = await getOutboxOrders();
  if (!queue.length) return { total: 0, sent: 0, remaining: 0 };

  const remaining: OutboxPayload[] = [];
  let sent = 0;
  for (const order of queue) {
    const ok = await sendOrderPayload(order);
    if (ok) {
      sent++;
    } else {
      remaining.push(order);
    }
  }
  await dbSet(OUTBOX_KEY, remaining);
  await notifySubscribers();
  return { total: queue.length, sent, remaining: remaining.length };
}

export async function flushOutbox(): Promise<void> {
  await flushOutboxWithReport();
}

export function startOutboxWorker(): () => void {
  void flushOutbox();
  const handleOnline = () => {
    void flushOutbox();
  };
  window.addEventListener('online', handleOnline);
  const interval = setInterval(() => {
    void flushOutbox();
  }, 45_000);

  return () => {
    window.removeEventListener('online', handleOnline);
    clearInterval(interval);
  };
}

