let currentScreen = "dashboardScreen";

let orderState = {
    editingOrderId: null,
    editingOrderNumber: null,

    mode: "registered",

    store: null,

    items: [],

    latitude: null,
    longitude: null,
    accuracy: null,
    locationCapturedAt: null,

    notes: ""
};

let lastSavedOrder = null;

let storeFormLocation = {
    latitude: null,
    longitude: null,
    accuracy: null,
    locationCapturedAt: null
};

/*
    Used when "+ New Store" is opened from
    the New Order screen.

    After saving the store, we return to
    the order screen and select the new store.
*/
let returnToOrderAfterStoreSave = false;


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        try {

            await initializeDatabase();

            setupEventListeners();

            await refreshDashboard();

            showScreenWithoutReset(
                "dashboardScreen"
            );

            updateConnectionStatus();

            window.addEventListener(
                "online",
                updateConnectionStatus
            );

            window.addEventListener(
                "offline",
                updateConnectionStatus
            );

        } catch (error) {

            console.error(
                "Application initialization failed:",
                error
            );

            alert(
                "Unable to initialize the application."
            );

        }

    }
);


/* =========================================================
   EVENT LISTENERS
========================================================= */

function setupEventListeners() {

    const productSearch =
        document.getElementById(
            "productSearch"
        );

    if (productSearch) {

        productSearch.addEventListener(
            "input",
            renderProducts
        );

    }


    const storeSearch =
        document.getElementById(
            "storeSearch"
        );

    if (storeSearch) {

        storeSearch.addEventListener(
            "input",
            renderStores
        );

    }


    const orderStoreSearch =
        document.getElementById(
            "orderStoreSearch"
        );

    if (orderStoreSearch) {

        orderStoreSearch.addEventListener(
            "input",
            renderOrderStoreResults
        );

    }


    const orderProductSearch =
        document.getElementById(
            "orderProductSearch"
        );

    if (orderProductSearch) {

        orderProductSearch.addEventListener(
            "input",
            renderOrderProductResults
        );

    }


    const storeForm =
        document.getElementById(
            "storeForm"
        );

    if (storeForm) {

        storeForm.addEventListener(
            "submit",
            handleStoreFormSubmit
        );

    }

}


/* =========================================================
   SCREEN NAVIGATION
========================================================= */

async function showScreen(screenId) {

    /*
        Opening New Order from dashboard
        should always create a fresh order.
    */

    if (
        screenId ===
        "newOrderScreen"
    ) {

        startNewOrder();

        return;

    }


    showScreenWithoutReset(
        screenId
    );


    if (
        screenId ===
        "dashboardScreen"
    ) {

        await refreshDashboard();

    }


    if (
        screenId ===
        "productsScreen"
    ) {

        await renderProducts();

    }


    if (
        screenId ===
        "storesScreen"
    ) {

        await renderStores();

    }


    if (
        screenId ===
        "ordersScreen"
    ) {

        await renderOrders();

    }

}


function showScreenWithoutReset(
    screenId
) {

    document
        .querySelectorAll(".screen")
        .forEach(screen => {

            screen.classList.remove(
                "active"
            );

        });


    const screen =
        document.getElementById(
            screenId
        );


    if (!screen) {

        console.error(
            "Screen not found:",
            screenId
        );

        return;

    }


    screen.classList.add(
        "active"
    );


    currentScreen =
        screenId;

}


/* =========================================================
   CONNECTION
========================================================= */

function updateConnectionStatus() {

    const element =
        document.getElementById(
            "connectionStatus"
        );


    if (!element) return;


    if (navigator.onLine) {

        element.textContent =
            "● Online";

        element.className =
            "online";

    } else {

        element.textContent =
            "● Offline";

        element.className =
            "offline";

    }

}


/* =========================================================
   DASHBOARD
========================================================= */

async function refreshDashboard() {

    const stats =
        await getDatabaseStats();


    const productCount =
        document.getElementById(
            "dashboardProductCount"
        );

    const storeCount =
        document.getElementById(
            "dashboardStoreCount"
        );

    const orderCount =
        document.getElementById(
            "dashboardOrderCount"
        );


    if (productCount) {

        productCount.textContent =
            `${stats.products} products`;

    }


    if (storeCount) {

        storeCount.textContent =
            `${stats.stores} stores`;

    }


    if (orderCount) {

        orderCount.textContent =
            `${stats.orders} orders`;

    }

}


/* =========================================================
   PRODUCTS
========================================================= */

async function renderProducts() {

    const input =
        document.getElementById(
            "productSearch"
        );

    const container =
        document.getElementById(
            "productsList"
        );


    if (!input || !container) {
        return;
    }


    const products =
        await searchProducts(
            input.value
        );


    if (!products.length) {

        container.innerHTML =
            `
            <div class="empty-state">
                No products found.
            </div>
            `;

        return;

    }


    container.innerHTML =
        products.map(product => {

            return `
                <div class="product-card">

                    <div class="product-main">

                        <strong>
                            ${escapeHtml(
                                product.name
                            )}
                        </strong>

                        <small>
                            ${escapeHtml(
                                product.brand || ""
                            )}
                            ·
                            ${escapeHtml(
                                product.sku
                            )}
                        </small>

                         <span class="product-status ${
                                product.status === "out_of_stock"
                                    ? "out-of-stock"
                                    : "active"
                            }">
                                ${
                                    product.status === "out_of_stock"
                                        ? "Out of Stock"
                                        : "Active"
                                }
                        </span>

                    </div>

                    <div class="product-price">

                        <span>
                            MRP ₹${Number(
                                product.mrp
                            ).toFixed(2)}
                        </span>

                        <strong>
                            ₹${Number(
                                product.rate
                            ).toFixed(2)}
                        </strong>

                    </div>

                </div>
            `;

        }).join("");

}


/* =========================================================
   STORES LIST
========================================================= */

async function renderStores() {

    const input =
        document.getElementById(
            "storeSearch"
        );

    const container =
        document.getElementById(
            "storesList"
        );


    if (!input || !container) {
        return;
    }


    const stores =
        await searchStores(
            input.value
        );


    if (!stores.length) {

        container.innerHTML =
            `
            <div class="empty-state">
                No stores found.
            </div>
            `;

        return;

    }


    container.innerHTML =
        stores.map(store => {

            const hasLocation =
                store.latitude !== null &&
                store.latitude !== undefined &&
                store.longitude !== null &&
                store.longitude !== undefined;


            return `
                <div class="store-card">

                    <div class="store-card-main">

                        <strong>
                            ${escapeHtml(
                                store.name
                            )}
                        </strong>

                        <small>
                            ${escapeHtml(
                                store.address || ""
                            )}
                        </small>

                        ${
                            store.area
                                ? `
                                    <small>
                                        ${escapeHtml(
                                            store.area
                                        )}
                                    </small>
                                `
                                : ""
                        }

                        ${
                            store.owner
                                ? `
                                    <small>
                                        Owner:
                                        ${escapeHtml(
                                            store.owner
                                        )}
                                    </small>
                                `
                                : ""
                        }

                        ${
                            store.mobile
                                ? `
                                    <small>
                                        📞
                                        ${escapeHtml(
                                            store.mobile
                                        )}
                                    </small>
                                `
                                : ""
                        }

                        <small class="${
                            hasLocation
                                ? "location-saved"
                                : "location-missing"
                        }">

                            ${
                                hasLocation
                                    ? "📍 Location saved"
                                    : "📍 No location saved"
                            }

                        </small>

                    </div>


                    <div class="store-card-actions">

                        <button
                            class="small-button"
                            onclick="editStore('${escapeAttribute(
                                store.id
                            )}')"
                        >
                            Edit
                        </button>

                        ${
                            hasLocation
                                ? `
                                    <button
                                        class="small-button"
                                        onclick="openStoreMap('${escapeAttribute(
                                            store.id
                                        )}')"
                                    >
                                        Map
                                    </button>
                                `
                                : ""
                        }

                    </div>

                </div>
            `;

        }).join("");

}


