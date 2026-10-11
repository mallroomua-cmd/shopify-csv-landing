'use client';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="py-24 text-center">
      <h1 className="font-display text-4xl">Щось пішло не так</h1>
      <button type="button" onClick={reset} className="btn mt-8">Спробувати ще раз</button>
    </div>
  );
}
