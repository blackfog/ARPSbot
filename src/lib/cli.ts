import * as Discord from 'discord.js';
import * as config from '../../config.json';

import { readdirSync } from 'fs';
import { Database } from './database';
import { Command } from './command';

export class CLI {
    private commands = new Discord.Collection<string, Command>();

    constructor() {
        this.loadCommands();
    }

    public interpret(message: Discord.Message, client: Discord.Client, db: Database) {
        // check message preconditions

        if (!message.content.match(new RegExp(config.prefix.pattern)) || message.author.bot) return;

        let args = [...message.content.matchAll(/([^\s]*)"(.*?)"([^\s]*)|([^\s]+)/g)].map(function (match) {
            return match[0]
        });

        const prefix    = message.content.trim().charAt(0)
        let commandName = args.shift().slice(1).toLowerCase();

        // process commands

        switch (prefix) {
            case config.prefix.command:
                break;
            case config.prefix.variable:
                args.unshift(commandName.slice(0));
                commandName = 'variable';
                break;
            case config.prefix.macro:
                args.unshift(commandName.slice(0));
                commandName = 'macro';
                break;
            default:
                return;
        }

        if (config.debug) {
            console.log('COMMAND: prefix = ' + prefix + '; commandName = ' + commandName + '; args = ' + args);
        }

        if (!this.commands.has(commandName)) return;

        const command = this.commands.get(commandName);

        if (command === undefined) return;

        try {
            if (command.name === 'help') {
                command.execute(message, args, db, { commands: this.commands });
            } else if (command.name == 'macro') {
                command.execute(message, args, db, { cli: this, client: client });
            } else {
                command.execute(message, args, db);
            }
        } catch (error) {
            console.error(error);
            message.reply('there was an error trying to execute that command!');
        }
    }

    /****************************************************************************/

    private loadCommands() {
        const commandFiles = readdirSync(__dirname + '/../commands/').filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            import(__dirname + `/../commands/${file}`)
                .then(command => {
                    if (command === undefined || command.instance === undefined) return;
                    this.commands.set(command.instance.name, new command.instance());
                });
        }
    }
}
