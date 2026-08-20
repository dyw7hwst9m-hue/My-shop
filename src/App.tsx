import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ShopProvider, useShop } from './context/ShopContext';
import { Product } from './types';

// Common UI Components
import { Header } from './components/common/Header';
import { BottomNav } from './components/common/BottomNav';
import { AuthModal } from './components/auth/AuthModal';
import { FirebaseConfigModal } from './components/common/FirebaseConfigModal';

// Customer Components
import { CustomerHome } from './components/customer/CustomerHome';
import { CustomerCategories } from './components/customer/CustomerCategories';
import { CartView } from './components/customer/CartView';
import { CustomerOrders } from './components/customer/CustomerOrders';
import { CustomerProfile } from './components/customer/CustomerProfile';
import { ProductDetailModal } from './components/customer/ProductDetailModal';

// Owner Components
import { OwnerDashboard } from './components/owner/OwnerDashboard';
import { OwnerProducts } from './components/owner/OwnerProducts';
import { OwnerOrders } from './components/owner/OwnerOrders';
import { OwnerCustomers } from './components/owner/OwnerCustomers';
import { OwnerCategories } from './components/owner/OwnerCategories';
import { OwnerReviews } from './components/owner/OwnerReviews';
import { OwnerSettings } from './components/owner/OwnerSettings';

const MainAppContent: React.FC = () => {
  const { role, currentUser } = useAuth();
  const { products } = useShop();

  // Navigation State
  const [customerTab, setCustomerTab] = useState<string>('home');
  const [ownerTab, setOwnerTab] = useState<string>('dashboard');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');

  // Device Frame Preview Mode
  const [deviceMode, setDeviceMode] = useState<'mobile' | 'tablet' | 'responsive'>('mobile');

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Active Tab determined by current role
  const activeTab = role === 'owner' ? ownerTab : customerTab;

  const handleTabChange = (tabId: string) => {
    if (role === 'owner') {
      setOwnerTab(tabId);
    } else {
      if (tabId === 'home') {
        // Reset or maintain
      }
      setCustomerTab(tabId);
    }
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleSelectCategoryFilter = (categoryId: string) => {
    // Navigate back to home and filter will be active
    setActiveCategoryFilter(categoryId);
    setCustomerTab('home');
  };

  return (
    <div className="min-h-screen bg-stone-100/80 text-stone-900 flex flex-col items-center justify-start p-0 sm:py-4 font-sans selection:bg-orange-500 selection:text-white">
      {/* Outer Shell Wrapper (Simulating Mobile Device Frame on Desktop or Full Responsive) */}
      <div
        className={`w-full bg-white shadow-2xl transition-all duration-300 min-h-screen flex flex-col relative overflow-hidden ${
          deviceMode === 'mobile'
            ? 'sm:max-w-md sm:rounded-[36px] sm:min-h-[850px] sm:border-[8px] sm:border-stone-800'
            : deviceMode === 'tablet'
            ? 'sm:max-w-2xl sm:rounded-[32px] sm:min-h-[850px] sm:border-[8px] sm:border-stone-800'
            : 'max-w-4xl sm:rounded-3xl'
        }`}
      >
        {/* Top Speaker / Dynamic Island Simulation on Mobile Frame */}
        {deviceMode === 'mobile' && (
          <div className="hidden sm:flex justify-center pt-2 pb-1 bg-white">
            <div className="w-20 h-4 bg-stone-800 rounded-full flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-stone-900 mr-2"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-blue-900/60"></div>
            </div>
          </div>
        )}

        {/* Global App Header */}
        <Header
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onOpenFirebaseConfig={() => setIsFirebaseModalOpen(true)}
          onOpenCart={() => {
            if (role === 'customer') {
              setCustomerTab('cart');
            }
          }}
          deviceMode={deviceMode}
          onChangeDeviceMode={setDeviceMode}
        />

        {/* Dynamic Main Viewport */}
        <main className="flex-1 px-4 pt-3.5 pb-20 overflow-y-auto no-scrollbar">
          {role === 'customer' ? (
            /* Customer View Routes */
            <>
              {customerTab === 'home' && (
                <CustomerHome
                  key={activeCategoryFilter}
                  initialCategoryId={activeCategoryFilter}
                  onSelectProduct={handleSelectProduct}
                  onNavigateToCategories={() => setCustomerTab('categories')}
                  onNavigateToCart={() => setCustomerTab('cart')}
                />
              )}
              {customerTab === 'categories' && (
                <CustomerCategories
                  onSelectCategoryFilter={handleSelectCategoryFilter}
                  onSelectProduct={handleSelectProduct}
                />
              )}
              {customerTab === 'cart' && (
                <CartView
                  onNavigateHome={() => setCustomerTab('home')}
                  onOrderSuccess={(orderId) => {
                    setCustomerTab('orders');
                  }}
                />
              )}
              {customerTab === 'orders' && (
                <CustomerOrders onNavigateHome={() => setCustomerTab('home')} />
              )}
              {customerTab === 'profile' && (
                <CustomerProfile onOpenAuth={() => setIsAuthModalOpen(true)} />
              )}
            </>
          ) : (
            /* Store Owner View Routes */
            <>
              {ownerTab === 'dashboard' && (
                <OwnerDashboard
                  onNavigateToProducts={() => setOwnerTab('products')}
                  onNavigateToOrders={() => setOwnerTab('orders')}
                  onNavigateToCustomers={() => setOwnerTab('customers')}
                  onOpenAddProduct={() => setOwnerTab('products')}
                />
              )}
              {ownerTab === 'products' && <OwnerProducts />}
              {ownerTab === 'orders' && <OwnerOrders />}
              {ownerTab === 'customers' && <OwnerCustomers />}
              {ownerTab === 'categories' && <OwnerCategories />}
              {ownerTab === 'reviews' && <OwnerReviews />}
              {ownerTab === 'settings' && (
                <OwnerSettings
                  onOpenFirebaseModal={() => setIsFirebaseModalOpen(true)}
                />
              )}
            </>
          )}
        </main>

        {/* Global Bottom Navigation */}
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />

        {/* Device Frame Bottom Home Bar (Mobile Frame) */}
        {deviceMode === 'mobile' && (
          <div className="hidden sm:flex justify-center pb-2 bg-white/80">
            <div className="w-32 h-1 bg-stone-300 rounded-full"></div>
          </div>
        )}
      </div>

      {/* Global Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <FirebaseConfigModal
        isOpen={isFirebaseModalOpen}
        onClose={() => setIsFirebaseModalOpen(false)}
      />

      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onOpenCart={() => {
          if (role === 'customer') {
            setCustomerTab('cart');
          }
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ShopProvider>
        <MainAppContent />
      </ShopProvider>
    </AuthProvider>
  );
}
