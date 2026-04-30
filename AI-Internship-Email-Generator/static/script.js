(function () {
  const generateBtn = document.getElementById("generate-btn");
  const loader = document.getElementById("loader");
  const copyBtn = document.getElementById("copy-btn");
  const downloadBtn = document.getElementById("download-btn");
  const emailContent = document.getElementById("email-content");

  if (generateBtn) {
    generateBtn.form.addEventListener("submit", function () {
      if (loader) {
        loader.classList.add("show");
      }
    });
  }

  if (copyBtn && emailContent) {
    copyBtn.addEventListener("click", async function () {
      try {
        await navigator.clipboard.writeText(emailContent.textContent.trim());
        copyBtn.textContent = "Copied";
        setTimeout(() => {
          copyBtn.textContent = "Copy Email";
        }, 1200);
      } catch (err) {
        alert("Unable to copy automatically. Please copy manually.");
      }
    });
  }

  if (downloadBtn && emailContent) {
    downloadBtn.addEventListener("click", function () {
      const blob = new Blob([emailContent.textContent.trim()], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "internship_email.txt";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    });
  }
})();
