import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Check,
  CheckCircle,
  ChevronRight,
  Clock,
  DollarSign,
  Edit2,
  Eye,
  EyeOff,
  ImagePlus,
  Lock,
  LogOut,
  Package,
  Phone,
  RefreshCw,
  ShoppingBag,
  Trash2,
  TrendingUp,
  Upload,
  User,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  useGetProducts,
  useInitializeProducts,
  useRemoveProductImage,
  useRemoveSiteMediaImage,
  useSaveProductImage,
  useSaveSiteMediaImage,
  useUpdateProductRate,
} from "../hooks/useQueries";
import type { Product } from "../hooks/useQueries";

// ======= IMAGE STORAGE HELPERS =======
export const PRODUCT_IMAGE_STORAGE_KEY = "madeena_product_images";

export function getStoredProductImages(): Record<string, string> {
  try {
    const raw = localStorage.getItem(PRODUCT_IMAGE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setStoredProductImage(productId: string, dataUrl: string) {
  const current = getStoredProductImages();
  current[productId] = dataUrl;
  localStorage.setItem(PRODUCT_IMAGE_STORAGE_KEY, JSON.stringify(current));
}

function removeStoredProductImage(productId: string) {
  const current = getStoredProductImages();
  delete current[productId];
  localStorage.setItem(PRODUCT_IMAGE_STORAGE_KEY, JSON.stringify(current));
}

// ======= SITE MEDIA STORAGE HELPERS =======
export const SITE_MEDIA_STORAGE_KEY = "madeena_site_media";

export function getStoredSiteMedia(): Record<string, string> {
  try {
    const raw = localStorage.getItem(SITE_MEDIA_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setStoredSiteMediaItem(key: string, dataUrl: string) {
  const current = getStoredSiteMedia();
  current[key] = dataUrl;
  localStorage.setItem(SITE_MEDIA_STORAGE_KEY, JSON.stringify(current));
}

function removeStoredSiteMediaItem(key: string) {
  const current = getStoredSiteMedia();
  delete current[key];
  localStorage.setItem(SITE_MEDIA_STORAGE_KEY, JSON.stringify(current));
}

// ======= LOCAL ORDERS STORAGE HELPERS =======
export const LOCAL_ORDERS_STORAGE_KEY = "madeena_local_orders";

export interface LocalOrder {
  id: string;
  customerName: string;
  customerPhone: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unit: string;
    pricePerKg: number;
  }>;
  totalAmount: number;
  status: "pending" | "completed";
  createdAt: number; // timestamp ms
  orderDate: string; // YYYY-MM-DD
}

export function getLocalOrders(): LocalOrder[] {
  try {
    const raw = localStorage.getItem(LOCAL_ORDERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalOrder(order: LocalOrder) {
  const orders = getLocalOrders();
  orders.unshift(order); // newest first
  localStorage.setItem(LOCAL_ORDERS_STORAGE_KEY, JSON.stringify(orders));
}

export function updateLocalOrderStatus(
  orderId: string,
  status: "pending" | "completed",
) {
  const orders = getLocalOrders();
  const updated = orders.map((o) => (o.id === orderId ? { ...o, status } : o));
  localStorage.setItem(LOCAL_ORDERS_STORAGE_KEY, JSON.stringify(updated));
}

export function getTodayLocalOrders(): LocalOrder[] {
  const today = new Date().toISOString().split("T")[0];
  return getLocalOrders().filter((o) => o.orderDate === today);
}

// ======= PRICE STORAGE HELPERS =======
export const PRODUCT_PRICES_STORAGE_KEY = "madeena_product_prices";

export function getStoredProductPrices(): Record<string, number> {
  try {
    const raw = localStorage.getItem(PRODUCT_PRICES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setStoredProductPrice(productId: string, price: number) {
  const current = getStoredProductPrices();
  current[productId] = price;
  localStorage.setItem(PRODUCT_PRICES_STORAGE_KEY, JSON.stringify(current));
}

const ADMIN_SESSION_KEY = "madeena_admin_session";
const ADMIN_USERNAME = "admin2";
const ADMIN_PASSWORD = "madeena2025";

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

// ======= LOGIN PAGE =======
function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    setTimeout(() => {
      if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        localStorage.setItem(
          ADMIN_SESSION_KEY,
          JSON.stringify({ loggedIn: true, timestamp: Date.now() }),
        );
        onLogin();
        toast.success("Welcome back, Admin!");
      } else {
        setError("Invalid username or password. Please try again.");
        setIsLoading(false);
      }
    }, 600);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-950 to-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-brand">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white">
            Admin Portal
          </h1>
          <p className="text-white/60 text-sm mt-1">MADEENA CHICKEN CENTER</p>
          <p className="text-accent/80 text-xs mt-0.5">మదీనా చికెన్ సెంటర్</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  data-ocid="admin.login_input"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="pl-10"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  data-ocid="admin.password_input"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="pl-10 pr-10"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  data-ocid="admin.error_state"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-lg bg-red-50 border border-red-200 p-3 text-red-700 text-sm flex items-center gap-2"
                >
                  <div className="w-4 h-4 rounded-full border-2 border-red-400 flex-shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              data-ocid="admin.submit_button"
              type="submit"
              className="w-full bg-primary text-white font-bold shadow-brand"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Signing In...
                </>
              ) : (
                <>
                  Sign In
                  <ChevronRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

// ======= STATS CARD =======
function StatCard({
  icon,
  title,
  value,
  subtitle,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtitle?: string;
  color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-border p-5 shadow-xs"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center ${color.replace("text-", "bg-").replace("-600", "-100").replace("-500", "-100")}`}
        >
          <span className={color}>{icon}</span>
        </div>
      </div>
    </motion.div>
  );
}

// ======= SITE MEDIA CARD =======
function SiteMediaCard() {
  const [media, setMedia] =
    useState<Record<string, string>>(getStoredSiteMedia);
  const saveSiteMediaMutation = useSaveSiteMediaImage();
  const removeSiteMediaMutation = useRemoveSiteMediaImage();

  const slots = [
    {
      key: "heroBg",
      label: "Hero Background Image",
      hint: "Background shown behind the hero section",
      ocidIndex: 1,
    },
    {
      key: "heroChicken",
      label: "Hero Chicken Image",
      hint: "Floating chicken photo on the right side of hero",
      ocidIndex: 2,
    },
    {
      key: "navLogo",
      label: "Navbar Logo",
      hint: "Small logo/icon shown in the header next to the brand name",
      ocidIndex: 3,
    },
  ];

  function handleMediaChange(
    key: string,
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      setStoredSiteMediaItem(key, dataUrl);
      setMedia((prev) => ({ ...prev, [key]: dataUrl }));
      // Also save to backend so all users see the updated image
      try {
        await saveSiteMediaMutation.mutateAsync({ key, dataUrl });
      } catch {
        // Silent fail — localStorage is still saved as fallback
      }
      toast.success("Site media updated! Changes are live on the website.");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function handleRemoveMedia(key: string) {
    removeStoredSiteMediaItem(key);
    setMedia((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    // Also remove from backend
    try {
      await removeSiteMediaMutation.mutateAsync(key);
    } catch {
      // Silent fail
    }
    toast.success("Image removed. Default image restored.");
  }

  return (
    <div className="bg-white rounded-2xl border border-border shadow-xs overflow-hidden">
      <div className="p-5 border-b border-border flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
          <ImagePlus className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Site Media</h3>
          <p className="text-xs text-muted-foreground">
            Change homepage images and site logo — updates go live instantly
          </p>
        </div>
      </div>
      <div className="divide-y divide-border">
        {slots.map((slot) => {
          const uploaded = media[slot.key];
          return (
            <div key={slot.key} className="p-4 flex items-center gap-4">
              {/* Thumbnail */}
              <div className="w-16 h-16 rounded-xl overflow-hidden border border-border flex-shrink-0 bg-muted">
                {uploaded ? (
                  <img
                    src={uploaded}
                    alt={slot.label}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImagePlus className="h-6 w-6 text-muted-foreground/40" />
                  </div>
                )}
              </div>

              {/* Label + hint */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground">
                  {slot.label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {slot.hint}
                </p>
                {uploaded && (
                  <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium mt-1">
                    <Check className="h-3 w-3" />
                    Custom image uploaded
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <label
                  className="cursor-pointer inline-flex items-center gap-1 text-xs font-medium rounded-md border border-input bg-background px-2 py-1.5 shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors select-none"
                  data-ocid={`admin.media.upload_button.${slot.ocidIndex}`}
                >
                  <Upload className="h-3.5 w-3.5" />
                  {uploaded ? "Change" : "Upload"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleMediaChange(slot.key, e)}
                  />
                </label>
                {uploaded && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRemoveMedia(slot.key)}
                    className="gap-1 text-xs border-red-200 text-red-600 hover:bg-red-50 px-2 py-1.5 h-auto"
                    data-ocid={`admin.media.delete_button.${slot.ocidIndex}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ======= PRODUCT EDITOR CARD (prices + images combined) =======
function ProductEditorCard({ products }: { products: Product[] }) {
  const [images, setImages] = useState<Record<string, string>>(
    getStoredProductImages,
  );
  const [prices, setPrices] = useState<Record<string, string>>(() => {
    const stored = getStoredProductPrices();
    const initial: Record<string, string> = {};
    for (const p of products) {
      const idStr = p.id.toString();
      initial[idStr] =
        stored[idStr] !== undefined
          ? stored[idStr].toString()
          : p.pricePerKg.toString();
    }
    return initial;
  });
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const updateRate = useUpdateProductRate();
  const saveProductImageMutation = useSaveProductImage();
  const removeProductImageMutation = useRemoveProductImage();

  // Sync prices when products load/change (only for ids not yet in state)
  useEffect(() => {
    if (!products.length) return;
    const stored = getStoredProductPrices();
    setPrices((prev) => {
      const next = { ...prev };
      for (const p of products) {
        const idStr = p.id.toString();
        if (!(idStr in next)) {
          next[idStr] =
            stored[idStr] !== undefined
              ? stored[idStr].toString()
              : p.pricePerKg.toString();
        }
      }
      return next;
    });
  }, [products]);

  async function handleSavePrice(product: Product) {
    const idStr = product.id.toString();
    const newPrice = Number.parseFloat(prices[idStr] || "0");
    if (Number.isNaN(newPrice) || newPrice <= 0) {
      toast.error("Please enter a valid price.");
      return;
    }
    setPendingIds((prev) => new Set([...prev, idStr]));

    // Save to localStorage immediately — this is the source of truth
    setStoredProductPrice(idStr, newPrice);

    // Attempt backend update (best-effort, silent failure)
    try {
      await updateRate.mutateAsync({ productId: product.id, newPrice });
    } catch {
      // Silent — localStorage is the source of truth for the UI
    }

    setSavedIds((prev) => new Set([...prev, idStr]));
    toast.success(`${product.nameEn} price updated to ₹${newPrice}/kg`);
    setPendingIds((prev) => {
      const next = new Set(prev);
      next.delete(idStr);
      return next;
    });
    setTimeout(() => {
      setSavedIds((prev) => {
        const next = new Set(prev);
        next.delete(idStr);
        return next;
      });
    }, 2000);
  }

  function handleImageChange(
    product: Product,
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      const idStr = product.id.toString();
      setStoredProductImage(idStr, dataUrl);
      setImages((prev) => ({ ...prev, [idStr]: dataUrl }));
      // Also save to backend so all users see the updated image
      try {
        await saveProductImageMutation.mutateAsync({
          productId: idStr,
          dataUrl,
        });
      } catch {
        // Silent fail — localStorage is still saved as fallback
      }
      toast.success(`Image updated for ${product.nameEn}`);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function handleResetImage(product: Product) {
    const idStr = product.id.toString();
    removeStoredProductImage(idStr);
    setImages((prev) => {
      const next = { ...prev };
      delete next[idStr];
      return next;
    });
    // Also remove from backend
    try {
      await removeProductImageMutation.mutateAsync(idStr);
    } catch {
      // Silent fail
    }
    toast.success(`Image reset for ${product.nameEn}`);
  }

  return (
    <div className="bg-white rounded-2xl border border-border shadow-xs overflow-hidden">
      <div className="p-5 border-b border-border flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Edit2 className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Today's Price List</h3>
          <p className="text-xs text-muted-foreground">
            Update prices and product images — changes go live instantly
          </p>
        </div>
      </div>
      <div className="divide-y divide-border">
        {products.map((product, index) => {
          const idStr = product.id.toString();
          const customImg = images[idStr];
          const isSaved = savedIds.has(idStr);
          const isPending = pendingIds.has(idStr);
          const storedPrices = getStoredProductPrices();
          const displayPrice =
            storedPrices[idStr] !== undefined
              ? storedPrices[idStr]
              : product.pricePerKg;

          return (
            <div key={idStr} className="p-4">
              {/* Top row: thumbnail + product info + image actions */}
              <div className="flex items-center gap-3">
                {/* Thumbnail */}
                <div className="w-14 h-14 rounded-xl overflow-hidden border border-border flex-shrink-0 bg-muted">
                  {customImg ? (
                    <img
                      src={customImg}
                      alt={product.nameEn}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImagePlus className="h-5 w-5 text-muted-foreground/40" />
                    </div>
                  )}
                </div>

                {/* Product name */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">
                    {product.nameEn}
                  </p>
                  <p className="text-xs text-accent">{product.nameTe}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Current:{" "}
                    <span className="font-semibold text-primary">
                      ₹{displayPrice}/kg
                    </span>
                  </p>
                </div>

                {/* Image action buttons */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <label
                    className="cursor-pointer inline-flex items-center gap-1 text-xs font-medium rounded-md border border-input bg-background px-2 py-1.5 shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors select-none"
                    data-ocid={`admin.product.upload_button.${index + 1}`}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    {customImg ? "Change" : "Photo"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageChange(product, e)}
                    />
                  </label>
                  {customImg && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResetImage(product)}
                      className="gap-1 text-xs border-red-200 text-red-600 hover:bg-red-50 px-2 py-1.5 h-auto"
                      data-ocid={`admin.product.delete_button.${index + 1}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Price editor row */}
              <div className="flex items-center gap-2 mt-3 pl-[68px]">
                <span className="text-sm text-muted-foreground">₹</span>
                <Input
                  data-ocid={`admin.product.rate_input.${index + 1}`}
                  type="number"
                  value={prices[idStr] ?? ""}
                  onChange={(e) =>
                    setPrices((prev) => ({ ...prev, [idStr]: e.target.value }))
                  }
                  className="w-28 text-right font-mono"
                  min="1"
                  step="1"
                  disabled={isPending}
                  placeholder="Price"
                />
                <span className="text-xs text-muted-foreground">/kg</span>
                <Button
                  data-ocid={`admin.product.save_button.${index + 1}`}
                  size="sm"
                  onClick={() => handleSavePrice(product)}
                  disabled={isPending}
                  className={
                    isSaved
                      ? "bg-green-500 hover:bg-green-500 text-white min-w-[80px]"
                      : "bg-primary text-white hover:bg-primary/90 min-w-[80px]"
                  }
                >
                  {isPending ? (
                    <div className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                  ) : isSaved ? (
                    <>
                      <Check className="h-3.5 w-3.5 mr-1" />
                      Saved!
                    </>
                  ) : (
                    <span className="text-xs font-semibold">Save Price</span>
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ======= FALLBACK PRODUCTS FOR DASHBOARD =======
const ADMIN_FALLBACK_PRODUCTS: Product[] = [
  {
    id: BigInt(1),
    nameEn: "Heat Chicken (Broiler)",
    nameTe: "బ్రాయిలర్ చికెన్",
    pricePerKg: 220,
    isAvailable: true,
    description: "",
    category: "",
  },
  {
    id: BigInt(2),
    nameEn: "Skinless Country Chicken",
    nameTe: "చర్మం లేని దేశీ చికెన్",
    pricePerKg: 350,
    isAvailable: true,
    description: "",
    category: "",
  },
  {
    id: BigInt(3),
    nameEn: "Boneless Chicken",
    nameTe: "బోన్‌లేని చికెన్",
    pricePerKg: 400,
    isAvailable: true,
    description: "",
    category: "",
  },
  {
    id: BigInt(4),
    nameEn: "Chicken Cuts",
    nameTe: "చికెన్ ముక్కలు",
    pricePerKg: 230,
    isAvailable: true,
    description: "",
    category: "",
  },
  {
    id: BigInt(5),
    nameEn: "Freshly Cleaned Chicken",
    nameTe: "తాజాగా శుభ్రపరిచిన చికెన్",
    pricePerKg: 240,
    isAvailable: true,
    description: "",
    category: "",
  },
];

// ======= DASHBOARD =======
function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const today = getTodayDate();
  const { data: products = [] } = useGetProducts();
  const initializeProducts = useInitializeProducts();
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Local orders state -- primary source of truth for the admin portal
  const [localOrders, setLocalOrders] = useState<LocalOrder[]>(() =>
    getTodayLocalOrders(),
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Initialize products if empty
  const adminInitMutate = initializeProducts.mutate;
  useEffect(() => {
    if (products.length === 0) {
      adminInitMutate();
    }
  }, [products.length, adminInitMutate]);

  // Refresh local orders from localStorage
  const refreshLocalOrders = useCallback(() => {
    setLocalOrders(getTodayLocalOrders());
    setLastRefresh(new Date());
  }, []);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    refreshLocalOrders();
    setTimeout(() => setIsRefreshing(false), 500);
  }, [refreshLocalOrders]);

  // Auto-refresh every 15 seconds + listen for storage events
  useEffect(() => {
    const timer = setInterval(handleRefresh, 15 * 1000);
    const storageHandler = (e: StorageEvent) => {
      if (e.key === LOCAL_ORDERS_STORAGE_KEY) refreshLocalOrders();
    };
    window.addEventListener("storage", storageHandler);
    return () => {
      clearInterval(timer);
      window.removeEventListener("storage", storageHandler);
    };
  }, [handleRefresh, refreshLocalOrders]);

  const displayProducts =
    products.length > 0 ? products : ADMIN_FALLBACK_PRODUCTS;

  const totalOrders = localOrders.length;
  const completedOrders = localOrders.filter(
    (o) => o.status === "completed",
  ).length;
  const pendingOrders = totalOrders - completedOrders;
  const totalRevenue = localOrders
    .filter((o) => o.status === "completed")
    .reduce((sum, o) => sum + o.totalAmount, 0);

  function handleMarkComplete(orderId: string) {
    updateLocalOrderStatus(orderId, "completed");
    refreshLocalOrders();
    toast.success(`Order #${orderId} marked as completed.`);
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Admin Header */}
      <header className="bg-white border-b border-border sticky top-0 z-30 shadow-xs">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-foreground text-lg">
              Admin Dashboard
            </h1>
            <p className="text-xs text-muted-foreground">
              MADEENA CHICKEN CENTER •{" "}
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              className="gap-2 text-xs"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button
              data-ocid="admin.logout_button"
              onClick={onLogout}
              variant="outline"
              size="sm"
              className="gap-2 text-xs border-primary/30 text-primary hover:bg-primary/5"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<ShoppingBag className="h-6 w-6" />}
            title="Today's Orders"
            value={totalOrders}
            subtitle="Total orders today"
            color="text-blue-600"
          />
          <StatCard
            icon={<CheckCircle className="h-6 w-6" />}
            title="Completed"
            value={completedOrders}
            subtitle="Orders fulfilled"
            color="text-green-600"
          />
          <StatCard
            icon={<Clock className="h-6 w-6" />}
            title="Pending"
            value={pendingOrders}
            subtitle="Awaiting completion"
            color="text-orange-500"
          />
          <StatCard
            icon={<DollarSign className="h-6 w-6" />}
            title="Revenue"
            value={`₹${totalRevenue.toLocaleString("en-IN")}`}
            subtitle="Today's revenue"
            color="text-primary"
          />
        </div>

        {/* Last refresh */}
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <TrendingUp className="h-3 w-3" />
          Last refreshed:{" "}
          {lastRefresh.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}{" "}
          • Auto-refreshes every 30 seconds
        </p>

        {/* Site Media Editor */}
        <SiteMediaCard />

        {/* Today's Price List & Image Editor */}
        <ProductEditorCard products={displayProducts} />

        {/* Orders Table */}
        <div className="bg-white rounded-2xl border border-border shadow-xs overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Package className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  Today's Orders
                </h3>
                <p className="text-xs text-muted-foreground">
                  {localOrders.length} orders on {today}
                </p>
              </div>
            </div>
            <Badge
              className={
                pendingOrders > 0
                  ? "bg-orange-100 text-orange-700 border-orange-200"
                  : "bg-green-100 text-green-700 border-green-200"
              }
            >
              {pendingOrders > 0 ? `${pendingOrders} pending` : "All done!"}
            </Badge>
          </div>

          <div className="overflow-x-auto" data-ocid="admin.orders_table">
            {localOrders.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="font-medium">No orders today yet</p>
                <p className="text-xs mt-1">
                  Orders will appear here as they come in.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-xs font-semibold">
                      Order ID
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Customer
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Phone
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Items
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-right">
                      Total
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Status
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Time
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {localOrders.map((order, index) => (
                    <TableRow key={order.id} className="hover:bg-muted/20">
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        #{order.id.slice(-6)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <User className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <span className="text-sm font-medium text-foreground">
                            {order.customerName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <a
                          href={`tel:${order.customerPhone}`}
                          className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                          <Phone className="h-3 w-3" />
                          {order.customerPhone}
                        </a>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground max-w-[160px] block truncate">
                          {order.items
                            .map(
                              (item) =>
                                `${item.productName} ×${item.quantity}${item.unit}`,
                            )
                            .join(", ")}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-semibold text-sm text-primary">
                          ₹{order.totalAmount}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            order.status === "completed"
                              ? "bg-green-100 text-green-700 border-green-200 text-xs"
                              : "bg-yellow-100 text-yellow-700 border-yellow-200 text-xs"
                          }
                        >
                          {order.status === "completed"
                            ? "✓ Done"
                            : "⏳ Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </TableCell>
                      <TableCell>
                        {order.status !== "completed" ? (
                          <Button
                            data-ocid={`admin.order.complete_button.${index + 1}`}
                            size="sm"
                            onClick={() => handleMarkComplete(order.id)}
                            className="bg-green-500 hover:bg-green-600 text-white text-xs h-7 px-2"
                          >
                            <CheckCircle className="h-3.5 w-3.5 mr-1" />
                            Complete
                          </Button>
                        ) : (
                          <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                            <CheckCircle className="h-3.5 w-3.5" />
                            Done
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// ======= ADMIN PORTAL ROOT =======
export default function AdminPortal() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    try {
      const session = localStorage.getItem(ADMIN_SESSION_KEY);
      if (!session) return false;
      const parsed = JSON.parse(session);
      return parsed.loggedIn === true;
    } catch {
      return false;
    }
  });

  function handleLogin() {
    setIsLoggedIn(true);
  }

  function handleLogout() {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    setIsLoggedIn(false);
    toast.success("Logged out successfully.");
  }

  return (
    <AnimatePresence mode="wait">
      {isLoggedIn ? (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <AdminDashboard onLogout={handleLogout} />
        </motion.div>
      ) : (
        <motion.div
          key="login"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <AdminLogin onLogin={handleLogin} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
