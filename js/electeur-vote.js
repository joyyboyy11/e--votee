const cin = sessionStorage.getItem("scrutin_electeur_cin");

let candidatSelectionneId = null;
let candidatSelectionneNom = "";

const zoneChargement = document.getElementById("zone-chargement");
const zoneVote = document.getElementById("zone-vote");
const listeCandidats = document.getElementById("liste-candidats");
const btnVoter = document.getElementById("btn-voter");
const modalOverlay = document.getElementById("modal-overlay");

if (!cin) {
  window.location.href = "electeur-login.html";
}

async function initialiser() {
  try {
    // Revérification côté client avant d'afficher le bulletin
    const [electionSnap, electeurSnap] = await Promise.all([
      db.collection("config").doc(ELECTION_DOC_ID).get(),
      db.collection("electeurs").doc(cin).get()
    ]);

    if (electionSnap.exists && electionSnap.data().statut === "fermee") {
      sessionStorage.removeItem("scrutin_electeur_cin");
      window.location.href = "resultats.html";
      return;
    }
    if (!electionSnap.exists || electionSnap.data().statut !== "ouverte") {
      rediriger("Le scrutin n'est plus ouvert.");
      return;
    }
    if (!electeurSnap.exists || electeurSnap.data().aVote) {
      rediriger("Vous avez déjà voté ou votre session a expiré.");
      return;
    }

    const election = electionSnap.data();
    document.getElementById("titre-election").textContent = election.titre || "Élection en cours";
    document.getElementById("desc-election").textContent = election.description || "";

    const candidatsSnap = await db.collection("candidats").orderBy("ordre", "asc").get();
    if (candidatsSnap.empty) {
      zoneChargement.textContent = "Aucun candidat n'a encore été configuré pour ce scrutin.";
      return;
    }

    listeCandidats.innerHTML = "";
    candidatsSnap.forEach(doc => {
      const c = doc.data();
      const card = document.createElement("div");
      card.className = "candidat-card";
      card.dataset.id = doc.id;
      card.dataset.nom = c.nom;
      card.innerHTML = `
        <div class="candidat-photo">${c.photoUrl ? `<img src="${echapperHTML(c.photoUrl)}" alt="">` : initiales(c.nom)}</div>
        <div class="candidat-nom">${echapperHTML(c.nom)}</div>
        <div class="candidat-desc">${echapperHTML(c.description || "")}</div>
        <div class="candidat-check">✓ Sélectionné</div>
      `;
      card.addEventListener("click", () => selectionnerCandidat(card));
      listeCandidats.appendChild(card);
    });

    zoneChargement.classList.add("hidden");
    zoneVote.classList.remove("hidden");

  } catch (err) {
    console.error(err);
    zoneChargement.textContent = "Impossible de charger le bulletin. Rechargez la page.";
  }
}

function selectionnerCandidat(card) {
  document.querySelectorAll(".candidat-card").forEach(c => c.classList.remove("selected"));
  card.classList.add("selected");
  candidatSelectionneId = card.dataset.id;
  candidatSelectionneNom = card.dataset.nom;
  btnVoter.disabled = false;
}

btnVoter.addEventListener("click", () => {
  if (!candidatSelectionneId) return;
  document.getElementById("modal-nom-candidat").textContent = candidatSelectionneNom;
  modalOverlay.classList.remove("hidden");
});

document.getElementById("btn-annuler-modal").addEventListener("click", () => {
  modalOverlay.classList.add("hidden");
});

document.getElementById("btn-confirmer-modal").addEventListener("click", enregistrerVote);

async function enregistrerVote() {
  const btn = document.getElementById("btn-confirmer-modal");
  btn.disabled = true;
  btn.textContent = "Enregistrement…";

  const electeurRef = db.collection("electeurs").doc(cin);
  const candidatRef = db.collection("candidats").doc(candidatSelectionneId);
  const electionRef = db.collection("config").doc(ELECTION_DOC_ID);

  try {
    await db.runTransaction(async (tx) => {
      const [electeurDoc, electionDoc, candidatDoc] = await Promise.all([
        tx.get(electeurRef), tx.get(electionRef), tx.get(candidatRef)
      ]);

      if (!electionDoc.exists || electionDoc.data().statut !== "ouverte") {
        throw new Error("SCRUTIN_FERME");
      }
      if (!electeurDoc.exists || electeurDoc.data().aVote) {
        throw new Error("DEJA_VOTE");
      }
      if (!candidatDoc.exists) {
        throw new Error("CANDIDAT_INTROUVABLE");
      }

      const voixActuelles = candidatDoc.data().voix || 0;
      tx.update(candidatRef, { voix: voixActuelles + 1 });
      tx.update(electeurRef, { aVote: true, dateVote: firebase.firestore.FieldValue.serverTimestamp() });
    });

    sessionStorage.removeItem("scrutin_electeur_cin");
    window.location.href = "electeur-confirmation.html";

  } catch (err) {
    console.error(err);
    modalOverlay.classList.add("hidden");
    let msg = "Une erreur est survenue lors de l'enregistrement de votre vote.";
    if (err.message === "DEJA_VOTE") msg = "Votre vote a déjà été enregistré.";
    if (err.message === "SCRUTIN_FERME") msg = "Le scrutin a été fermé pendant votre vote.";
    afficherAlerte("alerte", msg);
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (err.message === "SCRUTIN_FERME") {
      sessionStorage.removeItem("scrutin_electeur_cin");
      setTimeout(() => window.location.href = "resultats.html", 2200);
    }
  } finally {
    btn.disabled = false;
    btn.textContent = "Je confirme";
  }
}

function rediriger(message) {
  sessionStorage.removeItem("scrutin_electeur_cin");
  zoneChargement.classList.add("hidden");
  afficherAlerte("alerte", message);
  setTimeout(() => window.location.href = "electeur-login.html", 2200);
}

initialiser();
