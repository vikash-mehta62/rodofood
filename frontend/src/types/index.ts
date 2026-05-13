// ─── Core Types ───────────────────────────────────────────────────────────────

export type UserRole = 'customer' | 'restaurant' | 'admin';

export interface User {
  _id: string;
  name?: string;
  phone: string;
  email?: string;
  role: UserRole;
  isActive: boolean;
  profileImage?: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isNewUser: boolean;
}

// ─── Route Types ──────────────────────────────────────────────────────────────

export interface Waypoint {
  name: string;
  coordinates: { lat: number; lng: number };
  order: number;
}

export interface Route {
  _id: string;
  name: string;
  slug: string;
  fromCity: string;
  toCity: string;
  totalDistanceKm?: number;
  waypoints: Waypoint[];
}

// ─── Restaurant Types ─────────────────────────────────────────────────────────

export type FoodType = 'veg' | 'non-veg' | 'both';

export interface Restaurant {
  _id: string;
  name: string;
  description?: string;
  phone: string;
  images: string[];
  coverImage?: string;
  address: { street?: string; city: string; state?: string; pincode?: string };
  location: { type: 'Point'; coordinates: [number, number] }; // [lng, lat]
  foodType: FoodType;
  cuisines: string[];
  rating: number;
  totalRatings: number;
  isOpen: boolean;
  isActive: boolean;
  gstRate: number;
  avgPrepTimeMinutes: number;
  routeWaypointOrder?: number;
  // Enriched fields
  distanceKm?: number | null;
  position?: 'ahead' | 'passed';
}

// ─── Menu Types ───────────────────────────────────────────────────────────────

export type MenuFoodType = 'veg' | 'non-veg' | 'egg';

export interface MenuItem {
  _id: string;
  restaurant: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  discountedPrice?: number;
  image?: string;
  foodType: MenuFoodType;
  isAvailable: boolean;
  isPopular: boolean;
  preparationTime: number;
  tags: string[];
}

export type MenuGrouped = Record<string, MenuItem[]>;

// ─── Cart Types ───────────────────────────────────────────────────────────────

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

export interface CartState {
  restaurantId: string | null;
  restaurantName: string | null;
  items: CartItem[];
  orderType: 'dine-in' | 'takeaway';
  etaMinutes: number | null;
  customerETA: string | null;
  couponCode: string | null;
  discount: number;
}

// ─── Order Types ──────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled'
  | 'rejected';

export type PaymentMethod = 'cash' | 'upi_at_restaurant' | 'online';

export interface Order {
  _id: string;
  orderNumber: string;
  customer: User | string;
  restaurant: Restaurant | string;
  items: Array<{
    menuItem: MenuItem | string;
    name: string;
    price: number;
    quantity: number;
    foodType: MenuFoodType;
  }>;
  subtotal: number;
  gstAmount: number;
  gstRate: number;
  discount: number;
  totalAmount: number;
  couponCode?: string;
  orderType: 'dine-in' | 'takeaway';
  paymentMethod: PaymentMethod;
  customerETA: string;
  etaMinutes?: number;
  status: OrderStatus;
  statusHistory: Array<{ status: string; timestamp: string; note?: string }>;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentTransactionId?: string;
  razorpayOrderId?: string;
  refundId?: string;
  rejectionReason?: string;
  cancellationImages?: string[];
  customerLocation?: { lat: number; lng: number; distanceFromRestaurantKm?: number };
  createdAt: string;
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// ─── Trip Planning ────────────────────────────────────────────────────────────

export interface TripState {
  selectedRoute: Route | null;
  fromCity: string;
  toCity: string;
  userLocation: { lat: number; lng: number } | null;
}
