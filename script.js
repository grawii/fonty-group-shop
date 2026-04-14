// --- 1. Initial & UI Setup ---
lucide.createIcons();
let cart = [];

window.onload = function() {
    renderBanners(); 
    renderPromotions(); 
    renderHomeContent(); 
    renderContactInfo(); 
    updateCartUI();
    
    // ✨ เพิ่มบรรทัดนี้เพื่อให้หน้าแรกเริ่มสไลด์ทันทีที่เปิดเว็บค่ะ
    setTimeout(() => {
        initProductSliders();
    }, 500); 
};

function toggleMenu() { 
    const menu = document.getElementById('mobile-menu');
    if(menu) menu.classList.toggle('active'); 
}

function toggleFolder(id, btn) {
    const folder = document.getElementById(id);
    const icon = btn.querySelector('.folder-icon');
    const isCurrentlyHidden = folder.classList.contains('hidden');
    document.querySelectorAll('.menu-folder div').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.folder-icon').forEach(i => i.setAttribute('data-lucide', 'folder'));
    if (isCurrentlyHidden) {
        folder.classList.remove('hidden');
        icon.setAttribute('data-lucide', 'folder-open');
    }
    lucide.createIcons();
}

function switchPage(pageId) {
    const sections = ['home', 'category', 'pay', 'contact'];
    sections.forEach(s => { 
        const el = document.getElementById(`section-${s}`); 
        if(el) el.classList.add('hidden'); 
    });
    const target = document.getElementById(`section-${pageId}`); 
    if(target) target.classList.remove('hidden');
    if(pageId === 'contact') renderContactInfo();
    window.scrollTo({ top: 0, behavior: 'auto' });
    lucide.createIcons();
}

// --- ส่วนกลางของ script.js ---

// ✨ ฟังก์ชันแยกเครือแบบเจาะจง (ทำงานเมื่อกด "ดูเพิ่มเติม")
function viewSubCategory(network, subName) {
    switchPage('category');
    document.getElementById('category-title').innerText = network;
    document.getElementById('category-subtitle').innerText = `หมวด ${subName}`;
    
    const catDiv = document.getElementById('category-products');
    catDiv.className = "grid grid-cols-2 gap-4"; 
    
    const filtered = products.filter(p => p.categoryName === network && p.tags && p.tags.includes(subName));
    
    catDiv.innerHTML = `
        <div class="col-span-2 mb-2">
            <button onclick="viewCategory('all', 'Fonts')" class="flex items-center gap-2 text-[11px] font-black text-purple-400 bg-purple-50 px-4 py-2 rounded-2xl border border-purple-100 w-fit active:scale-95 transition-all">
                <i data-lucide="chevron-left" class="w-4 h-4"></i> ย้อนกลับไปดูทุกเครือ
            </button>
        </div>
        ${filtered.map(p => createHTML(p)).join('')}
    `;
    lucide.createIcons();
    initProductSliders();
    setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'auto' });
    }, 100); 
}

