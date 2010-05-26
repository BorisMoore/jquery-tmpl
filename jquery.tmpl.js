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
				return jQuery.evalTmpl( context, tmpl, data, options, 0, true );
			});
		},

		// This will allow us to do: .append( "template", dataObject )
		domManip: function( args, table, callback ) {
			// This appears to be a bug in the appendTo, etc. implementation
			// it should be doing .call() instead of .apply(). See #6227
			var options = args[2], ctxs = jQuery.templateContexts, ctxsLength = ctxs.length,				
				dmArgs = jQuery.makeArray(arguments);
			if (args.length > 1 && args[0].nodeType) {
				dmArgs[0] = [jQuery.makeArray(args)];
			}
			else if (args.length >= 2 && typeof args[0] === "string" && typeof args[1] !== "string") {
				// Fragment to clone and insert.
				dmArgs[0] = [ jQuery.evalTmpl( args[3], args[0], args[1], args[2], 0, true ) ]; 
			}
			dmArgs[2] = function (fragClone) { 	
				// Called by oldManip, with cloned fragment ready for insertion into DOM 
				var content = jQuery(fragClone.childNodes);

				// Return fragment to original caller (e.g. append) for DOM insertion
				callback.call(this, fragClone); 

				// Fragment has been inserted. Call onRendered for each inserted template instance. 
				for ( var i = ctxsLength, l=ctxs.length; i<l; i++ ) {
					var ctx = ctxs[i], nodes = []; filter = "[_tmplctx=" + i + "]",
						insertedElems = content.find( filter ).add(content.filter( filter ));
					
					insertedElems.each( function() {
						if ( !jQuery(this.parentNode ).closest( filter ).length ) {
							nodes.push( this );
							jQuery.data( this, "tmplCtx", ctx);
						}
						if (jQuery.support.deleteExpando) {
							delete this._tmplctx;
						} else if (this.removeAttribute) {
							this.removeAttribute( "_tmplctx" );
						}
					});
					if ( ctx.options.rendered ) {
						ctx.options.rendered( nodes, ctx );
					}
				}
			}
			return oldManip.apply(this, dmArgs);
		},

		templateContext: function() {
			var node = this.get(0), tmplCtx;
			while ( !(tmplCtx = jQuery.data( node, "tmplCtx" )) && (node = node.parentNode) ) {}
			return tmplCtx;
		}
	});
	
	jQuery.extend({
		evalTmpl: function( context, tmpl, data, options, index, domFrag ) {
			var fn;
			data = data || (context ? context.data : null);
			if ( typeof tmpl === "string" ) {
				// Use a pre-defined template, if available
				fn = jQuery.templates[ tmpl ];
				if ( !fn ) {
					fn = jQuery.tmpl( tmpl );
				}
			} else if ( tmpl instanceof jQuery ) {
				fn = jQuery.tmpl( tmpl.get( 0 ) );
			} else if ( tmpl.nodeType ) {
				fn = jQuery.tmpl( tmpl );
			} else if ( typeof tmpl === "function" ) {
				fn = tmpl;
			}
			if (!fn) {
				return []; //Could throw...
			}
			context = context || {};
			options = options || {};
			options.context = context;
			if ( typeof data === "function" ) {
				data = data.call(context.data || {}, context);  
			}
			var ret = context.content = jQuery.isArray( data ) ? 
				jQuery.map( data, function( dataItem, i ) {
					return ctx( fn, dataItem, context, i, data )
				}) : 
				[ ctx( fn, data, context ) ];
			
			return domFrag ? build( ret, context.key ) : ret;
			
			function ctx( fn, data, parentCtx, i, dataArray, content ) { 
				var newCtx = { 
					options: options || (parentCtx ? parentCtx.options : {}),
					data: data,
					parent: parentCtx || null,
					index: i || 0,
					dataArray: dataArray || null,
					content: content || null
				};
				newCtx.content = fn.call( data, jQuery, newCtx );
				newCtx.key = jQuery.templateContexts.push( newCtx ) - 1;
				return newCtx;
			}
			function build( content, ctxKey, compose ) {
				var ret = jQuery.map( content, function( item ) {
					return (typeof item === "string") ? 
						// Insert context info, which will be used in rendered event or in user code.
						item.replace( /(<\w+)([^>]*)/g, "$1 _tmplctx=\"" + ctxKey + "\" $2" ) : build( item.content, item.key, true );
				});
				if (compose) return ret;
				// Support templates which have initial or final text nodes
				ret = ret.join("");
				var frag;
				ret.replace( /^\s*([^<\s][^<]*)?(<[\w\W]+>)([^>]*[^>\s])?\s*$/, function( all, initial, middle, final ) {
					frag = jQuery( middle ).get();
					if ( !!initial ) frag.unshift( document.createTextNode( initial ));
					if ( !!final ) frag.push( document.createTextNode( final ));
				});
				return frag ? frag : document.createTextNode( ret ); 
			}
		},

		// You can stick pre-built template functions here
		templates: {},
		/*
		 * For example, someone could do:
		 *   jQuery.templates.foo = jQuery.tmpl("some long templating string");
		 *   $("#test").append("foo", data);
		 */
		templateContexts: [],

		tmplcmd: {
			"render": {
				_default: { $2: "null" },
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
		tmpl: function( tmpl ) {
			// Generate a reusable function that will serve as a template
			// generator (and which will be cached).
			if ( (typeof tmpl === "string") && !htmlExpr.test(tmpl) ) {
				// it is a selector
				tmpl = jQuery( tmpl )[0];
			}
			if (tmpl.nodeType) {
				return jQuery.data( tmpl, "tmpl" ) || jQuery.data( tmpl, "tmpl", tmplFn( tmpl.innerHTML ));
				// Cache, if tmpl is a node. We assume that if the template string is 
				// being passed directly in, the user doesn't want it cached. They can
				// stick it in jQuery.templates to cache it.
			}
			return tmplFn( tmpl ); 
			
			function tmplFn( markup ) {
				return new Function("jQuery","$context", 
					"var $=jQuery,_=[]," +
					"$options=$context.options,$i=$context.index;" +
					
					// Introduce the data as local variables using with(){}
					"with(this){_.push('" +

					// Convert the template into pure JavaScript
					markup
						.replace(/([\\'])/g, "\\$1")
						.replace(/[\r\t\n]/g, " ")
						.replace(/\${([^}]*)}/g, "{{= $1}}")
						.replace(/{{(\/?)(\w+|.)(?:\(((?:.(?!}}))*?)?\))?(?:\s+(.*?)?)?(\((.*?)\))?}}/g, 
						function(all, slash, type, fnargs, target, parens, args) {
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
		}
	});
})(jQuery);
