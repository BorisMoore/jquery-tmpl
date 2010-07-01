/*
* Additional templating features or support for more advanced/less common scenarios.
* Requires jquery.tmpl.js 
*/
(function (jQuery) {
	var oldComplete = jQuery.tmpl.complete;

	// Override jQuery.tmpl.complete in order to provide rendered event.
	jQuery.tmpl.complete = function( ctxs ) {
		for ( var ctx in ctxs ) {
			ctx =  ctxs[ctx]; 
			// Raise rendered event
			if ( ctx.rendered ) {
				ctx.rendered( ctx );
			}
		}
		oldComplete( ctxs);
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
						jQuery( coll[0] ).before( ctx );
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
})(jQuery);



