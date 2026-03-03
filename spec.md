# Madeena Chicken Center

## Current State
- Admin dashboard at `/admin` with login (username: admin, password: madeena2024)
- Dashboard shows stats cards, orders table, ProductRateEditor, and ProductImageManager
- ProductRateEditor calls `backend.updateProductRate()` which requires ICP admin auth -- fails silently because the admin session is localStorage-only (not Internet Identity)
- ProductImageManager works via localStorage and public site reads those images
- Price/image editors are at the bottom of the page and hard to find
- Public website reads prices from `backendProducts` (backend) for display -- does NOT read locally-stored prices

## Requested Changes (Diff)

### Add
- `PRODUCT_PRICES_STORAGE_KEY` and helper functions (`getStoredProductPrices`, `setStoredProductPrice`) in AdminPortal.tsx (same pattern as product images)
- A combined "Today's Price List & Images" card prominently displayed in the dashboard -- directly below the stats cards -- showing each product with its current price, an editable price input, and an image upload button, all in one row per product
- Public website reads stored prices (localStorage) and merges with backend prices -- localStorage takes priority so admin-set prices show immediately

### Modify
- Remove the separate `ProductRateEditor` and `ProductImageManager` sections at the bottom
- Merge them into one `ProductEditorCard` component with a clear heading "Today's Price List" visible as soon as admin logs in
- Price save button immediately updates localStorage AND attempts backend call (best-effort, no error shown if backend rejects)
- PublicWebsite: in `getProductImage` and a new `getProductPrice` helper, check localStorage first before using backend value
- Product cards on public website use `getProductPrice(product)` instead of `product.pricePerKg` directly

### Remove
- Separate `ProductRateEditor` component
- Separate `ProductImageManager` component
- `updateProductRate` backend call as the primary save mechanism (keep as secondary/best-effort)

## Implementation Plan
1. Add localStorage price helpers to AdminPortal.tsx (`PRODUCT_PRICES_STORAGE_KEY`, `getStoredProductPrices`, `setStoredProductPrice`, `removeStoredProductPrice`)
2. Create combined `ProductEditorCard` component: table-like layout, one row per product showing name, image thumbnail, price input, save button, upload button
3. Replace `ProductRateEditor` + `ProductImageManager` with `ProductEditorCard` placed right after stats
4. Export `getStoredProductPrices` from AdminPortal.tsx
5. In PublicWebsite.tsx, import `getStoredProductPrices` and create `getProductPrice(product)` helper
6. Update product card rendering in PublicWebsite to use `getProductPrice(product)` and also update WhatsApp message to use stored price
7. Validate and build
