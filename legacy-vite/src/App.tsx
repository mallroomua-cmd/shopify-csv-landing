import React, { Suspense, lazy } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Header } from './components/Header';
import { PromoBanner } from './components/PromoBanner';
import { BrandLogoSlider } from './components/BrandLogoSlider';
import { ProductGrid } from './components/ProductGrid';
import { RecentlyViewed } from './components/RecentlyViewed';
import { TrustBadges } from './components/TrustBadges';
import { ReviewsSection } from './components/ReviewsSection';
import { MobileFloatingBar } from './components/MobileFloatingBar';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CheckoutModal } from './components/CheckoutModal';
import { CartDrawer } from './components/CartDrawer';
import { Footer } from './components/Footer';

import { ContactWidget } from './components/ContactWidget';
import { WishlistModal } from './components/WishlistModal';
import { SearchModal } from './components/SearchModal';
import { ToastContainer } from './components/ToastContainer';
import { ScrollToTop } from './components/ScrollToTop';

// Code-splitting heavy components (Admin Hub: 2400+ LOC, Policy docs, Quiz & Tracking modals)
// This cuts initial bundle size drastically for storefront visitors
const AdminControlHub = lazy(() =>
  import('./components/AdminControlHub').then((m) => ({ default: m.AdminControlHub }))
);
const PolicyModal = lazy(() =>
  import('./components/PolicyModal').then((m) => ({ default: m.PolicyModal }))
);
const RoutineQuizModal = lazy(() =>
  import('./components/RoutineQuizModal').then((m) => ({ default: m.RoutineQuizModal }))
);
const OrderTrackingModal = lazy(() =>
  import('./components/OrderTrackingModal').then((m) => ({ default: m.OrderTrackingModal }))
);

export const AppContent: React.FC = () => {
  const {
    isPolicyModalOpen,
    policyModalTab,
    closePolicyModal,
    isAdminOpen,
    isQuizOpen,
    isTrackingOpen,
  } = useStore();

  return (
    <div className="min-h-screen flex flex-col bg-white text-dune-black selection:bg-black selection:text-white pb-20 sm:pb-0">
      <Header />
      <main className="flex-1">
        {/* Under navigation: Promo Banner with user-provided deals */}
        <PromoBanner />

        {/* Under banner: Horizontal scrolling brand logos (Cosibella style) */}
        <BrandLogoSlider />

        {/* Product Catalog directly accessible */}
        <ProductGrid />

        {/* Recently viewed products */}
        <RecentlyViewed />

        {/* Principles of work - moved to the bottom */}
        <TrustBadges />

        {/* Customer reviews - moved to the bottom */}
        <ReviewsSection />
      </main>
      <Footer />

      {/* Floating Elements: Contact Button (Right), Scroll to Top */}
      <ContactWidget />
      <ScrollToTop />
      <ToastContainer />

      {/* Sticky Mobile Floating Quick Bar */}
      <MobileFloatingBar />

      {/* Core Modals and Drawers */}
      <ProductDetailModal />
      <CheckoutModal />
      <CartDrawer />
      <WishlistModal />
      <SearchModal />

      {/* Lazy Modals loaded strictly on demand */}
      {isQuizOpen && (
        <Suspense fallback={null}>
          <RoutineQuizModal />
        </Suspense>
      )}

      {isTrackingOpen && (
        <Suspense fallback={null}>
          <OrderTrackingModal />
        </Suspense>
      )}

      {isPolicyModalOpen && (
        <Suspense fallback={null}>
          <PolicyModal
            isOpen={isPolicyModalOpen}
            initialTab={policyModalTab}
            onClose={closePolicyModal}
          />
        </Suspense>
      )}

      {isAdminOpen && (
        <Suspense fallback={null}>
          <AdminControlHub />
        </Suspense>
      )}
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}
