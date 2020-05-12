import { Database } from "dist/index.js";
import * as Discord from 'discord.js';

export default class Command {
    public name: string
    public description: string
    public usage: string[]
    public role: object; // RegExp

    constructor(message: Discord.Message, args: string[], db: Database) {

    }

    public showUsage() {
        return message.channel.send('<@' + message.author.id + '>: ' + label + "\n" + this.usage.join("\n"));
    }
}
