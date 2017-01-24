# jQuery Templates plugin
===========

_jQuery Templates is no longer in active development, and will be superseded by <a href="http://github.com/borismoore/jsrender">JsRender</a>. See vBeta1.0.0 tag for released beta version. Requires jQuery version 1.4.2._

----

_Note: This is the original official jQuery Templates plugin. The project was maintained by the jQuery team as an official jQuery plugin. Since the jQuery team has decided not to take this plugin past beta, it has been returned to the principal developer's GitHub account (Boris Moore). For more information on the history of jQuery Templates, and the roadmap going forward, see <a  href="http://www.borismoore.com/2011/10/jquery-templates-and-jsviews-roadmap.html">jQuery Templates and JsViews: The Roadmap</a>_

----

jQuery templates contain markup with binding expressions ('Template tags'). Templates are applied to data objects or arrays, and rendered into the HTML DOM

Note that documentation for the _jQuery Templates_ plugin is **no longer maintained on the jQuery documentation site**. 

An archive copy of the original documentation (previously at api.jquery.com/category/plugins/templates/) can be found [here] (http://web.archive.org/web/20120920065217/http://api.jquery.com/category/plugins/templates/).

See also [http://www.borismoore.com/2010/10/jquery-templates-is-now-official-jquery.html] (http://www.borismoore.com/2010/10/jquery-templates-is-now-official-jquery.html) for more background.

Live versions of demos from this repository can be found at [http://borismoore.github.io/jquery-tmpl/demos/step-by-step.html] (http://borismoore.github.io/jquery-tmpl/demos/step-by-step.html).

<p>
  <a href="https://gitter.im/miamarti/jquery-tmpl?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge" target="_blank"><img src="https://badges.gitter.im/Join%20Chat.svg"></a>
  <a href="http://waffle.io/miamarti/jquery-tmpl"><img alt='Stories in Ready' src='https://badge.waffle.io/miamarti/jquery-tmpl.svg?label=ready&title=Ready' height="21" /></a>
</p>

<h3>CKEditor values</h3>
CKEditor is an Open source application, which means it can be modified any way you want. It benefits from an active community that is constantly evolving the application with free add-ons and a transparent development process.

<h3>Dependencies</h3>
Download make the dependencies of jQuery and include in your project
* https://jquery.com/

<h3>Implementation</h3>
```JavaScript
    $.tmpl( "<li>${Name}</li>", { "Name" : "John Doe" }).appendTo( "#target" );
```


### Example: Render data from a remote service, using jQuery.tmpl().
```html
	<!DOCTYPE html>
	<html>
	<head>
	  <script src="http://code.jquery.com/jquery-latest.min.js"></script>
	  <script src="http://ajax.microsoft.com/ajax/jquery.templates/beta1/jquery.tmpl.min.js"></script>
	</head>
	<body>
	  
	<button id="cartoonsBtn">Cartoons</button>
	<button id="dramaBtn">Drama</button>

	<ul id="movieList"></ul>

	<script>
	var markup = "<li><b>${Name}</b> (${ReleaseYear})</li>";

	/* Compile the markup as a named template */
	$.template( "movieTemplate", markup );

	function getMovies( genre, skip, top ) {
	  $.ajax({
		dataType: "jsonp",
		url: "http://odata.netflix.com/Catalog/Genres('" + genre
		+ "')/Titles?$format=json&$skip="
		+ skip + "&$top=" + top,
		jsonp: "$callback",
		success: function( data ) {
		  /* Get the movies array from the data */
		  var movies = data.d;

		  /* Remove current set of movie template items */
		  $( "#movieList" ).empty();

		  /* Render the template items for each movie
		  and insert the template items into the "movieList" */
		  $.tmpl( "movieTemplate", movies )
		  .appendTo( "#movieList" );
		}
	  });
	}

	$( "#cartoonsBtn" ).click( function() {
	  getMovies( "Cartoons", 0, 6 );
	});

	$( "#dramaBtn" ).click( function() {
	  getMovies( "Drama", 0, 6 );
	});

	</script>

	</body>
	</html>
```

## Bower install de dependency
```
$ bower install jquery.tmpl --save
```

## Metrics

[![Throughput Graph](https://graphs.waffle.io/miamarti/jquery-tmpl/throughput.svg)](https://waffle.io/miamarti/jquery-tmpl/metrics/throughput)

