module.exports = {
	name: 'as',
	description: 'Post a message as a character',
	usage: [
        '/as <name> say <text|macro|var> [<language: text|macro|var>]',
        '/as <name> do <text|macro|var>'
    ],
	execute(message, args, db) {
        if (args.length < 3) {
            message.channel.send("*** SHOW USAGE");
        }

        const name      = args[0];
        const operation = args[1];
        const action    = args[2];
        const language  = args[3] === 'undefined' ? null : args[3];

        // TODO: does the character name exist? If not, error
        // TODO: is action either say or do? If not, error
        // TODO: if action != say and language is not null, error

		message.channel.send('NOT IMPLEMENTED YET'); // depends on /char
	}
};
