/* =========================================================
   vibe.school — interactions & animation
   ========================================================= */

(function () {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- header & progress ---------- */

  const header = $("#header");
  const progressBar = $("#progressBar");

  function onScroll() {
    const y = window.scrollY || window.pageYOffset;
    header.classList.toggle("is-scrolled", y > 24);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progressBar.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- spotlight ---------- */

  const spotlight = $("#spotlight");
  let pointerX = window.innerWidth / 2;
  let pointerY = window.innerHeight / 2;

  if (finePointer) {
    window.addEventListener("pointermove", (e) => {
      pointerX = e.clientX;
      pointerY = e.clientY;
      document.body.classList.add("has-pointer");
      spotlight.style.transform = `translate3d(${pointerX}px, ${pointerY}px, 0)`;
    }, { passive: true });
  }

  /* ---------- mobile menu ---------- */

  const burger = $("#burger");
  const mobileMenu = $("#mobileMenu");
  const menuLinks = $$("a", mobileMenu);

  function setMenu(open) {
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
    mobileMenu.classList.toggle("is-open", open);
    mobileMenu.inert = !open;
    document.body.classList.toggle("is-locked", open);
  }

  burger.addEventListener("click", () => {
    setMenu(!mobileMenu.classList.contains("is-open"));
  });

  menuLinks.forEach((link) => link.addEventListener("click", () => setMenu(false)));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && mobileMenu.classList.contains("is-open")) {
      setMenu(false);
      burger.focus();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 1080) setMenu(false);
  });

  /* ---------- reveal on scroll ---------- */

  const revealItems = $$(".reveal");

  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -60px 0px" });

    revealItems.forEach((el) => io.observe(el));
  } else {
    revealItems.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------- animated counters ---------- */

  const counters = $$("[data-count]");

  function formatNumber(n) {
    return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  }

  function runCounter(el) {
    const target = Number(el.dataset.count);
    const suffix = el.dataset.suffix || "";
    if (reduceMotion) {
      el.textContent = formatNumber(target) + suffix;
      return;
    }
    const duration = 1700;
    const start = performance.now();

    function tick(now) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = formatNumber(target * eased) + suffix;
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = formatNumber(target) + suffix;
    }

    requestAnimationFrame(tick);
  }

  if ("IntersectionObserver" in window) {
    const counterIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        runCounter(entry.target);
        counterIO.unobserve(entry.target);
      });
    }, { threshold: 0.5 });

    counters.forEach((el) => counterIO.observe(el));
  } else {
    counters.forEach(runCounter);
  }

  /* ---------- steps line ---------- */

  const steps = $(".steps");
  const stepsLine = $("#stepsLine");

  if (steps && stepsLine && "IntersectionObserver" in window) {
    const lineIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        stepsLine.style.width = "100%";
        lineIO.disconnect();
      });
    }, { threshold: 0.4 });
    lineIO.observe(steps);
  }

  /* ---------- showcase tabs ---------- */

  const tabs = $$(".showcase__tab");
  const panels = $$(".showcase__panel");

  function activateTab(tab) {
    tabs.forEach((t) => {
      const active = t === tab;
      t.classList.toggle("is-active", active);
      t.setAttribute("aria-selected", String(active));
      t.tabIndex = active ? 0 : -1;
    });
    const panel = $("#panel-" + tab.dataset.tab);
    panels.forEach((p) => p.classList.toggle("is-active", p === panel));
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => activateTab(tab));
    tab.addEventListener("keydown", (e) => {
      let next = null;
      if (e.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
      if (e.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
      if (e.key === "Home") next = tabs[0];
      if (e.key === "End") next = tabs[tabs.length - 1];
      if (!next) return;
      e.preventDefault();
      activateTab(next);
      next.focus();
    });
  });

  /* ---------- reviews carousel ---------- */

  const track = $("#reviewsTrack");
  const prevBtn = $("#reviewsPrev");
  const nextBtn = $("#reviewsNext");
  const dotsWrap = $("#reviewsDots");
  let reviewCards = track ? $$(".review", track) : [];
  let dots = [];

  function stepSize() {
    if (!reviewCards.length) return 0;
    const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || 18);
    return reviewCards[0].getBoundingClientRect().width + gap;
  }

  function buildDots() {
    if (!dotsWrap) return;
    dotsWrap.innerHTML = "";
    dots = reviewCards.map((_, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", "Отзыв " + (i + 1));
      b.addEventListener("click", () => track.scrollTo({ left: i * stepSize(), behavior: "smooth" }));
      dotsWrap.appendChild(b);
      return b;
    });
    updateDots();
  }

  function updateDots() {
    if (!track || !reviewCards.length) return;
    const index = Math.round(track.scrollLeft / stepSize());
    dots.forEach((dot, i) => dot.classList.toggle("is-active", i === index));
  }

  function scrollReviews(dir) {
    if (!track) return;
    track.scrollBy({ left: dir * stepSize(), behavior: "smooth" });
  }

  if (track) {
    prevBtn.addEventListener("click", () => scrollReviews(-1));
    nextBtn.addEventListener("click", () => scrollReviews(1));

    let raf = null;
    track.addEventListener("scroll", () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        updateDots();
        raf = null;
      });
    }, { passive: true });

    buildDots();
    window.addEventListener("resize", buildDots);
  }

  /* ---------- accordion ---------- */

  const accs = $$(".acc");

  accs.forEach((acc) => {
    const head = $(".acc__head", acc);
    head.addEventListener("click", () => {
      const isOpen = acc.classList.contains("acc--open");
      accs.forEach((other) => {
        other.classList.remove("acc--open");
        $(".acc__head", other).setAttribute("aria-expanded", "false");
      });
      if (!isOpen) {
        acc.classList.add("acc--open");
        head.setAttribute("aria-expanded", "true");
      }
    });
  });

  /* ---------- billing toggle ---------- */

  const billingButtons = $$(".billing__btn");
  const prices = $$(".plan__now");
  const notes = $$(".plan__note");

  billingButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const mode = btn.dataset.billing;
      billingButtons.forEach((b) => {
        const active = b === btn;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-pressed", String(active));
      });
      prices.forEach((p) => { p.textContent = p.dataset[mode] || p.textContent; });
      notes.forEach((n) => { n.textContent = n.dataset[mode] || n.textContent; });
    });
  });

  /* ---------- pricing → form plan ---------- */

  const planSelect = $("#plan");
  $$("[data-plan]").forEach((link) => {
    link.addEventListener("click", () => {
      if (!planSelect) return;
      const value = link.dataset.plan;
      if (Array.from(planSelect.options).some((o) => o.value === value)) {
        planSelect.value = value;
      }
    });
  });

  /* ---------- countdown ---------- */

  const cd = {
    days: $("#cdDays"),
    hours: $("#cdHours"),
    minutes: $("#cdMinutes"),
    seconds: $("#cdSeconds")
  };

  if (cd.days) {
    let target = new Date("2026-11-12T10:00:00+03:00").getTime();
    if (!Number.isFinite(target) || target - Date.now() < 0) {
      target = Date.now() + 1000 * 60 * 60 * 24 * 9 + 1000 * 60 * 60 * 14;
    }

    const pad = (n) => String(n).padStart(2, "0");

    function tickCountdown() {
      const diff = Math.max(0, target - Date.now());
      const sec = Math.floor(diff / 1000);
      cd.days.textContent = pad(Math.floor(sec / 86400));
      cd.hours.textContent = pad(Math.floor((sec % 86400) / 3600));
      cd.minutes.textContent = pad(Math.floor((sec % 3600) / 60));
      cd.seconds.textContent = pad(sec % 60);
    }

    tickCountdown();
    setInterval(tickCountdown, 1000);
  }

  /* ---------- typing in the hero prompt ---------- */

  const typingEl = $("#typingText");
  const phrases = [
    "Сделай лендинг для кофейни с формой записи",
    "Добавь тёмную тему и плавные анимации",
    "Подключи оплату и отправь письмо клиенту",
    "Разверни проект на моём домене"
  ];

  if (typingEl) {
    if (reduceMotion) {
      typingEl.textContent = phrases[0];
    } else {
      let phraseIndex = 0;
      let charIndex = 0;
      let deleting = false;

      function typeLoop() {
        const phrase = phrases[phraseIndex];
        if (!deleting) {
          charIndex++;
          typingEl.textContent = phrase.slice(0, charIndex);
          if (charIndex === phrase.length) {
            deleting = true;
            setTimeout(typeLoop, 1900);
            return;
          }
          setTimeout(typeLoop, 34 + Math.random() * 34);
        } else {
          charIndex--;
          typingEl.textContent = phrase.slice(0, charIndex);
          if (charIndex === 0) {
            deleting = false;
            phraseIndex = (phraseIndex + 1) % phrases.length;
            setTimeout(typeLoop, 420);
            return;
          }
          setTimeout(typeLoop, 16);
        }
      }

      setTimeout(typeLoop, 900);
    }
  }

  /* ---------- card glow follow + tilt ---------- */

  const glowCards = $$(".glow-card, .week");
  glowCards.forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--mx", ((e.clientX - rect.left) / rect.width * 100) + "%");
      card.style.setProperty("--my", ((e.clientY - rect.top) / rect.height * 100) + "%");
    });
  });

  if (finePointer && !reduceMotion && window.innerWidth > 960) {
    $$(".tilt").forEach((card) => {
      const strength = card.classList.contains("browser-wrap") ? 8 : 6;
      card.addEventListener("pointermove", (e) => {
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(1000px) rotateX(${(-py * strength).toFixed(2)}deg) rotateY(${(px * strength).toFixed(2)}deg)`;
      });
      card.addEventListener("pointerleave", () => {
        card.style.transform = "";
      });
    });
  }

  /* ---------- magnetic buttons ---------- */

  if (finePointer && !reduceMotion) {
    $$(".magnetic").forEach((btn) => {
      btn.addEventListener("pointermove", (e) => {
        const rect = btn.getBoundingClientRect();
        const x = (e.clientX - rect.left - rect.width / 2) * 0.18;
        const y = (e.clientY - rect.top - rect.height / 2) * 0.28;
        btn.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      });
      btn.addEventListener("pointerleave", () => {
        btn.style.transform = "";
      });
    });
  }

  /* ---------- form validation ---------- */

  const form = $("#joinForm");
  const success = $("#joinSuccess");
  const again = $("#joinAgain");

  function setError(field, hasError) {
    if (!field) return;
    field.classList.toggle("has-error", hasError);
  }

  function validate() {
    if (!form) return false;

    const name = $("#name");
    const contact = $("#contact");
    const email = $("#email");
    const consent = form.querySelector('input[name="consent"]');

    const nameOk = name.value.trim().length >= 2;
    const contactValue = contact.value.trim();
    const contactOk = /^(@[A-Za-z0-9_]{4,}|[+\d][\d\s()\-]{8,})$/.test(contactValue);
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim());
    const consentOk = consent.checked;

    setError(name.closest(".field"), !nameOk);
    setError(contact.closest(".field"), !contactOk);
    setError(email.closest(".field"), !emailOk);
    setError(consent.closest(".consent"), !consentOk);

    if (!nameOk) { name.focus(); return false; }
    if (!contactOk) { contact.focus(); return false; }
    if (!emailOk) { email.focus(); return false; }
    if (!consentOk) { consent.focus(); return false; }
    return true;
  }

  if (form) {
    form.querySelectorAll("input").forEach((input) => {
      input.addEventListener("input", () => {
        const wrap = input.closest(".field") || input.closest(".consent");
        if (wrap) wrap.classList.remove("has-error");
      });
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!validate()) return;

      form.hidden = true;
      success.hidden = false;
      burstConfetti(window.innerWidth / 2, Math.max(160, window.innerHeight * 0.28));
    });
  }

  if (again) {
    again.addEventListener("click", () => {
      success.hidden = true;
      form.hidden = false;
      form.reset();
      const first = $("#name");
      if (first) first.focus();
    });
  }

  /* ---------- confetti ---------- */

  const confettiCanvas = $("#confetti");

  function burstConfetti(x, y) {
    if (!confettiCanvas || reduceMotion) return;
    const ctx = confettiCanvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    confettiCanvas.width = window.innerWidth * dpr;
    confettiCanvas.height = window.innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const colors = ["#a78bfa", "#22d3ee", "#f472b6", "#6ee7b7", "#60a5fa", "#f9a8d4"];
    const pieces = Array.from({ length: 140 }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 9;
      return {
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 4,
        w: 4 + Math.random() * 6,
        h: 6 + Math.random() * 8,
        rot: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.3,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1
      };
    });

    let raf = null;
    function frame() {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      let alive = false;
      pieces.forEach((p) => {
        if (p.life <= 0) return;
        alive = true;
        p.vy += 0.22;
        p.vx *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.spin;
        p.life -= 0.008;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
      if (alive) raf = requestAnimationFrame(frame);
      else {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        cancelAnimationFrame(raf);
      }
    }

    cancelAnimationFrame(raf);
    frame();
  }

  /* ---------- particle field ---------- */

  const canvas = $("#field");

  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext("2d");
    let width = 0;
    let height = 0;
    let particles = [];
    let raf = null;
    const colors = ["139,92,246", "34,211,238", "244,114,182", "110,231,183", "96,165,250"];

    function resizeField() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.min(80, Math.max(26, Math.round((width * height) / 24000)));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.26,
        vy: (Math.random() - 0.5) * 0.26,
        r: Math.random() * 1.5 + 0.5,
        c: colors[Math.floor(Math.random() * colors.length)]
      }));
    }

    function drawField() {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;
        if (p.y < -20) p.y = height + 20;
        if (p.y > height + 20) p.y = -20;

        const dx = p.x - pointerX;
        const dy = p.y - pointerY;
        const dist = Math.hypot(dx, dy);

        if (dist < 150) {
          const force = (150 - dist) / 150;
          p.x += (dx / (dist || 1)) * force * 0.7;
          p.y += (dy / (dist || 1)) * force * 0.7;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(" + p.c + ",0.7)";
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const d = Math.hypot(p.x - q.x, p.y - q.y);
          if (d < 118) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = "rgba(" + p.c + "," + (0.16 * (1 - d / 118)).toFixed(3) + ")";
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }

      raf = requestAnimationFrame(drawField);
    }

    resizeField();
    drawField();
    window.addEventListener("resize", resizeField);

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else raf = requestAnimationFrame(drawField);
    });
  }

  /* ---------- parallax auroras ---------- */

  const auroras = $$(".aurora");

  if (finePointer && !reduceMotion && auroras.length) {
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    window.addEventListener("pointermove", (e) => {
      targetX = (e.clientX / window.innerWidth - 0.5) * 26;
      targetY = (e.clientY / window.innerHeight - 0.5) * 22;
    }, { passive: true });

    (function parallaxLoop() {
      currentX += (targetX - currentX) * 0.045;
      currentY += (targetY - currentY) * 0.045;
      auroras.forEach((aurora, i) => {
        const factor = (i + 1) * 0.5;
        aurora.style.setProperty("--px", currentX * factor + "px");
        aurora.style.setProperty("--py", currentY * factor + "px");
      });
      requestAnimationFrame(parallaxLoop);
    })();
  }
})();
