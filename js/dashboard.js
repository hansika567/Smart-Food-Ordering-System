/**
 * Canteen Management System - Dashboard Controller
 * 
 * Performs:
 * 1. Session check on page load (Redirects to login.html if not authenticated)
 * 2. Load and persist shopping cart via localStorage
 * 3. Dynamic shopping cart operations and Cost calculations
 * 4. Dynamic notification badge count updates
 * 5. Navigation rendering & routing between pages
 * 6. Rendering dynamic grids (Foods, Cakes, Favorites)
 * 7. Modal controllers (custom cakes letterings, printing invoice bills)
 * 8. Dark mode styling switcher
 * 9. Live search filters
 */

// ==========================================================================
// A. SESSION CHECK & GLOBAL STATE
// ==========================================================================
const isLoggedIn = localStorage.getItem("isLoggedIn");
if (isLoggedIn !== "true") {
    // If user attempts to access dashboard directly without login, force redirect
    window.location.href = "login.html";
}

let currentUser = localStorage.getItem("username") || "User";
let userEmail = localStorage.getItem("email") || "user@example.com";

// Persist Cart Items - load saved cart array or default to empty
let cart = JSON.parse(localStorage.getItem("canteenCart")) || [];
// Persist Favorites Items
let favorites = JSON.parse(localStorage.getItem("canteenFavorites")) || [];

// Activity Log State
let notificationsLog = JSON.parse(localStorage.getItem("notificationsLog")) || [];

// ==========================================================================
// B. MENU DATA STORE
// ==========================================================================
const menuItems = [
    {
        id: "burger-fish",
        name: "Fish Burger",
        price: 259.00,
        emoji: "🍔",
        category: "food"
    },
    {
        id: "pizza-pep",
        name: "Pepperoni Pizza",
        price: 359.00,
        emoji: "🍕",
        category: "food"
    },
    {
        id: "pizza-veg",
        name: "Vegan Pizza",
        price: 299.00,
        emoji: "🍕",
        category: "food"
    },
    {
        id: "wings-chick",
        name: "Chicken Wings",
        price: 199.00,
        emoji: "🍗",
        category: "food"
    },
    {
        id: "sandwich-club",
        name: "Club Sandwich",
        price: 149.00,
        emoji: "🥪",
        category: "food"
    },
    {
        id: "fries-french",
        name: "French Fries",
        price: 99.00,
        emoji: "🍟",
        category: "food"
    },
    {
        id: "noodles-hakka",
        name: "Veg Hakka Noodles",
        price: 189.00,
        emoji: "🍜",
        category: "food"
    },
    {
        id: "biryani-chick",
        name: "Chicken Biryani",
        price: 279.00,
        emoji: "🍛",
        category: "food"
    },
    {
        id: "paneer-tikka",
        name: "Paneer Tikka",
        price: 219.00,
        emoji: "🍢",
        category: "food"
    },
    {
        id: "soda-lemon",
        name: "Fresh Lemon Soda",
        price: 79.00,
        emoji: "🥤",
        category: "food"
    },
    {
        id: "cake-truffle",
        name: "Chocolate Truffle Cake",
        price: 599.00,
        emoji: "🎂",
        category: "cake"
    },
    {
        id: "cake-velvet",
        name: "Red Velvet Cake",
        price: 699.00,
        emoji: "🍰",
        category: "cake"
    },
    {
        id: "cake-scotch",
        name: "Butterscotch Cake",
        price: 549.00,
        emoji: "🧁",
        category: "cake"
    },
    {
        id: "cake-forest",
        name: "Black Forest Cake",
        price: 649.00,
        emoji: "🎂",
        category: "cake"
    }
];

// Quantity counters tracked on cards before adding to cart (for Foods)
let cardQuantities = {};
menuItems.forEach(item => {
    cardQuantities[item.id] = 0;
});

