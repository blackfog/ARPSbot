// TODO: Decided that the character features are not a priority (and may be dropped); disabled for now

// import * as Discord from 'discord.js';

// import { Command } from '../lib/command';
// import { Database } from '../lib/database';

// export class asnpc extends Command {
//     constructor() {
//         super();

//         this.name = 'asnpc';
//         this.helpName = '/asnpc';
//         this.description = '[GM] Post a message as an NPC';
//         this.usage = [
//             '**/asnpc** __name__ **say** __text__ [ __language__ ]',
//             '**/asnpc** __name__ **do** __text__',
//             '\n⚠️ Available to the channel\'s GM only'
//         ];
//         this.role = /-gm$/; // FIXME: this should probably be set in config.json
//     }

//     private async isGM(message: Discord.Message, db: Database) { // FIXME: the table needs to have a guild column and it should be checked as well
//         if (message.member.roles.cache.some(r => r.name.match(this.role).length > 0)) { // can be GM
//             const count = await db.GMChannels.count({ // is GM
//                 where: {
//                     user: message.author.id,
//                     channel: message.channel.id
//                 }
//             });

//             return count === 1;
//         }

//         return false;
//     }

//     public execute(message: Discord.Message, args: string[], db: Database) {
//         if (args.length < 3) {
//             return this.showUsage(message);
//         }

//         this.isGM(message, db)
//             .then(isGM => {
//                 if (!isGM) {
//                     return Promise.reject();
//                 }
//             })
//             .then(() => {
//                 const name      = args[0];
//                 const operation = args[1].toLowerCase();
//                 const action    = args[2].replace(/"/g, '');
//                 const language  = args[3];

//                 if (operation !== "say" && operation !== "do") {
//                     return this.showUsage(message, "Invalid action:");
//                 }

//                 if (operation !== "say" && language !== undefined) {
//                     return this.showUsage(message, 'Language is only allowed with the say operator:');
//                 }

//                 let text = '';

//                 switch (operation) {
//                     case 'say':
//                         const lang = language === undefined ? '' : `, in ${language},`;
//                         text = `**${name}**${lang} says:\n\n${action}`;
//                         break;
//                     case 'do':
//                         text = `_**${name}** ${action}_`;
//                         break;
//                 }

//                 message.channel.send(text);
//             })
//             .catch(() => {
//                 message.reply('you are not this channel\'s GM.');
//             });
//     }
// }

// export const instance = asnpc;
