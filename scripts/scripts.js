
const DBL_CLICK_DELAY = 100;
function add_click_listeners(element, single_click_listener, double_click_listener, mouse_drag_listener){
	let elemnode = $(element);
	if(mouse_drag_listener){
		elemnode.mousedown(function(event){
			element.setAttribute("dragwait", 1);
		});
		elemnode.mouseup(function(event){
			if(element.getAttribute("dragwait") == 1){
				element.removeAttribute("dragwait");
			}
		});
		elemnode.mousemove(function(event){
			if(element.getAttribute("dragwait") == 1){
				mouse_drag_listener(event);
				element.removeAttribute("dragwait");
			}
		});
	}
	if(single_click_listener || double_click_listener){
		elemnode.click(function(event){
			if(element.getAttribute("dblclickwait") == 1){
				element.removeAttribute("dblclickwait");
				element.removeAttribute("dbldownwait")
				if(double_click_listener){
					double_click_listener(event);
				}
			}else{
				element.setAttribute("dblclickwait", 1);
				setTimeout(function(){
					if(element.getAttribute("dblclickwait") == 1){
						if(single_click_listener){
							single_click_listener(event);
						}
						element.removeAttribute("dblclickwait");
					}
				}, DBL_CLICK_DELAY);
			}
		});
		//some browsers do not send the second click event, so we have to repeat stuff here
		elemnode.dblclick(function(){
			if(element.getAttribute("dblclickwait") == 1){
				element.removeAttribute("dblclickwait");
				element.removeAttribute("dbldownwait")
				double_click_listener(event);
			}
		});
	}
}

////////////CHEMICAL///////////////

chemicals_by_id = [];

function Chemical(abbreviation, id, name, webpage_addr) {
	this.abbreviation = abbreviation;
	this.id = id;
	this.name = name;
	this.webpage_addr = webpage_addr;
	if(chemicals_by_id[id]){
		console.log("Chemical id collision:");
		console.log("  id: " + id);
		console.log("  chem 1: ");
		console.log(chemicals_by_id[id]);
		console.log("  chem 2: ");
		console.log(this);
		return;
	}
	chemicals_by_id[id] = this;
}

Chemical.prototype.getBubbleDiv = function(){
	let div = document.createElement("div");
	div.className = "chemical_bubble noselect";
	let center = document.createElement("center");
	center.innerHTML = this.abbreviation;
	div.appendChild(center);
	add_click_listeners(div, null,
		function(event){
			$("#info_page").empty();
			$("#info_page").append(this.getInfoPage());
			show_info_page();
		}.bind(this),
		function(event){
			startDragging(div, event);
		}
	);
	div.setAttribute("chem_id", this.id);
	return div;
};


Chemical.prototype.getInfoPage = function(){
	let div = document.createElement("div");
	div.className = "info_page";
	
	let title = document.createElement("H1");
	title.innerHTML = this.name;
	div.appendChild(title);
	
	if(this.webpage_addr){
		let link = document.createElement("a");
		link.setAttribute("href", this.webpage_addr);
		link.setAttribute("target", "_blank");
		link.innerHTML = this.webpage_addr;
		div.appendChild(link);
		
		let webpage = document.createElement("iframe");
		webpage.setAttribute("id", "web_window");
		webpage.setAttribute("src", this.webpage_addr);
		div.appendChild(webpage);
	}
	
	return div
}

////////////ELEMENT///////////////

function Element(abbreviation, id, name, atomic_number, weight, natural_state_id, webpage_addr) {
	this.abbreviation = abbreviation;
	this.id = id;
	this.name = name;
	this.atomic_number = atomic_number;
	this.weight = weight;
	if(webpage_addr){
		this.webpage_addr = webpage_addr;
	}else{
		this.webpage_addr = "https://en.wikipedia.org/wiki/" + name; //this usually works
	}
	if(natural_state_id){
		this.natural_state = chemicals_by_id[natural_state_id];
	}else{
		//if we don't have an interesting natural state (i.e. O2 gas for oxygen), make a boring new chemical for it
		this.natural_state = new Chemical(abbreviation, id, name);
	}
}

