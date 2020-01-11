const calcul = require('./calcul.js');

/** Fonction qui calcul la dose de glycémie à prendre
 * @param {Object} partie - Objet json de la partie
 * @param {number} partie.poids - Poids du personnage
 * @return {number} doseGlycemie - La dose de glycémie
 */
exports.doses = function doses(partie) {

	//Dose initiale d'insuline (1/10 du poids)
	const doseInit = partie.poids / 10;

	//Dose à atteindre d'insuline (4/10 du poids)
	const doseObj = 0.4 * partie.poids;

	//Augmentation quotidienne de la dose d'insuline en fonction du la dose à atteindre
	let augmentation = 0;

	if(doseObj < 15)
		augmentation = 1
	else if (doseObj < 30)
		augmentation = 2
	else if (doseObj < 45)
		augmentation = 3
	else
		augmentation = 4

	//On renvoie un tableau comprenant la dose initiale, la dose à atteindre et l'augmentation quotidienne
	const doseGlycemie = [doseInit, doseObj, augmentation];
	return doseGlycemie;
};

/** Fonction qui calcul la dose de glycémie du matin
 * @param {Object} partie - Objet json de la partie
 * @param {number} partie.tabGlycemie - Tableau contenant tous les taux de glycémie
 * @param {number} partie.glycemie - Taux de glycémie actuelle
 * @return {number} doseGlycemie - La dose de glycémie
 */
exports.glyMatin = function glyMatin(partie) {

	//On détermine le taux de glycémie du joueur, 2 jours auparavant
	let tauxAvantHier = 0;
	if(partie.tabGlycemie.length > 4)
		tauxAvantHier = partie.tabGlycemie[partie.tabGlycemie.length - 6];
	else
		tauxAvantHier = partie.tabGlycemie[0];

	//Taux de glycémie de la veille
	const tauxHier = partie.glycemie;
	let res = 0;

	//Deux calculs differents en fonction de si le joueur est dans les bornes ou non
	if(tauxHier > 1.3 || tauxHier < 0.7) {
		res = partie.tabGlycemie[0] + (Math.round(Math.abs(tauxAvantHier - tauxHier) * 100) / 100) * 0.2;
	}
	else{
		res = partie.tabGlycemie[0] + (tauxHier - 1.3);
	}

	partie.glycemie = res;
	partie.tabGlycemie.push(res);
};

/** Fonction qui calcul la glycémie lente
 * @param {Object} partie - Objet json de la partie
 * @param {number} partie.tabGlycemie - Tableau contenant tous les taux de glycémie
 * @param {number} partie.glycemie - Taux de glycémie actuelle
 * @param {number} dose - La dose d'insuline que l'on prend
 */
exports.glyInsu = function glyInsu(partie, dose) {

	//On récupère le taux de glycémie de départ et celui du présent
	const tauxInit = partie.tabGlycemie[0];
	const tauxPresent = partie.glycemie;
	let res = 0;

	//Calcul du taux de glycémie en fonction de la dose d'insuline, du taux initial et du poids
	const delta = Math.abs(tauxInit - 1.3);
	const effect = delta / calcul.doses(partie)[1];

	res = Math.round((tauxPresent - Math.abs(dose * effect)) * 100) / 100;

	//Si le taux d'insuline devient négatif, on le met à 0
	if(res < 0)
		res = 0;

	partie.glycemie = res;
	partie.tabGlycemie.push(res);
}
