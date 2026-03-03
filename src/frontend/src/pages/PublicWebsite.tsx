import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ChevronDown,
  Clock,
  Leaf,
  MapPin,
  Menu,
  MessageCircle,
  Minus,
  Phone,
  Plus,
  Shield,
  ShoppingCart,
  Star,
  X,
} from "lucide-react";
import type { Variants } from "motion/react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  useGetProductImages,
  useGetProducts,
  useGetSiteMediaImages,
  useInitializeProducts,
  usePlaceOrder,
} from "../hooks/useQueries";
import type { Product } from "../hooks/useQueries";
import {
  getStoredProductImages,
  getStoredProductPrices,
  getStoredSiteMedia,
  saveLocalOrder,
} from "./AdminPortal";

interface CartItem {
  product: Product;
  quantity: number;
  unit: string;
}

const PRODUCT_IMAGES: Record<string, string> = {
  broiler: "/assets/generated/product-broiler.dim_400x400.jpg",
  country: "/assets/generated/product-country.dim_400x400.jpg",
  boneless: "/assets/generated/product-boneless.dim_400x400.jpg",
  cuts: "/assets/generated/product-cuts.dim_400x400.jpg",
  cleaned: "/assets/generated/product-broiler.dim_400x400.jpg",
};

function getProductImage(
  product: Product,
  storedImages?: Record<string, string>,
): string {
  // Check for admin-uploaded custom image first
  const images = storedImages ?? getStoredProductImages();
  const customImg = images[product.id.toString()];
  if (customImg) return customImg;

  // Fall back to default images by name
  const name = product.nameEn.toLowerCase();
  if (name.includes("broiler") || name.includes("heat"))
    return PRODUCT_IMAGES.broiler;
  if (name.includes("country") || name.includes("skinless"))
    return PRODUCT_IMAGES.country;
  if (name.includes("boneless")) return PRODUCT_IMAGES.boneless;
  if (name.includes("cut")) return PRODUCT_IMAGES.cuts;
  if (name.includes("clean")) return PRODUCT_IMAGES.cleaned;
  return PRODUCT_IMAGES.broiler;
}

function getProductPrice(product: Product): number {
  const storedPrices = getStoredProductPrices();
  const stored = storedPrices[product.id.toString()];
  return stored !== undefined ? stored : product.pricePerKg;
}

// Fallback products for display when backend is loading
const FALLBACK_PRODUCTS: Product[] = [
  {
    id: BigInt(1),
    nameEn: "Heat Chicken (Broiler)",
    nameTe: "బ్రాయిలర్ చికెన్",
    pricePerKg: 180,
    isAvailable: true,
    description: "Fresh whole broiler chicken, cleaned and ready",
    category: "broiler",
  },
  {
    id: BigInt(2),
    nameEn: "Skinless Country Chicken",
    nameTe: "నాటు కోడి (స్కిన్‌లెస్)",
    pricePerKg: 450,
    isAvailable: true,
    description: "Premium desi/country chicken without skin",
    category: "country",
  },
  {
    id: BigInt(3),
    nameEn: "Boneless Chicken",
    nameTe: "బోన్‌లెస్ చికెన్",
    pricePerKg: 320,
    isAvailable: true,
    description: "Freshly deboned chicken pieces",
    category: "boneless",
  },
  {
    id: BigInt(4),
    nameEn: "Chicken Cuts",
    nameTe: "చికెన్ ముక్కలు",
    pricePerKg: 200,
    isAvailable: true,
    description: "Fresh chicken cut to your preference",
    category: "cuts",
  },
  {
    id: BigInt(5),
    nameEn: "Freshly Cleaned Chicken",
    nameTe: "శుభ్రపరిచిన చికెన్",
    pricePerKg: 190,
    isAvailable: true,
    description: "Whole chicken freshly cleaned and processed",
    category: "cleaned",
  },
];

// Section fade-in animation
const fadeInUpVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const slideInLeftVariants: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

