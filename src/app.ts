import * as Discord from 'discord.js';
import * as config from '../config.json';

import { Database } from './lib/database';
import { CLI } from './lib/cli';

/****************************************************************************/

const client = new Discord.Client();
const cli    = new CLI();
const db     = new Database(config);

/****************************************************************************/

client.once('ready', () => {
    db.sync()
    console.log('Ready!');
});

client.login(config.token);

client.on('message', message => {
    cli.interpret(message, client, db);
});