/* =========================================================
   STORE FORM
========================================================= */

function openStoreForm(
    store = null
) {

    const form =
        document.getElementById(
            "storeForm"
        );


    if (!form) return;


    form.reset();


    document.getElementById(
        "storeFormId"
    ).value = "";


    storeFormLocation = {

        latitude: null,
        longitude: null,
        accuracy: null,
        locationCapturedAt: null

    };


    if (store) {

        document.getElementById(
            "storeFormTitle"
        ).textContent =
            "Edit Store";


        document.getElementById(
            "storeFormId"
        ).value =
            store.id;


        document.getElementById(
            "storeName"
        ).value =
            store.name || "";


        document.getElementById(
            "storeAddress"
        ).value =
            store.address || "";


        document.getElementById(
            "storeArea"
        ).value =
            store.area || "";


        document.getElementById(
            "storeOwner"
        ).value =
            store.owner || "";


        document.getElementById(
            "storeMobile"
        ).value =
            store.mobile || "";


        storeFormLocation = {

            latitude:
                store.latitude ?? null,

            longitude:
                store.longitude ?? null,

            accuracy:
                store.accuracy ?? null,

            locationCapturedAt:
                store.locationCapturedAt ?? null

        };

    } else {

        document.getElementById(
            "storeFormTitle"
        ).textContent =
            "Add Store";

    }


    renderStoreFormLocation();


    showScreenWithoutReset(
        "storeFormScreen"
    );

}


/*
    This is specifically called by
    "+ New Store" from the New Order screen.
*/

function openAddStoreFromOrder() {

    returnToOrderAfterStoreSave =
        true;


    openStoreForm();

}


function cancelStoreForm() {

    const shouldReturnToOrder =
        returnToOrderAfterStoreSave;


    returnToOrderAfterStoreSave =
        false;


    if (shouldReturnToOrder) {

        showScreenWithoutReset(
            "newOrderScreen"
        );

        return;

    }


    showScreenWithoutReset(
        "storesScreen"
    );

}


async function editStore(id) {

    const store =
        await getStoreById(id);


    if (!store) {

        alert(
            "Store not found."
        );

        return;

    }


    returnToOrderAfterStoreSave =
        false;


    openStoreForm(
        store
    );

}


async function handleStoreFormSubmit(
    event
) {

    event.preventDefault();


    const id =
        document.getElementById(
            "storeFormId"
        ).value ||
        generateId();


    const name =
        document.getElementById(
            "storeName"
        ).value.trim();


    const address =
        document.getElementById(
            "storeAddress"
        ).value.trim();


    const area =
        document.getElementById(
            "storeArea"
        ).value.trim();


    const owner =
        document.getElementById(
            "storeOwner"
        ).value.trim();


    const mobile =
        document.getElementById(
            "storeMobile"
        ).value.trim();


    if (!name) {

        alert(
            "Store name is required."
        );

        return;

    }


    if (!address) {

        alert(
            "Store address is required."
        );

        return;

    }


    const store = {

        id,

        name,

        address,

        area,

        owner,

        mobile,

        latitude:
            storeFormLocation.latitude,

        longitude:
            storeFormLocation.longitude,

        accuracy:
            storeFormLocation.accuracy,

        locationCapturedAt:
            storeFormLocation.locationCapturedAt

    };


    await saveStore(
        store
    );


    /*
        If the store was created from
        the New Order screen, return there
        and automatically select it.
    */

    if (
        returnToOrderAfterStoreSave
    ) {

        returnToOrderAfterStoreSave =
            false;


        startNewOrder();


        await selectOrderStore(
            store.id
        );


        return;

    }


    alert(
        "Store saved successfully."
    );


    await renderStores();

    await refreshDashboard();


    showScreenWithoutReset(
        "storesScreen"
    );

}


/* =========================================================
   STORE LOCATION
========================================================= */

function captureStoreLocation() {

    if (!navigator.geolocation) {

        alert(
            "GPS is not supported by this browser."
        );

        return;

    }


    const status =
        document.getElementById(
            "storeLocationStatus"
        );


    if (status) {

        status.textContent =
            "Capturing...";

    }


    navigator.geolocation.getCurrentPosition(

        position => {

            storeFormLocation = {

                latitude:
                    position.coords.latitude,

                longitude:
                    position.coords.longitude,

                accuracy:
                    position.coords.accuracy,

                locationCapturedAt:
                    new Date().toISOString()

            };


            renderStoreFormLocation();

        },

        error => {

            console.error(
                error
            );


            if (status) {

                status.textContent =
                    "Unable to capture";

            }


            alert(
                getLocationErrorMessage(
                    error
                )
            );

        },

        {

            enableHighAccuracy: true,

            timeout: 15000,

            maximumAge: 0

        }

    );

}


function renderStoreFormLocation() {

    const status =
        document.getElementById(
            "storeLocationStatus"
        );

    const coordinates =
        document.getElementById(
            "storeCoordinates"
        );


    if (!status || !coordinates) {
        return;
    }


    if (
        storeFormLocation.latitude === null ||
        storeFormLocation.longitude === null
    ) {

        status.textContent =
            "Not captured";

        coordinates.textContent =
            "No location saved";

        return;

    }


    status.textContent =
        "Location saved";


    coordinates.innerHTML = `

        ${Number(
            storeFormLocation.latitude
        ).toFixed(6)},

        ${Number(
            storeFormLocation.longitude
        ).toFixed(6)}

        ${
            storeFormLocation.accuracy
                ? `
                    · Accuracy ±${Math.round(
                        storeFormLocation.accuracy
                    )}m
                `
                : ""
        }

    `;

}


/* =========================================================
   NEW ORDER
========================================================= */