function viewCategory(type, title) {
    if (document.getElementById('mobile-menu').classList.contains('active')) toggleMenu();
    switchPage('category');
    document.getElementById('category-title').innerText = title;
    
    const catDiv = document.getElementById('category-products');
    if (!catDiv) return;

    catDiv.innerHTML = '';
    catDiv.className = "flex flex-col gap-y-10 w-full pb-20"; 

    let baseProducts = [];
    
    if (type === 'all' || type === 'font') {
        // ✨ กรองเอาเฉพาะสินค้าที่เป็น "ฟอนต์" จริงๆ (ไม่มี Tag หมวดอื่นปน)
        const nonFontTags = ['ลายน้ำ', 'group', 'อื่น ๆ', 'ไฟล์ตกแต่ง', 'BG'];
        baseProducts = products.filter(p => {
            return !p.tags.some(tag => nonFontTags.includes(tag));
        });
    } else if (type === 'recommended') {
        baseProducts = products.filter(p => p.isRecommended);
    } else if (type === 'group') {
        baseProducts = products.filter(p => p.tags && p.tags.includes('group'));
    } else if (type === 'brush') {
        baseProducts = products.filter(p => p.tags && p.tags.includes('อื่น ๆ'));
    } else {
        const tagMap = { 
            'head': 'ฟอนต์หัวข้อ', 'body': 'ฟอนต์เนื้อหา', 'emoji': 'ฟอนต์อิโมจิ', 
            'watermark': 'ลายน้ำ', 'bg': 'BG', 'decoration': 'ไฟล์ตกแต่ง',
            'brush-ibis': 'อื่น ๆ', 'brush-pro': 'อื่น ๆ', 'sticker': 'อื่น ๆ'
        };
        const targetTag = tagMap[type] || type;
        baseProducts = products.filter(p => p.tags && p.tags.includes(targetTag));
    }

    const groupedByNetwork = baseProducts.reduce((acc, p) => {
        const network = p.categoryName || 'อื่นๆ';
        if (!acc[network]) acc[network] = [];
        acc[network].push(p);
        return acc;
    }, {});

    Object.keys(groupedByNetwork).forEach(networkName => {
        const networkItems = groupedByNetwork[networkName];
        
        // ✨ จุดสำคัญ 1: สร้าง ID แบบใช้ขีดแทนช่องว่าง
        const cleanId = networkName.replace(/\s+/g, '-');
        
        const networkHeaderHTML = `
            <div class="network-group flex flex-col gap-y-6">
                <div class="flex items-center gap-3 px-2 border-l-4 border-purple-500">
                    <h2 class="text-lg font-black text-purple-900 uppercase tracking-tighter">${networkName}</h2>
                </div>
                <div id="items-${cleanId}" class="flex flex-col gap-y-8"></div>
            </div>`;
        catDiv.insertAdjacentHTML('beforeend', networkHeaderHTML);

        // ✨ จุดสำคัญ 2: ดึง ID ตัวเดิมมาใช้สินค้าเข้าตะกร้า
        const networkContainer = document.getElementById(`items-${cleanId}`);
        const subCatsInNetwork = ['ฟอนต์หัวข้อ', 'ฟอนต์เนื้อหา', 'ฟอนต์อิโมจิ', 'ลายน้ำ', 'BG', 'ไฟล์ตกแต่ง', 'อื่น ๆ', 'group'];
        
        subCatsInNetwork.forEach(subName => {
            const subItems = networkItems.filter(p => p.tags && p.tags.includes(subName));
            if (subItems.length > 0) {
                const displayItems = subItems.slice(0, 4);
                const hasMore = subItems.length > 4;

                const subSectionHTML = `
                    <div class="sub-category flex flex-col gap-y-4">
                        <div class="flex items-center justify-between px-2">
                            <div class="flex items-center gap-2 bg-purple-50 px-4 py-1.5 rounded-full border border-purple-100 shadow-sm">
                                <i data-lucide="folder" class="w-3.5 h-3.5 text-purple-400"></i>
                                <span class="text-[11px] font-black text-purple-500 uppercase">หมวด ${subName === 'group' ? 'กลุ่ม VIP' : subName}</span>
                            </div>
                            ${hasMore ? `
                            <button onclick="viewSubCategory('${networkName}', '${subName}')" 
                                class="text-[9px] font-black text-purple-500 bg-white border-2 border-purple-100 px-3 py-1.5 rounded-2xl shadow-sm active:scale-90 transition-all">
                                ดูทั้งหมด (${subItems.length}) ✨
                            </button>` : ''}
                        </div>
                        <div class="grid grid-cols-2 gap-4 px-1">
                            ${displayItems.map(p => createHTML(p)).join('')}
                        </div>
                    </div>`;
                if(networkContainer) networkContainer.insertAdjacentHTML('beforeend', subSectionHTML);
            }
        });
    });

    lucide.createIcons();
    initProductSliders();
}

function renderContactInfo() {
    const div = document.getElementById('contact-list');
    if(!div) return;
    const contacts = [
        {icon:'message-square-dot',l:'Facebook',v:'องุ่นหวาน',c:'blue-500',bg:'blue-50',link:'https://www.facebook.com/xngunhwani'},
        {icon:'images',l:'Instagram',v:'graphi.rae',c:'pink-500',bg:'pink-50',link:'https://www.instagram.com/graphi.rae'},
        {icon:'message-circle',l:'Line Official',v:'@309ranuu',c:'green-500',bg:'green-50',link:'https://line.me/R/ti/p/@309ranuu'}
    ];
    div.innerHTML = contacts.map(c => `
        <a href="${c.link}" target="_blank" class="flex items-center gap-4 p-5 bg-white rounded-[28px] shadow-sm border border-purple-50 active:scale-95 transition-transform">
            <div class="w-12 h-12 bg-${c.bg} text-${c.c} rounded-full flex items-center justify-center shadow-inner"><i data-lucide="${c.icon}"></i></div>
            <div class="text-left font-bold"><p class="text-[9px] text-gray-400 uppercase tracking-widest">${c.l}</p><p class="text-purple-900 text-sm">${c.v}</p></div>
        </a>`).join('');
    lucide.createIcons();
}

