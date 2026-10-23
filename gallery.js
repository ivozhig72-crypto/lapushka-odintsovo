
// Фотогалерея детской студии «Лапушка»
(async function () {
  const gallery = document.getElementById("lapushka-gallery");
  if (!gallery) return;

  const SUPABASE_URL = "https://dxjwybdoeaktnugehbhd.supabase.co";
  const SUPABASE_KEY = "sb_publishable_6EhfeqIa8oWhLu2kkg-WLw_ntj2NcIL";

  try {
    if (!window.supabase) {
      throw new Error("Supabase не загрузился");
    }

    const client = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_KEY
    );

    const { data, error } = await client
      .from("site_photos")
      .select("image_url, caption")
      .order("created_at", { ascending: false });

    if (error) throw error;

    gallery.replaceChildren();

    if (!data || data.length === 0) {
      gallery.textContent = "Фотографии скоро появятся.";
      return;
    }

    for (const photo of data) {
      if (!photo.image_url) continue;

      const figure = document.createElement("figure");
      const img = document.createElement("img");

      img.src = photo.image_url;
      img.alt = photo.caption || "Фотография студии Лапушка";
      img.loading = "lazy";
      img.style.width = "100%";
      img.style.borderRadius = "14px";

      figure.appendChild(img);

      if (photo.caption) {
        const caption = document.createElement("figcaption");
        caption.textContent = photo.caption;
        figure.appendChild(caption);
      }

      gallery.appendChild(figure);
    }

    gallery.style.display = "grid";
    gallery.style.gridTemplateColumns =
      "repeat(auto-fit, minmax(220px, 1fr))";
    gallery.style.gap = "20px";

  } catch (error) {
    console.error("Ошибка галереи:", error);
    gallery.textContent =
      "Не удалось загрузить фотографии. Попробуйте позже.";
  }
})();
