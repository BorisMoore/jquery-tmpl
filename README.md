A jQuery templating plugin - created for demonstration purposes.

    $("#sometmpl")
	    .render( dataObject ) // Returns a LI with all the data filled in
	    .appendTo("ul");
    
    $("#sometmpl")
	    .render( arrayOfDataObjects ) // Returns two LIs with data filled in
	    .appendTo("ul");
    
    // Appends one LI, filled with data, into the UL
    $("ul").append( tmpl, dataObject );
    
    // Appends two LIs, filled with data, into the UL
    $("ul").append( tmpl, arrayOfDataObjects );
