/*
 * jQuery Templating Plugin
 *   NOTE: Created for demonstration purposes.
 * Copyright 2010, John Resig
 * Dual licensed under the MIT or GPL Version 2 licenses.
 */
(function(jQuery){
	// Override the DOM manipulation function
	var oldManip = jQuery.fn.domManip, tCtxAtt = "_tmplctx",
		htmlExpr = /^[^<]*(<[\w\W]+>)[^>]*$/, tmplCtxs = [], topCtx;

	(tmplCtxs.newCtx = function( options, parentCtx, fn, data, array ) { 
		// Returns a template context for a new instance of a template. 
		// The content field is a hierarchical array of strings and nested contexts (to be  
		// removed and replaced by nodes field of dom elements, once inserted in DOM).
		var newCtx = { 
			index: -1,
			data: data || null,
			tmpl: null,
			array: array || null,
			parent: parentCtx || null,
			nodes: [],
			children: [],
			dataIndex: function() {
				return this.array ? jQuery.inArray(this.data, this.array ) : -1;
			},
			update: function( context ) {
				context  = context ? jQuery.extend( this, context ) : this;
				var nodes = context.nodes;
				jQuery( nodes[0] ).before( context );
				jQuery( nodes ).remove();
				return this;
			},
			remove: function() {
				jQuery( this.nodes ).remove();
				var index = this.index, siblings = this.parent.children;
				siblings.splice( index, 1 );
				while ( siblings[index] ) {
					siblings[index++].index++;
				}
				return this;
			}
		};
		if ( options) {
			jQuery.extend( newCtx, options, { nodes: [], children: [] } );
			if (parentCtx) {
				newCtx.parent = parentCtx;
			}	  
		}
		newCtx.key = tmplCtxs.push( newCtx ) - 1;
		if ( fn ) {
			// Build the hierarchical content to be used during insertion into DOM
			newCtx.content = fn.call( data, jQuery, newCtx )
			newCtx.tmpl = fn;
		}
		return newCtx;
	})();
	
	topCtx = tmplCtxs[0];

	jQuery.fn.extend({
		render: function( data, options, parentCtx ) {
			return this.map( function( i, tmpl ){
				return jQuery.evalTmpl( parentCtx || topCtx, tmpl, data, options, true );
			});
		},

		// This will allow us to do: .append( "template", dataObject )
		domManip: function( args, table, callback ) {
			// This appears to be a bug in the appendTo, etc. implementation
			// it should be doing .call() instead of .apply(). See #6227
			var parentCtx, newIndex = tmplCtxs.length, dmArgs = jQuery.makeArray( arguments );
			if ( args.length > 1 && args[0].nodeType ) {
				dmArgs[0] = [jQuery.makeArray( args )];
			} 
			else if ( args.length >= 2 && typeof args[1] === "object" && !args[1].nodeType ) {
				// args[1] is data, for a template. Eval template to obtain fragment to clone and insert
				parentCtx = args[3] || topCtx;
				dmArgs[0] = [ jQuery.evalTmpl( parentCtx, args[0], args[1], args[2], true ) ]; 
				dmArgs[2] = tmplCallback;
			} 
			else if ( args.length === 1 && typeof args[0] === "object" && !args[0].nodeType && !(args[0] instanceof jQuery) ) {
				// args[0] is template context (already inserted in DOM) to be refreshed
				parentCtx = args[0];
				dmArgs[0] = [ jQuery.evalTmpl( parentCtx ) ];
				dmArgs[1] = parentCtx.data; 
				dmArgs[2] = tmplCallback;
			} 
			return oldManip.apply( this, dmArgs );

			function tmplCallback( fragClone ) { 	
				// Called by oldManip when evalTmpl has been used to create content. 
				// Provides cloned fragment ready for fixup prior to and after insertion into DOM 
				var i, l, ctx, newCtxs = {}, clones = {}, key, parent, c, filterAll = "[" + tCtxAtt + "]",
				
				content = jQuery( fragClone.nodeType === 11 ? fragClone.childNodes : fragClone );

				// Return fragment to original caller (e.g. append) for DOM insertion
				callback.call( this, fragClone ); 

				// Fragment has been inserted:- Add inserted nodes to context. Replace inserted element annotations by jQuery.data. 
				content.find( filterAll ).add( content.filter( filterAll )).each( function() {
					key = jQuery.attr(this, tCtxAtt);
					if ( !jQuery( this.parentNode ).closest( "[" + tCtxAtt + "=" + key + "]" ).length ) {
						ctx = tmplCtxs[key];
						
						parent = ctx = parentCtx.content ? 
							(newCtxs[key] = ctx) : 
							// Case of multiple elems in wrapped set, so multiple cloned fragments inserted into DOM:- Give each a template context.
							(clones[key] || ( clones[key] = tmplCtxs.newCtx( ctx, clones[ctx.parent.key] ))), 
						
						parentNodeCtx = jQuery.attr(this.parentNode, tCtxAtt) || 0;
						while ( parent && parent.key != parentNodeCtx ) {
							parent.nodes.push( this );
							parent = parent.parent;
						}
						jQuery.data( this, "tmplCtx", ctx );
					}
				}).removeAttr( tCtxAtt );

				// Call onRendered for each inserted template instance. 
				for ( c in newCtxs ) {
					ctx =  newCtxs[c];
					delete ctx.content;
					if ( ctx.rendered ) {
						ctx.rendered.call( ctx, ctx );
					}
				}
				delete parentCtx.content;
			}
		},

		templateContext: function() {
			// Used to get template context of DOM element
			// Could combine this with render plugin: Rename render to template, and use it both for 
			// rendering template and (if no params) for getting template context
			var node = this.get(0), tmplCtx;
			while ( node && !(tmplCtx = jQuery.data( node, "tmplCtx" )) && (node = node.parentNode) ) {}
			return tmplCtx || topCtx;
		}
	});
	
	jQuery.extend({
		evalTmpl: function( parentCtx, tmpl, data, options, domFrag ) {
			var fn, targetCtx;
			if ( arguments.length === 1 ) {
				// The context is already associated with DOM - this is a refresh.
				targetCtx = parentCtx;
				tmpl =  parentCtx.tmpl;
			}
			if ( typeof tmpl === "string" ) {
				// Use a pre-defined template, if available
				fn = jQuery.templates[ tmpl ];
				if ( !fn ) {
					fn = jQuery.tmpl( tmpl );
				}
			} else if ( typeof tmpl === "function" ) {
				fn = tmpl;
			} else {
				fn = jQuery.tmpl( tmpl );
			}
			if ( !fn ) {
				return []; //Could throw...
			}
	
			if ( targetCtx ) {
				// The context is already associated with DOM - this is a refresh.
				targetCtx.tmpl = fn;
				targetCtx.nodes = [];
				targetCtx.children = [];
				targetCtx.content = fn.call( targetCtx.data, jQuery, targetCtx );
				return build( targetCtx );
			}
	
			data = data || (parentCtx ? parentCtx.data : null);
			//options = options || {};
			if ( typeof data === "function" ) {
				data = data.call( parentCtx.data || {}, parentCtx );  
			}
			parentCtx.content = jQuery.isArray( data ) ? 
				jQuery.map( data, function( dataItem ) {
					return tmplCtxs.newCtx( options, parentCtx, fn, dataItem, data )
				}) : 
				[ tmplCtxs.newCtx( options, parentCtx, fn, data, null ) ];
			return domFrag ? build( parentCtx ) : parentCtx.content;
			
			function build( ctx, parent ) {
				// Convert hierarchical content into flat string array 
				// and finally return array fragments ready for DOM insertion
				var frag, ret = jQuery.map( ctx.content, function( item ) {
					return (typeof item === "string") ? 
						// Insert context annotations, to be converted to jQuery.data("tmplCtx") when elems are inserted into DOM.
						item.replace( /(<\w+)([^>]*)/g, "$1 " + tCtxAtt + "=\"" + ctx.key + "\" $2" ) : 
						// This is a child template context. Build nested template.
						build( item, ctx );
				});
				if ( parent ) {
					// nested template
					ctx.index = parent.children.push( ctx ) - 1;
					return ret;
				}
				// top-level template
				ret = ret.join("");
				
				// Support templates which have initial or final text nodes
				ret.replace( /^\s*([^<\s][^<]*)?(<[\w\W]+>)([^>]*[^>\s])?\s*$/, function( all, before, middle, after) {
					frag = jQuery( middle ).get();
					if ( !!before ) frag.unshift( document.createTextNode( before ));
					if ( !!after ) frag.push( document.createTextNode( after ));
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
		
		templateContexts: tmplCtxs,
		
		tmplcmd: {
			"render": {
				_default: { $2: "null" },
				prefix: "if($defined_1){_=_.concat($.evalTmpl($context,$1,$2));}"
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
			if ( (typeof tmpl === "string") && !htmlExpr.test( tmpl ) ) {
				// it is a selector
				tmpl = jQuery( tmpl )[0];
			}
			else if ( tmpl instanceof jQuery ) {
				tmpl = tmpl.get(0);
			} 
			if ( tmpl.nodeType ) {
				return jQuery.data( tmpl, "tmpl" ) || jQuery.data( tmpl, "tmpl", tmplFn( tmpl.innerHTML ));
				// Cache, if tmpl is a node. We assume that if the template string is 
				// being passed directly in, the user doesn't want it cached. They can
				// stick it in jQuery.templates to cache it.
			}
			return tmplFn( tmpl ); 
			
			function tmplFn( markup ) {
				return new Function("jQuery","$context", 
					"var $=jQuery,_=[],$i=$context.dataIndex();" +
					
					// Introduce the data as local variables using with(){}
					"with(this){_.push('" +

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
							var cmd = jQuery.tmplcmd[ type ], def, expr;
							if ( !cmd ) {
								throw "Template command not found: " + type;
							}
							def = cmd._default || [];
							if ( target ) {
								target = unescape( target ); 
								args = args ? ("$context," + unescape( args ) + ")") : (parens ? "$context)" : "");
								expr = args ? ("(" + target + ").call(this," + args) : target;
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
