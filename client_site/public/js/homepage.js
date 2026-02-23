/*
Name: Emmanuel Giron
Date: February 8, 2026
Description: Adds interactivity to the Rocket Rentals homepage (search feedback, tool category selection, and navbar scrolling).
AI usage: Used ChatGPT to help plan features; Due to only having a homepage and nothing less -
- most JS is more 'proof of concept', meant to be a foundation of future actual usage.
*/

// =+=+=+=+=+=+=+=+=+=+=+=
// GETTING ELEMENTS 
// =+=+=+=+=+=+=+=+=+=+=+=
const searchInput = document.querySelector("#searchInput");
const searchButton = document.querySelector("#searchButton");
const searchBox = document.querySelector("#searchBox");

const toolCats = document.querySelectorAll(".ToolCat");

const navItems = document.querySelectorAll("#NavItems .nav-item");
const topContent = document.querySelector("#TopContent");
const toolsContent = document.querySelector("#ToolsContent");
const bottomContent = document.querySelector("#BottomContent");

// =+=+=+=+=+=+=+=+=+=+=+=
// CREATE VISIBLE UI 
// =+=+=+=+=+=+=+=+=+=+=+=

// Search feedback message (appears under the search box)
const searchFeedback = document.createElement("p");
searchFeedback.id = "searchFeedback";
searchFeedback.textContent = "Search for tools like “lawn”, “floor”, or “ladder”.";
searchBox.insertAdjacentElement("afterend", searchFeedback);

// =+=+=+=+=+=+=+=+=+=+=+=
// FUNCTIONS
// =+=+=+=+=+=+=+=+=+=+=+=
function handleSearch() {
   const query = searchInput.value.trim();

   if (query.length === 0) {
      searchFeedback.textContent = "Type something in the search box first.";
      return;
   }

   searchFeedback.textContent = `Searching for: "${query}"`;
}

function handleNavScroll(labelText) {
   const label = labelText.toLowerCase();

   if (label.includes("home")) {
      topContent.scrollIntoView({ behavior: "smooth" });
   } else if (label.includes("tools")) {
      toolsContent.scrollIntoView({ behavior: "smooth" });
   } else if (label.includes("how it works")) {
      bottomContent.scrollIntoView({ behavior: "smooth" });
   }
}

// =+=+=+=+=+=+=+=+=+=+=+=
// EVENT LISTENERS 
// =+=+=+=+=+=+=+=+=+=+=+=

// Search button click
searchButton.addEventListener("click", handleSearch);

// Pressing Enter in the search input also searches
searchInput.addEventListener("keydown", (e) => {
   if (e.key === "Enter") handleSearch();
});



navItems.forEach((item) => {
   item.addEventListener("click", () => {
      const label = item.textContent.trim();
      if (label) handleNavScroll(label);
   });
});