function renderBanners() {
    const container = document.getElementById('banner-container');
    if (!container) return;
    container.innerHTML = banners.map(img => `<div class="min-w-full h-full"><img src="${img}" class="w-full h-full object-cover"></div>`).join('');
    let index = 0; setInterval(() => { index = (index + 1) % banners.length; container.scrollTo({ left: container.clientWidth * index, behavior: 'smooth' }); }, 4000);
}

function renderHomeContent() {
    const recSection = document.getElementById('home-recommend-section');
    if (recSection) {
        const recProducts = products.filter(p => p.isRecommended);
        if (recProducts.length > 0) {
            recSection.innerHTML = `
                <div class="space-y-4 mb-10">
                    <div class="flex items-center justify-between px-2">
                        <h2 class="text-lg font-black text-purple-900 uppercase tracking-tighter flex items-center gap-2"><i data-lucide="star" class="fill-purple-500 text-purple-500 w-5 h-5"></i> สินค้าแนะนำ</h2>
                        <button onclick="viewCategory('recommended', 'สินค้าแนะนำ ✨')" class="btn-view-more text-[10px] font-black text-purple-500 px-4 py-1.5 rounded-full uppercase bg-white shadow-sm">ดูทั้งหมด ✨</button>
                    </div>
                    <div class="grid grid-cols-2 gap-4">${recProducts.slice(0, 4).map(p => createHTML(p)).join('')}</div>
                </div>`;
        }
    }

    const categorySection = document.getElementById('home-categories-section');
    if (categorySection) {
        const cats = [
            { id: 'all', name: 'ฟอนต์ทั้งหมด', icon: 'type', navIdx: 1 },
            { id: 'group', name: 'กลุ่มฟอนต์ & ของตกแต่ง', icon: 'users', navIdx: 2 }, 
            { id: 'brush', name: 'บรัช & อื่นๆ', icon: 'paintbrush', navIdx: 3 }
        ];
        categorySection.innerHTML = cats.map(cat => {
            const filtered = products.filter(p => { // ✨ ไอวี่ปรับวิธี Filter ให้คลีนขึ้น
                if (cat.id === 'all') return true;
                if (cat.id === 'group') return p.tags && p.tags.includes('group');
                if (cat.id === 'brush') return p.tags && p.tags.includes('อื่น ๆ');
                return false;
            });
                
            if (filtered.length === 0) return '';
            return `
                <div class="space-y-4 mb-10">
                    <div class="flex items-center justify-between px-2">
                        <h3 class="text-md font-black text-purple-900 uppercase flex items-center gap-2"><i data-lucide="${cat.icon}" class="text-purple-500 w-4 h-4"></i> ${cat.name}</h3>
                        <button onclick="handleNav(document.querySelectorAll('.nav-item')[${cat.navIdx}], '${cat.id}', '${cat.name}')" class="btn-view-more text-[10px] font-black text-purple-500 px-4 py-1.5 rounded-full uppercase bg-white shadow-sm">ดูทั้งหมด ✨</button>
                    </div>
                    <div class="grid grid-cols-2 gap-4">${filtered.slice(0, 4).map(p => createHTML(p)).join('')}</div>
                </div>`;
        }).join('');
    }
    lucide.createIcons();
}

