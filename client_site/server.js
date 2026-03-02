/**
 * Emmanuel Giron
 * CREATED: February 22, 2026
 * UPDATED: March 1, 2026
 * Rocket Rentals - Node.js static file server (serves files from /public)
 *  UPDATE: Refactored to use Express and Handlebars for dynamic rendering of views
 */

const path = require("path");
const express = require("express");
const { engine } = require("express-handlebars");

const app = express();

// Handlebars 
app.engine(
   "handlebars",
   engine({
      defaultLayout: "main",
   })
);
app.set("view engine", "handlebars");
app.set("views", path.join(__dirname, "views"));

// Static files setup (CSS/JS/images)
app.use("/public", express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
   let cleanPath = req.path.toLowerCase();

   if (cleanPath.length > 1 && cleanPath.endsWith("/")) {
      cleanPath = cleanPath.slice(0, -1);
   }
   if (cleanPath !== req.path) {
      const qs = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
      return res.redirect(301, cleanPath + qs);
   }

   next();
});
// =+=+=+=+=+=+=+=+=+=+=+=+=+=
// =+=+=+=+=+=+=+=+=+=+=+=+=+=
// Routes (render views)
// =+=+=+=+=+=+=+=+=+=+=+=+=+=
// =+=+=+=+=+=+=+=+=+=+=+=+=+=
app.get("/", (req, res) => {
   res.render("home", {
      pageTitle: "Rocket Rentals",
      year: new Date().getFullYear(),
      isHome: true,
      cssFiles: ["styles.css"],
      jsFiles: ["homepage.js"],
   });
});

// =+=+=+=+=+=+=+=+=+=+=+=+=+=

app.get("/cart", (req, res) => {
   res.render("cart", {
      pageTitle: "Cart",
      year: new Date().getFullYear(),
      isHome: false,
      cssFiles: ["cart.css"],
      jsFiles: ["cart.js"],
   });
});
// =+=+=+=+=+=+=+=+=+=+=+=+=+=

// For when i make the page
// app.get("/about", (req, res) => {
//   res.render("about", {
//     pageTitle: "About",
//     year: new Date().getFullYear(),
//   });
// });


// =+=+=+=+=+=+=+=+=+=+=+=+=+=
// Category pages
//=+=+=+=+=+=+=+=+=+=+=+=+=+=
app.get("/toolCategories", (req, res) => {
   res.render("toolCategories", {
      pageTitle: "Tool Categories",
      year: new Date().getFullYear(),
      isHome: false,
      cssFiles: ["toolCategories.css"],
      jsFiles: ["toolCategories.js"],
   });
});

app.get("/category_cleaning", (req, res) => {
   res.render("category_cleaning", {
      pageTitle: "Cleaning Tools",
      year: new Date().getFullYear(),
      isHome: false,
      cssFiles: ["category_page.css"],
      jsFiles: ["category_page.js"],
   });
});
app.get("/category_ladders", (req, res) => {
   res.render("category_ladders", {
      pageTitle: "Ladders & Lifts",
      year: new Date().getFullYear(),
      isHome: false,
      cssFiles: ["category_page.css"],
      jsFiles: ["category_page.js"],
   });
});

app.get("/category_lawn", (req, res) => {
   res.render("category_lawn", {
      pageTitle: "Lawn & Outdoor Tools",
      year: new Date().getFullYear(),
      isHome: false,
      cssFiles: ["category_page.css"],
      jsFiles: ["category_page.js"],
   });
});

app.get("/category_masonry", (req, res) => {
   res.render("category_masonry", {
      pageTitle: "Concrete & Masonry Tools",
      year: new Date().getFullYear(),
      isHome: false,
      cssFiles: ["category_page.css"],
      jsFiles: ["category_page.js"],
   });
});

app.get("/category_powertools", (req, res) => {
   res.render("category_powertools", {
      pageTitle: "Power Tools",
      year: new Date().getFullYear(),
      isHome: false,
      cssFiles: ["category_page.css"],
      jsFiles: ["category_page.js"],
   });
});

app.get("/category_trailers", (req, res) => {
   res.render("category_trailers", {
      pageTitle: "Trailers",
      year: new Date().getFullYear(),
      isHome: false,
      cssFiles: ["category_page.css"],
      jsFiles: ["category_page.js"],
   });
});

//
// 404 Page
app.use((req, res) => {
   res.status(404).render("404", {
      pageTitle: "404 - Page Not Found",
      year: new Date().getFullYear(),
      url: req.originalUrl,
   });
});
//
// 500 Error Handler
app.use((err, req, res, next) => {
   console.error("500 error:", err);
   res.status(500).render("500", {
      pageTitle: "500 - Server Error",
      year: new Date().getFullYear(),
   });
});

app.listen(PORT, () => {
   console.log(`Server running at http://localhost:${PORT}`);
});