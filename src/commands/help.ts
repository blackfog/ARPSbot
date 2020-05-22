import * as Discord from 'discord.js';

import { Command } from '../lib/command';
import { Database } from '../lib/database';

export class help extends Command {
    constructor() {
        super();

        this.name = 'help';
        this.helpName = '/help';
        this.description = 'Get help with bot commands';
        this.usage = [
            '**/help** [ __command__ ]'
        ];
    }

    public execute(message: Discord.Message, args: string[], db: Database, context) {
        if (args.length > 1) {
            return this.showUsage(message, 'Multiple commands not allowed:');
        }

        if (args.length === 1) {
            const command = context.commands.get(args[0]);

            if (command === undefined) {
                return message.reply('there is no command by that name.');
            }

            return command.showUsage(message, undefined);
        }

        const embed = new Discord.MessageEmbed()
            .setColor(0xFF9300)
            .setTitle('Help')
            .setDescription('The following commands are available:');

        for (const command of context.commands.values()) {
            embed.addField(command.name, command.description);
        }

        return message.author.send(embed);
    }
}

export const instance = help;
