const Discord = require('discord.js');
const sfm = require('../Main/saveFileManagement.js');
const myBot = require('../Main/myBot.js');
const event = require('./event.js');
const finJeu = require('../Main/finJeu.js')
const insuline = require('./priseInsuline.js');
const conseilSport = require('./conseilSport.json');
const conseilNutrition = require('./conseilNutri.json');
const image = require('./images.js');
const perso = require('../Personnage/perso.json');
const calcul = require('./calcul.js');
const as = require('../Graphiques/affichageStats.js');
const config = require('../token.json');
const eventGly = require('./evenement.json');
const tableaux = require('./tableaux.json');
const bk = require('../Evenement/gestionBreakdown.js')

const client = new Discord.Client();
client.login(config.token);

/** Fonction qui lance l'évenement correspondant en fonction de la situation
* @param {string} message - Message discord
* @param {Object} partie - Objet json de la partie
* @param {number} partie.nbJour - Nombre de jour de la partie
* @param {number} partie.numJour - Numéro du jour actuel
* @param {number} partie.partJour - Partie de la journée actuelle
* @param {number} partie.numEvent - Evenement actuel
* @param {Snowflake} partie.player - Identifiant de l'utilisateur
* @param {string[]} tabN - Tableau des noms d'actions
* @param {string[]} tabE - Tableau des emojis d'actions
**/
exports.event = function event(message, partie, tabN, tabE) {

	let fieldTitle = '';
	let fielText = '';
	let image = '';

	//On nettoie le channel des anciens messages
	myBot.clear(message)
	.catch((err) => {
		console.log(err)
	});

	//Si le stress est négatif, on le met à 0
	if(partie.stress < 0) {
		partie.stress = 0;
		sfm.save(partie.player, partie);
	}

	//Si la faim est négatif, on le met à 0
	if(partie.faim < 0) {
		partie.faim = 0;
		sfm.save(partie.player, partie);
	}

	//Si le joueur fait des actions contraires aux principes du personnage (ex: mangé equilibré alors qu'il est obèse) -> breakdown
	if(partie.obesite == 'oui' || partie.fumeur == 'oui') {
		if(partie.breakdown <= 0) {
			bk.breakdown(message, partie);
			if(partie.breakdown <= -10) {
				partie.breakdown = -10;
				sfm.save(partie.player, partie);
			}
		}
	}
	//Si le breakdown est trop haut, le rééquilibré
	if(partie.breakdown > 60) {
		partie.breakdown = 60;
		sfm.save(partie.player, partie);
	}
	// Perte de vie
	if(partie.glycemie > 3 || partie.glycemie <= 0 || partie.faim > 2 || partie.stress > 100) {
		if(partie.numEvent == 0 && partie.amput != 1) {
			console.log('vie-20');
			partie.vie -= 20;
			sfm.save(partie.player, partie);
		}
		else if(partie.amput == 1) {
			partie.amput++;
			sfm.save(partie.player, partie);
		}
	}

	//Si la vie du joueur est à 0, le joueur meurt
	if(partie.vie == 0 && partie.numEvent == 0) {
		console.log('mort');
		partie.mort = true;
		sfm.save(partie.player, partie);
		finJeu.msgFin(message, partie);
		return;
	}

	//Si la vie du joueur est à 20, qu'il ne s'est pas fait amputer et qu'il est en hyperglycémie ou en hypoglycémie, il se fait amputer
	else if(partie.vie == 20 && partie.amput == 0 && (partie.glycemie > 3 || partie.glycemie == 0)) {
		console.log('amputation');
		amput(message, partie);
		partie.amput = 1;
		sfm.save(partie.player, partie);
		return;
	}

	//Passage à l'etape suivante
	partie.numEvent = (partie.numEvent + 1) % 3;

	//Si on passe à un nouveau jour, on réinitialise le soda et les stylos d'insulines
	if(partie.partJour == 0 && partie.numEvent == 0 && partie.evenement) {
		partie.numJour++;
		partie.soda = true; // On remet le soda à vrai afin qu'il puisse en reprendre le lendemain
		partie.nbInsu = 3;
	}
	sfm.save(partie.player, partie);

	//Journal et message du docteur en fin de journée
	if(partie.numJour > 0 && partie.partJour == 0 && partie.numEvent == 0 && partie.evenement) {
		journal(message, partie);
		calcul.glyMatin(partie);
	}

	//Fin du tuto au bout d'une journée
	if(partie.nbJour == partie.numJour) {
		eventFin(message, partie);
		return;
	}

	//Titre de la partie de la journée
	if(partie.numEvent == 0 && partie.evenement) {

		if(partie.partJour == 0) {
			fieldTitle = 'C\'est le matin!';
			if(partie.tuto)
			{
				fieldText = 'Chaque matin, vous devez faire votre prise d\'insuline, choisir votre petit déjeuner ainsi qu\'une activité matinale au choix.';
				image = 'https://i.pinimg.com/originals/33/d4/89/33d48901c6036628a03d0f7b0eab039c.jpg';
			}
			else
			{
				if(partie.breakdown < 15) {
					partie.breakdown += 25;
				}
				else {
					partie.breakdown = 40;
				}
				fieldText = 'Le soleil se réveille, il fait beau, il fait jour.';
				image = 'https://i.pinimg.com/originals/33/d4/89/33d48901c6036628a03d0f7b0eab039c.jpg';
			}
		}
		else if(partie.partJour == 1)
		{
			fieldTitle = 'C\'est l\'après-midi!';
			if(partie.tuto)
			{
				fieldText = 'Tous les après-midi, vous devez faire votre prise d\'insuline et vous pouvez choisir votre repas et une activité.';
				image = 'http://www.pxleyes.com/images/contests/landscapes-td/fullsize/autumn-afternoon-4d4786da5ffbe_hires.jpg';
			}
			else
			{
				fieldText = 'Repas, sieste, travail';
				image = 'http://www.pxleyes.com/images/contests/landscapes-td/fullsize/autumn-afternoon-4d4786da5ffbe_hires.jpg';
			}
		}
		else
		{
			fieldTitle = 'C\'est le soir!';
			if(partie.tuto)
			{
				fieldText = 'Tous les soirs, vous devez faire votre prise d\'insuline et vous pouvez choisir votre diner et si vous sortez avec des amis.';
				image = 'https://steemitimages.com/DQmQASwATrfV59SZLYEmeNcb8HC7uoRxQEq1VsCScqkTbPo/IMG_20170911_090319.jpg';
			}
			else
			{
				fieldText = '😴😴😴';
				image = 'https://steemitimages.com/DQmQASwATrfV59SZLYEmeNcb8HC7uoRxQEq1VsCScqkTbPo/IMG_20170911_090319.jpg';
			}
		}

		//Ecriture du message
		title(message, fieldTitle, fieldText, image);

		//Hyperglycemie
		if(partie.glycemie > 2) {
			let rand = myBot.getRandomInt(4);
			let title = '';
			let text = '';

			switch(rand) {
				case 0:
					title = eventGly.hyper1[0];
					text = eventGly.hyper1[1];
					break;
				case 1:
					title = eventGly.hyper2[0];
					text = eventGly.hyper2[1];
					break;
				case 2:
					title = eventGly.hyper3[0];
					text = eventGly.hyper3[1];
					break;
				case 3:
					title = eventGly.hyper4[0];
					text = eventGly.hyper4[1];
					break;
			}

			const embed = new Discord.RichEmbed()
			.setColor(0x00AE86)
			.addField(title, text)

			message.channel.send({ embed })
			.then(async function(mess) {
				mess.react('➡');
			});

			partie.numEvent--;
			partie.evenement = false;
			sfm.save(partie.player, partie);
			return;
		}
		//Hypoglycemie
		else if(partie.glycemie < 0.6) {
			let rand = myBot.getRandomInt(3);
			let title = '';
			let text = '';

			switch(rand) {
				case 0:
					title = eventGly.hypo1[0];
					text = eventGly.hypo1[1];
					break;
				case 1:
					title = eventGly.hypo2[0];
					text = eventGly.hypo2[1];
					break;
				case 2:
					title = eventGly.hypo3[0];
					text = eventGly.hypo3[1];
					break;
			}

			const embed = new Discord.RichEmbed()
			.setColor(0x00AE86)
			.addField(title, text)

			message.channel.send({ embed })
			.then(async function(mess) {
				mess.react('➡');
			});

			partie.numEvent--;
			partie.evenement = false;
			sfm.save(partie.player, partie);
			return;
		}
	}

	//Rotation des evenements
	if(partie.nbJour != partie.numJour) {
		partie.evenement = true;
		sfm.save(partie.player, partie);
		//Fonction appelé en fonction de la partie du jour et de l'évenement
		switch(partie.partJour) {
			case 0:
				switch(partie.numEvent) {
					case 0:
						eventInsu(message, partie);
						break;
					case 1:
						eventRepas(message, tabN, tabE);
						break;
					case 2:
						eventSport(message, tabN, tabE);
						break;
				}
				break;
			case 1:
				switch(partie.numEvent) {
					case 0:
						eventActu(message, partie);
						break;
					case 1:
						eventRepas(message, tabN, tabE);
						break;
					case 2:
						eventSport(message, tabN, tabE);
						break;
				}
				break;
			case 2:
				switch(partie.numEvent) {
					case 0:
						eventActu(message, partie);
						break;
					case 1:
						eventRepas(message, tabN, tabE);
						break;
					case 2:
						eventSport(message, tabN, tabE);
						break;
				}
				break;
		}
	}
};

