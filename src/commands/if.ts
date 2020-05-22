// I'm also CONSIDERING (TODO: ??) adding a barebones /if command, too. Not so useful without a variable or anything, but…
// let's not go overboard with that functionality. So, something like:

// /if $Health < 10: !alert; else: !ok

// If I want to allow other commands in there directly, that could also work, but limiting that to macros might be the
// easiest solution overall since we really don't have "blocks" of code and the like. Alternative syntax:

// /if $Health < 10 ? !alert : !ok

// Going ternary there feels more natural.

// Either way, can get else-if blocks by calling a macro with an /if in it, and so on. This is purposely limited to avoid
// it getting into the weeds.

// TODO: hold this until after we have variables working or it's not going to be very useful or easy to test
