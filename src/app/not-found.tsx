import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="py-24 text-center">
      <h1 className="font-display text-5xl">Сторінку не знайдено</h1>
      <p className="mt-4 text-muted">Можливо, товар уже знято з продажу.</p>
      <Link href="/catalog" className="btn mt-8">До каталогу</Link>
    </div>
  );
}
