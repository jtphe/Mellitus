const Discord = require('discord.js');
const fs = require('fs');
const event = require('./event.js');
const sfm = require('../Main/saveFileManagement.js');
const calcul = require('./calcul.js');
const config = require('../token.json');

const client = new Discord.Client();
client.login(config.token);

const tabNb = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

/** Fonction qui affiche un embed pour la prise d'insuline et qui récupère la valeur
* @param {string} message - Message discord
* @param {Object} partie - Objet json de la partie
* @param {number} partie.insuline - Permet de prendre de l'insuline, ou pas
 */
exports.priseInsuline = function priseInsuline(message, partie) {

  let insuline = '-1';

  const text = 'C\'est l\'heure de la prise d\'insuline.';

  //On affiche le message qui prévient le joueur qu'il faut prendre un dose d'insuline
  const embed = new Discord.RichEmbed()
    .setColor(0x00AE86)
    .addField(text, 'Je dois prendre de l\'insuline (entre 0 et 80 unités): ')
  message.channel.send({ embed });

  partie.insuline = 1;
  sfm.save(message.author.id, partie);

  client.on ('message', message => {

    //Si l'auteur du message est un bot, on fait rien
    if(message.author.bot) return;

    //Si le message ne contient pas de préfix, que le joueur est en partie et que le channel du message est le channel 'hub'
    if(!message.content.startsWith(config.prefix) && message.member.roles.some(r=>['Joueur'].includes(r.name)) && message.channel.name == 'hub') {
      let bool = true;

      //Si le joueur est bien dans une phase de prise d'insuline
      if (partie.insuline == 1)
      {
        //Si le message est bien un entier
        if(message.content.length == 1 || message.content.length == 2) {
          for(let i = 0; i < message.content.length; i++) {
            if(!tabNb.includes(message.content.charAt(i))) {
              bool = false;
            }
          }
        }
        else{
          bool = false;
        }

        //On convertit le message en entier
        insuline = parseInt(message.content);

        //Si le message était bien un entier
        if(bool == true)
        {
          //Si la dose n'est pas comprise entre 0 et 80
          if(insuline < 0 || insuline > 80 || isNaN(insuline))
          {
            //Message d'erreur
            message.channel.send('Entrez une valeur comprise entre 0 et 80 !');
          }
          //Sinon
          else
          {
            //On calcule le nouveau taux de glycémie
            calcul.glyInsu(partie, insuline);
            partie.insuline = 0;
            sfm.save(message.author.id, partie);
            message.react('➡');
          }
        }
        else{
          message.channel.send('Mettez-y du votre aussi !')
        }
      }
    }
  });
}
