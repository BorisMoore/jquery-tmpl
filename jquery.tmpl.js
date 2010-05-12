/*
 * jQuery Templating Plugin
 *   NOTE: Created for demonstration purposes.
 * Copyright 2010, John Resig
 * Dual licensed under the MIT or GPL Version 2 licenses.
 */
(function(jQuery){
	// Override the DOM manipulation function
	var oldManip = jQuery.fn.domManip,
		htmlExpr = /^[^<]*(<[\w\W]+>)[^>]*$/;
	
	jQuery.fn.extend({
		render: function( data, options, context ) {
			return this.map(function(i, tmpl){
				return jQuery( jQuery.evalTmpl( tmpl, context, data, options ).join("") ).get();
			});
		},
		
		// This will allow us to do: .append( "template", dataObject )
		domManip: function( args ) {
			// This appears to be a bug in the appendTo, etc. implementation
			// it should be doing .call() instead of .apply(). See #6227
			if ( args.length > 1 && args[0].nodeType ) {
				arguments[0] = [ jQuery.makeArray(args) ];
			}

			if ( args.length >= 2 && typeof args[0] === "string" && typeof args[1] !== "string" ) {
				arguments[0] = [ jQuery( jQuery.evalTmpl( args[0], args[3], args[1], args[2] ).join("")).get() ];
			}
			
			return oldManip.apply( this, arguments );
		}
	});
	
	jQuery.extend({
		evalTmpl: function( tmpl, context, data, options, index ) {
			var fn, node;
			
			if ( typeof tmpl === "string" ) {
				// Use a pre-defined template, if available
				fn = jQuery.templates[ tmpl ];
				if ( !fn ) {
					fn = jQuery.tmpl( tmpl );
				}
			} else if ( tmpl instanceof jQuery ) {
				node = tmpl.get( 0 );
			} else if ( tmpl.nodeType ) {
				node = tmpl;
			} else if ( typeof tmpl === "function" ) {
				fn = tmpl;
			}
			if ( node ) {
				var elemData = jQuery.data( node );
				fn = elemData.tmpl || (elemData.tmpl = jQuery.tmpl( node ));
				// Cache, if tmpl is a node. We assume that if the template string is 
				// being passed directly in, the user doesn't want it cached. They can
				// stick it in jQuery.templates to cache it.
			}
			if (!fn) {
				return [];
			}
			context = ctx( data, context, options, index );
			if ( typeof data === "function" ) {
				data = data.call(context.parent.data, context);
			}
			return (jQuery.isArray( data ) ? 
				jQuery.map( data, function( data, i ) {
					return fn.call( data, jQuery, ctx( data, context, options, i ) );
				}) : 
				fn.call( data, jQuery, context ) 
			);

			function ctx( data, context, options, index ) {
				return { 
					options: options || (context ? context.options : {}),
					data: data || (context ? context.data : null),
					parent: context,
					index: index || 0
				};
			}
		},
				
		// You can stick pre-built template functions here
		templates: {},

		/*
		 * For example, someone could do:
		 *   jQuery.templates.foo = jQuery.tmpl("some long templating string");
		 *   $("#test").append("foo", data);
		 */

		tmplcmd: {
			"render": {
				prefix: "if(typeof($1)!==undef){_=_.concat($.evalTmpl($1,$context,$2));}"
			},
			"each": {
				prefix: "if(typeof($1)!==undef){jQuery.each($1,function($2){with(this){",
				suffix: "}});}"
			},
			"if": {
				prefix: "if((typeof($1)!==undef) && ($1)){",
				suffix: "}"
			},
			"else": {
				prefix: "}else{"
			},
			"html": {
				prefix: "if(typeof($1)!==undef){_.push(typeof($1)==='function'?($1).call(this):$1);}"
			},
			"=": {
				_default: [ "this" ],
				prefix: "if(typeof($1)!==undef){_.push($.encode(typeof($1)==='function'?($1).call(this):$1));}"
			}
		},

		encode: function( text ) {
			return text != null ? document.createTextNode( text.toString() ).nodeValue : "";
		},

		tmpl: function( markup ) {
			// Generate a reusable function that will serve as a template
			// generator (and which will be cached).
			if ( !htmlExpr.test(markup) ) {
				// it is a selector
				markup = jQuery( markup )[0];
			}
			if (markup.nodeType) markup = markup.innerHTML; 

			return new Function("jQuery","$context",
				"var undef='undefined',$=jQuery,$options=$context.options,$i=$context.index,_=[];" +

				// Introduce the data as local variables using with(){}
				"with(this){_.push('" +

				// Convert the template into pure JavaScript
				markup
					.replace(/([\\'])/g, "\\$1")
					.replace(/[\r\t\n]/g, " ")
					.replace(/\${([^}]*)}/g, "{{= $1}}")
					.replace(/{{(\/?)(\w+|.)(?:\((.*?)\))?(?: (.*?))?}}/g, function(all, slash, type, fnargs, args) {
						var tmpl = jQuery.tmplcmd[ type ];

						if ( !tmpl ) {
							throw "Template not found: " + type;
						}

						var def = tmpl._default || [];

						return "');" + tmpl[slash ? "suffix" : "prefix"]
							.split("$1").join(args || def[0])
							.split("$2").join(fnargs || def[1]) + "_.push('";
					})
				+ "');};return _;");
		}
	});
})(jQuery);
