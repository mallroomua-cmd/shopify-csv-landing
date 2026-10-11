import React from 'react';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useModal } from '../hooks/useModal';

export const WishlistModal: React.FC = () => {
  const {
    wishlist,
    products,
    isWishlistOpen,
    setIsWishlistOpen,
    toggleWishlist,
    addToCart,
    openQuickOrder,
    setSelectedProduct,
  } = useStore();

  const handleClose = () => setIsWishlistOpen(false);
  useModal(isWishlistOpen, handleClose);

  if (!isWishlistOpen) return null;

  const wishlistProducts = products.filter((p) => wishlist.includes(p.id));

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end animate-fade-in font-mono"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col transform transition-transform"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 hairline-b flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-500 fill-current" />
            <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-black">
              WISHLIST [{wishlistProducts.length}]
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 font-mono text-sm text-neutral-400 hover:text-black flex items-center justify-center transition-colors"
            aria-label="Закрити список бажань"
          >
            ✕
          </button>
        </div>

        {/* List of Wishlist items */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {wishlistProducts.length > 0 ? (
            wishlistProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center gap-3 p-3 bg-white hairline-all group hover:border-black transition-colors"
              >
                <div
                  onClick={() => {
                    setSelectedProduct(product);
                    handleClose();
                  }}
                  className="w-16 h-16 bg-[#f6f6f6] shrink-0 overflow-hidden cursor-pointer"
                >
                  <img
                    src={product.featuredImage}
                    alt={product.title}
                    className="w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80';
                    }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-neutral-400 uppercase tracking-wider mb-0.5">
                    {product.vendor} // {product.productType}
                  </div>
                  <h4
                    onClick={() => {
                      setSelectedProduct(product);
                      handleClose();
                    }}
                    className="font-sans font-medium text-xs text-black uppercase line-clamp-1 mb-1 leading-snug cursor-pointer hover:text-dune-ochre transition-colors"
                  >
                    {product.title}
                  </h4>
                  <div className="font-mono font-bold text-xs text-black mb-2 tabular-nums">
                    {product.price.toLocaleString('uk-UA')} ₴
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => addToCart(product, 1)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-black text-white text-[10px] uppercase font-bold hover:bg-neutral-800 transition-colors"
                    >
                      <ShoppingBag className="w-3 h-3" />
                      <span>В КОШИК</span>
                    </button>
                    <button
                      onClick={() => {
                        openQuickOrder(product);
                        handleClose();
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-white text-black hairline-all text-[10px] uppercase font-bold hover:bg-neutral-100 transition-colors"
                    >
                      <span>1-КЛІК</span>
                    </button>
                    <button
                      onClick={() => toggleWishlist(product.id)}
                      className="text-neutral-400 hover:text-rose-500 p-1 ml-auto transition-colors"
                      title="Видалити зі списку"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 px-4 font-mono">
              <Heart className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
              <p className="font-bold text-black text-sm uppercase mb-1">Список бажань порожній</p>
              <p className="text-neutral-400 text-xs uppercase mb-6 max-w-xs mx-auto">
                Натисніть на сердечко на картці товару, щоб зберегти його на потім
              </p>
              <button
                onClick={handleClose}
                className="px-6 py-2.5 bg-black text-white font-mono text-xs uppercase font-bold hover:bg-neutral-800 transition-colors"
              >
                [ ДО КАТАЛОГУ ]
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {wishlistProducts.length > 0 && (
          <div className="p-4 sm:p-5 hairline-t bg-neutral-50 flex items-center justify-between">
            <span className="text-xs text-neutral-500 uppercase">
              Збережено {wishlistProducts.length} товарів
            </span>
            <button
              onClick={() => {
                wishlistProducts.forEach((p) => addToCart(p, 1));
                handleClose();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-black text-white text-xs uppercase font-bold hover:bg-neutral-800 transition-colors"
            >
              <span>ДОДАТИ ВСІ В КОШИК</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistModal;
