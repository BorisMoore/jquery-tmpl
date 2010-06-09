/*
 * jQuery Templating Plugin
 *   NOTE: Created for demonstration purposes.
 * Copyright 2010, John Resig
 * Dual licensed under the MIT or GPL Version 2 licenses.
 */
(function(jQuery){
	// Override the DOM manipulation function
	var oldManip = jQuery.fn.domManip, tCtxAtt = "_tmplctx", filterAll = "[" + tCtxAtt + "]", itm, ob,
		htmlExpr = /^[^<]*(<[\w\W]+>)[^>]*$/, newCtxs = {}, topCtx = newCtx({ key: 0 }), ctxKey = 0, cachedTmpl;
		
	function newCtx( options, parentCtx, fn, data ) { 
		// Returns a template context for a new instance of a template. 
		// The content field is a hierarchical array of strings and nested contexts (to be  
		// removed and replaced by nodes field of dom elements, once inserted in DOM).
		var newCtx = { 
			index: -1,
			data: data || null,
			tmpl: null,
			parent: parentCtx || null,
			nodes: [],
			update: update,
			remove: remove
		};
		if ( options) {
			jQuery.extend( newCtx, options, { nodes: [], parent: parentCtx } );
		}
		if ( fn ) {
			// Build the hierarchical content to be used during insertion into DOM
			newCtx.tmpl = fn;
			newCtx.content = newCtx.tmpl( jQuery, newCtx );
			// Add to dictionary of new contexts for this domManip operation
			newCtx.key = ++ctxKey;
			// Keep track of contexts created during this domManip.
			newCtxs[ctxKey] = newCtx;
		} 
		return newCtx;
		
		function update( context ) {
			context  = context ? jQuery.extend( this, context ) : this;
			var nodes = context.nodes;
			jQuery( nodes[0] ).before( context );
			jQuery( nodes ).remove();
			return this;
		}
		function remove() {
			jQuery( this.nodes ).remove();
			return this;
		}
	}
	
	jQuery.fn.extend({
		tmpl: function( data, options, parentCtx ) {
			// Use wrapped elements as template markup. 
			// Return wrapped set of fragments obtained by evaluating template against data. 
			if ( arguments.length ) {
				cachedTmpl = true;
				return this.map( function( i, tmpl ){
					return jQuery.tmpl( tmpl, parentCtx || topCtx, data, options, true );
				});
			}	
			// If no arguments, used to get template context of first wrapped DOM element
			return jQuery.tmpl( this[0] );
		},

		// This will allow us to do: .append( "template", dataObject )
		domManip: function( args, table, callback ) {
			// This appears to be a bug in the appendTo, etc. implementation
			// it should be doing .call() instead of .apply(). See #6227
			var parentCtx, cloneIndex = -1, dmArgs = jQuery.makeArray( arguments );
			cachedTmpl = false;
			if ( args.length > 1 && args[0].nodeType ) {
				newCtxs = jQuery.data( args[0], "tmplCtxs" );
				for ( itm in newCtxs ) {
					parentCtx = newCtxs[itm].parent; // Could test for hasOwnProperty...
					cachedTmpl = true;
					break;
				}
				dmArgs[0] = [jQuery.makeArray( args )];
			} 
			else if ( args.length >= 2 && typeof args[1] === "object" && !args[1].nodeType ) {
				// args[1] is data, for a template. Eval template to obtain fragment to clone and insert
				parentCtx = args[3] || topCtx;
				dmArgs[0] = [ jQuery.tmpl( args[0], parentCtx, args[1], args[2], true ) ]; 
			} 
			else if ( args.length === 1 && typeof args[0] === "object" && !args[0].nodeType && !(args[0] instanceof jQuery) ) {
				// args[0] is template context (already inserted in DOM) to be refreshed
				parentCtx = args[0];
				newCtxs[parentCtx.key] = parentCtx;
				dmArgs[0] = [ jQuery.tmpl( parentCtx ) ];
				dmArgs[1] = parentCtx.data; 
			} 
			if ( parentCtx ) {
				dmArgs[2] = tmplCallback;
				dmArgs[3] = cachedTmpl;
			}
			
			oldManip.apply( this, dmArgs );
			
			cloneIndex = -1;
			
			// Call onRendered for each inserted template instance. 
			var ctxs = newCtxs;
			newCtxs = {};
			for ( itm in ctxs ) {
				ob =  ctxs[itm]; // Could test for hasOwnProperty...
				if ( ob.rendered ) {
					ob.rendered( ob );
				}
			}
			return this; 
			
			function tmplCallback( fragClone ) { 	
				// Called by oldManip when $.template has been used to create content. 
				// Provides cloned fragment ready for fixup prior to and after insertion into DOM 
				var i, l, ctx, key, keySuffix, parent,
				
				content = jQuery( fragClone.nodeType === 11 ? fragClone.childNodes : fragClone );
				cloneIndex++;
				keySuffix = "_" + cloneIndex;
						 
				// Return fragment to original caller (e.g. append) for DOM insertion
				callback.call( this, fragClone ); 

				// Fragment has been inserted:- Add inserted nodes to context. Replace inserted element annotations by jQuery.data. 
				content.find( filterAll ).add( content.filter( filterAll )).each( function() {
					key = jQuery.attr(this, tCtxAtt);
					if ( !jQuery( this.parentNode ).closest( "[" + tCtxAtt + "=" + key + "]" ).length ) {
						parent = ctx = newCtxs[key];
						if ( cloneIndex ) {
							key = key + keySuffix;
							newCtxs[key] = newCtxs[key] || newCtx( ctx, newCtxs[ctx.parent.key + keySuffix] || ctx.parent, true );
						} 
						parentNodeCtx = jQuery.attr(this.parentNode, tCtxAtt) || 0;
						while ( parent && parent.key != parentNodeCtx ) {
							parent.nodes.push( this );
							parent = parent.parent;
						}
						jQuery.data( this, "tmplCtx", ctx );
					}
				}).removeAttr( tCtxAtt );
				
				delete parentCtx.content;
			}
		}
	});
	
	jQuery.extend({
		tmpl: function( tmpl, parentCtx, data, options, domFrag ) {
			var fn, targetCtx;
			if ( arguments.length === 1 ) {
				// Generate a reusable function that will serve as a template
				// generator (and which will be cached).
				if ( (typeof tmpl === "string") && !htmlExpr.test( tmpl ) ) {
					// it is a selector
					tmpl = jQuery( tmpl )[0];
				}
				else if ( tmpl instanceof jQuery ) {
					// This is an HTML string being passed directly in. 
					// Assume the user doesn't want it cached. 
					// They can stick it in jQuery.templates to cache it.
					tmpl = tmpl.get(0);
				} 
				if ( tmpl.nodeType ) {
					// Return template context for an element, unless element is a script block template declaration.
					if (jQuery.attr( tmpl, "type") !== "text/html" ) {
						while ( tmpl && !(tmplCtx = jQuery.data( tmpl, "tmplCtx" )) && (tmpl = tmpl.parentNode) ) {}
						return tmplCtx || topCtx;
					}
				} else {
					// Render an updated template context, already associated with DOM.
					targetCtx = tmpl;
					tmpl =  tmpl.tmpl;
				}
			}
			if ( !tmpl ) {
				return topCtx;
			}
			// If arguments.length > 1 render template against data, and return fragments ready for DOM insertion.
			if ( typeof tmpl === "string" ) {
				// Use a pre-defined template, if available
				fn = jQuery.templates[ tmpl ];
				if ( !fn ) {
					fn = tmplFn( jQuery( tmpl )[0].innerHTML );
				}
			} else if ( typeof tmpl === "function" ) {
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
				targetCtx.content = targetCtx.tmpl( jQuery, targetCtx );
				return build( targetCtx );
			}
	
			data = data || (parentCtx ? parentCtx.data : null);
			if ( !data ) {
				return fn;
			}
			if ( typeof data === "function" ) {
				data = data.call( parentCtx.data || {}, parentCtx );  
			}
			parentCtx.content = jQuery.isArray( data ) ? 
				jQuery.map( data, function( dataItem ) {
					return newCtx( options, parentCtx, fn, dataItem );
				}) : 
				[ newCtx( options, parentCtx, fn, data ) ];
			
			return domFrag ? build( parentCtx ) : parentCtx.content;

			function build( ctx, parent ) {
				// Convert hierarchical content into flat string array 
				// and finally return array of fragments ready for DOM insertion
				var frag, ret = jQuery.map( ctx.content, function( item ) {
					return (typeof item === "string") ? 
						// Insert context annotations, to be converted to jQuery.data( "tmplCtx" ) when elems are inserted into DOM.
						item.replace( /(<\w+)([^>]*)/g, "$1 " + tCtxAtt + "=\"" + ctx.key + "\" $2" ) : 
						// This is a child template context. Build nested template.
						build( item, ctx );
				});
				if ( parent ) {
					// nested template
					return ret;
				}
				// top-level template
				ret = ret.join("");
				
				// Support templates which have initial or final text nodes
				ret.replace( /^\s*([^<\s][^<]*)?(<[\w\W]+>)([^>]*[^>\s])?\s*$/, function( all, before, middle, after) {
					frag = jQuery( middle ).get();
					if ( cachedTmpl ) {
						jQuery.data( frag[0], "tmplCtxs", newCtxs );
						newCtxs = {};
					}
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
					markup
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
							} else {
								expr = def["$1"] || "null";
							}
							fnargs = unescape( fnargs );
							return "');" + 
								cmd[ slash ? "suffix" : "prefix" ]
									.split( "$defined_1" ).join( "typeof("+ target  +")!=='undefined'" )
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
				_default: { $2: "null" },
				prefix: "if($defined_1){_=_.concat($.tmpl($1,$ctx,$2));}"
			},
			"each": {
				_default: { $2: "$index, $value" },
				prefix: "if($defined_1){$.each($1,function($2){with(this){",
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
				_default: { $1: "$data" },
				prefix: "if($defined_1){_.push($.encode($1));}"
			}
		},
		encode: function( text ) {
			// This should probably do HTML encoding replacing < > & and' and " by corresponding entities.
			return text != null ? document.createTextNode( text.toString() ).nodeValue : "";
		}
	});
})(jQuery);
