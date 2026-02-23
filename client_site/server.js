/**
 * Emmanuel Giron
 * February 22, 2026
 * Rocket Rentals - Node.js static file server (serves files from /public)
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3000;

function getContentType(filePath) {
   const ext = path.extname(filePath).toLowerCase();

   // Sends the correct Content-Type header based on the file type
   switch (ext) {
      case ".html": return "text/html; charset=utf-8";
      case ".css": return "text/css; charset=utf-8";
      case ".js": return "text/javascript; charset=utf-8";
      case ".json": return "application/json; charset=utf-8";
      case ".png": return "image/png";
      case ".jpg":
      case ".jpeg": return "image/jpeg";
      case ".gif": return "image/gif";
      case ".svg": return "image/svg+xml";
      case ".webp": return "image/webp";
      case ".ico": return "image/x-icon";
      default: return "application/octet-stream";
   }
}

/**
 * Create a function named serveStaticFile that:
 * - Attempts to read the file at the given path
 * - Sets status code 200 when successful
 * - Sets status code 500 if a server error occurs
 * - Sends the correct Content-Type header based on the file type
 * - Sends the file data in the response
 */
function serveStaticFile(res, filePath, statusCode = 200) {
   fs.readFile(filePath, (err, data) => {
      if (err) {
         // Server error occurs (permissions, unexpected fs issues, etc.)
         res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
         res.end("500 - Server Error");
         return;
      }

      res.writeHead(statusCode, { "Content-Type": getContentType(filePath) });
      res.end(data);
   });
}

// Absolute path to your /public folder
const publicDir = path.join(__dirname, "public");

const server = http.createServer((req, res) => {
   // Normalize the URL path by:
   // - removing query strings
   // - removing trailing slashes (except "/")
   // - converting to lowercase
   let urlPath = req.url.split("?")[0].toLowerCase();

   if (urlPath.length > 1 && urlPath.endsWith("/")) {
      urlPath = urlPath.slice(0, -1);
   }

   // maps clean routes to html files
   // "/" -> "/index.html"
   // "/about" -> "/about.html"
   // "/css/styles.css" -> "/css/styles.css"
   let filePath;

   // If request looks like a file (has an extension), serve it directly
   if (path.extname(urlPath)) {
      filePath = path.join(publicDir, urlPath);
   } else {
      // If it's a route, map to an HTML file
      if (urlPath === "/") {
         filePath = path.join(publicDir, "index.html");
      } else {
         filePath = path.join(publicDir, `${urlPath}.html`);
      }
   }

   if (!filePath.startsWith(publicDir)) {
      const notFoundPath = path.join(publicDir, "404.html");
      return serveStaticFile(res, notFoundPath, 404);
   }

   // Check existence; if missing, serve custom 404 page
   fs.stat(filePath, (err, stats) => {
      if (!err && stats.isFile()) {
         return serveStaticFile(res, filePath, 200);
      }

      const notFoundPath = path.join(publicDir, "404.html");
      fs.stat(notFoundPath, (nfErr, nfStats) => {
         if (!nfErr && nfStats.isFile()) {
            return serveStaticFile(res, notFoundPath, 404);
         }
         res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
         res.end("404 - Page Not Found");
      });
   });
});

server.listen(PORT, () => {
   console.log(`Server running at http://localhost:${PORT}`);
});