function createHTML(p) {
    const isSelected = cart.find(item => item.id === p.id) ? 'border-purple-500 bg-purple-50/50 shadow-inner' : 'border-purple-100 bg-white';
    
    // ✨ ส่วนจัดการรูปภาพแบบสไลด์
    let imageHTML = '';
    const images = Array.isArray(p.img) ? p.img : [p.img];
    
    if (images.length > 1) {
        // กรณีมีหลายรูป: สร้าง Container สำหรับสไลด์
        imageHTML = `
            <div class="product-slider-wrapper relative overflow-hidden rounded-[22px] aspect-square mb-3 group" data-id="${p.id}" data-current="0" data-total="${images.length}">
                <div class="product-slider-container">
${images.map(img => `<img src="${img}" onclick="viewImage('${img}')" class="product-slider-item object-cover cursor-zoom-in active:scale-95 transition-transform">`).join('')}
                </div>
                <div class="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                    ${images.map((_, i) => `<div class="w-1 h-1 rounded-full bg-white/50 ${i===0 ? 'bg-white w-2' : ''}"></div>`).join('')}
                </div>
            </div>`;
    } else {
        // กรณีรูปเดียว: แสดงปกติเหมือนเดิม
        imageHTML = `
            <div class="rounded-[22px] aspect-square mb-3 overflow-hidden relative shadow-sm bg-purple-50">
                <img src="${images[0]}" onclick="viewImage('${images[0]}')" class="w-full h-full object-cover cursor-zoom-in active:scale-95 transition-transform duration-500">
            </div>`;
    }

    const badgeHTML = p.badge ? `<div class="absolute top-2 left-2 z-20 shadow-md"><span class="${p.badge.type === 'red' ? 'bg-red-500' : 'bg-purple-500'} text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase">${p.badge.text}</span></div>` : '';

    return `
    <div class="product-card glass-card flex flex-col p-3 rounded-[30px] border-2 transition-all duration-300 ${isSelected}" data-id="${p.id}">
        <div class="relative">
            ${badgeHTML}
            ${imageHTML}
        </div>
        <div class="flex flex-col flex-grow text-center">
            <h3 class="product-title text-[12px] font-black text-purple-900 uppercase mb-1 px-1 leading-tight">${p.name}</h3>
            <p class="product-detail text-[9px] text-purple-400 font-medium leading-tight mb-3 px-2">${p.detail || 'ฟอนต์ลายมือลิขสิทธิ์แท้ องุ่นหวาน Studio ✨'}</p>
            <div class="mt-auto space-y-2">
                <div class="flex items-center justify-center">${p.oldPrice ? `<span class="text-[9px] text-gray-400 line-through mr-1">฿${p.oldPrice}</span>` : ''}<span class="bg-purple-500 text-white text-[11px] px-3 py-0.5 rounded-lg font-black shadow-sm">฿${p.price}</span></div>
                <button onclick="addToCart('${p.id}')" class="w-full py-2 rounded-xl text-[9px] font-black uppercase transition-all active:scale-90 ${cart.find(item => item.id === p.id) ? 'bg-purple-200 text-purple-600' : 'bg-purple-50 text-purple-500 border border-purple-200 hover:bg-purple-500 hover:text-white'}">${cart.find(item => item.id === p.id) ? 'Added !' : 'Add to cart 🛒'}</button>
            </div>
        </div>
    </div>`;
}

function updateCartUI() {
    const countBadge = document.getElementById('cart-count'); if(countBadge) countBadge.innerText = cart.length;
    const drawer = document.getElementById('cart-drawer'); if(!drawer) return;
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    const hasGroup = cart.some(i => i.type === 'group'); const hasFont = cart.some(i => i.type !== 'group' && i.price > 0);
    drawer.innerHTML = `
        <div class="p-6 border-b flex justify-between items-center bg-purple-50"><h2 class="font-black text-purple-500 uppercase text-sm tracking-widest italic">Receipt</h2><button onclick="toggleCart()" class="text-2xl text-purple-400">&times;</button></div>
        <div class="flex-grow overflow-y-auto p-4 space-y-3 bg-white">${cart.length === 0 ? '<p class="text-center text-purple-200 mt-10 text-[10px] font-bold uppercase italic">Your cart is empty</p>' : cart.map(i => `<div class="flex items-center gap-4 p-4 bg-purple-50/50 rounded-[24px] shadow-sm border border-purple-100"><img src="${Array.isArray(i.img) ? i.img[0] : i.img}" class="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-sm"><div class="flex-grow"><p class="text-[11px] font-black text-purple-900 uppercase">${i.name}</p><p class="text-purple-500 font-bold text-xs">฿${i.price}</p></div><button onclick="removeFromCart('${i.id}')" class="text-purple-300 hover:text-pink-500"><i data-lucide="trash-2" class="w-4 h-4"></i></button></div>`).join('')}</div>
        ${cart.length > 0 ? `<div class="p-6 bg-white space-y-4 border-t border-purple-100"><div class="space-y-2"><input type="text" id="c-name" placeholder="ชื่อ-นามสกุล" class="w-full p-4 rounded-2xl bg-purple-50 text-xs outline-none shadow-inner border border-purple-100">${hasFont ? `<input type="email" id="c-email" placeholder="อีเมล (@gmail.com เท่านั้น)" class="w-full p-4 rounded-2xl bg-purple-50 text-xs outline-none shadow-inner border border-purple-100">` : ''}${hasGroup ? `<input type="text" id="c-line" placeholder="ID Line / Facebook (เข้ากลุ่ม)" class="w-full p-4 rounded-2xl bg-purple-50 text-xs outline-none shadow-inner border border-purple-100">` : ''}<div class="relative p-4 rounded-[30px] text-center bg-purple-50 overflow-hidden"><svg class="absolute inset-0 w-full h-full pointer-events-none"><rect x="2" y="2" width="calc(100% - 4px)" height="calc(100% - 4px)" rx="28" fill="none" stroke="#A78BFA" stroke-width="2" stroke-dasharray="10 10" class="animate-dash" /></svg><p class="text-[9px] text-purple-400 uppercase font-black tracking-widest mb-1">Total Payment</p><p class="text-purple-600 font-bold text-sm">KBANK (PORNTIPA S.)</p><p class="text-purple-500 font-black text-3xl mt-1 tracking-tighter italic">฿${total}</p></div></div><button onclick="submitOrder()" class="w-full py-5 bg-purple-500 text-white rounded-full font-black uppercase text-xs shadow-lg active:scale-95">Submit Order</button></div>` : ''}`;
    lucide.createIcons();
}

