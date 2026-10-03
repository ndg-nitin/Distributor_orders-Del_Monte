# Distributor Orders – Del Monte

**Offline-first Progressive Web App for distributor order management.**

A lightweight, mobile-friendly tool designed for field sales representatives and distributors of Del Monte products. Create and manage orders, maintain store records, and share order details via WhatsApp — all while working completely offline.

### 🚀 Live Demo

**[https://magnificent-mooncake-5a6ca5.netlify.app/](https://magnificent-mooncake-5a6ca5.netlify.app/)**

---

## Features

### Dashboard
- Quick access to New Order, Stores, Products, Orders, and Backup
- Live counts of products, stores, and orders
- Online / Offline connection status indicator

### Products
- Pre-loaded Del Monte product catalog (juices, sauces, mayonnaise, pasta, dates, olives, canned fruits, olive oil, etc.)
- Search by name, SKU, or brand
- Displays MRP and selling rate
- Stock status (`Active` / `Out of Stock`)
- One-click refresh from `data/products.json` (when online)

### Stores
- Add, edit, and search stores
- Fields: Name, Address, Area, Owner, Phone
- Capture GPS location (latitude, longitude, accuracy)
- Temporary (one-time) stores supported during order creation

### Orders
- Create orders against registered or temporary stores
- Search and add products with quantities
- Automatic calculation of line totals and grand total
- Capture delivery location
- Add free-text notes
- View order history
- Share order via WhatsApp (pre-formatted message + Google Maps link)
- Copy message to clipboard as fallback

### Backup & Data Portability
- Export / Import functionality for local data

### Offline Support
- Fully functional without internet after first load
- Service Worker caches app shell and data files
- All data stored locally in IndexedDB (via Dexie.js)

---

## Tech Stack

| Layer              | Technology                          |
|--------------------|-------------------------------------|
| Frontend           | HTML5, CSS3, Vanilla JavaScript     |
| Local Database     | IndexedDB + Dexie.js                |
| Offline Caching    | Service Worker                      |
| PWA                | Web App Manifest                    |
| Location           | Geolocation API                     |
| Sharing            | WhatsApp Web (`wa.me`)              |

No backend, no build tools, no frameworks required.

---

## Getting Started

### Live Demo

Try the app instantly:  
**[https://magnificent-mooncake-5a6ca5.netlify.app/](https://magnificent-mooncake-5a6ca5.netlify.app/)**

### Option 1: Run Locally

1. Clone the repository:
   ```bash
   git clone https://github.com/ndg-nitin/Distributor_orders-Del_Monte.git
   cd Distributor_orders-Del_Monte
   ```

2. Serve the folder with any static file server (required for Service Worker and fetch to work correctly):

   ```bash
   # Using Python
   python -m http.server 8000

   # Using Node.js (npx)
   npx serve .

   # Using VS Code Live Server extension
   ```

3. Open `http://localhost:8000` in a modern browser (Chrome / Edge / Safari recommended).

### Option 2: Install as PWA

1. Open the app in a supported browser.
2. Use the browser’s “Install App” / “Add to Home Screen” option.
3. The app will open in standalone mode and work offline.

---

## Project Structure

```
Distributor_orders-Del_Monte/
├── index.html              # Main application shell
├── manifest.json           # PWA configuration
├── sw.js                   # Service Worker
├── css/
│   └── style.css           # Application styles
├── js/
│   ├── app.js              # Core UI logic & navigation
│   ├── database.js         # Dexie / IndexedDB operations
│   ├── products.js         # Product-related helpers
│   ├── stores.js           # Store-related helpers
│   ├── orders.js           # Order-related helpers
│   ├── whatsapp.js         # WhatsApp message builder
│   └── dexie.min.js        # Dexie library
├── data/
│   ├── products.json       # Product master data
│   └── stores.json         # Initial store seed data
└── assets/
    └── icons/              # App icons (192×192, 512×512)
```

---

## Data Model (IndexedDB)

### Products
- `sku` (primary key)
- `name`, `brand`, `mrp`, `rate`, `unit`, `status`

### Stores
- `id` (primary key)
- `name`, `address`, `area`, `owner`, `mobile`
- `latitude`, `longitude`, `accuracy`, `locationCapturedAt`

### Orders
- `id`, `orderNumber`, `storeId`
- `storeNameSnapshot`, `storeAddressSnapshot`, etc.
- `items[]` (product, qty, rate, amount)
- `totalItems`, `totalAmount`
- `latitude`, `longitude`, `notes`
- `date`, `status`, `updatedAt`

---

## Updating Product Master

1. Edit `data/products.json`.
2. Open the app while online.
3. Go to **Products** → click **Refresh Products**.
4. The app compares the JSON with the local database and applies additions, updates, and removals.

---

## Browser Support

- Chrome / Edge (recommended)
- Safari (iOS 16.4+)
- Firefox (limited Service Worker support on some platforms)

Geolocation and clipboard features require HTTPS or `localhost`.

---

## License

This project currently has no license specified.  
Feel free to use and modify it for personal or internal business purposes.  
If you plan to distribute or commercialize it, please add an appropriate license.

---

## Author

Created by [ndg-nitin](https://github.com/ndg-nitin)

---

**Happy ordering!** 🛒📦
