import Link from 'next/link';
import { legalPages, seller, site } from '@/lib/config';
import { CartLink } from './client-bits';

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="font-display text-xl font-semibold tracking-[0.12em] sm:text-2xl sm:tracking-[0.18em]" aria-label={`${site.name} — на головну`}>
          {site.name}
        </Link>
        <nav aria-label="Основна навігація" className="flex items-center gap-1 text-sm">
          <Link href="/catalog" className="tap px-2 sm:px-3">Каталог</Link>
          <Link href="/dostavka-i-oplata" className="tap hidden px-3 sm:inline-flex">Доставка</Link>
          <Link href="/kontakty" className="tap hidden px-3 sm:inline-flex">Контакти</Link>
          <CartLink />
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-paper-2">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-3">
        <div>
          <p className="font-display text-xl tracking-[0.18em]">{site.name}</p>
          <p className="mt-3 text-sm text-muted">{site.tagline}</p>
        </div>
        <nav aria-label="Інформація для покупців">
          <p className="eyebrow">Покупцям</p>
          <ul className="mt-3 space-y-2 text-sm">
            {legalPages.map((p) => (
              <li key={p.href}><Link href={p.href} className="hover:text-accent">{p.title}</Link></li>
            ))}
          </ul>
        </nav>
        <div className="text-sm">
          <p className="eyebrow">Продавець</p>
          <p className="mt-3">{seller.legalName}</p>
          <p className="text-muted">РНОКПП: {seller.taxId}</p>
          {seller.phone && <p className="mt-2"><a href={`tel:${seller.phone.replace(/\s/g, '')}`}>{seller.phone}</a></p>}
          {seller.email && <p><a href={`mailto:${seller.email}`}>{seller.email}</a></p>}
          <p className="text-muted">{seller.hours}</p>
        </div>
      </div>
      <p className="border-t border-line py-4 text-center text-xs text-muted">© {site.name}</p>
    </footer>
  );
}
