/**
 * Rainmaker Weddings — entry point (every page).
 */
import gsap from 'gsap';
import { initSmoothScroll, initReveals, initParallax, initImageParallax, initScenes, initDrawScroll, reduced } from './js/core.js';
import { initHeader, initMenu, runIntro, initTransitions, initCursor } from './js/chrome.js';
import { initRainHero } from './js/rain.js';
import { initCrafts } from './js/hover.js';
import { initMedia, initForm, initFilters } from './js/media.js';
import { initDistort } from './js/distort.js';
import { initFlood } from './js/colour.js';
import { initDust } from './js/dust.js';
import { initShards } from './js/shards.js';
import { initOrbit } from './js/orbit.js';

initSmoothScroll();
initHeader();
initMenu();
initTransitions();
initCursor();
initMedia();
initForm();
initFilters();
initRainHero();
initFlood();
initDust();

initOrbit();
initCrafts();
initParallax();
initImageParallax();
initScenes();
initShards();
initDrawScroll();
runIntro().then(initReveals);
initDistort({ reduced, gsap });
