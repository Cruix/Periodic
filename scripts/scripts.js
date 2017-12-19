
////////////MISC FUNCTIONS///////////////

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

var chemicals_by_id = [];

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

//////////////DRAGGING////////////////

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

$(function(){
	$(window).mousemove(function(event){
		updateDragPosition(event);
	});

	$(window).mouseup(function(event){
		stopDragging();
	});
});

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

//////////////BUTTONS////////////////

$(function(){
	$("#react_button").click(function() {
		let chem_hashset = [];
		$("#reaction_zone").children(".chemical_bubble").each(function(index, element) {
			chem_hashset[element.getAttribute("chem_id")] = true;
		});
		let product_hashset = [];
		let consumed_hashset = [];
		reaction_list.forEach(function(reaction){
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
});

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

$(function(){
	populate_chemicals();
	populate_elements(); //this must be run after populate_chemicals(), otherwise any element with a natural_state parameter in its constructor will have an undefined natural_state
	populate_reactions();
	build_table(); //this must be run after populate_elements(), otherwise the table will be blank
	hide_info_page();
});
