function buildGoogleMapsUrl(latitude, longitude) {

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


function buildGoogleMapsUrl(latitude, longitude) {

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


function buildWhatsAppMessage(order) {

    let message = "";

    message += `*ORDER: ${order.orderNumber}*\n\n`;

    message += `*Store:* ${order.storeNameSnapshot}\n`;

    if (order.storeAddressSnapshot) {
        message += `*Address:* ${order.storeAddressSnapshot}\n`;
    }

    if (order.storeAreaSnapshot) {
        message += `*Area:* ${order.storeAreaSnapshot}\n`;
    }

    if (order.storeOwnerSnapshot) {
        message += `*Owner:* ${order.storeOwnerSnapshot}\n`;
    }

    if (order.storeMobileSnapshot) {
        message += `*Phone:* ${order.storeMobileSnapshot}\n`;
    }

    message += `\n`;
    message += `*Items:*\n`;

    order.items.forEach((item, index) => {

        message +=
            `${index + 1}. ${item.name} × ${item.qty} @ ₹${Number(item.rate).toFixed(2)} = ₹${Number(item.amount).toFixed(2)}\n`;

    });

    message += `\n`;

    message += `*Total Items:* ${order.totalItems}\n`;
    message += `*Total Amount:* ₹${Number(order.totalAmount).toFixed(2)}\n`;

    if (order.notes) {
        message += `\n`;
        message += `*Notes:* ${order.notes}\n`;
    }

    const mapsUrl = buildGoogleMapsUrl(
        order.latitude,
        order.longitude
    );

    if (mapsUrl) {
        message += `\n`;
        message += `*Delivery Location:*\n`;
        message += `${mapsUrl}\n`;
    }

    message += `\nPlease deliver the order to the above location.`;

    return message;
}


function openWhatsApp(order) {

    const message = buildWhatsAppMessage(order);

    const url =
        `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(url, "_blank");
}


async function copyWhatsAppMessage(order) {

    const message = buildWhatsAppMessage(order);

    try {

        await navigator.clipboard.writeText(message);

        return true;

    } catch (error) {

        const textarea = document.createElement("textarea");

        textarea.value = message;

        textarea.style.position = "fixed";
        textarea.style.opacity = "0";

        document.body.appendChild(textarea);

        textarea.select();

        document.execCommand("copy");

        textarea.remove();

        return true;
    }
}


/*
    Opens WhatsApp without specifying a recipient.

    This allows the user to choose:
    - WhatsApp contact
    - WhatsApp group
    - themselves
    - delivery person
*/

function openWhatsApp(order) {

    const message =
        buildWhatsAppMessage(order);

    const url =
        `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(
        url,
        "_blank"
    );

}


async function copyWhatsAppMessage(order) {

    const message =
        buildWhatsAppMessage(order);

    try {

        await navigator.clipboard.writeText(
            message
        );

        return true;

    } catch (error) {

        const textarea =
            document.createElement("textarea");

        textarea.value = message;

        textarea.style.position = "fixed";
        textarea.style.opacity = "0";

        document.body.appendChild(
            textarea
        );

        textarea.select();

        document.execCommand("copy");

        textarea.remove();

        return true;

    }

}