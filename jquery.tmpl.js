/*
 * jQuery Templating Plugin
 *   NOTE: Created for demonstration purposes.
 * Copyright 2010, John Resig
 * Dual licensed under the MIT or GPL Version 2 licenses.
 */
(function( jQuery, undefined ){
	var oldManip = jQuery.fn.domManip, tCtxAtt = "_tmplctx", itm, ob,
		newCtxs = {}, appendToCtxs, topCtx = { key: 0, data: {} }, ctxKey = 0, cloneIndex = 0;

	function newCtx( options, parentCtx, fn, data ) {
		// Returns a template context for a new instance of a template. 
		// The content field is a hierarchical array of strings and nested contexts (to be
		// removed and replaced by nodes field of dom elements, once inserted in DOM).
		var newCtx = { 
			data: data || (parentCtx ? parentCtx.data : {}),
			tmpl: null,
			parent: parentCtx || null,
			nodes: [],
			nest: nest
		};
		if ( options ) {
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
	}

	// Override appendTo etc., in order to provide support for targeting multiple elements. (This code would disappear if integrated in jquery core).
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

			xappendToCtxs = newCtxs || {};
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
			var ctxs = appendToCtxs;
			appendToCtxs = null;
			jQuery.tmpl.complete( ctxs );
			return ret;
		};
	});

	jQuery.fn.extend({
		tmpl: function( data, options, parentCtx ) {
			if ( arguments.length ) {
				// Use first wrapped element as template markup.
				// Return wrapped set of fragments obtained by evaluating template against data.
				return jQuery.tmpl( this[0], data, options, parentCtx, parentCtx === undefined );
			}	
			// If no arguments, used to get template context of first wrapped DOM element, 
			// or, if it is a template script block, the compiled template
			return jQuery.tmpl( this[0] );
		},

		templates: function( name ) {
			return jQuery.templates( name, this[0] );
		},

		domManip: function( args, table, callback, options ) {
			// This appears to be a bug in the appendTo, etc. implementation
			// it should be doing .call() instead of .apply(). See #6227
			if ( args[0].nodeType ) {
				var dmArgs = jQuery.makeArray( arguments ), argsLength = args.length, i = 0, ctx;
				while ( i < argsLength && !(ctx = jQuery.data( args[i++], "tmplCtx" ))) {};
				if ( argsLength > 1 ) {
					dmArgs[0] = [jQuery.makeArray( args )];
				}
				if ( ctx && cloneIndex ) {
					dmArgs[2] = function( fragClone ) {
						// Handler called by oldManip when rendered template has been inserted into DOM.
						jQuery.tmpl.afterManip( this, fragClone, callback );
					}
				}
				oldManip.apply( this, dmArgs );
			} else {
				oldManip.apply( this, arguments );
			}
			cloneIndex = 0;
			if ( !appendToCtxs ) {
				jQuery.tmpl.complete( newCtxs );
			}
			return this;
		}
	});

	jQuery.extend({
		tmpl: function( tmpl, data, options, parentCtx, domFrag ) {
			var fn, targetCtx, coll, ret, wrapped;
			if ( parentCtx && !tmpl && !data && !options ) {
				// Re-evaluate rendered template for the parentCtx
				targetCtx = parentCtx;
				tmpl =  parentCtx.tmpl;
				newCtxs[parentCtx.key] = parentCtx;
			} else if ( domFrag || arguments.length === 2 ) {
				// This is a top-level tmpl call (not from a nested template using {{tmpl}})
				parentCtx = topCtx;
				wrapped = true;
			}
			if ( typeof tmpl === "string" ) {
				if ( fn = jQuery.templates[ tmpl ] ) {
				 	// Use a pre-defined template, if available
					tmpl = fn;
				} else {
					// This is an HTML string being passed directly in.
					tmpl = buildTmplFn( tmpl )
				}
			}
			if ( tmpl instanceof jQuery ) {
				tmpl = tmpl.get(0) || {};
			}
			if ( tmpl.nodeType && arguments.length === 1 && tmpl.nodeType === 1 ) {
				// Return template context for an element.
				while ( tmpl && !(tmplCtx = jQuery.data( tmpl, "tmplCtx" )) && (tmpl = tmpl.parentNode) ) {}
				return tmplCtx || topCtx;
			}
			
			// If arguments.length > 1, render template against data, and return fragments ready for DOM insertion.
			if ( typeof tmpl === "function" ) {
				fn = tmpl;
			} else if ( tmpl.nodeType ) {
				// If this is a template block, generate tmpl function and cache.
				fn = jQuery.data( tmpl, "tmpl" ) || jQuery.data( tmpl, "tmpl", buildTmplFn( tmpl.innerHTML ));
			}
			if ( !fn ) {
				return []; //Could throw...
			}
			if ( targetCtx ) {
				// The context is already associated with DOM - this is a refresh.
				targetCtx.tmpl = fn;
				targetCtx.nodes = [];
				// Rebuild, without creating a new template context
				return jQuery( build( targetCtx, null, targetCtx.tmpl( jQuery, targetCtx ) ));
			}
			if ( !parentCtx && arguments.length > 3) {
				return fn; 
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
		},

		// Use $.templates( name, tmpl ) to cache a named template, 
		// where tmpl is a template string, a script element or a jQuery instance wrapping a script element, etc.
		// Use $( "selector" ).templates( name ) to provide access by name to a script block template declaration.

		// Use $.templates( name ) to access a cached template.
		// Also $( selectorToScriptBlock ).templates(), or $.templates( null, templateString ) 
		// will return the compiled template, without adding a name reference.  
		templates: function( name, tmpl ) {
			if (tmpl) {
				// Compile template and associate with name
				return jQuery.templates[name] = jQuery.tmpl( tmpl, null, null, null );
			}
			// Return named compiled template
			return jQuery.templates[name] || 
				// Could use htmlExpr.test( tmpl) ? ... : null; to avoid spurious scenarios of html instead of selector
				jQuery( name ).tmpl( null, null, null ); 
		},

		encode: function( text ) {
			// Do HTML encoding replacing < > & and ' and " by corresponding entities.
			return ("" + text).split("<").join("&lt;").split(">").join("&gt;").split('"').join("&#34;").split("'").join("&#39;");
		}
	});

	jQuery.extend( jQuery.tmpl, {
		tags: {
			"tmpl": {
				_default: { $2: "null" },
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

		// This stub can be overridden, e.g. in jquery.tmplPlus for providing rendered events
		complete: function( ctxs ) {
			newCtxs = {};
		},

		// Call this from code which overrides domManip, or equivalent
		// Manage cloning/storing template contexts etc.
		afterManip: function afterManip( elem, fragClone, callback ) {
			// Provides cloned fragment ready for fixup prior to and after insertion into DOM
			var content = fragClone.nodeType === 11 ?
				jQuery.makeArray(fragClone.childNodes) :
				fragClone.nodeType === 1 ? [fragClone] : [];

			// Return fragment to original caller (e.g. append) for DOM insertion
			callback.call( elem, fragClone );

			// Fragment has been inserted:- Add inserted nodes to context. Replace inserted element annotations by jQuery.data.
			storeContexts( content );
			cloneIndex++;
		}
	});

	//========================== Private helper functions, used by code above ========================== 
	  
	function build( ctx, parent, content ) {
		// Convert hierarchical content into flat string array 
		// and finally return array of fragments ready for DOM insertion
		var frag, el, ret = jQuery.map( content, function( item ) {
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

		// Support templates which have initial or final text nodes, or consist only of text
		// Also support HTML entities within the HTML markup.
		ret.replace( /^\s*([^<\s][^<]*)?(<[\w\W]+>)([^>]*[^>\s])?\s*$/, function( all, before, middle, after) {
			frag = jQuery( middle ).get(); // For now use get(), since buildFragment is not current public
//					frag = jQuery.buildFragment( [middle] ); // If buildFragment was public, could do these two lines instead
//					frag = frag.cacheable ? frag.fragment.cloneNode(true) : frag.fragment;

			storeContexts( frag );
			if ( before ) {
				frag = unencode( before ).concat(frag);
			}
			if ( after ) {
				frag = frag.concat(unencode( after ));
			}
		});
		return frag ? frag : unencode( ret );
	}

	function unencode( text ) {
		// createTextNode will not render HTML entities correctly
		var el = document.createElement( "div" );
		el.innerHTML = text;
		return jQuery.makeArray(el.childNodes);
	}

	// Generate a reusable function that will serve to render a template against data
	function buildTmplFn( markup ) {
		return new Function("jQuery","$ctx",
			"var $=jQuery,_=[],$data=$ctx.data;" +

			// Introduce the data as local variables using with(){}
			"with($data){_.push('" +

			// Convert the template into pure JavaScript
			$.trim(markup)
				.replace( /([\\'])/g, "\\$1" )
				.replace( /[\r\t\n]/g, " " )
				.replace( /\${([^}]*)}/g, "{{= $1}}" )
				.replace( /{{(\/?)(\w+|.)(?:\(((?:.(?!}}))*?)?\))?(?:\s+(.*?)?)?(\((.*?)\))?\s*}}/g,
				function( all, slash, type, fnargs, target, parens, args ) {
					var cmd = jQuery.tmpl.tags[ type ], def, expr;
					if ( target.indexOf(".") > -1 ) {
						// Support for target being things like a.toLowerCase(); 
						// In that case don't call with ctx as this pointer. Just evaluate...
						target = target + parens;
						parens = args = "";
					}
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
							.split( "$notnull_1" ).join( "typeof(" + target + ")!=='undefined' && (" + target + ")!=null" )
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

	function unescape( args ) {
		return args ? args.replace( /\\'/g, "'").replace(/\\\\/g, "\\" ) : null;
	}

	function nest( tmpl, data, options ) {
		// nested template, using {{tmpl}} tag
		return jQuery.tmpl( typeof tmpl === "string" ? jQuery.templates( tmpl ) : tmpl, data, options, this );
	}

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
					// The next ancestor with a _tmplctx expando is on a different key than this one.
					// So this is a top-level element within this template context
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
				// Find the template context of the parent element
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