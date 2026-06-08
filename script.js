const menuButton = document.querySelector(".menu-button");
const mobileNav = document.querySelector(".mobile-nav");
const navLinks = document.querySelectorAll(".mobile-nav a");
const pastEventsSection = document.querySelector(".past-events-section");
const pastEventsToggle = document.querySelector(".past-events-toggle");
const eventGrid = document.querySelector(".event-grid");
const pastEventList = document.querySelector(".past-event-list");
const heroGalleryTrack = document.querySelector(".hero-gallery-track");
const hostedEventStats = document.querySelectorAll("[data-stat-hosted]");
const matchedCoupleStats = document.querySelectorAll("[data-stat-matched]");
const eventsSummaries = document.querySelectorAll("[data-events-summary]");
const pastSummaries = document.querySelectorAll("[data-past-summary]");

const setMenuState = (isOpen) => {
  document.body.classList.toggle("menu-open", isOpen);
  menuButton?.setAttribute("aria-expanded", String(isOpen));
};

const createElement = (tagName, className, text) => {
  const element = document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  if (text) {
    element.textContent = text;
  }

  return element;
};

const renderUpcomingEvents = (events) => {
  if (!eventGrid || !events?.length) {
    return;
  }

  eventGrid.replaceChildren();

  events.forEach((event, index) => {
    const article = createElement("article", `event-card${index === 0 ? " featured-event" : ""}`);
    const image = createElement("img");
    const body = createElement("div", "event-card-body");
    const details = createElement("dl");
    const time = createElement("div");
    const seats = createElement("div");
    const cta = createElement("a", "button button-dark", event.ctaLabel);

    image.src = event.image;
    image.alt = event.imageAlt;

    body.append(
      createElement("span", "tag", event.dateLabel),
      createElement("h3", "", event.title),
      createElement("p", "", `@ ${event.venue}`),
    );

    time.append(createElement("dt", "", "Time"), createElement("dd", "", event.time));
    seats.append(createElement("dt", "", "Seats"), createElement("dd", "", event.seats));
    details.append(time, seats);

    cta.href = event.ctaUrl;
    body.append(details, cta);
    article.append(image, body);
    eventGrid.append(article);
  });
};

const renderPastEvents = (events) => {
  if (!pastEventList || !events?.length) {
    return;
  }

  pastEventList.replaceChildren();

  let currentYear = "";
  let eventCount = 0;

  events.forEach((event) => {
    const year = event.date.slice(0, 4);

    if (year !== currentYear) {
      const yearRow = createElement("li", "past-event-year", year);

      if (eventCount >= 3) {
        yearRow.dataset.pastExtra = "";
      }

      pastEventList.append(yearRow);
      currentYear = year;
    }

    const row = createElement("li", "past-event-row");
    const date = createElement("time", "", event.dateLabel);
    const titleWrap = createElement("div");
    const title = createElement("h4", "", event.title);
    const stats = createElement("p", "", event.stats);

    date.dateTime = event.date;
    titleWrap.append(title);
    row.append(date, titleWrap, stats);

    if (eventCount >= 3) {
      row.dataset.pastExtra = "";
    }

    pastEventList.append(row);
    eventCount += 1;
  });
};

const renderEventStats = (stats) => {
  if (!stats) {
    return;
  }

  const summary = `${stats.hostedEvents} events, ${stats.matchedCouples} couples matched`;

  hostedEventStats.forEach((element) => {
    element.textContent = stats.hostedEvents;
  });

  matchedCoupleStats.forEach((element) => {
    element.textContent = stats.matchedCouples;
  });

  eventsSummaries.forEach((element) => {
    element.textContent = `${summary} so far.`;
  });

  pastSummaries.forEach((element) => {
    element.textContent = `${summary}.`;
  });
};

const enableMouseDragGallery = (track) => {
  if (!track) {
    return;
  }

  let isDragging = false;
  let startX = 0;
  let startScrollLeft = 0;

  track.addEventListener("dragstart", (event) => {
    event.preventDefault();
  });

  track.addEventListener("pointerdown", (event) => {
    if (event.pointerType !== "mouse" || event.button !== 0) {
      return;
    }

    isDragging = true;
    startX = event.clientX;
    startScrollLeft = track.scrollLeft;
    track.classList.add("is-dragging");
    track.setPointerCapture(event.pointerId);
  });

  track.addEventListener("pointermove", (event) => {
    if (!isDragging) {
      return;
    }

    event.preventDefault();
    track.scrollLeft = startScrollLeft - (event.clientX - startX);
  });

  const endDrag = (event) => {
    if (!isDragging) {
      return;
    }

    isDragging = false;
    track.classList.remove("is-dragging");

    if (track.hasPointerCapture(event.pointerId)) {
      track.releasePointerCapture(event.pointerId);
    }
  };

  track.addEventListener("pointerup", endDrag);
  track.addEventListener("pointercancel", endDrag);
  track.addEventListener("lostpointercapture", () => {
    isDragging = false;
    track.classList.remove("is-dragging");
  });
};

enableMouseDragGallery(heroGalleryTrack);

if (window.SSC_EVENTS) {
  renderEventStats(window.SSC_EVENTS.stats);
  renderUpcomingEvents(window.SSC_EVENTS.upcoming);
  renderPastEvents(window.SSC_EVENTS.past);
}

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

if (pastEventsSection && pastEventsToggle) {
  pastEventsToggle.addEventListener("click", () => {
    const isCollapsed = pastEventsSection.classList.toggle("collapsed");
    pastEventsToggle.setAttribute("aria-expanded", String(!isCollapsed));
    pastEventsToggle.textContent = isCollapsed ? "Expand more" : "Show less";
  });
}
