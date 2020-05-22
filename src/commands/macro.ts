import * as Discord from 'discord.js';
import * as config from '../../config.json';

import { Command } from '../lib/command';
import { Database } from '../lib/database';
import { DatabaseError } from 'sequelize';
import { CLI } from '../lib/cli';

export class MacroError extends Error { };
export class UnknownMacroError extends MacroError { };
export class TooManyRowsDeletedError extends DatabaseError { };
export class InvalidDatabaseStateError extends DatabaseError { };

export class macro extends Command {
    constructor() {
        super();

        this.name = 'macro';
        this.helpName = '!macro';
        this.description = 'Manage macros';
        this.usage = [
            '**!**__name__ [ **run** ] [ __arg__ __...__ ]',
            '**!**__name__ **define|=** __definition__',
            '**!**__name__ __remove|show__',
            `\nSee full documentation at ${config.docs.baseUrl}/macros`
        ];
    }

    /*
        TODO: This really needs a `list` command, too. Some way to get the full list of your own macros.

        FIXME: TODO:

        Using the macro command to process the macro is a bit weird: !foo remove is ODD. Setting
        one with !foo define x;y;z is even weirder.

        This leads me to believe that there really should be a slash command involved here and the ! syntax
        is only used to actually RUN the macro. (There'll be a similar change for variables, too.)

        /macro define NAME as COMMANDS
        /macro remove NAME
        /macro show NAME
        /macro run NAME [ARGS]

        !NAME [args] --> this is how you RUN it or refer to it (quick access to /macro run, basically?)

        Testing a quick idea:
        !!define NAME COMMANDS
        !!remove NAME
        !!show NAME
        !!list
        !NAME [ARGS]

        That's less awkward and !! basically is /macro, but I can keep the macro stuff contained to a
        single command. I think I like that. Next update, I'll make that go. (TODO: see here)

        ---

        The same will be true for variables:

        $$set NAME VALUE
        $$unset NAME
        $$show NAME
        $$list
        $NAME

        $$set Perception 3d
        $$set CombatSense 10
        !!define initiative /roll $Perception + $CombatSense
        !initiative

        TODO: In each case, the names need to be enforced to identifier rules: _, A-Z, a-z, 0-9, must start with _ or letter.
        That will avoid name collisions with the commands entirely.

        TODO: IDEA: For the purposes of creating useful commands with messages, it might be worth it to include a
        command that basically sends any message text, too, so you can insert a header or whatever or output a result of
        the macro that's macro-specific, etc. Let's call that: /echo

        /echo TEXT

        That's the extent of it. I'm not worried about making it "macro only" or something since its utility outside of a
        macro is nil.

        I'm also CONSIDERING (TODO: ??) adding a barebones /if command, too. Not so useful without a variable or anything, but…
        let's not go overboard with that functionality. So, something like:

        /if $Health < 10: !alert; else: !ok

        If I want to allow other commands in there directly, that could also work, but limiting that to macros might be the
        easiest solution overall since we really don't have "blocks" of code and the like. Alternative syntax:

        /if $Health < 10 ? !alert : !ok

        Going ternary there feels more natural.

        Either way, can get else-if blocks by calling a macro with an /if in it, and so on. This is purposely limited to avoid
        it getting into the weeds.

        ---

        TODO: Nowhere in here (or in this file!) did I address the whole macro arguments thing. This idea that you can call a
        macro like this:

        !foo bar baz

        And inside the macro, bar and baz are available as $0 and $1. So, they'd be treated as and have the same limitations as
        VARIABLES do functionality-wise, but are just locally scoped to that macro's execution. They would be evaluated to string
        BEFORE the macro is executed (like other variables most likely), so it's possible to do something like:

        !!define foo $$set Trauma $0
        !foo 2
        (Internally executes: $$set Trauma 2)

        (TODO: Do I still want to allow something like $Trauma = 2 as a syntax? That's more natural for variables, that's for sure.
        As written, it's got that $$set Condition 1SQ [for Strategic Missile Launch] feel.)

        Which would, as called, set the (global) variable $Trauma to 2. (And scarily, that macro that sets a variable would actually
        work RIGHT NOW if variables.ts was actually written.)
    */

