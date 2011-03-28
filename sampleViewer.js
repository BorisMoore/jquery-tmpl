/*A sample viewer
Author: Boris Moore
Add this script after jquery.tmpl.js
*/
(function( $, undefined ){
var internalCall = 0, state, activeContainer, oldTmpl = $.tmpl, oldTtemplate = $.template, oldManip = jQuery.fn.domManip, plusButton, 
	viewerTmpl = '<table class="plusViewerTabs"><tbody><tr><th class="header_${activeIndex === 0}">Result</th><th class="header_${activeIndex === 1}">Data</th>{{each tmpls}}<th class="header_${activeIndex === 2 + $index}">${$value.name}</th>{{/each}}</tr><tr><td colspan="${tmpls.length + 2}">{{if activeIndex === 0}}{{wrap wrapper}}{{tmpl(data) tmpls[0].tmpl}}{{/wrap}}{{else activeIndex === 1}}<textarea{{if !editable}} readonly{{/if}}>${$item.getData()}</textarea>{{else}}<textarea{{if !editable}} readonly{{/if}}>${tmpls[activeIndex - 2].markup}</textarea>{{/if}}</td></tr></tbody></table>';  
	
viewerTmpl = $.template(null, viewerTmpl);

$.tmpl = function( tmpl, data, options, parentItem ) {
	if ( !internalCall  && !parentItem ) {
		state = { tmpls:[], tmplNames:{}, activeIndex: 0, data: data };
	}
	return oldTmpl( tmpl, data, options, parentItem ); 
}
$.extend( $.tmpl, oldTmpl );

$.template = function( name, tmpl ) {
	var tmplName, tmplRef, thisTmpl = tmpl;
	if ( state && state.tmplNames[name] ) {
		return state.tmpls[ state.tmplNames[name] - 1 ].tmpl;
	} else if ( thisTmpl && !internalCall ) {
		if ( thisTmpl instanceof jQuery ) {
			thisTmpl = tmpl[0] || {};
		}
		if ( thisTmpl.nodeType ) {
			// If this is a template block, use cached copy, or generate tmpl function and cache.
			tmplName = "#" + thisTmpl.getAttribute( "id" );
			thisTmpl = thisTmpl.innerHTML;
		}
		if ( typeof thisTmpl === "string" ) {
			tmplRef = tmplName || thisTmpl;
			if ( !state.tmplNames[tmplRef] ) {
				state.tmpls.push( {
					markup: thisTmpl,
					tmpl: thisTmpl = oldTtemplate( name, tmpl ),
					name: tmplName || "Template"
				});
				state.tmplNames[tmplRef] = state.tmpls.length
				return thisTmpl;
			}
		}
	}
	return oldTtemplate( name, tmpl); 
}

jQuery.fn.extend({
	domManip: function( args, table, callback, options ) {
		if ( !internalCall ) {
			var depth = 0, elem = this[0], container = $(elem), tabs;
			container.addClass( "plusViewerTarget" );
			while ( elem !== document.body ) {
				if ( container.hasClass( "plusViewer" )) { 
					state.wrapper = elem.innerHTML;
					state.depth = depth;
					state.persist = container.hasClass( "persist" ), 
					tabs = state.tabs = container.hasClass( "tabs" ), 
					state.editable = state.persist || container.hasClass( "edit" ); 
				
					container.data( "plusViewerState", state );
					container.data( "plusViewerInitialState",  $.extend(true, {}, state) );
					state = null;
					break;
				}
				container = $( elem = elem.parentNode );
				depth++; 
			}
		}
		var ret = oldManip.apply( this, arguments );
		if ( tabs ) { 
			internalCall++;
			renderViewer( container );
			internalCall--;
		} else if ( !state ) {
			container.addClass( "plusTargetContainer" );
		}
		return ret;
	}
});

function renderViewer( container ) {
	state = container.data( "plusViewerState" );
	if (state.wrapper) {
		var split = state.wrapper.split( "plusViewerTarget" );
		split[1] = split[1].replace(/>[\w\s]*</, ">{{html $item.html()}}</")		
		state.wrapper = split.join( "plusViewerTarget" );
	} else {
		state.wrapper = "{{! }}{{html $item.html()}}";
	}
	if ( state.tabs ) {
		if (container.hasClass( "data" )) {
			state.activeIndex = 1;
		} else {
			$.each( state.tmplNames, function( name, index ) {
				if ( container.hasClass( name )) {
					state.activeIndex = index + 1;
					return false;
				}
			});
		}
	}
	$.tmpl(viewerTmpl, state, { getData: getData } )
		.appendTo( container.empty() );

	if ( state.tabs && state.activeIndex ) {
		resizeTab( container );
	}
}

function resizeTab( container ) {
	var textArea = $( container ).find( "textarea" )[0];
	if ( textArea ) {
		textArea.style.overflow = 'hidden';
		textArea.scrollHeight; 
		textArea.style.height = textArea.scrollHeight + 'px';
		textArea.style.overflow = 'auto';
	}
}

function getData() {
	return JSON.stringify( this.data.data, null, '\t' );
}

$( function () {
	plusButton = document.createElement( "div" );
	plusButton.innerHTML = "+";
	plusButton.className = "plusButton";
	document.body.appendChild( plusButton );
	
	$( ".plusViewer" )
		.delegate( ".header_false", "click", function() {
			var textArea, tmplItem = $.tmplItem( this ), 
				index = tmplItem.data.activeIndex = $(this).index();
			internalCall++;
			state = tmplItem.data;
			tmplItem.update(); 
			state = null;
			internalCall--;
			
			if ( !index ) return;
			
			resizeTab( tmplItem.nodes[0] );
		})
		.delegate( "textarea", "change", function() {
			var tmplItem = $.tmplItem( this );
			if ( tmplItem.data.activeIndex === 1 ) {
				try { 
					tmplItem.data.data = $.parseJSON( this.value ); 
				}
				catch (e) {
					alert("Syntax error!");
					this.value = getData.call( tmplItem ); 
				}
			} else {
				internalCall++;
				var markup = this.value, 
					tmplFn = $.template( null, markup ), 
					tmplInfo = tmplItem.data.tmpls[tmplItem.data.activeIndex - 2];
				
				try { 
					tmplFn( $, $.extend({}, tmplItem, { data: tmplItem.data.data[0] || tmplItem.data.data })); // Test first for valid markup - will throw it there is a syntax error in tmplFn 
								
					tmplItem.data.targetMarkup = markup; 
					tmplInfo.markup = markup; 
					tmplInfo.tmpl = tmplFn; 
				}
				catch (e) {
					alert("Syntax error!");
					this.value = tmplInfo.markup; 
				}
				internalCall--;
			}
		})

	$( ".plusTargetContainer" ).live( "mouseenter", function( event ) {
		if ( event.relatedTarget && (event.relatedTarget.className === "plusButton") ) return; 
		if (activeContainer) {
			activeContainer.style.border = "solid transparent 1px";
		}
		activeContainer = this;
		plusButton.innerHTML = $( this ).hasClass( "activeViewer" ) ? "-" : "+";
			
		var offset = $( this ).offset();
			
		this.style.border = "solid green 1px";
		plusButton.style.left = offset.left + "px";
		plusButton.style.top = offset.top + "px";
		plusButton.style.display = "block";
	});
		
	$( ".plusTargetContainer" ).live( "mouseleave", function( event ) {
		if ( event.relatedTarget && (event.relatedTarget.className === "plusButton") ) return; 
			
		//var toolbar = $.data(  this, "plusViewerToolbar" );
		activeContainer = null;
		plusButton.style.display = "none";
		this.style.border = "solid transparent 1px";
	});

	$( ".plusButton" ).click( function() {
		internalCall++;
		var targetContainer = $( activeContainer );
		if ( this.innerHTML === "+" ) {
			renderViewer( targetContainer );
			targetContainer.addClass( "activeViewer" );
			this.innerHTML = "-";
		} else {  
			var	tmplItem = $( activeContainer ).children().first().tmplItem(),
				coll = tmplItem.nodes, 
				div = document.createElement("div"), 
				originalContainer = coll[0].parentNode, 
				d = tmplItem.data.depth,
				originalState = targetContainer.data(  "plusViewerInitialState" );
			
			div.innerHTML = originalState.wrapper;
			
			if (tmplItem.data.persist) {
				state = tmplItem.data;
				targetContainer.data( "plusViewerState", state );
			} else {
				state = originalState;
				targetContainer.data( "plusViewerState", $.extend( true, {}, state ));
			}
			
			$.tmpl( state.tmpls[0].tmpl, state.data )
				.appendTo( $( div ).find( ".plusViewerTarget" ) );
				
			jQuery( coll ).remove();
			originalContainer.innerHTML = div.innerHTML;
			this.innerHTML = "+";
			targetContainer.removeClass( "activeViewer" );
		}
		state = null;
		internalCall--;
	});
});
})( jQuery );