function startNewOrder() {

    orderState = {

        editingOrderId: null,

        editingOrderNumber: null,

        mode: "registered",

        store: null,

        items: [],

        latitude: null,

        longitude: null,

        accuracy: null,

        locationCapturedAt: null,

        notes: ""

    };


    const fields = [

        "orderStoreSearch",

        "orderProductSearch",

        "orderNotes",

        "orderStoreName",

        "orderStoreAddress",

        "orderStoreArea",

        "orderStoreOwner",

        "orderStoreMobile"

    ];


    fields.forEach(id => {

        const element =
            document.getElementById(
                id
            );

        if (element) {

            element.value = "";

        }

    });


    const saveOneTimeStore =
        document.getElementById(
            "saveOneTimeStore"
        );


    if (saveOneTimeStore) {

        saveOneTimeStore.checked =
            false;

    }


    const saveLocationToStore =
        document.getElementById(
            "saveLocationToStore"
        );


    if (saveLocationToStore) {

        saveLocationToStore.checked =
            true;

    }


    const saveButton =
        document.querySelector(
            ".save-order-button"
        );


    if (saveButton) {

        saveButton.textContent =
            "Save Order";

    }


    const title =
        document.getElementById(
            "newOrderTitle"
        );


    if (title) {

        title.textContent =
            "New Order";

    }


    const subtitle =
        document.getElementById(
            "newOrderSubtitle"
        );


    if (subtitle) {

        subtitle.textContent =
            "Create order";

    }


    showRegisteredStoreMode();


    renderOrderItems();

    renderOrderStoreResults();


    showScreenWithoutReset(
        "newOrderScreen"
    );

}


/* =========================================================
   REGISTERED STORE MODE
========================================================= */

function showRegisteredStoreMode() {

    orderState.mode =
        "registered";


    const selector =
        document.getElementById(
            "registeredStoreSelector"
        );

    const temporaryForm =
        document.getElementById(
            "oneTimeStoreForm"
        );

    const selectedCard =
        document.getElementById(
            "selectedStoreCard"
        );

    const locationBox =
        document.getElementById(
            "registeredStoreLocationBox"
        );


    if (selector) {

        selector.classList.remove(
            "hidden"
        );

    }


    if (temporaryForm) {

        temporaryForm.classList.add(
            "hidden"
        );

    }


    if (selectedCard) {

        selectedCard.classList.add(
            "hidden"
        );

    }


    if (locationBox) {

        locationBox.classList.add(
            "hidden"
        );

    }

}


/* =========================================================
   TEMPORARY STORE MODE
========================================================= */

function startTemporaryStore() {

    orderState.mode =
        "one-time";


    orderState.store = {

        id: null,

        name: "",

        address: "",

        area: "",

        owner: "",

        mobile: ""

    };


    orderState.latitude =
        null;

    orderState.longitude =
        null;

    orderState.accuracy =
        null;

    orderState.locationCapturedAt =
        null;


    /*
        Hide existing store selector.
    */

    document
        .getElementById(
            "registeredStoreSelector"
        )
        .classList.add(
            "hidden"
        );


    document
        .getElementById(
            "selectedStoreCard"
        )
        .classList.add(
            "hidden"
        );


    document
        .getElementById(
            "registeredStoreLocationBox"
        )
        .classList.add(
            "hidden"
        );


    /*
        Show temporary store fields.
    */

    document
        .getElementById(
            "oneTimeStoreForm"
        )
        .classList.remove(
            "hidden"
        );


    document.getElementById(
        "orderStoreName"
    ).value = "";


    document.getElementById(
        "orderStoreAddress"
    ).value = "";


    document.getElementById(
        "orderStoreArea"
    ).value = "";


    document.getElementById(
        "orderStoreOwner"
    ).value = "";


    document.getElementById(
        "orderStoreMobile"
    ).value = "";


    document.getElementById(
        "saveOneTimeStore"
    ).checked = false;


    renderOneTimeOrderLocation();


    document.getElementById(
        "orderStoreName"
    ).focus();

}


/*
    Backwards-compatible name.
    Your previous HTML/code used this name.
*/

function startNewOneTimeStore() {

    startTemporaryStore();

}


function cancelTemporaryStore() {

    orderState.mode =
        "registered";


    orderState.store =
        null;


    orderState.latitude =
        null;

    orderState.longitude =
        null;

    orderState.accuracy =
        null;

    orderState.locationCapturedAt =
        null;


    document.getElementById(
        "orderStoreName"
    ).value = "";


    document.getElementById(
        "orderStoreAddress"
    ).value = "";


    document.getElementById(
        "orderStoreArea"
    ).value = "";


    document.getElementById(
        "orderStoreOwner"
    ).value = "";


    document.getElementById(
        "orderStoreMobile"
    ).value = "";


    document.getElementById(
        "saveOneTimeStore"
    ).checked = false;


    showRegisteredStoreMode();


    renderOrderStoreResults();

}


/*
    Backwards-compatible name.
*/

function cancelOneTimeStore() {

    cancelTemporaryStore();

}


/* =========================================================
   ORDER STORE SEARCH
========================================================= */

async function renderOrderStoreResults() {

    if (
        orderState.mode !==
        "registered"
    ) {

        return;

    }


    const input =
        document.getElementById(
            "orderStoreSearch"
        );

    const container =
        document.getElementById(
            "orderStoreResults"
        );


    if (!input || !container) {
        return;
    }


    const stores =
        await searchStores(
            input.value
        );


    if (!stores.length) {

        container.innerHTML =
            `
            <div class="empty-state small">
                No registered store found.
            </div>
            `;

        return;

    }


    container.innerHTML =
        stores.map(store => {

            return `

                <button
                    type="button"
                    class="store-result"
                    onclick="selectOrderStore('${escapeAttribute(
                        store.id
                    )}')"
                >

                    <strong>
                        ${escapeHtml(
                            store.name
                        )}
                    </strong>

                    <small>
                        ${escapeHtml(
                            store.address || ""
                        )}
                    </small>

                    ${
                        store.area
                            ? `
                                <small>
                                    ${escapeHtml(
                                        store.area
                                    )}
                                </small>
                            `
                            : ""
                    }

                </button>

            `;

        }).join("");

}


/* =========================================================
   SELECT REGISTERED STORE
========================================================= */

async function selectOrderStore(
    id
) {

    const store =
        await getStoreById(
            id
        );


    if (!store) {

        alert(
            "Store not found."
        );

        return;

    }


    orderState.mode =
        "registered";


    orderState.store = {

        id:
            store.id,

        name:
            store.name || "",

        address:
            store.address || "",

        area:
            store.area || "",

        owner:
            store.owner || "",

        mobile:
            store.mobile || "",

        latitude:
            store.latitude ?? null,

        longitude:
            store.longitude ?? null

    };


    /*
        Store location becomes the
        initial location of this order.

        The order keeps its own snapshot.
    */

    orderState.latitude =
        store.latitude ?? null;

    orderState.longitude =
        store.longitude ?? null;

    orderState.accuracy =
        store.accuracy ?? null;

    orderState.locationCapturedAt =
        store.locationCapturedAt ?? null;


    document
        .getElementById(
            "registeredStoreSelector"
        )
        .classList.add(
            "hidden"
        );


    document
        .getElementById(
            "oneTimeStoreForm"
        )
        .classList.add(
            "hidden"
        );


    document
        .getElementById(
            "selectedStoreCard"
        )
        .classList.remove(
            "hidden"
        );


    document
        .getElementById(
            "registeredStoreLocationBox"
        )
        .classList.remove(
            "hidden"
        );


    renderSelectedStore();

    renderRegisteredOrderLocation();

}


