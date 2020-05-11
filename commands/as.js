module.exports = {
	name: 'as',
	description: 'Post a message as a character',
	usage: [
        '/as <name> say <text|macro|var> [<language: text|macro|var>]',
        '/as <name> do <text|macro|var>'
    ],
    showUsage(message, label = "Usage:") {
        return message.channel.send('<@' + message.author.id + '>: ' + label + "\n" + this.usage.join("\n"));
    },
	execute(message, args, db) {
        if (args.length < 3) {
            this.showUsage(message);
            return;
        }

        const name      = args[0].toLowerCase();
        const operation = args[1].toLowerCase();
        const action    = args[2];
        const language  = args[3];

        if (operation !== "say" && operation !== "do") {
            this.showUsage(message, "Invalid action:");
            return;
        }

        if (operation !== "say" && language !== undefined) {
            this.showUsage(message, 'Language is only allowed with the say operator:');
            return;
        }

        // TODO: does the character name exist? If not, error

		message.reply('I\'m sorry, but /as is not implemented yet'); // depends on /char
	}
};
