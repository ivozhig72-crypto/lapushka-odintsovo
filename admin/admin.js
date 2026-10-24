"use strict";
const SUPABASE_URL = "https://dxjwybdoeaktnugehbhd.supabase.co";
const SUPABASE_KEY = "sb_publishable_6EhfeqIa8oWhLu2kkg-WLw_ntj2NcIL";
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const $ = (id) => document.getElementById(id);
const loginSection = $("login-section");
const dashboard = $("dashboard-section");
const statusMessage = $("status-message");
const eventsManager = $("events-manager");
const photosManager = $("photos-manager");
const pricesManager = $("prices-manager");
let isAdmin = false;
let photoBusy = false;
let eventBusy = false;
let priceBusy = false;
function message(el, text) { el.textContent = text; }
function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}
function button(text, handler, className = "secondary small") {
  const b = element("button", text, className);
  b.type = "button";
  b.addEventListener("click", handler);
  return b;
}
async function checkAdmin() {
  const { data: { user }, error: authError } = await db.auth.getUser();
  if (authError || !user) {
    isAdmin = false; loginSection.hidden = false; dashboard.hidden = true;
    return;
  }
  const { data, error } = await db.from("site_admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (error || !data) {
    isAdmin = false; loginSection.hidden = false; dashboard.hidden = true;
    message(statusMessage, error ? "Не удалось проверить права администратора: " + error.message : "Нет прав администратора.");
    return;
  }
  const firstLoad = !isAdmin;
  isAdmin = true; loginSection.hidden = true; dashboard.hidden = false;
  if (firstLoad) {
    message(statusMessage, "Добро пожаловать!");
    await Promise.all([loadPhotos(), loadPrices()]);
  }
}
$("login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  message(statusMessage, "Проверяем данные...");
  const { error } = await db.auth.signInWithPassword({email: $("email").value.trim(), password: $("password").value});
  if (error) { message(statusMessage, "Ошибка входа: " + error.message); return; }
  await checkAdmin();
});
$("toggle-password").addEventListener("click", () => {
  const input = $("password");
  const show = input.type === "password";
  input.type = show ? "text" : "password";
  $("toggle-password").textContent = show ? "Скрыть" : "Показать";
  $("toggle-password").setAttribute("aria-pressed", String(show));
});
$("logout-button").addEventListener("click", async () => {
  await db.auth.signOut(); isAdmin = false;
  loginSection.hidden = false; dashboard.hidden = true;
  message(statusMessage, "Вы вышли из панели.");
});
async function updatePassword(password) {
  if (password.length < 8) { alert("Пароль должен содержать не менее 8 символов."); return; }
  const { error } = await db.auth.updateUser({ password });
  alert(error ? "Ошибка смены пароля: " + error.message : "Пароль успешно изменён!");
}
$("change-password-button").addEventListener("click", async () => {
  const password = prompt("Введите новый пароль (не менее 8 символов):");
  if (password !== null) await updatePassword(password);
});
db.auth.onAuthStateChange((event) => {
  if (event === "PASSWORD_RECOVERY") {
    setTimeout(async () => {
      const password = prompt("Введите новый пароль (не менее 8 символов):");
      if (password !== null) await updatePassword(password);
    }, 0);
  }
  if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "INITIAL_SESSION") setTimeout(checkAdmin, 0);
});

// Мероприятия: сохраняем существующую возможность добавления.
eventsManager.innerHTML = `<h4>Добавить мероприятие</h4>
<form id="event-form"><input id="event-title" placeholder="Название мероприятия" required>
<textarea id="event-description" placeholder="Описание"></textarea>
<label for="event-date">Дата мероприятия</label><input id="event-date" type="date" required>
<button type="submit">Опубликовать мероприятие</button></form><p id="event-status" class="status" role="status"></p>`;
$("event-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (eventBusy || !isAdmin) return;
  eventBusy = true;
  const submit = event.target.querySelector('button[type="submit"]'); submit.disabled = true;
  message($("event-status"), "Сохраняем мероприятие...");
  try {
    const { error } = await db.from("site_events").insert({
      title: $("event-title").value.trim(), description: $("event-description").value.trim(),
      event_date: $("event-date").value, is_published: true
    });
    if (error) throw error;
    event.target.reset(); message($("event-status"), "Мероприятие успешно сохранено!");
  } catch (error) { message($("event-status"), "Ошибка сохранения: " + error.message); }
  finally { eventBusy = false; submit.disabled = false; }
});