    // FIXME: Need to make sure the macro isn't calling ITSELF and creating an infinite loop; that's bad
    public execute(message: Discord.Message, args: string[], db: Database, context) {
        try {
            if (!args[0]) {
                throw new SyntaxError();
            }

            const name = args[0].toLocaleLowerCase();

            switch (args[1] ?? '<null>') {
                case 'run':
                case '<null>':
                    this.run(message, db, name, context.client, context.cli);
                    break;
                case 'define':
                case '=':
                    this.define(message, db, name, args.slice(2));
                    break;
                case 'remove':
                    if (args.length > 1) throw new SyntaxError();
                    this.remove(message, db, name);
                    break;
                case 'show':
                    if (args.length > 1) throw new SyntaxError();
                    this.show(message, db, name);
                    break;
                default:
                    this.runWithArgs(message, db, name, context.client, context.cli, args.slice(1));
                    break;
            }
        } catch (error) {
            if (error instanceof UnknownMacroError) {
                // TODO: write me
            } else if (error instanceof SyntaxError) {
                // TODO: write me
            } else {
                throw error;
            }
        }
    }

    /****************************************************************************/

    private async fetchMacro(message: Discord.Message, db: Database, name: string) {
        const macroModel = await db.Macros.findOne({
            where: {
                guild: message.guild.id,
                user: message.author.id,
                name: name
            }
        });

        return macroModel;
    }

    private async deleteMacro(message: Discord.Message, db: Database, name: string) {
        const deleted = await db.Macros.destroy({
            where: {
                guild: message.guild.id,
                user: message.author.id,
                name: name
            }
        });

        return deleted;
    }

    private async upsertMacro(db: Database, macro: object) {
        return await db.Macros.upsert(macro);
    }

    /****************************************************************************/

    private run(message: Discord.Message, db: Database, name: string, client: Discord.Client, cli: CLI) {
        this.runWithArgs(message, db, name, client, cli, []);
    }

    private define(message: Discord.Message, db: Database, name: string, args: any[]) {
        const newMacro = {
            guild: message.guild.id,
            user: message.author.id,
            name: name,
            body: args.join(' ')
        };

        // The Sequelize SQLite upsert doesn't return a success/fail flag (boo)
        this.upsertMacro(db, newMacro)
            .then(() => {
                return message.author.send(`Definition for macro "!${name}" updated.`);
            });
    }

    private remove(message: Discord.Message, db: Database, name: string) {
        this.deleteMacro(message, db, name)
            .then(deletedCount => {
                if (deletedCount == 0) {
                    Promise.reject(new UnknownMacroError(name));
                } else if (deletedCount > 1) {
                    Promise.reject(
                        new InvalidDatabaseStateError(
                            new TooManyRowsDeletedError(
                                new Error(deletedCount + ' rows deleted')
                            )
                        )
                    );
                }
            })
            .then(() => {
                return message.author.send(`Macro "!${name}" has been removed.`);
            })
            .catch(error => {
                throw error;
            });
    }

    private show(message: Discord.Message, db: Database, name: string) {
        this.fetchMacro(message, db, name)
            .then(macro => {
                if (!macro) {
                    return Promise.reject();
                }

                return macro;
            })
            .then(macro => {
                return message.author.send(`Definition for !${name}:\n\`${macro.body}\``);
            })
            .catch (() => {
                throw new UnknownMacroError(name);
            });
    }

    private runWithArgs(message: Discord.Message, db: Database, name: string, client: Discord.Client, cli: CLI, args: any[]) {
        this.fetchMacro(message, db, name)
            .then(macro => {
                if (!macro) {
                    return Promise.reject();
                }

                return macro;
            })
            .then(macro => {
                const commands = macro.body.split(/\s*;\s*/);

                for (const command of commands) {
                    console.log(command);

                    const msg = new Discord.Message(client, {
                        author: message.author,
                        content: command
                    }, message.channel as Discord.TextChannel);

                    cli.interpret(msg, client, db);
                }
            })
            .catch (() => {
                throw new UnknownMacroError(name);
            });
    }
}

export const instance = macro;
