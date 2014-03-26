# jQuery Templates plugin vBeta1.0.0

_jQuery Templates is no longer in active development, and will be superseded by <a href="http://github.com/borismoore/jsrender">JsRender</a>. See vBeta1.0.0 tag for released beta version. Requires jQuery version 1.4.2._

----

_Note: This is the original official jQuery Templates plugin. The project was maintained by the jQuery team as an official jQuery plugin. Since the jQuery team has decided not to take this plugin past beta, it has been returned to the principal developer's GitHub account (Boris Moore). For more information on the history of jQuery Templates, and the roadmap going forward, see <a  href="http://www.borismoore.com/2011/10/jquery-templates-and-jsviews-roadmap.html">jQuery Templates and JsViews: The Roadmap</a>_

----

jQuery templates contain markup with binding expressions ('Template tags'). Templates are applied to data objects or arrays, and rendered into the HTML DOM

Note that documentation for the _jQuery Templates_ plugin is **no longer maintained on the jQuery documentation site**. 

An archive copy of the original documentation (previously at api.jquery.com/category/plugins/templates/) can be found [here] (http://web.archive.org/web/20120920065217/http://api.jquery.com/category/plugins/templates/).

See also [http://www.borismoore.com/2010/10/jquery-templates-is-now-official-jquery.html] (http://www.borismoore.com/2010/10/jquery-templates-is-now-official-jquery.html) for more background.

Live versions of demos from this repository can be found at [http://borismoore.github.io/jquery-tmpl/demos/step-by-step.html] (http://borismoore.github.io/jquery-tmpl/demos/step-by-step.html).

<p>The beta1 version of jQuery Templates is available on CDN at:
<ul>
<li><a href="http://ajax.microsoft.com/ajax/jquery.templates/beta1/jquery.tmpl.js">http://ajax.microsoft.com/ajax/jquery.templates/beta1/jquery.tmpl.js</a></li>
<li><a href="http://ajax.microsoft.com/ajax/jquery.templates/beta1/jquery.tmpl.min.js">http://ajax.microsoft.com/ajax/jquery.templates/beta1/jquery.tmpl.min.js</a></li>
</ul></p>

---

_The following is a restoration of jQuery's official documentation on tmpl() as it was on 12/28/2012. jQuery is Copyright 2012, John Resig_


[Source](http://web.archive.org/web/20121014080309/http://api.jquery.com/jquery.tmpl/ "Permalink to jQuery.tmpl() � jQuery API")

# jQuery.tmpl( template \[, data\] \[, options\] ) Returns: jQuery   

## Description:
**Render the specified HTML content as a template, using the specified data.**   version added: 1.4.3
	jQuery.tmpl( template \[, data\] \[, options\] )
	
**template** The HTML markup or text to use as a template.

**data** The data to render. This can be any JavaScript type, including Array or Object.

**options** An optional map of user-defined key-value pairs. Extends the `tmplItem` data structure, available to the template during rendering. 

This documentation topic concerns the *jQuery Templates* plugin (jquery-tmpl), which can be downloaded from: http://github.com/jquery/jquery-tmpl.  

The `jQuery.tmpl()` method is designed for chaining with `.appendTo`, `.prependTo`, `.insertAfter` or `.insertBefore` as in the following example.

### Example:
```JavaScript
    $.tmpl( "<li>${Name}</li>", { "Name" : "John Doe" }).appendTo( "#target" );
```
The `template` parameter can be any of the following: 

*   A string containing markup.
*   An HTML element (or jQuery object that wraps an element) whose content is to be used as the template.
*   A string corresponding to the name of a named template (see jQuery.template() and .template()).
*   A compiled-template function (see jQuery.template() and .template()).

If `data` is an array, the template is rendered once for each data item in the array. If `data` is an object, or if the `data` parameter is missing or null, a single template item is rendered. 

The return value is a jQuery collection of elements made up of the rendered template items (one for each data item in the array). If the template contains only one top-level element, then there will be one element for each data item in the array. 

To insert the rendered template items into the HTML DOM, the returned jQuery collection should not be inserted directly into the DOM, but should be chained with `.appendTo`, `.prependTo`, `.insertAfter` or `.insertBefore`, as in following example: 
```JavaScript
    $.tmpl( myTemplate, myData ).appendTo( "#target" );
```
See also .tmpl().

### Example 
The following example shows how to use `jQuery.tmpl()` to render local data, using a template provided as a string: 
```JavaScript
      var movies = [
		  { Name: "The Red Violin", ReleaseYear: "1998" },
		  { Name: "Eyes Wide Shut", ReleaseYear: "1999" },
		  { Name: "The Inheritance", ReleaseYear: "1976" }
		];
    
      var markup = "<li><b>${Name}</b> (${ReleaseYear})</li>";

	  // Compile the markup as a named template
	  $.template( "movieTemplate", markup );

	  // Render the template with the movies data and insert
	  // the rendered HTML under the "movieList" element
	  $.tmpl( "movieTemplate", movies )
		  .appendTo( "#movieList" );
```
## Using Remote Data 
Typically the data is not local and is instead obtained using an Ajax request to a remote service or page, as in the following example: 
```JavaScript
    var markup = "<li><b>${Name}</b> (${ReleaseYear})</li>";

	// Compile the markup as a named template
	$.template( "movieTemplate", markup );

	$.ajax({
	  dataType: "jsonp",
	  url: moviesServiceUrl,
	  jsonp: "$callback",
	  success: showMovies
	});

	// Within the callback, use .tmpl() to render the data.
	function showMovies( data ) {
	  // Render the template with the "movies" data and insert
	  // the rendered HTML under the 'movieList' element
	  $.tmpl( "movieTemplate", data )
		.appendTo( "#movieList" );
	}
```
## The Markup for the Template  
You can get the markup for the template from inline markup in the page, or from a string (possibly computed, or obtained remotely). For an example of how to use inline markup, see .tmpl().

## Caching the Template 
When a template is rendered, the markup is first converted into a compiled-template function. Every time `$.tmpl( markup , myData ).appendTo( "#target" )` is called, the template is recompiled. If the same template is to be used more than once for rendering data, you should ensure that the compiled template is cached. To cache the template when using markup that is obtained from a string (rather than from inline markup in the page), use `$.template( name, markup )` to create a named template for reuse. See jQuery.template().

## Template Tags, Expressions, and Template Variables 
Template tags such as the `${}` tag can used within jQuery templates in addition to text and HTML markup to enable a number of scenarios such as composition of templates, iteration over hierarchical data, parameterization of template rendering, etc. Template tags can render content based on the values of data item fields or template variables such as `$item` (corresponding to the template item), as well as expressions and function calls. See the documentation topics for each template tag: ${}, {{each}}, {{if}}, {{else}}, {{html}}, {{tmpl}} and {{wrap}}.

## The `options` Parameter, and Template Items 
Each template item (the result of rendering a data item with the template) is associated with a `tmplItem` data structure, which can be accessed using jQuery.tmplItem() and .tmplItem(), or the `$item` template variable. Any fields or anonomyous methods passed in with the `options` parameter of `jQuery.tmpl()` will extend the `tmplItem` data structure, and so be available to the template as in the following example: 
```JavaScript
    var markup = "<li>Some content: ${$item.myMethod()}.<br/>" 
           + " More content: ${$item.myValue}.</li>";

	// Compile the markup as a named template
	$.template( "movieTemplate", markup );

	// Render the template with the movies data
	$.tmpl( "movieTemplate", movies,
	  { 
		  myValue: "somevalue", 
		  myMethod: function() { 
			  return "something";
		  } 
	  } 
	).appendTo( "#movieList" );
```
## Examples:

### Example: Render local data using jQuery.tmpl().
```html
	<!DOCTYPE html>
	<html>
	<head>
	  <script src="http://code.jquery.com/jquery-latest.min.js"></script>
	  <script src="http://ajax.microsoft.com/ajax/jquery.templates/beta1/jquery.tmpl.min.js"></script>
	</head>
	<body>
	  
	<ul id="movieList"></ul>

	<script>
	  var movies = [
	  { Name: "The Red Violin", ReleaseYear: "1998" },
	  { Name: "Eyes Wide Shut", ReleaseYear: "1999" },
	  { Name: "The Inheritance", ReleaseYear: "1976" }
	  ];

	var markup = "<li><b>${Name}</b> (${ReleaseYear})</li>";

	/* Compile the markup as a named template */
	$.template( "movieTemplate", markup );

	/* Render the template with the movies data and insert
	   the rendered HTML under the "movieList" element */
	$.tmpl( "movieTemplate", movies )
	  .appendTo( "#movieList" );
	</script>

	</body>
	</html>
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
