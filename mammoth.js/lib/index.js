var _ = require("underscore");

var docxReader = require("./docx/docx-reader");
var docxStyleMap = require("./docx/style-map");
var DocumentConverter = require("./document-to-html").DocumentConverter;
var readStyle = require("./style-reader").readStyle;
var readOptions = require("./options-reader").readOptions;
var unzip = require("./unzip");
var Result = require("./results").Result;

exports.convertToHtml = convertToHtml;
exports.convertToMarkdown = convertToMarkdown;
exports.convert = convert;
exports.extractRawText = extractRawText;
exports.images = require("./images");
exports.transforms = require("./transforms");
exports.underline = require("./underline");
exports.embedStyleMap = embedStyleMap;
exports.readEmbeddedStyleMap = readEmbeddedStyleMap;


exports.converToGutenberge = converToGutenberge;

function isPresent( input, stringToTest ) {
    if( RegExp(stringToTest).test(input)) {
        console.log('Warning: This file contains following str *** ', stringToTest);
  
    }
}
function testStringsToReplace(output) {

    isPresent(output, "The Business Professional's Course");
    isPresent(output, "Aji Space");
    isPresent(output, "@theajinetwork.com");
    isPresent(output, "Aji Source");
}

function converToGutenberge(input, options) {
     return unzip.openZip(input)
        .then(docxReader.read)
        .then(function(documentResult) {
            return convertElementToBlocks(documentResult.value)
           
        });
}

// indent: { start: '709', end: null, firstLine: null, hanging: '0' }
function enclose(element, startTag, endTag) {

    //console.log('inside enclose');
    var output = startTag;
    output = output + element.children.map(convertElementToBlocks); 
    output = output + endTag;
    return output;
}

function isHash( output) {
    if ( output.startsWith("#") || 
            output.startsWith("<em>#") ||
                 output.startsWith("<strong>#") || 
                 output.startsWith("<strong><em>#"))

        return true;
    else
        return false;
}

function isHang( output ) {
    var numberedListRegEx = new RegExp("(^\\d+\\.)|(^<em>\\d+\\.)|(^<strong>\\d+\\.)|(^<strong><em>\\d+\\.)");

    if( output.startsWith("…") || 
        output.startsWith("<em>…") || 
        output.startsWith("<strong>…") || 
        output.startsWith("<strong><em>…") || 

        output.startsWith("*") || 
        output.startsWith("<em>*") || 
        output.startsWith("<strong>*") || 
        output.startsWith("<strong><em>*") || 

        output.startsWith('e.g.') || 
        output.startsWith('<em>e.g.') || 
        output.startsWith('<strong>e.g.') || 
        output.startsWith('<strong><em>e.g.') || 

        (numberedListRegEx.test(output))) // Test for numbered List
        return true;
    else
        return false;

}
var doubleLine = '<!-- wp:block {"ref":921} /-->\n';
var singleLine = '<!-- wp:block {"ref":920} /-->\n';
// <!-- wp:paragraph {"align":"center"} -->
// <p class="has-text-align-center"><em>Relevance in Three Moves</em></p>
// <!-- /wp:paragraph -->'

// <!-- wp:paragraph {"align":"center","className":"indent"} -->
// <p class="has-text-align-center indent">Foobar</p>
// <!-- /wp:paragraph -->

