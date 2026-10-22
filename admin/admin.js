
const SUPABASE_URL = "https://dxjwybdoeaktnugehbhd.supabase.co";
const SUPABASE_KEY = "sb_publishable_6EhfeqIa8oWhLu2kkg-WLw_ntj2NcIL";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);




const loginForm = document.getElementById("login-form");
const loginSection = document.getElementById("login-section");
const dashboard = document.getElementById("dashboard-section");
const statusMessage = document.getElementById("status-message");

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  statusMessage.textContent = "Проверяем данные...";

  const { error } = await db.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    statusMessage.textContent = "Ошибка входа: " + error.message;
    return;
  }

  statusMessage.textContent = "Вход выполнен.";
  await checkAdmin();
});

async function checkAdmin() {
  const { data: { user } } = await db.auth.getUser();

  if (!user) {
    loginSection.hidden = false;
    dashboard.hidden = true;
    return;
  }

  const { data, error } = await db
    .from("site_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) {
    await db.auth.signOut();
    statusMessage.textContent = "Нет прав администратора.";
    loginSection.hidden = false;
    dashboard.hidden = true;
    return;
  }

  loginSection.hidden = true;
  dashboard.hidden = false;
  statusMessage.textContent = "Добро пожаловать!";
}

document.getElementById("logout-button").addEventListener("click", async () => {
  await db.auth.signOut();
  loginSection.hidden = false;
  dashboard.hidden = true;
  statusMessage.textContent = "Вы вышли из панели.";
});

db.auth.onAuthStateChange(() => {
  setTimeout(() => checkAdmin(), 0);
});

checkAdmin();

db.auth.onAuthStateChange(async (event) => {
  if (event !== "PASSWORD_RECOVERY") return;

  const password = prompt(
    "Введите новый пароль для панели Лапушки (не менее 8 символов):"
  );

  if (!password) return;

  if (password.length < 8) {
    alert("Пароль должен содержать не менее 8 символов.");
    return;
  }

  const { error } = await db.auth.updateUser({
    password: password
  });

  if (error) {
    alert("Не удалось изменить пароль: " + error.message);
  } else {
    alert("Пароль успешно изменён! Теперь можно войти.");
  }
});
document.getElementById("change-password-button").addEventListener("click", async () => {
  const password = prompt("Введите новый пароль (не менее 8 символов):");

  if (password === null) return;

  if (password.length < 8) {
    alert("Пароль должен содержать не менее 8 символов.");
    return;
  }

  const { error } = await db.auth.updateUser({ password });

  if (error) {
      alert("Ошибка смены пароля: " + error.message);
  } else {
    alert("Пароль успешно изменён!");
  }
});
// Управление мероприятиями «Лапушки»
const eventsManager = document.getElementById("events-manager");

function showEventForm() {
  eventsManager.innerHTML = `
    <h4>Добавить мероприятие</h4>
    <form id="event-form">
      <input id="event-title" placeholder="Название мероприятия" required>
      <textarea id="event-description" placeholder="Описание"></textarea>
      <label for="event-date">Дата мероприятия</label>
      <input id="event-date" type="date" required>
      <button type="submit">Опубликовать мероприятие</button>
    </form>
    <p id="event-status"></p>
  `;
}
showEventForm();

eventsManager.addEventListener("submit", async (event) => {
  if (event.target.id !== "event-form") return;

  event.preventDefault();

  const title = document.getElementById("event-title").value.trim();
  const description = document.getElementById("event-description").value.trim();
  const event_date = document.getElementById("event-date").value;
  const status = document.getElementById("event-status");

  status.textContent = "Сохраняем мероприятие...";

  const { error } = await db.from("site_events").insert({
    title,
    description,
    event_date,
    is_published: true
  });

  if (error) {
    status.textContent = "Ошибка сохранения: " + error.message;
  } else {
    status.textContent = "Мероприятие успешно сохранено!";
    event.target.reset();
  }
});