/** Fonction qui pour chaque prise d'insuline sauvegarde le nouveau taux de glycemie
* @param {string} message - Message discord
* @param {Object} partie - Objet json de la partie
* @param {number} partie.glycemie - Taux de glycemie actuel de l'utilisateur
* @param {number[]} partie.tabGlycemie - Tableau de tous les taux de glycémie du joueur
**/
function eventInsu(message, partie) {
	//Affichage du graphique du taux de glycémie
	as.graphString(message, partie)
	.then(() => {
		//Prise d'insuline
		insuline.priseInsuline(message, partie);
	});
}

/** Fonction qui raconte un actualité
* @param {string} message - Message discord
* @param {Object} partie - Objet json de la partie
* @param {number} partie.player - Identifiant de l'utilisateur
* @param {number[]} partie.tabGlycemie - Tableau de tous les taux de glycémie du joueur
**/
function eventActu(message, partie) {
	//Affichage du graphique du taux de glycémie
	as.graphString(message, partie)
	.then(() => {
		//Message d'actualité
		const rand = myBot.getRandomInt(28);
		const embed = new Discord.RichEmbed()
		.setColor(0x00AE86)
		.setTitle('**Actualités**')
		.addField(tableaux.actu[rand][0], tableaux.actu[rand][1])

		message.channel.send({ embed })
		.then(async function(mess) {
			mess.react('➡');
		});

		//Création d'une nouvelle valeur dans le tableau de glycemie
		partie.tabGlycemie.push(partie.tabGlycemie[partie.tabGlycemie.length - 1]);
		sfm.save(partie.player, partie);
	});
}

