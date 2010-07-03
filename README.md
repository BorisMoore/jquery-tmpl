A jQuery templating plugin - created for demonstration purposes.
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

A demo page using this plugin can be found here:
http://infinity88.com/jquery-tmpl/movies/movies.htm 