Element.prototype.getTableDiv = function(){
	var div = document.createElement("div");
	div.className = "periodic_table_entry noselect";
	
	let elem_num = document.createElement("span");
	elem_num.className = "periodic_table_atomic_number";
	if(this.atomic_number != undefined){
		elem_num.innerHTML = this.atomic_number;
	}else{
		elem_num.innerHTML = "&nbsp";
	}
	
	let elem_weight = document.createElement("center");
	elem_weight.className = "periodic_table_weight";
	if(this.weight != undefined){
		elem_weight.innerHTML = this.weight.toFixed(4);
	}else{
		elem_weight.innerHTML = "&nbsp";
	}
	
	let elem_abbr = document.createElement("center");
	if(this.abbreviation != undefined){
		elem_abbr.innerHTML = this.abbreviation;
	}
	elem_abbr.className = "periodic_table_abbr";
	
	let elem_name = document.createElement("center");
	if(this.name != undefined){
		elem_name.innerHTML = this.name;
	}
	elem_name.className = "periodic_table_name";
	
	div.appendChild(elem_num);
	div.appendChild(elem_abbr);
	div.appendChild(elem_name);
	div.appendChild(elem_weight);
	let divnode = $(div);
	add_click_listeners(div, null, 
		function(){
			$("#info_page").empty();
			$("#info_page").append(this.getInfoPage());
			show_info_page();
		}.bind(this),
		function(event){
			let newdiv = this.natural_state.getBubbleDiv();
			startDragging(newdiv, event);
		}.bind(this)
	);
	
	return div;
}

Element.prototype.getInfoPage = function(){
	let div = document.createElement("div");
	div.className = "info_page";
	
	let title = document.createElement("H1");
	title.innerHTML = this.name;
	div.appendChild(title);
	
	if(this.webpage_addr){
		let link = document.createElement("a");
		link.setAttribute("href", this.webpage_addr);
		link.setAttribute("target", "_blank");
		link.innerHTML = this.webpage_addr;
		div.appendChild(link);
		
		let webpage = document.createElement("iframe");
		webpage.setAttribute("id", "web_window");
		webpage.setAttribute("src", this.webpage_addr);
		div.appendChild(webpage);
	}
	
	return div
}

function hide_info_page(){
	$("#web_window_holder").hide();
}

function show_info_page(){
	$("#web_window_holder").show();
}

//////////////DRAGGING STUFF////////////////

var dragging_div;

function getCenter(element){
	let node = $(element);
	let pos = node.position();
	return {left : (pos.left + Math.round(node.width() / 2)) , top : (pos.top + Math.round(node.height() / 2))}
}

function startDragging(div, event){
	if(dragging_div || !div){
		return;
	}
	$(div).detach();
	$(document.body).append(div);
	dragging_div = div;
	updateDragPosition(event);
}

function stopDragging(){
	queued_to_drag = null;
	if(!dragging_div){
		return;
	}
	let divnode = $(dragging_div);
	let pos = getCenter(dragging_div);
	$(document.body).find(".chemical_bubble").hide();
	let div_under = document.elementFromPoint(pos.left - $(document).scrollLeft(), pos.top - $(document).scrollTop());
	$(document.body).find(".chemical_bubble").show();
	if(div_under){
		switch(div_under.id){
			case "trash":
				divnode.remove();
				break;
			
			case "reaction_zone":
				$(div_under).append(divnode);
				break;
			
			case "copy_in":
				$(div_under).append(divnode);
				break;
		}
	}
	dragging_div = null;
}

function updateDragPosition(event){
	if(!dragging_div){
		return;
	}
	dragging_div.style.position = "absolute";
	let node = $(dragging_div);
	dragging_div.style.left = (event.pageX - Math.round(node.width() / 2)) + "px";
	dragging_div.style.top = (event.pageY - Math.round(node.height() / 2)) + "px";
	
}