/** Fonction qui met en place un choix de plusieurs activités
* @param {string} message - Message discord
* @param {string[]} tabN - Tableau des noms d'activités
* @param {string[]} tabE - Tableau des emojis d'activités
**/
function eventSport(message, tabN, tabE) {

	//On génère 4 entiers différents aléatoirement

	const rand1 = myBot.getRandomInt(tabN.length);

	let rand2 = rand1;
	while(rand2 == rand1)
	{
		rand2 = myBot.getRandomInt(tabN.length);
	}

	let rand3 = rand1;
	while(rand3 == rand1 || rand3 == rand2)
		rand3 = myBot.getRandomInt(tabN.length);

	let rand4 = rand1;
	while(rand4 == rand1 || rand4 == rand2 || rand4 == rand3)
		rand4 = myBot.getRandomInt(tabN.length);

	//Création d'un message avec les activités associées aux entiers générées précédement
	const embed = new Discord.RichEmbed()
	.setColor(0x00AE86)
	.setTitle('**J\'ai le temps de faire une activité, qu\'est ce que je fais ?**')

	.addField(tabN[rand1] + ' : ', tabE[rand1])
	.addField(tabN[rand2] + ' : ', tabE[rand2])
	.addField(tabN[rand3] + ' : ', tabE[rand3])
	.addField(tabN[rand4] + ' : ', tabE[rand4])
	.addField('Ne rien faire : ', '❌')

	//Envoi du message
	message.channel.send({ embed })
	.then(async function(mess) {
		await mess.react(tabE[rand1]);
		await mess.react(tabE[rand2]);
		await mess.react(tabE[rand3]);
		await mess.react(tabE[rand4]);
		await mess.react('❌');
	});
}

