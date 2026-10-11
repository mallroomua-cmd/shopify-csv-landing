import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { publicClient } from '@/lib/supabase';

// Админка вызывает после изменения каталога. Доступ — только для пользователей из таблицы admins.
export async function POST(req: Request) {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const db = publicClient();
  if (!token || !db) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { data: user } = await db.auth.getUser(token);
  if (!user.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { data: isAdmin } = await db.rpc('is_admin').setHeader('Authorization', `Bearer ${token}`);
  if (!isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  revalidateTag('products', { expire: 0 });
  return NextResponse.json({ ok: true });
}
