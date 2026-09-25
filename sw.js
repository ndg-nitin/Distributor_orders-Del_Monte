const CACHE_NAME =
    "distributor-orders-v9";


const FILES_TO_CACHE = [

    "./",

    "./index.html",

    "./manifest.json",

    "./css/style.css",

    "./js/dexie.min.js",

    "./js/database.js",

    "./js/whatsapp.js",

    "./js/app.js",

    "./data/products.json",

    "./data/stores.json",

    "./assets/icons/launchericon-192x192.png",

    "./assets/icons/launchericon-512x512.png"

];


self.addEventListener(
    "install",
    event => {

        event.waitUntil(

            caches.open(
                CACHE_NAME
            )
            .then(cache => {

                return cache.addAll(
                    FILES_TO_CACHE
                );

            })

        );

        self.skipWaiting();

    }
);


self.addEventListener(
    "activate",
    event => {

        event.waitUntil(

            caches.keys()
                .then(cacheNames => {

                    return Promise.all(

                        cacheNames
                            .filter(
                                name =>
                                    name !==
                                    CACHE_NAME
                            )
                            .map(
                                name =>
                                    caches.delete(
                                        name
                                    )
                            )

                    );

                })

        );

        self.clients.claim();

    }
);


self.addEventListener(
    "fetch",
    event => {

        if (
            event.request.method !==
            "GET"
        ) {
            return;
        }


        event.respondWith(

            caches.match(
                event.request
            )
            .then(cachedResponse => {

                if (cachedResponse) {

                    return cachedResponse;

                }


                return fetch(
                    event.request
                )
                .then(response => {

                    return response;

                })
                .catch(() => {

                    return caches.match(
                        "./index.html"
                    );

                });

            })

        );

    }
);