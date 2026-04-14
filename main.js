const HOTELS = [
  { id: 'capital', name: 'Sunbird Capital Hotel', city: 'Lilongwe', category: 'city', desc: 'The heartbeat of the capital. Premium business and leisure.', image: 'images/hero.jpg' },
  { id: 'lilongwe', name: 'Sunbird Lilongwe Hotel', city: 'Lilongwe', category: 'city', desc: 'Contemporary comfort in Malawi\'s capital city.', image: 'images/1732179921762.jpeg' },
  { id: 'nkopola', name: 'Sunbird Nkopola Lodge', city: 'Mangochi', category: 'lakeside', desc: 'Lakeside paradise on the shores of Lake Malawi.', image: 'images/images (6).jpeg' },
  { id: 'livingstonia', name: 'Sunbird Livingstonia Beach', city: 'Salima', category: 'lakeside', desc: 'White sand beaches. Crystal clear lake waters. Pure bliss.', image: 'images/livingstonia.jpg' },
  { id: 'mzuzu', name: 'Sunbird Mzuzu Hotel', city: 'Mzuzu', category: 'city', desc: 'Your northern gateway — refined and welcoming.', image: 'images/1742828860302.jpeg' },
  { id: 'soche', name: 'Sunbird Mount Soche', city: 'Blantyre', category: 'city', desc: 'Blantyre\'s landmark hotel since 1966. Timeless elegance.', image: 'images/sunbird-mount-soche.jpg' },
  { id: 'kuchawe', name: 'Sunbird Ku Chawe', city: 'Zomba', category: 'mountain', desc: 'Perched on the Zomba Plateau. Cool mountain air and breathtaking views.', image: 'images/images (2).jpeg' },
  { id: 'ryalls', name: 'Sunbird Ryalls Hotel', city: 'Blantyre', category: 'city', desc: 'Colonial charm meets modern luxury in the commercial capital.', image: 'images/images (8).jpeg' },
  { id: 'makokola', name: 'Sunbird Club Makokola', city: 'Mangochi', category: 'lakeside', desc: 'Malawi\'s most celebrated beach resort. All-inclusive luxury.', image: 'images/images (7).jpeg' }
];

// Render hotel card
function renderHotelCard(h) {
  return `
    <div class="hotel-card fade-in" data-category="${h.category}" data-city="${h.city}">
      <div class="hotel-image" style="background: url('${h.image}') center/cover no-repeat;"></div>
      <div class="hotel-body">
        <h3>${h.name}</h3>
        <div class="hotel-location">📍 ${h.city}</div>
        <p class="hotel-desc">${h.desc}</p>
        <div class="stars">★★★★★</div>
        <a href="hotel-template.html?hotel=${h.id}" class="btn btn-outline-primary">View Hotel</a>
      </div>
    </div>
  `;
}

// Render hotels into given container
function renderHotels(containerId, hotels = HOTELS) {
  const c = document.getElementById(containerId);
  if (!c) return;
  c.innerHTML = hotels.map(renderHotelCard).join('');
}

// Populate hotel dropdowns
function populateHotelDropdowns() {
  document.querySelectorAll('[data-hotel-dropdown]').forEach(sel => {
    const options = HOTELS.map(h => `<option value="${h.id}">${h.name}</option>`).join('');
    sel.innerHTML = '<option value="">Select a property...</option>' + options;
  });
}

// Mobile menu
function initMobileMenu() {
  const hamburger = document.querySelector('.hamburger');
  const menu = document.querySelector('.nav-menu');
  if (hamburger && menu) {
    hamburger.addEventListener('click', () => menu.classList.toggle('active'));
  }
}

// Fade-in animations
function initFadeIn() {
  const els = document.querySelectorAll('.fade-in');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  els.forEach(el => observer.observe(el));
}