/* =========================================================
   SELECTED STORE CARD
========================================================= */

function renderSelectedStore() {

    const store =
        orderState.store;


    const container =
        document.getElementById(
            "selectedStoreCard"
        );


    if (!store || !container) {
        return;
    }


    container.innerHTML = `

        <div>

            <strong>
                ${escapeHtml(
                    store.name
                )}
            </strong>

            <small>
                ${escapeHtml(
                    store.address || ""
                )}
            </small>

            ${
                store.area
                    ? `
                        <small>
                            ${escapeHtml(
                                store.area
                            )}
                        </small>
                    `
                    : ""
            }

            ${
                store.owner
                    ? `
                        <small>
                            Owner:
                            ${escapeHtml(
                                store.owner
                            )}
                        </small>
                    `
                    : ""
            }

            ${
                store.mobile
                    ? `
                        <small>
                            📞
                            ${escapeHtml(
                                store.mobile
                            )}
                        </small>
                    `
                    : ""
            }

        </div>


        <button
            type="button"
            class="small-button"
            onclick="changeOrderStore()"
        >
            Change
        </button>

    `;

}


/* =========================================================
   CHANGE REGISTERED STORE
========================================================= */

function changeOrderStore() {

    orderState.store =
        null;


    orderState.latitude =
        null;

    orderState.longitude =
        null;

    orderState.accuracy =
        null;

    orderState.locationCapturedAt =
        null;


    document
        .getElementById(
            "selectedStoreCard"
        )
        .classList.add(
            "hidden"
        );


    document
        .getElementById(
            "registeredStoreLocationBox"
        )
        .classList.add(
            "hidden"
        );


    document
        .getElementById(
            "registeredStoreSelector"
        )
        .classList.remove(
            "hidden"
        );


    renderOrderStoreResults();

}


/* =========================================================
   ORDER LOCATION
========================================================= */

function captureOrderLocation() {

    if (!navigator.geolocation) {

        alert(
            "GPS is not supported by this browser."
        );

        return;

    }


    navigator.geolocation.getCurrentPosition(

        async position => {

            const location = {

                latitude:
                    position.coords.latitude,

                longitude:
                    position.coords.longitude,

                accuracy:
                    position.coords.accuracy,

                locationCapturedAt:
                    new Date().toISOString()

            };


            orderState.latitude =
                location.latitude;

            orderState.longitude =
                location.longitude;

            orderState.accuracy =
                location.accuracy;

            orderState.locationCapturedAt =
                location.locationCapturedAt;


            /*
                Registered store:
                optionally update the store master too.
            */

            if (
                orderState.mode ===
                "registered"
            ) {

                const saveToStore =
                    document.getElementById(
                        "saveLocationToStore"
                    )?.checked;


                if (
                    saveToStore &&
                    orderState.store &&
                    orderState.store.id
                ) {

                    await updateStore(
                        orderState.store.id,
                        location
                    );


                    orderState.store.latitude =
                        location.latitude;

                    orderState.store.longitude =
                        location.longitude;

                }


                renderRegisteredOrderLocation();

            } else {

                renderOneTimeOrderLocation();

            }

        },

        error => {

            console.error(
                error
            );


            alert(
                getLocationErrorMessage(
                    error
                )
            );

        },

        {

            enableHighAccuracy: true,

            timeout: 15000,

            maximumAge: 0

        }

    );

}


/* =========================================================
   REGISTERED ORDER LOCATION UI
========================================================= */

function renderRegisteredOrderLocation() {

    const container =
        document.getElementById(
            "registeredOrderCoordinates"
        );


    if (!container) {
        return;
    }


    if (
        orderState.latitude === null ||
        orderState.longitude === null
    ) {

        container.innerHTML =
            "No location saved";

        return;

    }


    container.innerHTML = `

        <strong>
            📍 Location available
        </strong>

        <br>

        ${Number(
            orderState.latitude
        ).toFixed(6)},

        ${Number(
            orderState.longitude
        ).toFixed(6)}

        ${
            orderState.accuracy
                ? `
                    <br>
                    Accuracy ±${Math.round(
                        orderState.accuracy
                    )}m
                `
                : ""
        }

        <br>

        <a
            href="${buildGoogleMapsUrl(
                orderState.latitude,
                orderState.longitude
            )}"
            target="_blank"
            rel="noopener"
        >
            Open Google Maps
        </a>

    `;

}


/* =========================================================
   TEMPORARY ORDER LOCATION UI
========================================================= */

function renderOneTimeOrderLocation() {

    const container =
        document.getElementById(
            "oneTimeOrderLocation"
        );


    if (!container) {
        return;
    }


    if (
        orderState.latitude === null ||
        orderState.longitude === null
    ) {

        container.innerHTML = `

            <div class="location-title">

                <strong>
                    📍 Delivery Location
                </strong>

                <span>
                    Not captured
                </span>

            </div>


            <div class="coordinates">
                No location captured
            </div>


            <button
                type="button"
                class="secondary-button full-width"
                onclick="captureOrderLocation()"
            >
                📍 Capture Current Location
            </button>

        `;

        return;

    }


    container.innerHTML = `

        <div class="location-title">

            <strong>
                📍 Delivery Location
            </strong>

            <span>
                Location captured
            </span>

        </div>


        <div class="coordinates">

            ${Number(
                orderState.latitude
            ).toFixed(6)},

            ${Number(
                orderState.longitude
            ).toFixed(6)}

            ${
                orderState.accuracy
                    ? `
                        <br>
                        Accuracy ±${Math.round(
                            orderState.accuracy
                        )}m
                    `
                    : ""
            }

            <br>

            <a
                href="${buildGoogleMapsUrl(
                    orderState.latitude,
                    orderState.longitude
                )}"
                target="_blank"
                rel="noopener"
            >
                Open Google Maps
            </a>

        </div>


        <button
            type="button"
            class="secondary-button full-width"
            onclick="captureOrderLocation()"
        >
            📍 Update Current Location
        </button>

    `;

}


/* =========================================================
   UPDATE REGISTERED STORE LOCATION
========================================================= */

async function updateSelectedStoreLocation() {

    if (
        !orderState.store ||
        !orderState.store.id
    ) {

        alert(
            "No registered store selected."
        );

        return;

    }


    if (!navigator.geolocation) {

        alert(
            "GPS is not supported by this browser."
        );

        return;

    }


    navigator.geolocation.getCurrentPosition(

        async position => {

            const location = {

                latitude:
                    position.coords.latitude,

                longitude:
                    position.coords.longitude,

                accuracy:
                    position.coords.accuracy,

                locationCapturedAt:
                    new Date().toISOString()

            };


            await updateStore(
                orderState.store.id,
                location
            );


            /*
                Also update this order's
                current location snapshot.
            */

            orderState.latitude =
                location.latitude;

            orderState.longitude =
                location.longitude;

            orderState.accuracy =
                location.accuracy;

            orderState.locationCapturedAt =
                location.locationCapturedAt;


            orderState.store.latitude =
                location.latitude;

            orderState.store.longitude =
                location.longitude;


            renderRegisteredOrderLocation();


            alert(
                "Store location updated."
            );

        },

        error => {

            alert(
                getLocationErrorMessage(
                    error
                )
            );

        },

        {

            enableHighAccuracy: true,

            timeout: 15000,

            maximumAge: 0

        }

    );

}


