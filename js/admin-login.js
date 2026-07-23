// Si déjà connecté, on va directement au tableau de bord
auth.onAuthStateChanged(user => {
  if (user) window.location.href = "admin-dashboard.html";
});

document.getElementById("form-admin-login").addEventListener("submit", async (e) => {
  e.preventDefault();
  masquerAlerte("alerte");

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const btn = document.getElementById("btn-login");
  btn.disabled = true;
  btn.textContent = "Connexion…";

  try {
    await auth.signInWithEmailAndPassword(email, password);
    window.location.href = "admin-dashboard.html";
  } catch (err) {
    console.error(err);
    let msg = "Connexion impossible. Vérifiez vos identifiants.";
    if (err.code === "auth/invalid-email") msg = "Adresse e-mail invalide.";
    if (err.code === "auth/too-many-requests") msg = "Trop de tentatives. Réessayez plus tard.";
    afficherAlerte("alerte", msg);
  } finally {
    btn.disabled = false;
    btn.textContent = "Se connecter";
  }
});
