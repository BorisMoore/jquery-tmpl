/*
* Additional templating features or support for more advanced/less common scenarios.
* Requires jquery.tmpl.js 
*/
(function (jQuery) {
	var oldComplete = jQuery.tmpl.complete, oldManip = jQuery.fn.domManip;

	// Override jQuery.tmpl.complete in order to provide rendered event.
	jQuery.tmpl.complete = function( ctxs ) {
		oldComplete( ctxs);
		for ( var ctx in ctxs ) {
			ctx =  ctxs[ctx]; 
			// Raise rendered event
			if ( ctx.rendered ) {
				ctx.rendered( ctx );
			}
		}
	}

	jQuery.extend({
		tmplCmd: function( command, data, contexts ) {
			var retCtxs = [], before; 
			data = jQuery.isArray( data ) ? data : [ data ];
			switch ( command ) {
				case "find":
					return find( data, contexts );
				case "replace":
					data.reverse();
			}
			jQuery.each( contexts ? find( data, contexts ) : data, function( i, ctx ) { 
				coll = ctx.nodes;
				switch ( command ) {
					case "update":
						jQuery.tmpl( null, null, null, ctx ).insertBefore( coll[0] );
						jQuery( coll ).remove();
						break;
					case "remove":
						jQuery( coll ).remove();
						if ( contexts ) {
							contexts.splice( jQuery.inArray( ctx, contexts ), 1 );
						}
						break;
					case "replace":
						before = before ? 
							jQuery( coll ).insertBefore( before )[0] : 
							jQuery( coll ).appendTo( coll[0].parentNode )[0];
						retCtxs.unshift( ctx );
				}
			});
			return retCtxs;
			function find( data, ctxs ) {
				var found = [], ctx, ci, cl = ctxs.length, dataItem, di = 0, dl = data.length;
				for ( ; di < dl; ) {
					dataItem = data[di++]; 
					for ( ci = 0; ci < cl; ) {
						ctx = ctxs[ci++];
						if ( ctx.data === dataItem ) {
							found.push( ctx );
						}
					}
				}
				return found;
			}
		}
	});

	jQuery.fn.extend({
		domManip: function (args, table, callback, options) {
			var parentCtx, data = args[1], tmpl = args[0], dmArgs;
			if ( args.length >= 2 && typeof data === "object" && !data.nodeType && !(data instanceof jQuery)) {
				dmArgs = jQuery.makeArray( arguments );
				// args[1] is data, for a template. Eval template to obtain fragment to clone and insert
				parentCtx = args[3] || { key: 0 };
				
				dmArgs[0] = [ jQuery.tmpl( tmpl, data, args[2], parentCtx, true ) ];
				
				dmArgs[2] = function( fragClone ) {
					// Handler called by oldManip when rendered template has been inserted into DOM.
					jQuery.tmpl.afterManip( parentCtx, this, fragClone, callback );
				}
				return oldManip.apply( this, dmArgs );
			}
			return oldManip.apply( this, arguments );
		}
	});
})(jQuery);