// WP-Heading
// <!-- wp:heading {"align":"center","level":4} -->
// <h4 class="has-text-align-center">Relevance in Three Moves</h4>
// <!-- /wp:heading -->
// styleId: "DocumentTitle"
// styleName: "Document Title"
// styleName "Heading 2"
// styleName "Pull Quote"
var newLines = 0; 
function convertElementToBlocks(element) {
    //return 'Foo';
    

    switch ( element.type) {
        case "paragraph": {
            var className = [];
            var paraString = [];

            output =  element.children.map(convertElementToBlocks).join('');
            if ( output.trim().length === 0 ){

                newLines++;
                return '';
            }

            // See the style

            if( (element.styleName === "Document Title") ||  
            ((element.styleName === "Heading 2") && (element.alignment === "center"))) {
                output =  '<!-- wp:heading {"align":"center","level":4} -->\n' + 
                            '<h4 class="has-text-align-center">' + 
                            output + '</h4>' + '\n' + 
                            '<!-- /wp:heading -->\n' + 
                            "\n";

                // Heading needs no further processing.
                if (newLines > 2) {
                    newLines = 0;
                    return doubleLine + '\n' + output; 
                } 
    
                if( newLines === 2) {
                    newLines = 0;
                    return  singleLine + '\n' + output;
                } 
                newLines = 0;
                return output; 
            }

            if (element.styleName === "Heading 2") { 
                output = '<!-- wp:heading {"level":4} -->\n' + 
                             '<h4>' + output + '</h4>\n' +
                            '<!-- /wp:heading -->\n' +
                            '\n';
                if (newLines > 2) {
                    newLines = 0;
                    return doubleLine + '\n' + output; 
                } 
    
                if( newLines === 2) {
                    newLines = 0;
                    return  singleLine + '\n' + output;
                } 
                newLines = 0;
                return output;
            }

            if( element.styleName === "Pull Quote" ) { 
                output = '<em>' + output + '</em>';
            }
            let indent = element.indent.start  ? element.indent.start: 0;

            const hanging = element.indent.hanging ? element.indent.hanging: 0;
            const firstLine =  element.indent.firstLine? element.indent.firstLine: 0;

            if( hanging > 0 ){
                indent = indent - hanging;
            } else if ( firstLine >0 ) {
                indent = indent + firstLine;
            }
            
            //console.log(' Element Indent ', element.indent.start  ? element.indent.start: '0');

        
           if( element.alignment === "center") { 
                className.push("has-text-align-center");
                paraString.push( '"align":"center"');
                
            } 
           
            if ( isHang(output)) {
                if (indent >= 1800 ) {
                className.push("hang5");
                paraString.push( '"className":"hang5"');
                } else if ( indent >= 1440){
                    className.push("hang4");
                    paraString.push( '"className":"hang4"');
                } else if (indent >= 1080) {
                    className.push("hang3");
                    paraString.push( '"className":"hang3"');
                } else if ( indent >= 720 ) {
                    className.push("hang2");
                    paraString.push( '"className":"hang2"');
                } else if ( indent >= 360) {
                    className.push("hang");
                    paraString.push( '"className":"hang"');
                } else {
                    className.push("hang0");
                    paraString.push( '"className":"hang0"');
                }

            } else
            if ( isHash(output)) {
                if (indent >= 1800 ) {
                    className.push("hash6");
                    paraString.push( '"className":"hash6"');
                    } else if ( indent >= 1440){
                        className.push("hash5");
                        paraString.push( '"className":"hash5"');
                    } else if (indent >= 1080) {
                        className.push("hash4");
                        paraString.push( '"className":"hash4"');
                    } else if ( indent >= 720 ) {
                        className.push("hash3");
                        paraString.push( '"className":"hash3"');
                    } else if ( indent >= 360) {
                        className.push("hash2");
                        paraString.push( '"className":"hash2"');
                    } else 
                        {
                            className.push("hash");
                            paraString.push( '"className":"hash"'); 
                    }
               

            } else {
                if (indent >= 1800 ) {
                    className.push("indent5");
                    paraString.push( '"className":"indent5"');
                    } else if ( indent >= 1440){
                        className.push("indent4");
                        paraString.push( '"className":"indent4"');
                    } else if (indent >= 1080) {
                        className.push("indent3");
                        paraString.push( '"className":"indent3"');
                    } else if ( indent >= 720 ) {
                        className.push("indent2");
                        paraString.push( '"className":"indent2"');
                    } else if ( indent >= 360) {
                        className.push("indent");
                        paraString.push( '"className":"indent"');
                    } 
            }
            

            if ( className.length >0 ) {
                output =  "<!-- wp:paragraph " + "{" + paraString.join(',') + "}" + " -->" + "\n" + 
                    '<p class="' + className.join(' ') + '">' + output  + '</p>' + '\n' +
                "<!-- /wp:paragraph -->\n" +
                "\n";
            } else {
                output = "<!-- wp:paragraph -->" + "\n" + 
                '<p>' + output  + '</p>' + '\n' +
                "<!-- /wp:paragraph -->\n" +
                "\n";
            }


            
            if (newLines > 2) {
                newLines = 0;
                return doubleLine + '\n' + output; 
            } 

            if( newLines === 2) {
                newLines = 0;
                return  singleLine + '\n' + output;
            } 
            newLines = 0;

            return output;
        }
        case "run": {
            var run = element;
            // if (run.isSmallCaps) {
            //     paths.push(findHtmlPathForRunProperty("smallCaps"));
            // }
            // if (run.isStrikethrough) {
            //     paths.push(findHtmlPathForRunProperty("strikethrough", "s"));
            // }
            // if (run.isUnderline) {
            //     paths.push(findHtmlPathForRunProperty("underline"));
            // }
            // if (run.verticalAlignment === documents.verticalAlignment.subscript) {
            //     paths.push(htmlPaths.element("sub", {}, {fresh: false}));
            // }
            // if (run.verticalAlignment === documents.verticalAlignment.superscript) {
            //     paths.push(  htmlPaths.element("sup", {}, {fresh: false}));
            // }

            output = element.children.map(convertElementToBlocks).join('');
            if ( output.trim().length === 0 ){
                return output;
            }
            var pre = '';
            var post = '';

            if (run.isItalic) {
                pre =  '<em>';    
                post = '</em>';            
            }
            
            if (run.isBold) {
                pre = '<strong>' + pre;    
                post = post + '</strong>' ;     


            }


            return  pre + output + post;
        }
        case "text": {
            return element.value;
        }
        case "tab": {
            return "   ";
        }
        case "document": {
            //return element.children.map(convertElementToBlocks).join('');
            var output = "";
            var regex = new RegExp("Protection of Materials and Concepts");

            const blocks = element.children.map(convertElementToBlocks);

            for (i=0; i< blocks.length; i++ ) {

                if( ! regex.test(blocks[i] ) ) {
                    testStringsToReplace(blocks[i]);

                    output = output + blocks[i]
                }
                else
                    break;
            }
            return output;

        }
        
    }
    if (element.children) {
        //console.log('inside children');

        return element.children.map(convertElementToBlocks).join('');
    } else  {
        //console.log('inside no children ', element.children, ' type ', element.type, ' valuue ', element.value);

         return element.value;   
    }
    
    //console.log( 'TYPE ', element.type );
    //return element.value;
    
}

