// JoyaGoo Modal Remover - Popup Script
document.addEventListener("DOMContentLoaded", async function () {
  const removeButton = document.getElementById("removeButton");
  const qcSearchButton = document.getElementById("qcSearchButton");
  const qcFromProductButton = document.getElementById("qcFromProductButton");
  const statusDiv = document.getElementById("status");

  qcSearchButton.style.display = "none";
  qcFromProductButton.style.display = "none";

  // Function to update status message
  function updateStatus(message, isSuccess = null) {
    statusDiv.textContent = message;
    statusDiv.className = "";
    if (isSuccess === true) {
      statusDiv.classList.add("success");
    } else if (isSuccess === false) {
      statusDiv.classList.add("error");
    }
  }

  // Function to check if current tab is JoyaGoo
  async function checkCurrentTab() {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      const url = tab.url || "";

      if (url.includes("joyagoo.com")) {
        return "joyagoo";
      } else if (url.includes("weidian.com")) {
        return "weidian";
      } else if (url.includes("tmall.com")) {
        return "tmall";
      } else if (url.includes("taobao.com")) {
        return "taobao";
      } else if (url.includes("1688.com")) {
        return "1688";
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error checking tab:", error);
      return null;
    }
  }
  const site = await checkCurrentTab();

  if (site === "joyagoo") {
    qcSearchButton.style.display = "block";
    qcFromProductButton.style.display = "none";
  } else if (site === "weidian" || site === "taobao" || site === "tmall" || site === "1688") {
    qcSearchButton.style.display = "none";
    qcFromProductButton.style.display = "block";
  } else {
    qcSearchButton.style.display = "none";
    qcFromProductButton.style.display = "none";
  }

  // Remove button click handler
  removeButton.addEventListener("click", async function () {
    try {
      const isJoyaGoo = await checkCurrentTab();
      if (!isJoyaGoo) {
        updateStatus("⚠️ Przejdź najpierw na stronę joyagoo.com", false);
        return;
      }
      updateStatus("🔄 Usuwanie modala...");
      removeButton.disabled = true;
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      chrome.tabs.sendMessage(
        tab.id,
        { action: "removeModal" },
        function (response) {
          removeButton.disabled = false;
          if (chrome.runtime.lastError) {
            console.error("Runtime error:", chrome.runtime.lastError);
            updateStatus("❌ Błąd: Odśwież stronę i spróbuj ponownie", false);
          } else if (response && response.success) {
            updateStatus("✅ Modal został pomyślnie usunięty!", true);
          } else {
            updateStatus("ℹ️ Modal nie został znaleziony na stronie", null);
          }
        }
      );
    } catch (error) {
      console.error("Error:", error);
      updateStatus("❌ Wystąpił błąd podczas usuwania", false);
      removeButton.disabled = false;
    }
  });

  // QC Search button click handler
  qcSearchButton.addEventListener("click", async function () {
    try {
      const isJoyaGoo = await checkCurrentTab();
      if (!isJoyaGoo) {
        updateStatus("⚠️ Przejdź najpierw na stronę joyagoo.com", false);
        return;
      }
      updateStatus("🔎 Szukanie produktu na QC...");
      qcSearchButton.disabled = true;
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      chrome.tabs.sendMessage(
        tab.id,
        { action: "getProductId" },
        function (response) {
          qcSearchButton.disabled = false;
          if (chrome.runtime.lastError) {
            console.error("Runtime error:", chrome.runtime.lastError);
            updateStatus("❌ Błąd: Odśwież stronę i spróbuj ponownie", false);
          } else if (response && response.productID && response.qcType) {
            const url = `https://findqc.com/detail/${response.qcType}/${response.productID}?frm=1`;
            chrome.tabs.create({ url });
            updateStatus("✅ Otworzono produkt na QC!", true);
          } else {
            updateStatus("❌ Nie znaleziono ID produktu!", false);
          }
        }
      );
    } catch (error) {
      console.error("Error:", error);
      updateStatus("❌ Wystąpił błąd podczas wyszukiwania", false);
      qcSearchButton.disabled = false;
    }
  });

  qcFromProductButton.addEventListener("click", async function () {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    const url = tab.url;

    let qcType = null,
      productId = null;

    // Weidian
    if (/weidian\.com\/item\.html\?itemID=(\d+)/.test(url)) {
      qcType = "WD";
      productId = url.match(/itemID=(\d+)/)[1];
    }
    // Taobao/Tmall
    else if (
      /tmall\.com\/item\.htm.*[?&]id=(\d+)/.test(url) ||
      /taobao\.com\/item\.htm.*[?&]id=(\d+)/.test(url)
    ) {
      qcType = "TB";
      productId = url.match(/[?&]id=(\d+)/)[1];
    }
    // 1688
    else if (/1688\.com\/offer\/(\d+)\.html/.test(url)) {
      qcType = "T1688";
      productId = url.match(/offer\/(\d+)\.html/)[1];
    }

    if (qcType && productId) {
      const qcUrl = `https://findqc.com/detail/${qcType}/${productId}?frm=1`;
      chrome.tabs.create({ url: qcUrl });
      updateStatus("✅ Otworzono QC dla tego produktu!", true);
    } else {
      updateStatus("❌ Nie rozpoznano produktu na tej stronie!", false);
    }
  });

  // Check tab on load and update status
  checkCurrentTab().then((isJoyaGoo) => {
    if (isJoyaGoo) {
      updateStatus("✅ Gotowy");
    } else {
      updateStatus("⚠️ Przejdź na stronę joyagoo.com");
    }
  });
});