/** Fonction qui met en place un choix de plusieurs repas
* @param {string} message - Message discord
* @param {string[]} tabN - Tableau des noms de repas
* @param {string[]} tabE - Tableau des emojis de repas
**/
function eventRepas(message, tabN, tabE) {

	//On génère 4 entiers différents aléatoirement

	const rand1 = myBot.getRandomInt(tabN.length);

	let rand2 = rand1;
	while(rand2 == rand1)
		rand2 = myBot.getRandomInt(tabN.length);

	let rand3 = rand1;
	while(rand3 == rand1 || rand3 == rand2)
		rand3 = myBot.getRandomInt(tabN.length);

	let rand4 = rand1;
	while(rand4 == rand1 || rand4 == rand2 || rand4 == rand3)
		rand4 = myBot.getRandomInt(tabN.length);

	//Création d'un message avec les repas associées aux entiers générées précédement
	const embed = new Discord.RichEmbed()
	.setColor(0x00AE86)
	.setTitle('**Qu\'est ce que je vais manger ?**')

	.addField(tabN[rand1] + ' : ', tabE[rand1])
	.addField(tabN[rand2] + ' : ', tabE[rand2])
	.addField(tabN[rand3] + ' : ', tabE[rand3])
	.addField(tabN[rand4] + ' : ', tabE[rand4])
	.addField('Ne rien manger : ', '❌');

	//Envoi du message
	message.channel.send({ embed })
	.then(async function(mess) {
		await mess.react(tabE[rand1]);
		await mess.react(tabE[rand2]);
		await mess.react(tabE[rand3]);
		await mess.react(tabE[rand4]);
		await mess.react('❌');
	});
}

/** Fonction qui écrit le message de fin de partie
* @param {string} message - Message discord
* @param {Object} partie - Objet json de la partie
**/
function eventFin(message, partie) {

	if(partie.tuto)
		fieldTextInfo = 'J\'espère que vous avez apprécié le tutoriel.';
	else
		fieldTextInfo = 'J\'espère que vous avez apprécié la partie.';

	const embed = new Discord.RichEmbed()
	.setColor(15013890)

	.addField('C\'est la fin de la partie.', fieldTextInfo)
	.addField('Pour quitter la partie, tapez : ', '/end')

	message.channel.send({ embed });
}

