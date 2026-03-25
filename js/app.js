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
let categories = [];
let cart = JSON.parse(localStorage.getItem('gx_cart')) || [];
let selectedCategoryId = null; // for filtering products in UI

// --- Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
    // Check old cart format vs new Firebase ID strings
    if (cart.length > 0 && typeof cart[0].id === 'number') {
        cart = []; // Reset old localstorage array
        saveCart();
    }

    await fetchCategories();
    await fetchProducts();
    updateCartIcon();
});

// --- Firebase Data Fetching ---
async function fetchCategories() {
    try {
        const snapshot = await db.collection('categories').get();
        categories = [];

        if (!snapshot.empty) {
            snapshot.forEach(docSnap => categories.push({ id: docSnap.id, ...docSnap.data() }));
        }

        renderCategoriesFilter();
        updateCategorySelects();
        if (document.getElementById('admin-panel-section') && document.getElementById('admin-panel-section').style.display === 'block') {
            renderAdminCategories();
        }
    } catch (error) {
        console.error("Error loading categories from Firebase:", error);
    }
}

async function fetchProducts() {
    try {
        const snapshot = await db.collection('products').get();
        products = [];

        if (!snapshot.empty) {
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
function renderCategoriesFilter() {
    const filterContainer = document.getElementById('categories-filter');
    if (!filterContainer) return;
    filterContainer.innerHTML = '';

    // "All" button
    const allBtn = document.createElement('button');
    allBtn.className = 'admin-btn';
    allBtn.style.cssText = selectedCategoryId === null
        ? 'padding: 8px 15px; border-radius: 20px; flex-shrink: 0; background: var(--secondary-color); color: white;'
        : 'padding: 8px 15px; border-radius: 20px; flex-shrink: 0; background: transparent; border: 1px solid var(--primary-color); color: white;';
    allBtn.innerText = 'الكل';
    allBtn.onclick = () => { selectedCategoryId = null; renderCategoriesFilter(); renderProducts(); };
    filterContainer.appendChild(allBtn);

    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'admin-btn';
        btn.style.cssText = selectedCategoryId === cat.id
            ? 'padding: 8px 15px; border-radius: 20px; flex-shrink: 0; background: var(--secondary-color); color: white;'
            : 'padding: 8px 15px; border-radius: 20px; flex-shrink: 0; background: transparent; border: 1px solid var(--primary-color); color: white;';
        btn.innerHTML = `<img src="${cat.image}" style="width:20px; height:20px; border-radius:50%; vertical-align:middle; margin-left:5px;"> ${cat.name}`;
        btn.onclick = () => { selectedCategoryId = cat.id; renderCategoriesFilter(); renderProducts(); };
        filterContainer.appendChild(btn);
    });
}

function renderProducts() {
    const list = document.getElementById('products-list');
    list.innerHTML = '';

    let filterProducts = products;
    if (selectedCategoryId) {
        filterProducts = products.filter(p => p.categoryId === selectedCategoryId);
    }

    const displayProducts = [...filterProducts].reverse(); // newest first

    displayProducts.forEach(prod => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <img src="${prod.image}" alt="${prod.name}" class="product-image" onerror="this.src='https://via.placeholder.com/250x150/151522/00ffcc?text=GX+STORE'">
            <h3 class="product-name">${prod.name}</h3>
            <div class="product-price">${prod.price} جنيه</div>
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
                        <div class="cart-item-price">${item.price} جنيه</div>
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
        message += `- ${name} (الكمية: ${info.count}) - ${info.total.toFixed(2)} جنيه %0a`;
        total += info.total;
    }

    message += `%0a*الإجمالي: ${total.toFixed(2)} جنيه*`;

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
    if (typeof resetCatForm === 'function') resetCatForm();
    renderAdminProducts();
    if (typeof renderAdminCategories === 'function') renderAdminCategories();
    switchAdminTab('categories');
}

function switchAdminTab(tab) {
    if (tab === 'categories') {
        document.getElementById('admin-categories-section').style.display = 'block';
        document.getElementById('admin-products-section').style.display = 'none';
        document.getElementById('tab-btn-categories').style.background = 'var(--accent)';
        document.getElementById('tab-btn-categories').style.border = 'none';
        document.getElementById('tab-btn-products').style.background = 'transparent';
        document.getElementById('tab-btn-products').style.border = '1px solid var(--accent)';
    } else {
        document.getElementById('admin-categories-section').style.display = 'none';
        document.getElementById('admin-products-section').style.display = 'block';
        document.getElementById('tab-btn-products').style.background = 'var(--accent)';
        document.getElementById('tab-btn-products').style.border = 'none';
        document.getElementById('tab-btn-categories').style.background = 'transparent';
        document.getElementById('tab-btn-categories').style.border = '1px solid var(--accent)';
    }
}

function renderAdminProducts() {
    const list = document.getElementById('admin-products-list');
    list.innerHTML = '';

    products.forEach(prod => {
        list.innerHTML += `
            <div class="admin-product-item">
                <div class="admin-prod-info">
                    <img src="${prod.image}" class="admin-prod-img" onerror="this.src='https://via.placeholder.com/50/151522/00ffcc?text=GX'">
                    <span style="font-weight: bold;">${prod.name} <br> <span style="font-size:14px; color:#00ffcc;">${prod.price} جنيه</span></span>
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
    document.getElementById('product-category').value = '';
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
    const categoryId = document.getElementById('product-category').value;
    let base64Image = document.getElementById('product-image-base64').value;

    if (!categoryId) {
        alert("يرجى اختيار تصنيف للمنتج");
        document.getElementById('save-product-btn').disabled = false;
        return;
    }

    if (!base64Image) {
        base64Image = 'https://via.placeholder.com/250x150/151522/00ffcc?text=GX+STORE';
    }

    try {
        if (idInput) {
            // Edit existing in Firebase
            await db.collection('products').doc(idInput).update({ name, price, image: base64Image, categoryId });

            // Update local state
            const index = products.findIndex(p => p.id === idInput);
            if (index > -1) {
                products[index] = { id: idInput, name, price, image: base64Image, categoryId };

                // Update specific cart items if needed
                cart = cart.map(item => item.id === idInput ? { ...item, name, price, image: base64Image, categoryId } : item);
                saveCart();
                updateCartIcon();
            }
        } else {
            // Add new in Firebase
            const docRef = await db.collection('products').add({ name, price, image: base64Image, categoryId });
            products.push({ id: docRef.id, name, price, image: base64Image, categoryId });
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
        document.getElementById('product-category').value = prod.categoryId || "";

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

// --- Administrator Categories Logic ---

function updateCategorySelects() {
    const select = document.getElementById('product-category');
    if (!select) return;

    // Remember current selection if any
    const currentVal = select.value;

    select.innerHTML = '<option value="">اختر التصنيف...</option>';
    categories.forEach(cat => {
        select.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
    });

    if (currentVal) select.value = currentVal;
}

function renderAdminCategories() {
    const list = document.getElementById('admin-categories-list');
    if (!list) return;
    list.innerHTML = '';

    categories.forEach(cat => {
        list.innerHTML += `
            <div class="admin-product-item">
                <div class="admin-prod-info">
                    <img src="${cat.image}" class="admin-prod-img" onerror="this.src='https://via.placeholder.com/50/151522/00ffcc?text=CAT'">
                    <span style="font-weight: bold;">${cat.name}</span>
                </div>
                <div class="admin-actions">
                    <button class="edit-btn" onclick="editCategory('${cat.id}')" title="تعديل"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn" onclick="deleteCategory('${cat.id}')" title="حذف"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    });
}

function previewCatImage(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            resizeImage(e.target.result, 300, 300, function (resizedBase64) {
                document.getElementById('cat-image-preview').src = resizedBase64;
                document.getElementById('cat-image-preview-container').style.display = 'block';
                document.getElementById('category-image-base64').value = resizedBase64;
            });
        }
        reader.readAsDataURL(file);
    }
}

function removeCatImage() {
    const fileInput = document.getElementById('category-image-file');
    if (fileInput) fileInput.value = '';

    const preview = document.getElementById('cat-image-preview');
    if (preview) preview.src = '';

    const container = document.getElementById('cat-image-preview-container');
    if (container) container.style.display = 'none';

    const base64Input = document.getElementById('category-image-base64');
    if (base64Input) base64Input.value = '';
}

function resetCatForm() {
    const form = document.getElementById('category-form');
    if (form) form.reset();

    const idInput = document.getElementById('category-id');
    if (idInput) idInput.value = '';

    const title = document.getElementById('cat-form-title');
    if (title) title.innerText = 'إضافة تصنيف جديد';

    const btn = document.getElementById('save-category-btn');
    if (btn) {
        btn.innerHTML = 'حفظ التصنيف <i class="fas fa-save"></i>';
        btn.disabled = false;
    }

    const cancelBtn = document.getElementById('cancel-cat-edit-btn');
    if (cancelBtn) cancelBtn.style.display = 'none';

    removeCatImage();
}

async function saveCategory(e) {
    e.preventDefault();
    document.getElementById('save-category-btn').disabled = true;

    const idInput = document.getElementById('category-id').value;
    const name = document.getElementById('category-name').value;
    let base64Image = document.getElementById('category-image-base64').value;

    if (!base64Image) {
        base64Image = 'https://via.placeholder.com/150/151522/00ffcc?text=CAT';
    }

    try {
        if (idInput) {
            await db.collection('categories').doc(idInput).update({ name, image: base64Image });
            const index = categories.findIndex(c => c.id === idInput);
            if (index > -1) {
                categories[index] = { id: idInput, name, image: base64Image };
            }
        } else {
            const docRef = await db.collection('categories').add({ name, image: base64Image });
            categories.push({ id: docRef.id, name, image: base64Image });
        }

        resetCatForm();
        renderAdminCategories();
        renderCategoriesFilter();
        updateCategorySelects();
    } catch (err) {
        console.error("Error saving category to Firebase:", err);
        alert('حدث خطأ أثناء حفظ التصنيف.' + err.message);
        document.getElementById('save-category-btn').disabled = false;
    }
}

function editCategory(id) {
    const cat = categories.find(c => c.id === id);
    if (cat) {
        document.getElementById('category-id').value = cat.id;
        document.getElementById('category-name').value = cat.name;

        if (cat.image) {
            document.getElementById('category-image-base64').value = cat.image;
            document.getElementById('cat-image-preview').src = cat.image;
            document.getElementById('cat-image-preview-container').style.display = 'block';
        } else {
            removeCatImage();
        }

        document.getElementById('cat-form-title').innerText = 'تعديل التصنيف';
        document.getElementById('save-category-btn').innerHTML = 'تحديث التصنيف <i class="fas fa-check"></i>';
        document.getElementById('cancel-cat-edit-btn').style.display = 'inline-block';
        document.getElementById('save-category-btn').disabled = false;

        document.querySelector('#admin-categories-section .admin-form-container').scrollIntoView({ behavior: 'smooth' });
    }
}

async function deleteCategory(id) {
    // Check if products exist for this category
    const hasProducts = products.some(p => p.categoryId === id);
    if (hasProducts) {
        alert("لا يمكن حذف هذا التصنيف لأن هناك منتجات تابعة له. يرجى تعديلها أو حذف المنتجات أولاً.");
        return;
    }

    if (confirm('هل أنت متأكد من حذف هذا التصنيف نهائياً؟')) {
        try {
            await db.collection('categories').doc(id).delete();
            categories = categories.filter(c => c.id !== id);

            if (selectedCategoryId === id) {
                selectedCategoryId = null;
            }

            renderAdminCategories();
            renderCategoriesFilter();
            updateCategorySelects();
            renderProducts();
        } catch (error) {
            console.error("Error deleting category:", error);
            alert("فشل مسح التصنيف.");
        }
    }
}
