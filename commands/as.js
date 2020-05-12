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
            return this.showUsage(message);
        }

        const name      = args[0];
        const operation = args[1].toLowerCase();
        const action    = args[2].replace(/"/g, '');
        const language  = args[3];

        if (operation !== "say" && operation !== "do") {
            return this.showUsage(message, "Invalid action:");
        }

        if (operation !== "say" && language !== undefined) {
            return this.showUsage(message, 'Language is only allowed with the say operator:');
        }

        // TODO: does the character name exist? If not, error

        let text = '';

        switch (operation) {
            case 'say':
                const lang = language === undefined ? '' : `, in ${language},`;
                text = `**${name}**${lang} says:\n\n${action}`;
                break;
            case 'do':
                text = `_**${name}** ${action}_`;
                break;
        }

		message.channel.send(text);
	}
};
