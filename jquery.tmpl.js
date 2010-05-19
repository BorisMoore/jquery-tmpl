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
				return jQuery( jQuery.evalTmpl( context, tmpl, data, options ).join("") ).get();
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
				arguments[0] = [ jQuery( jQuery.evalTmpl( args[3], args[0], args[1], args[2] ).join("")).get() ];
			}
			
			return oldManip.apply( this, arguments );
		}
	});
	
	jQuery.extend({
		evalTmpl: function( context, tmpl, data, options, index ) {
			function ctx( data, parentCtx, i, dataArray ) { 
				return { 
					options: options || (context ? context.options : {}),
					data: data,
					parent: parentCtx || null,
					index: i || 0,
					dataArray: dataArray || null
				};
			}
			var fn, node;
			data = data || (context ? context.data : null);
					
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
				return []; //Could throw...
			}
			context = context || {};
			context.options = options || context.options || {};
			if ( typeof data === "function" ) {
				data = data.call(context.data || {}, context);  
			}
			return (jQuery.isArray( data ) ? 
				jQuery.map( data, function( dataItem, i ) {
					return fn.call( dataItem, jQuery, ctx( dataItem, context, i, data ) );
				}) : 
				fn.call( data, jQuery, ctx( data, context ) ) 
			);
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
				prefix: "if($defined_1){_=_.concat($.evalTmpl($context,$1,$2));}"
			},
			"each": {
				_default: { $2: "$index, $value" },
				prefix: "if($defined_1){jQuery.each($1,function($2){with(this){",
				suffix: "}});}"
			},
			"if": {
				prefix: "if(($defined_1) && $1){",
				suffix: "}"
			},
			"else": {
				prefix: "}else{"
			},
			"html": {
				prefix: "if($defined_1){_.push($1);}"
			},
			"=": {
				_default: { $1: "this" },
				prefix: "if($defined_1){_.push($.encode($1));}"
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
				"var $=jQuery,$options=$context.options,$i=$context.index,_=[];" +

				// Introduce the data as local variables using with(){}
				"with(this){_.push('" +

				// Convert the template into pure JavaScript
				markup
					.replace(/([\\'])/g, "\\$1")
					.replace(/[\r\t\n]/g, " ")
					.replace(/\${([^}]*)}/g, "{{= $1}}")
					.replace(/{{(\/?)(\w+|.)(?:\(((?:.(?!}}))*?)?\))?(?:\s+(.*?)?)?(\((.*?)\))?}}/g, function(all, slash, type, fnargs, target, parens, args) {
						function unescape( args ) {
							return args ? args.replace(/\\'/g, "'").replace(/\\\\/g, "\\") : null;
						}
						var cmd = jQuery.tmplcmd[ type ], def, expr;
						if ( !cmd ) {
							throw "Template command not found: " + type;
						}
						def = cmd._default || [];
						if (target) {
							target = unescape(target); 
							args = args ? ("$context," + unescape(args) + ")") : (parens ? "$context)" : "");
							expr = args ? ("(" + target + ").call(this," + args) : target;
						}
						else {
							expr = def["$1"] || "null";
						}
						fnargs = unescape( fnargs );
						return "');" + 
							cmd[ slash ? "suffix" : "prefix" ]
								.split("$defined_1").join( "typeof("+ target  +")!=='undefined'" )
								.split("$1").join( expr )
								.split("$2").join( fnargs ? 
									fnargs.replace(/\s*([^\(]+)\s*(\((.*?)\))?/g, function(all, name, parens, params) {
										params = params ? ("$context," + params + ")") : (parens ? "$context)" : "");
										return params ? ("(" + name + ").call(this," + params) : all;
									})	 
									: (def["$2"]||"") 
								) +
							"_.push('";
					}) + 
				"');}return _;"
			);
		}
	});
})(jQuery);
