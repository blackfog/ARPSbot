module.exports = {
	name: 'asnpc',
	description: '[GM] Post a message as an NPC',
	usage: [
        '/asnpc <name> say <text|macro|var> [<language: text|macro|var>]',
        '/asnpc <name> do <text|macro|var>'
    ],
    role: /-gm$/, // FIXME: this should probably be set in config.json
    async isGM(message, db) {
        if (message.member.roles.cache.some(r => r.name.match(this.role))) { // can be GM
            const count = await db.GMChannels.count({ // is GM
                where: {
                    user: message.author.id,
                    channel: message.channel.id
                }
            });

            console.log(count);

            return count === 1;
        }

        return false;
    },
    showUsage(message, label = "Usage:") {
        return message.channel.send('<@' + message.author.id + '>: ' + label + "\n" + this.usage.join("\n"));
    },
	execute(message, args, db) {
        if (args.length < 3) {
            return this.showUsage(message);
        }

        this.isGM(message, db)
            .then(isGM => {
                if (!isGM) {
                    return Promise.reject();
                }
            })
            .then(() => {
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
            })
            .catch(() => {
                message.reply('you are not this channel\'s GM.');
            });
	}
};
