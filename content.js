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
  const modals = document.querySelectorAll(
    'div[role="none"].n-modal-container'
  );
  for (let modal of modals) {
    const warningText = modal.querySelector(".product-reminder-title");
    if (
      warningText &&
      warningText.textContent.includes("JoyaGoo warm reminder")
    ) {
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

// --- Mutation observer ---
const observer = new MutationObserver(function (mutations) {
  mutations.forEach(function (mutation) {
    mutation.addedNodes.forEach(function (node) {
      if (node.nodeType === 1) {
        if (node.matches && node.matches(".n-modal-container")) {
          setTimeout(attemptModalRemoval, 100);
          setTimeout(clearHtmlStyle, 100);
        } else if (
          node.querySelector &&
          node.querySelector(".n-modal-container")
        ) {
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
    // Szukamy linku w odpowiednim divie
    let link = document.querySelector(".product-menu a.custom-link[href]");
    if (link) {
      let href = link.href;
      let qcType = null;
      let productId = null;

      // Weidian
      if (/weidian\.com\/item\.html\?itemID=(\d+)/.test(href)) {
        qcType = "WD";
        productId = href.match(/itemID=(\d+)/)[1];
      }
      // Tmall/Taobao
      else if (
        /tmall\.com\/item\.htm.*[?&]id=(\d+)/.test(href) ||
        /taobao\.com\/item\.htm.*[?&]id=(\d+)/.test(href)
      ) {
        qcType = "TB";
        productId = href.match(/[?&]id=(\d+)/)[1];
      }
      // 1688
      else if (/1688\.com\/offer\/(\d+)\.html/.test(href)) {
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

// Funkcja: dodaje button na stronie findqc.com, który przenosi do joyagoo.com
function addJoyagooButtonOnQC() {
  // Szukamy diva z linkiem do oryginalnego produktu
  // (np. https://weidian.com/item.html?itemID=7441005541)
  const linkDiv = document.querySelector(".text-underline.primary");
  if (!linkDiv) return; // Nie ma linku, nie dodajemy przycisku

  const productUrl = linkDiv.textContent.trim();
  if (!productUrl.startsWith("http")) return; // Nie wygląda na link

  // Parsujemy platformę i id
  let joyagooPlatform = null,
    joyagooId = null;

  // Weidian
  if (/weidian\.com\/item\.html\?itemID=(\d+)/.test(productUrl)) {
    joyagooPlatform = "WEIDIAN";
    joyagooId = productUrl.match(/itemID=(\d+)/)[1];
  }
  // Taobao/Tmall
  else if (
    /tmall\.com\/item\.htm.*[?&]id=(\d+)/.test(productUrl) ||
    /taobao\.com\/item\.htm.*[?&]id=(\d+)/.test(productUrl)
  ) {
    joyagooPlatform = "TAOBAO";
    joyagooId = productUrl.match(/[?&]id=(\d+)/)[1];
  }
  // 1688
  else if (/1688\.com\/offer\/(\d+)\.html/.test(productUrl)) {
    joyagooPlatform = "ALI_1688";
    joyagooId = productUrl.match(/offer\/(\d+)\.html/)[1];
  }

  if (!joyagooPlatform || !joyagooId) return; // Nie rozpoznano

  const joyagooUrl = `https://joyagoo.com/product?id=${joyagooId}&platform=${joyagooPlatform}`;

  // Sprawdzamy, czy button już istnieje
  if (document.getElementById("gotoJoyagooButton")) return;

  // Tworzymy i stylizujemy przycisk
  const btn = document.createElement("button");
  btn.id = "gotoJoyagooButton";
  btn.textContent = "Otwórz w JoyaGoo";
  btn.onclick = () => window.open(joyagooUrl, "_blank");

  // Dodajemy style przez <style> do <head> (tylko raz)
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

  // Dodajemy przycisk pod linkiem
  linkDiv.parentElement.appendChild(btn);
}

if (location.hostname.includes("findqc.com")) {
  document.addEventListener("DOMContentLoaded", () => {
    setTimeout(addJoyagooButtonOnQC, 500);
  });
  setTimeout(addJoyagooButtonOnQC, 1500); // fallback dla SPA
}
