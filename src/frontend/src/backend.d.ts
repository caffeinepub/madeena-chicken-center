import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface OrderItem {
    unit: string;
    productId: bigint;
    quantity: number;
}
export interface DailyStats {
    totalOrders: bigint;
    completedOrders: bigint;
    totalRevenue: number;
}
export interface Order {
    id: bigint;
    customerName: string;
    status: string;
    customerPhone: string;
    createdAt: bigint;
    orderDate: string;
    totalAmount: number;
    products: Array<OrderItem>;
}
export interface UserProfile {
    name: string;
}
export interface Product {
    id: bigint;
    nameEn: string;
    nameTe: string;
    pricePerKg: number;
    isAvailable: boolean;
    description: string;
    category: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDailyStats(date: string): Promise<DailyStats>;
    getOrders(date: string): Promise<Array<Order>>;
    getProductImages(): Promise<Array<[string, string]>>;
    getProducts(): Promise<Array<Product>>;
    getSiteMediaImages(): Promise<Array<[string, string]>>;
    getTodayOrders(): Promise<Array<Order>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    initializeProducts(): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    placeOrder(customerName: string, customerPhone: string, items: Array<OrderItem>): Promise<bigint>;
    removeProductImage(productId: string): Promise<void>;
    removeSiteMediaImage(key: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveProductImage(productId: string, dataUrl: string): Promise<void>;
    saveSiteMediaImage(key: string, dataUrl: string): Promise<void>;
    updateOrderStatus(orderId: bigint, status: string): Promise<void>;
    updateProductRate(productId: bigint, newPrice: number): Promise<void>;
}
