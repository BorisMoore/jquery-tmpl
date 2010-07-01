/*
 * jQuery Templating Plugin
 *   NOTE: Created for demonstration purposes.
 * Copyright 2010, John Resig
 * Dual licensed under the MIT or GPL Version 2 licenses.
 */
(function(jQuery){
	// Override the DOM manipulation function
	var oldManip = jQuery.fn.domManip, tCtxAtt = "_tmplctx", itm, ob,
		htmlExpr = /^[^<]*(<[\w\W]+>)[^>]*$/, newCtxs = {}, appendToCtxs, topCtx = { key: 0 }, ctxKey = 0, cloneIndex = 0;

	function newCtx( options, parentCtx, fn, data, ctxs ) {
		// Returns a template context for a new instance of a template. 
		// The content field is a hierarchical array of strings and nested contexts (to be
		// removed and replaced by nodes field of dom elements, once inserted in DOM).
		var newCtx = { 
			data: data || null,
			tmpl: null,
			parent: parentCtx || null,
			nodes: [],
			nest: nest
		};
		if ( options) {
			jQuery.extend( newCtx, options, { nodes: [], parent: parentCtx } );
			fn = fn || (typeof options.tmpl === "function" ? options.tmpl : null);
		}
		if ( fn ) {
			// Build the hierarchical content to be used during insertion into DOM
			newCtx.tmpl = fn;
			newCtx.content = newCtx.tmpl( jQuery, newCtx );
			newCtx.key = ++ctxKey;
			// Keep track of new context, until it is stored as jQuery Data on DOM element
			newCtxs[ctxKey] = newCtx;
		}
		return newCtx;
		function nest( tmpl, data, options ) {
			// nested template, using {{tmpl}} tag
			return jQuery.tmpl( tmpl, data || {}, options, this );
		}
	}

	// Override appendTo etc., in order to provide support for targeting multiple elements.
	jQuery.each({
		appendTo: "append",
		prependTo: "prepend",
		insertBefore: "before",
		insertAfter: "after",
		replaceAll: "replaceWith"
	}, function( name, original ) {
		jQuery.fn[ name ] = function( selector ) {
			var ret = [], insert = jQuery( selector ),
				parent = this.length === 1 && this[0].parentNode;

			appendToCtxs = newCtxs || {};
			if ( parent && parent.nodeType === 11 && parent.childNodes.length === 1 && insert.length === 1 ) {
				insert[ original ]( this[0] );
				ret = this;
			} else {
				for ( var i = 0, l = insert.length; i < l; i++ ) {
					cloneIndex = i;
					var elems = (i > 0 ? this.clone(true) : this).get();
					jQuery.fn[ original ].apply( jQuery(insert[i]), elems );
					ret = ret.concat( elems );
				}
				cloneIndex = 0;
				ret = this.pushStack( ret, name, insert.selector );
			}
			jQuery.tmpl.complete( appendToCtxs );
			appendToCtxs = null;
			return ret;
		};
	});

	jQuery.fn.extend({
		tmpl: function( data, options, parentCtx ) {
			if ( arguments.length ) {
				// Use wrapped elements as template markup.
				// Return wrapped set of fragments obtained by evaluating template against data.
				return this.map( function( i, tmpl ){
					return jQuery.tmpl( tmpl, data, options, parentCtx || topCtx, true );
				});
			}	
			// If no arguments, used to get template context of first wrapped DOM element
			return jQuery.tmpl( this[0] );
		},

		// This will allow us to do: .append( "template", dataObject )
		domManip: function( args, table, callback, options ) {
			// This appears to be a bug in the appendTo, etc. implementation
			// it should be doing .call() instead of .apply(). See #6227
			var ctxs, parentCtx, dmArgs = jQuery.makeArray( arguments ),
				arg0 = args[0], argsLength = args.length, i = 0, ctx;
			
			newCtxs = appendToCtxs || {};
			if ( arg0.nodeType ) {
				while ( i < argsLength && !(ctx = jQuery.data( args[i++], "tmplCtx" ))) {};
				parentCtx = ctx ? topCtx : null;
				if ( argsLength > 1 ) {
					dmArgs[0] = [jQuery.makeArray( args )];
				}
			}
			else if ( args.length >= 2 && typeof args[1] === "object" && !args[1].nodeType && !(args[1] instanceof jQuery)) {
				// args[1] is data, for a template. Eval template to obtain fragment to clone and insert
				parentCtx = args[3] || topCtx;
				dmArgs[0] = [ jQuery.tmpl( arg0, args[1], args[2], parentCtx, true ) ];
			}
			else if ( argsLength === 1 && typeof arg0 === "object" && !(arg0 instanceof jQuery) ) {
				// args[0] is template context (already inserted in DOM) to be refreshed
				parentCtx = arg0;
				newCtxs[parentCtx.key] = parentCtx;
				dmArgs[0] = jQuery.tmpl( null, null, null, parentCtx );
				dmArgs[1] = parentCtx.data;
			}
 
			if ( parentCtx ) {
				dmArgs[2] = tmplCallback;
			}

			oldManip.apply( this, dmArgs );

			cloneIndex = 0;
			if ( !appendToCtxs ) {
				jQuery.tmpl.complete( newCtxs );
			}
			newCtxs = {};
			return this;

			function tmplCallback( fragClone ) {
				// Called by oldManip when $.template has been used to create content.
				// Provides cloned fragment ready for fixup prior to and after insertion into DOM
				var content = fragClone.nodeType === 11 ?
					jQuery.makeArray(fragClone.childNodes) :
					fragClone.nodeType === 1 ? [fragClone] : [];

				// Return fragment to original caller (e.g. append) for DOM insertion
				callback.call( this, fragClone );

				// Fragment has been inserted:- Add inserted nodes to context. Replace inserted element annotations by jQuery.data.
				storeContexts( content );
				cloneIndex++;
				delete parentCtx.content;
			}
		}
	});

	jQuery.extend({
		tmpl: function( tmpl, data, options, parentCtx, domFrag ) {
			var fn, targetCtx, coll, ret, wrapped;
			if ( parentCtx && !tmpl && !data && !options ) {
				// Re-evaluate rendered template for the parentCtx
				targetCtx = parentCtx;
				tmpl =  parentCtx.tmpl;
				data = parentCtx.data;
			} else if ( data && !parentCtx ) {
				// This is a top-level tmpl call (not from nesting using {{tmpl}})
				parentCtx = topCtx;
				wrapped = true;
			}
			if ( typeof tmpl === "string" ) {
				if ( htmlExpr.test( tmpl) ) {
					// This is an HTML string being passed directly in.
					// Assume the user doesn't want it cached.
					// They can stick it in jQuery.templates to cache it.
					tmpl = tmplFn( tmpl )
				} else if ( fn = jQuery.templates[ tmpl ] ) {
				 	// Use a pre-defined template, if available
					tmpl = fn;
				} else {
					// It's a selector
					tmpl = jQuery( tmpl )[0];
				}
			}
			// Generate a reusable function that will serve as a template
			// generator (and which will be cached).
			if ( tmpl instanceof jQuery ) {
				tmpl = tmpl.get(0);
			}
			if ( tmpl.nodeType && arguments.length === 1 && tmpl.nodeType === 1 && tmpl.getAttribute( "type" ) !== "text/html" ) {
				// Return template context for an element, unless element is a script block template declaration.
				while ( tmpl && !(tmplCtx = jQuery.data( tmpl, "tmplCtx" )) && (tmpl = tmpl.parentNode) ) {}
				return tmplCtx || topCtx;
			}
			// If arguments.length > 1, render template against data, and return fragments ready for DOM insertion.
			if ( typeof tmpl === "function" ) {
				fn = tmpl;
			} else if ( tmpl.nodeType ) {
				// If this is a template block, cache
				fn = jQuery.data( tmpl, "tmpl" ) || jQuery.data( tmpl, "tmpl", tmplFn( tmpl.innerHTML ));
			}
			if ( !fn ) {
				return []; //Could throw...
			}
			if ( targetCtx ) {
				// The context is already associated with DOM - this is a refresh.
				targetCtx.tmpl = fn;
				targetCtx.nodes = [];
				return jQuery( build( targetCtx, null, targetCtx.tmpl( jQuery, targetCtx ) ));
			}
			if ( !data ) {
				return fn;
			}
			if ( !parentCtx ) {
				return []; //Could throw...
			}
			if ( typeof data === "function" ) {
				data = data.call( parentCtx.data || {}, parentCtx );
			}

			ret = jQuery.isArray( data ) ? 
				jQuery.map( data, function( dataItem ) {
					return newCtx( options, parentCtx, fn, dataItem );
				}) :
				[ newCtx( options, parentCtx, fn, data ) ];

			ret = domFrag || wrapped ? build( parentCtx, null, ret ) : ret;
			return wrapped ? jQuery( ret) : ret;

			function build( ctx, parent, content ) {
				// Convert hierarchical content into flat string array 
				// and finally return array of fragments ready for DOM insertion
				var frag, ret = jQuery.map( content, function( item ) {
					return (typeof item === "string") ? 
						// Insert context annotations, to be converted to jQuery.data( "tmplCtx" ) when elems are inserted into DOM.
						item.replace( /(<\w+)([^>]*)/g, "$1 " + tCtxAtt + "=\"" + ctx.key + "\" $2" ) : 
						// This is a child template context. Build nested template.
						build( item, ctx, item.content );
				});
				if ( parent ) {
					// nested template
					return ret;
				}
				// top-level template
				ret = ret.join("");

				// Support templates which have initial or final text nodes
				ret.replace( /^\s*([^<\s][^<]*)?(<[\w\W]+>)([^>]*[^>\s])?\s*$/, function( all, before, middle, after) {
					frag = jQuery( middle ).get(); // For now use get(), since buildFragment is not current public
//					frag = jQuery.buildFragment( [middle] ); // If buildFragment was public, could do these two lines instead
//					frag = frag.cacheable ? frag.fragment.cloneNode(true) : frag.fragment;

					storeContexts( frag );
					if ( !!before ) frag.unshift( document.createTextNode( before ));
					if ( !!after ) frag.push( document.createTextNode( after ));
				});
				return frag ? frag : document.createTextNode( ret );
			}

			function tmplFn( markup ) {
				return new Function("jQuery","$ctx",
					"var $=jQuery,_=[],$data=$ctx.data;" +

					// Introduce the data as local variables using with(){}
					"with($data){_.push('" +

					// Convert the template into pure JavaScript
					$.trim(markup)
						.replace( /([\\'])/g, "\\$1" )
						.replace( /[\r\t\n]/g, " " )
						.replace( /\${([^}]*)}/g, "{{= $1}}" )
						.replace( /{{(\/?)(\w+|.)(?:\(((?:.(?!}}))*?)?\))?(?:\s+(.*?)?)?(\((.*?)\))?}}/g,
						function( all, slash, type, fnargs, target, parens, args ) {
							function unescape( args ) {
								return args ? args.replace( /\\'/g, "'").replace(/\\\\/g, "\\" ) : null;
							}
							var cmd = jQuery.tmplTags[ type ], def, expr;
							if ( !cmd ) {
								throw "Template command not found: " + type;
							}
							def = cmd._default || [];
							if ( target ) {
								target = unescape( target ); 
								args = args ? ("," + unescape( args ) + ")") : (parens ? ")" : "");
								expr = args ? ("(" + target + ").call($ctx" + args) : target;
								exprAutoFnDetect = args ? expr: "(typeof(" +  target + ")==='function'?(" +  target + ").call($ctx):(" +  target + "))";
							} else {
								expr = def["$1"] || "null";
							}
							fnargs = unescape( fnargs );
							return "');" + 
								cmd[ slash ? "suffix" : "prefix" ]
									.split( "$notnull_1" ).join( "typeof("+ target  +")!=='undefined' && (" + target + ")!=null" )
									.split( "$1a" ).join( exprAutoFnDetect )
									.split( "$1" ).join( expr )
									.split( "$2" ).join( fnargs ?
										fnargs.replace( /\s*([^\(]+)\s*(\((.*?)\))?/g, function( all, name, parens, params ) {
											params = params ? ("," + params + ")") : (parens ? ")" : "");
											return params ? ("(" + name + ").call($ctx" + params) : all;
										})
										: (def["$2"]||"")
									) +
								"_.push('";
						}) +
					"');}return _;"
				);
			}
		},

		// You can stick pre-built template functions here
		templates: {},
		/*
		 * For example, someone could do:
		 *   jQuery.templates.foo = jQuery.tmpl("some long templating string");
		 *   $("#test").append("foo", data);
		 */

		tmplTags: {
			"tmpl": {
				_default: { $2: "{}" },
				prefix: "if($notnull_1){_=_.concat($ctx.nest($1,$2));}"
				// tmpl target parameter can be of type function, so use $1, not $1a (so not auto detection of functions)
				// This means that {{tmpl foo}} treats foo as a template (which IS a function). 
				// Explicit parens can be used if foo is a function that returns a template: {{tmpl foo()}}.
			},
			"each": {
				_default: { $2: "$index, $value" },
				prefix: "if($notnull_1){$.each($1a,function($2){with(this){",
				suffix: "}});}"
			},
			"if": {
				prefix: "if(($notnull_1) && $1a){",
				suffix: "}"
			},
			"else": {
				prefix: "}else{"
			},
			"html": {
				prefix: "if($notnull_1){_.push($1a);}"
			},
			"=": {
				_default: { $1: "$data" },
				prefix: "if($notnull_1){_.push($.encode($1a));}"
			}
		},
		encode: function( text ) {
			// This should probably do HTML encoding replacing < > & and' and " by corresponding entities.
			return text != null ? document.createTextNode( text.toString() ).nodeValue : "";
		}
	});

	jQuery.extend( jQuery.tmpl, {
		complete: jQuery.noop
	});

	// Store template contexts in jQuery.data(), ensuring a unique context for each rendered template instance. 
	function storeContexts( content ) {
		var keySuffix = "_" + cloneIndex, elem, elems, newClonedCtx = {};
		for ( var i = 0, l = content.length; i < l; i++ ) {
			if ( (elem = content[i]).nodeType !== 1 ) {
				continue;
			}
			elems = elem.getElementsByTagName("*");
			for ( var j = 0, m = elems.length; j < m; j++) {
				processCtxKey( elems[j] );
			}
			processCtxKey( elem );
		}

		function processCtxKey( el ) {
			var pntKey, pntNode = el, pntCtx, pntNodeCtx, ctx, key;
			// Ensure that each rendered template inserted into the DOM has its own template context,
			if ( key = el.getAttribute( tCtxAtt )) {
				while ((pntNode = pntNode.parentNode).nodeType === 1 && !(pntKey = pntNode.getAttribute( tCtxAtt ))) { }
				if ( pntKey !== key ) {
					// This is a top-level element within this template context
					ctx = newCtxs[key];
					if ( cloneIndex ) {
						cloneContext( key );
					}
					pntNodeCtx = el.parentNode;
					pntNodeCtx = pntNodeCtx.nodeType === 11 ? 0 : (pntNodeCtx.getAttribute( tCtxAtt ) || 0);
				}
				el.removeAttribute( tCtxAtt );
			} else if ( cloneIndex && (ctx = jQuery.data( el, "tmplCtx" )) ) {
				// This was a rendered element, cloned during append or appendTo etc.
				// Ctx stored in jQuery data has already been cloned in cloneCopyEvent. We must replace it with a fresh cloned context. 
				cloneContext( ctx.key );
				newCtxs[ctx.key] = ctx;
				pntNodeCtx = jQuery.data( el.parentNode, "tmplCtx" );
				pntNodeCtx = pntNodeCtx ? pntNodeCtx.key : 0;
			}
			if ( ctx ) {
				pntCtx = ctx;
				// The template context of the parent element
				while ( pntCtx && pntCtx.key != pntNodeCtx ) {
					// Add this element as a top-level node for this context, as well as for any
					// ancestor contexts between this context and the context of its parent element
					pntCtx.nodes.push( el );
					pntCtx = pntCtx.parent;
				}
				delete ctx.content; // Could keep this available. Currently deleting to reduce API surface area, and memory use...
				// Store template context as jQuery data on the element
				jQuery.data( el, "tmplCtx", ctx );
			}
			function cloneContext( key ) {
				key = key + keySuffix;
				ctx = newClonedCtx[key] = newClonedCtx[key] || newCtx(ctx, newCtxs[ctx.parent.key + keySuffix] || ctx.parent, null, true);
			}
		}
	}
})(jQuery);