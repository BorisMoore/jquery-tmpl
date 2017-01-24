var testData = {
		one: "first",
		two: "second",
		v: "test",
		arr: ["AA","BB","CC"],
		dict: {"leovinus":"this","scraliontis":"that","brobostigon":"other"},
		fun: function () {
			return 'RETURNED';
		},
		html: '<a>'
};

var R = function ( tmpl, data ) {
	try {
		return jQuery.tmpl( tmpl, data ).text();
	}
	catch ( e ) {
		if ( typeof e === 'string' ) {
			return 'ERROR: ' + e;
		}
		return e;
	}
};

function test_handler( test_name, res, exp ) {
	var is_err = ($.isFunction(exp) && exp.prototype instanceof Error);
	if ( is_err && res instanceof exp ) {
		ok( res instanceof exp, test_name );
	}
	else {
		same( res, exp, test_name );
	}
}

// these are used throughout to test if tag blocks suppress them
jQuery.tmpl.tag.syntax_error = { open: "throw SyntaxError('test syntax error');" };
jQuery.tmpl.tag.reference_error = { open: "throw ReferenceError('test reference error');" };
jQuery.tmpl.tag.type_error = { open: "throw TypeError('test type error');" };

module("Basics");


	test("Basic Function", function() {
		test_handler( 'plain text passes through untouched', R('lorem ipsum', testData), 'lorem ipsum' );
		// TODO fixme
		//test_handler( 'whitespace is left untouched', R('\n\tlorem\n\n\tipsum \t', testData), '\n\tlorem\n\n\tipsum \t' );
		test_handler( 'simple variable output', R("${ one }", testData), "first" );

		// throw errors with incomplete syntax
		test_handler( 'multi word variable tag', R("${ a b c }}"), SyntaxError );
		test_handler( "_ (underscore) cannot by used by data", R('${ _ }', {'_':'foo'}), TypeError );
		test_handler( "$ cannot be used by data", R('${ $ }', {'$':'foo'}), TypeError );

	});

	// test errors are passed back correctly
	test("Error Passing", function(){
		test_handler( 'syntax', R("{{syntax_error }}", testData), SyntaxError );
		test_handler( 'reference', R("{{reference_error }}", testData), ReferenceError );
		test_handler( 'type', R("{{type_error }}", testData), TypeError );
	});

	// newlines should work because: ${ foo + "\n" } and they have whitespace management benefits
	test("Newlines / Escaping", function(){
		test_handler( "newlines do not kill tags", R('${\n \none\n }', testData), 'first');
		// TODO fixme
		//test_handler( "newlines in strings don't kill tags", R('${ "on\ne" }', testData), 'on\ne' );
		//test_handler( "returns do not kill tags", R('${\r \r\none\r\n }', testData), 'first');
		//test_handler( "returns in strings don't kill tags", R('${ "on\re" }', testData), 'on\re' );
		//test_handler( "slashes in strings don't kill tags", R('${ "on\\e" }', testData), 'on\\e');
		//test_handler( "newlines don't kill parsing", R('a\nb\nc${ 8 }.'), 'a\nb\nc8.');
	});

	test("Empty Tag", function() {
		// TODO fixme
		//test_handler( 'default', R("{{}}", testData), '{{}}' );
		//test_handler( 'with whitespace', R("{{ }}"), '{{ }}' );
		//test_handler( 'with tabs whitespace', R("{{\t\t}}"), '{{\t\t}}' );
	});

	test("Incorrect Nesting", function() {
		test_handler( 'default', R("{{if 1}}{{if 1}}{{/if}}", testData), SyntaxError );
		test_handler( 'extra /if', R("{{if 1}}{{/if}}{{/if}}", testData), SyntaxError );
		test_handler( 'but terminated', R("{{if 1}}{{each arr}}{{/if}}{{/each}}", testData), SyntaxError );
	});

	test("Ignore Malformed Tags", function() {
		test_handler( 'a {{one } b', R("a {{one } b", testData), 'a {{one } b' );
		test_handler( 'first} {{second }', R("${ one }} {{two }", testData), 'first} {{two }' );
		test_handler( '{{one }', R('{{one }', testData), '{{one }' );
	});

	// reserved words
	test("Reserved Words", function(){
		// TODO fixme
		//test_handler( "Disallow new operator", R('${ new Object() }',{}), SyntaxError );
		//test_handler( "Disallow delete operator", R('${ delete a }',{a:1}), SyntaxError );
		test_handler( "Disallow function operator", R('${ function(){} }',{}), SyntaxError );
		test_handler( "Disallow return", R('${ return a }',{a:1}), SyntaxError );
		test_handler( "Disallow for", R('${ for a }',{a:1}), SyntaxError );
		test_handler( "Disallow do/while", R('${ do{ a }while(a) }',{a:1}), SyntaxError );
		test_handler( "Disallow if", R('${ if a }',{a:1}), SyntaxError );
		test_handler( "Disallow try/catch", R('${ try{b.s}catch(e){} }',{a:1}), SyntaxError );
		test_handler( "Disallow return keyword", R('${ return a }',{a:1}), SyntaxError );
		test_handler( "Disallow with keyword", R('${ with (s) }',{a:1}), SyntaxError );
		test_handler( "Disallow throw keyword", R('${ throw "foo" }',{a:1}), SyntaxError );
	});

	// these tests are a bit awkward because caching is done in $.render, not $.tmpl
	test("Caching via $.template() and .template()", function() {
		$.template('nametmpl', '<span>name: ${ v }</span>' );
		test_handler( "using a named template", $.tmpl('nametmpl', testData).text(), 'name: test' );

		var $elm = $( "<span>name: ${ v }</span>" );
		$elm.template('nametmpl2');
		test_handler( "using a named template created from a node", $.tmpl('nametmpl2', testData).text(), 'name: test' );
	});

	test("Bracketed Accessors", function(){
		test_handler( "foo[\"bar\"]", R('${ foo["bar"] }',{foo:{bar:'baz'}}), 'baz' );
		test_handler( "foo['bar']", R("${ foo['bar'] }",{foo:{bar:'baz'}}), 'baz' );
	});

	test("Escaping", function(){
		// TODO fixme
		//test_handler( 'echoing escapes html', R("${ 'foo<div>bar</div>baz' }"), 'foo&lt;div&gt;bar&lt;/div&gt;baz' );
		//test_handler( 'echoing escapes html (lookup)', R("${ r }", {r:'foo<div>bar</div>baz'}), 'foo&lt;div&gt;bar&lt;/div&gt;baz' );
		//test_handler( 'echoing escapes ampersands 1', R("${ '&' }"), '&amp;' );
		//test_handler( 'echoing escapes ampersands 2', R("${ '&amp;' }"), '&amp;amp;' );
		//test_handler( 'echoing escapes & < >', R("${ '-<&>-<&>-' }"), '-&lt;&amp;&gt;-&lt;&amp;&gt;-' );
	});

	test("Comments", function() {
		test_handler( "comments are removed", R('A{{! comments test }}B', testData), "AB" );
		test_handler( "comments are removed (2)", R('{{! inky }}foo{{! blinky }}', testData), 'foo' );
		// TODO fixme
		return;
		test_handler( "comments may include string of comments", R('A{{! comments "}}" test }}B', testData), "AB" );
		test_handler( "comments cannot nest other comments", R('A{# C{# E #}D #}B', testData), "AD #}B" );
		test_handler( "comments may include strings with escapes (double)", R('A{# comments "str\"ing" test #}B', testData), "AB" );
		test_handler( "comments may include strings with escapes (single)", R("A{# comments 'str\'ing' test #}B", testData), "AB" );
		test_handler( "comments may include tags", R("A{# {{= v }} #}B", testData), "AB" );
		test_handler( "comments may span lines", R("A{# \ncomments test\n #}B", testData), "AB" );

		test_handler( "comments may contain invalid content (invalid tag)", R('1{{! {{ INVALID_TAG }} }}2', testData), '12' );
		test_handler( "comments may contain invalid content (stray end tag)", R('1{{! {{/if}} }}2', testData), '12' );
		test_handler( "comments may contain invalid content (stray else)", R('1{{! {{else}} }}2', testData), '12' );
		test_handler( "comments may contain invalid content (invalid javascript)", R('1{{! {{if ...}} }}2', testData), '12' );

	});

	test("Variables", function() {

		test_handler( "variable replacement", R('${ one }', testData), "first" );
		test_handler( "many variables work", R('${ one }/${ two }', testData), "first/second" );
		test_handler( "alternative variable syntax", R('${ one }', testData), "first" );
		test_handler( "many variables work with alt syntax", R('${ one }/${ two }', testData), "first/second" );

		test_handler( "basic string output (double)", R('${ "string" }', testData), "string" );
		test_handler( "basic string output (single)", R("${ 'string' }", testData), "string" );
		test_handler( "string quote escapes (double)", R('${ "str\\"i\\"ng" }', testData), 'str"i"ng' );
		test_handler( "string quote escapes (single)", R("${ 'str\\'i\\'ng' }", testData), "str'i'ng" );

		// TODO fixme
		//test_handler( "string output with tag", R('${ "\\{\\{ tag \\}\\}" }', testData), "{{ tag }}" );
		//test_handler( "string output with end of tag", R('${ "\\}\\}" }', testData), "}}" );

		test_handler( 'empty variable tag (with tabs whitespace)', R("{{=\t\t}}", "self"), 'self' );
		test_handler( 'empty variable tag', R("{{= }}", "self"), 'self' );
		test_handler( 'empty variable tag (with space)', R("{{=}}", "self"), 'self' );

		test_handler( "variable lookup error suppression", R('${ is_undefined }', testData), '' );
		// TODO fixme
		//test_handler( "variable lookup error suppression (with member)", R('${ is_undefined.member }', testData), '' );

		test_handler( "variable and text (1)", R('A${ one }', testData), 'Afirst' );
		test_handler( "variable and text (2)", R('${ one }B', testData), 'firstB' );
		test_handler( "variable and text (3)", R('A${ one }B', testData), 'AfirstB' );

		test_handler( "lookups work for submembers", R('${ a.b.c }', {a:{b:{c:"abc"}}}), 'abc' );
		test_handler( "error suppression works for submembers", R('${ a.b.c }', {a:{b:{c:"abc"}}}), 'abc' );

		test_handler( "functions can be called with in tags", R('${ foo() }', { foo:function(s){ return "bar"; }}), 'bar' );
		test_handler( "functions pass strings correctly", R('${ foo("bar") }', { foo:function(s){ return s; }}), 'bar' );
		test_handler( "functions pass arguments correctly", R('${ foo(bar) }', { foo:function(s){ return s; }, 'bar':'baz'}), 'baz' );

		var cls = {
			toString:function () {return 'S';},
			toValue:function () {return 'V';}
		}
		test_handler( 'variables use toString, not toValue', R("${ foo }",{foo:cls}), 'S' );

		test_handler( 'comma passes variables correctly', R("${ dot,dot,comma,dash }",{dot:'.','comma':',','dash':'-'}), '-' );

		// TODO fixme
		// @borgar says: I don't like this: it should use foo() to be consistant with foo().bar()
		test_handler( 'variable gets called if it is callable', R("${ fun }", testData), 'RETURNED' );
		test_handler( 'last variable in sequence gets called if it is callable', R("${ obj.fun }",{obj: testData}), 'RETURNED' );

		var cls = {
			foo: function () {
				return { bar: function () {return 'BAZ'; } };
			}
		}
		test_handler( 'member functions in a sequence don\'t get called', R("${ foo.bar }", cls), '' );

	});

	test("Falsy Values", function(){
		test_handler( "(0)", R('${ 0 }'), '0' );
		test_handler( "(false)", R('${ false }'), 'false' );
		test_handler( "(null)", R('${ zero }'), '' );	 // it's debatable what we want here
		test_handler( "(undefined)", R('${ undefined }'), '' );
		test_handler( "(\"\")", R('${ "" }'), '' );
		test_handler( "('')", R("${ '' }"), '' );
	});

	test("Falsy Lookups", function(){
		test_handler( "(false)", R('${ zero }', {zero: 0}), '0' );
		test_handler( "(false)", R('${ zero }', {zero: false}), 'false' );
		test_handler( "(null)", R('${ zero }', {zero: null}), '' ); // it's debatable what we want here
		test_handler( "(undefined)", R('${ zero }', {zero: undefined}), '' );
		test_handler( "('')", R('${ zero }', {zero: ""}), '' );
	 });

	test("Javascript Operations", function(){
		test_handler( "string concatination", R('${ one + "foo" }', testData), "firstfoo" );
		test_handler( "adding", R('${ 1 + 5 }', testData), "6" );
		test_handler( "subtracting", R('${ 9 - 5 }', testData), "4" );
		test_handler( "modulo", R('${ 5 % 2 }', testData), "1" );
		test_handler( "unary minus", R('${ -n }',{n:10}), "-10" );
		test_handler( "unary plus", R('${ +n }',{n:"10"}), "10" );

		test_handler( "in operator", R('${ "bar" in foo }',{foo:{bar:'baz'}}), "true" );
		test_handler( "instanceof operator", R('${ foo instanceof Date }',{foo:new Date()}), "true" );
		test_handler( "typeof operator", R('${ typeof "str" }',{}), "string" );

		test_handler( "bitwise AND", R('${ n & 1 }',{n:5}), "1" );
		test_handler( "bitwise OR", R('${ n | 1 }',{n:4}), "5" );
		test_handler( "bitwise XOR", R('${ n ^ 1 }',{n:5}), "4" );
		test_handler( "bitwise NOT", R('${ ~n }',{n:5}), "-6" );
		test_handler( "left shift", R('${ n << 1 }',{n:5}), "10" );
		test_handler( "right shift", R('${ n >> 1 }',{n:5}), "2" );
		test_handler( "zero-fill right shift", R('${ n >>> 1 }',{n:5}), "2" );

		test_handler( "comparing ==", R('${ 1 == 5 }', testData), "false" );
		test_handler( "comparing !=", R('${ 1 != 5 }', testData), "true" );
		test_handler( "comparing ===", R('${ 5 === 5 }', testData), "true" );
		test_handler( "comparing !==", R('${ 5 !== 5 }', testData), "false" );
		test_handler( "comparing >=", R('${ 1 >= 5 }', testData), "false" );
		test_handler( "comparing >", R('${ 1 > 5 }', testData), "false" );
		test_handler( "comparing <=", R('${ 1 <= 5 }', testData), "true" );
		test_handler( "comparing <", R('${ 1 < 5 }', testData), "true" );
		test_handler( "Logical OR", R('${ zero || "FALSY" }',{ zero: 0 }), "FALSY" );
		test_handler( "Logical AND", R('${ zero && "TRUEY" }',{ zero: 1 }), "TRUEY" );
		test_handler( "Conditional Operator", R('${ zero ? "zero" : "other" }',{ zero: 1 }), "zero" );
		test_handler( "Unary logical NOT", R('${ !zero }',{ zero: 1 }), "false" );

		test_handler( "Single-Quoted Strings", R("${ 'test' }",{}), "test" );
		test_handler( "Single-Quoted Comparison", R("${ 'test' == testvar }",{ testvar: 'test' }), "true" );
	});

	test("Disallowed / Illegal", function(){
		// TODO fixme
		/*
		test_handler( "Disallow incremental assignment", R('${ a += 1 }', {a:1}), SyntaxError );
		test_handler( "Disallow decremental assignment", R('${ a -= 1 }', {a:1}), SyntaxError );
		test_handler( "Disallow multiply assignment", R('${ a *= 1 }', {a:1}), SyntaxError );
		test_handler( "Disallow division assignment", R('${ a /= 1 }', {a:1}), SyntaxError );
		test_handler( "Disallow left shift assignment", R('${ a <<= 1 }', {a:1}), SyntaxError );
		test_handler( "Disallow right shift assignment", R('${ a >>= 1 }', {a:1}), SyntaxError );
		test_handler( "Disallow zero-fill right shift assignment", R('${ a >>>= 1 }', {a:1}), SyntaxError );
		test_handler( "Disallow bitwise AND assignment", R('${ a &= 1 }', {a:1}), SyntaxError );
		test_handler( "Disallow bitwise OR assignment", R('${ a |= 1 }', {a:1}), SyntaxError );
		test_handler( "Disallow bitwise XOR assignment", R('${ a ^= 1 }', {a:1}), SyntaxError );

		test_handler( "Disallow literal object creation", R('${ { a:"a"} }', {a:1}), SyntaxError );
		test_handler( "Disallow literal array creation", R('${ [1,2,3] }', {a:1}), SyntaxError );

		test_handler( "Disallow decrement", R('${ --a }',{a:1}), SyntaxError );
		test_handler( "Disallow assignments", R('${ (a = 2) }',{a:1}), SyntaxError );
		*/
	});