/** Fonction qui écrit le message de perte de membre du joueur
* @param {string} message - Message discord
* @param {Object} partie - Objet json de la partie
**/
function amput(message, partie) {

	//Choix aléatoire du membre sectionner
	const membre = ['bras gauche', 'bras droit', 'jambe gauche', 'jambe droit'];
	const rand = myBot.getRandomInt(4);
	const title = 'Aïe, aïe, aïe, coup dur pour le joueur français !';
	const text = 'Vous venez de perdre votre ' + membre[rand] + ' ! En effet, vous êtes encore en vie. Ce n\'est que la conséquence de vos choix, donc c\'est entièrement votre faute. Mais heureusement, une mauvaise nouvelle en cache une bonne, vous n\'êtes pas mort, c\'est déjà ça.';

	const embed = new Discord.RichEmbed()
	.setColor(0x00AE86)
	.addField(title, text)

	//Envoi du message d'amputation
	message.channel.send({ embed })
	.then(async function(mess) {
		mess.react('➡');
	});
}

/** Fonction qui écrit un message expliquant la partie de la journée
* @param {string} message - Message discord
* @param {string} title - Titre du message
* @param {string} text - Texte du message
* @param {string} image - Image du message
**/
function title(message, title, text, image) {
	const embed = new Discord.RichEmbed()
	.setColor(15013890)
	.setImage(image)
	.addField(title, text)

	message.channel.send({ embed });
}

/** Fonction qui récapitule les actions faites par l'utilisateur pendant la journée
* @param {string} message - Message discord
* @param {Object} partie - Objet json de la partie
* @param {string[]} partie.activite - Liste des actions faites par l'utilisateur
* @param {number} partie.numJour - Numéro du jour
**/
function journal(message, partie) {

	const chanId = myBot.messageChannel(message, 'journal', partie);
	const nbAct = partie.activite.length;
	const activ = [partie.activite[nbAct-5], partie.activite[nbAct-3], partie.activite[nbAct-1]];
	const repas = [partie.activite[nbAct-6], partie.activite[nbAct-4], partie.activite[nbAct-2]];

	// Boucle sur les activités de la journée
	for(let i = 0; i < 3; i++)
	{
		if(activ[i] == 'rienA') // Si l'activité était 'rienA'
		{
			activ[i] = 'repos'; // On le remplace par 'repos'
		}
	}

	// Boucle sur les repas de la journée
	for(let i = 0; i < 3; i++)
	{
		if(repas[i] == 'rienM') // Si le repas était 'rienM'
		{
			repas[i] = 'saut de repas'; // On le remplace par 'saut de repas'
		}
	}

	// On met en minuscule les activités et les repas
	activ[1] = activ[1].toLowerCase();
	activ[2] = activ[2].toLowerCase();
	repas[1] = repas[1].toLowerCase();
	repas[2] = repas[2].toLowerCase();

	// Embed affichant le journal de bord, les récapitulatifs des activités et des repas
	const embed = new Discord.RichEmbed()
	.setColor(15013890)
	.setTitle('Journal de bord - Jour ' + partie.numJour)
	.addField('Récapitulatif des activités : ', activ[0] + ', ' + activ[1] + ' et ' + activ[2] + '.')
	.addField('Récapitulatif des repas : ', repas[0] + ', ' + repas[1] + ' et ' + repas[2] + '.')

	message.guild.channels.get(chanId).send({ embed })
	.then(async function(mess) {
		eventMedecin(mess, partie);
	});
}

