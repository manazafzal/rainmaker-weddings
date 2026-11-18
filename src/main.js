/**
 * Rainmaker Weddings — entry point (every page).
 */
import gsap from 'gsap';
import { initSmoothScroll, initReveals, initParallax, initDrawScroll, reduced } from './js/core.js';
import { initHeader, initMenu, runIntro, initTransitions, initCursor, initMagnetic } from './js/chrome.js';
import { initRainHero } from './js/rain.js';
import { initWorlds, initCrafts } from './js/hover.js';
import { initMedia, initForm, initFilters } from './js/media.js';
import { initDistort } from './js/distort.js';

initSmoothScroll();
initHeader();
initMenu();
initTransitions();
initCursor();
initMagnetic();
initMedia();
initForm();
initFilters();
initRainHero();
initWorlds();
initCrafts();
initParallax();
initDrawScroll();
runIntro().then(initReveals);
initDistort({ reduced, gsap });
