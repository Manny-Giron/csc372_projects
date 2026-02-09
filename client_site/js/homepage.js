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
// CREATE VISIBLE UI (UPDATING MARKUP)
// =+=+=+=+=+=+=+=+=+=+=+=

// Search feedback message (appears under the search box)
const searchFeedback = document.createElement("p");
searchFeedback.id = "searchFeedback";
searchFeedback.textContent = "Search for tools like “lawn”, “floor”, or “ladder”.";
searchBox.insertAdjacentElement("afterend", searchFeedback);

// Selected category label (appears above the tool grid)
const selectedLabel = document.createElement("p");
selectedLabel.id = "selectedLabel";
selectedLabel.textContent = "Selected category: None";
toolsContent.insertAdjacentElement("beforebegin", selectedLabel);

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

function handleToolCatSelection(clickedCat) {
   // Remove selected class from all categories
   toolCats.forEach((cat) => cat.classList.remove("selected"));

   // Add selected class to the clicked one
   clickedCat.classList.add("selected");

   // Update visible label (simple naming based on image file)
   const img = clickedCat.querySelector("img");
   const src = img ? img.getAttribute("src") : "";

   let name = "Tools";
   if (src.includes("Floor")) name = "Flooring";
   else if (src.includes("Lawn")) name = "Lawn & Outdoor";
   else if (src.includes("LaddersLift")) name = "Ladders & Lifts";

   selectedLabel.textContent = `Selected category: ${name}`;
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
   // "About" can be handled later when you add an About section
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

// Tool category selection
toolCats.forEach((cat) => {
   cat.addEventListener("click", () => handleToolCatSelection(cat));
});

// Navbar scrolling
navItems.forEach((item) => {
   item.addEventListener("click", () => {
      const label = item.textContent.trim();
      if (label) handleNavScroll(label);
   });
});
