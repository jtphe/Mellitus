
/** Fonction qui permet de sélectionner la bonne image à afficher dans le bilan journalier du personnage
 * @param {number} resultat - résultat qui est le total des impacts alimentaires, activités du personnage pour le jour
 * @return {string} lien - lien contenant l'image à afficher
 */
exports.choixImage = function choixImage(resultat)
{
  switch(resultat)
  {
    case 1 :
      return 'https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/apple/155/hundred-points-symbol_1f4af.png';
      break;
    case 2 :
      return 'https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/apple/155/clapping-hands-sign_1f44f.png';
      break;
    case 3 :
      return 'https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/apple/155/thinking-face_1f914.png';
      break;
    case 4 :
      return 'https://www.emojimeaning.com/img/img-apple-64/1f44e.png'
      break;
  }
}
