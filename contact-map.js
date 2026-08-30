const contactPage = document.querySelector("[data-contact-page]");

if (contactPage) {
  const address = contactPage.dataset.contactAddress || "No. 188, Section 3, Xinhai Rd, Da’an District, Taipei City, 106";
  const copyAddressButton = document.querySelector("[data-copy-address]");

  const embeddedMap = document.querySelector("#contact-map");
  if (embeddedMap) {
    embeddedMap.src = `https://www.google.com/maps?q=${encodeURIComponent(address)}&z=16&output=embed`;
  }

  if (copyAddressButton) {
    copyAddressButton.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(address);
        copyAddressButton.textContent = "Address Copied";
      } catch (error) {
        copyAddressButton.textContent = "Copy Failed";
      }

      window.setTimeout(() => {
        copyAddressButton.textContent = "Copy Address";
      }, 1600);
    });
  }
}
