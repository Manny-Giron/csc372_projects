/*
Name: Emmanuel Giron
Date: February 8, 2026
Description: This page handles basic UI interactivity for categories:
   - Active highlight for sidebar links
   - Category search filter for the featured cards
*/


document.addEventListener("DOMContentLoaded", () => {
   // Highlight the sidebar link that matches the current page
   const links = document.querySelectorAll(".category-link");
   const currentFile = window.location.pathname.split("/").pop();
   console.log(currentFile);
   links.forEach((link) => {
      const hrefFile = (link.getAttribute("href") || "").split("/").pop();

      // if we're on toolCategories.html, highlight "All Categories"
      if (!currentFile || currentFile === "toolCategories.html") {
         if (link.dataset.cat === "all") link.classList.add("active");
         else link.classList.remove("active");
         return;
      }

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
   }
});
