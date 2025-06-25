console.log("JoyaGoo Modal Remover załadowany");

// --- Modal removal functions (jak dotąd) ---
function removeJoyaGooModal() {
  const modal = document.querySelector('div[role="none"].n-modal-container');
  if (modal) {
    modal.remove();
    console.log("Modal JoyaGoo został usunięty");
    return true;
  } else {
    console.log("Modal JoyaGoo nie został znaleziony");
    return false;
  }
}
function removeModalByContent() {
  const modals = document.querySelectorAll('div[role="none"].n-modal-container');
  for (let modal of modals) {
    const warningText = modal.querySelector(".product-reminder-title");
    if (warningText && warningText.textContent.includes("JoyaGoo warm reminder")) {
      modal.remove();
      console.log("Modal z ostrzeżeniem został usunięty");
      return true;
    }
  }
  return false;
}
function removeModalByStructure() {
  const selector = "div.n-modal-container div.product-reminder-wrapper";
  const modalWrapper = document.querySelector(selector);
  if (modalWrapper) {
    const modalContainer = modalWrapper.closest(".n-modal-container");
    if (modalContainer) {
      modalContainer.remove();
      console.log("Modal został usunięty przez strukturę");
      return true;
    }
  }
  return false;
}
function clearHtmlStyle() {
  document.documentElement.removeAttribute("style");
}
function attemptModalRemoval() {
  clearHtmlStyle();
  return (
    removeJoyaGooModal() || removeModalByContent() || removeModalByStructure()
  );
}

// --- Modal removal on load ---
document.addEventListener("DOMContentLoaded", function () {
  setTimeout(attemptModalRemoval, 500);
});
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", attemptModalRemoval);
} else {
  attemptModalRemoval();
}

// --- Mutation observer for modal ---
const observer = new MutationObserver(function (mutations) {
  mutations.forEach(function (mutation) {
    mutation.addedNodes.forEach(function (node) {
      if (node.nodeType === 1) {
        if (node.matches && node.matches(".n-modal-container")) {
          setTimeout(attemptModalRemoval, 100);
          setTimeout(clearHtmlStyle, 100);
        } else if (node.querySelector && node.querySelector(".n-modal-container")) {
          setTimeout(attemptModalRemoval, 100);
          setTimeout(clearHtmlStyle, 100);
        }
      }
    });
  });
});
observer.observe(document.body, { childList: true, subtree: true });

console.log("JoyaGoo Modal Remover jest aktywny");

// --- MESSAGE HANDLER ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "removeModal") {
    const success = attemptModalRemoval();
    sendResponse({ success: success });
  }
  if (request.action === "getProductId") {
    let link = document.querySelector(".product-menu a.custom-link[href]");
    if (link) {
      let href = link.href;
      let qcType = null;
      let productId = null;

      if (/weidian\.com\/item\.html\?itemID=(\d+)/.test(href)) {
        qcType = "WD";
        productId = href.match(/itemID=(\d+)/)[1];
      } else if (
        /tmall\.com\/item\.htm.*[?&]id=(\d+)/.test(href) ||
        /taobao\.com\/item\.htm.*[?&]id=(\d+)/.test(href)
      ) {
        qcType = "TB";
        productId = href.match(/[?&]id=(\d+)/)[1];
      } else if (/1688\.com\/offer\/(\d+)\.html/.test(href)) {
        qcType = "T1688";
        productId = href.match(/offer\/(\d+)\.html/)[1];
      }

      if (qcType && productId) {
        sendResponse({ productID: productId, qcType: qcType });
      } else {
        sendResponse({});
      }
    } else {
      sendResponse({});
    }
    return true;
  }
});

// --- Funkcja dodająca button na findqc.com ---
function addJoyagooButtonOnQC() {
  const linkDiv = document.querySelector(".text-underline.primary");
  if (!linkDiv) return;

  const productUrl = linkDiv.textContent.trim();
  if (!productUrl.startsWith("http")) return;

  let joyagooPlatform = null,
    joyagooId = null;

  if (/weidian\.com\/item\.html\?itemID=(\d+)/.test(productUrl)) {
    joyagooPlatform = "WEIDIAN";
    joyagooId = productUrl.match(/itemID=(\d+)/)[1];
  } else if (
    /tmall\.com\/item\.htm.*[?&]id=(\d+)/.test(productUrl) ||
    /taobao\.com\/item\.htm.*[?&]id=(\d+)/.test(productUrl)
  ) {
    joyagooPlatform = "TAOBAO";
    joyagooId = productUrl.match(/[?&]id=(\d+)/)[1];
  } else if (/1688\.com\/offer\/(\d+)\.html/.test(productUrl)) {
    joyagooPlatform = "ALI_1688";
    joyagooId = productUrl.match(/offer\/(\d+)\.html/)[1];
  }

  if (!joyagooPlatform || !joyagooId) return;

  const joyagooUrl = `https://joyagoo.com/product?id=${joyagooId}&platform=${joyagooPlatform}`;

  if (document.getElementById("gotoJoyagooButton")) return;

  const btn = document.createElement("button");
  btn.id = "gotoJoyagooButton";
  btn.textContent = "Otwórz w JoyaGoo";
  btn.onclick = () => window.open(joyagooUrl, "_blank");

  if (!document.getElementById("gotoJoyagooButtonStyle")) {
    const style = document.createElement("style");
    style.id = "gotoJoyagooButtonStyle";
    style.textContent = `
          #gotoJoyagooButton {
            background: #e1f14d;
            color:rgb(37, 37, 37);
            border: none;
            padding: 12px 24px;
            border-radius: 25px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(243, 230, 52, 0.4);
            margin-top: 10px;
            width: 30%;
          }
          #gotoJoyagooButton:hover {
            background: #e4f82c;
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(247, 232, 27, 0.4);
          }
          #gotoJoyagooButton:active {
            transform: translateY(0);
          }
        `;
    document.head.appendChild(style);
  }

  linkDiv.parentElement.appendChild(btn);
}

