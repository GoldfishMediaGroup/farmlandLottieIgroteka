const config = {
  wrapperSelector: '.wrapper',
  animationPaths: {
    desktop: 'https://storage.yandexcloud.net/external-assets/tantum/lottie/igrotekaLottieDesk.lottie',
    mobile: 'https://storage.yandexcloud.net/external-assets/tantum/lottie/igrotekaLottieMob.lottie'
  },
  pauseDuration: 500,
  fadeDuration: 400,
  mobileScrollOffset: 300
};

let currentAnimation = null;
let lastIsMobile = isMobile();
let isClosed = false;
let isVisibleOnMobile = isMobile() ? window.scrollY >= config.mobileScrollOffset : true;

// хэлперы
function isMobile() {
  return window.innerWidth <= 767;
}

function getDOMElements() {
  const container = document.querySelector('.lottie-mascot-fullscreen');
  const animationWrapper = container ? container.querySelector('.lottie-animation-wrapper') : null;
  return { container, animationWrapper };
}

function stopAndDestroy(animation) {
  if (!animation) return;
  if (typeof animation.stop === 'function') animation.stop();
  if (typeof animation.destroy === 'function') animation.destroy();
}

document.addEventListener('DOMContentLoaded', async () => {
  addResponsiveStyles();
  renderLottieAnim();

  await initLottieLibraries();

  if (isVisibleOnMobile) {
    initLottieAnimation();
  }

  window.addEventListener('resize', handleResize);
  window.addEventListener('scroll', handleScroll);
});

//функция ресайза
function handleResize() {
  if (isClosed) return;

  const mobileNow = isMobile();
  if (mobileNow === lastIsMobile) return;

  lastIsMobile = mobileNow;

  stopAndDestroy(currentAnimation);
  currentAnimation = null;

  const { container, animationWrapper } = getDOMElements();
  if (animationWrapper) animationWrapper.innerHTML = '';

  isVisibleOnMobile = !mobileNow || window.scrollY >= config.mobileScrollOffset;

  if (isVisibleOnMobile) {
    initLottieAnimation();
  } else {
    if (container) container.style.opacity = '0';
    if (animationWrapper) animationWrapper.style.opacity = '0';
  }
}

//функция скрола
function handleScroll() {
  if (isClosed || !isMobile()) return;

  const { container, animationWrapper } = getDOMElements();
  if (!container || !animationWrapper) return;

  const shouldBeVisible = window.scrollY >= config.mobileScrollOffset;

  if (shouldBeVisible && !isVisibleOnMobile) {
    isVisibleOnMobile = true;
    initLottieAnimation();
  } else if (!shouldBeVisible && isVisibleOnMobile) {
    isVisibleOnMobile = false;

    container.style.opacity = '0';
    animationWrapper.style.opacity = '0';

    const oldAnimation = currentAnimation;
    currentAnimation = null;

    setTimeout(() => {
      stopAndDestroy(oldAnimation);
      if (animationWrapper) animationWrapper.innerHTML = '';
    }, config.fadeDuration);
  }
}

//функция клика по крестику
function handleClose(container) {
  isClosed = true;
  container.style.opacity = '0';

  const oldAnimation = currentAnimation;
  currentAnimation = null;

  setTimeout(() => {
    stopAndDestroy(oldAnimation);
  }, config.fadeDuration);
}

//добавление на страницу оберток, крестика, клика по крестику
function renderLottieAnim() {
  const wrapper = document.querySelector(config.wrapperSelector);
  if (!wrapper) return;

  const lottieContainer = document.createElement('div');
  lottieContainer.className = 'lottie-mascot-fullscreen';

  const lottieCloseBtn = document.createElement('button');
  lottieCloseBtn.className = 'lottie-close-btn';
  lottieCloseBtn.innerHTML = `<span class="lottie-close-icon">
    <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20.0466 0.835449L0.835328 20.0467M0.835327 0.835449L20.0466 20.0467" stroke="white" stroke-width="1.67054" stroke-linecap="round" />
    </svg>
  </span>`;
  lottieCloseBtn.addEventListener('click', () => handleClose(lottieContainer));
  lottieContainer.appendChild(lottieCloseBtn);

  const animationWrapper = document.createElement('div');
  animationWrapper.className = 'lottie-animation-wrapper';
  lottieContainer.appendChild(animationWrapper);

  wrapper.appendChild(lottieContainer);
}