function addToCart(id) { if (cart.find(item => item.id === id)) return alert("สินค้านี้อยู่ในตะกร้าแล้วค่า ✨"); cart.push(products.find(p => p.id === id)); updateCartUI(); }
function removeFromCart(id) { cart = cart.filter(item => item.id !== id); updateCartUI(); }
function toggleCart() { document.getElementById('cart-drawer').classList.toggle('translate-x-full'); }

async function submitOrder() {
    const name = document.getElementById('c-name')?.value.trim(); const email = document.getElementById('c-email')?.value.trim(); const lineId = document.getElementById('c-line')?.value.trim(); const total = cart.reduce((sum, item) => sum + item.price, 0);
    if (!name || (document.getElementById('c-email') && !email) || (document.getElementById('c-line') && !lineId)) return alert("กรุณากรอกข้อมูลให้ครบถ้วนก่อนนะค้า ✨");
    let summary = `🛒 รายการสั่งซื้อคุณ: ${name}\n${email ? '📧: ' + email + '\n' : ''}${lineId ? '🆔: ' + lineId + '\n' : ''}------------------\n${cart.map(i => `- ${i.name} (฿${i.price})`).join('\n')}\n------------------\n💰 รวมยอด: ฿${total}\n\n📍 สรุปยอดเรียบร้อยแล้ว รบกวนกดวางและแนบสลิปได้เลยนะค้า ✨`;
    try { await navigator.clipboard.writeText(summary); alert("คัดลอกสรุปออเดอร์แล้ว! ✨"); window.location.href = "https://line.me/R/ti/p/@309ranuu"; } catch (err) { window.location.href = "https://line.me/R/ti/p/@309ranuu"; }
}

function copyAccount(text, el) { const temp = document.createElement('textarea'); temp.value = text; document.body.appendChild(temp); temp.select(); document.execCommand('copy'); document.body.removeChild(temp); const toast = document.getElementById('toast'); toast.style.opacity = '1'; setTimeout(() => { toast.style.opacity = '0'; }, 2000); }
function viewImage(img) { document.getElementById('modal-img').src = img; document.getElementById('image-modal').classList.replace('hidden', 'flex'); }
function closeImageModal() { document.getElementById('image-modal').classList.replace('flex', 'hidden'); }

// --- ส่วนท้ายสุดของ script.js ---

function handleNav(el, pageId, title = '') {
    // 1. ✨ สั่งปิดเมนู Hamburger ทันทีที่คลิก (แก้ปัญหาหน้า Pay/Contact ไม่ยุบ)
    const menu = document.getElementById('mobile-menu');
    if (menu && menu.classList.contains('active')) {
        toggleMenu(); 
    }

    // 2. สลับ Class Active
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    el.classList.add('active');

    // 3. ขยับวงกลมขาว (Indicator)
    const indicator = document.getElementById('nav-indicator');
    if (indicator) {
        const centerX = el.offsetLeft + (el.offsetWidth / 2) - (indicator.offsetWidth / 2);
        indicator.style.left = `${centerX}px`;
    }

    // 4. สลับหน้าจอ
    if (['all', 'group', 'brush', 'head', 'body'].includes(pageId)) {
        viewCategory(pageId, title);
    } else {
        switchPage(pageId);
    }
}

// ✨ ตรวจสอบว่ามี handleNav แค่อันเดียวในไฟล์นี้นะคะคุณองุ่น ✨