// Run setup code once the page loads
window.addEventListener("DOMContentLoaded", () => {
    // Populate username greetings
    document.getElementById("display-user-greeting").innerText = `Welcome back, ${currentUser}!`;
    document.getElementById("settings-username").value = currentUser;
    document.getElementById("settings-email").value = userEmail;

    // Initial render of cards
    renderFoodMenu();
    renderCakesMenu();
    renderFeaturedMenu();
    updateCartUI();

    // Welcome notification log if log is empty
    if (notificationsLog.length === 0) {
        addNotification(`Logged in as ${currentUser}.`);
    }
    renderNotifications();
});


// ==========================================================================
// C. LOGOUT PROCESS
// ==========================================================================
function handleLogout() {
    if (confirm("Are you sure you want to log out?")) {
        // Clear browser session storage
        localStorage.clear();
        // Redirect back to login.html
        window.location.href = "login.html";
    }
}


// ==========================================================================
// D. SIDEBAR NAVIGATION SYSTEM (SPA view toggles)
// ==========================================================================
function navigateTo(pageId) {
    // 1. Hide all pages
    const pages = document.querySelectorAll(".app-view");
    pages.forEach(page => {
        page.classList.remove("active-view");
    });

    // 2. De-activate all sidebar nav items
    const navItems = document.querySelectorAll(".nav-item");
    navItems.forEach(item => {
        item.classList.remove("active");
    });

    // 3. Show requested page
    const targetPage = document.getElementById(`view-${pageId}`);
    if (targetPage) {
        targetPage.classList.add("active-view");
    }

    // 4. Highlight active nav button
    const targetNav = document.getElementById(`nav-${pageId}`);
    if (targetNav) {
        targetNav.classList.add("active");
    }

    // 5. Special page hooks
    if (pageId === "favorite") {
        renderFavoritesMenu();
    }
}


// ==========================================================================
// E. CARD RENDERING SYSTEM
// ==========================================================================
function createCardHTML(item, location = 'order') {
    const isFav = favorites.includes(item.id) ? "active" : "";
    const qty = cardQuantities[item.id] || 0;

    let controlSectionHTML = "";

    if (item.category === "food") {
        controlSectionHTML = `
            <div class="card-controls">
                <div class="qty-control">
                    <button class="qty-btn" onclick="adjustCardQty('${item.id}', -1, '${location}')">-</button>
                    <span class="qty-val" id="card-qty-${location}-${item.id}">${qty}</span>
                    <button class="qty-btn" onclick="adjustCardQty('${item.id}', 1, '${location}')">+</button>
                </div>
                <button class="btn-card-add" onclick="handleFoodAdd('${item.id}', '${location}')">Add to Cart</button>
                <button class="btn-favorite ${isFav}" onclick="toggleFav('${item.id}', this)" title="Favorite">
                    <i class="fa-solid fa-heart"></i>
                </button>
            </div>
        `;
    } else if (item.category === "cake") {
        controlSectionHTML = `
            <div class="card-controls">
                <button class="btn-card-add" style="background-color: var(--sidebar-active); color: var(--sidebar-active-text);" onclick="openCakeModal('${item.id}')">Customize</button>
                <button class="btn-favorite ${isFav}" onclick="toggleFav('${item.id}', this)" title="Favorite">
                    <i class="fa-solid fa-heart"></i>
                </button>
            </div>
        `;
    }

    return `
        <div class="menu-card" id="card-${location}-${item.id}">
            <div class="food-image-block">
                <span class="food-emoji-icon">${item.emoji}</span>
            </div>
            <div class="food-details">
                <h3>${item.name}</h3>
                <p class="food-price">₹${item.price.toFixed(2)}</p>
            </div>
            ${controlSectionHTML}
        </div>
    `;
}

function renderFoodMenu() {
    const grid = document.getElementById("food-order-grid");
    if (!grid) return;
    const foods = menuItems.filter(item => item.category === "food");
    grid.innerHTML = foods.map(food => createCardHTML(food, 'order')).join("");
}

function renderCakesMenu() {
    const grid = document.getElementById("birthday-cakes-grid");
    if (!grid) return;
    const cakes = menuItems.filter(item => item.category === "cake");
    grid.innerHTML = cakes.map(cake => createCardHTML(cake, 'order')).join("");
}