// Back to top
function initBackToTop() {
  const btn = document.querySelector('.back-to-top');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// Hotel filter (for hotels.html)
function initHotelFilter() {
  const filterBars = document.querySelectorAll('.filter-bar');
  if (!filterBars.length) return;

  const applyFilters = () => {
    let categoryFilter = 'all';
    let cityFilter = 'all';

    document.querySelectorAll('.filter-btn.active').forEach(btn => {
      if (btn.dataset.filter === 'category') categoryFilter = btn.dataset.value;
      if (btn.dataset.filter === 'city') cityFilter = btn.dataset.value;
    });

    let matchCount = 0;
    document.querySelectorAll('.hotel-card').forEach(card => {
      const matchCategory = categoryFilter === 'all' || card.dataset.category === categoryFilter;
      const matchCity = cityFilter === 'all' || card.dataset.city === cityFilter;
      
      const show = matchCategory && matchCity;
      card.style.display = show ? '' : 'none';
      if (show) matchCount++;
    });

    const noResultsMsg = document.getElementById('no-results-msg');
    if (noResultsMsg) {
      noResultsMsg.style.display = matchCount === 0 ? 'block' : 'none';
    }
  };

  filterBars.forEach(bar => {
    const buttons = bar.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        // ONLY clear active state for buttons in the SAME filter bar
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        applyFilters();
      });
    });
  });
}

// Modal
function openModal(id) {
  const m = document.getElementById(id);
  if (m) { m.classList.add('active'); document.body.style.overflow = 'hidden'; }
}
function closeModal(id) {
  const m = document.getElementById(id);
  if (m) { m.classList.remove('active'); document.body.style.overflow = ''; }
}

// Payment switcher
function initPaymentSwitcher() {
  const btns = document.querySelectorAll('.pay-btn');
  btns.forEach(b => {
    b.addEventListener('click', () => {
      btns.forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      document.querySelectorAll('.payment-detail').forEach(d => d.classList.add('hidden'));
      const target = document.getElementById('pay-' + b.dataset.pay);
      if (target) target.classList.remove('hidden');
    });
  });
}

// Load hotel from URL (hotel-template.html)
function loadHotelFromURL() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('hotel') || 'capital';
  const hotel = HOTELS.find(h => h.id === id) || HOTELS[0];
  document.querySelectorAll('[data-hotel-name]').forEach(el => el.textContent = hotel.name);
  document.querySelectorAll('[data-hotel-city]').forEach(el => el.textContent = hotel.city);
  document.title = hotel.name + ' — Sunbird Tourism PLC';
  
  const hero = document.querySelector('.page-hero');
  if (hero) {
    hero.style.background = `linear-gradient(135deg, rgba(17,101,48,0.85) 0%, rgba(0,0,0,0.6) 100%), url('${hotel.image}') center/cover no-repeat`;
  }
  
  const gmap = document.getElementById('hotel-gmap');
  const dirBtn = document.getElementById('hotel-directions-btn');
  if (gmap) {
    const query = encodeURIComponent(`${hotel.name}, ${hotel.city}, Malawi`);
    gmap.src = `https://maps.google.com/maps?q=${query}&hl=en&z=14&output=embed`;
    
    if (dirBtn) {
      dirBtn.href = `https://www.google.com/maps/dir/?api=1&destination=${query}`;
    }
  }
}

// Init on load
document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initBackToTop();
  initPaymentSwitcher();
  populateHotelDropdowns();
  
  if (document.getElementById('hotel-template-page')) loadHotelFromURL();
  if (document.getElementById('hotels-grid-home')) renderHotels('hotels-grid-home');
  if (document.getElementById('hotels-grid-all')) renderHotels('hotels-grid-all');
  
  initHotelFilter();
  initFadeIn();
  initLiveChat();
  initHeroSlider();
});

// Admin login
function adminLogin(e) {
  e.preventDefault();
  document.getElementById('login-card').style.display = 'none';
  document.querySelector('.admin-body').style.display = 'block';
  document.querySelector('.admin-body').style.padding = '0';
  document.getElementById('dashboard').classList.add('active');
  return false;
}

