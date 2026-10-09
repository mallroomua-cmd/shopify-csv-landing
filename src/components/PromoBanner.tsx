import React from 'react';
import birthdayBannerImg from '../assets/birthday-deals.jpg';

interface PromoBannerProps {
  onExploreDeals?: () => void;
}

export const PromoBanner: React.FC<PromoBannerProps> = ({ onExploreDeals }) => {
  const handleBannerClick = () => {
    if (onExploreDeals) {
      onExploreDeals();
    } else {
      const el = document.getElementById('catalog-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <section className="relative w-full p-0 m-0 overflow-hidden bg-[#fae4de] border-b border-neutral-200">
      {/* Full-bleed seamless banner container with zero margin/padding gaps */}
      <div
        onClick={handleBannerClick}
        className="group relative w-full cursor-pointer overflow-hidden block select-none"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleBannerClick();
          }
        }}
        aria-label="Birthday Deals — Знижки до -50% на культову корейську косметику. Натисніть, щоб перейти до каталогу"
      >
        <div className="w-full max-w-[1920px] mx-auto relative flex items-center justify-center">
          <img
            src={birthdayBannerImg}
            alt="Birthday Deals — Знижки до -50% на корейську косметику COSRX, Beauty of Joseon, Dr. Althea"
            className="w-full h-auto block object-cover md:object-contain max-h-[620px] transform transition-transform duration-500 ease-out group-hover:scale-[1.008]"
            loading="eager"
            fetchPriority="high"
          />

          {/* Subtle elegant interactive hover glow */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/[0.02] transition-colors pointer-events-none" />
        </div>
      </div>
    </section>
  );
};