function renderFeaturedMenu() {
    const grid = document.getElementById("dashboard-featured-grid");
    if (!grid) return;
    const featured = menuItems.filter(item => item.id === "burger-fish" || item.id === "pizza-pep" || item.id === "sandwich-club");
    grid.innerHTML = featured.map(item => createCardHTML(item, 'dashboard')).join("");
}

function renderFavoritesMenu() {
    const grid = document.getElementById("favorites-grid");
    const emptyState = document.getElementById("favorites-empty-state");
    if (!grid || !emptyState) return;

    if (favorites.length === 0) {
        emptyState.style.display = "flex";
        grid.style.display = "none";
    } else {
        emptyState.style.display = "none";
        grid.style.display = "grid";
        const favItems = menuItems.filter(item => favorites.includes(item.id));
        grid.innerHTML = favItems.map(item => createCardHTML(item, 'favorite')).join("");
    }
}

function adjustCardQty(itemId, change, location) {
    let currentQty = cardQuantities[itemId] || 0;
    currentQty = Math.max(0, currentQty + change);
    cardQuantities[itemId] = currentQty;

    // Sync quantity counters across all locations for this item in real-time
    const locations = ['order', 'dashboard', 'favorite'];
    locations.forEach(loc => {
        const span = document.getElementById(`card-qty-${loc}-${itemId}`);
        if (span) {
            span.innerText = currentQty;
        }
    });
}

function toggleFav(itemId, element) {
    const item = menuItems.find(m => m.id === itemId);

    if (favorites.includes(itemId)) {
        favorites = favorites.filter(id => id !== itemId);
        element.classList.remove("active");
        if (item) {
            addNotification(`Removed ${item.name} from favorites.`);
            showToast(`Removed ${item.name} from favorites! 💔`);
        }
    } else {
        favorites.push(itemId);
        element.classList.add("active");
        if (item) {
            addNotification(`Added ${item.name} to favorites.`);
            showToast(`Added ${item.name} to favorites! ❤️`);
        }
    }

    // Save updated favorites to local storage
    localStorage.setItem("canteenFavorites", JSON.stringify(favorites));

    const allFavButtons = document.querySelectorAll(`[onclick*="toggleFav('${itemId}'"]`);
    allFavButtons.forEach(btn => {
        if (favorites.includes(itemId)) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });

    if (document.getElementById("view-favorite").classList.contains("active-view")) {
        renderFavoritesMenu();
    }

    // Update Cart UI so notification bell badge updates count
    updateCartUI();
}


// ==========================================================================
// F. SHOPPING CART OPERATIONS
// ==========================================================================
function handleFoodAdd(itemId, location = 'order') {
    const qtyToAdd = cardQuantities[itemId] || 0;
    if (qtyToAdd === 0) {
        alert("Please set quantity greater than 0 before adding.");
        return;
    }

    const item = menuItems.find(m => m.id === itemId);
    if (!item) return;

    const existingIndex = cart.findIndex(c => c.id === itemId && c.category === "food");

    if (existingIndex > -1) {
        cart[existingIndex].quantity += qtyToAdd;
    } else {
        cart.push({
            id: item.id,
            name: item.name,
            price: item.price,
            emoji: item.emoji,
            category: "food",
            quantity: qtyToAdd
        });
    }

    cardQuantities[itemId] = 0;
    
    // Reset count displays across all locations
    const locations = ['order', 'dashboard', 'favorite'];
    locations.forEach(loc => {
        const span = document.getElementById(`card-qty-${loc}-${itemId}`);
        if (span) {
            span.innerText = "0";
        }
    });

    addNotification(`Added ${qtyToAdd}x ${item.name} to cart.`);
    showToast(`Added ${qtyToAdd}x ${item.name} to cart! 🛒`);
    updateCartUI();
}

function adjustCartQty(cartIndex, change) {
    const itemName = cart[cartIndex].name;
    const newQty = cart[cartIndex].quantity + change;

    if (newQty <= 0) {
        addNotification(`Removed ${itemName} from cart.`);
        cart.splice(cartIndex, 1);
    } else {
        const action = change > 0 ? "Increased" : "Decreased";
        addNotification(`${action} quantity of ${itemName} to ${newQty}.`);
        cart[cartIndex].quantity += change;
    }
    updateCartUI();
}

