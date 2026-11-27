'use strict';

const one = (selector, root = document) => root.querySelector(selector);
const all = (selector, root = document) => [...root.querySelectorAll(selector)];
const icon = (name) => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"></use></svg>`;
const channels = {
  phone: 'tel:+79519923593',
  telegram: 'https://t.me/+79519923593',
  whatsapp: 'https://wa.me/79519923593'
};
const photoDirectory = 'assets/photos/';

const menuButton = one('.menu-button');
const mobileMenu = one('#mobile-nav');
function toggleMenu(open) {
  mobileMenu.hidden = !open;
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  one('use', menuButton).setAttribute('href', open ? '#i-cross' : '#i-menu');
}
menuButton.addEventListener('click', () => toggleMenu(mobileMenu.hidden));
mobileMenu.addEventListener('click', () => toggleMenu(false));
document.addEventListener('click', (event) => {
  if (!mobileMenu.hidden && !event.target.closest('.header')) toggleMenu(false);
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !mobileMenu.hidden) {
    toggleMenu(false);
    menuButton.focus();
  }
});
matchMedia('(min-width: 921px)').addEventListener('change', (event) => {
  if (event.matches) toggleMenu(false);
});

for (const dialog of all('dialog')) {
  one('[data-close]', dialog).addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  });
}

