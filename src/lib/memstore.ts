import * as Discord from 'discord.js';
import { Initiative } from '../lib/initiative';

export const shared     = new Discord.Collection();
export const initiative = new Discord.Collection<string, Initiative>();