/**
 * Updates cart content panels, calculates prices, saves to localStorage, and updates notification badge
 */
function updateCartUI() {
    const cartList = document.getElementById("cart-items-list");
    const grandTotalSpan = document.getElementById("cart-grand-total");
    const checkoutBtn = document.getElementById("btn-checkout");

    // 1. Save Cart to Local Storage (keeps cart items persistent across reloads)
    localStorage.setItem("canteenCart", JSON.stringify(cart));

    // 2. Cart UI updates automatically

    // 3. Render Empty state
    if (cart.length === 0) {
        cartList.innerHTML = `<div class="cart-empty-message">Your cart is empty</div>`;
        grandTotalSpan.innerText = "₹50.00";
        checkoutBtn.classList.add("disabled");
        checkoutBtn.disabled = true;
        return;
    }

    // 4. Render Cart items
    cartList.innerHTML = cart.map((cartItem, index) => {
        let customLabels = "";
        if (cartItem.size) {
            customLabels += `<div class="cart-item-custom-text">Size: ${cartItem.size} kg</div>`;
        }
        if (cartItem.customText) {
            customLabels += `<div class="cart-item-custom-text">Lettering: "${cartItem.customText}"</div>`;
        }

        return `
            <div class="cart-item">
                <div class="cart-item-emoji">${cartItem.emoji}</div>
                <div class="cart-item-details">
                    <div class="cart-item-name">${cartItem.name}</div>
                    ${customLabels}
                    <div class="cart-item-price">₹${(cartItem.price * cartItem.quantity).toFixed(2)}</div>
                </div>
                <div class="qty-control">
                    <button class="qty-btn" onclick="adjustCartQty(${index}, -1)">-</button>
                    <span class="qty-val">${cartItem.quantity}</span>
                    <button class="qty-btn" onclick="adjustCartQty(${index}, 1)">+</button>
                </div>
            </div>
        `;
    }).join("");

    // Calculate subtotal
    let subtotal = 0;
    cart.forEach(item => {
        subtotal += item.price * item.quantity;
    });

    const serviceCharge = 50.00;
    const total = subtotal + serviceCharge;

    grandTotalSpan.innerText = `₹${total.toFixed(2)}`;
    checkoutBtn.classList.remove("disabled");
    checkoutBtn.disabled = false;
}


// ==========================================================================
// G. CAKE CUSTOMIZATION MODAL HANDLERS
// ==========================================================================
function openCakeModal(cakeId) {
    const item = menuItems.find(m => m.id === cakeId);
    if (!item) return;

    document.getElementById("custom-cake-id").value = cakeId;
    document.getElementById("custom-cake-name").innerText = item.name;
    document.getElementById("custom-cake-emoji").innerText = item.emoji;
    document.getElementById("custom-cake-base-price").innerText = `Base Price: ₹${item.price.toFixed(2)}`;
    document.getElementById("cake-size").value = "0.5";
    document.getElementById("cake-text").value = "";
    document.getElementById("cake-message").value = "";
    document.getElementById("custom-cake-total-price").innerText = `₹${item.price.toFixed(2)}`;

    document.getElementById("cake-modal").style.display = "flex";
}

function closeCakeModal() {
    document.getElementById("cake-modal").style.display = "none";
}

function updateCakeCustomPrice() {
    const cakeId = document.getElementById("custom-cake-id").value;
    const item = menuItems.find(m => m.id === cakeId);
    if (!item) return;

    const sizeValue = document.getElementById("cake-size").value;
    let basePrice = item.price;
    
    if (sizeValue === "1") {
        basePrice += 300;
    } else if (sizeValue === "2") {
        basePrice += 700;
    }

    document.getElementById("custom-cake-total-price").innerText = `₹${basePrice.toFixed(2)}`;
}

