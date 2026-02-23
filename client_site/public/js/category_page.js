/*
Name: Emmanuel Giron
Date: February 8, 2026
Description: Adds interactivity to the Rocket Rentals individual catelog section, features include:
- Highlights the active category link based on current filename
- Filters tool cards by search text
- Sorts tools by name 
*/

(function () {
   // 1) Sidebar active link highlight
   const links = document.querySelectorAll(".category-link");
   const currentFile = window.location.pathname.split("/").pop();

   links.forEach((a) => {
      const hrefFile = (a.getAttribute("href") || "").split("/").pop();
      if (hrefFile && hrefFile === currentFile) {
         links.forEach((x) => x.classList.remove("active"));
         a.classList.add("active");
      }
   });

   // 2) Tool search filter
   const searchInput = document.getElementById("toolSearch");
   const grid = document.getElementById("toolGrid");
   const cards = Array.from(document.querySelectorAll(".tool-card"));

   function applyFilter() {
      const q = (searchInput?.value || "").trim().toLowerCase();

      cards.forEach((card) => {
         const name = (card.dataset.name || card.textContent || "").toLowerCase();
         card.style.display = name.includes(q) ? "" : "none";
      });
   }

   if (searchInput) {
      searchInput.addEventListener("input", applyFilter);
   }

   // 3) Sorting (by name currently)
   const sortSelect = document.getElementById("toolSort");

   function applySort() {
      if (!sortSelect || !grid) return;

      const mode = sortSelect.value;

      // keep originals, but reorder in DOM
      const visibleCards = cards.filter((c) => c.style.display !== "none");

      if (mode === "featured") {
         // featured first, then name A-Z
         visibleCards.sort((a, b) => {
            const af = a.dataset.featured === "true" ? 0 : 1;
            const bf = b.dataset.featured === "true" ? 0 : 1;
            if (af !== bf) return af - bf;
            return (a.dataset.name || "").localeCompare(b.dataset.name || "");
         });
      } else if (mode === "name-asc") {
         visibleCards.sort((a, b) =>
            (a.dataset.name || "").localeCompare(b.dataset.name || "")
         );
      } else if (mode === "name-desc") {
         visibleCards.sort((a, b) =>
            (b.dataset.name || "").localeCompare(a.dataset.name || "")
         );
      }

      // Put sorted visible cards first; keep hidden cards at end
      const hiddenCards = cards.filter((c) => c.style.display === "none");
      [...visibleCards, ...hiddenCards].forEach((c) => grid.appendChild(c));
   }

   if (sortSelect) {
      sortSelect.addEventListener("change", applySort);
   }
})();

document.addEventListener("DOMContentLoaded", () => {
   // Highlight the sidebar link that matches the current page
   const links = document.querySelectorAll(".category-link");
   const currentFile = window.location.pathname.split("/").pop();
   console.log(currentFile);
   links.forEach((link) => {
      const hrefFile = (link.getAttribute("href") || "").split("/").pop();

      // otherwise highlight matching page
      if (hrefFile === currentFile) link.classList.add("active");
      else link.classList.remove("active");
   });

   // Simple search filter for the category cards
   const search = document.getElementById("categorySearch");
   const cards = document.querySelectorAll(".category-card");

   if (search) {
      search.addEventListener("input", () => {
         const q = search.value.trim().toLowerCase();
         cards.forEach((card) => {
            const name = (card.dataset.name || "").toLowerCase();
            card.style.display = name.includes(q) ? "block" : "none";
         });
      });
   } 1
});
