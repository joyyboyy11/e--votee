// ==========================================================
// Garde d'authentification
// ==========================================================
auth.onAuthStateChanged(user => {
  if (!user) {
    window.location.href = "admin-login.html";
  } else {
    document.getElementById("email-connecte").textContent = user.email;
    chargerElection();
    chargerCandidats();
    chargerElecteurs();
  }
});

document.getElementById("btn-deconnexion").addEventListener("click", () => auth.signOut());

// ==========================================================
// Navigation entre onglets
// ==========================================================
document.querySelectorAll(".admin-nav button").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".admin-nav button").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("tab-" + btn.dataset.tab).classList.add("active");
    if (btn.dataset.tab === "resultats") chargerResultats();
  });
});

// ==========================================================
// Onglet Élection
// ==========================================================
const electionRef = db.collection("config").doc(ELECTION_DOC_ID);

async function chargerElection() {
  const snap = await electionRef.get();
  const data = snap.exists ? snap.data() : { titre: "", description: "", statut: "brouillon" };
  document.getElementById("e-titre").value = data.titre || "";
  document.getElementById("e-description").value = data.description || "";
  majBadgeStatut(data.statut || "brouillon");
}

function majBadgeStatut(statut) {
  const badge = document.getElementById("badge-statut");
  const labels = { brouillon: "Brouillon", ouverte: "Scrutin ouvert", fermee: "Scrutin fermé" };
  badge.textContent = labels[statut] || "Brouillon";
  badge.className = "badge badge-" + (statut || "brouillon");
}

document.getElementById("btn-enregistrer-election").addEventListener("click", async () => {
  const titre = document.getElementById("e-titre").value.trim();
  const description = document.getElementById("e-description").value.trim();
  masquerAlerte("alerte-election");

  if (!titre) {
    afficherAlerte("alerte-election", "Le titre de l'élection est requis.");
    return;
  }

  try {
    await electionRef.set({ titre, description }, { merge: true });
    afficherAlerte("alerte-election", "Élection enregistrée.", "succes");
  } catch (err) {
    console.error(err);
    afficherAlerte("alerte-election", "Erreur lors de l'enregistrement.");
  }
});

document.getElementById("btn-ouvrir").addEventListener("click", async () => {
  const titre = document.getElementById("e-titre").value.trim();
  if (!titre) {
    afficherAlerte("alerte-election", "Renseignez et enregistrez un titre avant d'ouvrir le scrutin.");
    return;
  }
  await electionRef.set({ statut: "ouverte" }, { merge: true });
  majBadgeStatut("ouverte");
});

document.getElementById("btn-fermer").addEventListener("click", async () => {
  if (!confirm("Fermer le scrutin ? Les électeurs ne pourront plus voter.")) return;
  await electionRef.set({ statut: "fermee" }, { merge: true });
  majBadgeStatut("fermee");
});

// ==========================================================
// Onglet Candidats
// ==========================================================
async function chargerCandidats() {
  const snap = await db.collection("candidats").orderBy("ordre", "asc").get();
  const tbody = document.getElementById("liste-candidats-admin");
  tbody.innerHTML = "";
  document.getElementById("candidats-vide").classList.toggle("hidden", !snap.empty);

  snap.forEach(doc => {
    const c = doc.data();
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${echapperHTML(c.nom)}</strong></td>
      <td>${echapperHTML(c.description || "—")}</td>
      <td>${c.voix || 0}</td>
      <td><button class="btn btn-ghost btn-sm" data-id="${doc.id}" data-action="supprimer-candidat">Supprimer</button></td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('[data-action="supprimer-candidat"]').forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm("Supprimer ce candidat ? Cette action est irréversible.")) return;
      await db.collection("candidats").doc(btn.dataset.id).delete();
      chargerCandidats();
    });
  });
}

document.getElementById("btn-ajouter-candidat").addEventListener("click", async () => {
  const nom = document.getElementById("c-nom").value.trim();
  const description = document.getElementById("c-description").value.trim();
  const photoUrl = document.getElementById("c-photo").value.trim();
  if (!nom) return;

  const countSnap = await db.collection("candidats").get();
  await db.collection("candidats").add({
    nom, description, photoUrl,
    voix: 0,
    ordre: countSnap.size,
    creeLe: firebase.firestore.FieldValue.serverTimestamp()
  });

  document.getElementById("c-nom").value = "";
  document.getElementById("c-description").value = "";
  document.getElementById("c-photo").value = "";
  chargerCandidats();
});

// ==========================================================
// Onglet Électeurs
// ==========================================================
let electeursCache = [];

async function chargerElecteurs() {
  const snap = await db.collection("electeurs").orderBy("nom", "asc").get();
  electeursCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  document.getElementById("compte-electeurs").textContent = `${electeursCache.length} inscrit(s)`;
  afficherElecteurs(electeursCache);
}

