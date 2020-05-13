import * as Discord from 'discord.js';

import Calculator from 'little-calculator';
import { Command } from '../lib/command';
import { Database } from '../lib/database';

export class calc extends Command {
    constructor() {
        super();

        this.name = 'calc';
        this.helpName = '/calc';
        this.description = 'Do math';
        this.usage = [
            '**/calc** __equation__'
        ];
    }

    public execute(message: Discord.Message, args: string[], db: Database) {
        if (args.length === 0) {
            this.showUsage(message);
            return;
        }

        try {
            let eq = args.join(' ');
            let result = new Calculator().compute(eq);

            return message.channel.send(`<@${message.author.id}>: \`${eq}\` = ${result}`);
        } catch (error) {
            return message.reply('your equation does not appear to be valid.');
        }
    }
}

export const instance = calc;
