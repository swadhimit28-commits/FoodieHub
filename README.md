# FoodieHub – Online Food Ordering System

A full-stack, enterprise-grade Online Food Ordering Platform built with **Vanilla HTML5, CSS3, JavaScript, Bootstrap 5**, powered by a **Node.js + Express.js** backend and **MySQL 8.0** relational database.

Inspired by the visual structure and section arrangement of the Grand Stay Hotel Booking platform, transformed into a food ordering experience.

---

## 🌟 Key Highlights & Architecture

### **Architecture Flow**
```
HTML5 Interface ➔ Vanilla JS Event Handlers ➔ Fetch API (Async/Await) ➔ Express.js REST Routes ➔ MySQL 8.0 Database (mysql2 Pool & Transactions)
```

### **Tech Stack**
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+), Bootstrap 5.3.3, Bootstrap Icons 1.11.3
- **Backend**: Node.js v26+, Express.js 4.x, Express-Session, CORS, Dotenv, Bcrypt
- **Database**: MySQL 8.0 Community Server (`mysql2/promise` connection pool)
- **Security**: Bcrypt password hashing (10 salt rounds), Parameterized SQL queries (preventing SQL injection), ACID transactions for order placement, HTTP-only session cookies.

---

## 🗄️ Database Design (`food_ordering_db`)

The relational database consists of 6 structured tables with primary keys, foreign keys, and cascading constraints:

1. **`customers`**: Registered customer records (`customer_id`, `name`, `email`, `phone`, `address`, `city`, `state`, `pincode`, `password`, `created_at`)
2. **`admins`**: Administrator accounts (`admin_id`, `username`, `email`, `password`, `role`, `created_at`)
3. **`restaurants`**: Partner kitchens (`restaurant_id`, `name`, `cuisine`, `address`, `rating`, `image_url`, `created_at`)
4. **`food_items`**: Menu catalog (`food_id`, `restaurant_id`, `name`, `category`, `description`, `price`, `is_available`, `image_url`, `created_at`)
5. **`orders`**: Customer orders (`order_id`, `customer_id`, `customer_name`, `delivery_phone`, `delivery_address`, `delivery_city`, `delivery_state`, `delivery_pincode`, `special_instructions`, `payment_method`, `subtotal`, `delivery_fee`, `tax`, `total_amount`, `status`, `created_at`)
6. **`order_items`**: Detailed line items (`order_item_id`, `order_id`, `food_id`, `food_name`, `price`, `quantity`, `subtotal`)

---

## 🚀 Running the Project

### **Prerequisites**
- Node.js (v18+)
- MySQL Server 8.0 (running on port `3306`)

### **1. Environment Configuration (`.env`)**
```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sivanesh
DB_NAME=food_ordering_db
DB_PORT=3306
SESSION_SECRET=foodiehub_super_secret_session_key_2026
```

### **2. Setup Database & Seed Demonstration Data**
```bash
npm run seed
```
*Creates the database, builds all relational tables, seeds default admin (`admin` / `admin123`), 6 partner restaurants, and 24 delicious food dishes across all 6 categories.*

### **3. Start the Server**
```bash
npm start
```
The server will start on: **`http://localhost:3000`**

---

## 💻 Pages & Features

### **1. Customer Storefront (`/index.html`)**
- **Navigation Bar**: Brand logo, active links, live cart badge counter, and customer login/register modal toggles or profile dropdown.
- **Hero Carousel**: 3 high-resolution food slides with call-to-action buttons ("Order Now", "Explore Menu").
- **About Our Platform**: 2-column layout showcasing culinary hygiene, organic ingredients, and swift delivery.
- **Popular Food Categories (Collage Grid)**: Visual grid matching Grand Stay `.room-collage` style for 6 categories:
  1. *South Indian* (Ghee Podi Masala Dosa, Idli-Vada Combo, Biryani)
  2. *North Indian* (Paneer Butter Masala, Butter Naan, Dal Makhani)
  3. *Chinese* (Hakka Noodles, Chilli Chicken, Dim Sums)
  4. *Fast Food* (Cheese Crunch Burgers, Peri-Peri Fries, BBQ Wings)
  5. *Pizza* (Wood-Fired Margherita, Farmhouse Supreme, Pepperoni)
  6. *Desserts* (Choco Lava Cake, Gulab Jamun, Rasmalai, Cheesecake)
- **Popular Foods Section**: Live search, category filter pills, restaurant filter dropdown, food cards with availability indicators, "View Details" modal, and "Add to Cart" actions.
- **Our Services Grid**: 6 service cards with dark overlays and icons (*Fast Delivery, Fresh Food, Secure Ordering, Quality Restaurants, Easy Payments, Customer Support*).
- **FAQ Accordion**: Expandable Bootstrap accordion answering frequent order and hygiene questions.
- **Contact Us**: Contact details alongside a functional message submission form.
- **Cart Drawer (Offcanvas)**: Real-time item additions, quantity increment/decrement, item removal, and subtotal/tax/delivery calculations.
- **Multi-Step Checkout Wizard**:
  - *Step 1*: Customer Details
  - *Step 2*: Delivery Address
  - *Step 3*: Order Summary & Payment Mode (COD, UPI, Card)
  - *Step 4*: Review & Place Order (ACID MySQL Transaction)
- **Order Confirmation Modal**: Live receipt display with generated Order ID.

### **2. Customer Order History (`/my-orders.html`)**
- Full order tracking table with live status badges (*Pending, Preparing, Out for Delivery, Delivered, Cancelled*).
- Order receipt modal displaying item breakdown, taxes, and delivery address.
- One-click order cancellation for eligible orders (status is *Pending*).

### **3. Admin Dashboard (`/admin.html`)**
- **Admin Authentication**: Secured login with admin credentials (`admin` / `admin123`).
- **Dashboard Overview Metrics**: Total Orders, Total Revenue, Food Items, Registered Customers, and Kitchens.
- **Orders Management Tab**: Change order status with automatic live update across the platform.
- **Food Catalog Tab**: Add new food dishes, edit items, toggle in-stock availability, or delete items.
- **Partner Restaurants Tab**: Add new kitchens, edit details, and track menu counts.
- **Customers Directory Tab**: View all registered customer profiles, contact numbers, order counts, and total amount spent.

---

## 🧪 Automated Test Suite

Run the full system integration test suite:
```bash
node test_suite.js
```
Verifies all 10 modules: Homepage loading, food search/filters, customer registration, session authorization, transaction-based order placement, customer order history, admin authentication, status updates, food CRUD, customer directory, and contact form handling.
