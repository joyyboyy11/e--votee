// ==========================================================
// Page publique des résultats
// Accessible à tous (électeurs inclus), sans authentification.
// Les résultats détaillés ne s'affichent qu'une fois le
// scrutin fermé par l'organisateur. Avant ça, seul un message
// d'attente est visible. La page écoute Firestore en direct :
// dès que l'admin clique sur "Fermer le scrutin", les
// électeurs qui ont cette page ouverte voient les résultats
// apparaître automatiquement, sans recharger.
// ==========================================================

const zoneChargement = document.getElementById("zone-chargement");
const zoneAttente = document.getElementById("zone-attente");
const zoneResultatsFinal = document.getElementById("zone-resultats-final");

const badgeAttente = document.getElementById("badge-attente");
const titreAttente = document.getElementById("titre-attente");
const messageAttente = document.getElementById("message-attente");

let desabonnerCandidats = null;

const electionRef = db.collection("config").doc(ELECTION_DOC_ID);

electionRef.onSnapshot(async (snap) => {
  zoneChargement.classList.add("hidden");

  const data = snap.exists ? snap.data() : { statut: "brouillon" };
  const statut = data.statut || "brouillon";

  if (statut !== "fermee") {
    // Le scrutin n'est pas (encore) fermé : on affiche un message d'attente
    // et on se désabonne d'éventuels écouteurs de résultats précédents.
    if (desabonnerCandidats) { desabonnerCandidats(); desabonnerCandidats = null; }

    zoneResultatsFinal.classList.add("hidden");
    zoneAttente.classList.remove("hidden");

    if (statut === "ouverte") {
      badgeAttente.textContent = "Scrutin en cours";
      badgeAttente.className = "badge badge-ouverte";
      titreAttente.textContent = "Le scrutin est actuellement en cours";
      messageAttente.textContent = "Pour préserver le secret et l'intégrité du vote, les résultats ne sont publiés qu'à la clôture officielle du scrutin. Revenez sur cette page une fois le vote terminé.";
    } else {
      badgeAttente.textContent = "Brouillon";
      badgeAttente.className = "badge badge-brouillon";
      titreAttente.textContent = "Aucun scrutin ouvert pour le moment";
      messageAttente.textContent = "Les résultats seront affichés ici dès qu'un scrutin aura été ouvert, puis fermé, par l'organisateur.";
    }
    return;
  }

  // ----- Scrutin fermé : on affiche les résultats finaux -----
  document.getElementById("titre-election").textContent = data.titre || "Élection";
  document.getElementById("desc-election").textContent = data.description || "";

  zoneAttente.classList.add("hidden");
  zoneResultatsFinal.classList.remove("hidden");

  if (!desabonnerCandidats) {
    desabonnerCandidats = ecouterResultats();
  }
});

function ecouterResultats() {
  // Écoute en direct des voix (utile si l'admin rouvre/ferme ou corrige un décompte)
  return db.collection("candidats").orderBy("voix", "desc").onSnapshot(async (candidatsSnap) => {
    const electeursSnap = await db.collection("electeurs").get();

    const inscrits = electeursSnap.size;
    const votants = electeursSnap.docs.filter(d => d.data().aVote).length;
    const participation = inscrits > 0 ? Math.round((votants / inscrits) * 100) : 0;

    document.getElementById("stat-inscrits").textContent = inscrits;
    document.getElementById("stat-votants").textContent = votants;
    document.getElementById("stat-participation").textContent = participation + "%";

    const totalVoix = candidatsSnap.docs.reduce((s, d) => s + (d.data().voix || 0), 0);
    const zone = document.getElementById("zone-resultats");
    zone.innerHTML = "";

    if (candidatsSnap.empty) {
      zone.innerHTML = `<div class="empty">Aucun candidat n'avait été configuré pour ce scrutin.</div>`;
      return;
    }

    candidatsSnap.docs.forEach((doc, i) => {
      const c = doc.data();
      const pct = totalVoix > 0 ? Math.round(((c.voix || 0) / totalVoix) * 100) : 0;
      const estGagnant = i === 0 && (c.voix || 0) > 0;
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
  });
}