/* =========================================================
   ORDER PRODUCT SEARCH
========================================================= */

async function renderOrderProductResults() {

    const input =
        document.getElementById(
            "orderProductSearch"
        );

    const container =
        document.getElementById(
            "orderProductResults"
        );


    if (!input || !container) {
        return;
    }


    const search =
        input.value.trim();


    if (!search) {

        container.innerHTML =
            "";

        return;

    }


    const products =
        await searchProducts(
            search
        );


    if (!products.length) {

        container.innerHTML =
            `
            <div class="empty-state small">
                No products found.
            </div>
            `;

        return;

    }


    container.innerHTML =
        products.map(product => {

            return `

                <button
                    type="button"
                    class="product-result"
                    onclick="addProductToOrder('${escapeAttribute(
                        product.sku
                    )}')"
                >

                    <div>

                        <strong>
                            ${escapeHtml(
                                product.name
                            )}
                        </strong>

                        <small>
                            ${escapeHtml(
                                product.brand || ""
                            )}
                            ·
                            ${escapeHtml(
                                product.sku
                            )}
                        </small>

                        <span class="product-status ${
                                product.status === "out_of_stock"
                                    ? "out-of-stock"
                                    : "active"
                            }">
                                ${
                                    product.status === "out_of_stock"
                                        ? "Out of Stock"
                                        : "Active"
                                }
                        </span>

                    </div>


                    <div>

                        <strong>
                            ₹${Number(
                                product.rate
                            ).toFixed(2)}
                        </strong>

                        <small>
                            MRP ₹${Number(
                                product.mrp
                            ).toFixed(2)}
                        </small>

                    </div>

                </button>

            `;

        }).join("");

}


/* =========================================================
   ADD PRODUCT
========================================================= */

async function addProductToOrder(
    sku
) {

    const product =
        await db.products.get(
            sku
        );


    if (!product) {
        return;
    }


    const existing =
        orderState.items.find(
            item =>
                item.sku ===
                product.sku
        );


    if (existing) {

        existing.qty += 1;

        existing.amount =
            existing.qty *
            existing.rate;

    } else {

        orderState.items.push({

            sku:
                product.sku,

            name:
                product.name,

            brand:
                product.brand || "",

            mrp:
                Number(
                    product.mrp
                ),

            rate:
                Number(
                    product.rate
                ),

            unit:
                product.unit || "",

            qty:
                1,

            amount:
                Number(
                    product.rate
                )

        });

    }


    renderOrderItems();


    document.getElementById(
        "orderProductSearch"
    ).value = "";


    document.getElementById(
        "orderProductResults"
    ).innerHTML =
        "";

}


/* =========================================================
   ORDER ITEM QUANTITY
========================================================= */

function increaseOrderItem(
    sku
) {

    const item =
        orderState.items.find(
            item =>
                item.sku === sku
        );


    if (!item) return;


    item.qty += 1;


    item.amount =
        item.qty *
        item.rate;


    renderOrderItems();

}


function decreaseOrderItem(
    sku
) {

    const item =
        orderState.items.find(
            item =>
                item.sku === sku
        );


    if (!item) return;


    item.qty -= 1;


    if (item.qty <= 0) {

        orderState.items =
            orderState.items.filter(
                item =>
                    item.sku !== sku
            );

    } else {

        item.amount =
            item.qty *
            item.rate;

    }


    renderOrderItems();

}


function removeOrderItem(
    sku
) {

    orderState.items =
        orderState.items.filter(
            item =>
                item.sku !== sku
        );


    renderOrderItems();

}


/* =========================================================
   RENDER ORDER ITEMS
========================================================= */

function renderOrderItems() {

    const container =
        document.getElementById(
            "orderItems"
        );


    if (!container) {
        return;
    }


    if (!orderState.items.length) {

        container.innerHTML =
            `
            <div class="empty-state">
                No products added yet.
            </div>
            `;

    } else {

        container.innerHTML =
            orderState.items.map(item => {

                return `

                    <div class="order-item">

                        <div class="order-item-info">

                            <strong>
                                ${escapeHtml(
                                    item.name
                                )}
                            </strong>

                            <small>
                                @ ₹${Number(
                                    item.rate
                                ).toFixed(2)}
                                × ${item.qty}
                            </small>

                        </div>


                        <div class="quantity-controls">

                            <button
                                type="button"
                                onclick="decreaseOrderItem('${escapeAttribute(
                                    item.sku
                                )}')"
                            >
                                −
                            </button>

                            <strong>
                                ${item.qty}
                            </strong>

                            <button
                                type="button"
                                onclick="increaseOrderItem('${escapeAttribute(
                                    item.sku
                                )}')"
                            >
                                +
                            </button>

                        </div>


                        <div class="order-item-amount">

                            ₹${Number(
                                item.amount
                            ).toFixed(2)}

                            <button
                                type="button"
                                class="remove-button"
                                onclick="removeOrderItem('${escapeAttribute(
                                    item.sku
                                )}')"
                            >
                                ×
                            </button>

                        </div>

                    </div>

                `;

            }).join("");

    }


    const totalItems =
        orderState.items.reduce(
            (
                total,
                item
            ) =>
                total +
                Number(
                    item.qty
                ),
            0
        );


    const totalAmount =
        orderState.items.reduce(
            (
                total,
                item
            ) =>
                total +
                Number(
                    item.amount
                ),
            0
        );


    const itemCount =
        document.getElementById(
            "orderItemCount"
        );

    const totalItemsElement =
        document.getElementById(
            "orderTotalItems"
        );

    const totalAmountElement =
        document.getElementById(
            "orderTotalAmount"
        );


    if (itemCount) {

        itemCount.textContent =
            `${totalItems} items`;

    }


    if (totalItemsElement) {

        totalItemsElement.textContent =
            totalItems;

    }


    if (totalAmountElement) {

        totalAmountElement.textContent =
            totalAmount.toFixed(2);

    }

}


/* =========================================================
   SAVE / UPDATE ORDER
========================================================= */