// Фотографии: загрузка, просмотр, изменение подписи, удаление.
photosManager.innerHTML = `<h4>Добавить фотографию</h4><form id="photo-form">
<label for="photo-file">Выберите фотографию</label><input id="photo-file" type="file" accept="image/*" required>
<label for="photo-caption">Подпись к фотографии</label><input id="photo-caption" type="text" placeholder="Например: Наш мастер-класс">
<button type="submit">Загрузить фотографию</button></form>
<p id="photo-status" class="status" role="status"></p>
<h4>Опубликованные фотографии</h4><button id="refresh-photos" type="button" class="secondary">Обновить список</button>
<div id="photo-list"></div>`;
$("refresh-photos").addEventListener("click", loadPhotos);
async function loadPhotos() {
  if (!isAdmin) return;
  const list = $("photo-list"); list.replaceChildren(element("p", "Загружаем список..."));
  const { data, error } = await db.from("site_photos").select("id,image_url,caption,created_at").order("created_at", {ascending:false});
  if (error) { list.replaceChildren(element("p", "Ошибка получения фотографий: " + error.message)); return; }
  list.replaceChildren();
  if (!data.length) { list.append(element("p", "Пока нет фотографий.")); return; }
  for (const photo of data) {
    const card = element("div", undefined, "card");
    const img = document.createElement("img"); img.src = photo.image_url; img.alt = photo.caption || "Фотография студии"; img.loading = "lazy";
    const label = element("label", "Подпись к фотографии");
    const input = document.createElement("input"); input.type = "text"; input.value = photo.caption || "";
    const row = element("div", undefined, "row");
    const state = element("p", "", "status");
    row.append(button("Сохранить подпись", async () => {
      if (!isAdmin) return;
      const { error } = await db.from("site_photos").update({caption: input.value.trim()}).eq("id", photo.id);
      message(state, error ? "Ошибка: " + error.message : "Подпись сохранена!");
    }), button("Удалить фотографию", async () => {
      if (!isAdmin || !confirm("Удалить эту фотографию из галереи?")) return;
      const { error } = await db.from("site_photos").delete().eq("id", photo.id);
      if (error) { message(state, "Ошибка удаления: " + error.message); return; }
      // Удаление записи не удаляет файл из Storage автоматически.
      card.remove(); message($("photo-status"), "Фотография удалена из галереи.");
    }, "danger small"));
    card.append(img, label, input, row, state); list.append(card);
  }
}
$("photo-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (photoBusy || !isAdmin) return;
  const file = $("photo-file").files[0]; if (!file) return;
  if (!file.type.startsWith("image/") || file.size > 10 * 1024 * 1024) {
    message($("photo-status"), "Выберите изображение размером до 10 МБ."); return;
  }
  photoBusy = true;
  const submit = event.target.querySelector('button[type="submit"]'); submit.disabled = true;
  const status = $("photo-status"); message(status, "Загружаем фотографию...");
  let path;
  try {
    const extension = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    path = `${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await db.storage.from("lapushka-images").upload(path, file, {contentType:file.type});
    if (uploadError) throw uploadError;
    const { data } = db.storage.from("lapushka-images").getPublicUrl(path);
    const { error: saveError } = await db.from("site_photos").insert({image_url:data.publicUrl,caption:$("photo-caption").value.trim()});
    if (saveError) {
      await db.storage.from("lapushka-images").remove([path]);
      throw saveError;
    }
    event.target.reset(); message(status, "Фотография успешно опубликована!");
    await loadPhotos();
  } catch (error) { message(status, "Ошибка загрузки: " + error.message); }
  finally { photoBusy = false; submit.disabled = false; }
});

// Цены: таблица public.site_prices(id, direction, price, is_published, created_at).
pricesManager.innerHTML = `<p class="muted">Заполните направление и цену в рублях. Публикация управляется переключателем.</p>
<form id="price-form"><label for="price-direction">Направление или абонемент</label>
<input id="price-direction" type="text" placeholder="Например: Подготовка к школе — 8 занятий" required maxlength="200">
<label for="price-amount">Цена, ₽</label><input id="price-amount" type="number" min="0" step="0.01" required>
<label><input id="price-published" type="checkbox" style="width:auto;margin-right:8px">Опубликовать</label>
<button type="submit">Добавить цену</button></form><p id="price-status" class="status" role="status"></p>
<h4>Сохранённые цены</h4><button id="refresh-prices" type="button" class="secondary">Обновить список</button><div id="price-list"></div>`;
$("refresh-prices").addEventListener("click", loadPrices);
$("price-form").addEventListener("submit", async (event) => {
  event.preventDefault(); if (priceBusy || !isAdmin) return;
  const direction = $("price-direction").value.trim();
  const price = Number($("price-amount").value);
  if (!direction || !Number.isFinite(price) || price < 0) { message($("price-status"), "Проверьте название и цену."); return; }
  priceBusy = true;
  const submit = event.target.querySelector('button[type="submit"]'); submit.disabled = true;
  message($("price-status"), "Сохраняем цену...");
  try {
    const { error } = await db.from("site_prices").insert({direction, price, is_published:$("price-published").checked});
    if (error) throw error;
    event.target.reset(); message($("price-status"), "Цена успешно сохранена!"); await loadPrices();
  } catch (error) { message($("price-status"), "Ошибка: " + error.message); }
  finally { priceBusy = false; submit.disabled = false; }
});
async function loadPrices() {
  if (!isAdmin) return;
  const list = $("price-list"); list.replaceChildren(element("p", "Загружаем цены..."));
  const { data, error } = await db.from("site_prices").select("id,direction,price,is_published,created_at").order("created_at", {ascending:false});
  if (error) { list.replaceChildren(element("p", "Ошибка получения цен: " + error.message)); return; }
  list.replaceChildren();
  if (!data.length) { list.append(element("p", "Цены пока не добавлены.")); return; }
  for (const item of data) {
    const card = element("div", undefined, "card");
    const directionLabel = element("label", "Направление или абонемент");
    const direction = document.createElement("input"); direction.value = item.direction || "";
    const amountLabel = element("label", "Цена, ₽");
    const amount = document.createElement("input"); amount.type = "number"; amount.min = "0"; amount.step = "0.01"; amount.value = item.price;
    const publishLabel = element("label");
    const publish = document.createElement("input"); publish.type = "checkbox"; publish.style.width = "auto"; publish.style.marginRight = "8px"; publish.checked = Boolean(item.is_published);
    publishLabel.append(publish, document.createTextNode("Опубликовано"));
    const state = element("p", "", "status");
    const row = element("div", undefined, "row");
    row.append(button("Сохранить изменения", async () => {
      if (!isAdmin) return;
      const newPrice = Number(amount.value);
      if (!direction.value.trim() || amount.value === "" || !Number.isFinite(newPrice) || newPrice < 0) { message(state, "Проверьте название и цену."); return; }
      const { error } = await db.from("site_prices").update({direction:direction.value.trim(),price:newPrice,is_published:publish.checked}).eq("id",item.id);
      message(state, error ? "Ошибка: " + error.message : "Изменения сохранены!");
    }), button("Удалить цену", async () => {
      if (!isAdmin || !confirm("Удалить эту цену?")) return;
      const { error } = await db.from("site_prices").delete().eq("id",item.id);
      if (error) message(state, "Ошибка: " + error.message);
      else { card.remove(); message($("price-status"), "Цена удалена."); }
    }, "danger small"));
    card.append(directionLabel,direction,amountLabel,amount,publishLabel,row,state); list.append(card);
  }
}
checkAdmin();