// --- Funkcja dodająca button do menu produktu na joyagoo.com ---
function addQCButtonToProductMenu() {
  const menuDiv = document.querySelector(".product-menu");
  if (!menuDiv) return;
  if (menuDiv.querySelector("#gotoQCButton")) return;

  const productLink = menuDiv.querySelector("a.custom-link[href]");
  if (!productLink) return;
  const href = productLink.getAttribute("href");

  let qcType = null,
    productId = null;
  if (/weidian\.com\/item\.html\?itemID=(\d+)/.test(href)) {
    qcType = "WD";
    productId = href.match(/itemID=(\d+)/)[1];
  } else if (
    /tmall\.com\/item\.htm.*[?&]id=(\d+)/.test(href) ||
    /taobao\.com\/item\.htm.*[?&]id=(\d+)/.test(href)
  ) {
    qcType = "TB";
    productId = href.match(/[?&]id=(\d+)/)[1];
  } else if (/1688\.com\/offer\/(\d+)\.html/.test(href)) {
    qcType = "T1688";
    productId = href.match(/offer\/(\d+)\.html/)[1];
  }

  if (!qcType || !productId) return;

  const qcUrl = `https://findqc.com/detail/${qcType}/${productId}?frm=1`;

  const menuItem = document.createElement("div");
  menuItem.id = "gotoQCButton";
  menuItem.className = "pointer product-menu-item";
  menuItem.style.display = "flex";
  menuItem.style.alignItems = "center";
  menuItem.style.cursor = "pointer";
  menuItem.style.color = "rgb(51, 54, 57)";
  menuItem.style.fontFamily = "source-han-sans, serif";
  menuItem.style.fontSize = "14px";
  menuItem.style.lineHeight = "19.6px";
  menuItem.style.fontWeight = "400";
  menuItem.style.marginLeft = "10px";
  menuItem.style.userSelect = "none";

  menuItem.innerHTML = `
      <svg class="icon" viewBox="0 0 1024 1024" width="16px" height="16px" style="margin-right:6px;" xmlns="http://www.w3.org/2000/svg">
        <path d="M896 554.7c-17.7 0-32 14.3-32 32v192c0 17.7-14.3 32-32 32H192c-17.7 0-32-14.3-32-32V288c0-17.7 14.3-32 32-32h192c17.7 0 32-14.3 32-32s-14.3-32-32-32H192c-52.9 0-96 43.1-96 96v490.7c0 52.9 43.1 96 96 96h640c52.9 0 96-43.1 96-96V586.7c0-17.7-14.3-32-32-32z" fill="#333639"></path>
        <path d="M904.5 119.5c-12.5-12.5-32.8-12.5-45.3 0L432 546.7c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l427.2-427.2c12.5-12.5 12.5-32.8 0-45.3z" fill="#333639"></path>
      </svg>
      <span style="font-size: 12px;">Zobacz QC</span>
    `;

  menuItem.addEventListener("click", () => {
    window.open(qcUrl, "_blank");
  });

  menuDiv.appendChild(menuItem);
}

// --- Optymalizacja dodawania przycisku do menu produktu ---
function observeAndAddQCButton() {
  const menuDiv = document.querySelector(".product-menu");
  if (!menuDiv) return;

  // Utwórz observer tylko dla menu produktu
  const menuObserver = new MutationObserver(() => {
    addQCButtonToProductMenu();
  });
  menuObserver.observe(menuDiv, { childList: true, subtree: true });

  // Dodaj przycisk od razu
  addQCButtonToProductMenu();
}

// --- Inicjalizacja ---
if (location.hostname.includes("joyagoo.com")) {
  document.addEventListener("DOMContentLoaded", observeAndAddQCButton);
  if (
    document.readyState === "complete" ||
    document.readyState === "interactive"
  ) {
    observeAndAddQCButton();
  }
}

if (location.hostname.includes("findqc.com")) {
  document.addEventListener("DOMContentLoaded", () => {
    setTimeout(addJoyagooButtonOnQC, 500);
  });
  setTimeout(addJoyagooButtonOnQC, 1500);
}

// --- Jednorazowe wywołanie usuwania modala ---
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(attemptModalRemoval, 500);
});