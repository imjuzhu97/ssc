const menuButton = document.querySelector(".menu-button");
const mobileNav = document.querySelector(".mobile-nav");
const navLinks = document.querySelectorAll(".mobile-nav a");

const setMenuState = (isOpen) => {
  document.body.classList.toggle("menu-open", isOpen);
  menuButton?.setAttribute("aria-expanded", String(isOpen));
};

if (menuButton && mobileNav) {
  menuButton.addEventListener("click", () => {
    const isExpanded = menuButton.getAttribute("aria-expanded") === "true";
    setMenuState(!isExpanded);
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => setMenuState(false));
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setMenuState(false);
    }
  });
}
