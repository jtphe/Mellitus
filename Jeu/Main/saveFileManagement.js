const fs = require('fs');

/** Fonction pour recuperer l'objet de sauvegarde depuis le fichier
* @param {Snowflake} userId - id du joueur
* return {Object} save - objet json de la partie
**/
exports.loadSave = function loadSave(userId) {
  let save = fs.readFileSync('../Sauvegardes/' + userId + '.json');
  save = JSON.parse(save);
  return save;
};

/** Fonction pour enregistrer la sauvegarde modifiée
* @param {Snowflake} userId - id du joueur
* @param {Object} partie - objet json de la partie
**/
exports.save = function save(userId, partie) {
  const fileName = '../Sauvegardes/' + userId + '.json';
  try{
  	fs.writeFileSync(fileName, JSON.stringify(partie, null, 2));
  }
  catch(e){
  	fs.createWriteStream(fileName);
  	fs.writeFileSync(fileName, JSON.stringify(partie, null, 2));
  }
};


/** Fonction pour supprimer un fichier de sauvegarde
* @param {Snowflake} userId - id du joueur
**/
exports.deleteSave = function deleteSave(userId) {
  fs.unlinkSync('../Sauvegardes/' + userId + '.json');
};