const gallery = one('#gallery');
const galleryImage = one('#gallery-image');
const fitButton = one('#gallery-fit');
const framedPhotos = new Set(window.framedPhotos);
let currentImages = [];
let currentIndex = 0;
let fullFrame = false;
function showPhoto(offset = 0) {
  currentIndex = (currentIndex + offset + currentImages.length) % currentImages.length;
  const photo = currentImages[currentIndex];
  const hasCrop = framedPhotos.has(photo.id);
  galleryImage.src = `${photoDirectory}${hasCrop && !fullFrame ? 'framed/' : ''}${photo.id}.webp`;
  fitButton.hidden = !hasCrop;
  fitButton.textContent = fullFrame ? 'Крупный план' : 'Весь кадр';
  galleryImage.alt = photo.caption;
  one('#gallery-caption').textContent = photo.caption;
  one('#gallery-count').textContent = `${currentIndex + 1} / ${currentImages.length}`;
}
function openGallery(title, photos, index = 0) {
  currentImages = photos;
  currentIndex = index;
  fullFrame = false;
  one('#gallery-title').textContent = title;
  showPhoto();
  gallery.showModal();
}
fitButton.addEventListener('click', () => {
  fullFrame = !fullFrame;
  showPhoto();
});
const heroButtons = all('[data-hero]');
const selectedPhotos = heroButtons.map((button) => {
  const img = one('img', button);
  return { id: 92 + Number(button.dataset.hero), caption: img.alt };
});
const hero = one('.hero');
if (hero) {
  const slides = all('[data-mobile-photo]', hero);
  const mobilePhotos = slides.map((slide) => ({id: Number(slide.dataset.mobilePhoto), caption: slide.dataset.caption}));
  const nav = one('.panorama-nav', hero);
  const play = one('#hero-play', nav);
  const open = one('#hero-open', nav);
  const count = one('#hero-count', nav);
  const photoName = one('#hero-photo-name', nav);
  const announcement = one('#hero-announcement', nav);
  const mobile = matchMedia('(max-width: 920px)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let index = 0;
  let playing = !reducedMotion.matches;
  let inView = false;
  let timer;
  let gesture;

  function canAdvance() {
    return playing && mobile.matches && inView && !document.hidden && !gesture && !one('dialog[open]');
  }
  function queueNextPhoto() {
    clearTimeout(timer);
    if (canAdvance()) timer = setTimeout(() => {
      if (canAdvance()) movePhoto(1);
    }, 6500);
  }
  function movePhoto(step, manual = false) {
    slides[index].classList.remove('is-current');
    index = (index + step + slides.length) % slides.length;
    slides[index].classList.add('is-current');
    const name = slides[index].dataset.label;
    count.textContent = `${index + 1} / ${slides.length}`;
    photoName.textContent = name;
    open.setAttribute('aria-label', `Открыть фото: ${name}`);
    if (manual) announcement.textContent = `Кадр ${index + 1} из ${slides.length}. ${name}`;
    queueNextPhoto();
  }
  function setPlaying(value) {
    playing = value;
    play.setAttribute('aria-label', value ? 'Остановить автосмену фото' : 'Запустить автосмену фото');
    one('use', play).setAttribute('href', value ? '#i-pause' : '#i-play');
    queueNextPhoto();
  }
  function syncMode() {
    nav.hidden = !mobile.matches;
    queueNextPhoto();
  }

  play.addEventListener('click', () => setPlaying(!playing));
  one('#hero-prev', nav).addEventListener('click', () => movePhoto(-1, true));
  one('#hero-next', nav).addEventListener('click', () => movePhoto(1, true));
  open.addEventListener('click', () => openGallery('Фотографии с объектов', mobilePhotos, index));
  nav.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      movePhoto(event.key === 'ArrowRight' ? 1 : -1, true);
    }
  });
  hero.addEventListener('touchstart', (event) => {
    if (!mobile.matches || event.touches.length !== 1) return;
    gesture = { x: event.touches[0].clientX, y: event.touches[0].clientY };
    queueNextPhoto();
  }, { passive: true });
  hero.addEventListener('touchend', (event) => {
    if (!gesture) return;
    const point = event.changedTouches[0];
    const dx = point.clientX - gesture.x;
    const dy = point.clientY - gesture.y;
    gesture = undefined;
    if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy) * 1.4) movePhoto(dx < 0 ? 1 : -1, true);
    else queueNextPhoto();
  }, { passive: true });
  hero.addEventListener('touchcancel', () => {
    gesture = undefined;
    queueNextPhoto();
  });

  const observer = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    queueNextPhoto();
  }, { threshold: 0.15 });
  observer.observe(hero);
  const dialogObserver = new MutationObserver(queueNextPhoto);
  for (const dialog of all('dialog')) dialogObserver.observe(dialog, {attributeFilter: ['open']});
  mobile.addEventListener('change', syncMode);
  reducedMotion.addEventListener('change', () => setPlaying(!reducedMotion.matches));
  document.addEventListener('visibilitychange', queueNextPhoto);
  syncMode();
  setPlaying(playing);
}
heroButtons.forEach((button, index) => {
  button.addEventListener('click', () => openGallery('Фотографии с объектов', selectedPhotos, index));
});
one('#previous').addEventListener('click', () => showPhoto(-1));
one('#next').addEventListener('click', () => showPhoto(1));
gallery.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    showPhoto(event.key === 'ArrowLeft' ? -1 : 1);
  }
});
let touchStart = null;
galleryImage.addEventListener('touchstart', (event) => {
  touchStart = event.touches.length === 1 ? event.touches[0].clientX : null;
}, { passive: true });
galleryImage.addEventListener('touchend', (event) => {
  if (touchStart === null) return;
  const delta = event.changedTouches[0].clientX - touchStart;
  if (Math.abs(delta) > 55) showPhoto(delta < 0 ? 1 : -1);
  touchStart = null;
}, { passive: true });

const albumContainer = one('#albums');
const albums = window.projectAlbums;
function buildAlbums(container) {
  const visibleAlbums = container.hasAttribute('data-portfolio') ? albums : albums.slice(0, 3);
  for (const album of visibleAlbums) {
    const button = document.createElement('button');
    button.className = 'album';
    button.dataset.album = album.id;
    button.innerHTML = `<div class="album-image"><img src="${photoDirectory}cover-${album.cover}.webp" alt=""></div><div class="album-label"><strong></strong><small></small></div>`;
    one('strong', button).textContent = album.title;
    one('small', button).textContent = `${album.images.length} фото`;
    button.addEventListener('click', () => openAlbum(album));
    container.append(button);
  }
}
if (albumContainer) buildAlbums(albumContainer);

