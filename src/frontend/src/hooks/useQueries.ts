import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { DailyStats, Order, Product } from "../backend.d";
import { useActor } from "./useActor";

export function useGetProducts() {
  const { actor, isFetching } = useActor();
  return useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getProducts();
    },
    enabled: !!actor && !isFetching,
    staleTime: 5 * 60 * 1000,
  });
}

export function useGetTodayOrders() {
  const { actor, isFetching } = useActor();
  return useQuery<Order[]>({
    queryKey: ["todayOrders"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTodayOrders();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30 * 1000,
  });
}

export function useGetDailyStats(date: string) {
  const { actor, isFetching } = useActor();
  return useQuery<DailyStats>({
    queryKey: ["dailyStats", date],
    queryFn: async () => {
      if (!actor)
        return {
          totalOrders: BigInt(0),
          completedOrders: BigInt(0),
          totalRevenue: 0,
        };
      return actor.getDailyStats(date);
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30 * 1000,
  });
}

export function usePlaceOrder() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      customerName,
      customerPhone,
      items,
    }: {
      customerName: string;
      customerPhone: string;
      items: Array<{ productId: bigint; quantity: number; unit: string }>;
    }) => {
      if (!actor) {
        // Return a local fallback order ID so the WhatsApp flow still works
        return BigInt(Date.now() % 1000000);
      }
      try {
        return await actor.placeOrder(customerName, customerPhone, items);
      } catch (err) {
        // If backend call fails, still return a local ID so WhatsApp notification works
        console.warn("Backend placeOrder failed, using local fallback:", err);
        return BigInt(Date.now() % 1000000);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todayOrders"] });
      queryClient.invalidateQueries({ queryKey: ["dailyStats"] });
    },
  });
}

export function useUpdateOrderStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orderId,
      status,
    }: {
      orderId: bigint;
      status: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateOrderStatus(orderId, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todayOrders"] });
      queryClient.invalidateQueries({ queryKey: ["dailyStats"] });
    },
  });
}

export function useUpdateProductRate() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      productId,
      newPrice,
    }: {
      productId: bigint;
      newPrice: number;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateProductRate(productId, newPrice);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useInitializeProducts() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      return actor.initializeProducts();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useGetProductImages() {
  const { actor, isFetching } = useActor();
  return useQuery<Record<string, string>>({
    queryKey: ["productImages"],
    queryFn: async () => {
      if (!actor) return {};
      const entries = await actor.getProductImages();
      return Object.fromEntries(entries);
    },
    enabled: !!actor && !isFetching,
    staleTime: 30 * 1000,
  });
}

export function useGetSiteMediaImages() {
  const { actor, isFetching } = useActor();
  return useQuery<Record<string, string>>({
    queryKey: ["siteMediaImages"],
    queryFn: async () => {
      if (!actor) return {};
      const entries = await actor.getSiteMediaImages();
      return Object.fromEntries(entries);
    },
    enabled: !!actor && !isFetching,
    staleTime: 30 * 1000,
  });
}

export function useSaveProductImage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      productId,
      dataUrl,
    }: {
      productId: string;
      dataUrl: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.saveProductImage(productId, dataUrl);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productImages"] });
    },
  });
}

export function useRemoveProductImage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (productId: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.removeProductImage(productId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productImages"] });
    },
  });
}

export function useSaveSiteMediaImage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, dataUrl }: { key: string; dataUrl: string }) => {
      if (!actor) throw new Error("Not connected");
      return actor.saveSiteMediaImage(key, dataUrl);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["siteMediaImages"] });
    },
  });
}

export function useRemoveSiteMediaImage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (key: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.removeSiteMediaImage(key);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["siteMediaImages"] });
    },
  });
}

export type { Product, Order, DailyStats };
