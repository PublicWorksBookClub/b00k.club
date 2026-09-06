/**
 * Hand the studio a font it can read, from this site's own font directory.
 *
 * The studio expects a file from disk, which is right for a tool run locally
 * and useless to a visitor who has no font to hand. Same-origin, because
 * `connect-src 'self'` allows that and nothing else.
 */
(function () {
  const preset = document.getElementById("fontPreset");
  const fileRow = document.getElementById("fontFileRow");
  const fileInput = document.getElementById("fontFile");
  const advice = document.getElementById("fontAdvice");

  async function load(src) {
    const name = src.split("/").pop();
    try {
      const res = await fetch(src);
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const buf = await res.arrayBuffer();
      const dt = new DataTransfer();
      dt.items.add(new File([buf], name, { type: "font/ttf" }));
      fileInput.files = dt.files;
      fileInput.onchange({ target: fileInput });
    } catch (e) {
      advice.className = "advice bad";
      advice.textContent = `Could not load ${name}: ${e.message}`;
    }
  }

  preset.onchange = () => {
    const own = preset.value === "";
    fileRow.classList.toggle("hide", !own);
    if (!own) load(preset.value);
  };

  // On arrival, so picking Letterset draws a letter rather than asking for a
  // file the visitor does not have. The studio's own module is deferred by
  // being a module, so its file input exists by the time this runs.
  load(preset.value);
})();
