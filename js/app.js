// --- Initial Data ---
const defaultProducts = [
    { id: 1, name: '60 شدة ببجي', price: 0.99, image: 'https://cdn.arabsstock.com/uploads/images/64102/image-64102-playing-pubg-mobile-middle-east-pubg-mobile-famous-electronic-thumbnail.jpg' },
    { id: 2, name: '325 شدة ببجي', price: 4.99, image: 'https://cdn.arabsstock.com/uploads/images/64102/image-64102-playing-pubg-mobile-middle-east-pubg-mobile-famous-electronic-thumbnail.jpg' },
    { id: 3, name: '100 جوهرة فري فاير', price: 0.99, image: 'https://esports.sa/wp-content/uploads/2023/12/Garena-Free-Fire-800x450.jpg' },
    { id: 4, name: '530 جوهرة فري فاير', price: 4.99, image: 'https://esports.sa/wp-content/uploads/2023/12/Garena-Free-Fire-800x450.jpg' }
];

// --- State ---
let products = JSON.parse(localStorage.getItem('gx_products')) || defaultProducts;
let cart = JSON.parse(localStorage.getItem('gx_cart')) || [];

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Save defaults if empty
    if (!localStorage.getItem('gx_products')) {
        localStorage.setItem('gx_products', JSON.stringify(products));
    }
    renderProducts();
    updateCartIcon();
});

// --- Navigation ---
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById(`${pageId}-page`).classList.add('active');

    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- Render Products ---
function renderProducts() {
    const list = document.getElementById('products-list');
    list.innerHTML = '';

    // Reverse products so newest appears first if added
    const displayProducts = [...products].reverse();

    displayProducts.forEach(prod => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <img src="${prod.image}" alt="${prod.name}" class="product-image" onerror="this.src='https://via.placeholder.com/250x150/151522/00ffcc?text=GX+STORE'">
            <h3 class="product-name">${prod.name}</h3>
            <div class="product-price">${prod.price} $</div>
            <button class="add-to-cart" onclick="addToCart(${prod.id})">أضف للسلة <i class="fas fa-cart-plus"></i></button>
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
        // Visual feedback
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
        cartItemsDiv.innerHTML = '<p style="text-align:center; color: #a0a0b8; margin-top: 20px; font-size: 18px;">السلة فارغة الأنت</p>';
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

    // Grouping identical items
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

    // Replace the URL with your WhatsApp URL and Number
    const whatsappNumber = "201097173850"; // 01097173850 with Egypt code (2)
    const url = `https://wa.me/${whatsappNumber}?text=${message}`;

    window.open(url, '_blank');
}

// --- Admin Logic ---
function openAdminLogin() {
    document.getElementById('admin-modal').classList.add('active');
    document.getElementById('admin-error').style.display = 'none';

    // Check if already logged in this session
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
    // Password is '1357'
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
                    <button class="edit-btn" onclick="editProduct(${prod.id})" title="تعديل"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn" onclick="deleteProduct(${prod.id})" title="حذف"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    });
}

// File upload preview logic
function previewImage(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            // Compress the image down immediately
            resizeImage(e.target.result, 500, 500, function (resizedBase64) {
                document.getElementById('image-preview').src = resizedBase64;
                document.getElementById('image-preview-container').style.display = 'block';
                document.getElementById('product-image-base64').value = resizedBase64;
            });
        }
        reader.readAsDataURL(file);
    }
}

// Simple image resize using canvas to save LocalStorage quota
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
        // Using JPEG format and a nice compression quality to save space
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
}

function saveProduct(e) {
    e.preventDefault();
    const idInput = document.getElementById('product-id').value;
    const name = document.getElementById('product-name').value;
    const price = parseFloat(document.getElementById('product-price').value);

    let base64Image = document.getElementById('product-image-base64').value;

    // Default fallback
    if (!base64Image) {
        base64Image = 'https://via.placeholder.com/250x150/151522/00ffcc?text=GX+STORE';
    }

    if (idInput) {
        // Edit existing
        const index = products.findIndex(p => p.id == idInput);
        if (index > -1) {
            products[index] = { id: parseInt(idInput), name, price, image: base64Image };
        }
    } else {
        // Add new
        const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
        products.push({ id: newId, name, price, image: base64Image });
    }

    // Check local storage limits
    try {
        localStorage.setItem('gx_products', JSON.stringify(products));
    } catch (err) {
        alert('مساحة التخزين غير كافية! يرجى حذف بعض المنتجات القديمة قبل إدراج صور أخرى.');
        if (!idInput) products.pop(); // Remove the attempt if it was a new product
        return;
    }

    resetForm();
    renderAdminProducts();
    renderProducts();
}

function editProduct(id) {
    const prod = products.find(p => p.id === id);
    if (prod) {
        document.getElementById('product-id').value = prod.id;
        document.getElementById('product-name').value = prod.name;
        document.getElementById('product-price').value = prod.price;

        // Show existing image
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
    }
}

function deleteProduct(id) {
    if (confirm('هل أنت متأكد من حذف هذا المنتج نهائياً؟')) {
        products = products.filter(p => p.id !== id);
        localStorage.setItem('gx_products', JSON.stringify(products));
        renderAdminProducts();
        renderProducts();

        // Also remove instances from the cart
        cart = cart.filter(item => item.id !== id);
        saveCart();
        updateCartIcon();
    }
}
