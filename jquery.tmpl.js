/*
 * jQuery Templating Plugin
 *   NOTE: Created for demonstration purposes.
 * Copyright 2010, John Resig
 * Dual licensed under the MIT or GPL Version 2 licenses.
 */
(function(jQuery){
	// Override the DOM manipulation function
	var oldManip = jQuery.fn.domManip;
	
	jQuery.fn.extend({
		render: function( data, options ) {
			return this.map(function(i, tmpl){
				return jQuery.render( tmpl, data, options );
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
				arguments[0] = [ jQuery.render( args[0], args[1], args[2] ) ];
			}
			
			return oldManip.apply( this, arguments );
		}
	});
	
	jQuery.extend({
		render: function( tmpl, data, options ) {
			var fn;
			
			// Use a pre-defined template, if available
			if ( jQuery.templates[ tmpl ] ) {
				fn = jQuery.templates[ tmpl ];
				
			// We're pulling from a script node
			} else if ( tmpl.nodeType ) {
				var node = tmpl, elemData = jQuery.data( node );
				fn = elemData.tmpl || jQuery.tmpl( node.innerHTML );
			}

			fn = fn || jQuery.tmpl( tmpl );
			
			// We assume that if the template string is being passed directly
			// in the user doesn't want it cached. They can stick it in
			// jQuery.templates to cache it.

			var context = {
                data: data,
                index: 0,
                dataItem: data,
                options: options || {}
			};

			if ( jQuery.isArray( data ) ) {
				return jQuery.map( data, function( data, i ) {
                    context.index = i;
                    context.dataItem = data;
					return fn( jQuery, context );
				});

			} else {
				return fn( jQuery, context );
			}
		},
		
		// You can stick pre-built template functions here
		templates: {},

		/*
		 * For example, someone could do:
		 *   jQuery.templates.foo = jQuery.tmpl("some long templating string");
		 *   $("#test").append("foo", data);
		 */

		// Some easy-to-use pre-built functions
		// You can extend it with your own methods here (like $id, for example)
		tmplFn: {
			html: function() {
                // access to context: jQuery._.context === $context
				jQuery._.push.apply( jQuery._, arguments );
			},
			text: function() {
				jQuery._.push.apply( jQuery._, jQuery.map(arguments, function(str) {
					return document.createTextNode(str).nodeValue;
				}) );
			}
		},

		// A store for the templating string being built
		// NOTE: How will this work if we're doing a template in a template?
		_: null,
		
		tmpl: function tmpl(str, data, i, options) {
			// Generate a reusable function that will serve as a template
			// generator (and which will be cached).

			var fn = new Function("jQuery","$context",
				"var $=jQuery,$data=$context.dataItem,$i=$context.index,_=$._=[];_.context=$context;" +

				// Introduce the data as local variables using with(){}
				"with($.tmplFn){with($data){_.push('" +

				// Convert the template into pure JavaScript
				str.replace(/[\r\t\n]/g, " ")
                    // protect single quotes that are within expressions
                    // BUG: Fails to protect the first quote in: <%= foo + '%' %>
                    // No regex solution I can think of -- may require manual parsing
                    // using indexOf, etc (which may be just as fast?)
					.replace(/'(?=[^%]*%})/g,"\t")
					// escape other single quotes
					.split("'").join("\\'")
					// put back protected quotes
					.split("\t").join("'")
					// convert inline expressions into inline parameters
					.replace(/{%=(.+?)%}/g, "',($1),'")
					// convert start of code blocks into end of push()
					.split("{%").join("');")
					// and end of code blocks into start of push()
					.split("%}").join("_.push('")

				+ "');}}return $(_.join('')).get();");

			// Provide some basic currying to the user
			// TODO: When currying, the fact that only the dataItem and index are passed
			// in means we cannot know the value of 'data' although we know 'dataItem' and 'index'
			// Ok? Or, if this api took the array and index, we could know all 3 values.
			// e.g. instead of this:
			//  tmpl(tmpl, foo[i], i)
			// this:
			//  tmpl(tmpl, foo, i)
			// If you intend data to be as is,
			//  tmpl(tmpl, foo) or tmpl(tmpl, foo, null, options)
			return data ? fn( jQuery, { data: null, dataItem: data, index: i, options: options } ) : fn;
		}
	});
})(jQuery);
