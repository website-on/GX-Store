// --- Firebase Configuration ---
const firebaseConfig = {
    apiKey: "AIzaSyA3kU0Kn_qzeqpLG_tUBT2QhvI7YJmBQOE",
    authDomain: "gx-store-671da.firebaseapp.com",
    projectId: "gx-store-671da",
    storageBucket: "gx-store-671da.firebasestorage.app",
    messagingSenderId: "1077689403863",
    appId: "1:1077689403863:web:8aaa0fa72ceae3fe036392",
    measurementId: "G-FPH0HL5429"
};

// Initialize Firebase using the Compat mode (safe for file:// usage)
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// --- State ---
let products = [];
let cart = JSON.parse(localStorage.getItem('gx_cart')) || [];

// --- Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
    // Check old cart format vs new Firebase ID strings
    if (cart.length > 0 && typeof cart[0].id === 'number') {
        cart = []; // Reset old localstorage array
        saveCart();
    }

    await fetchProducts();
    updateCartIcon();
});

// --- Firebase Data Fetching ---
async function fetchProducts() {
    try {
        const snapshot = await db.collection('products').get();
        products = [];

        if (snapshot.empty) {
            // Seed initial products if DB is empty
            const defaultProducts = [
                { name: '60 شدة ببجي', price: 0.99, image: 'https://cdn.arabsstock.com/uploads/images/64102/image-64102-playing-pubg-mobile-middle-east-pubg-mobile-famous-electronic-thumbnail.jpg' },
                { name: '325 شدة ببجي', price: 4.99, image: 'https://cdn.arabsstock.com/uploads/images/64102/image-64102-playing-pubg-mobile-middle-east-pubg-mobile-famous-electronic-thumbnail.jpg' },
                { name: '100 جوهرة فري فاير', price: 0.99, image: 'https://esports.sa/wp-content/uploads/2023/12/Garena-Free-Fire-800x450.jpg' },
                { name: '530 جوهرة فري فاير', price: 4.99, image: 'https://esports.sa/wp-content/uploads/2023/12/Garena-Free-Fire-800x450.jpg' }
            ];

            for (let dp of defaultProducts) {
                const docRef = await db.collection('products').add(dp);
                products.push({ id: docRef.id, ...dp });
            }
        } else {
            snapshot.forEach(docSnap => {
                products.push({ id: docSnap.id, ...docSnap.data() });
            });
        }

        renderProducts();
        if (document.getElementById('admin-panel-section') && document.getElementById('admin-panel-section').style.display === 'block') {
            renderAdminProducts();
        }
    } catch (error) {
        console.error("Error loading products from Firebase:", error);
    }
}