function convertToHtml(input, options) {
    return convert(input, options);
}

function convertToMarkdown(input, options) {
    var markdownOptions = Object.create(options || {});
    markdownOptions.outputFormat = "markdown";
    return convert(input, markdownOptions);
}

function convert(input, options) {
    options = readOptions(options);
    
    return unzip.openZip(input)
        .tap(function(docxFile) {
            return docxStyleMap.readStyleMap(docxFile).then(function(styleMap) {
                options.embeddedStyleMap = styleMap;
            });
        })
        .then(function(docxFile) {
            return docxReader.read(docxFile, input)
                .then(function(documentResult) {
                    return documentResult.map(options.transformDocument);
                })
                .then(function(documentResult) {
                    return convertDocumentToHtml(documentResult, options);
                });
        });
}

function readEmbeddedStyleMap(input) {
    return unzip.openZip(input)
        .then(docxStyleMap.readStyleMap);
}

function convertDocumentToHtml(documentResult, options) {
    var styleMapResult = parseStyleMap(options.readStyleMap());
    var parsedOptions = _.extend({}, options, {
        styleMap: styleMapResult.value
    });
    var documentConverter = new DocumentConverter(parsedOptions);
    
    return documentResult.flatMapThen(function(document) {
        return styleMapResult.flatMapThen(function(styleMap) {
            return documentConverter.convertToHtml(document);
        });
    });
}

function parseStyleMap(styleMap) {
    return Result.combine((styleMap || []).map(readStyle))
        .map(function(styleMap) {
            return styleMap.filter(function(styleMapping) {
                return !!styleMapping;
            });
        });
}


function extractRawText(input) {
    return unzip.openZip(input)
        .then(docxReader.read)
        .then(function(documentResult) {
            return documentResult.map(convertElementToRawText);
        });
}

function convertElementToRawText(element) {
    if (element.type === "text") {
        return element.value;
    } else {
        var tail = element.type === "paragraph" ? "\n\n" : "";
        return (element.children || []).map(convertElementToRawText).join("") + tail;
    }
}

function embedStyleMap(input, styleMap) {
    return unzip.openZip(input)
        .tap(function(docxFile) {
            return docxStyleMap.writeStyleMap(docxFile, styleMap);
        })
        .then(function(docxFile) {
            return {
                toBuffer: docxFile.toBuffer
            };
        });
}

exports.styleMapping = function() {
    throw new Error('Use a raw string instead of mammoth.styleMapping e.g. "p[style-name=\'Title\'] => h1" instead of mammoth.styleMapping("p[style-name=\'Title\'] => h1")');
};
