import * as Discord from 'discord.js';
import * as Memstore from '../lib/memstore';
import * as Initiative from '../lib/initiative';

import { Command } from '../lib/command';
import { Database } from '../lib/database';

export class init extends Command {
    constructor() {
        super();

        this.name = 'init';
        this.helpName = '/init';
        this.description = 'Manage initiative and round sequence';
        this.usage = [
            '**/init** [ __begin|end|next|reset__ ]',
            '**/init** [ __name__ ] __value__',
            '**/init** [ __name__ ] **+|-**__value__',
            '**/init** **set** __arps|dnd|adnd__',
            '**/init** **set** **direction** __up|down__',
            '**/init** **set** **style** __counted|ordered__',
            '**/init** **set** **cycle** __linear|circular__',
            '\n⚠️ The __name__ argument and **/init** __begin|end|next|reset|set__ are available to the channel\'s GM only'
        ];
    }

    public execute(message: Discord.Message, args: string[], db: Database) {
        // TODO: write me
    }
}

export const instance = init;

/*
            This one is really temporary; not sure this belongs in the database, per se.

            It needs some kind of temporary storage, and probably nothing fancier than a
            JSON file, TBH. But, let's think about the need.

            It does basically work like I wrote up, except that we won't have a character
            involved, just a user(id). That's OK, though, since if we go back to characters
            being a thing, if we know what the user's current character is for the channel,
            we can just look it up. So, doesn't box us in.

            In fact, at some level, being able to do a user mention might be better here since
            it will help draw their attention to the fact it's their turn in the round.

            /taps                         --> display the current segment (again)
            /taps [ <name> ] <value>      --> sets the poster's (or NPC's) TAPs for the round
            /taps [ <name> ] <+|-><value> --> updates the poster's (or NPC's) TAPs for the round
            /taps begin                   --> [GM] initiates the first segment (alias to /begin?)
            /taps end                     --> [GM] clears the TAP counts and ends the round (alias to /end?)
            /taps next                    --> [GM] does what /next does; in fact, /next should be an alias for this

            NOTE: TAPs are _guild_- + _channel_-specific.

            NOTE: The GM doesn't need to set the maximum TAPs for the round since the system already knows
            everyone's value; it can find the max and start there. (See the settings below to know what
            direction to go in.)

            NOTE: As noted in the writeup, the values can be a macro or variable, which makes it easy
            to enter your TAPs, i.e., `/taps !initiative`.

            NOTE: _Setting_ one's TAPs is disallowed between calls to `/taps begin` and `/taps end`.

            NOTE: `/next` and `/taps next` is disallowed outside of a begin/end block.

            NOTE: <name> requires the user to have GM rights. (Set it properly in config.json this time)
            If <name> is used, it still associates the TAPs to the GM's user_id, but also sets an override
            field with the NPC's name for tracking purposes.

            I think I might rename `/taps` to `/init` (for initiative). The real difference between, say,
            ARPS initiative and D&D initiative is how you count down (and that you'd never modify the value in
            D&D). In ARPS, we want _each_ segment. In D&D, we just want to move to the next initiative. If I
            can find a way to do count up vs count down, that'd also be good and allow a number of other
            games to work with it, too.

            So, feels like there are some "settings" commands the GM can run for his channel:

            /init set direction up|down (default: down)
            /init set style counted|ordered (default: counted)

            These can make an easy macro for the GM to just run when setting things up. However, I'm going
            to include a couple "presets" so the GM doesn't have to do that.

            /init set arps --> sets direction=down, style=counted
            /init set d&d  --> sets direction=down, style=ordered
            /init set ad&d --> sets direction=up,   style=ordered

            Others may be added later.

            Under this settings model, the ability to _modify_ one's initiative after the round begins is only
            valid if the direction is `counted`.

            Going to add one more: `/init reset` which is like `end`, but it doesn't clear any of the
            initiatives, just resets the round counter back to the top. This is for games where the rolled
            initiative doesn't change over the course of combat. A call to `end` will terminate the combat
            sequence completely and clear the values.

            Given also how 2e does things, I think I also need a setting to say what to do at the end of
            the round. There, if you're using individual initative with multiple attacks, you loop through
            the initiatives and take one attack at each pass until no one has actions left. At that point,
            the round ends. The difference between this and `reset` is that it changes the behavior of
            `next` which will either terminate at its limit (0 or the maximum among all players) or it will
            loop around to the top again for another pass. So:

            /init set next linear|circular

            I think that'll cover _most_ use cases, at least for now.

            ---

            So, having said all *that*, what type of storage should this use?
 */
