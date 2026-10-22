// Афиша мероприятий студии «Лапушка»
(async function () {
  const SUPABASE_URL = "https://dxjwybdoeaktnugehbhd.supabase.co";
  const SUPABASE_KEY = "sb_publishable_6EhfeqIa8oWhLu2kkg-WLw_ntj2NcIL";

  if (!window.supabase) {
    console.error("Не загрузилась библиотека Supabase");
    return;
  }

  const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  const section = document.createElement("section");
  section.className = "content-section";
  section.id = "events";
  section.innerHTML = `
    <div class="events-content">
      <h2>Афиша мероприятий</h2>
      <div id="lapushka-events">Загружаем мероприятия...</div>
    </div>
  `;

  const main = document.querySelector("main");
  if (!main) return;

  main.appendChild(section);

  const container = document.getElementById("lapushka-events");

  const { data, error } = await db
    .from("site_events")
    .select("title, description, event_date, image_url")
    .eq("is_published", true)
    .order("event_date", { ascending: true });

  if (error) {
    console.error("Ошибка загрузки мероприятий:", error);
    container.textContent = "Не удалось загрузить мероприятия.";
    return;
  }

  container.replaceChildren();

  if (!data || data.length === 0) {
    container.textContent = "Скоро здесь появятся новые мероприятия!";
    return;
  }

  for (const event of data) {
    const card = document.createElement("article");
    card.className = "event-card";

    const title = document.createElement("h3");
    title.textContent = event.title;
    card.appendChild(title);

    if (event.event_date) {
      const date = document.createElement("p");
      const parts = event.event_date.split("-");
      date.textContent = `Дата: ${parts[2]}.${parts[1]}.${parts[0]}`;
      card.appendChild(date);
    }

    if (event.description) {
      const description = document.createElement("p");
      description.textContent = event.description;
      card.appendChild(description);
    }

        if (event.image_url) {
      const image = document.createElement("img");
      image.src = event.image_url;
      image.alt = event.title;
      image.loading = "lazy";
      image.style.maxWidth = "100%";
      image.style.borderRadius = "16px";
      card.appendChild(image);
    }

    card.style.padding = "20px";
    card.style.marginBottom = "16px";
    card.style.background = "#fff";
    card.style.borderRadius = "20px";

    container.appendChild(card);
  }
})();
