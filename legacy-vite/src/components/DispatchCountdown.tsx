import React, { useState, useEffect } from 'react';
import { Clock, Truck, Zap } from 'lucide-react';

interface DispatchCountdownProps {
  variant?: 'banner' | 'hero' | 'cart';
}

export const DispatchCountdown: React.FC<DispatchCountdownProps> = ({ variant = 'banner' }) => {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    isToday: boolean;
  }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    isToday: true,
  });

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      // Calculate Kyiv time
      const kyivTimeStr = now.toLocaleString('en-US', { timeZone: 'Europe/Kyiv' });
      const kyivDate = new Date(kyivTimeStr);

      const hours = kyivDate.getHours();
      const day = kyivDate.getDay(); // 0 = Sunday

      // Cutoff time: 17:00 Kyiv time (Mon - Sat)
      const cutoffHour = 17;

      if (day !== 0 && hours < cutoffHour) {
        const target = new Date(kyivDate);
        target.setHours(cutoffHour, 0, 0, 0);
        const diffMs = target.getTime() - kyivDate.getTime();

        const h = Math.floor(diffMs / (1000 * 60 * 60));
        const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diffMs % (1000 * 60)) / 1000);

        setTimeLeft({ hours: h, minutes: m, seconds: s, isToday: true });
      } else {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isToday: false });
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatPad = (num: number) => String(num).padStart(2, '0');

  if (variant === 'hero') {
    return (
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-neutral-100 hairline-all text-xs font-mono text-black">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        {timeLeft.isToday ? (
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-black uppercase">ВІДПРАВКА СЬОГОДНІ:</span>
            <span className="font-bold text-dune-ochre tabular-nums tracking-wider bg-black text-white px-1.5 py-0.2">
              {formatPad(timeLeft.hours)}:{formatPad(timeLeft.minutes)}:{formatPad(timeLeft.seconds)}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-neutral-600">
            <Truck className="w-3.5 h-3.5 text-dune-ochre" />
            <span className="font-bold uppercase">ВІДПРАВКА ЗАВТРА ОБ 11:00</span>
          </div>
        )}
      </div>
    );
  }

  if (variant === 'cart') {
    return (
      <div className="p-2.5 bg-neutral-50 hairline-all text-[11px] font-mono text-black flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Zap className="w-3.5 h-3.5 text-dune-ochre shrink-0" />
          {timeLeft.isToday ? (
            <span className="truncate">
              Замовте протягом{' '}
              <strong className="text-black tabular-nums font-bold">
                {formatPad(timeLeft.hours)}:{formatPad(timeLeft.minutes)}:{formatPad(timeLeft.seconds)}
              </strong>{' '}
              для відправки сьогодні!
            </span>
          ) : (
            <span>Замовлення буде відправлено завтра о 10:00</span>
          )}
        </div>
        <span className="text-[9px] px-1 bg-black text-white uppercase font-bold shrink-0">
          {timeLeft.isToday ? 'СЬОГОДНІ' : 'ЗАВТРА'}
        </span>
      </div>
    );
  }

  // Banner variant (default)
  return (
    <div className="flex items-center gap-1.5 text-[10px] font-mono text-neutral-600 uppercase">
      <Clock className="w-3 h-3 text-dune-ochre" />
      {timeLeft.isToday ? (
        <span>
          Відправка сьогодні:{' '}
          <strong className="text-black tabular-nums">
            {formatPad(timeLeft.hours)}:{formatPad(timeLeft.minutes)}:{formatPad(timeLeft.seconds)}
          </strong>
        </span>
      ) : (
        <span>Відправка завтра о 10:00</span>
      )}
    </div>
  );
};
