
var reaction_list;

populate_reactions = function(){
	reaction_list = [
		new Reaction(["H2", "O2"], ["H2O"]), //combining hydrogen and oxygen to make water
		new Reaction(["Fe", "O2"], ["Fe2O3", "FeO(OH)", "Fe(OH)3"], ["H2O"]) //iron rusting in water
	];
};