async function saveCurrentOrder() {

    let store;


    /*
        REGISTERED STORE
    */

    if (
        orderState.mode ===
        "registered"
    ) {

        if (!orderState.store) {

            alert(
                "Please select a store."
            );

            return;

        }


        store = {

            id:
                orderState.store.id,

            name:
                orderState.store.name,

            address:
                orderState.store.address,

            area:
                orderState.store.area,

            owner:
                orderState.store.owner,

            mobile:
                orderState.store.mobile

        };

    }


    /*
        TEMPORARY STORE
    */

    else {

        const name =
            document.getElementById(
                "orderStoreName"
            ).value.trim();


        const address =
            document.getElementById(
                "orderStoreAddress"
            ).value.trim();


        const area =
            document.getElementById(
                "orderStoreArea"
            ).value.trim();


        const owner =
            document.getElementById(
                "orderStoreOwner"
            ).value.trim();


        const mobile =
            document.getElementById(
                "orderStoreMobile"
            ).value.trim();


        if (!name) {

            alert(
                "Store name is required."
            );

            return;

        }


        if (!address) {

            alert(
                "Store address is required."
            );

            return;

        }


        store = {

            id:
                null,

            name,

            address,

            area,

            owner,

            mobile

        };

    }


    /*
        At least one product.
    */

    if (
        !orderState.items.length
    ) {

        alert(
            "Please add at least one product."
        );

        return;

    }


    const notes =
        document.getElementById(
            "orderNotes"
        ).value.trim();


    const totalItems =
        orderState.items.reduce(
            (
                total,
                item
            ) =>
                total +
                Number(
                    item.qty
                ),
            0
        );


    const totalAmount =
        orderState.items.reduce(
            (
                total,
                item
            ) =>
                total +
                Number(
                    item.amount
                ),
            0
        );


    const now =
        new Date().toISOString();


    /*
        =====================================================
        EDIT EXISTING ORDER
        =====================================================
    */

    if (
        orderState.editingOrderId
    ) {

        const existingOrder =
            await getOrderById(
                orderState.editingOrderId
            );


        if (!existingOrder) {

            alert(
                "Original order could not be found."
            );

            return;

        }


        const updatedOrder = {

            ...existingOrder,

            /*
                Preserve the original
                order number and status.
            */

            orderNumber:
                existingOrder.orderNumber,

            status:
                existingOrder.status,

            storeId:
                store.id || null,

            storeNameSnapshot:
                store.name,

            storeOwnerSnapshot:
                store.owner || "",

            storeMobileSnapshot:
                store.mobile || "",

            storeAddressSnapshot:
                store.address || "",

            storeAreaSnapshot:
                store.area || "",

            items:
                JSON.parse(
                    JSON.stringify(
                        orderState.items
                    )
                ),

            totalItems,

            totalAmount:
                Number(
                    totalAmount.toFixed(2)
                ),

            latitude:
                orderState.latitude,

            longitude:
                orderState.longitude,

            accuracy:
                orderState.accuracy,

            locationCapturedAt:
                orderState.locationCapturedAt,

            notes,

            updatedAt:
                now

        };


        /*
            If editing a temporary order
            and user now chooses to save
            the temporary store permanently,
            create the store.
        */

        if (
            orderState.mode ===
            "one-time"
        ) {

            const savePermanently =
                document.getElementById(
                    "saveOneTimeStore"
                )?.checked;


            if (
                savePermanently &&
                !existingOrder.storeId
            ) {

                const newStoreId =
                    generateId();


                await saveStore({

                    id:
                        newStoreId,

                    name:
                        store.name,

                    address:
                        store.address,

                    area:
                        store.area,

                    owner:
                        store.owner,

                    mobile:
                        store.mobile,

                    latitude:
                        orderState.latitude,

                    longitude:
                        orderState.longitude,

                    accuracy:
                        orderState.accuracy,

                    locationCapturedAt:
                        orderState.locationCapturedAt

                });


                updatedOrder.storeId =
                    newStoreId;

            }

        }


        await saveOrder(
            updatedOrder
        );


        lastSavedOrder =
            updatedOrder;


        alert(
            `${updatedOrder.orderNumber} updated successfully.`
        );


        await refreshDashboard();

        await renderOrders();


        resetOrderForm();


        showScreenWithoutReset(
            "ordersScreen"
        );


        return;

    }


    /*
        =====================================================
        CREATE NEW ORDER
        =====================================================
    */

    const orderNumber =
        await generateOrderNumber(
            now
        );


    const order = {

        id:
            generateId(),

        orderNumber,

        storeId:
            store.id || null,

        storeNameSnapshot:
            store.name,

        storeOwnerSnapshot:
            store.owner || "",

        storeMobileSnapshot:
            store.mobile || "",

        storeAddressSnapshot:
            store.address || "",

        storeAreaSnapshot:
            store.area || "",

        items:
            JSON.parse(
                JSON.stringify(
                    orderState.items
                )
            ),

        totalItems,

        totalAmount:
            Number(
                totalAmount.toFixed(2)
            ),

        /*
            IMPORTANT:
            These belong to this order.
        */

        latitude:
            orderState.latitude,

        longitude:
            orderState.longitude,

        accuracy:
            orderState.accuracy,

        locationCapturedAt:
            orderState.locationCapturedAt,

        notes,

        status:
            "Pending",

        date:
            now,

        createdAt:
            now,

        updatedAt:
            now

    };


    /*
        =====================================================
        SAVE TEMPORARY STORE PERMANENTLY IF REQUESTED
        =====================================================
    */

    if (
        orderState.mode ===
        "one-time"
    ) {

        const savePermanently =
            document.getElementById(
                "saveOneTimeStore"
            )?.checked;


        if (savePermanently) {

            const newStoreId =
                generateId();


            await saveStore({

                id:
                    newStoreId,

                name:
                    store.name,

                address:
                    store.address,

                area:
                    store.area,

                owner:
                    store.owner,

                mobile:
                    store.mobile,

                latitude:
                    orderState.latitude,

                longitude:
                    orderState.longitude,

                accuracy:
                    orderState.accuracy,

                locationCapturedAt:
                    orderState.locationCapturedAt

            });


            order.storeId =
                newStoreId;

        }

    }


    await saveOrder(
        order
    );


    lastSavedOrder =
        order;


    await refreshDashboard();


    document.getElementById(
        "savedOrderNumber"
    ).textContent =
        order.orderNumber;


    document
        .getElementById(
            "orderSavedModal"
        )
        .classList.remove(
            "hidden"
        );

}


/* =========================================================
   RESET ORDER
========================================================= */

function resetOrderForm() {

    orderState = {

        editingOrderId: null,

        editingOrderNumber: null,

        mode: "registered",

        store: null,

        items: [],

        latitude: null,

        longitude: null,

        accuracy: null,

        locationCapturedAt: null,

        notes: ""

    };


    const saveButton =
        document.querySelector(
            ".save-order-button"
        );


    if (saveButton) {

        saveButton.textContent =
            "Save Order";

    }

}


/* =========================================================
   ORDER NUMBER
========================================================= */

async function generateOrderNumber(
    isoDate
) {

    const date =
        isoDate
            .substring(
                0,
                10
            )
            .replaceAll(
                "-",
                ""
            );


    const prefix =
        `ORD-${date}-`;


    const orders =
        await getOrdersForDate(
            isoDate.substring(
                0,
                10
            )
        );


    let highest =
        0;


    orders.forEach(
        order => {

            if (
                !order.orderNumber ||
                !order.orderNumber.startsWith(
                    prefix
                )
            ) {

                return;

            }


            const number =
                parseInt(
                    order.orderNumber.substring(
                        prefix.length
                    ),
                    10
                );


            if (
                !isNaN(number) &&
                number > highest
            ) {

                highest =
                    number;

            }

        }
    );


    return (
        prefix +
        String(
            highest + 1
        ).padStart(
            3,
            "0"
        )
    );

}


