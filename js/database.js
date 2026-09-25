const db = new Dexie("DistributorOrdersDB");

db.version(1).stores({
    products: "sku, name, brand",
    stores: "id, name, owner, mobile, area",
    orders: "id, storeId, date, status"
});


async function initializeDatabase() {

    try {

        console.log("Initializing local database...");

        await seedProducts();
        await seedStores();

        console.log("Local database initialized successfully.");

    } catch (error) {

        console.error(
            "Database initialization failed:",
            error
        );

    }
}


/* =========================
   PRODUCTS
========================= */

async function seedProducts() {

    const existingCount = await db.products.count();

    if (existingCount > 0) {
        console.log(
            `Products already exist: ${existingCount}`
        );
        return;
    }

    const response = await fetch("./data/products.json");

    if (!response.ok) {
        throw new Error(
            "Unable to load products.json"
        );
    }

    const products = await response.json();

    await db.products.bulkAdd(products);

    console.log(
        `${products.length} products added.`
    );
}


async function getAllProducts() {

    return await db.products.toArray();

}


async function searchProducts(searchTerm) {

    const term = searchTerm
        .trim()
        .toLowerCase();

    if (!term) {

        return await getAllProducts();

    }

    return await db.products
        .filter(product => {

            return (

                product.name
                    .toLowerCase()
                    .includes(term)

                ||

                product.sku
                    .toLowerCase()
                    .includes(term)

                ||

                (
                    product.brand &&
                    product.brand
                        .toLowerCase()
                        .includes(term)
                )

            );

        })
        .toArray();
}


/* =========================
   STORES
========================= */

async function seedStores() {

    const existingCount = await db.stores.count();

    if (existingCount > 0) {

        console.log(
            `Stores already exist: ${existingCount}`
        );

        return;
    }

    const response = await fetch("./data/stores.json");

    if (!response.ok) {

        throw new Error(
            "Unable to load stores.json"
        );

    }

    const stores = await response.json();

    await db.stores.bulkAdd(stores);

    console.log(
        `${stores.length} stores added.`
    );
}


async function getAllStores() {

    return await db.stores.toArray();

}


async function getStoreById(id) {

    return await db.stores.get(id);

}


async function searchStores(searchTerm) {

    const term = searchTerm
        .trim()
        .toLowerCase();

    if (!term) {

        return await getAllStores();

    }

    return await db.stores
        .filter(store => {

            return (

                (store.name || "")
                    .toLowerCase()
                    .includes(term)

                ||

                (store.owner || "")
                    .toLowerCase()
                    .includes(term)

                ||

                (store.mobile || "")
                    .toLowerCase()
                    .includes(term)

                ||

                (store.address || "")
                    .toLowerCase()
                    .includes(term)

                ||

                (store.area || "")
                    .toLowerCase()
                    .includes(term)

            );

        })
        .toArray();
}


async function saveStore(store) {

    await db.stores.put(store);

    return store;

}


async function updateStore(id, changes) {

    await db.stores.update(
        id,
        changes
    );

    return await db.stores.get(id);

}


async function deleteStore(id) {

    await db.stores.delete(id);

}


/* =========================
   ORDERS
========================= */

async function saveOrder(order) {

    await db.orders.put(order);

    return order;

}


async function getAllOrders() {

    return await db.orders
        .orderBy("date")
        .reverse()
        .toArray();

}


async function getOrderById(id) {

    return await db.orders.get(id);

}


async function updateOrderStatus(id, status) {

    await db.orders.update(
        id,
        {
            status: status,
            updatedAt: new Date().toISOString()
        }
    );

}


async function deleteOrder(id) {

    await db.orders.delete(id);

}


async function getOrdersForDate(datePrefix) {

    return await db.orders
        .filter(order =>
            order.date &&
            order.date.startsWith(datePrefix)
        )
        .toArray();

}


/* =========================
   STATS
========================= */

async function getDatabaseStats() {

    const productCount =
        await db.products.count();

    const storeCount =
        await db.stores.count();

    const orderCount =
        await db.orders.count();

    return {

        products: productCount,

        stores: storeCount,

        orders: orderCount

    };

}

