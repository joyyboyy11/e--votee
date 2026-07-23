const formLogin = document.getElementById("form-login");
const btnContinuer = document.getElementById("btn-continuer");

formLogin.addEventListener("submit", async (e) => {
  e.preventDefault();
  masquerAlerte("alerte");

  const nom = document.getElementById("nom").value;
  const prenom = document.getElementById("prenom").value;
  const cinBrut = document.getElementById("cin").value;
  const cin = normaliserCIN(cinBrut);

  if (!cin) {
    afficherAlerte("alerte", "Merci de renseigner votre numéro de CIN.");
    return;
  }

  btnContinuer.disabled = true;
  btnContinuer.textContent = "Vérification en cours…";

  try {
    // 1. L'élection doit être ouverte
    const electionSnap = await db.collection("config").doc(ELECTION_DOC_ID).get();
    if (!electionSnap.exists || electionSnap.data().statut !== "ouverte") {
      afficherAlerte("alerte", "Le scrutin n'est pas ouvert actuellement. Revenez pendant la période de vote.");
      return;
    }

    // 2. L'électeur doit être inscrit
    const electeurRef = db.collection("electeurs").doc(cin);
    const electeurSnap = await electeurRef.get();

    if (!electeurSnap.exists) {
      afficherAlerte("alerte", "Vous n'êtes pas inscrit(e) sur la liste électorale. Contactez un organisateur.");
      return;
    }

    const data = electeurSnap.data();

    // 3. Nom / prénom doivent correspondre à l'inscription
    if (normaliserTexte(data.nom) !== normaliserTexte(nom) || normaliserTexte(data.prenom) !== normaliserTexte(prenom)) {
      afficherAlerte("alerte", "Les informations saisies ne correspondent pas à la liste électorale.");
      return;
    }

    // 4. Ne doit pas avoir déjà voté
    if (data.aVote) {
      afficherAlerte("alerte", "Vous avez déjà voté. Merci de votre participation.");
      return;
    }

    // OK : on mémorise la session (le vote côté serveur revérifiera tout)
    sessionStorage.setItem("scrutin_electeur_cin", cin);
    window.location.href = "electeur-vote.html";

  } catch (err) {
    console.error(err);
    afficherAlerte("alerte", "Une erreur est survenue. Merci de réessayer.");
  } finally {
    btnContinuer.disabled = false;
    btnContinuer.textContent = "Vérifier mon identité";
  }
});
