A jQuery templating plugin.
____________________________________________________________________

	// Render one LI, filled with data, then append it into the UL

	$.tmpl( "<li>${firstName}</li>", dataObject )
		.appendTo( "ul" );
____________________________________________________________________

	<!-- Declare a template as a script block of type "text/html" -->

	<script id="sometmpl" type="text/html">
		<li>${firstName}</li>
	</script>
____________________________________________________________________

	// Render the declared template as one LI appended to the target UL

	$( "#sometmpl" )
		.tmpl( dataObject )
		.appendTo( "ul" );
____________________________________________________________________

	// Render the declared template as multiple LIs appended to the target UL
	// Provide a click event accessing the data

	$( "#sometmpl" )
		.tmpl( arrayOfDataObjects )
		.appendTo( "ul" )
		.click( function() {
			alert( $.tmpl(this).data.firstName );
		});
____________________________________________________________________

	// Store a string as a compiled template for later use
	$.templates( "myTmpl", "<span>${firstName}</span>" );

	// Render stored template and insert after target. 
	$.tmpl( "myTmpl", dataObject )
		.insertAfter( "#target" );

____________________________________________________________________

