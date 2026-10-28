/* Cadence, par Hémistiches : tarifs et règles de calcul, communs aux pages française et anglaise.
   Source unique : toute modification de prix, de seuil ou de règle se fait ici, et nulle part ailleurs.
   Les textes affichés restent dans chaque page ; ce fichier ne contient que des nombres et des calculs. */
(function (g) {
  "use strict";

  var TARIFS = {
    version: "2026-10-28",
    heuresParJour: 7,
    plancherJour: 650,            // aucun tarif journalier en dessous
    tauxHoraire: 150,             // taux horaire habituel du cabinet : dépassements accordés
    reportMaxHeures: 3,           // heures non consommées reportables sur le mois suivant uniquement
    dureeInitialeForfaits: 6,     // mois
    preavisMois: 1,
    // Direction juridique externalisée : prix par jour selon le volume mensuel et la durée initiale convenue
    externalisee: [
      { jours: 2, cle: "essentiel", lt3: 900, de3a6: 825, des6: 750 },
      { jours: 4, cle: "regulier",  lt3: 875, de3a6: 800, des6: 725 },
      { jours: 8, cle: "integre",   lt3: 850, de3a6: 775, des6: 700 }
    ],
    // Direction juridique de transition : sur site, 12 à 16 jours par mois
    transition: { joursMin: 12, joursMax: 16, lt3: 800, de3a6: 725, des6: 650 },
    secretariatAnnuel: 500,       // société simple : approbation annuelle des comptes, registres, contrôle de la DBE
    // Opérations sur la société : coût HT du prestataire de formalités (grille publique, frais de greffe et d’annonce compris),
    // multiplié par coefOperations puis arrondi au 50 € supérieur (100 € au-delà de 1 000 €). Droits d’enregistrement en sus.
    coefOperations: 2,
    coefOperationsForfait: 1.5,   // tarif préférentiel des clients en direction juridique externalisée (hors vie sociale courante, comprise dans le volume)
    coutsOperations: {
      cessionActions: 190.00,
      cessionParts: 239.96,
      cessionPartsSC: 300.01,
      sommeil: 226.00,
      cloture: 275.01,
      etablissement: 302.02,
      modification: 611.01,
      siegeHors: 728.86,
      reductionPertes: 662.01,
      dissolutionLiquidation: 811.80,
      augmentation: 892.01,
      tup: 1012.01,
      transformation: 1107.08
    }
  };

  /* ---------- Prix ---------- */
  function tranche(mois) {           // mois : nombre de mois de la durée initiale convenue ; null = moins de trois mois
    if (mois === null || mois < 3) return "lt3";
    return mois < 6 ? "de3a6" : "des6";
  }
  function formule(jours) {
    for (var i = 0; i < TARIFS.externalisee.length; i++) if (TARIFS.externalisee[i].jours === jours) return TARIFS.externalisee[i];
    return null;
  }
  function prixJourExt(jours, tr) { return formule(jours)[tr]; }
  function mensuelExt(jours, tr) { return jours * prixJourExt(jours, tr); }
  function prixOperation(cle, forfait) {
    var v = TARIFS.coutsOperations[cle] * (forfait ? TARIFS.coefOperationsForfait : TARIFS.coefOperations);
    return v < 1000 ? Math.ceil(v / 50) * 50 : Math.ceil(v / 100) * 100;
  }
  function heures(jours) { return jours * TARIFS.heuresParJour; }
  function prixJourTransition(tr) { return TARIFS.transition[tr]; }
  function mensuelTransition(jours, tr) { return jours * prixJourTransition(tr); }

  /* ---------- Arrêt anticipé d'un forfait externalisé de six mois (règle retenue le 25 octobre 2026) ----------
     Le tarif publié pour la durée réellement exécutée s'applique (moins de 3 mois, ou de 3 à moins de 6 mois),
     sur les mois commencés ; la différence avec les provisions réglées est facturée. Les dépassements accordés,
     facturés à part, ne sont pas concernés. Aucune mensualité future n'est ajoutée. */
  function recalculDepart(jours, moisExecutes, provisionsRecues) {
    var m = Math.max(1, Math.ceil(moisExecutes || 1));
    var du = mensuelExt(jours, tranche(moisExecutes || 1)) * m;
    return { du: du, recu: provisionsRecues, solde: du - provisionsRecues };
  }
  /* Transition : journées accomplies facturées au tarif de la durée réellement exécutée (règle retenue le 25 octobre 2026). */
  function recalculTransition(joursAccomplis, moisExecutes, sommesRecues) {
    var du = joursAccomplis * prixJourTransition(tranche(moisExecutes));
    return { du: du, recu: sommesRecues, solde: du - sommesRecues };
  }

  /* ---------- Orientation ----------
     Trois décisions séparées : 1) le mode d'intervention, 2) le volume récurrent, 3) la durée et le tarif.
     Le volume est estimé en jours par mois à partir de situations concrètes ; le prospect ne le choisit jamais lui-même.
     Le secteur ne fait que pondérer une charge réelle ; la taille de l'entreprise n'entre pas dans le calcul ;
     le retard accumulé et les opérations exceptionnelles n'augmentent pas le forfait récurrent. */
  var POIDS = {
    contrats: { c1: 0.75, c2: 1.75, c3: 3.5, c4: 6 },
    fonctions: { vie: 0.25, reglementation: 0.75, donnees: 0.5, contentieux: 0.75, pi: 0.25, assurances: 0.25, conseils: 0.5, conformite: 0.5 },
    urgences: { rare: 0, mois: 0.5, semaine: 1.5 },
    referentAbsent: 0.5,
    multiplicateurs: { multi: 0.2, intervenants: 0.1, secteur: 0.15, plusieurs: 0.1 }
  };
  var SEUILS = { essentiel: 2.5, regulier: 5, integre: 8.5, transitionMin: 12, transitionMax: 16 };

  function volume(a) {
    var s = POIDS.contrats[a.contrats] || 0, sources = [];
    sources.push({ cle: "contrats", v: s });
    (a.fonctions || []).forEach(function (f) { if (POIDS.fonctions[f]) { s += POIDS.fonctions[f]; sources.push({ cle: f, v: POIDS.fonctions[f] }); } });
    var p = a.perimetre || [], m = 1;
    if (p.indexOf("multi") > -1) m += POIDS.multiplicateurs.multi;
    if (p.indexOf("intervenants") > -1) m += POIDS.multiplicateurs.intervenants;
    if (a.secteur === "sante" || a.secteur === "reglemente") m += POIDS.multiplicateurs.secteur;
    if (a.referent === "plusieurs") m += POIDS.multiplicateurs.plusieurs;
    var add = (POIDS.urgences[a.urgences] || 0) + (a.referent === "non" ? POIDS.referentAbsent : 0);
    if (POIDS.urgences[a.urgences]) sources.push({ cle: "urgences", v: POIDS.urgences[a.urgences] });
    var v = Math.round((s * m + add) * 10) / 10;
    sources.sort(function (x, y) { return y.v - x.v; });
    return { jours: v, multiplicateur: Math.round(m * 100) / 100, sources: sources };
  }

  function duree(a) {
    if (a.duree === "nsp") return { incertaine: true, mois: null, tranche: null };
    if (a.duree === "lt3") return { incertaine: false, mois: null, tranche: "lt3" };
    var m = parseInt(a.duree, 10);
    return { incertaine: false, mois: m, tranche: tranche(m) };
  }

  function orienter(a) {
    var r = { mode: null, cas: null, jours: null, volume: null, duree: null, reprise: null, exceptionnelle: false, raisons: [] };
    if (a.besoin === "ponctuel") { r.mode = "ponctuel"; r.cas = "ponctuel"; r.raisons.push("besoin-ponctuel"); return r; }
    var vol = volume(a), V = vol.jours, temporaire = (a.besoin === "remplacement" || a.besoin === "renfort");
    r.volume = vol; r.duree = duree(a);
    r.reprise = a.retard === "important" ? "devis" : (a.retard === "quelques" ? "absorbee" : null);
    r.exceptionnelle = a.exceptionnelle === "oui";
    if (temporaire) r.raisons.push("besoin-" + a.besoin);

    function forfaitPour(v) { return v <= SEUILS.essentiel ? 2 : (v <= SEUILS.regulier ? 4 : 8); }

    // La transition se définit par une durée limitée (remplacement, départ, renfort) et un volume de 12 à 16 jours :
    // la présence ne choisit pas le mode, elle sert seulement à prévoir les journées sur place.
    if (V > SEUILS.transitionMax) { r.mode = "personnalise"; r.cas = "au-dela-16"; }
    else if (V >= SEUILS.transitionMin && temporaire) {
      r.mode = "transition"; r.cas = "transition";
      r.jours = Math.min(SEUILS.transitionMax, Math.max(SEUILS.transitionMin, Math.round(V)));
    }
    else if (V >= SEUILS.transitionMin) { r.mode = "personnalise"; r.cas = a.presence === "soutenue" ? "presence-permanente" : "volume-eleve-a-distance"; }
    else if (a.presence === "soutenue") { r.mode = "personnalise"; r.cas = "presence-faible-volume"; r.jours = V > SEUILS.integre ? null : forfaitPour(V); r.raisons.push("presence-soutenue"); }
    else if (a.presence === "mensuelle") { r.mode = "personnalise"; r.cas = "presence-mensuelle"; r.jours = V > SEUILS.integre ? null : forfaitPour(V); r.raisons.push("presence-mensuelle"); }
    else if (V > SEUILS.integre) { r.mode = "personnalise"; r.cas = "entre-8-et-12"; }
    else { r.mode = "externalisee"; r.cas = "forfait"; r.jours = forfaitPour(V); }
    return r;
  }

  /* Scénarios de prix pour une orientation donnée (pour l'affichage) */
  function scenarios(r) {
    var tr = ["des6", "de3a6", "lt3"], out = [];
    if (r.mode === "externalisee" || (r.mode === "personnalise" && r.jours && r.jours <= 8)) {
      tr.forEach(function (t) { out.push({ tranche: t, prixJour: prixJourExt(r.jours, t), mensuel: mensuelExt(r.jours, t) }); });
    } else if (r.mode === "transition") {
      tr.forEach(function (t) { out.push({ tranche: t, prixJour: prixJourTransition(t), mensuel: mensuelTransition(r.jours, t) }); });
    }
    return out;
  }

  g.CADENCE = {
    TARIFS: TARIFS, POIDS: POIDS, SEUILS: SEUILS,
    tranche: tranche, formule: formule, prixJourExt: prixJourExt, mensuelExt: mensuelExt, heures: heures, prixOperation: prixOperation,
    prixJourTransition: prixJourTransition, mensuelTransition: mensuelTransition,
    recalculDepart: recalculDepart, recalculTransition: recalculTransition,
    volume: volume, orienter: orienter, scenarios: scenarios
  };
})(typeof window !== "undefined" ? window : this);
