// The same will be true for variables:

// $$set NAME VALUE
// $$unset NAME
// $$show NAME
// $$list
// $NAME

// $$set Perception 3d
// $$set CombatSense 10
// !!define initiative /roll $Perception + $CombatSense
// !initiative

// ---

// (TODO: Do I still want to allow something like $Trauma = 2 as a syntax? That's more natural for variables, that's for sure.
// As written, it's got that $$set Condition 1SQ [for Strategic Missile Launch] feel.)

// Which would, as called, set the (global) variable $Trauma to 2. (And scarily, that macro that sets a variable would actually
// work RIGHT NOW if variables.ts was actually written.)
