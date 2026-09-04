document.addEventListener("DOMContentLoaded", async () => {
  const auth = window.LockwoodCertAuth;
  if (!auth) {
    document.documentElement.classList.remove("cert-auth-checking");
    return;
  }

  const configError = auth.getConfigError();
  if (configError) {
    localStorage.setItem("lockwoodstem_cert_setup_notice", configError);
    window.location.href = "login.html?setup=1";
    return;
  }

  const result = await auth.validateSession();
  document.documentElement.classList.remove("cert-auth-checking");

  if (!result.ok) {
    auth.redirectToLogin();
    return;
  }

  const page = window.location.pathname.split("/").pop() || "index.html";
  if (result.user && result.user.mustChangePassword && page !== "change-password.html") {
    const next = encodeURIComponent(page + window.location.search + window.location.hash);
    window.location.href = "change-password.html?next=" + next;
    return;
  }

  auth.renderAccountBar(result.user);
});