$(window).mousemove(function(event){
	updateDragPosition(event);
});

$(window).mouseup(function(event){
	stopDragging();
});

////////////CHEMICALS///////////////

var chemicals = [
	new Chemical("O<small><small><sub>2</sub></small></small>", "O2", "Oxygen", "https://en.wikipedia.org/wiki/Oxygen"),
	new Chemical("H<small><small><sub>2</sub></small></small>", "H2", "Hydrogen", "https://en.wikipedia.org/wiki/Hydrogen"),
	new Chemical("H<small><small><sub>2</sub></small></small>O", "H2O", "Water", "https://en.wikipedia.org/wiki/Water"),
	
	new Chemical("Fe<small><small><sub>2</sub></small></small>O<small><small><sub>3</sub></small></small>", "Fe2O3", "Rust", "https://en.wikipedia.org/wiki/Rust"),
	new Chemical("FeO(OH)", "FeO(OH)", "Rust", "https://en.wikipedia.org/wiki/Rust"),
	new Chemical("Fe(OH)<small><small><sub>3</sub></small></small>", "Fe(OH)3", "Rust", "https://en.wikipedia.org/wiki/Rust"),
	];

//////////////REACTIONS////////////////

function Reaction(reactant_id_list, product_id_list, catalyst_id_list){
	this.reactant_id_list = reactant_id_list;
	this.product_id_list = product_id_list;
	this.catalyst_id_list = catalyst_id_list;
}

Reaction.prototype.doesReact = function(reagents_id_hashset){
	let i=0;
	while(reagents_id_hashset[this.reactant_id_list[i]]){
		++i;
	}
	if(i != this.reactant_id_list.length){
		return false;
	}
	if(this.catalyst_id_list != undefined){
		i=0;
		while(reagents_id_hashset[this.catalyst_id_list[i]]){
			++i;
		}
		if(i != this.catalyst_id_list.length){
			return false;
		}
	}
	return true;
}

var recipe_list = [
	new Reaction(["H2", "O2"], ["H2O"]), //combining hydrogen and oxygen to make water
	new Reaction(["Fe", "O2"], ["Fe2O3", "FeO(OH)", "Fe(OH)3"], ["H2O"]) //iron rusting in water
];

$("#react_button").click(function() {
	let chem_hashset = [];
	$("#reaction_zone").children(".chemical_bubble").each(function(index, element) {
		chem_hashset[element.getAttribute("chem_id")] = true;
	});
	let product_hashset = [];
	let consumed_hashset = [];
	recipe_list.forEach(function(reaction){
		if(reaction.doesReact(chem_hashset)){
			reaction.product_id_list.forEach(function(E){
				product_hashset[E] = true;
			});
			reaction.reactant_id_list.forEach(function(E){
				consumed_hashset[E] = true;
			});
		}
	});
	let reaction_zone = $("#reaction_zone");
	for(let product in product_hashset){
		let newbubble = chemicals_by_id[product].getBubbleDiv();
		let newbubblenode = $(newbubble);
		newbubble.style.float = "left";
		reaction_zone.append(newbubble);
	}
	for(let reactant in consumed_hashset){
		reaction_zone.children("[chem_id=" + reactant + "]").remove();
	}
});

$("#clear_button").click(function(){
	$(document.body).find(".chemical_bubble").remove();
});

$("#copy_button").click(function(){$("#copy_in").children(".chemical_bubble").each(function(index, element) {
		let newbubble = chemicals_by_id[element.getAttribute("chem_id")].getBubbleDiv();
		let newbubblenode = $(newbubble);
		newbubble.style.float = "left";
		$("#copy_out").append(newbubble);
	});
});

$("#webwindow_close").click(function() {
	hide_info_page();
});
hide_info_page();

////////////ELEMENTS///////////////

