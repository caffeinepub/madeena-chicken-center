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
      if (!actor) throw new Error("Not connected");
      return actor.placeOrder(customerName, customerPhone, items);
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

export type { Product, Order, DailyStats };
