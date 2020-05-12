const Calculator = require('little-calculator');

module.exports = {
	name: 'calc',
	description: 'Do math',
	usage: [
        '/calc <equation>',
    ],
    showUsage(message, label = "Usage:") {
        return message.channel.send('<@' + message.author.id + '>: ' + label + "\n" + this.usage.join("\n"));
    },
	execute(message, args, db) {
        if (args.length === 0) {
            this.showUsage(message);
            return;
        }

        try {
            let eq = args.join(' ');
            let result = new Calculator().compute(eq);

            message.channel.send(`<@${message.author.id}>: \`${eq}\` = ${result}`);
        } catch (error) {
            message.reply('your equation does not appear to be valid.');
        }
    }
};