function handleCakeCustomizedSubmit(event) {
    event.preventDefault();

    const cakeId = document.getElementById("custom-cake-id").value;
    const item = menuItems.find(m => m.id === cakeId);
    if (!item) return;

    const selectedSize = document.getElementById("cake-size").value;
    const sizeLabel = selectedSize === "0.5" ? "0.5" : selectedSize === "1" ? "1.0" : "2.0";
    const textOnCake = document.getElementById("cake-text").value.trim();
    
    let finalPrice = item.price;
    if (selectedSize === "1") finalPrice += 300;
    if (selectedSize === "2") finalPrice += 700;

    cart.push({
        id: item.id,
        name: item.name,
        price: finalPrice,
        emoji: item.emoji,
        category: "cake",
        quantity: 1,
        size: sizeLabel,
        customText: textOnCake
    });

    addNotification(`Added customized ${item.name} (${sizeLabel} kg) to cart.`);
    showToast(`Added customized ${item.name} to cart! 🎂`);
    closeCakeModal();
    updateCartUI();
}


// ==========================================================================
// H. CHECKOUT INVOICE GENERATION & PRINT SYSTEM
// ==========================================================================
function handleOpenCheckout() {
    if (cart.length === 0) return;

    document.getElementById("invoice-user-name").innerText = currentUser;
    document.getElementById("invoice-date").innerText = new Date().toISOString().split('T')[0];
    
    const randomInvNumber = Math.floor(10000 + Math.random() * 90000);
    document.getElementById("invoice-number").innerText = `#INV-${randomInvNumber}`;

    const tableBody = document.getElementById("invoice-items-body");
    tableBody.innerHTML = cart.map(item => {
        let metaDetails = "";
        if (item.size || item.customText) {
            metaDetails = `<div class="invoice-item-meta">`;
            if (item.size) metaDetails += `Size: ${item.size}kg `;
            if (item.customText) metaDetails += `Lettering: "${item.customText}"`;
            metaDetails += `</div>`;
        }

        return `
            <tr>
                <td>
                    <strong>${item.name}</strong>
                    ${metaDetails}
                </td>
                <td class="text-right">₹${item.price.toFixed(2)}</td>
                <td class="text-center">${item.quantity}</td>
                <td class="text-right">₹${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
        `;
    }).join("");

    let subtotal = 0;
    cart.forEach(item => {
        subtotal += item.price * item.quantity;
    });
    
    const serviceFee = 50.00;
    const total = subtotal + serviceFee;

    document.getElementById("invoice-subtotal").innerText = `₹${subtotal.toFixed(2)}`;
    document.getElementById("invoice-grand-total").innerText = `₹${total.toFixed(2)}`;

    addNotification(`Checked out Invoice #INV-${randomInvNumber} for ₹${total.toFixed(2)}.`);
    document.getElementById("invoice-modal").style.display = "flex";
}

function handleCloseCheckout() {
    document.getElementById("invoice-modal").style.display = "none";
}

function printAndDownloadInvoice() {
    window.print();
}


// ==========================================================================
// I. FEEDBACK & SETTINGS FORM SUBMISSIONS
// ==========================================================================
function handleSendMessage(event) {
    event.preventDefault();
    const banner = document.getElementById("message-success-banner");
    banner.style.display = "flex";
    addNotification(`Sent feedback query to Canteen.`);
    document.getElementById("feedback-form").reset();

    setTimeout(() => {
        banner.style.display = "none";
    }, 4000);
}

function handleUpdateSettings(event) {
    event.preventDefault();

    const usernameVal = document.getElementById("settings-username").value.trim();
    const emailVal = document.getElementById("settings-email").value.trim();
    const banner = document.getElementById("settings-success-banner");

    if (usernameVal !== "") {
        currentUser = usernameVal;
        localStorage.setItem("username", currentUser);
        document.getElementById("display-user-greeting").innerText = `Welcome back, ${currentUser}!`;
    }

    if (emailVal !== "") {
        userEmail = emailVal;
        localStorage.setItem("email", userEmail);
    }

    addNotification(`Updated profile settings.`);
    banner.style.display = "flex";
    setTimeout(() => {
        banner.style.display = "none";
    }, 4000);
}