export default function PublicWebsite() {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [lastOrderId, setLastOrderId] = useState<bigint | null>(null);
  const [siteMedia, setSiteMedia] = useState(() => getStoredSiteMedia());
  const [productImages, setProductImages] = useState(() =>
    getStoredProductImages(),
  );

  const { data: backendProducts } = useGetProducts();
  const { data: backendProductImages } = useGetProductImages();
  const { data: backendSiteMediaImages } = useGetSiteMediaImages();
  const placeOrderMutation = usePlaceOrder();
  const initializeProducts = useInitializeProducts();

  // Always show products immediately -- use fallback until backend loads
  const products =
    backendProducts && backendProducts.length > 0
      ? backendProducts
      : FALLBACK_PRODUCTS;

  // Initialize products if none exist
  const initMutate = initializeProducts.mutate;
  useEffect(() => {
    if (backendProducts && backendProducts.length === 0) {
      initMutate();
    }
  }, [backendProducts, initMutate]);

  // Merge backend images with localStorage (backend takes priority)
  useEffect(() => {
    if (backendProductImages) {
      setProductImages((prev) => ({ ...prev, ...backendProductImages }));
    }
  }, [backendProductImages]);

  useEffect(() => {
    if (backendSiteMediaImages) {
      setSiteMedia((prev) => ({ ...prev, ...backendSiteMediaImages }));
    }
  }, [backendSiteMediaImages]);

  // Listen for localStorage changes (from admin portal in same tab or other tabs)
  useEffect(() => {
    function syncMedia() {
      // Merge: backend images take priority, localStorage is fallback
      setSiteMedia((prev) => ({
        ...getStoredSiteMedia(),
        ...backendSiteMediaImages,
        ...prev, // keep any already-loaded backend images
      }));
      setProductImages((prev) => ({
        ...getStoredProductImages(),
        ...backendProductImages,
        ...prev, // keep any already-loaded backend images
      }));
    }
    // Cross-tab sync
    window.addEventListener("storage", syncMedia);
    // Same-tab sync: poll every 2 seconds
    const interval = setInterval(syncMedia, 2000);
    return () => {
      window.removeEventListener("storage", syncMedia);
      clearInterval(interval);
    };
  }, [backendProductImages, backendSiteMediaImages]);

  // Nav scroll detection
  useEffect(() => {
    const handler = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce(
    (sum, item) => sum + getProductPrice(item.product) * item.quantity,
    0,
  );

  function scrollToSection(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setIsNavOpen(false);
  }

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((c) => c.product.id === product.id);
      if (existing) {
        return prev.map((c) =>
          c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c,
        );
      }
      return [...prev, { product, quantity: 1, unit: "kg" }];
    });
    toast.success(`${product.nameEn} added to order!`);
  }

  function updateQty(productId: bigint, delta: number) {
    setCart((prev) =>
      prev
        .map((c) =>
          c.product.id === productId
            ? { ...c, quantity: c.quantity + delta }
            : c,
        )
        .filter((c) => c.quantity > 0),
    );
  }

  function removeFromCart(productId: bigint) {
    setCart((prev) => prev.filter((c) => c.product.id !== productId));
  }

  async function handlePlaceOrder() {
    if (!customerName.trim() || !customerPhone.trim()) {
      toast.error("Please fill in your name and phone number.");
      return;
    }
    if (cart.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }

    const items = cart.map((c) => ({
      productId: c.product.id,
      quantity: c.quantity,
      unit: c.unit,
    }));

    // Build WhatsApp message upfront so it's always available
    const itemLines = cart
      .map(
        (c) =>
          `• ${c.product.nameEn}: ${c.quantity} ${c.unit} @ ₹${getProductPrice(c.product)}/kg`,
      )
      .join("\n");

    let orderId: bigint = BigInt(Date.now() % 1000000);
    const localOrderId = `order-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const today = new Date().toISOString().split("T")[0];

    try {
      orderId = await placeOrderMutation.mutateAsync({
        customerName,
        customerPhone,
        items,
      });
    } catch {
      // Backend failed — still proceed with WhatsApp notification
      console.warn("Order backend failed, proceeding with WhatsApp only");
    }

    // Always save order to localStorage so admin portal can see it
    saveLocalOrder({
      id: localOrderId,
      customerName,
      customerPhone,
      items: cart.map((c) => ({
        productId: c.product.id.toString(),
        productName: c.product.nameEn,
        quantity: c.quantity,
        unit: c.unit,
        pricePerKg: getProductPrice(c.product),
      })),
      totalAmount: cartTotal,
      status: "pending",
      createdAt: Date.now(),
      orderDate: today,
    });

    setLastOrderId(orderId);
    setOrderSuccess(true);

    const msg = `🛒 *New Order from Madeena Chicken Center Website*\n\n*Customer:* ${customerName}\n*Phone:* ${customerPhone}\n\n*Order Items:*\n${itemLines}\n\n*Total: ₹${cartTotal}*\n\nOrder ID: ${orderId}`;
    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/919948606135?text=${encoded}`, "_blank");
  }

  function openWhatsApp2() {
    const itemLines = cart
      .map((c) => `• ${c.product.nameEn}: ${c.quantity} ${c.unit}`)
      .join("\n");
    const msg = `🛒 New Order\nCustomer: ${customerName}\nPhone: ${customerPhone}\n\nItems:\n${itemLines}\n\nTotal: ₹${cartTotal}`;
    window.open(
      `https://wa.me/918125622399?text=${encodeURIComponent(msg)}`,
      "_blank",
    );
    // openWhatsApp2 stays as 8125622399 (same for both sites)
  }

  function closeOrderModal() {
    setIsOrderModalOpen(false);
    setOrderSuccess(false);
    if (orderSuccess) {
      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
    }
  }

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* ======= NAVBAR ======= */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? "nav-scrolled py-2" : "bg-transparent py-4"
        }`}
      >
        <nav className="container mx-auto px-4 flex items-center justify-between">
          {/* Logo / Brand */}
          <button
            type="button"
            onClick={() => scrollToSection("home")}
            className="flex items-center gap-2 text-left group"
            aria-label="Go to top"
          >
            {siteMedia.navLogo && (
              <img
                src={siteMedia.navLogo}
                alt="Madeena Chicken Center Logo"
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
              />
            )}
            <div className="flex flex-col">
              <span
                className={`font-display font-bold text-lg leading-tight transition-colors ${
                  isScrolled ? "text-primary" : "text-white"
                }`}
              >
                MADEENA CHICKEN CENTER
              </span>
              <span
                className={`text-xs leading-tight transition-colors ${
                  isScrolled ? "text-accent" : "text-yellow-300"
                }`}
              >
                మదీనా చికెన్ సెంటర్
              </span>
              <span
                className={`text-xs leading-tight font-medium transition-colors ${
                  isScrolled ? "text-muted-foreground" : "text-white/70"
                }`}
              ></span>
            </div>
          </button>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {[
              { id: "about", label: "About", ocid: "nav.about_link" },
              { id: "products", label: "Products", ocid: "nav.products_link" },
              { id: "location", label: "Location", ocid: "nav.location_link" },
              { id: "contact", label: "Contact", ocid: "nav.contact_link" },
            ].map((item) => (
              <button
                type="button"
                key={item.id}
                data-ocid={item.ocid}
                onClick={() => scrollToSection(item.id)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors hover:text-primary ${
                  isScrolled
                    ? "text-foreground"
                    : "text-white/90 hover:text-white"
                }`}
              >
                {item.label}
              </button>
            ))}
            <Button
              data-ocid="nav.order_button"
              onClick={() => scrollToSection("products")}
              className="ml-2 bg-primary text-primary-foreground hover:opacity-90 shadow-brand-sm font-semibold"
              size="sm"
            >
              Order Now
            </Button>
            <a
              href="/admin"
              data-ocid="nav.admin_link"
              className={`ml-1 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                isScrolled
                  ? "border-border text-muted-foreground hover:text-primary hover:border-primary/40"
                  : "border-white/30 text-white/70 hover:text-white hover:border-white/60"
              }`}
            >
              Admin
            </a>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="relative ml-1 p-2 rounded-full hover:bg-primary/10 transition-colors"
                aria-label="Open cart"
              >
                <ShoppingCart
                  className={`h-5 w-5 ${isScrolled ? "text-primary" : "text-white"}`}
                />
                <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              </button>
            )}
          </div>

          {/* Mobile nav toggle */}
          <div className="flex md:hidden items-center gap-2">
            {cart.length > 0 && (
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="relative p-2"
                aria-label="Open cart"
              >
                <ShoppingCart className="h-5 w-5 text-white" />
                <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsNavOpen(!isNavOpen)}
              className={`p-2 ${isScrolled ? "text-foreground" : "text-white"}`}
              aria-label="Toggle menu"
            >
              {isNavOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </nav>

        {/* Mobile menu */}
        <AnimatePresence>
          {isNavOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-t border-border shadow-lg"
            >
              <div className="container mx-auto px-4 py-2 flex flex-col gap-1">
                {[
                  { id: "home", label: "Home", ocid: "nav.home_link" },
                  { id: "about", label: "About", ocid: "nav.about_link" },
                  {
                    id: "products",
                    label: "Products",
                    ocid: "nav.products_link",
                  },
                  {
                    id: "location",
                    label: "Location",
                    ocid: "nav.location_link",
                  },
                  { id: "contact", label: "Contact", ocid: "nav.contact_link" },
                ].map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    data-ocid={item.ocid}
                    onClick={() => scrollToSection(item.id)}
                    className="text-left px-3 py-3 text-foreground hover:text-primary hover:bg-muted rounded-md font-medium transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
                <Button
                  data-ocid="nav.order_button"
                  onClick={() => scrollToSection("products")}
                  className="w-full mt-2 bg-primary text-primary-foreground"
                >
                  Order Now
                </Button>
                <a
                  href="/admin"
                  data-ocid="nav.admin_link"
                  className="block text-center px-3 py-2.5 mt-1 text-muted-foreground hover:text-primary hover:bg-muted rounded-md text-sm font-medium transition-colors border border-border"
                >
                  🔐 Admin Login
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ======= HERO SECTION ======= */}
      <section
        id="home"
        className="relative min-h-screen flex items-center overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #7a0a0a 0%, #b91c1c 40%, #c2410c 100%)",
        }}
      >
        {/* Background texture overlay */}
        <div className="absolute inset-0 opacity-20">
          <img
            src={
              siteMedia.heroBg ||
              "/assets/generated/hero-bg-red.dim_1920x1080.jpg"
            }
            alt=""
            className="w-full h-full object-cover object-center"
            aria-hidden="true"
          />
        </div>

        {/* Decorative red circle on the right like reference design */}
        <div
          className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full pointer-events-none"
          style={{
            width: "clamp(320px, 55vw, 700px)",
            height: "clamp(320px, 55vw, 700px)",
            background:
              "radial-gradient(circle, rgba(220,38,38,0.7) 0%, rgba(180,20,20,0.4) 60%, transparent 100%)",
            transform: "translate(15%, -50%)",
          }}
        />

        <div className="relative w-full container mx-auto px-6 py-28 md:py-36">
          <div className="flex flex-col md:flex-row items-center justify-between gap-10">
            {/* LEFT: Text content */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="flex-1 max-w-xl z-10"
            >
              <motion.div variants={fadeInUpVariants} className="mb-4">
                <span className="inline-block bg-white/15 backdrop-blur-sm text-yellow-300 text-sm font-semibold px-4 py-1.5 rounded-full border border-yellow-300/30">
                  ✨ Fresh & Hygienic Every Day
                </span>
              </motion.div>

              <motion.h1
                variants={fadeInUpVariants}
                className="font-display font-black leading-tight mb-3"
                style={{ fontSize: "clamp(2.2rem, 5vw, 4rem)" }}
              >
                <span className="text-white drop-shadow-lg">Get Your</span>
                <span className="block text-yellow-300 drop-shadow-lg">
                  Fresh Chicken
                </span>
                <span className="text-white drop-shadow-lg">With Quality</span>
              </motion.h1>

              <motion.div variants={fadeInUpVariants} className="mb-2">
                <p className="text-3xl md:text-4xl font-extrabold text-white drop-shadow-lg tracking-wide">
                  MADEENA
                </p>
                <p className="text-3xl md:text-4xl font-extrabold text-yellow-300 drop-shadow-lg tracking-wide">
                  CHICKEN CENTER
                </p>
                <p className="text-lg text-yellow-200/90 font-medium mt-1">
                  మదీనా చికెన్ సెంటర్
                </p>
              </motion.div>

              <motion.p
                variants={fadeInUpVariants}
                className="text-white/80 text-base md:text-lg mb-8 leading-relaxed"
              >
                Indulge in fresh, hygienic chicken everyday. Taste the Quality!
                <span className="block text-yellow-200/70 text-sm mt-1">
                  తాజా మరియు నాణ్యమైన చికెన్ రోజూ
                </span>
              </motion.p>

              <motion.div
                variants={fadeInUpVariants}
                className="flex flex-wrap gap-4 mb-10"
              >
                <Button
                  data-ocid="hero.order_button"
                  onClick={() => scrollToSection("products")}
                  size="lg"
                  className="bg-white text-red-700 hover:bg-yellow-300 hover:text-red-800 font-black text-base px-8 shadow-xl transition-all"
                >
                  Order Now
                </Button>
                <Button
                  onClick={() => scrollToSection("contact")}
                  size="lg"
                  variant="outline"
                  className="border-white/60 text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm font-semibold text-base px-8"
                >
                  <Phone className="mr-2 h-4 w-4" />
                  Call Us
                </Button>
              </motion.div>

              {/* Stats row */}
              <motion.div
                variants={fadeInUpVariants}
                className="flex gap-8 flex-wrap"
              >
                {[
                  { value: "10K+", label: "Happy Customers" },
                  { value: "100%", label: "Fresh Daily" },
                  { value: "3+", label: "Chicken Varieties" },
                ].map((stat) => (
                  <div key={stat.label} className="text-left">
                    <p className="text-2xl md:text-3xl font-black text-white">
                      {stat.value}
                    </p>
                    <p className="text-white/60 text-xs font-medium">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* RIGHT: Chicken image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: 60 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{
                duration: 0.8,
                ease: [0.25, 0.46, 0.45, 0.94],
                delay: 0.2,
              }}
              className="flex-shrink-0 flex items-center justify-center z-10"
              style={{
                width: "clamp(260px, 40vw, 500px)",
                height: "clamp(260px, 40vw, 500px)",
              }}
            >
              {/* Circular glowing backdrop */}
              <div className="relative w-full h-full">
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(255,200,0,0.25) 0%, rgba(220,38,38,0.3) 50%, transparent 75%)",
                  }}
                  animate={{ scale: [1, 1.04, 1], opacity: [0.6, 0.9, 0.6] }}
                  transition={{
                    repeat: Number.POSITIVE_INFINITY,
                    duration: 3,
                    ease: "easeInOut",
                  }}
                />
                <motion.img
                  src={
                    siteMedia.heroChicken ||
                    "/assets/generated/hero-chicken-dish.dim_700x700.png"
                  }
                  alt="Fresh chicken dish at Madeena Chicken Center"
                  className="relative z-10 w-full h-full object-contain drop-shadow-2xl"
                  animate={{ y: [0, -12, 0] }}
                  transition={{
                    repeat: Number.POSITIVE_INFINITY,
                    duration: 4,
                    ease: "easeInOut",
                  }}
                />
                {/* Price badge like reference */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8, type: "spring" }}
                  className="absolute bottom-6 right-2 bg-white rounded-xl px-3 py-2 shadow-xl z-20"
                >
                  <p className="text-xs text-gray-500 font-medium">From</p>
                  <p className="text-lg font-black text-red-600">₹180/kg</p>
                </motion.div>
                {/* Fresh badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1, type: "spring" }}
                  className="absolute top-8 left-0 bg-yellow-400 text-red-800 rounded-xl px-3 py-1.5 shadow-xl z-20 font-bold text-sm"
                >
                  20% Fresh Daily
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll down arrow */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2 }}
        >
          <button
            type="button"
            onClick={() => scrollToSection("about")}
            className="text-white/60 hover:text-white transition-colors"
            aria-label="Scroll down"
          >
            <ChevronDown className="h-8 w-8" />
          </button>
        </motion.div>
      </section>

      {/* ======= ABOUT SECTION ======= */}
      <section id="about" className="py-20 section-pattern">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
          >
            <motion.div
              variants={slideInLeftVariants}
              className="text-center mb-12"
            >
              <Badge className="bg-primary/10 text-primary border-primary/20 mb-3">
                About Us
              </Badge>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
                మా గురించి
              </h2>
              <div className="w-16 h-1 bg-accent mx-auto rounded-full mt-3" />
            </motion.div>

            <div className="grid md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
              <motion.div variants={fadeInUpVariants}>
                <h3 className="font-display text-2xl font-bold text-primary mb-4">
                  MADEENA CHICKEN CENTER
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-4 text-base">
                  MADEENA CHICKEN CENTER has been serving the freshest, most
                  hygienic, and highest quality chicken to the people of
                  Choutuppal and surrounding areas. We source our chicken daily
                  to ensure you get only the best — fresh, clean, and healthy.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-6 text-sm italic">
                  మేము ప్రతిరోజూ తాజా, పరిశుభ్రమైన మరియు అత్యుత్తమ నాణ్యమైన చికెన్‌ను అందిస్తున్నాము. మీ
                  సంతృప్తి మా ప్రధాన లక్ష్యం.
                </p>
                <p className="text-sm text-muted-foreground">
                  📍 7V2V+8RG, Bangarigadda Rd, near AMR Shadikhana, Choutuppal,
                  Telangana 508252
                </p>
              </motion.div>

              <motion.div
                variants={staggerContainer}
                className="grid grid-cols-1 gap-4"
              >
                {[
                  {
                    icon: <Leaf className="h-7 w-7" />,
                    title: "Fresh Daily",
                    subtitle: "రోజువారీ తాజాది",
                    desc: "Sourced fresh every morning — no frozen stock ever.",
                  },
                  {
                    icon: <Shield className="h-7 w-7" />,
                    title: "Hygienically Cleaned",
                    subtitle: "పరిశుభ్రంగా శుభ్రపరచబడింది",
                    desc: "Processed in clean, sanitized conditions for your safety.",
                  },
                  {
                    icon: <Star className="h-7 w-7" />,
                    title: "Quality Guaranteed",
                    subtitle: "నాణ్యత హామీ",
                    desc: "Premium quality chicken at honest, fair prices.",
                  },
                ].map((feat) => (
                  <motion.div
                    key={feat.title}
                    variants={fadeInUpVariants}
                    className="flex gap-4 p-4 rounded-xl bg-white border border-border shadow-xs card-hover"
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      {feat.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">
                        {feat.title}
                      </h4>
                      <p className="text-xs text-accent font-medium mb-1">
                        {feat.subtitle}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {feat.desc}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ======= PRODUCTS SECTION ======= */}
      <section id="products" className="py-20 bg-muted/40">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
          >
            <motion.div
              variants={slideInLeftVariants}
              className="text-center mb-12"
            >
              <Badge className="bg-primary/10 text-primary border-primary/20 mb-3">
                Our Products
              </Badge>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
                మా ఉత్పత్తులు
              </h2>
              <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
                Choose from our range of fresh, quality chicken products.
              </p>
              <div className="w-16 h-1 bg-accent mx-auto rounded-full mt-3" />
            </motion.div>

            <motion.div
              variants={staggerContainer}
              className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {products.map((product, index) => (
                <motion.div
                  key={product.id.toString()}
                  data-ocid={`product.card.${index + 1}`}
                  variants={fadeInUpVariants}
                  className="rounded-2xl bg-white border border-border overflow-hidden shadow-xs card-hover group"
                >
                  <div className="relative overflow-hidden h-48">
                    <img
                      src={getProductImage(product, productImages)}
                      alt={product.nameEn}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "/assets/generated/product-broiler.dim_400x400.jpg";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    <Badge className="absolute top-3 right-3 bg-accent text-accent-foreground font-bold text-sm shadow">
                      ₹{getProductPrice(product)}/kg
                    </Badge>
                    {!product.isAvailable && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Badge className="bg-red-700 text-white">
                          Not Available
                        </Badge>
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-foreground text-base leading-tight">
                      {product.nameEn}
                    </h3>
                    <p className="text-accent text-sm font-medium mt-0.5">
                      {product.nameTe}
                    </p>
                    <p className="text-muted-foreground text-xs mt-1.5 line-clamp-2">
                      {product.description}
                    </p>

                    <Button
                      data-ocid={`product.add_button.${index + 1}`}
                      onClick={() => addToCart(product)}
                      disabled={!product.isAvailable}
                      className="w-full mt-4 bg-primary hover:bg-primary/90 text-white font-semibold"
                      size="sm"
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Add to Order
                    </Button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ======= LOCATION SECTION ======= */}
      <section id="location" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
          >
            <motion.div
              variants={slideInLeftVariants}
              className="text-center mb-12"
            >
              <Badge className="bg-primary/10 text-primary border-primary/20 mb-3">
                Find Us
              </Badge>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
                మా చిరునామా
              </h2>
              <div className="w-16 h-1 bg-accent mx-auto rounded-full mt-3" />
            </motion.div>

            <div className="max-w-4xl mx-auto grid md:grid-cols-5 gap-8 items-start">
              <motion.div
                variants={fadeInUpVariants}
                className="md:col-span-2 space-y-4"
              >
                <div className="p-6 rounded-2xl border border-border bg-card shadow-xs">
                  <div className="flex gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Address</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        7V2V+8RG, Bangarigadda Rd,
                        <br />
                        near AMR Shadikhana, Choutuppal,
                        <br />
                        Telangana 508252
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Phone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Phone</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        +91 99486 06135
                        <br />
                        +91 81256 22399
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Hours</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Mon – Sun: 6:00 AM – 9:00 PM
                      </p>
                      <p className="text-xs text-accent font-medium mt-1">
                        మేము ప్రతిరోజూ తెరచి ఉంటాము!
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div variants={fadeInUpVariants} className="md:col-span-3">
                <div
                  className="rounded-2xl overflow-hidden border border-border shadow-xs"
                  data-ocid="location.map_marker"
                >
                  <iframe
                    src="https://maps.google.com/maps?q=Bangarigadda+Road+near+AMR+Shadikhana+Choutuppal+Telangana+508252&output=embed"
                    width="100%"
                    height="350"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Madeena Chicken Center Location"
                  />
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ======= CONTACT SECTION ======= */}
      <section
        id="contact"
        className="py-20 bg-gradient-to-br from-primary/95 to-red-900"
      >
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
          >
            <motion.div
              variants={slideInLeftVariants}
              className="text-center mb-12"
            >
              <Badge className="bg-white/20 text-white border-white/30 mb-3">
                Contact Us
              </Badge>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-2">
                సంప్రదించండి
              </h2>
              <p className="text-white/70 mt-2">
                Get in touch with us anytime.
              </p>
              <div className="w-16 h-1 bg-accent mx-auto rounded-full mt-3" />
            </motion.div>

            <div className="max-w-2xl mx-auto">
              <motion.div
                variants={staggerContainer}
                className="grid sm:grid-cols-2 gap-4 mb-8"
              >
                <motion.a
                  variants={fadeInUpVariants}
                  data-ocid="contact.call_button"
                  href="tel:+919948606135"
                  className="flex items-center justify-center gap-3 p-5 rounded-2xl bg-white text-primary font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 active:translate-y-0"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground font-normal">
                      Call Us Now
                    </div>
                    <div>+91 99486 06135</div>
                  </div>
                </motion.a>

                <motion.a
                  variants={fadeInUpVariants}
                  data-ocid="contact.whatsapp_button"
                  href="https://wa.me/919948606135"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 p-5 rounded-2xl bg-green-500 text-white font-bold text-lg shadow-lg hover:shadow-xl hover:bg-green-600 transition-all hover:-translate-y-1 active:translate-y-0"
                >
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <MessageCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs text-white/80 font-normal">
                      WhatsApp
                    </div>
                    <div>Send Message</div>
                  </div>
                </motion.a>
              </motion.div>

              <motion.div
                variants={fadeInUpVariants}
                className="p-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 text-center"
              >
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    {
                      icon: <MapPin className="h-5 w-5" />,
                      label: "Address",
                      value:
                        "7V2V+8RG, Bangarigadda Rd, near AMR Shadikhana, Choutuppal, Telangana 508252",
                    },
                    {
                      icon: <Phone className="h-5 w-5" />,
                      label: "Phone 1",
                      value: "+91 99486 06135",
                    },
                    {
                      icon: <Phone className="h-5 w-5" />,
                      label: "Phone 2",
                      value: "+91 81256 22399",
                    },
                    {
                      icon: <Clock className="h-5 w-5" />,
                      label: "Hours",
                      value: "6 AM – 9 PM Daily",
                    },
                  ].map((item) => (
                    <div key={item.label} className="text-center">
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-2 text-white">
                        {item.icon}
                      </div>
                      <p className="text-white/60 text-xs mb-1">{item.label}</p>
                      <p className="text-white text-xs font-medium">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="text-accent/90 text-sm font-medium mt-4">
                  We are open every day! • మేము ప్రతిరోజూ తెరచి ఉంటాము!
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ======= FOOTER ======= */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="font-display text-lg font-bold text-white mb-1">
                MADEENA CHICKEN CENTER
              </h3>
              <p className="text-accent text-sm">మదీనా చికెన్ సెంటర్</p>
              <p className="text-gray-400 text-sm">
                Fresh & Quality Chicken Everyday
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                {["Home", "About", "Products", "Location", "Contact"].map(
                  (link) => (
                    <li key={link}>
                      <button
                        type="button"
                        onClick={() => scrollToSection(link.toLowerCase())}
                        className="hover:text-accent transition-colors"
                      >
                        {link}
                      </button>
                    </li>
                  ),
                )}
                <li>
                  <a
                    href="/admin"
                    data-ocid="footer.admin_link"
                    className="hover:text-accent transition-colors inline-flex items-center gap-1"
                  >
                    🔐 Admin Login
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Contact Info</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <p className="flex gap-2">
                  <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  7V2V+8RG, Bangarigadda Rd, near AMR Shadikhana, Choutuppal,
                  Telangana 508252
                </p>
                <p className="flex gap-2">
                  <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                  +91 99486 06135 / +91 81256 22399
                </p>
                <p className="flex gap-2">
                  <Clock className="h-4 w-4 text-primary flex-shrink-0" />
                  Mon – Sun: 6:00 AM – 9:00 PM
                </p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} MADEENA CHICKEN CENTER. All rights
              reserved.
            </p>
            <p className="text-gray-500 text-xs">
              Built with ❤️ using{" "}
              <a
                href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:text-accent/80 transition-colors"
              >
                caffeine.ai
              </a>
            </p>
          </div>
        </div>
      </footer>

      {/* ======= FLOATING CART BUTTON ======= */}
      <AnimatePresence>
        {cartCount > 0 && !isCartOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsCartOpen(true)}
            className="fixed bottom-6 right-6 z-40 bg-primary text-white rounded-full px-5 py-3 shadow-brand flex items-center gap-2 font-semibold hover:bg-primary/90 transition-colors"
            data-ocid="cart.checkout_button"
          >
            <ShoppingCart className="h-5 w-5" />
            <span>
              {cartCount} item{cartCount > 1 ? "s" : ""}
            </span>
            <span className="ml-1">₹{cartTotal}</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ======= CART DRAWER ======= */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-white z-50 shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="font-display font-bold text-lg flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                  Your Order
                </h2>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                  aria-label="Close cart"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {cart.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>Your cart is empty</p>
                  </div>
                ) : (
                  cart.map((item, idx) => (
                    <div
                      key={item.product.id.toString()}
                      data-ocid={`cart.item.${idx + 1}`}
                      className="flex gap-3 p-3 rounded-xl border border-border bg-card"
                    >
                      <img
                        src={getProductImage(item.product, productImages)}
                        alt={item.product.nameEn}
                        className="w-14 h-14 object-cover rounded-lg flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {item.product.nameEn}
                        </p>
                        <p className="text-xs text-accent">
                          {item.product.nameTe}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ₹{getProductPrice(item.product)}/kg
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            type="button"
                            onClick={() => updateQty(item.product.id, -1)}
                            className="w-7 h-7 rounded-full bg-muted flex items-center justify-center hover:bg-muted/70 transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-sm font-semibold w-6 text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQty(item.product.id, 1)}
                            className="w-7 h-7 rounded-full bg-muted flex items-center justify-center hover:bg-muted/70 transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                          <span className="ml-auto text-sm font-semibold text-primary">
                            ₹{getProductPrice(item.product) * item.quantity}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.product.id)}
                        className="p-1 hover:text-primary transition-colors self-start"
                        aria-label="Remove item"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-4 border-t border-border space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-foreground">Total</span>
                    <span className="font-bold text-xl text-primary">
                      ₹{cartTotal}
                    </span>
                  </div>
                  <Button
                    data-ocid="cart.checkout_button"
                    onClick={() => {
                      setIsCartOpen(false);
                      setIsOrderModalOpen(true);
                    }}
                    className="w-full bg-primary text-white font-bold shadow-brand"
                    size="lg"
                  >
                    Place Order
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ======= ORDER MODAL ======= */}
      <AnimatePresence>
        {isOrderModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !placeOrderMutation.isPending && closeOrderModal()}
              className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
            />
            <motion.div
              data-ocid="order.modal"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto bg-white rounded-2xl shadow-2xl z-50 overflow-hidden"
            >
              {orderSuccess ? (
                <div
                  data-ocid="order.success_state"
                  className="p-8 text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <Star className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-foreground mb-2">
                    Order Placed Successfully!
                  </h3>
                  <p className="text-muted-foreground text-sm mb-1">
                    Order ID: #{lastOrderId?.toString()}
                  </p>
                  <p className="text-muted-foreground text-sm mb-6">
                    WhatsApp opened to notify the shop owner.
                  </p>

                  <div className="space-y-3">
                    <Button
                      onClick={openWhatsApp2}
                      variant="outline"
                      className="w-full border-green-200 text-green-700 hover:bg-green-50"
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Also Notify Owner 2
                    </Button>
                    <Button
                      onClick={closeOrderModal}
                      className="w-full bg-primary text-white"
                    >
                      Done
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-6 border-b border-border flex items-center justify-between">
                    <h3 className="font-display text-lg font-bold">
                      Place Your Order
                    </h3>
                    <button
                      type="button"
                      onClick={closeOrderModal}
                      disabled={placeOrderMutation.isPending}
                      className="p-2 rounded-full hover:bg-muted transition-colors"
                      aria-label="Close modal"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="p-6 space-y-4">
                    <div className="space-y-1">
                      <Label htmlFor="customerName">Your Name *</Label>
                      <Input
                        id="customerName"
                        data-ocid="order.name_input"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Enter your full name"
                        autoComplete="name"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="customerPhone">Phone Number *</Label>
                      <Input
                        id="customerPhone"
                        data-ocid="order.phone_input"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="+91 XXXXX XXXXX"
                        type="tel"
                        autoComplete="tel"
                      />
                    </div>

                    <div className="rounded-xl bg-muted/50 border border-border p-3 space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Order Summary
                      </p>
                      {cart.map((item) => (
                        <div
                          key={item.product.id.toString()}
                          className="flex justify-between text-sm"
                        >
                          <span className="text-foreground">
                            {item.product.nameEn} × {item.quantity} kg
                          </span>
                          <span className="font-semibold text-primary">
                            ₹{getProductPrice(item.product) * item.quantity}
                          </span>
                        </div>
                      ))}
                      <div className="flex justify-between text-sm font-bold border-t border-border pt-2 mt-2">
                        <span>Total</span>
                        <span className="text-primary">₹{cartTotal}</span>
                      </div>
                    </div>

                    <Button
                      data-ocid="order.submit_button"
                      onClick={handlePlaceOrder}
                      disabled={placeOrderMutation.isPending}
                      className="w-full bg-primary text-white font-bold shadow-brand"
                      size="lg"
                    >
                      {placeOrderMutation.isPending ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                          Placing Order...
                        </>
                      ) : (
                        <>
                          <MessageCircle className="mr-2 h-4 w-4" />
                          Confirm & Notify Shop
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      A WhatsApp message will be sent to the shop owner.
                    </p>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