module("Commands");

	test("Create New Command", function(){
		$.getText = function ( str ) { return str.toUpperCase(); };
		$.tmpl.tag.trans = { open: "_.push($.getText($1));" };
		test_handler( "creating new command works", R('{{trans "translate" }}'), 'TRANSLATE' );
		$.tmpl.tag._ = $.tmpl.tag.trans;
		test_handler( "_ can by assigned a command", R('{{_ "translate" }}', {}), 'TRANSLATE' );
		delete $.getText;
		delete $.tmpl.tag.trans;
		delete $.tmpl.tag._;
	});

	test("Each {{ each }}", function() {

		test_handler( "loop", R('{{each arr}}${ $index }:${ this }/{{/each}}', testData), '0:AA/1:BB/2:CC/' );
		test_handler( "loop", R('{{each arr}}${ $index }:${ $value }/{{/each}}', testData), '0:AA/1:BB/2:CC/' );
		test_handler( "loop", R('{{each(i, item) arr}}${ i }:${ item }/{{/each }}', testData), '0:AA/1:BB/2:CC/' );
		test_handler( "loop", R('{{each arr}}${ $index }:${ this }/{{/each }}', testData), '0:AA/1:BB/2:CC/' );

		// TODO fixme
		//test_handler( "first", R('{{each dict}}${ $index }:{{if $first }}first{{else}}!first{{/if }}/{{/each }}', testData), 'leovinus:first/scraliontis:!first/brobostigon:!first/' );
		//test_handler( "first", R('{{each dict}}{{if !$first }}, {{/if }}${ $index }:${ this }}{{/each }}', testData), 'leovinus:this, scraliontis:that, brobostigon:other' );

		// TODO fixme
		//test_handler("html content", R('{{each arr}}<a>${ $index }</a>{{/each}}', testData), '<a>0</a><a>1</a><a>2</a>' );
		//test_handler("html content", R('{{each arr}}<a>${ this }</a>{{/each}}', testData), '<a>AA</a><a>BB</a><a>CC</a>' );
		//test_handler("html content", R('{{each this}}<a>${ data }</a>{{/each}}', [{data: 0}, {data: 1}, {data: 2}]), '<a>0</a><a>1</a><a>2</a>' );
		//test_handler("html content with newlines", R('{{each this}}\n<a>${ data }</a>\n{{/each}}', [{data: 0}, {data: 1}, {data: 2}]), '\n<a>0</a>\n\n<a>1</a>\n\n<a>2</a>\n' );

		test_handler( 'errors are passed back correctly (syntax)', R("{{each arr}}${ $i }{{syntax_error}}{{/each}}", testData), SyntaxError );
		test_handler( 'errors are passed back correctly (reference)', R("{{each arr}}${ $i }{{reference_error}}{{/each}}", testData), ReferenceError );
		test_handler( 'errors are passed back correctly (type)', R("{{each arr}}${ $i }{{type_error}}{{/each}}", testData), TypeError );

	});

	test("{{if}} and {{else}}", function() {
		test_handler( "if:true", R('{{if a}}TRUE{{else}}FALSE{{/if}}', { a:true }), 'TRUE' );
		test_handler( "if:false", R('{{if a}}TRUE{{else}}FALSE{{/if}}', { a:false }), 'FALSE' );
		test_handler( "if:null", R('{{if a}}TRUE{{else}}FALSE{{/if}}', { a:null }), 'FALSE' );
		test_handler( "if:undefined", R('{{if a}}TRUE{{else}}FALSE{{/if}}', { a:undefined }), 'FALSE' );
		test_handler( "if:[]", R('{{if a}}TRUE{{else}}FALSE{{/if}}', { a:{} }), 'TRUE' );
		test_handler( "if:{}", R('{{if a}}TRUE{{else}}FALSE{{/if}}', { a:[] }), 'TRUE' );
		test_handler( "if:''", R('{{if a}}TRUE{{else}}FALSE{{/if}}', { a:"" }), 'FALSE' );
		test_handler( "if:A", R('{{if a}}TRUE{{else}}FALSE{{/if}}', { a:"A" }), 'TRUE' );
		test_handler( "if:0", R('{{if a}}TRUE{{else}}FALSE{{/if}}', { a:0 }), 'FALSE' );
		test_handler( "if:1", R('{{if a}}TRUE{{else}}FALSE{{/if}}', { a:1 }), 'TRUE' );

		test_handler( "/if ignores following text", R('{{if a}}TRUE{{else}}FALSE{{/if a}}', { a:1 }), 'TRUE' );

		test_handler( 'errors are passed back correctly (syntax)', R("{{if true}}{{syntax_error}}{{/if}}", testData), SyntaxError );
		test_handler( 'errors are passed back correctly (reference)', R("{{if true}}{{reference_error}}{{/if}}", testData), ReferenceError );
		test_handler( 'errors are passed back correctly (type)', R("{{if true}}{{type_error}}{{/if}}", testData), TypeError );

	});

	test("{{tmpl() template}}", function() {

		jQuery.template('test', '${ "test text" }');
		test_handler( "simple include", R('{{tmpl "test"}}'), 'test text' );

		jQuery.template('test2', '{{each arr}}[${ $value }]-{{/each }}');
		test_handler( "data access", R('{{tmpl "test2"}}', testData), '[AA]-[BB]-[CC]-' );

		var nestedData = {foo: 'bar'};

		jQuery.template('nested', '{{tmpl "nested0"}}');
		jQuery.template('nested0', '${ foo }');

		test_handler( "nested - 1 level", R('{{tmpl "nested"}}', nestedData), 'bar' );

		jQuery.template('nested0', '{{tmpl "nested1"}}');
		jQuery.template('nested1', '{{tmpl "nested2"}}');
		jQuery.template('nested2', '${ foo }');

		test_handler( "nested - 2 levels", R('{{tmpl "nested" }}', nestedData), 'bar' );

		nestedData = {foo: {bar: {sweet: 1} } };
		jQuery.template('nested2', '${ foo.bar.sweet }');

		test_handler( "nested - 2 levels - complex data", R('{{tmpl "nested" }}', nestedData), '1' );

		// TODO fixme
		jQuery.template('test', '${ $index }');
		//test_handler( "{{each}} index variable", R('{{each arr}}{{tmpl "test" }}{{/each}}', testData), '012' );

		jQuery.template('test', '${ n }');
		//test_handler( "{{each}} index variable", R('{{each(n, item) arr}}{{tmpl "test"}}{{/each}}', testData), '012' );

		jQuery.template('test', '${ item }');
		//test_handler( "{{each}} item variable", R('{{each(n, item) arr}}{{tmpl "test" }}{{/each}}', testData), 'AABBCC' );
	});

	test("Html Output Unecoded {{html }}", function(){
		// TODO fixme
		//test_handler("encoded", R('{{= html}}', testData), '&lt;a&gt;');
		//test_handler("unencoded", R('{{html html}}', testData), '<a>');
	});

module("Script Tag Caching");

	test("Template Reuse", function(){
		var template = $('#reuse'),
			data = {data: 'pass1'};

		var pass1 = template.tmpl(data).html();
		data = {data: 'pass2'};
		var pass2 = template.tmpl(data).html();

		ok( "simple reuse test", pass1 == 'pass1' && pass2 == 'pass2' );
	});
