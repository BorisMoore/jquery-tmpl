/*
* Additional templating features or support for more advanced/less common scenarios.
* Requires jquery.tmpl.js 
*/
(function (jQuery) {
	var oldComplete = jQuery.tmpl.complete, oldManip = jQuery.fn.domManip;

	// Override jQuery.tmpl.complete in order to provide rendered event.
	jQuery.tmpl.complete = function( items ) {
		oldComplete( items);
		for ( var item in items ) {
			item =  items[item]; 
			// Raise rendered event
			if ( item.rendered ) {
				item.rendered( item );
			}
		}
	}

	jQuery.extend({
		tmplCmd: function( command, data, items ) {
			var retTmplItems = [], before; 
			data = jQuery.isArray( data ) ? data : [ data ];
			switch ( command ) {
				case "find":
					return find( data, items );
				case "replace":
					data.reverse();
			}
			jQuery.each( items ? find( data, items ) : data, function( i, item ) { 
				coll = item.nodes;
				switch ( command ) {
					case "update":
						jQuery.tmpl( null, null, null, item ).insertBefore( coll[0] );
						jQuery( coll ).remove();
						break;
					case "remove":
						jQuery( coll ).remove();
						if ( items ) {
							items.splice( jQuery.inArray( item, items ), 1 );
						}
						break;
					case "replace":
						before = before ? 
							jQuery( coll ).insertBefore( before )[0] : 
							jQuery( coll ).appendTo( coll[0].parentNode )[0];
						retTmplItems.unshift( item );
				}
			});
			return retTmplItems;
			function find( data, items ) {
				var found = [], item, ci, cl = items.length, dataItem, di = 0, dl = data.length;
				for ( ; di < dl; ) {
					dataItem = data[di++]; 
					for ( ci = 0; ci < cl; ) {
						item = items[ci++];
						if ( item.data === dataItem ) {
							found.push( item );
						}
					}
				}
				return found;
			}
		}
	});

	jQuery.fn.extend({
		domManip: function (args, table, callback, options) {
			var data = args[1], tmpl = args[0], dmArgs;
			if ( args.length >= 2 && typeof data === "object" && !data.nodeType && !(data instanceof jQuery)) {
				// args[1] is data, for a template.
				dmArgs = jQuery.makeArray( arguments );
				
				// Eval template to obtain fragment to clone and insert
				dmArgs[0] = [ jQuery.tmpl( jQuery.templates( tmpl ), data, args[2], args[3], true ) ];
				
				dmArgs[2] = function( fragClone ) {
					// Handler called by oldManip when rendered template has been inserted into DOM.
					jQuery.tmpl.afterManip( this, fragClone, callback );
				}
				return oldManip.apply( this, dmArgs );
			}
			return oldManip.apply( this, arguments );
		}
	});
})(jQuery);