// --- Navigation ---
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById(`${pageId}-page`).classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- Render Products ---
function renderProducts() {
    const list = document.getElementById('products-list');
    list.innerHTML = '';

    const displayProducts = [...products].reverse(); // newest first

    displayProducts.forEach(prod => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <img src="${prod.image}" alt="${prod.name}" class="product-image" onerror="this.src='https://via.placeholder.com/250x150/151522/00ffcc?text=GX+STORE'">
            <h3 class="product-name">${prod.name}</h3>
            <div class="product-price">${prod.price} $</div>
            <button class="add-to-cart" onclick="addToCart('${prod.id}')">أضف للسلة <i class="fas fa-cart-plus"></i></button>
        `;
        list.appendChild(card);
    });
}

// --- Cart Logic ---
function toggleCart() {
    document.getElementById('cart-sidebar').classList.toggle('open');
    document.getElementById('overlay').classList.toggle('active');
    renderCart();
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (product) {
        cart.push(product);
        saveCart();
        updateCartIcon();
        const countBadge = document.getElementById('cart-count');
        countBadge.style.transform = 'scale(1.5)';
        setTimeout(() => countBadge.style.transform = 'scale(1)', 200);
    }
}

function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
    renderCart();
    updateCartIcon();
}

function saveCart() {
    localStorage.setItem('gx_cart', JSON.stringify(cart));
}

function updateCartIcon() {
    document.getElementById('cart-count').innerText = cart.length;
}

function renderCart() {
    const cartItemsDiv = document.getElementById('cart-items');
    const cartTotalSpan = document.getElementById('cart-total');
    let total = 0;

    cartItemsDiv.innerHTML = '';

    if (cart.length === 0) {
        cartItemsDiv.innerHTML = '<p style="text-align:center; color: #a0a0b8; margin-top: 20px; font-size: 18px;">السلة فارغة</p>';
    } else {
        cart.forEach((item, index) => {
            total += parseFloat(item.price);
            cartItemsDiv.innerHTML += `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-price">${item.price} $</div>
                    </div>
                    <button class="remove-item" onclick="removeFromCart(${index})" title="حذف"><i class="fas fa-trash"></i></button>
                </div>
            `;
        });
    }

    cartTotalSpan.innerText = total.toFixed(2);
}

function checkout() {
    if (cart.length === 0) {
        alert("السلة فارغة! يرجى إضافة منتجات أولاً.");
        return;
    }

    let message = "مرحباً GX STORE، أود طلب المنتجات التالية:%0a%0a";
    let total = 0;

    const itemCounts = {};
    cart.forEach(item => {
        if (itemCounts[item.name]) {
            itemCounts[item.name].count++;
            itemCounts[item.name].total += parseFloat(item.price);
        } else {
            itemCounts[item.name] = { count: 1, price: parseFloat(item.price), total: parseFloat(item.price) };
        }
    });

    for (const [name, info] of Object.entries(itemCounts)) {
        message += `- ${name} (الكمية: ${info.count}) - ${info.total.toFixed(2)}$ %0a`;
        total += info.total;
    }

    message += `%0a*الإجمالي: ${total.toFixed(2)}$*`;

    const whatsappNumber = "201097173850"; // Egypt format 010... -> 2010...
    const url = `https://wa.me/${whatsappNumber}?text=${message}`;

    window.open(url, '_blank');
}

// --- Admin Logic ---
function openAdminLogin() {
    document.getElementById('admin-modal').classList.add('active');
    document.getElementById('admin-error').style.display = 'none';

    if (sessionStorage.getItem('gx_admin_logged')) {
        showAdminPanel();
    } else {
        document.getElementById('admin-login-section').style.display = 'block';
        document.getElementById('admin-panel-section').style.display = 'none';
    }
}

function closeAdminModal() {
    document.getElementById('admin-modal').classList.remove('active');
}

function checkAdminPassword() {
    const pswd = document.getElementById('admin-password').value;
    if (pswd === '1357') {
        sessionStorage.setItem('gx_admin_logged', 'true');
        document.getElementById('admin-password').value = '';
        showAdminPanel();
    } else {
        document.getElementById('admin-error').style.display = 'block';
    }
}

function logoutAdmin() {
    sessionStorage.removeItem('gx_admin_logged');
    closeAdminModal();
}

function showAdminPanel() {
    document.getElementById('admin-login-section').style.display = 'none';
    document.getElementById('admin-panel-section').style.display = 'block';
    resetForm();
    renderAdminProducts();
}

function renderAdminProducts() {
    const list = document.getElementById('admin-products-list');
    list.innerHTML = '';

    products.forEach(prod => {
        list.innerHTML += `
            <div class="admin-product-item">
                <div class="admin-prod-info">
                    <img src="${prod.image}" class="admin-prod-img" onerror="this.src='https://via.placeholder.com/50/151522/00ffcc?text=GX'">
                    <span style="font-weight: bold;">${prod.name} <br> <span style="font-size:14px; color:#00ffcc;">${prod.price}$</span></span>
                </div>
                <div class="admin-actions">
                    <button class="edit-btn" onclick="editProduct('${prod.id}')" title="تعديل"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn" onclick="deleteProduct('${prod.id}')" title="حذف"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    });
}

function previewImage(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            resizeImage(e.target.result, 500, 500, function (resizedBase64) {
                document.getElementById('image-preview').src = resizedBase64;
                document.getElementById('image-preview-container').style.display = 'block';
                document.getElementById('product-image-base64').value = resizedBase64;
            });
        }
        reader.readAsDataURL(file);
    }
}

function resizeImage(base64Str, maxWidth, maxHeight, callback) {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > height) {
            if (width > maxWidth) {
                height *= maxWidth / width;
                width = maxWidth;
            }
        } else {
            if (height > maxHeight) {
                width *= maxHeight / height;
                height = maxHeight;
            }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        callback(canvas.toDataURL('image/jpeg', 0.8));
    };
}

function removeImage() {
    document.getElementById('product-image-file').value = '';
    document.getElementById('image-preview').src = '';
    document.getElementById('image-preview-container').style.display = 'none';
    document.getElementById('product-image-base64').value = '';
}

function resetForm() {
    document.getElementById('product-form').reset();
    document.getElementById('product-id').value = '';
    document.getElementById('form-title').innerText = 'إضافة منتج جديد';
    document.getElementById('save-product-btn').innerHTML = 'حفظ المنتج <i class="fas fa-save"></i>';
    document.getElementById('cancel-edit-btn').style.display = 'none';
    removeImage();

    document.getElementById('save-product-btn').disabled = false;
}

async function saveProduct(e) {
    e.preventDefault();
    document.getElementById('save-product-btn').disabled = true;

    const idInput = document.getElementById('product-id').value;
    const name = document.getElementById('product-name').value;
    const price = parseFloat(document.getElementById('product-price').value);
    let base64Image = document.getElementById('product-image-base64').value;

    if (!base64Image) {
        base64Image = 'https://via.placeholder.com/250x150/151522/00ffcc?text=GX+STORE';
    }

    try {
        if (idInput) {
            // Edit existing in Firebase
            await db.collection('products').doc(idInput).update({ name, price, image: base64Image });

            // Update local state
            const index = products.findIndex(p => p.id === idInput);
            if (index > -1) {
                products[index] = { id: idInput, name, price, image: base64Image };

                // Update specific cart items if needed
                cart = cart.map(item => item.id === idInput ? { ...item, name, price, image: base64Image } : item);
                saveCart();
                updateCartIcon();
            }
        } else {
            // Add new in Firebase
            const docRef = await db.collection('products').add({ name, price, image: base64Image });
            products.push({ id: docRef.id, name, price, image: base64Image });
        }

        resetForm();
        renderAdminProducts();
        renderProducts();
    } catch (err) {
        console.error("Error saving product to Firebase:", err);
        alert('حدث خطأ أثناء حفظ المنتج.' + err.message);
        document.getElementById('save-product-btn').disabled = false;
    }
}

function editProduct(id) {
    const prod = products.find(p => p.id === id);
    if (prod) {
        document.getElementById('product-id').value = prod.id;
        document.getElementById('product-name').value = prod.name;
        document.getElementById('product-price').value = prod.price;

        if (prod.image) {
            document.getElementById('product-image-base64').value = prod.image;
            document.getElementById('image-preview').src = prod.image;
            document.getElementById('image-preview-container').style.display = 'block';
        } else {
            removeImage();
        }

        document.getElementById('form-title').innerText = 'تعديل المنتج';
        document.getElementById('save-product-btn').innerHTML = 'تحديث المنتج <i class="fas fa-check"></i>';
        document.getElementById('cancel-edit-btn').style.display = 'inline-block';

        document.getElementById('save-product-btn').disabled = false;
        document.querySelector('.admin-form-container').scrollIntoView({ behavior: 'smooth' });
    }
}

async function deleteProduct(id) {
    if (confirm('هل أنت متأكد من حذف هذا المنتج نهائياً من قاعدة البيانات؟')) {
        try {
            // Delete from Firebase
            await db.collection('products').doc(id).delete();

            // Update locals
            products = products.filter(p => p.id !== id);
            cart = cart.filter(item => item.id !== id);

            saveCart();
            updateCartIcon();

            renderAdminProducts();
            renderProducts();
        } catch (error) {
            console.error("Error deleting product from Firebase:", error);
            alert("فشل مسح المنتج.");
        }
    }
}
