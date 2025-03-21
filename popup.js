document.addEventListener('DOMContentLoaded', () => {
  const startStopButton = document.getElementById('start-stop-btn');
  const whitelistButton = document.getElementById('add-to-whitelist');
  const siteInput = document.getElementById('site-input');
  const whitelistContainer = document.getElementById('whitelist-container');
  const errorMessage = document.getElementById('error-message');
  const themeToggle = document.getElementById('theme-toggle');
  const settingsToggle = document.getElementById('settings-toggle');
  const settingsContent = document.getElementById('settings-content');
  const languageSelect = document.getElementById('language-select');
  const notificationsToggle = document.getElementById('notifications-toggle');
  const autoUpdateToggle = document.getElementById('auto-update-toggle');
  const manualUpdateButton = document.getElementById('manual-update-btn');
  const manualUpdateSection = document.getElementById('manual-update-section');
  const versionSection = document.getElementById('version-section');
  const body = document.body;

  let isBlockingEnabled = false;
  let currentLanguage = 'en';
  let isDarkMode = false;
  let notificationsEnabled = false;
  let autoUpdateEnabled = false;
  let autoUpdateInterval = null;

  // ترجمه‌ها
  const translations = {
    en: {
      start: 'Start Blocking',
      stop: 'Stop Blocking',
      whitelist: 'Whitelist',
      add: 'Add',
      placeholder: 'Enter website',
      error: 'Error: Something went wrong!',
      alreadyInWhitelist: 'This site is already in the whitelist',
      addedToWhitelist: 'has been added to the whitelist.',
      removedFromWhitelist: 'has been removed from the whitelist.',
      settings: 'Settings',
      darkMode: 'Dark Mode',
      language: 'Language',
      notifications: 'Notifications',
      autoUpdate: 'Auto-Update',
      manualUpdate: 'Manual Update'
    },
    fa: {
      start: 'شروع مسدودسازی',
      stop: 'توقف مسدودسازی',
      whitelist: 'لیست سفید',
      add: 'افزودن',
      placeholder: 'آدرس سایت را وارد کنید',
      error: 'خطا: مشکلی پیش آمده است!',
      alreadyInWhitelist: 'این سایت از قبل در لیست سفید وجود دارد',
      addedToWhitelist: 'به لیست سفید اضافه شد.',
      removedFromWhitelist: 'از لیست سفید حذف شد.',
      settings: 'تنظیمات',
      darkMode: 'حالت تاریک',
      language: 'زبان',
      notifications: 'اعلان‌ها',
      autoUpdate: 'به‌روزرسانی خودکار',
      manualUpdate: 'به‌روزرسانی دستی'
    }
  };

  // تنظیم زبان و متن‌ها
  function setLanguage(lang) {
    currentLanguage = lang;
    if (lang === 'fa') {
      document.body.setAttribute('dir', 'rtl'); // تغییر جهت متن به راست‌به‌چپ برای فارسی
      document.getElementById('header').style.flexDirection = 'row-reverse'; // تغییر جهت چیدمان هدر
    } else {
      document.body.setAttribute('dir', 'ltr'); // تغییر جهت متن به چپ‌به‌راست برای انگلیسی
      document.getElementById('header').style.flexDirection = 'row'; // تغییر جهت چیدمان هدر
    }

    startStopButton.innerText = isBlockingEnabled ? translations[lang].stop : translations[lang].start;
    whitelistButton.innerText = translations[lang].add;
    siteInput.placeholder = translations[lang].placeholder;
    document.getElementById('title').innerText = 'AdBlocker';
    document.querySelector('#whitelist-section h3').innerText = translations[lang].whitelist;
    document.querySelector('#settings-toggle img').alt = translations[lang].settings;
    document.querySelector('.settings-item:nth-child(1) span').innerText = translations[lang].darkMode;
    document.querySelector('.settings-item:nth-child(2) span').innerText = translations[lang].language;
    document.querySelector('.settings-item:nth-child(3) span').innerText = translations[lang].notifications;
    document.querySelector('.settings-item:nth-child(4) span').innerText = translations[lang].autoUpdate;
    document.querySelector('.settings-item:nth-child(5) span').innerText = translations[lang].manualUpdate;

    // به‌روزرسانی دکمه استارت/استاپ و لیست سفید
    updateStartStopButton();
    updateWhitelist();
  }

  // به‌روزرسانی دکمه استارت/استوپ
  function updateStartStopButton() {
    chrome.storage.local.get(['isBlockingEnabled'], (data) => {
      isBlockingEnabled = data.isBlockingEnabled || false;
      if (isBlockingEnabled) {
        startStopButton.textContent = translations[currentLanguage].stop;
        startStopButton.classList.add('stop');
      } else {
        startStopButton.textContent = translations[currentLanguage].start;
        startStopButton.classList.remove('stop');
      }
    });
  }

  // تغییر وضعیت استارت/توقف
  startStopButton.addEventListener('click', () => {
    isBlockingEnabled = !isBlockingEnabled;
    chrome.storage.local.set({ isBlockingEnabled: isBlockingEnabled }, () => {
      updateStartStopButton();
      chrome.runtime.sendMessage({ action: 'toggle', status: isBlockingEnabled ? 'enable' : 'disable' }, (response) => {
        if (response.status === 'enabled' || response.status === 'disabled') {
          console.log('Blocking status updated successfully.');
        } else {
          showError(translations[currentLanguage].error);
        }
      });
    });
  });

  // افزودن سایت به لیست سفید
  whitelistButton.addEventListener('click', () => {
    const site = siteInput.value.trim();
    if (!site) {
      showError(translations[currentLanguage].placeholder);
      return;
    }
    chrome.storage.local.get('whitelist', (data) => {
      let whitelist = data.whitelist || [];
      if (whitelist.includes(site)) {
        showError(translations[currentLanguage].alreadyInWhitelist);
      } else {
        whitelist.push(site);
        chrome.storage.local.set({ whitelist: whitelist }, () => {
          updateWhitelist();
          showError(`${site} ${translations[currentLanguage].addedToWhitelist}`);
        });
      }
    });
    siteInput.value = '';
  });

  // به‌روزرسانی لیست سفید
  function updateWhitelist() {
    chrome.storage.local.get('whitelist', (data) => {
      const whitelist = data.whitelist || [];
      whitelistContainer.innerHTML = '';
      whitelist.forEach((site) => {
        const div = document.createElement('div');
        div.classList.add('whitelist-entry');
        div.innerHTML = `
          <span>${site.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
          <button class="remove" data-site="${site}">❌</button>
        `;
        whitelistContainer.appendChild(div);
      });
      document.querySelectorAll('.whitelist-entry .remove').forEach((button) => {
        button.addEventListener('click', (event) => {
          const siteToRemove = event.target.getAttribute('data-site');
          removeFromWhitelist(siteToRemove);
        });
      });
    });
  }

  // حذف سایت از لیست سفید
  function removeFromWhitelist(site) {
    chrome.storage.local.get('whitelist', (data) => {
      let whitelist = data.whitelist || [];
      whitelist = whitelist.filter((item) => item !== site);
      chrome.storage.local.set({ whitelist: whitelist }, () => {
        updateWhitelist();
        showError(`${site} ${translations[currentLanguage].removedFromWhitelist}`);
      });
    });
  }

  // نمایش خطا
  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    setTimeout(() => {
      errorMessage.style.display = 'none';
    }, 5000);
  }

  // تغییر حالت تاریک/روشن
  themeToggle.addEventListener('change', () => {
    isDarkMode = themeToggle.checked;
    chrome.storage.local.set({ isDarkMode: isDarkMode }, () => {
      updateTheme();
    });
  });

  // به‌روزرسانی حالت تاریک/روشن
  function updateTheme() {
    if (isDarkMode) {
      body.classList.add('dark-mode');
      themeToggle.checked = true;
    } else {
      body.classList.remove('dark-mode');
      themeToggle.checked = false;
    }
  }

  // تغییر وضعیت اعلان‌ها
  notificationsToggle.addEventListener('change', () => {
    notificationsEnabled = notificationsToggle.checked;
    chrome.storage.local.set({ notificationsEnabled: notificationsEnabled });
  });

  // تغییر وضعیت به‌روزرسانی خودکار
  autoUpdateToggle.addEventListener('change', () => {
    autoUpdateEnabled = autoUpdateToggle.checked;
    chrome.storage.local.set({ autoUpdateEnabled: autoUpdateEnabled });

    // پنهان یا نمایش گزینه Manual Update بر اساس وضعیت Auto-Update
    if (autoUpdateEnabled) {
      manualUpdateSection.style.display = 'none'; // پنهان کردن Manual Update
      startAutoUpdate(); // شروع به‌روزرسانی خودکار
    } else {
      manualUpdateSection.style.display = 'flex'; // نمایش Manual Update
      stopAutoUpdate(); // توقف به‌روزرسانی خودکار
    }
  });

  // شروع به‌روزرسانی خودکار
  function startAutoUpdate() {
    if (autoUpdateInterval) clearInterval(autoUpdateInterval); // پاک کردن interval قبلی
    autoUpdateInterval = setInterval(() => {
      chrome.runtime.requestUpdateCheck((status) => {
        if (status === 'update_available') {
          alert('An update is available. The extension will be updated shortly.');
        } else if (status === 'no_update') {
          console.log('No update available.');
        } else if (status === 'throttled') {
          console.log('Update check is throttled. Please try again later.');
        }
      });
    }, 24 * 60 * 60 * 1000); // هر 24 ساعت
  }

  // توقف به‌روزرسانی خودکار
  function stopAutoUpdate() {
    if (autoUpdateInterval) {
      clearInterval(autoUpdateInterval); // توقف interval
      autoUpdateInterval = null;
    }
  }

  // بررسی به‌روزرسانی دستی
  manualUpdateButton.addEventListener('click', () => {
    if (!autoUpdateEnabled) {
      chrome.runtime.requestUpdateCheck((status) => {
        if (status === 'update_available') {
          alert('An update is available. The extension will be updated shortly.');
        } else if (status === 'no_update') {
          alert('You are using the latest version.');
        } else if (status === 'throttled') {
          alert('Update check is throttled. Please try again later.');
        }
      });
    } else {
      alert('Auto-update is enabled. Manual update is disabled.');
    }
  });

  // نمایش/پنهان کردن تنظیمات
  settingsToggle.addEventListener('click', () => {
    settingsContent.classList.toggle('show');
  });

  // بارگذاری اولیه لیست سفید
  updateWhitelist();

  // تنظیم زبان اولیه
  chrome.storage.local.get(['language'], (data) => {
    const lang = data.language || 'en';
    setLanguage(lang); // تنظیم زبان اولیه
    languageSelect.value = lang; // تنظیم مقدار select
  });

  // نمایش نسخه
  const version = chrome.runtime.getManifest().version_name;
  versionSection.querySelector('span').textContent = `Version: ${version}`;

  // بارگذاری وضعیت‌ها از storage
  chrome.storage.local.get(['isBlockingEnabled', 'isDarkMode', 'language', 'notificationsEnabled', 'autoUpdateEnabled'], (data) => {
    isBlockingEnabled = data.isBlockingEnabled || false;
    isDarkMode = data.isDarkMode || false;
    currentLanguage = data.language || 'en';
    notificationsEnabled = data.notificationsEnabled || false;
    autoUpdateEnabled = data.autoUpdateEnabled || false;

    updateStartStopButton();
    updateTheme();
    languageSelect.value = currentLanguage;
    notificationsToggle.checked = notificationsEnabled;
    autoUpdateToggle.checked = autoUpdateEnabled;

    // تنظیم وضعیت Manual Update بر اساس Auto-Update
    if (autoUpdateEnabled) {
      manualUpdateSection.style.display = 'none'; // پنهان کردن Manual Update
      startAutoUpdate(); // شروع به‌روزرسانی خودکار
    } else {
      manualUpdateSection.style.display = 'flex'; // نمایش Manual Update
      stopAutoUpdate(); // توقف به‌روزرسانی خودکار
    }

    setLanguage(currentLanguage);
  });

  // اضافه کردن رویداد تغییر زبان
  languageSelect.addEventListener('change', (event) => {
    const selectedLanguage = event.target.value;
    chrome.storage.local.set({ language: selectedLanguage }, () => {
      setLanguage(selectedLanguage);
    });
  });
});