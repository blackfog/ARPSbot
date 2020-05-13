import * as Discord from 'discord.js';
import * as config from '../config.json';

import { readdirSync } from 'fs';
import { Database } from './lib/database';
import { Command } from './lib/command';

/****************************************************************************/

class DiscordClient extends Discord.Client {
    public commands: Discord.Collection<string, Command>
}

const client = new DiscordClient();

client.commands = new Discord.Collection();

const commandFiles = readdirSync(__dirname + '/commands/').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    import(__dirname + `/commands/${file}`)
        .then(command => {
            if (command === undefined || command.instance === undefined) return;
            client.commands.set(command.instance.name, new command.instance());
        });
}

/****************************************************************************/

const db = new Database(config);

/****************************************************************************/

client.once('ready', () => {
    db.sync()
    console.log('Ready!');
});

client.login(config.token);

client.on('message', message => {
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
            args.unshift(commandName.slice(1));
            commandName = 'variable';
            break;
        case config.prefix.macro:
            args.unshift(commandName.slice(1));
            commandName = 'macro';
            break;
        default:
            return;
    }

    if (config.debug) {
        console.log('COMMAND: prefix = ' + prefix + '; commandName = ' + commandName + '; args = ' + args);
    }

    if (!client.commands.has(commandName)) return;

    const command = client.commands.get(commandName);

    if (command === undefined) return;

    try {
        if (command.name === 'help') {
            command.execute(message, args, db, { client: client });
        } else {
            command.execute(message, args, db);
        }
    } catch (error) {
        console.error(error);
        message.reply('there was an error trying to execute that command!');
    }
});
