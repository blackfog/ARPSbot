const fs        = require('fs');
const Discord   = require('discord.js');
// const Sequelize = require('sequelize');
const config    = require('./config.json');
const ARPSbot   = require('./dist/index.js');

/****************************************************************************/

const client = new Discord.Client();

client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}

/****************************************************************************/

const db = new ARPSbot.Database(config);

/****************************************************************************/

client.once('ready', () => {
    db.sync()
    console.log('Ready!');
});

client.login(config.token);

client.on('message', message => {
    // check message preconditions

    if (!message.content.match(new RegExp(config.prefix.pattern)) || message.author.bot) return;

    const args      = message.content.trim().slice(1).split(/\s+/);
    const prefix    = message.content.trim().charAt(0)
    let commandName = args.shift().toLowerCase();

    // process commands

    switch (prefix) {
        case config.prefix.command:
            break;
        case config.prefix.variable:
            commandName = 'variable';
            break;
        case config.prefix.macro:
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

    try {
        command.execute(message, args, db);
    } catch (error) {
        console.error(error);
        message.reply('there was an error trying to execute that command!');
    }
});
