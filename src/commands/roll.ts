/*
    /gmonly:

    Do we actually need this?

    Yeah, though need to figure out how to make it work, exactly.

    It's only best used by /roll, if you think about it. Beyond that, it's either going to be
    100% clear for the channel, or it's going to be something you'd DM directly.

    So, we're looking for a way to simply send the result of a command to the GM via DM, rather
    than just throwing the result into the channel. That's it.

    I can't see this being useful for echo, help, if, init, macro, or variable.

    So, it's something that /roll "needs"--it should be dealt with as a roll option

    ---

    Let's take a moment to get the roll syntax and how we're going to handle "modifiers" and comments
    for the roll.

    The basic equation is either standard: XdY±A[±B...] or ARPS dice [1-5]d±X[±Y...]

    TODO: What about multiple dice types? /roll 3d6 + 2d4

    Since we can have any number of numeric modifiers there (to allow for stuff like /roll $Strength + $UnarmedCombat + 3),
    we can't put in my normal ±[LH] notation. So we have "directives" we can add to the command which change up
    how it treats things in the equation.

    (e)xplode
    (i)mplode
    (k)keep (need a way to keep high and low)
    (t)arget
    (r)epeat (ability score rolls, damage checks, etc.)

    For ARPS dice, you don't need most of that. What I COULD do is actually, if there's a single 20, do one of
    those interactive prompt things and ask if they're going to crit that, and if so, then explode the value. With
    multiple 20's, it should already know what to do. The e/i modifiers can handle advantage/disadvantage on a
    roll (not to be confused with D&D's advantage/disadvantage which is a different animal, but there might be a
    way to do that, too, allowing for a second roll and then choosing from among them--/roll 2d20+3k1 would keep the
    highest of the two dice, thus the higher of the two rolls).

    That roll I just noted would probably look more like this in my "language": /roll 2d20+3 k1. Or maybe, I should
    keep that as 2d20k1 + 3. Or, better, 2d20:k1:e19:i1 meh.

    /roll 2d20(k1h; e2|1?@19; i1@1) + $Swords
    /roll 3d20(k1h; e2|3|1?@20; i2@1) + $Maneuvering  <-- this really doesn't work for crits; will need an ARPS mode
    /roll 3d(a19) + $Observation ? 20

    Repeat would go at the front and use the 'x' operator: /roll 6 x 4d6(k3h)

    Target goes at the end with the "?" operator: /roll 3d20(k1h) + 10 ? 14

    Successes are a normal modifier: /roll 5d10 ?? 6 which would return the number of times each die was >= 6.
    The ?? operator changes it to be a successes check rather than a straight-up sum.
    I CAN ADD THIS FUNCTIONALITY LATER, THOUGH. SAME FOR THE TARGET MODIFIER.

    What about comment/purpose for a roll?
        How about the # operator at the end, like GM below?

            /roll 1d8 # damage check

        That works. If there are multiple end-operators, the comment MUST go last or everything after
        the # will be considered part of the comment. So,

            /roll 2d6 + 2 > gm # damage check

    What about sending the roll to the GM directly?
        What about the > operator and a gm keyword?

            /roll 3d6 > gm

        Could also do a directive (/roll 3d6(gm)) or keep the redirect and also take in any username
        and send it via DM there. The gm thing is a quick way to just find the gm and send it to that
        user. And it's also short.

            /roll 3d6 > blackfog

    What about sorting?
        Defaults to natural (whatever order they are rolled), but can add "asc" or "desc" to options.

    Let's make it clear. What roll options (the stuff in ()'s and semicolon delimited after the dice) are
    officially going to be supported initially?

        - Sorting: asc, desc
        - Keep: k#[hl], if [hl] (high/low) is not included, assumed to be high

        Everything else is deferred for later (exploding, imploding mainly).

    What other modifiers to the roll are we allowing at start?

        - Repeat (prefix): # x <roll>
        - Target (postfix): ? #
        - Successes (postfix): ?? #
        - Redirection (postfix): > gm|username
        - Comment (postfix): # comment

    When performing math with dice, what operators do we allow?

        Only inline +, -, *, /

    Variables are allowed. Macros don't return values, so they have no place inside a roll.

    Allowing multiple dice in the roll is disallowed in ARPS mode. Otherwise, a value in a dice
    equation is a number, a variable, or another dice equation.

    TODO: I think I should hold on this until after variables are done. It has a dependency.
*/

import * as Discord from 'discord.js';

import { Command } from '../lib/command';
import { Database } from '../lib/database';

export class roll extends Command {
    constructor() {
        super();

        this.name = 'roll';
        this.helpName = '/roll';
        this.description = 'Roll dice';
        this.usage = [
            '**/roll** __dice__'
        ];
    }

    public execute(message: Discord.Message, args: string[], db: Database) {
    }
}

export const instance = roll;
