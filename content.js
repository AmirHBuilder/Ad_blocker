const removeAds = () => {
  const ads = document.querySelectorAll("ytd-ad-slot-renderer, .ytp-ad-module, .video-ads");
  ads.forEach(ad => ad.remove());
};

const observer = new MutationObserver(removeAds);
observer.observe(document, { childList: true, subtree: true });