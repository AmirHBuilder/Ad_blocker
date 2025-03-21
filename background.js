let ruleIdCounter = 1;  // شروع از 1 برای شناسه‌های یکتا
let activeRuleIds = [];  // آرایه برای ذخیره ruleIdهای فعال

// اضافه کردن قوانین به declarativeNetRequest
function addBlockingRule(rule) {
  rule.id = ruleIdCounter++;  // افزایش شناسه به صورت یکتا
  activeRuleIds.push(rule.id);  // ذخیره ruleId در آرایه

  chrome.declarativeNetRequest.updateDynamicRules({
    addRules: [rule]
  }, (result) => {
    if (chrome.runtime.lastError) {
      console.error('Error adding rule:', chrome.runtime.lastError);
    } else {
      console.log('Rule added successfully:', result);
    }
  });
}

// ساخت قانون برای مسدود کردن سایت
async function createBlockRule(url) {
  const blockRule = {
    id: ruleIdCounter,  // استفاده از ruleIdCounter بدون افزایش
    priority: 1,
    action: { type: 'block' },
    condition: { urlFilter: `*://${url}/*`, resourceTypes: ['main_frame', 'sub_frame'] }
  };
  addBlockingRule(blockRule);
}

// حذف قوانین
function removeBlockingRule(ruleId) {
  if (!Number.isInteger(ruleId)) {
    console.error('Invalid ruleId:', ruleId);
    return;
  }

  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [ruleId]  // حذف قانون با ruleId مشخص
  }, (result) => {
    if (chrome.runtime.lastError) {
      console.error('Error removing rule:', chrome.runtime.lastError);
    } else {
      console.log('Rule removed successfully:', result);
    }
  });
}

// فعال/غیرفعال کردن بلاک کردن تبلیغات
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'toggle') {
    if (message.status === 'enable') {
      // اعمال قوانین مسدود کردن سایت‌ها
      chrome.storage.local.get('whitelist', (data) => {
        const whitelist = data.whitelist || [];
        // اضافه کردن هر سایت که در لیست سفید نیست
        whitelist.forEach((site) => {
          createBlockRule(site);
        });
      });
    } else {
      // حذف همه قوانین برای مسدود کردن تبلیغات
      activeRuleIds.forEach((ruleId) => {
        removeBlockingRule(ruleId);
      });
      activeRuleIds = [];  // پاک کردن آرایه ruleIdها
    }
    sendResponse({ status: message.status === 'enable' ? 'enabled' : 'disabled' });
  }
});