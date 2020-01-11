const Discord = require('discord.js');
const sfm = require('../Main/saveFileManagement.js');
const config = require('../token.json');
const myBot = require('../Main/myBot.js');
const initJeu = require('../Main/initJeu.js');

let state = -1;
let message;
const client = new Discord.Client();
const tabNb = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
let partie;
let image;

client.on('messageReactionAdd', (reaction, user) => {
  if(user.bot) return;

  if(state == 0 || state == 6) {
    switch(reaction.emoji.name) {
      case '🚹':
        state += 1;
        partie.tabPerso.push('Homme');
        reaction.message.delete();
        image = 'https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/apple/155/mens-symbol_1f6b9.png';
        nom();
        break;
      case '🚺':
        state += 1;
        partie.tabPerso.push('Femme');
        reaction.message.delete();
        image = 'https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/apple/155/womens-symbol_1f6ba.png';
        nom();
        break;
      case '🚬':
        partie.tabPerso.push('oui');
        reaction.message.delete();
        finalisation();
        break;
      case '🚭':
        partie.tabPerso.push('non');
        reaction.message.delete();
        finalisation();
        break;
      }
  }
});

client.on ('message', mess => {

  if (mess.author.bot) return;

  let param = mess.content.trim();

  switch (state) // Permettant de choisir l'état de la création du personnage
  {
    case 1:
          myBot.clear(message);
          param = param.charAt(0).toUpperCase() + param.slice(1);
          partie.tabPerso.push(param);
          state += 1;
          prenom();
          break;
    case 2:
          myBot.clear(message);
          state += 1;
          param = param.charAt(0).toUpperCase() + param.slice(1);
          partie.tabPerso.push(param);
          age();
          break;
    case 3:
      myBot.clear(message);
      if (testNombre(mess) && mess.content > 10 && mess.content < 120) {
        partie.tabPerso.push(mess.content + ' ans');
        state += 1;
        taille();
      }
      else {
        message.channel.send('Veuillez saisir un âge correct');
      }
      break;
    case 4:
      myBot.clear(message);
      if (testNombre(mess) && mess.content > 50 && mess.content < 250) {
        partie.tabPerso.push(mess.content + ' cm');
        state += 1;
        poids();
      }
      else {
        message.channel.send('Veuillez saisir une taille correcte');
      }
      break;
    case 5:
      myBot.clear(message);
      if (testNombre(mess) && mess.content > 35 && mess.content < 200) {
          partie.tabPerso.push(mess.content + ' kg');
          state += 1;
          fumeur();
      }
      else {
        message.channel.send('Veuillez saisir un poids correct');
      }
      break;
  }
});

/** Fonction pour créer le personnage
 * @param {string} pMess - Message discord
 * @param {Object} part - Objet json de la partie
 */
exports.creerPerso = function(pMess, part)
{
  myBot.clear(pMess);
  partie = part;
  message = pMess;
  state = 0;
  genre();
};

/** Fonction qui affiche un embed demandant le sexe de l'utilisateur
 */
function genre()
{
  message.channel.send({ embed: {
    color:0x00AE86,
    title:'Création du personnage',
    description: 'Homme/Femme?',
  } }
).then(async function(mGenre) {
  await mGenre.react('🚹');
  await mGenre.react('🚺');
});
}

/** Fonction qui affiche un embed demandant le nom de l'utilisateur
 */
function nom()
{
  message.channel.send({ embed: {
    title:'Création du personnage',
    color:0x00AE86,
    description: 'Quel est votre nom ?',
  } });
}

/** Fonction qui affiche un embed demandant le prénom de l'utilisateur
 */
function prenom()
{
  message.channel.send({ embed: {
    color:0x00AE86,
    title:'Création du personnage',
    description: 'Quel est votre prénom ?',
  } });
}

/** Fonction qui affiche un embed demandant l'âge de l'utilisateur
 */
function age()
{
  message.channel.send({ embed: {
    color:0x00AE86,
    title:'Création du personnage',
    description: 'Quel est votre age ?',
  } });
}

/** Fonction qui affiche un embed demandant la taille de l'utilisateur
 */
function taille()
{
  message.channel.send({ embed: {
    color:0x00AE86,
    title:'Création du personnage',
    description: 'Quelle est votre taille (en cm) ?',
  } });
}

/** Fonction qui affiche un embed demandant le poids de l'utilisateur
 */
function poids()
{
  message.channel.send({ embed: {
    color:0x00AE86,
    title:'Création du personnage',
    description: 'Quel est votre poids (en kg)?',
  } });
}

function fumeur() {
  message.channel.send({ embed: {
    color:0x00AE86,
    title:'Création du personnage',
    description: 'Etes vous fumeur ?',
  } })
  .then(async function(mGenre) {
      await mGenre.react('🚬');
      await mGenre.react('🚭');
    });
}

function finalisation() {
  state += 1;
  partie.nom = partie.tabPerso[2] + ' ' + partie.tabPerso[1];
  partie.sexe = partie.tabPerso[0];
  partie.age = parseInt(partie.tabPerso[3]);
  partie.taille = parseInt(partie.tabPerso[4]);
  partie.poids = parseInt(partie.tabPerso[5]);
  partie.fumeur = partie.tabPerso[6];
  partie.obesite = calculIMC(partie);
  sfm.save(partie.player, partie);
  calculIMC(partie);
  const chanId = myBot.messageChannel(message, 'personnage', partie);

  const fieldTextPerso = 'Voici votre personnage :';

  message.guild.channels.get(chanId).send({ embed: {
      color: 15013890,
      fields: [{
          name: 'Channel Personnage',
          value: fieldTextPerso,
      }],
  } }).then(() => {
      message.guild.channels.get(chanId).send({ embed: {
          color: 0x00AE86,
          author:
          {
            name: 'Personnage ',
            icon_url: image,
          },
          fields: [{
              name: 'Nom',
              value: partie.nom,
          },
          {
              name: 'Sexe',
              value: partie.sexe,
          },
          {
              name: 'Age',
              value: partie.tabPerso[3],
          },
          {
              name: 'Taille',
              value: partie.tabPerso[4],
          },
          {
              name: 'Poids',
              value: partie.tabPerso[5],
          },
          {
              name: 'Fumeur ?',
              value: partie.tabPerso[6],
          }],
      } })
      .then(() => {

        myBot.clear(message)
        .catch((err) => {
          console.log(err);
        });

        initJeu.accueilMedecin(message, partie);
      });
  });
}

function calculIMC(partie) {
    const tailEnM = partie.taille / 100;
    const imc = partie.poids / (tailEnM * tailEnM);
    let obesite;
    if(imc < 30) {
      obesite = 'non';
    }
    else {
      obesite = 'oui';
    }
    return obesite;
}

function testNombre(message) {
  let isNb = true;
  if(message.content.length == 2 || message.content.length == 3) {
    for(let i = 0; i < message.content.length; i++) {
      if(!tabNb.includes(message.content.charAt(i))) {
        isNb = false;
      }
    }
  }
  else{
    isNb = false;
  }
  return isNb;
}

client.login(config.token);