function toggleDarkMode() {
    const isChecked = document.getElementById("settings-darkmode").checked;
    if (isChecked) {
        document.body.classList.add("dark-mode");
    } else {
        document.body.classList.remove("dark-mode");
    }
    addNotification(`Toggled ${isChecked ? "Dark" : "Light"} mode.`);
}


// ==========================================================================
// J. LIVE SEARCH FILTER
// ==========================================================================
function handleSearch() {
    const query = document.getElementById("search-input").value.toLowerCase();
    const activeView = document.querySelector(".app-view.active-view");
    if (!activeView) return;

    const cards = activeView.querySelectorAll(".menu-card");
    cards.forEach(card => {
        const title = card.querySelector("h3").innerText.toLowerCase();
        if (title.includes(query)) {
            card.style.display = "flex";
        } else {
            card.style.display = "none";
        }
    });
}

// ==========================================================================
// K. RECENT ACTIVITY NOTIFICATION LOGIC
// ==========================================================================

/**
 * Prepends a new notification message with a timestamp
 */
function addNotification(message) {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    notificationsLog.unshift(`${timestamp} - ${message}`);

    // Keep log size limited to last 10 entries
    if (notificationsLog.length > 10) {
        notificationsLog.pop();
    }

    localStorage.setItem("notificationsLog", JSON.stringify(notificationsLog));
    renderNotifications();
}

/**
 * Renders the notification list inside the dropdown
 */
function renderNotifications() {
    const list = document.getElementById("notifications-list");
    if (!list) return;

    // Sync the bell badge count with the number of activity notifications
    const badge = document.querySelector(".bell-badge");
    if (badge) {
        const count = notificationsLog.length;
        if (count > 0) {
            badge.innerText = count;
            badge.style.display = "flex";
        } else {
            badge.style.display = "none";
        }
    }

    if (notificationsLog.length === 0) {
        list.innerHTML = `<li class="notification-empty">No recent activity</li>`;
        return;
    }

    list.innerHTML = notificationsLog.map(item => `<li>${item}</li>`).join("");
}

/**
 * Toggles the visibility of the notifications dropdown panel
 */
function toggleNotificationsDropdown(event) {
    event.stopPropagation(); // prevent window click listener from closing it instantly
    const dropdown = document.getElementById("notifications-dropdown");
    if (!dropdown) return;

    if (dropdown.style.display === "none") {
        dropdown.style.display = "block";
    } else {
        dropdown.style.display = "none";
    }
}

/**
 * Clears the notifications log
 */
function clearNotifications(event) {
    event.stopPropagation();
    notificationsLog = [];
    localStorage.removeItem("notificationsLog");
    renderNotifications();
}

// Window click listener to close dropdown when clicking outside
window.addEventListener("click", (event) => {
    const dropdown = document.getElementById("notifications-dropdown");
    const bellContainer = document.querySelector(".notification-container");
    if (dropdown && dropdown.style.display === "block") {
        if (!bellContainer.contains(event.target)) {
            dropdown.style.display = "none";
        }
    }
});

/**
 * Triggers a temporary floating toast alert at the bottom-left of the screen
 */
function showToast(message) {
    let container = document.getElementById("toast-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";
        container.style.position = "fixed";
        container.style.bottom = "20px";
        container.style.left = "20px";
        container.style.zIndex = "2000";
        container.style.display = "flex";
        container.style.flexDirection = "column";
        container.style.gap = "10px";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = "toast-notification";
    toast.innerText = message;
    
    // Dynamic visual styling for toast
    toast.style.backgroundColor = "var(--sidebar-active-text)";
    toast.style.color = "#ffffff";
    toast.style.padding = "12px 24px";
    toast.style.borderRadius = "var(--border-radius-md)";
    toast.style.boxShadow = "var(--shadow-medium)";
    toast.style.fontSize = "0.85rem";
    toast.style.fontWeight = "600";
    
    container.appendChild(toast);

    // Fade out and remove toast after 3 seconds
    setTimeout(() => {
        toast.style.animation = "slideOutToast 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards";
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}