/* =========================================================
   EDIT ORDER
========================================================= */

async function editOrder(
    id
) {

    const order =
        await getOrderById(
            id
        );


    if (!order) {

        alert(
            "Order not found."
        );

        return;

    }


    /*
        If this order has a registered
        store, load the current store
        for the editable order.

        But keep the order's own
        location snapshot.
    */

    let registeredStore =
        null;


    if (order.storeId) {

        registeredStore =
            await getStoreById(
                order.storeId
            );

    }


    orderState = {

        editingOrderId:
            order.id,

        editingOrderNumber:
            order.orderNumber,

        mode:
            order.storeId
                ? "registered"
                : "one-time",

        store: {

            id:
                order.storeId || null,

            name:
                order.storeNameSnapshot || "",

            address:
                order.storeAddressSnapshot || "",

            area:
                order.storeAreaSnapshot || "",

            owner:
                order.storeOwnerSnapshot || "",

            mobile:
                order.storeMobileSnapshot || ""

        },

        items:
            JSON.parse(
                JSON.stringify(
                    order.items || []
                )
            ),

        /*
            VERY IMPORTANT:
            Load location from the ORDER,
            not from the current store.
        */

        latitude:
            order.latitude ?? null,

        longitude:
            order.longitude ?? null,

        accuracy:
            order.accuracy ?? null,

        locationCapturedAt:
            order.locationCapturedAt ?? null,

        notes:
            order.notes || ""

    };


    /*
        Registered store
    */

    if (
        order.storeId
    ) {

        /*
            If store still exists,
            use its current details.
        */

        if (registeredStore) {

            orderState.store = {

                id:
                    registeredStore.id,

                name:
                    registeredStore.name || "",

                address:
                    registeredStore.address || "",

                area:
                    registeredStore.area || "",

                owner:
                    registeredStore.owner || "",

                mobile:
                    registeredStore.mobile || ""

            };

        }


        document
            .getElementById(
                "registeredStoreSelector"
            )
            .classList.add(
                "hidden"
            );


        document
            .getElementById(
                "oneTimeStoreForm"
            )
            .classList.add(
                "hidden"
            );


        document
            .getElementById(
                "selectedStoreCard"
            )
            .classList.remove(
                "hidden"
            );


        document
            .getElementById(
                "registeredStoreLocationBox"
            )
            .classList.remove(
                "hidden"
            );


        renderSelectedStore();

        renderRegisteredOrderLocation();

    }


    /*
        Temporary store
    */

    else {

        document
            .getElementById(
                "registeredStoreSelector"
            )
            .classList.add(
                "hidden"
            );


        document
            .getElementById(
                "selectedStoreCard"
            )
            .classList.add(
                "hidden"
            );


        document
            .getElementById(
                "registeredStoreLocationBox"
            )
            .classList.add(
                "hidden"
            );


        document
            .getElementById(
                "oneTimeStoreForm"
            )
            .classList.remove(
                "hidden"
            );


        document.getElementById(
            "orderStoreName"
        ).value =
            order.storeNameSnapshot || "";


        document.getElementById(
            "orderStoreAddress"
        ).value =
            order.storeAddressSnapshot || "";


        document.getElementById(
            "orderStoreArea"
        ).value =
            order.storeAreaSnapshot || "";


        document.getElementById(
            "orderStoreOwner"
        ).value =
            order.storeOwnerSnapshot || "";


        document.getElementById(
            "orderStoreMobile"
        ).value =
            order.storeMobileSnapshot || "";


        document.getElementById(
            "saveOneTimeStore"
        ).checked =
            false;


        renderOneTimeOrderLocation();

    }


    document.getElementById(
        "orderNotes"
    ).value =
        order.notes || "";


    renderOrderItems();


    const saveButton =
        document.querySelector(
            ".save-order-button"
        );


    if (saveButton) {

        saveButton.textContent =
            "Update Order";

    }


    const title =
        document.getElementById(
            "newOrderTitle"
        );


    if (title) {

        title.textContent =
            "Edit Order";

    }


    const subtitle =
        document.getElementById(
            "newOrderSubtitle"
        );


    if (subtitle) {

        subtitle.textContent =
            order.orderNumber;

    }


    showScreenWithoutReset(
        "newOrderScreen"
    );

}


/* =========================================================
   ORDER SAVED MODAL
========================================================= */

function closeOrderSavedModal() {

    document
        .getElementById(
            "orderSavedModal"
        )
        .classList.add(
            "hidden"
        );


    lastSavedOrder =
        null;


    startNewOrder();

}


function whatsappSavedOrder() {

    if (!lastSavedOrder) {
        return;
    }


    openWhatsApp(
        lastSavedOrder
    );


    /*
        Opening WhatsApp does not prove
        that the user actually sent it.

        But "Sent" means WhatsApp was initiated.
    */

    updateOrderStatus(
        lastSavedOrder.id,
        "Sent"
    );


    closeOrderSavedModal();

}


async function copySavedOrder() {

    if (!lastSavedOrder) {
        return;
    }


    await copyWhatsAppMessage(
        lastSavedOrder
    );


    alert(
        "Order message copied."
    );

}


/* =========================================================
   ORDER HISTORY
========================================================= */