function openAlbum(album) {
  openGallery(album.title, album.images);
}
for (const button of all('[data-open-album]')) {
  button.addEventListener('click', () => {
    const album = albums.find((item) => item.id === button.dataset.openAlbum);
    if (album) openAlbum(album);
  });
}
for (const container of all('[data-photo-group]')) {
  const buttons = all('[data-full-photo]', container);
  const pictures = buttons.map((button) => ({
    id: Number(button.dataset.fullPhoto),
    caption: one('img', button).alt
  }));
  buttons.forEach((button, index) => button.addEventListener('click', () => {
    openGallery(container.dataset.photoGroup, pictures, index);
  }));
}

const contact = one('#contact-dialog');
const dialogTitle = one('#dialog-title');
const content = one('#dialog-content');
function channelLink(url, name, symbol, external = false) {
  return `<a href="${url}"${external ? ' target="_blank" rel="noopener"' : ''}>${icon(symbol)}${name}</a>`;
}
function present(title, markup) {
  dialogTitle.textContent = title;
  content.innerHTML = markup;
  if (!contact.open) contact.showModal();
  else one('[data-close]', contact).focus();
  contact.scrollTop = 0;
}
function maxDetails() {
  present('Связь в MAX', `<p>Добавьте номер Павла в контакты телефона и откройте его в MAX.</p>
    <div class="max-number">+7 951 992-35-93</div>
    <div class="channel-links"><button id="copy-number">${icon('copy')}Скопировать номер</button>
    ${channelLink('https://web.max.ru/', 'Открыть MAX', 'max', true)}</div>
    <div class="copy-state" role="status"></div>`);
  one('#copy-number').addEventListener('click', async () => {
    const status = one('.copy-state', content);
    try {
      await navigator.clipboard.writeText('+79519923593');
      status.textContent = 'Номер скопирован.';
    } catch {
      const range = document.createRange();
      range.selectNodeContents(one('.max-number', content));
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      status.textContent = 'Номер выделен. Выберите «Копировать».';
    }
  });
}
const requestTemplate = one('#request-form-template');
function discussion(topic = '', withFile = false) {
  const title = withFile ? 'Отправить материалы' : (topic || 'Оставить заявку');
  const hint = withFile
    ? 'Коротко опишите, что нужно рассчитать, и приложите фото или ведомость.'
    : 'Опишите задачу и оставьте телефон для связи.';
  present(title, `<p>${hint}</p><div class="dialog-direct"><a href="${channels.phone}">Позвонить</a><button data-contact="max">MAX</button><a href="${channels.telegram}" target="_blank" rel="noopener">Telegram</a><a href="${channels.whatsapp}" target="_blank" rel="noopener">WhatsApp</a></div>`);
  const request = requestTemplate.content.cloneNode(true);
  const form = one('form', request);
  if (withFile || topic) form.elements.namedItem('Тема').value = withFile ? 'Фото или ведомость на расчёт' : topic;
  content.insertBefore(request, one('.dialog-direct', content));
}
document.addEventListener('input', (event) => {
  if (event.target.matches('.contact-form :is(input, textarea)')) event.target.setCustomValidity('');
});
document.addEventListener('submit', (event) => {
  const form = event.target;
  if (!form.matches('.contact-form')) return;
  const name = form.elements.namedItem('Имя');
  const phone = form.elements.namedItem('Телефон');
  const task = form.elements.namedItem('Задача');
  const attachment = form.elements.attachment;
  if (!name.value.trim()) name.setCustomValidity('Укажите ваше имя.');
  if (!/^\+?[\d\s().-]+$/.test(phone.value.trim()) || !/^\d{10,15}$/.test(phone.value.replace(/\D/g, ''))) {
    phone.setCustomValidity('Укажите телефон с кодом города или оператора.');
  }
  if (!task.value.trim()) task.setCustomValidity('Коротко опишите задачу.');
  if (attachment.files[0]?.size > 10_000_000) attachment.setCustomValidity('Выберите файл до 10 МБ.');
  if (!form.reportValidity()) event.preventDefault();
});
document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-contact],[data-topic]');
  if (!button) return;
  if (button.dataset.contact === 'max') maxDetails();
  else if (button.dataset.contact === 'files') discussion('', true);
  else discussion(button.dataset.topic);
});