function productsAreDifferent(oldProduct, newProduct) {

    return (
        oldProduct.sku !== newProduct.sku ||
        oldProduct.name !== newProduct.name ||
        oldProduct.brand !== newProduct.brand ||
        oldProduct.mrp !== newProduct.mrp ||
        oldProduct.rate !== newProduct.rate ||
        oldProduct.unit !== newProduct.unit ||
        oldProduct.status !== newProduct.status
    );

}


document
    .getElementById("refreshProductsBtn")
    .addEventListener(
        "click",
        refreshProductsFromJSON
    );


async function refreshProductsFromJSON() {

    const button =
        document.getElementById("refreshProductsBtn");

    const status =
        document.getElementById("productSyncStatus");


    button.disabled = true;

    status.textContent =
        "Checking for product updates...";


    try {

        // Check internet
        if (!navigator.onLine) {

            throw new Error("OFFLINE");

        }


        // Load latest JSON
        const response = await fetch(
            "./data/products.json",
            {
                cache: "no-store"
            }
        );


        if (!response.ok) {

            throw new Error(
                "JSON_LOAD_FAILED"
            );

        }


        const jsonProducts =
            await response.json();


        if (!Array.isArray(jsonProducts)) {

            throw new Error(
                "INVALID_JSON"
            );

        }


        // Get products currently in IndexedDB
        const dbProducts =
            await db.products.toArray();


        // Maps using SKU
        const jsonMap = new Map(
            jsonProducts.map(product => [
                product.sku,
                product
            ])
        );


        const dbMap = new Map(
            dbProducts.map(product => [
                product.sku,
                product
            ])
        );


        let added = 0;
        let updated = 0;
        let removed = 0;


        // Check new / changed products
        for (const jsonProduct of jsonProducts) {

            const existingProduct =
                dbMap.get(jsonProduct.sku);


            // New product
            if (!existingProduct) {

                added++;

                continue;

            }


            // Changed product
            if (
                productsAreDifferent(
                    existingProduct,
                    jsonProduct
                )
            ) {

                updated++;

            }

        }


        // Check removed products
        for (const dbProduct of dbProducts) {

            if (!jsonMap.has(dbProduct.sku)) {

                removed++;

            }

        }


        const totalChanges =
            added +
            updated +
            removed;


        // Nothing changed
        if (totalChanges === 0) {

            status.textContent =
                "✓ Products are already up to date.";

            alert(
                "No changes found.\n\n" +
                "Products are already up to date."
            );

            return;

        }


        // Update IndexedDB
        await db.transaction(
            "rw",
            db.products,
            async () => {

                // Remove deleted products
                for (const dbProduct of dbProducts) {

                    if (
                        !jsonMap.has(
                            dbProduct.sku
                        )
                    ) {

                        await db.products.delete(
                            dbProduct.sku
                        );

                    }

                }


                // Add / update products
                await db.products.bulkPut(
                    jsonProducts
                );

            }
        );


        // Success message
        let message =
            "✓ Product update completed!\n\n";


        if (added > 0) {

            message +=
                `New products: ${added}\n`;

        }


        if (updated > 0) {

            message +=
                `Updated products: ${updated}\n`;

        }


        if (removed > 0) {

            message +=
                `Removed products: ${removed}\n`;

        }


        status.textContent =
            `✓ ${totalChanges} product change(s) applied.`;


        alert(message);


        // Refresh page
        location.reload();


    } catch (error) {

        console.error(
            "Product sync failed:",
            error
        );


        if (error.message === "OFFLINE") {

            status.textContent =
                "⚠ Offline — update not performed.";

            alert(
                "You are currently offline.\n\n" +
                "Connect to the internet and try again."
            );

            return;

        }


        if (
            error.message ===
            "JSON_LOAD_FAILED"
        ) {

            status.textContent =
                "✕ Could not load products.json.";

            alert(
                "Update failed.\n\n" +
                "Could not load products.json."
            );

            return;

        }


        if (
            error.message ===
            "INVALID_JSON"
        ) {

            status.textContent =
                "✕ Invalid products.json.";

            alert(
                "Update failed.\n\n" +
                "products.json contains invalid data."
            );

            return;

        }


        status.textContent =
            "✕ Product update failed.";

        alert(
            "Product update failed.\n\n" +
            "Please check the browser console."
        );

    } finally {

        button.disabled = false;

    }

}