async function renderOrders() {

    const container =
        document.getElementById(
            "ordersList"
        );


    if (!container) {
        return;
    }


    const orders =
        await getAllOrders();


    if (!orders.length) {

        container.innerHTML =
            `
            <div class="empty-state">
                No orders yet.
            </div>
            `;

        return;

    }


    container.innerHTML =
        orders.map(order => {

            const date =
                new Date(
                    order.date
                );


            return `

                <div class="history-card">

                    <div class="history-header">

                        <div>

                            <strong>
                                ${escapeHtml(
                                    order.orderNumber
                                )}
                            </strong>

                            <small>
                                ${formatDateTime(
                                    date
                                )}
                            </small>

                        </div>


                        <span
                            class="status status-${String(
                                order.status || "Pending"
                            ).toLowerCase()}"
                        >
                            ${escapeHtml(
                                order.status || "Pending"
                            )}
                        </span>

                    </div>


                    <div class="history-store">

                        <strong>
                            ${escapeHtml(
                                order.storeNameSnapshot || ""
                            )}
                        </strong>

                        <small>
                            ${escapeHtml(
                                order.storeAddressSnapshot || ""
                            )}
                        </small>

                    </div>


                    <div class="history-summary">

                        <span>
                            ${order.totalItems} items
                        </span>

                        <strong>
                            ₹${Number(
                                order.totalAmount
                            ).toFixed(2)}
                        </strong>

                    </div>


                    <details>

                        <summary>
                            View order
                        </summary>


                        <div class="history-details">

                            ${
                                (order.items || [])
                                    .map(
                                        item => `
                                            <div class="history-item">

                                                <span>
                                                    ${escapeHtml(
                                                        item.name
                                                    )}
                                                    ×
                                                    ${item.qty}
                                                    @
                                                    ₹${Number(
                                                        item.rate
                                                    ).toFixed(2)}
                                                </span>

                                                <strong>
                                                    ₹${Number(
                                                        item.amount
                                                    ).toFixed(2)}
                                                </strong>

                                            </div>
                                        `
                                    )
                                    .join("")
                            }


                            ${
                                order.latitude !== null &&
                                order.latitude !== undefined &&
                                order.longitude !== null &&
                                order.longitude !== undefined
                                    ? `
                                        <a
                                            class="map-link"
                                            href="${buildGoogleMapsUrl(
                                                order.latitude,
                                                order.longitude
                                            )}"
                                            target="_blank"
                                            rel="noopener"
                                        >
                                            📍 Open Delivery Location
                                        </a>
                                    `
                                    : `
                                        <div class="location-missing">
                                            No delivery location saved
                                        </div>
                                    `
                            }


                            ${
                                order.notes
                                    ? `
                                        <div class="history-notes">
                                            <strong>
                                                Notes:
                                            </strong>

                                            ${escapeHtml(
                                                order.notes
                                            )}
                                        </div>
                                    `
                                    : ""
                            }

                        </div>

                    </details>


                    <div class="history-actions">

                        <button
                            class="secondary-button"
                            onclick="editOrder('${escapeAttribute(
                                order.id
                            )}')"
                        >
                            Edit Order
                        </button>


                        <button
                            class="secondary-button"
                            onclick="sendExistingOrder('${escapeAttribute(
                                order.id
                            )}')"
                        >
                            WhatsApp Order
                        </button>


                        ${
                            order.status !==
                            "Delivered"
                                ? `
                                    <button
                                        class="secondary-button"
                                        onclick="markOrderDelivered('${escapeAttribute(
                                            order.id
                                        )}')"
                                    >
                                        Delivered
                                    </button>
                                `
                                : ""
                        }


                        ${
                            order.status !==
                            "Cancelled"
                                ? `
                                    <button
                                        class="secondary-button danger-text"
                                        onclick="markOrderCancelled('${escapeAttribute(
                                            order.id
                                        )}')"
                                    >
                                        Cancel
                                    </button>
                                `
                                : ""
                        }

                    </div>

                </div>

            `;

        }).join("");

}


async function sendExistingOrder(
    id
) {

    const order =
        await getOrderById(
            id
        );


    if (!order) {
        return;
    }


    openWhatsApp(
        order
    );


    await updateOrderStatus(
        id,
        "Sent"
    );


    await renderOrders();

}


async function markOrderDelivered(
    id
) {

    await updateOrderStatus(
        id,
        "Delivered"
    );


    await renderOrders();

}


async function markOrderCancelled(
    id
) {

    if (
        !confirm(
            "Mark this order as cancelled?"
        )
    ) {

        return;

    }


    await updateOrderStatus(
        id,
        "Cancelled"
    );


    await renderOrders();

}


/* =========================================================
   BACKUP
========================================================= */

async function exportBackup() {

    const products =
        await db.products.toArray();


    const stores =
        await db.stores.toArray();


    const orders =
        await db.orders.toArray();


    const backup = {

        app:
            "Distributor Order Management",

        version:
            1,

        exportedAt:
            new Date().toISOString(),

        products,

        stores,

        orders

    };


    const blob =
        new Blob(
            [
                JSON.stringify(
                    backup,
                    null,
                    2
                )
            ],
            {
                type:
                    "application/json"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    const date =
        new Date()
            .toISOString()
            .substring(
                0,
                10
            );


    link.href =
        url;


    link.download =
        `distributor-orders-backup-${date}.json`;


    document.body.appendChild(
        link
    );


    link.click();


    link.remove();


    URL.revokeObjectURL(
        url
    );

}


async function importBackup(
    event
) {

    const file =
        event.target.files[0];


    if (!file) {
        return;
    }


    try {

        const text =
            await file.text();


        const backup =
            JSON.parse(
                text
            );


        if (
            !backup ||
            !Array.isArray(
                backup.products
            ) ||
            !Array.isArray(
                backup.stores
            ) ||
            !Array.isArray(
                backup.orders
            )
        ) {

            throw new Error(
                "Invalid backup file."
            );

        }


        if (
            !confirm(
                "Import this backup? Existing records will not be deleted."
            )
        ) {

            event.target.value =
                "";

            return;

        }


        await db.transaction(
            "rw",
            [
                db.products,
                db.stores,
                db.orders
            ],
            async () => {

                if (
                    backup.products.length
                ) {

                    await db.products.bulkPut(
                        backup.products
                    );

                }


                if (
                    backup.stores.length
                ) {

                    await db.stores.bulkPut(
                        backup.stores
                    );

                }


                if (
                    backup.orders.length
                ) {

                    await db.orders.bulkPut(
                        backup.orders
                    );

                }

            }
        );


        alert(
            "Backup imported successfully."
        );


        await refreshDashboard();


        if (
            currentScreen ===
            "storesScreen"
        ) {

            await renderStores();

        }


        if (
            currentScreen ===
            "ordersScreen"
        ) {

            await renderOrders();

        }

    } catch (error) {

        console.error(
            error
        );


        alert(
            "Unable to import backup. Please check that the file is a valid backup."
        );

    }


    event.target.value =
        "";

}


/* =========================================================
   STORE MAP
========================================================= */

async function openStoreMap(
    id
) {

    const store =
        await getStoreById(
            id
        );


    if (!store) {
        return;
    }


    const url =
        buildGoogleMapsUrl(
            store.latitude,
            store.longitude
        );


    if (!url) {

        alert(
            "No location is saved for this store."
        );

        return;

    }


    window.open(
        url,
        "_blank"
    );

}


/* =========================================================
   HELPERS
========================================================= */

function generateId() {

    if (
        window.crypto &&
        typeof window.crypto.randomUUID ===
            "function"
    ) {

        return window.crypto.randomUUID();

    }


    return (
        Date.now().toString(36) +
        Math.random()
            .toString(36)
            .substring(2)
    );

}


function buildGoogleMapsUrl(
    latitude,
    longitude
) {

    if (
        latitude === null ||
        latitude === undefined ||
        longitude === null ||
        longitude === undefined
    ) {

        return "";

    }


    return `https://www.google.com/maps?q=${latitude},${longitude}`;

}


function formatDateTime(
    date
) {

    return date.toLocaleString(
        "en-IN",
        {
            dateStyle:
                "medium",

            timeStyle:
                "short"
        }
    );

}


function getLocationErrorMessage(
    error
) {

    if (!error) {

        return (
            "Unable to get your location."
        );

    }


    switch (
        error.code
    ) {

        case 1:

            return (
                "Location permission was denied. " +
                "Please allow location access for this site."
            );


        case 2:

            return (
                "Your location could not be determined."
            );


        case 3:

            return (
                "Location request timed out. " +
                "Please try again."
            );


        default:

            return (
                "Unable to get your location."
            );

    }

}


function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}


function escapeAttribute(
    value
) {

    return String(
        value ?? ""
    )
        .replaceAll(
            "\\",
            "\\\\"
        )
        .replaceAll(
            "'",
            "\\'"
        );

}