// Form submit simulators
function fakeSubmit(e, msg) {
  e.preventDefault();
  alert(msg || 'Thank you! We will be in touch shortly.');
  e.target.reset();
}

// Search handler that navigates to the hotel directly
function handleSearch(e) {
  e.preventDefault();
  const form = e.target;
  const dropdown = form.querySelector('[data-hotel-dropdown]');
  if (dropdown && dropdown.value) {
    window.location.href = `hotel-template.html?hotel=${dropdown.value}`;
  } else {
    alert('Please select a destination to search available rooms.');
  }
}

// Live chat injection and logic
function initLiveChat() {
  const chatHTML = `
    <div class="chat-widget" id="live-chat-widget">
      <button class="chat-toggle" id="chat-toggle-btn" aria-label="Open Chat">
        <svg fill="#fff" viewBox="0 0 24 24" width="28" height="28"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"></path></svg>
      </button>
      <div class="chat-window hidden" id="chat-window">
        <div class="chat-header">
          <h4>Sunbird Support</h4>
          <button class="chat-close" id="chat-close-btn">&times;</button>
        </div>
        <div class="chat-body" id="chat-body">
          <div class="chat-msg bot">Hello! How can we help you plan your stay today?</div>
        </div>
        <form class="chat-input" id="chat-form">
          <input type="text" id="chat-input-field" placeholder="Type a message..." required>
          <button type="submit">Send</button>
        </form>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', chatHTML);

  const toggleBtn = document.getElementById('chat-toggle-btn');
  const closeBtn = document.getElementById('chat-close-btn');
  const windowEl = document.getElementById('chat-window');
  const chatForm = document.getElementById('chat-form');
  const chatBody = document.getElementById('chat-body');
  const chatInput = document.getElementById('chat-input-field');

  toggleBtn.addEventListener('click', () => {
    windowEl.classList.toggle('hidden');
    if (!windowEl.classList.contains('hidden')) {
      chatInput.focus();
    }
  });

  closeBtn.addEventListener('click', () => {
    windowEl.classList.add('hidden');
  });

  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const msg = chatInput.value.trim();
    if (!msg) return;
    
    // Add user msg
    const userMsgEl = document.createElement('div');
    userMsgEl.className = 'chat-msg user';
    userMsgEl.textContent = msg;
    chatBody.appendChild(userMsgEl);
    chatInput.value = '';
    chatBody.scrollTop = chatBody.scrollHeight;

    // Simulate bot reply
    setTimeout(() => {
      const botMsgEl = document.createElement('div');
      botMsgEl.className = 'chat-msg bot';
      botMsgEl.textContent = "Thank you for your message. An agent will be with you shortly. (This is a simulated chat)";
      chatBody.appendChild(botMsgEl);
      chatBody.scrollTop = chatBody.scrollHeight;
    }, 1000);
  });
}

// Hero Slider for Homepage
function initHeroSlider() {
  const hero = document.querySelector('.hero');
  if (!hero || hero.classList.contains('page-hero')) return;
  
  hero.style.background = 'none';

  const sliderContainer = document.createElement('div');
  sliderContainer.className = 'hero-slider';
  
  const images = [
    'images/hero.jpg',
    'images/livingstonia.jpg',
    'images/sunbird-mount-soche.jpg',
    'images/images (6).jpeg',
    'images/images (2).jpeg'
  ];
  
  const slides = images.map((src, idx) => {
    const slide = document.createElement('div');
    slide.className = `hero-slide ${idx === 0 ? 'active' : ''}`;
    slide.style.backgroundImage = `url('${src}')`;
    sliderContainer.appendChild(slide);
    return slide;
  });
  
  hero.insertBefore(sliderContainer, hero.firstChild);

  let curr = 0;
  setInterval(() => {
    slides[curr].classList.remove('active');
    curr = (curr + 1) % slides.length;
    slides[curr].classList.add('active');
  }, 6000);
}