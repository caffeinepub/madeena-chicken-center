import Map "mo:core/Map";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Float "mo:core/Float";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Char "mo:core/Char";

actor {
  // Types
  type Product = {
    id : Nat;
    nameEn : Text;
    nameTe : Text;
    description : Text;
    pricePerKg : Float;
    category : Text;
    isAvailable : Bool;
  };

  type Order = {
    id : Nat;
    customerName : Text;
    customerPhone : Text;
    products : [OrderItem];
    totalAmount : Float;
    status : Text;
    createdAt : Int;
    orderDate : Text;
  };

  type OrderItem = {
    productId : Nat;
    quantity : Float;
    unit : Text;
  };

  type DailyStats = {
    totalOrders : Nat;
    completedOrders : Nat;
    totalRevenue : Float;
  };

  public type UserProfile = {
    name : Text;
  };

  // Internal Maps for products and orders
  let products = Map.empty<Nat, Product>();
  let orders = Map.empty<Nat, Order>();
  var nextProductId = 1;
  var nextOrderId = 1;
  var isInitialized = false;

  // Authorization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User profiles
  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Initialize Products (default inventory) - Admin only, one-time initialization
  public shared ({ caller }) func initializeProducts() : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can initialize products");
    };

    if (isInitialized) {
      Runtime.trap("Products already initialized");
    };

    if (products.isEmpty()) {
      let defaultProducts : [Product] = [
        {
          id = 1;
          nameEn = "Heat Chicken (Broiler)";
          nameTe = "బ్రోయిలర్ చికెన్";
          description = "Fresh broiler chicken.";
          pricePerKg = 220.0;
          category = "Poultry";
          isAvailable = true;
        },
        {
          id = 2;
          nameEn = "Skinless Country Chicken";
          nameTe = "చర్మం లేని దేశీ చికెన్";
          description = "Country chicken without skin.";
          pricePerKg = 350.0;
          category = "Poultry";
          isAvailable = true;
        },
        {
          id = 3;
          nameEn = "Boneless Chicken";
          nameTe = "బోన్‌లేని చికెన్";
          description = "Boneless chicken pieces.";
          pricePerKg = 400.0;
          category = "Poultry";
          isAvailable = true;
        },
        {
          id = 4;
          nameEn = "Chicken Cuts";
          nameTe = "చికెన్ ముక్కలు";
          description = "Various chicken cuts.";
          pricePerKg = 230.0;
          category = "Poultry";
          isAvailable = true;
        },
        {
          id = 5;
          nameEn = "Freshly Cleaned Chicken";
          nameTe = "తాజాగా శుభ్రపరిచిన చికెన్";
          description = "Cleaned and ready to cook.";
          pricePerKg = 240.0;
          category = "Poultry";
          isAvailable = true;
        },
      ];

      for (product in defaultProducts.values()) {
        products.add(product.id, product);
      };
      nextProductId := 6;
      isInitialized := true;
    };
  };

  // Get Products - Public access (anyone can view the catalog)
  public query ({ caller }) func getProducts() : async [Product] {
    products.values().toArray();
  };

  // Trimming function
  func ltrim(text : Text) : Text {
    let chars = text.chars();
    let iter = chars.dropWhile(func(c) { c == ' ' });
    Text.fromIter(iter);
  };

  func rtrim(text : Text) : Text {
    let length = text.size();
    let reversed = text.chars().toArray().reverse();
    let iter = reversed.values().dropWhile(func(c) { c == ' ' });
    let trimmedReversed = iter.toArray();
    let trimmedLength = trimmedReversed.size();
    let resultChars = trimmedReversed.reverse().values();
    Text.fromIter(resultChars);
  };

  func trim(text : Text) : Text {
    ltrim(rtrim(text));
  };

  // Placing Orders - Any authenticated user (including guests) can place orders
  public shared ({ caller }) func placeOrder(customerName : Text, customerPhone : Text, items : [OrderItem]) : async Nat {
    // Allow any caller including guests to place orders (no authorization check needed)
    // This is a public-facing e-commerce function

    let order : Order = {
      id = nextOrderId;
      customerName = trim(customerName);
      customerPhone = trim(customerPhone);
      products = items;
      totalAmount = calculateTotal(items);
      status = "pending";
      createdAt = Time.now();
      orderDate = currentDate();
    };

    orders.add(nextOrderId, order);
    nextOrderId += 1;
    order.id;
  };

  // Calculate Total Amount
  func calculateTotal(items : [OrderItem]) : Float {
    var total : Float = 0.0;
    for (item in items.values()) {
      switch (products.get(item.productId)) {
        case (?product) {
          total += product.pricePerKg * item.quantity;
        };
        case (null) {};
      };
    };
    total;
  };

  // Daily Stats - Admin only (business metrics)
  public query ({ caller }) func getDailyStats(date : Text) : async DailyStats {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view daily statistics");
    };

    var totalOrders = 0;
    var completedOrders = 0;
    var totalRevenue : Float = 0.0;

    for (order in orders.values()) {
      if (order.orderDate == date) {
        totalOrders += 1;
        if (order.status == "completed") {
          completedOrders += 1;
          totalRevenue += order.totalAmount;
        };
      };
    };

    {
      totalOrders;
      completedOrders;
      totalRevenue;
    };
  };

  // Helper to Get Current Date
  func currentDate() : Text {
    let timestamp = Time.now();
    let daysSinceEpoch = timestamp / 86_400_000_000_000;
    let daysWithRemainder = daysSinceEpoch % 365;
    let dayCount = Int.abs(daysWithRemainder) + 1 : Int;
    let dayOfYear = dayCount % 365;
    let month = (dayOfYear / 30) + 1;
    let day = dayOfYear % 30;
    let monthString = if (month < 10) { "0" # Int.abs(month).toText() } else {
      Int.abs(month).toText();
    };
    let dayString = if (day < 10) { "0" # Int.abs(day).toText() } else {
      Int.abs(day).toText();
    };

    "2024-" # monthString # "-" # dayString;
  };

  // Get Orders for Specific Date - Admin only (contains sensitive customer data)
  public query ({ caller }) func getOrders(date : Text) : async [Order] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view orders");
    };

    orders.values().toArray().filter(func(order) { order.orderDate == date });
  };

  // Get Today's Orders (sorted by createdAt descending) - Admin only
  public query ({ caller }) func getTodayOrders() : async [Order] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view orders");
    };

    let today = currentDate();
    let todayOrders = orders.values().toArray().filter(func(order) { order.orderDate == today });
    todayOrders.sort(
      func(o1, o2) { Int.compare(o1.createdAt, o2.createdAt) }
    );
  };

  // Update Order Status (admin only)
  public shared ({ caller }) func updateOrderStatus(orderId : Nat, status : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update order status");
    };

    switch (orders.get(orderId)) {
      case (?order) {
        orders.add(
          orderId,
          {
            id = order.id;
            customerName = order.customerName;
            customerPhone = order.customerPhone;
            products = order.products;
            totalAmount = order.totalAmount;
            status = status;
            createdAt = order.createdAt;
            orderDate = order.orderDate;
          },
        );
      };
      case (null) {
        Runtime.trap("Order not found");
      };
    };
  };

  // Update Product Rate (admin only)
  public shared ({ caller }) func updateProductRate(productId : Nat, newPrice : Float) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update product rates");
    };

    switch (products.get(productId)) {
      case (?product) {
        products.add(
          productId,
          {
            id = product.id;
            nameEn = product.nameEn;
            nameTe = product.nameTe;
            description = product.description;
            pricePerKg = newPrice;
            category = product.category;
            isAvailable = product.isAvailable;
          },
        );
      };
      case (null) {
        Runtime.trap("Product not found");
      };
    };
  };
};
