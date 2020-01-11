const Discord = require('discord.js');
const client = new Discord.Client();
const config = require('../token.json');
client.login(config.token);

exports.calculBk = function(partie, tab, index) {
  let val;
  if(partie.obesite == 'oui') {
    val = tab[index][4];
  }
  else if (partie.obesite == 'oui') {
    val = tab[index][3];
  }
  return val;
};

exports.breakdown = function(message, partie) {
  let text;
  if(partie.obesite == 'oui') {
    text = 'J\'en ai marre de suivre un regime strict.';
  }
  else {
    text = 'J\'en ai marre de faire des ativités que j\'aime pas.';
  }
  const embed = new Discord.RichEmbed()
	.setColor(0x00AE86)
	.addField('**Crise de nerf**', text + '\nJe fais ce que je veux maintenant');

  message.channel.send({ embed })
}