var element_table = [
	null, //this is here so that index of each element is its atomic number, as there is sadly no element with an atomic number of 0
	new Element("H", "H", "Hydrogen", 1, 1.00794, "H2"),
	new Element("He", "He", "Helium", 2, 4.0026),
	new Element("Li", "Li", "Lithium", 3, 6.941),
	new Element("Be", "Be", "Beryllium", 4, 9.012182),
	new Element("B", "B", "Boron", 5, 10.811),
	new Element("C", "C", "Carbon", 6, 12.0107),
	new Element("N", "N", "Nitrogen", 7, 14.0067),
	new Element("O", "O", "Oxygen", 8, 15.9994, "O2"),
	new Element("F", "F", "Fluorine", 9, 18.998403),
	new Element("Ne", "Ne", "Neon", 10, 20.1797),
	new Element("Na", "Na", "Sodium", 11, 22.98976),
	new Element("Mg", "Mg", "Magnesium", 12, 24.3050),
	new Element("Al", "Al", "Aluminum", 13, 26.98153),
	new Element("Si", "Si", "Silicon", 14, 28.0855),
	new Element("P", "P", "Phosphorus", 15, 30.7696),
	new Element("S", "S", "Sulfer", 16, 32.065),
	new Element("Cl", "Cl", "Chlorine", 17, 35.453),
	new Element("Ar", "Ar", "Argon", 18, 39.948),
	new Element("K", "K", "Potassium", 19, 39.0983),
	new Element("Ca", "Ca", "Calcium", 20, 40.078),
	new Element("Sc", "Sc", "Scandium", 21, 44.955912),
	new Element("Ti", "Ti", "Titanium", 22, 47.867),
	new Element("V", "V", "Vanadium", 23, 50.9415),
	new Element("Cr", "Cr", "Chromium", 24, 51.9961),
	new Element("Mn", "Mn", "Manganese", 25, 54.938045),
	new Element("Fe", "Fe", "Iron", 26, 55.845),
	new Element("Co", "Co", "Cobalt", 27, 58.933195),
	new Element("Ni", "Ni", "Nickel", 28, 58.6934),
	new Element("Cu", "Cu", "Copper", 29, 63.546),
	new Element("Zn", "Zn", "Zinc", 30, 65.38),
	new Element("Ga", "Ga", "Gallium", 31, 69.723),
	new Element("Ge", "Ge", "Germanium", 32, 72.64),
	new Element("As", "As", "Arsenic", 33, 74.92160),
	new Element("Se", "Se", "Selenium", 34, 78.96),
	new Element("Br", "Br", "Bromine", 35, 79.904),
	new Element("Kr", "Kr", "Krypton", 36, 83.798),
	new Element("Rb", "Rb", "Rubidium", 37, 85.4678),
	new Element("Sr", "Sr", "Strontium", 38, 87.62),
	new Element("Y", "Y", "Yttrium", 39, 88.90585),
	new Element("Zr", "Zr", "Zirconium", 40, 91.224),
	new Element("Nb", "Nb", "Niobium", 41, 92.90638),
	new Element("Mo", "Mo", "Molybdenum", 42, 95.96),
	new Element("Tc", "Tc", "Technetium", 43, 97.9072),
	new Element("Ru", "Ru", "Ruthenium", 44, 101.07),
	new Element("Rh", "Rh", "Rhodium", 45, 102.90550),
	new Element("Pd", "Pd", "Palladium", 46, 106.42),
	new Element("Ag", "Ag", "Silver", 47, 107.8682),
	new Element("Cd", "Cd", "Cadmium", 48, 112.411),
	new Element("In", "In", "Indium", 49, 114.818),
	new Element("Sn", "Sn", "Tin", 50, 118.710),
	new Element("Sd", "Sd", "Antimony", 51, 121.760),
	new Element("Te", "Te", "Tellurium", 52, 127.60),
	new Element("I", "I", "Iodine", 53, 126.90447),
	new Element("Xe", "Xe", "Xenon", 54, 131.293),
	new Element("Cs", "Cs", "Caesium", 55, 132.9054519),
	new Element("Ba", "Ba", "Barium", 56, 137.327),
	new Element("La", "La", "Lanthanum", 57, 138.90547),
	new Element("Ce", "Ce", "Cerium", 58, 140.116),
	new Element("Pr", "Pr", "Praseodymium", 59, 140.90765),
	new Element("Nd", "Nd", "Neodymium", 60, 144.242),
	new Element("Pm", "Pm", "Promethium", 61, 145),
	new Element("Sm", "Sm", "Samarium", 62, 150.36),
	new Element("Eu", "Eu", "Europium", 63, 151.964),
	new Element("Gd", "Gd", "Gadolinium", 64, 157.25),
	new Element("Tb", "Tb", "Terbium", 65, 158.92535),
	new Element("Dy", "Dy", "Dysprosium", 66, 162.500),
	new Element("Ho", "Ho", "Holmium", 67, 164.93032),
	new Element("Er", "Er", "Erbium", 68, 167.259),
	new Element("Tm", "Tm", "Thulium", 69, 168.93421),
	new Element("Yb", "Yb", "Ytterbium", 70, 173.054),
	new Element("Lu", "Lu", "Lutetium", 71, 174.9668),
	new Element("Hf", "Hf", "Hafnium", 72, 178.49),
	new Element("Ta", "Ta", "Tantalum", 73, 180.94788),
	new Element("W", "W", "Tungsten", 74, 183.84),
	new Element("Re", "Re", "Rhenium", 75, 186.207),
	new Element("Os", "Os", "Osmium", 76, 190.23),
	new Element("Ir", "Ir", "Iridium", 77, 192.217),
	new Element("Pt", "Pt", "Platinum", 78, 195.084),
	new Element("Au", "Au", "Gold", 79, 196.966569),
	new Element("Hg", "Hg", "Mercury", 80, 200.59),
	new Element("Tl", "Tl", "Thallium", 81, 204.3833),
	new Element("Pb", "Pb", "Lead", 82, 207.2),
	new Element("Bi", "Bi", "Bismuth", 83, 208.98040),
	new Element("Po", "Po", "Polonium", 84, 208.9824),
	new Element("At", "At", "Astatine", 85, 209.9871),
	new Element("Rn", "Rn", "Radon", 86, 222.0176),
	new Element("Fr", "Fr", "Francium", 87, 223),
	new Element("Ra", "Ra", "Radium", 88, 226),
	new Element("Ac", "Ac", "Actinium", 89, 227),
	new Element("Th", "Th", "Thorium", 90, 232.03806),
	new Element("Pa", "Pa", "Protactinium", 91, 231.03588),
	new Element("U", "U", "Uranium", 92, 238.02891),
	new Element("Np", "Np", "Neptunium", 93, 237),
	new Element("Pu", "Pu", "Plutonium", 94, 244),
	new Element("Am", "Am", "Americium", 95, 243),
	new Element("Cm", "Cm", "Curium", 96, 247),
	new Element("Bk", "Bk", "Berkelium", 97, 247),
	new Element("Cf", "Cf", "Californium", 98, 251),
	new Element("Es", "Es", "Einsteinium", 99, 252),
	new Element("Fm", "Fm", "Fermium", 100, 257),
	new Element("Md", "Md", "Mendelevium", 101, 258),
	new Element("No", "No", "Nobelium", 102, 259),
	new Element("Lr", "Lr", "Lawrencium", 103, 262),
	new Element("Rf", "Rf", "Rutherfordium", 104, 261),
	new Element("Db", "Db", "Dubnium", 105, 262),
	new Element("Sg", "Sg", "Seaborgium", 106, 266),
	new Element("Bh", "Bh", "Bohrium", 107, 264),
	new Element("Hs", "Hs", "Hassium", 108, 277),
	new Element("Mt", "Mt", "Meitnerium", 109, 268),
	new Element("Ds", "Ds", "Damstadtium", 110, 271),
	new Element("Rg", "Rg", "Roentgenium", 111, 272),
	new Element("Cn", "Uub", "Ununbium", 112, 285),
	new Element("Uut", "Uut", "Ununtrium", 113, 284),
	new Element("Fl", "Fl", "Ununquadium", 114, 289),
	new Element("Uup", "Uup", "Ununpentium", 115, 288),
	new Element("Lv", "Lv", "Ununhexium", 116, 292),
	new Element("Uus", "Uus", "Ununseptium", 117, undefined),
	new Element("Uuo", "Uuo", "Ununoctium", 118, 294),
];

