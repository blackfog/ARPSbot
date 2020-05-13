// TODO: Decided that the character features are not a priority (and may be dropped); disabled for now

// import * as Discord from 'discord.js';

// import { Command } from '../lib/command';
// import { Database } from '../lib/database';

// export class as extends Command {
//     constructor() {
//         super();

//         this.name = 'as';
//         this.helpName = '/as';
//         this.description = 'Post a message as a character (see **/char**)';
//         this.usage = [
//             '**/as** __name__ **say** __text__ [ __language__ ]',
//             '**/as** __name__ **do** __text__'
//         ];
//     }

//     private async isCharacterValid(name: string, message: Discord.Message, db: Database) {
//         return true;
//         const count = await db.Characters.count({
//             where: {
//                 guild: message.guild.id,
//                 user: message.author.id,
//                 name: name
//             }
//         });

//         return count === 1;
//     }

//     public execute(message: Discord.Message, args: string[], db: Database) {
//         if (args.length < 3) {
//             return this.showUsage(message);
//         }

//         const name      = args[0];
//         const operation = args[1].toLowerCase();
//         const action    = args[2].replace(/"/g, '');
//         const language  = args[3];

//         if (operation !== "say" && operation !== "do") {
//             return this.showUsage(message, "Invalid action:");
//         }

//         if (operation !== "say" && language !== undefined) {
//             return this.showUsage(message, 'Language is only allowed with the say operator:');
//         }

//         this.isCharacterValid(name, message, db)
//             .then(isValid => {
//                 if (!isValid) {
//                     return Promise.reject();
//                 }
//             })
//             .then(() => {
//                 let text = '';

//                 switch (operation) {
//                     case 'say':
//                         // const lang = language === undefined ? '' : `, in ${language},`;
//                         // text = `**${name}**${lang} says:\n\n${action}`;

//                         const embed = new Discord.MessageEmbed()
//                             .setTitle(`${name} says`)
//                             .setDescription(action)
//                             .setColor(0x76D6FF);

//                         if (language !== undefined) {
//                             embed.setFooter(`in ${language}`);
//                         }

//                         message.channel.send(embed);
//                         return;

//                         break;
//                     case 'do':
//                         text = `_**${name}** ${action}_`;
//                         break;
//                 }

//                 message.channel.send(text);
//             })
//             .catch(() => {
//                 message.reply('you don\'t have a character with that name.');
//             });
//     }
// }

// export const instance = as;
