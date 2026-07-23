// Fonctions utilitaires partagées entre les pages

/** Normalise un numéro de CIN : majuscules, sans espaces ni tirets. */
function normaliserCIN(cin) {
  return String(cin || "").toUpperCase().replace(/[\s-]/g, "").trim();
}

/** Normalise un nom/prénom pour comparaison (majuscules, espaces réduits). */
function normaliserTexte(txt) {
  return String(txt || "").toUpperCase().trim().replace(/\s+/g, " ");
}

/** Échappe le HTML pour éviter l'injection lors de l'affichage de données saisies. */
function echapperHTML(txt) {
  const div = document.createElement("div");
  div.textContent = String(txt ?? "");
  return div.innerHTML;
}

/** Formate un Timestamp Firestore (ou Date) en date lisible française. */
function formaterDate(ts) {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/** Récupère les initiales d'un nom/prénom pour l'avatar par défaut d'un candidat. */
function initiales(nom) {
  return String(nom || "?").trim().split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase();
}

/** Affiche un message dans un conteneur d'alerte donné (type: 'erreur' | 'succes'). */
function afficherAlerte(conteneurId, message, type = "erreur") {
  const el = document.getElementById(conteneurId);
  if (!el) return;
  el.textContent = message;
  el.className = `alert alert-${type}`;
  el.classList.remove("hidden");
}

function masquerAlerte(conteneurId) {
  const el = document.getElementById(conteneurId);
  if (el) el.classList.add("hidden");
}

const SVG_SEAL_CHECK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`;
const SVG_ARROW = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>`;
