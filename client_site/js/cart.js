/*
Name: Emmanuel Giron
Date: February 12, 2026
Description: Single-page checkout system (React right now would've been so much easier)
-- 
// - Mock cart items (tools)
// - Step navigation (Cart -> Schedule -> Delivery -> Review)
// - Basic validations: cart not empty, schedule valid, address "verified"
// - Placeholder totals/duration strings

NOTE::::: As a temporary (future) solution when we have a working backend; Reservations could just be quotes with no payment - 
- and a email of the reservation info can be sent to the client (Rocket Rentals), so upon delivery actual payment can be handled. 
 >> So incase you are wondering - no admin dashboard yet for this regard.
*/


// IIFE approach, making functionality encapsulated in this scope, so future / other js files (running on the page) functionality do not clash.
(function () {
   // Mock data
   let cart = [
      { id: "tool-1", name: "Impact Driver", dailyRate: "XX", deposit: "XX", qty: 1 },
      { id: "tool-2", name: "Circular Saw", dailyRate: "XX", deposit: "XX", qty: 1 },
      { id: "tool-3", name: "Rotary Hammer", dailyRate: "XX", deposit: "XX", qty: 1 },
   ];

   // =+=+=+=+=+=+=+=+=+=+=+=
   //    Handle DOM
   // =+=+=+=+=+=+=+=+=+=+=+=
   const cartList = document.getElementById("cartList");
   const cartEmpty = document.getElementById("cartEmpty");

   const steps = {
      1: document.getElementById("stepCart"),
      2: document.getElementById("stepSchedule"),
      3: document.getElementById("stepDelivery"),
      4: document.getElementById("stepReview"),
   };

   const stepperEls = Array.from(document.querySelectorAll(".step"));

   const toScheduleBtn = document.getElementById("toScheduleBtn");
   const backToCartBtn = document.getElementById("backToCartBtn");
   const toDeliveryBtn = document.getElementById("toDeliveryBtn");
   const backToScheduleBtn = document.getElementById("backToScheduleBtn");
   const toReviewBtn = document.getElementById("toReviewBtn");
   const backToDeliveryBtn = document.getElementById("backToDeliveryBtn");

   const verifyAddressBtn = document.getElementById("verifyAddressBtn");
   const verifyStatus = document.getElementById("verifyStatus");

   const confirmBtn = document.getElementById("confirmBtn");
   const confirmResult = document.getElementById("confirmResult");

   // Schedule inputs
   const deliveryDate = document.getElementById("deliveryDate");
   const deliveryTime = document.getElementById("deliveryTime");
   const pickupDate = document.getElementById("pickupDate");
   const pickupTime = document.getElementById("pickupTime");

   // Summary fields
   const subtotalVal = document.getElementById("subtotalVal");
   const deliveryFeeVal = document.getElementById("deliveryFeeVal");
   const depositVal = document.getElementById("depositVal");
   const totalVal = document.getElementById("totalVal");
   const durationVal = document.getElementById("durationVal");

   // Requirements checklist
   const reqCart = document.getElementById("reqCart");
   const reqSchedule = document.getElementById("reqSchedule");
   const reqAddress = document.getElementById("reqAddress");

   // Review blocks
   const reviewTools = document.getElementById("reviewTools");
   const reviewSchedule = document.getElementById("reviewSchedule");
   const reviewDelivery = document.getElementById("reviewDelivery");

   // Delivery inputs
   const deliveryName = document.getElementById("deliveryName");
   const deliveryPhone = document.getElementById("deliveryPhone");
   const deliveryAddress = document.getElementById("deliveryAddress");
   const deliveryUnit = document.getElementById("deliveryUnit");
   const deliveryZip = document.getElementById("deliveryZip");
   const notes = document.getElementById("notes");

   // State
   let currentStep = 1;
   let addressVerified = false;

   // =+=+=+=+=+=+=+=+=+=+=+=
   // Helpers Functions 
   // =+=+=+=+=+=+=+=+=+=+=+=
   function setStep(stepNum) {
      currentStep = stepNum;

      Object.entries(steps).forEach(([k, el]) => {
         const isActive = Number(k) === stepNum;
         el.hidden = !isActive;
         el.classList.toggle("active", isActive);
      });

      stepperEls.forEach((s) => {
         const isActive = Number(s.dataset.step) === stepNum;
         s.classList.toggle("active", isActive);
      });

      // keep checklist updated
      refreshRequirements();
      refreshSummary();
   }

   function renderCart() {
      if (!cart.length) {
         cartEmpty.hidden = false;
         cartList.hidden = true;
         return;
      }

      cartEmpty.hidden = true;
      cartList.hidden = false;

      cartList.innerHTML = cart
         .map((item) => {
            return `
          <div class="cart-item" data-id="${item.id}">
            <div>
              <h3 class="item-title">${item.name}</h3>
              <div class="item-meta">
                <span>Daily: $${item.dailyRate}</span>
                <span>Deposit: $${item.deposit}</span>
              </div>
            </div>

            <div class="qty-controls" aria-label="Quantity controls for ${item.name}">
              <button class="qty-btn" type="button" data-action="dec" aria-label="Decrease quantity">−</button>
              <span class="qty-val" aria-label="Quantity value">${item.qty}</span>
              <button class="qty-btn" type="button" data-action="inc" aria-label="Increase quantity">+</button>
              <button class="remove-btn" type="button" data-action="remove" aria-label="Remove item">Remove</button>
            </div>
          </div>
        `;
         })
         .join("");

      // bind events
      cartList.querySelectorAll(".cart-item").forEach((row) => {
         row.addEventListener("click", (e) => {
            const btn = e.target.closest("button");
            if (!btn) return;

            const id = row.dataset.id;
            const action = btn.dataset.action;
            if (!id || !action) return;

            if (action === "inc") changeQty(id, +1);
            if (action === "dec") changeQty(id, -1);
            if (action === "remove") removeItem(id);
         });
      });
   }

   function changeQty(id, delta) {
      cart = cart.map((it) => {
         if (it.id !== id) return it;
         const next = Math.max(1, it.qty + delta);
         return { ...it, qty: next };
      });
      renderCart();
      refreshSummary();
   }

   function removeItem(id) {
      cart = cart.filter((it) => it.id !== id);
      renderCart();
      refreshRequirements();
      refreshSummary();
   }

   function refreshRequirements() {
      // Cart requirement
      const hasItems = cart.length > 0;
      reqCart.classList.toggle("ok", hasItems);

      // Schedule requirement
      const scheduleOk = isScheduleValid().ok;
      reqSchedule.classList.toggle("ok", scheduleOk);

      // Address requirement
      reqAddress.classList.toggle("ok", addressVerified);
   }

   function isScheduleValid() {
      const dDate = deliveryDate.value;
      const dTime = deliveryTime.value;
      const pDate = pickupDate.value;
      const pTime = pickupTime.value;

      if (!dDate || !dTime || !pDate || !pTime) {
         return { ok: false, msg: "Missing delivery/pickup date or time." };
      }

      const start = new Date(`${dDate}T${dTime}`);
      const end = new Date(`${pDate}T${pTime}`);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
         return { ok: false, msg: "Invalid date/time." };
      }

      if (end <= start) {
         return { ok: false, msg: "Pickup must be after delivery." };
      }

      return { ok: true, msg: "" };
   }

   function computeDurationLabel() {
      const check = isScheduleValid();
      if (!check.ok) return "—";

      const start = new Date(`${deliveryDate.value}T${deliveryTime.value}`);
      const end = new Date(`${pickupDate.value}T${pickupTime.value}`);
      const ms = end - start;

      const hours = Math.ceil(ms / (1000 * 60 * 60));
      const days = Math.ceil(hours / 24);

      // For rentals, days is usually the billing unit (placeholder)
      // Will need to incorporate varying hour rates (4hr min, 6hr, etc.)
      return `${days} day(s) (≈ ${hours} hours)`;
   }

   function refreshSummary() {
      // placeholder values — you’ll swap these later
      subtotalVal.textContent = "$XX.XX";
      deliveryFeeVal.textContent = "$XX.XX";
      depositVal.textContent = "$XX.XX";
      totalVal.textContent = "$XX.XX";

      durationVal.textContent = computeDurationLabel();
   }

   function fillReview() {
      // tools
      reviewTools.innerHTML = cart
         .map((it) => `• ${it.name} (qty ${it.qty}) — Daily $${it.dailyRate}, Deposit $${it.deposit}`)
         .join("<br />");

      // schedule
      const dur = computeDurationLabel();
      reviewSchedule.innerHTML = `
      <strong>Delivery:</strong> ${deliveryDate.value || "—"} at ${deliveryTime.value || "—"}<br/>
      <strong>Pickup:</strong> ${pickupDate.value || "—"} at ${pickupTime.value || "—"}<br/>
      <strong>Duration:</strong> ${dur}
      ${notes.value ? `<br/><strong>Notes:</strong> ${escapeHtml(notes.value)}` : ""}
    `;

      // delivery
      reviewDelivery.innerHTML = `
      <strong>Name:</strong> ${escapeHtml(deliveryName.value || "—")}<br/>
      <strong>Phone:</strong> ${escapeHtml(deliveryPhone.value || "—")}<br/>
      <strong>Address:</strong> ${escapeHtml(deliveryAddress.value || "—")} ${deliveryUnit.value ? `(${escapeHtml(deliveryUnit.value)})` : ""}<br/>
      <strong>ZIP:</strong> ${escapeHtml(deliveryZip.value || "—")}<br/>
      <strong>Verified:</strong> ${addressVerified ? "Yes" : "No (placeholder)"}
    `;
   }

   function escapeHtml(str) {
      return String(str)
         .replaceAll("&", "&amp;")
         .replaceAll("<", "&lt;")
         .replaceAll(">", "&gt;")
         .replaceAll('"', "&quot;")
         .replaceAll("'", "&#039;");
   }

   function requireCartOrStop() {
      if (cart.length === 0) {
         alert("Your cart is empty.");
         return false;
      }
      return true;
   }

   function requireScheduleOrStop() {
      const check = isScheduleValid();
      if (!check.ok) {
         alert(check.msg);
         return false;
      }
      return true;
   }

   function requireAddressVerifiedOrStop() {
      if (!addressVerified) {
         alert("Please verify your delivery address (placeholder).");
         return false;
      }
      return true;
   }

   // =+=+=+=+=+=+=+=+=+=+=+=
   // Events (Step navigation)
   // =+=+=+=+=+=+=+=+=+=+=+=
   toScheduleBtn.addEventListener("click", () => {
      if (!requireCartOrStop()) return;
      setStep(2);
   });

   backToCartBtn.addEventListener("click", () => setStep(1));

   toDeliveryBtn.addEventListener("click", () => {
      if (!requireScheduleOrStop()) return;
      setStep(3);
   });

   backToScheduleBtn.addEventListener("click", () => setStep(2));

   toReviewBtn.addEventListener("click", () => {
      if (!requireScheduleOrStop()) return;
      if (!requireAddressVerifiedOrStop()) return;

      fillReview();
      setStep(4);
   });

   backToDeliveryBtn.addEventListener("click", () => setStep(3));

   // Address verify (placeholder)
   verifyAddressBtn.addEventListener("click", () => {
      const hiddenAddress = document.getElementById("deliveryAddress");
      if (!hiddenAddress || !hiddenAddress.value.trim()) {
         alert("Pick an address from the suggestions first.");
         return;
      }
      // If you still want manual verify:
      addressVerified = true;
      verifyStatus.textContent = "Verified";
      verifyStatus.classList.add("ok");
      refreshRequirements();
   });

   // Confirm (mock)
   confirmBtn.addEventListener("click", () => {
      fillReview();
      confirmResult.hidden = false;
      confirmBtn.disabled = true;
      confirmBtn.textContent = "Confirmed";
   });

   // Update summary when schedule changes
   [deliveryDate, deliveryTime, pickupDate, pickupTime].forEach((el) => {
      el.addEventListener("change", () => {
         refreshRequirements();
         refreshSummary();
      });
   });

   // =+=+=+=+=+=+=+=+=+=+=+=
   // Initialize it all !
   // =+=+=+=+=+=+=+=+=+=+=+=
   renderCart();
   refreshRequirements();
   refreshSummary();
   setStep(1);

   // ref : https://developers.google.com/maps/documentation/javascript/examples/places-autocomplete


   // =+=+=+=+=+=+=+=+=+=+=+=
   // BIG help from GPT + Documentation in order to get this working
   // =+=+=+=+=+=+=+=+=+=+=+=
   async function initPlacesElement() {
      // Request needed libraries (new pattern).
      await google.maps.importLibrary("places"); // :contentReference[oaicite:2]{index=2}

      const mount = document.getElementById("deliveryAddressEl");
      if (!mount) return;

      // Create the new Place Autocomplete Element and mount it
      const placeAutocomplete = new google.maps.places.PlaceAutocompleteElement({});
      mount.appendChild(placeAutocomplete); // :contentReference[oaicite:3]{index=3}

      // When a prediction is selected...
      // (The sample listens for 'gmp-select' and converts prediction -> place -> fetchFields) :contentReference[oaicite:4]{index=4}
      placeAutocomplete.addEventListener("gmp-select", async ({ placePrediction }) => {
         const place = placePrediction.toPlace();
         await place.fetchFields({ fields: ["displayName", "formattedAddress", "location"] }); // :contentReference[oaicite:5]{index=5}

         // Save the formatted address into your hidden input so the rest of your checkout works.
         const hiddenAddress = document.getElementById("deliveryAddress");
         if (hiddenAddress) hiddenAddress.value = place.formattedAddress || "";

         // Auto-verify if selection is real
         addressVerified = true;
         verifyStatus.textContent = "Verified";
         verifyStatus.classList.add("ok");

         refreshRequirements();
      });
   }

   // Wait until the Maps script loader finishes, then init.
   (async function bootPlaces() {
      // If the Maps script hasn't loaded yet, poll briefly.
      // (Simple approach so you don't need to restructure your whole file.)
      const maxTries = 40;
      let tries = 0;

      const timer = setInterval(async () => {
         tries++;
         if (window.google && google.maps && google.maps.importLibrary) {
            clearInterval(timer);
            try {
               await initPlacesElement();
            } catch (e) {
               console.error("Places init failed:", e);
            }
         }
         if (tries >= maxTries) clearInterval(timer);
      }, 100);
   })();

})();