////////////PERIODIC TABLE///////////////

build_table = function() {
	let tablediv = document.getElementById("periodic_table");
	let table = tablediv.appendChild(document.createElement("table"));

	let getFiller = function(cols) {
		let td = document.createElement("td");
		td.setAttribute("colspan", cols);
		return td;
	}

	let currow = table.appendChild(document.createElement("tr"));
	currow.appendChild(document.createElement("td")).appendChild(element_table[1].getTableDiv());
	currow.appendChild(getFiller(16));
	currow.appendChild(document.createElement("td")).appendChild(element_table[2].getTableDiv());
	currow = table.appendChild(document.createElement("tr"));

	currow.appendChild(document.createElement("td")).appendChild(element_table[3].getTableDiv());
	currow.appendChild(document.createElement("td")).appendChild(element_table[4].getTableDiv());
	currow.appendChild(getFiller(10));
	for(let i = 5; i <= 10; ++i) {
		currow.appendChild(document.createElement("td")).appendChild(element_table[i].getTableDiv());
	}
	currow = table.appendChild(document.createElement("tr"));

	currow.appendChild(document.createElement("td")).appendChild(element_table[11].getTableDiv());
	currow.appendChild(document.createElement("td")).appendChild(element_table[12].getTableDiv());
	currow.appendChild(getFiller(10));
	for(let i = 13; i <= 18; ++i) {
		currow.appendChild(document.createElement("td")).appendChild(element_table[i].getTableDiv());
	}
	currow = table.appendChild(document.createElement("tr"));

	for(let i = 19; i <= 36; ++i) {
		currow.appendChild(document.createElement("td")).appendChild(element_table[i].getTableDiv());
	}
	currow = table.appendChild(document.createElement("tr"));

	for(let i = 37; i <= 54; ++i) {
		currow.appendChild(document.createElement("td")).appendChild(element_table[i].getTableDiv());
	}
	currow = table.appendChild(document.createElement("tr"));

	currow.appendChild(document.createElement("td")).appendChild(element_table[55].getTableDiv());
	currow.appendChild(document.createElement("td")).appendChild(element_table[56].getTableDiv());
	currow.appendChild(getFiller(1));
	for(let i = 72; i <= 86; ++i) {
		currow.appendChild(document.createElement("td")).appendChild(element_table[i].getTableDiv());
	}
	currow = table.appendChild(document.createElement("tr"));

	currow.appendChild(document.createElement("td")).appendChild(element_table[87].getTableDiv());
	currow.appendChild(document.createElement("td")).appendChild(element_table[88].getTableDiv());
	currow.appendChild(getFiller(1));
	for(let i = 104; i <= 118; ++i) {
		currow.appendChild(document.createElement("td")).appendChild(element_table[i].getTableDiv());
	}

	currow = table.appendChild(document.createElement("tr"));
	currow.style.height = "10px";

	currow = table.appendChild(document.createElement("tr"));
	currow.appendChild(getFiller(2));
	for(let i = 57; i <= 71; ++i) {
		currow.appendChild(document.createElement("td")).appendChild(element_table[i].getTableDiv());
	}
	currow = table.appendChild(document.createElement("tr"));
	currow.appendChild(getFiller(2));
	for(let i = 89; i <= 103; ++i) {
		currow.appendChild(document.createElement("td")).appendChild(element_table[i].getTableDiv());
	}
}

build_table();