window.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    setTimeout(() => {
        const activeItem = document.querySelector('.nav-item.active');
        const indicator = document.getElementById('nav-indicator');
        if (activeItem && indicator) {
            const centerX = activeItem.offsetLeft + (activeItem.offsetWidth / 2) - (indicator.offsetWidth / 2);
            indicator.style.left = `${centerX}px`;
        }
    }, 300);
});

// --- วางทับส่วน renderPromotions เดิมใน script.js ---

let promoIdx = 0; 
let autoSlide; 

function renderPromotions() {
    const slider = document.getElementById('promo-slider');
    const dotsContainer = document.getElementById('promo-dots');
    if (!slider || typeof promotions === 'undefined' || !promotions.length) return;

    slider.innerHTML = promotions.map(img => `
        <div class="min-w-full">
            <img src="${img}" class="w-full h-auto object-cover pointer-events-none">
        </div>
    `).join('');

    dotsContainer.innerHTML = promotions.map((_, i) => `
        <div class="w-1.5 h-1.5 rounded-full bg-white/50 transition-all duration-300 ${i === 0 ? 'bg-white w-4' : ''}"></div>
    `).join('');

    const moveSlider = () => {
        slider.style.transform = `translateX(-${promoIdx * 100}%)`;
        const dots = dotsContainer.querySelectorAll('div');
        dots.forEach((dot, i) => {
            if (i === promoIdx) {
                dot.className = "w-4 h-1.5 rounded-full bg-white transition-all duration-300";
            } else {
                dot.className = "w-1.5 h-1.5 rounded-full bg-white/50 transition-all duration-300";
            }
        });
    };

    const startAutoSlide = () => {
        clearInterval(autoSlide);
        autoSlide = setInterval(() => {
            promoIdx = (promoIdx + 1) % promotions.length;
            moveSlider();
        }, 4000);
    };

    startAutoSlide();

    let startX = 0;
    slider.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        clearInterval(autoSlide); 
    }, {passive: true});

    slider.addEventListener('touchend', (e) => {
        const endX = e.changedTouches[0].clientX;
        const diff = startX - endX; // ค่าบวก = ปัดซ้าย (ไปหน้า), ค่าลบ = ปัดขวา (ถอยหลัง)

        if (Math.abs(diff) > 30) { 
            if (diff > 0) {
                // ✨ ไปข้างหน้า (รูป 1 -> 2)
                if (promoIdx < promotions.length - 1) {
                    promoIdx++;
                } else {
                    promoIdx = 0; // วนกลับไปเริ่ม 1
                }
            } else {
                // ✨ ถอยหลัง (รูป 2 -> 1)
                if (promoIdx > 0) {
                    promoIdx--;
                } else {
                    promoIdx = promotions.length - 1; // วนไปรูปสุดท้าย
                }
            }
            moveSlider();
        }
        startAutoSlide(); 
    }, {passive: true});
}
// ✨ ฟังก์ชันจัดการสไลด์ในตัวการ์ดสินค้า (แก้ไขจุดที่วงเล็บไม่ครบ)
function initProductSliders() {
    const wrappers = document.querySelectorAll('.product-slider-wrapper');
    
    wrappers.forEach(wrapper => {
        const container = wrapper.querySelector('.product-slider-container');
        const dots = wrapper.querySelectorAll('.absolute.bottom-2 div');
        const total = parseInt(wrapper.dataset.total);
        let current = 0;
        let interval;

        const move = (index) => {
            current = (index + total) % total;
            container.style.transform = `translateX(-${current * 100}%)`;
            dots.forEach((dot, i) => {
                if (i === current) {
                    dot.className = "h-1 rounded-full bg-white w-2 transition-all duration-300";
                } else {
                    dot.className = "h-1 rounded-full bg-white/50 w-1 transition-all duration-300";
                }
            });
            wrapper.dataset.current = current;
        };

        const start = () => {
            clearInterval(interval);
            interval = setInterval(() => move(current + 1), 2000); 
        };

        let startX = 0;
        wrapper.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            clearInterval(interval);
        }, {passive: true});

        wrapper.addEventListener('touchend', (e) => {
            const endX = e.changedTouches[0].clientX;
            const diff = startX - endX;
            if (Math.abs(diff) > 30) {
                if (diff > 0) move(current + 1);
                else move(current - 1);
                // ไม่ต้อง preventDefault เพื่อให้จิ้มรูปได้ปกติค่ะ
            }
            start();
        }, {passive: true});

        start();
    });
}
