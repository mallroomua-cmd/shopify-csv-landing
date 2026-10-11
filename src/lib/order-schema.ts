import { z } from 'zod';

export const orderInput = z.object({
  name: z.string().trim().min(2, 'Вкажіть ім’я та прізвище').max(100),
  phone: z
    .string()
    .trim()
    .transform((s) => s.replace(/[^\d+]/g, ''))
    .refine((s) => /^(\+?38)?0\d{9}$/.test(s), 'Телефон у форматі 0XX XXX XX XX'),
  email: z.union([z.literal(''), z.email('Некоректний email')]).default(''),
  city: z.string().trim().min(2, 'Вкажіть місто').max(100),
  warehouse: z.string().trim().min(1, 'Вкажіть відділення або поштомат').max(200),
  payment: z.enum(['cash_on_delivery', 'iban']),
  notes: z.string().trim().max(500).default(''),
  items: z
    .array(z.object({ productId: z.string().min(1).max(200), variantId: z.string().min(1).max(200), quantity: z.number().int().min(1).max(99) }))
    .min(1, 'Кошик порожній')
    .max(50),
  attribution: z.record(z.string(), z.string().max(200)).default({}),
  website: z.string().max(0).optional(), // honeypot
});

export type OrderInput = z.infer<typeof orderInput>;