//cама анимация
function initLottieAnimation() {
  if (isClosed) return;

  const mobileNow = isMobile();
  if (mobileNow && window.scrollY < config.mobileScrollOffset) return;

  const animationPath = mobileNow ? config.animationPaths.mobile : config.animationPaths.desktop;
  const { container, animationWrapper } = getDOMElements();
  if (!container || !animationWrapper) return;

  animationWrapper.innerHTML = '';
  animationWrapper.style.opacity = '0';

  const handleReady = (playFn) => {
    container.style.opacity = '1';
    animationWrapper.style.opacity = '1';
    playFn();
  };

  const handleComplete = (stopFn, playFn) => {
    if (isClosed) return;
    animationWrapper.style.opacity = '0';

    setTimeout(stopFn, config.fadeDuration);

    setTimeout(() => {
      if (isClosed) return;
      const currentMobile = isMobile();
      if (!currentMobile || window.scrollY >= config.mobileScrollOffset) {
        container.style.opacity = '1';
        animationWrapper.style.opacity = '1';
        playFn();
      }
    }, config.fadeDuration + config.pauseDuration);
  };

  if (animationPath.endsWith('.lottie') && window.DotLottieClass) {
    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    animationWrapper.appendChild(canvas);

    const dotLottie = new window.DotLottieClass({
      canvas: canvas,
      src: animationPath,
      loop: false,
      autoplay: false
    });

    currentAnimation = dotLottie;

    dotLottie.addEventListener('load', () => handleReady(() => dotLottie.play()));
    dotLottie.addEventListener('complete', () =>
      handleComplete(
        () => dotLottie.stop(),
        () => dotLottie.play()
      )
    );
  } else if (typeof lottie !== 'undefined') {
    const animation = lottie.loadAnimation({
      container: animationWrapper,
      renderer: 'svg',
      loop: false,
      autoplay: false,
      path: animationPath
    });

    currentAnimation = animation;

    animation.addEventListener('DOMLoaded', () => handleReady(() => animation.play()));
    animation.addEventListener('complete', () =>
      handleComplete(
        () => animation.goToAndStop(0, true),
        () => animation.play()
      )
    );
  }
}

//добавление библиотек
async function initLottieLibraries() {
  if (typeof lottie === 'undefined') {
    await new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js';
      script.onload = resolve;
      document.head.appendChild(script);
    });
  }
  try {
    const { DotLottie } = await import('https://cdn.jsdelivr.net/npm/@lottiefiles/dotlottie-web/+esm');
    window.DotLottieClass = DotLottie;
  } catch (e) {}
}

//добавление стилей
function addResponsiveStyles() {
  const style = document.createElement('style');
  style.textContent = `.lottie-mascot-fullscreen{right:20px;left:auto;bottom:140px;width:240px;height:240px;position:fixed;z-index:1035;pointer-events:none;pointer-events:none;opacity:0;transition:opacity .4s ease-in-out}.lottie-animation-wrapper{width:100%;height:100%;opacity:0;transition:opacity .4s ease-in-out}.lottie-close-btn{position:absolute;top:30px;right:10px;width:35px;aspect-ratio:1;background:rgba(0,0,0,.3);color:#fff;pointer-events:all;border-radius:50%;display:flex;align-items:center;justify-content:center;border:none;cursor:pointer;z-index:1110}.lottie-close-btn svg{width:14px;aspect-ratio:1}@media (max-width:48em){.lottie-mascot-fullscreen{left:50%;transform:translateX(-50%);right:auto;bottom:80px;width:150px;height:150px}.lottie-close-btn svg{width:10px}.lottie-close-btn{width:30px;top:0;right:0}}`;
  document.head.appendChild(style);
}
