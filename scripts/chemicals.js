
var chemicals;

populate_chemicals = function() {
	chemicals = [
		new Chemical("O<small><small><sub>2</sub></small></small>", "O2", "Oxygen", "https://en.wikipedia.org/wiki/Oxygen"),
		new Chemical("H<small><small><sub>2</sub></small></small>", "H2", "Hydrogen", "https://en.wikipedia.org/wiki/Hydrogen"),
		new Chemical("H<small><small><sub>2</sub></small></small>O", "H2O", "Water", "https://en.wikipedia.org/wiki/Water"),
		
		new Chemical("Fe<small><small><sub>2</sub></small></small>O<small><small><sub>3</sub></small></small>", "Fe2O3", "Rust", "https://en.wikipedia.org/wiki/Rust"),
		new Chemical("FeO(OH)", "FeO(OH)", "Rust", "https://en.wikipedia.org/wiki/Rust"),
		new Chemical("Fe(OH)<small><small><sub>3</sub></small></small>", "Fe(OH)3", "Rust", "https://en.wikipedia.org/wiki/Rust"),
	];
};
