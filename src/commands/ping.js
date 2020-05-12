module.exports = {
	name: 'ping',
	description: 'Ping!',
	usage: '',
	execute(message, args, db) {
		message.channel.send('Pong.');
	},
};