function afficherElecteurs(liste) {
  const tbody = document.getElementById("liste-electeurs-admin");
  tbody.innerHTML = "";
  document.getElementById("electeurs-vide").classList.toggle("hidden", liste.length !== 0);

  liste.forEach(e => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${echapperHTML(e.nom)}</td>
      <td>${echapperHTML(e.prenom)}</td>
      <td>${echapperHTML(e.id)}</td>
      <td>${e.aVote ? '<span class="badge badge-ouverte">A voté</span>' : '<span class="badge badge-brouillon">En attente</span>'}</td>
      <td><button class="btn btn-ghost btn-sm" data-id="${e.id}" data-action="supprimer-electeur">Retirer</button></td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('[data-action="supprimer-electeur"]').forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm("Retirer cet électeur de la liste électorale ?")) return;
      await db.collection("electeurs").doc(btn.dataset.id).delete();
      chargerElecteurs();
    });
  });
}

document.getElementById("recherche-electeurs").addEventListener("input", (e) => {
  const q = normaliserTexte(e.target.value);
  if (!q) { afficherElecteurs(electeursCache); return; }
  afficherElecteurs(electeursCache.filter(el =>
    normaliserTexte(el.nom).includes(q) || normaliserTexte(el.prenom).includes(q) || el.id.includes(normaliserCIN(q))
  ));
});

document.getElementById("btn-ajouter-electeur").addEventListener("click", async () => {
  masquerAlerte("alerte-electeur");
  const nom = document.getElementById("v-nom").value.trim();
  const prenom = document.getElementById("v-prenom").value.trim();
  const cin = normaliserCIN(document.getElementById("v-cin").value);

  if (!nom || !prenom || !cin) {
    afficherAlerte("alerte-electeur", "Nom, prénom et CIN sont requis.");
    return;
  }

  const existant = await db.collection("electeurs").doc(cin).get();
  if (existant.exists) {
    afficherAlerte("alerte-electeur", "Un électeur avec ce numéro de CIN est déjà inscrit.");
    return;
  }

  await db.collection("electeurs").doc(cin).set({
    nom, prenom, aVote: false, dateVote: null,
    ajouteLe: firebase.firestore.FieldValue.serverTimestamp()
  });

  document.getElementById("v-nom").value = "";
  document.getElementById("v-prenom").value = "";
  document.getElementById("v-cin").value = "";
  chargerElecteurs();
});

document.getElementById("btn-import").addEventListener("click", async () => {
  const texte = document.getElementById("import-texte").value.trim();
  if (!texte) return;

  const lignes = texte.split("\n").map(l => l.trim()).filter(Boolean);
  const batch = db.batch();
  let compte = 0;

  lignes.forEach(ligne => {
    const parts = ligne.split(";").map(p => p.trim());
    if (parts.length < 3) return;
    const [nom, prenom, cinBrut] = parts;
    const cin = normaliserCIN(cinBrut);
    if (!nom || !prenom || !cin) return;
    const ref = db.collection("electeurs").doc(cin);
    batch.set(ref, { nom, prenom, aVote: false, dateVote: null, ajouteLe: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
    compte++;
  });

  if (compte === 0) {
    alert("Aucune ligne valide détectée. Format attendu : Nom;Prénom;CIN");
    return;
  }

  await batch.commit();
  document.getElementById("import-texte").value = "";
  alert(`${compte} électeur(s) importé(s).`);
  chargerElecteurs();
});

// ==========================================================
// Onglet Résultats
// ==========================================================
async function chargerResultats() {
  const [candidatsSnap, electeursSnap, electionSnap] = await Promise.all([
    db.collection("candidats").orderBy("voix", "desc").get(),
    db.collection("electeurs").get(),
    electionRef.get()
  ]);

  const inscrits = electeursSnap.size;
  const votants = electeursSnap.docs.filter(d => d.data().aVote).length;
  const participation = inscrits > 0 ? Math.round((votants / inscrits) * 100) : 0;
  const statut = electionSnap.exists ? electionSnap.data().statut : "brouillon";

  document.getElementById("stat-inscrits").textContent = inscrits;
  document.getElementById("stat-votants").textContent = votants;
  document.getElementById("stat-participation").textContent = participation + "%";

  const totalVoix = candidatsSnap.docs.reduce((s, d) => s + (d.data().voix || 0), 0);
  const zone = document.getElementById("zone-resultats");
  zone.innerHTML = "";

  if (candidatsSnap.empty) {
    zone.innerHTML = `<div class="empty">Aucun candidat configuré.</div>`;
    return;
  }

  candidatsSnap.docs.forEach((doc, i) => {
    const c = doc.data();
    const pct = totalVoix > 0 ? Math.round(((c.voix || 0) / totalVoix) * 100) : 0;
    const estGagnant = statut === "fermee" && i === 0 && (c.voix || 0) > 0;
    const row = document.createElement("div");
    row.className = "result-row";
    row.innerHTML = `
      <div class="result-row-head">
        <span class="nom">${echapperHTML(c.nom)} ${estGagnant ? '<span class="winner-tag">Vainqueur</span>' : ""}</span>
        <span>${c.voix || 0} voix · ${pct}%</span>
      </div>
      <div class="result-bar-track"><div class="result-bar-fill" style="width:${pct}%"></div></div>
    `;
    zone.appendChild(row);
  });
}