if (!this.JSON) {
	this.JSON = {};
}

(function () {
	function f(n) {
		return n < 10 ? '0' + n : n;
	}
	if (typeof Date.prototype.toJSON !== 'function') {
		Date.prototype.toJSON = function (key) {
			return isFinite(this.valueOf()) ?
				   this.getUTCFullYear()   + '-' +
				 f(this.getUTCMonth() + 1) + '-' +
				 f(this.getUTCDate())      + 'T' +
				 f(this.getUTCHours())     + ':' +
				 f(this.getUTCMinutes())   + ':' +
				 f(this.getUTCSeconds())   + 'Z' : null;
		};
		String.prototype.toJSON =
		Number.prototype.toJSON =
		Boolean.prototype.toJSON = function (key) {
			return this.valueOf();
		};
	}
	var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
		escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
		gap,
		indent,
		meta = {    // table of character substitutions
			'\b': '\\b',
			'\t': '\\t',
			'\n': '\\n',
			'\f': '\\f',
			'\r': '\\r',
			'"' : '\\"',
			'\\': '\\\\'
		},
		rep;

	function quote(string) {
		escapable.lastIndex = 0;
		return escapable.test(string) ?
			'"' + string.replace(escapable, function (a) {
				var c = meta[a];
				return typeof c === 'string' ? c :
					'\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
			}) + '"' :
			'"' + string + '"';
	}
	function str(key, holder) {
		var i,          // The loop counter.
			k,          // The member key.
			v,          // The member value.
			length,
			mind = gap,
			partial,
			value = holder[key];

		if (value && typeof value === 'object' &&
				typeof value.toJSON === 'function') {
			value = value.toJSON(key);
		}
		if (typeof rep === 'function') {
			value = rep.call(holder, key, value);
		}
		switch (typeof value) {
		case 'string':
			return quote(value);
		case 'number':
			return isFinite(value) ? String(value) : 'null';
		case 'boolean':
		case 'null':
			return String(value);
		case 'object':
			if (!value) {
				return 'null';
			}
			gap += indent;
			partial = [];
			if (Object.prototype.toString.apply(value) === '[object Array]') {
				length = value.length;
				for (i = 0; i < length; i += 1) {
					partial[i] = str(i, value) || 'null';
				}
				v = partial.length === 0 ? '[]' :
					gap ? '[\n' + gap +
							partial.join(',\n' + gap) + '\n' +
								mind + ']' :
						  '[' + partial.join(',') + ']';
				gap = mind;
				return v;
			}
			if (rep && typeof rep === 'object') {
				length = rep.length;
				for (i = 0; i < length; i += 1) {
					k = rep[i];
					if (typeof k === 'string') {
						v = str(k, value);
						if (v) {
							partial.push(quote(k) + (gap ? ': ' : ':') + v);
						}
					}
				}
			} else {
				for (k in value) {
					if (Object.hasOwnProperty.call(value, k)) {
						v = str(k, value);
						if (v) {
							partial.push(quote(k) + (gap ? ': ' : ':') + v);
						}
					}
				}
			}
			v = partial.length === 0 ? '{}' :
				gap ? '{\n' + gap + partial.join(',\n' + gap) + '\n' +
						mind + '}' : '{' + partial.join(',') + '}';
			gap = mind;
			return v;
		}
	}
	if (typeof JSON.stringify !== 'function') {
		JSON.stringify = function (value, replacer, space) {
			var i;
			gap = '';
			indent = '';
			if (typeof space === 'number') {
				for (i = 0; i < space; i += 1) {
					indent += ' ';
				}
			} else if (typeof space === 'string') {
				indent = space;
			}
			rep = replacer;
			if (replacer && typeof replacer !== 'function' &&
					(typeof replacer !== 'object' ||
					 typeof replacer.length !== 'number')) {
				throw new Error('JSON.stringify');
			}
			return str('', {'': value});
		};
	}
	if (typeof JSON.parse !== 'function') {
		JSON.parse = function (text, reviver) {
			var j;
			function walk(holder, key) {
				var k, v, value = holder[key];
				if (value && typeof value === 'object') {
					for (k in value) {
						if (Object.hasOwnProperty.call(value, k)) {
							v = walk(value, k);
							if (v !== undefined) {
								value[k] = v;
							} else {
								delete value[k];
							}
						}
					}
				}
				return reviver.call(holder, key, value);
			}
			text = String(text);
			cx.lastIndex = 0;
			if (cx.test(text)) {
				text = text.replace(cx, function (a) {
					return '\\u' +
						('0000' + a.charCodeAt(0).toString(16)).slice(-4);
				});
			}
			if (/^[\],:{}\s]*$/.
test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@').
replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').
replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {
				j = eval('(' + text + ')');
				return typeof reviver === 'function' ?
					walk({'': j}, '') : j;
			}
			throw new SyntaxError('JSON.parse');
		};
	}
}());