/** Fonction qui affiche le bilan du patient donné par la médecin
* @param {string} message - Message discord
* @param {string} partie.nom - Nom du personnage
* @param {number} partie.poids - Poids du personnage
* @param {number} partie.tabGlycemie - Tableau contenant tous les taux de glycémie
* @param {Object} partie - Objet json de la partie
**/
function eventMedecin(message, partie) {

	const sommeImpactActivite = calculImpactActivite(partie);
	const sommeImpactNutrition = calculImpactNutrition(partie);
	let numConseilActivite; // Numéro du conseil pour l'activité
	let numConseilNutrition; // Numéro du conseil pour la nutrition
	let numImage; // Numéro pour l'image décrivant la journée du joueur
	const sommeTotale = sommeImpactActivite + sommeImpactNutrition ; // Somme totale permettant de connaitre le numéro de l'image à afficher

	// Conseil pour le sport :

	if (sommeImpactActivite <= 3) numConseilActivite = conseilSport.c4;
	else if (sommeImpactActivite <= 7) numConseilActivite = conseilSport.c3;
	else if (sommeImpactActivite <= 12) numConseilActivite = conseilSport.c2;
	else numConseilActivite = conseilSport.c1;

	// Conseil pour la nutrition

	if (sommeImpactNutrition == 0) numConseilNutrition = conseilNutrition.c5;
	else if (sommeImpactNutrition > 0 && sommeImpactNutrition <= 3) numConseilNutrition = conseilNutrition.c4;
	else if (sommeImpactNutrition <= 7) numConseilNutrition = conseilNutrition.c3;
	else if (sommeImpactNutrition <= 12) numConseilNutrition = conseilNutrition.c2;
	else numConseilNutrition = conseilNutrition.c1;

	// Numéro de l'image

	if (sommeTotale <= 6) numImage = 4;
	else if (sommeTotale <= 14) numImage = 3;
	else if (sommeTotale <= 24) numImage = 2;
	else numImage = 1;

	// Message du médecin qui sera affiché

	const embed = new Discord.RichEmbed()
	.setTitle('Bilan médical de ' + partie.nom)
	.setAuthor('Docteur Greece', 'https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/apple/155/female-health-worker-type-1-2_1f469-1f3fb-200d-2695-fe0f.png')
	.setColor(808367)
	.setFooter('Bilan réalisé par Dr Alda Greece', 'https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/apple/155/female-health-worker-type-1-2_1f469-1f3fb-200d-2695-fe0f.png')
	.setImage(image.choixImage(numImage))
	.setThumbnail('https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Caduceus.svg/299px-Caduceus.svg.png') // Symbole médecine
	.setTimestamp()
	.addField('Poids', partie.poids + ' kg')
	.addField('Taux de glycémie', partie.tabGlycemie[partie.tabGlycemie.length - 1	].toFixed(2).toString() + ' g/L')
	.addField('Conseil pour les activités', '```\n' + numConseilActivite + '```')
	.addField('Conseil pour la nutrition', '```\n' + numConseilNutrition + '```')
	message.channel.send({ embed });
}

/** Fonction qui permet de calculer l'impact des activités du joueur
* @param {Object} partie - Objet json de la partie
* @param {Integer} partie.impactActivite - Tableau contenant les impacts des activités du joueur
* @return impactJour, qui est l'impact sportif journalière du joueur
*/
function calculImpactActivite(partie) {
	const nbImpact = partie.impactActivite.length; // On récupère le nombre d'impacts
	const impactJour = partie.impactActivite[nbImpact - 3] + partie.impactActivite[nbImpact - 2] + partie.impactActivite[nbImpact - 1]; // On fait la somme des 3 impacts sur les activités
	return impactJour; // On retourne l'impact sportif journalier du joueur
}

/** Fonction qui permet de calculer l'impact nutritionnel du joueur
* @param {Object} partie - Objet json de la partie
* @param {Integer} partie.impactNutrition - Tableau contenant les impacts de la nutrition du joueur
* @return impactJour, qui est l'impact nutritionnel journalier du joueur
*/
function calculImpactNutrition(partie) {
	const nbImpact = partie.impactNutrition.length; // On récupère le nombre d'impacts
	const impactJour = partie.impactNutrition[nbImpact - 3] + partie.impactNutrition[nbImpact - 2] + partie.impactNutrition[nbImpact - 1]; // On fait la somme des 3 impacts sur les repas
	return impactJour; // On retourne l'impact nutritionnel journalier du joueur
}
